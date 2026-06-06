import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserPlan() {
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (data) setPlan(data.plan || "free");
      setLoading(false);
    };
    load();
  }, []);

  return { plan, loading };
}
