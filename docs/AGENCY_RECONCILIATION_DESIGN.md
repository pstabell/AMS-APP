# Agency Multi-Agent Reconciliation Design

**Date**: November 29, 2025
**Task**: Task 2.1 - Multi-Agent Reconciliation Flow
**Status**: Design Phase

---

## Design Goals

1. **Mirror main branch quality**: Maintain the sophisticated matching logic
2. **Add agent attribution**: Every transaction assigned to specific agent
3. **Agency-wide visibility**: Admins see all, agents see their own
4. **Flexible assignment**: Assign during import with bulk reassignment option
5. **Performance**: Fast queries with proper filtering and indexing

---

## Architecture Overview

### Data Model Changes

```
policies table (existing + new fields):
├── Transaction ID (existing)
├── Customer (existing)
├── Policy Number (existing)
├── ... all existing fields ...
├── agent_id (NEW) → references agents.id
└── agency_id (NEW) → references agencies.id
```

### User Role Matrix

| Role | Can See | Can Import | Can Assign To |
|------|---------|------------|---------------|
| Agency Owner | All agency data | Yes | Any agent |
| Admin | All agency data | Yes | Any agent |
| Manager | All agency data | Yes | Any agent |
| Agent | Own data only | Yes | Self only |

---

## Workflow Design

### 1. Carrier Statement Import (Agency Version)

```
┌─────────────────────────────────────────┐
│  Agency Owner/Admin uploads statement   │
│  "Progressive January 2025 Statement"   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 1: Select Agent Assignment        │
│  ┌─────────────────────────────────┐   │
│  │ ○ Assign all to specific agent  │   │
│  │   [Agent Dropdown: Jane Doe    ▼]   │
│  │                                      │
│  │ ○ Assign individually (after map)   │
│  │                                      │
│  │ ○ Auto-assign based on existing     │
│  │   policy ownership                   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 2: Map Columns                    │
│  (Same as main branch)                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 3: Match Transactions             │
│  - Match against ALL agency policies    │
│  - Inherit agent_id from matched policy │
│  - New transactions: use selected agent │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 4: Review & Adjust                │
│  Matched:   [✓] John Smith - Policy 123 │
│             Agent: Jane Doe              │
│  Unmatched: [ ] Mary Jones - Policy 456  │
│             Assign to: [Agent Dropdown]  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Step 5: Import                         │
│  - Create transactions with agent_id    │
│  - Create -STMT- entries with agent_id  │
│  - Update agency dashboard               │
└─────────────────────────────────────────┘
```

### 2. Assignment Logic Decision Tree

```
For each statement transaction:

1. Is there a matched policy in database?
   ├─ YES: Use agent_id from matched policy
   │       └─ Create -STMT- entry with that agent_id
   │
   └─ NO: This is a new transaction to create
       │
       ├─ Did admin select "Assign all to specific agent"?
       │  └─ YES: Use selected agent_id
       │
       ├─ Did admin select "Auto-assign"?
       │  └─ YES: Try to match customer name to existing
       │           customer's policies → use that agent_id
       │
       └─ Otherwise: Prompt for agent selection per transaction
```

### 3. Data Filtering Strategy

#### For Data Loading (Matching Phase)
```python
# AGENCY-WIDE MATCHING (recommended)
# Load ALL agency policies for matching
# This allows cross-agent customer recognition

def load_policies_for_matching():
    agency_id = st.session_state.get('agency_id')

    # Admin/Owner loading: Get all agency policies
    policies = supabase.table('policies')\
        .select('*')\
        .eq('agency_id', agency_id)\
        .execute()

    return policies.data

# Result: Better matching, shared customers recognized
```

#### For Data Display (Agent View)
```python
# ROLE-BASED FILTERING
# Agents see only their data, admins see all

def load_policies_for_display():
    agency_id = st.session_state.get('agency_id')
    user_role = st.session_state.get('user_role')
    agent_id = st.session_state.get('agent_id')

    query = supabase.table('policies')\
        .select('*')\
        .eq('agency_id', agency_id)

    # Filter by agent if not admin/owner/manager
    if user_role == 'agent':
        query = query.eq('agent_id', agent_id)

    return query.execute().data
```

---

## UI Component Design

### Component 1: Agent Assignment Selector

**Location**: Top of import wizard (before column mapping)

**For Agency Owners/Admins**:
```python
st.subheader("📋 Statement Import - Agent Assignment")

assignment_mode = st.radio(
    "How should transactions be assigned?",
    options=[
        "assign_all",
        "assign_individual",
        "auto_assign"
    ],
    format_func=lambda x: {
        "assign_all": "Assign all transactions to one agent",
        "assign_individual": "I'll assign each transaction individually",
        "auto_assign": "Auto-assign based on existing policy ownership"
    }[x]
)

if assignment_mode == "assign_all":
    agents = get_agency_agents(agency_id)
    selected_agent_id = st.selectbox(
        "Select Agent",
        options=[a['id'] for a in agents],
        format_func=lambda x: next(a['name'] for a in agents if a['id'] == x)
    )
    st.session_state['import_agent_id'] = selected_agent_id

elif assignment_mode == "auto_assign":
    st.info("Transactions will be assigned based on existing policy ownership. New transactions will require manual assignment.")
    st.session_state['import_agent_id'] = None  # Will determine later

else:  # assign_individual
    st.info("You'll assign each transaction during the review step.")
    st.session_state['import_agent_id'] = None
```

