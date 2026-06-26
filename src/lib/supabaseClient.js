import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we are running in demo mode (missing keys or fallback placeholders)
const isDemoMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes("your-supabase-url") || 
  supabaseAnonKey.includes("your-supabase-anon-key") ||
  !supabaseAnonKey.trim().startsWith("eyJ") ||
  supabaseAnonKey.trim().split(".").length !== 3;

if (isDemoMode && typeof window !== "undefined") {
  if (supabaseUrl && supabaseAnonKey && 
      !supabaseUrl.includes("your-supabase-url") && 
      !supabaseAnonKey.includes("your-supabase-anon-key")) {
    console.warn(
      "⚠️ Supabase Configuration Warning:\n" +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local is configured but does not look like a valid JWT (anon key).\n" +
      "It must be a long token starting with 'eyJ' containing 3 parts separated by dots.\n" +
      "Falling back to Demo Mode (local storage). Please copy the 'anon' (public) API key from Project Settings -> API in your Supabase Dashboard."
    );
  }
}

// Actual Supabase client
const realClient = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock database storage helpers
const getLocalData = (table) => {
  if (typeof window === "undefined") return [];
  const key = `printx_demo_${table}`;
  const data = localStorage.getItem(key);
  if (!data) {
    // Seed initial demo data
    if (table === 'customers') {
      const initialCustomers = [
        { id: 'c1', name: 'John Doe', phone: '0771112222', email: 'john@example.com', address: '123 Galle Rd, Colombo', outstanding_balance: 1500, portal_passcode: '1234', portal_duration_limit: '2m', created_at: new Date().toISOString() },
        { id: 'c2', name: 'Jane Smith', phone: '0773334444', email: 'jane@example.com', address: '45 Kandy Road, Kiribathgoda', outstanding_balance: 0, portal_passcode: '5678', portal_duration_limit: '2m', created_at: new Date().toISOString() }
      ];
      localStorage.setItem(key, JSON.stringify(initialCustomers));
      return initialCustomers;
    }
    if (table === 'profiles') {
      const initialProfiles = [
        { id: 'u-owner', username: 'owner', full_name: 'Owner Admin', role: 'owner', passcode: '1234', updated_at: new Date().toISOString() },
        { id: 'u-staff', username: 'staff01', full_name: 'Staff Member 01', role: 'staff', passcode: '1234', updated_at: new Date().toISOString() }
      ];
      localStorage.setItem(key, JSON.stringify(initialProfiles));
      return initialProfiles;
    }
    if (table === 'orders') {
      const initialOrders = [
        {
          id: 'o1',
          order_number: 'ORD-202606-0001',
          customer_id: 'c1',
          status: 'partially_paid',
          total_amount: 5000,
          paid_amount: 3500,
          balance_amount: 1500,
          items: [
            { name: 'Business Cards (x500)', qty: 1, price: 3500, total: 3500 },
            { name: 'Flex Banner Print (sqft)', qty: 10, price: 150, total: 1500 }
          ],
          created_by: 'u-staff',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(key, JSON.stringify(initialOrders));
      return initialOrders;
    }
    if (table === 'quotations') {
      return [];
    }
    if (table === 'day_end_reports') {
      return [];
    }
    if (table === 'weekend_reports') {
      return [];
    }
    return [];
  }
  const parsed = JSON.parse(data);
  if (table === 'profiles' && Array.isArray(parsed)) {
    let upgraded = false;
    const mapped = parsed.map(p => {
      if (!p.full_name) {
        upgraded = true;
        let defaultFullName = 'Staff Member';
        if (p.username === 'owner') defaultFullName = 'Owner Admin';
        else if (p.username === 'staff01') defaultFullName = 'Staff Member 01';
        else if (p.username) defaultFullName = p.username.charAt(0).toUpperCase() + p.username.slice(1);
        return {
          ...p,
          full_name: defaultFullName
        };
      }
      return p;
    });
    if (upgraded) {
      localStorage.setItem(key, JSON.stringify(mapped));
      return mapped;
    }
  }
  return parsed;
};

const saveLocalData = (table, data) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`printx_demo_${table}`, JSON.stringify(data));
  }
};

