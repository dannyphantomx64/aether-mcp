# CLAUDE.md — instructions for AI coding assistants

This file is read automatically by Claude Code, Cursor, Cline, and other AI
coding tools that look for project-specific guidance. Follow it when making
changes here.

## What this repo is

**`@aether/mcp`** is a published npm package that exposes uncensored AI tools
to any [Model Context Protocol](https://modelcontextprotocol.io) client
(Claude Desktop, Cursor, Cline, Zed, Continue, etc.).

It is a thin client. The actual model lives behind `https://trynoguard.com/api/v1/*`.
This repo only contains the MCP-stdio server that translates tool calls into
HTTP requests against that API.

## Core architecture rules

1. **No business logic in this package.** All real work happens server-side at
   `trynoguard.com/api/v1/*`. This package's job is to: (1) declare tool
   schemas to the MCP host, (2) forward tool calls as HTTP POSTs, (3) format
   responses back as MCP content blocks. If you find yourself implementing
   logic here that isn't translation, stop — it belongs on the server.

2. **Every tool has a 1:1 server endpoint.** `aether_explain_disasm` calls
   `POST /api/v1/explain_disasm`. Adding a new tool requires the matching
   server route to exist first. If it doesn't, open an issue before coding —
   don't ship a tool whose endpoint 404s.

3. **Errors must be human-readable for AI clients.** Claude Desktop / Cursor
   surface raw error messages to the user. The `AetherClient` in
   `src/client.ts` translates HTTP 401/402/429 into messages with actionable
   next steps (top-up URL, key-rotation hint, retry-after time). Preserve
   that — never bubble up a raw `Error: 402` without context.

4. **API keys must NEVER be logged or printed.** The `AETHER_API_KEY` env var
   is sensitive. Don't add `console.log` lines that expose it, don't include
   it in error messages or stack traces. Tests use fake keys (`ak_live_test123`),
   never real ones.

## File map

```
src/
  index.ts        ← MCP stdio server entry. Wires up the SDK, dispatches tool calls.
  client.ts       ← AetherClient: thin HTTP wrapper with structured error handling.
  tools.ts        ← TOOLS registry — one entry per exposed MCP tool.
tests/
  client.test.ts  ← AetherClient HTTP behavior (mocked fetch).
  tools.test.ts   ← Tool registry shape, schema validation, handler smoke tests.
examples/         ← Copy-paste configs for each AI client.
```

## Adding a new tool

1. **Confirm the server endpoint exists.** Check the `app/api/v1/<name>/`
   route on the trynoguard.com side. If missing, open an issue first.
2. Add an entry to the `TOOLS` array in `src/tools.ts`. The shape:
   ```ts
   {
     name: "aether_<snake_case>",
     description: "<one sentence describing the tool to the LLM picking it>",
     inputSchema: {
       type: "object",
       properties: { /* JSON-schema fields */ },
       required: ["..."],
     },
     handler: (client) => async (args) => {
       const r = await client.post<MyResultType>("/<endpoint>", args);
       return { content: [{ type: "text", text: r.text }] };
     },
   }
   ```
3. Add a result type to `src/client.ts` if needed.
4. Add a test in `tests/tools.test.ts` confirming the tool is registered and
   its required fields are valid.
5. Update `README.md` (the tool table) and `tests/tools.test.ts` (the count
   assertion).
6. Run `npm run typecheck && npm test && npm run build` — all must pass.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install deps |
| `npm run typecheck` | TypeScript --noEmit; runs in CI |
| `npm test` | Run tests via tsx + node:test; runs in CI |
| `npm run build` | Compile to `dist/` |
| `npm run dev` | Watch mode with tsx |
| `npm start` | Run the built server (requires `AETHER_API_KEY`) |

## Testing patterns

- Tests use Node's built-in `node:test` runner (no jest/vitest dependency).
- Mock `globalThis.fetch` for HTTP-level tests; restore in a `finally`.
- For tool handlers, pass a hand-rolled mock object as the client — only the
  methods the handler actually calls need to be implemented.
- Don't ship code without a corresponding test entry. The tool count
  assertion in `tests/tools.test.ts` will fail otherwise.

## Style

- TypeScript `strict: true`. No `any` without a comment justifying it.
- Single quotes vs double quotes: match what's already in the file (the rest
  of the codebase uses double quotes).
- Async tool handlers must catch errors and surface them as MCP error
  responses (return `{ content: [...], isError: true }` if the SDK pattern
  expects it). Currently `src/index.ts` does this in the dispatcher
  wrapper — individual tool handlers should throw and let the wrapper catch.
- Keep tool descriptions LLM-friendly: explain *when* to use the tool, not
  *how* it's implemented. Mention concrete example use cases.

## Don't

- **Don't add direct LLM calls in this package.** Calls go through the
  Aether server only. If you need a new model behavior, add a server endpoint.
- **Don't store credentials.** The MCP server reads `AETHER_API_KEY` from
  env once at startup. Don't write it to disk, don't cache it, don't log it.
- **Don't break the stdio protocol.** `src/index.ts` writes tool responses
  to stdout — never `console.log` to stdout for debug. Use `console.error`
  if you need to print debug output (the MCP host treats stderr as logs,
  stdout as protocol messages).
- **Don't bump the major version casually.** Users have configs pointing at
  this package; breaking changes (renamed tools, removed tools, changed
  required fields) require a major bump and migration notes in CHANGELOG.

## Versioning

Semver. Adding a new tool or new optional input field = patch or minor.
Renaming a tool, removing a tool, or making a required field stricter =
major.

## Publishing

Done automatically by `.github/workflows/publish.yml` when a GitHub Release
is created. Don't `npm publish` from your laptop; use the release flow so
provenance + the exact CI-built artifact ship.

## When in doubt

Open an issue before coding a non-trivial change. Especially for new tools —
it's much easier to coordinate the server-side endpoint up front than to
ship a client-side tool that calls a 404.
