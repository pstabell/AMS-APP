"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import { getCurrentUser, login as loginUser, logout as logoutUser, signup as signupUser } from "@/lib/auth";
import { canAccessFloor2, type Floor, type UserRole } from "@/lib/roles";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  currentFloor: Floor;
  login: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  signup: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  logout: () => Promise<void>;
  switchFloor: (floor: Floor) => void;
  canSwitchToFloor2: boolean;
  // Agency helpers
  agencyId: string | null;
  agencyName: string | null;
  userRole: UserRole;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const FLOOR_STORAGE_KEY = 'ams_current_floor';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFloor, setCurrentFloor] = useState<Floor>(1);

  useEffect(() => {
    // Ensure we're in the browser before accessing localStorage or user data
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load saved floor preference
    try {
      const savedFloor = localStorage.getItem(FLOOR_STORAGE_KEY);
      if (savedFloor && (savedFloor === '1' || savedFloor === '2')) {
        const floor = parseInt(savedFloor) as Floor;
        // Only allow floor 2 if user has appropriate role
        if (floor === 2 && currentUser && canAccessFloor2(currentUser.role)) {
          setCurrentFloor(2);
        } else {
          setCurrentFloor(1);
        }
      }
    } catch (error) {
      // Handle localStorage access errors gracefully
      console.warn('Failed to access localStorage:', error);
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await loginUser(email, password);
    setUser(result.user);
    setLoading(false);
    return result;
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    const result = await signupUser(email, password);
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    await logoutUser();
    setUser(null);
    setCurrentFloor(1); // Reset to floor 1 on logout
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(FLOOR_STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
    setLoading(false);
  };

  const switchFloor = (floor: Floor) => {
    // Only allow floor 2 if user has appropriate role
    if (floor === 2 && (!user || !canAccessFloor2(user.role))) {
      return;
    }
    
    setCurrentFloor(floor);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FLOOR_STORAGE_KEY, floor.toString());
      } catch (error) {
        console.warn('Failed to save floor preference:', error);
      }
    }
  };

  const canSwitchToFloor2 = user ? canAccessFloor2(user.role) : false;

  const value = useMemo(
    () => ({
      user,
      loading,
      currentFloor,
      login,
      signup,
      logout,
      switchFloor,
      canSwitchToFloor2,
      agencyId: user?.agency_id ?? null,
      agencyName: user?.agency_name ?? null,
      userRole: (user?.role ?? 'agent') as UserRole,
    }),
    [user, loading, currentFloor, canSwitchToFloor2]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
