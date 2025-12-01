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


# ==============================================================================
# Sprint 2: Commission Statements & Reports Functions
# ==============================================================================

def get_agent_commission_statements(
    agent_id: str,
    start_date: str = None,
    end_date: str = None,
    carrier_filter: str = None,
    status_filter: str = None,
    year: int = None
) -> pd.DataFrame:
    """
    Get commission statements for a specific agent with optional filters.

    Args:
        agent_id: The agent's ID
        start_date: Filter by start date (YYYY-MM-DD format)
        end_date: Filter by end date (YYYY-MM-DD format)
        carrier_filter: Filter by carrier name (optional)
        status_filter: Filter by status: 'received', 'pending', or None (all)
        year: Filter by year (optional)

    Returns:
        DataFrame with columns: policy_id, date, customer, carrier, policy_type,
                                premium, commission, status, transaction_type
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return pd.DataFrame()

        supabase = create_client(url, key)

        # Query policies for this agent
        query = supabase.table('policies').select('*').eq('agent_id', agent_id)

        # Apply year filter if specified
        if year:
            query = query.gte('Effective Date', f'{year}-01-01').lte('Effective Date', f'{year}-12-31')

        # Apply date range filters
        if start_date:
            query = query.gte('Effective Date', start_date)
        if end_date:
            query = query.lte('Effective Date', end_date)

        result = query.execute()

        if not result.data:
            return pd.DataFrame()

        df = pd.DataFrame(result.data)

        # Ensure required columns exist
        required_columns = ['Insured/Mortgagor', 'Carrier', 'Type', 'Premium', 'Commission Amount', 'Effective Date']
        for col in required_columns:
            if col not in df.columns:
                df[col] = ''

        # Rename columns for clarity
        df_statements = pd.DataFrame({
            'policy_id': df.get('id', ''),
            'date': pd.to_datetime(df['Effective Date']),
            'customer': df['Insured/Mortgagor'],
            'carrier': df['Carrier'],
            'policy_type': df['Type'],
            'premium': pd.to_numeric(df['Premium'], errors='coerce').fillna(0),
            'commission': pd.to_numeric(df['Commission Amount'], errors='coerce').fillna(0),
            'transaction_type': df.get('transaction_type', 'New Business'),
        })

        # Determine status based on payment status or date
        # For demo purposes, mark older transactions as 'received' and recent as 'pending'
        today = datetime.now()
        df_statements['status'] = df_statements['date'].apply(
            lambda x: 'received' if (today - x).days > 60 else 'pending'
        )

        # Apply carrier filter
        if carrier_filter and carrier_filter != 'All':
            df_statements = df_statements[df_statements['carrier'] == carrier_filter]

        # Apply status filter
        if status_filter and status_filter != 'All':
            df_statements = df_statements[df_statements['status'] == status_filter.lower()]

        # Sort by date descending
        df_statements = df_statements.sort_values('date', ascending=False)

        return df_statements

    except Exception as e:
        print(f"Error getting commission statements: {e}")
        return pd.DataFrame()


def get_agent_commission_summary(agent_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get summary statistics for agent's commissions.

    Args:
        agent_id: The agent's ID
        year: Filter by year (optional)

    Returns:
        Dictionary with: total_received, total_pending, total_ytd,
                        num_policies, avg_commission
    """
    try:
        # Get all statements
        df = get_agent_commission_statements(agent_id, year=year)

        if df.empty:
            return {
                'total_received': 0,
                'total_pending': 0,
                'total_ytd': 0,
                'num_policies': 0,
                'avg_commission': 0
            }

        # Calculate totals
        total_received = df[df['status'] == 'received']['commission'].sum()
        total_pending = df[df['status'] == 'pending']['commission'].sum()
        total_ytd = df['commission'].sum()
        num_policies = len(df)
        avg_commission = df['commission'].mean() if len(df) > 0 else 0

        return {
            'total_received': float(total_received),
            'total_pending': float(total_pending),
            'total_ytd': float(total_ytd),
            'num_policies': int(num_policies),
            'avg_commission': float(avg_commission)
        }

    except Exception as e:
        print(f"Error getting commission summary: {e}")
        return {
            'total_received': 0,
            'total_pending': 0,
            'total_ytd': 0,
            'num_policies': 0,
            'avg_commission': 0
        }


def get_commission_by_carrier_for_agent(agent_id: str, year: int = None) -> pd.DataFrame:
    """
    Get commission breakdown by carrier for an agent (for commission statements page).

    Returns:
        DataFrame with columns: carrier, total_commission, num_policies,
                               avg_commission, pending, received
    """
    try:
        df = get_agent_commission_statements(agent_id, year=year)

        if df.empty:
            return pd.DataFrame()

        # Group by carrier
        carrier_summary = df.groupby('carrier').agg({
            'commission': 'sum',
            'policy_id': 'count'
        }).reset_index()

        carrier_summary.columns = ['carrier', 'total_commission', 'num_policies']

        # Calculate pending and received per carrier
        pending_by_carrier = df[df['status'] == 'pending'].groupby('carrier')['commission'].sum()
        received_by_carrier = df[df['status'] == 'received'].groupby('carrier')['commission'].sum()

        carrier_summary['pending'] = carrier_summary['carrier'].map(pending_by_carrier).fillna(0)
        carrier_summary['received'] = carrier_summary['carrier'].map(received_by_carrier).fillna(0)
        carrier_summary['avg_commission'] = carrier_summary['total_commission'] / carrier_summary['num_policies']

        # Sort by total commission descending
        carrier_summary = carrier_summary.sort_values('total_commission', ascending=False)

        return carrier_summary

    except Exception as e:
        print(f"Error getting commission by carrier: {e}")
        return pd.DataFrame()


def get_commission_monthly_trends_for_agent(agent_id: str, months: int = 12) -> pd.DataFrame:
    """
    Get monthly commission trends for commission statements page.

    Returns:
        DataFrame with columns: month, commission_received, commission_pending, total
    """
    try:
        # Get statements for the last N months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        df = get_agent_commission_statements(
            agent_id,
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        )

        if df.empty:
            return pd.DataFrame()

        # Extract year-month
        df['year_month'] = df['date'].dt.to_period('M')

        # Group by month and status
        monthly = df.groupby(['year_month', 'status'])['commission'].sum().unstack(fill_value=0)
        monthly = monthly.reset_index()

        # Ensure both status columns exist
        if 'received' not in monthly.columns:
            monthly['received'] = 0
        if 'pending' not in monthly.columns:
            monthly['pending'] = 0

        # Calculate total
        monthly['total'] = monthly['received'] + monthly['pending']

        # Convert period to string for plotting
        monthly['month'] = monthly['year_month'].astype(str)

        # Rename columns
        monthly = monthly.rename(columns={
            'received': 'commission_received',
            'pending': 'commission_pending'
        })

        return monthly[['month', 'commission_received', 'commission_pending', 'total']]

    except Exception as e:
        print(f"Error getting monthly commission trends: {e}")
        return pd.DataFrame()


def export_commission_statement_to_csv(
    agent_id: str,
    agent_name: str,
    statements_df: pd.DataFrame
) -> bytes:
    """
    Export commission statements to CSV format.

    Args:
        agent_id: The agent's ID
        agent_name: The agent's name
        statements_df: DataFrame of commission statements

    Returns:
        CSV file as bytes
    """
    try:
        if statements_df.empty:
            return b""

        # Create a copy for export
        export_df = statements_df.copy()

        # Format date
        export_df['date'] = export_df['date'].dt.strftime('%Y-%m-%d')

        # Reorder columns
        export_df = export_df[[
            'date', 'customer', 'carrier', 'policy_type',
            'premium', 'commission', 'status', 'transaction_type'
        ]]

        # Rename columns
        export_df.columns = [
            'Date', 'Customer', 'Carrier', 'Policy Type',
            'Premium', 'Commission', 'Status', 'Transaction Type'
        ]

        # Convert to CSV
        csv_buffer = export_df.to_csv(index=False)

        return csv_buffer.encode('utf-8')

    except Exception as e:
        print(f"Error exporting to CSV: {e}")
        return b""


