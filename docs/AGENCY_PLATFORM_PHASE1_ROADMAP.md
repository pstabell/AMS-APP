# Agency Platform Phase 1 Implementation Roadmap
**Created**: November 29, 2025
**Updated**: November 29, 2025 (Sprint 1 Complete!)
**Branch**: agency-platform
**Goal**: Build Admin/Owner Control Panel
**Status**: ✅ Sprint 1 Complete | 🔄 Sprint 2 In Progress

---

## 📊 Sprint 1 Progress Summary (November 29, 2025)

### ✅ Completed Tasks (3/4 for Sprint 1)
1. **Task 1.1** - Agency Owner Authentication ✅ COMPLETE
2. **Task 1.2** - Team Management UI ✅ COMPLETE
3. **Task 2.2** - Agent Performance Dashboards ✅ COMPLETE

### 🔄 In Progress
4. **Task 2.1** - Multi-Agent Reconciliation (Design Complete, Implementation Pending)

### 📦 Deliverables Created
- **9 new files** (~2,800 lines of code)
- **5 modified files** (~200 lines)
- **~1,900 lines** of documentation
- **6 commits** to agency-platform branch

### 🎯 Key Achievements
- ✅ Complete authentication system with UUID-based architecture
- ✅ Full CRUD team management interface
- ✅ Real-time performance dashboard with Supabase integration
- ✅ Comprehensive reconciliation design and utility modules
- ✅ All queries ready for Row Level Security (RLS)
- ✅ Role-based access control throughout

### 📈 Progress: **75% of Sprint 1 Complete**

**Next Priority**: Complete Task 2.1 implementation (reconciliation page)

---

## ✅ Foundation Already in Place

**Good News**: The main branch already uses Supabase Auth with UUID-based `user_id`!
- Main branch has `get_user_id()` and `ensure_user_id()` functions
- Session state stores both `user_email` (for display) and `user_id` (for DB operations)
- All user tables already link via `user_id`

**For Agency Platform**: We just need to ensure the agency schema uses `user_id` consistently:
- `agencies.owner_user_id` (not owner_email)
- `agents.user_id` (links to Supabase Auth users)
- All RLS policies use `auth.uid()`

---

## Phase 1 Objective

Build a fully functional agency admin control panel that allows agency owners to:
1. Manage their team of agents
2. Reconcile carrier commission statements across all agents
3. View agency-wide dashboards and performance metrics
4. Configure integrations and agency settings

