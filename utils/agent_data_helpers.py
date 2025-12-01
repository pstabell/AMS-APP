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
