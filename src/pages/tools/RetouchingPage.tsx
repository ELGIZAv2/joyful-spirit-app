import { useState } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import retouchingHero from "@/assets/retouching-hero.webp";
import MediaToolShell, { type ToolStage } from "@/components/media/MediaToolShell";

const RetouchingPage = () => {
  useToolSeo("retouching");
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
      await retouch(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const retouch = async (dataUrl: string) => {
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "retouching", image: dataUrl },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Retouched!");
    } catch (e: any) {
      toast.error(e.message || "Retouching failed");
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
      toolId="retouching"
      title="Photo Retouching"
      headline="Flawless"
      accent="in seconds."
      description="Smooth skin, remove blemishes, and polish portraits naturally."
      heroImage={retouchingHero}
      cost={1}
      stage={stage}
      sourceImage={sourceImage}
      resultUrl={resultUrl}
      processingLabel="Retouching your portrait…"
      onFileSelected={handleFile}
      onReset={reset}
    />
  );
};

export default RetouchingPage;