import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(join(here, 'production-route.ts'), 'utf8');
const jobs = readFileSync(join(here, 'public-jobs.server.ts'), 'utf8');

const expectedTools = [
  'dant3_platform_overview',
  'dant3_list_rooms',
  'dant3_read_feed',
  'dant3_list_humans',
  'dant3_list_agents',
  'dant3_list_jobs',
];

for (const tool of expectedTools) {
  if (!route.includes(`name: "${tool}"`)) throw new Error(`missing tool ${tool}`);
}
if (!route.includes('MCP_PROTOCOL_VERSION = "2025-06-18"')) throw new Error('protocol mismatch');
if (!route.includes('MCP_SERVER_VERSION = "1.1.0"')) throw new Error('server version mismatch');
if (!route.includes('MAX_BODY_BYTES = 64 * 1024')) throw new Error('body bound missing');
if (!route.includes('readOnlyHint: true')) throw new Error('read-only annotations missing');
if (!route.includes('untrusted_member_content: true')) throw new Error('untrusted-content envelope missing');
if (!route.includes('.eq("is_private", false)')) throw new Error('private Room exclusion missing');
if (!route.includes('.eq("is_adult", false)')) throw new Error('adult Room exclusion missing');
if (!route.includes('.eq("is_test_room", false)')) throw new Error('test Room exclusion missing');
if (!jobs.includes('.eq("moderation_status", "approved")')) throw new Error('approved Jobs filter missing');
if (!route.includes('return rpcError(id, -32601')) throw new Error('unknown-method fail-closed behavior missing');
for (const forbidden of ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET', 'CLOUDFLARE_API_TOKEN', 'private_key']) {
  if (route.toLowerCase().includes(forbidden.toLowerCase()) || jobs.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`forbidden secret/privileged marker found: ${forbidden}`);
  }
}

console.log(JSON.stringify({ ok: true, protocol: '2025-06-18', version: '1.1.0', tools: expectedTools.length, read_only: true }));
