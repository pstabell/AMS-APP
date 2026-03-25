# 2026-03-24 — Webhook: Fix subscription_tier always written as "legacy"

## Problem

New and re-activated Stripe checkout subscribers were always persisted with
`subscription_tier='legacy'` in the `users` table, even when they subscribed
to a known plan.  This made it impossible to enforce per-tier feature gating
in the future and hid which plan each paying user was actually on.

## Root Cause

`webhook_server.py` hardcoded `subscription_tier='legacy'` on both the
`INSERT` (new user) and `UPDATE` (re-activation) paths inside the
`checkout.session.completed` handler.  The Stripe price ID was fetched from
the subscription object but never stored or used.

## Fix

### New helpers in `webhook_server.py`

| Function | Purpose |
|---|---|
| `_resolve_tier_from_price_id(price_id)` | Maps a Stripe price ID to a tier name using env vars; returns `None` when unrecognised so callers fall back to `'legacy'`. |
| `_get_subscription_info_from_stripe(subscription_id, session)` | Returns `(status, price_id)` tuple.  Replaces the single-value `_get_subscription_status_from_stripe()` call in the checkout handler. |

`_get_subscription_status_from_stripe()` is kept as a backward-compatible
wrapper so existing tests continue to pass unchanged.

### Tier resolution priority

1. `STRIPE_PRICE_ID_BASIC`, `STRIPE_PRICE_ID_PLUS`, `STRIPE_PRICE_ID_PRO`
   env vars — explicit per-tier mapping.
2. Generic `STRIPE_PRICE_ID` env var → mapped to `'basic'` (current
   single-plan default).
3. Unknown / absent price ID → `'legacy'` (pre-tier subscribers, free
   demo accounts, or any checkout where Stripe is unreachable).

### DB fields now written on checkout

Both the `INSERT` (new user) and `UPDATE` (re-activation) paths now persist:
- `subscription_tier` — resolved tier or `'legacy'`
- `stripe_price_id` — raw Stripe price ID (nullable)

## Files Changed

- `webhook_server.py` — new helpers, updated checkout handler
- `test_webhook_subscription_status.py` — 9 new tests covering
  `_resolve_tier_from_price_id` and `_get_subscription_info_from_stripe`

## Prevention

Env vars `STRIPE_PRICE_ID_BASIC` / `_PLUS` / `_PRO` should be set on Render
alongside `STRIPE_PRICE_ID` so tiers resolve correctly for multi-plan setups.
For the current single-plan deployment the generic `STRIPE_PRICE_ID` is
sufficient — new subscribers will receive `subscription_tier='basic'`.
