"""
Team Management Page - Agency Platform
Allows agency owners to manage their team of agents
"""
import streamlit as st
import pandas as pd
from supabase import create_client
import os
from datetime import datetime

def get_supabase_client():
    """Get Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key)


def get_agency_agents(agency_id: str):
    """Get all agents for an agency with their stats."""
    try:
        supabase = get_supabase_client()

        # Get agents with user information
        result = supabase.table('agents')\
            .select('*, users!inner(email, full_name)')\
            .eq('agency_id', agency_id)\
            .execute()

        if result.data:
            # Flatten the data structure
            agents = []
            for agent in result.data:
                agents.append({
                    'id': agent['id'],
                    'user_id': agent['user_id'],
                    'name': agent['users']['full_name'],
                    'email': agent['users']['email'],
                    'role': agent['role'],
                    'is_active': agent['is_active'],
                    'created_at': agent['created_at']
                })

            # Get policy counts and commission data for each agent
            for agent in agents:
                agent_policies = supabase.table('policies')\
                    .select('premium, commission')\
                    .eq('agent_id', agent['id'])\
                    .execute()

                if agent_policies.data:
                    agent['policy_count'] = len(agent_policies.data)
                    # Calculate YTD commission (would need date filtering in production)
                    agent['ytd_commission'] = sum(p.get('commission', 0) or 0 for p in agent_policies.data)
                else:
                    agent['policy_count'] = 0
                    agent['ytd_commission'] = 0

            return agents
        return []
    except Exception as e:
        st.error(f"Error loading agents: {e}")
        return []


def add_agent(agency_id: str, name: str, email: str, role: str):
    """Add a new agent to the agency."""
    try:
        supabase = get_supabase_client()

        # Check if email already exists
        existing_user = supabase.table('users').select('id').eq('email', email.lower()).execute()

        if existing_user.data:
            # User exists, just create agent record
            user_id = existing_user.data[0]['id']
        else:
            # Create new user
            user_data = {
                'email': email.lower(),
                'full_name': name,
                'is_active': True,
                'password_set': False,  # They'll need to set password
                'subscription_status': 'agency_member'  # Different from individual subscriber
            }
            user_result = supabase.table('users').insert(user_data).execute()

            if not user_result.data:
                return False, "Error creating user account"

            user_id = user_result.data[0]['id']

        # Create agent record
        agent_data = {
            'user_id': user_id,
            'agency_id': agency_id,
            'role': role,
            'is_active': True
        }

        agent_result = supabase.table('agents').insert(agent_data).execute()

        if agent_result.data:
            # TODO: Send invitation email to agent
            return True, "Agent added successfully!"
        else:
            return False, "Error creating agent record"

    except Exception as e:
        return False, str(e)


def update_agent(agent_id: str, name: str, role: str, is_active: bool):
    """Update agent details."""
    try:
        supabase = get_supabase_client()

        # Update agent role and status
        agent_result = supabase.table('agents').update({
            'role': role,
            'is_active': is_active
        }).eq('id', agent_id).execute()

        # Update user name
        agent = supabase.table('agents').select('user_id').eq('id', agent_id).execute()
        if agent.data:
            user_id = agent.data[0]['user_id']
            supabase.table('users').update({
                'full_name': name
            }).eq('id', user_id).execute()

        return True, "Agent updated successfully!"

    except Exception as e:
        return False, str(e)


def deactivate_agent(agent_id: str):
    """Deactivate an agent (soft delete)."""
    try:
        supabase = get_supabase_client()

        result = supabase.table('agents').update({
            'is_active': False
        }).eq('id', agent_id).execute()

        return True, "Agent deactivated successfully!"

    except Exception as e:
        return False, str(e)


def show_team_management():
    """Main team management page."""
    st.title("👥 Team Management")

    # Check if user is agency owner
    if not st.session_state.get('is_agency_owner', False):
        st.warning("⚠️ This page is only available for agency owners.")
        return

    agency_id = st.session_state.get('agency_id')
    agency_name = st.session_state.get('agency_name', 'Your Agency')

    if not agency_id:
        st.error("Agency ID not found in session")
        return

    st.subheader(f"📍 {agency_name}")

    # Load agents
    agents = get_agency_agents(agency_id)

    # Summary metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        active_count = sum(1 for a in agents if a['is_active'])
        st.metric("👥 Active Agents", active_count)
    with col2:
        total_policies = sum(a['policy_count'] for a in agents)
        st.metric("📋 Total Policies", total_policies)
    with col3:
        total_commission = sum(a['ytd_commission'] for a in agents)
        st.metric("💰 Total Commission YTD", f"${total_commission:,.0f}")

    st.divider()

    # Action buttons
    col1, col2 = st.columns([3, 1])
    with col2:
        if st.button("➕ Add New Agent", type="primary", use_container_width=True):
            st.session_state.show_add_agent_form = True
            st.rerun()

    # Show add agent form if requested
    if st.session_state.get('show_add_agent_form', False):
        show_add_agent_form(agency_id)
        st.divider()

    # Agent list
    st.subheader("Team Members")

    if not agents:
        st.info("No agents yet. Click 'Add New Agent' to get started!")
        return

    # Display agents in cards
    for agent in agents:
        with st.expander(
            f"{'✅' if agent['is_active'] else '⏸️'} {agent['name']} - {agent['email']}" ,
            expanded=False
        ):
            col1, col2 = st.columns([2, 1])

            with col1:
                st.write(f"**Role:** {agent['role'].title()}")
                st.write(f"**Status:** {'Active' if agent['is_active'] else 'Inactive'}")
                st.write(f"**Policies:** {agent['policy_count']}")
                st.write(f"**YTD Commission:** ${agent['ytd_commission']:,.0f}")
                st.caption(f"Joined: {agent['created_at'][:10]}")

            with col2:
                if st.button(f"Edit", key=f"edit_{agent['id']}", use_container_width=True):
                    st.session_state.editing_agent = agent
                    st.rerun()

                if agent['is_active']:
                    if st.button(f"Deactivate", key=f"deactivate_{agent['id']}",
                               use_container_width=True):
                        success, message = deactivate_agent(agent['id'])
                        if success:
                            st.success(message)
                            st.rerun()
                        else:
                            st.error(message)

    # Show edit agent form if editing
    if st.session_state.get('editing_agent'):
        st.divider()
        show_edit_agent_form(st.session_state.editing_agent)


def show_add_agent_form(agency_id: str):
    """Show form to add a new agent."""
    st.subheader("➕ Add New Agent")

    with st.form("add_agent_form"):
        name = st.text_input("Agent Name*", placeholder="e.g. Jane Doe")
        email = st.text_input("Agent Email*", placeholder="jane@agency.com")
        role = st.selectbox("Role*", ["agent", "manager", "admin"],
                           help="Agent = Standard agent, Manager = Can view team data, Admin = Full access")

        col1, col2 = st.columns(2)
        with col1:
            submit = st.form_submit_button("Add Agent", type="primary", use_container_width=True)
        with col2:
            cancel = st.form_submit_button("Cancel", use_container_width=True)

        if submit:
            if name and email:
                success, message = add_agent(agency_id, name, email, role)
                if success:
                    st.success(message)
                    st.info("💡 An invitation email will be sent to the agent to set their password.")
                    st.session_state.show_add_agent_form = False
                    st.rerun()
                else:
                    st.error(message)
            else:
                st.error("Please fill in all required fields")

        if cancel:
            st.session_state.show_add_agent_form = False
            st.rerun()


def show_edit_agent_form(agent: dict):
    """Show form to edit an existing agent."""
    st.subheader(f"✏️ Edit Agent: {agent['name']}")

    with st.form("edit_agent_form"):
        name = st.text_input("Agent Name*", value=agent['name'])
        st.text_input("Email", value=agent['email'], disabled=True,
                     help="Email cannot be changed")
        role = st.selectbox("Role*", ["agent", "manager", "admin"],
                           index=["agent", "manager", "admin"].index(agent['role']))
        is_active = st.checkbox("Active", value=agent['is_active'])

        col1, col2 = st.columns(2)
        with col1:
            submit = st.form_submit_button("Save Changes", type="primary", use_container_width=True)
        with col2:
            cancel = st.form_submit_button("Cancel", use_container_width=True)

        if submit:
            if name:
                success, message = update_agent(agent['id'], name, role, is_active)
                if success:
                    st.success(message)
                    del st.session_state.editing_agent
                    st.rerun()
                else:
                    st.error(message)
            else:
                st.error("Agent name is required")

        if cancel:
            del st.session_state.editing_agent
            st.rerun()


# Main execution
if __name__ == "__main__":
    show_team_management()