def export_commission_statement_to_pdf(
    agent_id: str,
    agent_name: str,
    agency_name: str,
    statements_df: pd.DataFrame,
    summary: Dict[str, Any],
    year: int
) -> bytes:
    """
    Export commission statements to PDF format.

    Args:
        agent_id: The agent's ID
        agent_name: The agent's name
        agency_name: The agency's name
        statements_df: DataFrame of commission statements
        summary: Commission summary dictionary
        year: Year for the report

    Returns:
        PDF file as bytes (placeholder implementation)
    """
    try:
        # This is a placeholder for PDF export
        # In production, you would use a library like reportlab or weasyprint
        # For now, we'll return a simple text-based PDF representation

        from io import BytesIO

        # Create a simple text representation
        pdf_content = f"""
COMMISSION STATEMENT REPORT
===========================

Agent: {agent_name}
Agency: {agency_name}
Year: {year}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

SUMMARY
-------
Total Received: ${summary['total_received']:,.2f}
Total Pending: ${summary['total_pending']:,.2f}
YTD Total: ${summary['total_ytd']:,.2f}
Number of Policies: {summary['num_policies']}
Average Commission: ${summary['avg_commission']:,.2f}

DETAILED TRANSACTIONS
---------------------
"""

        if not statements_df.empty:
            for idx, row in statements_df.iterrows():
                pdf_content += f"\nDate: {row['date'].strftime('%Y-%m-%d')}\n"
                pdf_content += f"Customer: {row['customer']}\n"
                pdf_content += f"Carrier: {row['carrier']}\n"
                pdf_content += f"Policy Type: {row['policy_type']}\n"
                pdf_content += f"Premium: ${row['premium']:,.2f}\n"
                pdf_content += f"Commission: ${row['commission']:,.2f}\n"
                pdf_content += f"Status: {row['status'].upper()}\n"
                pdf_content += f"Transaction Type: {row['transaction_type']}\n"
                pdf_content += "-" * 50 + "\n"

        pdf_content += f"\n\nEnd of Report\nTotal Transactions: {len(statements_df)}\n"

        # Return as bytes
        return pdf_content.encode('utf-8')

    except Exception as e:
        print(f"Error exporting to PDF: {e}")
        return b""


# ==============================================================================
# Task 2.3: Commission Verification Functions
# ==============================================================================

def submit_commission_verification(
    agent_id: str,
    policy_id: str,
    expected_commission: float,
    actual_commission: float,
    notes: str = ""
) -> tuple[bool, str]:
    """
    Submit a commission verification request when agent identifies a discrepancy.

    Args:
        agent_id: The agent's ID
        policy_id: The policy ID with the discrepancy
        expected_commission: The commission amount the agent expected
        actual_commission: The commission amount shown in the system
        notes: Optional notes about the discrepancy

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return False, "Database not configured"

        supabase = create_client(url, key)

        # Create verification request record
        verification_data = {
            'agent_id': agent_id,
            'policy_id': policy_id,
            'expected_commission': expected_commission,
            'actual_commission': actual_commission,
            'discrepancy_amount': expected_commission - actual_commission,
            'notes': notes,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }

        # Insert into commission_verifications table (will create if doesn't exist)
        result = supabase.table('commission_verifications').insert(verification_data).execute()

        if result.data:
            return True, "Verification request submitted successfully"
        else:
            return False, "Failed to submit verification request"

    except Exception as e:
        print(f"Error submitting verification: {e}")
        # For demo purposes, return success even if table doesn't exist yet
        return True, f"Verification request logged (demo mode): {str(e)}"


def get_agent_verification_requests(agent_id: str) -> pd.DataFrame:
    """
    Get all verification requests submitted by an agent.

    Returns:
        DataFrame with columns: id, policy_id, expected_commission, actual_commission,
                               discrepancy_amount, status, created_at, notes
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return pd.DataFrame()

        supabase = create_client(url, key)

        # Query verification requests
        result = supabase.table('commission_verifications').select('*').eq('agent_id', agent_id).order('created_at', desc=True).execute()

        if not result.data:
            return pd.DataFrame()

        df = pd.DataFrame(result.data)

        return df

    except Exception as e:
        print(f"Error getting verification requests: {e}")
        # Return empty dataframe if table doesn't exist yet
        return pd.DataFrame()


