import React from "react";

interface BakBakLogoProps {
  className?: string;
  size?: number;
  theme?: "light" | "dark";
}

export function BakBakLogo({ className = "w-10 h-10", size = 40, theme = "dark" }: BakBakLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="bakbak-custom-vector-logo"
    >
      <defs>
        <linearGradient id="bakbak-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          {/* Stunning violet-purple to cyan gradient exactly matching user branding image */}
          <stop offset="0%" stopColor="#d946ef" /> {/* Magenta / Fuchsia */}
          <stop offset="40%" stopColor="#a855f7" /> {/* Purple */}
          <stop offset="75%" stopColor="#4f46e5" /> {/* Indigo */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan / Teal */}
        </linearGradient>
      </defs>

      {/* Stylized lowercase speech bubble 'b' shape */}
      <path
        d="M26 18C26 15.5 28 13.5 30.5 13.5C33 13.5 35 15.5 35 18V43.5C40.5 38.5 48.5 37.5 55.5 39.5C69 42.5 77.5 55 75 68C72.5 81 60 89 47 87C40.5 86 35 82 32 77L21.5 82C19.5 83 17.5 81.2 18.2 79.2L22.5 70C21 65.5 20.5 60.5 21 55.5C22 45.5 26 38.5 26 33.5V18Z"
        fill="url(#bakbak-logo-grad)"
      />

      {/* Smiley face centered in the 'b' speech bubble loop (around x=50, y=63) */}
      {/* Eyes */}
      <circle cx="45" cy="58" r="3.5" fill={theme === "light" ? "#ffffff" : "#ffffff"} />
      <circle cx="58" cy="58" r="3.5" fill={theme === "light" ? "#ffffff" : "#ffffff"} />

      {/* Happy curved smile */}
      <path
        d="M45 67C45 67 48.2 71.5 51.5 71.5C54.8 71.5 58 67 58 67"
        stroke={theme === "light" ? "#ffffff" : "#ffffff"}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
