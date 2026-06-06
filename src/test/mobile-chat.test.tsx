import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileChatHeader from "@/components/chat/mobile/MobileChatHeader";
import MobileComposer from "@/components/chat/mobile/MobileComposer";
import MobileModeBar from "@/components/chat/mobile/MobileModeBar";

const baseHeaderProps = {
  title: "My chat",
  hasConversation: true,
  isPinned: false,
  onOpenSidebar: vi.fn(),
  onNewChat: vi.fn(),
  onShare: vi.fn(),
  onInvite: vi.fn(),
  onRename: vi.fn(),
  onTogglePin: vi.fn(),
  onDelete: vi.fn(),
};

describe("MobileChatHeader", () => {
  it("renders sidebar button", () => {
    render(<MobileChatHeader {...baseHeaderProps} />);
    expect(screen.getByTestId("mobile-open-sidebar")).toBeInTheDocument();
  });

  it("calls onOpenSidebar when menu button clicked", () => {
    const fn = vi.fn();
    render(<MobileChatHeader {...baseHeaderProps} onOpenSidebar={fn} />);
    fireEvent.click(screen.getByTestId("mobile-open-sidebar"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("hides more-menu when no conversation, shows rightSlot", () => {
    render(
      <MobileChatHeader
        {...baseHeaderProps}
        hasConversation={false}
        rightSlot={<button data-testid="upgrade">Pro</button>}
      />
    );
    expect(screen.queryByTestId("mobile-more-menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("upgrade")).toBeInTheDocument();
  });

  it("renders more-menu trigger when there is a conversation", () => {
    render(<MobileChatHeader {...baseHeaderProps} />);
    expect(screen.getByTestId("mobile-more-menu")).toBeInTheDocument();
  });
});

describe("MobileComposer", () => {
  it("renders input, plus and disabled send by default", () => {
    render(<MobileComposer value="" onChange={() => {}} onSend={() => {}} />);
    expect(screen.getByTestId("mobile-composer-input")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-composer-plus")).toBeInTheDocument();
    // No text → mic if onMic, otherwise send disabled
    expect(screen.getByTestId("mobile-composer-send")).toBeDisabled();
  });

  it("shows mic when onMic provided and no text", () => {
    render(<MobileComposer value="" onChange={() => {}} onSend={() => {}} onMic={() => {}} />);
    expect(screen.getByTestId("mobile-composer-mic")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-composer-send")).not.toBeInTheDocument();
  });

  it("enables send when value present and fires onSend", () => {
    const onSend = vi.fn();
    render(<MobileComposer value="hi" onChange={() => {}} onSend={onSend} />);
    const send = screen.getByTestId("mobile-composer-send");
    expect(send).not.toBeDisabled();
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<MobileComposer value="" onChange={onChange} onSend={() => {}} />);
    fireEvent.change(screen.getByTestId("mobile-composer-input"), { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("does NOT submit on Enter (mobile inserts newline)", () => {
    const onSend = vi.fn();
    render(<MobileComposer value="hi" onChange={() => {}} onSend={onSend} />);
    fireEvent.keyDown(screen.getByTestId("mobile-composer-input"), { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does NOT submit on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<MobileComposer value="hi" onChange={() => {}} onSend={onSend} />);
    fireEvent.keyDown(screen.getByTestId("mobile-composer-input"), { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("shows stop button while loading and fires onCancel", () => {
    const onCancel = vi.fn();
    render(
      <MobileComposer value="hi" onChange={() => {}} onSend={() => {}} onCancel={onCancel} isLoading />
    );
    const stop = screen.getByTestId("mobile-composer-stop");
    fireEvent.click(stop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("plus button fires onPlus", () => {
    const onPlus = vi.fn();
    render(<MobileComposer value="" onChange={() => {}} onSend={() => {}} onPlus={onPlus} />);
    fireEvent.click(screen.getByTestId("mobile-composer-plus"));
    expect(onPlus).toHaveBeenCalledOnce();
  });
});

describe("MobileModeBar", () => {
  it("renders all four mode chips", () => {
    render(<MobileModeBar mode="normal" onChange={() => {}} />);
    expect(screen.getByTestId("mobile-mode-learning")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-mode-shopping")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-mode-deep-research")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-mode-slides")).toBeInTheDocument();
  });

  it("activates a mode on click", () => {
    const onChange = vi.fn();
    render(<MobileModeBar mode="normal" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("mobile-mode-learning"));
    expect(onChange).toHaveBeenCalledWith("learning");
  });

  it("toggles back to normal when active mode clicked again", () => {
    const onChange = vi.fn();
    render(<MobileModeBar mode="learning" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("mobile-mode-learning"));
    expect(onChange).toHaveBeenCalledWith("normal");
  });

  it("marks the active chip with data-active=true", () => {
    render(<MobileModeBar mode="slides" onChange={() => {}} />);
    expect(screen.getByTestId("mobile-mode-slides")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("mobile-mode-learning")).toHaveAttribute("data-active", "false");
  });
});