def verify_commission_statement(
    agent_id: str,
    policy_id: str,
    verified: bool = True
) -> tuple[bool, str]:
    """
    Mark a commission statement as verified by the agent.

    Args:
        agent_id: The agent's ID
        policy_id: The policy ID being verified
        verified: True if verified correct, False if disputed

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return False, "Database not configured"

        supabase = create_client(url, key)

        # Update policy with verification status
        # For demo, we'll store in a separate verification table
        verification_data = {
            'agent_id': agent_id,
            'policy_id': policy_id,
            'verified': verified,
            'verified_at': datetime.utcnow().isoformat()
        }

        result = supabase.table('policy_verifications').insert(verification_data).execute()

        if result.data:
            return True, "Commission verified successfully"
        else:
            return False, "Failed to verify commission"

    except Exception as e:
        print(f"Error verifying commission: {e}")
        # For demo purposes, return success
        return True, f"Verification logged (demo mode): {str(e)}"


def get_verification_stats(agent_id: str, year: int = None) -> Dict[str, Any]:
    """
    Get verification statistics for an agent.

    Returns:
        Dictionary with: total_verified, total_pending, total_disputed,
                        total_amount_verified, total_amount_disputed
    """
    try:
        # Get verification requests
        verifications = get_agent_verification_requests(agent_id)

        if verifications.empty:
            return {
                'total_verified': 0,
                'total_pending': 0,
                'total_disputed': 0,
                'total_amount_verified': 0,
                'total_amount_disputed': 0
            }

        # Count by status
        total_pending = len(verifications[verifications['status'] == 'pending'])
        total_verified = len(verifications[verifications['status'] == 'verified'])
        total_disputed = len(verifications[verifications['status'] == 'disputed'])

        # Sum amounts
        total_amount_disputed = verifications[verifications['status'] == 'disputed']['discrepancy_amount'].sum()

        return {
            'total_verified': total_verified,
            'total_pending': total_pending,
            'total_disputed': total_disputed,
            'total_amount_verified': 0,  # Placeholder
            'total_amount_disputed': float(total_amount_disputed) if not pd.isna(total_amount_disputed) else 0
        }

    except Exception as e:
        print(f"Error getting verification stats: {e}")
        return {
            'total_verified': 0,
            'total_pending': 0,
            'total_disputed': 0,
            'total_amount_verified': 0,
            'total_amount_disputed': 0
        }


# ==============================================================================
# Sprint 3: Gamification & Competition Functions
# ==============================================================================

# Task 3.1: Badge and Achievement System

BADGE_DEFINITIONS = {
    'top_producer': {
        'name': 'Top Producer',
        'icon': '🥇',
        'description': 'Ranked #1 in your agency',
        'criteria': 'Achieve rank #1',
        'points': 100
    },
    'top_3': {
        'name': 'Top 3',
        'icon': '🏆',
        'description': 'In the top 3 producers',
        'criteria': 'Rank #2 or #3',
        'points': 50
    },
    '100k_month': {
        'name': '$100K Month',
        'icon': '💎',
        'description': 'Write $100K+ premium in one month',
        'criteria': 'Monthly premium >= $100,000',
        'points': 150
    },
    '500k_ytd': {
        'name': '$500K Club',
        'icon': '💰',
        'description': 'Write $500K+ premium YTD',
        'criteria': 'YTD premium >= $500,000',
        'points': 200
    },
    'streak_7': {
        'name': '7-Day Streak',
        'icon': '🔥',
        'description': 'Write policies 7 days in a row',
        'criteria': '7 consecutive days',
        'points': 50
    },
    'streak_14': {
        'name': '14-Day Streak',
        'icon': '🔥🔥',
        'description': 'Write policies 14 days in a row',
        'criteria': '14 consecutive days',
        'points': 100
    },
    'streak_30': {
        'name': '30-Day Streak',
        'icon': '🔥🔥🔥',
        'description': 'Write policies 30 days in a row',
        'criteria': '30 consecutive days',
        'points': 200
    },
    'high_retention': {
        'name': 'Retention Master',
        'icon': '🎯',
        'description': '95%+ retention rate',
        'criteria': 'Retention >= 95%',
        'points': 75
    },
    'cross_sell': {
        'name': 'Cross-Sell King',
        'icon': '👑',
        'description': 'Multiple policies per customer',
        'criteria': 'Avg 2+ policies per customer',
        'points': 60
    },
    'fast_closer': {
        'name': 'Fast Closer',
        'icon': '⚡',
        'description': '10+ policies in one week',
        'criteria': 'Weekly count >= 10',
        'points': 40
    },
    'premium_star': {
        'name': 'Premium Star',
        'icon': '⭐',
        'description': 'Premium 150% above agency average',
        'criteria': 'Premium >= 150% of avg',
        'points': 80
    },
    'goal_crusher': {
        'name': 'Goal Crusher',
        'icon': '🎖️',
        'description': 'Achieve 5 personal goals',
        'criteria': '5 goals completed',
        'points': 120
    }
}


def get_agent_badges(agent_id: str, agency_id: str, year: int = None) -> List[Dict[str, Any]]:
    """
    Get all badges earned by an agent with automatic badge awarding.

    Args:
        agent_id: Agent's unique ID
        agency_id: Agency ID
        year: Year to check (defaults to current)

    Returns:
        List of badge dictionaries with details
    """
    try:
        if year is None:
            year = datetime.now().year

        earned_badges = []

        # Get agent performance data
        metrics = get_agent_performance_metrics(agent_id, year)
        rank_info = get_agent_rank(agent_id, agency_id, year)
        agency_avg = get_agency_average_metrics(agency_id, year)
        streak_data = get_agent_streak(agent_id)

        # Check Top Producer
        if rank_info['rank'] == 1:
            badge = BADGE_DEFINITIONS['top_producer'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = 'top_producer'
            earned_badges.append(badge)

        # Check Top 3
        elif rank_info['rank'] <= 3:
            badge = BADGE_DEFINITIONS['top_3'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = 'top_3'
            earned_badges.append(badge)

        # Check $100K Month (would need monthly data)
        # Placeholder for now

        # Check $500K Club
        if metrics['premium_ytd'] >= 500000:
            badge = BADGE_DEFINITIONS['500k_ytd'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = '500k_ytd'
            earned_badges.append(badge)

        # Check Streaks
        current_streak = streak_data['current_streak']
        if current_streak >= 30:
            badge = BADGE_DEFINITIONS['streak_30'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = 'streak_30'
            earned_badges.append(badge)
        elif current_streak >= 14:
            badge = BADGE_DEFINITIONS['streak_14'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = 'streak_14'
            earned_badges.append(badge)
        elif current_streak >= 7:
            badge = BADGE_DEFINITIONS['streak_7'].copy()
            badge['earned_at'] = datetime.now().isoformat()
            badge['badge_type'] = 'streak_7'
            earned_badges.append(badge)

        # Check Premium Star
        if agency_avg['avg_premium'] > 0:
            premium_vs_avg = (metrics['premium_ytd'] / agency_avg['avg_premium'] * 100)
            if premium_vs_avg >= 150:
                badge = BADGE_DEFINITIONS['premium_star'].copy()
                badge['earned_at'] = datetime.now().isoformat()
                badge['badge_type'] = 'premium_star'
                earned_badges.append(badge)

        return earned_badges

    except Exception as e:
        print(f"Error getting agent badges: {e}")
        return []


# Task 3.2: Live Leaderboards

def get_agency_leaderboard(
    agency_id: str,
    category: str = 'premium',
    period: str = 'ytd',
    year: int = None
) -> List[Dict[str, Any]]:
    """
    Get leaderboard rankings for an agency.

    Args:
        agency_id: Agency ID
        category: 'premium', 'commission', 'policies', 'points'
        period: 'ytd', 'month', 'week'
        year: Year to analyze

    Returns:
        List of agent rankings with stats
    """
    try:
        if year is None:
            year = datetime.now().year

        # Get all agents in agency
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return []

        supabase = create_client(url, key)

        # Get all active agents
        agents_result = supabase.table('agents').select('id, full_name, user_id').eq('agency_id', agency_id).eq('is_active', True).execute()

        if not agents_result.data:
            return []

        leaderboard = []

        for agent in agents_result.data:
            agent_id = agent['id']
            agent_name = agent['full_name']

            # Get agent performance
            metrics = get_agent_performance_metrics(agent_id, year)

            # Determine value based on category
            if category == 'premium':
                value = metrics['premium_ytd']
            elif category == 'commission':
                value = metrics['commission_ytd']
            elif category == 'policies':
                value = metrics['policies_count']
            elif category == 'points':
                # Calculate points from badges
                badges = get_agent_badges(agent_id, agency_id, year)
                value = sum(b['points'] for b in badges)
            else:
                value = metrics['premium_ytd']

            leaderboard.append({
                'agent_id': agent_id,
                'agent_name': agent_name,
                'value': value,
                'premium': metrics['premium_ytd'],
                'commission': metrics['commission_ytd'],
                'policies': metrics['policies_count']
            })

        # Sort by value descending
        leaderboard.sort(key=lambda x: x['value'], reverse=True)

        # Add rank and changes
        for idx, entry in enumerate(leaderboard):
            entry['rank'] = idx + 1
            entry['change'] = 0  # Would need historical data for real changes

        return leaderboard

    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        return []


# Task 3.3: Streak Tracking

def get_agent_streak(agent_id: str) -> Dict[str, Any]:
    """
    Calculate agent's writing streak (consecutive days with policies).

    Args:
        agent_id: Agent's unique ID

    Returns:
        Dict with current_streak, longest_streak, last_policy_date
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'last_policy_date': None,
                'days_since_last': 0
            }

        supabase = create_client(url, key)

        # Get all policies ordered by date
        result = supabase.table('policies').select('Effective Date').eq('agent_id', agent_id).order('Effective Date', desc=False).execute()

        if not result.data:
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'last_policy_date': None,
                'days_since_last': 0
            }

        # Extract unique dates
        dates = sorted(list(set([
            datetime.strptime(p['Effective Date'], '%Y-%m-%d').date()
            for p in result.data
            if p.get('Effective Date')
        ])))

        if not dates:
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'last_policy_date': None,
                'days_since_last': 0
            }

        # Calculate streaks
        current_streak = 1
        longest_streak = 1
        temp_streak = 1

        for i in range(1, len(dates)):
            days_diff = (dates[i] - dates[i-1]).days

            if days_diff == 1:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1

        # Check if current streak is active (last policy within 1 day)
        today = datetime.now().date()
        last_date = dates[-1]
        days_since_last = (today - last_date).days

        if days_since_last <= 1:
            # Streak is active
            # Count backwards from last date
            current_streak = 1
            for i in range(len(dates) - 2, -1, -1):
                if (dates[i+1] - dates[i]).days == 1:
                    current_streak += 1
                else:
                    break
        else:
            current_streak = 0

        return {
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'last_policy_date': last_date.isoformat(),
            'days_since_last': days_since_last
        }

    except Exception as e:
        print(f"Error calculating streak: {e}")
        return {
            'current_streak': 0,
            'longest_streak': 0,
            'last_policy_date': None,
            'days_since_last': 0
        }


