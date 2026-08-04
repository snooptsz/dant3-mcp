#!/usr/bin/env python3
"""Fail-closed validation for Dant3's public machine-access metadata.

This script uses only Python's standard library so CI does not install or execute
third-party packages. It validates public protocol claims, URL safety, outreach
data minimisation, and obvious credential leakage.
"""

from __future__ import annotations

import csv
import ipaddress
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []

PUBLIC_TEXT_FILES = [
    ROOT / "README.md",
    ROOT / "SECURITY.md",
    ROOT / "server.json",
    ROOT / ".well-known" / "agent-card.json",
    ROOT / "docs" / "founding-agent-outreach.csv",
    ROOT / "docs" / "implementation-roadmap.md",
    ROOT / "docs" / "import-your-agent.md",
    ROOT / "docs" / "threat-model.md",
]

EXPECTED_OUTREACH_COLUMNS = [
    "slot",
    "target_alias",
    "ecosystem",
    "public_project_url",
    "public_contact_channel",
    "internal_record_id",
    "fit_reason",
    "status",
    "last_public_update",
    "next_action",
    "notes_public",
]

ALLOWED_OUTREACH_STATUSES = {
    "researching",
    "invited",
    "responded",
    "qualified",
    "selected",
    "waitlisted",
    "declined",
    "onboarded",
    "closed",
}

FORBIDDEN_AGENT_TERMS = {
    "write",
    "post",
    "submit",
    "accept",
    "delete",
    "update",
    "admin",
    "payment",
}

SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("private key block", re.compile(r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----")),
    ("GitHub classic token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("GitHub fine-grained token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("Supabase secret key", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{12,}\b")),
    ("Stripe live secret", re.compile(r"\bsk_live_[A-Za-z0-9]{16,}\b")),
    ("OpenAI-style secret", re.compile(r"\bsk-[A-Za-z0-9_-]{24,}\b")),
    (
        "JWT-like token",
        re.compile(
            r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"
        ),
    ),
    (
        "credential-bearing database URL",
        re.compile(r"\bpostgres(?:ql)?://[^/\s:@]+:[^@\s/]+@", re.IGNORECASE),
    ),
]


def fail(message: str) -> None:
    ERRORS.append(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        fail(f"missing required file: {path.relative_to(ROOT)}")
        return ""


def read_json(path: Path) -> dict[str, Any]:
    text = read_text(path)
    if not text:
        return {}
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
        return {}
    if not isinstance(value, dict):
        fail(f"{path.relative_to(ROOT)} must contain a JSON object")
        return {}
    return value


def is_unsafe_ip_literal(hostname: str) -> bool:
    candidate = hostname.strip("[]")
    try:
        address = ipaddress.ip_address(candidate)
    except ValueError:
        return False
    return not address.is_global


def validate_https_url(raw_url: str, context: str, expected_host: str | None = None) -> None:
    try:
        parsed = urlparse(raw_url)
    except ValueError as exc:
        fail(f"{context}: invalid URL ({exc})")
        return

    require(parsed.scheme == "https", f"{context}: URL must use HTTPS")
    require(bool(parsed.hostname), f"{context}: URL must include a hostname")
    require(not parsed.username and not parsed.password, f"{context}: URL must not contain userinfo")
    require(not parsed.fragment, f"{context}: URL must not contain a fragment")

    host = (parsed.hostname or "").lower().rstrip(".")
    blocked_hosts = {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
        "instance-data.ec2.internal",
        "169.254.169.254",
    }
    require(host not in blocked_hosts, f"{context}: blocked host {host!r}")
    require(not host.endswith(".localhost"), f"{context}: localhost subdomains are blocked")
    require(not is_unsafe_ip_literal(host), f"{context}: non-global IP literals are blocked")
    if expected_host:
        require(host == expected_host, f"{context}: expected host {expected_host!r}, got {host!r}")


def validate_server_manifest() -> None:
    manifest = read_json(ROOT / "server.json")
    if not manifest:
        return

    require(
        manifest.get("$schema")
        == "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        "server.json must use the reviewed 2025-12-11 MCP Registry schema",
    )
    require(manifest.get("name") == "io.github.snooptsz/dant3", "unexpected MCP server name")
    require(manifest.get("title") == "Dant3 Public Discovery", "unexpected MCP title")

    description = str(manifest.get("description", "")).lower()
    require("read-only" in description, "MCP description must state read-only scope")
    require("beta" in description, "MCP description must state beta status")
    require("private" in description, "MCP description must state private data is excluded")

    version = str(manifest.get("version", ""))
    require(
        bool(re.fullmatch(r"0\.2\.0-beta\.[0-9]+", version)),
        "MCP version must remain a 0.2.0 beta prerelease",
    )

    remotes = manifest.get("remotes")
    require(isinstance(remotes, list) and len(remotes) == 1, "MCP manifest must declare exactly one remote")
    if isinstance(remotes, list) and len(remotes) == 1 and isinstance(remotes[0], dict):
        remote = remotes[0]
        require(remote.get("type") == "streamable-http", "MCP remote must use streamable-http")
        url = str(remote.get("url", ""))
        validate_https_url(url, "server.json remote", expected_host="agents.dant3.net")
        require(urlparse(url).path == "/mcp", "MCP remote path must be /mcp")

    repository = manifest.get("repository")
    require(isinstance(repository, dict), "MCP repository metadata is required")
    if isinstance(repository, dict):
        require(
            repository.get("url") == "https://github.com/snooptsz/dant3-mcp",
            "unexpected MCP repository URL",
        )
        require(repository.get("source") == "github", "MCP repository source must be github")


def validate_agent_card() -> None:
    card = read_json(ROOT / ".well-known" / "agent-card.json")
    if not card:
        return

    require(
        card.get("protocolVersion") == "0.3.0",
        "A2A card must remain on reviewed v0.3 compatibility contract",
    )
    require(str(card.get("version", "")).endswith("-draft"), "A2A card version must remain draft")

    url = str(card.get("url", ""))
    validate_https_url(url, "A2A card URL", expected_host="agents.dant3.net")
    require(urlparse(url).path == "/a2a", "A2A card URL path must be /a2a")

    capabilities = card.get("capabilities")
    require(isinstance(capabilities, dict), "A2A capabilities object is required")
    if isinstance(capabilities, dict):
        require(capabilities.get("streaming") is False, "A2A streaming must remain disabled")
        require(
            capabilities.get("pushNotifications") is False,
            "A2A push notifications must remain disabled",
        )

    authentication = card.get("authentication")
    require(isinstance(authentication, dict), "A2A authentication object is required")
    if isinstance(authentication, dict):
        require(
            authentication.get("schemes") == [],
            "A2A beta card must advertise no authentication scheme",
        )

    skills = card.get("skills")
    require(isinstance(skills, list) and bool(skills), "A2A card must declare at least one read-only skill")
    if isinstance(skills, list):
        for index, skill in enumerate(skills):
            require(isinstance(skill, dict), f"A2A skill {index} must be an object")
            if not isinstance(skill, dict):
                continue
            tags = skill.get("tags", [])
            require(
                isinstance(tags, list) and "read-only" in tags,
                f"A2A skill {index} must carry read-only tag",
            )
            action_surface = " ".join(
                str(skill.get(field, "")).lower()
                for field in ("id", "name")
            )
            description = str(skill.get("description", "")).lower()
            require(
                "public" in description or "read" in description,
                f"A2A skill {index} must describe a public/read-only boundary",
            )
            for forbidden in FORBIDDEN_AGENT_TERMS:
                require(
                    re.search(rf"(^|[^a-z]){re.escape(forbidden)}([^a-z]|$)", action_surface)
                    is None,
                    f"A2A skill {index} contains forbidden beta capability term {forbidden!r}",
                )


def validate_outreach_tracker() -> None:
    path = ROOT / "docs" / "founding-agent-outreach.csv"
    text = read_text(path)
    if not text:
        return

    try:
        rows = list(csv.DictReader(text.splitlines()))
    except csv.Error as exc:
        fail(f"invalid outreach CSV: {exc}")
        return

    reader = csv.DictReader(text.splitlines())
    require(
        reader.fieldnames == EXPECTED_OUTREACH_COLUMNS,
        "outreach CSV columns changed or include unsafe fields",
    )
    require(len(rows) == 25, f"outreach CSV must contain exactly 25 candidate slots, found {len(rows)}")

    email_pattern = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
    require(not email_pattern.search(text), "outreach CSV must not contain email addresses")

    seen_slots: set[int] = set()
    for row_number, row in enumerate(rows, start=2):
        try:
            slot = int(row.get("slot", ""))
        except ValueError:
            fail(f"outreach CSV row {row_number}: invalid slot")
            continue
        require(1 <= slot <= 25, f"outreach CSV row {row_number}: slot out of range")
        require(slot not in seen_slots, f"outreach CSV row {row_number}: duplicate slot {slot}")
        seen_slots.add(slot)

        status = (row.get("status") or "").strip()
        require(
            status in ALLOWED_OUTREACH_STATUSES,
            f"outreach CSV row {row_number}: invalid status {status!r}",
        )

        for field in ("public_project_url", "public_contact_channel"):
            value = (row.get(field) or "").strip()
            if value:
                validate_https_url(value, f"outreach CSV row {row_number} field {field}")


def validate_readme_claims() -> None:
    readme = read_text(ROOT / "README.md")
    lowered = readme.lower()
    require("beta status" in lowered, "README must contain a prominent beta status section")
    require(
        "no public mcp or a2a endpoint is currently announced as production-ready" in lowered,
        "README must state that endpoints are not production-ready",
    )
    require(
        "https://agents.dant3.net/mcp" in readme,
        "README must name the isolated planned MCP endpoint",
    )
    require(
        "https://agents.dant3.net/a2a" in readme,
        "README must name the isolated planned A2A endpoint",
    )
    require(
        "https://github.com/snooptsz/dant3-mcp/issues/2" in readme,
        "README must link the beta application",
    )
    for stale_claim in (
        "dant3 runs a **remote** mcp server",
        "read tools are fully available",
        "point it at `https://dant3.net/mcp`",
    ):
        require(stale_claim not in lowered, f"README contains stale live-service claim: {stale_claim}")


def scan_public_files_for_secrets() -> None:
    for path in PUBLIC_TEXT_FILES:
        text = read_text(path)
        if not text:
            continue
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(text):
                fail(f"{path.relative_to(ROOT)} contains a possible {label}")


def main() -> int:
    validate_server_manifest()
    validate_agent_card()
    validate_outreach_tracker()
    validate_readme_claims()
    scan_public_files_for_secrets()

    if ERRORS:
        print("Dant3 public metadata security gate failed:", file=sys.stderr)
        for error in ERRORS:
            print(f" - {error}", file=sys.stderr)
        return 1

    print("Dant3 public metadata security gate passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
