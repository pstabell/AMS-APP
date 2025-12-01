# User Testing Guide - Phase 2
**Sprint 6, Task 6.3: User Testing with Real Agents**
**Created**: December 1, 2025

---

## 🎯 Testing Objectives

This guide prepares the platform for user testing with real insurance agents. The goal is to validate:
1. **Usability** - Can agents navigate and use features intuitively?
2. **Performance** - Does the platform respond quickly?
3. **Value** - Do agents find the features useful?
4. **Bugs** - Are there any blocking issues?

---

## 👥 Test Participant Selection

### Ideal Test Participants (3-5 agents):
- **Mix of experience levels**: 1 new agent, 2-3 experienced, 1 top performer
- **Tech comfort levels**: Mix of tech-savvy and less technical users
- **Different agencies**: If possible, test with agents from 2-3 different agencies
- **Active users**: Agents who write 5+ policies per month

### Recruitment Script:
```
Hi [Agent Name],

We're launching a new agent dashboard and would love your feedback!

The session will take 30-45 minutes. You'll:
- Explore the new agent dashboard
- Test features like commission tracking, leaderboards, and badges
- Share your honest feedback

What you get:
- Early access to powerful new tools
- $50 Amazon gift card for your time
- Influence on the final product

Interested? Reply with your availability next week.

Thanks,
[Your Name]
```

---

## 📋 Pre-Test Setup Checklist

### 1. Data Preparation
- [ ] Create test agent accounts with realistic data
- [ ] Populate policies for last 12 months
- [ ] Generate commission statements for last 6 months
- [ ] Add 20-30 upcoming renewal policies
- [ ] Create agency with 5-10 agent profiles for leaderboard

### 2. Environment Setup
- [ ] Deploy to staging environment
- [ ] Test all features work in staging
- [ ] Prepare screen recording software (Zoom, Loom, or similar)
- [ ] Test video/audio setup
- [ ] Prepare note-taking document

### 3. Test Materials
- [ ] Print this testing guide
- [ ] Prepare consent form (if recording)
- [ ] Gift card/compensation ready
- [ ] Backup device in case of technical issues

---

## 🧪 Test Script

### Introduction (5 minutes)

**Say:**
> "Thank you for joining! Today you'll explore a new agent dashboard we've built. I want to emphasize:
> - There are no wrong answers - we're testing the software, not you
> - Please think out loud - tell me what you're thinking as you use it
> - Be completely honest - critical feedback is the most valuable
> - If something is confusing, that's our fault, not yours
>
> Do you have any questions before we start?"

**Actions:**
- [ ] Start screen recording
- [ ] Share login credentials
- [ ] Ask agent to share their screen

---

### Part 1: First Impressions (5 minutes)

**Task:** "Please log in and tell me your first impressions."

**Observe:**
- Do they successfully log in?
- What do they notice first?
- Do they understand they're in an agent dashboard?
- Any confusion about navigation?

**Questions:**
- "What stands out to you on this page?"
- "What do you think this dashboard is for?"
- "Is there anything confusing?"

---

### Part 2: Dashboard Exploration (10 minutes)

**Task:** "Take a few minutes to explore your personal dashboard. Tell me what you see."

**Features to observe:**
- [ ] Do they notice their rank?
- [ ] Do they explore performance metrics?
- [ ] Do they understand the charts?
- [ ] Do they compare themselves to agency average?

**Questions:**
- "What information is most useful to you?"
- "What information is missing?"
- "How often would you check this dashboard?"
- "On a scale of 1-10, how useful is this dashboard?"

---

### Part 3: Commission Statements (8 minutes)

**Task:** "Imagine you want to check your commission statement from last month. Can you show me how you'd do that?"

**Observe:**
- [ ] Do they find "My Commissions" page?
- [ ] Can they filter by month?
- [ ] Do they understand breakdown by transaction type?
- [ ] Can they download a report?

**Questions:**
- "Is this easier or harder than how you currently check commissions?"
- "What additional information would you want to see?"
- "Would you use the CSV export? For what purpose?"

---

### Part 4: Leaderboard & Gamification (8 minutes)

**Task:** "Check out the leaderboard and see where you rank."

**Observe:**
- [ ] Do they find the leaderboard page?
- [ ] Do they understand the ranking?
- [ ] Are they interested in badges/achievements?
- [ ] Do they explore different leaderboard categories?

**Questions:**
- "How do you feel about seeing your rank?"
- "Would this motivate you? Why or why not?"
- "What badges interest you most?"
- "Are there any concerns about public rankings?"

---

### Part 5: Renewals & Policies (8 minutes)

**Task:** "You want to see which policies are coming up for renewal in the next 30 days. How would you find that?"

**Observe:**
- [ ] Do they find "My Policies" page?
- [ ] Can they filter by renewal date?
- [ ] Do they understand urgency indicators?
- [ ] Can they use the calendar view?

**Questions:**
- "Is this information you currently track manually?"
- "How would this change your renewal process?"
- "What's missing from this view?"

---

### Part 6: Notifications (5 minutes)

**Task:** "Check if you have any notifications."

**Observe:**
- [ ] Do they see the notification bell?
- [ ] Do they notice unread count?
- [ ] Can they interact with notifications?
- [ ] Do they find notification preferences?

**Questions:**
- "What types of notifications would you want?"
- "How often is too often for notifications?"
- "Email, in-app, or both?"

