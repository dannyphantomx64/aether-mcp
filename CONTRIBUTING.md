# Contributing to aether-mcp

Thanks for considering a contribution. This package is the official MCP client
for [Aether](https://trynoguard.com), and we welcome PRs for new tools, bug
fixes, additional AI-client config docs, and quality-of-life improvements.

## Development setup

```bash
git clone https://github.com/dannyphantomx64/aether-mcp.git
cd aether-mcp
npm install
npm run build       # compile TypeScript → dist/
```

To run the server against a real Aether account:

```bash
AETHER_API_KEY=ak_live_... node dist/index.js
```

To run against a local dev instance of Aether:

```bash
AETHER_API_KEY=ak_live_... AETHER_BASE_URL=http://localhost:3000 node dist/index.js
```

The server speaks MCP over stdio — pipe input/output through your AI client
or test manually with `@modelcontextprotocol/inspector`.

## Adding a new tool

Each tool is one entry in `src/tools.ts`. The pattern:

```ts
{
  name: "aether_my_tool",
  description: "What it does, in one sentence — shown to the AI client",
  inputSchema: {
    type: "object",
    properties: { /* JSON-schema fields */ },
    required: ["..."],
  },
  handler: (client) => async (args) => {
    const r = await client.post<MyResultType>("/my_endpoint", args);
    return { content: [{ type: "text", text: r.text }] };
  },
}
```

The corresponding API endpoint must exist on the Aether server side at
`/api/v1/my_endpoint`. If you're adding a tool that needs a new server
endpoint, open an issue first to coordinate.

## Style

- TypeScript strict mode. No `any` without comment justifying it.
- All async tool handlers must catch errors and surface them as MCP error
  responses (return `{ content: [...], isError: true }`).
- Tool descriptions should make sense to an LLM picking which tool to call —
  describe the use case, not the implementation.

## Pull requests

- Branch off `main`, name it `feat/<short-description>` or `fix/<short>`.
- Run `npm run typecheck` before pushing.
- Keep the PR focused: one tool added or one bug fixed per PR.
- Update `CHANGELOG.md` under `## [Unreleased]` with a one-line entry.

## Reporting bugs

Use GitHub Issues. Include:
- Your AI client (Claude Desktop / Cursor / Cline / Zed / etc.) and version
- The full config snippet (REDACT the API key)
- The exact prompt you sent and the error message you got
- Whether it happens on the live API (`trynoguard.com`) or a local Aether instance

## Reporting security issues

Don't open a public issue for security reports. Email the maintainers via
the contact form on <https://trynoguard.com> or DM in the Discord. We
respond within 48 hours.

## Code of conduct

Be excellent to each other. Don't be a jerk in issues, PRs, or discussions.
Aether is opinionated about uncensored AI as a product, but the
contribution process here is just normal open-source collaboration.
