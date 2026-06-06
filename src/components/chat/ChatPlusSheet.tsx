import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Image as ImageIcon, Camera, FileUp, Globe, Atom, Wrench, Lightbulb, ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ChatPlusSheetProps {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhotos: () => void;
  onFiles: () => void;
  onVoiceNote?: () => void;
  onCall?: () => void;
  onPresets?: () => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
}

const sheetSpring = { type: "spring" as const, stiffness: 280, damping: 30 };
const slimeSpring = { type: "spring" as const, stiffness: 180, damping: 14, mass: 0.9 };

interface TileProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: string;
}

const Tile = ({ icon, label, onClick, accent }: TileProps) => (
  <motion.button
    whileTap={{ scale: 0.94 }}
    transition={sheetSpring}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl bg-secondary/70 hover:bg-secondary transition-colors"
  >
    <div className={accent || "text-foreground/85"}>{icon}</div>
    <span className="text-[12px] font-medium text-foreground/85">{label}</span>
  </motion.button>
);

interface RowProps {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
  onClick: () => void;
}

const Row = ({ icon, label, trailing, onClick }: RowProps) => (
  <motion.button
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/30 transition-colors"
  >
    <div className="text-foreground/85">{icon}</div>
    <span className="flex-1 text-left text-[15px] text-foreground/90">{label}</span>
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {trailing}
      <ChevronRight className="w-4 h-4" />
    </div>
  </motion.button>
);

export default function ChatPlusSheet({
  open,
  onClose,
  onCamera,
  onPhotos,
  onFiles,
  searchEnabled,
  onToggleSearch,
}: ChatPlusSheetProps) {
  const navigate = useNavigate();

  // Slime stretch — pull-up exaggerates scaleY, pull-down shrinks it
  const dragY = useMotionValue(0);
  // negative drag (up) → grow; positive drag (down) → snap-close
  const scaleY = useTransform(dragY, [-200, 0, 200], [1.18, 1, 0.96]);
  const scaleX = useTransform(dragY, [-200, 0, 200], [0.94, 1, 1.02]);
  const radius = useTransform(dragY, [-200, 0, 200], [40, 28, 22]);

  const go = (path: string) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-foreground/10 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={slimeSpring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.4 }}
            style={{
              y: dragY,
              scaleY,
              scaleX,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              transformOrigin: "bottom center",
            }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[56] liquid-glass-milk overflow-hidden pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-foreground/30" />
            </div>

            {/* Tile grid — Camera, Photos, Files */}
            <div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-4">
              <Tile icon={<Camera className="w-[22px] h-[22px]" />} label="Camera" onClick={() => { onCamera(); onClose(); }} />
              <Tile icon={<ImageIcon className="w-[22px] h-[22px]" />} label="Photos" onClick={() => { onPhotos(); onClose(); }} />
              <Tile icon={<FileUp className="w-[22px] h-[22px]" />} label="Files" onClick={() => { onFiles(); onClose(); }} />
            </div>

            {/* Rows */}
            <div className="mx-4 rounded-2xl bg-secondary/50 overflow-hidden divide-y divide-border/30">
              <button
                onClick={onToggleSearch}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/30 transition-colors"
              >
                <Globe className="w-[18px] h-[18px] text-foreground/85" />
                <span className="flex-1 text-left text-[15px] text-foreground/90">Web search</span>
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    searchEnabled ? "bg-primary" : "bg-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      searchEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
              <Row
                icon={<Atom className="w-[18px] h-[18px]" />}
                label="Model"
                trailing={<span className="text-[13px]">Lite</span>}
                onClick={() => go("/settings/model")}
              />
              <Row
                icon={<Wrench className="w-[18px] h-[18px]" />}
                label="Use tools"
                onClick={() => go("/settings/integrations")}
              />
              <Row
                icon={<Lightbulb className="w-[18px] h-[18px]" />}
                label="Skills"
                trailing={<span className="text-[13px]">13 enabled</span>}
                onClick={() => go("/settings/skills")}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
