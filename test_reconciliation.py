"""
Quick test script for commission reconciliation module
Phase 3, Sprint 5, Task 5.2

Run: python test_reconciliation.py
"""

import pandas as pd
from datetime import datetime
from utils.commission_reconciliation import CommissionReconciler

def test_reconciliation():
    """Test the reconciliation module with sample data."""

    print("=" * 80)
    print("COMMISSION RECONCILIATION TEST")
    print("=" * 80)
    print()

    # Create sample policies DataFrame (expected commissions)
    policies_data = {
        'policy_number': ['AUTO-12345', 'HOME-67890', 'AUTO-23456', 'AUTO-34567', 'HOME-45678', 'AUTO-99999'],
        'client_name': ['John Smith', 'Mary Johnson', 'Robert Williams', 'Patricia Brown', 'Michael Davis', 'Sarah Missing'],
        'agent_name': ['Agent 1', 'Agent 2', 'Agent 1', 'Agent 3', 'Agent 2', 'Agent 1'],
        'carrier': ['State Farm', 'Progressive', 'State Farm', 'Allstate', 'Progressive', 'State Farm'],
        'effective_date': [
            datetime(2024, 11, 1),
            datetime(2024, 11, 5),
            datetime(2024, 11, 10),
            datetime(2024, 11, 15),
            datetime(2024, 11, 20),
            datetime(2024, 11, 22),  # This one won't be in carrier statement
        ],
        'renewal_date': [
            datetime(2025, 11, 1),
            datetime(2025, 11, 5),
            datetime(2025, 11, 10),
            datetime(2025, 11, 15),
            datetime(2025, 11, 20),
            datetime(2025, 11, 22),
        ],
        'premium': [5000, 3580, 6270, 3930, 8600, 4500],
        'commission_rate': [2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
        'status': ['Active', 'Active', 'Active', 'Active', 'Active', 'Active']
    }

    policies_df = pd.DataFrame(policies_data)

    print("Sample Policies in Database:")
    print(policies_df[['policy_number', 'client_name', 'carrier', 'premium', 'commission_rate']])
    print()

    # Initialize reconciler
    reconciler = CommissionReconciler()

    # Test 1: Load and normalize carrier statement
    print("Step 1: Loading carrier statement...")
    carrier_statement_path = 'test_data/sample_carrier_statement.csv'

    try:
        carrier_df = pd.read_csv(carrier_statement_path)
        print(f"[OK] Loaded {len(carrier_df)} transactions from carrier statement")
        print()

        print("Raw Carrier Statement:")
        print(carrier_df)
        print()

        # Test 2: Normalize
        print("Step 2: Normalizing carrier statement format...")
        normalized = reconciler.normalize_carrier_statement(carrier_df)
        print(f"[OK] Normalized to standard format")
        print()

        print("Normalized Statement:")
        print(normalized)
        print()

        # Test 3: Get expected commissions
        print("Step 3: Calculating expected commissions...")
        expected = reconciler.get_expected_commissions(
            agency_id='test-agency',
            start_date=datetime(2024, 11, 1),
            end_date=datetime(2024, 11, 30),
            policies_df=policies_df
        )
        print(f"[OK] Calculated {len(expected)} expected commissions")
        print()

        print("Expected Commissions:")
        print(expected[['policy_number', 'client_name', 'expected_commission']])
        print()

        # Test 4: Match transactions
        print("Step 4: Matching transactions...")
        results = reconciler.match_transactions(normalized, expected)
        print(f"[OK] Matching complete")
        print()

        # Test 5: Display results
        print("=" * 80)
        print("RECONCILIATION RESULTS")
        print("=" * 80)
        print()

        summary = results['summary']

        print(f"Total Expected:          {summary['total_expected']}")
        print(f"Total in Statement:      {summary['total_in_statement']}")
        print(f"Matched:                 {summary['matched_count']}")
        print(f"Missing from Statement:  {summary['missing_count']}")
        print(f"Unexpected in Statement: {summary['unexpected_count']}")
        print(f"Amount Discrepancies:    {summary['discrepancy_count']}")
        print(f"Match Rate:              {summary['match_rate']:.1f}%")
        print()

        print(f"Expected Amount:         ${summary['total_expected_amount']:,.2f}")
        print(f"Actual Amount:           ${summary['total_actual_amount']:,.2f}")
        print(f"Difference:              ${summary['total_difference']:,.2f}")
        print()

        # Show missing transactions
        if summary['missing_count'] > 0:
            print("=" * 80)
            print("MISSING FROM CARRIER STATEMENT")
            print("=" * 80)
            print()
            for missing in results['missing_from_statement']:
                print(f"[X] {missing['policy_number']} - {missing['client_name']}")
                print(f"   Expected: ${missing['expected_amount']:,.2f}")
                print(f"   Carrier: {missing['carrier']}")
                print()

        # Show unexpected transactions
        if summary['unexpected_count'] > 0:
            print("=" * 80)
            print("UNEXPECTED IN CARRIER STATEMENT")
            print("=" * 80)
            print()
            for unexpected in results['unexpected_in_statement']:
                print(f"[+] {unexpected['policy_number']} - {unexpected['client_name']}")
                print(f"   Amount: ${unexpected['actual_amount']:,.2f}")
                print()

        # Show discrepancies
        if summary['discrepancy_count'] > 0:
            print("=" * 80)
            print("AMOUNT DISCREPANCIES")
            print("=" * 80)
            print()
            for disc in results['amount_discrepancies']:
                print(f"[!] {disc['policy_number']} - {disc['client_name']}")
                print(f"   Expected: ${disc['expected_amount']:,.2f}")
                print(f"   Actual:   ${disc['actual_amount']:,.2f}")
                print(f"   Diff:     ${disc['difference']:,.2f} ({disc['difference_pct']:.1f}%)")
                print()

        print("=" * 80)
        print("[OK] TEST COMPLETED SUCCESSFULLY!")
        print("=" * 80)

    except FileNotFoundError:
        print(f"[ERROR] Could not find {carrier_statement_path}")
        print("Make sure test_data/sample_carrier_statement.csv exists")
    except Exception as e:
        print(f"[ERROR] Error during reconciliation: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_reconciliation()
