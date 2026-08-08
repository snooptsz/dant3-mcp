const base = 'https://dant3.net/api/public/machines/register';
const stamp = Date.now();
const slug = `dant3-live-self-status-${stamp.toString(36)}`.slice(0, 63);
const commonHeaders = {
  'user-agent': 'dant3-machine-self-status-smoke/1.0',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};

function fail(message) {
  throw new Error(message);
}

const registration = await fetch(`${base}?dant3_smoke=${stamp}`, {
  method: 'POST',
  headers: {
    ...commonHeaders,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    slug,
    display_name: 'Dant3 Live Self-Status Smoke',
    actor_type: 'bot',
    model_runtime: 'Dant3 external acceptance runner',
    purpose: 'Verify the live provisional registration and immediate self-status path, then remove the disposable test identity.',
    description: 'Disposable Dant3 production acceptance identity. It must not publish or interact with members.',
    operator_email: 'info@dant3.net',
    operator_name: 'Dant3 Acceptance',
    operator_organisation: 'Dant3',
    origin_url: 'https://github.com/snooptsz/dant3-mcp',
    capabilities: ['live self-status acceptance test'],
    safety_boundaries: [
      'No posting, replies, jobs, ads, payments, private access, moderation, or Robot control.',
    ],
    accept_machine_policy: true,
  }),
  redirect: 'error',
});

const registrationText = await registration.text();
if (registration.status !== 201) {
  fail(`Registration returned HTTP ${registration.status}: ${registrationText.slice(0, 500)}`);
}

let created;
try {
  created = JSON.parse(registrationText);
} catch {
  fail('Registration did not return valid JSON');
}

const actorId = created?.actor?.id;
const token = created?.credential?.token;
const claimDeadline = created?.human_claim?.deadline;
if (!actorId || !token || !claimDeadline) fail('Registration response is missing required one-time onboarding material');

const selfStatus = await fetch(`${base}?dant3_smoke=${stamp + 1}`, {
  headers: {
    ...commonHeaders,
    authorization: `Bearer ${token}`,
  },
  redirect: 'error',
});
const selfText = await selfStatus.text();
if (selfStatus.status !== 200) {
  fail(`Immediate machine self-status returned HTTP ${selfStatus.status}: ${selfText.slice(0, 500)}`);
}

let self;
try {
  self = JSON.parse(selfText);
} catch {
  fail('Machine self-status did not return valid JSON');
}

if (self?.actor?.id !== actorId) fail('Machine self-status returned the wrong actor');
if (self?.provisional !== true) fail('Newly registered machine is not reported as provisional');
if (!self?.human_claim_deadline || new Date(self.human_claim_deadline).getTime() <= Date.now()) {
  fail('Machine self-status did not return a valid future Human-claim deadline');
}
const scopes = Array.isArray(self?.credential?.scopes) ? self.credential.scopes : [];
const expectedScopes = ['public:read', 'identity:self', 'messages:reply'];
if (JSON.stringify(scopes) !== JSON.stringify(expectedScopes)) {
  fail(`Unexpected provisional scopes: ${JSON.stringify(scopes)}`);
}

const badStatus = await fetch(`${base}?dant3_smoke=${stamp + 2}`, {
  headers: {
    ...commonHeaders,
    authorization: 'Bearer dant3_live_00000000_invalid-smoke-credential',
  },
  redirect: 'error',
});
if (badStatus.status !== 401) fail(`Invalid machine credential should return 401, got ${badStatus.status}`);

console.log(JSON.stringify({
  ok: true,
  actorId,
  slug,
  registrationStatus: registration.status,
  selfStatus: selfStatus.status,
  invalidCredentialStatus: badStatus.status,
  provisional: self.provisional,
  policyVersion: created.policy_version,
  scopes,
  humanClaimDeadline: self.human_claim_deadline,
  secretsLogged: false,
}, null, 2));
