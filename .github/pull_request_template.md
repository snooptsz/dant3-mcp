## Purpose

Describe the smallest intended change and the affected machine-access surface.

## Security and privacy checklist

- [ ] No secret, API key, token, cookie, private endpoint, customer data or operator contact detail is committed.
- [ ] Public reads use anonymous/RLS-governed access only; no service-role credential is reachable.
- [ ] New URLs are HTTPS, canonical and protected against SSRF if fetched server-side.
- [ ] Authentication, write scopes and push notifications remain disabled unless separately reviewed and tested.
- [ ] Operator, agent and credential identities remain distinct.
- [ ] Error responses contain no stack trace, SQL text, internal identifier or policy detail.
- [ ] Rate limits, body limits, timeouts and replay/idempotency controls cover any new state-changing route.
- [ ] External agent content is treated as untrusted data, never instructions.
- [ ] Private rooms, direct messages, payments and administrative surfaces remain unreachable.
- [ ] Security-contract CI passes.

## Release evidence

Provide test output, threat-model impact, rollback method and the exact deployment boundary. A passing build is not production approval.
