import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 64;
const MAX_PULL = 96;

export default function PullToRefresh({ onRefresh, refreshing, className, children }) {
  const [distance, setDistance] = useState(0);
  const startY = useRef(null);

  const start = (event) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = event.touches[0].clientY;
  };

  const move = (event) => {
    if (startY.current === null) return;
    const delta = event.touches[0].clientY - startY.current;
    setDistance(delta > 0 ? Math.min(MAX_PULL, delta) : 0);
  };

  const end = () => {
    if (startY.current === null) return;
    startY.current = null;
    const shouldRefresh = distance >= THRESHOLD;
    setDistance(0);
    if (shouldRefresh) onRefresh();
  };

  const armed = distance >= THRESHOLD;
  const height = refreshing ? 44 : distance;

  return (
    <div className={className} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
      <div className="flex items-center justify-center overflow-hidden" style={{ height }}>
        {(refreshing || distance > 0) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2
              className={refreshing ? "h-4 w-4 animate-spin text-signal" : "h-4 w-4"}
              style={refreshing ? undefined : { transform: `rotate(${distance * 3}deg)` }}
            />
            <span>{refreshing ? "Refreshing reports…" : armed ? "Release to refresh" : "Pull to refresh"}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}