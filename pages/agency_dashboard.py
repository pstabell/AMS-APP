"""
Agency Dashboard
Multi-tenant view for insurance agency owners showing agent rankings,
performance metrics, and team analytics.

Created: 2025-10-09
Branch: agency-platform
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.agency_utils import (
    is_agency_account,
    get_agency_config,
    get_agency_agents,
    get_demo_agency_data,
    is_demo_mode
)

st.set_page_config(
    page_title="Agency Dashboard",
    page_icon="🏢",
    layout="wide"
)


def get_user_email():
    """Get current user email from session state."""
    return st.session_state.get('user_email', 'demo@example.com')


def show_agency_dashboard():
    """Main agency dashboard view."""

    st.title("🏢 Agency Dashboard")

    user_email = get_user_email()

    # Check if user is an agency
    if not is_agency_account(user_email) and not is_demo_mode():
        st.warning("⚠️ This page is only available for agency accounts.")
        st.info("💡 Upgrade to an Agency Plan to access multi-agent features, rankings, and team analytics.")
        return

    # Get agency data (demo or real)
    if is_demo_mode():
        agency_data = get_demo_agency_data()
        st.info("📊 **DEMO MODE** - Viewing sample agency data")
    else:
        agency_config = get_agency_config(user_email)
        if not agency_config:
            st.error("Error loading agency configuration")
            return

        # TODO: Load real agency stats
        agency_data = {
            "agency_name": agency_config.get('agency_name'),
            "agents": get_agency_agents(agency_config.get('id')),
            # Will calculate from real data later
        }

    # Display agency name
    st.subheader(f"📍 {agency_data.get('agency_name', 'Your Agency')}")

    # Top-level metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="👥 Active Agents",
            value=len(agency_data.get('agents', [])),
            delta="+2 this month" if is_demo_mode() else None
        )

    with col2:
        total_premium = agency_data.get('total_premium_ytd', 0)
        st.metric(
            label="💰 Total Premium YTD",
            value=f"${total_premium:,.0f}",
            delta="+12% vs last year" if is_demo_mode() else None
        )

    with col3:
        total_commission = agency_data.get('total_commission_ytd', 0)
        st.metric(
            label="💵 Total Commission YTD",
            value=f"${total_commission:,.0f}",
            delta="+8% vs last year" if is_demo_mode() else None
        )

    with col4:
        total_policies = agency_data.get('total_policies', 0)
        st.metric(
            label="📋 Total Policies",
            value=total_policies,
            delta="+15 this month" if is_demo_mode() else None
        )

    st.divider()

    # Agent Rankings
    st.subheader("🏆 Agent Rankings - YTD Performance")

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
            'commission_ytd': '💵 Commission YTD',
            'role': '🎭 Role'
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
            if 'premium_ytd' in df_agents.columns:
                fig = px.bar(
                    df_agents,
                    x='name',
                    y='premium_ytd',
                    title="Total Premium Written (YTD)",
                    labels={'name': 'Agent', 'premium_ytd': 'Premium ($)'},
                    color='premium_ytd',
                    color_continuous_scale='Blues'
                )
                fig.update_layout(showlegend=False)
                st.plotly_chart(fig, use_container_width=True, key="premium_chart")

        with col2:
            st.subheader("🎯 Commission by Agent")
            if 'commission_ytd' in df_agents.columns:
                fig = px.bar(
                    df_agents,
                    x='name',
                    y='commission_ytd',
                    title="Total Commission Earned (YTD)",
                    labels={'name': 'Agent', 'commission_ytd': 'Commission ($)'},
                    color='commission_ytd',
                    color_continuous_scale='Greens'
                )
                fig.update_layout(showlegend=False)
                st.plotly_chart(fig, use_container_width=True, key="commission_chart")

        # Policy count pie chart
        st.subheader("📈 Policy Distribution")
        if 'policies' in df_agents.columns:
            fig = px.pie(
                df_agents,
                names='name',
                values='policies',
                title="Policies by Agent",
                hole=0.4
            )
            st.plotly_chart(fig, use_container_width=True, key="policy_distribution_chart")
    else:
        st.info("No agents found. Add agents to see rankings and analytics.")

    st.divider()

    # Agent performance trends (demo)
    if is_demo_mode():
        st.subheader("📈 Performance Trends (Last 6 Months)")

        # Generate fake trend data
        months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
        trend_data = []

        for agent in agents[:3]:  # Top 3 agents
            for i, month in enumerate(months):
                trend_data.append({
                    'Month': month,
                    'Agent': agent['name'],
                    'Premium': agent.get('premium_ytd', 0) / 6 * (0.8 + i * 0.1)  # Fake trend
                })

        df_trends = pd.DataFrame(trend_data)

        fig = px.line(
            df_trends,
            x='Month',
            y='Premium',
            color='Agent',
            title="Monthly Premium Trends",
            markers=True
        )
        st.plotly_chart(fig, use_container_width=True, key="monthly_trends_chart")

    st.divider()

    # Quick actions
    st.subheader("⚡ Quick Actions")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("➕ Add New Agent", use_container_width=True):
            st.info("Navigate to Admin Panel → Agent Management")

    with col2:
        if st.button("📊 View Full Reports", use_container_width=True):
            st.info("Navigate to Reports page")

    with col3:
        if st.button("💳 Carrier Reconciliation", use_container_width=True):
            st.info("Navigate to Reconciliation page")

    with col4:
        if st.button("⚙️ Agency Settings", use_container_width=True):
            st.info("Navigate to Admin Panel")


# Main execution
if __name__ == "__main__":
    show_agency_dashboard()