// Real-time pubsub mock
const listeners = {};
const triggerListeners = (table, event, data) => {
  if (listeners[table]) {
    listeners[table].forEach(cb => cb({ event, data }));
  }
};

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.data = getLocalData(table);
    this.filters = [];
    this.sortField = null;
    this.sortAscending = true;
    this.limitVal = null;
    this.countOnly = false;
    this.operationData = null;
    this.isSingleResult = false;
    this.selectCalled = false;
    this.pendingUpdate = null;
    this.pendingDelete = false;
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  select(fields, options) {
    this.selectCalled = true;
    if (options && options.count) {
      this.countOnly = true;
    }
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.sortField = field;
    this.sortAscending = ascending;
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  eq(field, val) {
    this.filters.push((item) => item[field] === val);
    return this;
  }

  gt(field, val) {
    this.filters.push((item) => Number(item[field]) > Number(val));
    return this;
  }

  gte(field, val) {
    this.filters.push((item) => new Date(item[field]) >= new Date(val));
    return this;
  }

  lte(field, val) {
    this.filters.push((item) => new Date(item[field]) <= new Date(val));
    return this;
  }

  async execute() {
    if (this.pendingDelete) {
      let deletedRecords = [];
      this.data = this.data.filter(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (![item].filter(filter).length) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deletedRecords.push(item);
          return false;
        }
        return true;
      });

      saveLocalData(this.table, this.data);
      if (deletedRecords.length > 0) {
        triggerListeners(this.table, "DELETE", deletedRecords[0]);
      }

      this.operationData = deletedRecords;
      this.isSingleResult = false;
      this.pendingDelete = false;
      return { data: deletedRecords, count: deletedRecords.length, error: null };
    }

    if (this.pendingUpdate) {
      let updatedRecords = [];
      this.data = this.data.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (![item].filter(filter).length) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updatedItem = { ...item, ...this.pendingUpdate, updated_at: new Date().toISOString() };
          updatedRecords.push(updatedItem);
          return updatedItem;
        }
        return item;
      });

      saveLocalData(this.table, this.data);
      if (updatedRecords.length > 0) {
        triggerListeners(this.table, "UPDATE", updatedRecords[0]);
      }

      this.operationData = updatedRecords;
      this.isSingleResult = false;
      this.pendingUpdate = null;
    }

    if (this.operationData) {
      let result = [...this.operationData];
      
      // Resolve relationships (e.g. order.customers -> fetch customer object)
      if (this.table === "orders" || this.table === "quotations") {
        const customers = getLocalData("customers");
        result = result.map(item => {
          const cust = customers.find(c => c.id === item.customer_id);
          return {
            ...item,
            customers: cust || null
          };
        });
      }

      if (this.countOnly) {
        return { data: null, count: result.length, error: null };
      }

      // If select was not explicitly called, return backward-compatible format
      if (!this.selectCalled) {
        return { data: this.isSingleResult ? result[0] : result, error: null };
      }

      return { data: result, count: result.length, error: null };
    }

    let result = [...this.data];
    
    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter);
    }

    // Apply sorting
    if (this.sortField) {
      result.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];
        if (typeof valA === "string") {
          return this.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.sortAscending ? valA - valB : valB - valA;
      });
    }

    // Apply limit
    if (this.limitVal) {
      result = result.slice(0, this.limitVal);
    }

    // Resolve relationships (e.g. order.customers -> fetch customer object)
    if (this.table === "orders" || this.table === "quotations") {
      const customers = getLocalData("customers");
      result = result.map(item => {
        const cust = customers.find(c => c.id === item.customer_id);
        return {
          ...item,
          customers: cust || null
        };
      });
    }

    if (this.countOnly) {
      return { data: null, count: result.length, error: null };
    }

    return { data: result, count: result.length, error: null };
  }

  async single() {
    const { data } = await this.execute();
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: null, error: { message: "No rows found" } };
    }
    return { data: Array.isArray(data) ? data[0] : data, error: null };
  }

  // Chain promise resolution
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }

  insert(newData) {
    const records = Array.isArray(newData) ? newData : [newData];
    const updated = records.map(r => ({
      id: r.id || Math.random().toString(36).substring(2, 15),
      created_at: r.created_at || new Date().toISOString(),
      ...r
    }));
    
    this.data = [...this.data, ...updated];
    saveLocalData(this.table, this.data);
    triggerListeners(this.table, "INSERT", updated[0]);

    this.operationData = updated;
    this.isSingleResult = !Array.isArray(newData);
    return this;
  }

  update(updateData) {
    this.pendingUpdate = updateData;
    return this;
  }

  upsert(upsertData) {
    const records = Array.isArray(upsertData) ? upsertData : [upsertData];
    const updatedRecords = [];
    
    records.forEach(r => {
      const idx = this.data.findIndex(item => item.id === r.id);
      let updatedItem;
      if (idx !== -1) {
        updatedItem = { ...this.data[idx], ...r, updated_at: new Date().toISOString() };
        this.data[idx] = updatedItem;
      } else {
        updatedItem = {
          id: r.id || Math.random().toString(36).substring(2, 15),
          created_at: r.created_at || new Date().toISOString(),
          ...r
        };
        this.data.push(updatedItem);
      }
      updatedRecords.push(updatedItem);
    });

    saveLocalData(this.table, this.data);
    triggerListeners(this.table, "UPSERT", updatedRecords[0]);

    this.operationData = updatedRecords;
    this.isSingleResult = !Array.isArray(upsertData);
    return this;
  }
}

