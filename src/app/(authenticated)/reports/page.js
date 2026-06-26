"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGuard";
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar, 
  Printer, 
  DollarSign, 
  Clock, 
  Search,
  FileText,
  Percent,
  Download
} from "lucide-react";

export default function ReportsPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  
  // Tab states
  const [activeTab, setActiveTab] = useState("profit"); // 'profit' | 'customer' | 'items' | 'balancing' | 'outstanding'

  useEffect(() => {
    if (tabParam && ["profit", "customer", "items", "balancing", "outstanding"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Balancing reports states
  const [dayEndReports, setDayEndReports] = useState([]);
  const [weekendReports, setWeekendReports] = useState([]);
  const [balancingLoading, setBalancingLoading] = useState(false);

  const fetchBalancingLogs = async () => {
    setBalancingLoading(true);
    try {
      const { data: dayData, error: dayErr } = await supabase
        .from("day_end_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (dayErr) throw dayErr;
      setDayEndReports(dayData || []);

      const { data: weekData, error: weekErr } = await supabase
        .from("weekend_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (weekErr) throw weekErr;
      setWeekendReports(weekData || []);
    } catch (err) {
      console.error("Error loading balancing reports:", err);
    } finally {
      setBalancingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "balancing") {
      fetchBalancingLogs();
    }
  }, [activeTab]);

  // Date Filter States (default to first of this month to today)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Data Loading states
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerLastDeals, setCustomerLastDeals] = useState({});
  const [outstandingSearch, setOutstandingSearch] = useState("");
  
  // Customer Statement Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerQuotations, setCustomerQuotations] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    fetchBaseData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerSpecificData();
    } else {
      setCustomerOrders([]);
      setCustomerQuotations([]);
    }
  }, [selectedCustomerId, startDate, endDate]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Customers List for dropdown
      const { data: custData } = await supabase
        .from("customers")
        .select("id, name, phone, outstanding_balance")
        .order("name", { ascending: true });
      setCustomers(custData || []);

      // 2. Fetch Orders within date range
      let query = supabase.from("orders").select("*, customers(*)");
      
      if (startDate) {
        query = query.gte("created_at", new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDay.toISOString());
      }

      const { data: ordData, error: ordError } = await query.order("created_at", { ascending: false });
      if (ordError) throw ordError;
      setOrders(ordData || []);

      // 3. Fetch all orders (without date range restriction) to determine the absolute "Last Deal Date" for each customer
      const { data: allDeals } = await supabase
        .from("orders")
        .select("customer_id, created_at")
        .order("created_at", { ascending: false });

      const lastDealsMap = {};
      if (allDeals) {
        allDeals.forEach(deal => {
          if (deal.customer_id && !lastDealsMap[deal.customer_id]) {
            lastDealsMap[deal.customer_id] = deal.created_at;
          }
        });
      }
      setCustomerLastDeals(lastDealsMap);

    } catch (err) {
      console.error("Error loading reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSpecificData = async () => {
    setCustomerLoading(true);
    try {
      // Fetch selected customer's orders in this range
      let ordQuery = supabase
        .from("orders")
        .select("*")
        .eq("customer_id", selectedCustomerId);
      
      if (startDate) {
        ordQuery = ordQuery.gte("created_at", new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        ordQuery = ordQuery.lte("created_at", endDay.toISOString());
      }
      const { data: ords } = await ordQuery.order("created_at", { ascending: false });
      setCustomerOrders(ords || []);

      // Fetch selected customer's quotations in this range
      let quoteQuery = supabase
        .from("quotations")
        .select("*")
        .eq("customer_id", selectedCustomerId);
      
      if (startDate) {
        quoteQuery = quoteQuery.gte("created_at", new Date(startDate).toISOString());
      }
      if (endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        quoteQuery = quoteQuery.lte("created_at", endDay.toISOString());
      }
      const { data: qts } = await quoteQuery.order("created_at", { ascending: false });
      setCustomerQuotations(qts || []);

    } catch (err) {
      console.error("Error loading customer-specific statements:", err);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Helper to apply quick ranges
  const applyQuickRange = (rangeType) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    switch (rangeType) {
      case "today":
        start = end;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        start = yesterday.toISOString().split("T")[0];
        end = start;
        break;
      case "week":
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        start = lastWeek.toISOString().split("T")[0];
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        break;
      case "last_month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
        end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
        break;
      case "all":
        start = "";
        end = today.toISOString().split("T")[0];
        break;
      default:
        return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  // Financial aggregates
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
  const totalOutstanding = orders.reduce((sum, o) => sum + Number(o.balance_amount || 0), 0);
  
  // Standard print shop margin assumptions: 
  // 55% Cost of Materials & operations, 45% Net Profit Margin
  const estCosts = totalRevenue * 0.55;
  const estProfit = totalRevenue * 0.45;

  // Daily summary logic
  const dailySummary = {};
  orders.forEach(o => {
    const dateKey = o.created_at.split("T")[0];
    if (!dailySummary[dateKey]) {
      dailySummary[dateKey] = { date: dateKey, revenue: 0, collected: 0, pending: 0, ordersCount: 0 };
    }
    dailySummary[dateKey].revenue += Number(o.total_amount || 0);
    dailySummary[dateKey].collected += Number(o.paid_amount || 0);
    dailySummary[dateKey].pending += Number(o.balance_amount || 0);
    dailySummary[dateKey].ordersCount += 1;
  });
  const dailyLog = Object.values(dailySummary).sort((a, b) => b.date.localeCompare(a.date));

  // Item Sales logic
  const itemsSummary = {};
  orders.forEach(o => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(item => {
        const name = item.name;
        const qty = Number(item.qty || 0);
        const total = Number(item.total || 0);
        if (!itemsSummary[name]) {
          itemsSummary[name] = { name, qty: 0, revenue: 0, transactionsCount: 0 };
        }
        itemsSummary[name].qty += qty;
        itemsSummary[name].revenue += total;
        itemsSummary[name].transactionsCount += 1;
      });
    }
  });
  const itemsList = Object.values(itemsSummary).sort((a, b) => b.revenue - a.revenue);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0
    }).format(val);
  };

  const getSelectedCustomerDetails = () => {
    return customers.find(c => c.id === selectedCustomerId);
  };

  const handlePrintCustomerStatement = () => {
    if (!selectedCustomerId) return;
    const url = `/customers/${selectedCustomerId}/print?start=${startDate}&end=${endDate}`;
    window.open(url, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Upper header */}
      <div>
        <h1 style={styles.title}>Reports & Operations Center</h1>
        <p style={styles.subtitle}>Analyze profitability, audit client statement timelines, and review print catalog performance</p>
      </div>

      {/* Date Filters Controller */}
      <section className="glass-panel" style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <Calendar size={18} style={{ color: "var(--primary)" }} />
          <h2 style={styles.filterTitle}>Select Report Duration</h2>
        </div>
        
        <div style={styles.filterRow}>
          <div style={styles.dateInputs}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>End Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.quickRanges}>
            <button onClick={() => applyQuickRange("today")} style={styles.rangeBtn}>Today</button>
            <button onClick={() => applyQuickRange("yesterday")} style={styles.rangeBtn}>Yesterday</button>
            <button onClick={() => applyQuickRange("week")} style={styles.rangeBtn}>Last 7 Days</button>
            <button onClick={() => applyQuickRange("month")} style={styles.rangeBtn}>This Month</button>
            <button onClick={() => applyQuickRange("last_month")} style={styles.rangeBtn}>Last Month</button>
            <button onClick={() => applyQuickRange("year")} style={styles.rangeBtn}>This Year</button>
            <button onClick={() => applyQuickRange("all")} style={styles.rangeBtn}>All Time</button>
          </div>
        </div>
      </section>

      {/* Reports Navigation Tabs */}
      <div style={styles.tabBar} className="no-print">
        <button 
          onClick={() => setActiveTab("profit")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "profit" ? styles.tabBtnActive : {})
          }}
        >
          <TrendingUp size={16} />
          <span>Profit & Financials</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("customer")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "customer" ? styles.tabBtnActive : {})
          }}
        >
          <Users size={16} />
          <span>Customer Statements</span>
        </button>

        <button 
          onClick={() => setActiveTab("items")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "items" ? styles.tabBtnActive : {})
          }}
        >
          <Package size={16} />
          <span>Print Item Sales</span>
        </button>

        {(profile?.role === "owner" || profile?.role === "manager") && (
          <>
            <button 
              onClick={() => setActiveTab("balancing")}
              style={{
                ...styles.tabBtn,
                ...(activeTab === "balancing" ? styles.tabBtnActive : {})
              }}
            >
              <Calendar size={16} />
              <span>Day/Week Balancing Logs</span>
            </button>
            <button 
              onClick={() => setActiveTab("outstanding")}
              style={{
                ...styles.tabBtn,
                ...(activeTab === "outstanding" ? styles.tabBtnActive : {})
              }}
            >
              <DollarSign size={16} />
              <span>Outstanding Balances</span>
            </button>
          </>
        )}
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner}></div>
        </div>
      ) : (
        <div style={styles.reportContent}>
          
          {/* TAB 1: PROFIT AND FINANCIAL REPORT */}
          {activeTab === "profit" && (
            <div className="animate-fade-in" style={styles.tabContentGrid}>
              
              {/* Aggregate Statistics Row */}
              <div style={styles.statsRow}>
                <div className="glass-panel" style={styles.statBox}>
                  <span style={styles.statLabel}>Gross Sales Revenue</span>
                  <span style={{ ...styles.statVal, color: "var(--text-main)" }}>{formatCurrency(totalRevenue)}</span>
                  <span style={styles.statDesc}>Total invoice value logged</span>
                </div>

                <div className="glass-panel" style={styles.statBox}>
                  <span style={styles.statLabel}>Revenue Collected</span>
                  <span style={{ ...styles.statVal, color: "var(--accent-green)" }}>{formatCurrency(totalCollected)}</span>
                  <span style={styles.statDesc}>Total payments cleared</span>
                </div>

                <div className="glass-panel" style={styles.statBox}>
                  <span style={styles.statLabel}>Outstanding Credits</span>
                  <span style={{ ...styles.statVal, color: totalOutstanding > 0 ? "var(--accent-orange)" : "var(--text-main)" }}>
                    {formatCurrency(totalOutstanding)}
                  </span>
                  <span style={styles.statDesc}>Uncollected pending payments</span>
                </div>

                <div className="glass-panel" style={{ ...styles.statBox, borderLeft: "4px solid var(--primary)" }}>
                  <span style={styles.statLabel}>Est. Net Profit (45%)</span>
                  <span style={{ ...styles.statVal, color: "var(--secondary)" }}>{formatCurrency(estProfit)}</span>
                  <span style={styles.statDesc}>Assumed material costs: {formatCurrency(estCosts)}</span>
                </div>
              </div>

              {/* Daily Sales Breakdown Table */}
              <div className="glass-panel" style={styles.detailCard}>
                <h3 style={styles.cardTitle}>Daily Summary Log</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Orders Count</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Daily Sales</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Daily Collections</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Daily Pending Debt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLog.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={styles.emptyRow}>No sales logged in this duration.</td>
                        </tr>
                      ) : (
                        dailyLog.map((log) => (
                          <tr key={log.date} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: "700" }}>{new Date(log.date).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                            <td style={styles.td}>{log.ordersCount} transactions</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>{formatCurrency(log.revenue)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "var(--accent-green)" }}>{formatCurrency(log.collected)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: log.pending > 0 ? "var(--accent-orange)" : "var(--text-subtle)" }}>
                              {formatCurrency(log.pending)}
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

          {/* TAB 2: INDIVIDUAL CUSTOMER DURATION REPORTS */}
          {activeTab === "customer" && (
            <div className="animate-fade-in" style={styles.tabContentGrid}>
              
              {/* Customer Selector Block */}
              <div className="glass-panel" style={styles.selectorCard}>
                <div style={styles.selectorRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.selectorLabel}>Choose Customer Profile</label>
                    <select
                      className="input-field"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      style={styles.dropdownSelect}
                    >
                      <option value="">-- Choose client profile from directory --</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} ({cust.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCustomerId && (
                    <button 
                      onClick={handlePrintCustomerStatement}
                      className="btn btn-primary"
                      style={styles.printReportBtn}
                    >
                      <Printer size={16} />
                      <span>Print Statement Range</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Summary & List */}
              {!selectedCustomerId ? (
                <div className="glass-panel" style={styles.placeholderCard}>
                  <Users size={36} style={{ color: "var(--text-subtle)", opacity: 0.4, marginBottom: "10px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    Select a customer profile above to compute their custom billing and quotation statement for the filtered range.
                  </p>
                </div>
              ) : customerLoading ? (
                <div style={styles.loaderContainer}>
                  <div style={styles.spinner}></div>
                </div>
              ) : (
                <div style={styles.statementDetails}>
                  
                  {/* Aggregates for customer */}
                  <div style={styles.statsRow}>
                    <div className="glass-panel" style={styles.statBox}>
                      <span style={styles.statLabel}>Period Order Volume</span>
                      <span style={styles.statVal}>
                        {formatCurrency(customerOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}
                      </span>
                      <span style={styles.statDesc}>{customerOrders.length} orders in duration</span>
                    </div>

                    <div className="glass-panel" style={styles.statBox}>
                      <span style={styles.statLabel}>Period Collected</span>
                      <span style={{ ...styles.statVal, color: "var(--accent-green)" }}>
                        {formatCurrency(customerOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0))}
                      </span>
                      <span style={styles.statDesc}>Payments cleared in range</span>
                    </div>

                    <div className="glass-panel" style={styles.statBox}>
                      <span style={styles.statLabel}>Period Pending Balance</span>
                      <span style={{ ...styles.statVal, color: "var(--accent-orange)" }}>
                        {formatCurrency(customerOrders.reduce((sum, o) => sum + Number(o.balance_amount || 0), 0))}
                      </span>
                      <span style={styles.statDesc}>Debt accumulated in range</span>
                    </div>
                  </div>

                  {/* Customer Orders in range */}
                  <div className="glass-panel" style={styles.detailCard}>
                    <h3 style={styles.cardTitle}>Invoices & Payments List (Period)</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Reference No</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Total Amount</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Paid Amount</th>
                            <th style={{ ...styles.th, textAlign: "right" }}>Remaining Balance</th>
                            <th style={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={styles.emptyRow}>No invoices logged for this client during this period.</td>
                            </tr>
                          ) : (
                            customerOrders.map(order => (
                              <tr key={order.id} style={styles.tr}>
                                <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td style={{ ...styles.td, fontWeight: "600", color: "var(--secondary)" }}>{order.order_number}</td>
                                <td style={{ ...styles.td, textAlign: "right" }}>{formatCurrency(order.total_amount)}</td>
                                <td style={{ ...styles.td, textAlign: "right", color: "var(--accent-green)" }}>{formatCurrency(order.paid_amount)}</td>
                                <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: order.balance_amount > 0 ? "var(--accent-orange)" : "var(--text-main)" }}>
                                  {formatCurrency(order.balance_amount)}
                                </td>
                                <td style={styles.td}>
                                  <span className={`badge ${
                                    order.status === "paid" ? "badge-paid" : order.status === "partially_paid" ? "badge-partial" : "badge-pending"
                                  }`}>
                                    {order.status?.replace("_", " ")}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Customer Quotations in range */}
                  {customerQuotations.length > 0 && (
                    <div className="glass-panel" style={{ ...styles.detailCard, marginTop: "20px" }}>
                      <h3 style={styles.cardTitle}>Saved Price Quotations (Period)</h3>
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Quotation No</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Estimated Value</th>
                              <th style={styles.th}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerQuotations.map(quote => (
                              <tr key={quote.id} style={styles.tr}>
                                <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: "600", color: "var(--primary)" }}>{quote.quotation_number}</td>
                                <td style={{ textAlign: "right", fontWeight: "600" }}>{formatCurrency(quote.total_amount)}</td>
                                <td>
                                  <span className={`badge ${quote.converted_to_order ? "badge-paid" : "badge-pending"}`}>
                                    {quote.converted_to_order ? "Converted" : "Active"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 3: PRODUCT SALES REPORT */}
          {activeTab === "items" && (
            <div className="animate-fade-in" style={styles.tabContentGrid}>
              
              <div className="glass-panel" style={styles.detailCard}>
                <h3 style={styles.cardTitle}>Print Services Catalog Sales Performance</h3>
                <p style={styles.cardDesc}>Quantities sold and revenue generated grouped by print catalog item</p>
                
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: "50px" }}>#</th>
                        <th style={styles.th}>Print Service Item</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Transactions logged</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Total Units Sold</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Total Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsList.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={styles.emptyRow}>No print items sold in this duration.</td>
                        </tr>
                      ) : (
                        itemsList.map((item, idx) => (
                          <tr key={item.name} style={styles.tr}>
                            <td style={{ ...styles.td, color: "var(--text-subtle)", fontWeight: "bold" }}>{idx + 1}</td>
                            <td style={{ ...styles.td, fontWeight: "700" }}>{item.name}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{item.transactionsCount} bills</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: "var(--secondary)" }}>{item.qty} units</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>{formatCurrency(item.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: DAY/WEEK BALANCING LOGS */}
          {activeTab === "balancing" && (profile?.role === "owner" || profile?.role === "manager") && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Day End reports section */}
              <div className="glass-panel" style={styles.detailCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={styles.cardTitle}>Day End Shift Reports</h3>
                    <p style={styles.cardDesc}>Summary of daily cash sales, copy count meter readings, and drawer cash reconciliation.</p>
                  </div>
                  {balancingLoading && <div style={styles.spinnerSmall}></div>}
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Logged By</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Copy Count</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Sales Total</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Collections</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Expenses / Withdrawals</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Net Drawer Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayEndReports.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={styles.emptyRow}>No Day End reports submitted yet.</td>
                        </tr>
                      ) : (
                        dayEndReports.map((report) => (
                          <tr key={report.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: "700" }}>{new Date(report.date || report.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                            <td style={styles.td}>{report.created_by}</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: "var(--secondary)" }}>{report.copy_count}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{formatCurrency(report.total_sales || 0)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "var(--accent-green)" }}>{formatCurrency(report.total_cash_payments || 0)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {report.expense_amount > 0 ? (
                                <div style={{ color: "var(--accent-red)" }}>
                                  <div>{formatCurrency(report.expense_amount)}</div>
                                  <div style={{ fontSize: "11px", color: "var(--text-subtle)", fontStyle: "italic" }}>
                                    {report.expense_reason} ({report.expense_staff || "Staff"})
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-subtle)" }}>None</span>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "var(--primary)" }}>
                              {formatCurrency(report.net_drawer_cash || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Week End reports section */}
              <div className="glass-panel" style={styles.detailCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={styles.cardTitle}>Week End Sunday Audits</h3>
                    <p style={styles.cardDesc}>Summary of Sunday weekend audits validating monthly totals against actual weekly collections under-the-hood.</p>
                  </div>
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Audit Date</th>
                        <th style={styles.th}>Audited By</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Entered Monthly Total</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Calculated Weekly Income</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekendReports.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={styles.emptyRow}>No Week End Sunday audits performed yet.</td>
                        </tr>
                      ) : (
                        weekendReports.map((report) => (
                          <tr key={report.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: "700" }}>{new Date(report.date || report.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                            <td style={styles.td}>{report.created_by}</td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: "var(--accent-green)" }}>{formatCurrency(report.entered_monthly_total || 0)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "var(--text-muted)" }}>{formatCurrency(report.calculated_weekly_revenue || 0)}</td>
                            <td style={styles.td}>
                              <span className="badge badge-paid">Verified & Closed</span>
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
 
          {/* TAB 5: OUTSTANDING BALANCES LIST FOR OWNERS / MANAGERS */}
          {activeTab === "outstanding" && (profile?.role === "owner" || profile?.role === "manager") && (() => {
            // Filter customers who have outstanding balance > 0 (or all customers if they search, but default to those in debt)
            const debtCustomers = customers.filter(c => {
              const matchesSearch = c.name.toLowerCase().includes(outstandingSearch.toLowerCase()) || 
                                    c.phone.includes(outstandingSearch);
              // If they searched, show matches. If not, show only those with positive outstanding balance
              if (outstandingSearch) {
                return matchesSearch;
              }
              return Number(c.outstanding_balance || 0) > 0;
            });

            // Calculate aggregates
            const totalOutstandingDebt = customers.reduce((sum, c) => sum + Number(c.outstanding_balance || 0), 0);
            const countInDebt = customers.filter(c => Number(c.outstanding_balance || 0) > 0).length;

            return (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Aggregate Summary Box */}
                <div style={styles.statsRow}>
                  <div className="glass-panel" style={styles.statBox}>
                    <span style={styles.statLabel}>Total Outstanding Debt</span>
                    <span style={{ ...styles.statVal, color: "var(--accent-orange)" }}>{formatCurrency(totalOutstandingDebt)}</span>
                    <span style={styles.statDesc}>Cumulative unpaid balances from all profiles</span>
                  </div>
                  <div className="glass-panel" style={styles.statBox}>
                    <span style={styles.statLabel}>Active Clients in Debt</span>
                    <span style={{ ...styles.statVal, color: "var(--text-main)" }}>{countInDebt}</span>
                    <span style={styles.statDesc}>Registered teacher/student ledger files</span>
                  </div>
                </div>

                {/* Main Table view */}
                <div className="glass-panel" style={styles.detailCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={styles.cardTitle}>Teacher Outstanding Ledger</h3>
                      <p style={styles.cardDesc}>Review current debt statements and the last print deal date for each teacher profile.</p>
                    </div>
                    {/* Search bar inside the card */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0 10px", width: "100%", maxWidth: "300px" }}>
                      <Search size={16} style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Search teacher by name or phone..."
                        className="input-field"
                        style={{ background: "none", border: "none", height: "36px", fontSize: "13px", color: "var(--text-main)", outline: "none", width: "100%" }}
                        value={outstandingSearch}
                        onChange={(e) => setOutstandingSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Teacher / Client Name</th>
                          <th style={styles.th}>Phone Number</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>Outstanding Balance</th>
                          <th style={styles.th}>Last Deal Date</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debtCustomers.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={styles.emptyRow}>
                              {outstandingSearch ? "No profiles matched your search." : "No teachers have any outstanding debt."}
                            </td>
                          </tr>
                        ) : (
                          debtCustomers.map((cust) => {
                            const lastDeal = customerLastDeals[cust.id];
                            return (
                              <tr key={cust.id} style={styles.tr}>
                                <td style={{ ...styles.td, fontWeight: "700" }}>{cust.name}</td>
                                <td style={styles.td}>{cust.phone}</td>
                                <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: Number(cust.outstanding_balance) > 0 ? "var(--accent-orange)" : "var(--accent-green)" }}>
                                  {formatCurrency(cust.outstanding_balance || 0)}
                                </td>
                                <td style={styles.td}>
                                  {lastDeal ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <Clock size={12} style={{ color: "var(--text-muted)" }} />
                                      {new Date(lastDeal).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--text-subtle)", fontStyle: "italic" }}>No orders logged</span>
                                  )}
                                </td>
                                <td style={{ ...styles.td, textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                    <button
                                      onClick={() => {
                                        setSelectedCustomerId(cust.id);
                                        setActiveTab("customer");
                                      }}
                                      className="btn btn-secondary"
                                      style={{ padding: "4px 10px", fontSize: "12px", height: "30px" }}
                                    >
                                      View Statement
                                    </button>
                                    <button
                                      onClick={() => {
                                        window.open(`/customers/${cust.id}/print?start=${startDate}&end=${endDate}`, "_blank");
                                      }}
                                      className="btn btn-primary"
                                      style={{ padding: "4px 10px", fontSize: "12px", height: "30px", background: "var(--secondary)", borderColor: "var(--secondary)" }}
                                    >
                                      Print
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
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
  filterCard: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  filterHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
  },
  filterTitle: {
    fontSize: "16px",
    fontWeight: "700",
  },
  filterRow: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  dateInputs: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "200px",
  },
  label: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  quickRanges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    borderTop: "1px dashed var(--border)",
    paddingTop: "12px",
  },
  rangeBtn: {
    background: "var(--bg-surface-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    padding: "6px 12px",
    fontSize: "12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: "600",
    transition: "var(--transition-fast)",
  },
  tabBar: {
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
    marginTop: "10px",
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
  },
  tabBtnActive: {
    color: "var(--text-main)",
    background: "var(--primary-glow)",
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "250px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid var(--border)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  reportContent: {
    marginTop: "10px",
  },
  tabContentGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  statBox: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statVal: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.01em",
  },
  statDesc: {
    fontSize: "11px",
    color: "var(--text-subtle)",
  },
  detailCard: {
    padding: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  cardDesc: {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginBottom: "16px",
    marginTop: "-12px",
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
    padding: "12px 16px",
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: "600",
    borderBottom: "1px solid var(--border)",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
  },
  emptyRow: {
    padding: "40px 0",
    textAlign: "center",
    color: "var(--text-subtle)",
  },
  selectorCard: {
    padding: "20px 24px",
  },
  selectorRow: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  selectorLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-muted)",
    marginBottom: "8px",
    display: "block",
  },
  dropdownSelect: {
    height: "44px",
    fontSize: "14px",
  },
  printReportBtn: {
    height: "44px",
    padding: "0 20px",
    fontSize: "14px",
  },
  placeholderCard: {
    padding: "60px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  statementDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
};
