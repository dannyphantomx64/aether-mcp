# Example configs

Copy-paste-ready configurations for the major MCP-compatible AI clients.

| File | For | Where it goes |
|---|---|---|
| `claude-desktop.json` | Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| `cursor.json` | Cursor | `~/.cursor/mcp.json` (or per-project at `.cursor/mcp.json`) |
| `cline.json` | Cline (VS Code extension) | Cline settings → MCP Servers → Edit MCP Settings |
| `zed.json` | Zed | `~/.config/zed/settings.json` |
| `with-ida-pro.json` | Cursor / Claude Desktop with IDA Pro pairing | Same location as your AI client's MCP config |

After pasting, **replace the example `ak_live_…` value** with your real
key from <https://trynoguard.com/account>.

## Verify it's working

After restarting your AI client, ask in chat:

> Use `aether_balance` to check my Aether credit balance.

If it works, you'll see your plan, balance, and rate-limit headroom. If
it errors, see the [troubleshooting section in the setup walkthrough](https://trynoguard.com/mcp/setup#troubleshooting).
