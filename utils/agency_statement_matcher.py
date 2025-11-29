"""
Agency Statement Matcher
Matching logic for agency reconciliation with agent attribution.

This is the "Second Floor" matching logic - similar to main branch but with agent_id tracking.
Does NOT modify the main branch matching logic.

Created: November 29, 2025
Branch: agency-platform
Task: 2.1 - Multi-Agent Reconciliation Flow
"""

import pandas as pd
import streamlit as st
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from difflib import SequenceMatcher

from utils.agency_reconciliation_helpers import (
    get_supabase_client,
    load_agency_policies_for_matching,
    get_agent_name_map
)

from utils.agent_assignment_logic import (
    auto_assign_by_policy_ownership,
    auto_assign_by_customer_history,
    bulk_assign_transactions
)


def parse_statement_row(row: pd.Series, column_mapping: Dict[str, str]) -> Dict:
    """
    Parse a statement row into a standard format.

    Args:
        row: DataFrame row from statement
        column_mapping: Column mapping dictionary

    Returns:
        Dictionary with standardized fields
    """
    def safe_get(col_name):
        """Safely get value from row using column mapping."""
        source_col = column_mapping.get(col_name)
        if source_col and source_col in row.index:
            value = row[source_col]
            # Handle NaN
            if pd.isna(value):
                return None
            return value
        return None

    # Parse standard fields
    customer = safe_get('Customer')
    policy_number = safe_get('Policy Number')
    effective_date = safe_get('Effective Date')
    amount = safe_get('Agent Paid Amount (STMT)')

    # Parse optional fields
    carrier = safe_get('Carrier Name')
    trans_type = safe_get('Transaction Type')
    policy_type = safe_get('Policy Type')
    premium = safe_get('Premium Sold')

    # Format date
    if effective_date:
        try:
            if isinstance(effective_date, str):
                effective_date = pd.to_datetime(effective_date).strftime('%Y-%m-%d')
            else:
                effective_date = pd.to_datetime(effective_date).strftime('%Y-%m-%d')
        except:
            effective_date = str(effective_date)

    # Format amount
    if amount:
        try:
            amount = float(amount)
        except:
            amount = 0.0
    else:
        amount = 0.0

    return {
        'customer': str(customer) if customer else '',
        'policy_number': str(policy_number) if policy_number else '',
        'effective_date': effective_date,
        'amount': amount,
        'carrier': str(carrier) if carrier else '',
        'trans_type': str(trans_type) if trans_type else 'NEW',
        'policy_type': str(policy_type) if policy_type else '',
        'premium': float(premium) if premium and not pd.isna(premium) else None,
        'statement_data': row.to_dict()  # Store original row
    }


def fuzzy_match_customer(stmt_customer: str, db_customer: str) -> int:
    """
    Calculate fuzzy match score between two customer names.

    Args:
        stmt_customer: Customer name from statement
        db_customer: Customer name from database

    Returns:
        Match score (0-100)
    """
    if not stmt_customer or not db_customer:
        return 0

    # Normalize
    s1 = stmt_customer.lower().strip()
    s2 = db_customer.lower().strip()

    # Exact match
    if s1 == s2:
        return 100

    # Sequence matcher
    ratio = SequenceMatcher(None, s1, s2).ratio()
    return int(ratio * 100)


