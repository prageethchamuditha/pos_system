"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function redirectRoute() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    }
    redirectRoute();
  }, [router]);

  return (
    <main style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>Directing to Portal...</p>
    </main>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "var(--bg-deep)",
    gap: "16px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  text: {
    color: "var(--text-muted)",
    fontSize: "14px",
    letterSpacing: "0.05em",
  },
};
