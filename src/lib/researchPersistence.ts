// Backend-backed persistence for Deep Research sessions (replaces sessionStorage).
import { supabase } from "@/integrations/supabase/client";

export interface PersistedResearch {
  session_key: string;
  query: string;
  report: string;
  images: string[];
  steps: any[];
}

export async function saveResearch(userId: string, data: PersistedResearch) {
  try {
    await supabase.from("research_reports").upsert(
      {
        user_id: userId,
        session_key: data.session_key,
        query: data.query,
        report: data.report,
        images: data.images as any,
        steps: data.steps as any,
      },
      { onConflict: "user_id,session_key" }
    );
  } catch (e) {
    console.error("[saveResearch]", e);
  }
}

export async function loadResearch(userId: string, sessionKey: string): Promise<PersistedResearch | null> {
  try {
    const { data } = await supabase
      .from("research_reports")
      .select("session_key, query, report, images, steps")
      .eq("user_id", userId)
      .eq("session_key", sessionKey)
      .maybeSingle();
    if (!data) return null;
    return {
      session_key: data.session_key,
      query: data.query,
      report: data.report,
      images: (data.images as any) || [],
      steps: (data.steps as any) || [],
    };
  } catch {
    return null;
  }
}

export async function loadRecentResearch(userId: string, limit = 20): Promise<PersistedResearch[]> {
  try {
    const { data } = await supabase
      .from("research_reports")
      .select("session_key, query, report, images, steps")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!data) return [];
    return data.map((d: any) => ({
      session_key: d.session_key,
      query: d.query,
      report: d.report,
      images: d.images || [],
      steps: d.steps || [],
    }));
  } catch {
    return [];
  }
}
