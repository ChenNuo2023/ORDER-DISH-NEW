import React from "react";
import { AlertTriangle, Award, X } from "lucide-react";
import { LEVELS } from "../config/levels.js";

export default function LevelModal({ totalXP, onClose, onReset }) {
  let accumulatedXP = 0;
  const currentLevelIdx = LEVELS.findIndex((l) => {
    const isCurrent = l.max === Infinity || totalXP < accumulatedXP + l.max;
    if (!isCurrent) accumulatedXP += l.max;
    return isCurrent;
  });

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-stone-700 flex justify-between items-center bg-stone-950">
          <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <Award size={24} /> 厨道境界
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full text-stone-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <div className="text-center py-4">
            <div className="text-stone-400 text-sm mb-1">当前总经验</div>
            <div className="text-4xl font-black text-white font-mono">{totalXP}</div>
          </div>

          <div className="space-y-3">
            {LEVELS.map((level, idx) => {
              const isPast = idx < currentLevelIdx;
              const isCurrent = idx === currentLevelIdx;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    isCurrent ? "bg-amber-900/30 border-amber-500/50" : "bg-stone-800/50 border-stone-700/50"
                  } ${isPast ? "opacity-50" : ""}`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-bold ${isCurrent ? "text-amber-400" : "text-stone-300"}`}>{level.name}</span>
                    <span className="text-xs font-mono text-stone-500">{level.max === Infinity ? "∞" : level.max} XP</span>
                  </div>
                  <p className="text-xs text-stone-500">{level.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-stone-700 bg-stone-950">
          <button
            onClick={() => {
              if (window.confirm("确定要自废武功，重置所有修仙等级和经验吗？此操作不可逆！")) {
                onReset?.();
                onClose?.();
              }
            }}
            className="w-full py-3 rounded-xl border border-red-900/50 text-red-500/70 hover:bg-red-900/20 hover:text-red-400 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          >
            <AlertTriangle size={16} /> 重废武功 (重置等级)
          </button>
        </div>
      </div>
    </div>
  );
}
