// Helper for saving conversations across Learning, Shopping, and Research modes.
import { supabase } from "@/integrations/supabase/client";

export type SavedRole = "user" | "assistant";

export interface SavedMessage {
  role: SavedRole;
  content: string;
  images?: string[];
}

/**
 * Creates a new conversation row (or updates an existing one) and persists messages.
 * Returns the conversation id.
 */
export async function saveConversation(opts: {
  conversationId: string | null;
  userId: string;
  mode: "learning" | "shopping" | "research" | "chat";
  title: string;
  messages: SavedMessage[];
}): Promise<string | null> {
  const { conversationId, userId, mode, title, messages } = opts;
  try {
    let convoId = conversationId;
    if (!convoId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          mode,
          title: title.slice(0, 80) || "New conversation",
        })
        .select("id")
        .single();
      if (error || !data) return null;
      convoId = data.id;
    } else {
      await supabase
        .from("conversations")
        .update({ title: title.slice(0, 80), updated_at: new Date().toISOString() })
        .eq("id", convoId);
    }

    // Persist only the latest two messages (user + assistant) to avoid duplicates.
    // The caller is responsible for sending message pairs after each assistant turn completes.
    const toInsert = messages.slice(-2).map((m) => ({
      conversation_id: convoId!,
      role: m.role,
      content: m.content,
      images: m.images && m.images.length ? m.images : null,
    }));
    if (toInsert.length) {
      await supabase.from("messages").insert(toInsert);
    }
    return convoId;
  } catch (e) {
    console.error("[saveConversation] failed", e);
    return null;
  }
}
