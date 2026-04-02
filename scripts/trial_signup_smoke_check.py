#!/usr/bin/env python3
"""Smoke-check the AMS-APP trial signup stack.

This script is intentionally lightweight so it can run in CI, on Render shells,
or from a local workstation without extra dependencies.

Checks performed:
1. Reachability of the public app URL.
2. Reachability of the public webhook health URL.
3. Multi-endpoint probing of the public webhook service to distinguish
   "wrong path" from "wrong deployment / service misconfiguration".
4. Presence of the key local environment variables needed for a live e2e test.
5. Local Flask route verification for webhook_server /health.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

APP_URL = os.getenv("RENDER_APP_URL", "https://commission-tracker-app.onrender.com")
WEBHOOK_URL = os.getenv(
    "RENDER_WEBHOOK_URL",
    "https://commission-tracker-webhook.onrender.com/health",
)
WEBHOOK_BASE_URL = os.getenv(
    "RENDER_WEBHOOK_BASE_URL",
    WEBHOOK_URL.rsplit("/health", 1)[0] if WEBHOOK_URL.endswith("/health") else WEBHOOK_URL.rstrip("/"),
)
WEBHOOK_DIAGNOSTIC_PATHS = ["/", "/health", "/test", "/stripe-webhook"]

LIVE_E2E_ENV_VARS = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID",
    "RESEND_API_KEY",
    "SUPABASE_SERVICE_KEY",
]

OPTIONAL_ENV_VARS = [
    "APP_ENVIRONMENT",
    "PRODUCTION_SUPABASE_URL",
    "PRODUCTION_SUPABASE_ANON_KEY",
    "PRODUCTION_SUPABASE_SERVICE_KEY",
]


def fetch_url(url: str, timeout: int = 15) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "AMS-APP Trial Signup Smoke Check/1.0",
            "Accept": "application/json,text/plain,*/*",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(512).decode("utf-8", errors="replace")
            return {
                "ok": 200 <= response.status < 400,
                "status": response.status,
                "reason": getattr(response, "reason", "OK"),
                "body_preview": body,
            }
    except urllib.error.HTTPError as exc:
        body = exc.read(512).decode("utf-8", errors="replace")
        return {
            "ok": False,
            "status": exc.code,
            "reason": exc.reason,
            "body_preview": body,
        }
    except Exception as exc:  # pragma: no cover - defensive failure reporting
        return {
            "ok": False,
            "status": None,
            "reason": type(exc).__name__,
            "body_preview": str(exc),
        }


def inspect_env_var(name: str) -> dict[str, Any]:
    value = os.getenv(name)
    return {
        "present": bool(value),
        "length": len(value) if value else 0,
    }


def build_webhook_diagnostic_urls(base_url: str) -> list[str]:
    normalized = base_url.rstrip("/")
    if not normalized:
        return []
    return [f"{normalized}{path}" if path != "/" else f"{normalized}/" for path in WEBHOOK_DIAGNOSTIC_PATHS]


def diagnose_public_webhook(base_url: str) -> dict[str, Any]:
    endpoints = {url: fetch_url(url) for url in build_webhook_diagnostic_urls(base_url)}
    any_ok = any(result["ok"] for result in endpoints.values())
    statuses = [result["status"] for result in endpoints.values() if result["status"] is not None]
    all_404 = bool(statuses) and all(status == 404 for status in statuses)

    if any_ok:
        likely_cause = "Webhook service is reachable; the configured health URL may be wrong."
    elif all_404:
        likely_cause = (
            "All probed webhook endpoints returned 404. The Render service is likely misrouted, "
            "pointing at the wrong app, or not using webhook_server:app."
        )
    else:
        likely_cause = "Webhook service is unavailable or failing before route handling."

    return {
        "base_url": base_url,
        "probed_endpoints": endpoints,
        "any_ok": any_ok,
        "all_404": all_404,
        "likely_cause": likely_cause,
    }


def check_local_dependencies() -> dict[str, Any]:
    required_modules = ["flask", "stripe", "supabase"]
    missing = []

    for module_name in required_modules:
        try:
            __import__(module_name)
        except Exception:
            missing.append(module_name)

    return {
        "ok": not missing,
        "missing_modules": missing,
    }


def check_local_webhook_route() -> dict[str, Any]:
    dependency_check = check_local_dependencies()
    if not dependency_check["ok"]:
        return {
            "ok": False,
            "status": None,
            "payload": "Local Python dependencies missing for webhook import",
            "dependency_check": dependency_check,
        }

    try:
        from webhook_server import app

        with app.test_client() as client:
            response = client.get("/health")
            payload = response.get_json(silent=True)
            return {
                "ok": response.status_code == 200,
                "status": response.status_code,
                "payload": payload,
                "dependency_check": dependency_check,
            }
    except Exception as exc:  # pragma: no cover - defensive failure reporting
        return {
            "ok": False,
            "status": None,
            "payload": str(exc),
            "dependency_check": dependency_check,
        }


def main() -> int:
    report = {
        "app_url": APP_URL,
        "webhook_health_url": WEBHOOK_URL,
        "webhook_base_url": WEBHOOK_BASE_URL,
        "public_checks": {
            "app": fetch_url(APP_URL),
            "webhook_health": fetch_url(WEBHOOK_URL),
            "webhook_diagnostics": diagnose_public_webhook(WEBHOOK_BASE_URL),
        },
        "env": {
            "required_for_live_e2e": {name: inspect_env_var(name) for name in LIVE_E2E_ENV_VARS},
            "optional_context": {name: inspect_env_var(name) for name in OPTIONAL_ENV_VARS},
        },
        "local_checks": {
            "webhook_health_route": check_local_webhook_route(),
        },
    }

    missing_required = [
        name for name, details in report["env"]["required_for_live_e2e"].items() if not details["present"]
    ]
    report["summary"] = {
        "public_app_ok": report["public_checks"]["app"]["ok"],
        "public_webhook_ok": report["public_checks"]["webhook_health"]["ok"],
        "public_webhook_any_endpoint_ok": report["public_checks"]["webhook_diagnostics"]["any_ok"],
        "public_webhook_all_probed_endpoints_404": report["public_checks"]["webhook_diagnostics"]["all_404"],
        "public_webhook_likely_cause": report["public_checks"]["webhook_diagnostics"]["likely_cause"],
        "local_webhook_ok": report["local_checks"]["webhook_health_route"]["ok"],
        "missing_required_env_vars": missing_required,
        "ready_for_live_e2e": (
            report["public_checks"]["app"]["ok"]
            and report["public_checks"]["webhook_health"]["ok"]
            and report["local_checks"]["webhook_health_route"]["ok"]
            and not missing_required
        ),
    }

    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["summary"]["ready_for_live_e2e"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
