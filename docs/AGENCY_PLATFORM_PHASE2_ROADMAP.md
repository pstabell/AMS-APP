# Agency Platform - Phase 2 Roadmap

**Created**: November 29, 2025
**Branch**: agency-platform-phase2 (created December 1, 2025)
**Goal**: Individual Agent Experience & Gamification
**Status**: 🎉 Sprint 5 Complete! Sprint 6 Ready
**Progress**: Sprint 1, 2, 3, 4 & 5 Complete (16/23 tasks = 70%)

---

## 🎯 Phase 2 Vision

**Transform the platform from "admin-only" to "team collaboration"**

Phase 1 gave agency owners a command center. Phase 2 empowers individual agents with:
- Personal login and dashboard
- Real-time performance tracking
- Gamification and competition
- Self-service commission statements
- Renewal pipeline management

**Target Users**: Individual insurance agents within agencies

---

## 📊 Phase 2 Overview

### Sprint 1: Agent Authentication & Dashboard (Week 1-2) - ✅ COMPLETE
- ✅ Task 1.1: Individual agent login flow (COMPLETE)
- ✅ Task 1.2: Agent-specific dashboard (COMPLETE)
- ✅ Task 1.3: Personal performance metrics (COMPLETE)

### Sprint 2: Commission Statements & Reports (Week 3-4) - ✅ COMPLETE
- ✅ Task 2.1: Personal commission statement viewer (COMPLETE)
- ✅ Task 2.2: Downloadable reports (PDF/CSV) (COMPLETE)
- ✅ Task 2.3: Commission verification workflow (COMPLETE)

### Sprint 3: Gamification & Competition (Week 5-6) - ✅ COMPLETE
- ✅ Task 3.1: Badge and achievement system (COMPLETE)
- ✅ Task 3.2: Live leaderboards (COMPLETE)
- ✅ Task 3.3: Streak tracking (COMPLETE)
- ✅ Task 3.4: Goal setting and progress (COMPLETE)

### Sprint 4: Renewal Management (Week 7-8) - ✅ COMPLETE
- ✅ Task 4.1: Renewal pipeline dashboard (COMPLETE)
- ✅ Task 4.2: Upcoming renewals calendar (COMPLETE)
- ✅ Task 4.3: Renewal retention tracking (COMPLETE)
- ✅ Task 4.4: Lost renewal analysis (COMPLETE)

### Sprint 5: Notifications & Engagement (Week 9) - ✅ COMPLETE
- ✅ Task 5.1: In-app notification system (COMPLETE)
- ✅ Task 5.2: Email notifications (COMPLETE)
- ⏭️ Task 5.3: Mobile push notifications (SKIPPED - future)

### Sprint 6: Polish & Testing (Week 10)
- Task 6.1: Performance optimization
- Task 6.2: Mobile responsiveness
- Task 6.3: User testing with real agents
- Task 6.4: Bug fixes and refinements

---

## 📋 Detailed Task Breakdown

### Sprint 1: Agent Authentication & Dashboard

#### Task 1.1: Individual Agent Login Flow ✅ COMPLETE
**Priority**: P0 (Blocker)
**Estimated Effort**: 3 days
**Dependencies**: Phase 1 complete
**Status**: ✅ COMPLETE (Commit: bad78f6)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Agents can log in with their email/password
- ✅ System detects if user is agent vs. agency owner
- ✅ Redirect to appropriate dashboard based on role
- ✅ Session state tracks agent_id and agency_id

**Implementation:**
```python
# Agent login detection - IMPLEMENTED
def get_user_role(user_email):
    # Check if user is agency owner
    agency = get_agency_by_owner(user_id)
    if agency:
        return {'role': 'agency_owner', 'agency_id': agency['id'], ...}

    # Check if user is agent
    agent = get_agent_by_user_id(user_id)
    if agent:
        return {'role': 'agent', 'agent_id': agent['id'], 'agency_id': agent['agency_id'], ...}

    # Solo agent (no agency)
    return {'role': 'solo_agent', ...}
```

**Acceptance Criteria:**
- ✅ Agent can log in with email/password
- ✅ System correctly identifies agent role
- ✅ Agent sees agent dashboard (not agency dashboard)
- ✅ Session state has agent_id and agency_id
- ✅ Navigation shows agent-appropriate menu items

**Files Created/Modified:**
- ✅ `agency_auth_helpers.py` - Added get_user_role() function
- ✅ `commission_app.py` - Updated login flow and navigation
- ✅ Added placeholder agent pages (My Dashboard, My Commissions, etc.)

---

