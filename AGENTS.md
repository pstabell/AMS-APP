# AMS-APP Next.js Rewrite - Agent Instructions

## Project Overview

This is a complete rewrite of AMS-APP (Agency Management System / Agent Commission Tracker) from Python/Streamlit to Next.js/React for hosting on Vercel.

**Original App:** `C:\Users\Patri\clawd\AMS-APP` (Python/Streamlit)
**New App:** This folder (Next.js/TypeScript/React)

## Architecture

### Two-Floor House Model
- **Floor 1 (ACT):** Agent Commission Tracker — agents track their own commissions
- **Floor 2 (AMS):** Agency Management System — agency owners see everything above floor 1

### Tech Stack
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase PostgreSQL (EXISTING - do not modify schema)
- **Auth:** Custom auth system (email/password, stored in Supabase users table)
- **Payments:** Stripe (subscriptions)
- **Hosting:** Vercel

## Database Connection

The app connects to an EXISTING Supabase database. Do NOT create new tables or modify schema.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Key Database Tables (Existing)

- `policies` - Main transaction data
- `users` - User accounts (custom auth, not Supabase Auth)
- `deleted_policies` - Soft-deleted records
- `manual_commission_entries` - Reconciliation entries
- `carriers` - Insurance carriers
- `mgas` - Managing General Agents
- `commission_rules` - Commission rate rules
- `user_policy_types` - User-specific policy types
- `user_preferences` - User settings
- `user_column_mapping` - Custom column mappings
- `user_prl_templates` - Report templates

## Features to Implement (in order)

### Phase 1: Core Infrastructure
1. Supabase client setup
2. Auth system (login, signup, logout, session management)
3. Protected routes middleware
4. Basic layout with navigation

### Phase 2: Dashboard & CRUD
1. Dashboard with commission overview
2. Add New Policy form
3. Edit Policy form
4. Policy list view
5. Search & filter

### Phase 3: Commission Logic
1. Commission calculation engine
2. Transaction type handling (NEW, RWL, END, CAN, etc.)
3. Agent commission rates by transaction type
4. Policy Revenue Ledger view

### Phase 4: Reconciliation
1. Statement upload (CSV, Excel)
2. Transaction matching
3. Double-entry accounting (credits vs debits)
4. Reconciliation history

### Phase 5: Reports & Export
1. Custom report builder
2. CSV/Excel export
3. Report templates
4. Date filtering

### Phase 6: Admin & Settings
1. Admin panel
2. Column mapping configuration
3. Commission rules management
4. User settings

### Phase 7: Agency Platform
1. Multi-tenant support
2. Agency dashboard
3. Team management

## Commission Calculation Rules

### Agent Rates by Transaction Type
| Type | Description | Agent Rate |
|------|-------------|------------|
| NEW | New Business | 50% |
| NBS | New Business Special | 50% |
| RWL | Renewal | 25% |
| END | Endorsement | 50% or 25%* |
| PCH | Policy Change | 50% or 25%* |
| CAN | Cancellation | 0% |
| XCL | Excluded | 0% |

*If Policy Origination Date = Effective Date → 50%, else 25%

### Formulas
```
Agency Commission = Premium × Policy Gross Comm %
Agent Commission = Agency Commission × Agent Rate
Balance Due = Agent Estimated Comm - Agent Paid Amount
```

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── page.tsx (dashboard)
│   │   ├── policies/
│   │   ├── reconciliation/
│   │   ├── reports/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/
│   │   └── policies/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (reusable components)
│   ├── forms/
│   └── tables/
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── calculations.ts
│   └── utils.ts
├── hooks/
├── types/
└── styles/
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Important Notes

1. **Data Safety:** All data exists in Supabase. We're only rebuilding the UI.
2. **User Isolation:** Each user sees only their own data (user_email/user_id filtering)
3. **No Supabase Auth:** App uses custom auth stored in `users` table
4. **Double-Entry Accounting:** Reconciliation creates NEW transactions, never modifies originals
5. **Mobile Responsive:** UI must work on mobile devices

## Reference

The original Python app is at `C:\Users\Patri\clawd\AMS-APP`. Key files:
- `commission_app.py` - Main application (25K+ lines)
- `auth_helpers.py` - Authentication logic
- `pages/*.py` - Additional page modules
- `docs/` - Extensive documentation
