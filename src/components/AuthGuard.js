"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signOut: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const isPublicPath = 
        pathname === "/login" || 
        pathname?.startsWith("/portal") || 
        pathname?.includes("/print");

      if (error || !session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        if (!isPublicPath) {
          router.push("/login");
        }
        return;
      }

      setUser(session.user);

      // Fetch user profile from profiles table
      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError || !data) {
          // Determine the user's role:
          // 1. If email contains 'owner', or 2. If this is the very first profile in the database, assign 'owner'.
          // Otherwise, assign 'staff'.
          const { data: existingProfiles } = await supabase
            .from("profiles")
            .select("id")
            .limit(1);
          
          const isFirstProfile = !existingProfiles || existingProfiles.length === 0;
          const isOwnerEmail = session.user.email?.toLowerCase().includes("owner");
          const assignedRole = (isFirstProfile || isOwnerEmail) ? "owner" : "staff";

          const defaultUsername = session.user.email ? session.user.email.split("@")[0] : "user";
          // Try to create profile
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              username: defaultUsername,
              full_name: defaultUsername.charAt(0).toUpperCase() + defaultUsername.slice(1),
              role: assignedRole,
              passcode: "1234",
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
          } else {
            console.error("Failed to insert default profile:", insertError);
            // Fallback object in state
            setProfile({ id: session.user.id, username: defaultUsername, role: assignedRole });
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        // Re-fetch profile
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function AuthGuard({ children, requiredRoles = [] }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && requiredRoles.length > 0 && profile) {
        if (!requiredRoles.includes(profile.role)) {
          // User doesn't have permissions - redirect to dashboard
          router.push("/dashboard");
        }
      }
    }
  }, [user, profile, loading, router, pathname, requiredRoles]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>PRINT X Security Verification...</div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  if (user && requiredRoles.length > 0 && profile && !requiredRoles.includes(profile.role)) {
    return null;
  }

  return children;
}

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "var(--bg-deep)",
    gap: "20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--primary)",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "var(--text-muted)",
    fontSize: "14px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
};