#### Task 1.2: Agent-Specific Dashboard ✅ COMPLETE
**Priority**: P0 (Blocker)
**Estimated Effort**: 4 days
**Dependencies**: Task 1.1
**Status**: ✅ COMPLETE (Commit: 503d327)
**Completed**: December 1, 2025

**Objectives:**
Create personalized dashboard for individual agents showing:
- ✅ Personal performance metrics (premium, commission, policies)
- ✅ Current rank in agency
- ✅ Comparison to agency average
- ✅ Monthly trends (last 6 months)
- ✅ Recent activity feed

**Dashboard Layout:**
```
┌─────────────────────────────────────────────┐
│  Welcome back, John Smith! 👋               │
│  🏆 Rank #3 of 12 agents                    │
├─────────────────────────────────────────────┤
│  📊 Your Performance (YTD)                  │
│  ┌───────┬───────┬───────┬───────┐          │
│  │ $520K │ $78K  │  163  │ #3/12 │          │
│  │Premium│ Comm. │Policies│ Rank │          │
│  └───────┴───────┴───────┴───────┘          │
├─────────────────────────────────────────────┤
│  📈 Your Trends                             │
│  [Monthly Premium Chart - Last 6 Months]    │
│  [Commission by Carrier Pie Chart]          │
│  [Policy Distribution Chart]                │
├─────────────────────────────────────────────┤
│  🎯 Your Goals                              │
│  ████████░░ 80% to $100K goal              │
│                                             │
│  🔔 Recent Activity                         │
│  • New commission: $2,450 (Progressive)     │
│  • 5 renewals this week                     │
│  • You moved up to rank #3!                 │
└─────────────────────────────────────────────┘
```

**Key Metrics:**
- Premium YTD (your total)
- Commission YTD (your earnings)
- Policies YTD (your count)
- Your Rank (out of total agents)
- % vs Agency Average

**Charts:**
- Monthly premium trend (line chart)
- Commission by carrier (pie chart)
- Policy type distribution (bar chart)

**Acceptance Criteria:**
- ✅ Dashboard shows agent's personal metrics only
- ✅ Charts display agent's data (not agency-wide)
- ✅ Rank is calculated correctly
- ✅ Comparison to agency average shown
- ✅ Recent activity feed updates in real-time

**Files Created:**
- ✅ `utils/agent_data_helpers.py` - Agent performance data functions
- ✅ `commission_app.py` - Updated "My Dashboard" page with full implementation

---

#### Task 1.3: Personal Performance Metrics ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 2 days
**Dependencies**: Task 1.2
**Status**: ✅ COMPLETE (Commit: febf523)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Calculate agent-specific performance metrics
- ✅ Compare to agency average
- ✅ Track year-over-year growth
- ✅ Identify performance trends and status

**Metrics to Calculate:**
```python
def get_agent_performance(agent_id, agency_id, year):
    return {
        'premium_ytd': 520000,
        'commission_ytd': 78000,
        'policies_ytd': 163,
        'rank': 3,
        'total_agents': 12,
        'agency_avg_premium': 425000,
        'vs_agency_avg': +22.4,  # percentage
        'mom_growth': +15.2,  # month-over-month
        'best_month': 'March 2025',
        'best_month_premium': 95000
    }
```

**Acceptance Criteria:**
- ✅ Agent metrics calculated correctly
- ✅ Agency average calculated for comparison
- ✅ Year-over-year growth tracked
- ✅ Performance trends identified (up/down/stable)
- ✅ Status badges assigned (top_performer/above_avg/avg/needs_improvement)
- ✅ Strengths and areas to improve auto-identified
- ✅ Goal progress tracking (placeholder)

**Features Implemented:**
- ✅ `get_agent_growth_metrics()` - YoY growth, premium/commission trends
- ✅ `get_agent_performance_indicators()` - Status, badges, strengths, improvements
- ✅ `get_agent_goal_progress()` - Goal tracking with progress bars
- ✅ Dashboard sections: Growth & Trends, Performance Status, Strengths, Areas to Improve, Goals

---

### Sprint 2: Commission Statements & Reports

#### Task 2.1: Personal Commission Statement Viewer ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 3 days
**Status**: ✅ COMPLETE (Commit: 4cf23e1)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Agent can view all their commission statements
- ✅ Filter by month, carrier, status (paid/pending)
- ✅ See breakdown by transaction type (new, renewal, service)
- ✅ Drill down into individual transactions

