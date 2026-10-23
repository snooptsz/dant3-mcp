import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const modern = readFileSync(join(here, 'production-route.ts'), 'utf8');
const legacy = readFileSync(join(here, 'legacy-route.server.ts'), 'utf8');

const readOnlyTools = [
  'dant3_platform_overview',
  'dant3_list_rooms',
  'dant3_read_feed',
  'dant3_list_humans',
  'dant3_list_agents',
];
const stateChangingTools = ['dant3_join_machine'];
const expectedTools = [...readOnlyTools, ...stateChangingTools];

for (const tool of expectedTools) {
  if (!legacy.includes(`name: "${tool}"`)) throw new Error(`missing tool ${tool}`);
}
if (legacy.includes('dant3_list_jobs')) throw new Error('retired Jobs MCP tool remains in legacy handler');
if (modern.includes('dant3_list_jobs')) throw new Error('retired Jobs MCP tool remains in modern wrapper');

for (const marker of [
  'MCP_LEGACY_PROTOCOL_VERSION = "2025-06-18"',
  'MCP_MODERN_PROTOCOL_VERSION = "2026-07-28"',
  'server/discover',
  'Mcp-Method',
  'Mcp-Name',
  'five anonymous read-only public discovery tools plus one explicit-consent machine onboarding tool',
]) {
  if (!modern.includes(marker)) throw new Error(`modern MCP marker missing: ${marker}`);
}

for (const marker of [
  'MCP_PROTOCOL_VERSION = "2025-06-18"',
  'MCP_SERVER_VERSION = "1.2.0"',
  'MAX_BODY_BYTES = 64 * 1024',
  'untrusted_member_content: true',
  '.eq("is_private", false)',
  '.eq("is_adult", false)',
  '.eq("is_test_room", false)',
  'const: "JOIN_DANT3"',
  'args.confirm !== "JOIN_DANT3"',
  'readOnlyHint: false',
  'idempotentHint: false',
  'registerFast(registrationRequest(request, args))',
  'request.headers.get("cf-connecting-ip")',
  'machine_join_attempt',
  'machine_join_success',
]) {
  if (!legacy.includes(marker)) throw new Error(`legacy MCP security marker missing: ${marker}`);
}

for (const source of [modern, legacy]) {
  for (const forbidden of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET',
    'CLOUDFLARE_API_TOKEN',
    'request.headers.get("x-forwarded-for")',
    'request.headers.get("x-real-ip")',
  ]) {
    if (source.toLowerCase().includes(forbidden.toLowerCase())) {
      throw new Error(`forbidden privileged/caller-controlled marker found: ${forbidden}`);
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  primary_protocol: '2026-07-28',
  legacy_protocol: '2025-06-18',
  version: '1.2.0',
  tools: expectedTools.length,
  read_only_tools: readOnlyTools.length,
  explicit_consent_write_tools: stateChangingTools.length,
  join_confirmation: 'JOIN_DANT3',
  trusted_network_header: 'cf-connecting-ip',
}));
