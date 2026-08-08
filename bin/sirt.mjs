#!/usr/bin/env node

const VERSION = "2.0.1";
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

function printHelp() {
  console.log(`sirt — SIRT Brain 接続ヘルパー v${VERSION}

コマンド:
  init          申し込みから接続までの手順を表示
  endpoints     現在のMCP・GPT接続先を表示
  doctor        SIRT Brainの稼働状態を確認
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