**For Agents** (simplified):
```python
# Auto-assign to self, no choice
agent_id = st.session_state.get('agent_id')
agent_name = st.session_state.get('agent_name')

st.info(f"All transactions will be assigned to: **{agent_name}**")
st.session_state['import_agent_id'] = agent_id
```

### Component 2: Transaction Review with Agent Info

**Enhanced Review Table**:
```python
# In matched transactions table:
columns = [
    'Customer',
    'Policy Number',
    'Amount',
    'Matched To',
    'Agent',  # NEW COLUMN
    'Confidence'
]

# Show agent name for each match
for match in matched_transactions:
    agent_name = get_agent_name(match['matched_agent_id'])
    st.write(f"Agent: {agent_name}")
```

**Enhanced Unmatched with Assignment**:
```python
# In unmatched transactions:
for idx, unmatch in enumerate(unmatched_transactions):
    with st.expander(f"{unmatch['customer']} - {unmatch['policy_number']}"):
        # ... existing fields ...

        # NEW: Agent assignment
        if user_role in ['owner', 'admin', 'manager']:
            selected_agent = st.selectbox(
                "Assign to Agent",
                options=[a['id'] for a in agents],
                format_func=lambda x: get_agent_name(x),
                key=f"assign_agent_{idx}"
            )
            unmatch['agent_id'] = selected_agent
        else:
            # Agent role: auto-assign to self
            unmatch['agent_id'] = agent_id
            st.info(f"Will be assigned to: {agent_name}")
```

### Component 3: Agency Reconciliation Dashboard

**Location**: New page accessible from navigation

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  Agency Reconciliation Dashboard                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Summary Metrics (All Agents)                   │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │ Total    │ Total    │ Reconcil │ Pending  │ │
│  │ Policies │ Expected │ -ed      │ Balance  │ │
│  │ 1,234    │ $125,000 │ $98,000  │ $27,000  │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
│                                                  │
│  Agent Breakdown                                │
│  ┌─────────────────────────────────────────┐   │
│  │ Agent       Policies  Expected  Reconcil│   │
│  │ Jane Doe    456       $45,000   $38,000 │   │
│  │ John Smith  389       $40,000   $35,000 │   │
│  │ Bob Wilson  389       $40,000   $25,000 │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Recent Imports                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Date       Carrier      Agent     Count │   │
│  │ 11/29/2025 Progressive  Jane Doe  23    │   │
│  │ 11/28/2025 State Farm   John S.   45    │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [📥 Import New Statement] [📊 View Reports]   │
└─────────────────────────────────────────────────┘
```

---

## Code Structure

### New Files to Create

1. **`pages/agency_reconciliation.py`**
   - Main reconciliation page for agency platform
   - Mirrors `commission_app.py` reconciliation section
   - Adds agent assignment logic

2. **`utils/agency_reconciliation_helpers.py`**
   - Helper functions for agency-specific reconciliation
   - `assign_agent_to_transactions()`
   - `get_agency_reconciliation_summary()`
   - `bulk_reassign_transactions()`

3. **`utils/agent_assignment_logic.py`**
   - Core assignment algorithms
   - `auto_assign_by_policy_ownership()`
   - `auto_assign_by_customer_history()`
   - `validate_agent_assignment()`

### Modified Files

1. **`commission_app.py`**
   - Add route for Agency Reconciliation page
   - Add navigation link (agency owners only)

2. **Database migration script** (when connecting to real Supabase)
   - Add agent_id and agency_id columns
   - Create indexes
   - Update RLS policies

---

## Database Queries

### Query 1: Load Policies for Matching (Agency-Wide)
```python
def load_agency_policies_for_matching(agency_id: str):
    """Load all agency policies for matching (cross-agent)."""
    supabase = get_supabase_client()

    result = supabase.table('policies')\
        .select('*')\
        .eq('agency_id', agency_id)\
        .order('Effective Date', desc=True)\
        .execute()

    return result.data
```

### Query 2: Load Agent's Policies for Display
```python
def load_agent_policies(agent_id: str):
    """Load specific agent's policies."""
    supabase = get_supabase_client()

    result = supabase.table('policies')\
        .select('*')\
        .eq('agent_id', agent_id)\
        .order('Effective Date', desc=True)\
        .execute()

    return result.data
```

### Query 3: Get Agency Reconciliation Summary
```python
def get_agency_reconciliation_summary(agency_id: str):
    """Get reconciliation summary by agent."""
    supabase = get_supabase_client()

    # Get all transactions with agent info
    result = supabase.table('policies')\
        .select('agent_id, "Total Agent Comm", "Agent Paid Amount (STMT)", "Transaction ID"')\
        .eq('agency_id', agency_id)\
        .execute()

    # Group by agent_id and calculate
    # - Total expected commission (sum of Total Agent Comm where not -STMT-)
    # - Total reconciled (sum of Agent Paid Amount where -STMT-)
    # - Outstanding balance (expected - reconciled)

    return summary_by_agent
