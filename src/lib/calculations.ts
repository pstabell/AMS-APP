/*
 * Commission Calculation Engine
 * 
 * Implements the agent commission rate rules based on transaction type.
 *
 * Agent Rates by Transaction Type:
 * | Type | Description        | Agent Rate     |
 * |------|--------------------|--------------  |
 * | NEW  | New Business       | 50%            |
 * | NBS  | New Business Spec  | 50%            |
 * | RWL  | Renewal            | 25%            |
 * | END  | Endorsement        | 50% or 25%*    |
 * | PCH  | Policy Change      | 50% or 25%*    |
 * | CAN  | Cancellation       | 0%             |
 * | XCL  | Excluded           | 0%             |
 * 
 * * If Policy Origination Date = Effective Date → 50%, else 25%
 * 
 * Formulas:
 * - Agency Commission = Premium × Policy Gross Comm %
 * - Agent Commission = Agency Commission × Agent Rate
 * - Net to Agency (houseSplit) = Agency Commission - Agent Commission
 * - Balance Due = Agency Commission - Agent Paid Amount
 */

export type TransactionType = 'NEW' | 'NBS' | 'RWL' | 'END' | 'PCH' | 'CAN' | 'XCL' | 'STL' | 'BoR' | 'REWRITE';

export const TRANSACTION_TYPES: { code: TransactionType; label: string; description: string }[] = [
  { code: 'NEW', label: 'NEW', description: 'New Business' },
  { code: 'NBS', label: 'NBS', description: 'New Business Special' },
  { code: 'RWL', label: 'RWL', description: 'Renewal' },
  { code: 'END', label: 'END', description: 'Endorsement' },
  { code: 'PCH', label: 'PCH', description: 'Policy Change' },
  { code: 'CAN', label: 'CAN', description: 'Cancellation' },
  { code: 'XCL', label: 'XCL', description: 'Excluded' },
  { code: 'STL', label: 'STL', description: 'Settlement' },
  { code: 'BoR', label: 'BoR', description: 'Broker of Record' },
  { code: 'REWRITE', label: 'REWRITE', description: 'Rewrite' },
];

// Base agent rates by transaction type
const BASE_AGENT_RATES: Record<TransactionType, number> = {
  NEW: 0.50,
  NBS: 0.50,
  RWL: 0.25,
  END: 0.50, // Default; may be 25% if not new business
  PCH: 0.50, // Default; may be 25% if not new business
  CAN: 0.00,
  XCL: 0.00,
  STL: 0.50,
  BoR: 0.50,
  REWRITE: 0.50, // Same as NEW
};

/**
 * Get agent commission rate based on transaction type and dates.
 * For END and PCH: 50% if policy origination date equals effective date, else 25%
 * For REWRITE: same as NEW (50%)
 */
export function getAgentRate(
  transactionType: TransactionType | string,
  policyOriginationDate?: string | null,
  effectiveDate?: string | null
): number {
  const txType = transactionType as TransactionType;
  
  // REWRITE is treated same as NEW
  if (txType === 'REWRITE') {
    return BASE_AGENT_RATES.NEW;
  }
  
  // Special handling for endorsements and policy changes
  if (txType === 'END' || txType === 'PCH') {
    // If both dates are provided and equal, it's new business → 50%
    // Otherwise, it's renewal business → 25%
    if (policyOriginationDate && effectiveDate) {
      const originDate = normalizeDate(policyOriginationDate);
      const effDate = normalizeDate(effectiveDate);
      
      if (originDate === effDate) {
        return 0.50;
      }
      return 0.25;
    }
    // If dates aren't available, default to the base rate
    return BASE_AGENT_RATES[txType];
  }
  
  return BASE_AGENT_RATES[txType] ?? 0;
}

/**
 * Normalize a date string to YYYY-MM-DD format for comparison
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle ISO strings and simple date strings
  return dateStr.split('T')[0];
}

/**
 * Calculate agency commission from premium and gross commission percentage
 */
export function calculateAgencyCommission(
  premiumSold: number,
  policyGrossCommPct: number
): number {
  if (!premiumSold || !policyGrossCommPct) return 0;
  return round((premiumSold * policyGrossCommPct) / 100, 2);
}

/**
 * Calculate agent commission from agency commission and agent rate
 */
export function calculateAgentCommission(
  agencyCommission: number,
  agentRate: number
): number {
  if (!agencyCommission || agentRate <= 0) return 0;
  return round(agencyCommission * agentRate, 2);
}

/**
 * Calculate net to agency (house split)
 */
export function calculateNetToAgency(
  agencyCommission: number,
  agentCommission: number
): number {
  return round(agencyCommission - agentCommission, 2);
}

/**
 * Calculate balance due (unpaid commission) - per spec uses agencyCommission as base
 */
export function calculateBalanceDue(
  agencyCommission: number,
  agentPaidAmount: number
): number {
  return round((agencyCommission - (agentPaidAmount ?? 0)), 2);
}

/**
 * Full commission calculation for a policy
 */
export interface CommissionInput {
  premiumSold: number;
  policyGrossCommPct: number;
  transactionType: TransactionType | string;
  policyOriginationDate?: string | null;
  effectiveDate?: string | null;
  agentPaidAmount?: number;
}

export interface CommissionResult {
  agencyCommission: number;
  agentRate: number;
  agentCommission: number;
  netToAgency: number;
  balanceDue: number;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const agencyCommission = calculateAgencyCommission(
    input.premiumSold,
    input.policyGrossCommPct
  );
  
  const agentRate = getAgentRate(
    input.transactionType,
    input.policyOriginationDate,
    input.effectiveDate
  );
  
  const agentCommission = calculateAgentCommission(agencyCommission, agentRate);
  
  const netToAgency = calculateNetToAgency(agencyCommission, agentCommission);
  
  const balanceDue = calculateBalanceDue(
    agencyCommission,
    input.agentPaidAmount ?? 0
  );
  
  return {
    agencyCommission,
    agentRate,
    agentCommission,
    netToAgency,
    balanceDue,
  };
}

/**
 * Round a number to specified decimal places
 */
function round(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date string
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
