"""
Agency Dashboard
Multi-tenant view for insurance agency owners showing agent rankings,
performance metrics, and team analytics.

Created: 2025-10-09
Updated: 2025-11-29 (Task 2.2 - Real Data Integration)
Branch: agency-platform
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.agency_utils import (
    is_agency_account,
    get_agency_config,
    get_demo_agency_data,
    is_demo_mode
)

from utils.agency_reconciliation_helpers import (
    get_supabase_client,
    get_agent_name_map
)

st.set_page_config(
    page_title="Agency Dashboard",
    page_icon="🏢",
    layout="wide"
)


def get_user_email():
    """Get current user email from session state."""
    return st.session_state.get('user_email', 'demo@example.com')


def get_agency_performance_data(agency_id: str, year: int = None):
    """
    Load real agency performance data from Supabase.

    Args:
        agency_id: Agency ID
        year: Year to filter (default: current year)

    Returns:
        Dictionary with agency metrics and agent performance
    """
    if year is None:
        year = datetime.now().year

    try:
        supabase = get_supabase_client()

        # Get all policies for the agency for the specified year
        result = supabase.table('policies')\
            .select('*')\
            .eq('agency_id', agency_id)\
            .gte('Effective Date', f'{year}-01-01')\
            .execute()

        if not result.data:
            return {
                'agents': [],
                'total_premium_ytd': 0,
                'total_commission_ytd': 0,
                'total_policies': 0
            }

        df = pd.DataFrame(result.data)

        # Filter out reconciliation entries for performance metrics
        df_performance = df[~df['Transaction ID'].str.contains('-STMT-|-VOID-|-ADJ-', na=False)]

        # Calculate totals
        total_premium = df_performance['Premium Sold'].sum() if 'Premium Sold' in df_performance.columns else 0
        total_commission = df_performance['Total Agent Comm'].sum() if 'Total Agent Comm' in df_performance.columns else 0
        total_policies = len(df_performance)

        # Group by agent
        if 'agent_id' in df_performance.columns:
            agent_stats = df_performance.groupby('agent_id').agg({
                'Premium Sold': 'sum',
                'Total Agent Comm': 'sum',
                'Policy Number': 'count'
            }).reset_index()

            agent_stats.columns = ['agent_id', 'premium_ytd', 'commission_ytd', 'policies']

            # Get agent names
            agent_names = get_agent_name_map(agency_id)

            # Add agent names and roles
            agents = []
            for _, row in agent_stats.iterrows():
                agent_id = row['agent_id']
                if agent_id and pd.notna(agent_id):
                    agents.append({
                        'id': agent_id,
                        'name': agent_names.get(agent_id, 'Unknown Agent'),
                        'premium_ytd': float(row['premium_ytd']) if pd.notna(row['premium_ytd']) else 0,
                        'commission_ytd': float(row['commission_ytd']) if pd.notna(row['commission_ytd']) else 0,
                        'policies': int(row['policies'])
                    })
        else:
            agents = []

        return {
            'agents': agents,
            'total_premium_ytd': float(total_premium) if pd.notna(total_premium) else 0,
            'total_commission_ytd': float(total_commission) if pd.notna(total_commission) else 0,
            'total_policies': total_policies
        }

    except Exception as e:
        st.error(f"Error loading agency performance data: {e}")
        return {
            'agents': [],
            'total_premium_ytd': 0,
            'total_commission_ytd': 0,
            'total_policies': 0
        }


def get_monthly_trends(agency_id: str, months: int = 6):
    """
    Get monthly performance trends for top agents.

    Args:
        agency_id: Agency ID
        months: Number of months to look back

    Returns:
        DataFrame with monthly trends
    """
    try:
        supabase = get_supabase_client()

        # Calculate start date
        start_date = datetime.now() - timedelta(days=30 * months)

        # Get policies from the period
        result = supabase.table('policies')\
            .select('agent_id, "Effective Date", "Premium Sold", "Total Agent Comm"')\
            .eq('agency_id', agency_id)\
            .gte('Effective Date', start_date.strftime('%Y-%m-%d'))\
            .execute()

        if not result.data:
            return pd.DataFrame()

        df = pd.DataFrame(result.data)

        # Filter out reconciliation entries
        df = df[~df.get('Transaction ID', pd.Series()).str.contains('-STMT-|-VOID-|-ADJ-', na=False)]

        # Convert date and extract month
        df['Effective Date'] = pd.to_datetime(df['Effective Date'])
        df['Month'] = df['Effective Date'].dt.strftime('%b %Y')

        # Group by agent and month
        monthly = df.groupby(['agent_id', 'Month']).agg({
            'Premium Sold': 'sum',
            'Total Agent Comm': 'sum'
        }).reset_index()

        # Get agent names
        agent_names = get_agent_name_map(agency_id)
        monthly['Agent'] = monthly['agent_id'].map(agent_names)

        return monthly

    except Exception as e:
        st.error(f"Error loading monthly trends: {e}")
        return pd.DataFrame()


def get_carrier_breakdown(agency_id: str, year: int = None):
    """
    Get commission breakdown by carrier.

    Args:
        agency_id: Agency ID
        year: Year to filter

    Returns:
        DataFrame with carrier breakdown
    """
    if year is None:
        year = datetime.now().year

    try:
        supabase = get_supabase_client()

        result = supabase.table('policies')\
            .select('"Carrier Name", "Total Agent Comm"')\
            .eq('agency_id', agency_id)\
            .gte('Effective Date', f'{year}-01-01')\
            .execute()

        if not result.data:
            return pd.DataFrame()

        df = pd.DataFrame(result.data)

        # Filter out reconciliation entries
        df = df[~df.get('Transaction ID', pd.Series()).str.contains('-STMT-|-VOID-|-ADJ-', na=False)]

        # Group by carrier
        carrier_stats = df.groupby('Carrier Name').agg({
            'Total Agent Comm': 'sum'
        }).reset_index()

        carrier_stats.columns = ['Carrier', 'Commission']

        return carrier_stats.sort_values('Commission', ascending=False)

    except Exception as e:
        st.error(f"Error loading carrier breakdown: {e}")
        return pd.DataFrame()


def show_agency_dashboard():
    """Main agency dashboard view."""

    st.title("🏢 Agency Dashboard")

    user_email = get_user_email()

    # Check if user is agency owner
    if not st.session_state.get('is_agency_owner', False):
        st.warning("⚠️ This page is only available for agency owners.")
        st.info("💡 Upgrade to an Agency Plan to access multi-agent features, rankings, and team analytics.")
        return

    agency_id = st.session_state.get('agency_id')
    agency_name = st.session_state.get('agency_name', 'Your Agency')

    if not agency_id:
        st.error("Agency ID not found in session")
        return

    # Get agency data (demo or real)
    if is_demo_mode():
        agency_data = get_demo_agency_data()
        st.info("📊 **DEMO MODE** - Viewing sample agency data")
    else:
        # Load real agency data
        current_year = datetime.now().year

        # Year selector
        col_year, col_refresh = st.columns([3, 1])
        with col_year:
            selected_year = st.selectbox(
                "Select Year",
                options=[current_year, current_year - 1, current_year - 2],
                index=0,
                key="dashboard_year"
            )
        with col_refresh:
            st.write("")  # Spacer
            st.write("")  # Spacer
            if st.button("🔄 Refresh", use_container_width=True):
                st.cache_data.clear()
                st.rerun()

        # Load performance data
        agency_data = get_agency_performance_data(agency_id, selected_year)
        agency_data['agency_name'] = agency_name

    # Display agency name
    st.subheader(f"📍 {agency_data.get('agency_name', 'Your Agency')}")

    # Top-level metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        active_agents = len([a for a in agency_data.get('agents', []) if a.get('policies', 0) > 0])
        st.metric(
            label="👥 Active Agents",
            value=active_agents
        )

    with col2:
        total_premium = agency_data.get('total_premium_ytd', 0)
        st.metric(
            label="💰 Total Premium YTD",
            value=f"${total_premium:,.0f}"
        )

    with col3:
        total_commission = agency_data.get('total_commission_ytd', 0)
        st.metric(
            label="💵 Total Commission YTD",
            value=f"${total_commission:,.0f}"
        )

    with col4:
        total_policies = agency_data.get('total_policies', 0)
        st.metric(
            label="📋 Total Policies",
            value=total_policies
        )

    st.divider()

    # Agent Rankings
    st.subheader(f"🏆 Agent Rankings - {selected_year if not is_demo_mode() else 'YTD'} Performance")

    agents = agency_data.get('agents', [])

    if agents:
        # Create rankings dataframe
        df_agents = pd.DataFrame(agents)

        # Sort by premium (or commission)
        if 'premium_ytd' in df_agents.columns:
            df_agents = df_agents.sort_values('premium_ytd', ascending=False)

        # Add rank column
        df_agents['rank'] = range(1, len(df_agents) + 1)

        # Display rankings table
        display_cols = {
            'rank': '🏅 Rank',
            'name': '👤 Agent Name',
            'policies': '📋 Policies',
            'premium_ytd': '💰 Premium YTD',
            'commission_ytd': '💵 Commission YTD'
        }

        # Filter to available columns
        available_cols = [col for col in display_cols.keys() if col in df_agents.columns]
        df_display = df_agents[available_cols].copy()

        # Format currency columns
        if 'premium_ytd' in df_display.columns:
            df_display['premium_ytd'] = df_display['premium_ytd'].apply(lambda x: f"${x:,.0f}")
        if 'commission_ytd' in df_display.columns:
            df_display['commission_ytd'] = df_display['commission_ytd'].apply(lambda x: f"${x:,.0f}")

        # Rename columns
        df_display = df_display.rename(columns=display_cols)

        # Display with highlighting
        st.dataframe(
            df_display,
            use_container_width=True,
            hide_index=True
        )

        # Top performers chart
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📊 Premium by Agent")
            if 'premium_ytd' in df_agents.columns and len(df_agents) > 0:
                fig = px.bar(
                    df_agents.head(10),  # Top 10
                    x='name',
                    y='premium_ytd',
                    title="Total Premium Written (YTD)",
                    labels={'name': 'Agent', 'premium_ytd': 'Premium ($)'},
                    color='premium_ytd',
                    color_continuous_scale='Blues'
                )
                fig.update_layout(showlegend=False, xaxis_tickangle=-45)
                st.plotly_chart(fig, use_container_width=True, key="premium_chart")

        with col2:
            st.subheader("🎯 Commission by Agent")
            if 'commission_ytd' in df_agents.columns and len(df_agents) > 0:
                fig = px.bar(
                    df_agents.head(10),  # Top 10
                    x='name',
                    y='commission_ytd',
                    title="Total Commission Earned (YTD)",
                    labels={'name': 'Agent', 'commission_ytd': 'Commission ($)'},
                    color='commission_ytd',
                    color_continuous_scale='Greens'
                )
                fig.update_layout(showlegend=False, xaxis_tickangle=-45)
                st.plotly_chart(fig, use_container_width=True, key="commission_chart")

        # Policy count pie chart
        st.subheader("📈 Policy Distribution")
        if 'policies' in df_agents.columns and len(df_agents) > 0:
            fig = px.pie(
                df_agents.head(10),  # Top 10
                names='name',
                values='policies',
                title="Policies by Agent",
                hole=0.4
            )
            st.plotly_chart(fig, use_container_width=True, key="policy_distribution_chart")
    else:
        st.info("No agents found with policies this year. Add agents and policies to see rankings and analytics.")

    st.divider()

    # Performance trends and carrier breakdown
    if not is_demo_mode():
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📈 Monthly Premium Trends")
            trends_df = get_monthly_trends(agency_id, months=6)

            if not trends_df.empty and 'Premium Sold' in trends_df.columns:
                # Get top 5 agents by total premium
                top_agents = df_agents.head(5)['name'].tolist() if not df_agents.empty else []
                trends_filtered = trends_df[trends_df['Agent'].isin(top_agents)]

                if not trends_filtered.empty:
                    fig = px.line(
                        trends_filtered,
                        x='Month',
                        y='Premium Sold',
                        color='Agent',
                        title="Monthly Premium Trends (Top 5 Agents)",
                        markers=True
                    )
                    st.plotly_chart(fig, use_container_width=True, key="monthly_trends_chart")
                else:
                    st.info("Not enough data for monthly trends")
            else:
                st.info("No monthly trend data available")

        with col2:
            st.subheader("🏢 Commission by Carrier")
            carrier_df = get_carrier_breakdown(agency_id, selected_year)

            if not carrier_df.empty:
                fig = px.pie(
                    carrier_df.head(10),  # Top 10 carriers
                    names='Carrier',
                    values='Commission',
                    title="Commission Distribution by Carrier",
                    hole=0.3
                )
                st.plotly_chart(fig, use_container_width=True, key="carrier_breakdown_chart")
            else:
                st.info("No carrier data available")

    st.divider()

    # Quick actions
    st.subheader("⚡ Quick Actions")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("➕ Add New Agent", use_container_width=True, key="add_agent_btn"):
            # Set flag to navigate to team management
            st.session_state['navigate_to'] = 'team_management'
            st.info("Navigate to Team Management to add agents")

    with col2:
        if st.button("📊 View Full Reports", use_container_width=True, key="view_reports_btn"):
            st.info("Full reports coming soon")

    with col3:
        if st.button("💳 Reconciliation", use_container_width=True, key="reconciliation_btn"):
            st.info("Agency reconciliation coming in Task 2.1 completion")

    with col4:
        if st.button("⚙️ Agency Settings", use_container_width=True, key="settings_btn"):
            st.info("Agency settings coming in Task 3.1")


# Main execution
if __name__ == "__main__":
    show_agency_dashboard()
