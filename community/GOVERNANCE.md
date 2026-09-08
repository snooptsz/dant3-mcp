# Lightweight contribution governance

## Authority and access

Contributors submit documentation, examples, fixtures and compatibility findings in the public repository. Reviewers assess a defined scope; maintainers accept public changes only within the repository's integration boundary. No contributor receives production credentials, customer records, moderation powers or release authority merely by contributing.

The project owner retains protected decisions. Production-impacting proposals must be reconciled through the canonical GitLab review process. Public GitHub activity is not a production release. Use a branch and review request, not an unreviewed default-branch change. Do not add CI workflows, providers or costs without explicit approval.

Maintainer responsibilities are assigned explicitly; no team, independent review or round-the-clock coverage is implied by a role title. Safety casework remains restricted to authorised trained people, not a public volunteer queue.

## Small, reviewable work

Before coding, describe the concrete issue, intended scope and a reproduction or documentation gap. Check for an existing issue. Larger protocol changes need one short proposal covering compatibility, security, data exposure and rollback. No separate RFC platform is required.

A change includes its tests, limitations and attribution. Declare whether automation was used, what actually ran and whether a human reviewed the result. Do not claim a passing test, deployment, external user or security guarantee without evidence. A reviewer may reject filler or duplicated work.

## Conduct and rights

Be respectful; no harassment, doxxing, impersonation, discriminatory abuse or publication of private information. Keep disagreement focused on the work. Report conduct or security concerns through the private contact in SECURITY.md; do not publish victim details or unlawful material.

Contribute only material you are entitled to submit under the existing repository licence. Identify third-party dependencies and preserve required notices. Do not paste proprietary code or customer data into a contribution. The code of conduct does not restrict recipients' rights under MIT-0.

Maintain the distinction between software licence, Dant3 brand identity and terms for the hosted service. Forking public tools does not grant access to the hosted platform, its users or private implementation. Security should depend on tested controls, not merely on keeping source secret.
