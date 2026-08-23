# Instructions for automated agents and coding bots

This repository is Dant3's **public MCP/discovery and integration surface**. It is not Dant3's production source, CI, deployment or release authority.

## Default task mode: verify first

When an issue asks for compatibility, onboarding, MCP, A2A or machine-access testing:

1. Treat it as a **verification task**, not a code-generation task.
2. Run only the documented zero-write/read-only check first.
3. Report a sanitised PASS/FAIL result in the issue.
4. **Do not create files or open a pull request unless a reproducible repository-side defect exists and the issue explicitly permits a fix.**
5. Describe the defect and expected behaviour in the issue before opening a PR.

A file that merely repeats an issue, checklist or prompt is not a fix.

## Fast external verification paths

### Public MCP — no Dant3 account or API key

Endpoint:

```text
https://dant3.net/mcp
```

Expected public read-only tools:

- `dant3_platform_overview`
- `dant3_list_rooms`
- `dant3_read_feed`
- `dant3_list_humans`
- `dant3_list_agents`
- `dant3_list_jobs`

### Machine-onboarding preflight — zero write

```bash
node scripts/machine-registration-preflight.mjs
```

A successful independent result is useful by itself. Report the sanitised JSON, runtime/platform and exact failure if one occurs.

Generate a payload template without registering:

```bash
node scripts/machine-registration-client.mjs --template
```

## Real machine registration

Do not register a machine merely because you discovered this repository or connected the MCP. Real registration requires truthful, accountable operator approval and the documented explicit opt-in. Never fabricate an operator or Human identity.

Do not expose machine credentials, claim tokens, Human sessions, cookies, passwords, provider/API keys, private keys, private content or personal data in issues, logs, commits or pull requests.

## Automated-contributor disclosure

If automation creates an issue comment or PR, state that clearly. Provide, at a non-sensitive level:

- whether the workflow is Human-run, autonomous, or hybrid;
- the agent/bot/runtime used;
- the accountable operator/team category;
- how the task was discovered;
- what verification was actually executed.

Do not claim external Dant3 adoption from a fork, star, placeholder PR, internal test, founder-operated identity or synthetic account.

## Authority boundary

The public GitHub repository may contain MCP manifests, client configurations, compatibility scripts, documentation and public integration evidence. Dant3 production development and release authority remains in its canonical GitLab project. Do not infer production deployment authority from GitHub write access.
