"""
Agency Platform Utilities
Handles multi-tenant agency features and agent management
Created: 2025-10-09
Branch: agency-platform
"""

import os
import json
from typing import Optional, Dict, List, Any
from supabase import create_client

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


# ============================================
# AGENCY DETECTION & CONFIGURATION
# ============================================

def is_agency_account(user_email: str) -> bool:
    """
    Check if user is an agency owner (multi-tenant) or solo agent.

    Args:
        user_email: Email address of the user

    Returns:
        True if user owns an agency, False if solo agent
    """
    if not supabase:
        return False

    try:
        response = supabase.table('agencies').select('id').eq('owner_email', user_email).execute()
        return len(response.data) > 0
    except Exception as e:
        print(f"Error checking agency account: {e}")
        return False


def get_agency_config(user_email: str) -> Optional[Dict[str, Any]]:
    """
    Get agency configuration for a user.

    Args:
        user_email: Email address of agency owner

    Returns:
        Agency config dict or None if not an agency
    """
    if not supabase:
        return None

    try:
        response = supabase.table('agencies').select('*').eq('owner_email', user_email).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting agency config: {e}")
        return None


def get_agency_id(user_email: str) -> Optional[str]:
    """
    Get agency ID for a user.

    Args:
        user_email: Email address of agency owner

    Returns:
        Agency ID or None if not an agency
    """
    config = get_agency_config(user_email)
    return config.get('id') if config else None


# ============================================
# AGENT MANAGEMENT
# ============================================

def get_agency_agents(agency_id: str, active_only: bool = True) -> List[Dict[str, Any]]:
    """
    Get all agents for an agency.

    Args:
        agency_id: ID of the agency
        active_only: If True, only return active agents

    Returns:
        List of agent records
    """
    if not supabase:
        return []

    try:
        query = supabase.table('agents').select('*').eq('agency_id', agency_id)
        if active_only:
            query = query.eq('is_active', True)
        response = query.execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error getting agency agents: {e}")
        return []


def get_agent_info(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Get information about a specific agent.

    Args:
        agent_id: ID of the agent

    Returns:
        Agent record or None if not found
    """
    if not supabase:
        return None

    try:
        response = supabase.table('agents').select('*').eq('id', agent_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting agent info: {e}")
        return None


# ============================================
# DEMO MODE
# ============================================

def is_demo_mode() -> bool:
    """
    Check if app is running in demo mode.

    Returns:
        True if DEMO_MODE environment variable is set to 'true'
    """
    return os.getenv("DEMO_MODE", "false").lower() == "true"


def get_demo_agency_data() -> Dict[str, Any]:
    """
    Get fake but realistic agency data for demos.

    Returns:
        Dict with demo agency data
    """
    return {
        "agency_id": "demo_agency_001",
        "agency_name": "Demo Insurance Agency",
        "owner_email": "demo@example.com",
        "agents": [
            {
                "id": "demo_agent_001",
                "name": "John Smith",
                "email": "john@demoagency.com",
                "role": "agent",
                "policies": 45,
                "premium_ytd": 125000,
                "commission_ytd": 62500
            },
            {
                "id": "demo_agent_002",
                "name": "Sarah Johnson",
                "email": "sarah@demoagency.com",
                "role": "agent",
                "policies": 38,
                "premium_ytd": 98000,
                "commission_ytd": 49000
            },
            {
                "id": "demo_agent_003",
                "name": "Mike Davis",
                "email": "mike@demoagency.com",
                "role": "manager",
                "policies": 32,
                "premium_ytd": 87000,
                "commission_ytd": 43500
            }
        ],
        "integrations": [
            "Applied Epic",
            "QuickBooks Online",
            "HubSpot",
            "Salesforce",
            "EZLynx"
        ],
        "total_premium_ytd": 310000,
        "total_commission_ytd": 155000,
        "total_policies": 115
    }


# ============================================
# FILTERED DATA LOADING
# ============================================

def load_policies_for_agent(agent_id: str, user_email: str) -> List[Dict[str, Any]]:
    """
    Load policies filtered by agent ID.

    Args:
        agent_id: ID of the agent
        user_email: Email of current user (for security)

    Returns:
        List of policy records for this agent
    """
    if not supabase:
        return []

    try:
        # Verify user has access to this agent's data
        agent = get_agent_info(agent_id)
        if not agent:
            return []

        agency_id = agent.get('agency_id')
        agency = get_agency_config(user_email)

        if not agency or agency.get('id') != agency_id:
            # User doesn't own this agency
            return []

        # Load policies for this agent
        response = supabase.table('policies').select('*').eq('agent_id', agent_id).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error loading policies for agent: {e}")
        return []


def load_all_policies_for_agency(user_email: str) -> List[Dict[str, Any]]:
    """
    Load all policies for an agency (all agents).

    Args:
        user_email: Email of agency owner

    Returns:
        List of all policy records for this agency
    """
    if not supabase:
        return []

    try:
        agency_id = get_agency_id(user_email)
        if not agency_id:
            return []

        response = supabase.table('policies').select('*').eq('agency_id', agency_id).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error loading agency policies: {e}")
        return []


# ============================================
# INTEGRATION MANAGEMENT
# ============================================

def get_agency_integrations(agency_id: str) -> List[Dict[str, Any]]:
    """
    Get all integrations configured for an agency.

    Args:
        agency_id: ID of the agency

    Returns:
        List of integration records
    """
    if not supabase:
        return []

    try:
        response = supabase.table('agency_integrations').select('*').eq('agency_id', agency_id).eq('is_enabled', True).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Error getting agency integrations: {e}")
        return []


def has_integration(agency_id: str, integration_type: str) -> bool:
    """
    Check if agency has a specific integration enabled.

    Args:
        agency_id: ID of the agency
        integration_type: Type of integration (e.g., 'applied_epic', 'quickbooks')

    Returns:
        True if integration is enabled
    """
    integrations = get_agency_integrations(agency_id)
    return any(i.get('integration_type') == integration_type for i in integrations)


# ============================================
# STATISTICS & ANALYTICS
# ============================================

def get_agency_stats(agency_id: str) -> Dict[str, Any]:
    """
    Get high-level statistics for an agency.

    Args:
        agency_id: ID of the agency

    Returns:
        Dict with agency statistics
    """
    agents = get_agency_agents(agency_id)

    # In demo mode, return fake data
    if is_demo_mode():
        return get_demo_agency_data()

    # TODO: Calculate real stats from policies table
    return {
        "agency_id": agency_id,
        "total_agents": len(agents),
        "active_agents": len([a for a in agents if a.get('is_active')]),
        "total_policies": 0,  # Calculate from policies
        "total_premium_ytd": 0,  # Calculate from policies
        "total_commission_ytd": 0  # Calculate from transactions
    }
