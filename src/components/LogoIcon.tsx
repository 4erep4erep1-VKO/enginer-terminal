/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number | string;
}

export function LogoIcon({ className = 'w-6 h-6', size }: LogoIconProps) {
  const customStyle = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={customStyle}
      aria-label="Инженерный Терминал Логотип"
    >
      <defs>
        {/* Main Brand Gradient: Electric Cyan to Deep Blue */}
        <linearGradient id="terminalCyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Secondary Bright Accent Gradient */}
        <linearGradient id="terminalBrightGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        {/* Subtle Background Fill Gradient */}
        <linearGradient id="terminalHexFill" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
        </linearGradient>

        {/* Neon Glow Filter */}
        <filter id="terminalNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Cyber Hexagon Body */}
      <polygon
        points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14"
        fill="url(#terminalHexFill)"
        stroke="url(#terminalCyanBlue)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Hexagon Corner Micro-accents / Tech Nodes */}
      <circle cx="24" cy="4" r="1.5" fill="#22d3ee" />
      <circle cx="41.3" cy="14" r="1.5" fill="#38bdf8" />
      <circle cx="41.3" cy="34" r="1.5" fill="#3b82f6" />
      <circle cx="24" cy="44" r="1.5" fill="#3b82f6" />
      <circle cx="6.7" cy="34" r="1.5" fill="#38bdf8" />
      <circle cx="6.7" cy="14" r="1.5" fill="#22d3ee" />

      {/* Inner Concentric Tech Ring (Diagnostic Gauge / Stator) */}
      <circle
        cx="24"
        cy="24"
        r="11.5"
        stroke="url(#terminalCyanBlue)"
        strokeWidth="1.2"
        strokeDasharray="3 2"
        strokeOpacity="0.6"
      />

      {/* Stylized Diagonal Mechanic Wrench (Auto-Tech) */}
      <g filter="url(#terminalNeonGlow)">
        {/* Wrench Shaft */}
        <line
          x1="13.5"
          y1="34.5"
          x2="31"
          y2="17"
          stroke="url(#terminalBrightGlow)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Wrench Lower Ring / Eye End */}
        <circle
          cx="12"
          cy="36"
          r="3.2"
          stroke="url(#terminalBrightGlow)"
          strokeWidth="2"
          fill="#0a0d14"
        />
        <circle cx="12" cy="36" r="1.2" fill="#22d3ee" />

        {/* Wrench Upper Open Jaw */}
        <path
          d="M28.5 13.5 L34 8 C36.2 10.2 36.8 13.5 35.5 16 L31.5 16.5 L30.5 20.5 C28 21.8 24.7 21.2 22.5 19 L28 13.5 Z"
          fill="url(#terminalBrightGlow)"
          fillOpacity="0.85"
        />
      </g>

      {/* Electronic Pulse / OBD-II Telemetry Circuit Wave (Diagnostic Pulse) */}
      <path
        d="M8.5 24 L16.5 24 L19.5 18 L23 30 L26.5 20 L29 25 L31.5 24 L39.5 24"
        stroke="#22d3ee"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#terminalNeonGlow)"
      />

      {/* Diagnostic Pulse Terminal Nodes */}
      <circle cx="8.5" cy="24" r="1.3" fill="#06b6d4" />
      <circle cx="39.5" cy="24" r="1.3" fill="#3b82f6" />

      {/* Central High-Intensity Neon Spark Core */}
      <circle cx="23" cy="30" r="1.2" fill="#ffffff" />
      <circle cx="19.5" cy="18" r="1" fill="#ffffff" />
    </svg>
  );
}