```

### Query 4: Insert Transactions with Agent Attribution
```python
def insert_transaction_with_agent(transaction_data: dict, agent_id: str, agency_id: str):
    """Insert transaction with agent and agency attribution."""
    supabase = get_supabase_client()

    # Add agent and agency
    transaction_data['agent_id'] = agent_id
    transaction_data['agency_id'] = agency_id
    transaction_data['user_id'] = get_user_id()  # For RLS

    result = supabase.table('policies').insert(transaction_data).execute()
    return result.data
```

---

## Implementation Plan

### Phase 1: Database & Core Logic (Days 1-2)
- [ ] Create database migration script (schema only, for documentation)
- [ ] Create `utils/agency_reconciliation_helpers.py`
- [ ] Create `utils/agent_assignment_logic.py`
- [ ] Implement core assignment functions

### Phase 2: UI Components (Days 3-4)
- [ ] Create `pages/agency_reconciliation.py` structure
- [ ] Build agent assignment selector
- [ ] Build enhanced review UI with agent info
- [ ] Add route to commission_app.py

### Phase 3: Matching & Import Logic (Days 5-6)
- [ ] Adapt main branch matching logic for agency context
- [ ] Implement agent-attributed -STMT- creation
- [ ] Add bulk operations with agent_id
- [ ] Test import workflow

### Phase 4: Dashboard (Day 7)
- [ ] Build agency reconciliation dashboard
- [ ] Add summary metrics by agent
- [ ] Add recent imports log
- [ ] Test end-to-end

---

## Testing Strategy

### Test Scenarios

1. **Single Agent Import**
   - Admin imports statement, assigns all to Agent A
   - Verify all transactions have Agent A's agent_id
   - Verify -STMT- entries created correctly

2. **Multi-Agent Statement**
   - Import statement with transactions for multiple agents
   - Use auto-assign based on policy ownership
   - Verify correct agent attribution

3. **Mixed Matched/Unmatched**
   - Import with some matched, some new transactions
   - Verify matched inherit agent_id from existing policy
   - Verify new transactions get assigned agent_id

4. **Agent Self-Import**
   - Agent (non-admin) imports their own statement
   - Verify all transactions auto-assigned to self
   - Verify no access to assign to other agents

5. **Cross-Agent Customer**
   - Customer has policies with both Agent A and Agent B
   - Import statement transaction for that customer
   - Verify matching logic handles correctly

### Test Data Structure
```python
test_agents = [
    {'id': 'agent-001', 'name': 'Jane Doe', 'role': 'agent'},
    {'id': 'agent-002', 'name': 'John Smith', 'role': 'agent'},
]

test_policies = [
    {
        'Transaction ID': 'ABC1234',
        'Customer': 'John Customer',
        'Policy Number': 'POL-001',
        'agent_id': 'agent-001',  # Jane's policy
        'Total Agent Comm': 500
    },
    {
        'Transaction ID': 'DEF5678',
        'Customer': 'Mary Client',
        'Policy Number': 'POL-002',
        'agent_id': 'agent-002',  # John's policy
        'Total Agent Comm': 750
    }
]

test_statement_rows = [
    {
        'Customer': 'John Customer',
        'Policy': 'POL-001',
        'Amount': 250  # Should match to Jane's policy
    },
    {
        'Customer': 'New Customer',
        'Policy': 'POL-NEW',
        'Amount': 100  # Needs assignment
    }
]
```

---

## Edge Cases & Solutions

### Edge Case 1: Orphaned Transactions
**Scenario**: Existing transactions from before agent_id was added
**Solution**: Migration assigns to agency owner, provide bulk reassignment tool

### Edge Case 2: Agent Deactivated
**Scenario**: Agent has historical transactions but is now inactive
**Solution**: Keep agent_id, show as "Inactive Agent" in displays

### Edge Case 3: Bulk Reassignment
**Scenario**: Transactions assigned to wrong agent
**Solution**: Admin tool to filter and bulk reassign by criteria

### Edge Case 4: Split Commission
**Scenario**: Two agents share commission on one policy
**Solution**: Phase 2 feature - for now, assign to primary agent

---

## Success Criteria

- [ ] Agency owner can import statements and assign to agents
- [ ] Matching works across all agency policies
- [ ] Transactions correctly attributed to agents
- [ ] -STMT- entries created with agent_id
- [ ] Agents see only their own data
- [ ] Admins see all agency data
- [ ] Dashboard shows agency-wide reconciliation status
- [ ] Performance remains fast (<2 seconds)

---

## Next Steps

1. **Review this design** - Ensure alignment with goals
2. **Create helper modules** - Build core functions
3. **Build agency reconciliation page** - Implement UI
4. **Test thoroughly** - All scenarios covered
5. **Document** - Update user guide

---

**Design Status**: ✅ Complete - Ready for Implementation
