const PageLoader = () => {
  return (
    <div className="relative h-screen w-full bg-background flex items-center justify-center overflow-hidden">
      <div className="loader" />
      <style>{`
        .loader {
          display: block;
          width: 84px;
          height: 84px;
          position: relative;
        }
        .loader::before, .loader::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: hsl(var(--primary));
          transform: translate(-50%, -100%) scale(0);
          animation: push_401 2s infinite linear;
        }
        .loader::after {
          animation-delay: 1s;
        }
        @keyframes push_401 {
          0%, 50% {
            transform: translate(-50%, 0%) scale(1);
          }
          100% {
            transform: translate(-50%, -100%) scale(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
