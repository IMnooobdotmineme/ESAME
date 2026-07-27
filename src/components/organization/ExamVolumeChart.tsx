"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DATA = [
  { day: "Mon", volume: 18, type: "Projected" },
  { day: "Tue", volume: 22, type: "Projected" },
  { day: "Wed", volume: 20, type: "Projected" },
  { day: "Thu", volume: 48, type: "Actual" },
  { day: "Fri", volume: 62, type: "Actual" },
  { day: "Sat", volume: 55, type: "Actual" },
  { day: "Sun", volume: 24, type: "Projected" },
];

export function ExamVolumeChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            formatter={(value: any, _name: any, item: any) => [`${Number(value)} exams`, item.payload.type]}
          />
          <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {DATA.map((entry) => (
              <Cell key={entry.day} fill={entry.type === "Actual" ? "#0d7a8c" : "#e2e8f0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
