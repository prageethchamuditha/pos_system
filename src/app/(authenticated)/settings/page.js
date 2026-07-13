"use client";

import { useState, useEffect } from "react";
import { AuthGuard, useAuth } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabaseClient";
import { 
  Settings as SettingsIcon, 
  Users, 
  Store, 
  UserPlus, 
  Save, 
  Shield, 
  Check, 
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Package,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Lock
} from "lucide-react";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState("shop"); // 'shop' | 'users' | 'catalog'

  // Shop Settings State
  const [shopSettings, setShopSettings] = useState({
    name: "PRINT X",
    addressLine1: "No 189B",
    addressLine2: "RATNAPURA RD",
    addressLine3: "KALAWANA",
    phone: "070 143 49 49",
    email: "printxkalawana@gmail.com",
    website: "www.printx.lk",
    logoUrl: "/logo.png",
    terms: `Thank you for choosing Print X. By purchasing any product from us, you agree to the following terms and conditions:

01. Warranty and Returns:
    All products come with a 3-Day Checking Warranty.
    Returns or exchanges are accepted only with the original receipt and within the warranty period.
    Print X is not responsible for damages due to improper use, accidental breakage, or installation errors. Please follow the usage instructions provided with each product.

02. Pricing and Payment:
    Prices are subject to change without prior notice.
    Discounts and promotions are valid only during the specified period and cannot be combined with other offers.
    All payments are final. Accepted payment methods include Cash and Bank Transfers. Please verify your total amount before completing payment.

04. Repairs and Service:
    Repairs are offered based on product availability and are charged separately unless covered by warranty.
    Service times may vary depending on the nature of the repair.

05. Stock and Availability:
    Stock is subject to availability. We reserve the right to limit quantities and substitute comparable items if the original product is unavailable.

06. Customer Information:
    Customer information is collected solely for transaction and warranty purposes.
    Print X respects your privacy and will not share your personal details with third parties.

07. Refunds:
    Refunds are provided only when a product cannot be repaired or replaced under warranty. Refund processing may take several days.

08. Contact Us:
    For any issues, inquiries, or assistance, please contact us at +94 70 143 49 49. We are happy to help.

:) Thank you for choosing Print X!`,
    footerInfo: "",
    orderPrefix: "ORD",
    orderStartNumber: 1
  });

  // User Management State
  const [profiles, setProfiles] = useState([]);
  
  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("staff");

  // POS Catalog Products State
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  // UI state
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Database Reset Selection States
  const [resetOptOrders, setResetOptOrders] = useState(true);
  const [resetOptCustomers, setResetOptCustomers] = useState(true);
  const [resetOptSheets, setResetOptSheets] = useState(false);

  // Own PIN Change State
  const [newPIN, setNewPIN] = useState("");
  const [confirmPIN, setConfirmPIN] = useState("");
  const [submittingPIN, setSubmittingPIN] = useState(false);

  // Account Password Change State
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const defaultProducts = [
    { id: "p1", name: "Business Cards (x500)", price: 3500, category: "Cards" },
    { id: "p2", name: "Flex Banner (per sqft)", price: 150, category: "Banners" },
    { id: "p3", name: "Sticker Sheet (A3)", price: 250, category: "Stickers" },
    { id: "p4", name: "Brochure (A4 Tri-fold)", price: 80, category: "Documents" },
    { id: "p5", name: "A4 Document Print (B&W)", price: 15, category: "Documents" },
    { id: "p6", name: "A4 Color Document Print", price: 40, category: "Documents" },
    { id: "p7", name: "ID Card Print & Lanyard", price: 350, category: "Cards" },
    { id: "p8", name: "Letterhead Printing (x100)", price: 1800, category: "Documents" },
  ];

  useEffect(() => {
    // Redirect staff users to catalog or security tab automatically
    if (profile && profile.role === "staff" && activeTab !== "catalog" && activeTab !== "security") {
      setActiveTab("catalog");
    }

    // Load shop settings from database
    const loadShopSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("shop_settings")
          .select("settings")
          .eq("id", "default")
          .single();
        
        if (!error && data && data.settings) {
          setShopSettings(prev => ({ ...prev, ...data.settings }));
          localStorage.setItem("printx_shop_settings", JSON.stringify(data.settings));
        } else {
          const stored = localStorage.getItem("printx_shop_settings");
          if (stored) {
            setShopSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadShopSettings();

    const initialize = async () => {
      await loadProducts();
    };

    initialize();

    if (activeTab === "users" && (!profile || profile.role !== "staff")) {
      fetchProfiles();
    }
  }, [activeTab, profile]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("catalog_items")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const loadedProducts = data.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          category: item.category || "Uncategorized"
        }));
        setProducts(loadedProducts);
        localStorage.setItem("printx_pos_products", JSON.stringify(loadedProducts));
        return;
      }
    } catch (err) {
      console.error("Error loading products from DB:", err);
    }

    try {
      const savedProducts = localStorage.getItem("printx_pos_products");
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(defaultProducts);
        localStorage.setItem("printx_pos_products", JSON.stringify(defaultProducts));
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setProducts(defaultProducts);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // 1.5MB limit
        setErrorMsg("Logo file size exceeds 1.5MB. Please choose a compressed/smaller image.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopSettings(prev => ({
          ...prev,
          logoUrl: reader.result
        }));
        setSuccessMsg("Logo uploaded successfully! (Make sure to click 'Save Configuration' below to save changes)");
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchProfiles = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("username", { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error loading profiles:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveShopSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error: dbError } = await supabase
        .from("shop_settings")
        .upsert({
          id: "default",
          settings: shopSettings,
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      localStorage.setItem("printx_shop_settings", JSON.stringify(shopSettings));
      setSuccessMsg("Shop branding configurations updated globally!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update branding settings in database: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRoleChange = async (profileId, newRoleVal) => {
    setErrorMsg("");
    setSuccessMsg("");

    if (profile.role !== "owner") {
      setErrorMsg("Permissions restricted: Only the Owner can modify authorization roles.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRoleVal })
        .eq("id", profileId);

      if (error) throw error;
      setSuccessMsg("User clearance level updated successfully!");
      fetchProfiles();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update role.");
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newEmail.includes("@")) {
      setErrorMsg("Please enter a valid email format.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setCreatingUser(true);

    try {
      // 1. Trigger Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            username: newUsername || newEmail.split("@")[0],
            full_name: newFullName || newUsername || newEmail.split("@")[0],
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Pre-create profile with the selected role immediately to avoid default role assignments
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            username: newUsername || newEmail.split("@")[0],
            full_name: newFullName || newUsername || newEmail.split("@")[0],
            role: newRole,
            updated_at: new Date().toISOString()
          });

        if (profileError) console.error("Error setting custom profile role:", profileError);
      }

      setSuccessMsg(`Credential for "${newUsername || newEmail}" initialized!`);
      setNewEmail("");
      setNewPassword("");
      setNewUsername("");
      setNewFullName("");
      setNewRole("staff");
      fetchProfiles();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register staff credentials.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangeOwnPIN = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (newPIN.length < 4 || newPIN.length > 6 || /\D/.test(newPIN)) {
      setErrorMsg("Passcode PIN must be a 4-to-6 digit number.");
      return;
    }
    
    if (newPIN === "1234") {
      setErrorMsg("For security, you cannot use the default PIN '1234'.");
      return;
    }
    
    if (newPIN !== confirmPIN) {
      setErrorMsg("PIN codes do not match.");
      return;
    }
    
    setSubmittingPIN(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ passcode: newPIN })
        .eq("id", profile.id);
      if (error) throw error;
      
      // Refresh active session profile state reactively
      if (refreshProfile) {
        await refreshProfile();
      }
      
      setSuccessMsg("Passcode PIN changed successfully!");
      setNewPIN("");
      setConfirmPIN("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update PIN.");
    } finally {
      setSubmittingPIN(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPasswordVal.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (newPasswordVal !== confirmPasswordVal) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmittingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPasswordVal
      });

      if (error) throw error;

      setSuccessMsg("Account password updated successfully!");
      setNewPasswordVal("");
      setConfirmPasswordVal("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleResetCustomersAndBills = async () => {
    if (!resetOptOrders && !resetOptCustomers && !resetOptSheets) {
      alert("Please select at least one option to reset.");
      return;
    }

    const confirm1 = window.confirm(
      "⚠️ DANGER ZONE: You are about to permanently reset the selected components.\n" +
      "This action is permanent and cannot be undone.\n\n" +
      "Are you sure you want to proceed?"
    );
    if (!confirm1) return;

    const confirm2 = window.prompt("Final Warning: This action cannot be undone. Type 'RESET' below to confirm deletion:");
    if (confirm2 !== "RESET") {
      alert("Reset cancelled. Confirmation keyword did not match.");
      return;
    }

    setSavingSettings(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let resetSummaries = [];

      // 1. Reset Orders & Quotations (Supabase)
      if (resetOptOrders) {
        await supabase.from("orders").delete().gte("created_at", "2000-01-01");
        await supabase.from("quotations").delete().gte("created_at", "2000-01-01");
        resetSummaries.push("Invoices & Quotations");
      }

      // 2. Reset Customers & Balances (Supabase)
      if (resetOptCustomers) {
        await supabase.from("customers").delete().gte("created_at", "2000-01-01");
        
        // Re-seed default demo customer profiles
        await supabase.from("customers").insert([
          { 
            name: "John Doe", 
            phone: "0771112222", 
            email: "john@example.com", 
            address: "123 Galle Rd, Colombo", 
            outstanding_balance: 0, 
            portal_passcode: "1234", 
            portal_duration_limit: "2m", 
            created_at: new Date().toISOString() 
          },
          { 
            name: "Jane Smith", 
            phone: "0773334444", 
            email: "jane@example.com", 
            address: "45 Kandy Road, Kiribathgoda", 
            outstanding_balance: 0, 
            portal_passcode: "5678", 
            portal_duration_limit: "2m", 
            created_at: new Date().toISOString() 
          }
        ]);
        resetSummaries.push("Customer Directory (John & Jane re-seeded)");
      }

      // 3. Reset Google Sheets Webhook Database
      if (resetOptSheets) {
        const response = await fetch("/api/sync-sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_number: "RESET_DATABASE",
            action: "RESET_DATABASE",
            seed_defaults: resetOptCustomers // Seed defaults on sheets if we are also resetting customers
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to communicate with Google Sheets reset endpoint.");
        }
        const resData = await response.json();
        if (!resData.success) {
          throw new Error(resData.message || "Google Sheets Web App returned an error during reset.");
        }
        resetSummaries.push("Google Sheets Ledger & Tabs");
      }

      setSuccessMsg(`Database reset completed successfully! Wiped: ${resetSummaries.join(", ")}.`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset database tables.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRestoreFromGoogleSheets = async () => {
    const confirmRestore = window.confirm(
      "⚠️ EMERGENCY RESTORE: This will import backup data from your connected Google Sheet and merge/overwrite current database records.\n\n" +
      "This action will:\n" +
      "1. Upsert customer records (with their backup outstanding balances).\n" +
      "2. Restore invoices with a default item entry 'Restored Transaction' to preserve totals.\n" +
      "3. Restore audit reports (Day End and Weekend).\n\n" +
      "Are you sure you want to proceed?"
    );
    if (!confirmRestore) return;

    setRestoring(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Fetch full backup data from API
      const response = await fetch("/api/sync-sheets?action=export_backup");
      if (!response.ok) {
        throw new Error(`Failed to fetch backup: HTTP ${response.status}`);
      }

      const backup = await response.json();
      if (!backup.success) {
        throw new Error(backup.message || "Failed to download backup data.");
      }

      let restoredSummary = [];

      // A. Restore Customers
      if (backup.customers && backup.customers.length > 0) {
        for (const c of backup.customers) {
          const passcode = Math.floor(1000 + Math.random() * 9000).toString();
          const { error: cErr } = await supabase
            .from("customers")
            .upsert({
              name: c.name,
              phone: c.phone,
              outstanding_balance: c.outstanding_balance,
              portal_passcode: passcode,
              portal_duration_limit: "2m",
              created_at: new Date().toISOString()
            }, { onConflict: "phone" });
          if (cErr) throw cErr;
        }
        restoredSummary.push(`${backup.customers.length} Customers`);
      }

      // Query latest customers to map phone number to uuid
      const { data: dbCusts, error: mapErr } = await supabase
        .from("customers")
        .select("id, phone");
      if (mapErr) throw mapErr;

      const phoneToIdMap = {};
      if (dbCusts) {
        dbCusts.forEach(c => {
          phoneToIdMap[c.phone] = c.id;
        });
      }

      // B. Restore Orders
      if (backup.orders && backup.orders.length > 0) {
        for (const o of backup.orders) {
          const customerId = phoneToIdMap[o.customer_phone] || null;
          const itemsArray = [{ name: "Restored Transaction", qty: 1, price: o.total_amount, total: o.total_amount }];
          
          const { error: oErr } = await supabase
            .from("orders")
            .upsert({
              id: o.id || undefined,
              order_number: o.order_number,
              customer_id: customerId,
              items: itemsArray,
              total_amount: o.total_amount,
              paid_amount: o.paid_amount,
              balance_amount: o.balance_amount,
              status: o.status,
              created_by: o.created_by,
              created_at: o.created_at
            }, { onConflict: "order_number" });
          if (oErr) throw oErr;
        }
        restoredSummary.push(`${backup.orders.length} Invoices`);
      }

      // C. Restore Day End Reports
      if (backup.day_end_reports && backup.day_end_reports.length > 0) {
        for (const r of backup.day_end_reports) {
          const { error: deErr } = await supabase
            .from("day_end_reports")
            .upsert({
              date: r.date,
              copy_count: r.copy_count,
              total_sales: r.total_sales,
              total_cash_payments: r.total_cash_payments,
              manual_billing_amount: r.manual_billing_amount,
              total_outstanding: r.total_outstanding,
              expense_amount: r.expense_amount,
              expense_reason: r.expense_reason,
              expense_staff: r.expense_staff,
              net_drawer_cash: r.net_drawer_cash,
              created_by: r.created_by
            }, { onConflict: "date" });
          if (deErr) throw deErr;
        }
        restoredSummary.push(`${backup.day_end_reports.length} Day End Audits`);
      }

      // D. Restore Weekend Reports
      if (backup.weekend_reports && backup.weekend_reports.length > 0) {
        for (const w of backup.weekend_reports) {
          const { error: weErr } = await supabase
            .from("weekend_reports")
            .upsert({
              date: w.date,
              entered_monthly_total: w.entered_monthly_total,
              calculated_weekly_revenue: w.calculated_weekly_revenue,
              created_by: w.created_by
            }, { onConflict: "date" });
          if (weErr) throw weErr;
        }
        restoredSummary.push(`${backup.weekend_reports.length} Weekend Audits`);
      }

      setSuccessMsg(`Disaster recovery completed successfully! Restored: ${restoredSummary.join(", ")}.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to restore backup from Google Sheets.");
    } finally {
      setRestoring(false);
    }
  };

  const handleResetPIN = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset passcode PIN for "${username}" back to default "1234"?`)) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ passcode: "1234" })
        .eq("id", userId);
      if (error) throw error;
      setSuccessMsg(`Passcode PIN for "${username}" reset to "1234" successfully.`);
      fetchProfiles();
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset PIN.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete the account "${username}"?\nThis action cannot be undone.`)) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) throw error;
      setSuccessMsg(`Account "${username}" deleted successfully.`);
      fetchProfiles();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete account.");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newProductName.trim()) {
      setErrorMsg("Product name cannot be empty.");
      return;
    }
    if (isNaN(newProductPrice) || Number(newProductPrice) < 0) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    const productData = {
      name: newProductName.trim(),
      price: Number(newProductPrice),
      category: newProductCategory.trim() || "Uncategorized"
    };

    try {
      let updatedProducts;
      if (editingProductId) {
        const { error } = await supabase
          .from("catalog_items")
          .update(productData)
          .eq("id", editingProductId);

        if (error) {
          throw error;
        }

        updatedProducts = products.map(p =>
          p.id === editingProductId
            ? { ...p, ...productData }
            : p
        );
        setSuccessMsg("Product updated successfully!");
      } else {
        const newProduct = {
          id: "p_" + Math.random().toString(36).substring(2, 9),
          ...productData
        };

        const { error } = await supabase
          .from("catalog_items")
          .insert(newProduct);

        if (error) {
          throw error;
        }

        updatedProducts = [...products, newProduct];
        setSuccessMsg("Product added to POS catalog!");
      }

      setProducts(updatedProducts);
      localStorage.setItem("printx_pos_products", JSON.stringify(updatedProducts));

      setNewProductName("");
      setNewProductPrice("");
      setNewProductCategory("");
      setEditingProductId(null);
    } catch (err) {
      console.error("Failed to sync product to cloud database:", err);
      try {
        let updatedProducts;
        if (editingProductId) {
          updatedProducts = products.map(p =>
            p.id === editingProductId
              ? { ...p, ...productData }
              : p
          );
          setSuccessMsg("Product updated successfully! (saved locally)");
        } else {
          const newProduct = {
            id: "p_" + Math.random().toString(36).substring(2, 9),
            ...productData
          };
          updatedProducts = [...products, newProduct];
          setSuccessMsg("Product added to POS catalog! (saved locally)");
        }
        setProducts(updatedProducts);
        localStorage.setItem("printx_pos_products", JSON.stringify(updatedProducts));

        setNewProductName("");
        setNewProductPrice("");
        setNewProductCategory("");
        setEditingProductId(null);
      } catch (storageErr) {
        console.error("Local save failed:", storageErr);
        setErrorMsg("Failed to save product.");
      }
    }
  };

  const handleEditProduct = (product) => {
    setNewProductName(product.name);
    setNewProductPrice(product.price);
    setNewProductCategory(product.category);
    setEditingProductId(product.id);
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product from the POS catalog?")) {
      try {
        const { error } = await supabase
          .from("catalog_items")
          .delete()
          .eq("id", productId);

        if (error) {
          throw error;
        }

        const updated = products.filter(p => p.id !== productId);
        setProducts(updated);
        localStorage.setItem("printx_pos_products", JSON.stringify(updated));
        setSuccessMsg("Product deleted from catalog.");

        if (editingProductId === productId) {
          setNewProductName("");
          setNewProductPrice("");
          setNewProductCategory("");
          setEditingProductId(null);
        }
      } catch (err) {
        console.error("Failed to sync delete to cloud database:", err);
        try {
          const updated = products.filter(p => p.id !== productId);
          setProducts(updated);
          localStorage.setItem("printx_pos_products", JSON.stringify(updated));
          setSuccessMsg("Product deleted from catalog. (saved locally)");

          if (editingProductId === productId) {
            setNewProductName("");
            setNewProductPrice("");
            setNewProductCategory("");
            setEditingProductId(null);
          }
        } catch (storageErr) {
          console.error("Local delete failed:", storageErr);
          setErrorMsg("Failed to delete product.");
        }
      }
    }
  };

  const handleResetCatalog = async () => {
    if (confirm("Are you sure you want to restore the default catalog items? This will overwrite your current items.")) {
      try {
        const { error } = await supabase
          .from("catalog_items")
          .delete();

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Failed to reset catalog in DB:", err);
      }

      try {
        localStorage.removeItem("printx_pos_products");
        setProducts(defaultProducts);
        localStorage.setItem("printx_pos_products", JSON.stringify(defaultProducts));
        setSuccessMsg("POS catalog restored to default items.");
      } catch (err) {
        console.error("Failed to restore default items locally:", err);
        setErrorMsg("Failed to restore default items.");
      }

      setNewProductName("");
      setNewProductPrice("");
      setNewProductCategory("");
      setEditingProductId(null);
    }
  };

  return (
    <AuthGuard requiredRoles={["owner", "manager", "staff"]}>
      <div style={styles.container}>
        {/* Header */}
        <div>
          <h1 style={styles.title}>System Configurations</h1>
          <p style={styles.subtitle}>Update invoice headers, manage staff user database and clearance keys</p>
        </div>

        {successMsg && (
          <div style={styles.successBanner} className="animate-fade-in">
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorBanner} className="animate-fade-in">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div style={styles.tabBar} className="no-print">
          {profile?.role !== "staff" && (
            <>
              <button 
                onClick={() => { setActiveTab("shop"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "shop" ? styles.tabBtnActive : {})
                }}
              >
                <Store size={16} />
                <span>Branding details</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab("users"); setErrorMsg(""); setSuccessMsg(""); }}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "users" ? styles.tabBtnActive : {})
                }}
              >
                <Users size={16} />
                <span>Staff management</span>
              </button>
            </>
          )}

          <button 
            onClick={() => { setActiveTab("catalog"); setErrorMsg(""); setSuccessMsg(""); }}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "catalog" ? styles.tabBtnActive : {})
            }}
          >
            <Package size={16} />
            <span>POS Catalog</span>
          </button>

          <button 
            onClick={() => { setActiveTab("security"); setErrorMsg(""); setSuccessMsg(""); }}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "security" ? styles.tabBtnActive : {})
            }}
          >
            <Lock size={16} />
            <span>My Security</span>
          </button>
        </div>

        {/* Tab content */}
        <div style={styles.tabContent}>
          {activeTab === "shop" && profile?.role !== "staff" ? (
            /* Tab 1: Shop Branding */
            <div className="glass-panel animate-fade-in" style={styles.settingsCard}>
              <h2 style={styles.sectionTitle}>Shop Details (Printed Invoices)</h2>
              <form onSubmit={handleSaveShopSettings} style={styles.form}>
                
                <div className="form-row" style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Shop Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.name}
                      onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                      required 
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Shop Logo</label>
                    <div style={styles.logoUploadContainer}>
                      {shopSettings.logoUrl && (
                        <div style={styles.logoPreviewWrapper}>
                          <img 
                            src={shopSettings.logoUrl} 
                            alt="Logo Preview" 
                            style={styles.logoPreview}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShopSettings({ ...shopSettings, logoUrl: "" })}
                            style={styles.removeLogoBtn}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="input-field"
                        style={styles.fileInput}
                      />
                      <span style={styles.helpText}>Directly upload shop logo. Max 1.5MB.</span>
                    </div>
                  </div>
                </div>

                <h3 style={styles.subSubTitle}>Address Lines</h3>
                <div className="form-row" style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Address Line 1</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.addressLine1}
                      onChange={(e) => setShopSettings({ ...shopSettings, addressLine1: e.target.value })}
                      required 
                    />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Address Line 2</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.addressLine2}
                      onChange={(e) => setShopSettings({ ...shopSettings, addressLine2: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-row" style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Address Line 3 (City)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.addressLine3}
                      onChange={(e) => setShopSettings({ ...shopSettings, addressLine3: e.target.value })}
                      required 
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Contact Phone</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.phone}
                      onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-row" style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Support Email</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      value={shopSettings.email}
                      onChange={(e) => setShopSettings({ ...shopSettings, email: e.target.value })}
                      required 
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Official Website</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={shopSettings.website}
                      onChange={(e) => setShopSettings({ ...shopSettings, website: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                {/* Bill Number Series — Owner Only */}
                {profile?.role === "owner" && (
                  <>
                    <h3 style={styles.subSubTitle}>Bill Number Series</h3>
                    <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "16px 18px", marginBottom: "18px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
                        Configure the prefix and starting number for invoices. Bills will be formatted as <strong style={{ color: "var(--primary)" }}>{shopSettings.orderPrefix || "ORD"}-{new Date().getFullYear()}-XXXX</strong>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Bill Prefix</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. ORD, INV, PX"
                            maxLength={8}
                            value={shopSettings.orderPrefix}
                            onChange={(e) => setShopSettings({ ...shopSettings, orderPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                          />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>Letters &amp; numbers only</span>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Start Number (this year)</label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="e.g. 1, 150"
                            min={1}
                            value={shopSettings.orderStartNumber}
                            onChange={(e) => setShopSettings({ ...shopSettings, orderStartNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                          />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>Next bill will count from this number</span>
                        </div>
                      </div>
                      <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(0,0,0,0.15)", borderRadius: "7px", fontFamily: "monospace", fontSize: "13px", color: "var(--accent-green)", letterSpacing: "0.05em" }}>
                        Preview: <strong>{shopSettings.orderPrefix || "ORD"}-{new Date().getFullYear()}-{String(shopSettings.orderStartNumber || 1).padStart(4, "0")}</strong>
                      </div>
                    </div>
                  </>
                )}

                <h3 style={styles.subSubTitle}>Invoice Footer &amp; Terms</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Invoice Footer Text</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={shopSettings.footerInfo}
                    onChange={(e) => setShopSettings({ ...shopSettings, footerInfo: e.target.value })}
                    required 
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Terms and Conditions</label>
                  <textarea 
                    className="input-field" 
                    style={styles.textareaField}
                    rows="8"
                    value={shopSettings.terms}
                    onChange={(e) => setShopSettings({ ...shopSettings, terms: e.target.value })}
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={savingSettings}>
                  <Save size={16} />
                  <span>{savingSettings ? "Saving..." : "Save Configuration"}</span>
                </button>
              </form>

              {/* Database Maintenance Danger Zone */}
              <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "1px dashed var(--border)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", fontSize: "14px", letterSpacing: "0.05em", color: "hsl(350, 80%, 55%)" }}>
                  <AlertTriangle size={18} />
                  <span>Danger Zone (Database Reset)</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px", marginBottom: "16px" }}>
                  Configure what components to wipe. Select the items you need to reset below:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px", maxWidth: "500px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--text-main)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={resetOptOrders}
                      onChange={(e) => setResetOptOrders(e.target.checked)}
                      style={{ accentColor: "hsl(350, 80%, 55%)", width: "16px", height: "16px", cursor: "pointer", marginTop: "2px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "600" }}>Wipe Invoices & Quotations</div>
                      <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>Deletes all orders, sales history, transactions, and estimate quotation records from Supabase.</div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--text-main)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={resetOptCustomers}
                      onChange={(e) => setResetOptCustomers(e.target.checked)}
                      style={{ accentColor: "hsl(350, 80%, 55%)", width: "16px", height: "16px", cursor: "pointer", marginTop: "2px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "600" }}>Reset Customer Directory</div>
                      <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>Deletes all customer/teacher database accounts and re-seeds default profiles (John Doe & Jane Smith).</div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--text-main)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={resetOptSheets}
                      onChange={(e) => setResetOptSheets(e.target.checked)}
                      style={{ accentColor: "hsl(350, 80%, 55%)", width: "16px", height: "16px", cursor: "pointer", marginTop: "2px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "600" }}>Reset Google Sheets Webhook DB</div>
                      <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>Clears master directories, wipes ledger transactions, and deletes all individual customer/teacher tabs from Google Sheets.</div>
                    </div>
                  </label>
                </div>

                <button 
                  type="button" 
                  onClick={handleResetCustomersAndBills}
                  className="btn"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "hsl(350, 80%, 55%)",
                    padding: "10px 16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                  disabled={savingSettings}
                >
                  <Trash2 size={16} />
                  <span>Execute Selected Reset</span>
                </button>
              </div>

              {/* Disaster Recovery & Sheet Backup Import */}
              <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "1px dashed var(--border)" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", fontSize: "14px", letterSpacing: "0.05em", color: "var(--primary)" }}>
                  <RefreshCw size={18} />
                  <span>Disaster Recovery & Sheet Backup Import</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px", marginBottom: "16px" }}>
                  If you need to restore or sync your POS state after an emergency, you can pull your full backup data from the connected Google Sheet spreadsheet. This will merge back-up customers, orders, day audits, and weekend reports into Supabase.
                </p>

                <button 
                  type="button" 
                  onClick={handleRestoreFromGoogleSheets}
                  className="btn btn-secondary"
                  style={{
                    padding: "10px 16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                  disabled={restoring || savingSettings}
                >
                  <RefreshCw size={16} className={restoring ? "animate-spin" : ""} />
                  <span>{restoring ? "Importing & Restoring Database..." : "Import & Restore Backup from Google Sheet"}</span>
                </button>
              </div>
            </div>
          ) : activeTab === "users" && profile?.role !== "staff" ? (
            /* Tab 2: User Access */
            <div className="settings-users-layout" style={styles.usersLayout}>
              {/* User Sign Up Form (Only visible to owner) */}
              <div className="glass-panel animate-fade-in" style={styles.newUserCard}>
                <h2 style={styles.sectionTitle}>Add Staff Access</h2>
                {profile.role !== "owner" ? (
                  <div style={styles.ownerNotice}>
                    <ShieldAlert size={28} />
                    <p>Access Restricted: Only the System Owner can register new staff logins.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterStaff} style={styles.form}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Staff Full Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. John Doe"
                        className="input-field" 
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Username</label>
                      <input 
                        type="text" 
                        placeholder="e.g. staff01"
                        className="input-field" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Staff Email</label>
                      <input 
                        type="email" 
                        placeholder="e.g. staff01@printx.lk"
                        className="input-field" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Password</label>
                      <input 
                        type="password" 
                        placeholder="Min 6 characters"
                        className="input-field" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={creatingUser}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Default Role Clearance</label>
                      <select 
                        className="input-field" 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        disabled={creatingUser}
                      >
                        <option value="staff">Staff (Billing queue)</option>
                        <option value="manager">Manager (Edit orders + Reports)</option>
                        <option value="owner">Owner (Full clearance settings)</option>
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={styles.registerBtn} disabled={creatingUser}>
                      <UserPlus size={16} />
                      <span>{creatingUser ? "Registering..." : "Add User Account"}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* User clearance list */}
              <div className="glass-panel animate-fade-in" style={styles.userListCard}>
                <h2 style={styles.sectionTitle}>User Registry & Clearance</h2>
                {loadingUsers ? (
                  <div style={styles.loaderContainer}>
                    <div style={styles.spinner}></div>
                  </div>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Staff Member</th>
                          <th style={styles.th}>Authorization Clearances</th>
                          <th style={styles.th}>Verification Type</th>
                          {profile.role === "owner" && <th style={{ ...styles.th, textAlign: "right" }}>System Override</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((prof) => (
                          <tr key={prof.id} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={styles.userHead}>{prof.full_name || "No Name"}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-subtle)" }}>@{prof.username}</div>
                            </td>
                            <td style={styles.td}>
                              {profile.role === "owner" && prof.id !== profile.id ? (
                                <select 
                                  value={prof.role} 
                                  onChange={(e) => handleRoleChange(prof.id, e.target.value)}
                                  className="input-field"
                                  style={styles.roleSelect}
                                >
                                  <option value="staff">Staff</option>
                                  <option value="manager">Manager</option>
                                  <option value="owner">Owner</option>
                                </select>
                              ) : (
                                <span style={styles.staticRoleBadge}>{prof.role?.toUpperCase()}</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <span style={styles.verificationText}>
                                {prof.id === profile.id ? "Active (You)" : "Credentials active"}
                              </span>
                            </td>
                            {profile.role === "owner" && (
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                {prof.id !== profile.id ? (
                                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                    <button
                                      onClick={() => handleResetPIN(prof.id, prof.username)}
                                      className="btn btn-secondary"
                                      style={{ padding: "4px 8px", fontSize: "11px", height: "28px", borderColor: "rgba(245, 158, 11, 0.3)", color: "var(--accent-orange)" }}
                                      title="Reset user passcode back to default '1234'"
                                    >
                                      Reset PIN
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(prof.id, prof.username)}
                                      className="btn btn-secondary"
                                      style={{ padding: "4px 8px", fontSize: "11px", height: "28px", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--accent-red)" }}
                                      title="Permanently delete user profile"
                                    >
                                      Delete Account
                                    </button>
                                  </div>
                                ) : (
                                  <span style={styles.verificationText}>Root Control</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 3: POS Catalog Items */
            <div style={styles.catalogLayout}>
              {/* Add/Edit Product Form */}
              <div className="glass-panel animate-fade-in" style={styles.newCatalogCard}>
                <h2 style={styles.sectionTitle}>{editingProductId ? "Edit POS Item" : "Add POS Item"}</h2>
                <form onSubmit={handleSaveProduct} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flex Banner Print (sqft)"
                      className="input-field" 
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Unit Price (LKR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 150"
                      className="input-field" 
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Banners, Cards, Stickers"
                      className="input-field" 
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                    />
                    <span style={styles.helpText}>Enter an existing or new category name.</span>
                  </div>

                  <div style={styles.btnRow}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, height: "44px" }}>
                      {editingProductId ? <Save size={16} /> : <Plus size={16} />}
                      <span>{editingProductId ? "Update Item" : "Add Item"}</span>
                    </button>
                    {editingProductId && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ height: "44px" }}
                        onClick={() => {
                          setNewProductName("");
                          setNewProductPrice("");
                          setNewProductCategory("");
                          setEditingProductId(null);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Products Directory Grid */}
              <div className="glass-panel animate-fade-in" style={styles.catalogListCard}>
                <div style={styles.panelHeaderRow}>
                  <h2 style={styles.sectionTitle} style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>POS Item Catalog</h2>
                  <button 
                    type="button"
                    onClick={handleResetCatalog} 
                    className="btn btn-secondary"
                    style={{ fontSize: "12px", height: "36px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <RefreshCw size={14} />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                <div style={styles.tableWrapper} style={{ marginTop: "20px" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item Name</th>
                        <th style={styles.th}>Category</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Price</th>
                        <th style={{ ...styles.th, textAlign: "center", width: "100px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "var(--text-subtle)" }}>
                            No items found. Add items to catalog or reset to defaults.
                          </td>
                        </tr>
                      ) : (
                        products.map((prod) => (
                          <tr key={prod.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: "600" }}>{prod.name}</td>
                            <td style={styles.td}>
                              <span style={styles.categoryBadge}>{prod.category}</span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>
                              {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(prod.price)}
                            </td>
                            <td style={{ ...styles.td, display: "flex", justifyContent: "center", gap: "8px" }}>
                              <button 
                                type="button"
                                onClick={() => handleEditProduct(prod)} 
                                style={styles.iconBtn} 
                                title="Edit Item"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id)} 
                                style={{ ...styles.iconBtn, color: "hsl(350, 80%, 55%)" }} 
                                title="Delete Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Card 1: Change Passcode PIN */}
              <div className="glass-panel animate-fade-in" style={styles.settingsCard}>
                <h2 style={styles.sectionTitle}>Change fast unlock PIN</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "-12px", marginBottom: "16px" }}>
                  Used to unlock your active session screen after inactivity. Must be a 4-to-6 digit number.
                </p>
                <form onSubmit={handleChangeOwnPIN} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>New 4-to-6 Digit PIN</label>
                    <input
                      type="password"
                      placeholder="Enter new PIN"
                      className="input-field"
                      value={newPIN}
                      onChange={(e) => setNewPIN(e.target.value)}
                      required
                      disabled={submittingPIN}
                      maxLength={6}
                      style={{ maxWidth: "250px" }}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm New PIN</label>
                    <input
                      type="password"
                      placeholder="Confirm new PIN"
                      className="input-field"
                      value={confirmPIN}
                      onChange={(e) => setConfirmPIN(e.target.value)}
                      required
                      disabled={submittingPIN}
                      maxLength={6}
                      style={{ maxWidth: "250px" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "fit-content", marginTop: "10px", gap: "6px" }} disabled={submittingPIN}>
                    <Lock size={16} />
                    <span>{submittingPIN ? "Saving PIN..." : "Update Passcode PIN"}</span>
                  </button>
                </form>
              </div>

              {/* Card 2: Change Account Password */}
              <div className="glass-panel animate-fade-in" style={styles.settingsCard}>
                <h2 style={styles.sectionTitle}>Change login password</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "-12px", marginBottom: "16px" }}>
                  Used to log in to the POS System with your email address. Must be at least 6 characters.
                </p>
                <form onSubmit={handleChangePassword} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>New Account Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="input-field"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      required
                      disabled={submittingPassword}
                      style={{ maxWidth: "250px" }}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="input-field"
                      value={confirmPasswordVal}
                      onChange={(e) => setConfirmPasswordVal(e.target.value)}
                      required
                      disabled={submittingPassword}
                      style={{ maxWidth: "250px" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "fit-content", marginTop: "10px", gap: "6px" }} disabled={submittingPassword}>
                    <Lock size={16} />
                    <span>{submittingPassword ? "Updating Password..." : "Update Account Password"}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    paddingTop: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "14px",
    marginTop: "4px",
  },
  successBanner: {
    background: "var(--accent-green-glow)",
    color: "var(--accent-green)",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    padding: "12px 20px",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  errorBanner: {
    background: "var(--accent-red-glow)",
    color: "var(--accent-red)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "12px 20px",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabBar: {
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
  },
  tabBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "var(--radius-sm)",
    transition: "var(--transition-fast)",
    "&:hover": {
      color: "var(--text-main)",
      backgroundColor: "rgba(255,255,255,0.03)",
    }
  },
  tabBtnActive: {
    color: "var(--text-main)",
    background: "var(--primary-glow)",
  },
  tabContent: {
    marginTop: "10px",
  },
  settingsCard: {
    padding: "30px",
    maxWidth: "800px",
    width: "100%",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
    marginBottom: "20px",
  },
  subSubTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--text-muted)",
    marginTop: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    "@media (maxWidth: 768px)": {
      gridTemplateColumns: "1fr",
    }
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
  },
  textareaField: {
    fontFamily: "monospace",
    fontSize: "13px",
    lineHeight: "1.5",
    resize: "vertical",
  },
  submitBtn: {
    height: "44px",
    marginTop: "10px",
    alignSelf: "flex-start",
  },
  usersLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr",
    gap: "20px",
    "@media (maxWidth: 991px)": {
      gridTemplateColumns: "1fr",
    }
  },
  newUserCard: {
    padding: "24px",
    height: "fit-content",
  },
  registerBtn: {
    height: "44px",
    width: "100%",
  },
  ownerNotice: {
    padding: "30px 16px",
    textAlign: "center",
    color: "var(--text-subtle)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
  },
  userListCard: {
    padding: "24px",
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  },
  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "10px 12px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-subtle)",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--border)",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "14px 12px",
    fontSize: "13px",
  },
  userHead: {
    fontWeight: "600",
  },
  roleSelect: {
    height: "32px",
    padding: "0 8px",
    fontSize: "12px",
    width: "120px",
  },
  staticRoleBadge: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border)",
    padding: "4px 10px",
    fontSize: "11px",
    borderRadius: "var(--radius-sm)",
    fontWeight: "600",
    color: "var(--text-muted)",
  },
  verificationText: {
    fontSize: "12px",
    color: "var(--text-subtle)",
  },
  logoUploadContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "4px",
  },
  logoPreviewWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "10px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "rgba(255,255,255,0.02)",
    width: "fit-content",
  },
  logoPreview: {
    height: "50px",
    maxWidth: "150px",
    objectFit: "contain",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "4px",
    borderRadius: "4px",
  },
  removeLogoBtn: {
    fontSize: "12px",
    padding: "6px 12px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "hsl(350, 80%, 55%)",
    cursor: "pointer",
    borderRadius: "var(--radius-sm)",
  },
  fileInput: {
    padding: "8px 12px",
    fontSize: "13px",
  },
  helpText: {
    fontSize: "11px",
    color: "var(--text-subtle)",
    marginTop: "-4px",
  },
  catalogLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr",
    gap: "20px",
  },
  newCatalogCard: {
    padding: "24px",
    height: "fit-content",
  },
  catalogListCard: {
    padding: "24px",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  panelHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    background: "var(--primary-glow)",
    border: "1px solid var(--border)",
    padding: "3px 8px",
    fontSize: "11px",
    borderRadius: "var(--radius-sm)",
    fontWeight: "600",
    color: "var(--primary)",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition-fast)",
  },
};
