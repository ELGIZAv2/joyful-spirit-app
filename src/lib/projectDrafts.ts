// Per-project draft input persistence (localStorage).
const key = (id: string) => `megsy_project_draft_${id}`;

export function getProjectDraft(projectId: string): string {
  try { return localStorage.getItem(key(projectId)) ?? ""; } catch { return ""; }
}

let timers = new Map<string, number>();
export function saveProjectDraftDebounced(projectId: string, value: string, ms = 400) {
  const t = timers.get(projectId);
  if (t) window.clearTimeout(t);
  const handle = window.setTimeout(() => {
    try {
      if (value) localStorage.setItem(key(projectId), value);
      else localStorage.removeItem(key(projectId));
    } catch {}
  }, ms);
  timers.set(projectId, handle);
}

export function clearProjectDraft(projectId: string) {
  try { localStorage.removeItem(key(projectId)); } catch {}
}
