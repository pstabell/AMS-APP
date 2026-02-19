"""
Agency Settings Page
Centralized settings and configuration for agency owners.

Features:
- Agency profile management
- Subscription/plan details
- Notification preferences
- Branding customization
- Team settings

Created: November 29, 2025
Branch: agency-platform
Task: 3.1 - Agency Settings Page
"""

import streamlit as st
import sys
import os
from datetime import datetime
from typing import Dict, Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.agency_reconciliation_helpers import get_supabase_client

st.set_page_config(
    page_title="Agency Settings",
    page_icon="⚙️",
    layout="wide"
)


def show_agency_settings():
    """Main agency settings page."""

    st.title("⚙️ Agency Settings")

    # Check access
    if not st.session_state.get('is_agency_owner', False):
        st.warning("⚠️ This page is only available for agency owners.")
        return

    agency_id = st.session_state.get('agency_id')
    agency_name = st.session_state.get('agency_name', 'Your Agency')

    if not agency_id:
        st.error("Agency ID not found in session")
        return

    st.write(f"Manage settings for **{agency_name}**")

    # Tabs for different settings sections
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🏢 Agency Profile",
        "💳 Subscription & Plan",
        "🔔 Notifications",
        "🎨 Branding",
        "💰 Commission Rules"
    ])

    with tab1:
        show_agency_profile(agency_id)

    with tab2:
        show_subscription_plan(agency_id)

    with tab3:
        show_notification_preferences(agency_id)

    with tab4:
        show_branding_customization(agency_id)

    with tab5:
        show_commission_rules(agency_id)


def show_agency_profile(agency_id: str):
    """Agency profile section."""

    st.subheader("🏢 Agency Profile")
    st.write("Update your agency information and contact details.")

    # Load current agency data
    agency_data = load_agency_data(agency_id)

    if not agency_data:
        st.error("Could not load agency data")
        return

    # Profile form
    with st.form("agency_profile_form"):
        st.write("### Basic Information")

        col1, col2 = st.columns(2)

        with col1:
            agency_name = st.text_input(
                "Agency Name *",
                value=agency_data.get('name', ''),
                help="Your agency's legal business name"
            )

            phone = st.text_input(
                "Phone Number",
                value=agency_data.get('phone', ''),
                placeholder="(555) 123-4567"
            )

            website = st.text_input(
                "Website",
                value=agency_data.get('website', ''),
                placeholder="https://www.yourwebsite.com"
            )

        with col2:
            email = st.text_input(
                "Contact Email *",
                value=agency_data.get('email', ''),
                help="Main contact email for the agency"
            )

            license_number = st.text_input(
                "License Number",
                value=agency_data.get('license_number', ''),
                help="State insurance license number"
            )

            tax_id = st.text_input(
                "Tax ID (EIN)",
                value=agency_data.get('tax_id', ''),
                help="Federal Employer Identification Number"
            )

        st.divider()
        st.write("### Address")

        address_line1 = st.text_input(
            "Address Line 1",
            value=agency_data.get('address_line1', ''),
            placeholder="123 Main Street"
        )

        address_line2 = st.text_input(
            "Address Line 2 (optional)",
            value=agency_data.get('address_line2', ''),
            placeholder="Suite 100"
        )

        col1, col2, col3 = st.columns(3)

        with col1:
            city = st.text_input(
                "City",
                value=agency_data.get('city', '')
            )

        with col2:
            state = st.text_input(
                "State",
                value=agency_data.get('state', ''),
                max_chars=2,
                placeholder="CA"
            )

        with col3:
            zip_code = st.text_input(
                "ZIP Code",
                value=agency_data.get('zip_code', ''),
                placeholder="90210"
            )

        st.divider()

        # Submit button
        col1, col2, col3 = st.columns([2, 1, 2])
        with col2:
            submitted = st.form_submit_button(
                "💾 Save Profile",
                type="primary",
                use_container_width=True
            )

        if submitted:
            # Validate required fields
            if not agency_name or not email:
                st.error("❌ Please fill in all required fields (marked with *)")
            else:
                # Update agency data
                success = update_agency_profile(
                    agency_id,
                    {
                        'name': agency_name,
                        'email': email,
                        'phone': phone,
                        'website': website,
                        'license_number': license_number,
                        'tax_id': tax_id,
                        'address_line1': address_line1,
                        'address_line2': address_line2,
                        'city': city,
                        'state': state,
                        'zip_code': zip_code,
                        'updated_at': datetime.now().isoformat()
                    }
                )

                if success:
                    st.success("✅ Agency profile updated successfully!")
                    # Update session state
                    st.session_state.agency_name = agency_name
                    st.rerun()
                else:
                    st.error("❌ Failed to update profile. Please try again.")


