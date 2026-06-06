// Help center — guides for every page/section in the app.
import { useNavigate } from "react-router-dom";
import { goBackOr } from "@/lib/navigation";
import { BackIcon } from "@/components/settings/SettingsIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    title: "Getting started",
    items: [
      { q: "What is Megsy?", a: "Megsy is an all-in-one AI creative platform — chat, images, videos, websites/code, presentations, and file analysis, all running on Megsy Credits (MC)." },
      { q: "How do credits (MC) work?", a: "Every action consumes MC. Chat costs 1 MC, images start at 2 MC, videos at 8 MC, and Build projects vary by complexity. Your balance is shown in Settings → Billing." },
      { q: "How do I sign in?", a: "Go to /auth and sign in with email or Google. Forgot your password? Use the recovery link on the login screen." },
      { q: "Free vs paid plans", a: "Free includes a starter credit allowance. Paid plans (Starter, Pro, Elite, Enterprise) add monthly MC, faster models, and team features. Compare at /pricing." },
    ],
  },
  {
    title: "Chat",
    items: [
      { q: "How do I start a chat?", a: "Open /chat and type your prompt. You can attach files, enable web search, switch models, and pick agents (Deep Research, Slides, Learning, Docs) from the composer." },
      { q: "Can Megsy remember things about me?", a: "Yes — important details are saved in Memory. Manage them from Settings → Memory." },
      { q: "How do I share a conversation?", a: "Open any chat → menu → Share. A read-only public link is created. You can revoke it anytime." },
      { q: "What is Deep Research?", a: "An agent that runs multi-source web research and returns a structured report with citations. Pick it from the agent picker before sending." },
      { q: "What is Slides mode?", a: "Generates a full editable presentation from a prompt. Export to PPTX from the slide deck view." },
    ],
  },
  {
    title: "Images & Video",
    items: [
      { q: "How do I generate an image?", a: "Open Media → Image Studio, pick a model, write your prompt, choose ratio and quality, then generate." },
      { q: "How do I generate a video?", a: "Open Media → Video Studio, pick a model, optionally upload a starting image, write your prompt, and generate." },
      { q: "What is Lip Sync?", a: "Upload a portrait video and an audio file, and Megsy syncs the mouth movements to the audio." },
      { q: "Can I edit a generated image?", a: "Yes — open the image and use the edit tools (inpaint, upscale, background remove). Each edit costs MC." },
      { q: "Where are my generations saved?", a: "Everything you generate lives in your Library, scoped to your account or active workspace." },
    ],
  },
  {
    title: "Build (websites & apps)",
    items: [
      { q: "How do I start a project?", a: "Open /build, describe what you want, and Megsy scaffolds a working project you can iterate on with chat." },
      { q: "Can I preview my project?", a: "Yes — every project has a live preview pane that updates as the AI edits files." },
      { q: "How do I publish a project?", a: "Open the project → Publish. You get a free megsy.app subdomain, or connect a custom domain from project Settings." },
      { q: "Can I connect a database?", a: "Yes — projects can use Lovable Cloud for auth, database, storage, and edge functions." },
    ],
  },
  {
    title: "Workspaces",
    items: [
      { q: "What is a workspace?", a: "A shared space for teams. Members share credits and content. Switch from the account switcher in Settings." },
      { q: "How do I invite a member?", a: "Settings → Workspaces → pick a workspace → Members → Invite by email or shareable link." },
      { q: "What are roles?", a: "Owner controls billing, Admin manages members and content, Member can create and edit, Viewer is read-only." },
      { q: "How do credits work in a workspace?", a: "Workspace credits are a shared pool — any member's action draws from it. Personal credits stay separate." },
    ],
  },
  {
    title: "Billing & Plans",
    items: [
      { q: "How do I buy credits?", a: "Settings → Billing → Buy credits. You can pay with card or supported local methods." },
      { q: "How do I upgrade my plan?", a: "Visit /pricing and choose a plan. Upgrades take effect immediately and unused credits roll over." },
      { q: "How do I cancel?", a: "Settings → Billing → Manage subscription → Cancel. You keep access until the end of the billing period." },
      { q: "Do you offer refunds?", a: "Yes within 14 days for unused credits. Contact our team from Help & Support → Contact our team." },
      { q: "Can I get an invoice?", a: "Invoices are emailed automatically and also available in Settings → Billing → History." },
    ],
  },
  {
    title: "Integrations & API",
    items: [
      { q: "Which integrations are available?", a: "Settings → Integrations lists every connector (Google Drive, Notion, Slack, GitHub, and more). Connect once to use across chat and Build." },
      { q: "How do I get an API key?", a: "Visit api.megsyai.com → Dashboard → API keys. Each call consumes MC from the key's workspace." },
      { q: "What models are exposed via API?", a: "All chat, image, video, and embedding models. See the docs at api.megsyai.com/docs." },
    ],
  },
  {
    title: "Settings & Privacy",
    items: [
      { q: "Where do I change my email or password?", a: "Settings → Account → Change email / Change password." },
      { q: "How do I delete my account?", a: "Settings → Account → Delete account. This is irreversible and wipes all personal data within 30 days." },
      { q: "How do I export my data?", a: "Settings → Privacy & Data → Export. You'll receive a ZIP with all your chats, files, and generations." },
      { q: "Is my data used for training?", a: "No. Your prompts and outputs are never used to train models. See the Privacy policy for details." },
      { q: "How do I enable two-factor auth?", a: "Settings → Account → Security → Enable 2FA. Use any TOTP app like 1Password or Authy." },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      { q: "A generation failed — am I charged?", a: "No. Failed generations are automatically refunded within a few minutes." },
      { q: "The app feels slow", a: "Check status.megsyai.com for incidents. Try a hard refresh, then sign out and back in." },
      { q: "I can't sign in", a: "Use the password reset link, check for typos in your email, and make sure cookies aren't blocked." },
      { q: "Where do I report a bug?", a: "Help & Support → Contact our team. Include screenshots and the URL where it happened." },
    ],
  },
];

export default function SettingsHelpPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const body = (
    <div className="space-y-8">
      {sections.map((sec) => (
        <section key={sec.title}>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2">
            {sec.title}
          </p>
          <Accordion type="single" collapsible className="border border-border rounded-2xl bg-card divide-y divide-border">
            {sec.items.map((it, i) => (
              <AccordionItem key={i} value={`${sec.title}-${i}`} className="border-0 px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Help Center" subtitle="Guides and answers for every page and section in Megsy.">
        {body}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => goBackOr(navigate, "/settings/support")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Help Center</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Guides and answers for every page and section in Megsy.
        </p>

        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.title}>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2">
                {sec.title}
              </p>
              <Accordion type="single" collapsible className="border border-border rounded-2xl bg-card divide-y divide-border">
                {sec.items.map((it, i) => (
                  <AccordionItem key={i} value={`${sec.title}-${i}`} className="border-0 px-4">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                      {it.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
