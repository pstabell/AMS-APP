# Agency Platform - Getting Started Video Script

## Video Overview
**Duration:** 4-6 minutes
**Target Audience:** Insurance agency owners managing multiple agents
**Goal:** Demonstrate how agency owners can manage their team, track agent performance, and reconcile commissions

---

## Script

### Opening (0:00 - 0:20)
**[Screen: Agency Platform login page]**

"Welcome to the Agency Commission Tracker - the first commission management platform built specifically for insurance agencies with multiple agents.

Whether you have 2 agents or 20, you can now track every agent's performance, reconcile carrier statements across your entire team, and see real-time rankings - all in one place."

### Agency Owner Login (0:20 - 0:45)
**[Screen: Login and navigate to Agency Dashboard]**

"Let me show you what the platform looks like for an agency owner. I'll log in and you'll see I'm immediately taken to the Agency Dashboard."

**[Action: Log in as agency owner]**

"Notice the sidebar - as an agency owner, I have access to special features that regular agents don't see:
- Agency Dashboard with team rankings
- Team Management to add and manage agents
- Agency Reconciliation for multi-agent statements
- Agency Settings for commission rules and branding"

### Agency Dashboard Tour (0:45 - 1:45)
**[Screen: Agency Dashboard with real metrics]**

"The Agency Dashboard is your command center. At the top, you see agency-wide metrics:

- **Active Agents** - how many agents are currently writing business
- **Total Premium YTD** - combined premium across all agents
- **Total Commission YTD** - your agency's total earnings
- **Total Policies** - the size of your book of business

You can filter by year to see historical performance."

**[Action: Show year selector]**

"Below that, you see the Agent Rankings table - this is the heart of the platform."

**[Screen: Scroll to rankings table]**

"Every agent is ranked by premium volume. You can see:
- Each agent's rank
- Total policies written
- Premium YTD
- Commission YTD

This creates healthy competition and lets you identify top performers instantly."

**[Action: Scroll through rankings]**

### Performance Charts (1:45 - 2:30)
**[Screen: Show charts section]**

"The dashboard includes interactive charts showing:

**Premium by Agent** - a bar chart comparing each agent's premium volume
**Commission by Agent** - total commissions earned per agent
**Policy Distribution** - a pie chart showing each agent's share of the book
**Monthly Premium Trends** - track the top 5 agents over the last 6 months
**Commission by Carrier** - see which carriers are driving the most revenue

All charts are interactive - hover over any bar or slice to see exact numbers."

**[Action: Hover over charts]**

### Team Management (2:30 - 3:15)
**[Screen: Navigate to Team Management]**

"Let's look at Team Management - this is where you add and manage your agents."

**[Screen: Team Management page]**

"You see a summary at the top: total agents, active agents, total policies, and total commissions.

Below that, each agent has a card showing:
- Name and email
- Role and status
- Policy count and YTD commission
- When they joined

To add a new agent, click 'Add New Agent'."

**[Action: Show add agent form]**

"You just enter their name, email, and role. The system creates their account and they're immediately able to start tracking their own commissions.

You can also edit agents or deactivate them if they leave the agency."

### Agency Reconciliation (3:15 - 4:15)
**[Screen: Navigate to Agency Reconciliation]**

"One of the most powerful features is Agency Reconciliation. This is where you import carrier statements and automatically assign transactions to the right agents.

The process is simple - it's a 4-step wizard:

**Step 1: Upload Statement** - drag and drop your carrier's CSV or Excel file

**Step 2: Map Columns** - the system auto-detects most columns, you just verify

**Step 3: Agent Assignment** - choose how to assign transactions:
- Assign all to one agent (for single-agent statements)
- Auto-assign by policy ownership (the system matches to existing policies)
- Manual assignment (you assign each transaction individually)

**Step 4: Review & Import** - see matched vs. unmatched transactions, verify agent assignments, then import"

**[Action: Show each step briefly]**

"The system uses smart matching - it recognizes customers across agents, matches by policy number, and even does fuzzy name matching.

Every imported transaction is tagged with the agent_id, so you always know who gets credit."

### Agency Settings (4:15 - 5:00)
**[Screen: Navigate to Agency Settings]**

"In Agency Settings, you can customize the platform for your agency.

There are 5 tabs:

**Agency Profile** - your agency name, contact info, license number, tax ID

**Subscription & Plan** - your current plan and features

**Notifications** - configure email and in-app notifications

**Branding** - customize colors and add your logo (coming soon)

**Commission Rules** - this is critical!"

**[Screen: Show Commission Rules tab]**

"Here you set your commission split rules:
- Default splits for new business, renewals, and service work
- Per-carrier overrides (e.g., Progressive pays 15%, Geico pays 12%)
- Per-agent overrides (e.g., your top producer gets a better split)

These rules will automatically calculate agent commissions when you import statements."

### Security & Multi-Tenancy (5:00 - 5:30)
**[Screen: Return to dashboard]**

"Everything you've seen is built with enterprise-grade security:

