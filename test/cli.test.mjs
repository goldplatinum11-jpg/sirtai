import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../bin/sirt.mjs", import.meta.url));

function run(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

test("init points a customer to the live signup and connection flow", () => {
  const result = run("init");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/signup/);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/connect-center/);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/docs\/quickstart/);
  assert.doesNotMatch(result.stdout, /API key:/i);
});

test("endpoints match the live product contract", () => {
  const result = run("endpoints");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/mcp\/core/);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/mcp\/readonly/);
  assert.match(result.stdout, /https:\/\/app\.sirtai\.org\/gpt\/v1/);
  assert.doesNotMatch(result.stdout, /workers\.dev|\/v2\//);
});

test("source does not disable TLS verification or advertise stale prices", () => {
  const source = readFileSync(cli, "utf8");
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

  assert.doesNotMatch(source, /rejectUnauthorized/);
  assert.doesNotMatch(readme, /\$29|\$99|\$199|Free|Pro|Max\+/);
});

test("unknown commands fail closed with the supported help path", () => {
  const result = run("search", "old-contract");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command: search/);
  assert.match(result.stderr, /sirt help/);
});
