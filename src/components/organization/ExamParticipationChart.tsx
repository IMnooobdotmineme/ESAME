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

const DATA = [
  { month: "Feb", participants: 180, passRate: 72 },
  { month: "Mar", participants: 240, passRate: 75 },
  { month: "Apr", participants: 210, passRate: 70 },
  { month: "May", participants: 310, passRate: 79 },
  { month: "Jun", participants: 280, passRate: 81 },
  { month: "Jul", participants: 340, passRate: 78 },
];

export function ExamParticipationChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="participantsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="passRateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14213d" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#14213d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="participants"
            name="Participants"
            stroke="#2ea3e8"
            strokeWidth={2}
            fill="url(#participantsFill)"
          />
          <Area
            type="monotone"
            dataKey="passRate"
            name="Pass Rate %"
            stroke="#14213d"
            strokeWidth={2}
            fill="url(#passRateFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}