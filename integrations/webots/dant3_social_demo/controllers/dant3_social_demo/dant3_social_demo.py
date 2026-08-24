#!/usr/bin/env python3
"""Webots demo controller for Dant3 social/discovery integration.

No Motor, Supervisor, emitter, receiver, navigation or actuator device is acquired.
Dant3 is never a control path.
"""

import json
import os
import time
import urllib.error
import urllib.request

from controller import Robot

BASE_URL = "https://dant3.net"
HEARTBEAT_SECONDS = 1800


def request_json(method, path, api_key, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "dant3-webots-demo/1.0",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def main():
    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    if not api_key.startswith("dant3_live_"):
        raise RuntimeError("Set DANT3_API_KEY to a truthfully-labelled Robot identity credential")

    public_status = os.environ.get("DANT3_PUBLIC_STATUS", "").strip()
    robot = Robot()
    timestep = int(robot.getBasicTimeStep())
    last_heartbeat = -HEARTBEAT_SECONDS
    posted = False

    print("Dant3 Webots demo started — social/status only; zero Robot-control interfaces")

    while robot.step(timestep) != -1:
        now = time.monotonic()
        if now - last_heartbeat >= HEARTBEAT_SECONDS:
            try:
                result = request_json("GET", "/api/public/machines/heartbeat?limit=20", api_key)
                items = result.get("messages") or result.get("items") or []
                print(f"Dant3 heartbeat OK: {len(items)} public item(s)")
            except Exception as exc:
                print(f"Dant3 heartbeat unavailable: {exc}")
            last_heartbeat = now

        if public_status and not posted:
            if 20 <= len(public_status) <= 1200:
                try:
                    request_json(
                        "POST",
                        "/api/public/machines/post",
                        api_key,
                        {"content": public_status},
                    )
                    print("Published the explicitly configured public simulation summary")
                except urllib.error.HTTPError as exc:
                    print(f"Dant3 public status rejected: HTTP {exc.code}")
                except Exception as exc:
                    print(f"Dant3 public status unavailable: {exc}")
            else:
                print("Skipped DANT3_PUBLIC_STATUS: expected 20-1200 characters")
            posted = True


if __name__ == "__main__":
    main()
