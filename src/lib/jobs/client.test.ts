import { describe, expect, it, vi, beforeEach } from "vitest";

const updateMock = vi.fn();
const eqMock = vi.fn();
const inMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({ update: updateMock })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { failStaleJob, isJobStale } from "./client";

describe("background job resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inMock.mockResolvedValue({ data: null, error: null });
    eqMock.mockReturnValue({ in: inMock });
    updateMock.mockReturnValue({ eq: eqMock });
  });

  it("detects running jobs with expired heartbeat as stale", () => {
    const old = new Date(Date.now() - 120_000).toISOString();
    expect(isJobStale({ status: "running", last_heartbeat_at: old })).toBe(true);
    expect(isJobStale({ status: "queued", updated_at: old })).toBe(true);
  });

  it("does not mark fresh or terminal jobs as stale", () => {
    const fresh = new Date(Date.now() - 5_000).toISOString();
    expect(isJobStale({ status: "running", last_heartbeat_at: fresh })).toBe(false);
    expect(isJobStale({ status: "done", last_heartbeat_at: "2020-01-01T00:00:00Z" })).toBe(false);
  });

  it("marks stale jobs as error while preserving saved progress", async () => {
    await failStaleJob("job-1", "stopped safely");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: "error",
      error: "stopped safely",
      status_text: "Stopped",
      progress: 100,
    }));
    expect(eqMock).toHaveBeenCalledWith("id", "job-1");
    expect(inMock).toHaveBeenCalledWith("status", ["queued", "running"]);
  });
});