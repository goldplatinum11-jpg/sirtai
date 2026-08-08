# sirtai

The official connection helper for [SIRT Brain](https://app.sirtai.org) — shared memory for Claude, ChatGPT, and other MCP clients.

## Connect

```bash
npx sirtai init
```

The command prints the supported signup, API-key claim, and connection flow. It does not ask for or store your API key.

If you already have a key, open [Connect Center](https://app.sirtai.org/connect-center) or follow the [quickstart](https://app.sirtai.org/docs/quickstart).

## Commands

| Command | Description |
|---------|-------------|
| `sirt init` | Show the supported signup and connection flow |
| `sirt endpoints` | Show current MCP and GPT endpoints |
| `sirt doctor` | Check the live SIRT Brain service |
| `sirt version` | Print the CLI version |

Current plans and prices are published on the [SIRT Brain pricing page](https://app.sirtai.org/pricing).

## License

MIT
