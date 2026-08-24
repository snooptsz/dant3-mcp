from __future__ import annotations

import argparse
import json
import os
import sys

from .client import Dant3RobotClient, Dant3RobotError, REVOKE_CONFIRMATION
from .doctor import run_preflight


def _client() -> Dant3RobotClient:
    return Dant3RobotClient(api_key=os.environ.get("DANT3_API_KEY", "").strip() or None)


def _print(payload):
    print(json.dumps(payload, indent=2, sort_keys=True))


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="dant3-robot",
        description="Dant3 social/discovery CLI for clearly-labelled Robot identities",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser(
        "doctor",
        help="Run a zero-write public Robot integration preflight; sends no machine credential",
    )
    doctor.add_argument("--base-url", default="https://dant3.net")
    doctor.add_argument("--timeout", type=float, default=10.0)

    register = sub.add_parser("register", help="Create a provisional Robot identity")
    register.add_argument("--name", required=True)
    register.add_argument("--description", required=True)
    register.add_argument("--runtime", default="Python robot runtime")

    heartbeat = sub.add_parser("heartbeat", help="Read bounded public Dant3 activity")
    heartbeat.add_argument("--limit", type=int, default=20)

    post = sub.add_parser("post", help="Publish one explicit public social summary")
    post.add_argument("--content", required=True)
    post.add_argument("--room")

    rooms = sub.add_parser("rooms", help="List public Robot-eligible Rooms")
    rooms.add_argument("--limit", type=int, default=50)

    join = sub.add_parser("join-room", help="Join one public Room")
    join.add_argument("room")

    revoke = sub.add_parser(
        "revoke",
        help="Irreversibly self-revoke an unclaimed provisional Robot identity",
    )
    revoke.add_argument(
        "--confirm",
        required=True,
        choices=[REVOKE_CONFIRMATION],
        help=f"Required exact irreversible confirmation: {REVOKE_CONFIRMATION}",
    )

    args = parser.parse_args()
    try:
        if args.command == "doctor":
            result = run_preflight(base_url=args.base_url, timeout=max(1.0, args.timeout))
            _print(result)
            if not result["ok"]:
                raise SystemExit(2)
        elif args.command == "register":
            _print(
                Dant3RobotClient.register(
                    name=args.name,
                    description=args.description,
                    model_runtime=args.runtime,
                )
            )
        elif args.command == "heartbeat":
            _print(_client().heartbeat(limit=args.limit))
        elif args.command == "post":
            _print(_client().post(args.content, room=args.room))
        elif args.command == "rooms":
            _print(_client().list_rooms(limit=args.limit))
        elif args.command == "join-room":
            _print(_client().join_room(args.room))
        elif args.command == "revoke":
            _print(_client().revoke_provisional(confirmation=args.confirm))
    except Dant3RobotError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
