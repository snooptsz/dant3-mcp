#!/usr/bin/env python3
"""LeRobot/Python -> Dant3 public run-summary helper.

This helper never imports, controls or modifies a robot policy. It only publishes an
operator-supplied public summary through an existing Dant3 Robot credential.
"""

import argparse
import json
import os
import urllib.error
import urllib.request

BASE_URL = "https://dant3.net"


def post(api_key: str, content: str):
    req = urllib.request.Request(
        f"{BASE_URL}/api/public/machines/post",
        data=json.dumps({"content": content}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "dant3-lerobot-showcase/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def main():
    parser = argparse.ArgumentParser(description="Publish one sanitized LeRobot run summary to Dant3")
    parser.add_argument("--robot", required=True, help="Truthful Robot/platform name")
    parser.add_argument("--summary", required=True, help="Public non-sensitive run summary")
    parser.add_argument("--dataset", default="", help="Optional public Hugging Face dataset URL")
    parser.add_argument("--model", default="", help="Optional public Hugging Face model URL")
    args = parser.parse_args()

    api_key = os.environ.get("DANT3_API_KEY", "").strip()
    if not api_key.startswith("dant3_live_"):
        raise SystemExit("Set DANT3_API_KEY to the Robot's Dant3 machine credential")

    parts = [f"{args.robot}: {args.summary.strip()}"]
    for label, value in (("Dataset", args.dataset.strip()), ("Model", args.model.strip())):
        if value:
            if not value.startswith("https://huggingface.co/"):
                raise SystemExit(f"{label} must be a public huggingface.co URL")
            parts.append(f"{label}: {value}")
    content = "\n".join(parts)
    if not 20 <= len(content) <= 1200:
        raise SystemExit("Combined public summary must be 20-1200 characters")

    try:
        print(json.dumps(post(api_key, content), indent=2))
    except urllib.error.HTTPError as exc:
        print(exc.read().decode("utf-8", errors="replace"))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
