"""
Agency Reconciliation Page
Multi-agent carrier statement reconciliation for agency owners.

This is the "Second Floor" - Agency-only reconciliation with agent assignment.
Does NOT affect solo agent reconciliation (Ground Floor).

Created: November 29, 2025
Branch: agency-platform
Task: 2.1 - Multi-Agent Reconciliation Flow
"""

import streamlit as st
import pandas as pd
import sys
import os
import time
from datetime import datetime
from uuid import uuid4
from typing import Dict, List, Tuple

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.agency_reconciliation_helpers import (
    get_supabase_client,
    load_agency_policies_for_matching,
    get_agent_name_map,
    bulk_insert_transactions
)

from utils.agent_assignment_logic import (
    auto_assign_by_policy_ownership,
    validate_agent_assignment,
    bulk_assign_transactions,
    get_assignment_mode,
    get_unassigned_count
)

from utils.agency_statement_matcher import (
    process_statement_with_agent_attribution,
    create_stmt_entry,
    create_new_transaction
)

st.set_page_config(
    page_title="Agency Reconciliation",
    page_icon="💳",
    layout="wide"
)


def show_agency_reconciliation():
    """Main agency reconciliation page."""

    st.title("💳 Agency Reconciliation")

    # Check access
    if not st.session_state.get('is_agency_owner', False):
        st.warning("⚠️ This page is only available for agency owners.")
        return

    agency_id = st.session_state.get('agency_id')
    agency_name = st.session_state.get('agency_name', 'Your Agency')

    if not agency_id:
        st.error("Agency ID not found in session")
        return

    st.subheader(f"📍 {agency_name}")
    st.write("Import carrier statements and assign transactions to your agents.")

    # Initialize session state for reconciliation
    if 'recon_step' not in st.session_state:
        st.session_state.recon_step = 1

    # Progress indicator
    steps = ["Upload Statement", "Assign Agents", "Map Columns", "Review & Import"]
    current_step = st.session_state.recon_step

    # Show progress
    col1, col2, col3, col4 = st.columns(4)
    cols = [col1, col2, col3, col4]

    for i, (col, step) in enumerate(zip(cols, steps), 1):
        with col:
            if i < current_step:
                st.success(f"✅ {step}")
            elif i == current_step:
                st.info(f"▶️ {step}")
            else:
                st.text(f"⏸️ {step}")

    st.divider()

    # Route to appropriate step
    if current_step == 1:
        show_upload_step(agency_id)
    elif current_step == 2:
        show_assignment_step(agency_id)
    elif current_step == 3:
        show_mapping_step(agency_id)
    elif current_step == 4:
        show_review_step(agency_id)


def show_upload_step(agency_id: str):
    """Step 1: Upload carrier statement."""

    st.subheader("📤 Step 1: Upload Carrier Statement")

    st.info("Upload a CSV or Excel file containing carrier commission statement data.")

    # File uploader
    uploaded_file = st.file_uploader(
        "Choose a file",
        type=['csv', 'xlsx', 'xls'],
        help="Supported formats: CSV, Excel (.xlsx, .xls)",
        key="statement_upload"
    )

    if uploaded_file is not None:
        try:
            # Parse file
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file, on_bad_lines='warn')
            else:
                df = pd.read_excel(uploaded_file, engine='openpyxl')

            # Show preview
            st.success(f"✅ File loaded: {uploaded_file.name}")
            st.write(f"**Rows**: {len(df)} | **Columns**: {len(df.columns)}")

            st.write("**Preview (first 10 rows)**:")
            st.dataframe(df.head(10), use_container_width=True)

            # Store in session
            st.session_state.uploaded_df = df
            st.session_state.uploaded_filename = uploaded_file.name

            # Next button
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                if st.button("Continue to Agent Assignment →", type="primary", use_container_width=True):
                    st.session_state.recon_step = 2
                    st.rerun()

        except Exception as e:
            st.error(f"Error reading file: {e}")
            st.info("Please check that your file is a valid CSV or Excel file.")

    else:
        st.info("👆 Upload a file to get started")

        # Show example format
        with st.expander("📋 Example Statement Format"):
            example_data = {
                'Customer Name': ['John Doe', 'Jane Smith', 'ABC Corp'],
                'Policy Number': ['POL-001', 'POL-002', 'POL-003'],
                'Effective Date': ['2025-01-01', '2025-01-15', '2025-02-01'],
                'Commission Amount': [500.00, 750.00, 1200.00],
                'Carrier Name': ['Progressive', 'State Farm', 'Travelers']
            }
            st.dataframe(pd.DataFrame(example_data), use_container_width=True)


