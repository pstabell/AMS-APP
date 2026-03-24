import { supabase } from "./supabase";

export type MGA = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type MGACreateInput = {
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  active?: boolean;
  user_id: string;
};

export type MGAUpdateInput = Partial<Omit<MGACreateInput, "user_id">>;

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getMGAs(userId: string) {
  const { data, error } = await supabase
    .from("mgas")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as MGA[], error: formatError(error) };
  }

  return { data: (data ?? []) as MGA[], error: null };
}

export async function getMGA(id: string, userId: string) {
  const { data, error } = await supabase
    .from("mgas")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as MGA | null, error: formatError(error) };
  }

  return { data: (data ?? null) as MGA | null, error: null };
}

export async function createMGA(payload: MGACreateInput) {
  const { data, error } = await supabase
    .from("mgas")
    .insert({
      ...payload,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as MGA | null, error: formatError(error) };
  }

  return { data: data as MGA, error: null };
}

export async function updateMGA(id: string, userId: string, updates: MGAUpdateInput) {
  const { data, error } = await supabase
    .from("mgas")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null as MGA | null, error: formatError(error) };
  }

  return { data: data as MGA, error: null };
}

export async function deleteMGA(id: string, userId: string) {
  const { error } = await supabase
    .from("mgas")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}