def show_subscription_plan(agency_id: str):
    """Subscription and plan details section."""

    st.subheader("💳 Subscription & Plan")
    st.write("Manage your subscription and view plan details.")

    # Load subscription data
    subscription_data = load_subscription_data(agency_id)

    # Current plan
    st.write("### Current Plan")

    col1, col2, col3 = st.columns(3)

    with col1:
        plan_name = subscription_data.get('plan_name', 'Agency Basic')
        st.metric("Plan", plan_name)

    with col2:
        status = subscription_data.get('status', 'Active')
        st.metric("Status", status)

    with col3:
        billing_cycle = subscription_data.get('billing_cycle', 'Monthly')
        st.metric("Billing Cycle", billing_cycle)

    st.divider()

    # Plan details
    st.write("### Plan Features")

    features = subscription_data.get('features', {})

    col1, col2 = st.columns(2)

    with col1:
        st.write("**Included in your plan:**")
        max_agents = features.get('max_agents', 10)
        st.write(f"✅ Up to {max_agents} agents")
        st.write(f"✅ Unlimited policies")
        st.write(f"✅ Multi-agent reconciliation")
        st.write(f"✅ Performance dashboards")
        st.write(f"✅ Team management")

    with col2:
        st.write("**Usage this month:**")
        current_agents = features.get('current_agents', 0)
        st.progress(current_agents / max_agents if max_agents > 0 else 0)
        st.write(f"{current_agents} of {max_agents} agents")

        st.write("")
        policies_this_month = features.get('policies_this_month', 0)
        st.write(f"📋 {policies_this_month} policies imported")

    st.divider()

    # Billing information
    st.write("### Billing Information")

    col1, col2 = st.columns(2)

    with col1:
        next_billing_date = subscription_data.get('next_billing_date', 'N/A')
        st.write(f"**Next Billing Date:** {next_billing_date}")

        payment_method = subscription_data.get('payment_method', 'Not configured')
        st.write(f"**Payment Method:** {payment_method}")

    with col2:
        monthly_cost = subscription_data.get('monthly_cost', 0)
        st.write(f"**Monthly Cost:** ${monthly_cost:.2f}")

        if st.button("💳 Update Payment Method", use_container_width=True):
            st.info("Payment method update coming soon. Contact support@metropoint.com")

    st.divider()

    # Upgrade/downgrade options
    st.write("### Change Plan")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Agency Basic**")
        st.write("$99/month")
        st.write("- Up to 5 agents")
        st.write("- Basic features")
        if plan_name != "Agency Basic":
            if st.button("Downgrade", key="downgrade_basic"):
                st.info("Contact support to change your plan")

    with col2:
        st.write("**Agency Pro**")
        st.write("$199/month")
        st.write("- Up to 15 agents")
        st.write("- Advanced analytics")
        st.write("- API access")
        if plan_name != "Agency Pro":
            if st.button("Upgrade to Pro", key="upgrade_pro", type="primary"):
                st.info("Contact support to upgrade your plan")

    with col3:
        st.write("**Agency Enterprise**")
        st.write("Custom pricing")
        st.write("- Unlimited agents")
        st.write("- White-label options")
        st.write("- Dedicated support")
        if st.button("Contact Sales", key="contact_sales"):
            st.info("Email: sales@metropoint.com")


