# Changelog

All notable changes to `aether-mcp` are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — initial release

### Added
- 10 tools backed by the Aether uncensored model:
  - `aether_chat` — direct uncensored chat
  - `aether_explain_code` — Hex-Rays / source code analysis
  - `aether_explain_disasm` — x86/x64/ARM/MIPS disassembly walk-through
  - `aether_identify_pattern` — packer / anti-cheat / crypto pattern recognition
  - `aether_suggest_bypass` — concrete bypass strategies for integrity checks
  - `aether_engine_analyze` — Unity/Unreal/Source/Godot game-engine specific analysis
  - `aether_protocol_dissect` — packet capture dissection
  - `aether_deobfuscate_js` — JavaScript obfuscation removal
  - `aether_explain_wasm` — WebAssembly module analysis
  - `aether_imagine` — unrestricted image generation
  - `aether_balance` — credit balance + rate-limit headroom
- MCP stdio transport via `@modelcontextprotocol/sdk@^1.0.0`
- Bearer-token authentication against `https://trynoguard.com/api/v1/*`
- Structured error handling for 401 (invalid key), 402 (out of credits), 429 (rate limited)
- Setup walkthrough at <https://trynoguard.com/mcp/setup>
