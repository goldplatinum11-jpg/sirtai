import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function run(command) {
  return spawnSync(process.execPath, ["bin/sirt.mjs", command], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
}

test("help and endpoints show Japanese launch guidance", () => {
  const help = run("help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /SIRT Brain 接続ヘルパー v2\.0\.1/);
  assert.match(help.stdout, /このCLIはSIRT APIキーを要求・保存しません/);

  const endpoints = run("endpoints");
  assert.equal(endpoints.status, 0);
  assert.match(endpoints.stdout, /MCP core（claude\.ai）/);
  assert.match(endpoints.stdout, /https:\/\/app\.sirtai\.org\/mcp\/readonly/);
});

test("version and unknown-command behavior remain stable", () => {
  const version = run("version");
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "2.0.1");

  const unknown = run("unknown");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /不明なコマンドです/);
});