def show_notification_preferences(agency_id: str):
    """Notification preferences section."""

    st.subheader("🔔 Notification Preferences")
    st.write("Configure how and when you receive notifications.")

    # Load current preferences
    prefs = load_notification_preferences(agency_id)

    with st.form("notification_preferences_form"):
        st.write("### Email Notifications")

        email_new_policy = st.checkbox(
            "New policy added by agent",
            value=prefs.get('email_new_policy', True),
            help="Receive email when an agent adds a new policy"
        )

        email_reconciliation = st.checkbox(
            "Reconciliation completed",
            value=prefs.get('email_reconciliation', True),
            help="Receive email when a reconciliation import is completed"
        )

        email_team_changes = st.checkbox(
            "Team member changes",
            value=prefs.get('email_team_changes', True),
            help="Receive email when agents are added or removed"
        )

        email_monthly_report = st.checkbox(
            "Monthly performance report",
            value=prefs.get('email_monthly_report', True),
            help="Receive monthly summary of agency performance"
        )

        st.divider()
        st.write("### In-App Notifications")

        inapp_new_policy = st.checkbox(
            "Show in-app alerts for new policies",
            value=prefs.get('inapp_new_policy', True)
        )

        inapp_reconciliation = st.checkbox(
            "Show in-app alerts for reconciliation",
            value=prefs.get('inapp_reconciliation', True)
        )

        st.divider()
        st.write("### Digest Settings")

        digest_frequency = st.selectbox(
            "Digest Email Frequency",
            options=['Daily', 'Weekly', 'Monthly', 'Never'],
            index=['Daily', 'Weekly', 'Monthly', 'Never'].index(prefs.get('digest_frequency', 'Weekly'))
        )

        digest_time = st.time_input(
            "Preferred Time for Digest",
            value=datetime.strptime(prefs.get('digest_time', '09:00'), '%H:%M').time()
        )

        st.divider()

        # Submit button
        col1, col2, col3 = st.columns([2, 1, 2])
        with col2:
            submitted = st.form_submit_button(
                "💾 Save Preferences",
                type="primary",
                use_container_width=True
            )

        if submitted:
            success = update_notification_preferences(
                agency_id,
                {
                    'email_new_policy': email_new_policy,
                    'email_reconciliation': email_reconciliation,
                    'email_team_changes': email_team_changes,
                    'email_monthly_report': email_monthly_report,
                    'inapp_new_policy': inapp_new_policy,
                    'inapp_reconciliation': inapp_reconciliation,
                    'digest_frequency': digest_frequency,
                    'digest_time': digest_time.strftime('%H:%M')
                }
            )

            if success:
                st.success("✅ Notification preferences updated!")
                st.rerun()
            else:
                st.error("❌ Failed to update preferences")


def show_branding_customization(agency_id: str):
    """Branding customization section."""

    st.subheader("🎨 Branding & Customization")
    st.write("Customize the appearance of your agency platform.")

    # Load current branding
    branding = load_branding_settings(agency_id)

    with st.form("branding_form"):
        st.write("### Agency Logo")

        col1, col2 = st.columns([1, 2])

        with col1:
            logo_url = branding.get('logo_url', '')
            if logo_url:
                st.image(logo_url, width=200, caption="Current Logo")
            else:
                st.info("No logo uploaded")

        with col2:
            logo_file = st.file_uploader(
                "Upload Logo",
                type=['png', 'jpg', 'jpeg', 'svg'],
                help="Recommended: 500x500px, PNG with transparent background"
            )

            if logo_file:
                st.success(f"✅ Selected: {logo_file.name}")

        st.divider()
        st.write("### Color Theme")

        col1, col2, col3 = st.columns(3)

        with col1:
            primary_color = st.color_picker(
                "Primary Color",
                value=branding.get('primary_color', '#1f77b4'),
                help="Main brand color"
            )

        with col2:
            secondary_color = st.color_picker(
                "Secondary Color",
                value=branding.get('secondary_color', '#ff7f0e'),
                help="Accent color"
            )

        with col3:
            background_color = st.color_picker(
                "Background Color",
                value=branding.get('background_color', '#ffffff'),
                help="Main background color"
            )

        st.divider()
        st.write("### Custom Text")

        tagline = st.text_input(
            "Agency Tagline",
            value=branding.get('tagline', ''),
            placeholder="Your trusted insurance partner",
            help="Displayed on dashboards and reports"
        )

        welcome_message = st.text_area(
            "Welcome Message",
            value=branding.get('welcome_message', ''),
            placeholder="Welcome to our insurance agency portal...",
            help="Shown to agents when they log in",
            height=100
        )

        st.divider()

        # Preview section
        st.write("### Preview")

        with st.container():
            st.markdown(
                f"""
                <div style="background-color: {background_color}; padding: 20px; border-radius: 10px; border: 2px solid {primary_color}">
                    <h2 style="color: {primary_color}">Agency Dashboard</h2>
                    <p style="color: {secondary_color}; font-style: italic">{tagline if tagline else 'Your tagline here'}</p>
                    <p>{welcome_message if welcome_message else 'Your welcome message here'}</p>
                </div>
                """,
                unsafe_allow_html=True
            )

        st.divider()

        # Submit button
        col1, col2, col3 = st.columns([2, 1, 2])
        with col2:
            submitted = st.form_submit_button(
                "💾 Save Branding",
                type="primary",
                use_container_width=True
            )

        if submitted:
            # Handle logo upload if provided
            logo_upload_url = None
            if logo_file:
                logo_upload_url = upload_logo(agency_id, logo_file)

            success = update_branding_settings(
                agency_id,
                {
                    'logo_url': logo_upload_url if logo_upload_url else logo_url,
                    'primary_color': primary_color,
                    'secondary_color': secondary_color,
                    'background_color': background_color,
                    'tagline': tagline,
                    'welcome_message': welcome_message
                }
            )

            if success:
                st.success("✅ Branding updated successfully!")
                st.rerun()
            else:
                st.error("❌ Failed to update branding")