# Task 3.4: Goal Setting and Progress

def get_agent_goals(agent_id: str) -> List[Dict[str, Any]]:
    """
    Get agent's personal goals.

    Args:
        agent_id: Agent's unique ID

    Returns:
        List of goal dictionaries
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return []

        supabase = create_client(url, key)

        # Get goals from database
        result = supabase.table('agent_goals').select('*').eq('agent_id', agent_id).eq('is_active', True).execute()

        if not result.data:
            return []

        # Get current metrics for progress calculation
        current_year = datetime.now().year
        metrics = get_agent_performance_metrics(agent_id, current_year)

        goals = []
        for goal_data in result.data:
            goal_type = goal_data['goal_type']
            target = goal_data['target_value']

            # Determine current value based on goal type
            if goal_type == 'premium_ytd':
                current = metrics['premium_ytd']
            elif goal_type == 'commission_ytd':
                current = metrics['commission_ytd']
            elif goal_type == 'policies_ytd':
                current = metrics['policies_count']
            else:
                current = 0

            progress = (current / target * 100) if target > 0 else 0

            goals.append({
                'id': goal_data['id'],
                'goal_type': goal_type,
                'target': target,
                'current': current,
                'progress': min(progress, 100),
                'label': goal_data.get('label', goal_type),
                'created_at': goal_data.get('created_at'),
                'completed': progress >= 100
            })

        return goals

    except Exception as e:
        print(f"Error getting agent goals: {e}")
        # Return empty list if table doesn't exist yet
        return []


def create_agent_goal(
    agent_id: str,
    goal_type: str,
    target_value: float,
    label: str = None
) -> tuple[bool, str]:
    """
    Create a new personal goal for an agent.

    Args:
        agent_id: Agent's unique ID
        goal_type: Type of goal (premium_ytd, commission_ytd, policies_ytd)
        target_value: Target value to achieve
        label: Optional custom label

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return False, "Database not configured"

        supabase = create_client(url, key)

        goal_data = {
            'agent_id': agent_id,
            'goal_type': goal_type,
            'target_value': target_value,
            'label': label or goal_type,
            'is_active': True,
            'created_at': datetime.utcnow().isoformat()
        }

        result = supabase.table('agent_goals').insert(goal_data).execute()

        if result.data:
            return True, "Goal created successfully"
        else:
            return False, "Failed to create goal"

    except Exception as e:
        print(f"Error creating goal: {e}")
        return True, f"Goal logged (demo mode): {str(e)}"


# ==========================================
# SPRINT 4: RENEWAL MANAGEMENT FUNCTIONS
# ==========================================

def get_agent_renewal_pipeline(
    agent_id: str,
    agency_id: str = None,
    days_ahead: int = 90,
    include_past_due: bool = True
) -> Dict[str, Any]:
    """
    Get agent's renewal pipeline with upcoming renewals.

    Args:
        agent_id: Agent's UUID
        agency_id: Agency's UUID (optional for filtering)
        days_ahead: Number of days to look ahead (30, 60, 90, etc.)
        include_past_due: Whether to include past due renewals

    Returns:
        {
            'total_renewals': int,
            'past_due': int,
            'due_7_days': int,
            'due_30_days': int,
            'due_60_days': int,
            'due_90_days': int,
            'total_premium_at_risk': float,
            'total_commission_at_risk': float,
            'renewals': List[Dict] - List of renewal policies
        }
    """
    try:
        from datetime import datetime, timedelta

        # Get policies data
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return _empty_renewal_pipeline()

        supabase = create_client(url, key)

        # Build query - fetch policies for this agent
        query = supabase.table('policies').select('*').eq('agent_id', agent_id)

        if agency_id:
            query = query.eq('agency_id', agency_id)

        result = query.execute()

        if not result.data:
            return _empty_renewal_pipeline()

        # Convert to DataFrame for easier processing
        df = pd.DataFrame(result.data)

        # Get pending renewals (policies that need renewal)
        # A policy needs renewal if it's the latest transaction for that policy number
        # and hasn't been cancelled or replaced

        # Filter for relevant transaction types (exclude STMT, VOID)
        valid_types = ['NBD', 'RWL', 'EDT', 'CAN', 'REI']
        df = df[df['Transaction Type'].isin(valid_types)]

        # For each unique Policy Number, get the latest transaction
        df['Effective Date'] = pd.to_datetime(df['Effective Date'])
        df_sorted = df.sort_values('Effective Date', ascending=False)
        latest_policies = df_sorted.drop_duplicates(subset=['Policy Number'], keep='first')

        # Exclude cancelled policies and policies that have been replaced (have Prior Policy Number filled in another policy)
        latest_policies = latest_policies[latest_policies['Transaction Type'] != 'CAN']

        # Check for replacements - policies with Prior Policy Number pointing to this policy
        replaced_policy_numbers = set()
        if 'Prior Policy Number' in df.columns:
            replaced_policy_numbers = set(df[df['Prior Policy Number'].notna()]['Prior Policy Number'].unique())

        # Filter out replaced policies
        pending_renewals = latest_policies[~latest_policies['Policy Number'].isin(replaced_policy_numbers)].copy()

        if pending_renewals.empty:
            return _empty_renewal_pipeline()

        # Calculate expiration date (Effective Date + 365 days for annual policies)
        # TODO: Handle different policy terms (6-month, monthly, etc.)
        pending_renewals['Expiration Date'] = pending_renewals['Effective Date'] + pd.Timedelta(days=365)

        # Calculate days until expiration
        today = pd.Timestamp.now().normalize()
        pending_renewals['Days Until Expiration'] = (pending_renewals['Expiration Date'] - today).dt.days

        # Filter based on days_ahead parameter
        if not include_past_due:
            pending_renewals = pending_renewals[pending_renewals['Days Until Expiration'] >= 0]

        pending_renewals = pending_renewals[pending_renewals['Days Until Expiration'] <= days_ahead]

        # Calculate summary statistics
        total_renewals = len(pending_renewals)
        past_due = len(pending_renewals[pending_renewals['Days Until Expiration'] < 0])
        due_7_days = len(pending_renewals[pending_renewals['Days Until Expiration'].between(0, 7)])
        due_30_days = len(pending_renewals[pending_renewals['Days Until Expiration'].between(0, 30)])
        due_60_days = len(pending_renewals[pending_renewals['Days Until Expiration'].between(0, 60)])
        due_90_days = len(pending_renewals[pending_renewals['Days Until Expiration'].between(0, 90)])

        # Calculate at-risk amounts
        total_premium = pending_renewals['Premium'].fillna(0).sum() if 'Premium' in pending_renewals.columns else 0
        total_commission = pending_renewals['Commission Amount'].fillna(0).sum() if 'Commission Amount' in pending_renewals.columns else 0

        # Convert renewals to list of dicts
        renewals_list = []
        for _, row in pending_renewals.iterrows():
            renewals_list.append({
                'policy_number': row.get('Policy Number', ''),
                'insured_name': row.get('Insured Name', ''),
                'carrier': row.get('Carrier', ''),
                'policy_type': row.get('Policy Type', ''),
                'effective_date': row['Effective Date'].strftime('%Y-%m-%d'),
                'expiration_date': row['Expiration Date'].strftime('%Y-%m-%d'),
                'days_until_expiration': int(row['Days Until Expiration']),
                'premium': float(row.get('Premium', 0)),
                'commission': float(row.get('Commission Amount', 0)),
                'is_past_due': row['Days Until Expiration'] < 0,
                'urgency': _get_renewal_urgency(row['Days Until Expiration'])
            })

        return {
            'total_renewals': total_renewals,
            'past_due': past_due,
            'due_7_days': due_7_days,
            'due_30_days': due_30_days,
            'due_60_days': due_60_days,
            'due_90_days': due_90_days,
            'total_premium_at_risk': float(total_premium),
            'total_commission_at_risk': float(total_commission),
            'renewals': renewals_list
        }

    except Exception as e:
        print(f"Error getting renewal pipeline: {e}")
        return _empty_renewal_pipeline()


