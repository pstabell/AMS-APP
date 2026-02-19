# Agency Platform - Administrator Guide

**Version:** 1.0 (Phase 1)
**Last Updated:** November 29, 2025
**For:** Developers, DevOps, System Administrators

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [Key Components](#key-components)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)
7. [Adding New Features](#adding-new-features)
8. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐
│   Streamlit UI  │ ← User Interface (commission_app.py)
└────────┬────────┘
         │
         ├─── pages/
         │    ├── agency_dashboard.py
         │    ├── team_management.py
         │    ├── agency_reconciliation.py
         │    └── agency_settings.py
         │
         ├─── utils/
         │    ├── agency_auth_helpers.py
         │    ├── agency_reconciliation_helpers.py
         │    ├── agency_statement_matcher.py
         │    ├── agent_assignment_logic.py
         │    └── integration_manager.py
         │
         └─── Supabase Backend
              ├── PostgreSQL Database
              ├── Row Level Security (RLS)
              ├── Supabase Auth
              └── Real-time subscriptions (Phase 2)
```

### Technology Stack

- **Frontend:** Streamlit 1.28+ (Python web framework)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Charts:** Plotly Express
- **Data Processing:** Pandas
- **Authentication:** Supabase Auth (JWT-based)
- **Hosting:** Streamlit Cloud / Docker / VPS

### Multi-Tenancy Model

**Hierarchy:**
```
User (Supabase Auth)
  └─> Agency (1 user can own 1 agency)
       └─> Agents (1 agency has many agents)
            └─> Policies (1 agent has many policies)
```

**Isolation:**
- All queries filter by `agency_id` and `agent_id`
- Row Level Security (RLS) enforced at database level
- No cross-agency data leakage possible

---

## Database Schema

### Core Tables

#### `users` (Supabase Auth)
```sql
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- Managed by Supabase Auth
- Do not modify directly
- User ID is UUID (not email)

#### `agencies`
```sql
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID REFERENCES auth.users(id) NOT NULL,
    agency_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    license_number TEXT,
    tax_id TEXT,
    subscription_plan TEXT DEFAULT 'agency_basic',
    commission_rules JSONB DEFAULT '{"default_splits": {"new_business": 50.0, "renewal": 40.0, "service": 30.0}, "carrier_overrides": [], "agent_overrides": []}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_owner ON agencies(owner_user_id);
```

**commission_rules JSONB structure:**
```json
{
  "default_splits": {
    "new_business": 50.0,
    "renewal": 40.0,
    "service": 30.0
  },
  "carrier_overrides": [
    {
      "carrier_name": "Progressive",
      "new_business": 15.0,
      "renewal": 12.0,
      "service": 10.0
    }
  ],
  "agent_overrides": [
    {
      "agent_id": "uuid-here",
      "agent_name": "John Smith",
      "new_business": 60.0,
      "renewal": 50.0,
      "service": 40.0
    }
  ]
}
```

#### `agents`
```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'Agent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, user_id)
);

CREATE INDEX idx_agents_agency ON agents(agency_id);
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_active ON agents(agency_id, is_active);
```

**Roles:**
- `Agent` - Standard producer
- `Senior Agent` - Experienced producer
- `Agency Manager` - Management role
- `Owner` - Agency owner

#### `policies`
```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    agent_id UUID REFERENCES agents(id),
    agency_id UUID REFERENCES agencies(id),

    "Transaction ID" TEXT UNIQUE NOT NULL,
    "Policy Number" TEXT NOT NULL,
    "Customer Name" TEXT NOT NULL,
    "Effective Date" DATE NOT NULL,
    "Premium Sold" NUMERIC(10,2),
    "Total Agent Comm" NUMERIC(10,2),
    "Carrier Name" TEXT,
    "Policy Type" TEXT,
    "Transaction Type" TEXT,

    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_user ON policies(user_id);
CREATE INDEX idx_policies_agent ON policies(agent_id);
CREATE INDEX idx_policies_agency ON policies(agency_id);
CREATE INDEX idx_policies_transaction_id ON policies("Transaction ID");
CREATE INDEX idx_policies_policy_number ON policies("Policy Number");
CREATE INDEX idx_policies_effective_date ON policies("Effective Date");
CREATE INDEX idx_policies_agency_agent ON policies(agency_id, agent_id);
```

**Special Transaction IDs:**
- `-STMT-` suffix: Reconciliation entry (from carrier statement)
- `-VOID-` suffix: Voided transaction
- `-ADJ-` suffix: Manual adjustment

#### `agency_settings`
```sql
CREATE TABLE agency_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) NOT NULL UNIQUE,

    -- Notification preferences
    notifications JSONB DEFAULT '{}',

    -- Branding
    branding JSONB DEFAULT '{"logo_url": "", "primary_color": "#1f77b4", "secondary_color": "#ff7f0e"}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agency_settings_agency ON agency_settings(agency_id);
```

#### `agency_integrations`
```sql
CREATE TABLE agency_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) NOT NULL,
    integration_type TEXT NOT NULL, -- 'ams', 'crm', 'accounting'
    integration_name TEXT NOT NULL, -- 'Applied Epic', 'Salesforce', 'QuickBooks'

    credentials JSONB DEFAULT '{}', -- API keys, tokens (should be encrypted)
    sync_settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, integration_name)
);

CREATE INDEX idx_integrations_agency ON agency_integrations(agency_id);
```

### Row Level Security (RLS) Policies

**Enable RLS on all tables:**
```sql
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_integrations ENABLE ROW LEVEL SECURITY;
```

**Example RLS Policy for `agencies`:**
```sql
-- Agency owners can see their own agency
CREATE POLICY "Agency owners can view their agency"
ON agencies FOR SELECT
USING (owner_user_id = auth.uid());

-- Agency owners can update their own agency
CREATE POLICY "Agency owners can update their agency"
ON agencies FOR UPDATE
USING (owner_user_id = auth.uid());
```

**Example RLS Policy for `agents`:**
```sql
-- Agency owners can view all their agents
CREATE POLICY "Agency owners can view their agents"
ON agents FOR SELECT
USING (
    agency_id IN (
        SELECT id FROM agencies WHERE owner_user_id = auth.uid()
    )
);

-- Individual agents can view their own record
CREATE POLICY "Agents can view themselves"
ON agents FOR SELECT
USING (user_id = auth.uid());
```

**Example RLS Policy for `policies`:**
```sql
-- Agency owners can view all policies in their agency
CREATE POLICY "Agency owners can view agency policies"
ON policies FOR SELECT
USING (
    agency_id IN (
        SELECT id FROM agencies WHERE owner_user_id = auth.uid()
    )
);

-- Individual agents can view their own policies
CREATE POLICY "Agents can view their policies"
ON policies FOR SELECT
USING (user_id = auth.uid());

-- Agency owners can insert policies for their agents
CREATE POLICY "Agency owners can insert agency policies"
ON policies FOR INSERT
WITH CHECK (
    agency_id IN (
        SELECT id FROM agencies WHERE owner_user_id = auth.uid()
    )
);
```

---

## Authentication & Authorization

### User Roles

| Role | Access Level | Features |
|------|--------------|----------|
| **Solo Agent** | Own data only | Dashboard, Reconciliation, Policies |
| **Agency Owner** | All agents in agency | Everything above + Agency Dashboard, Team Management, Agency Reconciliation, Agency Settings |
| **Agent (in agency)** | Own data only | Same as solo agent (Phase 2) |

### Session State Variables

```python
st.session_state = {
    'user_id': 'uuid-from-supabase',        # Primary identifier
    'user_email': 'user@example.com',       # For display
    'is_agency_owner': True/False,          # Access control
    'agency_id': 'uuid-of-agency',          # Multi-tenant filter
    'agency_name': 'Demo Agency',           # For display
}
```

### Authentication Flow

1. User enters email/password
2. Supabase Auth validates credentials
3. Returns JWT + user object with UUID
4. App calls `check_if_agency_owner(user_id)` to determine role
5. Sets session state variables
6. Redirects to appropriate dashboard

**Key Functions:**

`utils/agency_auth_helpers.py`:
```python
def check_if_agency_owner(user_id: str) -> Tuple[bool, Optional[str], Optional[str]]
def get_agency_config(agency_id: str) -> Dict
def is_agency_account(user_email: str) -> bool
```

---

## Key Components

### Agency Dashboard (`pages/agency_dashboard.py`)

**Purpose:** Display agent rankings and performance metrics

**Key Functions:**
- `get_agency_performance_data(agency_id, year)` - Load agents + metrics
- `get_monthly_trends(agency_id, months)` - Time series data
- `get_carrier_breakdown(agency_id, year)` - Commission by carrier

**Caching:** All data functions use `@st.cache_data(ttl=300)` for 5-minute cache

**Performance Notes:**
- Loads all policies for agency in one query
- Filters out `-STMT-`/`-VOID-`/`-ADJ-` for performance metrics
- Groups by agent_id for rankings

### Team Management (`pages/team_management.py`)

**Purpose:** CRUD interface for managing agents

**Key Functions:**
- `get_agency_agents(agency_id)` - Load agents with stats
- `add_new_agent(agency_id, name, email, role)` - Create agent
- `update_agent(agent_id, updates)` - Update agent
- `deactivate_agent(agent_id)` - Soft delete

**Data Integrity:**
- Email must be unique across system
- Agent records require both user_id and agency_id
- Deactivation sets `is_active = FALSE` (not DELETE)

### Agency Reconciliation (`pages/agency_reconciliation.py`)

**Purpose:** 4-step wizard to import carrier statements with agent attribution

**Workflow:**
1. **Upload** - Parse CSV/Excel, store in `st.session_state.uploaded_df`
2. **Map** - Column mapping UI, store in `st.session_state.column_mapping`
3. **Settings** - Choose assignment mode, store in `st.session_state.assignment_mode`
4. **Review** - Match transactions, assign agents, import

**Matching Logic** (`utils/agency_statement_matcher.py`):
```python
def process_statement_with_agent_attribution(df, mapping, agency_id, mode, agent_id)
    → Returns: (matched, unmatched, to_create)
```

**Matching Algorithms:**
- Policy number exact match (100% confidence)
- Customer name fuzzy match using SequenceMatcher (60-99% confidence)
- Agency-wide matching (searches across all agents in agency)

**Assignment Modes:**
- `assign_all` - Bulk assign to one agent
- `auto_assign` - Auto-match by policy ownership
- `manual` - User assigns in Step 4

### Agency Settings (`pages/agency_settings.py`)

**Purpose:** Configure agency profile, subscription, notifications, branding, commission rules

**5 Tabs:**
1. Agency Profile - Basic info (name, email, phone, license, tax ID)
2. Subscription & Plan - View current plan (read-only in Phase 1)
3. Notifications - Email/in-app notification preferences
4. Branding - Logo, colors, tagline (logo upload Phase 2)
5. Commission Rules - Default splits + carrier/agent overrides

**Commission Rules Storage:**
- Stored in `agencies.commission_rules` (JSONB column)
- Three-tier priority: Agent Override > Carrier Override > Default
- Applied during reconciliation (Phase 2 feature)

---

## Deployment

### Environment Variables

Create a `.env` file:

```bash
# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Demo mode
DEMO_MODE=false

# Optional: Logging
LOG_LEVEL=INFO
```

### Local Development

1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd AMS-APP
   git checkout agency-platform
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run locally:**
   ```bash
   streamlit run commission_app.py --server.port 8503
   ```

6. **Access:**
   - Open browser to `http://localhost:8503`
   - Log in as agency owner

### Production Deployment

**Option 1: Streamlit Cloud**
1. Push code to GitHub
2. Connect Streamlit Cloud to repository
3. Set environment variables in Streamlit Cloud settings
4. Deploy branch: `agency-platform`

**Option 2: Docker**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "commission_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

Build and run:
```bash
docker build -t agency-platform .
docker run -p 8501:8501 --env-file .env agency-platform
```

**Option 3: VPS (Ubuntu/Nginx)**
1. Install Python 3.11+
2. Clone repository
3. Set up systemd service
4. Configure Nginx reverse proxy
5. Enable HTTPS with Let's Encrypt

### Database Migrations

**Initial Setup:**
1. Run SQL scripts in Supabase SQL Editor:
   - `create_tables.sql` - Create all tables
   - `create_rls_policies.sql` - Enable RLS and policies
   - `create_indexes.sql` - Performance indexes

**Future Migrations:**
- Use Supabase Migrations (supabase migration new <name>)
- Version control all migrations
- Test in staging before production

---

## Troubleshooting

### Common Issues

**Issue: "RLS prevents query from returning rows"**
**Cause:** Row Level Security policy blocking access
**Solution:**
1. Check user has correct `user_id` in session
2. Verify agency ownership: `SELECT * FROM agencies WHERE owner_user_id = '<user_id>'`
3. Review RLS policies in Supabase dashboard
4. Temporarily disable RLS for debugging: `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;`

**Issue: "Duplicate key error on policies insert"**
**Cause:** Transaction ID already exists
**Solution:**
1. Transaction IDs must be unique
2. Append timestamp or random suffix for -STMT- entries
3. Check for duplicate imports

**Issue: "Agent names show as 'Unknown Agent'"**
**Cause:** agent_id in policies table doesn't match agents table
**Solution:**
1. Run query to find orphaned records:
   ```sql
   SELECT p.agent_id, COUNT(*)
   FROM policies p
   LEFT JOIN agents a ON p.agent_id = a.id
   WHERE a.id IS NULL
   GROUP BY p.agent_id;
   ```
2. Fix data: Update agent_id or delete orphaned records

**Issue: "Charts not loading / Performance slow"**
**Cause:** Large dataset, no caching, missing indexes
**Solution:**
1. Verify caching is enabled: `@st.cache_data(ttl=300)`
2. Add database indexes on filtered columns
3. Limit queries with date ranges
4. Use `EXPLAIN ANALYZE` to check query performance

### Logging

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In your functions
logger.debug(f"Loading agency data for {agency_id}")
logger.error(f"Failed to save: {e}")
```

View logs:
- **Streamlit Cloud:** Check Logs tab in dashboard
- **Docker:** `docker logs <container-id>`
- **Local:** Terminal output

### Database Debugging

**Check agency ownership:**
```sql
SELECT a.agency_name, a.owner_user_id, u.email
FROM agencies a
JOIN auth.users u ON a.owner_user_id = u.id;
```

**Check agent-agency relationships:**
```sql
SELECT ag.agency_name, a.name AS agent_name, a.email, a.is_active
FROM agents a
JOIN agencies ag ON a.agency_id = ag.id
ORDER BY ag.agency_name, a.name;
```

**Check policy distribution:**
```sql
SELECT
    ag.agency_name,
    a.name AS agent_name,
    COUNT(*) AS policy_count,
    SUM(p."Premium Sold") AS total_premium
FROM policies p
JOIN agents a ON p.agent_id = a.id
JOIN agencies ag ON a.agency_id = ag.id
GROUP BY ag.agency_name, a.name
ORDER BY ag.agency_name, total_premium DESC;
```

---

## Adding New Features

### Adding a New Page

1. Create file: `pages/new_feature.py`
2. Follow template:
```python
import streamlit as st
from utils.agency_auth_helpers import check_if_agency_owner

st.set_page_config(page_title="New Feature", page_icon="🆕", layout="wide")

def show_new_feature():
    """Main function for new feature."""

    # Check access
    if not st.session_state.get('is_agency_owner', False):
        st.warning("This page is only for agency owners")
        return

    agency_id = st.session_state.get('agency_id')

    st.title("🆕 New Feature")
    # Your implementation here

if __name__ == "__main__":
    show_new_feature()
```

3. Add route to `commission_app.py`:
```python
elif page == "🆕 New Feature":
    from pages.new_feature import show_new_feature
    show_new_feature()
```

4. Add to navigation (if for agency owners only):
```python
if is_agency_owner:
    navigation_pages.insert(5, "🆕 New Feature")
```

### Adding a New Database Table

1. Create migration SQL:
```sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) NOT NULL,
    -- your columns here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_new_table_agency ON new_table(agency_id);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view"
ON new_table FOR SELECT
USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_user_id = auth.uid())
);
```

2. Create utility functions in `utils/`:
```python
def get_new_table_data(agency_id: str):
    supabase = get_supabase_client()
    result = supabase.table('new_table')\
        .select('*')\
        .eq('agency_id', agency_id)\
        .execute()
    return result.data
