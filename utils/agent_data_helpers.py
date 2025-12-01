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


def get_agent_growth_metrics(agent_id: str) -> Dict[str, Any]:
    """
    Calculate growth metrics for an agent (MoM, YoY).

    Args:
        agent_id: Agent's unique ID

    Returns:
        Dict with mom_growth, yoy_growth, premium_trend, etc.
    """
    if not supabase:
        return {
            'mom_growth': 0,
            'yoy_growth': 0,
            'premium_trend': 'stable',
            'commission_trend': 'stable'
        }

    try:
        current_year = datetime.now().year
        current_month = datetime.now().month
        last_month = current_month - 1 if current_month > 1 else 12
        last_month_year = current_year if current_month > 1 else current_year - 1

        # Get current month metrics
        current_month_start = f"{current_year}-{current_month:02d}-01"
        current_metrics = get_agent_performance_metrics(agent_id, current_year)

        # Get last month metrics (approximate)
        last_month_start = f"{last_month_year}-{last_month:02d}-01"
        last_month_metrics = get_agent_performance_metrics(agent_id, last_month_year)

        # Get last year metrics
        last_year_metrics = get_agent_performance_metrics(agent_id, current_year - 1)

        # Calculate MoM growth (rough approximation)
        current_premium = current_metrics['premium_ytd']
        last_year_premium = last_year_metrics['premium_ytd']

        # YoY growth
        yoy_growth = ((current_premium - last_year_premium) / last_year_premium * 100) if last_year_premium > 0 else 0

        # Determine trends
        premium_trend = 'up' if current_premium > last_year_premium else 'down' if current_premium < last_year_premium else 'stable'
        commission_trend = 'up' if current_metrics['commission_ytd'] > last_year_metrics['commission_ytd'] else 'down'

        return {
            'mom_growth': 0,  # Would need more granular data
            'yoy_growth': round(yoy_growth, 1),
            'premium_trend': premium_trend,
            'commission_trend': commission_trend,
            'current_year_premium': current_premium,
            'last_year_premium': last_year_premium
        }

    except Exception as e:
        print(f"Error calculating growth metrics: {e}")
        return {
            'mom_growth': 0,
            'yoy_growth': 0,
            'premium_trend': 'stable',
            'commission_trend': 'stable'
        }


def get_agent_performance_indicators(agent_id: str, agency_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get performance indicators comparing agent to agency benchmarks.

    Args:
        agent_id: Agent's unique ID
        agency_id: Agency ID
        year: Year to analyze

    Returns:
        Dict with performance indicators, badges, status
    """
    if not supabase:
        return {
            'status': 'average',
            'badges': [],
            'strengths': [],
            'areas_to_improve': []
        }

    try:
        if year is None:
            year = datetime.now().year

        # Get agent and agency metrics
        agent_metrics = get_agent_performance_metrics(agent_id, year)
        agency_avg = get_agency_average_metrics(agency_id, year)
        rank_info = get_agent_rank(agent_id, agency_id, year)

        # Calculate performance indicators
        premium_vs_avg = (agent_metrics['premium_ytd'] / agency_avg['avg_premium'] * 100) if agency_avg['avg_premium'] > 0 else 0
        commission_vs_avg = (agent_metrics['commission_ytd'] / agency_avg['avg_commission'] * 100) if agency_avg['avg_commission'] > 0 else 0
        policies_vs_avg = (agent_metrics['policies_count'] / agency_avg['avg_policies'] * 100) if agency_avg['avg_policies'] > 0 else 0

        # Determine status
        if rank_info['rank'] <= 3:
            status = 'top_performer'
        elif premium_vs_avg >= 100:
            status = 'above_average'
        elif premium_vs_avg >= 80:
            status = 'average'
        else:
            status = 'needs_improvement'

        # Identify badges
        badges = []
        if rank_info['rank'] == 1:
            badges.append('🥇 Top Producer')
        elif rank_info['rank'] <= 3:
            badges.append('🏆 Top 3')
        if premium_vs_avg >= 150:
            badges.append('⭐ Premium Star')
        if agent_metrics['policies_count'] > agency_avg['avg_policies'] * 1.5:
            badges.append('📋 Volume Leader')

        # Identify strengths
        strengths = []
        if premium_vs_avg >= 110:
            strengths.append('Premium volume above average')
        if commission_vs_avg >= 110:
            strengths.append('Commission earnings above average')
        if policies_vs_avg >= 110:
            strengths.append('Policy count above average')
        if agent_metrics['avg_premium_per_policy'] > agency_avg['avg_premium'] / agency_avg['avg_policies'] * 1.1:
            strengths.append('High-value policies')

        # Identify areas to improve
        areas_to_improve = []
        if premium_vs_avg < 90:
            areas_to_improve.append('Increase premium volume')
        if policies_vs_avg < 90:
            areas_to_improve.append('Write more policies')
        if agent_metrics['avg_premium_per_policy'] < agency_avg['avg_premium'] / agency_avg['avg_policies'] * 0.9:
            areas_to_improve.append('Focus on higher-value policies')

        return {
            'status': status,
            'badges': badges,
            'strengths': strengths,
            'areas_to_improve': areas_to_improve,
            'premium_vs_avg_pct': round(premium_vs_avg, 1),
            'commission_vs_avg_pct': round(commission_vs_avg, 1),
            'policies_vs_avg_pct': round(policies_vs_avg, 1)
        }

    except Exception as e:
        print(f"Error getting performance indicators: {e}")
        return {
            'status': 'average',
            'badges': [],
            'strengths': [],
            'areas_to_improve': []
        }


def get_agent_goal_progress(agent_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get agent's progress toward goals (placeholder for future goal tracking).

    Args:
        agent_id: Agent's unique ID
        year: Year to analyze

    Returns:
        Dict with goal progress information
    """
    if not supabase:
        return {
            'has_goals': False,
            'goals': []
        }

    try:
        if year is None:
            year = datetime.now().year

        # Get current metrics
        metrics = get_agent_performance_metrics(agent_id, year)

        # Example goals (in future, these would come from database)
        example_goals = [
            {
                'type': 'premium',
                'target': 500000,
                'current': metrics['premium_ytd'],
                'progress': (metrics['premium_ytd'] / 500000 * 100) if metrics['premium_ytd'] > 0 else 0,
                'label': 'Premium Goal'
            },
            {
                'type': 'policies',
                'target': 100,
                'current': metrics['policies_count'],
                'progress': (metrics['policies_count'] / 100 * 100) if metrics['policies_count'] > 0 else 0,
                'label': 'Policy Count Goal'
            }
        ]

        return {
            'has_goals': True,
            'goals': example_goals
        }

    except Exception as e:
        print(f"Error getting goal progress: {e}")
        return {
            'has_goals': False,
            'goals': []
        }
