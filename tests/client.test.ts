// Smoke tests for the AetherClient HTTP wrapper. We don't hit a real API —
// we mock global fetch so each error path is verified deterministically.

import { test } from "node:test";
import assert from "node:assert/strict";
import { AetherClient } from "../src/client.js";

function withMockFetch<T>(impl: typeof fetch, fn: () => T | Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = impl as typeof fetch;
  return Promise.resolve(fn()).finally(() => {
    globalThis.fetch = original;
  });
}

test("AetherClient throws if no API key", () => {
  assert.throws(() => new AetherClient({ apiKey: "" }), /AETHER_API_KEY is required/);
});

test("AetherClient sends Authorization: Bearer header on POST", async () => {
  let capturedHeader: string | null = null;
  await withMockFetch(
    async (input, init) => {
      capturedHeader = (init?.headers as Record<string, string> | undefined)?.Authorization ?? null;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
    async () => {
      const c = new AetherClient({ apiKey: "ak_live_test123" });
      await c.post<{ ok: boolean }>("/chat", { prompt: "hi" });
      assert.equal(capturedHeader, "Bearer ak_live_test123");
    },
  );
});

test("AetherClient surfaces 401 with friendly message", async () => {
  await withMockFetch(
    async () =>
      new Response(JSON.stringify({ error: "Invalid key", code: "INVALID_API_KEY" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    async () => {
      const c = new AetherClient({ apiKey: "ak_live_bad" });
      await assert.rejects(
        () => c.post("/chat", { prompt: "x" }),
        /invalid API key/,
      );
    },
  );
});

test("AetherClient surfaces 402 with topup URL", async () => {
  await withMockFetch(
    async () =>
      new Response(
        JSON.stringify({
          error: "Out of credits",
          code: "INSUFFICIENT_CREDITS",
          have: 3,
          topup_url: "https://trynoguard.com/pay",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      ),
    async () => {
      const c = new AetherClient({ apiKey: "ak_live_x" });
      await assert.rejects(
        () => c.post("/chat", { prompt: "x" }),
        /out of credits.*you have 3.*Top up/i,
      );
    },
  );
});

test("AetherClient surfaces 429 with rate-limit info", async () => {
  await withMockFetch(
    async () =>
      new Response(
        JSON.stringify({ error: "Rate limited", resetAt: "2026-01-01T00:00:00Z" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    async () => {
      const c = new AetherClient({ apiKey: "ak_live_x" });
      await assert.rejects(() => c.post("/chat", { prompt: "x" }), /rate limit/i);
    },
  );
});

test("AetherClient respects AETHER_BASE_URL override", async () => {
  let capturedUrl = "";
  await withMockFetch(
    async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({}), { status: 200 });
    },
    async () => {
      const c = new AetherClient({ apiKey: "ak_live_x", baseUrl: "http://localhost:3000" });
      await c.post("/me", {});
      assert.match(capturedUrl, /^http:\/\/localhost:3000\/api\/v1\/me/);
    },
  );
});