# Data access functions

def load_agency_data(agency_id: str) -> Dict:
    """Load agency profile data."""
    try:
        supabase = get_supabase_client()
        result = supabase.table('agencies').select('*').eq('id', agency_id).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            return {}
    except Exception as e:
        st.error(f"Error loading agency data: {e}")
        return {}


def update_agency_profile(agency_id: str, data: Dict) -> bool:
    """Update agency profile."""
    try:
        supabase = get_supabase_client()
        result = supabase.table('agencies').update(data).eq('id', agency_id).execute()
        return bool(result.data)
    except Exception as e:
        st.error(f"Error updating profile: {e}")
        return False


def load_subscription_data(agency_id: str) -> Dict:
    """Load subscription data (placeholder)."""
    # TODO: Implement real subscription data loading
    return {
        'plan_name': 'Agency Pro',
        'status': 'Active',
        'billing_cycle': 'Monthly',
        'next_billing_date': '2025-12-29',
        'payment_method': 'Visa ****1234',
        'monthly_cost': 199.00,
        'features': {
            'max_agents': 15,
            'current_agents': 5,
            'policies_this_month': 45
        }
    }


def load_notification_preferences(agency_id: str) -> Dict:
    """Load notification preferences."""
    try:
        supabase = get_supabase_client()
        result = supabase.table('agency_settings')\
            .select('notification_preferences')\
            .eq('agency_id', agency_id)\
            .execute()

        if result.data and len(result.data) > 0:
            return result.data[0].get('notification_preferences', {})
        else:
            # Return defaults
            return {
                'email_new_policy': True,
                'email_reconciliation': True,
                'email_team_changes': True,
                'email_monthly_report': True,
                'inapp_new_policy': True,
                'inapp_reconciliation': True,
                'digest_frequency': 'Weekly',
                'digest_time': '09:00'
            }
    except Exception as e:
        # Return defaults on error
        return {
            'email_new_policy': True,
            'email_reconciliation': True,
            'email_team_changes': True,
            'email_monthly_report': True,
            'inapp_new_policy': True,
            'inapp_reconciliation': True,
            'digest_frequency': 'Weekly',
            'digest_time': '09:00'
        }


def update_notification_preferences(agency_id: str, preferences: Dict) -> bool:
    """Update notification preferences."""
    try:
        supabase = get_supabase_client()

        # Upsert to agency_settings table
        result = supabase.table('agency_settings').upsert({
            'agency_id': agency_id,
            'notification_preferences': preferences,
            'updated_at': datetime.now().isoformat()
        }).execute()

        return bool(result.data)
    except Exception as e:
        st.error(f"Error updating preferences: {e}")
        return False


@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_branding_settings(agency_id: str) -> Dict:
    """Load branding settings."""
    try:
        supabase = get_supabase_client()
        result = supabase.table('agency_settings')\
            .select('branding')\
            .eq('agency_id', agency_id)\
            .execute()

        if result.data and len(result.data) > 0:
            return result.data[0].get('branding', {})
        else:
            # Return defaults
            return {
                'logo_url': '',
                'primary_color': '#1f77b4',
                'secondary_color': '#ff7f0e',
                'background_color': '#ffffff',
                'tagline': '',
                'welcome_message': ''
            }
    except Exception as e:
        return {
            'logo_url': '',
            'primary_color': '#1f77b4',
            'secondary_color': '#ff7f0e',
            'background_color': '#ffffff',
            'tagline': '',
            'welcome_message': ''
        }


