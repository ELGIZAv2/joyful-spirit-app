// Shared helper for verifying caller identity in edge functions.
// Returns the authenticated user or null.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const sb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

// Internal shared-secret check for server-to-server edge function calls.
// Accepts either a custom header (INTERNAL_FUNCTION_SECRET) OR an Authorization
// header containing the service-role key (which only other trusted edge functions know).
export function isInternalCaller(req: Request): boolean {
  const expectedSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const provided = req.headers.get("x-internal-secret") || req.headers.get("X-Internal-Secret");
  if (expectedSecret && provided && provided === expectedSecret) return true;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (serviceKey && authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === serviceKey) return true;
  }
  return false;
}
