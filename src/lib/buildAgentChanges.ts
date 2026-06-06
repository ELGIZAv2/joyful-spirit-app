export type BuildAgentChangeAction = "create" | "update" | "delete" | "rename";

export interface BuildAgentChange {
  action: BuildAgentChangeAction;
  path: string;
  to?: string;
}

const CHANGE_TAG_RE = /<change\s+([^>]*?)\/?>(?:([\s\S]*?)<\/change>)?/gi;

function readAttr(attrs: string, name: string): string | undefined {
  const match = new RegExp(`${name}="([^"]+)"`, "i").exec(attrs);
  return match?.[1];
}

export function parseBuildAgentChanges(raw: string): BuildAgentChange[] {
  const changes: BuildAgentChange[] = [];
  let match: RegExpExecArray | null;

  while ((match = CHANGE_TAG_RE.exec(raw)) !== null) {
    const attrs = match[1] ?? "";
    const body = (match[2] ?? "").trim();
    const action = (readAttr(attrs, "action") ?? body.split(/\s+/)[0] ?? "update").toLowerCase();
    const path = readAttr(attrs, "path") ?? readAttr(attrs, "file") ?? "";
    const to = readAttr(attrs, "to");

    if (!path) continue;
    if (action !== "create" && action !== "update" && action !== "delete" && action !== "rename") continue;

    changes.push({ action, path, to });
  }

  return changes;
}

export function changeActionLabel(action: BuildAgentChangeAction): string {
  if (action === "create") return "New";
  if (action === "update") return "Edit";
  if (action === "delete") return "Delete";
  return "Rename";
}