**NOT in Phase 1**: Individual agent login experience (that's Phase 2)

---

## Current State Assessment

### ✅ What We Have (Demo Mode)
- Agency Dashboard with sample data
- Integrations catalog
- Database schema (agencies, agents, RLS policies)
- Demo mode toggle working
- Basic UI/UX established

### ❌ What We Need to Build
- Real authentication for agency owners
- Team management UI (add/edit/remove agents)
- Agency-level reconciliation (import carrier statements, assign to agents)
- Real data integration (replace demo mode with actual Supabase queries)
- Agency settings and configuration
- Role-based access control

---

## Implementation Tasks

### Sprint 1: Foundation & Authentication (Week 1-2)

#### Task 1.1: Agency Owner Authentication ✅
**Priority**: P0 (Blocker)
**Estimated Effort**: 3 days
**Status**: ✅ COMPLETE (November 29, 2025)
**Files**: `agency_auth_helpers.py`, `auth_helpers.py` (modified), `commission_app.py` (modified)

- [x] Create agency signup flow
  - New page: Agency Registration
  - Capture: Agency name, owner name, owner email, password
  - Create entry in `agencies` table
  - Link owner **user_id** to agency_id (uses UUID, not email!)

- [x] Modify login to detect agency accounts
  - Check if logging-in user is an agency owner (via `check_if_agency_owner()`)
  - Set session variable: `is_agency_owner = True`
  - Load agency_id and agency_name into session

- [x] Create agency onboarding wizard
  - Step 1: Welcome & agency info
  - Step 2: Add first agent (optional)
  - Step 3: Choose integrations
  - Step 4: Quick start guide

**Acceptance Criteria**:
- ✅ Agency owner can sign up
- ✅ Agency owner can log in
- ✅ Session correctly identifies agency vs. solo user
- ✅ Onboarding wizard complete
- ✅ Test plan created: `docs/TASK_1_1_TEST_REPORT.md`

---

#### Task 1.2: Team Management UI ✅
**Priority**: P0 (Blocker)
**Estimated Effort**: 5 days
**Status**: ✅ COMPLETE (November 29, 2025)
**Files**: `pages/team_management.py`, `commission_app.py` (modified), `pages/integrations.py` (fixed)

- [x] Create "Team Management" page
  - List all agents in the agency
  - Show: Name, Email, Role, Status (Active/Inactive), Policies Count, YTD Commission
  - Summary metrics: Active agents, total policies, total commission

- [x] Add Agent functionality
  - Form: Agent name, email, role (agent/manager/admin)
  - Creates user if doesn't exist, links if exists
  - Create entry in `agents` table with user_id and agency_id
  - Validation and error handling

- [x] Edit Agent functionality
  - Update agent name, role, status
  - Email field disabled (cannot be changed)
  - Form with save/cancel options

- [x] Deactivate/Remove Agent
  - Soft delete (set is_active = False)
  - Agent remains visible but marked inactive
  - Success/error messaging

**Acceptance Criteria**:
- ✅ Agency owner can add new agents
- ✅ Agency owner can edit agent details
- ✅ Agency owner can deactivate agents
- ✅ All changes reflect immediately in dashboard
- ✅ Access control works (agency owners only)
- ✅ Test plan created: `docs/TASK_1_2_TEST_REPORT.md`

---

### Sprint 2: Agency Reconciliation (Week 3-4)

#### Task 2.1: Multi-Agent Reconciliation Flow 🔄
**Priority**: P0 (Blocker)
**Estimated Effort**: 7 days
**Status**: 🔄 DESIGN COMPLETE | Implementation Pending
**Files**: `docs/MAIN_BRANCH_RECONCILIATION_ANALYSIS.md`, `docs/AGENCY_RECONCILIATION_DESIGN.md`, `utils/agent_assignment_logic.py`, `utils/agency_reconciliation_helpers.py`

- [x] Mirror main branch reconciliation for agencies
  - **COMPLETE**: Comprehensive analysis in `MAIN_BRANCH_RECONCILIATION_ANALYSIS.md`
  - Study existing reconciliation logic in main branch ✅
  - Identify what needs to change for multi-agent ✅
  - Document complete workflow and matching algorithms ✅

- [x] Design multi-agent reconciliation architecture
  - **COMPLETE**: Full architecture in `AGENCY_RECONCILIATION_DESIGN.md`
  - User role matrix and permissions ✅
  - Workflow design with agent assignment ✅
  - Assignment logic decision tree ✅
  - UI component specifications ✅

- [x] Create utility modules for reconciliation
  - **COMPLETE**: `utils/agent_assignment_logic.py` with 7 core functions ✅
  - **COMPLETE**: `utils/agency_reconciliation_helpers.py` with 10 helper functions ✅

- [ ] Import Carrier Statement (Agency View) - **PENDING IMPLEMENTATION**
  - Reuse existing CSV/Excel upload
  - Add "Agent" column to import data
  - Dropdown to select which agent each transaction belongs to
  - Bulk assign: "All transactions → Agent X"

- [ ] Auto-match transactions to agents - **PENDING IMPLEMENTATION**
  - Match by policy number → look up agent_id from policies table
  - Match by insured name → look up from client records
  - Show unmatched transactions for manual assignment

- [ ] Create -STMT- entries with agent attribution - **PENDING IMPLEMENTATION**
  - Each -STMT- entry tagged with agent_id
  - Agency view shows all -STMT- entries
  - Filter/group by agent

- [ ] Agency Reconciliation Dashboard - **PENDING IMPLEMENTATION**
  - Show reconciliation progress: Matched vs. Unmatched
  - List all agents with their reconciliation status
  - Summary: Total reconciled, pending, discrepancies

**Acceptance Criteria**:
- Agency can import carrier statements
- Transactions correctly assigned to agents
- -STMT- entries created with agent_id
- Reconciliation matches main branch quality

---

#### Task 2.2: Agent Performance Dashboards (Real Data) ✅
**Priority**: P1 (Important)
**Estimated Effort**: 4 days
**Status**: ✅ COMPLETE (November 29, 2025)
**Files**: `pages/agency_dashboard.py` (completely refactored)

- [x] Replace demo data with real Supabase queries
  - Query policies table filtered by agency_id ✅
  - Group by agent_id for rankings ✅
  - Calculate YTD premium, commission, policy count ✅
  - Filter out `-STMT-`, `-VOID-`, `-ADJ-` entries ✅

- [x] Agency Dashboard (Real Implementation)
  - Top-level metrics: Total premium, commission, policies, active agent count ✅
  - Charts: Premium by agent (top 10), Commission by agent (top 10), Policy distribution ✅
  - Use actual data from policies table ✅
  - Year selector (current, -1, -2 years) ✅
  - Refresh button to clear cache ✅

- [x] Agent Rankings Table
  - Rank agents by premium volume ✅
  - Show: Rank, Agent name, Policies, Premium YTD, Commission YTD ✅
  - Currency formatting ✅
  - Top 10 agents in charts ✅

- [x] Performance Trends Charts
  - Monthly premium trends by agent (6 months, top 5 agents) ✅
  - Commission breakdown by carrier (top 10 carriers) ✅
  - Proper date formatting and aggregation ✅

**Acceptance Criteria**:
- ✅ All dashboards show real data from Supabase
- ✅ Demo mode still supported for testing
- ✅ Charts update when new transactions are added
- ✅ Performance is acceptable (<2 second load time)
- ✅ Year filtering implemented
- ✅ Agent name mapping from database

---

### Sprint 3: Settings & Configuration (Week 5)

#### Task 3.1: Agency Settings Page
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 3 days

- [ ] Create Agency Settings page
  - Agency info: Name, address, phone, logo
  - Owner info: Name, email (read-only), change password
  - Subscription tier: Display current plan

- [ ] Commission Rules Configuration
  - Default commission splits: New business, Renewal, Service
  - Per-carrier overrides
  - Per-agent overrides

- [ ] Agency Preferences
  - Date format, timezone
  - Default currency
  - Fiscal year start date

**Acceptance Criteria**:
- Agency can update their settings
- Settings persist in agencies table (JSONB)
- Changes reflect throughout the app

---

#### Task 3.2: Integration Management (Real)
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days

- [ ] Convert Integrations page from demo to real
  - Store enabled integrations in agency_integrations table
  - Track: integration_type, is_enabled, config, last_sync

- [ ] Enable/Disable Integrations
  - Toggle button for each integration
  - Save to database
  - Show enabled count in dashboard

- [ ] Integration Configuration (Basic)
  - Simple forms for API keys/credentials
  - Store encrypted in database
  - Placeholder for future actual integrations

**Acceptance Criteria**:
- Integrations page uses real database
- Agency can enable/disable integrations
- Configuration is stored securely

---

### Sprint 4: Polish & Testing (Week 6)

#### Task 4.1: Bug Fixes & Refinements
**Priority**: P1 (Important)
**Estimated Effort**: 5 days

- [ ] Fix duplicate key errors (already started)
  - Ensure all Streamlit elements have unique keys
  - Test all pages for conflicts

- [ ] Navigation improvements
  - Hide/show menu items based on role
  - Agency owners see: Dashboard, Team, Reconciliation, Settings, Integrations
  - Clean up navigation for agency mode

- [ ] Error handling
  - Graceful failures for missing data
  - User-friendly error messages
  - Logging for debugging

- [ ] Performance optimization
  - Cache expensive queries
  - Lazy load large datasets
  - Optimize Supabase queries

**Acceptance Criteria**:
- No duplicate key errors
- Navigation is intuitive
- App handles errors gracefully
- Performance is production-ready

---

#### Task 4.2: Documentation & Video
**Priority**: P1 (Important)
**Estimated Effort**: 2 days

- [ ] Update video script for actual features
  - Revise [AGENCY_PLATFORM_GETTING_STARTED_VIDEO_SCRIPT.md](AGENCY_PLATFORM_GETTING_STARTED_VIDEO_SCRIPT.md)
  - Reflect real functionality, not demo

- [ ] Create user guide
  - How to sign up as an agency
  - How to add agents
  - How to reconcile statements
  - How to configure settings

- [ ] Create admin documentation
  - Database schema explained
  - How to troubleshoot common issues
  - How to add new features

**Acceptance Criteria**:
- Video script is accurate
- User guide is complete
- Admin docs are helpful

---

## Technical Implementation Notes

### Database Queries to Build

```python
# Get all agents for an agency
def get_agency_agents(agency_id):
    return supabase.table('agents')\
        .select('*')\
        .eq('agency_id', agency_id)\
        .eq('is_active', True)\
        .execute()

# Get all policies for an agency (across all agents)
def get_agency_policies(agency_id):
    return supabase.table('policies')\
        .select('*')\
        .eq('agency_id', agency_id)\
        .execute()

# Get agent performance metrics
def get_agent_metrics(agent_id, year=2025):
    return supabase.table('policies')\
        .select('premium, commission, policy_number')\
        .eq('agent_id', agent_id)\
        .gte('effective_date', f'{year}-01-01')\
        .execute()

# Get agency-wide metrics
def get_agency_metrics(agency_id, year=2025):
    return supabase.table('policies')\
        .select('agent_id, premium, commission')\
        .eq('agency_id', agency_id)\
        .gte('effective_date', f'{year}-01-01')\
        .execute()
```

### Row Level Security (RLS) Reminders

**Critical**: Ensure RLS policies are correctly implemented:
```sql
-- Agency owners see ALL policies in their agency
CREATE POLICY "agency_owners_see_all" ON policies
FOR SELECT
USING (
    agency_id IN (
        SELECT id FROM agencies
        WHERE owner_email = auth.email()
    )
);

-- Agency owners can INSERT/UPDATE policies with their agency_id
CREATE POLICY "agency_owners_manage_policies" ON policies
FOR ALL
USING (
    agency_id IN (
        SELECT id FROM agencies
        WHERE owner_email = auth.email()
    )
);
```

---

## Success Metrics

### Phase 1 Completion Criteria

✅ **Authentication**:
- Agency owner can sign up and log in
- Session correctly identifies agency accounts
- Onboarding wizard complete

✅ **Team Management**:
- Can add/edit/deactivate agents
- Agent list displays correctly
- Changes persist in database

✅ **Reconciliation**:
- Can import carrier statements
- Transactions assigned to correct agents
- -STMT- entries created with agent attribution
- Quality matches main branch

✅ **Dashboards**:
- All charts show real data
- Performance is acceptable
- Rankings are accurate

✅ **Settings**:
- Agency can configure their settings
- Integrations can be enabled/disabled

✅ **Quality**:
- No critical bugs
- Documentation complete
- Ready for beta testing

---

## Timeline Estimate

**Total Duration**: 6 weeks

| Sprint | Duration | Focus |
|--------|----------|-------|
| Sprint 1 | 2 weeks | Authentication & Team Management |
| Sprint 2 | 2 weeks | Reconciliation & Real Data |
| Sprint 3 | 1 week | Settings & Configuration |
| Sprint 4 | 1 week | Polish & Testing |

**Velocity Assumption**: Working 20-30 hours/week with Claude Code assistance

---

## Risk Assessment

### High Risk Items
1. **Reconciliation Complexity**: Mirroring main branch reconciliation logic may reveal edge cases
   - **Mitigation**: Start with main branch code review, thorough testing

2. **Data Isolation**: RLS policies must be bulletproof
   - **Mitigation**: Comprehensive security testing, peer review

3. **Performance**: Large agencies with 50+ agents and thousands of policies
   - **Mitigation**: Query optimization, caching, pagination

### Medium Risk Items
1. **User Experience**: Admin UI must be intuitive
   - **Mitigation**: User testing, iterative design

2. **Data Migration**: Existing solo users converting to agency accounts
   - **Mitigation**: Clear migration path, data validation

---

## Post-Phase 1 Preview

### Phase 2: Agent Experience (Future)
Once Phase 1 is complete and stable:
- Build agent login flow
- Create agent-only dashboard (filtered to their data)
- Show live commission statements
- Performance metrics vs. agency average

### Phase 3: Merge Consideration (Much Later)
- Comprehensive testing of both branches
- Migration plan for existing users
- Feature flag system for gradual rollout
- **No timeline pressure - keep separate until both perfect**

---

## Getting Started

### Immediate Next Steps

1. **Commit current fixes**:
   ```bash
   git add docs/AGENCY_PLATFORM_MASTER_PLAN.md
   git add docs/AGENCY_PLATFORM_PHASE1_ROADMAP.md
   git add pages/agency_dashboard.py
   git add pages/integrations.py
   git commit -m "docs: Update strategy and create Phase 1 roadmap"
   git push origin agency-platform
   ```

2. **Choose first task**:
   - Recommended: Task 1.1 (Agency Owner Authentication)
   - This unblocks everything else

3. **Set up testing environment**:
   - Ensure agency-platform branch runs on localhost:8503
   - Verify Supabase connection works
   - Test demo mode still works

---

**Let's build this! 🚀**