**UI Design:**
```
Commission Statements
─────────────────────

Filters: [Month: All ▼] [Carrier: All ▼] [Status: All ▼]

┌──────────┬──────────┬────────┬─────────┬────────┐
│ Date     │ Carrier  │ Amount │ Status  │ Action │
├──────────┼──────────┼────────┼─────────┼────────┤
│ May 2025 │Progressive│$8,900 │⏳Pending│ View   │
│ Apr 2025 │ Geico    │$14,200│✅ Paid  │ View   │
│ Mar 2025 │Progressive│$12,450│✅ Paid  │Download│
└──────────┴──────────┴────────┴─────────┴────────┘

YTD Total: $78,000
```

**Acceptance Criteria:**
- ✅ All agent's commission statements listed
- ✅ Can filter by month, carrier, status
- ✅ Status shows paid vs. pending (received/pending)
- ✅ Can drill down to transaction details
- ✅ YTD total calculated correctly

**Files Modified:**
- `commission_app.py` - "💰 My Commissions" page (lines 22804-23027)
- `utils/agent_data_helpers.py` - Added 4 new functions (lines 555-791)

---

#### Task 2.2: Downloadable Reports (PDF/CSV) ✅ COMPLETE
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days
**Status**: ✅ COMPLETE (Commit: 4cf23e1)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Agent can download commission statements as PDF (text format)
- ✅ Agent can export data as CSV for Excel
- ✅ Reports include agent and agency information
- ✅ Include month, YTD, and custom date ranges

**PDF Layout:**
```
[Agency Logo]
Commission Statement - March 2025
Agent: John Smith

Summary:
  Total Premium:   $95,000
  Total Commission: $12,450
  Policies:        28

Breakdown by Carrier:
  Progressive: $6,200 (14 policies)
  Geico:       $4,100 (10 policies)
  State Farm:  $2,150 (4 policies)

Breakdown by Type:
  New Business: $8,500 (68%)
  Renewals:     $3,200 (26%)
  Service:      $750 (6%)
```

**Acceptance Criteria:**
- ✅ PDF generation works (text format - reportlab integration future enhancement)
- ✅ CSV export includes all relevant fields
- ✅ Reports include agent and agency names
- ✅ Custom date range selection works
- ✅ Download is fast (<5 seconds)

**Implementation:**
- `export_commission_statement_to_csv()` - CSV export with proper formatting
- `export_commission_statement_to_pdf()` - Text-based PDF (placeholder for reportlab)
- Streamlit download_button integration with dynamic file naming

---

#### Task 2.3: Commission Verification Workflow ✅ COMPLETE
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days
**Status**: ✅ COMPLETE (Commit: 4cf23e1)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Agent can flag commission discrepancies
- ✅ Submit dispute with notes
- ✅ Track dispute status (pending/verified/disputed)
- ✅ View verification statistics

**Workflow:**
```
Agent View:
  Statement: March 2025 - $12,450

  Expected: $13,200
  Received: $12,450
  Difference: -$750 ❌

  [Flag Discrepancy] button

  → Opens form:
    Transaction ID: ___
    Expected Amount: ___
    Notes: ___
    [Submit Dispute]

Agency Owner View:
  Disputes (3 pending)

  1. John Smith - March 2025
     Expected: $13,200
     Received: $12,450
     Notes: "Missing commission on 2 policies"
     [Review] [Resolve]
```

**Acceptance Criteria:**
- ✅ Agent can flag discrepancies via form
- ✅ Dispute form captures expected vs actual amounts and notes
- ✅ Verification requests stored in database (commission_verifications table)
- ✅ Disputes tracked with status (pending/verified/disputed)
- ✅ Verification statistics displayed (pending, verified, disputed amounts)
- ⏳ Agency owner notification (future enhancement)

**Implementation:**
- `submit_commission_verification()` - Submit discrepancy reports
- `get_agent_verification_requests()` - View all requests
- `get_verification_stats()` - Summary statistics
- UI with expandable form and verification requests table

---

### Sprint 3: Gamification & Competition

#### Task 3.1: Badge and Achievement System ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 4 days
**Status**: ✅ COMPLETE (Commit: e1e3ab5)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Define achievement badges (12 badge types)
- ✅ Automatically award badges when criteria met
- ✅ Display badges on agent profile
- ✅ Points system implemented (40-200 points per badge)