def show_assignment_step(agency_id: str):
    """Step 2: Choose agent assignment strategy."""

    st.subheader("👥 Step 2: Agent Assignment Strategy")

    if 'uploaded_df' not in st.session_state:
        st.error("No file uploaded. Please go back to Step 1.")
        if st.button("← Back to Upload"):
            st.session_state.recon_step = 1
            st.rerun()
        return

    df = st.session_state.uploaded_df
    st.write(f"**File**: {st.session_state.uploaded_filename} ({len(df)} rows)")

    st.write("Choose how to assign transactions to agents:")

    # Get agency agents
    try:
        supabase = get_supabase_client()
        agents_result = supabase.table('agents')\
            .select('id, users!inner(full_name)')\
            .eq('agency_id', agency_id)\
            .eq('is_active', True)\
            .execute()

        if not agents_result.data:
            st.error("No active agents found. Please add agents first in Team Management.")
            return

        agents = [{'id': a['id'], 'name': a['users']['full_name']} for a in agents_result.data]

    except Exception as e:
        st.error(f"Error loading agents: {e}")
        return

    # Assignment strategy selector
    assignment_mode = st.radio(
        "Assignment Strategy",
        options=['assign_all', 'auto_assign', 'manual'],
        format_func=lambda x: {
            'assign_all': '📌 Assign all transactions to one agent',
            'auto_assign': '🤖 Auto-assign based on existing policy ownership',
            'manual': '✍️ I will assign each transaction manually in review'
        }[x],
        key="assignment_strategy"
    )

    selected_agent_id = None

    if assignment_mode == 'assign_all':
        st.write("**Select the agent to assign all transactions:**")
        selected_agent_id = st.selectbox(
            "Agent",
            options=[a['id'] for a in agents],
            format_func=lambda x: next(a['name'] for a in agents if a['id'] == x),
            key="bulk_agent_selection"
        )

        selected_name = next(a['name'] for a in agents if a['id'] == selected_agent_id)
        st.info(f"All {len(df)} transactions will be assigned to **{selected_name}**")

    elif assignment_mode == 'auto_assign':
        st.info("Transactions will be matched to agents based on existing policy ownership. Unmatched transactions will require manual assignment in the review step.")

    else:  # manual
        st.info("You'll assign each transaction to an agent during the review step.")

    # Store selection
    st.session_state.assignment_mode = assignment_mode
    st.session_state.selected_agent_id = selected_agent_id
    st.session_state.agents_list = agents

    # Navigation buttons
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("← Back to Upload", use_container_width=True):
            st.session_state.recon_step = 1
            st.rerun()

    with col3:
        if st.button("Continue to Column Mapping →", type="primary", use_container_width=True):
            st.session_state.recon_step = 3
            st.rerun()


