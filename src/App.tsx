import { useEffect, useState, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary, { RouteErrorBoundary } from "@/components/common/ErrorBoundary";
import OfflineBanner from "@/components/common/OfflineBanner";
import CookieConsent from "./components/common/CookieConsent";
import TranslationWrapper from "./components/common/TranslationWrapper";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";


// Redirect legacy /tools/<slug> to /images/tools/<slug>
const LegacyToolsRedirect = () => {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/tools/, "");
  return <Navigate to={`/images/tools${rest}`} replace />;
};

// Critical pages — eagerly loaded (landing only; everything else is lazy)
const LandingPage = lazy(() => import("./pages/marketing/LandingPage"));

// Lazy-loaded auth + chat (huge bundles, not needed on landing)
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const OAuthCallbackPage = lazy(() => import("./pages/auth/OAuthCallbackPage"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const CodeLandingPage = lazy(() => import("./pages/code/CodeLandingPage"));
const ServiceLandingPage = lazy(() => import("./pages/landings/ServiceLandingPage"));
const CodeNewPage = lazy(() => import("./pages/code/CodeNewPage"));
const CodeWorkspacePage = lazy(() => import("./pages/code/CodeWorkspacePage"));
const SePage = lazy(() => import("./pages/SePage"));
// Imported design: Megsy PR programming UI
const MegsyPrHomePage = lazy(() => import("./pages/megsy-pr/MegsyPrHomePage"));
const MegsyPrWorkspacePage = lazy(() => import("./pages/megsy-pr/MegsyPrWorkspacePage"));
const MegsyPrCodePage = lazy(() => import("./pages/megsy-pr/MegsyPrCodePage"));
const MegsyPrCloudPage = lazy(() => import("./pages/megsy-pr/MegsyPrCloudPage"));
const MegsyPrPublishPage = lazy(() => import("./pages/megsy-pr/MegsyPrPublishPage"));
const MegsyPrPublishFlowPage = lazy(() => import("./pages/megsy-pr/MegsyPrPublishFlowPage"));
const MegsyPrAnalyticsPage = lazy(() => import("./pages/megsy-pr/MegsyPrAnalyticsPage"));
const MegsyPrSecurityPage = lazy(() => import("./pages/megsy-pr/MegsyPrSecurityPage"));
const MegsyPrSpeedPage = lazy(() => import("./pages/megsy-pr/MegsyPrSpeedPage"));
const MegsyPrVersionsPage = lazy(() => import("./pages/megsy-pr/MegsyPrVersionsPage"));
const MegsyPrSettingsPage = lazy(() => import("./pages/megsy-pr/MegsyPrSettingsPage"));
const BuildWorkspaceDesignOptionsPage = lazy(() => import("./pages/megsy-pr/BuildWorkspaceDesignOptionsPage"));
const InternalTemplatePreviewPage = lazy(() =>
  import("./pages/megsy-pr/templates/InternalTemplatePreviewPage").then((m) => ({ default: m.default }))
);
const InternalTemplateStandalonePage = lazy(() =>
  import("./pages/megsy-pr/templates/InternalTemplatePreviewPage").then((m) => ({
    default: m.InternalTemplateStandalonePage,
  }))
);

// Lazy-loaded pages
const MediaHubPage = lazy(() => import("./pages/media/MediaHubPage"));
const MediaToolsPage = lazy(() => import("./pages/media/MediaToolsPage"));
const MediaPreviewPage = lazy(() => import("./pages/media/MediaPreviewPage"));
const TemplatePreviewPage = lazy(() => import("./pages/media/TemplatePreviewPage"));
const GalleryPage = lazy(() => import("./pages/media/GalleryPage"));

const CommunityPage = lazy(() => import("./pages/community/CommunityPage"));
const PricingPage = lazy(() => import("./pages/marketing/PricingPage"));
const FeaturesGuidePage = lazy(() => import("./pages/marketing/FeaturesGuidePage"));
const MegsyCornPage = lazy(() => import("./pages/megsy-corn/MegsyCornPage"));
const MegsyCornRunPage = lazy(() => import("./pages/megsy-corn/MegsyCornRunPage"));
const MegsyAgentsPage = lazy(() => import("./pages/megsy-os/MegsyAgentsPage"));
const MegsyAgentRunPage = lazy(() => import("./pages/megsy-os/MegsyAgentRunPage"));
const MegsySquadsPage = lazy(() => import("./pages/megsy-os/MegsySquadsPage"));
const MegsySquadRunPage = lazy(() => import("./pages/megsy-os/MegsySquadRunPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const CustomizationPage = lazy(() => import("./pages/settings/CustomizationPage"));
const ProfileSettingsPage = lazy(() => import("./pages/settings/ProfileSettingsPage"));
const BillingPage = lazy(() => import("./pages/billing/BillingPage"));
const BillingSuccessPage = lazy(() => import("./pages/billing/BillingSuccessPage"));
const ReferralsPage = lazy(() => import("./pages/billing/ReferralsPage"));
const LanguagePage = lazy(() => import("./pages/settings/LanguagePage"));
const IntegrationsPage = lazy(() => import("./pages/integrations/IntegrationsPage"));
const NotFound = lazy(() => import("./pages/misc/NotFound"));
const PlansModelsPage = lazy(() => import("./pages/marketing/PlansModelsPage"));

const ChangeEmailPage = lazy(() => import("./pages/auth/ChangeEmailPage"));
const ChangePasswordPage = lazy(() => import("./pages/auth/ChangePasswordPage"));
const DeleteAccountPage = lazy(() => import("./pages/auth/DeleteAccountPage"));
const WithdrawPage = lazy(() => import("./pages/billing/WithdrawPage"));
const NotificationSettingsPage = lazy(() => import("./pages/settings/NotificationSettingsPage"));
const OAuthAuthorizePage = lazy(() => import("./pages/auth/OAuthAuthorizePage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const SharedChatPage = lazy(() => import("./pages/chat/SharedChatPage"));
const AcceptInvitePage = lazy(() => import("./pages/auth/AcceptInvitePage"));
const ContactPage = lazy(() => import("./pages/marketing/ContactPage"));
const ImageStudioPage = lazy(() => import("./pages/media/ImageStudioPage"));
const VideoStudioPage = lazy(() => import("./pages/media/VideoStudioPage"));
const CinemaStudioPage = lazy(() => import("./pages/media/CinemaStudioPage"));
const LipSyncStudioPage = lazy(() => import("./pages/media/LipSyncStudioPage"));

const EgyptPage = lazy(() => import("./pages/marketing/EgyptPage"));
const CookiePolicyPage = lazy(() => import("./pages/marketing/CookiePolicyPage"));
const TermsPage = lazy(() => import("./pages/marketing/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/marketing/PrivacyPage"));
const RefundPage = lazy(() => import("./pages/marketing/RefundPage"));
const ReferralRedirectPage = lazy(() => import("./pages/auth/ReferralRedirectPage"));
const ReferralLandingPage = lazy(() => import("./pages/referral/ReferralLandingPage"));


const AffiliateTermsPage = lazy(() => import("./pages/marketing/AffiliateTermsPage"));
const DMCAPage = lazy(() => import("./pages/marketing/DMCAPage"));
const AIDisclaimerPage = lazy(() => import("./pages/marketing/AIDisclaimerPage"));
const DPAPage = lazy(() => import("./pages/marketing/DPAPage"));
const ModerationPage = lazy(() => import("./pages/marketing/ModerationPage"));
const SubprocessorsPage = lazy(() => import("./pages/marketing/SubprocessorsPage"));
const AgePolicyPage = lazy(() => import("./pages/marketing/AgePolicyPage"));
const AccessibilityPage = lazy(() => import("./pages/marketing/AccessibilityPage"));
const CompliancePage = lazy(() => import("./pages/marketing/CompliancePage"));
const ContentPolicyPage = lazy(() => import("./pages/marketing/ContentPolicyPage"));
const TrustCenterPage = lazy(() => import("./pages/marketing/TrustCenterPage"));
const SecurityPage = lazy(() => import("./pages/settings/SecurityPage"));
const SupportPage = lazy(() => import("./pages/marketing/SupportPage"));
const EnterprisePage = lazy(() => import("./pages/marketing/EnterprisePage"));
const AboutPage = lazy(() => import("./pages/marketing/AboutPage"));
const BlogPage = lazy(() => import("./pages/marketing/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/marketing/BlogPostPage"));
const ComparisonPage = lazy(() => import("./pages/marketing/ComparisonPage"));
const VideoToTextPage = lazy(() => import("./pages/tools/VideoToTextPage"));
const AIPersonalizationPage = lazy(() => import("./pages/settings/AIPersonalizationPage"));
const MemoryPage = lazy(() => import("./pages/settings/MemoryPage"));
const SettingsSupportPage = lazy(() => import("./pages/settings/SettingsSupportPage"));
const SettingsHelpPage = lazy(() => import("./pages/settings/SettingsHelpPage"));
const SettingsContactPage = lazy(() => import("./pages/settings/SettingsContactPage"));
const SettingsPrivacyPage = lazy(() => import("./pages/settings/SettingsPrivacyPage"));
const ResearchPreviewPage = lazy(() => import("./pages/chat/ResearchPreviewPage"));
const InpaintPage = lazy(() => import("./pages/tools/InpaintPage"));
const ClothesChangerPage = lazy(() => import("./pages/tools/ClothesChangerPage"));
const HeadshotPage = lazy(() => import("./pages/tools/HeadshotPage"));
const BgRemoverPage = lazy(() => import("./pages/tools/BgRemoverPage"));
const FaceSwapPage = lazy(() => import("./pages/tools/FaceSwapPage"));
const RelightPage = lazy(() => import("./pages/tools/RelightPage"));
const ColorizerPage = lazy(() => import("./pages/tools/ColorizerPage"));
const CharacterSwapPage = lazy(() => import("./pages/tools/CharacterSwapPage"));
const StoryboardPage = lazy(() => import("./pages/tools/StoryboardPage"));
const SketchToImagePage = lazy(() => import("./pages/tools/SketchToImagePage"));
const RetouchingPage = lazy(() => import("./pages/tools/RetouchingPage"));
const RemoverPage = lazy(() => import("./pages/tools/RemoverPage"));
const HairChangerPage = lazy(() => import("./pages/tools/HairChangerPage"));
const CartoonPage = lazy(() => import("./pages/tools/CartoonPage"));
const AvatarGeneratorPage = lazy(() => import("./pages/tools/AvatarGeneratorPage"));
const ProductPhotoPage = lazy(() => import("./pages/tools/ProductPhotoPage"));
const LogoGeneratorPage = lazy(() => import("./pages/tools/LogoGeneratorPage"));
const PerspectiveCorrectionPage = lazy(() => import("./pages/tools/PerspectiveCorrectionPage"));
const VideoSwapPage = lazy(() => import("./pages/tools/VideoSwapPage"));
const VideoUpscalePage = lazy(() => import("./pages/tools/VideoUpscalePage"));
const TalkingPhotoPage = lazy(() => import("./pages/tools/TalkingPhotoPage"));
const VideoExtenderPage = lazy(() => import("./pages/tools/VideoExtenderPage"));
const AutoCaptionPage = lazy(() => import("./pages/tools/AutoCaptionPage"));
const LipSyncPage = lazy(() => import("./pages/tools/LipSyncPage"));
const GreenScreenPage = lazy(() => import("./pages/tools/GreenScreenPage"));
const VideoColorizerPage = lazy(() => import("./pages/tools/VideoColorizerPage"));
const VideoWatermarkPage = lazy(() => import("./pages/tools/VideoWatermarkPage"));
const VideoBgReplacerPage = lazy(() => import("./pages/tools/VideoBgReplacerPage"));
const VideoIntroPage = lazy(() => import("./pages/tools/VideoIntroPage"));
const VideoDenoisePage = lazy(() => import("./pages/tools/VideoDenoisePage"));
const ThumbnailGeneratorPage = lazy(() => import("./pages/tools/ThumbnailGeneratorPage"));
const SkillsSettingsPage = lazy(() => import("./pages/settings/SkillsSettingsPage"));
const SkillsNewPage = lazy(() => import("./pages/settings/SkillsNewPage"));
const MegsyOperatorSettingsPage = lazy(() => import("./pages/settings/MegsyOperatorSettingsPage"));
const OperatorAgentsPage = lazy(() => import("./pages/settings/OperatorAgentsPage"));
const OperatorAuditPage = lazy(() => import("./pages/settings/OperatorAuditPage"));
const WorkspacesPage = lazy(() => import("./pages/workspace/WorkspacesPage"));
const WorkspaceCreatePage = lazy(() => import("./pages/workspace/WorkspaceCreatePage"));
const WorkspaceDetailPage = lazy(() => import("./pages/workspace/WorkspaceDetailPage"));
const WorkspaceProGate = lazy(() => import("./components/workspace/WorkspaceProGate"));
const WsOverviewTab = lazy(() => import("./components/workspace/tabs/OverviewTab"));
const WsMembersTab = lazy(() => import("./components/workspace/tabs/MembersTab"));
const WsInvitesTab = lazy(() => import("./components/workspace/tabs/InvitesTab"));
const WsBillingTab = lazy(() => import("./components/workspace/tabs/BillingTab"));
const WsUsageTab = lazy(() => import("./components/workspace/tabs/UsageTab"));

const WsBrandTab = lazy(() => import("./components/workspace/tabs/BrandTab"));
const WsActivityTab = lazy(() => import("./components/workspace/tabs/ActivityTab"));
const WsNotificationsTab = lazy(() => import("./components/workspace/tabs/NotificationsTab"));
const WsSecurityTab = lazy(() => import("./components/workspace/tabs/SecurityTab"));

const WsGeneralTab = lazy(() => import("./components/workspace/tabs/GeneralTab"));
const WsDataTab = lazy(() => import("./components/workspace/tabs/DataTab"));
const WsDangerTab = lazy(() => import("./components/workspace/tabs/DangerTab"));
const WorkspaceTasksPage = lazy(() => import("./pages/workspace/WorkspaceTasksPage"));
const AcceptWorkspaceInvitePage = lazy(() => import("./pages/auth/AcceptWorkspaceInvitePage"));

const queryClient = new QueryClient();

import PageLoader from "@/components/common/PageLoader";
const LazyFallback = () => <PageLoader />;

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

const InternalLinkInterceptor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:") ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${location.pathname}${location.search}${location.hash}`;
      if (nextPath === currentPath) return;

      event.preventDefault();
      navigate(nextPath);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};

const DodoReturnRedirect = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (params.get("dodo_return") === "1") {
      const next = new URLSearchParams(params);
      next.delete("dodo_return");
      navigate(`/billing/success?${next.toString()}`, { replace: true });
    } else if (params.get("checkout_cancelled") === "1") {
      navigate("/pricing", { replace: true });
    }
  }, [navigate, params]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setAuthenticated(!!session);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuthenticated(!!session);
        setLoading(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading) return <div className="h-screen bg-background" />;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const applyTheme = (theme: string) => {
      document.documentElement.setAttribute("data-theme", theme);
      // Toggle Tailwind `dark` class so `dark:` variants and any `.dark` rules apply
      const isDark = theme === "dark" || theme === "ocean";
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };
    // Allow `?theme=dark|light|ocean|sunset` URL override (also persists)
    const urlTheme = new URLSearchParams(window.location.search).get("theme");
    const savedTheme = urlTheme || localStorage.getItem("theme") || "dark";
    if (urlTheme) localStorage.setItem("theme", urlTheme);
    applyTheme(savedTheme);
    const savedAccent = localStorage.getItem("accent");
    if (savedAccent) document.documentElement.style.setProperty("--primary", savedAccent);

    // React to theme changes from anywhere in the app
    const onThemeChange = () => applyTheme(localStorage.getItem("theme") || "dark");
    window.addEventListener("themechange-custom", onThemeChange);
    window.addEventListener("storage", (e) => { if (!e.key || e.key === "theme") onThemeChange(); });


    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id || null;
      const lastUserId = localStorage.getItem("megsy_last_user_id");

      if (userId && lastUserId && userId !== lastUserId) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("megsy_cache_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        queryClient.clear();
      }

      if (userId) localStorage.setItem("megsy_last_user_id", userId);

      if (event === "SIGNED_OUT") {
        localStorage.removeItem("megsy_last_user_id");
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("megsy_cache_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        queryClient.clear();
      }

      setCurrentUserId(userId);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Prefetch commonly-visited route chunks once the browser is idle so
  // page-to-page navigation feels instant. Failures are silent.
  useEffect(() => {
    const KEY = "megsy_pages_prefetched_v2";
    const run = () => {
      Promise.all([
        // Core
        import("./pages/chat/ChatPage"),
        import("./pages/auth/AuthPage"),
        import("./pages/media/MediaHubPage"),
        import("./pages/settings/SettingsPage"),
        import("./pages/marketing/PricingPage"),
        import("./pages/settings/ProfileSettingsPage"),
        import("./pages/billing/BillingPage"),
        // Studios
        // Studios
        import("./pages/media/ImageStudioPage"),
        import("./pages/media/VideoStudioPage"),
      ])
        .then(() => {
          try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
        })
        .catch(() => { /* ignore prefetch errors */ });
    };
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    if (idle) idle(run, { timeout: 2000 });
    else setTimeout(run, 800);
  }, []);

  return (
    <TranslationWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <InternalLinkInterceptor />
              <DodoReturnRedirect />
              <OfflineBanner />
              <CookieConsent />
              {/* Global SVG filter — refractive distortion for liquid glass surfaces */}
              <svg aria-hidden width="0" height="0" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
                <defs>
                  <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
                    <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
                    <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="55" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>
              <Suspense fallback={<LazyFallback />}>
                <RouteErrorBoundary>
                <Routes>
                  {/* Auth */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/signin" element={<AuthPage />} />
                  <Route path="/sign-in" element={<AuthPage />} />
                  <Route path="/signup" element={<AuthPage />} />
                  <Route path="/sign-up" element={<AuthPage />} />
                  <Route path="/register" element={<AuthPage />} />
                  <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
                  <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Public / marketing */}
                  <Route path="/" element={<ChatPage key={currentUserId} />} />

                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/home" element={<LandingPage />} />
                  <Route path="/se" element={<SePage />} />
                  <Route path="/l/*" element={<ServiceLandingPage />} />
                  {/* Locale-prefixed landing aliases (e.g. /pt/criar-apps-ia → /l/pt/criar-apps-ia) */}
                  <Route path="/ar/*" element={<ServiceLandingPage />} />
                  <Route path="/es/*" element={<ServiceLandingPage />} />
                  <Route path="/fr/*" element={<ServiceLandingPage />} />
                  <Route path="/de/*" element={<ServiceLandingPage />} />
                  <Route path="/pt/*" element={<ServiceLandingPage />} />
                  <Route path="/ref/:code" element={<ReferralRedirectPage />} />
                  <Route path="/r/:code" element={<ReferralLandingPage />} />

                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/features-guide" element={<FeaturesGuidePage />} />
                  <Route path="/plans-models" element={<PlansModelsPage />} />

                  <Route path="/megsy-corn" element={<MegsyCornPage />} />
                  <Route path="/megsy-corn/run" element={<MegsyCornRunPage />} />
                  <Route path="/megsy-os/agents" element={<MegsyAgentsPage />} />
                  <Route path="/megsy-os/agents/:slug/:sessionId" element={<MegsyAgentRunPage />} />
                  <Route path="/megsy-os/squads" element={<MegsySquadsPage />} />
                  <Route path="/megsy-os/squads/:id/:sessionId" element={<MegsySquadRunPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/egypt" element={<EgyptPage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/refund" element={<RefundPage />} />
                  <Route path="/acceptable-use" element={<Navigate to="/policies/content" replace />} />
                  <Route path="/policies/content" element={<ContentPolicyPage />} />
                  <Route path="/trust" element={<TrustCenterPage />} />
                  <Route path="/legal/affiliate" element={<AffiliateTermsPage />} />
                  <Route path="/legal/dmca" element={<DMCAPage />} />
                  <Route path="/legal/ai-disclaimer" element={<AIDisclaimerPage />} />
                  <Route path="/legal/dpa" element={<DPAPage />} />
                  {/* Merged into /policies/content */}
                  <Route path="/legal/moderation" element={<Navigate to="/policies/content" replace />} />
                  <Route path="/legal/age" element={<Navigate to="/policies/content" replace />} />
                  {/* Merged into /trust */}
                  <Route path="/legal/subprocessors" element={<Navigate to="/trust" replace />} />
                  <Route path="/legal/accessibility" element={<Navigate to="/trust" replace />} />
                  <Route path="/legal/compliance" element={<Navigate to="/trust" replace />} />
                  {/* Legacy standalone pages — kept reachable for deep links */}
                  <Route path="/legal/moderation-full" element={<ModerationPage />} />
                  <Route path="/legal/age-full" element={<AgePolicyPage />} />
                  <Route path="/legal/subprocessors-full" element={<SubprocessorsPage />} />
                  <Route path="/legal/accessibility-full" element={<AccessibilityPage />} />
                  <Route path="/legal/compliance-full" element={<CompliancePage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/enterprise" element={<EnterprisePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/vs/:slug" element={<ComparisonPage />} />

                  {/* Sharing */}
                  <Route path="/share/:shareId" element={<SharedChatPage />} />
                  <Route path="/invite/:token" element={<AcceptInvitePage />} />

                  {/* Chat — public, anonymous can browse and send */}
                  <Route path="/chat" element={<ChatPage key={currentUserId} />} />
                  <Route path="/index" element={<ChatPage key={currentUserId} />} />

                  {/* Code (AI app builder) — landing public, workspace/build actions require auth */}
                  <Route path="/code" element={<MegsyPrHomePage />} />
                  <Route path="/programming" element={<Navigate to="/code" replace />} />
                  <Route path="/code/legacy" element={<CodeLandingPage />} />
                  <Route path="/code/templates/:slug" element={<ProtectedRoute><InternalTemplatePreviewPage /></ProtectedRoute>} />
                  <Route path="/code/templates/:slug/view" element={<InternalTemplateStandalonePage />} />
                  <Route path="/code/new" element={<ProtectedRoute><CodeNewPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId" element={<ProtectedRoute><MegsyPrWorkspacePage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/legacy" element={<ProtectedRoute><CodeWorkspacePage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/code" element={<ProtectedRoute><MegsyPrCodePage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/cloud" element={<ProtectedRoute><MegsyPrCloudPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/publish" element={<ProtectedRoute><MegsyPrPublishPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/publish/flow" element={<ProtectedRoute><MegsyPrPublishFlowPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/analytics" element={<ProtectedRoute><MegsyPrAnalyticsPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/security" element={<ProtectedRoute><MegsyPrSecurityPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/speed" element={<ProtectedRoute><MegsyPrSpeedPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/versions" element={<ProtectedRoute><MegsyPrVersionsPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/settings" element={<ProtectedRoute><MegsyPrSettingsPage /></ProtectedRoute>} />
                  <Route path="/code/:projectId/design" element={<ProtectedRoute><BuildWorkspaceDesignOptionsPage /></ProtectedRoute>} />

                  {/* /build/* aliases — imported design pages internally link to /build/:projectId/* */}
                  <Route path="/build" element={<Navigate to="/code" replace />} />
                  <Route path="/build/:projectId" element={<ProtectedRoute><MegsyPrWorkspacePage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/chat" element={<ProtectedRoute><MegsyPrWorkspacePage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/preview" element={<ProtectedRoute><MegsyPrWorkspacePage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/code" element={<ProtectedRoute><MegsyPrCodePage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/cloud" element={<ProtectedRoute><MegsyPrCloudPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/publish" element={<ProtectedRoute><MegsyPrPublishPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/publish/flow" element={<ProtectedRoute><MegsyPrPublishFlowPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/domains" element={<ProtectedRoute><MegsyPrPublishFlowPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/analytics" element={<ProtectedRoute><MegsyPrAnalyticsPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/security" element={<ProtectedRoute><MegsyPrSecurityPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/speed" element={<ProtectedRoute><MegsyPrSpeedPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/versions" element={<ProtectedRoute><MegsyPrVersionsPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/settings" element={<ProtectedRoute><MegsyPrSettingsPage /></ProtectedRoute>} />
                  <Route path="/build/:projectId/design" element={<ProtectedRoute><BuildWorkspaceDesignOptionsPage /></ProtectedRoute>} />
                  



                  {/* Media hub — landing public, generation/tools require auth */}
                  <Route path="/media" element={<MediaHubPage key={currentUserId} />} />
                  <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
                  <Route path="/preview/:type" element={<ProtectedRoute><MediaPreviewPage /></ProtectedRoute>} />
                  <Route path="/template/:id" element={<ProtectedRoute><TemplatePreviewPage /></ProtectedRoute>} />

                  {/* Images */}
                  <Route path="/images" element={<MediaHubPage key={currentUserId} />} />
                  <Route path="/images/tools" element={<MediaToolsPage />} />
                  <Route path="/videos/tools" element={<MediaToolsPage />} />
                  <Route path="/images/studio" element={<ProtectedRoute><ImageStudioPage key={currentUserId} /></ProtectedRoute>} />

                  <Route path="/images/tools/inpaint" element={<ProtectedRoute><InpaintPage /></ProtectedRoute>} />
                  <Route path="/images/tools/clothes-changer" element={<ProtectedRoute><ClothesChangerPage /></ProtectedRoute>} />
                  <Route path="/images/tools/headshot" element={<ProtectedRoute><HeadshotPage /></ProtectedRoute>} />
                  <Route path="/images/tools/bg-remover" element={<ProtectedRoute><BgRemoverPage /></ProtectedRoute>} />
                  <Route path="/images/tools/portrait-studio" element={<ProtectedRoute><FaceSwapPage /></ProtectedRoute>} />
                  <Route path="/images/tools/face-swap" element={<Navigate to="/images/tools/portrait-studio" replace />} />
                  <Route path="/images/tools/relight" element={<ProtectedRoute><RelightPage /></ProtectedRoute>} />
                  <Route path="/images/tools/colorizer" element={<ProtectedRoute><ColorizerPage /></ProtectedRoute>} />
                  <Route path="/images/tools/character-studio" element={<ProtectedRoute><CharacterSwapPage /></ProtectedRoute>} />
                  <Route path="/images/tools/character-swap" element={<Navigate to="/images/tools/character-studio" replace />} />
                  <Route path="/images/tools/storyboard" element={<ProtectedRoute><StoryboardPage /></ProtectedRoute>} />
                  <Route path="/images/tools/sketch-to-image" element={<ProtectedRoute><SketchToImagePage /></ProtectedRoute>} />
                  <Route path="/images/tools/retouching" element={<ProtectedRoute><RetouchingPage /></ProtectedRoute>} />
                  <Route path="/images/tools/remover" element={<ProtectedRoute><RemoverPage /></ProtectedRoute>} />
                  <Route path="/images/tools/hair-changer" element={<ProtectedRoute><HairChangerPage /></ProtectedRoute>} />
                  <Route path="/images/tools/cartoon" element={<ProtectedRoute><CartoonPage /></ProtectedRoute>} />
                  <Route path="/images/tools/avatar-generator" element={<ProtectedRoute><AvatarGeneratorPage /></ProtectedRoute>} />
                  <Route path="/images/tools/product-photo" element={<ProtectedRoute><ProductPhotoPage /></ProtectedRoute>} />
                  <Route path="/images/tools/logo-generator" element={<ProtectedRoute><LogoGeneratorPage /></ProtectedRoute>} />
                  <Route path="/images/tools/perspective-correction" element={<ProtectedRoute><PerspectiveCorrectionPage /></ProtectedRoute>} />
                  {/* Legacy redirects: /tools/* -> /images/tools/* */}
                  <Route path="/tools/*" element={<LegacyToolsRedirect />} />




                  {/* Videos */}
                  <Route path="/videos" element={<ProtectedRoute><MediaHubPage key={currentUserId} /></ProtectedRoute>} />
                  <Route path="/videos/studio" element={<ProtectedRoute><VideoStudioPage key={currentUserId} /></ProtectedRoute>} />
                  <Route path="/cinema" element={<ProtectedRoute><CinemaStudioPage key={currentUserId} /></ProtectedRoute>} />
                  <Route path="/cinema/studio" element={<ProtectedRoute><CinemaStudioPage key={currentUserId} /></ProtectedRoute>} />
                  <Route path="/lipsync" element={<ProtectedRoute><LipSyncStudioPage key={currentUserId} /></ProtectedRoute>} />
                  
                  <Route path="/videos/tools/character-studio" element={<ProtectedRoute><VideoSwapPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/swap-characters" element={<Navigate to="/videos/tools/character-studio" replace />} />
                  <Route path="/videos/tools/upscale" element={<ProtectedRoute><VideoUpscalePage /></ProtectedRoute>} />
                  <Route path="/videos/tools/talking-photo" element={<ProtectedRoute><TalkingPhotoPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-extender" element={<ProtectedRoute><VideoExtenderPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/auto-caption" element={<ProtectedRoute><AutoCaptionPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/lip-sync" element={<ProtectedRoute><LipSyncPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-to-text" element={<ProtectedRoute><VideoToTextPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/green-screen" element={<ProtectedRoute><GreenScreenPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-colorizer" element={<ProtectedRoute><VideoColorizerPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-watermark" element={<ProtectedRoute><VideoWatermarkPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-bg-replacer" element={<ProtectedRoute><VideoBgReplacerPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-intro" element={<ProtectedRoute><VideoIntroPage /></ProtectedRoute>} />
                  <Route path="/videos/tools/video-denoise" element={<ProtectedRoute><VideoDenoisePage /></ProtectedRoute>} />
                  <Route path="/videos/tools/thumbnail-generator" element={<ProtectedRoute><ThumbnailGeneratorPage /></ProtectedRoute>} />

                  {/* Research */}
                  <Route path="/research/preview/new" element={<ProtectedRoute><ResearchPreviewPage /></ProtectedRoute>} />
                  <Route path="/research/preview/:id" element={<ProtectedRoute><ResearchPreviewPage /></ProtectedRoute>} />
                  <Route path="/research/share/:token" element={<ResearchPreviewPage />} />

                  <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />

                  {/* Settings */}
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/customization" element={<ProtectedRoute><CustomizationPage /></ProtectedRoute>} />
                  <Route path="/settings/ai-personalization" element={<ProtectedRoute><AIPersonalizationPage /></ProtectedRoute>} />
                  <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                  <Route path="/billing/success" element={<BillingSuccessPage />} />
                  <Route path="/suc" element={<BillingSuccessPage />} />
                  <Route path="/settings/referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />
                  <Route path="/settings/language" element={<ProtectedRoute><LanguagePage /></ProtectedRoute>} />
                  <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
                  <Route path="/settings/memory" element={<ProtectedRoute><MemoryPage /></ProtectedRoute>} />
                  <Route path="/settings/skills" element={<ProtectedRoute><SkillsSettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/skills/new" element={<ProtectedRoute><SkillsNewPage /></ProtectedRoute>} />
                  <Route path="/settings/operator" element={<ProtectedRoute><MegsyOperatorSettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/operator/agents" element={<ProtectedRoute><OperatorAgentsPage /></ProtectedRoute>} />
                  <Route path="/settings/operator/audit" element={<ProtectedRoute><OperatorAuditPage /></ProtectedRoute>} />
                  <Route path="/settings/change-email" element={<ProtectedRoute><ChangeEmailPage /></ProtectedRoute>} />
                  <Route path="/settings/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
                  <Route path="/settings/delete-account" element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />
                  <Route path="/settings/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
                  <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/support" element={<ProtectedRoute><SettingsSupportPage /></ProtectedRoute>} />
                  <Route path="/settings/support/help" element={<ProtectedRoute><SettingsHelpPage /></ProtectedRoute>} />
                  <Route path="/settings/support/contact" element={<ProtectedRoute><SettingsContactPage /></ProtectedRoute>} />
                  <Route path="/settings/privacy" element={<ProtectedRoute><SettingsPrivacyPage /></ProtectedRoute>} />
                  
                  <Route path="/settings/workspaces" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
                  <Route path="/settings/workspaces/new" element={<ProtectedRoute><WorkspaceProGate><WorkspaceCreatePage /></WorkspaceProGate></ProtectedRoute>} />
                  <Route path="/settings/workspaces/:id" element={<ProtectedRoute><WorkspaceDetailPage /></ProtectedRoute>}>
                    <Route index element={<WsOverviewTab />} />
                    <Route path="members" element={<WsMembersTab />} />
                    <Route path="invites" element={<WsInvitesTab />} />
                    <Route path="billing" element={<WsBillingTab />} />
                    <Route path="usage" element={<WsUsageTab />} />
                    
                    <Route path="brand" element={<WsBrandTab />} />
                    <Route path="activity" element={<WsActivityTab />} />
                    <Route path="notifications" element={<WsNotificationsTab />} />
                    <Route path="security" element={<WsSecurityTab />} />
                    
                    <Route path="general" element={<WsGeneralTab />} />
                    <Route path="data" element={<WsDataTab />} />
                    <Route path="danger" element={<WsDangerTab />} />
                  </Route>
                  <Route path="/workspaces/:id/tasks" element={<ProtectedRoute><WorkspaceTasksPage /></ProtectedRoute>} />
                  <Route path="/invite/workspace/:token" element={<AcceptWorkspaceInvitePage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </RouteErrorBoundary>
              </Suspense>
            </BrowserRouter>
            <Analytics />
            <SpeedInsights />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </TranslationWrapper>
  );
};

export default App;
