"""
Agency Reconciliation Helpers
Helper functions for agency-specific reconciliation operations
"""
import streamlit as st
from supabase import Client, create_client
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import pandas as pd


def get_supabase_client() -> Client:
    """Get Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key)


def load_agency_policies_for_matching(agency_id: str) -> List[Dict]:
    """
    Load all agency policies for matching (cross-agent).

    Args:
        agency_id: Agency ID

    Returns:
        List of all agency policies
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('policies')\
            .select('*')\
            .eq('agency_id', agency_id)\
            .order('Effective Date', desc=True)\
            .execute()

        return result.data if result.data else []
    except Exception as e:
        st.error(f"Error loading agency policies: {e}")
        return []


def load_agent_policies(agent_id: str) -> List[Dict]:
    """
    Load specific agent's policies.

    Args:
        agent_id: Agent ID

    Returns:
        List of agent's policies
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table('policies')\
            .select('*')\
            .eq('agent_id', agent_id)\
            .order('Effective Date', desc=True)\
            .execute()

        return result.data if result.data else []
    except Exception as e:
        st.error(f"Error loading agent policies: {e}")
        return []


def get_agency_reconciliation_summary(agency_id: str) -> Dict:
    """
    Get reconciliation summary by agent.

    Args:
        agency_id: Agency ID

    Returns:
        Summary dictionary with agent-level metrics
    """
    try:
        supabase = get_supabase_client()

        # Get all transactions for the agency
        result = supabase.table('policies')\
            .select('agent_id, "Total Agent Comm", "Agent Paid Amount (STMT)", "Transaction ID"')\
            .eq('agency_id', agency_id)\
            .execute()

        if not result.data:
            return {
                'total_expected': 0,
                'total_reconciled': 0,
                'outstanding_balance': 0,
                'by_agent': []
            }

        # Convert to DataFrame for easier aggregation
        df = pd.DataFrame(result.data)

        # Separate original transactions from -STMT- entries
        df['is_stmt'] = df['Transaction ID'].str.contains('-STMT-', na=False)

        # Calculate expected (from original transactions)
        expected_df = df[~df['is_stmt']].groupby('agent_id')['Total Agent Comm'].sum()

        # Calculate reconciled (from -STMT- entries)
        reconciled_df = df[df['is_stmt']].groupby('agent_id')['Agent Paid Amount (STMT)'].sum()

        # Build summary by agent
        by_agent = []
        all_agents = set(list(expected_df.index) + list(reconciled_df.index))

        for agent_id in all_agents:
            if agent_id and pd.notna(agent_id):
                expected = expected_df.get(agent_id, 0) or 0
                reconciled = reconciled_df.get(agent_id, 0) or 0
                balance = expected - reconciled

                by_agent.append({
                    'agent_id': agent_id,
                    'expected': float(expected),
                    'reconciled': float(reconciled),
                    'balance': float(balance)
                })

        # Calculate totals
        total_expected = sum(a['expected'] for a in by_agent)
        total_reconciled = sum(a['reconciled'] for a in by_agent)
        outstanding_balance = total_expected - total_reconciled

        return {
            'total_expected': total_expected,
            'total_reconciled': total_reconciled,
            'outstanding_balance': outstanding_balance,
            'by_agent': by_agent
        }

    except Exception as e:
        st.error(f"Error calculating reconciliation summary: {e}")
        return {
            'total_expected': 0,
            'total_reconciled': 0,
            'outstanding_balance': 0,
            'by_agent': []
        }


def insert_transaction_with_agent(
    transaction_data: Dict,
    agent_id: str,
    agency_id: str,
    user_id: str
) -> Tuple[bool, str]:
    """
    Insert transaction with agent and agency attribution.

    Args:
        transaction_data: Transaction data
        agent_id: Agent ID
        agency_id: Agency ID
        user_id: User ID (for RLS)

    Returns:
        Tuple of (success, message)
    """
    try:
        supabase = get_supabase_client()

        # Add agent and agency
        transaction_data['agent_id'] = agent_id
        transaction_data['agency_id'] = agency_id
        transaction_data['user_id'] = user_id

        result = supabase.table('policies').insert(transaction_data).execute()

        if result.data:
            return True, "Transaction created successfully"
        else:
            return False, "Error inserting transaction"

    except Exception as e:
        return False, str(e)


def bulk_insert_transactions(
    transactions: List[Dict],
    agency_id: str,
    user_id: str
) -> Tuple[bool, str, int]:
    """
    Bulk insert transactions with agent attribution.

    Args:
        transactions: List of transactions with agent_id already assigned
        agency_id: Agency ID
        user_id: User ID (for RLS)

    Returns:
        Tuple of (success, message, count_inserted)
    """
    try:
        supabase = get_supabase_client()

        # Add agency_id and user_id to all transactions
        for trans in transactions:
            trans['agency_id'] = agency_id
            trans['user_id'] = user_id

        # Bulk insert
        result = supabase.table('policies').insert(transactions).execute()

        if result.data:
            count = len(result.data)
            return True, f"Successfully inserted {count} transactions", count
        else:
            return False, "Error inserting transactions", 0

    except Exception as e:
        return False, str(e), 0


def get_recent_imports(agency_id: str, limit: int = 10) -> List[Dict]:
    """
    Get recent reconciliation imports for the agency.

    Args:
        agency_id: Agency ID
        limit: Number of recent imports to retrieve

    Returns:
        List of recent import batches
    """
    try:
        supabase = get_supabase_client()

        # Get -STMT- entries grouped by reconciliation_id
        result = supabase.table('policies')\
            .select('reconciliation_id, "STMT DATE", agent_id, "Carrier Name"')\
            .eq('agency_id', agency_id)\
            .like('Transaction ID', '%-STMT-%')\
            .order('STMT DATE', desc=True)\
            .limit(limit * 10)\
            .execute()

        if not result.data:
            return []

        # Group by reconciliation_id
        df = pd.DataFrame(result.data)
        grouped = df.groupby('reconciliation_id').agg({
            'STMT DATE': 'first',
            'agent_id': 'first',
            'Carrier Name': 'first',
            'reconciliation_id': 'count'
        }).rename(columns={'reconciliation_id': 'count'})

        grouped = grouped.sort_values('STMT DATE', ascending=False).head(limit)

        imports = []
        for recon_id, row in grouped.iterrows():
            imports.append({
                'reconciliation_id': recon_id,
                'date': row['STMT DATE'],
                'agent_id': row['agent_id'],
                'carrier': row['Carrier Name'],
                'count': row['count']
            })

        return imports

    except Exception as e:
        st.error(f"Error loading recent imports: {e}")
        return []


def filter_policies_by_role(
    policies: List[Dict],
    user_role: str,
    agent_id: Optional[str] = None
) -> List[Dict]:
    """
    Filter policies based on user role.

    Args:
        policies: List of policies
        user_role: User's role (owner, admin, manager, agent)
        agent_id: Agent ID (required for role='agent')

    Returns:
        Filtered list of policies
    """
    if user_role in ['owner', 'admin', 'manager']:
        # Admins see all agency data
        return policies
    elif user_role == 'agent' and agent_id:
        # Agents see only their own data
        return [p for p in policies if p.get('agent_id') == agent_id]
    else:
        return []


def get_agent_name_map(agency_id: str) -> Dict[str, str]:
    """
    Get mapping of agent_id to agent name.

    Args:
        agency_id: Agency ID

    Returns:
        Dictionary mapping agent_id to agent name
    """
    try:
        supabase = get_supabase_client()

        # Get agents with user information
        result = supabase.table('agents')\
            .select('id, users!inner(full_name)')\
            .eq('agency_id', agency_id)\
            .execute()

        if not result.data:
            return {}

        agent_map = {}
        for agent in result.data:
            agent_id = agent['id']
            agent_name = agent['users']['full_name']
            agent_map[agent_id] = agent_name

        return agent_map

    except Exception as e:
        st.error(f"Error loading agent names: {e}")
        return {}


def validate_agency_access(user_id: str, agency_id: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validate that user has access to agency and get their role.

    Args:
        user_id: User ID
        agency_id: Agency ID

    Returns:
        Tuple of (has_access, role, agent_id)
    """
    try:
        supabase = get_supabase_client()

        # Check if user is an agent in this agency
        result = supabase.table('agents')\
            .select('id, role')\
            .eq('user_id', user_id)\
            .eq('agency_id', agency_id)\
            .eq('is_active', True)\
            .execute()

        if result.data and len(result.data) > 0:
            agent = result.data[0]
            return True, agent['role'], agent['id']
        else:
            return False, None, None

    except Exception as e:
        st.error(f"Error validating agency access: {e}")
        return False, None, None
