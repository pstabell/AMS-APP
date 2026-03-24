import { supabase } from "./supabase";

export type AgentContact = {
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

export type AgentCreateInput = {
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  active?: boolean;
  user_id: string;
};

export type AgentUpdateInput = Partial<Omit<AgentCreateInput, "user_id">>;

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getAgents(userId: string) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as AgentContact[], error: formatError(error) };
  }

  return { data: (data ?? []) as AgentContact[], error: null };
}

export async function getAgent(id: string, userId: string) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as AgentContact | null, error: formatError(error) };
  }

  return { data: (data ?? null) as AgentContact | null, error: null };
}

export async function createAgent(payload: AgentCreateInput) {
  const { data, error } = await supabase
    .from("agents")
    .insert({
      ...payload,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as AgentContact | null, error: formatError(error) };
  }

  return { data: data as AgentContact, error: null };
}

export async function updateAgent(
  id: string,
  userId: string,
  updates: AgentUpdateInput
) {
  const { data, error } = await supabase
    .from("agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null as AgentContact | null, error: formatError(error) };
  }

  return { data: data as AgentContact, error: null };
}

export async function deleteAgent(id: string, userId: string) {
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}
