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
from datetime import datetime

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
    """Step 4: Review and import."""

    st.subheader("👀 Step 4: Review & Import")

    st.info("🚧 Review and import functionality coming soon!")
    st.write("This will show:")
    st.write("- Matched transactions (with confidence scores)")
    st.write("- Unmatched transactions (for manual assignment)")
    st.write("- Agent assignment review")
    st.write("- Final import button")

    # Navigation
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("← Back to Mapping", use_container_width=True):
            st.session_state.recon_step = 3
            st.rerun()

    with col2:
        if st.button("🔄 Start Over", use_container_width=True):
            # Clear session state
            for key in ['recon_step', 'uploaded_df', 'uploaded_filename', 'assignment_mode',
                       'selected_agent_id', 'agents_list', 'column_mapping']:
                if key in st.session_state:
                    del st.session_state[key]
            st.session_state.recon_step = 1
            st.rerun()


# Main execution
if __name__ == "__main__":
    show_agency_reconciliation()
