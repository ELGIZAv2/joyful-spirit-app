import { describe, it, expect } from "vitest";
import { supabase } from "./client";

describe("supabase client", () => {
  it("exposes auth, from, functions, storage, channel APIs", () => {
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe("function");
    expect(supabase.functions).toBeDefined();
    expect(supabase.storage).toBeDefined();
    expect(typeof supabase.channel).toBe("function");
  });

  it("does NOT expose service_role key in the bundled client", () => {
    // The client must use an anon key (role:"anon" in the JWT payload).
    const url = (supabase as any).supabaseUrl as string;
    const key = (supabase as any).supabaseKey as string;
    expect(url).toMatch(/^https:\/\//);
    expect(key.split(".")).toHaveLength(3);
    const payload = JSON.parse(atob(key.split(".")[1]));
    expect(payload.role).toBe("anon");
    expect(payload.role).not.toBe("service_role");
  });

  it("builds a chainable query", () => {
    const q = supabase.from("workspaces").select("id").limit(1);
    expect(q).toBeDefined();
    expect(typeof (q as any).then).toBe("function");
  });
});
