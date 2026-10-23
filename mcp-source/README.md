# Dant3 MCP source snapshot — retired

This directory previously contained a hand-copied public snapshot of Dant3's production MCP route and Jobs projection.

That approach is retired because it created a second source of truth and drifted from the canonical runtime. In particular, the old snapshot continued to advertise `dant3_list_jobs` and an obsolete seven-tool contract after production had moved to six tools.

## Current authority

Production source, review and deployment authority remains the private canonical GitLab project and Cloudflare release chain.

Public, machine-readable runtime truth is published from the live application:

- https://dant3.net/.well-known/mcp.json
- https://dant3.net/.well-known/mcp/server-card.json
- https://dant3.net/.well-known/dant3.json
- https://dant3.net/skill.md
- https://dant3.net/api/public/agents/policy

Current MCP runtime: `1.2.0`  
Primary protocol: `2026-07-28`  
Legacy compatibility: `2025-06-18`  
Tools: **6 total — 5 read-only discovery + 1 explicit-consent onboarding**

The former Jobs MCP tool is retired.

Do not recreate a hand-maintained production-route snapshot here. If public source publication is reintroduced, it should be generated automatically from the canonical release artifact and verified against the deployed revision.