**Badge Types:**
```python
BADGES = {
    'top_producer': {
        'name': 'Top Producer',
        'icon': '🥇',
        'criteria': 'Rank #1 for the month',
        'points': 100
    },
    'streak_7': {
        'name': '7-Day Writing Streak',
        'icon': '🔥',
        'criteria': 'Write policies 7 days in a row',
        'points': 50
    },
    '100k_month': {
        'name': '$100K Month',
        'icon': '💎',
        'criteria': 'Write $100K+ premium in one month',
        'points': 150
    },
    'renewal_master': {
        'name': 'Renewal Master',
        'icon': '🎯',
        'criteria': '95%+ retention rate',
        'points': 75
    },
    'cross_sell_king': {
        'name': 'Cross-Sell King',
        'icon': '👑',
        'criteria': 'Sell 3+ policy types to one customer',
        'points': 60
    }
}
```

**Badge Display:**
```
Your Badges (5 earned)

🥇 Top Producer (March 2025)
🔥 7-Day Writing Streak
💎 $100K Month (2x)
🎯 Renewal Master
👑 Cross-Sell King

Recent Unlocks:
• 2 hours ago - 7-Day Writing Streak
• Yesterday - Renewal Master
```

**Acceptance Criteria:**
- ✅ 12 badge types defined in BADGE_DEFINITIONS
- ✅ Badges awarded automatically via get_agent_badges()
- ✅ Badge criteria clearly documented
- ✅ Agent profile shows all badges in "🎯 Goals & Badges" page
- ✅ Badge library shows all available badges

**Implementation:**
- BADGE_DEFINITIONS dictionary with 12 badge types
- get_agent_badges() - Real-time badge calculation
- Badges tab in "🎯 Goals & Badges" page
- Grid layout display with icons, names, descriptions, points
- All Badges tab shows complete badge library

---

#### Task 3.2: Live Leaderboards ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 3 days
**Status**: ✅ COMPLETE (Commit: e1e3ab5)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Live leaderboard updated in real-time
- ✅ Multiple leaderboard categories (4 categories)
- ✅ Filter by time period (YTD fully implemented)
- ✅ Highlight current user's position

**Leaderboard Categories:**
```
Categories:
1. Premium Volume (YTD)
2. Commission Earned (YTD)
3. Policy Count (YTD)
4. New Business (Month)
5. Renewals Retained (Month)
6. Cross-Sell Rate (Month)
7. Points Earned (Week)
```

**UI Design:**
```
🏆 Leaderboards

[Category: Premium Volume ▼] [Period: YTD ▼]

Rank  Agent             Premium    Change
─────────────────────────────────────────
🥇 1  Mike Davis        $850,000   ─
🥈 2  Sarah Johnson     $780,000   ▲ +1
🥉 3  John Smith (You!) $520,000   ▲ +2
   4  Emily Chen        $495,000   ▼ -2
   5  David Martinez    $410,000   ─
   6  Lisa Anderson     $380,000   ─
   ...

Your Stats:
  Current Rank: #3
  Points Behind #2: $260,000
  Points Ahead of #4: $25,000
```

**Acceptance Criteria:**
- ✅ 4 leaderboard categories implemented (Premium, Commission, Policies, Points)
- ✅ Real-time ranking updates
- ✅ Filter by YTD (Month/Week planned for future)
- ✅ Current user highlighted with "You!" tag
- ✅ Top 3 shown with medal emojis (🥇🥈🥉)
- ✅ Position stats: Rank, Distance from leader, Percentile

**Implementation:**
- get_agency_leaderboard() with category and period parameters
- "🏆 Leaderboard" page with full UI
- Category selector with 4 options
- Leaderboard table with rankings
- Current agent metrics: Position, Behind Leader, Percentile
- Agency stats: Average, Total

---

#### Task 3.3: Streak Tracking ✅ COMPLETE
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days
**Status**: ✅ COMPLETE (Commit: e1e3ab5)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Track consecutive days with policy sales
- ✅ Show current streak
- ✅ Show longest streak
- ✅ Award badges for streak milestones (7, 14, 30, 60 days)

**Streak Logic:**
```python
def calculate_streak(agent_id):
    # Get policies ordered by date
    policies = get_policies_by_date(agent_id)

    current_streak = 0
    longest_streak = 0
    last_date = None

    for policy in policies:
        if last_date and (policy.date - last_date).days == 1:
            current_streak += 1
        else:
            current_streak = 1

        longest_streak = max(longest_streak, current_streak)
        last_date = policy.date

    return {
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'days_since_last': (today - last_date).days
    }
```

**UI Display:**
```
🔥 Your Writing Streak

Current Streak: 7 days 🔥
Longest Streak: 12 days (March 2025)

Keep it going!
  Today: ✅ 2 policies
  Yesterday: ✅ 1 policy
  2 days ago: ✅ 3 policies
  ...

Streak Milestones:
  ✅ 7 days
  ⬜ 14 days
  ⬜ 30 days
  ⬜ 60 days
```

