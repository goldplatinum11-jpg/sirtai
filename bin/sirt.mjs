#!/usr/bin/env node

const VERSION = "2.1.0";
const APP_URL = "https://app.sirtai.org";
const SIGNUP_URL = `${APP_URL}/signup`;
const CONNECT_URL = `${APP_URL}/connect-center`;
const QUICKSTART_URL = `${APP_URL}/docs/quickstart`;
const PRICING_URL = `${APP_URL}/pricing`;

function printSetup() {
  console.log(`SIRT Brain 接続セットアップ\n
1. プランを選択して申し込みます。
   ${SIGNUP_URL}

2. 決済完了後の受取ページで、一度だけ表示されるAPIキーをコピーします。

3. 接続センターでClaude、Claude Code、ChatGPT、Grokなどを接続します。
   ${CONNECT_URL}

詳しい接続ガイド:
   ${QUICKSTART_URL}

料金:
   ${PRICING_URL}`);
}

function printEndpoints() {
  console.log(`SIRT Brain 接続先

MCP core（claude.ai）: ${APP_URL}/mcp/core
MCP OAuth:              ${APP_URL}/mcp
MCP 読み取り専用:       ${APP_URL}/mcp/readonly
GPT Actions:            ${APP_URL}/gpt/v1

接続ガイド:
  ${QUICKSTART_URL}`);
}

const SAVE_PROMPT = `Use your current AI subscription to structure this conversation into one durable SIRT memory.
Keep only a reusable decision, outcome, fact, constraint, unresolved question, or handoff.
Search SIRT first when duplication is possible. Then call sirt_smart_save exactly once with:
- summary: direct retrieval title, maximum 240 characters
- body: complete standalone context, maximum 12,000 characters
- the closest node_type and only useful stable labels
Treat a duplicate response as already saved. Never call server crystallize, Night Run, URL ingest, or similarity tools. Never silently truncate.`;

const DAILY_PROMPT = `Run the SIRT daily memory routine using your current AI subscription.
Call sirt_nodes_list with sort=newest and limit=50. Identify the single most durable new outcome not already represented. If there is no material change, save nothing. Otherwise structure one canonical memory and call sirt_smart_save exactly once. Never call server crystallize or Night Run.`;

const WEEKLY_PROMPT = `Run the SIRT weekly memory routine using your current AI subscription.
Call sirt_nodes_list with sort=newest and limit=100. Find one durable decision, changed direction, or cross-session synthesis. Search its key terms before writing. Save nothing if an existing memory is sufficient; otherwise call sirt_smart_save exactly once, using supersedes_node_ids only when the new memory genuinely replaces older active memories. Never call server crystallize or Night Run.`;

function printMemorySkill() {
  console.log(`SIRT Memory（BYOS）\n\nこの指示を接続済みのClaude、ChatGPT、Grok、Codexへ渡してください。\n\n${SAVE_PROMPT}`);
}

function printRoutine(period) {
  if (period === "daily") {
    console.log(`SIRT Daily Routine（BYOS）\n\n${DAILY_PROMPT}`);
    return;
  }
  if (period === "weekly") {
    console.log(`SIRT Weekly Routine（BYOS）\n\n${WEEKLY_PROMPT}`);
    return;
  }
  console.error("使い方: sirt routine daily | sirt routine weekly");
  process.exitCode = 1;
}

function printHelp() {
  console.log(`sirt — SIRT Brain 接続ヘルパー v${VERSION}

コマンド:
  init          申し込みから接続までの手順を表示
  endpoints     現在のMCP・GPT接続先を表示
  doctor        SIRT Brainの稼働状態を確認
  memory        接続AI側で1件の記憶を整理・保存する指示を表示
  routine daily 接続AI側で日次ルーティーンを実行する指示を表示
  routine weekly 接続AI側で週次ルーティーンを実行する指示を表示
  version       CLIのバージョンを表示
  help          このヘルプを表示

このCLIはSIRT APIキーを要求・保存しません。設定は接続センターで行います。
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
    console.error(`SIRT Brainに接続できません: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!response.ok) {
    console.error(`SIRT Brainの稼働確認に失敗しました: HTTP ${response.status}`);
    process.exitCode = 1;
    return;
  }

  const body = await response.json().catch(() => ({}));
  if (body.ok !== true) {
    console.error("SIRT Brainから想定外の応答が返りました。");
    process.exitCode = 1;
    return;
  }

  console.log(`SIRT Brain is live（稼働中）: ${APP_URL}`);
  console.log(`接続センター: ${CONNECT_URL}`);
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
  case "memory":
  case "skill":
    printMemorySkill();
    break;
  case "routine":
    printRoutine(process.argv[3]);
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
    console.error(`不明なコマンドです: ${command}`);
    console.error("`sirt help` で利用できるコマンドを確認してください。");
    process.exitCode = 1;
}
