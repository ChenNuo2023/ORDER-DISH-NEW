import React from "react";

export default function AnimatedFlame({ level }) {
  const configs = {
    low: {
      scale: 0.9,
      gradientStops: [
        { offset: "0%", color: "#FCD34D" },
        { offset: "100%", color: "#F59E0B" }
      ],
      coreColor: "#FFFBEB",
      swayValues: "-2; 2; -2",
      swayDur: "3s",
      morphDur: "2s",
      glow: "drop-shadow(0 0 5px rgba(252, 211, 77, 0.5))"
    },
    medium: {
      scale: 1.2,
      gradientStops: [
        { offset: "0%", color: "#F97316" },
        { offset: "100%", color: "#DC2626" }
      ],
      coreColor: "#FEF3C7",
      swayValues: "-3; 3; -3",
      swayDur: "2s",
      morphDur: "1.5s",
      glow: "drop-shadow(0 0 10px rgba(249, 115, 22, 0.6))"
    },
    high: {
      scale: 1.5,
      gradientStops: [
        { offset: "0%", color: "#EF4444" },
        { offset: "100%", color: "#7C3AED" }
      ],
      coreColor: "#E0F2FE",
      swayValues: "-1; 1; -1; 1; -1",
      swayDur: "0.2s",
      morphDur: "0.8s",
      glow: "drop-shadow(0 0 15px rgba(124, 58, 237, 0.7))"
    }
  };

  const c = level === 3 ? configs.high : level === 2 ? configs.medium : configs.low;

  return (
    <div style={{ transform: `scale(${c.scale})`, filter: c.glow, transition: "transform 0.5s ease" }}>
      <svg width="60" height="75" viewBox="0 0 200 200" overflow="visible">
        <defs>
          <linearGradient id={`fireGrad-${level}`} x1="0%" y1="100%" x2="0%" y2="0%">
            {c.gradientStops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <g style={{ transformOrigin: "100px 180px" }}>
          <animateTransform attributeName="transform" type="rotate" values={c.swayValues} dur={c.swayDur} repeatCount="indefinite" />
          <path
            fill={`url(#fireGrad-${level})`}
            d="M100,180 Q60,180 50,110 Q40,60 100,20 Q160,60 150,110 Q140,180 100,180 Z"
          >
            <animate
              attributeName="d"
              values="M100,180 Q60,180 50,110 Q40,60 100,20 Q160,60 150,110 Q140,180 100,180 Z;
                      M100,180 Q55,180 45,115 Q35,65 95,15 Q165,65 155,115 Q145,180 100,180 Z;
                      M100,180 Q65,180 55,110 Q45,60 105,25 Q155,60 145,110 Q135,180 100,180 Z;
                      M100,180 Q60,180 50,110 Q40,60 100,20 Q160,60 150,110 Q140,180 100,180 Z"
              dur={c.morphDur}
              repeatCount="indefinite"
            />
          </path>
          <path
            fill={c.coreColor}
            fillOpacity="0.7"
            d="M100,170 Q80,170 75,130 Q70,90 100,70 Q130,90 125,130 Q120,170 100,170 Z"
          >
            <animate
              attributeName="d"
              values="M100,170 Q80,170 75,130 Q70,90 100,70 Q130,90 125,130 Q120,170 100,170 Z;
                      M100,170 Q78,170 72,132 Q68,92 100,72 Q132,92 128,132 Q122,170 100,170 Z;
                      M100,170 Q82,170 78,130 Q72,90 100,68 Q128,90 122,130 Q118,170 100,170 Z;
                      M100,170 Q80,170 75,130 Q70,90 100,70 Q130,90 125,130 Q120,170 100,170 Z"
              dur={c.morphDur}
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>
  );
}
