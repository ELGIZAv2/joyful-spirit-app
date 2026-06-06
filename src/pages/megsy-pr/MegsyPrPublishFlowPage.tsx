// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Image as ImageIcon, Upload, Check, ExternalLink, Globe, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan } from "@/hooks/useUserPlan";
import MegsyStar from "@/components/files/MegsyStar";
import { prepareProjectFilesForDeploy } from "@/lib/projectBuildGuards";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Step = "url" | "audience" | "seo" | "review" | "done";

export default function MegsyPrPublishFlowPage({ onClose }: { onClose?: () => void } = {}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan } = useUserPlan();
  const isPremium = plan && plan !== "free";

  const step: Step = (() => {
    if (location.pathname.endsWith("/audience")) return "audience";
    if (location.pathname.endsWith("/seo")) return "seo";
    if (location.pathname.endsWith("/review")) return "review";
    if (location.pathname.endsWith("/done")) return "done";
    return "url";
  })();

  const [project, setProject] = useState<any>(null);
  const [slug, setSlug] = useState("");
  const [editSlug, setEditSlug] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "workspace">("public");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [socialImageUrl, setSocialImageUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, published_url, visibility, publish_settings, thumbnail_url")
        .eq("id", projectId).single();
      if (!data) return;
      setProject(data);
      setVisibility((data.visibility as any) || "public");
      const settings = (data.publish_settings as any) || {};
      setSeoTitle(settings.seo_title || data.name || "");
      setSeoDescription(settings.seo_description || data.description || "");
      setThumbnailUrl(data.thumbnail_url || settings.thumbnail_url || "");
      setSocialImageUrl(settings.social_image_url || "");
      // derive slug from published_url or generate
      const existing = data.published_url ? data.published_url.replace(/^https?:\/\//, "").split(".")[0] : "";
      setSlug(existing || makeSlug(data.name));
      if (data.published_url) setPublishedUrl(data.published_url);
    })();
  }, [projectId]);

  const goto = (s: Step) => {
    const base = `/build/${projectId}/publish-flow`;
    navigate(s === "url" ? base : `${base}/${s}`);
  };

  const saveAndPublish = async () => {
    if (!projectId) return;
    setPublishing(true);
    goto("done");
    try {
      // Save settings
      await supabase.from("projects").update({
        visibility,
        publish_settings: {
          seo_title: seoTitle,
          seo_description: seoDescription,
          social_image_url: socialImageUrl,
          slug,
        } as any,
        thumbnail_url: thumbnailUrl || null,
      }).eq("id", projectId);

      // Trigger deploy
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in");
      await prepareProjectFilesForDeploy(projectId);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudflare-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ project_id: projectId, mode: "publish", slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Publish failed");
      setPublishedUrl(data.url);
      toast.success("Published ✨");
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
      goto("review");
    } finally {
      setPublishing(false);
    }
  };

  const goBack = () => {
    if (step === "url") {
      if (onClose) onClose();
      else navigate(`/build/${projectId}/preview`);
    }
    else if (step === "audience") goto("url");
    else if (step === "seo") goto("audience");
    else if (step === "review") goto("seo");
    else if (onClose) onClose();
    else navigate(`/build/${projectId}/preview`);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center px-4 pt-3 pb-2 shrink-0">
        <button onClick={goBack} className="w-11 h-11 grid place-items-center rounded-full bg-foreground/[0.04]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center text-[15px] font-semibold">
          {step === "url" && "Project URL"}
          {step === "audience" && "Who can see this website"}
          {step === "seo" && "Improve discoverability"}
          {step === "review" && "Review and publish"}
          {step === "done" && "Publish"}
        </div>
        <div className="w-11" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {step === "url" && (
          <UrlStep
            slug={slug} setSlug={setSlug}
            edit={editSlug} setEdit={setEditSlug}
            isPremium={!!isPremium}
            onAddDomain={() => projectId && navigate(`/build/${projectId}/domains`)}
          />
        )}
        {step === "audience" && (
          <AudienceStep visibility={visibility} setVisibility={setVisibility} />
        )}
        {step === "seo" && (
          <SeoStep
            slug={slug}
            thumbnailUrl={thumbnailUrl} setThumbnailUrl={setThumbnailUrl}
            seoTitle={seoTitle} setSeoTitle={setSeoTitle}
            seoDescription={seoDescription} setSeoDescription={setSeoDescription}
            socialImageUrl={socialImageUrl} setSocialImageUrl={setSocialImageUrl}
          />
        )}
        {step === "review" && (
          <ReviewStep
            slug={slug} visibility={visibility}
            seoTitle={seoTitle} seoDescription={seoDescription}
            thumbnailUrl={thumbnailUrl} socialImageUrl={socialImageUrl}
          />
        )}
        {step === "done" && (
          <DoneStep
            publishing={publishing}
            publishedUrl={publishedUrl}
            onAddDomain={() => projectId && navigate(`/build/${projectId}/domains`)}
            onShare={async () => {
              if (publishedUrl) {
                try { await navigator.share?.({ url: publishedUrl }); }
                catch { await navigator.clipboard.writeText(publishedUrl); toast.success("Copied"); }
              }
            }}
            onBack={() => navigate(`/build/${projectId}/preview`)}
          />
        )}
      </div>

      {/* Footer continue button */}
      {step !== "done" && (
        <div className="fixed inset-x-0 bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={() => {
              if (step === "url") goto("audience");
              else if (step === "audience") goto("seo");
              else if (step === "seo") goto("review");
              else if (step === "review") saveAndPublish();
            }}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold hover:opacity-90 disabled:opacity-50"
            disabled={step === "url" && !slug.trim()}
          >
            {step === "review" ? "Publish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

// ====================== Sub-steps ======================
function UrlStep({ slug, setSlug, edit, setEdit, isPremium, onAddDomain }: any) {
  return (
    <div className="pt-4">
      <p className="text-sm text-muted-foreground mb-4">
        This is the random URL for the project. You can edit it or connect a custom domain.
      </p>
      <div className="rounded-2xl bg-foreground/[0.04] p-4">
        <div className="text-xs text-muted-foreground mb-2">Base URL</div>
        <div className="flex items-center gap-2">
          {edit ? (
            <input
              autoFocus
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              onBlur={() => setEdit(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEdit(false); }}
              className="flex-1 h-11 rounded-xl bg-background px-3 text-[15px] outline-none border border-foreground/10"
            />
          ) : (
            <div className="flex-1 text-[14px] font-mono truncate">
              {slug || "your-app"}.lovable.app
            </div>
          )}
          <button
            onClick={() => setEdit((v: boolean) => !v)}
            className="w-10 h-10 grid place-items-center rounded-xl hover:bg-foreground/[0.06]"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
      <button
        onClick={() => isPremium ? onAddDomain() : toast("Premium feature — please upgrade")}
        className="mt-3 w-full flex items-center gap-3 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.06] transition px-4 py-4 text-start"
      >
        <Plus className="w-5 h-5" />
        <div className="flex-1">
          <div className="text-[15px] font-medium">Add a custom domain</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isPremium ? "Connect your own domain" : "Available to Premium subscribers only"}
          </div>
        </div>
        {!isPremium && <Lock className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

function AudienceStep({ visibility, setVisibility }: any) {
  return (
    <div className="pt-4 space-y-3">
      <p className="text-[15px] font-semibold mb-2">Who can see this website</p>
      <Option
        active={visibility === "public"}
        onClick={() => setVisibility("public")}
        icon={<Globe className="w-5 h-5" />}
        title="Public"
        sub="Anyone with the link can visit the site"
      />
      <Option
        active={visibility === "workspace"}
        onClick={() => setVisibility("workspace")}
        icon={<Users className="w-5 h-5" />}
        title="Only people in this workspace"
        sub="Only workspace members have access"
      />
    </div>
  );
}

function SeoStep(props: any) {
  const { slug, thumbnailUrl, setThumbnailUrl, seoTitle, setSeoTitle, seoDescription, setSeoDescription, socialImageUrl, setSocialImageUrl } = props;
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div className="pt-4 space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-2 px-1">Site image (shows in Google)</div>
        <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} aspect="square" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-2 px-1">Site name (shows in Google)</div>
        <input
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          maxLength={60}
          placeholder="Lovable App"
          className="w-full h-12 rounded-xl bg-foreground/[0.04] px-4 text-[15px] outline-none"
        />
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-2 px-1">Project description</div>
        <textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Short description that appears in search results"
          className="w-full rounded-xl bg-foreground/[0.04] px-4 py-3 text-[15px] outline-none resize-none"
        />
        <div className="text-[11px] text-muted-foreground mt-1 text-end">{seoDescription.length}/160</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-2 px-1">Social image (shown when the link is shared)</div>
        <ImageUpload value={socialImageUrl} onChange={setSocialImageUrl} aspect="wide" />
      </div>
      <button
        onClick={() => setPreviewOpen((v) => !v)}
        className="w-full h-12 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.06] text-[14px] font-medium"
      >
        {previewOpen ? "Hide search preview" : "Preview how it looks in search"}
      </button>
      {previewOpen && (
        <div className="rounded-2xl bg-foreground/[0.03] p-4 border border-foreground/10">
          <div className="text-[12px] text-muted-foreground truncate">{slug || "your-app"}.lovable.app</div>
          <div className="text-[18px] text-blue-600 dark:text-blue-400 leading-tight mt-0.5 truncate">{seoTitle || "Lovable App"}</div>
          <div className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{seoDescription || "The site description will appear here in search results."}</div>
        </div>
      )}
    </div>
  );
}

function ReviewStep({ slug, visibility, seoTitle, seoDescription, thumbnailUrl, socialImageUrl }: any) {
  return (
    <div className="pt-4 space-y-3">
      <p className="text-[15px] font-semibold mb-2">Review and publish</p>
      <SummaryRow label="URL" value={`${slug || "your-app"}.lovable.app`} />
      <SummaryRow label="Audience" value={visibility === "public" ? "Public" : "Workspace only"} />
      <SummaryRow label="Title" value={seoTitle || "—"} />
      <SummaryRow label="Description" value={seoDescription || "—"} />
      <SummaryRow label="Search image" value={thumbnailUrl ? "✓ uploaded" : "—"} />
      <SummaryRow label="Share image" value={socialImageUrl ? "✓ uploaded" : "—"} />
    </div>
  );
}

function DoneStep({ publishing, publishedUrl, onAddDomain, onShare, onBack }: any) {
  return (
    <div className="pt-12 flex flex-col items-center text-center">
      {publishing ? (
        <>
          <div className="animate-pulse">
            <MegsyStar size={64} />
          </div>
          <div className="mt-6 text-[16px] font-medium ai-shimmer">Publishing…</div>
          <div className="mt-2 text-sm text-muted-foreground">This takes a few seconds</div>
        </>
      ) : publishedUrl ? (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <div className="mt-4 text-[18px] font-semibold">Published</div>
          <a href={publishedUrl} target="_blank" rel="noreferrer" className="mt-2 text-[14px] text-primary inline-flex items-center gap-1.5 underline">
            {publishedUrl} <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="grid grid-cols-2 gap-2 w-full mt-6">
            <button onClick={onShare} className="h-12 rounded-xl bg-foreground text-background text-[14px] font-semibold">Share</button>
            <button onClick={onAddDomain} className="h-12 rounded-xl bg-foreground/[0.05] hover:bg-foreground/[0.08] text-[14px] font-semibold">Custom domain</button>
          </div>
          <button onClick={onBack} className="mt-3 w-full h-12 rounded-xl text-sm text-muted-foreground hover:bg-foreground/[0.05]">
            Back to preview
          </button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Publishing has not started yet</div>
      )}
    </div>
  );
}

// ====================== Helpers ======================
function Option({ active, onClick, icon, title, sub }: any) {
  return (
    <button onClick={onClick} className={`w-full text-start rounded-2xl p-4 flex items-center gap-3 transition border ${active ? "bg-primary/5 border-primary" : "bg-foreground/[0.03] border-transparent hover:bg-foreground/[0.05]"}`}>
      <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] grid place-items-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
      {active && <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="w-3 h-3" /></div>}
    </button>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-foreground/[0.04] px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[14px] font-medium truncate ms-2 max-w-[60%] text-end">{value}</span>
    </div>
  );
}

function ImageUpload({ value, onChange, aspect }: { value: string; onChange: (v: string) => void; aspect: "square" | "wide" }) {
  const cls = aspect === "square" ? "aspect-square w-32" : "aspect-[1.91/1] w-full";
  return (
    <label className={`block ${cls} rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.06] cursor-pointer overflow-hidden border border-dashed border-foreground/15`}>
      {value ? (
        <img src={value} alt="upload" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <Upload className="w-5 h-5" />
            <span className="text-xs">Upload image</span>
          </div>
        </div>
      )}
      <input
        type="file" accept="image/*" hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          // Convert to data URL (lightweight; replace with storage upload later)
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(f);
        }}
      />
    </label>
  );
}

function makeSlug(name?: string) {
  if (!name) return "app-" + Math.random().toString(36).slice(2, 8);
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "app";
}
