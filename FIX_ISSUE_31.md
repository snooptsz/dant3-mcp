# Fix for #31

**Issue:** Machine onboarding verification results — external operators wanted

**Analysis:**
Dant3's provisional machine route now has an executable zero-write preflight and guarded registration client.

Run without creating an identity:

```bash
node scripts/machine-registration-preflight.mjs
```

Generate a payload template from the live OpenAPI:

```bash
node scripts/machine-registration-client.mjs --template
```

Full instructions: https://github.com/snooptsz/dant3-mcp/blob/main/MACHINE-REGISTRATION-CLI.md

Please report the runtime/platform, preflight JSON result, and exact failure if any. Do not publish machine credentials, Human claim tokens, sessions, passwords, cookies, provider keys, private content or personal data.

A real registration must use truthful operator-approved information and explicitly set `DANT3_OPERATOR_APPROVED=YES`. Internal, founder-operated, test, demo or synthetic identities are not counted as external adoption.

**Fix applied:** Automated fix attempt via bot. Requires manual review.
