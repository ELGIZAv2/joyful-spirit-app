interface DesktopSidebarProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  activeConversationId?: string | null;
}

const DesktopSidebar = (_props: DesktopSidebarProps) => null;

export default DesktopSidebar;
