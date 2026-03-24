import { supabase } from "./supabase";

export type CommissionRule = {
  id: string;
  transaction_type: string;
  description: string;
  agent_rate: number;
  condition_field: string | null;
  condition_operator: string | null;
  condition_value: string | null;
  priority: number;
  active: boolean;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CommissionRuleCreateInput = {
  transaction_type: string;
  description: string;
  agent_rate: number;
  condition_field?: string | null;
  condition_operator?: string | null;
  condition_value?: string | null;
  priority?: number;
  active?: boolean;
  notes?: string | null;
  user_id: string;
};

export type CommissionRuleUpdateInput = Partial<Omit<CommissionRuleCreateInput, "user_id">>;

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getCommissionRules(userId: string) {
  const { data, error } = await supabase
    .from("commission_rules")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_type", { ascending: true })
    .order("priority", { ascending: true });

  if (error) {
    return { data: [] as CommissionRule[], error: formatError(error) };
  }

  return { data: (data ?? []) as CommissionRule[], error: null };
}

export async function getCommissionRule(id: string, userId: string) {
  const { data, error } = await supabase
    .from("commission_rules")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as CommissionRule | null, error: formatError(error) };
  }

  return { data: (data ?? null) as CommissionRule | null, error: null };
}

export async function createCommissionRule(payload: CommissionRuleCreateInput) {
  const { data, error } = await supabase
    .from("commission_rules")
    .insert({
      ...payload,
      priority: payload.priority ?? 0,
      active: payload.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as CommissionRule | null, error: formatError(error) };
  }

  return { data: data as CommissionRule, error: null };
}

export async function updateCommissionRule(
  id: string,
  userId: string,
  updates: CommissionRuleUpdateInput
) {
  const { data, error } = await supabase
    .from("commission_rules")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null as CommissionRule | null, error: formatError(error) };
  }

  return { data: data as CommissionRule, error: null };
}

export async function deleteCommissionRule(id: string, userId: string) {
  const { error } = await supabase
    .from("commission_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: formatError(error) };
  }

  return { error: null };
}

// Default commission rules that can be seeded
export const DEFAULT_COMMISSION_RULES = [
  { transaction_type: 'NEW', description: 'New Business', agent_rate: 50, notes: 'Standard new business rate' },
  { transaction_type: 'NBS', description: 'New Business Special', agent_rate: 50, notes: 'Special new business rate' },
  { transaction_type: 'RWL', description: 'Renewal', agent_rate: 25, notes: 'Standard renewal rate' },
  { transaction_type: 'END', description: 'Endorsement (New)', agent_rate: 50, notes: 'When origination = effective date', condition_field: 'dates_equal', condition_value: 'true' },
  { transaction_type: 'END', description: 'Endorsement (Renewal)', agent_rate: 25, notes: 'When origination != effective date', condition_field: 'dates_equal', condition_value: 'false' },
  { transaction_type: 'PCH', description: 'Policy Change (New)', agent_rate: 50, notes: 'When origination = effective date', condition_field: 'dates_equal', condition_value: 'true' },
  { transaction_type: 'PCH', description: 'Policy Change (Renewal)', agent_rate: 25, notes: 'When origination != effective date', condition_field: 'dates_equal', condition_value: 'false' },
  { transaction_type: 'CAN', description: 'Cancellation', agent_rate: 0, notes: 'No commission on cancellations' },
  { transaction_type: 'XCL', description: 'Excluded', agent_rate: 0, notes: 'Excluded from commission' },
  { transaction_type: 'STL', description: 'Settlement', agent_rate: 50, notes: 'Settlement commission' },
  { transaction_type: 'BoR', description: 'Broker of Record', agent_rate: 50, notes: 'Broker of record commission' },
  { transaction_type: 'REWRITE', description: 'Rewrite', agent_rate: 50, notes: 'Same rate as new business' },
];

// Additional functions for enhanced functionality

/**
 * Get commission rules by carrier/MGA
 */