def find_matching_policy(
    stmt_trans: Dict,
    existing_policies: List[Dict],
    agency_id: str
) -> Optional[Dict]:
    """
    Find matching policy in database for statement transaction.

    This matches ACROSS ALL AGENTS in the agency (agency-wide matching).

    Args:
        stmt_trans: Parsed statement transaction
        existing_policies: List of all agency policies
        agency_id: Agency ID

    Returns:
        Matched policy dict with confidence score, or None
    """
    policy_number = stmt_trans['policy_number']
    customer = stmt_trans['customer']

    best_match = None
    best_score = 0

    # Try exact policy number match first
    if policy_number:
        for policy in existing_policies:
            if (policy.get('Policy Number') == policy_number and
                policy.get('agency_id') == agency_id):
                # Exact policy match
                customer_score = fuzzy_match_customer(customer, policy.get('Customer', ''))

                if customer_score > 80:  # High confidence
                    return {
                        'policy': policy,
                        'confidence': 95,
                        'match_type': 'Exact Policy + Customer',
                        'matched_agent_id': policy.get('agent_id')
                    }
                else:
                    # Policy matches but customer doesn't
                    if customer_score > best_score:
                        best_score = customer_score
                        best_match = {
                            'policy': policy,
                            'confidence': 75,
                            'match_type': 'Policy Match',
                            'matched_agent_id': policy.get('agent_id')
                        }

    # Try customer name match
    if customer and not best_match:
        for policy in existing_policies:
            if policy.get('agency_id') != agency_id:
                continue

            customer_score = fuzzy_match_customer(customer, policy.get('Customer', ''))

            if customer_score > 90:  # Very high customer match
                if customer_score > best_score:
                    best_score = customer_score
                    best_match = {
                        'policy': policy,
                        'confidence': customer_score,
                        'match_type': 'Customer Match',
                        'matched_agent_id': policy.get('agent_id')
                    }

    return best_match if best_score > 60 else None