// Active session state for mock auth
let mockSession = null;
if (typeof window !== "undefined") {
  const savedSession = localStorage.getItem("printx_demo_session");
  if (savedSession) {
    mockSession = JSON.parse(savedSession);
  }
}

// Auth subscription callbacks
const authCallbacks = [];

// Mock client
const mockClient = {
  auth: {
    getSession: async () => {
      return { data: { session: mockSession }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Check default demo credentials
      const isOwner = cleanEmail.startsWith("owner") && password === "owner123";
      const isStaff = cleanEmail.startsWith("staff") && password === "staff123";

      if (isOwner || isStaff) {
        const userId = isOwner ? "u-owner" : "u-staff";
        const username = isOwner ? "owner" : "staff01";
        const role = isOwner ? "owner" : "staff";

        mockSession = {
          user: { id: userId, email: email },
          access_token: "mock-token"
        };
        localStorage.setItem("printx_demo_session", JSON.stringify(mockSession));
        
        const profiles = getLocalData("profiles");
        if (!profiles.some(p => p.id === userId)) {
          profiles.push({ id: userId, username, role, updated_at: new Date().toISOString() });
          saveLocalData("profiles", profiles);
        }

        authCallbacks.forEach(cb => cb("SIGNED_IN", mockSession));
        return { data: { user: mockSession.user, session: mockSession }, error: null };
      }

      // 2. Check mock registered user credentials in localStorage
      if (typeof window !== "undefined") {
        const credsKey = "printx_demo_users_creds";
        const existingCreds = JSON.parse(localStorage.getItem(credsKey) || "[]");
        
        const matchedUser = existingCreds.find(u => 
          u.email === cleanEmail || 
          u.username === cleanEmail ||
          u.email.split("@")[0] === cleanEmail
        );

        if (matchedUser && matchedUser.password === password) {
          const profiles = getLocalData("profiles");
          const matchedProfile = profiles.find(p => p.id === matchedUser.id) || {
            id: matchedUser.id,
            username: matchedUser.username,
            role: "staff"
          };

          mockSession = {
            user: { id: matchedUser.id, email: matchedUser.email },
            access_token: "mock-token"
          };
          localStorage.setItem("printx_demo_session", JSON.stringify(mockSession));
          
          authCallbacks.forEach(cb => cb("SIGNED_IN", mockSession));
          return { data: { user: mockSession.user, session: mockSession }, error: null };
        }
      }

      return { data: null, error: { message: "Invalid credentials. If in live database mode, check your connection. In demo mode, use owner/owner123, staff/staff123, or a registered staff login." } };
    },
    signUp: async ({ email, password, options }) => {
      const username = options?.data?.username || email.split("@")[0];
      const newUserId = "u-" + Math.random().toString(36).substring(2, 9);
      
      const profiles = getLocalData("profiles");
      profiles.push({
        id: newUserId,
        username,
        role: "staff",
        updated_at: new Date().toISOString()
      });
      saveLocalData("profiles", profiles);

      // Save mock login credentials
      if (typeof window !== "undefined") {
        const credsKey = "printx_demo_users_creds";
        const existingCreds = JSON.parse(localStorage.getItem(credsKey) || "[]");
        existingCreds.push({ 
          id: newUserId, 
          email: email.toLowerCase(), 
          username: username.toLowerCase(), 
          password 
        });
        localStorage.setItem(credsKey, JSON.stringify(existingCreds));
      }

      return { data: { user: { id: newUserId, email } }, error: null };
    },
    signOut: async () => {
      mockSession = null;
      localStorage.removeItem("printx_demo_session");
      authCallbacks.forEach(cb => cb("SIGNED_OUT", null));
      return { error: null };
    },
    updateUser: async ({ password }) => {
      if (mockSession?.user && typeof window !== "undefined") {
        const credsKey = "printx_demo_users_creds";
        const existingCreds = JSON.parse(localStorage.getItem(credsKey) || "[]");
        const idx = existingCreds.findIndex(u => u.id === mockSession.user.id);
        if (idx !== -1) {
          existingCreds[idx].password = password;
          localStorage.setItem(credsKey, JSON.stringify(existingCreds));
        }
      }
      return { data: { user: mockSession?.user }, error: null };
    },
    onAuthStateChange: (callback) => {
      authCallbacks.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const idx = authCallbacks.indexOf(callback);
              if (idx !== -1) authCallbacks.splice(idx, 1);
            }
          }
        }
      };
    }
  },
  from: (table) => {
    return new MockQueryBuilder(table);
  },
  channel: (channelName) => {
    return {
      on: (event, filter, callback) => {
        const table = filter.table;
        if (!listeners[table]) listeners[table] = [];
        listeners[table].push(callback);
        return {
          subscribe: () => ({})
        };
      }
    };
  },
  removeChannel: () => {}
};

// Export active client (demo or live)
export const supabase = isDemoMode ? mockClient : realClient;
