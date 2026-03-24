import { supabase } from "./supabase";

export type Carrier = {
  id: string;
  name: string;
  code: string;
  contact_name?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  notes: string | null;
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CarrierCreateInput = {
  name: string;
  code: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  notes?: string | null;
  active?: boolean;
  user_id: string;
};

export type CarrierUpdateInput = Partial<Omit<CarrierCreateInput, "user_id">>;

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getCarriers(userId: string) {
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as Carrier[], error: formatError(error) };
  }

  return { data: (data ?? []) as Carrier[], error: null };
}

export async function getCarrier(id: string, userId: string) {
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as Carrier | null, error: formatError(error) };
  }

  return { data: (data ?? null) as Carrier | null, error: null };
}

export async function createCarrier(payload: CarrierCreateInput) {
  const { data, error } = await supabase
    .from("carriers")
    .insert({
      ...payload,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as Carrier | null, error: formatError(error) };
  }

  return { data: data as Carrier, error: null };
}

export async function updateCarrier(
  id: string,
  userId: string,
  updates: CarrierUpdateInput
) {
  const { data, error } = await supabase
    .from("carriers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null as Carrier | null, error: formatError(error) };
  }

  return { data: data as Carrier, error: null };
}

export async function deleteCarrier(id: string, userId: string) {
  const { error } = await supabase
    .from("carriers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}
