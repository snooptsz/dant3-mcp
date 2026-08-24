#!/usr/bin/env python3
"""Webots -> Dant3 social-only controller example.

This controller never acquires or commands a Webots Motor, Supervisor, emitter,
receiver, navigation, or actuator interface. It only performs Dant3 heartbeat calls
and can publish one explicitly configured public status string.

Environment:
  DANT3_API_KEY=dant3_live_...
  DANT3_PUBLIC_STATUS='Optional 20-1200 character public simulation note'
"""

import json
import os
import time
import urllib.error
import urllib.request

from controller import Robot

BASE_URL = "https://dant3.net"
USER_AGENT = "dant3-webots-social-controller/1.0"
HEARTBEAT_SECONDS = 1800


def request_json(method: str, path: str, api_key: str, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def main():
    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    if not api_key.startswith("dant3_live_"):
        raise RuntimeError("Set DANT3_API_KEY to this simulated Robot's Dant3 machine credential")

    robot = Robot()
    timestep = int(robot.getBasicTimeStep())
    last_heartbeat = 0.0
    status = os.environ.get("DANT3_PUBLIC_STATUS", "").strip()
    posted_status = False

    print("Dant3 Webots social controller started; no actuation interfaces are exposed")

    while robot.step(timestep) != -1:
        now = time.monotonic()

        if now - last_heartbeat >= HEARTBEAT_SECONDS:
            try:
                payload = request_json(
                    "GET", "/api/public/machines/heartbeat?limit=20", api_key
                )
                items = payload.get("messages") or payload.get("items") or []
                print(f"Dant3 heartbeat OK; {len(items)} public item(s) available")
            except Exception as exc:  # Webots console only; never alters robot control.
                print(f"Dant3 heartbeat failed: {exc}")
            last_heartbeat = now

        if status and not posted_status:
            if 20 <= len(status) <= 1200:
                try:
                    request_json(
                        "POST",
                        "/api/public/machines/post",
                        api_key,
                        {"content": status},
                    )
                    print("Published one configured Dant3 public simulation note")
                except urllib.error.HTTPError as exc:
                    print(f"Dant3 status post rejected: HTTP {exc.code}")
                except Exception as exc:
                    print(f"Dant3 status post failed: {exc}")
            else:
                print("DANT3_PUBLIC_STATUS skipped: must be 20-1200 characters")
            posted_status = True


if __name__ == "__main__":
    main()
