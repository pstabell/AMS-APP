/**
 * Test script to verify the Balance Due formula fix and House Split calculation
 */

// Import the calculation functions (for Node.js testing)
const { calculateCommission } = require('./src/lib/calculations.ts');

console.log('Testing Commission Calculation Fixes\n');

// Test case 1: Basic commission calculation
const testInput1 = {
  premiumSold: 1000,
  policyGrossCommPct: 15, // 15%
  transactionType: 'NEW',
  agentPaidAmount: 50
};

console.log('Test Case 1: New Business');
console.log('Premium Sold:', testInput1.premiumSold);
console.log('Policy Gross Comm %:', testInput1.policyGrossCommPct);
console.log('Transaction Type:', testInput1.transactionType);
console.log('Agent Paid Amount:', testInput1.agentPaidAmount);

const result1 = calculateCommission(testInput1);

console.log('\nResults:');
console.log('Agency Commission:', result1.agencyCommission, '(should be 150: 1000 × 15%)');
console.log('Agent Rate:', result1.agentRate, '(should be 0.5 for NEW business)');
console.log('Agent Commission:', result1.agentCommission, '(should be 75: 150 × 50%)');
console.log('House Split:', result1.houseSplit, '(should be 75: 150 - 75)');
console.log('Balance Due:', result1.balanceDue, '(should be 100: 150 - 50, NOT 25)');

console.log('\n' + '='.repeat(50));

// Test case 2: Renewal business
const testInput2 = {
  premiumSold: 2000,
  policyGrossCommPct: 10, // 10%
  transactionType: 'RWL',
  agentPaidAmount: 25
};

console.log('\nTest Case 2: Renewal');
console.log('Premium Sold:', testInput2.premiumSold);
console.log('Policy Gross Comm %:', testInput2.policyGrossCommPct);
console.log('Transaction Type:', testInput2.transactionType);
console.log('Agent Paid Amount:', testInput2.agentPaidAmount);

const result2 = calculateCommission(testInput2);

console.log('\nResults:');
console.log('Agency Commission:', result2.agencyCommission, '(should be 200: 2000 × 10%)');
console.log('Agent Rate:', result2.agentRate, '(should be 0.25 for RWL)');
console.log('Agent Commission:', result2.agentCommission, '(should be 50: 200 × 25%)');
console.log('House Split:', result2.houseSplit, '(should be 150: 200 - 50)');
console.log('Balance Due:', result2.balanceDue, '(should be 175: 200 - 25)');

console.log('\n✅ Tests completed. Verify the Balance Due is now calculated from Agency Commission, not Agent Commission.');