def show_mapping_step(agency_id: str):
    """Step 3: Map columns from statement to system fields."""

    st.subheader("🗺️ Step 3: Column Mapping")

    if 'uploaded_df' not in st.session_state:
        st.error("No file uploaded. Please go back to Step 1.")
        return

    df = st.session_state.uploaded_df
    columns = list(df.columns)

    st.write("Map the columns from your statement to our system fields:")

    # Required fields
    st.write("### Required Fields")

    col1, col2 = st.columns(2)

    with col1:
        customer_col = st.selectbox(
            "Customer Name",
            options=[''] + columns,
            help="Column containing customer/insured name",
            key="map_customer"
        )

        policy_col = st.selectbox(
            "Policy Number",
            options=[''] + columns,
            help="Column containing policy number",
            key="map_policy"
        )

    with col2:
        date_col = st.selectbox(
            "Effective Date",
            options=[''] + columns,
            help="Column containing policy effective date",
            key="map_date"
        )

        amount_col = st.selectbox(
            "Commission Amount",
            options=[''] + columns,
            help="Column containing commission amount paid",
            key="map_amount"
        )

    # Optional fields
    st.write("### Optional Fields")

    col1, col2 = st.columns(2)

    with col1:
        carrier_col = st.selectbox(
            "Carrier Name (optional)",
            options=[''] + columns,
            key="map_carrier"
        )

        trans_type_col = st.selectbox(
            "Transaction Type (optional)",
            options=[''] + columns,
            help="NEW, RWL, CAN, etc.",
            key="map_trans_type"
        )

    with col2:
        policy_type_col = st.selectbox(
            "Policy Type (optional)",
            options=[''] + columns,
            help="Auto, Home, Commercial, etc.",
            key="map_policy_type"
        )

        premium_col = st.selectbox(
            "Premium Amount (optional)",
            options=[''] + columns,
            key="map_premium"
        )

    # Validate required fields
    required_fields = {
        'customer': customer_col,
        'policy': policy_col,
        'date': date_col,
        'amount': amount_col
    }

    all_required = all(required_fields.values())

    if all_required:
        st.success("✅ All required fields mapped!")

        # Store mapping
        st.session_state.column_mapping = {
            'Customer': customer_col,
            'Policy Number': policy_col,
            'Effective Date': date_col,
            'Agent Paid Amount (STMT)': amount_col,
            'Carrier Name': carrier_col if carrier_col else None,
            'Transaction Type': trans_type_col if trans_type_col else None,
            'Policy Type': policy_type_col if policy_type_col else None,
            'Premium Sold': premium_col if premium_col else None
        }

        # Show preview
        st.write("### Preview Mapped Data")
        preview_df = df[[v for v in required_fields.values() if v]].head(5)
        st.dataframe(preview_df, use_container_width=True)

    else:
        st.warning("⚠️ Please map all required fields to continue")

    # Navigation
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("← Back to Assignment", use_container_width=True):
            st.session_state.recon_step = 2
            st.rerun()

    with col3:
        if all_required:
            if st.button("Continue to Review →", type="primary", use_container_width=True):
                st.session_state.recon_step = 4
                st.rerun()


