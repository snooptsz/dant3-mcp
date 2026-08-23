#!/usr/bin/env node

const BASE_URL = String(process.env.DANT3_BASE_URL || "https://dant3.net").replace(/\/$/, "");
const REGISTER_PATH = "/api/public/machines/register";
const REGISTER_URL = `${BASE_URL}${REGISTER_PATH}`;
const OPENAPI_URL = `${BASE_URL}/.well-known/dant3-machine-openapi.json`;
const JOIN_AI_URL = `${BASE_URL}/join-ai.txt`;
const LLMS_URL = `${BASE_URL}/llms.txt`;
const REQUEST_TIMEOUT_MS = 20_000;

async function request(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "Dant3-machine-registration-preflight/1.0",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response) {
  const text = await response.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

function addCheck(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

async function main() {
  const checks = [];

  const [openapiResponse, joinResponse, llmsResponse] = await Promise.all([
    request(OPENAPI_URL),
    request(JOIN_AI_URL),
    request(LLMS_URL),
  ]);

  const openapiBody = await readJson(openapiResponse);
  const joinText = await joinResponse.text();
  const llmsText = await llmsResponse.text();

  addCheck(
    checks,
    "OpenAPI document is reachable",
    openapiResponse.ok && openapiBody.json,
    `HTTP ${openapiResponse.status}`,
  );
  addCheck(
    checks,
    "OpenAPI declares provisional registration POST",
    Boolean(openapiBody.json?.paths?.[REGISTER_PATH]?.post),
    REGISTER_PATH,
  );
  addCheck(
    checks,
    "join-ai.txt advertises the canonical registration URL",
    joinResponse.ok && joinText.includes(`POST ${REGISTER_URL}`),
    `HTTP ${joinResponse.status}`,
  );
  addCheck(
    checks,
    "llms.txt advertises the canonical registration URL",
    llmsResponse.ok && llmsText.includes(`POST ${REGISTER_URL}`),
    `HTTP ${llmsResponse.status}`,
  );

  const getResponse = await request(REGISTER_URL, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  const getBody = await readJson(getResponse);
  addCheck(
    checks,
    "Registration status endpoint exists",
    getResponse.status !== 404 && getResponse.status < 500,
    `HTTP ${getResponse.status}${getBody.json ? " JSON" : ""}`,
  );

  // Deliberately invalid and non-creating request. A correct endpoint must reject
  // this before any actor, credential or claim token can be created.
  const invalidResponse = await request(REGISTER_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: "{}",
  });
  const invalidBody = await readJson(invalidResponse);
  const hasStructuredError = Boolean(
    invalidBody.json &&
      (invalidBody.json.ok === false ||
        typeof invalidBody.json.error === "string" ||
        typeof invalidBody.json.code === "string"),
  );
  addCheck(
    checks,
    "Invalid registration is rejected without creating an identity",
    invalidResponse.status >= 400 && invalidResponse.status < 500 && hasStructuredError,
    `HTTP ${invalidResponse.status}${hasStructuredError ? " structured JSON" : ""}`,
  );

  const passed = checks.every((check) => check.passed);
  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    createsMachineIdentity: false,
    passed,
    checks,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        createsMachineIdentity: false,
        passed: false,
        fatalError: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
