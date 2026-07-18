import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zmwRate, setZmwRate] = useState(0.42);
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Fetch live exchange rate
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "zmw_rate")
      .single()
      .then(({ data }) => {
        if (data) {
          setZmwRate(Number(data.value));
          setRateUpdatedAt(data.updated_at);
        }
      });

    const ch = supabase
      .channel("app-settings-rate")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings", filter: "key=eq.zmw_rate" },
        (p) => { setZmwRate(Number(p.new.value)); setRateUpdatedAt(p.new.updated_at); })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error) setProfile(data);
  }, []);

  // Auth state — also handles PASSWORD_RECOVERY event for forgot-password flow
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile(session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setSession(session);
        setLoading(false);
        return;
      }
      setSession(session);
      fetchProfile(session?.user?.id);
      if (event === "SIGNED_IN") setRecoveryMode(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  // Realtime balance updates
  useEffect(() => {
    if (!session?.user?.id) return;
    const ch = supabase
      .channel("profile-balance-" + session.user.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        (p) => setProfile(p.new))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.user?.id]);

  const refreshProfile = () => fetchProfile(session?.user?.id);

  const signUp = async ({ email, password, fullName }) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });

  const signIn = async ({ email, password }) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => supabase.auth.signOut();

  const sendPasswordReset = async (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword });
    if (!result.error) setRecoveryMode(false);
    return result;
  };

  return (
    <AuthContext.Provider value={{
      session, profile, loading, zmwRate, rateUpdatedAt, recoveryMode,
      signUp, signIn, signOut, refreshProfile, sendPasswordReset, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
