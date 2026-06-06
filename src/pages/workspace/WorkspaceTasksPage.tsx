import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Loader2, X, MessageSquare, CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";

type Status = "todo" | "doing" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  workspace_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  tags: string[];
  position: number;
  completed_at: string | null;
  created_at: string;
}

const STATUS_COLS: { id: Status; label: string; icon: any }[] = [
  { id: "todo", label: "To do", icon: Circle },
  { id: "doing", label: "In progress", icon: Clock },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  high: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export default function WorkspaceTasksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const { members } = useWorkspaceMembers(id ?? null);
  const [showCreate, setShowCreate] = useState<Status | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" as Priority, assignee_id: "", due_date: "", tags: "" });
  const [openTask, setOpenTask] = useState<Task | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user?.id ?? null);
    })();
  }, []);

  const refresh = async () => {
    if (!id) return;
    const { data } = await supabase.from("workspace_tasks").select("*").eq("workspace_id", id).order("position").order("created_at");
    setTasks((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!id) return;
    const channelName = `ws-tasks-${id}-${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_tasks", filter: `workspace_id=eq.${id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    tasks.filter(t => !t.parent_task_id).forEach(t => g[t.status].push(t));
    return g;
  }, [tasks]);

  const createTask = async (status: Status) => {
    if (!id || !me || !draft.title.trim()) return;
    const title = draft.title.trim();
    if (title.length > 200) { toast.error("Title is too long (max 200 chars)"); return; }
    const tags = draft.tags.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("workspace_tasks").insert({
      workspace_id: id, created_by: me, status,
      title,
      description: draft.description.trim() || null,
      priority: draft.priority,
      assignee_id: draft.assignee_id || null,
      due_date: draft.due_date || null,
      tags,
    } as any);
    if (error) { toast.error(error.message || "Failed to create task"); return; }
    toast.success("Task created");
    setDraft({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "", tags: "" });
    setShowCreate(null);
    // Notify assignee
    if (draft.assignee_id && draft.assignee_id !== me) {
      try {
        await supabase.functions.invoke("workspace-notify", {
          body: { type: "task_assigned", workspace_id: id, assignee_id: draft.assignee_id, title },
        });
      } catch {}
    }
  };

  const updateStatus = async (task: Task, status: Status) => {
    const { error } = await supabase.from("workspace_tasks").update({ status } as any).eq("id", task.id);
    if (error) toast.error(error.message || "Failed to update status");
  };
  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("workspace_tasks").delete().eq("id", taskId);
    if (error) { toast.error(error.message || "Failed to delete task"); return; }
    toast.success("Task deleted");
    setOpenTask(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(`/settings/workspaces/${id}`)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold flex-1">Tasks</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUS_COLS.map(col => {
              const Icon = col.icon;
              return (
                <div key={col.id} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <h2 className="text-sm font-semibold">{col.label}</h2>
                      <span className="text-xs text-muted-foreground">{grouped[col.id].length}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreate(col.id)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {showCreate === col.id && (
                    <div className="mb-3 p-3 rounded-lg bg-background border border-border/60 space-y-2">
                      <Input placeholder="Title" autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                      <Textarea placeholder="Description ​" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })} className="text-xs h-9 rounded-md border border-input bg-background px-2">
                          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                        </select>
                        <select value={draft.assignee_id} onChange={(e) => setDraft({ ...draft, assignee_id: e.target.value })} className="text-xs h-9 rounded-md border border-input bg-background px-2">
                          <option value="">Unassigned</option>
                          {members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name || "Member"}</option>)}
                        </select>
                      </div>
                      <Input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
                      <Input placeholder="Tags (comma-separated)" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => createTask(col.id)} className="flex-1">Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCreate(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {grouped[col.id].map(t => {
                      const assignee = members.find(m => m.user_id === t.assignee_id);
                      const subCount = tasks.filter(s => s.parent_task_id === t.id).length;
                      const subDone = tasks.filter(s => s.parent_task_id === t.id && s.status === "done").length;
                      return (
                        <button key={t.id} onClick={() => setOpenTask(t)} className="w-full text-left p-3 rounded-lg bg-card border border-border/60 hover:bg-muted/30 transition">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium flex-1">{t.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                          </div>
                          {t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {t.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">#{tag}</span>)}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                            <span className="truncate">{assignee?.display_name ?? "Unassigned"}</span>
                            <div className="flex items-center gap-2">
                              {subCount > 0 && <span>{subDone}/{subCount}</span>}
                              {t.due_date && <span>{new Date(t.due_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {STATUS_COLS.filter(s => s.id !== t.status).map(s => (
                              <Button key={s.id} size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); updateStatus(t, s.id); }} className="text-[10px] h-6 px-2">→ {s.label}</Button>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                    {grouped[col.id].length === 0 && !showCreate && (
                      <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {openTask && (
        <TaskDrawer
          task={openTask}
          allTasks={tasks}
          members={members}
          onClose={() => setOpenTask(null)}
          onDelete={() => deleteTask(openTask.id)}
        />
      )}
    </div>
  );
}

function TaskDrawer({ task, allTasks, members, onClose, onDelete }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newSub, setNewSub] = useState("");
  const subs = allTasks.filter((t: Task) => t.parent_task_id === task.id);

  const refresh = async () => {
    const { data } = await supabase.from("workspace_task_comments").select("*").eq("task_id", task.id).order("created_at");
    const list = (data as any) ?? [];
    if (list.length) {
      const ids = [...new Set(list.map((c: any) => c.user_id))];
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids as string[]);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setComments(list.map((c: any) => ({ ...c, profile: map.get(c.user_id) })));
    } else setComments([]);
  };

  useEffect(() => {
    refresh();
    const channelName = `task-comments-${task.id}-${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_task_comments", filter: `task_id=eq.${task.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    const content = newComment.trim();
    if (content.length > 2000) { toast.error("Comment too long (max 2000 chars)"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("workspace_task_comments").insert({ task_id: task.id, user_id: user.id, content } as any);
    if (error) { toast.error(error.message || "Failed to post comment"); return; }
    setNewComment("");
    // Notify assignee + creator (skip self handled server-side).
    const targets = Array.from(new Set([task.assignee_id, task.created_by].filter((x: any) => x && x !== user.id)));
    for (const t of targets) {
      try {
        await supabase.functions.invoke("workspace-notify", {
          body: { type: "task_comment", workspace_id: task.workspace_id, assignee_id: t, title: task.title },
        });
      } catch {}
    }
  };

  const addSub = async () => {
    if (!newSub.trim()) return;
    const title = newSub.trim();
    if (title.length > 200) { toast.error("Title too long"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("workspace_tasks").insert({
      workspace_id: task.workspace_id, parent_task_id: task.id,
      created_by: user.id, title, status: "todo",
    } as any);
    if (error) { toast.error(error.message || "Failed to add sub-task"); return; }
    setNewSub("");
  };

  const toggleSub = async (s: Task) => {
    const { error } = await supabase.from("workspace_tasks").update({ status: s.status === "done" ? "todo" : "done" } as any).eq("id", s.id);
    if (error) toast.error(error.message || "Failed to update sub-task");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between">
          <h2 className="font-semibold truncate flex-1">{task.title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-6">
          {task.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>}

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">Sub-tasks</h3>
            <div className="space-y-1">
              {subs.map((s: Task) => (
                <button key={s.id} onClick={() => toggleSub(s)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/40 text-left text-sm">
                  {s.status === "done" ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  <span className={s.status === "done" ? "line-through text-muted-foreground" : ""}>{s.title}</span>
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <Input placeholder="Add sub-task" value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSub()} />
                <Button size="sm" onClick={addSub}>Add</Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comments</h3>
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="text-sm p-2 rounded bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">{c.profile?.display_name || "User"}</p>
                  <p>{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <Button size="sm" onClick={addComment}>Post</Button>
              </div>
            </div>
          </div>

          <Button variant="destructive" onClick={onDelete} className="w-full">Delete task</Button>
        </div>
      </div>
    </div>
  );
}
