import { supabase } from "./supabase";

export type ColumnMapping = {
  id: string;
  name: string;
  carrier_id: string | null;
  carrier_name: string | null;
  mappings: Record<string, string>;
  is_default: boolean;
  active: boolean;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ColumnMappingCreateInput = {
  name: string;
  carrier_id?: string | null;
  carrier_name?: string | null;
  mappings: Record<string, string>;
  is_default?: boolean;
  active?: boolean;
  notes?: string | null;
  user_id: string;
};

export type ColumnMappingUpdateInput = Partial<Omit<ColumnMappingCreateInput, "user_id">>;

// Standard policy fields that can be mapped
export const POLICY_FIELDS = [
  { key: 'customer', label: 'Customer Name', required: true },
  { key: 'policy_number', label: 'Policy Number', required: true },
  { key: 'carrier', label: 'Carrier', required: true },
  { key: 'mga', label: 'MGA', required: false },
  { key: 'line_of_business', label: 'Line of Business', required: false },
  { key: 'premium_sold', label: 'Premium', required: true },
  { key: 'policy_gross_comm_pct', label: 'Gross Comm %', required: true },
  { key: 'agency_estimated_comm', label: 'Agency Commission', required: false },
  { key: 'transaction_type', label: 'Transaction Type', required: true },
  { key: 'effective_date', label: 'Effective Date', required: true },
  { key: 'policy_origination_date', label: 'Origination Date', required: false },
  { key: 'expiration_date', label: 'Expiration Date', required: false },
  { key: 'statement_date', label: 'Statement Date', required: false },
  { key: 'invoice_number', label: 'Invoice Number', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getColumnMappings(userId: string) {
  const { data, error } = await supabase
    .from("column_mappings")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    return { data: [] as ColumnMapping[], error: formatError(error) };
  }

  return { data: (data ?? []) as ColumnMapping[], error: null };
}

export async function getColumnMapping(id: string, userId: string) {
  const { data, error } = await supabase
    .from("column_mappings")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as ColumnMapping | null, error: formatError(error) };
  }

  return { data: (data ?? null) as ColumnMapping | null, error: null };
}

export async function createColumnMapping(payload: ColumnMappingCreateInput) {
  const { data, error } = await supabase
    .from("column_mappings")
    .insert({
      ...payload,
      is_default: payload.is_default ?? false,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as ColumnMapping | null, error: formatError(error) };
  }

  return { data: data as ColumnMapping, error: null };
}

export async function updateColumnMapping(
  id: string,
  userId: string,
  updates: ColumnMappingUpdateInput
) {
  const { data, error } = await supabase
    .from("column_mappings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null as ColumnMapping | null, error: formatError(error) };
  }

  return { data: data as ColumnMapping, error: null };
}

export async function deleteColumnMapping(id: string, userId: string) {
  const { error } = await supabase
    .from("column_mappings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}

// Default column mapping template
export const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
  customer: 'Insured Name',
  policy_number: 'Policy Number',
  carrier: 'Carrier',
  mga: 'MGA',
  line_of_business: 'Line of Business',
  premium_sold: 'Premium',
  policy_gross_comm_pct: 'Commission %',
  agency_estimated_comm: 'Agency Commission',
  transaction_type: 'Transaction Type',
  effective_date: 'Effective Date',
  policy_origination_date: 'Origination Date',
  expiration_date: 'Expiration Date',
  statement_date: 'Statement Date',
  invoice_number: 'Invoice Number',
  notes: 'Notes',
};
