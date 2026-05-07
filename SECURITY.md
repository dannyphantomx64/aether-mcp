# Security policy

## Supported versions

Only the latest published `@aether/mcp` version is supported. Bug fixes go to
the latest minor; security patches go to the latest patch.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

If you find a vulnerability in `@aether/mcp` or the Aether public API, contact
the maintainers privately:

- Email: support@trynoguard.com
- Discord: <https://discord.gg/qNbppsTnQM> (DM the operator)

We respond within 48 hours and will work with you on coordinated disclosure.
We do not currently have a paid bounty program, but we'll publicly credit
researchers who report responsibly (with permission).

## What's in scope

- The `@aether/mcp` package itself (this repo)
- The public API at `https://trynoguard.com/api/v1/*`
- The credit-reservation / billing-integrity layer
- API key handling (storage, validation, revocation)
- Cross-tenant data leaks

## What's out of scope

- Issues that require physical access to the user's machine
- Social-engineering of Aether staff
- Self-reported "the model said X" issues unless they reveal protected data
- Findings that depend on the user's AI client (Claude Desktop, Cursor, etc.)
  having a separate, unrelated vulnerability
