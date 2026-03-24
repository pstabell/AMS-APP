import { supabase } from "./supabase";

/**
 * Database column name mapping (Supabase uses spaced/titled columns)
 */
const DB = {
  customer: "Customer",
  policyNumber: "Policy Number",
  carrier: "Carrier Name",
  mga: "MGA Name",
  lineOfBusiness: "Policy Type",
  premiumSold: "Premium Sold",
  policyGrossCommPct: "Policy Gross Comm %",
  agencyEstimatedComm: "Agent Estimated Comm $",
  agentEstimatedComm: "Agent Estimated Comm $",
  agentPaidAmount: "Agent Paid Amount (STMT)",
  effectiveDate: "Effective Date",
  expirationDate: "X-DATE",
  policyOriginationDate: "Policy Origination Date",
  statementDate: "STMT DATE",
  invoiceNumber: "Invoice Number",
  transactionType: "Transaction Type",
  notes: "NOTES",
  userEmail: "user_email",
};

/**
 * Map raw database record to snake_case format expected by the UI
 */
function mapTransaction(row: any): any {
  return {
    id: row._id || row.id,
    customer: row[DB.customer] || "—",
    policy_number: row[DB.policyNumber] || "—",
    carrier: row[DB.carrier] || "—",
    mga: row[DB.mga] || null,
    line_of_business: row[DB.lineOfBusiness] || null,
    premium_sold: Number(row[DB.premiumSold]) || 0,
    policy_gross_comm_pct: Number(row[DB.policyGrossCommPct]) || 0,
    agency_estimated_comm: Number(row[DB.agencyEstimatedComm]) || 0,
    agent_estimated_comm: Number(row[DB.agentEstimatedComm]) || 0,
    agent_paid_amount: Number(row[DB.agentPaidAmount]) || 0,
    transaction_type: row[DB.transactionType] || "NEW",
    effective_date: row[DB.effectiveDate] || "",
    policy_origination_date: row[DB.policyOriginationDate] || null,
    expiration_date: row[DB.expirationDate] || null,
    statement_date: row[DB.statementDate] || null,
    invoice_number: row[DB.invoiceNumber] || null,
    notes: row[DB.notes] || null,
    user_email: row[DB.userEmail] || "",
    // Pass through other fields
    ...row,
  };
}

/**
 * Customer - aggregated from policies table
 * Customers are identified by the 'Customer' field in policies
 */
export type Customer = {
  id: string;  // URL-safe encoded customer name
  name: string;
  policyCount: number;      // Unique policy numbers
  transactionCount: number; // Total transactions
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  latestEffectiveDate: string | null;
  carriers: string[];
};

/**
 * PolicyTerm - grouping of transactions by policy number
 * Each policy_number represents a "term" with multiple transactions
 */
export type PolicyTerm = {
  id: string;  // policy_number
  policyNumber: string;
  customer: string;
  carrier: string;
  lineOfBusiness: string | null;
  transactionCount: number;
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  totalPaid: number;
  balanceDue: number;
  latestEffectiveDate: string | null;
  earliestEffectiveDate: string | null;
  transactions: any[];
};

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * Encode customer name to URL-safe ID
 */
export function encodeCustomerId(customerName: string): string {
  return encodeURIComponent(customerName);
}

/**
 * Decode URL-safe ID to customer name
 */
export function decodeCustomerId(encodedId: string): string {
  return decodeURIComponent(encodedId);
}

