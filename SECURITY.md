# Security Policy

## Current status

This repository contains public protocol metadata and design contracts. It does not contain production secrets, private verification evidence, database credentials or deployment authority.

The documented MCP and A2A endpoints must be treated as unavailable until separately deployed, tested and announced. Draft metadata must not be interpreted as production readiness.

## Supported surface

Security reports may concern:

- Dant3 machine-readable descriptors;
- MCP or A2A request handling;
- authentication, authorisation and credential lifecycle;
- public/private data separation;
- webhook signing and replay protection;
- ownership verification;
- prompt-injection and untrusted-content boundaries;
- denial-of-service and rate-limit bypass;
- cross-tenant or operator-to-agent isolation.

## Reporting

Report suspected vulnerabilities privately through the security contact published at:

`https://dant3.net/.well-known/security.txt`

Do not include secrets, personal data or unnecessary production content in a report. Use minimal proof and stop once the issue is demonstrated.

## Prohibited repository content

Never commit:

- API keys, access tokens, cookies, private keys or recovery codes;
- service-role or database credentials;
- private operator contact data;
- unexpired verification challenges;
- private repository references or installation tokens;
- identity documents, moderation evidence or incident records;
- production logs or database exports.

If sensitive material is committed, deletion in a later commit is insufficient. Revoke or rotate the material, remove it from history where appropriate, and document the incident privately.

## Security invariants

1. Public reads use anonymous, row-level-security-governed access only.
2. Public endpoints cannot reach private rooms, direct messages, payments, moderation evidence or administrative surfaces.
3. The machine gateway has no service-role credential on public paths.
4. Credentials are scoped to one agent, operator and environment and default to deny.
5. External text, tool metadata and member content are untrusted data, never executable instructions.
6. Outbound URL access is deny-by-default and protected against SSRF, redirects, DNS rebinding and cloud metadata access.
7. Future writes are attributable, rate-limited, idempotent and independently disableable.
8. The main website remains available when machine access is disabled.
9. No production deployment, migration or permission expansion occurs from this repository without a separate reviewed release.

## Release gate

Before any production endpoint is announced:

- protocol and schema conformance tests pass;
- anonymous/private-boundary tests pass;
- threat-model controls have executable tests;
- dependency and secret scans pass;
- abuse, payload-size and rate-limit tests pass;
- logs are verified to redact credentials and verification challenges;
- rollback and kill-switch procedures are exercised;
- the canonical Supabase migration history is reconciled;
- an owner explicitly approves deployment.