export async function getCommissionRulesByCarrier(
  userId: string, 
  carrier?: string, 
  mga?: string
) {
  let query = supabase
    .from("commission_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true);

  if (carrier) {
    query = query.or(`condition_field.eq.carrier,condition_field.is.null`)
      .or(`condition_value.eq.${carrier},condition_value.is.null`);
  }

  if (mga) {
    query = query.or(`condition_field.eq.mga,condition_field.is.null`)
      .or(`condition_value.eq.${mga},condition_value.is.null`);
  }

  const { data, error } = await query
    .order("priority", { ascending: true })
    .order("transaction_type", { ascending: true });

  if (error) {
    return { data: [] as CommissionRule[], error: formatError(error) };
  }

  return { data: (data ?? []) as CommissionRule[], error: null };
}

/**
 * Get default rate by transaction type
 */
export function getDefaultRate(transactionType: string): number {
  const rule = DEFAULT_COMMISSION_RULES.find(r => r.transaction_type === transactionType);
  return rule ? rule.agent_rate / 100 : 0;
}

/**
 * Handle override rules with reason tracking
 */
export type CommissionOverride = {
  id: string;
  policy_id: string;
  original_rate: number;
  override_rate: number;
  reason: string;
  created_by: string;
  created_at: string;
};

export async function createCommissionOverride(
  policyId: string,
  originalRate: number,
  overrideRate: number,
  reason: string,
  createdBy: string
) {
  const { data, error } = await supabase
    .from("commission_overrides")
    .insert({
      policy_id: policyId,
      original_rate: originalRate,
      override_rate: overrideRate,
      reason: reason,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null as CommissionOverride | null, error: formatError(error) };
  }

  return { data: data as CommissionOverride, error: null };
}

/**
 * Calculate commission for a complete policy transaction
 */
export interface PolicyCommissionInput {
  premiumSold: number;
  policyGrossCommPct: number;
  transactionType: string;
  carrier?: string;
  mga?: string;
  policyOriginationDate?: string | null;
  effectiveDate?: string | null;
  agentPaidAmount?: number;
  userId: string;
  policyId?: string; // For policy-level overrides
  agentId?: string; // For agent-level overrides
  carrierId?: string; // For agent-specific carrier overrides
}

export interface PolicyCommissionResult {
  agencyCommission: number;
  agentRate: number;
  agentCommission: number;
  balanceDue: number;
  netToAgency?: number;
  appliedRule?: CommissionRule;
  overrideApplied?: boolean;
  overrideType?: 'policy' | 'agent';
  overrideReason?: string;
  calculationBreakdown: {
    baseRate: number;
    finalRate: number;
    rateSource: 'rule' | 'default' | 'policy_override' | 'agent_override';
  };
}

function round(value: number, decimals = 2) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export async function calculatePolicyCommission(
  input: PolicyCommissionInput
): Promise<{ data: PolicyCommissionResult | null; error: string | null }> {
  try {
    // Get applicable commission rules
    const { data: rules, error: rulesError } = await getCommissionRulesByCarrier(
      input.userId,
      input.carrier,
      input.mga
    );

    if (rulesError) {
      return { data: null, error: rulesError };
    }

    // Find the most specific rule for this transaction
    const applicableRule = rules.find(rule => 
      rule.transaction_type === input.transactionType &&
      rule.active
    );

    // Calculate agency commission
    const agencyCommission = round((input.premiumSold * input.policyGrossCommPct) / 100, 2);

    // Start with base rate determination
    let baseRate: number;
    let rateSource: 'rule' | 'default';
    
    if (applicableRule) {
      baseRate = applicableRule.agent_rate / 100;
      rateSource = 'rule';
    } else {
      // Fall back to default calculation logic
      baseRate = getDefaultRate(input.transactionType);
      rateSource = 'default';
      
      // Special handling for END and PCH
      if ((input.transactionType === 'END' || input.transactionType === 'PCH') &&
          input.policyOriginationDate && input.effectiveDate) {
        const originDate = input.policyOriginationDate.split('T')[0];
        const effDate = input.effectiveDate.split('T')[0];
        baseRate = originDate === effDate ? 0.50 : 0.25;
      }
    }

    // Check for policy-level override first (highest priority)
    let finalRate = baseRate;
    let overrideApplied = false;
    let overrideType: 'policy' | 'agent' | undefined;
    let overrideReason: string | undefined;
    let finalRateSource: typeof rateSource | 'policy_override' | 'agent_override' = rateSource;

    if (input.policyId) {
      const { data: policyOverride, error: policyOverrideError } = await supabase
        .from('commission_overrides')
        .select('*')
        .eq('policy_id', input.policyId)
        .eq('status', 'approved') // Only use approved overrides
        .or(`agent_id.is.null,agent_id.eq.${input.agentId || 'null'}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!policyOverrideError && policyOverride) {
        finalRate = policyOverride.override_rate / 100;
        overrideApplied = true;
        overrideType = 'policy';
        overrideReason = policyOverride.reason;
        finalRateSource = 'policy_override';
      }
    }

    // If no policy override, check for agent-level override
    if (!overrideApplied && input.agentId) {
      let agentOverrideQuery = supabase
        .from('agent_commission_overrides')
        .select('*')
        .eq('agent_id', input.agentId)
        .eq('transaction_type', input.transactionType)
        .eq('status', 'approved')
        .lte('effective_from', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      // Add carrier/MGA filters if available
      if (input.carrierId) {
        agentOverrideQuery = agentOverrideQuery.or(`carrier_id.is.null,carrier_id.eq.${input.carrierId}`);
      }
      
      if (input.mga) {
        agentOverrideQuery = agentOverrideQuery.or(`mga_name.is.null,mga_name.ilike.%${input.mga}%`);
      }

      const { data: agentOverrides, error: agentOverrideError } = await agentOverrideQuery;

      if (!agentOverrideError && agentOverrides && agentOverrides.length > 0) {
        // Find the most specific override (carrier-specific > MGA-specific > general)
        const specificOverride = agentOverrides.find(override => 
          (override.effective_to === null || override.effective_to >= new Date().toISOString().split('T')[0]) &&
          (override.carrier_id || override.mga_name)
        ) || agentOverrides.find(override =>
          (override.effective_to === null || override.effective_to >= new Date().toISOString().split('T')[0])
        );

        if (specificOverride) {
          finalRate = specificOverride.override_rate / 100;
          overrideApplied = true;
          overrideType = 'agent';
          overrideReason = specificOverride.reason;
          finalRateSource = 'agent_override';
        }
      }
    }

    // Calculate agent commission
    const agentCommission = round(agencyCommission * finalRate, 2);

    // Calculate net to agency (house split)
    const netToAgency = round(agencyCommission - agentCommission, 2);

    // Calculate balance due per spec: agencyCommission - agentPaidAmount
    const balanceDue = round(agencyCommission - (input.agentPaidAmount ?? 0), 2);

    return {
      data: {
        agencyCommission,
        agentRate: finalRate,
        agentCommission,
        balanceDue,
        netToAgency,
        appliedRule: applicableRule,
        overrideApplied,
        overrideType,
        overrideReason,
        calculationBreakdown: {
          baseRate,
          finalRate,
          rateSource: finalRateSource,
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

/**
 * Enhanced commission calculation with detailed breakdown
 */
export interface DetailedCommissionBreakdown {
  transaction: {
    type: string;
    premium: number;
    grossCommissionPct: number;
  };
  rates: {
    baseRate: number;
    baseRateSource: string;
    finalRate: number;
    finalRateSource: string;
    overrideApplied: boolean;
    overrideDetails?: {
      type: 'policy' | 'agent';
      originalRate: number;
      newRate: number;
      reason: string;
      approvedBy?: string;
      approvedAt?: string;
    };
  };
  calculations: {
    agencyCommission: number;
    agentCommission: number;
    netToAgency: number;
    balanceDue: number;
  };
  metadata: {
    calculatedAt: string;
    calculatedBy: string;
    ruleId?: string;
    overrideId?: string;
  };
}

export async function getDetailedCommissionBreakdown(
  input: PolicyCommissionInput
): Promise<{ data: DetailedCommissionBreakdown | null; error: string | null }> {
  const result = await calculatePolicyCommission(input);
  
  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }

  const breakdown: DetailedCommissionBreakdown = {
    transaction: {
      type: input.transactionType,
      premium: input.premiumSold,
      grossCommissionPct: input.policyGrossCommPct,
    },
    rates: {
      baseRate: result.data.calculationBreakdown.baseRate,
      baseRateSource: result.data.calculationBreakdown.rateSource,
      finalRate: result.data.calculationBreakdown.finalRate,
      finalRateSource: result.data.calculationBreakdown.rateSource,
      overrideApplied: result.data.overrideApplied || false,
      overrideDetails: result.data.overrideApplied ? {
        type: result.data.overrideType!,
        originalRate: result.data.calculationBreakdown.baseRate,
        newRate: result.data.calculationBreakdown.finalRate,
        reason: result.data.overrideReason || '',
      } : undefined,
    },
    calculations: {
      agencyCommission: result.data.agencyCommission,
      agentCommission: result.data.agentCommission,
      netToAgency: result.data.netToAgency || 0,
      balanceDue: result.data.balanceDue,
    },
    metadata: {
      calculatedAt: new Date().toISOString(),
      calculatedBy: input.userId,
      ruleId: result.data.appliedRule?.id,
    },
  };

  return { data: breakdown, error: null };
}
