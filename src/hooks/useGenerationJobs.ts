import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GenerationJob {
  id: string;
  job_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_data: Record<string, any>;
  result_data: Record<string, any> | null;
  error_message: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export function useGenerationJobs(jobType?: string) {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let query = supabase
      .from("generation_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (jobType) query = query.eq("job_type", jobType);

    const { data } = await query;
    if (data) setJobs(data as unknown as GenerationJob[]);
    setLoading(false);
  }, [jobType]);

  // Create a new job
  const createJob = useCallback(async (type: string, inputData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("generation_jobs")
      .insert({ user_id: user.id, job_type: type, input_data: inputData, status: "pending" } as any)
      .select("*")
      .single();

    if (error || !data) return null;
    const job = data as unknown as GenerationJob;
    setJobs(prev => [job, ...prev]);
    return job;
  }, []);

  // Poll for active jobs
  useEffect(() => {
    fetchJobs();

    const hasActive = jobs.some(j => j.status === "pending" || j.status === "processing");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchJobs, 3000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobs.length, fetchJobs]);

  // Also subscribe to realtime updates
  useEffect(() => {
    let userId: string | null = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channelName = `generation-jobs-${user.id}-${Math.random().toString(36).slice(2, 10)}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "generation_jobs", filter: `user_id=eq.${userId}` },
          (payload) => {
            const updated = payload.new as unknown as GenerationJob;
            setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    const cleanup = setup();
    return () => { cleanup.then(fn => fn?.()); };
  }, []);

  return { jobs, loading, createJob, refreshJobs: fetchJobs };
}