def process_statement_with_agent_attribution(
    statement_df: pd.DataFrame,
    column_mapping: Dict[str, str],
    agency_id: str,
    assignment_mode: str,
    selected_agent_id: Optional[str] = None
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Process statement and match transactions with agent attribution.

    This is the core matching logic for agency reconciliation.

    Args:
        statement_df: Uploaded statement DataFrame
        column_mapping: Column mapping dict
        agency_id: Agency ID
        assignment_mode: 'assign_all', 'auto_assign', or 'manual'
        selected_agent_id: Agent ID if using assign_all mode

    Returns:
        Tuple of (matched_transactions, unmatched_transactions, to_create_transactions)
    """
    # Load existing agency policies (cross-agent matching)
    existing_policies = load_agency_policies_for_matching(agency_id)

    matched_transactions = []
    unmatched_transactions = []
    to_create_transactions = []

    # Filter out totals rows
    customer_col = column_mapping.get('Customer')
    if customer_col:
        # Exclude rows that look like totals
        totals_mask = statement_df[customer_col].astype(str).str.lower().str.contains(
            'total|totals|subtotal|sub-total|grand total|sum', na=False
        )
        empty_mask = statement_df[customer_col].astype(str).str.strip() == ''
        nan_mask = pd.isna(statement_df[customer_col])
        exclude_mask = totals_mask | empty_mask | nan_mask

        df_filtered = statement_df[~exclude_mask].copy()
    else:
        df_filtered = statement_df.copy()

    # Process each row
    for idx, row in df_filtered.iterrows():
        # Parse statement row
        stmt_trans = parse_statement_row(row, column_mapping)

        # Skip if no customer or policy
        if not stmt_trans['customer'] and not stmt_trans['policy_number']:
            continue

        # Try to find matching policy
        match_result = find_matching_policy(stmt_trans, existing_policies, agency_id)

        if match_result:
            # Found a match - this is a reconciliation entry
            matched_item = {
                **stmt_trans,
                'match': match_result['policy'],
                'confidence': match_result['confidence'],
                'match_type': match_result['match_type'],
                'matched_agent_id': match_result['matched_agent_id'],
                'assigned_agent_id': match_result['matched_agent_id'],  # Inherit from matched policy
                'assignment_method': 'matched_policy'
            }
            matched_transactions.append(matched_item)

        else:
            # No match - this is a new transaction to create
            # Apply assignment logic based on mode

            if assignment_mode == 'assign_all' and selected_agent_id:
                # Bulk assign to selected agent
                stmt_trans['assigned_agent_id'] = selected_agent_id
                stmt_trans['assignment_method'] = 'bulk_assigned'

            elif assignment_mode == 'auto_assign':
                # Try to auto-assign based on customer history
                agent_id = auto_assign_by_customer_history(
                    stmt_trans['customer'],
                    existing_policies,
                    agency_id
                )

                if agent_id:
                    stmt_trans['assigned_agent_id'] = agent_id
                    stmt_trans['assignment_method'] = 'auto_assigned'
                else:
                    stmt_trans['assigned_agent_id'] = None
                    stmt_trans['assignment_method'] = 'needs_manual'

            else:  # manual
                stmt_trans['assigned_agent_id'] = None
                stmt_trans['assignment_method'] = 'manual'

            # Add to unmatched list
            unmatched_transactions.append(stmt_trans)

    return matched_transactions, unmatched_transactions, to_create_transactions


def create_stmt_entry(
    original_transaction: Dict,
    stmt_amount: float,
    stmt_date: str,
    reconciliation_id: str,
    agent_id: str,
    agency_id: str
) -> Dict:
    """
    Create a -STMT- reconciliation entry with agent attribution.

    Args:
        original_transaction: Original policy transaction
        stmt_amount: Amount from statement
        stmt_date: Statement date
        reconciliation_id: Unique reconciliation ID
        agent_id: Agent ID
        agency_id: Agency ID

    Returns:
        -STMT- transaction dictionary
    """
    original_trans_id = original_transaction.get('Transaction ID', '')

    # Create -STMT- transaction ID
    stmt_trans_id = f"{original_trans_id}-STMT-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Create -STMT- entry
    stmt_entry = {
        'Transaction ID': stmt_trans_id,
        'Customer': original_transaction.get('Customer'),
        'Policy Number': original_transaction.get('Policy Number'),
        'Effective Date': original_transaction.get('Effective Date'),
        'Carrier Name': original_transaction.get('Carrier Name'),
        'Transaction Type': original_transaction.get('Transaction Type'),
        'Policy Type': original_transaction.get('Policy Type'),
        'Agent Paid Amount (STMT)': stmt_amount,
        'Total Agent Comm': 0,  # -STMT- entries have $0 commission expected
        'STMT DATE': stmt_date,
        'reconciliation_id': reconciliation_id,
        'agent_id': agent_id,  # CRITICAL: Agent attribution
        'agency_id': agency_id,  # CRITICAL: Agency attribution
        'Premium Sold': 0
    }

    return stmt_entry


def create_new_transaction(
    stmt_trans: Dict,
    agent_id: str,
    agency_id: str,
    user_id: str
) -> Dict:
    """
    Create a new transaction from statement data with agent attribution.

    Args:
        stmt_trans: Statement transaction data
        agent_id: Agent ID
        agency_id: Agency ID
        user_id: User ID (for RLS)

    Returns:
        New transaction dictionary
    """
    # Generate transaction ID
    trans_id = f"NEW-{datetime.now().strftime('%Y%m%d%H%M%S')}-{hash(stmt_trans['policy_number']) % 10000}"

    new_trans = {
        'Transaction ID': trans_id,
        'Customer': stmt_trans['customer'],
        'Policy Number': stmt_trans['policy_number'],
        'Effective Date': stmt_trans['effective_date'],
        'Carrier Name': stmt_trans['carrier'],
        'Transaction Type': stmt_trans['trans_type'],
        'Policy Type': stmt_trans['policy_type'],
        'Total Agent Comm': stmt_trans['amount'],
        'Agent Paid Amount (STMT)': 0,  # New transactions start with $0 paid
        'agent_id': agent_id,  # CRITICAL: Agent attribution
        'agency_id': agency_id,  # CRITICAL: Agency attribution
        'user_id': user_id,  # For RLS
        'Premium Sold': stmt_trans.get('premium', 0)
    }

    return new_trans
