/** Hirundu Beta: isolated RPC client. Never reuse Aracne credentials or URLs. */
export type BetaRole = "admin" | "tester";
export type BetaSession = { ok: true; admin: boolean; nickname: string };
export type BetaTester = { id: string; suffix: string; nickname: string | null; created_at: string; expires_at: string; activated_at: string | null; revoked_at: string | null };
export type BetaFeedback = { id: string; nickname: string | null; level: string | null; category: string; message: string; device: string; status: string; created_at: string };
export type BetaDashboard = { ok: true; testers: BetaTester[]; feedback: BetaFeedback[] };
export type BetaReply = { ok?: boolean; error?: string; [key: string]: unknown };

const TOKEN_KEY = "hirundu-play-beta-token-v1";
const url = (import.meta.env.VITE_HIRUNDU_SUPABASE_URL || "").replace(/\/$/, "");
const key = import.meta.env.VITE_HIRUNDU_SUPABASE_PUBLISHABLE_KEY || "";
const validConfig = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.length > 12;
export const betaConfigured = validConfig;
const tokenPattern = /^[a-f0-9]{64}$/;

function freshToken(): string {
  if (!globalThis.crypto?.getRandomValues) throw new Error("secure_crypto_unavailable");
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(v => v.toString(16).padStart(2,"0")).join("");
}
export function getBetaToken(): string {
  try {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing && tokenPattern.test(existing)) return existing;
    const newToken = freshToken();
    localStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  } catch { throw new Error("secure_storage_unavailable"); }
}
export async function betaRpc(action: string, data: Record<string, unknown> = {}): Promise<BetaReply> {
  if (!validConfig) throw new Error("beta_backend_not_configured");
  const controller = new AbortController();
  const cancel = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url + "/rest/v1/rpc/hirundu_beta", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "apikey": key, "Content-Type":"application/json", "x-hirundu-beta": getBetaToken() },
      body: JSON.stringify({p_action: action, p_data: data}),
    });
    if (!response.ok) throw new Error("rpc_http_" + response.status);
    const result: BetaReply = await response.json();
    if (result?.error) throw new Error(result.error);
    if (!result?.ok) throw new Error("beta_denied");
    return result;
  } finally { clearTimeout(cancel); }
}
export async function betaSession(): Promise<BetaSession> {
  return await betaRpc("session") as BetaSession;
}
export async function activateBeta(code: string, nickname: string): Promise<BetaSession> {
  const normalized = code.toUpperCase().replace(/[^A-F0-9]/g, "");
  if (!/^[A-F0-9]{32}$/.test(normalized) || nickname.trim().length < 1 || nickname.trim().length > 60) {
    throw new Error("invalid_code");
  }
  return await betaRpc("activate", {code: normalized, nickname: nickname.trim()}) as BetaSession;
}
