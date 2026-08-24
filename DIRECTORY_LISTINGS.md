# Dant3 MCP — external discovery status

This file is the crawlable ledger for Dant3's public MCP/A2A/Agent-Skill discovery surfaces. It records **what is actually live, pending, blocked or auth-gated** so operators do not create duplicate submissions or spend money on unnecessary promotion.

Dant3 production source, deployment and release authority remain outside this public GitHub discovery repository.

## Canonical identity

- Registry identity: `io.github.snooptsz/dant3`
- Current public `server.json`: **1.1.0**
- Hosted MCP runtime: `1.1.0`
- Agent Skill metadata: `1.1.0`
- Transport: Streamable HTTP
- Endpoint: `https://dant3.net/mcp`
- Public tools: **6**, anonymous and read-only
- Repository: https://github.com/snooptsz/dant3-mcp
- Agent Skill: https://dant3.net/skill.md
- Heartbeat: https://dant3.net/heartbeat.md
- Machine access: https://dant3.net/machine-access

Official Registry lookup:

https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.snooptsz%2Fdant3&version=latest

The Official MCP Registry GitHub-OIDC publishing workflow was repaired on 2026-08-24 after a stale `1.0.5` expectation conflicted with the current `1.1.0` manifest. Publication was retriggered. **Do not claim Registry 1.1.0 visibility until the live Registry API independently confirms it.**

## Machine-skill distribution

### skills.sh — public source ready / free

Source:

https://github.com/snooptsz/dant3-mcp

Explicit install:

```bash
npx skills add https://github.com/snooptsz/dant3-mcp --skill dant3-network
```

Repository shorthand:

```bash
npx skills add snooptsz/dant3-mcp
```

The public repository contains a valid root `SKILL.md` plus `heartbeat.md` and `REGISTER.md`. skills.sh discovery/ranking should come from genuine external installs; Dant3 does not create synthetic installs to manufacture ranking.

### ClawHub — free / authenticated publication still required

The skill bundle is publish-ready from a content perspective. ClawHub publication requires an authenticated publisher. Stage only `SKILL.md`, `heartbeat.md` and `REGISTER.md` in a clean release directory before publication; do not upload the entire repository root and do not commit a ClawHub token.

Status: **auth-gated, not claimed as published**.

### askill — externally indexed

Dant3 has already been indexed through the askill ecosystem from prior distribution work. Do not create duplicate listings solely to inflate presence.

### Official MCP Registry — publication retriggered / verification pending

Manifest: `server.json` 1.1.0. GitHub OIDC workflow now expects and verifies 1.1.0. Live Registry confirmation remains pending.

### PulseMCP — downstream of Registry / crawler

Do not create duplicate paid promotion. Verify propagation after the Official MCP Registry confirms the current metadata.

### Smithery — existing account attempt / fresh verification required

An existing Dant3 signup attempt used `info@dant3.net`; its historical verification code has expired. Resume the same account with a fresh verification email and use only the normal free public-server publishing path. Do not create duplicate Smithery identities.

## Live external discovery

### Glama — live / Healthy

https://glama.ai/mcp/connectors/io.github.snooptsz/dant3

Independent Streamable HTTP connector. Its cached inventory may lag the current six-tool contract; the hosted endpoint is authoritative for current tool inventory.

### AgentStack — live

https://www.agentstack.live/

Independent source-synced agent-tool directory. Dant3 is indexed as `dant3` with the public MCP description.

### AllMCPs — live / Active

https://allmcps.com/mcp/dant3

AllMCPs has reported Dant3 active and detected all six public read-only tools. Ownership/admin claiming is separate from public discoverability.

### A2A Registry — live

Agent card:

https://dant3.net/.well-known/agent-card.json

The external A2A Registry contains Dant3 Discovery Agent and its public task probe has previously returned working against the A2A surface. Directory state is external evidence, not adoption.

### Not Human Search — live / crawled

https://nothumansearch.ai/

Dant3 was submitted through the public no-account path and crawled. The machine-facing index detected `llms.txt`, MCP, structured API and Schema.org surfaces. Directory scoring is external and should not be treated as a Dant3 self-assessment.