**Acceptance Criteria:**
- ✅ Current streak calculated correctly
- ✅ Longest streak tracked
- ✅ Streak resets if day missed (1-day grace period)
- ✅ Visual display motivates agents
- ✅ Streak badges awarded automatically
- ✅ Milestone tracking: 7, 14, 30, 60 days

**Implementation:**
- get_agent_streak() - Calculates consecutive policy writing days
- Streaks tab in "🎯 Goals & Badges" page
- Metrics: Current Streak, Longest Streak, Days Since Last
- Motivational status messages based on streak length
- Visual milestone checklist with progress indicators
- Integration with badge system

---

#### Task 3.4: Goal Setting and Progress ✅ COMPLETE
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 3 days
**Status**: ✅ COMPLETE (Commit: e1e3ab5)
**Completed**: December 1, 2025

**Objectives:**
- ✅ Agent can set personal goals
- ✅ Track progress toward goals
- ✅ Visual progress bars
- ✅ Celebrate when goal achieved

**Goal Types:**
```python
GOAL_TYPES = {
    'premium_monthly': 'Monthly Premium Target',
    'premium_ytd': 'YTD Premium Target',
    'policies_monthly': 'Monthly Policy Count',
    'commission_ytd': 'YTD Commission Target',
    'retention_rate': 'Renewal Retention %'
}
```

**UI:**
```
🎯 Your Goals

Monthly Premium Goal
  Goal: $100,000
  Current: $78,500
  Progress: ████████░░ 78.5%
  Remaining: $21,500
  Days left: 5

YTD Commission Goal
  Goal: $150,000
  Current: $98,200
  Progress: ███████░░░ 65.5%
  On track: Yes ✅
  Projected: $152,300

[Set New Goal] [Edit Goals]
```

**Acceptance Criteria:**
- ✅ Agent can create custom goals (3 goal types)
- ✅ Progress calculated in real-time
- ✅ Visual progress bars
- ✅ Goal stats: Target, Current, Remaining, % Complete
- ✅ Celebration when goal achieved (success message)

**Implementation:**
- get_agent_goals() - Fetch agent's personal goals
- create_agent_goal() - Create new goals with validation
- Goals tab in "🎯 Goals & Badges" page
- Goal types: Premium YTD, Commission YTD, Policy Count YTD
- Progress bars with real-time calculation
- Goal creation form with type selector and target input
- Achievement status display

---

### Sprint 4: Renewal Management - ✅ COMPLETE

#### Task 4.1: Renewal Pipeline Dashboard ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 4 days
**Status**: ✅ COMPLETE (December 1, 2025)

**Objectives:**
- ✅ Show all policies with upcoming renewals
- ✅ Filter by time window (30/60/90/180/365 days)
- ✅ Highlight at-risk renewals with urgency indicators
- ✅ Track renewal conversion rate and at-risk revenue

**Dashboard Layout:**
```
🔄 Renewal Pipeline

Summary
  Upcoming (30 days): 24 policies
  Upcoming (60 days): 47 policies
  Upcoming (90 days): 68 policies

  Retention Rate (YTD): 87% (Target: 90%)

Upcoming Renewals (Next 30 Days)

Customer         Policy      Renewal Date  Premium  Status
─────────────────────────────────────────────────────────
John Doe         Auto        Dec 5, 2025   $2,400   🟢 Contact
Jane Smith       Home        Dec 8, 2025   $1,800   🟡 Pending
Bob Johnson      Auto+Home   Dec 12, 2025  $4,200   🔴 At Risk
...

Status Legend:
  🟢 Contacted (renewal in progress)
  🟡 Pending contact
  🔴 At risk (no contact yet, <7 days)
```

**Acceptance Criteria:**
- ✅ Shows all upcoming renewals
- ✅ Filter by 30/60/90/180/365 day windows
- ✅ Urgency tracking (past_due/critical/high/medium/low)
- ✅ At-risk premium and commission calculated
- ✅ Sortable, filterable, and exportable to CSV

