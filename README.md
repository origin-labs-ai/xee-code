# Xee Harness Enhanced (XHE) 🚀

**Xee Harness Enhanced** — The Ultimate AI Coding Agent Platform

> *"A harness just made to win!"*

Forked from [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (internally referred to as DSH). Public branding is **Xee Harness Enhanced (XHE)** — packages are `@origin-ai/xhe-*` and the CLI is `xhe`.

## What is XHE?

XHE is a **plugin-based agent harness** built on [Cordis](https://github.com/cordiverse/cordis) — everything is a plugin. This fork adds TRANSCRIPT-specified enhancements (GOD runtime, MAD discussion, memory fabric, verification, gauntlet/production sweep and more) on top of the upstream harness.

### Core Features (from upstream)

- **Plugin Architecture** — everything is a plugin, powered by Cordis
- **Web UI** — browser-based interface
- **CLI (`xhe`)** — profile-based launcher with patch-layer bundles
- **Multi-agent support** — session, tools, subagents and more

### XHE Exclusive Features

#### 1. Enhanced Gauntlet-Loop (Never-Give-Up Mode)

- Builder-Critic pattern with blind evaluation
- Automatic strategy switching and progress persistence

#### 2. Fuzzy Autocomplete for Slash Commands

- IDE-style autocomplete as you type `/`
- Fuzzy matching like VS Code/Cursor

#### 3. Token-Efficient Lazy Loading

- Skills activate only on explicit slash command invocation
- Saves thousands of tokens per session

#### 4. 25+ Slash Commands

- `/review`, `/test`, `/commit`, `/debug`, `/security`, `/refactor`, `/gauntlet`, `/help` and more

## Quick Start

### Run from npm

```sh
npx @origin-ai/xhe web
```

### Run from Source

```sh
git clone https://github.com/origin-labs-ai/xhe.git
cd xhe
pnpm install
pnpm run build
pnpm xhe web
```

The Web UI starts at `http://127.0.0.1:3080` by default.

## CLI

| Command                         | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `xhe --profile <name>`          | Boot profile under `$XHE_HOME/profiles/<name>`  |
| `xhe --profile headless "task"` | Single persisted session, print answer and exit |
| `xhe web`                       | Alias of `--profile web`                        |

Full launcher details live in [apps/cli/README.md](apps/cli/README.md).

## Project Layout

```
vendor/    Vendored Cordis source
packages/  @origin-ai/xhe-* workspaces
apps/      CLI (xhe) and web frontend
XHE/       Xee Harness Enhanced — TRANSCRIPT enhancement layer (MAD/GOD/memory/verifier)
docs/      Architecture and subsystem docs
website/   VitePress site
```

`XHE/` is the **Xee Harness Enhanced** enhancement layer referenced as `X_HARNESS` / `X-HARNESS` / `X HARNESS` in TRANSCRIPT (where `X` means `Xee`).

## Development

```sh
pnpm install
pnpm run build
pnpm run test
pnpm run typecheck
```

Key gates: `pnpm run verify-mermaid`, `pnpm run doc-sync`, `pnpm run hygiene`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — Based on DeepSeek Harness, enhanced as Xee Harness Enhanced by Origin AI.

***

**Built by Origin AI** | Powered by the XHE community
