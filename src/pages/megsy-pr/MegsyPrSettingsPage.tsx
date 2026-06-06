// @ts-nocheck — imported design from external repo; backend wiring deferred.
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Settings as SettingsIcon } from "lucide-react";

export default function MegsyPrSettingsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(`/build/${projectId}`)}
            className="p-2 -ms-2 rounded-lg hover:bg-foreground/5"
            aria-label="Back"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold flex-1">Project settings</h1>
        </div>
      </header>

      <main className="px-4 py-10 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
            <SettingsIcon className="w-7 h-7 opacity-70" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Project settings</h2>
          <p className="text-sm text-muted-foreground">Content for this page will be added in upcoming updates.</p>
        </div>
      </main>
    </div>
  );
}