```

3. Add to UI page

### Adding Caching

Use Streamlit's `@st.cache_data` decorator:
```python
@st.cache_data(ttl=300)  # Cache for 5 minutes
def expensive_query(agency_id: str):
    # Your query here
    return data
```

**When to cache:**
- Database queries that run on every page load
- Data that doesn't change frequently
- Expensive calculations

**When NOT to cache:**
- User-specific data that changes often
- Write operations (INSERT/UPDATE/DELETE)

---

## Performance Optimization

### Database Query Optimization

**Good Query:**
```python
# Single query with JOIN
result = supabase.table('policies')\
    .select('*, agents(name)')\
    .eq('agency_id', agency_id)\
    .gte('Effective Date', '2025-01-01')\
    .execute()
```

**Bad Query:**
```python
# N+1 queries
policies = get_all_policies(agency_id)
for policy in policies:
    agent = get_agent(policy['agent_id'])  # BAD: Query in loop
```

**Use Indexes:**
```sql
-- Add composite index for common query pattern
CREATE INDEX idx_policies_agency_date
ON policies(agency_id, "Effective Date");
```

### Streamlit Performance

**Use `st.cache_data`:**
```python
@st.cache_data(ttl=300)
def load_data():
    # Expensive operation
    return data
```

**Avoid Recomputation:**
```python
# Good: Compute once, cache in session state
if 'processed_data' not in st.session_state:
    st.session_state.processed_data = process_data()

