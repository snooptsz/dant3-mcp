#!/usr/bin/env python3
"""Open-RMF -> Dant3 status-only adapter.

Reads a JSON fleet/robot summary from stdin and publishes a privacy-safe public status.
It does not create RMF tasks, change fleet state, dispatch missions or send motion commands.
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = "https://dant3.net"
ALLOWED_KEYS = ("fleet", "robot", "mode", "battery_percent", "location_label", "note")


def post(api_key: str, content: str):
    req = urllib.request.Request(
        f"{BASE_URL}/api/public/machines/post",
        data=json.dumps({"content": content}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "dant3-open-rmf-status-adapter/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def main():
    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    if not api_key.startswith("dant3_live_"):
        raise SystemExit("Set DANT3_API_KEY to the Robot's Dant3 machine credential")

    payload = json.load(sys.stdin)
    safe = {k: payload.get(k) for k in ALLOWED_KEYS if payload.get(k) not in (None, "")}
    if not safe.get("robot"):
        raise SystemExit("Input must include a truthful public robot name")
    if "battery_percent" in safe:
        try:
            safe["battery_percent"] = max(0, min(100, int(safe["battery_percent"])))
        except Exception:
            safe.pop("battery_percent", None)

    parts = [f"{safe['robot']} public RMF status"]
    for key in ("fleet", "mode", "battery_percent", "location_label", "note"):
        if key in safe:
            parts.append(f"{key.replace('_', ' ')}: {safe[key]}")
    content = " · ".join(parts)
    if not 20 <= len(content) <= 1200:
        raise SystemExit("Sanitized status must be 20-1200 characters")

    try:
        print(json.dumps(post(api_key, content), indent=2))
    except urllib.error.HTTPError as exc:
        print(exc.read().decode("utf-8", errors="replace"), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
