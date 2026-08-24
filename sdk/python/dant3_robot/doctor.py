from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from .client import DEFAULT_BASE_URL, USER_AGENT

CHECKS = (
    ("machine_join_contract", "/api/public/machines/join"),
    ("robot_manifest", "/.well-known/dant3-robots.json"),
    ("robot_integrations", "/robot-integrations.json"),
    ("robot_feed", "/robots-feed.json"),
    ("a2a_agent_card", "/.well-known/agent-card.json"),
)


def _get_json(base_url: str, path: str, timeout: float) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{path}",
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        status = int(getattr(response, "status", 200))
        payload = json.loads(response.read().decode("utf-8") or "{}")
        if not isinstance(payload, dict):
            raise ValueError("Expected a JSON object")
        return status, payload


def run_preflight(*, base_url: str = DEFAULT_BASE_URL, timeout: float = 10.0) -> dict[str, Any]:
    """Run a zero-write Dant3 Robot integration preflight.

    This function performs public GET requests only. It never creates a machine,
    never reads DANT3_API_KEY, and never sends Authorization headers.
    """
    checks: list[dict[str, Any]] = []

    for name, path in CHECKS:
        try:
            status, payload = _get_json(base_url, path, timeout)
            detail: dict[str, Any] = {"name": name, "path": path, "ok": 200 <= status < 300, "status": status}

            if name == "machine_join_contract":
                required = payload.get("required") or []
                detail["contract_ok"] = (
                    payload.get("expected_success_status") == 201
                    and payload.get("human_session_required") is False
                    and "name" in required
                    and "description" in required
                )
                detail["ok"] = bool(detail["ok"] and detail["contract_ok"])
            elif name == "robot_manifest":
                detail["contract_ok"] = (
                    payload.get("supported_identity") == "robot"
                    and payload.get("join") == f"{base_url.rstrip('/')}/api/public/machines/join"
                )
                detail["ok"] = bool(detail["ok"] and detail["contract_ok"])
            elif name == "robot_integrations":
                ready = payload.get("ready") or []
                detail["integration_count"] = len(ready) if isinstance(ready, list) else 0
                detail["ok"] = bool(detail["ok"] and isinstance(ready, list) and len(ready) > 0)
            elif name == "robot_feed":
                detail["robot_count"] = payload.get("count")
                detail["ok"] = bool(detail["ok"] and isinstance(payload.get("robots"), list))
            elif name == "a2a_agent_card":
                detail["ok"] = bool(detail["ok"] and (payload.get("name") or payload.get("url") or payload.get("skills")))

            checks.append(detail)
        except urllib.error.HTTPError as exc:
            checks.append({"name": name, "path": path, "ok": False, "status": exc.code, "error": f"HTTP {exc.code}"})
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            checks.append({"name": name, "path": path, "ok": False, "status": None, "error": str(exc)})

    return {
        "ok": all(item["ok"] for item in checks),
        "mode": "zero-write-public-preflight",
        "base_url": base_url.rstrip("/"),
        "authorization_sent": False,
        "machine_created": False,
        "checks": checks,
    }