# Bad: Recompute on every interaction
data = process_data()
```

**Limit Data Transferred:**
```python
# Good: Only select needed columns
.select('id, name, total_commission')

# Bad: Select all columns
.select('*')
```

### Monitoring

**Key Metrics to Track:**
- Page load time (< 2 seconds)
- Database query time (< 500ms)
- Cache hit rate (> 80%)
- API response time (< 1 second)

**Tools:**
- Supabase Dashboard - Query performance
- Streamlit Profiler - `streamlit run app.py --profiler`
- PostgreSQL `EXPLAIN ANALYZE` - Query plans

---

## Security Best Practices

1. **Never disable RLS in production**
2. **Always filter by agency_id and user_id**
3. **Validate all user input**
4. **Use parameterized queries** (Supabase does this automatically)
5. **Encrypt sensitive data** (API keys, credentials)
6. **Use environment variables** for secrets
7. **Implement rate limiting** for API calls
8. **Log security events** (failed logins, unauthorized access attempts)
9. **Regular security audits** of RLS policies
10. **Keep dependencies updated** (run `pip list --outdated`)

---

## Appendix

### Useful SQL Queries

**Find all agencies and agent count:**
```sql
SELECT
    a.agency_name,
    COUNT(ag.id) AS agent_count,
    COUNT(CASE WHEN ag.is_active THEN 1 END) AS active_agents
FROM agencies a
LEFT JOIN agents ag ON a.id = ag.agency_id
GROUP BY a.id, a.agency_name;
```

**Find policies without agent assignment:**
```sql
SELECT *
FROM policies
WHERE agent_id IS NULL
    AND agency_id IS NOT NULL;
```

**Performance by agency:**
```sql
SELECT
    ag.agency_name,
    COUNT(p.id) AS policies,
    SUM(p."Premium Sold") AS total_premium,
    SUM(p."Total Agent Comm") AS total_commission
FROM agencies ag
LEFT JOIN policies p ON ag.id = p.agency_id
WHERE p."Effective Date" >= '2025-01-01'
GROUP BY ag.id, ag.agency_name
ORDER BY total_premium DESC;
```

---

**Admin Guide Version:** 1.0
**Last Updated:** November 29, 2025
**Platform Version:** Phase 1 (98% Complete)
**Branch:** agency-platform
