# MAIN BRANCH RECONCILIATION ANALYSIS

**Date**: November 29, 2025
**Purpose**: Understand main branch reconciliation to adapt for multi-agent agency platform
**Analyst**: Claude Code (Explore Agent)

---

## Executive Summary

The main branch implements a **solo agent commission tracker** with a sophisticated reconciliation system that matches carrier statement transactions against existing policies in the database. The system uses fuzzy matching algorithms, handles transaction creation, and generates `-STMT-` reconciliation entries to track payments.

## 1. COMPLETE RECONCILIATION WORKFLOW

### 1.1 High-Level Flow

```
1. Upload CSV/Excel carrier statement
2. Map columns from statement to system fields
3. Parse and validate transaction rows
4. Match transactions against existing policies
5. Review matched/unmatched/create new
6. Import: Create new policies + Generate -STMT- entries
7. Update balances and reconciliation status
```

### 1.2 Detailed Step-by-Step Process

#### Step 1: File Upload (Lines 11062-11129)
- **Location**: `commission_app.py` lines 11040-11129
- **Supported formats**: CSV, Excel (.xlsx, .xls)
- **File size limit**: 200 MB
- **Processing**: Uses pandas to parse files
- **Validation**: Checks for empty files, detects total rows

```python
# File parsing logic
if uploaded_file.name.endswith('.csv'):
    df = pd.read_csv(uploaded_file, on_bad_lines='warn')
else:
    df = pd.read_excel(uploaded_file, engine='openpyxl')
```

#### Step 2: Column Mapping (Lines 11136-11199)
- **Location**: `commission_app.py` lines 11136+
- **Storage**: `user_reconciliation_mappings` table in database
- **Key system fields mapped**:
  - `Customer` (Required)
  - `Policy Number` (Required)
  - `Effective Date` (Required)
  - `Agent Paid Amount (STMT)` (Required - primary payment amount)
  - `Agency Comm Received (STMT)` (Optional - for audit)
  - `Transaction Type` (Optional)
  - `Policy Type` (Optional)
  - `Carrier Name` (Optional)
  - Additional fields from statement

**Column Mapping Module**: `user_reconciliation_mappings_db.py`
- Stores mappings per user in database
- Allows save/load/delete of mapping presets
- Supports both column names and numeric indices

#### Step 3: Transaction Parsing (Lines 3097-3520)
- **Location**: `match_statement_transactions()` function, lines 2851-3610
- **Process**:
  1. Remove duplicate rows based on Customer + Policy + Amount + Date
  2. Skip rows containing "total", "subtotal", etc.
  3. Extract values from mapped columns (handles both column names and indices)
  4. Skip empty rows (no customer AND no policy AND amount=0)
  5. Build statement transaction objects

**Data Structure** (match_result):
```python
{
    'row_index': idx,
    'customer': str,
    'policy_number': str,
    'effective_date': str (YYYY-MM-DD),
    'amount': float,  # Agent Paid Amount (primary)
    'agency_amount': float,  # Agency Comm Received (audit)
    'statement_data': dict  # Full row data
}
```

#### Step 4: Matching Algorithm (Lines 3453-3560)
**Location**: `match_statement_transactions()` function

**Matching Strategy (in priority order)**:

1. **Policy + Date Match** (100% confidence)
   - Key: `{policy_number}_{effective_date}`
   - Exact match on policy number AND effective date
   - Highest priority, automatic match

2. **Customer + Policy + Amount Match** (90% confidence)
   - Uses fuzzy customer matching
   - Verifies policy number matches
   - Checks amount within 5% tolerance
   - Match type: `{match_type} + Policy + Amount`

3. **Customer + Policy Match** (95% confidence)
   - Uses fuzzy customer matching
   - Verifies policy number
   - No amount check needed
   - Match type: `{match_type} + Policy`

4. **Unmatched** (needs manual review)
   - Customer found but no matching transaction
   - Added to unmatched list with potential customers

