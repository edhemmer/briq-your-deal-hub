// Photo condition check for signed-in users. Uses Cloudflare Workers AI's free daily allocation
// (Workers Free plan: requests fail instead of billing once the daily allocation is used).
// Secrets: CF_ACCOUNT_ID and CF_AI_TOKEN (a Workers AI read/run API token).
// The model only describes the visible physical property. Photos are not stored by BRIX.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const MAX_IMAGE_CHARS = 1_600_000; // about 1.2 MB of JPEG after base64
const PER_USER_PER_HOUR = 40;
const usage = new Map<string, { windowStart: number; count: number }>();

const PROMPT = `You are a careful property condition reviewer helping a real estate investor decide whether a house is worth visiting.
Look only at the physical property visible in this photo: structure, roof, siding, windows, foundation, yard, kitchen, bathroom, floors, walls, ceilings, systems, and anything visible next to the lot such as rail lines, power lines or heavy traffic.
Rules:
- Describe only what is visible. Do not guess about hidden conditions; if something deserves a closer look in person, say "verify".
- Never comment on people, residents, neighbors, or the demographics of an area.
- Be specific and practical, like an experienced inspector talking to an investor.
Reply with only JSON, no prose, in exactly this shape:
{"area":"exterior|roof|kitchen|bathroom|bedroom|living|basement|garage|yard|systems|other","condition":"good|fair|poor","rehab":"none|cosmetic|moderate|heavy","summary":"one sentence","observations":[{"issue":"short label","severity":"high|medium|low","detail":"one sentence"}]}
List at most 5 observations, most important first. Use an empty list if nothing stands out.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const accountId = Deno.env.get("CF_ACCOUNT_ID");
  const token = Deno.env.get("CF_AI_TOKEN");
  const enabled = Boolean(accountId && token);
  if (req.method === "GET") return json({ enabled });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!enabled) return json({ error: "Photo check is not switched on yet.", code: "photo_ai_missing" }, 503);

  const user = userId(req.headers.get("authorization"));
  if (!user) return json({ error: "Sign in to use photo check." }, 401);
  if (!allow(user)) return json({ error: "That's a lot of photos for one hour. Try again a little later.", code: "rate_limited" }, 429);

  let image = "";
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : "";
  } catch {
    return json({ error: "Send a photo." }, 400);
  }
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return json({ error: "Use a JPEG, PNG or WebP photo." }, 400);
  if (image.length > MAX_IMAGE_CHARS) return json({ error: "That photo is too large. Try a smaller one." }, 413);

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 700,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success === false) {
      const text = JSON.stringify(data?.errors ?? data ?? "").toLowerCase();
      if (response.status === 429 || /neuron|daily|quota|limit|capacity/.test(text)) {
        return json({ error: "Photo check has used today's free allowance. It resets at 6 p.m. Central.", code: "daily_limit" }, 429);
      }
      return json({ error: "Photo check couldn't read that photo. Try another one." }, 502);
    }
    const raw = data?.result?.response;
    const parsed = typeof raw === "object" && raw !== null ? raw : parseJson(String(raw ?? ""));
    const finding = normalize(parsed);
    if (!finding) return json({ error: "Photo check couldn't read that photo. Try another one." }, 502);
    return json({ ...finding, model: MODEL, checkedAt: new Date().toISOString() });
  } catch {
    return json({ error: "Photo check is unavailable right now. Try again in a minute." }, 502);
  }
});

function userId(authorization: string | null) {
  // The Supabase gateway has already verified the JWT (verify_jwt = true); read its subject for rate limiting.
  const token = authorization?.replace(/^Bearer\s+/i, "") ?? "";
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role === "authenticated" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function allow(user: string) {
  const now = Date.now();
  const entry = usage.get(user);
  if (!entry || now - entry.windowStart > 60 * 60 * 1000) {
    usage.set(user, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= PER_USER_PER_HOUR) return false;
  entry.count += 1;
  return true;
}

function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const AREAS = ["exterior", "roof", "kitchen", "bathroom", "bedroom", "living", "basement", "garage", "yard", "systems", "other"];
const CONDITIONS = ["good", "fair", "poor"];
const REHAB = ["none", "cosmetic", "moderate", "heavy"];
const SEVERITY = ["high", "medium", "low"];

function pick(value: unknown, allowed: string[], fallback: string) {
  const v = String(value ?? "").toLowerCase().trim();
  return allowed.includes(v) ? v : fallback;
}

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalize(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const observations = Array.isArray(v.observations) ? v.observations : [];
  return {
    area: pick(v.area, AREAS, "other"),
    condition: pick(v.condition, CONDITIONS, "fair"),
    rehab: pick(v.rehab, REHAB, "cosmetic"),
    summary: clean(v.summary, 240),
    observations: observations.slice(0, 5).map((o) => {
      const item = (o ?? {}) as Record<string, unknown>;
      return { issue: clean(item.issue, 80), severity: pick(item.severity, SEVERITY, "low"), detail: clean(item.detail, 240) };
    }).filter((o) => o.issue),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
