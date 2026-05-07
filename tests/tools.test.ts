// Smoke tests for the tool registry. Verifies every tool has a valid shape,
// names are unique, and at least one handler routes correctly.

import { test } from "node:test";
import assert from "node:assert/strict";
import { TOOLS } from "../src/tools.js";

test("tool registry has the expected count", () => {
  assert.equal(TOOLS.length, 11, "should expose exactly 11 tools");
});

test("every tool has a unique name with the aether_ prefix", () => {
  const names = TOOLS.map((t) => t.name);
  const unique = new Set(names);
  assert.equal(unique.size, names.length, "tool names must be unique");
  for (const n of names) {
    assert.match(n, /^aether_[a-z_]+$/, `tool name "${n}" must be snake_case under aether_`);
  }
});

test("every tool has a non-empty description", () => {
  for (const t of TOOLS) {
    assert.ok(t.description.length > 20, `${t.name}: description too short`);
  }
});

test("every tool has a valid inputSchema", () => {
  for (const t of TOOLS) {
    assert.equal(t.inputSchema.type, "object", `${t.name}: inputSchema.type must be "object"`);
    assert.ok(t.inputSchema.properties, `${t.name}: inputSchema.properties is required`);
  }
});

test("every tool's required fields actually exist in properties", () => {
  for (const t of TOOLS) {
    const required = t.inputSchema.required ?? [];
    for (const field of required) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(t.inputSchema.properties, field),
        `${t.name}: required field "${field}" not in properties`,
      );
    }
  }
});

test("aether_chat tool exists and accepts prompt", () => {
  const tool = TOOLS.find((t) => t.name === "aether_chat");
  assert.ok(tool, "aether_chat must exist");
  assert.deepEqual(tool!.inputSchema.required, ["prompt"]);
});

test("aether_balance tool exists with no required fields", () => {
  const tool = TOOLS.find((t) => t.name === "aether_balance");
  assert.ok(tool, "aether_balance must exist");
  assert.equal((tool!.inputSchema.required ?? []).length, 0);
});

test("aether_explain_disasm has arch enum constrained", () => {
  const tool = TOOLS.find((t) => t.name === "aether_explain_disasm");
  assert.ok(tool);
  const archProp = tool!.inputSchema.properties["arch"];
  assert.ok(archProp, "arch property required");
  assert.ok(Array.isArray(archProp.enum), "arch must be an enum");
  assert.ok(archProp.enum!.includes("x64"));
  assert.ok(archProp.enum!.includes("arm64"));
});

test("tool handlers return the MCP content shape with mocked client", async () => {
  const tool = TOOLS.find((t) => t.name === "aether_balance")!;
  const mockClient = {
    post: async () => ({ ok: true }),
    get: async () => ({
      plan: "FREE",
      balance: 145,
      planCredits: 145,
      topupCredits: 0,
      rate: { limit: 30, remaining: 28, resetAt: "2026-01-01T00:00:00Z" },
    }),
  };
  // The handler is `(client) => async (args) => { ... }` — we treat the mock
  // as the AetherClient; it only needs `get`/`post` methods.
  const handler = tool.handler(mockClient as never);
  const result = await handler({});
  assert.ok(Array.isArray(result.content), "result.content must be an array");
  assert.equal(result.content[0]?.type, "text");
  assert.match(result.content[0]!.text, /Plan: FREE/);
  assert.match(result.content[0]!.text, /145/);
});
