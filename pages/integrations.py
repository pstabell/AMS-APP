"""
Integrations Page
Shows available integrations with AMS, CRM, and accounting systems.
Display integration logos and connection status.

Created: 2025-10-09
Branch: agency-platform
"""

import streamlit as st
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.agency_utils import (
    is_agency_account,
    get_agency_config,
    get_agency_integrations,
    is_demo_mode
)

st.set_page_config(
    page_title="Integrations",
    page_icon="🔗",
    layout="wide"
)


def get_user_email():
    """Get current user email from session state."""
    return st.session_state.get('user_email', 'demo@example.com')


# Available integrations catalog
INTEGRATIONS_CATALOG = {
    "Agency Management Systems (AMS)": [
        {
            "name": "Applied Epic",
            "description": "Industry-leading AMS for insurance agencies",
            "category": "AMS",
            "setup_fee": "$5,000",
            "features": ["Policy sync", "Client data", "Commission export", "Real-time updates"],
            "popular": True
        },
        {
            "name": "AMS360",
            "description": "Vertafore's comprehensive agency management system",
            "category": "AMS",
            "setup_fee": "$5,000",
            "features": ["Policy management", "Client portal", "Document storage"],
            "popular": True
        },
        {
            "name": "Hawksoft",
            "description": "Cloud-based AMS for independent agencies",
            "category": "AMS",
            "setup_fee": "$5,000",
            "features": ["Policy tracking", "Client management", "Reporting"],
            "popular": True
        },
        {
            "name": "EZLynx",
            "description": "All-in-one agency management and rating",
            "category": "AMS",
            "setup_fee": "$4,000",
            "features": ["Comparative rating", "Policy management", "Client portal"],
            "popular": True
        },
        {
            "name": "QQCatalyst",
            "description": "Modern cloud-based AMS solution",
            "category": "AMS",
            "setup_fee": "$3,500",
            "features": ["Policy administration", "Workflow automation", "Mobile access"],
            "popular": False
        },
        {
            "name": "Jenesis",
            "description": "Feature-rich AMS for growing agencies",
            "category": "AMS",
            "setup_fee": "$3,000",
            "features": ["Contact management", "Policy tracking", "Commission tracking"],
            "popular": False
        }
    ],
    "Accounting & Finance": [
        {
            "name": "QuickBooks Online",
            "description": "Industry-standard accounting software",
            "category": "Accounting",
            "setup_fee": "$3,000",
            "features": ["Commission export", "Payment tracking", "Financial reports", "Bank reconciliation"],
            "popular": True
        },
        {
            "name": "Xero",
            "description": "Cloud accounting software",
            "category": "Accounting",
            "setup_fee": "$2,500",
            "features": ["Invoice generation", "Expense tracking", "Financial reporting"],
            "popular": False
        },
        {
            "name": "FreshBooks",
            "description": "Simple accounting for small businesses",
            "category": "Accounting",
            "setup_fee": "$2,000",
            "features": ["Invoicing", "Expense tracking", "Time tracking"],
            "popular": False
        }
    ],
    "CRM & Marketing": [
        {
            "name": "Salesforce",
            "description": "World's #1 CRM platform",
            "category": "CRM",
            "setup_fee": "$3,500",
            "features": ["Lead management", "Client tracking", "Sales pipeline", "Custom workflows"],
            "popular": True
        },
        {
            "name": "HubSpot",
            "description": "All-in-one CRM and marketing platform",
            "category": "CRM",
            "setup_fee": "$3,000",
            "features": ["Contact management", "Email marketing", "Lead scoring"],
            "popular": True
        },
        {
            "name": "Constant Contact",
            "description": "Email marketing and automation",
            "category": "Marketing",
            "setup_fee": "$1,500",
            "features": ["Email campaigns", "Contact lists", "Analytics"],
            "popular": False
        },
        {
            "name": "Mailchimp",
            "description": "Email marketing platform",
            "category": "Marketing",
            "setup_fee": "$1,500",
            "features": ["Email automation", "Audience segmentation", "Campaign analytics"],
            "popular": False
        }
    ],
    "Data & Analytics": [
        {
            "name": "Google Sheets",
            "description": "Cloud spreadsheet with real-time sync",
            "category": "Data",
            "setup_fee": "$1,000",
            "features": ["Real-time sync", "Automated exports", "Custom formulas"],
            "popular": True
        },
        {
            "name": "Excel 365",
            "description": "Microsoft Excel with cloud sync",
            "category": "Data",
            "setup_fee": "$1,000",
            "features": ["Automated exports", "Pivot tables", "Data analysis"],
            "popular": False
        },
        {
            "name": "Zapier",
            "description": "Connect to 5,000+ apps",
            "category": "Automation",
            "setup_fee": "$1,500",
            "features": ["Custom workflows", "Multi-app automation", "Webhooks"],
            "popular": True
        }
    ],
    "Custom & Enterprise": [
        {
            "name": "REST API Access",
            "description": "Build custom integrations with our API",
            "category": "API",
            "setup_fee": "$5,000+",
            "features": ["Full API access", "Custom endpoints", "Webhook support", "Developer docs"],
            "popular": False
        },
        {
            "name": "Custom Integration",
            "description": "We'll build any integration you need",
            "category": "Custom",
            "setup_fee": "Contact us",
            "features": ["Custom development", "Dedicated support", "Maintenance included"],
            "popular": False
        }
    ]
}


