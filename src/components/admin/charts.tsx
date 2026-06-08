"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  label: string;
  present: number;
  late: number;
}
interface DivisionPoint {
  name: string;
  members: number;
}

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #D6E4FF",
  borderRadius: 12,
  color: "#0A1633",
  fontSize: 12,
  boxShadow: "0 12px 32px -16px rgba(0,49,143,0.25)",
};

const axisColor = "#7E8BA3";
const gridColor = "rgba(0,49,143,0.08)";

export function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2184FF" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#2184FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFB020" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#FFB020" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="present" name="Hadir" stroke="#2184FF" strokeWidth={2.5} fill="url(#gPresent)" />
        <Area type="monotone" dataKey="late" name="Terlambat" stroke="#FFB020" strokeWidth={2.5} fill="url(#gLate)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DivisionChart({ data }: { data: DivisionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#35D6FF" />
            <stop offset="100%" stopColor="#2184FF" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(33,132,255,0.06)" }} />
        <Bar dataKey="members" name="Anggota" fill="url(#gBar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
