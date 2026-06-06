// Client helper for downloading a generated PPTX from the deck JSON
// produced by chat-slides-stream. Triggers the e2b-powered conversion
// and returns a signed download URL (valid 7 days).
import { supabase } from "@/integrations/supabase/client";

export interface DeckExportResult {
  execution_id: string;
  download_url: string | null;
  filename: string;
  slides: number;
  duration_ms?: number;
  file?: {
    name: string; storagePath: string; size: number; mime: string; signedUrl: string;
  } | null;
}

export async function exportDeckToPptx(args: {
  deck: Record<string, unknown> & { slides: unknown[] };
  filename?: string;
  conversation_id?: string;
}): Promise<DeckExportResult> {
  const { data, error } = await supabase.functions.invoke("slides-export-pptx", { body: args });
  if (error) throw error;
  return data as DeckExportResult;
}