**Customer Matching Logic** (Lines 2546-2639):
- **Function**: `find_potential_customer_matches()`
- **Strategies**:
  - Exact match (100)
  - Reversed name match "Last, First" → "First Last" (98)
  - Normalized business name match (95)
  - First word match (90)
  - Contains match (85)
  - Normalized contains (83)
  - Reverse contains (80)
  - Starts with (75)
  - All words match any order (88)
  - Most words match (82)

**Balance Calculation for Matching** (Lines 2686-2850):
- **Function**: `calculate_transaction_balances()`
- **Logic**:
  ```
  Credit = Total Agent Comm (amount owed)
  Debit = Sum of Agent Paid Amount (STMT) from -STMT- entries
  Balance = Credit - Debit
  ```
- **Scope**: Past 18 months of transactions
- **Filter**: Only transactions with commission data

#### Step 5: Review Interface (Lines 3612-4810)
**Location**: `show_import_results()` function

**Three Categories**:

1. **Matched Transactions**
   - Shows transaction details
   - Displays confidence score and match type
   - Allows "unmatch" to move back to unmatched
   - Preview shows DB balance vs statement amount

2. **Unmatched Transactions**
   - Requires manual review
   - Options:
     - Select existing customer/transaction
     - Create new transaction
     - Specify transaction type (NEW/RWL)
     - Set policy term
     - Choose client (existing or new)
   - Can create offset NEW transaction for RWL/CAN

3. **Can Create New**
   - Transactions marked for automatic creation
   - Shows customer, policy, date, amount
   - Option to create offset NEW entries
   - Checkbox to include/exclude from import

#### Step 6: Import Execution (Lines 4880-5244)
**Location**: Import button handler in `show_import_results()`

**Process**:

**6A. Create Missing Transactions** (Lines 4906-5080):
- Generate unique Transaction ID with suffix: `{base_id}-IMPORT-{YYYYMMDD}`
- Apply transaction type mapping
- Apply policy type mapping
- Match or create Client ID
- Populate all mapped fields EXCEPT financial estimates
- Create base transaction with placeholder `Total Agent Comm`
- Optionally create offset NEW transaction ($0 commission)
- Add to matched list for reconciliation

**Transaction Creation Data Structure**:
```python
new_trans = {
    'Transaction ID': '{7-char}-IMPORT-{YYYYMMDD}',
    'Customer': str (matched name),
    'Policy Number': str,
    'Effective Date': date,
    'Transaction Type': str (mapped),
    'Policy Term': int (12, 6, etc.),
    'Total Agent Comm': float (statement amount as placeholder),
    'NOTES': 'Created from statement import {batch_id}...',
    'Client ID': uuid (if available),
    # + other mapped fields
}
```

**6B. Create Reconciliation Entries** (Lines 5082-5145):
- For EVERY matched transaction (including newly created)
- Generate reconciliation Transaction ID: `{base_id}-STMT-{YYYYMMDD}`
- Copy ALL fields from matched transaction
- Remove financial estimate fields (Premium Sold, Gross Comm %, etc.)
- Override with reconciliation-specific values:

**-STMT- Entry Data Structure**:
```python
recon_entry = {
    # Copied from matched transaction:
    'Transaction ID': '{7-char}-STMT-{YYYYMMDD}',
    'Client ID': str,
    'Customer': str,
    'Policy Number': str,
    'Effective Date': date,
    'Transaction Type': str,
    'Carrier Name': str,
    'Policy Type': str,
    'X-DATE': date,
    # ... other fields from original ...

    # Reconciliation-specific overrides:
    'Agency Comm Received (STMT)': float,  # From statement
    'Agent Paid Amount (STMT)': float,  # From statement (PRIMARY)
    'STMT DATE': date,
    'reconciliation_status': 'reconciled',
    'reconciliation_id': batch_id,
    'is_reconciliation_entry': True,
    'NOTES': 'Import batch {batch_id} | Matched to: {original_txn_id}'
}
```

