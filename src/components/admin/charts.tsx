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
  background: "rgba(20,18,14,0.95)",
  border: "1px solid rgba(212,175,55,0.3)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

export function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#8a8377" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#8a8377" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="present" name="Hadir" stroke="#D4AF37" strokeWidth={2} fill="url(#gPresent)" />
        <Area type="monotone" dataKey="late" name="Terlambat" stroke="#f59e0b" strokeWidth={2} fill="url(#gLate)" />
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
            <stop offset="0%" stopColor="#F6EAC0" />
            <stop offset="100%" stopColor="#917115" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" stroke="#8a8377" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis stroke="#8a8377" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(212,175,55,0.06)" }} />
        <Bar dataKey="members" name="Anggota" fill="url(#gBar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
