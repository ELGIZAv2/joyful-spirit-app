import DesktopSidebar from "@/components/layout/DesktopSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const AppLayout = ({ children, onSelectConversation, onNewChat, activeConversationId }: AppLayoutProps) => {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background">
      <DesktopSidebar
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        activeConversationId={activeConversationId}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;

