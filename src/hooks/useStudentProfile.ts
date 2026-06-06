import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudentProfile {
  id?: string;
  user_id: string;
  age: number | null;
  native_language: string | null;
  country: string | null;
  learning_style: string | null;
  preferred_study_time: string | null;
}

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data as StudentProfile | null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (updates: Partial<StudentProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const payload = { user_id: user.id, ...updates };
    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (!error && data) setProfile(data as StudentProfile);
    return data;
  }, []);

  return { profile, loading, save, reload: load };
}

// Spaced repetition stages: 1d -> 3d -> 7d -> 14d -> 30d -> 90d
const STAGES_DAYS = [1, 3, 7, 14, 30, 90];

export async function logMistake(topic: string, concept: string, mistakeType: "concept" | "careless" = "concept") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("student_mistakes")
    .select("*")
    .eq("user_id", user.id)
    .eq("topic", topic)
    .eq("concept", concept)
    .eq("resolved", false)
    .maybeSingle();
  if (existing) {
    const newStage = Math.min(existing.review_stage, STAGES_DAYS.length - 1);
    const nextDays = STAGES_DAYS[newStage];
    await supabase.from("student_mistakes").update({
      mistake_count: existing.mistake_count + 1,
      next_review_at: new Date(Date.now() + nextDays * 86400000).toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("student_mistakes").insert({
      user_id: user.id, topic, concept, mistake_type: mistakeType,
      next_review_at: new Date(Date.now() + 86400000).toISOString(),
    });
  }
}

export async function markMistakeReviewed(mistakeId: string, correct: boolean) {
  const { data: existing } = await supabase
    .from("student_mistakes").select("*").eq("id", mistakeId).maybeSingle();
  if (!existing) return;
  if (correct) {
    const newStage = existing.review_stage + 1;
    if (newStage >= STAGES_DAYS.length) {
      await supabase.from("student_mistakes").update({ resolved: true }).eq("id", mistakeId);
    } else {
      await supabase.from("student_mistakes").update({
        review_stage: newStage,
        next_review_at: new Date(Date.now() + STAGES_DAYS[newStage] * 86400000).toISOString(),
      }).eq("id", mistakeId);
    }
  } else {
    await supabase.from("student_mistakes").update({
      review_stage: 0,
      mistake_count: existing.mistake_count + 1,
      next_review_at: new Date(Date.now() + 86400000).toISOString(),
    }).eq("id", mistakeId);
  }
}

export async function getDueReviews() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("student_mistakes")
    .select("*")
    .eq("user_id", user.id)
    .eq("resolved", false)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true });
  return data || [];
}