def show_review_step(agency_id: str):
    """Step 4: Review matched/unmatched transactions and import."""
    st.subheader("📋 Step 4: Review & Import")

    # Get required session data
    if 'uploaded_df' not in st.session_state or 'column_mapping' not in st.session_state:
        st.error("Missing upload or mapping data. Please start from Step 1.")
        if st.button("← Back to Step 1"):
            st.session_state.recon_step = 1
            st.rerun()
        return

    df = st.session_state.uploaded_df
    column_mapping = st.session_state.column_mapping
    assignment_mode = st.session_state.get('assignment_mode', 'manual')
    selected_agent_id = st.session_state.get('selected_agent_id')

    # Initialize session state for matches
    if 'agency_matched_transactions' not in st.session_state:
        with st.spinner("🔍 Matching transactions..."):
            # Process and match transactions
            matched, unmatched, to_create = process_statement_with_agent_attribution(
                df,
                column_mapping,
                agency_id,
                assignment_mode,
                selected_agent_id
            )

            st.session_state.agency_matched_transactions = matched
            st.session_state.agency_unmatched_transactions = unmatched
            st.session_state.agency_to_create = to_create

    matched = st.session_state.agency_matched_transactions
    unmatched = st.session_state.agency_unmatched_transactions
    to_create = st.session_state.agency_to_create

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("✅ Matched", len(matched))
    with col2:
        st.metric("❓ Unmatched", len(unmatched))
    with col3:
        st.metric("➕ To Create", len(to_create))
    with col4:
        unassigned = sum(1 for t in unmatched if not t.get('assigned_agent_id'))
        st.metric("⚠️ Needs Assignment", unassigned)

    if unassigned > 0:
        st.warning(f"⚠️ {unassigned} transaction(s) need agent assignment before import")

    st.divider()

    # Tabs for different views
    tab1, tab2 = st.tabs(["✅ Matched Transactions", "❓ Unmatched Transactions"])

    with tab1:
        show_matched_tab(matched, agency_id)

    with tab2:
        show_unmatched_tab(unmatched, agency_id)

    st.divider()

    # Import button
    all_assigned = unassigned == 0

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if all_assigned:
            if st.button("📥 Import All Transactions", type="primary", use_container_width=True):
                with st.spinner("Importing transactions..."):
                    success, message, count = import_agency_transactions(
                        matched,
                        unmatched,
                        agency_id,
                        st.session_state.get('user_id', 'demo-user')
                    )

                    if success:
                        st.success(f"✅ {message}")
                        st.balloons()

                        # Clear session state
                        clear_agency_recon_session()

                        # Reset to step 1
                        time.sleep(2)
                        st.session_state.recon_step = 1
                        st.rerun()
                    else:
                        st.error(f"❌ {message}")
        else:
            st.info("👆 Please assign agents to all unmatched transactions before importing")

    # Navigation
    st.divider()
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("← Back to Mapping", use_container_width=True):
            st.session_state.recon_step = 3
            st.rerun()
    with col2:
        if st.button("🔄 Re-process Matches", use_container_width=True):
            # Clear matches and re-process
            for key in ['agency_matched_transactions', 'agency_unmatched_transactions', 'agency_to_create']:
                if key in st.session_state:
                    del st.session_state[key]
            st.rerun()
    with col3:
        if st.button("🔁 Start Over", use_container_width=True):
            clear_agency_recon_session()
            st.session_state.recon_step = 1
            st.rerun()


def show_matched_tab(matched: List[Dict], agency_id: str):
    """Show matched transactions with agent info."""
    if not matched:
        st.info("No matched transactions. All transactions are new.")
        return

    st.write(f"**{len(matched)} transactions matched to existing policies**")
    st.write("These will create -STMT- reconciliation entries.")

    # Get agent names
    agent_names = get_agent_name_map(agency_id)

    # Create display dataframe
    display_data = []
    for m in matched:
        display_data.append({
            'Customer': m['customer'],
            'Policy': m['policy_number'],
            'Amount': m['amount'],
            'Matched To': m['match'].get('Transaction ID', 'N/A'),
            'Agent': agent_names.get(m['matched_agent_id'], 'Unknown'),
            'Confidence': f"{m['confidence']}%",
            'Match Type': m['match_type']
        })

    df = pd.DataFrame(display_data)
    st.dataframe(
        df,
        column_config={
            'Amount': st.column_config.NumberColumn(format="$%.2f")
        },
        use_container_width=True,
        hide_index=True
    )


