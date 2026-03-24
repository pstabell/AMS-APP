import { supabase } from "./supabase";

export type Policy = {
  id: string;
  customer: string;
  policy_number: string;
  carrier: string;
  mga: string | null;
  line_of_business: string | null;
  premium_sold: number;
  policy_gross_comm_pct: number;
  agency_estimated_comm: number;
  agent_estimated_comm: number | null;
  agent_paid_amount: number | null;
  transaction_type: string;
  effective_date: string;
  policy_origination_date: string | null;
  expiration_date: string | null;
  statement_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  user_email: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  // Reconciliation fields
  reconciliation_status?: string | null;
  is_reconciled?: boolean;
};

export type PolicyCreateInput = {
  customer: string;
  policy_number: string;
  carrier: string;
  mga?: string | null;
  line_of_business?: string | null;
  premium_sold: number;
  policy_gross_comm_pct: number;
  agency_estimated_comm: number;
  agent_estimated_comm?: number | null;
  agent_paid_amount?: number | null;
  transaction_type: string;
  effective_date: string;
  policy_origination_date?: string | null;
  expiration_date?: string | null;
  statement_date?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  user_email: string;
  user_id: string;
};

export type PolicyUpdateInput = Partial<
  Omit<PolicyCreateInput, "user_email" | "user_id">
>;

type GetPoliciesParams = {
  userEmail: string;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: keyof Policy;
  orderDirection?: "asc" | "desc";
};

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getPolicies({
  userEmail,
  search,
  page = 1,
  pageSize = 10,
  orderBy = "effective_date",
  orderDirection = "desc",
}: GetPoliciesParams) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("policies")
    .select("*", { count: "exact" })
    .eq("user_email", userEmail)
    .order(orderBy as string, { ascending: orderDirection === "asc" })
    .range(from, to);

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      query = query.or(
        `customer.ilike.%${trimmed}%,policy_number.ilike.%${trimmed}%`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: [] as Policy[], count: 0, error: formatError(error) };
  }

  return { data: (data ?? []) as Policy[], count: count ?? 0, error: null };
}

export async function getPolicy(id: string, userEmail: string) {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("id", id)
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    return { data: null as Policy | null, error: formatError(error) };
  }

  return { data: (data ?? null) as Policy | null, error: null };
}

export async function createPolicy(payload: PolicyCreateInput) {
  const { data, error } = await supabase
    .from("policies")
    .insert({
      ...payload,
      agent_estimated_comm: payload.agent_estimated_comm ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as Policy | null, error: formatError(error) };
  }

  return { data: data as Policy, error: null };
}

export async function updatePolicy(
  id: string,
  userEmail: string,
  updates: PolicyUpdateInput
) {
  const { data, error } = await supabase
    .from("policies")
    .update(updates)
    .eq("id", id)
    .eq("user_email", userEmail)
    .select("*")
    .single();

  if (error) {
    return { data: null as Policy | null, error: formatError(error) };
  }

  return { data: data as Policy, error: null };
}

export async function deletePolicy(id: string, userEmail: string) {
  const { error } = await supabase
    .from("policies")
    .delete()
    .eq("id", id)
    .eq("user_email", userEmail);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}

// Policy Revenue Ledger functions

export type PRLFilters = {
  userEmail: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  carrier?: string | null;
  transactionType?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
};

export type PRLSummary = {
  totalPolicies: number;
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  totalPaid: number;
  totalBalance: number;
};

export async function getPoliciesForPRL({
  userEmail,
  dateFrom,
  dateTo,
  carrier,
  transactionType,
  search,
  page = 1,
  pageSize = 25,
}: PRLFilters) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("policies")
    .select("*", { count: "exact" })
    .eq("user_email", userEmail)
    .order("effective_date", { ascending: false })
    .range(from, to);

  if (dateFrom) {
    query = query.gte("effective_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("effective_date", dateTo);
  }
  if (carrier) {
    query = query.eq("carrier", carrier);
  }
  if (transactionType) {
    query = query.eq("transaction_type", transactionType);
  }
  if (search?.trim()) {
    query = query.or(
      `customer.ilike.%${search.trim()}%,policy_number.ilike.%${search.trim()}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: [] as Policy[], count: 0, error: formatError(error) };
  }

  return { data: (data ?? []) as Policy[], count: count ?? 0, error: null };
}

export async function getPRLSummary({
  userEmail,
  dateFrom,
  dateTo,
  carrier,
  transactionType,
}: Omit<PRLFilters, "page" | "pageSize" | "search">): Promise<{
  data: PRLSummary | null;
  error: string | null;
}> {
  let query = supabase
    .from("policies")
    .select(
      "premium_sold, agency_estimated_comm, agent_estimated_comm, agent_paid_amount"
    )
    .eq("user_email", userEmail);

  if (dateFrom) {
    query = query.gte("effective_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("effective_date", dateTo);
  }
  if (carrier) {
    query = query.eq("carrier", carrier);
  }
  if (transactionType) {
    query = query.eq("transaction_type", transactionType);
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: formatError(error) };
  }

  const summary: PRLSummary = {
    totalPolicies: data?.length ?? 0,
    totalPremium: 0,
    totalAgencyComm: 0,
    totalAgentComm: 0,
    totalPaid: 0,
    totalBalance: 0,
  };

  (data ?? []).forEach((row: any) => {
    summary.totalPremium += Number(row.premium_sold) || 0;
    summary.totalAgencyComm += Number(row.agency_estimated_comm) || 0;
    summary.totalAgentComm += Number(row.agent_estimated_comm) || 0;
    summary.totalPaid += Number(row.agent_paid_amount) || 0;
  });

  summary.totalBalance = summary.totalAgentComm - summary.totalPaid;

  return { data: summary, error: null };
}

export async function getDistinctCarriers(
  userEmail: string
): Promise<{ data: string[]; error: string | null }> {
  const { data, error } = await supabase
    .from("policies")
    .select("carrier")
    .eq("user_email", userEmail)
    .not("carrier", "is", null);

  if (error) {
    return { data: [], error: formatError(error) };
  }

  const carriers = [
    ...new Set((data ?? []).map((row: any) => row.carrier).filter(Boolean)),
  ].sort();

  return { data: carriers as string[], error: null };
}
