"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DATA = [
  { range: "0-49", label: "Fail", count: 86 },
  { range: "50-59", label: "D", count: 142 },
  { range: "60-69", label: "C", count: 268 },
  { range: "70-79", label: "B", count: 371 },
  { range: "80-89", label: "A", count: 294 },
  { range: "90-100", label: "A+", count: 123 },
];

const COLORS = ["#ef4444", "#f59e0b", "#4fc3f7", "#2ea3e8", "#14213d", "#0d1730"];

export function ScoreDistributionChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            formatter={(value) => [`${value ?? 0} students`, "Count"]}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {DATA.map((entry, i) => (
              <Cell key={entry.range} fill={COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