type GetCustomersParams = {
  userEmail: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Get list of unique customers with aggregated stats
 */
export async function getCustomers({
  userEmail,
  search,
  page = 1,
  pageSize = 25,
}: GetCustomersParams): Promise<{
  data: Customer[];
  count: number;
  error: string | null;
}> {
  try {
    // Fetch all policies for the user
    let query = supabase
      .from("policies")  
      .select("*")
      .eq(DB.userEmail, userEmail);

    // Note: search filter uses ilike on Customer column
    if (search?.trim()) {
      query = query.ilike(DB.customer, `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return { data: [], count: 0, error: formatError(error) };
    }

    // Aggregate by customer name
    const customerMap = new Map<string, {
      name: string;
      policyNumbers: Set<string>;  // Track unique policies
      transactionCount: number;    // Total transactions
      totalPremium: number;
      totalAgencyComm: number;
      totalAgentComm: number;
      latestEffectiveDate: string | null;
      carriers: Set<string>;
    }>();

    (data ?? []).forEach((row: any) => {
      const name = row[DB.customer];
      if (!name || name === "—") return;  // Skip empty/placeholder names

      const policyNum = row[DB.policyNumber];
      const existing = customerMap.get(name);
      
      if (existing) {
        if (policyNum && policyNum !== "—") existing.policyNumbers.add(policyNum);
        existing.transactionCount += 1;
        existing.totalPremium += Number(row[DB.premiumSold]) || 0;
        existing.totalAgencyComm += Number(row[DB.agencyEstimatedComm]) || 0;
        existing.totalAgentComm += Number(row[DB.agentEstimatedComm]) || 0;
        if (row[DB.carrier]) existing.carriers.add(row[DB.carrier]);
        if (row[DB.effectiveDate]) {
          if (!existing.latestEffectiveDate || row[DB.effectiveDate] > existing.latestEffectiveDate) {
            existing.latestEffectiveDate = row[DB.effectiveDate];
          }
        }
      } else {
        const policySet = new Set<string>();
        if (policyNum && policyNum !== "—") policySet.add(policyNum);
        
        customerMap.set(name, {
          name,
          policyNumbers: policySet,
          transactionCount: 1,
          totalPremium: Number(row[DB.premiumSold]) || 0,
          totalAgencyComm: Number(row[DB.agencyEstimatedComm]) || 0,
          totalAgentComm: Number(row[DB.agentEstimatedComm]) || 0,
          latestEffectiveDate: row[DB.effectiveDate] || null,
          carriers: new Set(row[DB.carrier] ? [row[DB.carrier]] : []),
        });
      }
    });

    // Convert to array and sort by name
    const allCustomers: Customer[] = Array.from(customerMap.values())
      .map(c => ({
        id: encodeCustomerId(c.name),
        name: c.name,
        policyCount: c.policyNumbers.size,      // Unique policies
        transactionCount: c.transactionCount,   // Total transactions
        totalPremium: c.totalPremium,
        totalAgencyComm: c.totalAgencyComm,
        totalAgentComm: c.totalAgentComm,
        latestEffectiveDate: c.latestEffectiveDate,
        carriers: Array.from(c.carriers).sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalCount = allCustomers.length;

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedCustomers = allCustomers.slice(start, end);

    return { data: paginatedCustomers, count: totalCount, error: null };

  } catch (err) {
    return { data: [], count: 0, error: formatError(err) };
  }
}

/**
 * Get a single customer by name with full details
 */
export async function getCustomer(
  customerName: string,
  userEmail: string
): Promise<{ data: Customer | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq(DB.userEmail, userEmail)
      .eq(DB.customer, customerName);

    if (error) {
      console.error("getCustomer error:", error);
      return { data: null, error: formatError(error) };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    // Aggregate
    const policyNumbers = new Set<string>();
    let totalPremium = 0;
    let totalAgencyComm = 0;
    let totalAgentComm = 0;
    let latestEffectiveDate: string | null = null;
    const carriersSet = new Set<string>();

    data.forEach((row: any) => {
      const policyNum = row[DB.policyNumber];
      if (policyNum && policyNum !== "—") policyNumbers.add(policyNum);
      totalPremium += Number(row[DB.premiumSold]) || 0;
      totalAgencyComm += Number(row[DB.agencyEstimatedComm]) || 0;
      totalAgentComm += Number(row[DB.agentEstimatedComm]) || 0;
      if (row[DB.carrier]) carriersSet.add(row[DB.carrier]);
      if (row[DB.effectiveDate]) {
        if (!latestEffectiveDate || row[DB.effectiveDate] > latestEffectiveDate) {
          latestEffectiveDate = row[DB.effectiveDate];
        }
      }
    });

    const customer: Customer = {
      id: encodeCustomerId(customerName),
      name: customerName,
      policyCount: policyNumbers.size,
      transactionCount: data.length,
      totalPremium,
      totalAgencyComm,
      totalAgentComm,
      latestEffectiveDate,
      carriers: Array.from(carriersSet).sort(),
    };

    return { data: customer, error: null };
  } catch (err) {
    return { data: null, error: formatError(err) };
  }
}

/**
 * Get policy terms (grouped transactions) for a customer
 */
export async function getCustomerPolicyTerms(
  customerName: string,
  userEmail: string
): Promise<{ data: PolicyTerm[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq(DB.userEmail, userEmail)
      .eq(DB.customer, customerName);

    if (error) {
      console.error("getCustomerPolicyTerms error:", error);
      return { data: [], error: formatError(error) };
    }

    // Group by policy_number
    const termMap = new Map<string, PolicyTerm>();

    (data ?? []).forEach((row: any) => {
      const policyNumber = row[DB.policyNumber];
      if (!policyNumber || policyNumber === "—") return;

      const existing = termMap.get(policyNumber);
      if (existing) {
        existing.transactionCount += 1;
        existing.totalPremium += Number(row[DB.premiumSold]) || 0;
        existing.totalAgencyComm += Number(row[DB.agencyEstimatedComm]) || 0;
        existing.totalAgentComm += Number(row[DB.agentEstimatedComm]) || 0;
        existing.totalPaid += Number(row[DB.agentPaidAmount]) || 0;
        existing.transactions.push(mapTransaction(row));
        
        if (row[DB.effectiveDate]) {
          if (!existing.latestEffectiveDate || row[DB.effectiveDate] > existing.latestEffectiveDate) {
            existing.latestEffectiveDate = row[DB.effectiveDate];
          }
          if (!existing.earliestEffectiveDate || row[DB.effectiveDate] < existing.earliestEffectiveDate) {
            existing.earliestEffectiveDate = row[DB.effectiveDate];
          }
        }
      } else {
        termMap.set(policyNumber, {
          id: policyNumber,
          policyNumber,
          customer: row[DB.customer],
          carrier: row[DB.carrier] || "—",
          lineOfBusiness: row[DB.lineOfBusiness] || null,
          transactionCount: 1,
          totalPremium: Number(row[DB.premiumSold]) || 0,
          totalAgencyComm: Number(row[DB.agencyEstimatedComm]) || 0,
          totalAgentComm: Number(row[DB.agentEstimatedComm]) || 0,
          totalPaid: Number(row[DB.agentPaidAmount]) || 0,
          balanceDue: 0,
          latestEffectiveDate: row[DB.effectiveDate] || null,
          earliestEffectiveDate: row[DB.effectiveDate] || null,
          transactions: [mapTransaction(row)],
        });
      }
    });

    // Calculate balance due and convert to array
    const terms = Array.from(termMap.values()).map(term => ({
      ...term,
      balanceDue: term.totalAgentComm - term.totalPaid,
    }));

    // Sort by latest effective date (descending)
    terms.sort((a, b) => {
      if (!a.latestEffectiveDate) return 1;
      if (!b.latestEffectiveDate) return -1;
      return b.latestEffectiveDate.localeCompare(a.latestEffectiveDate);
    });

    return { data: terms, error: null };
  } catch (err) {
    return { data: [], error: formatError(err) };
  }
}

/**
 * Get a single policy term with all its transactions
 */
export async function getPolicyTerm(
  policyNumber: string,
  userEmail: string
): Promise<{ data: PolicyTerm | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq(DB.userEmail, userEmail)
      .eq(DB.policyNumber, policyNumber);

    if (error) {
      console.error("getPolicyTerm error:", error);
      return { data: null, error: formatError(error) };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    // Aggregate into a single term
    const firstRow = data[0];
    let totalPremium = 0;
    let totalAgencyComm = 0;
    let totalAgentComm = 0;
    let totalPaid = 0;
    let latestEffectiveDate: string | null = null;
    let earliestEffectiveDate: string | null = null;

    data.forEach((row: any) => {
      totalPremium += Number(row[DB.premiumSold]) || 0;
      totalAgencyComm += Number(row[DB.agencyEstimatedComm]) || 0;
      totalAgentComm += Number(row[DB.agentEstimatedComm]) || 0;
      totalPaid += Number(row[DB.agentPaidAmount]) || 0;

      if (row[DB.effectiveDate]) {
        if (!latestEffectiveDate || row[DB.effectiveDate] > latestEffectiveDate) {
          latestEffectiveDate = row[DB.effectiveDate];
        }
        if (!earliestEffectiveDate || row[DB.effectiveDate] < earliestEffectiveDate) {
          earliestEffectiveDate = row[DB.effectiveDate];
        }
      }
    });

    const term: PolicyTerm = {
      id: policyNumber,
      policyNumber,
      customer: firstRow[DB.customer],
      carrier: firstRow[DB.carrier] || "—",
      lineOfBusiness: firstRow[DB.lineOfBusiness] || null,
      transactionCount: data.length,
      totalPremium,
      totalAgencyComm,
      totalAgentComm,
      totalPaid,
      balanceDue: totalAgentComm - totalPaid,
      latestEffectiveDate,
      earliestEffectiveDate,
      transactions: data.map(mapTransaction),
    };

    return { data: term, error: null };
  } catch (err) {
    return { data: null, error: formatError(err) };
  }
}
