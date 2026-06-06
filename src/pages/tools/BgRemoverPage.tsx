import { useState } from "react";
import { useToolSeo } from "@/hooks/useToolSeo";
import { toast } from "sonner";
import { removeBackground } from "@imgly/background-removal";
import bgRemoverHero from "@/assets/bg-remover-hero.webp";
import MediaToolShell, { type ToolStage } from "@/components/media/MediaToolShell";

const BgRemoverPage = () => {
  useToolSeo("bg-remover");
  const [stage, setStage] = useState<ToolStage>("landing");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setSourceImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setStage("processing");
    try {
      const blob = await removeBackground(file);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStage("result");
      toast.success("Background removed");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to remove background");
      setStage("landing");
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setSourceImage(null);
    setResultUrl(null);
    setStage("landing");
  };

  return (
    <MediaToolShell
      toolId="bg-remover"
      title="Background Remover"
      headline="Remove"
      accent="background."
      description="Cut out any subject in one tap with razor-sharp edges."
      heroImage={bgRemoverHero}
      cost={0}
      costLabel="Free"
      stage={stage}
      sourceImage={sourceImage}
      resultUrl={resultUrl}
      processingLabel="Removing background…"
      onFileSelected={handleFile}
      onReset={reset}
    />
  );
};

export default BgRemoverPage;
