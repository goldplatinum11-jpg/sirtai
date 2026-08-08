#!/usr/bin/env node

const VERSION = "2.0.0";
const APP_URL = "https://app.sirtai.org";
const SIGNUP_URL = `${APP_URL}/signup`;
const CONNECT_URL = `${APP_URL}/connect-center`;
const QUICKSTART_URL = `${APP_URL}/docs/quickstart`;
const PRICING_URL = `${APP_URL}/pricing`;

function printSetup() {
  console.log(`SIRT Brain setup\n
1. Choose a plan or start signup:
   ${SIGNUP_URL}

2. After checkout, claim the one-time API key from the confirmation page.

3. Connect Claude, Claude Code, ChatGPT, or another MCP client:
   ${CONNECT_URL}

Full quickstart:
   ${QUICKSTART_URL}

Pricing:
   ${PRICING_URL}`);
}

function printEndpoints() {
  console.log(`SIRT Brain endpoints

MCP core:       ${APP_URL}/mcp/core
MCP OAuth:      ${APP_URL}/mcp
MCP read-only:  ${APP_URL}/mcp/readonly
GPT Actions:    ${APP_URL}/gpt/v1

Connection guide:
  ${QUICKSTART_URL}`);
}

function printHelp() {
  console.log(`sirt — SIRT Brain connection helper v${VERSION}

Commands:
  init          Show the supported signup and connection flow
  endpoints     Show current MCP and GPT endpoints
  doctor        Check the live SIRT Brain service
  version       Print the CLI version
  help          Show this help

This CLI never asks for or stores your SIRT API key. Use Connect Center for setup:
  ${CONNECT_URL}`);
}

async function doctor() {
  let response;
  try {
    response = await fetch(`${APP_URL}/health`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error(`SIRT Brain is unreachable: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!response.ok) {
    console.error(`SIRT Brain health check failed: HTTP ${response.status}`);
    process.exitCode = 1;
    return;
  }

  const body = await response.json().catch(() => ({}));
  if (body.ok !== true) {
    console.error("SIRT Brain returned an unexpected health response.");
    process.exitCode = 1;
    return;
  }

  console.log(`SIRT Brain is live: ${APP_URL}`);
  console.log(`Connect: ${CONNECT_URL}`);
}

const command = process.argv[2] || "help";

switch (command) {
  case "init":
  case "connect":
    printSetup();
    break;
  case "endpoints":
    printEndpoints();
    break;
  case "doctor":
    await doctor();
    break;
  case "version":
  case "--version":
  case "-v":
    console.log(VERSION);
    break;
  case "help":
  case "--help":
  case "-h":
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run `sirt help` for the supported launch commands.");
    process.exitCode = 1;
}