def show_integration_card(integration, is_connected=False):
    """Display a single integration card."""

    # Determine if this is a popular integration
    badge = "⭐ POPULAR" if integration.get('popular') else ""

    # Connection status
    status_icon = "✅" if is_connected else "⚪"
    status_text = "Connected" if is_connected else "Not Connected"

    with st.container():
        st.markdown(f"### {status_icon} {integration['name']} {badge}")
        st.caption(integration['description'])

        col1, col2 = st.columns([3, 1])

        with col1:
            st.markdown(f"**Setup Fee:** {integration['setup_fee']}")

            if integration.get('features'):
                st.markdown("**Features:**")
                for feature in integration['features'][:3]:  # Show first 3
                    st.markdown(f"• {feature}")

        with col2:
            if is_connected:
                st.success(status_text)
                if st.button("⚙️ Configure", key=f"config_{integration['name']}", use_container_width=True):
                    st.info("Configuration panel coming soon")
            else:
                if st.button("🔗 Connect", key=f"connect_{integration['name']}", use_container_width=True):
                    st.info(f"Contact us to set up {integration['name']} integration\n\nSetup fee: {integration['setup_fee']}\nImplementation: 2-4 weeks")

        st.divider()


def show_integrations_page():
    """Main integrations page."""

    st.title("🔗 Integrations")

    user_email = get_user_email()

    # Header section
    st.markdown("""
    ### Connect Your Favorite Tools

    Seamlessly integrate your commission tracker with the systems you already use.
    Our team will build and maintain custom integrations tailored to your workflow.
    """)

    # Get connected integrations
    connected_integrations = []
    if is_demo_mode():
        # Show some as connected in demo mode
        connected_integrations = ["Applied Epic", "QuickBooks Online", "HubSpot"]
        st.info("📊 **DEMO MODE** - Viewing sample integration connections")
    elif is_agency_account(user_email):
        agency_config = get_agency_config(user_email)
        if agency_config:
            agency_integrations = get_agency_integrations(agency_config.get('id'))
            connected_integrations = [i['integration_type'] for i in agency_integrations]

    # Summary stats
    total_integrations = sum(len(integrations) for integrations in INTEGRATIONS_CATALOG.values())
    connected_count = len(connected_integrations)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("🔗 Total Integrations", total_integrations)

    with col2:
        st.metric("✅ Connected", connected_count)

    with col3:
        available = total_integrations - connected_count
        st.metric("⚪ Available", available)

    st.divider()

    # Filter options
    col1, col2 = st.columns([2, 1])

    with col1:
        search = st.text_input("🔍 Search integrations", placeholder="Search by name or category...")

    with col2:
        filter_option = st.selectbox(
            "Filter by",
            ["All", "Connected Only", "Popular Only", "Not Connected"]
        )

    st.divider()

    # Display integrations by category
    for category, integrations in INTEGRATIONS_CATALOG.items():

        # Filter integrations based on search and filter
        filtered_integrations = integrations

        if search:
            filtered_integrations = [
                i for i in filtered_integrations
                if search.lower() in i['name'].lower() or search.lower() in i['description'].lower()
            ]

        if filter_option == "Connected Only":
            filtered_integrations = [i for i in filtered_integrations if i['name'] in connected_integrations]
        elif filter_option == "Not Connected":
            filtered_integrations = [i for i in filtered_integrations if i['name'] not in connected_integrations]
        elif filter_option == "Popular Only":
            filtered_integrations = [i for i in filtered_integrations if i.get('popular')]

        # Only show category if it has integrations after filtering
        if filtered_integrations:
            st.subheader(f"📂 {category}")

            for integration in filtered_integrations:
                is_connected = integration['name'] in connected_integrations
                show_integration_card(integration, is_connected)

    st.divider()

    # Call to action
    st.info("""
    ### 💡 Don't See Your System?

    We can build custom integrations for any system with an API!

    **What We've Integrated:**
    - Legacy AMS systems
    - Custom carrier portals
    - Proprietary accounting software
    - Internal agency tools

    **Contact us** to discuss your specific integration needs.
    Setup fees start at $2,500 depending on complexity.
    """)

    # Pricing info
    with st.expander("💰 Integration Pricing"):
        st.markdown("""
        ### Setup Fees

        Integration setup fees cover:
        - Custom development work
        - API authentication setup
        - Data mapping and transformation
        - Testing and quality assurance
        - Documentation and training
        - 90 days of integration support

        **Pricing Tiers:**
        - **Quick Connect** ($1,000-$1,500): Standard integrations (Google Sheets, Excel)
        - **Professional** ($2,500-$3,500): Popular CRM/Marketing tools
        - **Enterprise** ($4,000-$5,000): Complex AMS integrations
        - **Custom** (Contact us): Proprietary or legacy systems

        **No Monthly Fees** - Once set up, integrations are included in your subscription!
        """)


# Main execution
if __name__ == "__main__":
    show_integrations_page()
