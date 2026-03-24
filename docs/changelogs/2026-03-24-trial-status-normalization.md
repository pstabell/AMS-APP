# Trial Status Normalization Fix

**Date:** 2026-03-24
**Version:** Maintenance patch (post v4.4.0)
**Files changed:** `auth_helpers.py`, `commission_app.py`

---

## Problem

Agency users created via `agency_auth_helpers.py` are assigned `subscription_status = 'trial'`
(a non-Stripe value used for direct agency signups). However, the login gate and subscription
helper in `auth_helpers.py` only accepted `'active'` and `'trialing'` as valid active statuses.

This meant agency users were silently auto-logged in at signup (session state bypass), but any
subsequent login attempt after logout would fail with the generic "No active subscription found"
error — even though their account was legitimately in a trial period.

The account page in `commission_app.py` also showed "❌ No active subscription" for `'trial'`
users instead of the trial-appropriate message.

---

## Root Cause

Three locations hardcoded `('active', 'trialing')` without including `'trial'`:

| File | Location | Issue |
|---|---|---|
| `auth_helpers.py` | `check_subscription_status()` line ~19 | `is_active` returned `False` for `'trial'` |
| `auth_helpers.py` | `show_login_form()` line ~268 | Login gate blocked `'trial'` users |
| `commission_app.py` | Account page status display line ~17782 | `'trial'` fell into `else` → "❌ No active subscription" |

---

## Fix (Surgical)

### `auth_helpers.py`

1. **`check_subscription_status()`** — added `'trial'` to `is_active` tuple:
   ```python
   'is_active': user.get('subscription_status') in ('active', 'trialing', 'trial')
   ```

2. **`show_login_form()` login gate** — added `'trial'` to acceptance tuple:
   ```python
   if user.get('subscription_status') in ('active', 'trialing', 'trial'):
   ```

3. **Login error block** — added explicit `'trial'`/`'trialing'` branch as a safety net for
   edge cases (DB inconsistency), guiding users to contact support rather than showing a
   confusing "no subscription" error.

### `commission_app.py`

4. **Account page** — merged `'trial'` into the `'trialing'` branch:
   ```python
   elif subscription_status in ('trialing', 'trial'):
   ```
   Also added a `try/except` around the date math to handle users without a `created_at`
   value and a `max(..., 0)` guard so days-remaining never goes negative.

---

## Status Values in the System

| Value | Source | Meaning |
|---|---|---|
| `'active'` | Stripe / webhook on checkout | Paid subscription active |
| `'trialing'` | Stripe `customer.subscription.updated` | Stripe-managed 14-day trial |
| `'trial'` | `agency_auth_helpers.py` direct signup | Agency owner trial (not Stripe-managed) |
| `'past_due'` | Stripe / `invoice.payment_failed` | Payment failed, access suspended |
| `'cancelled'` | webhook `customer.subscription.deleted` | Subscription ended |

---

## Verification

All four audited files pass Python AST syntax check:
```
auth_helpers.py: OK
commission_app.py: OK
webhook_server.py: OK
agency_auth_helpers.py: OK
```

No schema changes. No new tables. No breaking changes to existing `'active'`/`'trialing'` flow.
