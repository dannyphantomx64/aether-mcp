# @aether/mcp

Uncensored AI tools for any [Model Context Protocol](https://modelcontextprotocol.io) client — Claude Desktop, Cursor, Cline, Zed, Continue, and others.

When your main AI refuses a question, **Aether answers it.** Built for reverse engineers, malware analysts, security researchers, fiction writers, and anyone tired of hedged-out, watered-down responses on legal-but-edgy topics.

## What's in the box

11 tools, all backed by Aether's uncensored model:

| Tool | What it does |
|---|---|
| `aether_chat` | Direct uncensored chat. |
| `aether_explain_code` | Explain code without filters — designed for IDA Pro Hex-Rays output, but works on any source. |
| `aether_explain_disasm` | Walk through x86/x64/ARM/MIPS disassembly. Identifies anti-debug, packers, calling conventions. |
| `aether_identify_pattern` | Identify what a code/asm pattern IS — VMProtect, Themida, EAC, BattleEye, custom crypto, etc. Returns structured JSON. |
| `aether_suggest_bypass` | Given an integrity check / anti-cheat / DRM mechanism, returns concrete bypass strategies with working code. |
| `aether_engine_analyze` | Game-engine-aware analysis: Unity (IL2CPP), Unreal (UObject), Source, Source 2, Godot, CryEngine, Frostbite, AnvilNext. |
| `aether_protocol_dissect` | Dissect a network packet capture into structured fields. For multiplayer games, malware C2, custom protocols. |
| `aether_deobfuscate_js` | De-obfuscate JavaScript. Identifies Obfuscator.io / JScrambler / custom obfuscators, recovers signing algorithms. |
| `aether_explain_wasm` | Analyze WebAssembly modules. Targets browser anti-bot (Cloudflare, Datadome, PerimeterX, Akamai). |
| `aether_imagine` | Unrestricted image generation. |
| `aether_balance` | Show your credit balance and rate-limit headroom. |

## Install

```bash
# No install needed — npx fetches it on demand.
npx -y @aether/mcp
```

You don't run this directly. Instead, your AI client launches it as a child process. Add the config below.

## Get an API key

1. Sign up at <https://trynoguard.com> — free 150 credits/day, no card.
2. Open <https://trynoguard.com/account> → **API keys** → **+ New key**.
3. Copy the `ak_live_…` key (shown only once).

## Configure your MCP client

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["-y", "@aether/mcp"],
      "env": {
        "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
      }
    }
  }
}
```

Restart Claude Desktop. You'll see the Aether tools in the tool palette.

### Cursor

`~/.cursor/mcp.json` (or per-project at `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["-y", "@aether/mcp"],
      "env": { "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }
    }
  }
}
```

### Cline (VS Code)

In Cline settings → **MCP Servers** → **Edit MCP Settings**:

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["-y", "@aether/mcp"],
      "env": { "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Zed

`~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "aether": {
      "command": {
        "path": "npx",
        "args": ["-y", "@aether/mcp"],
        "env": { "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }
      }
    }
  }
}
```

### Continue

`~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@aether/mcp"],
          "env": { "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }
        }
      }
    ]
  }
}
```

## Pair with [ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp)

The combo unlocks the killer reverse-engineering workflow. Install both MCPs in Claude Desktop / Cursor:

```json
{
  "mcpServers": {
    "ida": {
      "command": "python",
      "args": ["-m", "ida_pro_mcp"]
    },
    "aether": {
      "command": "npx",
      "args": ["-y", "@aether/mcp"],
      "env": { "AETHER_API_KEY": "ak_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }
    }
  }
}
```

Then in your AI chat:

> *"Decompile `sub_18000A4C0` from IDA, identify what kind of integrity check it is, and suggest a bypass."*

Your AI client calls `ida.get_decompiled_function()` to get the C, then `aether_explain_code()` and `aether_suggest_bypass()` to get the unfiltered analysis. Three steps, zero refusals.

## Hard limits

Aether refuses only:

- CSAM
- Operational planning of real-world violence against specific identifiable people
- Synthesis instructions for weapons of mass destruction (CBRN)
- Active malware deployment against systems you do not own

Everything else — security research, malware analysis, gray-hat web work, controversial research, adult fiction, dark creative writing, blunt opinions, technical questions other AIs hedge on — Aether handles directly.

## Pricing

| Plan | Per-hour rate | API keys | Daily-refresh credits |
|---|---|---|---|
| Free (no card) | 30 calls | 1 | 150 |
| Starter ($15/mo) | 200 calls | 3 | 50 |
| Pro ($35/mo) | 1,000 calls | 5 | 100 |
| Unlimited ($99/mo) | unlimited | 10 | 300 |

Each call charges credits based on actual tokens used — same as the web chat. Top up anytime at <https://trynoguard.com/pay> with crypto (no card on file).

## Privacy

- API keys are SHA-256 hashed at rest. We never see your full key after creation.
- IP and user-agent are logged on every API call for abuse detection (same policy as the web app).
- Your prompts and outputs are not sold. Conversations are not used to train third-party models.

## License

MIT

## Links

- [Aether website](https://trynoguard.com)
- [Account / API keys](https://trynoguard.com/account)
- [Top up credits](https://trynoguard.com/pay)
- [Discord](https://discord.gg/qNbppsTnQM)
