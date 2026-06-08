"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CollectionRateDonutChartProps {
  collected: number;
  pending: number;
}

interface TooltipData {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipData[];
}

const CustomTooltip = ({
  active,
  payload,
}: CustomTooltipProps) => {
  if (active && payload?.length) {
    const COLORS = {
      Collected: "#06b6d4",
      Pending: "#f59e0b",
      Empty: "rgba(255,255,255,0.06)",
    };
    return (
      <div className="rounded-xl border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <p className="text-xs font-medium text-muted-foreground">{payload[0].name}</p>
        <p className="text-lg font-bold" style={{ color: COLORS[payload[0].name as keyof typeof COLORS] || "#fff" }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function CollectionRateDonutChart({
  collected,
  pending,
}: CollectionRateDonutChartProps) {
  const total = collected + pending;
  const rate = total > 0 ? Math.round((collected / total) * 100) : 0;

  const donutData = [
    { name: "Collected", value: collected > 0 ? collected : 0 },
    { name: "Pending", value: pending > 0 ? pending : 0 },
  ];

  // If both are zero, show a placeholder ring
  const displayData = total === 0
    ? [{ name: "Empty", value: 1 }]
    : donutData.filter((d) => d.value > 0);

  const COLORS = {
    Collected: "#06b6d4",
    Pending: "#f59e0b",
    Empty: "rgba(255,255,255,0.06)",
  };

  const renderCenterLabel = () => {
    return (
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
        <tspan
          x="50%"
          dy="-0.3em"
          fontSize="28"
          fontWeight="300"
          fill="#7c3aed"
        >
          {rate}%
        </tspan>
        <tspan
          x="50%"
          dy="1.4em"
          fontSize="10"
          fill="#A0A0B0"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          COLLECTED
        </tspan>
      </text>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="5" fill="#06b6d4" opacity="0.3" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Collection Rate</h3>
          <p className="text-[10px] text-muted-foreground">Collected vs Pending</p>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              labelLine={false}
              label={renderCenterLabel}
              strokeWidth={0}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS] || "#7c3aed"}
                />
              ))}
            </Pie>
            {total > 0 && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#06b6d4]" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Collected
          </span>
          <span className="text-[11px] font-semibold text-[#06b6d4]">
            {formatCurrency(collected)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Pending
          </span>
          <span className="text-[11px] font-semibold text-[#f59e0b]">
            {formatCurrency(pending)}
          </span>
        </div>
      </div>
    </div>
  );
}
