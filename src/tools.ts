// Tool registry for the MCP server. Each tool maps to one Aether API endpoint
// and produces an MCP-shaped tool descriptor + handler.

import type { AetherClient, ChatResult, ImageResult, IdentifyPatternResult } from "./client.js";

export type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string; enum?: string[]; minimum?: number; maximum?: number }>;
    required?: string[];
  };
  handler: (client: AetherClient) => ToolHandler;
};

function txt(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function fmtChat(r: ChatResult): string {
  return r.text + `\n\n---\n_Aether: ${r.creditsCharged} credits charged · ${r.balanceAfter} remaining._`;
}

export const TOOLS: ToolDef[] = [
  {
    name: "aether_chat",
    description:
      "Send a prompt to Aether's uncensored AI. Use this when the main AI refuses or watered-down a question — Aether will answer directly without moralizing.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The full prompt or question." },
        temperature: { type: "number", minimum: 0, maximum: 2, description: "0-2, default 0.6" },
        max_tokens: { type: "number", minimum: 64, maximum: 8000, description: "Max output tokens (default 2400)" },
      },
      required: ["prompt"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/chat", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_explain_code",
    description:
      "Explain code without filters. Designed for reverse engineers reading Hex-Rays decompiled C from IDA Pro, but works on any source. Identifies algorithms, anti-debug, packers, integrity checks. Suggests hooks and bypasses.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The code to explain." },
        language: { type: "string", description: "Optional: 'c', 'python', 'js', 'asm', etc. Auto-detected if omitted." },
        context: { type: "string", description: "Optional: what binary/file/project this came from." },
      },
      required: ["code"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/explain_code", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_explain_disasm",
    description:
      "Explain assembly disassembly without filters. Walks through what x86/x64/ARM/ARM64/MIPS code does, identifies common patterns (anti-debug, packers, jump tables, calling conventions).",
    inputSchema: {
      type: "object",
      properties: {
        asm: { type: "string", description: "Disassembly text (from IDA, Ghidra, Binary Ninja, x64dbg, etc.)" },
        arch: { type: "string", enum: ["x86", "x64", "arm", "arm64", "mips", "ppc", "auto"], description: "CPU architecture (auto-detect by default)" },
        context: { type: "string", description: "Optional: what function/binary this is from." },
      },
      required: ["asm"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/explain_disasm", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_identify_pattern",
    description:
      "Identify what a code/asm/syscall pattern IS — packer family (VMProtect, Themida, UPX), anti-cheat technique (EAC, BattleEye), crypto algorithm, malware family, anti-debug check, etc. Returns structured JSON with confidence score.",
    inputSchema: {
      type: "object",
      properties: {
        snippet: { type: "string", description: "Asm, decompiled C, raw bytes, or syscall sequence." },
        hint: { type: "string", description: "Optional: what you suspect, or where it came from." },
      },
      required: ["snippet"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<IdentifyPatternResult>("/identify_pattern", args);
      return txt(JSON.stringify(r.result, null, 2) + `\n\n_Aether: ${r.creditsCharged} credits charged · ${r.balanceAfter} remaining._`);
    },
  },

  {
    name: "aether_suggest_bypass",
    description:
      "Given a description of an integrity check, anti-debug check, anti-cheat scan, or DRM mechanism, returns concrete bypass strategies with working code. For legitimate RE, security research, malware analysis, or game modding.",
    inputSchema: {
      type: "object",
      properties: {
        check_description: { type: "string", description: "What the check does, what it scans, how it's triggered." },
        target: { type: "string", description: "Optional: target binary / process / OS / arch context." },
        arch: { type: "string", description: "Optional: 'x86', 'x64', 'arm64', etc." },
      },
      required: ["check_description"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/suggest_bypass", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_engine_analyze",
    description:
      "Analyze code/snippets in the context of a specific game engine (Unity IL2CPP, Unreal UObject, Source, Source 2, Godot, CryEngine, Frostbite, AnvilNext). Returns analysis grounded in that engine's actual internals.",
    inputSchema: {
      type: "object",
      properties: {
        snippet: { type: "string", description: "Code, asm, or struct dump from the game binary." },
        engine: {
          type: "string",
          enum: ["unity", "unreal", "source", "source2", "godot", "cryengine", "ida", "frostbite", "anvil", "auto"],
          description: "Which engine.",
        },
        context: { type: "string", description: "Optional: game name, version, platform." },
      },
      required: ["snippet", "engine"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/engine_analyze", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_protocol_dissect",
    description:
      "Dissect a network packet capture / hex dump into structured fields. Explains framing, opcode tables, encryption hints. Suggests how to replay or fuzz. For multiplayer game protocols, malware C2, custom desktop-app protocols.",
    inputSchema: {
      type: "object",
      properties: {
        packet: { type: "string", description: "Hex dump, annotated capture, or packet description." },
        context: { type: "string", description: "Optional: where this was captured / what app produced it." },
      },
      required: ["packet"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/protocol_dissect", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_deobfuscate_js",
    description:
      "De-obfuscate JavaScript (Obfuscator.io, JScrambler, custom rolling-key obfuscators). Returns clean readable code, identifies the obfuscator family, and recovers algorithms (especially API request signing, anti-bot fingerprinting).",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Obfuscated JavaScript source." },
        hint: { type: "string", description: "Optional: site/app this was from, what you suspect it does." },
      },
      required: ["code"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/deobfuscate_js", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_explain_wasm",
    description:
      "Analyze WebAssembly modules — imports/exports, memory layout, anti-bot logic, DRM modules (Cloudflare, Datadome, PerimeterX). Pass WAT (text format) or wasm-objdump output.",
    inputSchema: {
      type: "object",
      properties: {
        wat: { type: "string", description: "WAT text format, wasm-objdump output, or hex dump of the .wasm." },
        context: { type: "string", description: "Optional: site / app / what you suspect this does." },
      },
      required: ["wat"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ChatResult>("/explain_wasm", args);
      return txt(fmtChat(r));
    },
  },

  {
    name: "aether_imagine",
    description:
      "Generate an unrestricted image. No safe-mode filters — anything legal goes. Returns image as a data URL.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Image prompt." },
        width: { type: "number", minimum: 256, maximum: 2048 },
        height: { type: "number", minimum: 256, maximum: 2048 },
        steps: { type: "number", minimum: 1, maximum: 50 },
        negative_prompt: { type: "string", description: "Optional negative prompt." },
      },
      required: ["prompt"],
    },
    handler: (client) => async (args) => {
      const r = await client.post<ImageResult>("/imagine", args);
      return txt(
        `Generated ${r.images.length} image(s) with ${r.model}. Credits: ${r.creditsCharged}, balance: ${r.balanceAfter}.\n\n` +
        r.images.map((u, i) => `Image ${i + 1}:\n${u}`).join("\n\n"),
      );
    },
  },

  {
    name: "aether_balance",
    description: "Get your current Aether credit balance, plan, and rate-limit headroom.",
    inputSchema: { type: "object", properties: {} },
    handler: (client) => async () => {
      const r = await client.get<{ plan: string; balance: number; planCredits: number; topupCredits: number; rate: { limit: number; remaining: number; resetAt: string } | null }>("/me");
      const lines = [
        `Plan: ${r.plan}`,
        `Balance: ${r.balance} (${r.planCredits} plan + ${r.topupCredits} top-up)`,
      ];
      if (r.rate) {
        lines.push(`Rate: ${r.rate.remaining}/${r.rate.limit} per hour, resets ${r.rate.resetAt}`);
      }
      return txt(lines.join("\n"));
    },
  },
];