- Each agent only sees their own data
- Agency owners see all agents in their agency
- All data is isolated using Row Level Security at the database level
- No agency can see another agency's data
- All queries are filtered by agency_id and agent_id automatically

This means you can confidently use the platform knowing your data is protected."

### Closing (5:30 - 6:00)
**[Screen: Dashboard overview]**

"That's the Agency Platform in a nutshell:

✅ Real-time agent rankings and performance tracking
✅ Easy team management - add agents in seconds
✅ Smart carrier statement reconciliation with auto-assignment
✅ Customizable commission rules per carrier and per agent
✅ Beautiful dashboards with interactive charts

This is Phase 1 - we've built the foundation. Coming in Phase 2:
- Individual agent logins and personalized dashboards
- Gamification with badges and streaks
- Renewal tracking and retention analytics
- Real carrier integrations (Applied Epic, AMS360, etc.)

Ready to manage your agency like never before? Contact us for a demo or start your free trial."

**[Screen: Contact information or call-to-action]**

---

## Post-Production Notes

### Graphics/Text Overlays to Add:
- **0:20** - Text overlay: "Agency Owner View"
- **0:45** - Highlight key metrics with animated circles
- **1:45** - Text overlay: "Agent Rankings - Updated in Real-Time"
- **2:30** - Text overlay: "Team Management - Add Agents in Seconds"
- **3:15** - Text overlay: "Smart Statement Reconciliation"
- **4:15** - Text overlay: "Customizable Commission Rules"
- **5:00** - Text overlay: "Enterprise-Grade Security"
- **5:30** - CTA overlay with contact information

### Background Music:
- Upbeat, professional corporate background music at 20% volume
- Fade out during closing

### Transitions:
- Smooth crossfades between sections
- No jarring cuts - keep it professional

### Voiceover Notes:
- Professional but friendly tone
- Moderate pace - not too fast
- Emphasize key benefits: "real-time rankings," "smart matching," "automatic assignment," "enterprise-grade security"
- Sound excited about the product but not salesy

---

## Technical Setup for Recording

1. **Browser Setup:**
   - Use Chrome in Incognito mode (clean, no extensions)
   - Set browser zoom to 100%
   - Hide bookmarks bar
   - Full screen the Streamlit app

2. **Demo Data:**
   - Log in as agency owner with real test data
   - Pre-populate with 5-10 agents
   - Have sample policies for each agent
   - Prepare a sample carrier statement CSV for reconciliation demo
   - Run on localhost:8503 (agency-platform branch)

3. **Screen Recording:**
   - Record at 1920x1080 (1080p)
   - 60fps for smooth animations
   - Record system audio if adding voiceover live
   - Use OBS Studio or similar professional screen recording software

4. **Cursor:**
   - Use a cursor highlighting tool to make mouse movements visible
   - Move cursor slowly and deliberately
   - Pause on important elements for 1-2 seconds

---

## Demo Setup Checklist

Before recording, ensure you have:

- [ ] Agency owner account created in database
- [ ] 5-10 test agents added to the agency
- [ ] Sample policies for each agent (at least 5-10 policies per agent)
- [ ] Sample carrier statement CSV prepared for reconciliation demo
- [ ] All charts loading correctly with real data
- [ ] Commission rules configured with at least one carrier override
- [ ] Agency profile filled out with logo/branding

---

## Sample Data Script

Run this to create demo data:

```python
# Create agency
agency_id = create_agency("Demo Insurance Agency")

# Create agents
agents = [
    create_agent(agency_id, "John Smith", "john@demo.com"),
    create_agent(agency_id, "Sarah Johnson", "sarah@demo.com"),
    create_agent(agency_id, "Mike Davis", "mike@demo.com"),
    create_agent(agency_id, "Emily Chen", "emily@demo.com"),
    create_agent(agency_id, "David Martinez", "david@demo.com"),
]

# Create sample policies for each agent
# (distributed to create different performance levels)
```

---

## Video Checklist

- [ ] Browser set to Incognito/Private mode
- [ ] Demo data created and verified
- [ ] All agency pages accessible and loading
- [ ] Charts rendering correctly
- [ ] Screen recording software tested
- [ ] Microphone tested (if doing live voiceover)
- [ ] Script reviewed and practiced
- [ ] Background music selected
- [ ] Post-production plan ready
- [ ] Final review before publishing

---

## Key Messaging Points

**Problem We Solve:**
- Agency owners can't see their agents' performance in real-time
- Carrier statements are hard to split across multiple agents
- No way to rank agents and create healthy competition
- Commission rules are complex and manual

**Our Solution:**
- Real-time agent rankings dashboard
- Smart statement reconciliation with auto-assignment
- Customizable commission rules
- Beautiful, easy-to-use interface

**Differentiation:**
- First platform built FOR agencies with multiple agents
- Not just a solo agent tool scaled up
- Smart matching across agents (agency-wide customer recognition)
- Enterprise security from day one

---

**Created:** 2025-11-28
**Updated:** 2025-11-29 (Revised for actual Phase 1 features)
**Branch:** agency-platform
**Purpose:** Marketing and onboarding video for Agency Platform Phase 1