def update_branding_settings(agency_id: str, branding: Dict) -> bool:
    """Update branding settings."""
    try:
        supabase = get_supabase_client()

        # Upsert to agency_settings table
        result = supabase.table('agency_settings').upsert({
            'agency_id': agency_id,
            'branding': branding,
            'updated_at': datetime.now().isoformat()
        }).execute()

        return bool(result.data)
    except Exception as e:
        st.error(f"Error updating branding: {e}")
        return False


def upload_logo(agency_id: str, logo_file) -> Optional[str]:
    """Upload logo file (placeholder)."""
    # TODO: Implement real file upload to storage
    st.info("Logo upload to be implemented with Supabase Storage")
    return None


def show_commission_rules(agency_id: str):
    """Commission rules configuration section."""

    st.subheader("💰 Commission Rules")
    st.write("Configure commission split rules for your agency.")

    # Load current rules
    commission_rules = load_commission_rules(agency_id)

    # Default splits section
    st.write("### Default Commission Splits")
    st.write("Set the default commission split percentages for different transaction types.")

    with st.form("default_splits_form"):
        col1, col2, col3 = st.columns(3)

        with col1:
            new_business_split = st.number_input(
                "New Business Split (%)",
                min_value=0.0,
                max_value=100.0,
                value=commission_rules.get('default_splits', {}).get('new_business', 50.0),
                step=5.0,
                help="Percentage of premium paid to agent for new business"
            )

        with col2:
            renewal_split = st.number_input(
                "Renewal Split (%)",
                min_value=0.0,
                max_value=100.0,
                value=commission_rules.get('default_splits', {}).get('renewal', 40.0),
                step=5.0,
                help="Percentage of premium paid to agent for renewals"
            )

        with col3:
            service_split = st.number_input(
                "Service/Endorsement Split (%)",
                min_value=0.0,
                max_value=100.0,
                value=commission_rules.get('default_splits', {}).get('service', 30.0),
                step=5.0,
                help="Percentage of premium paid to agent for service work"
            )

        st.divider()

        submit_defaults = st.form_submit_button("💾 Save Default Splits", use_container_width=True)

        if submit_defaults:
            new_rules = {
                **commission_rules,
                'default_splits': {
                    'new_business': new_business_split,
                    'renewal': renewal_split,
                    'service': service_split
                }
            }

            if save_commission_rules(agency_id, new_rules):
                st.success("✅ Default commission splits saved!")
                st.rerun()
            else:
                st.error("❌ Failed to save commission splits")

    st.divider()

    # Carrier overrides section
    st.write("### Per-Carrier Overrides")
    st.write("Override commission splits for specific carriers.")

    carrier_overrides = commission_rules.get('carrier_overrides', [])

    # Show existing carrier overrides
    if carrier_overrides:
        st.write("**Current Carrier Overrides:**")

        for idx, override in enumerate(carrier_overrides):
            with st.expander(f"**{override['carrier_name']}**"):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.write(f"**New Business**: {override['new_business']}%")
                    st.write(f"**Renewal**: {override['renewal']}%")
                    st.write(f"**Service**: {override['service']}%")

                with col2:
                    if st.button("🗑️ Remove", key=f"remove_carrier_{idx}"):
                        carrier_overrides.pop(idx)
                        new_rules = {**commission_rules, 'carrier_overrides': carrier_overrides}
                        if save_commission_rules(agency_id, new_rules):
                            st.success("Carrier override removed")
                            st.rerun()
    else:
        st.info("No carrier-specific overrides configured")

    # Add new carrier override
    st.write("**Add Carrier Override:**")
    with st.form("add_carrier_override"):
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            carrier_name = st.text_input("Carrier Name", placeholder="e.g., Progressive")

        with col2:
            carrier_new = st.number_input("New Business (%)", 0.0, 100.0, 50.0, 5.0, key="carrier_new")

        with col3:
            carrier_renewal = st.number_input("Renewal (%)", 0.0, 100.0, 40.0, 5.0, key="carrier_renewal")

        with col4:
            carrier_service = st.number_input("Service (%)", 0.0, 100.0, 30.0, 5.0, key="carrier_service")

        submit_carrier = st.form_submit_button("➕ Add Carrier Override")

        if submit_carrier:
            if not carrier_name:
                st.error("Please enter a carrier name")
            else:
                new_override = {
                    'carrier_name': carrier_name,
                    'new_business': carrier_new,
                    'renewal': carrier_renewal,
                    'service': carrier_service
                }

                carrier_overrides.append(new_override)
                new_rules = {**commission_rules, 'carrier_overrides': carrier_overrides}

                if save_commission_rules(agency_id, new_rules):
                    st.success(f"✅ Added override for {carrier_name}")
                    st.rerun()
                else:
                    st.error("❌ Failed to add carrier override")

    st.divider()

    # Agent overrides section
    st.write("### Per-Agent Overrides")
    st.write("Override commission splits for specific agents.")

    # Load agents list
    agents = get_agency_agents_for_rules(agency_id)
    agent_overrides = commission_rules.get('agent_overrides', [])

    # Show existing agent overrides
    if agent_overrides:
        st.write("**Current Agent Overrides:**")

        for idx, override in enumerate(agent_overrides):
            agent_name = override.get('agent_name', 'Unknown Agent')
            with st.expander(f"**{agent_name}**"):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.write(f"**New Business**: {override['new_business']}%")
                    st.write(f"**Renewal**: {override['renewal']}%")
                    st.write(f"**Service**: {override['service']}%")

                with col2:
                    if st.button("🗑️ Remove", key=f"remove_agent_{idx}"):
                        agent_overrides.pop(idx)
                        new_rules = {**commission_rules, 'agent_overrides': agent_overrides}
                        if save_commission_rules(agency_id, new_rules):
                            st.success("Agent override removed")
                            st.rerun()
    else:
        st.info("No agent-specific overrides configured")

    # Add new agent override
    if agents:
        st.write("**Add Agent Override:**")
        with st.form("add_agent_override"):
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                selected_agent = st.selectbox(
                    "Select Agent",
                    options=agents,
                    format_func=lambda x: x['name']
                )

            with col2:
                agent_new = st.number_input("New Business (%)", 0.0, 100.0, 50.0, 5.0, key="agent_new")

            with col3:
                agent_renewal = st.number_input("Renewal (%)", 0.0, 100.0, 40.0, 5.0, key="agent_renewal")

            with col4:
                agent_service = st.number_input("Service (%)", 0.0, 100.0, 30.0, 5.0, key="agent_service")

            submit_agent = st.form_submit_button("➕ Add Agent Override")

            if submit_agent and selected_agent:
                new_override = {
                    'agent_id': selected_agent['id'],
                    'agent_name': selected_agent['name'],
                    'new_business': agent_new,
                    'renewal': agent_renewal,
                    'service': agent_service
                }

                agent_overrides.append(new_override)
                new_rules = {**commission_rules, 'agent_overrides': agent_overrides}

                if save_commission_rules(agency_id, new_rules):
                    st.success(f"✅ Added override for {selected_agent['name']}")
                    st.rerun()
                else:
                    st.error("❌ Failed to add agent override")
    else:
        st.info("No agents available. Add agents in Team Management first.")