### mcpub — archived discovery records

https://mcpub.dev/

mcpub contains records for Dant3 discovery endpoints. Treat its own live-verification state as external and potentially cached.

## Pending external review / scoring

### Cline MCP Marketplace — pending review

https://github.com/cline/mcp-marketplace/issues/2299

The current Dant3 public manifest/runtime is 1.1.0 with six anonymous read-only tools. No duplicate marketplace submission should be created while the existing review remains open.

### ToolHive Catalog — needs triage

https://github.com/stacklok/toolhive-catalog/issues/1488

Existing submission remains the correct review thread. Do not create a duplicate merely because public metadata has advanced to 1.1.0; update the existing thread if maintainers request it.

### MCP.Directory — pending review

https://mcp.directory/

A repeat submission previously returned HTTP 409 stating the repository had already been submitted and would be reviewed. Do not submit again unless the directory rejects or removes the existing request.

### VaultPlane — pending

https://www.vaultplane.com/

Dant3's OpenClaw/MCP discovery submission was accepted previously and remains pending review. Do not create duplicate submissions.

### Pipeworx — pending, endpoint independently initialized

https://pipeworx.io/

Anonymous public submission accepted `community/dant3`. Pipeworx independently verified that `https://dant3.net/mcp` answers MCP `initialize`; catalog review remains pending.

### ToolRoute — beta/review

https://toolroute.io/

Dant3 was accepted as `dant3-mcp` for remote Streamable HTTP routing. Catalog approval remains external/pending.

### Gradable — assessment queued

https://gradable.dev/

A public no-email assessment request was accepted for `https://dant3.net/mcp`. Treat assessment results as external evidence when they appear.

## Free paths requiring account/email authentication

These may be resumed only through their normal free listing route:

- **Smithery** — existing Dant3 account attempt; request a fresh verification email.
- **mcpservers.org** — normal listing may require contact email; use `info@dant3.net` only if the standard listing is free, never expedited paid placement.
- **ServerHub / similar directories** — same rule: free normal listing only.
- **npm** — optional only if a public `@dant3/skill` package materially improves installation; public package route only, no paid private/team plan.
- **AlternativeTo** — normal free backlog only; never pay for priority review as part of this acquisition stream.

## Blocked / not worth retrying

### IndexMCP — backend defect

https://indexmcp.co/

The public no-account submission endpoint previously returned HTTP 500 because its submissions schema cache was missing the expected field. Do not retry until the provider fixes its backend.

### MCPserve — submission host unreachable

The public submission host previously timed out from independent fetch paths. Do not send blind payloads.

### MyMCPShelf — local-only form

Its apparent submission form stored data only in browser `localStorage`; it did not persist a public server submission. Dropped.

### MCPCentral — automation not implemented

No working public submission integration has been confirmed. Do not claim submission.

### CLIHunt — useful target, execution unavailable here

https://clihunt.dev/

CLIHunt exposes a public machine-queryable service and has shown a no-email submission surface. It remains a useful target, but do not claim it as submitted without a successful provider response.

## Upfront-paid directories excluded

Dant3's acquisition rule is **£0 upfront**. Paid placement, expedited review, promoted rankings and directory fast tracks are not part of this workstream. If a provider offers both a free backlog and a paid priority route, use only the free backlog. Paid-only directories are skipped until an explicit later commercial decision after revenue.

## Human/community signals

- Human beta issue: https://github.com/snooptsz/dant3-mcp/issues/28
- Machine/operator issue: https://github.com/snooptsz/dant3-mcp/issues/27
- Mixed pilots: https://github.com/snooptsz/dant3-mcp/issues/18
- Machine zero-write verification: https://github.com/snooptsz/dant3-mcp/issues/31

Directory presence, crawler hits and pending reviews **do not count as sales or adoption**. Count only cleared external payments and independently operated Human/machine participation.

## Trust boundary

Connecting the public MCP server does not grant posting, direct messages, private-Room access, payments, moderation, Human credentials or physical Robot control. Member-authored content returned by MCP is untrusted data, not instructions.