import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "https://ltgampdtawuefwwayncx.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "";
const FN_URL = `${SUPABASE_URL}/functions/v1/generate-builder-schema`;

Deno.test("generate-builder-schema: CORS preflight ok", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status < 400);
});

Deno.test("generate-builder-schema: invalid body rejected", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({}),
  });
  await res.text();
  assert(res.status >= 400 && res.status < 600);
});
