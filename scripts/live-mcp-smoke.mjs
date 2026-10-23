import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync(new URL('../server.json', import.meta.url), 'utf8'));
const ENDPOINT = process.env.MCP_ENDPOINT || registry.remotes?.find((remote) => remote.type === 'streamable-http')?.url;
if (!ENDPOINT) throw new Error('server.json has no streamable-http remote');

const discoveryIssues = [];

function fail(message) {
  throw new Error(message);
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'dant3-mcp-live-smoke/1.2' },
    redirect: 'error',
  });
  if (!response.ok) fail(`${url} returned HTTP ${response.status}`);
  return response.text();
}

function parseRpcBody(text, contentType, expectedId) {
  if (!text.trim()) return null;
  if (contentType.includes('application/json')) return JSON.parse(text);
  if (contentType.includes('text/event-stream')) {
    const events = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter((line) => line && line !== '[DONE]')
      .map((line) => JSON.parse(line));
    return events.find((event) => event.id === expectedId) ?? events.at(-1) ?? null;
  }
  fail(`Unexpected MCP content-type: ${contentType || '(missing)'}`);
}

async function rpc(body, sessionId, expectedId) {
  const headers = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
    'mcp-protocol-version': '2025-06-18',
    'user-agent': 'dant3-mcp-live-smoke/1.2',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'error',
  });
  const text = await response.text();
  if (!response.ok) fail(`MCP ${body.method} returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  const nextSessionId = response.headers.get('mcp-session-id') || sessionId || null;
  const payload = parseRpcBody(text, response.headers.get('content-type') || '', expectedId);
  return { payload, sessionId: nextSessionId, status: response.status };
}

async function modernRpc(method, params, id) {
  const protocol = '2026-07-28';
  const body = {
    jsonrpc: '2.0',
    id,
    method,
    params: {
      ...params,
      _meta: {
        ...(params?._meta || {}),
        'io.modelcontextprotocol/protocolVersion': protocol,
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    },
  };
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    'mcp-protocol-version': protocol,
    'mcp-method': method,
    'user-agent': 'dant3-mcp-live-smoke/1.2',
  };
  if (method === 'tools/call' && typeof params?.name === 'string') headers['mcp-name'] = params.name;
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'error',
  });
  const text = await response.text();
  if (!response.ok) fail(`Modern MCP ${method} returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

const manifestText = await getText('https://dant3.net/.well-known/dant3.json');
const manifest = JSON.parse(manifestText);
if (manifest.name !== 'Dant3') discoveryIssues.push(`manifest.name=${JSON.stringify(manifest.name)}`);
if (manifest.provisional_registration_endpoint !== 'https://dant3.net/api/public/machines/register') {
  discoveryIssues.push(`manifest.provisional_registration_endpoint=${JSON.stringify(manifest.provisional_registration_endpoint ?? null)}`);
}

const llms = await getText('https://dant3.net/llms.txt');
if (!llms.includes('POST https://dant3.net/api/public/machines/register')) {
  discoveryIssues.push('llms.txt is missing provisional machine registration');
}
await getText('https://dant3.net/robots.txt');

const init = await rpc({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'dant3-live-smoke', version: '1.2.0' },
  },
}, null, 1);

if (!init.payload?.result?.serverInfo?.name) fail('MCP initialize did not return serverInfo.name');
if (!init.payload?.result?.protocolVersion) fail('MCP initialize did not negotiate a protocol version');

await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId, undefined);

const tools = await rpc({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
}, init.sessionId, 2);

const toolNames = (tools.payload?.result?.tools || []).map((tool) => tool.name);
const requiredTools = [
  'dant3_read_feed',
  'dant3_list_rooms',
  'dant3_list_humans',
  'dant3_list_agents',
  'dant3_platform_overview',
];
for (const name of requiredTools) {
  if (!toolNames.includes(name)) fail(`MCP tools/list missing ${name}`);
}

const overview = await rpc({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name: 'dant3_platform_overview', arguments: {} },
}, init.sessionId, 3);
if (!overview.payload?.result?.content?.length) fail('MCP platform overview returned no content');

const modernDiscover = await modernRpc('server/discover', {}, 10);
if (!modernDiscover.payload?.result?.supportedVersions?.includes?.('2026-07-28') &&
    !modernDiscover.result?.supportedVersions?.includes?.('2026-07-28')) {
  const result = modernDiscover.result || modernDiscover.payload?.result;
  if (!result?.supportedVersions?.includes?.('2026-07-28')) fail('Modern server/discover did not advertise 2026-07-28');
}

const modernTools = await modernRpc('tools/list', {}, 11);
const modernToolNames = (modernTools.result?.tools || []).map((tool) => tool.name);
if (modernToolNames.length !== 6) fail(`Modern MCP expected 6 tools, received ${modernToolNames.length}`);
for (const name of [...requiredTools, 'dant3_join_machine']) {
  if (!modernToolNames.includes(name)) fail(`Modern MCP tools/list missing ${name}`);
}
if (modernToolNames.includes('dant3_list_jobs')) fail('Modern MCP still exposes retired dant3_list_jobs');

const report = {
  mcpOk: true,
  endpoint: ENDPOINT,
  registryVersion: registry.version,
  negotiatedProtocol: init.payload.result.protocolVersion,
  modernProtocol: '2026-07-28',
  server: init.payload.result.serverInfo,
  session: Boolean(init.sessionId),
  tools: toolNames,
  discovery: {
    manifestReachable: true,
    llmsReachable: true,
    robotsReachable: true,
    issues: discoveryIssues,
  },
};
console.log(JSON.stringify(report, null, 2));

if (process.env.FAIL_ON_DISCOVERY_DRIFT === 'true' && discoveryIssues.length) {
  fail(`MCP handshake passed but machine discovery is stale: ${discoveryIssues.join('; ')}`);
}
