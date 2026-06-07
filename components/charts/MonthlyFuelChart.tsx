"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface MonthlyData {
  month: string;
  amount: number;
}

export default function MonthlyFuelChart({ data }: { data: MonthlyData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">No data available yet</p>
        </div>
      </div>
    );
  }

  const formattedData = data.reduce<MonthlyData[]>((acc, item) => {
    const existing = acc.find((d) => d.month === item.month);
    if (existing) {
      existing.amount += item.amount;
    } else {
      acc.push({ month: item.month, amount: item.amount });
    }
    return acc;
  }, []);

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
          <p className="text-xs font-medium text-muted-foreground">
            {label ? new Date(label + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
          </p>
          <p className="text-lg font-bold gradient-text">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const months = formattedData.map((d) => {
    const [year, month] = d.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      ...d,
      monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Monthly Fuel Spend</h3>
          <p className="text-[10px] text-muted-foreground">Last 6 months trend</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={months} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" strokeWidth={1} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#fuelGradient)"
              dot={{
                r: 4,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
