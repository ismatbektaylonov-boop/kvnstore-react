import type { CSSProperties } from "react";
import "./RisingLines.css";

const linePositions = [
  2, 6, 10, 13, 17, 22, 25, 29, 32, 37, 40, 45, 48, 51, 55, 60, 63, 67, 71, 74,
  78, 83, 87, 91, 95, 98,
];

const lines = linePositions.map((position, index) => (
  <span
    key={position}
    style={
      {
        "--line-position": `${position}%`,
        "--line-length": `${7 + ((index * 7) % 12)}%`,
        "--line-duration": `${7 + (index % 6)}s`,
        "--line-delay": `${-(index % 11)}s`,
        "--line-rest": `${-35 - ((index * 69) % 240)}%`,
      } as CSSProperties
    }
  />
));

export function RisingLines() {
  return (
    <div className="kv-rising-lines" aria-hidden="true">
      {lines}
    </div>
  );
}
