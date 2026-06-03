"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/supabase/client";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock mode — no Supabase configured
    if (!supabaseConfigured || !supabase) {
      const savedUser = localStorage.getItem("active_mock_user");
      if (savedUser) setUser(JSON.parse(savedUser));
      setLoading(false);
      return;
    }

    // Fetch profile from Supabase profiles table
    const fetchProfile = async (userId: string, email: string | null) => {
      try {
        const { data } = await supabase!
          .from("profiles")
          .select("display_name, role")
          .eq("id", userId)
          .single();

        setUser({
          uid: userId,
          email,
          displayName: data?.display_name || email?.split("@")[0] || "User",
          role: data?.role || "user",
        });
      } catch {
        setUser({ uid: userId, email, displayName: email?.split("@")[0] || "User", role: "user" });
      }
    };

    // Get current session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? null).finally(() =>
          setLoading(false)
        );
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email ?? null);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        // Mock Login Mode
        const usersStr = localStorage.getItem("mock_users") || "[]";
        const users: AuthUser[] = JSON.parse(usersStr);
        const matched = users.find((u) => u.email === email.toLowerCase().trim());
        if (!matched) throw { code: "auth/user-not-found", message: "User account not found." };
        setUser(matched);
        localStorage.setItem("active_mock_user", JSON.stringify(matched));
      } else {
        const { error } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        // Mock Registration Mode
        const usersStr = localStorage.getItem("mock_users") || "[]";
        const users: AuthUser[] = JSON.parse(usersStr);
        const exists = users.some((u) => u.email === email.toLowerCase().trim());
        if (exists) throw { code: "auth/email-already-in-use", message: "Email already registered." };

        const newUser: AuthUser = {
          uid: "mock-" + Math.random().toString(36).substring(2, 11),
          email: email.toLowerCase().trim(),
          displayName: fullName.trim(),
          role: email.toLowerCase().includes("admin") ? "admin" : "user",
        };
        users.push(newUser);
        localStorage.setItem("mock_users", JSON.stringify(users));
        setUser(newUser);
        localStorage.setItem("active_mock_user", JSON.stringify(newUser));
      } else {
        const { data, error } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: fullName.trim() } },
        });
        if (error) throw error;

        // Insert profile row
        if (data.user) {
          await supabase!.from("profiles").insert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            display_name: fullName.trim(),
            role: "user",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) {
        setUser(null);
        localStorage.removeItem("active_mock_user");
      } else {
        await supabase!.auth.signOut();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