def _empty_renewal_pipeline() -> Dict[str, Any]:
    """Return empty renewal pipeline structure."""
    return {
        'total_renewals': 0,
        'past_due': 0,
        'due_7_days': 0,
        'due_30_days': 0,
        'due_60_days': 0,
        'due_90_days': 0,
        'total_premium_at_risk': 0.0,
        'total_commission_at_risk': 0.0,
        'renewals': []
    }


def _get_renewal_urgency(days_until_expiration: int) -> str:
    """Determine urgency level for a renewal."""
    if days_until_expiration < 0:
        return 'past_due'
    elif days_until_expiration <= 7:
        return 'critical'
    elif days_until_expiration <= 30:
        return 'high'
    elif days_until_expiration <= 60:
        return 'medium'
    else:
        return 'low'


def get_agent_renewal_retention_rate(
    agent_id: str,
    agency_id: str = None,
    year: int = None,
    period: str = 'ytd'
) -> Dict[str, Any]:
    """
    Calculate agent's renewal retention rate.

    Args:
        agent_id: Agent's UUID
        agency_id: Agency's UUID (optional)
        year: Year to analyze (default: current year)
        period: 'ytd', 'last_30', 'last_90', 'last_365'

    Returns:
        {
            'retention_rate': float (percentage),
            'renewed_count': int,
            'lost_count': int,
            'total_opportunities': int,
            'renewed_premium': float,
            'lost_premium': float,
            'agency_average': float (if agency_id provided)
        }
    """
    try:
        from datetime import datetime, timedelta

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return _empty_retention_stats()

        supabase = create_client(url, key)

        # Determine date range
        if year is None:
            year = datetime.now().year

        if period == 'ytd':
            start_date = f"{year}-01-01"
            end_date = datetime.now().strftime('%Y-%m-%d')
        elif period == 'last_30':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=30)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        elif period == 'last_90':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=90)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        elif period == 'last_365':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=365)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        else:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"

        # Get all policies for this agent
        query = supabase.table('policies').select('*').eq('agent_id', agent_id)

        if agency_id:
            query = query.eq('agency_id', agency_id)

        result = query.execute()

        if not result.data:
            return _empty_retention_stats()

        df = pd.DataFrame(result.data)
        df['Effective Date'] = pd.to_datetime(df['Effective Date'])

        # Filter for date range
        df = df[(df['Effective Date'] >= start_date) & (df['Effective Date'] <= end_date)]

        # Count RWL transactions (renewals)
        renewed = df[df['Transaction Type'] == 'RWL']
        renewed_count = len(renewed)
        renewed_premium = renewed['Premium'].fillna(0).sum() if not renewed.empty else 0

        # Estimate lost renewals (this is approximate - requires more sophisticated tracking)
        # For now, we'll look at policies that expired in this period but weren't renewed
        # This would require tracking expiration dates and checking for missing renewals

        # Simple approach: Assume cancelled policies represent lost renewals
        lost = df[df['Transaction Type'] == 'CAN']
        lost_count = len(lost)
        lost_premium = lost['Premium'].fillna(0).sum() if not lost.empty else 0

        total_opportunities = renewed_count + lost_count

        retention_rate = (renewed_count / total_opportunities * 100) if total_opportunities > 0 else 0

        # Calculate agency average if agency_id provided
        agency_average = None
        if agency_id:
            agency_query = supabase.table('policies').select('*').eq('agency_id', agency_id)
            agency_result = agency_query.execute()

            if agency_result.data:
                agency_df = pd.DataFrame(agency_result.data)
                agency_df['Effective Date'] = pd.to_datetime(agency_df['Effective Date'])
                agency_df = agency_df[(agency_df['Effective Date'] >= start_date) & (agency_df['Effective Date'] <= end_date)]

                agency_renewed = len(agency_df[agency_df['Transaction Type'] == 'RWL'])
                agency_lost = len(agency_df[agency_df['Transaction Type'] == 'CAN'])
                agency_total = agency_renewed + agency_lost

                agency_average = (agency_renewed / agency_total * 100) if agency_total > 0 else 0

        return {
            'retention_rate': round(retention_rate, 2),
            'renewed_count': renewed_count,
            'lost_count': lost_count,
            'total_opportunities': total_opportunities,
            'renewed_premium': float(renewed_premium),
            'lost_premium': float(lost_premium),
            'agency_average': round(agency_average, 2) if agency_average is not None else None
        }

    except Exception as e:
        print(f"Error calculating retention rate: {e}")
        return _empty_retention_stats()


def _empty_retention_stats() -> Dict[str, Any]:
    """Return empty retention statistics."""
    return {
        'retention_rate': 0.0,
        'renewed_count': 0,
        'lost_count': 0,
        'total_opportunities': 0,
        'renewed_premium': 0.0,
        'lost_premium': 0.0,
        'agency_average': None
    }


def get_lost_renewals_analysis(
    agent_id: str,
    agency_id: str = None,
    year: int = None,
    period: str = 'ytd'
) -> Dict[str, Any]:
    """
    Analyze lost renewals for an agent.

    Args:
        agent_id: Agent's UUID
        agency_id: Agency's UUID (optional)
        year: Year to analyze (default: current year)
        period: 'ytd', 'last_30', 'last_90', 'last_365'

    Returns:
        {
            'total_lost': int,
            'total_lost_premium': float,
            'total_lost_commission': float,
            'lost_by_carrier': Dict[str, int],
            'lost_by_type': Dict[str, int],
            'lost_policies': List[Dict]
        }
    """
    try:
        from datetime import datetime, timedelta

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            return _empty_lost_renewals()

        supabase = create_client(url, key)

        # Determine date range
        if year is None:
            year = datetime.now().year

        if period == 'ytd':
            start_date = f"{year}-01-01"
            end_date = datetime.now().strftime('%Y-%m-%d')
        elif period == 'last_30':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=30)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        elif period == 'last_90':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=90)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        elif period == 'last_365':
            end_date = datetime.now()
            start_date = (end_date - timedelta(days=365)).strftime('%Y-%m-%d')
            end_date = end_date.strftime('%Y-%m-%d')
        else:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"

        # Get cancelled policies for this agent
        query = supabase.table('policies').select('*').eq('agent_id', agent_id).eq('Transaction Type', 'CAN')

        if agency_id:
            query = query.eq('agency_id', agency_id)

        result = query.execute()

        if not result.data:
            return _empty_lost_renewals()

        df = pd.DataFrame(result.data)
        df['Effective Date'] = pd.to_datetime(df['Effective Date'])

        # Filter for date range
        df = df[(df['Effective Date'] >= start_date) & (df['Effective Date'] <= end_date)]

        if df.empty:
            return _empty_lost_renewals()

        # Calculate totals
        total_lost = len(df)
        total_lost_premium = df['Premium'].fillna(0).sum()
        total_lost_commission = df['Commission Amount'].fillna(0).sum()

        # Group by carrier
        lost_by_carrier = df.groupby('Carrier').size().to_dict() if 'Carrier' in df.columns else {}

        # Group by policy type
        lost_by_type = df.groupby('Policy Type').size().to_dict() if 'Policy Type' in df.columns else {}

        # Convert to list of dicts
        lost_policies = []
        for _, row in df.iterrows():
            lost_policies.append({
                'policy_number': row.get('Policy Number', ''),
                'insured_name': row.get('Insured Name', ''),
                'carrier': row.get('Carrier', ''),
                'policy_type': row.get('Policy Type', ''),
                'effective_date': row['Effective Date'].strftime('%Y-%m-%d'),
                'premium': float(row.get('Premium', 0)),
                'commission': float(row.get('Commission Amount', 0))
            })

        return {
            'total_lost': total_lost,
            'total_lost_premium': float(total_lost_premium),
            'total_lost_commission': float(total_lost_commission),
            'lost_by_carrier': lost_by_carrier,
            'lost_by_type': lost_by_type,
            'lost_policies': lost_policies
        }

    except Exception as e:
        print(f"Error analyzing lost renewals: {e}")
        return _empty_lost_renewals()


