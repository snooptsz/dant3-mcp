const stamp = Date.now();
const headers = {
  'user-agent': 'dant3-live-web-smoke/3.0',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};

function fail(message) {
  throw new Error(message);
}

async function request(path, { redirect = 'follow' } = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const url = `https://dant3.net${path}${separator}dant3_smoke=${stamp}`;
  const response = await fetch(url, { headers, redirect });
  const text = await response.text();
  return { response, text, requested: url };
}

function pathOf(response) {
  return new URL(response.url).pathname;
}

const root = await request('/');
if (!root.response.ok) fail(`Root returned HTTP ${root.response.status}`);
if (pathOf(root.response) !== '/feed') {
  fail(`Root did not resolve to /feed; final URL was ${root.response.url}`);
}

const pagePaths = [
  '/feed',
  '/auth',
  '/pricing',
  '/spaces',
  '/groups',
  '/jobs',
  '/job-board',
  '/marketplace',
  '/humans',
  '/agents',
  '/actors',
  '/how-it-works',
  '/trust',
  '/legal',
  '/developers',
  '/machine-access',
];

const pages = {};
for (const path of pagePaths) {
  const result = await request(path);
  if (!result.response.ok) fail(`${path} returned HTTP ${result.response.status}`);
  if (!String(result.response.headers.get('content-type') || '').includes('text/html')) {
    fail(`${path} did not return HTML`);
  }
  if (/Internal Server Error|Application error|Unhandled Runtime Error/i.test(result.text)) {
    fail(`${path} contains an application/server error marker`);
  }
  pages[path] = { status: result.response.status, finalPath: pathOf(result.response) };
}

const view = await request('/how-it-works');
if (!/Dant3 View|The feed is the front door/i.test(view.text)) {
  fail('/how-it-works does not expose the current Dant3 View copy');
}

const robots = await request('/robots.txt');
if (!robots.response.ok) fail(`/robots.txt returned HTTP ${robots.response.status}`);
for (const path of [
  '/api/public/machines/join',
  '/api/public/machines/heartbeat',
  '/api/public/machines/post',
  '/api/public/machines/rooms',
]) {
  if (!robots.text.includes(`Allow: ${path}`)) fail(`/robots.txt does not explicitly allow ${path}`);
}

const llms = await request('/llms.txt');
if (!llms.response.ok) fail(`/llms.txt returned HTTP ${llms.response.status}`);
if (!/Dant3/i.test(llms.text)) fail('/llms.txt does not identify Dant3');
if (!llms.text.includes('rooms:join') || !llms.text.includes('rooms:create')) {
  fail('/llms.txt does not expose bounded machine Room scopes');
}

const sitemap = await request('/sitemap.xml');
if (!sitemap.response.ok) fail(`/sitemap.xml returned HTTP ${sitemap.response.status}`);
if (!/<urlset|<sitemapindex/i.test(sitemap.text)) fail('/sitemap.xml is not valid sitemap-shaped XML');

const manifestResult = await request('/.well-known/dant3.json');
if (!manifestResult.response.ok) fail(`/.well-known/dant3.json returned HTTP ${manifestResult.response.status}`);
let manifest;
try {
  manifest = JSON.parse(manifestResult.text);
} catch {
  fail('/.well-known/dant3.json is not valid JSON');
}
if (manifest?.name !== 'Dant3') fail('machine manifest does not identify Dant3');
if (manifest?.policy_version !== '2026-08-24.v5') fail('machine manifest policy version is not v5');
if (manifest?.machine_fast_join_endpoint !== 'https://dant3.net/api/public/machines/join') {
  fail('machine manifest fast join endpoint is wrong');
}
if (manifest?.machine_rooms_endpoint !== 'https://dant3.net/api/public/machines/rooms') {
  fail('machine manifest Room endpoint is wrong');
}
if (manifest?.provisional_registration_endpoint !== 'https://dant3.net/api/public/machines/register') {
  fail('machine manifest provisional registration endpoint is wrong');
}

const expectedProvisionalScopes = [
  'public:read',
  'identity:self',
  'messages:reply',
  'messages:post',
  'rooms:join',
  'rooms:create',
];

const policyResult = await request('/api/public/agents/policy');
if (!policyResult.response.ok) fail(`/api/public/agents/policy returned HTTP ${policyResult.response.status}`);
let policy;
try {
  policy = JSON.parse(policyResult.text);
} catch {
  fail('/api/public/agents/policy is not valid JSON');
}
if (policy?.ok !== true || policy?.version !== '2026-08-24.v5') {
  fail('machine policy endpoint is missing current ok/version');
}
if (JSON.stringify(policy?.provisional_scopes) !== JSON.stringify(expectedProvisionalScopes)) {
  fail('machine policy provisional scopes drifted from v5');
}
if (policy?.bootstrap?.fast_machine_join?.required_fields?.join(',') !== 'name,description') {
  fail('machine policy fast join no longer requires exactly name + description');
}
if (policy?.bootstrap?.room_participation?.endpoint !== '/api/public/machines/rooms') {
  fail('machine policy Room endpoint drifted');
}
if (policy?.bootstrap?.dormant_claim_recovery?.machine_authority_while_dormant !== false) {
  fail('machine policy lost dormant zero-authority boundary');
}

const machineStatus = await request('/api/public/machines/register');
if (machineStatus.response.status !== 401) {
  fail(`/api/public/machines/register without a credential should be 401, got ${machineStatus.response.status}`);
}

const rooms = await request('/api/public/machines/rooms?limit=3');
if (!rooms.response.ok) fail(`/api/public/machines/rooms returned HTTP ${rooms.response.status}`);
let roomsPayload;
try {
  roomsPayload = JSON.parse(rooms.text);
} catch {
  fail('/api/public/machines/rooms is not valid JSON');
}
if (roomsPayload?.ok !== true || !Array.isArray(roomsPayload?.rooms)) {
  fail('/api/public/machines/rooms does not expose anonymous public Room discovery');
}

const report = {
  ok: true,
  checkedAt: new Date().toISOString(),
  root: { status: root.response.status, finalPath: pathOf(root.response) },
  pages,
  dant3View: { status: view.response.status, finalPath: pathOf(view.response), currentCopy: true },
  machineDiscovery: {
    robots: robots.response.status,
    llms: llms.response.status,
    sitemap: sitemap.response.status,
    manifest: manifestResult.response.status,
    policy: policyResult.response.status,
    policyVersion: policy.version,
    provisionalScopes: policy.provisional_scopes,
    publicRooms: rooms.response.status,
    unauthenticatedMachineStatus: machineStatus.response.status,
  },
};

console.log(JSON.stringify(report, null, 2));
