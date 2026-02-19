# Agency Platform - User Guide

**Version:** 1.0 (Phase 1)
**Last Updated:** November 29, 2025
**For:** Insurance Agency Owners

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Agency Dashboard](#agency-dashboard)
3. [Team Management](#team-management)
4. [Agency Reconciliation](#agency-reconciliation)
5. [Agency Settings](#agency-settings)
6. [Frequently Asked Questions](#frequently-asked-questions)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Who is the Agency Platform For?

The Agency Platform is designed for **insurance agency owners** who manage multiple agents. If you have 2 or more agents writing business, this platform helps you:

- Track each agent's performance in real-time
- See agent rankings by premium volume
- Reconcile carrier statements across all agents
- Manage commission rules and splits
- Add and manage your team

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Agency owner account (contact support to upgrade from solo agent)

### First-Time Login

1. Navigate to the application URL
2. Enter your email and password
3. If you're an agency owner, you'll see special menu items:
   - 🏢 Agency Dashboard
   - 👥 Team Management
   - 💳 Agency Reconciliation
   - ⚙️ Agency Settings
   - 🔗 Integrations

**Note:** Solo agents do not see these menu items - they're exclusive to agency owners.

---

## Agency Dashboard

The Agency Dashboard is your command center for tracking team performance.

### Top Metrics

At the top of the dashboard, you see 4 key metrics:

| Metric | Description |
|--------|-------------|
| **👥 Active Agents** | Number of agents who have written at least 1 policy this year |
| **💰 Total Premium YTD** | Combined premium volume across all agents |
| **💵 Total Commission YTD** | Total commissions earned by the agency |
| **📋 Total Policies** | Number of active policies across all agents |

### Year Selector

Use the year dropdown to view historical performance:
- Current year (default)
- Previous year (year -1)
- Two years ago (year -2)

Click the **🔄 Refresh** button to reload data from the database.

### Agent Rankings Table

The heart of the dashboard - see how your agents stack up!

**Columns:**
- **🏅 Rank** - Ranked by premium volume (highest first)
- **👤 Agent Name** - Full name of the agent
- **📋 Policies** - Number of policies written this year
- **💰 Premium YTD** - Total premium sold
- **💵 Commission YTD** - Total commission earned

**How Rankings Work:**
- Agents are sorted by Premium YTD (highest to lowest)
- Rank 1 = top producer
- Updates automatically when new policies are added
- Only includes agents with at least 1 policy

### Performance Charts

**Premium by Agent (Bar Chart)**
- Shows top 10 agents by premium volume
- Hover over bars to see exact amounts
- Color intensity indicates volume

**Commission by Agent (Bar Chart)**
- Shows top 10 agents by commission earned
- Green color scale
- Interactive tooltips

**Policy Distribution (Pie Chart)**
- Shows each agent's share of total policies
- Top 10 agents only
- Percentage breakdown

**Monthly Premium Trends (Line Chart)**
- Shows last 6 months of premium
- Top 5 agents only
- Track growth and seasonality

**Commission by Carrier (Pie Chart)**
- Shows which carriers drive the most revenue
- Top 10 carriers
- Helps identify key carrier relationships

---

## Team Management

Manage your agents - add new team members, edit roles, and view performance.

### Team Summary

At the top, see aggregate metrics:
- **Total Agents** - All agents (active + inactive)
- **Active Agents** - Currently writing business
- **Total Policies** - Across all agents
- **Total Commission** - YTD commissions

### Agent Cards

Each agent has an expandable card showing:

**Header:**
- Agent name
- Email address
- Role (Agent, Senior Agent, Manager, etc.)
- Status badge (Active/Inactive)

**Details (when expanded):**
- Policy count
- YTD commission
- Join date
- Edit and Deactivate buttons

### Adding a New Agent

1. Click **➕ Add New Agent** button
2. Fill out the form:
   - **Full Name** (required)
   - **Email** (required, must be unique)
   - **Role** (select from dropdown)
3. Click **Add Agent**
4. The agent is created immediately
5. They'll receive an email with login instructions (if email is configured)

**Agent Roles:**
- **Agent** - Standard producer
- **Senior Agent** - Experienced producer
- **Agency Manager** - Management role
- **Owner** - Agency owner (you)

### Editing an Agent

1. Expand the agent's card
2. Click **✏️ Edit**
3. Modify the form:
   - Update name
   - Change email
   - Change role
4. Click **Save Changes**

**Note:** You cannot change an agent's user_id - this is permanent.

### Deactivating an Agent

If an agent leaves your agency:

1. Expand the agent's card
2. Click **🗑️ Deactivate**
3. Confirm the action
4. The agent's status changes to **Inactive**
5. They no longer appear in rankings or charts
6. Their historical data is preserved

**Important:** Deactivation is reversible. Contact support to reactivate.

---

## Agency Reconciliation

Import carrier statements and automatically assign transactions to the correct agents.

### Overview

Agency Reconciliation is a **4-step wizard** that:
1. Uploads your carrier statement (CSV or Excel)
2. Maps columns to database fields
3. Lets you choose how to assign transactions to agents
4. Reviews and imports with agent attribution

### Step 1: Upload Statement

**Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

**How to Upload:**
1. Click **Upload Statement File** or drag-and-drop
2. Wait for file to process
3. See preview of first 10 rows
4. Click **Continue to Mapping →**

**File Requirements:**
- Must contain customer name, policy number, and amount columns
- Dates should be in MM/DD/YYYY or YYYY-MM-DD format
- Amounts should be numeric ($ symbol ok)
- Max file size: 10 MB

### Step 2: Map Columns

The system attempts to auto-detect columns based on headers. Verify the mapping:

**Required Columns:**
- **Customer Name** - Policy holder name
- **Policy Number** - Unique policy identifier
- **Transaction Amount** - Premium or commission amount
- **Effective Date** - Policy effective date

**Optional Columns:**
- **Carrier Name** - Insurance carrier
- **Policy Type** - Auto, Home, Life, etc.
- **Transaction Type** - New, Renewal, Endorsement
- **Agent Name** - If pre-assigned in statement

**Mapping Process:**
1. Review each dropdown
2. Select the correct column from your file
3. Required fields must be mapped
4. Click **Continue to Settings →**

**Tips:**
- Green checkmarks indicate required fields are mapped
- If a column isn't in your file, leave it as "Not mapped"
- You can preview data to verify mapping

### Step 3: Agent Assignment Settings

Choose how to assign transactions to agents:

**Assignment Modes:**

**1. Assign All to One Agent**
- Use for single-agent carrier statements
- All transactions go to the selected agent
- Best for: exclusive carrier relationships

**2. Auto-Assign by Policy Ownership**
- System matches transactions to existing policies
- If policy exists, inherits the agent from that policy
- Unmatched transactions need manual assignment
- Best for: multi-agent carriers

**3. Manual Assignment**
- You assign each transaction individually in Step 4
- Complete control over attribution
- Best for: new agencies with no historical data

**How to Use:**
1. Select assignment mode
2. If "Assign All", choose agent from dropdown
3. Click **Continue to Review →**

### Step 4: Review & Import

Review matched and unmatched transactions before importing.

**Summary Metrics:**
- **✅ Matched** - Transactions matched to existing policies
- **❓ Unmatched** - New transactions (no existing policy)
- **➕ To Create** - Total new records to create
- **⚠️ Needs Assignment** - Transactions without an agent

**Matched Transactions Tab:**
- Shows transactions matched to existing policies
- Will create -STMT- entries (reconciliation records)
- Agent automatically inherited from matched policy
- View: Customer, Policy, Amount, Matched To, Agent, Confidence

**Unmatched Transactions Tab:**
- Shows new transactions (no existing policy)
- Each transaction has an agent assignment dropdown
- You MUST assign an agent before import
- Expanders show full transaction details

**Agent Assignment:**
1. Expand an unmatched transaction
2. Select agent from dropdown
3. Assignment saves automatically
4. Status changes to "✅ Assigned"

**Importing:**
1. Ensure all transactions have agents (⚠️ Needs Assignment = 0)
2. Click **📥 Import All Transactions**
3. Wait for import to complete
4. Success message shows count of imported records
5. Session resets to Step 1

**What Gets Created:**
- **Matched transactions** → -STMT- entries with agent_id
- **Unmatched transactions** → New policy records with agent_id
- All records tagged with agency_id

**Re-processing:**
- Click **🔄 Re-process Matches** to re-run matching
- Click **🔁 Start Over** to restart from Step 1
- Click **← Back to Mapping** to fix column mapping

---

## Agency Settings

Customize your agency profile, subscription, notifications, branding, and commission rules.

### Tab 1: Agency Profile

Update your agency information.

**Fields:**
- **Agency Name** (required)
- **Contact Email** (required)
- **Phone Number**
- **Website URL**
- **Address** (Street, City, State, ZIP)
- **License Number** (required)
- **Tax ID / EIN** (required)

**How to Update:**
1. Edit fields in the form
2. Click **💾 Save Agency Profile**
3. Success message confirms save
4. Changes appear immediately

### Tab 2: Subscription & Plan

View your current subscription.

**Displays:**
- Current plan (Agency Plan, Enterprise Plan, etc.)
- Monthly cost
- Features included
- Billing cycle
- Next billing date

**Actions:**
- **Upgrade Plan** - Contact sales for plan upgrades
- **Cancel Subscription** - Cancel anytime (data retained for 30 days)

**Note:** This is read-only in Phase 1. Contact support for billing changes.

### Tab 3: Notifications

Configure email and in-app notifications.

**Email Notifications:**
- ☑️ New policy created
- ☑️ Statement reconciliation complete
- ☑️ Monthly performance report
- ☑️ Agent milestones reached

**In-App Notifications:**
- ☑️ Agent activity updates
- ☑️ System alerts

**Digest Settings:**
- **Frequency** - Daily, Weekly, Monthly
- **Time** - 8:00 AM, 12:00 PM, 5:00 PM, 8:00 PM

**How to Update:**
1. Check/uncheck notification types
2. Select digest frequency and time
3. Click **💾 Save Preferences**

### Tab 4: Branding

Customize your agency's look and feel.

**Logo Upload:**
- Drag and drop your agency logo
- Supported: PNG, JPG, SVG
- Max size: 2 MB
- Recommended: 500x500px

**Color Theme:**
- **Primary Color** - Main brand color (hex code)
- **Secondary Color** - Accent color (hex code)
- **Background Color** - Page background (hex code)

**Custom Text:**
- **Tagline** - Short phrase (e.g., "Insuring What Matters")
- **Welcome Message** - Dashboard greeting

**Preview:**
- Live preview shows your branding
- See before you save

**How to Update:**
1. Upload logo or enter color codes
2. Add custom text
3. Review preview
4. Click **💾 Save Branding**

**Note:** Logo upload requires Supabase Storage (Phase 2)

### Tab 5: Commission Rules

Configure commission split rules for your agency.

**Default Commission Splits:**

Set default percentages for each transaction type:
- **New Business Split (%)** - Commission for new policies (default: 50%)
- **Renewal Split (%)** - Commission for renewals (default: 40%)
- **Service/Endorsement Split (%)** - Commission for service work (default: 30%)

**How to Update:**
1. Enter percentages (0-100)
2. Click **💾 Save Default Splits**

**Per-Carrier Overrides:**

Override commission rates for specific carriers.

**Example:** Progressive pays 15%, Geico pays 12%, State Farm pays 18%

**How to Add:**
1. Scroll to "Add Carrier Override"
2. Enter carrier name (e.g., "Progressive")
3. Enter split percentages for New Business, Renewal, Service
4. Click **➕ Add Carrier Override**

**Managing Overrides:**
- Click carrier name to expand
- View current splits
- Click **🗑️ Remove** to delete override

**Per-Agent Overrides:**

Override commission rates for specific agents.

**Example:** Your top producer gets 60% instead of 50% on new business

**How to Add:**
1. Scroll to "Add Agent Override"
2. Select agent from dropdown
3. Enter split percentages
4. Click **➕ Add Agent Override**

**Managing Overrides:**
- Click agent name to expand
- View current splits
- Click **🗑️ Remove** to delete override

**How Rules are Applied:**

When a transaction is processed:
1. Check for **Per-Agent Override** (highest priority)
2. If none, check for **Per-Carrier Override**
3. If none, use **Default Splits**

**Priority Order:** Agent > Carrier > Default

---

## Frequently Asked Questions

### General

**Q: What's the difference between an agent and an agency owner?**
A: Agents see only their own data. Agency owners see all agents in their agency + special management features (Team Management, Agency Reconciliation, Agency Settings, Agent Rankings).

**Q: Can agents see other agents' data?**
A: No. Row Level Security ensures agents only see their own policies and commissions.

**Q: How many agents can I add?**
A: Depends on your plan. Contact sales for agency plan details.

**Q: Is my data secure?**
A: Yes. We use enterprise-grade security with Row Level Security (RLS) at the database level. All data is encrypted in transit and at rest.

### Team Management

**Q: What happens when I deactivate an agent?**
A: They lose access to the platform, disappear from rankings/charts, but their historical data is preserved. You can reactivate them by contacting support.

**Q: Can I re-assign policies from one agent to another?**
A: Not in Phase 1. Contact support for bulk re-assignment.

**Q: Can agents have multiple roles?**
A: No, each agent has one role. Choose the primary role that fits best.

### Agency Reconciliation

**Q: What file formats are supported?**
A: CSV and Excel (.xlsx, .xls). Max file size: 10 MB.

**Q: What if my carrier statement doesn't have policy numbers?**
A: The system can still match by customer name using fuzzy matching. Accuracy is lower without policy numbers.

**Q: Can I import the same statement twice?**
A: Yes, but you'll create duplicate -STMT- entries. Only import each statement once.

**Q: What's a -STMT- entry?**
A: A reconciliation record that links a carrier statement transaction to an existing policy. It's how we track if commission was received.

**Q: What if I assign a transaction to the wrong agent?**
A: In Phase 1, contact support to fix. Phase 2 will have a re-assignment feature.

### Commission Rules

**Q: Do commission rules apply retroactively?**
A: No. Commission rules apply to future transactions only. Existing policies keep their original commission amounts.

**Q: Can I have different rules for different policy types?**
A: Not in Phase 1. Current rules are: Default, Per-Carrier, Per-Agent. Policy type rules coming in Phase 2.

**Q: What if I have a carrier override AND an agent override?**
A: Agent override takes priority. Priority order: Agent > Carrier > Default.

---

## Troubleshooting

### Login Issues

**Problem:** "Email or password incorrect"
**Solution:**
1. Verify email is correct (case-sensitive)
2. Check Caps Lock is off
3. Use "Forgot Password" to reset
4. Contact support if issue persists

**Problem:** "I logged in but don't see Agency Dashboard"
**Solution:** You may not be marked as an agency owner. Contact support to upgrade your account.

### Dashboard Issues

**Problem:** "No agents showing in rankings"
**Solution:**
1. Verify agents have policies in the selected year
2. Check year selector (try current year)
3. Click 🔄 Refresh to reload data
4. Ensure agents are Active (not Deactivated)

**Problem:** "Charts not loading"
**Solution:**
1. Wait 10 seconds (data may be loading)
2. Click 🔄 Refresh
3. Check browser console for errors (F12)
4. Try clearing cache and reloading

**Problem:** "Agent names show as 'Unknown Agent'"
**Solution:** Agent records may be missing from database. Contact support to fix data integrity.

### Team Management Issues

**Problem:** "Can't add new agent - email already exists"
**Solution:** Email addresses must be unique. Use a different email or contact support to recover the existing account.

**Problem:** "Added agent but they can't log in"
**Solution:**
1. Check email notifications are enabled
2. Verify email was entered correctly
3. Have agent check spam folder for welcome email
4. Contact support to resend invitation

### Reconciliation Issues

**Problem:** "File upload fails"
**Solution:**
1. Verify file is CSV or Excel format
2. Check file size is under 10 MB
3. Ensure file has headers in first row
4. Remove special characters from filename

**Problem:** "No matches found" (all transactions unmatched)
**Solution:**
1. Verify you have existing policies in database
2. Check customer names match (spelling matters)
3. Try using policy number matching
4. Use Manual Assignment mode

**Problem:** "Can't import - 'Needs Assignment' shows 5"
**Solution:** You must assign agents to all unmatched transactions. Expand each transaction in the "Unmatched" tab and select an agent.

**Problem:** "Import failed"
**Solution:**
1. Check browser console for error details (F12)
2. Verify all required fields are mapped
3. Ensure all transactions have agents assigned
4. Contact support with error message

### Settings Issues

**Problem:** "Changes not saving"
**Solution:**
1. Check for validation errors (red text)
2. Ensure all required fields are filled
3. Try again in 1 minute (may be rate limited)
4. Check browser console for errors

**Problem:** "Logo upload not working"
**Solution:** Logo upload requires Supabase Storage configuration. This feature is coming in Phase 2.

---

## Need Help?

**Support Email:** support@yourcompany.com
**Documentation:** https://docs.yourcompany.com
**Video Tutorials:** https://help.yourcompany.com/videos
**Community Forum:** https://community.yourcompany.com

**Business Hours:** Monday-Friday, 9:00 AM - 6:00 PM EST
**Response Time:** Within 24 hours

---

**User Guide Version:** 1.0
**Last Updated:** November 29, 2025
**Platform Version:** Phase 1 (98% Complete)
**Branch:** agency-platform
