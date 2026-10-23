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
  'dant3_join_machine',
  'dant3_platform_overview',
];
for (const name of requiredTools) {
  if (!toolNames.includes(name)) fail(`MCP tools/list missing ${name}`);
}
if (toolNames.includes('dant3_list_jobs')) fail('MCP tools/list must not restore retired dant3_list_jobs');
if (toolNames.length !== 6) fail(`MCP tools/list expected 6 tools, received ${toolNames.length}`);
const joinTool = tools.payload?.result?.tools?.find((tool) => tool.name === 'dant3_join_machine');
if (joinTool?.inputSchema?.properties?.confirm?.const !== 'JOIN_DANT3') fail('MCP join confirmation contract drifted');
if (joinTool?.annotations?.readOnlyHint !== false || joinTool?.annotations?.idempotentHint !== false) {
  fail('MCP join authority annotations drifted');
}

const modernResponse = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
    'mcp-protocol-version': '2026-07-28',
    'mcp-method': 'server/discover',
    'user-agent': 'dant3-mcp-modern-discovery-smoke/1.2',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 20,
    method: 'server/discover',
    params: {
      _meta: {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    },
  }),
  redirect: 'error',
});
const modernText = await modernResponse.text();
if (!modernResponse.ok) fail(`MCP modern server/discover returned HTTP ${modernResponse.status}: ${modernText.slice(0, 500)}`);
const modern = parseRpcBody(modernText, modernResponse.headers.get('content-type') || '', 20);
if (modern?.result?.serverInfo?.name !== 'dant3') fail('MCP modern discovery did not return dant3 serverInfo');
const modernVersions = modern?.result?.supportedVersions || [];
if (!modernVersions.includes('2026-07-28')) fail('MCP modern discovery must advertise 2026-07-28');

const overview = await rpc({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name: 'dant3_platform_overview', arguments: {} },
}, init.sessionId, 3);
if (!overview.payload?.result?.content?.length) fail('MCP platform overview returned no content');

const report = {
  mcpOk: true,
  endpoint: ENDPOINT,
  registryVersion: registry.version,
  negotiatedProtocol: init.payload.result.protocolVersion,
  server: init.payload.result.serverInfo,
  session: Boolean(init.sessionId),
  tools: toolNames,
  discovery: {
    manifestReachable: true,
    llmsReachable: true,
    robotsReachable: true,
    issues: discoveryIssues,
  },
  modernDiscovery: {
    ok: true,
    supportedVersions: modernVersions,
  },
};
console.log(JSON.stringify(report, null, 2));

if (process.env.FAIL_ON_DISCOVERY_DRIFT === 'true' && discoveryIssues.length) {
  fail(`MCP handshake passed but machine discovery is stale: ${discoveryIssues.join('; ')}`);
}
