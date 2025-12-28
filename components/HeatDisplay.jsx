import React from "react";
import AnimatedFlame from "./AnimatedFlame.jsx";

export default function HeatDisplay({ heatText }) {
  let level = 1;
  let label = "文火";
  let colorClass = "text-yellow-400";

  if (/大火|猛火|High/.test(heatText)) {
    level = 3; label = heatText || "大火"; colorClass = "text-purple-400";
  } else if (/中火|Medium/.test(heatText)) {
    level = 2; label = heatText || "中火"; colorClass = "text-orange-400";
  } else if (/小火|文火|微火|Low/.test(heatText)) {
    level = 1; label = heatText || "小火"; colorClass = "text-yellow-400";
  }

  return (
    <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-xl min-w-[100px]">
      <AnimatedFlame level={level} />
      <span className={`text-sm md:text-base font-bold ${colorClass} tracking-wider mt-2 uppercase text-center`}>
        {label}
      </span>
    </div>
  );
}
