import { useState } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import perspectiveHero from "@/assets/perspective-hero.webp";
import MediaToolShell, { type ToolStage } from "@/components/media/MediaToolShell";

const PerspectiveCorrectionPage = () => {
  useToolSeo("perspective-correction");
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<ToolStage>("landing");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSourceImage(dataUrl);
      await correct(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const correct = async (dataUrl: string) => {
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "perspective-correction", image: dataUrl },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Perspective corrected!");
    } catch (e: any) {
      toast.error(e.message || "Correction failed");
      setStage("landing");
    }
  };

  const reset = () => {
    setSourceImage(null);
    setResultUrl(null);
    setStage("landing");
  };

  return (
    <MediaToolShell
      toolId="perspective-correction"
      title="Perspective Correction"
      headline="Straighten"
      accent="every line."
      description="Auto-fix tilt, keystone & lens distortion in one tap."
      heroImage={perspectiveHero}
      cost={1}
      stage={stage}
      sourceImage={sourceImage}
      resultUrl={resultUrl}
      processingLabel="Aligning perspective…"
      onFileSelected={handleFile}
      onReset={reset}
    />
  );
};

export default PerspectiveCorrectionPage;