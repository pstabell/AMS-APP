/**
 * Commission Rules Engine Test Suite
 * Tests for NEW, RWL, END/PCH, CAN/XCL scenarios and override functionality
 */

import { 
  calculatePolicyCommission, 
  getDetailedCommissionBreakdown,
  PolicyCommissionInput,
  PolicyCommissionResult,
  DetailedCommissionBreakdown,
  getDefaultRate,
  DEFAULT_COMMISSION_RULES 
} from '@/lib/commission-rules';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                maybeSingle: jest.fn()
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('Commission Rules Engine', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default Rate Calculation', () => {
    test('should return correct default rates for standard transaction types', () => {
      expect(getDefaultRate('NEW')).toBe(0.50);
      expect(getDefaultRate('NBS')).toBe(0.50);
      expect(getDefaultRate('RWL')).toBe(0.25);
      expect(getDefaultRate('CAN')).toBe(0.00);
      expect(getDefaultRate('XCL')).toBe(0.00);
      expect(getDefaultRate('STL')).toBe(0.50);
      expect(getDefaultRate('BoR')).toBe(0.50);
      expect(getDefaultRate('REWRITE')).toBe(0.50);
    });

    test('should return 0 for unknown transaction types', () => {
      expect(getDefaultRate('UNKNOWN')).toBe(0);
      expect(getDefaultRate('')).toBe(0);
    });
  });

  describe('NEW Business Transactions', () => {
    const baseInput: PolicyCommissionInput = {
      premiumSold: 1000,
      policyGrossCommPct: 15,
      transactionType: 'NEW',
      userId: 'test-user-id',
    };

    test('should calculate correct commission for NEW transaction', async () => {
      const result = await calculatePolicyCommission(baseInput);
      
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.agencyCommission).toBe(150); // $1000 * 15%
      expect(result.data?.agentRate).toBe(0.50); // 50% default rate
      expect(result.data?.agentCommission).toBe(75); // $150 * 50%
      expect(result.data?.netToAgency).toBe(75); // $150 - $75
      expect(result.data?.balanceDue).toBe(150); // $150 - $0 (no paid amount)
    });

    test('should calculate balance due correctly with paid amount', async () => {
      const inputWithPaid = { ...baseInput, agentPaidAmount: 50 };
      const result = await calculatePolicyCommission(inputWithPaid);
      
      expect(result.data?.balanceDue).toBe(100); // $150 - $50
    });

    test('should handle NBS (New Business Special) same as NEW', async () => {
      const nbsInput = { ...baseInput, transactionType: 'NBS' };
      const result = await calculatePolicyCommission(nbsInput);
      
      expect(result.data?.agentRate).toBe(0.50);
      expect(result.data?.agentCommission).toBe(75);
    });
  });

  describe('RWL (Renewal) Transactions', () => {
    const renewalInput: PolicyCommissionInput = {
      premiumSold: 1000,
      policyGrossCommPct: 15,
      transactionType: 'RWL',
      userId: 'test-user-id',
    };

    test('should calculate correct commission for RWL transaction', async () => {
      const result = await calculatePolicyCommission(renewalInput);
      
      expect(result.data?.agentRate).toBe(0.25); // 25% renewal rate
      expect(result.data?.agentCommission).toBe(37.5); // $150 * 25%
      expect(result.data?.netToAgency).toBe(112.5); // $150 - $37.5
    });
  });

  describe('END (Endorsement) Transactions', () => {
    const baseEndorsement: PolicyCommissionInput = {
      premiumSold: 500,
      policyGrossCommPct: 15,
      transactionType: 'END',
      userId: 'test-user-id',
    };

    test('should use NEW rate when origination date equals effective date', async () => {
      const input = {
        ...baseEndorsement,
        policyOriginationDate: '2024-01-01',
        effectiveDate: '2024-01-01',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.50); // NEW business rate
      expect(result.data?.agentCommission).toBe(37.5); // $75 * 50%
    });

    test('should use RWL rate when origination date differs from effective date', async () => {
      const input = {
        ...baseEndorsement,
        policyOriginationDate: '2024-01-01',
        effectiveDate: '2024-06-01',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.25); // Renewal rate
      expect(result.data?.agentCommission).toBe(18.75); // $75 * 25%
    });

    test('should handle missing dates gracefully', async () => {
      const result = await calculatePolicyCommission(baseEndorsement);
      
      expect(result.error).toBeNull();
      expect(result.data?.agentRate).toBe(0.50); // Default END rate from rules
    });
  });

  describe('PCH (Policy Change) Transactions', () => {
    const basePolicyChange: PolicyCommissionInput = {
      premiumSold: 300,
      policyGrossCommPct: 12,
      transactionType: 'PCH',
      userId: 'test-user-id',
    };

    test('should use NEW rate for same-day policy changes', async () => {
      const input = {
        ...basePolicyChange,
        policyOriginationDate: '2024-03-15',
        effectiveDate: '2024-03-15',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.50);
      expect(result.data?.agentCommission).toBe(18); // $36 * 50%
    });

    test('should use RWL rate for later policy changes', async () => {
      const input = {
        ...basePolicyChange,
        policyOriginationDate: '2024-01-01',
        effectiveDate: '2024-03-15',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.25);
      expect(result.data?.agentCommission).toBe(9); // $36 * 25%
    });
  });

  describe('CAN (Cancellation) and XCL (Excluded) Transactions', () => {
    const baseCancellation: PolicyCommissionInput = {
      premiumSold: 1000,
      policyGrossCommPct: 15,
      transactionType: 'CAN',
      userId: 'test-user-id',
    };

    test('should return zero commission for CAN transactions', async () => {
      const result = await calculatePolicyCommission(baseCancellation);
      
      expect(result.data?.agentRate).toBe(0.00);
      expect(result.data?.agentCommission).toBe(0);
      expect(result.data?.netToAgency).toBe(150); // All goes to agency
    });

    test('should return zero commission for XCL transactions', async () => {
      const input = { ...baseCancellation, transactionType: 'XCL' };
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.00);
      expect(result.data?.agentCommission).toBe(0);
    });
  });

  describe('Other Transaction Types', () => {
    const baseInput: PolicyCommissionInput = {
      premiumSold: 800,
      policyGrossCommPct: 10,
      userId: 'test-user-id',
    };

    test('should handle STL (Settlement) transactions', async () => {
      const input = { ...baseInput, transactionType: 'STL' };
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.50);
      expect(result.data?.agentCommission).toBe(40); // $80 * 50%
    });

    test('should handle BoR (Broker of Record) transactions', async () => {
      const input = { ...baseInput, transactionType: 'BoR' };
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.50);
      expect(result.data?.agentCommission).toBe(40);
    });

    test('should handle REWRITE transactions', async () => {
      const input = { ...baseInput, transactionType: 'REWRITE' };
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agentRate).toBe(0.50);
      expect(result.data?.agentCommission).toBe(40);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero premium', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 0,
        policyGrossCommPct: 15,
        transactionType: 'NEW',
        userId: 'test-user-id',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agencyCommission).toBe(0);
      expect(result.data?.agentCommission).toBe(0);
      expect(result.data?.balanceDue).toBe(0);
    });

    test('should handle negative premium', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: -500,
        policyGrossCommPct: 15,
        transactionType: 'NEW',
        userId: 'test-user-id',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agencyCommission).toBe(-75);
      expect(result.data?.agentCommission).toBe(-37.5);
    });

    test('should handle zero commission percentage', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 1000,
        policyGrossCommPct: 0,
        transactionType: 'NEW',
        userId: 'test-user-id',
      };
      
      const result = await calculatePolicyCommission(input);
      
      expect(result.data?.agencyCommission).toBe(0);
      expect(result.data?.agentCommission).toBe(0);
    });

    test('should handle missing user ID', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 1000,
        policyGrossCommPct: 15,
        transactionType: 'NEW',
        userId: '',
      };
      
      const result = await calculatePolicyCommission(input);
      
      // Should still calculate but without override lookup
      expect(result.error).toBeNull();
      expect(result.data?.agentCommission).toBe(75);
    });
  });

  describe('Detailed Commission Breakdown', () => {
    test('should provide detailed breakdown for NEW transaction', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 2000,
        policyGrossCommPct: 12,
        transactionType: 'NEW',
        userId: 'test-user-id',
      };

      const result = await getDetailedCommissionBreakdown(input);

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        transaction: {
          type: 'NEW',
          premium: 2000,
          grossCommissionPct: 12,
        },
        rates: {
          baseRate: 0.50,
          finalRate: 0.50,
          overrideApplied: false,
        },
        calculations: {
          agencyCommission: 240,
          agentCommission: 120,
          netToAgency: 120,
          balanceDue: 240,
        },
        metadata: {
          calculatedBy: 'test-user-id',
        },
      });

      expect(result.data?.metadata.calculatedAt).toBeDefined();
    });
  });

  describe('Rounding and Precision', () => {
    test('should round commission calculations to 2 decimal places', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 333.33,
        policyGrossCommPct: 14.567,
        transactionType: 'NEW',
        userId: 'test-user-id',
      };

      const result = await calculatePolicyCommission(input);

      expect(result.data?.agencyCommission).toBe(48.55); // 333.33 * 0.14567 = 48.5498...
      expect(result.data?.agentCommission).toBe(24.28); // 48.55 * 0.50 = 24.275
    });

    test('should handle fractional percentages correctly', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 1000,
        policyGrossCommPct: 12.75,
        transactionType: 'RWL',
        userId: 'test-user-id',
      };

      const result = await calculatePolicyCommission(input);

      expect(result.data?.agencyCommission).toBe(127.50);
      expect(result.data?.agentCommission).toBe(31.88); // 127.50 * 0.25 = 31.875
    });
  });

  describe('Carrier and MGA Specifics', () => {
    test('should include carrier and MGA information in input processing', async () => {
      const input: PolicyCommissionInput = {
        premiumSold: 1500,
        policyGrossCommPct: 18,
        transactionType: 'NEW',
        carrier: 'Acme Insurance',
        mga: 'Best MGA',
        userId: 'test-user-id',
      };

      const result = await calculatePolicyCommission(input);

      // Should process normally - carrier/MGA specific rules would be tested with actual DB
      expect(result.error).toBeNull();
      expect(result.data?.agentCommission).toBe(135); // $270 * 50%
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete policy lifecycle', async () => {
      const basePolicy = {
        premiumSold: 1200,
        policyGrossCommPct: 15,
        userId: 'test-user-id',
        policyId: 'test-policy-123',
      };

      // NEW business
      const newResult = await calculatePolicyCommission({
        ...basePolicy,
        transactionType: 'NEW',
      });
      expect(newResult.data?.agentCommission).toBe(90); // $180 * 50%

      // Renewal
      const renewalResult = await calculatePolicyCommission({
        ...basePolicy,
        transactionType: 'RWL',
      });
      expect(renewalResult.data?.agentCommission).toBe(45); // $180 * 25%

      // Endorsement (renewal period)
      const endorsementResult = await calculatePolicyCommission({
        ...basePolicy,
        transactionType: 'END',
        policyOriginationDate: '2024-01-01',
        effectiveDate: '2024-06-01',
      });
      expect(endorsementResult.data?.agentCommission).toBe(45); // $180 * 25%

      // Cancellation
      const cancelResult = await calculatePolicyCommission({
        ...basePolicy,
        transactionType: 'CAN',
      });
      expect(cancelResult.data?.agentCommission).toBe(0);
    });
  });

  describe('Performance and Load Tests', () => {
    test('should handle multiple calculations efficiently', async () => {
      const calculations = [];
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        calculations.push(calculatePolicyCommission({
          premiumSold: 1000 + i,
          policyGrossCommPct: 15,
          transactionType: i % 2 === 0 ? 'NEW' : 'RWL',
          userId: 'test-user-id',
        }));
      }

      const results = await Promise.all(calculations);
      const duration = Date.now() - startTime;

      // All calculations should succeed
      results.forEach((result, index) => {
        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
      });

      // Should complete in reasonable time (less than 5 seconds for 100 calculations)
      expect(duration).toBeLessThan(5000);
    });
  });
});

// Test helper functions
export const createTestInput = (overrides: Partial<PolicyCommissionInput> = {}): PolicyCommissionInput => ({
  premiumSold: 1000,
  policyGrossCommPct: 15,
  transactionType: 'NEW',
  userId: 'test-user-id',
  ...overrides,
});

export const expectCommissionResult = (
  result: { data: PolicyCommissionResult | null; error: string | null },
  expected: Partial<PolicyCommissionResult>
) => {
  expect(result.error).toBeNull();
  expect(result.data).toMatchObject(expected);
};