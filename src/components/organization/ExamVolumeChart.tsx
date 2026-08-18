"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type ExamVolumePoint = {
  day: string;
  volume: number;
  type: string;
};

export function ExamVolumeChart({ data }: { data: ExamVolumePoint[] }) {
  const chartData = data.length > 0 ? data : [{ day: "No data", volume: 0, type: "Actual" }];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            formatter={(value, _name, item) => {
              const safeValue = Array.isArray(value) ? value[0] : value;
              const numericValue = typeof safeValue === "number" ? safeValue : Number(safeValue ?? 0);
              const payloadType = item?.payload?.type ?? "Projected";
              return [`${numericValue} exams`, payloadType];
            }}
          />
          <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((entry) => (
              <Cell key={entry.day} fill={entry.type === "Actual" ? "#0d7a8c" : "#e2e8f0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
