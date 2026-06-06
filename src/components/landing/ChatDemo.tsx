import LazyVideo from "@/components/landing/LazyVideo";

const ChatDemo = () => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <LazyVideo src="/showcase/chat-demo.mp4" className="h-full w-full" />
    </div>
  );
};

export default ChatDemo;
