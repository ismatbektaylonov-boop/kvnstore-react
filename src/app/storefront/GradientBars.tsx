import type { CSSProperties } from "react";
import "./GradientBars.css";

const bars = Array.from({ length: 12 }, (_, index) => (
  <span key={index} style={{ "--bar-index": index } as CSSProperties} />
));

export function GradientBars() {
  return (
    <div className="kv-gradient-bars" aria-hidden="true">
      {bars}
    </div>
  );
}
