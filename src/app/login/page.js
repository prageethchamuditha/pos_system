"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    }
    checkUser();
  }, [router]);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    let email = usernameOrEmail.trim();
    if (!email.includes("@")) {
      email = `${email.toLowerCase()}@printx.lk`;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check if logged in with default temporary password
      if (password === "1234" || password === "123456") {
        localStorage.setItem("printx_must_change_password", "true");
      } else {
        localStorage.removeItem("printx_must_change_password");
      }

      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setErrorMsg("");
    const email = role === "owner" ? "owner@printx.lk" : "staff@printx.lk";
    const pass = role === "owner" ? "owner123" : "staff123";

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        throw new Error(error.message);
      }

      // Demo credentials do not require force password change
      localStorage.removeItem("printx_must_change_password");

      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div className="glass-panel-elevated animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>X</div>
          <h1 style={styles.title}>PRINT X</h1>
          <p style={styles.subtitle}>Point of Sale Management Portal</p>
        </div>

        <form onSubmit={handleAuthAction} style={styles.form}>
          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
          {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username or Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. staff01 or manager@printx.lk"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign In to POS"}
          </button>
        </form>

        <div style={styles.demoSection}>
          <div style={styles.demoDivider}>
            <span style={styles.dividerText}>Demo Quick Access</span>
          </div>
          <div style={styles.demoButtonsRow}>
            <button
              onClick={() => handleQuickLogin("owner")}
              className="btn btn-secondary"
              style={styles.demoBtn}
              disabled={loading}
            >
              👑 Owner Login
            </button>
            <button
              onClick={() => handleQuickLogin("staff")}
              className="btn btn-secondary"
              style={styles.demoBtn}
              disabled={loading}
            >
              💼 Staff Login
            </button>
          </div>
        </div>
        
        <div style={styles.footer}>
          <p>Protected by PRINT X Secure Gateway</p>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px 30px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  logoBadge: {
    width: "50px",
    height: "50px",
    borderRadius: "var(--radius-md)",
    background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "24px",
    color: "#ffffff",
    boxShadow: "0 0 20px 0 var(--primary-glow)",
    marginBottom: "10px",
  },
  title: {
    fontSize: "28px",
    background: "linear-gradient(135deg, #ffffff 0%, var(--text-muted) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  submitBtn: {
    width: "100%",
    marginTop: "10px",
    height: "46px",
  },
  errorAlert: {
    background: "var(--accent-red-glow)",
    color: "var(--accent-red)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  successAlert: {
    background: "var(--accent-green-glow)",
    color: "var(--accent-green)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  demoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "4px",
  },
  demoDivider: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    color: "var(--text-subtle)",
    fontSize: "12px",
  },
  dividerText: {
    width: "100%",
    borderBottom: "1px solid var(--border)",
    lineHeight: "0.1em",
    margin: "10px 0 20px",
  },
  demoButtonsRow: {
    display: "flex",
    gap: "12px",
  },
  demoBtn: {
    flex: 1,
    fontSize: "13px",
    height: "42px",
    padding: "0 10px",
    background: "var(--bg-surface-elevated)",
    borderColor: "var(--border)",
  },
  footer: {
    textAlign: "center",
    fontSize: "11px",
    color: "var(--text-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: "8px",
  },
};
