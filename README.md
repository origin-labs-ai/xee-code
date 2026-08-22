# DSH-Enhanced 🚀

**DeepSeek Harness Enhanced** - The Ultimate AI Coding Agent Platform

> *"A harness just made to win!"*

English | [中文](README.zh.md)

## What is DSH-Enhanced?

DSH-Enhanced is a **supercharged fork** of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) by **Origin Labs AI**. It includes:

### ✨ Core Features from DeepSeek Harness
- **Plugin Architecture**: Everything is a plugin, powered by [Cordis](https://github.com/cordiverse/cordis)
- **Web UI**: Full-featured browser-based interface
- **CLI**: Powerful command-line interface
- **Multi-Agent Support**: Advanced agent orchestration

### 🔥 DSH-Enhanced Exclusive Features

#### 1. **Enhanced Gauntlet-Loop (Never-Give-Up Mode)** 
- Infinite iteration capability - runs for **weeks if needed**
- Builder-Critic pattern with blind evaluation
- **NEVER says "impossible"** - keeps trying until success
- Automatic strategy switching when stuck
- Progress persistence across sessions

#### 2. **Fuzzy Autocomplete for Slash Commands**
- IDE-style autocomplete as you type `/`
- Closest match suggestions in real-time
- Fuzzy matching algorithm (like VS Code/Cursor)
- Command discovery and learning

#### 3. **Token-Efficient Lazy Loading**
- Skills are **NOT loaded into system prompt**
- Activates ONLY on explicit slash command invocation
- Saves **thousands of tokens** per session
- Claude Code style efficiency

#### 4. **All Popular GitHub Skills Included**
- `/review` - Comprehensive code review
- `/test` - Test generation & execution  
- `/commit` - Smart git workflow
- `/debug` - Intelligent debugging
- `/security` - Security scanning
- `/refactor` - Code refactoring
- `/gauntlet` - Quality assurance loops
- `/uiux` - Frontend development
- And **25+ more commands**!

#### 5. **Universal Visibility**
- Works in **Web UI**, **CLI**, **VS Code**, **JetBrains**
- All DSH interfaces supported
- Consistent experience everywhere

## Quick Start

### Run from npm (Recommended)
```sh
npx @origin-labs-ai/dsh-enhanced web
```

### Run from Source
```sh
git clone https://github.com/origin-labs-ai/DSH-Enhanced.git
cd DSH-Enhanced
pnpm install
pnpm run build
pnpm dsh web
```

The Web UI starts at `http://127.0.0.1:3080` by default.

## Available Slash Commands

Type `/` in any interface to see available commands:

| Command | Description |
|---------|-------------|
| `/review` | Deep code review with suggestions |
| `/test` | Generate & run tests |
| `/commit` | Smart git commits |
| `/debug` | Debug issues intelligently |
| `/security` | Scan for vulnerabilities |
| `/refactor` | Improve code quality |
| `/gauntlet` | Run quality assurance loop |
| `/help` | Show all commands |

## Architecture

```
DSH-Enhanced/
├── packages/
│   ├── popular-skills/     # ← NEW: 25+ slash commands
│   ├── core/               # Core DSH functionality
│   ├── host/               # Web server & API
│   └── extensions/         # Cordis plugins
├── .agents/skills/
│   └── dsh-popular-skills/ # ← NEW: Skill definitions
├── apps/                   # Applications
└── website/                # Documentation
```

## Developer Preview

⚠️ Based on DeepSeek Harness (currently in developer preview). Rapid iteration ongoing.

## Community & Support

- **GitHub Issues**: [Report bugs](https://github.com/origin-labs-ai/DSH-Enhanced/issues)
- **Discussions**: [Join conversation](https://github.com/origin-labs-ai/DSH-Enhanced/discussions)
- **Original DSH Discord**: [DeepSeek community](https://discord.gg/Ycq5dCaS4)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Star the repo** if you find it useful! ⭐

## License

[MIT](LICENSE) - Based on DeepSeek Harness, enhanced by Origin Labs AI.

---

**Built with ❤️ by Origin Labs AI** | Powered by [DeepSeek](https://deepseek.com)