@st.cache_data(ttl=300)  # Cache for 5 minutes
def load_commission_rules(agency_id: str) -> Dict:
    """Load commission rules for an agency."""
    try:
        supabase = get_supabase_client()

        result = supabase.table('agencies')\
            .select('commission_rules')\
            .eq('id', agency_id)\
            .execute()

        if result.data and len(result.data) > 0:
            rules = result.data[0].get('commission_rules')
            if rules:
                return rules

        # Return default structure
        return {
            'default_splits': {
                'new_business': 50.0,
                'renewal': 40.0,
                'service': 30.0
            },
            'carrier_overrides': [],
            'agent_overrides': []
        }
    except Exception as e:
        st.error(f"Error loading commission rules: {e}")
        return {
            'default_splits': {
                'new_business': 50.0,
                'renewal': 40.0,
                'service': 30.0
            },
            'carrier_overrides': [],
            'agent_overrides': []
        }


def save_commission_rules(agency_id: str, rules: Dict) -> bool:
    """Save commission rules to database."""
    try:
        supabase = get_supabase_client()

        result = supabase.table('agencies')\
            .update({
                'commission_rules': rules,
                'updated_at': datetime.now().isoformat()
            })\
            .eq('id', agency_id)\
            .execute()

        return bool(result.data)
    except Exception as e:
        st.error(f"Error saving commission rules: {e}")
        return False


def get_agency_agents_for_rules(agency_id: str) -> list:
    """Get list of agents for commission override selection."""
    try:
        supabase = get_supabase_client()

        result = supabase.table('agents')\
            .select('id, name')\
            .eq('agency_id', agency_id)\
            .eq('is_active', True)\
            .execute()

        if result.data:
            return result.data
        return []
    except Exception as e:
        return []


# Main execution
if __name__ == "__main__":
    show_agency_settings()
