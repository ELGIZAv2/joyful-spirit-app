const pegtopPath =
  "M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z";

const PegtopSVG = ({ id }: { id: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className="w-full h-full"
  >
    <defs>
      <filter id={`shine-${id}`}>
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <mask id={`mask-${id}`}>
        <path d={pegtopPath} fill="white" />
      </mask>
      <radialGradient
        id={`g1-${id}`}
        cx="50" cy="66" fx="50" fy="66" r="30"
        gradientTransform="translate(0 35) scale(1 0.5)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="black" stopOpacity="0.3" />
        <stop offset="50%" stopColor="black" stopOpacity="0.1" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id={`g2-${id}`}
        cx="55" cy="20" fx="55" fy="20" r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`g3-${id}`} cx="85" cy="50" fx="85" fy="50" r="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient
        id={`g4-${id}`}
        cx="50" cy="58" fx="50" fy="58" r="60"
        gradientTransform="translate(0 47) scale(1 0.2)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`g5-${id}`} x1="50" y1="90" x2="50" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="black" stopOpacity="0.2" />
        <stop offset="40%" stopColor="black" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g>
      <path d={pegtopPath} fill="currentColor" />
      <path d={pegtopPath} fill={`url(#g1-${id})`} />
      <path d={pegtopPath} fill="none" stroke="white" opacity="0.3" strokeWidth="3" filter={`url(#shine-${id})`} mask={`url(#mask-${id})`} />
      <path d={pegtopPath} fill={`url(#g2-${id})`} />
      <path d={pegtopPath} fill={`url(#g3-${id})`} />
      <path d={pegtopPath} fill={`url(#g4-${id})`} />
      <path d={pegtopPath} fill={`url(#g5-${id})`} />
    </g>
  </svg>
);

interface StudioLoaderProps {
  progress: number;
  message?: string;
}

const StudioLoader = ({ progress, message }: StudioLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="pegtop-loader" style={{ width: 80, height: 80 }}>
        <div id="pegtopone"><PegtopSVG id="one" /></div>
        <div id="pegtoptwo"><PegtopSVG id="two" /></div>
        <div id="pegtopthree"><PegtopSVG id="three" /></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        {message || "Your content is on its way..."} ({Math.round(progress)}%)
      </p>
    </div>
  );
};

export default StudioLoader;
