// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Pencil, Globe, Share2, Plus, Image as ImageIcon,
  Sparkles, Check, Lock, Users, ExternalLink, X, HelpCircle, Link2, FileText,
  ShieldCheck, BarChart3, Upload, Heart, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { prepareProjectFilesForDeploy } from "@/lib/projectBuildGuards";

type Step = "url" | "visibility" | "seo" | "review" | "publishing" | "done" | "published";
type Visibility = "public" | "workspace" | "members";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Props {
  onClose?: () => void;
  onPublished?: (url: string) => void;
}

export default function MegsyPrPublishPage({ onClose, onPublished }: Props = {}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [step, setStep] = useState<Step>("url");
  const [slug, setSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [seo, setSeo] = useState({ title: "", description: "", ogImage: "", favicon: "" });
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inlinePublishing, setInlinePublishing] = useState(false);
  const [inlineJustDone, setInlineJustDone] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (onClose) {
      setMounted(false);
      setTimeout(onClose, 220);
    } else {
      navigate(`/build/${projectId}/preview`);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, published_url, preview_url, visibility, publish_settings")
        .eq("id", projectId).single();
      if (data) {
        const p = data as any;
        setProject(p);
        const merged = ((p.publish_settings as any) || {}) as Record<string, any>;
        setSlug(merged.slug || `app-${String(p.id || "").slice(0, 8)}`);
        setSeo({
          title: merged.title || p.name || "",
          description: merged.description || "",
          ogImage: merged.ogImage || "",
          favicon: merged.favicon || "",
        });
        if (p.visibility) setVisibility(p.visibility as Visibility);
        else if (merged.visibility) setVisibility(merged.visibility);
        setPublishedUrl(p.published_url || null);
        setHasUnpublished(!!p.preview_url && p.preview_url !== p.published_url);
        // Always show the live link immediately when the app is already published.
        if (p.published_url) {
          setStep("published");
        }
      }
      const { data: u } = await supabase.auth.getUser();
      const meta = (u?.user?.user_metadata || {}) as any;
      const emailName = u?.user?.email ? u.user.email.split("@")[0] : null;
      const initialName =
        meta.full_name ||
        meta.name ||
        meta.user_name ||
        emailName ||
        "My Workspace";
      setWorkspaceName(initialName);
      const uid = u?.user?.id;
      let avatar = meta.avatar_url || null;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url, display_name")
          .eq("id", uid)
          .single();
        if (prof?.avatar_url) avatar = prof.avatar_url;
        if (prof?.display_name) setWorkspaceName(prof.display_name);
      }
      setUserAvatar(avatar);
    })();
  }, [projectId]);

  const publish = async () => {
    if (!projectId) return;
    setStep("publishing");
    try {
      const settings = {
        slug,
        title: seo.title,
        description: seo.description,
        ogImage: seo.ogImage,
        favicon: seo.favicon,
        visibility,
      };

      // Persist publish settings + visibility to DB so they're authoritative.
      await supabase
        .from("projects")
        .update({ publish_settings: settings, visibility })
        .eq("id", projectId);

      await prepareProjectFilesForDeploy(projectId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudflare-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ project_id: projectId, mode: "publish", settings }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Publish failed");
      setPublishedUrl(data.url);
      onPublished?.(data.url);
      setHasUnpublished(false);
      setStep("done");
      toast.success("Published ✨");
    } catch (e) {
      toast.error(String((e as Error).message));
      setStep("review");
    }
  };

  // Publish without leaving the "published" screen — used by the inline Update button.
  const publishInline = async () => {
    if (!projectId || inlinePublishing) return;
    setInlinePublishing(true);
    setInlineJustDone(false);
    try {
      const settings = {
        slug,
        title: seo.title,
        description: seo.description,
        ogImage: seo.ogImage,
        favicon: seo.favicon,
        visibility,
      };

      await supabase
        .from("projects")
        .update({ publish_settings: settings, visibility })
        .eq("id", projectId);

      await prepareProjectFilesForDeploy(projectId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudflare-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ project_id: projectId, mode: "publish", settings }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Publish failed");
      setPublishedUrl(data.url);
      onPublished?.(data.url);
      setHasUnpublished(false);
      setInlineJustDone(true);
      toast.success("Published ✨");
      setTimeout(() => setInlineJustDone(false), 1800);
    } catch (e) {
      toast.error(String((e as Error).message));
    } finally {
      setInlinePublishing(false);
    }
  };

  const goBack = () => {
    if (step === "visibility") setStep("url");
    else if (step === "seo") setStep("visibility");
    else if (step === "review") setStep("seo");
  };

  const goNext = () => {
    if (step === "url") setStep("visibility");
    else if (step === "visibility") setStep("seo");
    else if (step === "seo") setStep("review");
    else if (step === "review") publish();
  };

  const headerTitle =
    step === "done" ? "" :
    step === "published" ? "Published" :
    "Publish";

  const fullUrl = `${slug}.megsy.app`;
  const visLabel =
    visibility === "public" ? "Public" :
    visibility === "workspace" ? workspaceName :
    "Selected members";
  const seoComplete = !!(seo.title || seo.description);

  return (
    <>
      <div
        className="absolute inset-0 z-[100] bg-black/40 transition-opacity duration-200"
        style={{ opacity: mounted ? 1 : 0 }}
        onClick={close}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-[101] max-h-[92dvh] w-full max-w-full rounded-t-[28px] bg-background border-t border-foreground/10 shadow-2xl flex flex-col transition-transform duration-200 ease-out overflow-hidden"
        style={{ transform: mounted ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Grabber */}
        <div className="pt-2.5 pb-1 grid place-items-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-foreground/20" />
        </div>

        {/* Header */}
        {step !== "done" && (
          <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0 border-b border-foreground/[0.06]">
            <span className="font-bold text-[22px]">{headerTitle}</span>
            {step === "published" ? (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[13px]">
                <BarChart3 className="w-4 h-4" />
                <span>0 Visitors</span>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex-1 px-4 py-5 overflow-y-auto overflow-x-hidden">
          {/* STEP 1: URL */}
          {step === "url" && (
            <>
              <div className="font-semibold text-[15px] mb-3">Your website URL</div>
              <div className="rounded-2xl bg-foreground/[0.04] px-4 h-14 flex items-center gap-2">
                {editingSlug ? (
                  <input
                    autoFocus
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                    onBlur={() => setEditingSlug(false)}
                    className="flex-1 bg-transparent outline-none text-[15px] font-medium"
                  />
                ) : (
                  <span className="flex-1 text-[15px] font-medium truncate">
                    <span className="text-foreground">{slug}</span>
                    <span className="text-muted-foreground">.megsy.app</span>
                  </span>
                )}
                <button onClick={() => setEditingSlug(true)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-foreground/5">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { close(); setTimeout(() => navigate(`/build/${projectId}/domains`), 220); }}
                className="w-full mt-4 flex items-center gap-3 text-start"
              >
                <span className="w-9 h-9 rounded-full bg-foreground/[0.06] grid place-items-center">
                  <Plus className="w-4 h-4" />
                </span>
                <span className="text-[15px]">Add custom domain</span>
              </button>
            </>
          )}

          {/* STEP 2: Visibility */}
          {step === "visibility" && (
            <>
              <div className="font-semibold text-[15px] mb-3">Who can see this website</div>
              <div className="space-y-2.5">
                <VisCard
                  active={visibility === "public"}
                  onClick={() => setVisibility("public")}
                  icon={<Globe className="w-5 h-5" />}
                  title="Public"
                  subtitle="Anyone with the URL"
                />
                <VisCard
                  active={visibility === "workspace"}
                  onClick={() => setVisibility("workspace")}
                  iconBg={userAvatar ? "bg-foreground/[0.06] overflow-hidden" : "bg-violet-500"}
                  icon={
                    userAvatar ? (
                      <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-base">{workspaceName.charAt(0).toUpperCase()}</span>
                    )
                  }
                  title={workspaceName}
                  subtitle="Only this workspace"
                />
              </div>
            </>
          )}

          {/* STEP 3: SEO */}
          {step === "seo" && (
            <>
              <div className="font-bold text-[15px] mb-1">Add info to help people find your site</div>
              <div className="text-[13px] text-muted-foreground mb-5">Used when a page doesn't have preview information.</div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">Icon &amp; title</span>
                  <span className="text-[12px] text-muted-foreground">{seo.title.length}/60</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-12 h-12 rounded-xl bg-foreground/[0.04] grid place-items-center cursor-pointer overflow-hidden shrink-0 relative">
                    {seo.favicon
                      ? <img src={seo.favicon} alt="" className="w-full h-full object-cover" />
                      : <Upload className="w-4 h-4 opacity-60" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !projectId) return;
                        const ext = file.name.split(".").pop() || "png";
                        const path = `${projectId}/favicon-${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("project-assets").upload(path, file, { upsert: true, contentType: file.type });
                        if (error) { toast.error("Upload failed"); return; }
                        const { data } = supabase.storage.from("project-assets").getPublicUrl(path);
                        setSeo({ ...seo, favicon: data.publicUrl });
                        toast.success("Icon uploaded");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <input
                    maxLength={60}
                    value={seo.title}
                    onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                    placeholder="Megsy app"
                    className="flex-1 h-12 px-4 rounded-xl bg-foreground/[0.04] outline-none text-[15px]"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">Description</span>
                  <span className="text-[12px] text-muted-foreground">{seo.description.length}/160</span>
                </div>
                <textarea
                  maxLength={160}
                  rows={3}
                  value={seo.description}
                  onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                  className="w-full p-3 rounded-xl bg-foreground/[0.04] outline-none text-[15px] resize-none"
                />
              </div>

              <div className="mb-5">
                <div className="text-[13px] font-medium mb-2">Social image</div>
                {seo.ogImage && (
                  <div className="mb-2 rounded-xl overflow-hidden bg-foreground/[0.04]">
                    <img src={seo.ogImage} alt="" className="w-full h-32 object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-foreground/[0.04] p-2 pe-1.5">
                  <label className="flex items-center gap-2 px-3 h-10 text-[14px] cursor-pointer relative">
                    <Upload className="w-4 h-4" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !projectId) return;
                        const ext = file.name.split(".").pop() || "png";
                        const path = `${projectId}/og-${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("project-assets").upload(path, file, { upsert: true, contentType: file.type });
                        if (error) { toast.error("Upload failed"); return; }
                        const { data } = supabase.storage.from("project-assets").getPublicUrl(path);
                        setSeo({ ...seo, ogImage: data.publicUrl });
                        toast.success("Image uploaded");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <button
                    onClick={() => {
                      const title = encodeURIComponent(seo.title || project?.name || "Megsy App");
                      setSeo({ ...seo, ogImage: `https://og.megsyai.com/api/og?title=${title}` });
                      toast.success("Share image created");
                    }}
                    className="px-4 h-10 rounded-lg bg-background border border-foreground/10 text-[14px] font-medium text-muted-foreground"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[13px] font-medium mb-2">Preview</div>
                <div className="rounded-xl bg-foreground/[0.04] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {seo.favicon
                      ? <img src={seo.favicon} alt="" className="w-4 h-4 rounded-sm" />
                      : <Heart className="w-4 h-4" fill="currentColor" />}
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-[15px] truncate">
                      {seo.title || "Megsy App"}
                    </span>
                  </div>
                  <div className="text-[13px] text-emerald-700 dark:text-emerald-400 truncate mb-1">{fullUrl}</div>
                  <div className="text-[13px] text-muted-foreground line-clamp-2">
                    {seo.description || "Megsy Generated Project"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Review */}
          {step === "review" && (
            <>
              <div className="font-semibold text-[15px] mb-3">Review and publish</div>
              <div className="space-y-1">
                <ReviewRow
                  iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  icon={<Link2 className="w-5 h-5" />}
                  title="URL"
                  subtitle={fullUrl}
                  onClick={() => setStep("url")}
                />
                <ReviewRow
                  iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  icon={<Globe className="w-5 h-5" />}
                  title="Visibility"
                  subtitle={visLabel}
                  onClick={() => setStep("visibility")}
                />
                <ReviewRow
                  iconBg="bg-foreground/[0.06] text-foreground"
                  icon={<FileText className="w-5 h-5" />}
                  title="Website info"
                  subtitle={seoComplete ? (seo.title || "Set") : "Missing info"}
                  onClick={() => setStep("seo")}
                />
                <ReviewRow
                  iconBg="bg-foreground/[0.06] text-foreground"
                  icon={<ShieldCheck className="w-5 h-5" />}
                  title="Security scan recommended"
                  subtitle="Run security scan for free"
                />
              </div>

              <button
                onClick={() => { close(); setTimeout(() => navigate(`/build/${projectId}/security`), 220); }}
                className="w-full mt-4 h-12 rounded-2xl bg-foreground/[0.04] text-[15px] font-medium"
              >
                Run security check
              </button>
            </>
          )}

          {/* PUBLISHING */}
          {step === "publishing" && (
            <div className="pt-12 pb-10 grid place-items-center text-center">
              <div className="relative w-14 h-14 mb-6 ios-spinner">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="ios-spinner-bar"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-140%)`,
                      animationDelay: `${(i - 12) * 0.083}s`,
                    }}
                  />
                ))}
              </div>
              <div className="text-lg font-semibold mb-1">Publishing…</div>
              <div className="text-sm text-muted-foreground">This may take a few moments</div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="pt-6 pb-2 grid place-items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 grid place-items-center mb-5">
                <div className="w-14 h-14 rounded-full bg-emerald-500 grid place-items-center">
                  <Check className="w-7 h-7 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-[22px] font-bold mb-1">Your app is live!</div>
              <div className="text-[14px] text-muted-foreground mb-5">Successfully published to the internet</div>

              <div className="w-full rounded-2xl border border-foreground/10 bg-background p-3 flex items-center gap-2 mb-5 min-w-0">
                <span className="flex-1 min-w-0 text-[13px] font-medium truncate text-start" dir="ltr">
                  {(publishedUrl || `https://${fullUrl}`).replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(publishedUrl || `https://${fullUrl}`); toast.success("Copied"); }}
                  className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-foreground/[0.06]"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full grid grid-cols-2 gap-2.5 mb-3">
                <a
                  href={publishedUrl || `https://${fullUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 h-12 px-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-1.5"
                >
                  View app <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(publishedUrl || `https://${fullUrl}`); toast.success("Copied"); }}
                  className="min-w-0 h-12 px-3 rounded-2xl border border-foreground/10 bg-background font-semibold text-[14px]"
                >
                  Share
                </button>
              </div>
              <button
                onClick={() => setStep("published")}
                className="text-[13px] text-muted-foreground"
              >
                Update settings anytime!
              </button>
            </div>
          )}

          {/* PUBLISHED (already live entry view) */}
          {step === "published" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium">Website URL</span>
                <button
                  onClick={() => { close(); setTimeout(() => navigate(`/build/${projectId}/domains`), 220); }}
                  className="flex items-center gap-1.5 text-[14px] font-medium"
                >
                  <Link2 className="w-4 h-4" />
                  Add custom domain
                </button>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-background p-3 flex items-center gap-2 mb-5 min-w-0">
                <span className="flex-1 min-w-0 text-[13px] font-medium truncate" dir="ltr">
                  {(publishedUrl || `https://${fullUrl}`).replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(publishedUrl || `https://${fullUrl}`); toast.success("Copied"); }}
                  className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-foreground/[0.06]"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[13px] font-medium mb-2">Who can see this website</div>
              <div className="rounded-2xl bg-foreground/[0.04] p-3.5 flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                  <Globe className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-[15px]">{visLabel}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {visibility === "public" ? "Anyone with the URL" : "Workspace members only"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { close(); setTimeout(() => navigate(`/build/${projectId}/security`), 220); }}
                  className="min-w-0 h-12 px-3 rounded-2xl border border-foreground/10 bg-background font-semibold text-[14px] truncate"
                >
                  Review security
                </button>
                <button
                  onClick={() => setStep("url")}
                  className="min-w-0 h-12 px-3 rounded-2xl border border-foreground/10 bg-background font-semibold text-[14px] truncate"
                >
                  Edit settings
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(step === "url" || step === "visibility" || step === "seo" || step === "review") && (
          <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-3 shrink-0 border-t border-foreground/[0.06]">
            {step !== "url" ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-[15px] font-medium text-foreground/80"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> Back
              </button>
            ) : <span />}
            <button
              onClick={goNext}
              className={`px-6 h-11 rounded-full font-semibold text-[15px] flex items-center gap-1.5 ${
                step === "review"
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/[0.06] text-foreground"
              }`}
            >
              {step === "review" ? "Publish" : "Continue"}
            </button>
          </div>
        )}

        {step === "published" && (
          <div className="px-5 pb-5 pt-3 shrink-0 border-t border-foreground/[0.06]">
            <button
              onClick={hasUnpublished ? publishInline : close}
              disabled={inlinePublishing}
              className={`relative overflow-hidden w-full h-12 rounded-2xl font-semibold text-[15px] transition-colors ${
                inlineJustDone
                  ? "bg-emerald-500 text-white"
                  : hasUnpublished
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/40 text-primary-foreground"
              }`}
            >
              {inlinePublishing && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:200%_100%] animate-[publishShimmer_1.2s_linear_infinite]"
                />
              )}
              <span className="relative inline-flex items-center justify-center gap-2">
                {inlinePublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing…
                  </>
                ) : inlineJustDone ? (
                  <>
                    <Check className="w-4 h-4" />
                    Published
                  </>
                ) : hasUnpublished ? "Update" : "Up to date"}
              </span>
              <style>{`@keyframes publishShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function VisCard({
  active, onClick, icon, iconBg = "bg-foreground/[0.06]", title, subtitle, badge,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; iconBg?: string;
  title: string; subtitle: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-start p-3.5 rounded-2xl flex items-center gap-3 border transition ${
        active ? "border-primary bg-primary/[0.04]" : "border-foreground/10 bg-foreground/[0.02]"
      }`}
    >
      <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${iconBg}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{title}</div>
        <div className="text-[13px] text-muted-foreground truncate">{subtitle}</div>
      </div>
      {badge && (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-sm bg-violet-500" />
          {badge}
        </span>
      )}
      {active && (
        <span className="w-5 h-5 rounded-full bg-primary grid place-items-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-background" />
        </span>
      )}
    </button>
  );
}

function ReviewRow({
  icon, iconBg, title, subtitle, onClick,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 text-start"
    >
      <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${iconBg}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">{title}</div>
        <div className="text-[13px] text-muted-foreground truncate">{subtitle}</div>
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />}
    </button>
  );
}
