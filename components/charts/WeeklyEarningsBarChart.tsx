"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface MonthlyData {
  month: string;
  amount: number;
}

export default function WeeklyEarningsBarChart({ data }: { data: MonthlyData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">No data available yet</p>
        </div>
      </div>
    );
  }

  // Deduplicate and aggregate by month
  const formattedData = data.reduce<MonthlyData[]>((acc, item) => {
    const existing = acc.find((d) => d.month === item.month);
    if (existing) {
      existing.amount += item.amount;
    } else {
      acc.push({ month: item.month, amount: item.amount });
    }
    return acc;
  }, []);

  const chartData = formattedData.map((d) => {
    const [year, month] = d.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      ...d,
      monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-bold" style={{ color: "#7c3aed" }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20">
          <BarChart3 className="h-4 w-4" style={{ color: "#7c3aed" }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Monthly Fuel Spend</h3>
          <p className="text-[10px] text-muted-foreground">Last 6 months trend</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="violetBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11, fill: "#A0A0B0" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#A0A0B0" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.05)" }} />
            <Bar
              dataKey="amount"
              fill="url(#violetBarGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
