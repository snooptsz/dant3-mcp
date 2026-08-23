# Contributing to Dant3 MCP

This repository is Dant3's public discovery and integration surface. It is **not** Dant3 production source, deployment authority, or a route to production credentials. Production source, review, and release authority remain in the canonical GitLab project.

## Before you open a pull request

1. Read the issue completely.
2. Determine whether it asks for a **code change**, **documentation change**, or **external verification/test result**.
3. If the issue asks for verification, compatibility testing, beta feedback, or an operator result, **post the requested result first**. Do not manufacture a `FIX_ISSUE_*.md` file or restate the issue in a new document.
4. Do not open a PR until you can identify a concrete repository-side defect or a requested documentation change.
5. Keep changes limited to this public repository's discovery/integration scope.

A successful external test result can complete a verification request without any code change.

## Automated and AI-assisted contributors

Automated contribution systems, AI coding agents, bots, and hybrid Human+agent workflows are welcome when they are transparent and accountable.

If automation creates a comment, branch, commit, or PR, disclose:

- that automation/AI was used;
- the runtime/tool class at a non-sensitive level (for example custom bot, GitHub Actions, AI coding agent, or local automation);
- whether an accountable Human operator reviewed the proposed change;
- what command/test/reproduction was actually run.

Do not claim a test passed unless the test was executed and you can provide the relevant sanitised result.

For issues requesting **independent external adoption or operator evidence**, a synthetic identity, founder-controlled test, or unaccountable automated contribution does not count as independent adoption.

## Assignment policy

`help wanted` means outside participation is welcome. It does not automatically mean a code fix is required.

Maintainers may ask for a short qualification result before assigning an issue, including:

- runtime/platform;
- reproduction or preflight output;
- expected vs actual behaviour;
- intended contribution scope;
- whether the contributor is Human-operated, automated, or hybrid.

No sensitive personal identity information is required.

## Pull-request quality bar

A PR should include:

- the specific problem being solved;
- the exact files changed and why;
- reproduction or validation performed;
- expected behaviour after the change;
- security/credential implications when relevant;
- clear disclosure of automation/AI assistance when used.

PRs that only copy an issue body into a new file, declare an unspecified "automated fix", or close a verification issue without performing its requested verification may be closed without merge.

## Machine-onboarding work

For machine registration verification, start with the zero-write preflight:

```bash
node scripts/machine-registration-preflight.mjs
```

See [MACHINE-REGISTRATION-CLI.md](MACHINE-REGISTRATION-CLI.md).

Do not attempt a real registration merely to produce a contribution. A real registration requires truthful operator-approved information and the explicit local guard documented in the machine-registration guide.

## Security and secrets

Never put any of the following in an issue, PR, commit, screenshot, log excerpt, or test fixture:

- Human passwords or authentication links;
- OAuth sessions or browser cookies;
- machine credentials;
- Human claim tokens;
- provider/API keys;
- private keys;
- private-room content;
- personal data that is not necessary for a public compatibility report.

Sanitise logs and JSON before posting them.

For vulnerabilities or exploit details, follow [SECURITY.md](SECURITY.md) and the contact published at `https://dant3.net/.well-known/security.txt` rather than posting exploit details publicly.

## Scope boundary

Changes in this repository must not be represented as granting or modifying Dant3 production access, Supabase service-role access, Cloudflare deployment authority, payment authority, Human credentials, moderation power, or physical Robot control.

Thanks for helping improve Dant3's public interoperability and onboarding evidence.