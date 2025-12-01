"""
Agent Data Helpers
Utility functions for loading agent-specific performance data
Created: December 1, 2025
Branch: agency-platform-phase2
Phase: 2, Sprint 1, Task 1.2
"""

import os
from typing import Optional, Dict, List, Any
from supabase import create_client
from datetime import datetime, timedelta
import pandas as pd

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


def get_agent_performance_metrics(agent_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get performance metrics for a specific agent.

    Args:
        agent_id: Agent's unique ID
        year: Year to filter (default: current year)

    Returns:
        Dict with premium_ytd, commission_ytd, policies_count, etc.
    """
    if not supabase:
        return {
            'premium_ytd': 0,
            'commission_ytd': 0,
            'policies_count': 0,
            'avg_premium_per_policy': 0
        }

    try:
        if year is None:
            year = datetime.now().year

        # Query policies for this agent
        query = supabase.table('policies').select('*').eq('agent_id', agent_id)

        # Filter by year if provided
        if year:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            query = query.gte('"Effective Date"', start_date).lte('"Effective Date"', end_date)

        response = query.execute()

        if not response.data:
            return {
                'premium_ytd': 0,
                'commission_ytd': 0,
                'policies_count': 0,
                'avg_premium_per_policy': 0
            }

        # Calculate metrics
        df = pd.DataFrame(response.data)

        premium_ytd = df['Premium'].sum() if 'Premium' in df.columns else 0
        commission_ytd = df['Commission Amount'].sum() if 'Commission Amount' in df.columns else 0
        policies_count = len(df)
        avg_premium_per_policy = premium_ytd / policies_count if policies_count > 0 else 0

        return {
            'premium_ytd': premium_ytd,
            'commission_ytd': commission_ytd,
            'policies_count': policies_count,
            'avg_premium_per_policy': avg_premium_per_policy
        }

    except Exception as e:
        print(f"Error getting agent performance metrics: {e}")
        return {
            'premium_ytd': 0,
            'commission_ytd': 0,
            'policies_count': 0,
            'avg_premium_per_policy': 0
        }


def get_agent_rank(agent_id: str, agency_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get agent's rank within their agency.

    Args:
        agent_id: Agent's unique ID
        agency_id: Agency ID
        year: Year to filter (default: current year)

    Returns:
        Dict with rank, total_agents, percentile
    """
    if not supabase:
        return {'rank': 1, 'total_agents': 1, 'percentile': 100}

    try:
        if year is None:
            year = datetime.now().year

        # Get all agents in the agency
        agents_response = supabase.table('agents').select('id').eq('agency_id', agency_id).eq('is_active', True).execute()

        if not agents_response.data:
            return {'rank': 1, 'total_agents': 1, 'percentile': 100}

        agent_ids = [a['id'] for a in agents_response.data]
        total_agents = len(agent_ids)

        # Get performance for all agents
        agent_performances = []
        for aid in agent_ids:
            metrics = get_agent_performance_metrics(aid, year)
            agent_performances.append({
                'agent_id': aid,
                'premium_ytd': metrics['premium_ytd']
            })

        # Sort by premium (descending)
        agent_performances.sort(key=lambda x: x['premium_ytd'], reverse=True)

        # Find current agent's rank
        rank = 1
        for i, perf in enumerate(agent_performances):
            if perf['agent_id'] == agent_id:
                rank = i + 1
                break

        percentile = ((total_agents - rank + 1) / total_agents) * 100 if total_agents > 0 else 100

        return {
            'rank': rank,
            'total_agents': total_agents,
            'percentile': round(percentile, 1)
        }

    except Exception as e:
        print(f"Error getting agent rank: {e}")
        return {'rank': 1, 'total_agents': 1, 'percentile': 100}


def get_agent_monthly_trends(agent_id: str, months: int = 6) -> pd.DataFrame:
    """
    Get monthly premium trends for an agent.

    Args:
        agent_id: Agent's unique ID
        months: Number of months to include (default: 6)

    Returns:
        DataFrame with columns: month, premium, commission, policies
    """
    if not supabase:
        return pd.DataFrame(columns=['month', 'premium', 'commission', 'policies'])

    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        # Query policies
        response = supabase.table('policies').select('*').eq('agent_id', agent_id).gte(
            '"Effective Date"', start_date.strftime('%Y-%m-%d')
        ).execute()

        if not response.data:
            return pd.DataFrame(columns=['month', 'premium', 'commission', 'policies'])

        df = pd.DataFrame(response.data)
        df['Effective Date'] = pd.to_datetime(df['Effective Date'])
        df['month'] = df['Effective Date'].dt.to_period('M').astype(str)

        # Group by month
        monthly = df.groupby('month').agg({
            'Premium': 'sum',
            'Commission Amount': 'sum',
            'Policy Number': 'count'
        }).reset_index()

        monthly.columns = ['month', 'premium', 'commission', 'policies']

        return monthly

    except Exception as e:
        print(f"Error getting agent monthly trends: {e}")
        return pd.DataFrame(columns=['month', 'premium', 'commission', 'policies'])


def get_agent_carrier_breakdown(agent_id: str, year: int = None) -> pd.DataFrame:
    """
    Get commission breakdown by carrier for an agent.

    Args:
        agent_id: Agent's unique ID
        year: Year to filter (default: current year)

    Returns:
        DataFrame with columns: carrier, commission, premium, policies
    """
    if not supabase:
        return pd.DataFrame(columns=['carrier', 'commission', 'premium', 'policies'])

    try:
        if year is None:
            year = datetime.now().year

        # Query policies
        query = supabase.table('policies').select('*').eq('agent_id', agent_id)

        if year:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            query = query.gte('"Effective Date"', start_date).lte('"Effective Date"', end_date)

        response = query.execute()

        if not response.data:
            return pd.DataFrame(columns=['carrier', 'commission', 'premium', 'policies'])

        df = pd.DataFrame(response.data)

        # Group by carrier
        carrier_breakdown = df.groupby('Carrier').agg({
            'Commission Amount': 'sum',
            'Premium': 'sum',
            'Policy Number': 'count'
        }).reset_index()

        carrier_breakdown.columns = ['carrier', 'commission', 'premium', 'policies']
        carrier_breakdown = carrier_breakdown.sort_values('commission', ascending=False)

        return carrier_breakdown

    except Exception as e:
        print(f"Error getting agent carrier breakdown: {e}")
        return pd.DataFrame(columns=['carrier', 'commission', 'premium', 'policies'])


def get_agency_average_metrics(agency_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get average performance metrics across all agents in the agency.

    Args:
        agency_id: Agency ID
        year: Year to filter (default: current year)

    Returns:
        Dict with avg_premium, avg_commission, avg_policies
    """
    if not supabase:
        return {'avg_premium': 0, 'avg_commission': 0, 'avg_policies': 0}

    try:
        if year is None:
            year = datetime.now().year

        # Get all active agents
        agents_response = supabase.table('agents').select('id').eq('agency_id', agency_id).eq('is_active', True).execute()

        if not agents_response.data:
            return {'avg_premium': 0, 'avg_commission': 0, 'avg_policies': 0}

        agent_ids = [a['id'] for a in agents_response.data]

        # Get metrics for all agents
        total_premium = 0
        total_commission = 0
        total_policies = 0

        for aid in agent_ids:
            metrics = get_agent_performance_metrics(aid, year)
            total_premium += metrics['premium_ytd']
            total_commission += metrics['commission_ytd']
            total_policies += metrics['policies_count']

        num_agents = len(agent_ids)

        return {
            'avg_premium': total_premium / num_agents if num_agents > 0 else 0,
            'avg_commission': total_commission / num_agents if num_agents > 0 else 0,
            'avg_policies': total_policies / num_agents if num_agents > 0 else 0
        }

    except Exception as e:
        print(f"Error getting agency average metrics: {e}")
        return {'avg_premium': 0, 'avg_commission': 0, 'avg_policies': 0}


def get_agent_recent_activity(agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent activity for an agent (policies, commissions, etc.)

    Args:
        agent_id: Agent's unique ID
        limit: Number of recent activities to return

    Returns:
        List of activity dicts with type, description, date, amount
    """
    if not supabase:
        return []

    try:
        # Get recent policies
        policies_response = supabase.table('policies').select('*').eq(
            'agent_id', agent_id
        ).order('"Effective Date"', desc=True).limit(limit).execute()

        activities = []

        if policies_response.data:
            for policy in policies_response.data:
                activities.append({
                    'type': 'policy',
                    'description': f"New policy: {policy.get('Customer Name', 'Unknown')} - {policy.get('Carrier', 'Unknown')}",
                    'date': policy.get('Effective Date', ''),
                    'amount': policy.get('Premium', 0)
                })

        # Sort by date (most recent first)
        activities.sort(key=lambda x: x['date'], reverse=True)

        return activities[:limit]

    except Exception as e:
        print(f"Error getting agent recent activity: {e}")
        return []
