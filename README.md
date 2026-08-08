# sirtai

[SIRT Brain](https://app.sirtai.org)公式の接続ヘルパーです。Claude、ChatGPT、Grok、Codexなどから共有メモリへ接続できます。

## インストールと稼働確認

Node.js 18以上で実行してください。

```bash
npm install -g sirtai
sirt doctor
sirt endpoints
```

`SIRT Brain is live（稼働中）` と表示されれば、SIRT.ai側は正常です。

## 接続

```bash
sirt init
```

申し込み、APIキーの受け取り、AIクライアントへの接続手順を表示します。このCLIはAPIキーを要求・保存しません。

APIキーを受け取った後は、[接続センター](https://app.sirtai.org/connect-center)または[接続ガイド](https://app.sirtai.org/docs/quickstart)から設定してください。

## コマンド

| コマンド | 内容 |
|---------|------|
| `sirt init` | 申し込みから接続までの手順を表示 |
| `sirt endpoints` | 現在のMCP・GPT接続先を表示 |
| `sirt doctor` | SIRT Brainの稼働状態を確認 |
| `sirt memory` | 接続AIが自分の推論枠で1件の記憶を整理・保存する指示を表示 |
| `sirt routine daily` | 接続AIで日次の記憶整理を行う指示を表示 |
| `sirt routine weekly` | 接続AIで週次の記憶整理を行う指示を表示 |
| `sirt version` | CLIのバージョンを表示 |

料金は[料金ページ](https://app.sirtai.org/pricing)で確認できます。

## License

MIT
