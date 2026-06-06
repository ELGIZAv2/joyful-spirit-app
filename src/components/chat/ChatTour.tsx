import { useEffect, useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";

const STORAGE_KEY = "megsy_chat_tour_v1";

interface ChatTourProps {
  /** Force tour to run regardless of localStorage gate. */
  force?: boolean;
}

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Megsy 👋",
    content:
      "A quick 30-second tour to show you everything you can do — chat, design, learn, code & more.",
  },
  {
    target: '[data-tour="composer"]',
    placement: "top",
    title: "Ask anything",
    content:
      "Type any question or idea here. Megsy understands natural language — no commands needed.",
  },
  {
    target: "[data-plus-trigger]",
    placement: "top",
    title: "Your toolkit",
    content:
      "Tap + to open Slides, Docs, Images, Video, Code, Deep Research and more — all in one place.",
  },
  {
    target: '[data-tour="composer"]',
    placement: "top",
    title: "Mention agents with @",
    content:
      "Type @ to call a specific agent (Designer, Coder, Researcher…) and # to pick a model.",
  },
  {
    target: "body",
    placement: "center",
    title: "You're all set ✨",
    content: "Send your first message and let's build something together.",
  },
];

const ChatTour = ({ force = false }: ChatTourProps) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (force) {
      setRun(true);
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setRun(true), 700);
    return () => clearTimeout(t);
  }, [force]);

  const handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--popover))",
        textColor: "hsl(var(--popover-foreground))",
        arrowColor: "hsl(var(--popover))",
        overlayColor: "hsl(var(--background) / 0.7)",
        zIndex: 10000,
        showProgress: true,
        skipBeacon: true,
        overlayClickAction: false,
        buttons: ["back", "skip", "primary"],
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Got it",
        next: "Next",
        skip: "Skip tour",
      }}
      styles={{
        tooltip: {
          borderRadius: 18,
          padding: 18,
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 6,
        },
        buttonPrimary: {
          borderRadius: 999,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
      }}
    />
  );
};

export default ChatTour;
