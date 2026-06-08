"use client";

import React from "react";
import { useId } from "react";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showGradient?: boolean;
}

export default function SparklineChart({
  data,
  color = "#7c3aed",
  height = 32,
  showGradient = true,
}: SparklineChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const gradientId = useId();
  const width = 100;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="sparkline-container"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {showGradient && (
        <polygon
          points={`${padding},${height} ${points} ${width - padding},${height}`}
          fill={`url(#${gradientId})`}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-fade-in"
      />
    </svg>
  );
}
