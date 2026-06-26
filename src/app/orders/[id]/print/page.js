"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PrintPage() {
  const { id } = useParams();
  
  const [data, setData] = useState(null);
  const [isQuotation, setIsQuotation] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

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
    if (data.status === "paid") return "Paid";
    if (data.status === "partially_paid") return "Partially Paid";
    return "Unpaid";
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
      <div className="loading-container">
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #ffffff;
            color: #333333;
            gap: 16px;
            font-family: sans-serif;
          }
          .spinner {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid #f3f3f3;
            border-top-color: #6366f1;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="spinner"></div>
        <p>Preparing Invoice Print copy...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="error-container">
        <style>{`
          .error-container {
            padding: 40px;
            text-align: center;
            background-color: #ffffff;
            color: #333333;
            font-family: sans-serif;
          }
          .btn-primary {
            background: #6366f1;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
        `}</style>
        <h2>Transaction Not Found</h2>
        <p>We couldn't retrieve the receipt details for ID: {id}</p>
        <button onClick={() => window.close()} className="btn-primary" style={{ marginTop: "16px" }}>Close Tab</button>
      </div>
    );
  }

  // Date formatting matching print shop layout
  const createdDate = new Date(data.created_at);
  const formattedDate = createdDate.toISOString().split("T")[0];

  const isWalkIn = data.customers?.name?.toLowerCase().includes("walk-in") || data.customers?.name?.toLowerCase().includes("unknown");
  const totalOutstanding = Number(data.customers?.outstanding_balance || 0);
  const thisInvoiceBalance = Number(data.balance_amount || 0);
  const previousOutstanding = Math.max(0, totalOutstanding - thisInvoiceBalance);

  return (
    <div className="print-sheet-container">
      <style>{`
        /* Global Reset & Print CSS */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet-container {
            background: #ffffff !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: auto !important;
            height: auto !important;
          }
          .invoice-wrapper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 20mm 15mm;
          }
        }

        /* Screen Preview Styles */
        @media screen {
          body {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
          }
          .print-sheet-container {
            background-color: #f3f4f6;
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .invoice-wrapper {
            background: #ffffff;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm 15mm;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border: 1px solid #d1d5db;
            border-radius: 4px;
            box-sizing: border-box;
            margin-top: 15px;
          }
        }

        /* Redesigned Premium A4 Invoice Layout Styles */
        .invoice-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: #000000;
          line-height: 1.4;
          font-size: 10.5px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-left {
          flex: 1.2;
        }

        .doc-type-title {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
          color: #0f172a;
          line-height: 1.1;
        }

        .shop-name {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #1e293b;
        }

        .shop-sub {
          font-size: 10px;
          margin: 0 0 2px 0;
          color: #475569;
          line-height: 1.4;
        }

        .shop-contact-table {
          margin-top: 10px;
          border-collapse: collapse;
        }
        .shop-contact-table td {
          padding: 2px 0;
          font-size: 10px;
          color: #475569;
          line-height: 1.4;
          border: none !important;
        }
        .shop-contact-table td.label {
          width: 80px;
          font-weight: 600;
          color: #334155;
        }
        .shop-contact-table td.value {
          font-weight: normal;
        }

        .header-right {
          flex: 0.8;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          margin-top: 2px;
        }

        .logo-img {
          height: 80px;
          max-width: 100%;
          object-fit: contain;
        }

        .separator-line {
          border-top: 2px solid #0f172a;
          margin-top: 4px;
          margin-bottom: 24px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          margin-bottom: 28px;
        }

        .client-section {
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          border-left: 3px solid #0f172a;
          padding: 14px;
          border-radius: 4px;
        }

        .client-detail-table, .invoice-meta-table {
          border-collapse: collapse;
          width: 100%;
        }
        .client-detail-table td, .invoice-meta-table td {
          padding: 2px 0;
          font-size: 10.5px;
          color: #0f172a;
          line-height: 1.4;
          vertical-align: top;
          border: none !important;
        }
        .client-detail-table td.section-label {
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          padding-bottom: 6px;
        }
        .client-detail-table td.client-name {
          font-weight: 700;
          font-size: 12px;
          color: #0f172a;
          padding-bottom: 6px;
        }
        .client-detail-table td.label {
          width: 70px;
          font-weight: 600;
          color: #475569;
        }
        .client-detail-table td.value {
          font-weight: normal;
        }
        .invoice-meta-section {
          padding: 10px 0;
        }
        .invoice-meta-table td.label {
          text-align: left;
          width: 110px;
          font-weight: 600;
          color: #475569;
        }
        .invoice-meta-table td.value {
          text-align: left;
          font-weight: 700;
          color: #0f172a;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .items-table th {
          border: none;
          border-bottom: 2px solid #0f172a;
          background-color: #f8fafc;
          padding: 10px 8px;
          font-size: 9.5px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .items-table td {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 8px;
          font-size: 10.5px;
          color: #0f172a;
          vertical-align: middle;
        }

        .items-table tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .summary-block {
          width: 290px;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          border-radius: 4px;
          padding: 12px;
          border: 1px solid #e2e8f0;
        }

        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }

        .summary-table td {
          font-size: 10.5px;
          padding: 6px 0;
          border: none;
          vertical-align: middle;
        }

        .summary-table td.label {
          color: #475569;
          text-align: left;
          font-weight: 600;
        }

        .summary-table td.value {
          font-weight: 500;
          color: #0f172a;
          text-align: right;
        }

        .summary-table tr.total-row td {
          border-top: 2px solid #0f172a;
          padding: 10px 0 4px 0;
          font-weight: 700;
          color: #0f172a;
        }
        
        .summary-table tr.total-row td.label {
          font-size: 12px;
          color: #0f172a;
        }

        .summary-table tr.total-row td.value {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .summary-gap {
          height: 12px;
        }

        .terms-section {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 14px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .terms-title {
          font-size: 10px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }

        .terms-text {
          font-family: inherit;
          font-size: 9px;
          color: #475569;
          white-space: pre-wrap;
          line-height: 1.5;
          margin: 0;
        }

        .footer-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9.5px;
          color: #64748b;
          margin-top: auto;
          page-break-inside: avoid;
        }

        /* Action bar */
        .no-print-bar {
          background-color: #111827;
          color: #ffffff;
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: sans-serif;
          font-size: 13px;
          width: 100%;
          box-sizing: border-box;
        }
        .no-print-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn-primary {
          background: #22c55e;
          border: none;
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        .action-btn-secondary {
          background: #4b5563;
          border: none;
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>

      {/* Navigation Print Actions (invisible on printed sheet) */}
      <div className="no-print-bar no-print">
        <span>Print Invoice Panel</span>
        <div className="no-print-actions">
          <button onClick={() => window.print()} className="action-btn-primary">Print Now</button>
          <button onClick={() => window.close()} className="action-btn-secondary">Close Tab</button>
        </div>
      </div>

      {/* Invoice Layout */}
      <div className="invoice-wrapper">
        
        {/* Invoice Header */}
        <div className="header">
          <div className="header-left">
            <h1 className="doc-type-title">{isQuotation ? "QUOTATION" : "INVOICE"}</h1>
            <h2 className="shop-name">{shopSettings.name}</h2>
            <p className="shop-sub">{shopSettings.addressLine1}</p>
            <p className="shop-sub">{shopSettings.addressLine2}</p>
            <p className="shop-sub">{shopSettings.addressLine3}</p>
            
            <table className="shop-contact-table">
              <tbody>
                <tr>
                  <td className="label">Phone:</td>
                  <td className="value">{shopSettings.phone}</td>
                </tr>
                <tr>
                  <td className="label">Email:</td>
                  <td className="value">{shopSettings.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="header-right">
            <img 
              src={shopSettings.logoUrl} 
              alt={shopSettings.name} 
              className="logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Separator line matching image */}
        <div className="separator-line"></div>

        {/* Client Profile & Metadata Grid */}
        <div className="meta-grid">
          <div className="client-section">
            <table className="client-detail-table">
              <tbody>
                <tr>
                  <td colSpan="2" className="section-label">Bill to</td>
                </tr>
                <tr>
                  <td colSpan="2" className="client-name">{data.customers?.name || "Walk-in Customer"}</td>
                </tr>
                {data.customers?.phone ? (
                  <tr>
                    <td className="label">Phone:</td>
                    <td className="value">{data.customers.phone}</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="label">&nbsp;</td>
                    <td className="value">&nbsp;</td>
                  </tr>
                )}
                {data.customers?.address ? (
                  <tr>
                    <td className="label">Address:</td>
                    <td className="value">{data.customers.address}</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="label">&nbsp;</td>
                    <td className="value">&nbsp;</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="invoice-meta-section">
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="label">{isQuotation ? "Quotation No.:" : "Invoice No.:"}</td>
                  <td className="value">{isQuotation ? data.quotation_number : data.order_number}</td>
                </tr>
                <tr>
                  <td className="label">Date:</td>
                  <td className="value">{formattedDate}</td>
                </tr>
                <tr>
                  <td className="label">Due date:</td>
                  <td className="value">{formattedDate}</td>
                </tr>
                {!isQuotation && (
                  <tr>
                    <td className="label">Payment status:</td>
                    <td className="value">{getPaymentStatus()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Listing table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th>Item</th>
              <th style={{ width: "80px" }}>Quantity</th>
              <th style={{ width: "100px" }}>Unit price</th>
              <th style={{ width: "60px" }}>Tax</th>
              <th style={{ width: "80px" }}>Discount</th>
              <th style={{ width: "110px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td style={{ textAlign: "left" }}>{item.name}</td>
                <td style={{ textAlign: "right" }}>{item.qty}</td>
                <td style={{ textAlign: "right" }}>{formatNumber(item.price)}</td>
                <td style={{ textAlign: "center" }}>---</td>
                <td style={{ textAlign: "right" }}>
                  {item.discount_type === "percentage" ? (
                    `${Number(item.discount_value || 0).toFixed(0)}%`
                  ) : item.discount_type === "fixed" ? (
                    `Rs${Number(item.discount_value || 0).toFixed(0)}`
                  ) : (
                    item.discount_value && Number(item.discount_value) > 0 ? (
                      `Rs${Number(item.discount_value).toFixed(0)}`
                    ) : "---"
                  )}
                </td>
                <td style={{ textAlign: "right" }}>{formatNumber(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Invoice Summary */}
        <div className="summary-section">
          <div className="summary-block">
            <table className="summary-table">
              <tbody>
                <tr className="total-row">
                  <td className="label">Total</td>
                  <td className="value">{formatCurrency(data.total_amount)}</td>
                </tr>
                
                {/* Visual Gap matching image */}
                <tr className="summary-gap"><td colSpan="2"></td></tr>

                {!isQuotation && (
                  <>
                    <tr>
                      <td className="label" style={{ fontWeight: "bold" }}>Payment method:</td>
                      <td className="value" style={{ fontWeight: "bold", textAlign: "right" }}>
                        {getPaymentMethodLabel() !== "Pending Payment" && getPaymentMethodLabel() !== "N/A" ? getPaymentMethodLabel() : ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Payment Pending:</td>
                      <td className="value" style={{ textAlign: "right" }}>{formatCurrency(data.balance_amount)}</td>
                    </tr>
                    <tr>
                      <td className="label">Paid amount:</td>
                      <td className="value" style={{ fontWeight: "bold", textAlign: "right" }}>{formatCurrency(data.paid_amount)}</td>
                    </tr>
                    <tr>
                      <td className="label" style={{ fontWeight: "bold" }}>Amount due:</td>
                      <td className="value" style={{ fontWeight: "bold", textAlign: "right" }}>{formatCurrency(data.balance_amount)}</td>
                    </tr>

                    {/* Outstanding balances for registered customers */}
                    {!isWalkIn && (
                      <>
                        <tr style={{ borderTop: "1px dashed #bcbcbc" }}>
                          <td className="label" style={{ paddingTop: "6px" }}>Prev Outstanding:</td>
                          <td className="value" style={{ paddingTop: "6px", textAlign: "right" }}>{formatCurrency(previousOutstanding)}</td>
                        </tr>
                        <tr>
                          <td className="label" style={{ fontWeight: "bold" }}>Total Outstanding:</td>
                          <td className="value" style={{ fontWeight: "bold", textAlign: "right" }}>
                            {formatCurrency(totalOutstanding)}
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms and Conditions block */}
        <div className="terms-section">
          <div className="terms-title">Terms and Conditions</div>
          <pre className="terms-text">{shopSettings.terms}</pre>
        </div>

        {/* Invoice Footer Centered */}
        <div className="footer-section">
          <span>{shopSettings.footerInfo}</span>
          <span>Page 1</span>
        </div>

      </div>
    </div>
  );
};
