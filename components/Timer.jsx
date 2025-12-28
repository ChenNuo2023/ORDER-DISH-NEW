import React, { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, RotateCcw } from "lucide-react";

export default function Timer({ initialSeconds, onComplete, colorClass }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initialSeconds]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      clearInterval(intervalRef.current);
      onComplete?.();
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, seconds, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setSeconds(initialSeconds); };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = initialSeconds ? ((initialSeconds - seconds) / initialSeconds) * 100 : 0;
  const progressColor = colorClass.replace("text-", "bg-");

  return (
    <div className="mt-8 landscape:mt-0 w-full max-w-sm mx-auto">
      <div className="bg-black/30 rounded-3xl p-6 border border-white/10 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full">
          <div className={`h-full transition-all duration-1000 ${progressColor}`} style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isActive ? `${colorClass} bg-white/10 animate-pulse` : "text-gray-400 bg-white/5"}`}>
              <Clock size={28} />
            </div>
            <span className="text-4xl md:text-5xl font-mono font-bold text-white tracking-widest shadow-black drop-shadow-lg">
              {formatTime(seconds)}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleTimer}
              className={`p-4 rounded-full transition-colors text-white shadow-lg ${
                isActive ? "bg-yellow-600 hover:bg-yellow-500" : `${progressColor} hover:opacity-80`
              }`}
            >
              {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button onClick={resetTimer} className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-gray-300">
              <RotateCcw size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