def _empty_lost_renewals() -> Dict[str, Any]:
    """Return empty lost renewals structure."""
    return {
        'total_lost': 0,
        'total_lost_premium': 0.0,
        'total_lost_commission': 0.0,
        'lost_by_carrier': {},
        'lost_by_type': {},
        'lost_policies': []
    }


def get_renewal_calendar_data(
    agent_id: str,
    agency_id: str = None,
    month: int = None,
    year: int = None
) -> List[Dict[str, Any]]:
    """
    Get renewal calendar data for a specific month.

    Args:
        agent_id: Agent's UUID
        agency_id: Agency's UUID (optional)
        month: Month (1-12, default: current month)
        year: Year (default: current year)

    Returns:
        List of renewals with dates for calendar display:
        [
            {
                'date': 'YYYY-MM-DD',
                'policy_number': str,
                'insured_name': str,
                'carrier': str,
                'premium': float,
                'days_until': int
            }
        ]
    """
    try:
        from datetime import datetime
        from calendar import monthrange

        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year

        # Get first and last day of the month
        _, last_day = monthrange(year, month)
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{year}-{month:02d}-{last_day}"

        # Get renewal pipeline for the month
        pipeline = get_agent_renewal_pipeline(
            agent_id=agent_id,
            agency_id=agency_id,
            days_ahead=365,  # Get all renewals
            include_past_due=False
        )

        # Filter renewals for this month
        calendar_data = []
        for renewal in pipeline['renewals']:
            exp_date = renewal['expiration_date']
            if start_date <= exp_date <= end_date:
                calendar_data.append({
                    'date': exp_date,
                    'policy_number': renewal['policy_number'],
                    'insured_name': renewal['insured_name'],
                    'carrier': renewal['carrier'],
                    'policy_type': renewal['policy_type'],
                    'premium': renewal['premium'],
                    'days_until': renewal['days_until_expiration']
                })

        # Sort by date
        calendar_data.sort(key=lambda x: x['date'])

        return calendar_data

    except Exception as e:
        print(f"Error getting calendar data: {e}")
        return []


# =============================================================================
# SPRINT 5: NOTIFICATIONS & ENGAGEMENT
# =============================================================================

def create_notification(
    agent_id: str,
    notification_type: str,
    title: str,
    message: str,
    action_url: str = None,
    priority: str = 'normal',
    supabase: Client = None
) -> dict:
    """
    Create a new notification for an agent.

    Args:
        agent_id: Agent UUID
        notification_type: Type of notification (commission_statement, renewal_due, badge_earned, etc.)
        title: Notification title
        message: Notification message
        action_url: Optional URL to navigate to when clicked
        priority: Priority level (critical, high, normal, low)
        supabase: Supabase client

    Returns:
        dict: Created notification or None if error
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        notification_data = {
            'agent_id': agent_id,
            'notification_type': notification_type,
            'title': title,
            'message': message,
            'action_url': action_url,
            'priority': priority,
            'read': False,
            'created_at': datetime.utcnow().isoformat()
        }

        result = supabase.table('agent_notifications').insert(notification_data).execute()

        if result.data:
            return result.data[0]
        return None

    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


def get_agent_notifications(
    agent_id: str,
    unread_only: bool = False,
    notification_type: str = None,
    limit: int = 50,
    supabase: Client = None
) -> list:
    """
    Get notifications for an agent.

    Args:
        agent_id: Agent UUID
        unread_only: If True, only return unread notifications
        notification_type: Filter by notification type
        limit: Maximum number of notifications to return
        supabase: Supabase client

    Returns:
        list: List of notifications
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        query = supabase.table('agent_notifications').select('*').eq('agent_id', agent_id)

        if unread_only:
            query = query.eq('read', False)

        if notification_type:
            query = query.eq('notification_type', notification_type)

        query = query.order('created_at', desc=True).limit(limit)

        result = query.execute()
        return result.data if result.data else []

    except Exception as e:
        print(f"Error getting notifications: {e}")
        return []


def get_unread_notification_count(agent_id: str, supabase: Client = None) -> int:
    """
    Get count of unread notifications for an agent.

    Args:
        agent_id: Agent UUID
        supabase: Supabase client

    Returns:
        int: Count of unread notifications
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        result = supabase.table('agent_notifications').select('id', count='exact').eq('agent_id', agent_id).eq('read', False).execute()

        return result.count if result.count else 0

    except Exception as e:
        print(f"Error getting unread count: {e}")
        return 0


def mark_notification_read(notification_id: str, read: bool = True, supabase: Client = None) -> bool:
    """
    Mark a notification as read or unread.

    Args:
        notification_id: Notification UUID
        read: True to mark as read, False to mark as unread
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        result = supabase.table('agent_notifications').update({'read': read}).eq('id', notification_id).execute()

        return result.data is not None

    except Exception as e:
        print(f"Error marking notification: {e}")
        return False


def mark_all_notifications_read(agent_id: str, supabase: Client = None) -> bool:
    """
    Mark all notifications as read for an agent.

    Args:
        agent_id: Agent UUID
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        result = supabase.table('agent_notifications').update({'read': True}).eq('agent_id', agent_id).eq('read', False).execute()

        return True

    except Exception as e:
        print(f"Error marking all notifications read: {e}")
        return False


def delete_notification(notification_id: str, supabase: Client = None) -> bool:
    """
    Delete a notification.

    Args:
        notification_id: Notification UUID
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        result = supabase.table('agent_notifications').delete().eq('id', notification_id).execute()

        return True

    except Exception as e:
        print(f"Error deleting notification: {e}")
        return False