---

### Part 7: Overall Feedback (10 minutes)

**Questions:**

1. **Value Assessment**
   - "On a scale of 1-10, how valuable is this platform to your daily work?"
   - "What's the #1 most useful feature?"
   - "What's the #1 least useful feature?"

2. **Usability**
   - "On a scale of 1-10, how easy was it to use?"
   - "Was anything confusing or frustrating?"
   - "What would make this easier to use?"

3. **Missing Features**
   - "What features are missing that you expected to see?"
   - "What would you add if you could add one thing?"

4. **Adoption**
   - "Would you use this platform daily? Weekly? Monthly?"
   - "Would you recommend this to other agents?"
   - "What would make you more likely to use this regularly?"

5. **Competitive Comparison**
   - "Have you used similar tools before?"
   - "How does this compare to other platforms you've used?"

---

## 📊 Data to Collect

### Quantitative Metrics
- [ ] Time to complete each task
- [ ] Number of clicks to complete tasks
- [ ] Pages visited
- [ ] Features used vs. not used
- [ ] Error rate (how many times they got stuck)

### Qualitative Feedback
- [ ] Verbal feedback during session
- [ ] Facial expressions (confusion, delight, frustration)
- [ ] Navigation patterns
- [ ] Feature requests
- [ ] Pain points

### Rating Questions (1-10 scale)
- [ ] Overall satisfaction
- [ ] Ease of use
- [ ] Visual design
- [ ] Usefulness of information
- [ ] Likelihood to recommend
- [ ] Likelihood to use regularly

---

## 🐛 Bug Tracking

### For Each Bug Found:
- **Severity**: Critical / High / Medium / Low
- **Description**: What happened?
- **Steps to Reproduce**: How to recreate the bug?
- **Expected Behavior**: What should have happened?
- **Actual Behavior**: What actually happened?
- **Screenshot**: If applicable
- **Browser/Device**: What were they using?

### Bug Template:
```
**Bug #**:
**Severity**: [Critical/High/Medium/Low]
**Feature**: [Dashboard/Commissions/Leaderboard/etc]
**Description**:
**Steps to Reproduce**:
1.
2.
3.
**Expected**:
**Actual**:
**Screenshot**:
**Browser/Device**:
**User**: [Agent name]
```

---

## 📈 Success Metrics

### Testing is successful if:
- ✅ 80%+ of agents rate platform 7+ out of 10
- ✅ Agents complete core tasks without assistance
- ✅ No critical bugs found
- ✅ Agents express willingness to use platform regularly
- ✅ Clear feature priorities emerge from feedback

### Red Flags:
- ❌ Agents can't complete basic tasks
- ❌ Multiple critical bugs found
- ❌ Agents don't see value in platform
- ❌ Consistent confusion about navigation
- ❌ Performance issues (slow loading)

---

## 📝 Post-Test Actions

### Immediate (within 24 hours):
1. [ ] Send thank you email with gift card
2. [ ] Review session recordings
3. [ ] Document all bugs found
4. [ ] Create prioritized bug fix list
5. [ ] Update feature backlog based on feedback

### Short-term (within 1 week):
1. [ ] Fix critical bugs
2. [ ] Make quick usability improvements
3. [ ] Update documentation based on confusion points
4. [ ] Share findings with team
5. [ ] Plan next iteration

### Long-term (within 1 month):
1. [ ] Implement high-priority feature requests
2. [ ] Conduct follow-up testing
3. [ ] Prepare for broader rollout
4. [ ] Create training materials
5. [ ] Plan marketing/onboarding strategy

---

## 🎁 Thank You Email Template

```
Subject: Thank You for Testing Our Agent Dashboard!

Hi [Agent Name],

Thank you so much for taking the time to test our new agent dashboard today! Your feedback was incredibly valuable and will directly improve the platform.

As promised, here's your $50 Amazon gift card: [GIFT CARD CODE]

A few highlights from your session:
- [Something specific they said or did]
- [Another insight from their feedback]

We'll be rolling out improvements based on your feedback over the next few weeks. You'll be among the first to get access when we launch!

If you think of anything else you'd like to see, feel free to reply to this email.

Thanks again for your time and insights!

Best regards,
[Your Name]
```

---

## 📚 Additional Resources

### Recommended Reading:
- **Steve Krug** - "Don't Make Me Think" (usability testing)
- **Jakob Nielsen** - 10 Usability Heuristics
- **IDEO** - Human-Centered Design Toolkit

### Tools for Testing:
- **Screen recording**: Zoom, Loom, OBS Studio
- **Note-taking**: Google Docs, Notion, Airtable
- **Bug tracking**: GitHub Issues, Jira, Linear
- **Analysis**: Miro, Figma (for journey mapping)

---

## ✅ Testing Checklist

**Before Testing:**
- [ ] Test data prepared
- [ ] Environment working
- [ ] Recording setup tested
- [ ] Test script printed
- [ ] Participants scheduled
- [ ] Compensation ready

**During Testing:**
- [ ] Recording started
- [ ] Consent obtained
- [ ] Notes taken
- [ ] All tasks completed
- [ ] Feedback collected
- [ ] Recording stopped

**After Testing:**
- [ ] Thank you sent
- [ ] Bugs documented
- [ ] Recordings reviewed
- [ ] Findings summarized
- [ ] Next steps planned

---

**End of User Testing Guide**
