"""
Agent Assignment Logic
Handles assignment of transactions to agents in agency reconciliation
"""
import streamlit as st
from typing import Dict, List, Optional, Tuple


def auto_assign_by_policy_ownership(
    statement_transaction: Dict,
    existing_policies: List[Dict],
    agency_id: str
) -> Optional[str]:
    """
    Auto-assign transaction to agent based on existing policy ownership.

    Args:
        statement_transaction: Transaction from carrier statement
        existing_policies: List of existing agency policies
        agency_id: Agency ID for filtering

    Returns:
        agent_id if found, None if no match
    """
    policy_number = statement_transaction.get('policy_number', '')
    customer_name = statement_transaction.get('customer', '')

    if not policy_number and not customer_name:
        return None

    # Try exact policy number match first
    if policy_number:
        for policy in existing_policies:
            if (policy.get('Policy Number', '') == policy_number and
                policy.get('agency_id') == agency_id):
                return policy.get('agent_id')

    # Try customer name match as fallback
    if customer_name:
        customer_lower = customer_name.lower().strip()
        for policy in existing_policies:
            policy_customer = policy.get('Customer', '').lower().strip()
            if (policy_customer == customer_lower and
                policy.get('agency_id') == agency_id):
                return policy.get('agent_id')

    return None


def auto_assign_by_customer_history(
    customer_name: str,
    existing_policies: List[Dict],
    agency_id: str
) -> Optional[str]:
    """
    Find agent based on customer's historical policies.

    Args:
        customer_name: Customer name from statement
        existing_policies: List of existing agency policies
        agency_id: Agency ID for filtering

    Returns:
        agent_id if customer found, None otherwise
    """
    if not customer_name:
        return None

    customer_lower = customer_name.lower().strip()

    # Find all policies for this customer
    customer_policies = [
        p for p in existing_policies
        if (p.get('Customer', '').lower().strip() == customer_lower and
            p.get('agency_id') == agency_id and
            p.get('agent_id') is not None)
    ]

    if not customer_policies:
        return None

    # Return the most common agent_id for this customer
    # (handles case where customer has policies with multiple agents)
    agent_counts = {}
    for policy in customer_policies:
        agent_id = policy.get('agent_id')
        agent_counts[agent_id] = agent_counts.get(agent_id, 0) + 1

    # Return agent with most policies for this customer
    if agent_counts:
        return max(agent_counts, key=agent_counts.get)

    return None


def validate_agent_assignment(
    agent_id: str,
    agency_id: str,
    valid_agents: List[Dict]
) -> Tuple[bool, str]:
    """
    Validate that agent belongs to agency and is active.

    Args:
        agent_id: Agent ID to validate
        agency_id: Agency ID
        valid_agents: List of valid agents for the agency

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not agent_id:
        return False, "No agent ID provided"

    # Find agent in valid agents list
    agent = next((a for a in valid_agents if a['id'] == agent_id), None)

    if not agent:
        return False, f"Agent ID {agent_id} not found in agency"

    if agent.get('agency_id') != agency_id:
        return False, "Agent does not belong to this agency"

    if not agent.get('is_active', True):
        return False, f"Agent {agent.get('name', 'Unknown')} is inactive"

    return True, ""


def get_assignment_mode(user_role: str) -> str:
    """
    Determine assignment mode based on user role.

    Args:
        user_role: User's role (owner, admin, manager, agent)

    Returns:
        Assignment mode: 'auto_to_self' or 'flexible'
    """
    if user_role in ['owner', 'admin', 'manager']:
        return 'flexible'  # Can choose assignment strategy
    else:
        return 'auto_to_self'  # Agents always assign to themselves


def bulk_assign_transactions(
    transactions: List[Dict],
    assignment_strategy: str,
    selected_agent_id: Optional[str],
    existing_policies: List[Dict],
    agency_id: str
) -> List[Dict]:
    """
    Bulk assign agent_id to list of transactions.

    Args:
        transactions: List of statement transactions
        assignment_strategy: 'assign_all', 'auto_assign', or 'manual'
        selected_agent_id: Agent ID if using 'assign_all'
        existing_policies: Existing policies for auto-assignment
        agency_id: Agency ID

    Returns:
        List of transactions with agent_id added
    """
    assigned_transactions = []

    for trans in transactions:
        trans_copy = trans.copy()

        if assignment_strategy == 'assign_all' and selected_agent_id:
            # Assign all to selected agent
            trans_copy['assigned_agent_id'] = selected_agent_id
            trans_copy['assignment_method'] = 'bulk_assigned'

        elif assignment_strategy == 'auto_assign':
            # Try to auto-assign based on policy ownership
            agent_id = auto_assign_by_policy_ownership(
                trans_copy,
                existing_policies,
                agency_id
            )

            if agent_id:
                trans_copy['assigned_agent_id'] = agent_id
                trans_copy['assignment_method'] = 'auto_assigned'
            else:
                # No match found, needs manual assignment
                trans_copy['assigned_agent_id'] = None
                trans_copy['assignment_method'] = 'needs_manual'

        else:  # manual
            # Leave unassigned for manual assignment in review
            trans_copy['assigned_agent_id'] = None
            trans_copy['assignment_method'] = 'manual'

        assigned_transactions.append(trans_copy)

    return assigned_transactions


def get_unassigned_count(transactions: List[Dict]) -> int:
    """
    Count how many transactions still need agent assignment.

    Args:
        transactions: List of transactions

    Returns:
        Count of unassigned transactions
    """
    return sum(1 for t in transactions if not t.get('assigned_agent_id'))


def reassign_transaction(
    transaction: Dict,
    new_agent_id: str,
    reason: str = "manual_reassignment"
) -> Dict:
    """
    Reassign a transaction to a different agent.

    Args:
        transaction: Transaction to reassign
        new_agent_id: New agent ID
        reason: Reason for reassignment

    Returns:
        Updated transaction
    """
    transaction['assigned_agent_id'] = new_agent_id
    transaction['assignment_method'] = reason
    transaction['reassigned'] = True

    return transaction
