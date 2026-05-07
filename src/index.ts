#!/usr/bin/env node
// Aether MCP server. Entry point for `npx @aether/mcp`.
//
// Speaks MCP over stdio to a host AI client (Claude Desktop, Cursor, Cline,
// Zed, etc.). Forwards tool calls to https://trynoguard.com/api/v1/* with
// the user's API key.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AetherClient } from "./client.js";
import { TOOLS } from "./tools.js";

const apiKey = process.env.AETHER_API_KEY;
if (!apiKey) {
  console.error("AETHER_API_KEY environment variable is required.");
  console.error("Generate a key at https://trynoguard.com/account and add it to your MCP config.");
  process.exit(1);
}

const baseUrl = process.env.AETHER_BASE_URL;
const client = new AetherClient({ apiKey, baseUrl });

const server = new Server(
  {
    name: "aether",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register the tool list
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// Dispatch tool calls
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find((t) => t.name === req.params.name);
  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }
  try {
    const result = await tool.handler(client)((req.params.arguments ?? {}) as Record<string, unknown>);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
});

// Run
const transport = new StdioServerTransport();
await server.connect(transport);
// Keep alive — the transport drives the event loop.
