// Tiny HTTP client that talks to the Aether public API. All endpoints take a
// JSON body and return JSON. We surface 401 / 402 / 429 with structured
// messages so the AI client (Claude Desktop, Cursor) shows the user a useful
// next step (top up, generate a new key, wait for rate limit reset).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DEFAULT_BASE = "https://trynoguard.com";

// Read our own version from package.json so the User-Agent can't drift out of
// sync with the published version (it was hardcoded "aether-mcp/0.1").
function pkgVersion(): string {
  try {
    const p = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    return (JSON.parse(readFileSync(p, "utf8")).version as string) ?? "0";
  } catch {
    return "0";
  }
}
const USER_AGENT = `aether-mcp/${pkgVersion()}`;

export class AetherClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: { apiKey: string; baseUrl?: string }) {
    if (!opts.apiKey) throw new Error("AETHER_API_KEY is required");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? process.env.AETHER_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(body),
      // No abort signal — MCP clients have their own timeouts.
    });
    return parseAetherResponse<T>(res);
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "User-Agent": USER_AGENT,
      },
    });
    return parseAetherResponse<T>(res);
  }
}

async function parseAetherResponse<T>(res: Response): Promise<T> {
  let body: unknown;
  try { body = await res.json(); } catch { body = { error: await res.text().catch(() => "") }; }
  if (res.ok) return body as T;

  const e = body as { error?: string; code?: string; topup_url?: string; needed?: number; have?: number; resetAt?: string };
  // Translate to useful, AI-client-friendly error messages
  if (res.status === 401) {
    throw new Error(`Aether: invalid API key. Generate a new one at https://trynoguard.com/account and update your config.`);
  }
  if (res.status === 402) {
    throw new Error(
      `Aether: out of credits${typeof e.have === "number" ? ` (you have ${e.have})` : ""}. Top up at ${e.topup_url ?? "https://trynoguard.com/pay"} to continue.`,
    );
  }
  if (res.status === 429) {
    throw new Error(
      `Aether: rate limit exceeded${e.resetAt ? `. Resets at ${e.resetAt}` : ""}. Upgrade your plan for higher limits, or wait.`,
    );
  }
  if (res.status === 403) {
    throw new Error(`Aether: ${e.error ?? "forbidden"}.`);
  }
  if (res.status === 409) {
    throw new Error(`Aether: ${e.error ?? "conflict"}.`);
  }
  throw new Error(`Aether ${res.status}: ${e.error ?? "unknown error"}`);
}

export type ChatResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  balanceAfter: number;
};

export type ImageResult = {
  images: string[];     // data: URLs
  model: string;
  creditsCharged: number;
  balanceAfter: number;
};

export type IdentifyPatternResult = {
  result: {
    pattern?: string;
    confidence?: number;
    category?: string;
    explanation?: string;
    references?: string[];
    next_steps?: string;
    raw?: string;
  };
  creditsCharged: number;
  balanceAfter: number;
};