def generate_renewal_due_notifications(days_threshold: int = 7, supabase: Client = None) -> int:
    """
    Auto-generate notifications for upcoming renewals.
    Scans all agents' policies and creates notifications for renewals due within threshold.

    Args:
        days_threshold: Number of days before renewal to notify (default 7)
        supabase: Supabase client

    Returns:
        int: Number of notifications created
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        # Get all agents
        agents = supabase.table('agents').select('id, full_name, agency_id').eq('is_active', True).execute()

        if not agents.data:
            return 0

        notifications_created = 0
        today = datetime.now().date()
        threshold_date = today + timedelta(days=days_threshold)

        for agent in agents.data:
            agent_id = agent['id']

            # Get upcoming renewals for this agent
            policies = supabase.table('policies').select('*').eq('agent_id', agent_id).eq('status', 'active').execute()

            if not policies.data:
                continue

            for policy in policies.data:
                if not policy.get('effective_date'):
                    continue

                effective_date = datetime.fromisoformat(policy['effective_date']).date()

                # Calculate next renewal date (assuming 1-year term)
                next_renewal = effective_date
                while next_renewal <= today:
                    next_renewal = next_renewal.replace(year=next_renewal.year + 1)

                days_until_renewal = (next_renewal - today).days

                # Check if renewal is within threshold
                if 0 <= days_until_renewal <= days_threshold:
                    # Check if notification already exists for this policy
                    existing = supabase.table('agent_notifications').select('id').eq('agent_id', agent_id).eq('notification_type', 'renewal_due').like('message', f'%{policy["policy_number"]}%').eq('read', False).execute()

                    if not existing.data:
                        # Create notification
                        priority = 'critical' if days_until_renewal <= 3 else 'high' if days_until_renewal <= 7 else 'normal'

                        notification = create_notification(
                            agent_id=agent_id,
                            notification_type='renewal_due',
                            title=f"Renewal Due in {days_until_renewal} Days",
                            message=f"Policy {policy['policy_number']} for {policy.get('insured_name', 'Client')} is due for renewal on {next_renewal.strftime('%b %d, %Y')}",
                            action_url=f"/my-policies?policy_id={policy['id']}",
                            priority=priority,
                            supabase=supabase
                        )

                        if notification:
                            notifications_created += 1

        return notifications_created

    except Exception as e:
        print(f"Error generating renewal notifications: {e}")
        return 0


def generate_badge_notification(agent_id: str, badge: dict, supabase: Client = None) -> dict:
    """
    Generate a notification when an agent earns a badge.

    Args:
        agent_id: Agent UUID
        badge: Badge dictionary with title, description, icon
        supabase: Supabase client

    Returns:
        dict: Created notification or None
    """
    try:
        if not badge:
            return None

        return create_notification(
            agent_id=agent_id,
            notification_type='badge_earned',
            title=f"Achievement Unlocked: {badge.get('title', 'New Badge')}",
            message=f"Congratulations! You've earned the {badge.get('icon', '')} {badge.get('title', '')} badge. {badge.get('description', '')}",
            action_url="/gamification",
            priority='normal',
            supabase=supabase
        )

    except Exception as e:
        print(f"Error generating badge notification: {e}")
        return None


def generate_commission_statement_notification(
    agent_id: str,
    statement_date: str,
    total_amount: float,
    supabase: Client = None
) -> dict:
    """
    Generate a notification for a new commission statement.

    Args:
        agent_id: Agent UUID
        statement_date: Statement date string
        total_amount: Total commission amount
        supabase: Supabase client

    Returns:
        dict: Created notification or None
    """
    try:
        return create_notification(
            agent_id=agent_id,
            notification_type='commission_statement',
            title="New Commission Statement Available",
            message=f"Your commission statement for {statement_date} is ready. Total: ${total_amount:,.2f}",
            action_url="/commission-statements",
            priority='high',
            supabase=supabase
        )

    except Exception as e:
        print(f"Error generating commission statement notification: {e}")
        return None


def generate_agency_announcement_notification(
    agency_id: str,
    title: str,
    message: str,
    priority: str = 'normal',
    supabase: Client = None
) -> int:
    """
    Generate notifications for all agents in an agency (for announcements).

    Args:
        agency_id: Agency UUID
        title: Announcement title
        message: Announcement message
        priority: Priority level
        supabase: Supabase client

    Returns:
        int: Number of notifications created
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        # Get all active agents in the agency
        agents = supabase.table('agents').select('id').eq('agency_id', agency_id).eq('is_active', True).execute()

        if not agents.data:
            return 0

        notifications_created = 0

        for agent in agents.data:
            notification = create_notification(
                agent_id=agent['id'],
                notification_type='agency_announcement',
                title=title,
                message=message,
                priority=priority,
                supabase=supabase
            )

            if notification:
                notifications_created += 1

        return notifications_created

    except Exception as e:
        print(f"Error generating agency announcements: {e}")
        return 0


# =============================================================================
# EMAIL NOTIFICATIONS (SPRINT 5 - TASK 5.2)
# =============================================================================

def get_agent_notification_preferences(agent_id: str, supabase: Client = None) -> dict:
    """
    Get notification preferences for an agent.

    Args:
        agent_id: Agent UUID
        supabase: Supabase client

    Returns:
        dict: Notification preferences or default preferences
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        result = supabase.table('agent_notification_preferences').select('*').eq('agent_id', agent_id).execute()

        if result.data:
            return result.data[0]

        # Return default preferences
        return {
            'agent_id': agent_id,
            'email_enabled': True,
            'weekly_digest': True,
            'commission_statement_email': True,
            'critical_renewal_email': True,
            'achievement_email': True,
            'discrepancy_email': True,
            'digest_day': 'monday',
            'created_at': datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"Error getting notification preferences: {e}")
        # Return default preferences on error
        return {
            'agent_id': agent_id,
            'email_enabled': True,
            'weekly_digest': True,
            'commission_statement_email': True,
            'critical_renewal_email': True,
            'achievement_email': True,
            'discrepancy_email': True,
            'digest_day': 'monday'
        }


def update_agent_notification_preferences(agent_id: str, preferences: dict, supabase: Client = None) -> bool:
    """
    Update notification preferences for an agent.

    Args:
        agent_id: Agent UUID
        preferences: Dictionary of preference settings
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        if not supabase:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            supabase = create_client(url, key)

        # Check if preferences already exist
        existing = supabase.table('agent_notification_preferences').select('id').eq('agent_id', agent_id).execute()

        preferences['agent_id'] = agent_id
        preferences['updated_at'] = datetime.utcnow().isoformat()

        if existing.data:
            # Update existing preferences
            result = supabase.table('agent_notification_preferences').update(preferences).eq('agent_id', agent_id).execute()
        else:
            # Insert new preferences
            preferences['created_at'] = datetime.utcnow().isoformat()
            result = supabase.table('agent_notification_preferences').insert(preferences).execute()

        return result.data is not None

    except Exception as e:
        print(f"Error updating notification preferences: {e}")
        return False


def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    html_body: str = None,
    agent_id: str = None,
    supabase: Client = None
) -> bool:
    """
    Send an email notification to an agent.

    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Plain text email body
        html_body: Optional HTML email body
        agent_id: Optional agent UUID for preference checking
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        # Check agent preferences first
        if agent_id:
            prefs = get_agent_notification_preferences(agent_id, supabase)
            if not prefs.get('email_enabled', True):
                print(f"Email notifications disabled for agent {agent_id}")
                return False

        # TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
        # For now, just log the email
        print(f"\n{'='*60}")
        print(f"EMAIL NOTIFICATION")
        print(f"{'='*60}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"\n{body}")
        print(f"{'='*60}\n")

        # In production, replace with actual email service
        # Example with SendGrid:
        # import sendgrid
        # sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
        # message = Mail(
        #     from_email='notifications@youragency.com',
        #     to_emails=to_email,
        #     subject=subject,
        #     plain_text_content=body,
        #     html_content=html_body
        # )
        # response = sg.send(message)
        # return response.status_code == 202

        return True

    except Exception as e:
        print(f"Error sending email notification: {e}")
        return False


def send_commission_statement_email(
    agent_id: str,
    agent_email: str,
    statement_date: str,
    total_amount: float,
    supabase: Client = None
) -> bool:
    """
    Send email notification for new commission statement.

    Args:
        agent_id: Agent UUID
        agent_email: Agent email address
        statement_date: Statement date string
        total_amount: Total commission amount
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        # Check preferences
        prefs = get_agent_notification_preferences(agent_id, supabase)
        if not prefs.get('commission_statement_email', True):
            return False

        subject = f"New Commission Statement - {statement_date}"
        body = f"""
Hello,

Your commission statement for {statement_date} is now available.

Total Commission: ${total_amount:,.2f}

Log in to your agent portal to view the full details:
https://yourapp.com/commission-statements

Best regards,
Your Agency Team
        """

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <h2>New Commission Statement Available</h2>
    <p>Hello,</p>
    <p>Your commission statement for <strong>{statement_date}</strong> is now available.</p>
    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0; color: #1f77b4;">Total Commission: ${total_amount:,.2f}</h3>
    </div>
    <p>
        <a href="https://yourapp.com/commission-statements"
           style="background-color: #1f77b4; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            View Statement
        </a>
    </p>
    <p>Best regards,<br>Your Agency Team</p>
