import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import { type ModelDetail, type ModelType, FREE_MODEL_IDS, HIDDEN_DUPLICATE_IDS } from "@/lib/modelDetails";
import { useDynamicModels } from "@/hooks/useModels";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan } from "@/hooks/useUserPlan";
import { isPaidUser } from "@/lib/subscriptionGating";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { ModelOption } from "./ModelSelector";

type PickerMode = "images" | "videos" | "chat";

interface ModelPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (model: ModelOption) => void;
  mode: PickerMode;
  selectedModelId: string;
}

const MODE_TYPES: Record<PickerMode, {models: ModelType[];tools: ModelType[];modelLabel: string;toolLabel: string;}> = {
  images: { models: ["image"], tools: ["image-tool"], modelLabel: "Models", toolLabel: "Tools" },
  videos: { models: ["video"], tools: [], modelLabel: "Models", toolLabel: "" },
  chat: { models: ["chat"], tools: [], modelLabel: "Models", toolLabel: "" }
};

interface ModelMediaRecord {
  model_id: string;
  media_url: string;
  media_type: "image" | "video";
}

const ModelPickerSheet = ({ open, onClose, onSelect, mode, selectedModelId }: ModelPickerSheetProps) => {
  const [tab, setTab] = useState<"models" | "tools">("models");
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);
  const [mediaMap, setMediaMap] = useState<Record<string, ModelMediaRecord>>({});
  const { plan } = useUserPlan();
  const navigate = useNavigate();
  const paid = isPaidUser(plan);

  const types = MODE_TYPES[mode];
  const hasTools = types.tools.length > 0;

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase.from("model_media").select("model_id, media_url, media_type");
      if (data) {
        const map: Record<string, ModelMediaRecord> = {};
        data.forEach((r: ModelMediaRecord) => { map[r.model_id] = r; });
        setMediaMap(map);
      }
    };
    load();
  }, [open]);

  const { models: dynamicModels } = useDynamicModels();
  const allModels = useMemo(() => {
    const typeList = tab === "models" ? types.models : types.tools;
    return dynamicModels.filter(
      (m) => typeList.includes(m.type) && !HIDDEN_DUPLICATE_IDS.includes(m.id)
    );
  }, [tab, types, dynamicModels]);

  const handleSelect = (model: ModelDetail) => {
    const isFree = FREE_MODEL_IDS.includes(model.id) || model.credits === 0;
    if (!isFree && !paid && (mode === "images" || mode === "videos")) {
      toast.error("Upgrade to Starter or higher to use this model.");
      onClose();
      navigate("/pricing");
      return;
    }

    let cust: Record<string, any> | undefined;
    if (model.customization) {
      cust = typeof model.customization === 'string' ? JSON.parse(model.customization as string) : model.customization;
    }
    onSelect({
      id: model.id,
      name: model.name,
      credits: model.credits.toString(),
      requiresImage: model.requiresImage,
      category: model.type.includes("tool") || model.type.includes("i2v") || model.type.includes("avatar") ? "tool" : "model",
      customization: cust,
      iconUrl: model.iconUrl,
      badges: model.badges,
    });
    onClose();
    setDetailModel(null);
  };

  if (!open) return null;

  const renderModelCard = (model: ModelDetail, idx: number) => {
    const isSelected = selectedModelId === model.id;
    const logo = model.iconUrl;
    const isFree = model.credits === 0;

    return (
      <motion.button
        key={model.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.02 }}
        onClick={() => handleSelect(model)}
        className={`w-full text-left transition-all rounded-xl p-3 mb-1.5 flex items-center gap-3 ${
          isSelected ? "bg-accent/60" : "hover:bg-accent/30"
        }`}
      >
        {logo ? (
          <img src={logo} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-accent/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{model.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold ${isFree ? "text-emerald-400" : "text-muted-foreground"}`}>
            {isFree ? "Free" : `${model.credits} MC`}
          </span>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </motion.button>
    );
  };

  if (mode === "videos" || mode === "images") {
    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-lg font-bold text-foreground">
                  Choose <span className="text-primary">Model</span>
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center hover:bg-accent/60 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {allModels.map((model, i) => renderModelCard(model, i))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  // Chat mode
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="shrink-0 bg-background sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
              <button
                onClick={() => { if (detailModel) setDetailModel(null); else onClose(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-base font-bold text-foreground">Models</h1>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {hasTools && !detailModel && (
              <div className="max-w-2xl mx-auto px-4 pb-2">
                <div className="flex bg-secondary rounded-full p-1">
                  {["Image", "Tools"].map((label, i) => {
                    const isActive = (i === 0 && tab === "models") || (i === 1 && tab === "tools");
                    return (
                      <button
                        key={label}
                        onClick={() => setTab(i === 0 ? "models" : "tools")}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                          isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {detailModel ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {mediaMap[detailModel.id] && (
                  <div className="rounded-2xl overflow-hidden aspect-video bg-secondary">
                    {mediaMap[detailModel.id].media_type === "video" ? (
                      <video src={mediaMap[detailModel.id].media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={mediaMap[detailModel.id].media_url} alt={detailModel.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{detailModel.name}</h2>
                  {detailModel.credits > 0 ? (
                    <span className="text-lg font-bold text-primary">{detailModel.credits} MC</span>
                  ) : (
                    <span className="text-emerald-400 text-sm font-semibold">Free</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{detailModel.longDescription}</p>
                <button
                  onClick={() => handleSelect(detailModel)}
                  className={`w-full py-3.5 rounded-2xl font-medium text-sm transition-colors ${
                    selectedModelId === detailModel.id
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {selectedModelId === detailModel.id ? "Currently Selected" : `Select ${detailModel.name}`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4">
                {allModels.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">No models found.</p>
                  </div>
                ) : (
                  allModels.map((model, i) => renderModelCard(model, i))
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModelPickerSheet;
