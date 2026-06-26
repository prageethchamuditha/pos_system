"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PrintPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [isQuotation, setIsQuotation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Custom Shop Settings from Settings tab
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
    footerInfo: "Created with Aronium - www.aronium.com"
  });

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Load custom shop settings from localStorage
    try {
      const stored = localStorage.getItem("printx_shop_settings");
      if (stored) {
        setShopSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }

    if (id) {
      fetchTransactionDetails();
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      if (id.startsWith("quote-")) {
        setIsQuotation(true);
        const quoteId = id.replace("quote-", "");

        const { data: quote, error } = await supabase
          .from("quotations")
          .select("*, customers (*)")
          .eq("id", quoteId)
          .single();

        if (error) throw error;
        setData(quote);
      } else {
        setIsQuotation(false);

        const { data: order, error } = await supabase
          .from("orders")
          .select("*, customers (*)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setData(order);
      }
    } catch (err) {
      console.error("Error loading print data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-print only on desktop (not mobile — customers just want to read)
  useEffect(() => {
    if (!loading && data && !isMobile) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, data, isMobile]);

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
    return `Rs${formatted}`;
  };

  const formatNumber = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getPaymentStatus = () => {
    if (isQuotation) return "Quotation";
    if (data.status === "paid") return "Paid ✓";
    if (data.status === "partially_paid") return "Partially Paid";
    return "Unpaid";
  };

  const getPaymentStatusColor = () => {
    if (isQuotation) return "#6366f1";
    if (data.status === "paid") return "#22c55e";
    if (data.status === "partially_paid") return "#f59e0b";
    return "#ef4444";
  };

  const getPaymentMethodLabel = () => {
    if (isQuotation) return "N/A";
    const method = data.payment_method || "cash";
    if (method === "cash") return "Cash";
    if (method === "bank_transfer") return "Bank Transfer";
    return "Pending Payment";
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <style>{`
          @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          * { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading Invoice...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.errorWrap}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#1f2937" }}>Invoice Not Found</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
          We couldn&apos;t find invoice details for this link. It may have been removed or the link is incorrect.
        </p>
        <a href="/" style={styles.backBtn}>Go to Portal</a>
      </div>
    );
  }

  const createdDate = new Date(data.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const isWalkIn = data.customers?.name?.toLowerCase().includes("walk-in") || data.customers?.name?.toLowerCase().includes("unknown");
  const totalOutstanding = Number(data.customers?.outstanding_balance || 0);
  const thisInvoiceBalance = Number(data.balance_amount || 0);
  const previousOutstanding = Math.max(0, totalOutstanding - thisInvoiceBalance);

  return (
    <div className="print-root">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

        /* ============================================================
           PRINT STYLES — Clean A4 layout when printing
        ============================================================ */
        @media print {
          body { background: #fff !important; color: #000 !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .mobile-view { display: none !important; }
          .print-view { display: block !important; }
          .print-root { background: #fff !important; }
          @page { size: A4 portrait; margin: 20mm 15mm; }
        }

        /* ============================================================
           SCREEN — Mobile-first layout
        ============================================================ */
        @media screen {
          .print-view { display: none; }
          .mobile-view { display: block; }
          .print-root { background: #f3f4f6; min-height: 100vh; }
        }

        /* On desktop show the A4 paper view */
        @media screen and (min-width: 768px) {
          .mobile-view { display: none !important; }
          .print-view { display: block !important; }
          .print-root { background: #e5e7eb; }
        }

        /* ============================================================
           ACTION BAR (screen only)
        ============================================================ */
        .action-bar {
          background: #111827;
          color: #fff;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .action-bar-title { font-size: 13px; font-weight: 600; opacity: 0.8; }
        .action-bar-btns { display: flex; gap: 8px; }
        .btn-print {
          background: #22c55e; color: #fff; border: none; padding: 8px 14px;
          border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-close {
          background: #374151; color: #fff; border: none; padding: 8px 14px;
          border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;
        }

        /* ============================================================
           MOBILE CARD VIEW
        ============================================================ */
        .mv-wrap { padding: 12px; max-width: 480px; margin: 0 auto; }

        .mv-header-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          border-radius: 16px;
          padding: 20px;
          color: #fff;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }
        .mv-header-card::before {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 120px; height: 120px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .mv-logo { height: 36px; object-fit: contain; margin-bottom: 10px; filter: brightness(0) invert(1); }
        .mv-shop-name { font-size: 18px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 2px; }
        .mv-shop-sub { font-size: 11px; opacity: 0.65; line-height: 1.5; }
        .mv-doc-badge {
          display: inline-block;
          margin-top: 12px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mv-status-strip {
          background: #fff;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .mv-invoice-num { font-size: 13px; font-weight: 700; color: #1f2937; }
        .mv-invoice-date { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .mv-status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .mv-card {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .mv-card-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9ca3af;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }
        .mv-cust-name { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
        .mv-cust-sub { font-size: 12px; color: #6b7280; line-height: 1.5; }

        /* Items list — mobile style */
        .mv-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
          gap: 8px;
        }
        .mv-item-row:last-child { border-bottom: none; padding-bottom: 0; }
        .mv-item-name { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 2px; }
        .mv-item-meta { font-size: 11px; color: #6b7280; }
        .mv-item-price { font-size: 13px; font-weight: 700; color: #1f2937; text-align: right; white-space: nowrap; }
        .mv-item-discount { font-size: 10px; color: #f59e0b; text-align: right; }

        /* Summary rows */
        .mv-sum-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f9fafb;
        }
        .mv-sum-row:last-child { border-bottom: none; }
        .mv-sum-row.total {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          border-top: 2px solid #0f172a;
          margin-top: 4px;
          padding-top: 10px;
          border-bottom: none;
        }
        .mv-sum-row.outstanding-total {
          background: #fef9c3;
          margin: 8px -16px -16px -16px;
          padding: 10px 16px;
          border-radius: 0 0 12px 12px;
          font-weight: 700;
          font-size: 13px;
          color: #92400e;
        }
        .mv-sum-label { color: #6b7280; font-weight: 500; }
        .mv-sum-label.bold { color: #0f172a; font-weight: 700; }
        .mv-sum-value { font-weight: 600; }
        .mv-sum-value.red { color: #ef4444; }
        .mv-sum-value.green { color: #22c55e; }
        .mv-sum-value.orange { color: #f59e0b; }

        /* Terms */
        .mv-terms { font-size: 10px; color: #9ca3af; line-height: 1.6; white-space: pre-wrap; }
        .mv-footer { text-align: center; padding: 20px 0 8px; font-size: 11px; color: #9ca3af; }

        /* ============================================================
           DESKTOP A4 PRINT VIEW
        ============================================================ */
        .desktop-sheet-wrap {
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .invoice-wrapper {
          background: #ffffff;
          width: 190mm;
          padding: 14mm 14mm 10mm 14mm;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          border: 1px solid #d1d5db;
          border-radius: 2px;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          color: #111;
          line-height: 1.45;
        }

        /* Header */
        .d-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .d-header-left { flex: 1; }
        .d-doc-title { font-size: 22px; font-weight: 900; margin: 0 0 6px; letter-spacing: -0.01em; color: #0f172a; }
        .d-shop-name { font-size: 11px; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.06em; color: #0f172a; }
        .d-shop-sub { font-size: 9px; margin: 0; color: #555; line-height: 1.5; }
        .d-contact-row { margin-top: 5px; font-size: 9px; color: #555; }
        .d-header-right { display: flex; justify-content: flex-end; align-items: flex-start; }
        .d-logo { height: 64px; max-width: 130px; object-fit: contain; }

        /* Separator */
        .d-sep { border: none; border-top: 1.5px solid #0f172a; margin: 8px 0 10px; }

        /* Bill-to + Invoice meta side by side */
        .d-meta-grid { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .d-client-sec { flex: 1; background: #f8fafc; border-left: none; border-top: 2px solid #0f172a; padding: 8px 10px; }
        .d-meta-sec { text-align: right; }
        .d-sec-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 3px; }
        .d-cust-name { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .d-cust-detail { font-size: 9px; color: #555; margin-bottom: 1px; }
        .d-meta-row { font-size: 9px; color: #555; margin-bottom: 3px; }
        .d-meta-row span { font-weight: 700; color: #0f172a; margin-left: 6px; }
        .d-meta-row.status span { font-weight: 800; }

        /* Items table */
        .d-items-tbl { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .d-items-tbl th {
          border-bottom: 1.5px solid #0f172a;
          background: #f1f5f9;
          padding: 6px 7px;
          font-size: 8.5px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .d-items-tbl td {
          border: none;
          border-bottom: 1px solid #e8edf2;
          padding: 7px 7px;
          font-size: 9.5px;
          color: #111;
          vertical-align: middle;
        }
        .d-items-tbl tbody tr:nth-child(even) td { background: #fafbfc; }
        .d-items-tbl tfoot td {
          border-top: 1.5px solid #0f172a;
          border-bottom: none;
          font-weight: 700;
          font-size: 9.5px;
          padding: 6px 7px;
          background: #f8fafc;
        }

        /* Summary block */
        .d-summary-wrap { display: flex; justify-content: flex-end; margin-bottom: 10px; }
        .d-summary-tbl { width: 220px; border-collapse: collapse; }
        .d-summary-tbl td { font-size: 9.5px; padding: 4px 0; border: none; }
        .d-summary-tbl td.lbl { color: #555; }
        .d-summary-tbl td.val { text-align: right; font-weight: 600; color: #111; }
        .d-summary-tbl tr.divider td { border-top: 1px dashed #ccc; padding-top: 6px; }
        .d-summary-tbl tr.total-row td { border-top: 1.5px solid #0f172a; padding-top: 7px; font-weight: 800; font-size: 11px; color: #0f172a; }
        .d-summary-tbl tr.outstanding-row td { color: #b45309; font-weight: 700; font-size: 9.5px; }

        /* Terms */
        .d-terms-sec { border-top: 1px solid #e2e8f0; padding-top: 6px; margin-bottom: 8px; }
        .d-terms-title { font-size: 8px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .d-terms-text { font-family: inherit; font-size: 7.5px; color: #888; white-space: pre-wrap; line-height: 1.55; margin: 0; }

        /* Footer */
        .d-footer { border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #aaa; }
      `}</style>

      {/* ============================================================
          ACTION BAR — visible on screen only (hidden in print)
      ============================================================ */}
      <div className="action-bar no-print">
        <div>
          <div className="action-bar-title">
            📄 {isQuotation ? "Quotation" : "Invoice"} — {isQuotation ? data.quotation_number : data.order_number}
          </div>
        </div>
        <div className="action-bar-btns">
          <button onClick={() => window.print()} className="btn-print">
            🖨️ Save / Print
          </button>
          <button onClick={() => window.close()} className="btn-close">✕ Close</button>
        </div>
      </div>

      {/* ============================================================
          MOBILE VIEW — shown only on phones/tablets (screen < 768px)
      ============================================================ */}
      <div className="mobile-view">
        <div className="mv-wrap">

          {/* Header Card */}
          <div className="mv-header-card">
            <img
              src={shopSettings.logoUrl}
              alt={shopSettings.name}
              className="mv-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="mv-shop-name">{shopSettings.name}</div>
            <div className="mv-shop-sub">
              {shopSettings.addressLine1}, {shopSettings.addressLine2}, {shopSettings.addressLine3}
            </div>
            <div className="mv-shop-sub">📞 {shopSettings.phone} · {shopSettings.email}</div>
            <div className="mv-doc-badge">{isQuotation ? "Quotation" : "Invoice"}</div>
          </div>

          {/* Status Strip */}
          <div className="mv-status-strip">
            <div>
              <div className="mv-invoice-num">
                {isQuotation ? data.quotation_number : data.order_number}
              </div>
              <div className="mv-invoice-date">📅 {formattedDate}</div>
            </div>
            <div
              className="mv-status-badge"
              style={{
                background: getPaymentStatusColor() + "20",
                color: getPaymentStatusColor(),
                border: `1px solid ${getPaymentStatusColor()}40`
              }}
            >
              {getPaymentStatus()}
            </div>
          </div>

          {/* Customer Card */}
          {!isWalkIn && data.customers && (
            <div className="mv-card">
              <div className="mv-card-title">👤 Billed To</div>
              <div className="mv-cust-name">{data.customers.name}</div>
              {data.customers.phone && <div className="mv-cust-sub">📞 {data.customers.phone}</div>}
              {data.customers.address && <div className="mv-cust-sub">📍 {data.customers.address}</div>}
            </div>
          )}

          {/* Items Card */}
          <div className="mv-card">
            <div className="mv-card-title">🛒 Items ({data.items?.length || 0})</div>
            {data.items?.map((item, idx) => {
              const hasDiscount = item.discount_type && item.discount_type !== "none" && Number(item.discount_value || 0) > 0;
              const discountLabel = hasDiscount
                ? item.discount_type === "percentage"
                  ? `${Number(item.discount_value).toFixed(0)}% off`
                  : `Rs${Number(item.discount_value).toFixed(0)} off`
                : null;
              return (
                <div key={idx} className="mv-item-row">
                  <div style={{ flex: 1 }}>
                    <div className="mv-item-name">{item.name}</div>
                    <div className="mv-item-meta">Qty: {item.qty} × {formatNumber(item.price)} LKR</div>
                  </div>
                  <div>
                    <div className="mv-item-price">{formatCurrency(item.total)}</div>
                    {discountLabel && <div className="mv-item-discount">🏷 {discountLabel}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Summary Card */}
          <div className="mv-card">
            <div className="mv-card-title">💰 Payment Summary</div>

            <div className="mv-sum-row total">
              <span className="mv-sum-label bold">Total Amount</span>
              <span className="mv-sum-value">{formatCurrency(data.total_amount)}</span>
            </div>

            {!isQuotation && (
              <>
                <div className="mv-sum-row" style={{ paddingTop: "10px" }}>
                  <span className="mv-sum-label">Payment Method</span>
                  <span className="mv-sum-value">{getPaymentMethodLabel()}</span>
                </div>
                <div className="mv-sum-row">
                  <span className="mv-sum-label">Amount Paid</span>
                  <span className="mv-sum-value green">{formatCurrency(data.paid_amount)}</span>
                </div>
                <div className="mv-sum-row">
                  <span className="mv-sum-label bold">Balance Due</span>
                  <span className="mv-sum-value" style={{ color: Number(data.balance_amount) > 0 ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
                    {formatCurrency(data.balance_amount)}
                  </span>
                </div>

                {!isWalkIn && totalOutstanding > 0 && (
                  <div className="mv-sum-row outstanding-total">
                    <span>⚠️ Total Outstanding Debt</span>
                    <span style={{ fontWeight: 800 }}>{formatCurrency(totalOutstanding)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Terms (collapsed, small) */}
          <div className="mv-card">
            <div className="mv-card-title">📋 Terms & Conditions</div>
            <div className="mv-terms">{shopSettings.terms}</div>
          </div>

          {/* Footer */}
          <div className="mv-footer">
            {shopSettings.name} · {shopSettings.website || shopSettings.email}
            <br />
            <span style={{ fontSize: "10px", color: "#d1d5db" }}>{shopSettings.footerInfo}</span>
          </div>

        </div>
      </div>

      {/* ============================================================
          DESKTOP / PRINT VIEW — Clean A4 layout
      ============================================================ */}
      <div className="print-view">
        <div className="desktop-sheet-wrap">
          <div className="invoice-wrapper">

            {/* ── HEADER ── */}
            <div className="d-header">
              <div className="d-header-left">
                <div className="d-doc-title">{isQuotation ? "QUOTATION" : "INVOICE"}</div>
                <div className="d-shop-name">{shopSettings.name}</div>
                <div className="d-shop-sub">{shopSettings.addressLine1}, {shopSettings.addressLine2}, {shopSettings.addressLine3}</div>
                <div className="d-contact-row">
                  Tel: {shopSettings.phone} &nbsp;·&nbsp; {shopSettings.email}
                </div>
              </div>
              <div className="d-header-right">
                <img
                  src={shopSettings.logoUrl}
                  alt={shopSettings.name}
                  className="d-logo"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            </div>

            <div className="d-sep" />

            {/* ── BILL TO + INVOICE META ── */}
            <div className="d-meta-grid">
              <div className="d-client-sec">
                <div className="d-sec-lbl">Billed To</div>
                <div className="d-cust-name">{data.customers?.name || "Walk-in Customer"}</div>
                {data.customers?.phone && <div className="d-cust-detail">Tel: {data.customers.phone}</div>}
                {data.customers?.email && <div className="d-cust-detail">{data.customers.email}</div>}
                {data.customers?.address && <div className="d-cust-detail">{data.customers.address}</div>}
              </div>
              <div className="d-meta-sec">
                <div className="d-meta-row">{isQuotation ? "Quotation No." : "Invoice No."}<span>{isQuotation ? data.quotation_number : data.order_number}</span></div>
                <div className="d-meta-row">Date<span>{formattedDate}</span></div>
                {!isQuotation && (
                  <div className="d-meta-row status">Status<span>{getPaymentStatus()}</span></div>
                )}
                {!isQuotation && (
                  <div className="d-meta-row">Payment<span>{getPaymentMethodLabel()}</span></div>
                )}
              </div>
            </div>

            {/* ── ITEMS TABLE ── */}
            <table className="d-items-tbl">
              <thead>
                <tr>
                  <th style={{ width: "28px", textAlign: "center" }}>#</th>
                  <th style={{ textAlign: "left" }}>Description</th>
                  <th style={{ width: "45px", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "90px", textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: "75px", textAlign: "right" }}>Discount</th>
                  <th style={{ width: "90px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center", color: "#888" }}>{idx + 1}</td>
                    <td style={{ textAlign: "left" }}>{item.name}</td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
                    <td style={{ textAlign: "right" }}>Rs {formatNumber(item.price)}</td>
                    <td style={{ textAlign: "right", color: "#888" }}>
                      {item.discount_type === "percentage" && Number(item.discount_value || 0) > 0
                        ? `${Number(item.discount_value).toFixed(0)}%`
                        : item.discount_type === "fixed" && Number(item.discount_value || 0) > 0
                        ? `Rs ${Number(item.discount_value).toFixed(0)}`
                        : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "600" }}>Rs {formatNumber(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" style={{ textAlign: "right", color: "#555" }}>Subtotal</td>
                  <td style={{ textAlign: "right" }}>Rs {formatNumber(data.total_amount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* ── SUMMARY ── */}
            {!isQuotation && (
              <div className="d-summary-wrap">
                <table className="d-summary-tbl">
                  <tbody>
                    <tr className="total-row">
                      <td className="lbl">Total Amount</td>
                      <td className="val">{formatCurrency(data.total_amount)}</td>
                    </tr>
                    <tr>
                      <td className="lbl">Amount Paid</td>
                      <td className="val" style={{ color: "#16a34a" }}>{formatCurrency(data.paid_amount)}</td>
                    </tr>
                    <tr>
                      <td className="lbl" style={{ fontWeight: "700" }}>Balance Due</td>
                      <td className="val" style={{ fontWeight: "800", color: Number(data.balance_amount) > 0 ? "#dc2626" : "#16a34a" }}>
                        {formatCurrency(data.balance_amount)}
                      </td>
                    </tr>
                    {!isWalkIn && (
                      <>
                        <tr className="divider">
                          <td className="lbl">Previous Outstanding</td>
                          <td className="val">{formatCurrency(previousOutstanding)}</td>
                        </tr>
                        <tr className="outstanding-row">
                          <td className="lbl">Total Outstanding Debt</td>
                          <td className="val">{formatCurrency(totalOutstanding)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── TERMS ── */}
            <div className="d-terms-sec">
              <div className="d-terms-title">Terms &amp; Conditions</div>
              <pre className="d-terms-text">{shopSettings.terms}</pre>
            </div>

            {/* ── FOOTER ── */}
            <div className="d-footer">
              <span>{shopSettings.name} · {shopSettings.phone} · {shopSettings.email}</span>
              <span>Page 1 of 1</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    gap: "16px",
    fontFamily: "sans-serif"
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid #f3f4f6",
    borderTopColor: "#6366f1",
    animation: "spin 1s linear infinite"
  },
  loadingText: { color: "#6b7280", fontSize: "14px" },
  errorWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "40px 24px",
    textAlign: "center",
    backgroundColor: "#ffffff",
    fontFamily: "sans-serif"
  },
  backBtn: {
    background: "#6366f1",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "14px"
  }
};
