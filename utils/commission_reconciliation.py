"""
Commission Reconciliation Module
Phase 3, Sprint 5, Task 5.2: Automated Commission Reconciliation

Automatically matches carrier commission statements against expected commissions
from policy data in the database. Detects discrepancies and generates reports.

Created: December 1, 2025
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import re
from difflib import SequenceMatcher


class CommissionReconciler:
    """
    Reconciles carrier commission statements against expected commissions.

    Supports major carriers:
    - State Farm
    - Progressive
    - Allstate
    - Geico
    - Nationwide
    - Liberty Mutual
    - Farmers
    - And more...
    """

    def __init__(self):
        """Initialize the reconciler."""
        self.carrier_formats = self._load_carrier_formats()

    def _load_carrier_formats(self) -> Dict:
        """
        Define expected CSV formats for major carriers.
        Each carrier has different column names and formats.
        """
        return {
            'state_farm': {
                'columns': {
                    'policy_number': ['Policy Number', 'Policy #', 'Policy'],
                    'client_name': ['Insured Name', 'Client Name', 'Name'],
                    'commission_amount': ['Commission', 'Commission Amount', 'Amount'],
                    'effective_date': ['Effective Date', 'Eff Date', 'Date'],
                    'transaction_type': ['Type', 'Transaction Type', 'Trans Type'],
                },
                'date_format': '%m/%d/%Y'
            },
            'progressive': {
                'columns': {
                    'policy_number': ['Policy Number', 'Policy#'],
                    'client_name': ['Named Insured', 'Client'],
                    'commission_amount': ['Commission Amt', 'Commission'],
                    'effective_date': ['Effective Date', 'Eff Date'],
                    'transaction_type': ['Transaction', 'Type'],
                },
                'date_format': '%m/%d/%Y'
            },
            'allstate': {
                'columns': {
                    'policy_number': ['Policy Number', 'Policy'],
                    'client_name': ['Insured', 'Name'],
                    'commission_amount': ['Commission', 'Amt'],
                    'effective_date': ['Effective', 'Date'],
                    'transaction_type': ['Type'],
                },
                'date_format': '%Y-%m-%d'
            },
            'generic': {
                'columns': {
                    'policy_number': ['Policy Number', 'Policy #', 'Policy', 'PolicyNumber'],
                    'client_name': ['Client Name', 'Insured Name', 'Name', 'Client', 'Insured'],
                    'commission_amount': ['Commission', 'Commission Amount', 'Amount', 'Amt', 'Commission Amt'],
                    'effective_date': ['Effective Date', 'Eff Date', 'Date', 'Effective'],
                    'transaction_type': ['Type', 'Transaction Type', 'Trans Type', 'Transaction'],
                },
                'date_format': '%m/%d/%Y'
            }
        }

    def detect_carrier_format(self, df: pd.DataFrame) -> str:
        """
        Auto-detect carrier format based on column names.

        Args:
            df: DataFrame from uploaded carrier statement

        Returns:
            Carrier name (e.g., 'state_farm', 'progressive', 'generic')
        """
        columns_lower = [col.lower() for col in df.columns]

        # Check for carrier-specific column patterns
        if any('state farm' in col for col in columns_lower):
            return 'state_farm'
        elif any('progressive' in col for col in columns_lower):
            return 'progressive'
        elif any('allstate' in col for col in columns_lower):
            return 'allstate'

        # Default to generic format
        return 'generic'

    def normalize_carrier_statement(self, df: pd.DataFrame, carrier: str = None) -> pd.DataFrame:
        """
        Normalize carrier statement to standard format.

        Standardizes column names across different carrier formats:
        - policy_number
        - client_name
        - commission_amount
        - effective_date
        - transaction_type

        Args:
            df: Raw DataFrame from carrier statement
            carrier: Carrier name (auto-detected if None)

        Returns:
            Normalized DataFrame with standard columns
        """
        if carrier is None:
            carrier = self.detect_carrier_format(df)

        format_config = self.carrier_formats.get(carrier, self.carrier_formats['generic'])
        normalized = pd.DataFrame()

        # Map each standard field to carrier's column name
        for standard_field, possible_columns in format_config['columns'].items():
            for possible_col in possible_columns:
                # Case-insensitive match
                matching_cols = [col for col in df.columns if col.lower() == possible_col.lower()]
                if matching_cols:
                    normalized[standard_field] = df[matching_cols[0]]
                    break

        # Clean up data
        if 'commission_amount' in normalized.columns:
            # Remove $ and , from amounts
            normalized['commission_amount'] = normalized['commission_amount'].astype(str).str.replace('$', '').str.replace(',', '')
            normalized['commission_amount'] = pd.to_numeric(normalized['commission_amount'], errors='coerce')

        if 'effective_date' in normalized.columns:
            # Try multiple date formats
            normalized['effective_date'] = pd.to_datetime(
                normalized['effective_date'],
                errors='coerce',
                infer_datetime_format=True
            )

        if 'policy_number' in normalized.columns:
            # Clean policy numbers (remove spaces, dashes)
            normalized['policy_number'] = normalized['policy_number'].astype(str).str.strip()

        if 'client_name' in normalized.columns:
            # Standardize client names (title case, strip)
            normalized['client_name'] = normalized['client_name'].astype(str).str.strip().str.title()

        return normalized

    def get_expected_commissions(self, agency_id: str, start_date: datetime,
                                end_date: datetime, policies_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate expected commissions from policies in database.

        Args:
            agency_id: Agency UUID
            start_date: Start of period
            end_date: End of period
            policies_df: DataFrame of policies from database

        Returns:
            DataFrame with expected commissions
        """
        # Filter policies by date range
        policies_df['effective_date'] = pd.to_datetime(policies_df['effective_date'], errors='coerce')

        # Include policies effective in this period OR renewing in this period
        mask = (
            (policies_df['effective_date'] >= start_date) &
            (policies_df['effective_date'] <= end_date)
        ) | (
            (policies_df['renewal_date'] >= start_date) &
            (policies_df['renewal_date'] <= end_date)
        )

        period_policies = policies_df[mask].copy()

        # Calculate expected commission for each policy
        expected = pd.DataFrame()
        expected['policy_number'] = period_policies['policy_number']
        expected['client_name'] = period_policies['client_name']
        expected['agent_name'] = period_policies['agent_name']
        expected['carrier'] = period_policies['carrier']
        expected['effective_date'] = period_policies['effective_date']
        expected['premium'] = period_policies['premium']
        expected['commission_rate'] = period_policies['commission_rate']
        expected['expected_commission'] = period_policies['premium'] * period_policies['commission_rate'] / 100
        expected['status'] = period_policies['status']

        return expected

    def fuzzy_match_name(self, name1: str, name2: str, threshold: float = 0.8) -> bool:
        """
        Fuzzy match two client names (handles typos, formatting differences).

        Args:
            name1: First name
            name2: Second name
            threshold: Match threshold (0.0 to 1.0)

        Returns:
            True if names match above threshold
        """
        if pd.isna(name1) or pd.isna(name2):
            return False

        # Normalize names
        n1 = str(name1).lower().strip()
        n2 = str(name2).lower().strip()

        # Handle common variations (Smith, John vs John Smith)
        n1_parts = set(n1.split())
        n2_parts = set(n2.split())

        # Check if all parts of shorter name are in longer name
        if len(n1_parts) < len(n2_parts):
            if n1_parts.issubset(n2_parts):
                return True
        else:
            if n2_parts.issubset(n1_parts):
                return True

        # Use sequence matcher for similarity
        similarity = SequenceMatcher(None, n1, n2).ratio()
        return similarity >= threshold

    def match_transactions(self, carrier_statement: pd.DataFrame,
                          expected_commissions: pd.DataFrame,
                          match_tolerance_days: int = 30,
                          amount_tolerance_pct: float = 5.0) -> Dict:
        """
        Match carrier statement transactions to expected commissions.

        Args:
            carrier_statement: Normalized carrier statement
            expected_commissions: Expected commissions from database
            match_tolerance_days: Date match tolerance (±30 days default)
            amount_tolerance_pct: Amount match tolerance (±5% default)

        Returns:
            Dict with:
            - matched: List of matched transactions
            - missing_from_statement: Expected but not in statement
            - unexpected_in_statement: In statement but not expected
            - amount_discrepancies: Matched but wrong amount
        """
        matched = []
        missing_from_statement = []
        unexpected_in_statement = []
        amount_discrepancies = []

        # Create sets for tracking
        matched_expected_indices = set()
        matched_carrier_indices = set()

        # Try to match each expected commission to carrier statement
        for exp_idx, exp_row in expected_commissions.iterrows():
            best_match = None
            best_match_score = 0
            best_match_idx = None

            for carr_idx, carr_row in carrier_statement.iterrows():
                if carr_idx in matched_carrier_indices:
                    continue  # Already matched

                score = 0

                # Match policy number (most important - 50 points)
                if str(exp_row['policy_number']).strip() == str(carr_row['policy_number']).strip():
                    score += 50

                # Match client name (30 points)
                if self.fuzzy_match_name(exp_row['client_name'], carr_row['client_name']):
                    score += 30

                # Match date within tolerance (15 points)
                if pd.notna(exp_row['effective_date']) and pd.notna(carr_row['effective_date']):
                    date_diff = abs((exp_row['effective_date'] - carr_row['effective_date']).days)
                    if date_diff <= match_tolerance_days:
                        score += 15 * (1 - date_diff / match_tolerance_days)

                # Match amount within tolerance (5 points)
                if pd.notna(exp_row['expected_commission']) and pd.notna(carr_row['commission_amount']):
                    amount_diff_pct = abs(exp_row['expected_commission'] - carr_row['commission_amount']) / exp_row['expected_commission'] * 100
                    if amount_diff_pct <= amount_tolerance_pct:
                        score += 5

                # Track best match
                if score > best_match_score:
                    best_match_score = score
                    best_match = carr_row
                    best_match_idx = carr_idx

            # Require minimum score of 50 to consider it a match (policy number match)
            if best_match_score >= 50:
                # Check for amount discrepancy
                amount_diff = best_match['commission_amount'] - exp_row['expected_commission']
                amount_diff_pct = abs(amount_diff) / exp_row['expected_commission'] * 100

                match_record = {
                    'policy_number': exp_row['policy_number'],
                    'client_name': exp_row['client_name'],
                    'agent_name': exp_row['agent_name'],
                    'expected_amount': exp_row['expected_commission'],
                    'actual_amount': best_match['commission_amount'],
                    'difference': amount_diff,
                    'difference_pct': amount_diff_pct,
                    'effective_date': exp_row['effective_date'],
                    'match_score': best_match_score
                }

                if amount_diff_pct > amount_tolerance_pct:
                    amount_discrepancies.append(match_record)
                else:
                    matched.append(match_record)

                matched_expected_indices.add(exp_idx)
                matched_carrier_indices.add(best_match_idx)
            else:
                # Not found in carrier statement
                missing_from_statement.append({
                    'policy_number': exp_row['policy_number'],
                    'client_name': exp_row['client_name'],
                    'agent_name': exp_row['agent_name'],
                    'expected_amount': exp_row['expected_commission'],
                    'effective_date': exp_row['effective_date'],
                    'carrier': exp_row['carrier'],
                    'status': exp_row['status']
                })

        # Find transactions in carrier statement that weren't matched
        for carr_idx, carr_row in carrier_statement.iterrows():
            if carr_idx not in matched_carrier_indices:
                unexpected_in_statement.append({
                    'policy_number': carr_row['policy_number'],
                    'client_name': carr_row['client_name'],
                    'actual_amount': carr_row['commission_amount'],
                    'effective_date': carr_row['effective_date'],
                    'transaction_type': carr_row.get('transaction_type', 'Unknown')
                })

        return {
            'matched': matched,
            'missing_from_statement': missing_from_statement,
            'unexpected_in_statement': unexpected_in_statement,
            'amount_discrepancies': amount_discrepancies,
            'summary': {
                'total_expected': len(expected_commissions),
                'total_in_statement': len(carrier_statement),
                'matched_count': len(matched),
                'missing_count': len(missing_from_statement),
                'unexpected_count': len(unexpected_in_statement),
                'discrepancy_count': len(amount_discrepancies),
                'match_rate': len(matched) / len(expected_commissions) * 100 if len(expected_commissions) > 0 else 0,
                'total_expected_amount': expected_commissions['expected_commission'].sum() if len(expected_commissions) > 0 else 0,
                'total_actual_amount': carrier_statement['commission_amount'].sum() if len(carrier_statement) > 0 else 0,
                'total_difference': (carrier_statement['commission_amount'].sum() if len(carrier_statement) > 0 else 0) -
                                  (expected_commissions['expected_commission'].sum() if len(expected_commissions) > 0 else 0)
            }
        }

    def reconcile(self, carrier_statement_path: str, policies_df: pd.DataFrame,
                 agency_id: str, start_date: datetime, end_date: datetime,
                 carrier: str = None) -> Dict:
        """
        Main reconciliation function.

        Args:
            carrier_statement_path: Path to carrier CSV statement
            policies_df: DataFrame of all policies from database
            agency_id: Agency UUID
            start_date: Period start date
            end_date: Period end date
            carrier: Carrier name (auto-detected if None)

        Returns:
            Reconciliation report dict
        """
        # Load and normalize carrier statement
        carrier_df = pd.read_csv(carrier_statement_path)
        normalized_carrier = self.normalize_carrier_statement(carrier_df, carrier)

        # Get expected commissions
        expected = self.get_expected_commissions(agency_id, start_date, end_date, policies_df)

        # Match transactions
        results = self.match_transactions(normalized_carrier, expected)

        # Add metadata
        results['metadata'] = {
            'agency_id': agency_id,
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'carrier': carrier if carrier else 'auto-detected',
            'reconciliation_date': datetime.now().isoformat(),
            'statement_file': carrier_statement_path
        }

        return results

    def generate_report_summary(self, reconciliation_results: Dict) -> str:
        """
        Generate human-readable summary of reconciliation results.

        Args:
            reconciliation_results: Results from reconcile()

        Returns:
            Formatted summary string
        """
        summary = reconciliation_results['summary']

        report = f"""
COMMISSION RECONCILIATION REPORT
================================

Period: {reconciliation_results['metadata']['period_start']} to {reconciliation_results['metadata']['period_end']}
Carrier: {reconciliation_results['metadata']['carrier']}
Reconciliation Date: {reconciliation_results['metadata']['reconciliation_date']}

SUMMARY
-------
Total Expected Transactions: {summary['total_expected']}
Total in Carrier Statement: {summary['total_in_statement']}
Matched Transactions: {summary['matched_count']} ({summary['match_rate']:.1f}%)

Total Expected Amount: ${summary['total_expected_amount']:,.2f}
Total Actual Amount: ${summary['total_actual_amount']:,.2f}
Difference: ${summary['total_difference']:,.2f}

DISCREPANCIES
------------
Missing from Statement: {summary['missing_count']} transactions
Unexpected in Statement: {summary['unexpected_count']} transactions
Amount Discrepancies: {summary['discrepancy_count']} transactions

"""

        # Add details for missing transactions
        if summary['missing_count'] > 0:
            report += "\nMISSING FROM CARRIER STATEMENT:\n"
            report += "-" * 80 + "\n"
            for missing in reconciliation_results['missing_from_statement'][:10]:  # Top 10
                report += f"Policy: {missing['policy_number']} | Client: {missing['client_name']} | "
                report += f"Agent: {missing['agent_name']} | Amount: ${missing['expected_amount']:,.2f}\n"
            if summary['missing_count'] > 10:
                report += f"... and {summary['missing_count'] - 10} more\n"

        # Add details for amount discrepancies
        if summary['discrepancy_count'] > 0:
            report += "\nAMOUNT DISCREPANCIES:\n"
            report += "-" * 80 + "\n"
            for disc in reconciliation_results['amount_discrepancies'][:10]:  # Top 10
                report += f"Policy: {disc['policy_number']} | Client: {disc['client_name']} | "
                report += f"Expected: ${disc['expected_amount']:,.2f} | Actual: ${disc['actual_amount']:,.2f} | "
                report += f"Diff: ${disc['difference']:,.2f} ({disc['difference_pct']:.1f}%)\n"
            if summary['discrepancy_count'] > 10:
                report += f"... and {summary['discrepancy_count'] - 10} more\n"

        return report


def reconcile_carrier_statement(carrier_statement_path: str, policies_df: pd.DataFrame,
                               agency_id: str, start_date: datetime, end_date: datetime,
                               carrier: str = None) -> Dict:
    """
    Convenience function for one-step reconciliation.

    Args:
        carrier_statement_path: Path to carrier CSV
        policies_df: DataFrame of policies from database
        agency_id: Agency UUID
        start_date: Period start
        end_date: Period end
        carrier: Carrier name (optional)

    Returns:
        Reconciliation results dict
    """
    reconciler = CommissionReconciler()
    return reconciler.reconcile(carrier_statement_path, policies_df, agency_id, start_date, end_date, carrier)