def show_unmatched_tab(unmatched: List[Dict], agency_id: str):
    """Show unmatched transactions with agent assignment."""
    if not unmatched:
        st.success("✅ All transactions were matched!")
        return

    st.write(f"**{len(unmatched)} new transactions to create**")
    st.write("Assign these to agents, then import.")

    # Get agents list
    agents = st.session_state.get('agents_list', [])
    if not agents:
        st.error("No agents found")
        return

    agent_names = get_agent_name_map(agency_id)

    # Show each unmatched transaction
    for idx, trans in enumerate(unmatched):
        with st.expander(f"**{trans['customer']}** - {trans['policy_number']} (${trans['amount']:.2f})"):
            col1, col2 = st.columns([3, 2])

            with col1:
                st.write(f"**Customer**: {trans['customer']}")
                st.write(f"**Policy**: {trans['policy_number']}")
                st.write(f"**Date**: {trans['effective_date']}")
                st.write(f"**Amount**: ${trans['amount']:.2f}")

                if trans.get('carrier'):
                    st.write(f"**Carrier**: {trans['carrier']}")
                if trans.get('policy_type'):
                    st.write(f"**Type**: {trans['policy_type']}")

            with col2:
                # Show assignment status
                current_agent_id = trans.get('assigned_agent_id')
                assignment_method = trans.get('assignment_method', 'manual')

                if current_agent_id:
                    st.success(f"✅ Assigned: {agent_names.get(current_agent_id, 'Unknown')}")
                    st.caption(f"Method: {assignment_method}")
                else:
                    st.warning("⚠️ Not assigned")

                # Agent assignment dropdown
                selected_agent = st.selectbox(
                    "Assign to Agent",
                    options=[a['id'] for a in agents],
                    format_func=lambda x: agent_names.get(x, next((a['name'] for a in agents if a['id'] == x), 'Unknown')),
                    index=[a['id'] for a in agents].index(current_agent_id) if current_agent_id and current_agent_id in [a['id'] for a in agents] else 0,
                    key=f"agent_assign_{idx}"
                )

                # Update assignment
                if selected_agent != current_agent_id:
                    trans['assigned_agent_id'] = selected_agent
                    trans['assignment_method'] = 'manual_review'


def import_agency_transactions(
    matched: List[Dict],
    unmatched: List[Dict],
    agency_id: str,
    user_id: str
) -> Tuple[bool, str, int]:
    """
    Import matched and unmatched transactions with agent attribution.

    Args:
        matched: Matched transactions (will create -STMT- entries)
        unmatched: Unmatched transactions (will create new policies)
        agency_id: Agency ID
        user_id: User ID

    Returns:
        Tuple of (success, message, count)
    """
    try:
        supabase = get_supabase_client()
        transactions_to_insert = []

        # Generate reconciliation ID
        reconciliation_id = str(uuid4())
        stmt_date = datetime.now().strftime('%Y-%m-%d')

        # Process matched transactions - create -STMT- entries
        for matched_trans in matched:
            original_policy = matched_trans['match']
            agent_id = matched_trans['matched_agent_id']

            stmt_entry = create_stmt_entry(
                original_policy,
                matched_trans['amount'],
                stmt_date,
                reconciliation_id,
                agent_id,
                agency_id
            )

            stmt_entry['user_id'] = user_id
            transactions_to_insert.append(stmt_entry)

        # Process unmatched transactions - create new policies
        for unmatched_trans in unmatched:
            agent_id = unmatched_trans['assigned_agent_id']

            if not agent_id:
                return False, "Some transactions are not assigned to agents", 0

            new_trans = create_new_transaction(
                unmatched_trans,
                agent_id,
                agency_id,
                user_id
            )

            transactions_to_insert.append(new_trans)

        # Bulk insert
        if transactions_to_insert:
            result = supabase.table('policies').insert(transactions_to_insert).execute()

            if result.data:
                count = len(result.data)
                return True, f"Successfully imported {count} transactions ({len(matched)} -STMT- entries, {len(unmatched)} new policies)", count
            else:
                return False, "Failed to insert transactions", 0
        else:
            return False, "No transactions to import", 0

    except Exception as e:
        return False, f"Error importing: {str(e)}", 0


def clear_agency_recon_session():
    """Clear agency reconciliation session state."""
    keys_to_clear = [
        'uploaded_df', 'uploaded_filename', 'assignment_mode',
        'selected_agent_id', 'agents_list', 'column_mapping',
        'agency_matched_transactions', 'agency_unmatched_transactions',
        'agency_to_create'
    ]

    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]


# Main execution
if __name__ == "__main__":
    show_agency_reconciliation()