**Implementation:**
- Created `get_agent_renewal_pipeline()` function in [agent_data_helpers.py](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\utils\agent_data_helpers.py:1583)
- Tab 1 in "📋 My Policies" page ([commission_app.py:23220](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\commission_app.py#L23220))
- Summary metrics: Past Due, Due in 7/30/90 days, Total Renewals
- At-risk revenue tracking: Premium and Commission
- Urgency-based filtering with color-coded indicators
- Exportable renewal list to CSV

---

#### Task 4.2: Upcoming Renewals Calendar ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 3 days
**Status**: ✅ COMPLETE (December 1, 2025)

**Objectives:**
- ✅ Calendar view of renewals by month
- ✅ Grouped by expiration date
- ✅ Click to view policy details
- ✅ Month summary statistics

**Calendar View:**
```
December 2025
─────────────────────────────────────
Mon  Tue  Wed  Thu  Fri  Sat  Sun
 1    2    3    4    5    6    7
                    [2]  [1]
 8    9   10   11   12   13   14
[3]  [1]       [2]  [4]  [1]
15   16   17   18   19   20   21
[2]  [1]       [1]  [3]

Color Code:
  🟢 Green - Contacted
  🟡 Yellow - Pending
  🔴 Red - At Risk

Click date to see details
```

**Acceptance Criteria:**
- ✅ Calendar displays all renewals for selected month
- ✅ Grouped by expiration date with expandable details
- ✅ Click date to see renewal list
- ✅ Month summary with total renewals, premium, and average premium
- ✅ Month/year selector

**Implementation:**
- Created `get_renewal_calendar_data()` function in [agent_data_helpers.py](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\utils\agent_data_helpers.py:2022)
- Tab 2 in "📋 My Policies" page ([commission_app.py:23371](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\commission_app.py#L23371))
- Month/year selector to navigate calendar
- Grouped renewals by date with expandable sections
- Policy details: Insured name, carrier, policy type, premium, days until expiration
- Month summary statistics

---

#### Task 4.3: Renewal Retention Tracking ✅ COMPLETE
**Priority**: P1 (Important)
**Estimated Effort**: 2 days
**Status**: ✅ COMPLETE (December 1, 2025)

**Objectives:**
- ✅ Track which renewals were retained
- ✅ Calculate retention rate by period (YTD/30/90/365 days)
- ✅ Identify renewed vs lost renewals
- ✅ Compare to agency average

**Metrics:**
```python
def get_renewal_metrics(agent_id, year):
    return {
        'total_renewals_due': 156,
        'renewals_retained': 136,
        'renewals_lost': 20,
        'retention_rate': 87.2,  # percentage
        'agency_avg_retention': 85.0,
        'vs_agency_avg': +2.2,

        'lost_breakdown': {
            'price': 8,  # customer said too expensive
            'moved': 4,  # customer moved
            'competitor': 6,  # went to competitor
            'other': 2
        }
    }
```

**Acceptance Criteria:**
- ✅ Retention rate calculated for multiple periods (YTD, last 30/90/365 days)
- ✅ Renewed vs Lost breakdown with counts and premium
- ✅ Comparison to agency average retention rate
- ✅ Visual breakdown with bar charts

**Implementation:**
- Created `get_agent_renewal_retention_rate()` function in [agent_data_helpers.py](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\utils\agent_data_helpers.py:1753)
- Tab 3 in "📋 My Policies" page ([commission_app.py:23458](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\commission_app.py#L23458))
- Period selector: YTD, Last 30/90/365 Days
- Retention rate with performance indicator (Excellent/Good/Fair/Needs improvement)
- Agency average comparison
- Renewed vs Lost breakdown with counts and premium
- Visual bar chart representation

---

#### Task 4.4: Lost Renewal Analysis ✅ COMPLETE
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days
**Status**: ✅ COMPLETE (December 1, 2025)

**Objectives:**
- ✅ Track cancelled policies (lost renewals)
- ✅ Identify patterns by carrier and policy type
- ✅ Detailed lost policy list
- ✅ Exportable reports

**Analysis:**
```
Lost Renewals Analysis (YTD)

Total Lost: 20 policies ($32,400 premium)

Reasons:
  Price: 40% (8 policies)
  Competitor: 30% (6 policies)
  Customer Moved: 20% (4 policies)
  Other: 10% (2 policies)

Patterns:
  • Most lost renewals in Auto (65%)
  • Average premium: $1,620
  • Loss rate highest with Progressive (15%)

Recommendations:
  1. Review pricing on auto renewals
  2. Proactive outreach 60 days before renewal
  3. Offer multi-policy discounts

Win-Back Opportunities:
  • 3 customers who might return
  • Estimated recovery: $5,400 premium
```

**Acceptance Criteria:**
- ✅ Lost renewals tracked (cancelled policies)
- ✅ Pattern analysis by carrier and policy type
- ✅ Detailed lost policy list with all details
- ✅ Exportable to CSV for further analysis

**Implementation:**
- Created `get_lost_renewals_analysis()` function in [agent_data_helpers.py](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\utils\agent_data_helpers.py:1893)
- Tab 4 in "📋 My Policies" page ([commission_app.py:23561](c:\Users\Patri\Metro Point Insurance\Metro Point Technology - Documents\Projects\AMS-APP\commission_app.py#L23561))
- Period selector: YTD, Last 30/90/365 Days
- Lost business summary: Count, premium, and commission totals
- Lost renewals grouped by carrier
- Lost renewals grouped by policy type
- Detailed lost policies list with all information
- Export to CSV functionality

---

### Sprint 5: Notifications & Engagement

#### Task 5.1: In-App Notification System
**Priority**: P1 (Important)
**Estimated Effort**: 3 days

**Objectives:**
- Notification bell icon in header
- Real-time notifications
- Mark as read/unread
- Notification history

**Notification Types:**
```python
NOTIFICATION_TYPES = {
    'commission_received': 'New commission payment received',
    'rank_change': 'Your rank changed',
    'badge_earned': 'You earned a new badge!',
    'goal_achieved': 'Goal achieved!',
    'renewal_due': 'Renewal due in 7 days',
    'statement_available': 'New statement available',
    'team_update': 'Team announcement'
}
```

**UI:**
```
Header:
  [🔔 5] ← notification bell with count

Dropdown:
  Notifications
  ─────────────
  🎉 You earned "Top Producer" badge!
     2 hours ago

  💰 New commission received: $2,450
     Yesterday

  📈 You moved up to rank #3!
     2 days ago

  [Mark all as read] [View all]
```

**Acceptance Criteria:**
- [ ] Notification bell in header
- [ ] Count shows unread notifications
- [ ] Dropdown lists recent notifications
- [ ] Click to mark as read
- [ ] Link to related item

**Database:**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);
```

---

#### Task 5.2: Email Notifications
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 days

**Objectives:**
- Email notifications for key events
- Agent can configure preferences
- HTML email templates
- Unsubscribe option

**Email Templates:**
```html
Subject: You earned a new badge! 🎉

Hi John,

Congratulations! You just earned the "Top Producer" badge
for being the #1 agent in March 2025.

Your Stats:
  Premium: $95,000
  Rank: #1 of 12

Keep up the great work!

[View Your Dashboard]
```

**Acceptance Criteria:**
- [ ] Email sent for badge unlocks
- [ ] Email sent for commission payments
- [ ] Agent can customize preferences
- [ ] Emails are professionally designed
- [ ] Unsubscribe link included

---

#### Task 5.3: Mobile Push Notifications (Future)
**Priority**: P3 (Future)
**Estimated Effort**: TBD

**Note:** Requires mobile app or PWA. Deferred to Phase 3.

---

### Sprint 6: Polish & Testing

#### Task 6.1: Performance Optimization
**Priority**: P1 (Important)
**Estimated Effort**: 2 days

**Objectives:**
- Add caching to agent queries
- Optimize leaderboard calculations
- Reduce database query count
- Improve page load times

**Optimizations:**
```python
# Cache agent metrics
@st.cache_data(ttl=300)
def get_agent_metrics(agent_id):
    # ...

# Pre-calculate leaderboards nightly
# Store in separate table for fast lookups

# Use database indexes
CREATE INDEX idx_policies_agent_date ON policies(agent_id, "Effective Date");
CREATE INDEX idx_badges_agent ON agent_badges(agent_id, earned_at);
```

**Acceptance Criteria:**
- [ ] Page load < 2 seconds
- [ ] Leaderboards update < 1 second
- [ ] Database queries optimized
- [ ] Caching strategy implemented

---

#### Task 6.2: Mobile Responsiveness
**Priority**: P1 (Important)
**Estimated Effort**: 2 days

**Objectives:**
- All agent pages work on mobile
- Responsive charts and tables
- Mobile-friendly navigation
- Touch-optimized interactions

**Acceptance Criteria:**
- [ ] Works on mobile (320px+)
- [ ] Charts resize properly
- [ ] Tables scroll horizontally
- [ ] Navigation is touch-friendly

---

#### Task 6.3: User Testing with Real Agents
**Priority**: P1 (Important)
**Estimated Effort**: 3 days

**Objectives:**
- 5-10 real agents test the system
- Gather feedback on UX
- Identify pain points
- Create prioritized fix list

**Testing Plan:**
1. Recruit 5-10 agents from beta agencies
2. Give them tasks to complete
3. Observe and take notes
4. Survey for feedback
5. Prioritize improvements

**Acceptance Criteria:**
- [ ] 5+ agents complete testing
- [ ] Feedback documented
- [ ] Critical issues identified
- [ ] Fix list prioritized

---

#### Task 6.4: Bug Fixes and Refinements
**Priority**: P1 (Important)
**Estimated Effort**: 3 days

**Objectives:**
- Fix all critical bugs from testing
- Polish UI/UX based on feedback
- Performance improvements
- Final security audit

**Acceptance Criteria:**
- [ ] All P0/P1 bugs fixed
- [ ] UI polished and professional
- [ ] Performance meets targets
- [ ] Security audit passed

---

## 🎯 Phase 2 Success Metrics

### Engagement Metrics
- **Daily Active Agents**: 70%+ of agents log in daily
- **Weekly Active Agents**: 90%+ log in weekly
- **Avg Session Duration**: 5+ minutes
- **Leaderboard Views**: 50%+ check weekly

### Performance Metrics
- **Commission Statement Downloads**: 80%+ download monthly
- **Goal Completion**: 60%+ achieve their goals
- **Badge Engagement**: 70%+ earn at least 1 badge
- **Renewal Pipeline Usage**: 50%+ use renewal tracker

### Business Metrics
- **Retention Rate**: 90%+ policy retention
- **Premium Growth**: 15%+ year-over-year
- **Agent Satisfaction**: 4.5/5 star rating
- **Agency Owner NPS**: 50+

---

## 📦 Technical Requirements

### New Database Tables

```sql
-- Agent badges
CREATE TABLE agent_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id),
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Agent goals
CREATE TABLE agent_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id),
    goal_type TEXT NOT NULL,
    target_value NUMERIC,
    current_value NUMERIC,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active'
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id),
    type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard cache (for performance)
CREATE TABLE leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT,
    period TEXT,
    data JSONB,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renewal tracking
CREATE TABLE renewal_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id),
    policy_id UUID REFERENCES policies(id),
    renewal_date DATE,
    status TEXT DEFAULT 'pending',
    contacted_at TIMESTAMPTZ,
    notes TEXT,
    outcome TEXT
);
```

### New Indexes
```sql
CREATE INDEX idx_badges_agent ON agent_badges(agent_id, earned_at);
CREATE INDEX idx_goals_agent ON agent_goals(agent_id, status);
CREATE INDEX idx_notifications_agent ON notifications(agent_id, is_read, created_at);
CREATE INDEX idx_renewals_agent_date ON renewal_tracking(agent_id, renewal_date);
```

---

## 🚀 Deployment Plan

### Branch Strategy
```
main (production)
  └─ agency-platform (Phase 1 - complete)
       └─ agency-platform-phase2 (Phase 2 - new branch)
```

### Deployment Steps
1. Create `agency-platform-phase2` branch from `agency-platform`
2. Develop Sprint 1-6 tasks
3. Merge to `agency-platform` for testing
4. Beta test with 2-3 agencies (2-3 weeks)
5. Gather feedback and iterate
6. Merge to `main` for production release

---

## 📅 Timeline

**Total Estimate**: 10 weeks

| Sprint | Duration | Tasks | Deliverables |
|--------|----------|-------|--------------|
| Sprint 1 | 2 weeks | 1.1-1.3 | Agent login + dashboard |
| Sprint 2 | 2 weeks | 2.1-2.3 | Commission statements |
| Sprint 3 | 2 weeks | 3.1-3.4 | Gamification |
| Sprint 4 | 2 weeks | 4.1-4.4 | Renewal management |
| Sprint 5 | 1 week | 5.1-5.2 | Notifications |
| Sprint 6 | 1 week | 6.1-6.4 | Polish & testing |

**Target Completion**: Mid-February 2026

---

## ✅ Definition of Done

Phase 2 is complete when:
- [ ] All 23 tasks are complete
- [ ] Agent login flow works flawlessly
- [ ] Agent dashboard is performant and beautiful
- [ ] Gamification drives engagement
- [ ] Renewal pipeline reduces lost renewals
- [ ] Notifications keep agents engaged
- [ ] Mobile experience is excellent
- [ ] 5+ real agents have tested and approved
- [ ] No P0 or P1 bugs remaining
- [ ] Documentation updated
- [ ] Video tutorial created
- [ ] Beta agencies are satisfied (4+ stars)

---

**Next Steps**:
1. Review and approve Phase 2 roadmap
2. Create `agency-platform-phase2` branch
3. Begin Sprint 1 - Task 1.1 (Agent Login Flow)

**Let's build an amazing agent experience! 🚀**