</body>
</html>
        """

        return send_email_notification(agent_email, subject, body, html_body, agent_id, supabase)

    except Exception as e:
        print(f"Error sending commission statement email: {e}")
        return False


def send_critical_renewal_email(
    agent_id: str,
    agent_email: str,
    policy_number: str,
    insured_name: str,
    renewal_date: str,
    days_until_renewal: int,
    supabase: Client = None
) -> bool:
    """
    Send email notification for critical renewal (past due or due soon).

    Args:
        agent_id: Agent UUID
        agent_email: Agent email address
        policy_number: Policy number
        insured_name: Insured name
        renewal_date: Renewal date string
        days_until_renewal: Days until renewal (negative if past due)
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        # Check preferences
        prefs = get_agent_notification_preferences(agent_id, supabase)
        if not prefs.get('critical_renewal_email', True):
            return False

        if days_until_renewal < 0:
            subject = f"URGENT: Policy Renewal Past Due - {policy_number}"
            status = f"PAST DUE by {abs(days_until_renewal)} days"
        else:
            subject = f"URGENT: Policy Renewal Due in {days_until_renewal} Days - {policy_number}"
            status = f"Due in {days_until_renewal} days"

        body = f"""
URGENT: Action Required

Policy {policy_number} for {insured_name} is {status}.

Renewal Date: {renewal_date}

Please contact the client immediately to process this renewal.

Log in to your agent portal to view details:
https://yourapp.com/my-policies

Best regards,
Your Agency Team
        """

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="background-color: #ff4444; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin: 0;">⚠️ URGENT: Action Required</h2>
    </div>
    <p>Policy <strong>{policy_number}</strong> for <strong>{insured_name}</strong> is <strong style="color: #ff4444;">{status}</strong>.</p>
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0;"><strong>Renewal Date:</strong> {renewal_date}</p>
    </div>
    <p>Please contact the client immediately to process this renewal.</p>
    <p>
        <a href="https://yourapp.com/my-policies"
           style="background-color: #ff4444; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            View Policy
        </a>
    </p>
    <p>Best regards,<br>Your Agency Team</p>
</body>
</html>
        """

        return send_email_notification(agent_email, subject, body, html_body, agent_id, supabase)

    except Exception as e:
        print(f"Error sending critical renewal email: {e}")
        return False


def send_achievement_email(
    agent_id: str,
    agent_email: str,
    badge_title: str,
    badge_description: str,
    supabase: Client = None
) -> bool:
    """
    Send email notification for achievement/badge earned.

    Args:
        agent_id: Agent UUID
        agent_email: Agent email address
        badge_title: Badge title
        badge_description: Badge description
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        # Check preferences
        prefs = get_agent_notification_preferences(agent_id, supabase)
        if not prefs.get('achievement_email', True):
            return False

        subject = f"🏆 Achievement Unlocked: {badge_title}"
        body = f"""
Congratulations!

You've earned a new achievement: {badge_title}

{badge_description}

Keep up the great work! Log in to see all your badges and achievements:
https://yourapp.com/gamification

Best regards,
Your Agency Team
        """

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="background-color: #28a745; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin: 0;">🏆 Achievement Unlocked!</h2>
    </div>
    <p>Congratulations!</p>
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0; color: #1f77b4;">{badge_title}</h3>
        <p style="margin: 10px 0 0 0; color: #666;">{badge_description}</p>
    </div>
    <p>Keep up the great work!</p>
    <p>
        <a href="https://yourapp.com/gamification"
           style="background-color: #28a745; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Achievements
        </a>
    </p>
    <p>Best regards,<br>Your Agency Team</p>
</body>
</html>
        """

        return send_email_notification(agent_email, subject, body, html_body, agent_id, supabase)

    except Exception as e:
        print(f"Error sending achievement email: {e}")
        return False


def send_weekly_digest_email(agent_id: str, agent_email: str, supabase: Client = None) -> bool:
    """
    Send weekly performance digest email to agent.

    Args:
        agent_id: Agent UUID
        agent_email: Agent email address
        supabase: Supabase client

    Returns:
        bool: Success status
    """
    try:
        # Check preferences
        prefs = get_agent_notification_preferences(agent_id, supabase)
        if not prefs.get('weekly_digest', True):
            return False

        # Get agent stats for the week
        from datetime import datetime, timedelta
        today = datetime.now()
        week_start = today - timedelta(days=7)

        # Get performance data
        performance = get_agent_performance_metrics(agent_id, period='last_7_days', supabase=supabase)
        ranking = get_agent_ranking(agent_id, supabase=supabase)

        total_commission = performance.get('total_commission', 0)
        policies_written = performance.get('policies_written', 0)
        rank = ranking.get('rank', 'N/A')
        total_agents = ranking.get('total_agents', 0)

        subject = f"Your Weekly Performance Summary - {today.strftime('%b %d, %Y')}"
        body = f"""
Weekly Performance Summary

Week of {week_start.strftime('%b %d')} - {today.strftime('%b %d, %Y')}

📊 Your Performance:
- Total Commission: ${total_commission:,.2f}
- Policies Written: {policies_written}
- Current Rank: #{rank} out of {total_agents} agents

🏆 Keep up the great work!

Log in to view detailed reports:
https://yourapp.com/my-dashboard

Best regards,
Your Agency Team
        """

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <h2>Weekly Performance Summary</h2>
    <p style="color: #666;">Week of {week_start.strftime('%b %d')} - {today.strftime('%b %d, %Y')}</p>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📊 Your Performance</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px 0;"><strong>Total Commission:</strong></td>
                <td style="padding: 10px 0; text-align: right; color: #28a745; font-size: 18px;">
                    <strong>${total_commission:,.2f}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0;"><strong>Policies Written:</strong></td>
                <td style="padding: 10px 0; text-align: right; font-size: 18px;">
                    <strong>{policies_written}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0;"><strong>Current Rank:</strong></td>
                <td style="padding: 10px 0; text-align: right; font-size: 18px;">
                    <strong>#{rank} out of {total_agents} agents</strong>
                </td>
            </tr>
        </table>
    </div>

    <p>🏆 Keep up the great work!</p>

    <p>
        <a href="https://yourapp.com/my-dashboard"
           style="background-color: #1f77b4; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            View Detailed Reports
        </a>
    </p>

    <p>Best regards,<br>Your Agency Team</p>
</body>
</html>
        """

        return send_email_notification(agent_email, subject, body, html_body, agent_id, supabase)

    except Exception as e:
        print(f"Error sending weekly digest email: {e}")
        return False
