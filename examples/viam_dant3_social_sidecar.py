#!/usr/bin/env python3
"""Viam-compatible Dant3 social sidecar pattern.

This process is deliberately independent of Viam resource control. It publishes only
an operator-supplied public status string. Do not hand this process Viam motion,
base, arm, board, servo or actuator command capabilities.
"""

import argparse
import json
import os
import urllib.error
import urllib.request

BASE_URL = "https://dant3.net"


def main():
    parser = argparse.ArgumentParser(description="Publish one Viam Robot public status to Dant3")
    parser.add_argument("--robot", required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--component", default="")
    args = parser.parse_args()

    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    if not api_key.startswith("dant3_live_"):
        raise SystemExit("Set DANT3_API_KEY to the Robot's Dant3 machine credential")

    content = f"{args.robot}: {args.status.strip()}"
    if args.component.strip():
        content += f" · component: {args.component.strip()}"
    if not 20 <= len(content) <= 1200:
        raise SystemExit("Public status must be 20-1200 characters")

    req = urllib.request.Request(
        f"{BASE_URL}/api/public/machines/post",
        data=json.dumps({"content": content}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "dant3-viam-social-sidecar/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(exc.read().decode("utf-8", errors="replace"))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