**6C. Batch Database Operations** (Lines 5147-5176):
- All inserts queued in `all_operations` list
- Executed sequentially (not truly atomic, but fail-fast)
- Success: All operations complete
- Failure: No changes made (operations haven't started yet)
- Logs audit trail for bulk insert

**6D. Cleanup** (Lines 5178-5244):
- Clear import session state
- Clear cache
- Show success message with counts
- Auto-refresh after 4 seconds

## 2. MULTI-AGENT ADAPTATION REQUIREMENTS

### 2.1 Database Changes Needed

#### Add agent_id to policies table:
```sql
ALTER TABLE policies ADD COLUMN agent_id UUID REFERENCES agents(id);
ALTER TABLE policies ADD COLUMN agency_id UUID REFERENCES agencies(id);
CREATE INDEX idx_policies_agent_id ON policies(agent_id);
CREATE INDEX idx_policies_agency_id ON policies(agency_id);
```

### 2.2 Key Code Changes

#### Session State Keys
```python
# BEFORE (main branch):
def get_user_session_key(key):
    user_email = st.session_state.get('user_email', 'default')
    return f"{user_email}_{key}"

# AFTER (agency-platform):
def get_user_session_key(key):
    agent_id = st.session_state.get('agent_id')
    agency_id = st.session_state.get('agency_id')
    return f"{agency_id}_{agent_id}_{key}"
```

#### Insert Operations
```python
# Add agent_id and agency_id to all new records
agent_id = st.session_state.get('agent_id')
agency_id = st.session_state.get('agency_id')

new_trans = {
    'Transaction ID': new_trans_id,
    'Customer': final_customer_name,
    'agent_id': agent_id,        # NEW
    'agency_id': agency_id,      # NEW
    # ... other fields ...
}
```

### 2.3 Assignment Logic

**RECOMMENDATION**: Assign during import
- Add agent selector in import UI
- Default to logged-in agent
- Admin can assign to any agent

```python
# In import UI:
if user_role in ['owner', 'admin']:
    agents = load_agency_agents()
    selected_agent = st.selectbox("Assign to Agent", agents)
else:
    selected_agent = agent_id  # Auto-assign to self

st.session_state['import_agent_id'] = selected_agent
```

### 2.4 RLS Policy Updates

```sql
CREATE POLICY "Agency users see appropriate policies" ON policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE user_id = auth.uid()
            AND agency_id = policies.agency_id
        )
        AND (
            -- Owners/Admins see all agency data
            EXISTS (
                SELECT 1 FROM agents
                WHERE user_id = auth.uid()
                AND role IN ('owner', 'admin')
            )
            OR
            -- Agents see only their assigned policies
            agent_id IN (
                SELECT id FROM agents WHERE user_id = auth.uid()
            )
        )
    );
```

## 3. IMPLEMENTATION CHECKLIST

### Phase 1: Database Migration
- [ ] Add agent_id column to policies table
- [ ] Add agency_id column to policies table
- [ ] Add indexes on agent_id and agency_id
- [ ] Update RLS policies

### Phase 2: Core Logic Updates
- [ ] Update session state key generation
- [ ] Add agent/agency filtering to data loads
- [ ] Add agent_id/agency_id to all inserts
- [ ] Update matching to filter by agency

### Phase 3: UI Enhancements
- [ ] Add agent selector to import UI
- [ ] Add admin filter toggle
- [ ] Update displays to show agent info
- [ ] Add bulk assignment tool

### Phase 4: Testing
- [ ] Test with multiple agents
- [ ] Test cross-agent scenarios
- [ ] Test admin vs agent views
- [ ] Test assignment logic

## 4. CRITICAL SUCCESS FACTORS

1. **Data Isolation**: Ensure agents only see their own data
2. **Admin Flexibility**: Admins can see and manage all data
3. **Assignment Clarity**: Clear rules for transaction assignment
4. **Performance**: Maintain fast queries with proper indexing
5. **Agency-wide Matching**: Match across agency, assign to importing agent

---

## CONCLUSION

The main branch reconciliation system is well-designed for solo agents. The core matching logic can be mirrored directly. Primary changes needed:

1. Add agent_id and agency_id to all data
2. Filter queries based on user role and agent
3. Add assignment logic during import
4. Update RLS policies for agent-level security

The transition to multi-agent is straightforward given the existing user isolation structure.
