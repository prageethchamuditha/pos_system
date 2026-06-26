"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AuthGuard, useAuth } from "@/components/AuthGuard";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  BarChart2,
  DollarSign
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";

function SidebarNav({ filteredNav, pathname, setMobileMenuOpen }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  return (
    <nav style={styles.navSection}>
      {filteredNav.map((item) => {
        const Icon = item.icon;
        
        let isActive = false;
        if (item.href.includes("?tab=")) {
          const targetTab = item.href.split("?tab=")[1];
          isActive = pathname === "/reports" && currentTab === targetTab;
        } else if (item.href === "/reports") {
          isActive = pathname === "/reports" && currentTab !== "outstanding";
        } else {
          isActive = pathname.startsWith(item.href);
        }

        return (
          <Link 
            key={item.name} 
            href={item.href} 
            style={{
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {})
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon size={18} style={isActive ? styles.navIconActive : styles.navIcon} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AuthenticatedLayout({ children }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // First Login Force Password Change State
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [submittingPass, setSubmittingPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const flag = localStorage.getItem("printx_must_change_password");
      setMustChangePassword(flag === "true");
    }
  }, []);

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (newPass.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    
    if (newPass !== confirmPass) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    
    setSubmittingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      
      localStorage.removeItem("printx_must_change_password");
      setMustChangePassword(false);
      alert("Password updated successfully! Welcome to PRINT X POS.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update password. Try again.");
    } finally {
      setSubmittingPass(false);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] },
    { name: "POS Billing", href: "/pos", icon: ShoppingCart, roles: ["owner", "manager", "staff"] },
    { name: "Orders", href: "/orders", icon: Receipt, roles: ["owner", "manager", "staff"] },
    { name: "Quotations", href: "/quotations", icon: FileSpreadsheet, roles: ["owner", "manager", "staff"] },
    { name: "Customers", href: "/customers", icon: Users, roles: ["owner", "manager", "staff"] },
    { name: "Teacher Balances", href: "/reports?tab=outstanding", icon: DollarSign, roles: ["owner", "manager"] },
    { name: "Reports", href: "/reports", icon: BarChart2, roles: ["owner", "manager"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["owner", "manager", "staff"] },
  ];

  const filteredNav = navigation.filter(
    (item) => profile && item.roles.includes(profile.role)
  );

  const isPOS = pathname === "/pos";

  if (mustChangePassword) {
    return (
      <div style={styles.blockerContainer}>
        <div className="glass-panel-elevated animate-fade-in" style={styles.blockerCard}>
          <div style={styles.blockerHeader}>
            <div style={styles.logoBadge}>X</div>
            <h2 style={styles.blockerTitle}>Security Update Required</h2>
            <p style={styles.blockerSubtitle}>
              You are logged in with a temporary default password. For security, you must configure a secure personal password before you can access the system.
            </p>
          </div>
          
          <form onSubmit={handleForceChangePassword} style={styles.blockerForm}>
            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>New Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="input-field"
                required
                disabled={submittingPass}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="input-field"
                required
                disabled={submittingPass}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", height: "46px", marginTop: "8px" }}
              disabled={submittingPass}
            >
              {submittingPass ? "Updating Password..." : "Update & Proceed"}
            </button>
          </form>
          
          <button 
            type="button" 
            onClick={signOut} 
            className="btn btn-secondary" 
            style={{ width: "100%", height: "42px", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
          >
            Cancel & Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div style={styles.appContainer}>
        {/* Mobile Header (Hidden on POS) */}
        {!isPOS && (
          <header style={styles.mobileHeader} className="app-mobile-header no-print">
            <div style={styles.mobileLogoSection}>
              <div style={styles.logoBadgeSmall}>X</div>
              <span style={styles.mobileLogoText}>PRINT X POS</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              style={styles.menuToggleBtn}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>
        )}

        {/* Sidebar Container (Hidden on POS) */}
        {!isPOS && (
          <aside 
            style={styles.sidebar}
            className={`app-sidebar glass-panel no-print ${mobileMenuOpen ? "mobile-open" : ""}`}
          >
            <div style={styles.logoSection}>
              <div style={styles.logoBadge}>X</div>
              <div style={styles.logoTextGroup}>
                <span style={styles.logoTextMain}>PRINT X</span>
                <span style={styles.logoTextSub}>Point of Sale</span>
              </div>
            </div>

            <Suspense fallback={<nav style={styles.navSection} />}>
              <SidebarNav 
                filteredNav={filteredNav} 
                pathname={pathname} 
                setMobileMenuOpen={setMobileMenuOpen} 
              />
            </Suspense>

            <div style={styles.profileSection}>
              <div style={styles.profileInfo}>
                <div style={styles.avatar}>
                  <User size={16} />
                </div>
                <div style={styles.profileDetails}>
                  <span style={styles.profileUsername}>{profile?.username || "Staff"}</span>
                  <span style={styles.profileRole}>{profile?.role?.toUpperCase() || "STAFF"}</span>
                </div>
              </div>
              <button onClick={signOut} style={styles.logoutBtn} title="Sign Out">
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        )}

        {/* Backdrop for mobile */}
        {mobileMenuOpen && !isPOS && (
          <div 
            style={styles.mobileBackdrop} 
            onClick={() => setMobileMenuOpen(false)}
            className="no-print"
          />
        )}

        {/* Main Content Area */}
        <main 
          style={{
            ...styles.mainContent,
            ...(isPOS ? { paddingLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0 } : {})
          }}
          className={isPOS ? "" : "app-main-content"}
        >
          <div 
            style={{
              ...styles.contentWrapper,
              ...(isPOS ? { maxWidth: "100%", margin: 0, height: "100vh" } : {})
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    position: "relative",
  },
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    backgroundColor: "rgba(11, 15, 25, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    zIndex: 100,
    padding: "0 20px",
    alignItems: "center",
    justifyContent: "between",
    "@media (maxWidth: 991px)": {
      display: "flex",
    }
  },
  mobileLogoSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoBadgeSmall: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
    color: "#ffffff",
  },
  mobileLogoText: {
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
  },
  menuToggleBtn: {
    background: "none",
    border: "none",
    color: "var(--text-main)",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "var(--radius-sm)",
  },
  sidebar: {
    width: "260px",
    position: "fixed",
    top: "20px",
    bottom: "20px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    padding: "24px 20px",
    zIndex: 90,
    transition: "left 0.3s ease",
    borderRadius: "var(--radius-lg)",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
    paddingLeft: "8px",
  },
  logoBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "var(--radius-sm)",
    background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
    color: "#ffffff",
    boxShadow: "0 0 16px 0 var(--primary-glow)",
  },
  logoTextGroup: {
    display: "flex",
    flexDirection: "column",
  },
  logoTextMain: {
    fontSize: "18px",
    fontWeight: "800",
    letterSpacing: "-0.01em",
  },
  logoTextSub: {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingTop: "12px",
    paddingBottom: "12px",
    paddingLeft: "16px",
    paddingRight: "16px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    fontSize: "14px",
    fontWeight: "500",
    transition: "var(--transition-fast)",
    cursor: "pointer",
  },
  navLinkActive: {
    background: "var(--primary-glow)",
    color: "var(--text-main)",
    borderLeft: "3px solid var(--primary)",
    paddingLeft: "13px",
  },
  navIcon: {
    color: "var(--text-subtle)",
    transition: "var(--transition-fast)",
  },
  navIconActive: {
    color: "var(--primary)",
  },
  profileSection: {
    borderTop: "1px solid var(--border)",
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  profileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingLeft: "8px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--bg-surface-elevated)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
  },
  profileDetails: {
    display: "flex",
    flexDirection: "column",
  },
  profileUsername: {
    fontSize: "13px",
    fontWeight: "600",
  },
  profileRole: {
    fontSize: "10px",
    color: "var(--primary)",
    fontWeight: "700",
    letterSpacing: "0.05em",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "hsl(350, 80%, 55%)",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "var(--transition-fast)",
  },
  mobileBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 85,
  },
  mainContent: {
    flex: 1,
    paddingLeft: "300px", // Sidebar width (260) + spacing (40)
    paddingTop: "20px",
    paddingBottom: "20px",
    paddingRight: "20px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  blockerContainer: {
    display: "flex",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--bg-deep)",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  blockerCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
  },
  blockerHeader: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  blockerTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-main)",
    marginTop: "8px",
  },
  blockerSubtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    lineHeight: "1.5",
  },
  blockerForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  errorAlert: {
    background: "var(--accent-red-glow)",
    color: "var(--accent-red)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: "13px",
    lineHeight: "1.4",
  },
};
