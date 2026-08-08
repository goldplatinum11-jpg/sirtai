import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function run(...args) {
  return spawnSync(process.execPath, ["bin/sirt.mjs", ...args], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
}

test("help and endpoints show Japanese launch guidance", () => {
  const help = run("help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /SIRT Brain 接続ヘルパー v2\.1\.0/);
  assert.match(help.stdout, /このCLIはSIRT APIキーを要求・保存しません/);

  const endpoints = run("endpoints");
  assert.equal(endpoints.status, 0);
  assert.match(endpoints.stdout, /MCP core（claude\.ai）/);
  assert.match(endpoints.stdout, /https:\/\/app\.sirtai\.org\/mcp\/readonly/);
});

test("version and unknown-command behavior remain stable", () => {
  const version = run("version");
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "2.1.0");

  const unknown = run("unknown");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /不明なコマンドです/);
});

test("memory and routines keep AI work on the connected subscription", () => {
  const memory = run("memory");
  assert.equal(memory.status, 0);
  assert.match(memory.stdout, /sirt_smart_save exactly once/);
  assert.match(memory.stdout, /maximum 12,000 characters/);
  assert.match(memory.stdout, /Never call server crystallize/);

  const daily = run("routine", "daily");
  assert.equal(daily.status, 0);
  assert.match(daily.stdout, /sirt_nodes_list with sort=newest and limit=50/);
  assert.match(daily.stdout, /save nothing/);

  const weekly = run("routine", "weekly");
  assert.equal(weekly.status, 0);
  assert.match(weekly.stdout, /limit=100/);
  assert.match(weekly.stdout, /supersedes_node_ids/);
});
