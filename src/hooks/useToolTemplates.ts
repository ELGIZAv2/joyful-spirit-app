import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ToolTemplate } from "@/components/layout/ToolPageLayout";

export function useToolTemplates(toolId: string) {
  const [templates, setTemplates] = useState<ToolTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tool_templates")
      .select("*")
      .eq("tool_id", toolId)
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setTemplates(data as ToolTemplate[]);
        setLoading(false);
      });
  }, [toolId]);

  return { templates, loading };
}
