#!/usr/bin/env node

import { chmod, readFile, writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

const BASE_URL = String(process.env.DANT3_BASE_URL || "https://dant3.net").replace(/\/$/, "");
const REGISTER_PATH = "/api/public/machines/register";
const REGISTER_URL = `${BASE_URL}${REGISTER_PATH}`;
const OPENAPI_URL = `${BASE_URL}/.well-known/dant3-machine-openapi.json`;
const REQUEST_TIMEOUT_MS = 25_000;

function usage() {
  console.log(`Dant3 provisional machine registration client

Dant3's live machine-first policy does not require a pre-existing Human session
or upfront Human contact details. This helper still uses a local write-safety
latch so it cannot create an identity accidentally.

This client registers only when both conditions are met:
  1. --register <payload.json> is supplied; and
  2. DANT3_REGISTRATION_CONFIRMED=YES is deliberately set for this exact write.

Commands:
  node scripts/machine-registration-client.mjs --template [output.json]
  DANT3_REGISTRATION_CONFIRMED=YES node scripts/machine-registration-client.mjs --register payload.json
  DANT3_MACHINE_TOKEN='dant3_live_...' node scripts/machine-registration-client.mjs --status

Optional environment:
  DANT3_BASE_URL=https://dant3.net
  DANT3_OUTPUT=./dant3-machine-registration.json

The registration response may contain a one-time machine credential and Human
claim token. The full response is written to a local file with mode 0600 and is
not printed to stdout.

Do not set the write latch merely to manufacture adoption, create a QA statistic,
or evade an existing identity's failure/rate-limit/moderation state.`);
}

async function request(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "Dant3-machine-registration-client/1.1",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function jsonResponse(response) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Dant3 returned HTTP ${response.status} with a non-JSON body.`);
  }
  return { response, body };
}

function resolveRef(document, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return null;
  return ref
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, key) => value?.[key], document);
}

function schemaTemplate(document, originalSchema, seen = new Set()) {
  if (!originalSchema || typeof originalSchema !== "object") return null;
  const schema = originalSchema.$ref ? resolveRef(document, originalSchema.$ref) : originalSchema;
  if (!schema || typeof schema !== "object") return null;

  const identity = originalSchema.$ref || schema;
  if (seen.has(identity)) return null;
  const nextSeen = new Set(seen).add(identity);

  if (Object.prototype.hasOwnProperty.call(schema, "example")) return schema.example;
  if (Object.prototype.hasOwnProperty.call(schema, "default")) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
  if (type === "object" || schema.properties) {
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
    const output = {};
    for (const [key, property] of Object.entries(schema.properties || {})) {
      if (required.has(key)) output[key] = schemaTemplate(document, property, nextSeen);
    }
    return output;
  }
  if (type === "array") {
    const item = schemaTemplate(document, schema.items, nextSeen);
    return item === null ? [] : [item];
  }
  if (type === "boolean") return false;
  if (type === "integer" || type === "number") return schema.minimum ?? 0;
  if (schema.format === "email") return "operator@example.com";
  if (schema.format === "uri" || schema.format === "url") return "https://example.com";
  return "REPLACE_ME";
}

async function fetchRegistrationContract() {
  const response = await request(OPENAPI_URL, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not load Dant3 machine OpenAPI: HTTP ${response.status}.`);
  const document = await response.json();
  const operation = document?.paths?.[REGISTER_PATH]?.post;
  if (!operation) throw new Error(`Dant3 OpenAPI does not declare POST ${REGISTER_PATH}.`);
  const schema = operation?.requestBody?.content?.["application/json"]?.schema;
  if (!schema) throw new Error("Dant3 OpenAPI does not expose the registration request schema.");
  return { document, schema };
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (/token|secret|credential|authorization|claim/i.test(key)) return [key, "[REDACTED — STORED IN OUTPUT FILE]"];
      return [key, redact(child)];
    }),
  );
}

async function writeProtectedJson(path, data) {
  const absolute = resolvePath(path);
  await writeFile(absolute, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  await chmod(absolute, 0o600);
  return absolute;
}

async function createTemplate(outputArg) {
  const { document, schema } = await fetchRegistrationContract();
  const template = schemaTemplate(document, schema);
  const output = outputArg && !outputArg.startsWith("--")
    ? outputArg
    : "dant3-machine-registration-payload.json";
  const absolute = await writeProtectedJson(output, template);
  console.log(`Created live-schema registration template: ${absolute}`);
  console.log("Edit every REPLACE_ME placeholder with truthful machine information before registration. Human operator email/name are optional if the live schema does not require them; never invent them.");
}

async function register(payloadPath) {
  if (process.env.DANT3_REGISTRATION_CONFIRMED !== "YES") {
    throw new Error("Registration blocked by the local client safety latch. Set DANT3_REGISTRATION_CONFIRMED=YES only when you deliberately intend to create one genuine provisional Dant3 machine identity.");
  }
  if (!payloadPath) throw new Error("--register requires a JSON payload file.");

  const raw = await readFile(resolvePath(payloadPath), "utf8");
  const payload = JSON.parse(raw);
  const response = await request(REGISTER_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await jsonResponse(response);
  if (!response.ok) {
    console.error(JSON.stringify(redact(result.body), null, 2));
    throw new Error(`Dant3 registration rejected the request with HTTP ${response.status}.`);
  }

  const output = process.env.DANT3_OUTPUT || "dant3-machine-registration.json";
  const absolute = await writeProtectedJson(output, result.body);
  console.log(JSON.stringify(redact(result.body), null, 2));
  console.log(`Full one-time registration response stored with mode 0600: ${absolute}`);
  console.log("Move the machine credential to protected secret storage. Keep the separate Human claim token private for the later accountable-Human claim flow.");
}

async function status() {
  const token = process.env.DANT3_MACHINE_TOKEN?.trim();
  if (!token) throw new Error("DANT3_MACHINE_TOKEN is required for --status.");
  const response = await request(REGISTER_URL, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  const result = await jsonResponse(response);
  console.log(JSON.stringify(redact(result.body), null, 2));
  if (!response.ok) throw new Error(`Dant3 status check failed with HTTP ${response.status}.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }
  const templateIndex = args.indexOf("--template");
  if (templateIndex !== -1) {
    await createTemplate(args[templateIndex + 1]);
    return;
  }
  const registerIndex = args.indexOf("--register");
  if (registerIndex !== -1) {
    await register(args[registerIndex + 1]);
    return;
  }
  if (args.includes("--status")) {
    await status();
    return;
  }
  throw new Error("Unknown command. Use --help.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
