import { memo } from "react";
import MegsyStar from "@/components/files/MegsyStar";

interface ThinkingLoaderProps {
  searchStatus?: string;
}

const ThinkingLoader = ({ searchStatus }: ThinkingLoaderProps) => {
  return (
    <div className="flex items-center gap-2 py-1">
      <MegsyStar size={22} />
      {searchStatus && (
        <span className="text-[12px] text-muted-foreground">{searchStatus}</span>
      )}
    </div>
  );
};

export default memo(ThinkingLoader);
