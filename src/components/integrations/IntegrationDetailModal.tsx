import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Integration } from "@/lib/integrationsData";

const FAVICON_SOURCES = (domain: string) => [
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
];

const BrandLogo = ({ integration, size = 32 }: { integration: Integration; size?: number }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const sources = integration.domain ? FAVICON_SOURCES(integration.domain) : [];
  const url = sources[srcIdx];
  if (!url) {
    return (
      <span
        className="font-semibold"
        style={{ color: "#2d2d2d", fontSize: size * 0.55, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {integration.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
};

const descriptions: Record<string, string> = {
  github:
    "Connect GitHub via OAuth to push code, create repos, and read repository contents directly from the app.",
  supabase:
    "Link your Supabase project via OAuth to manage data, migrations, and edge functions from the app.",
  email:
    "Get important notifications by email. Powered by Resend on the backend — no third-party login required.",
  telegram:
    "Receive notifications on Telegram. Open the bot, send /start, then paste your chat id here.",
  cloudflare:
    "Cloudflare Pages deployment runs through a backend API token. Status is shown when the server token is configured.",
};

interface FormState {
  email_address?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
}

interface Props {
  integration: Integration | null;
  isConnected: boolean;
  isLoading: boolean;
  meta?: Record<string, any>;
  onConnect: (form?: FormState) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export default function IntegrationDetailModal({
  integration,
  isConnected,
  isLoading,
  meta,
  onConnect,
  onDisconnect,
  onClose,
}: Props) {
  const [email, setEmail] = useState("");
  const [chatId, setChatId] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!integration) return;
    setEmail(meta?.email_address ?? "");
    setChatId(meta?.telegram_chat_id ?? "");
    setUsername(meta?.telegram_username ?? "");
  }, [integration, meta]);

  if (!integration) return null;

  const isService = integration.type === "service";
  const isNotification = integration.type === "notification";
  const available = meta?.available !== false;

  const submit = () => {
    if (integration.app === "email") return onConnect({ email_address: email });
    if (integration.app === "telegram")
      return onConnect({ telegram_chat_id: chatId, telegram_username: username });
    return onConnect();
  };

  const display = "'Space Grotesk', sans-serif";
  const body = "'DM Sans', sans-serif";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: "rgba(13,13,13,0.45)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden max-h-[88vh] flex flex-col"
          style={{
            background: "#f5f3ee",
            color: "#0d0d0d",
            fontFamily: body,
            border: "1px solid #e8e4dd",
            borderRadius: 0,
          }}
        >
          {/* Header */}
          <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid #e8e4dd" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="grid place-items-center shrink-0"
                  style={{
                    width: 56,
                    height: 56,
                    background: "#ffffff",
                    border: "1px solid #e8e4dd",
                  }}
                >
                  <BrandLogo integration={integration} size={32} />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-xl leading-tight truncate"
                    style={{ fontFamily: display, fontWeight: 600, color: "#0d0d0d" }}
                  >
                    {integration.name}
                  </h2>
                  <p
                    className="mt-1 uppercase"
                    style={{
                      fontFamily: display,
                      letterSpacing: "0.18em",
                      fontSize: 10,
                      color: "#6b6b66",
                    }}
                  >
                    {integration.category}
                    {isConnected ? " · Connected" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-xs uppercase tracking-[0.2em] hover:opacity-60 transition-opacity shrink-0"
                style={{ fontFamily: display, color: "#2d2d2d", letterSpacing: "0.2em" }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
            <section>
              <p
                className="mb-2 uppercase"
                style={{ fontFamily: display, fontSize: 10, letterSpacing: "0.2em", color: "#6b6b66" }}
              >
                About
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: "#2d2d2d" }}>
                {descriptions[integration.app] ?? integration.description}
              </p>
            </section>

            {!available && (
              <div
                className="p-3 text-[12px]"
                style={{
                  background: "#ffffff",
                  border: "1px solid #d8d4cd",
                  color: "#6b6b66",
                }}
              >
                This integration is not configured on the server yet.
              </div>
            )}

            {integration.app === "email" && (
              <div className="space-y-2">
                <label
                  className="uppercase block"
                  style={{
                    fontFamily: display,
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: "#6b6b66",
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-[14px] outline-none focus:border-[#0d0d0d] transition-colors"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e8e4dd",
                    color: "#0d0d0d",
                  }}
                />
              </div>
            )}

            {integration.app === "telegram" && (
              <div className="space-y-2">
                <label
                  className="uppercase block"
                  style={{
                    fontFamily: display,
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: "#6b6b66",
                  }}
                >
                  Your Telegram chat id
                </label>
                <input
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-3 py-2.5 text-[14px] outline-none focus:border-[#0d0d0d] transition-colors"
                  style={{ background: "#ffffff", border: "1px solid #e8e4dd", color: "#0d0d0d" }}
                />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username (optional)"
                  className="w-full px-3 py-2.5 text-[14px] outline-none focus:border-[#0d0d0d] transition-colors"
                  style={{ background: "#ffffff", border: "1px solid #e8e4dd", color: "#0d0d0d" }}
                />
                <p className="text-[11px]" style={{ color: "#6b6b66" }}>
                  Get your id by messaging @userinfobot on Telegram.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-7 py-5" style={{ borderTop: "1px solid #e8e4dd" }}>
            {isService ? (
              <div
                className="w-full py-3 text-center text-[12px] uppercase"
                style={{
                  fontFamily: display,
                  letterSpacing: "0.2em",
                  background: "#ffffff",
                  border: "1px solid #e8e4dd",
                  color: isConnected ? "#0d0d0d" : "#6b6b66",
                }}
              >
                {isConnected ? "Configured on the server" : "Not configured on the server"}
              </div>
            ) : isConnected ? (
              <button
                onClick={onDisconnect}
                disabled={isLoading}
                className="w-full py-3 text-[12px] uppercase hover:opacity-70 transition-opacity disabled:opacity-50"
                style={{
                  fontFamily: display,
                  letterSpacing: "0.2em",
                  background: "transparent",
                  border: "1px solid #0d0d0d",
                  color: "#0d0d0d",
                }}
              >
                {isLoading ? "Working…" : "Disconnect"}
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={isLoading || !available}
                className="w-full py-3 text-[12px] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{
                  fontFamily: display,
                  letterSpacing: "0.2em",
                  background: "#0d0d0d",
                  color: "#f5f3ee",
                }}
              >
                {isLoading
                  ? "Connecting…"
                  : isNotification
                  ? `Enable ${integration.name}`
                  : `Connect ${integration.name}`}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
