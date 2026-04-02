# Trial Signup Smoke Check Snapshot

Generated at: 2026-04-02T05:17:10.778608+00:00
Ready for live e2e: NO

## Public checks
- App URL: https://commission-tracker-app.onrender.com -> 200 OK
- Webhook health: https://commission-tracker-webhook.onrender.com/health -> 404 Not Found
- Webhook root: https://commission-tracker-webhook.onrender.com/ -> 404 Not Found
- Any webhook endpoint OK: NO
- All probed webhook endpoints 404: YES
- Likely webhook cause: All probed webhook endpoints returned 404. The Render service is likely misrouted, pointing at the wrong app, or not using webhook_server:app.

## Local checks
- Local webhook route OK: NO
- Local webhook payload: Local Python dependencies missing for webhook import

## Missing required env vars
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID
- RESEND_API_KEY
- SUPABASE_SERVICE_KEY

## Probe previews
- Webhook health preview: Not Found

- Webhook root preview: Not Found

