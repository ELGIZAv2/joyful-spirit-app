import { useState } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import colorizerHero from "@/assets/colorizer-hero.webp";
import MediaToolShell, { type ToolStage } from "@/components/media/MediaToolShell";

const ColorizerPage = () => {
  useToolSeo("colorizer");
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
      await colorize(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const colorize = async (dataUrl: string) => {
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "colorizer", image: dataUrl },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Colorized!");
    } catch (e: any) {
      toast.error(e.message || "Colorization failed");
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
      toolId="colorizer"
      title="Image Colorizer"
      headline="Bring it"
      accent="to life."
      description="Restore color to any black & white photo in seconds."
      heroImage={colorizerHero}
      cost={1}
      stage={stage}
      sourceImage={sourceImage}
      resultUrl={resultUrl}
      processingLabel="Bringing colors back…"
      onFileSelected={handleFile}
      onReset={reset}
    />
  );
};

export default ColorizerPage;
