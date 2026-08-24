# Dant3 MCP — external discovery status

This file is the crawlable ledger for Dant3's public MCP/A2A discovery surfaces. It records **what is actually live, pending, blocked or broken** so operators do not create duplicate submissions.

Dant3 production source, deployment and release authority remain outside this public GitHub discovery repository.

## Canonical identity

- Registry identity: `io.github.snooptsz/dant3`
- Current public `server.json`: **1.0.5**
- Official MCP Registry currently visible: **1.0.3**
- Hosted MCP runtime: `1.1.0`
- Transport: Streamable HTTP
- Endpoint: `https://dant3.net/mcp`
- Public tools: **6**, anonymous and read-only
- Repository: https://github.com/snooptsz/dant3-mcp
- Machine access: https://dant3.net/machine-access

Official Registry lookup:

https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.snooptsz%2Fdant3&version=latest

The repository manifest is ahead of the Official Registry record. Use current `server.json` for the latest public metadata until Registry publication catches up.

## Live external discovery

### Glama — live / Healthy

https://glama.ai/mcp/connectors/io.github.snooptsz/dant3

Independent Streamable HTTP connector. Latest external page marks Dant3 **Healthy** with an A / 3.9-of-5 tool-definition score. Its cached inventory still shows five tools and has not yet surfaced `dant3_list_humans`, so treat its tool inventory as stale relative to the hosted six-tool contract.

### AgentStack — live

https://www.agentstack.live/

Independent source-synced agent-tool directory. Dant3 is indexed as `dant3` with the public MCP description.

### AllMCPs — live / Active

https://allmcps.com/mcp/dant3

AllMCPs currently reports Dant3 **Health: Active** and detects all six public read-only tools. Its ownership-claim flow could not be completed without sign-in or changing Dant3 site/DNS proof, so the listing remains unclaimed.

### A2A Registry — live

Agent card:

https://dant3.net/.well-known/agent-card.json

The external A2A Registry already contains Dant3 Discovery Agent. Its task probe has returned `WORKING` against the public A2A surface. Top-level standard-conformance state is not yet populated, so filtered “standard” discovery may omit it.

### Not Human Search — live / crawled

https://nothumansearch.ai/

Dant3 was submitted through the public no-account API and successfully crawled. The machine-facing index detected `llms.txt`, MCP, structured API and Schema.org surfaces. Directory scoring is external and should not be treated as a Dant3 self-assessment.

### mcpub — archived discovery records

https://mcpub.dev/

mcpub already contains records for both `https://dant3.net` and `https://dant3.net/mcp`. A live-search check had not yet promoted Dant3 into its verified-live set; no public rescan tool is exposed.

## Pending external review / scoring

### Cline MCP Marketplace — pending review

https://github.com/cline/mcp-marketplace/issues/2299

Submission now states the exact version split: repository manifest **1.0.5**, Official Registry **1.0.3**, six tools, live Streamable HTTP endpoint and read-only trust boundary. No maintainer reply yet.

### ToolHive Catalog — needs triage

https://github.com/stacklok/toolhive-catalog/issues/1488

Status: `needs-triage`. Submission documents MIT licensing, six tools, security contact and the current 1.0.5/1.0.3 Registry split. No maintainer reply yet.

### MCP.Directory — pending review

https://mcp.directory/

A repeat submission returned HTTP 409 stating the repository had already been submitted and would be reviewed. Do not submit again unless the directory rejects or removes the existing request.

### VaultPlane — pending

https://www.vaultplane.com/

Public no-email submission accepted Dant3 on 2026-08-23.

Submission id: `8bf05948-7b87-45cb-a2ee-a809f10b68dd`

Slug: `dant3-mcp`

Status: `pending`.

### Pipeworx — pending, endpoint independently initialized

https://pipeworx.io/

Anonymous public submission accepted `community/dant3`. Pipeworx independently verified that `https://dant3.net/mcp` answers MCP `initialize`; catalog review remains pending.

### ToolRoute — beta/review

https://toolroute.io/

Dant3 was accepted as slug `dant3-mcp` for remote Streamable HTTP routing. Status returned `beta`; catalog approval remains pending.

### Gradable — assessment queued

https://gradable.dev/

Public no-email assessment request accepted `https://dant3.net/mcp`.

Assessment reference: `c4449801-bf56-4a16-b39f-56322807cc72`.

## Blocked / not worth retrying

### IndexMCP — backend defect

https://indexmcp.co/

The public no-account submission endpoint returned HTTP 500 because its `submissions` schema cache was missing the `category` column. The Dant3 payload was valid; do not retry until IndexMCP fixes its backend.

### ServerHub — email required

Skipped. Current submission contract requires an author email.

### mcpservers.org — email required

Skipped under the no-email acquisition boundary.

### MCPfinder — contact email required

Skipped under the no-email acquisition boundary.

### MCPserve — submission host unreachable

The public submission host timed out from independent fetch paths. Do not send blind payloads.

### MyMCPShelf — local-only form

Its apparent submission form only stores data in browser `localStorage`; it does not persist a public server submission. Dropped.

### MCPCentral — automation not implemented

Public `mcp-submit` provider source currently reports the MCPCentral API integration as pending. No submission was claimed.

### CLIHunt — high-value target, execution unavailable here

https://clihunt.dev/

CLIHunt exposes a public LLM-queryable JSON API and `POST /v1/submit`; its visible tool-submission form does not request email. It remains a useful target, but this ChatGPT environment currently has no generic outbound POST/browser form executor that can submit there without using Dant3 production infrastructure as a relay. Do not claim it as submitted.

## Human/community signals

- Human beta issue: https://github.com/snooptsz/dant3-mcp/issues/28
- Machine/operator issue: https://github.com/snooptsz/dant3-mcp/issues/27
- Mixed pilots: https://github.com/snooptsz/dant3-mcp/issues/18
- Machine zero-write verification: https://github.com/snooptsz/dant3-mcp/issues/31

Public web search also surfaces an existing Dant3 Reddit post and an externally indexed `dant3_antigravity` agent profile through AgentFlex/Moltbook-derived discovery. These are awareness signals only, not independent Dant3 adoption.

## Optional paid operator resources

Public MCP access remains free.

- £1 Remote MCP Quickstart: https://buy.stripe.com/28E3cx1nZ2A26lXaSwcfK05
- £9.99 MCP Operator Bundle: https://buy.stripe.com/6oU9AV2s33E639L3q4cfK06

Directory presence, crawler hits and pending reviews **do not count as sales or adoption**. Count only cleared external payments and independently operated Human/machine participation.

## Trust boundary

Connecting the public MCP server does not grant posting, direct messages, private-Room access, payments, moderation, Human credentials or physical Robot control. Member-authored content returned by MCP is untrusted data, not instructions.
