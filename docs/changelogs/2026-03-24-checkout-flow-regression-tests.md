# 2026-03-24 — Checkout Flow Regression Tests

## What changed

Added `test_checkout_flow.py` with 20 unit tests covering the solo-agent Stripe
checkout path in `auth_helpers.py`.  Also extracted two pure helper functions
from the inline Streamlit form logic to make the critical business rules testable
without a running Streamlit or Stripe environment.

## New helpers in `auth_helpers.py`

| Function | Purpose |
|---|---|
| `_validate_legal_acceptance(agree_terms, agree_privacy)` | Returns an error string if either checkbox is unticked, else `None` |
| `_build_checkout_kwargs(email, accepted_at, price_id, app_url)` | Returns the full kwargs dict for `stripe.checkout.Session.create` (pure, no side-effects) |

`show_subscribe_tab()` now delegates to these helpers; behaviour is unchanged.

## Tests added (`test_checkout_flow.py`)

### `TestValidateLegalAcceptance` (5 tests)
- Both accepted → `None`
- Terms not accepted → error mentioning "Terms of Service"
- Privacy not accepted → error mentioning "Privacy Policy"
- Both unticked → Terms error takes priority
- Error values are strings (safe for `st.error`)

### `TestBuildCheckoutKwargs` (14 tests)
- `subscription_data.trial_period_days == 14`
- `mode == 'subscription'`
- `payment_method_collection == 'if_required'`
- `metadata.accepted_terms == 'true'`
- `metadata.accepted_privacy == 'true'`
- `metadata.accepted_at` passes through unchanged
- `metadata.terms_version` and `privacy_version` present
- `customer_email`, `line_items[0].price`, `allow_promotion_codes` correct
- `success_url` contains `{CHECKOUT_SESSION_ID}` placeholder
- `cancel_url` equals `app_url`

### `TestCheckoutSessionCreateCalledCorrectly` (1 test)
- End-to-end mock: verifies `stripe.checkout.Session.create` receives
  `trial_period_days=14`, `payment_method_collection='if_required'`, and the
  legal-acceptance metadata in a single call.

## How to run

```bash
python3 -m unittest test_checkout_flow test_webhook_subscription_status -v
```

Total: 35 tests, all green, no external dependencies required.
