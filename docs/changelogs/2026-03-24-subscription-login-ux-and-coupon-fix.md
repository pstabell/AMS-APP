# 2026-03-24 — Subscription Login UX & 100% Coupon Fix

## Changes

### 1. Status-Specific Login Error Messages
**File**: `auth_helpers.py` — `show_login_form()`

Users with a non-active subscription status now see actionable, status-specific error messages instead of a generic "No active subscription found" error.

| Status | Previous Message | New Message |
|--------|-----------------|-------------|
| `past_due` | "No active subscription found." | "Your payment is past due… update your payment method" |
| `cancelled` | "No active subscription found." | "Your subscription has been cancelled. Start a new trial above." |
| other | "No active subscription found." | "Account status: {status} — Use Start Free Trial above." |

**Why it matters**: `past_due` users are recoverable — they already paid once. Showing a vague error causes churn. With a clear message they know to check their email for Stripe's payment failure notice. `cancelled` users are reminded they can resubscribe.

### 2. `payment_method_collection='if_required'` in Stripe Checkout
**File**: `auth_helpers.py` — `show_subscribe_tab()`

Added `payment_method_collection='if_required'` to the Stripe checkout session creation. This fixes the documented issue in `docs/STRIPE_100_PERCENT_COUPON_ISSUE.md` where applying a 100% off promo code still forced users to enter a payment method, causing checkout failures for internal/demo accounts.

**Before**: Comment said "Remove payment_method_collection — default behavior requires payment method" (no param set, so Stripe always collected card).
**After**: Explicitly set to `'if_required'` so Stripe skips card collection when the total is $0.

## Files Changed
- `auth_helpers.py`

## Testing
- Verified via `python -c "import auth_helpers"` (syntax check)
- Login flow logic reviewed manually — only the error display branch is affected, success path unchanged
- Checkout change is additive (a single new parameter); existing paid checkouts are unaffected since `'if_required'` still collects payment when a charge is due
