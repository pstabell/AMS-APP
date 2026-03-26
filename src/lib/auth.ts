"use client";

import { supabase } from "./supabase";
import type { UserRole } from "./roles";
import bcrypt from "bcryptjs";

export type AuthUser = {
  id: string;
  email: string;
  subscription_status: string;
  password_set: boolean;
  created_at: string | null;
  role: UserRole;
  currentFloor: 1 | 2;
  // Agency context (null for solo agents)
  agency_id: string | null;
  agency_name: string | null;
  agent_id: string | null;
};

type AuthResult = {
  user: AuthUser | null;
  error: string | null;
};

const SESSION_COOKIE = "ams_session";
const SESSION_STORAGE_KEY = "ams_user";
const SESSION_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function encodeSession(user: AuthUser) {
  return btoa(JSON.stringify(user));
}

function decodeSession(payload: string) {
  try {
    return JSON.parse(atob(payload)) as AuthUser;
  } catch {
    return null;
  }
}

function setSession(user: AuthUser) {
  const payload = encodeSession(user);
  setCookie(SESSION_COOKIE, payload, SESSION_DAYS);
  localStorage.setItem(SESSION_STORAGE_KEY, payload);
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    const parsed = decodeSession(stored);
    if (parsed) return parsed;
  }

  const cookie = getCookie(SESSION_COOKIE);
  if (!cookie) return null;
  const parsed = decodeSession(cookie);
  if (!parsed) return null;
  localStorage.setItem(SESSION_STORAGE_KEY, cookie);
  return parsed;
}

/**
 * After authenticating credentials, look up the agents table
 * to find the user's agency membership and role.
 * Falls back to 'agent' role if not in any agency (solo agent).
 */
async function resolveAgencyContext(userId: string, email: string): Promise<{
  role: UserRole;
  agency_id: string | null;
  agency_name: string | null;
  agent_id: string | null;
}> {
  try {
    // Use server-side API route to bypass RLS on agents/agencies tables
    const response = await fetch(`/api/agency-context?user_id=${encodeURIComponent(userId)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        role: (data.role as UserRole) || "agent",
        agency_id: data.agency_id,
        agency_name: data.agency_name,
        agent_id: data.agent_id,
      };
    }
    return { role: "agent", agency_id: null, agency_name: null, agent_id: null };
  } catch {
    // If API call fails, fall back gracefully
    return { role: "agent", agency_id: null, agency_name: null, agent_id: null };
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from("users")
    .select("id, email, password_hash, password_set, subscription_status, created_at")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { user: null, error: "Unable to sign in. Please try again." };
  }

  if (!data) {
    return { user: null, error: "No account found for that email." };
  }

  const isValidPassword = await bcrypt.compare(password, data.password_hash);
  if (!isValidPassword) {
    return { user: null, error: "Incorrect password." };
  }

  if (data.subscription_status !== "active" && data.subscription_status !== "trialing") {
    return { user: null, error: "Your subscription is not active. Please start a free trial or contact support." };
  }

  // Resolve role from agents table (or fall back to solo agent)
  const agencyCtx = await resolveAgencyContext(data.id, data.email);

  const user: AuthUser = {
    id: data.id,
    email: data.email,
    subscription_status: data.subscription_status,
    password_set: data.password_set,
    created_at: data.created_at,
    role: agencyCtx.role,
    currentFloor: 1, // Always start on Floor 1
    agency_id: agencyCtx.agency_id,
    agency_name: agencyCtx.agency_name,
    agent_id: agencyCtx.agent_id,
  };

  setSession(user);
  return { user, error: null };
}

export async function signup(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return { user: null, error: "Unable to create account. Please try again." };
  }

  if (existing) {
    return { user: null, error: "An account already exists for that email." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if this email already went through Stripe checkout (paid before creating account)
  let subscriptionStatus = "inactive";
  let stripeCustomerId: string | null = null;
  try {
    const res = await fetch("/api/billing/check-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    if (res.ok) {
      const stripeData = await res.json();
      if (stripeData.status === "active" || stripeData.status === "trialing") {
        subscriptionStatus = stripeData.status;
        stripeCustomerId = stripeData.customerId || null;
      }
    }
  } catch {
    // If Stripe check fails, continue with inactive — webhook will catch up
  }

  const newUser: Record<string, unknown> = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password_hash: hashedPassword,
    password_set: true,
    subscription_status: subscriptionStatus,
    created_at: new Date().toISOString(),
  };
  if (stripeCustomerId) {
    newUser.stripe_customer_id = stripeCustomerId;
  }

  const { data, error } = await supabase
    .from("users")
    .insert(newUser)
    .select("id, email, password_set, subscription_status, created_at")
    .single();

  if (error || !data) {
    return { user: null, error: "Unable to create account. Please try again." };
  }

  const user: AuthUser = {
    id: data.id,
    email: data.email,
    subscription_status: data.subscription_status,
    password_set: data.password_set,
    created_at: data.created_at,
    role: "agent", // New signups are always solo agents
    currentFloor: 1,
    agency_id: null,
    agency_name: null,
    agent_id: null,
  };

  return { user, error: null };
}

export async function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearCookie(SESSION_COOKIE);
}
