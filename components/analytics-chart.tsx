"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DataItem = { name: string; metric: number };

export function AnalyticsChart({ title, data, color }: { title: string; data: DataItem[]; color: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1433] p-4 text-white">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
            <XAxis dataKey="name" stroke="#f6e8c6" />
            <YAxis stroke="#f6e8c6" />
            <Tooltip />
            <Bar dataKey="metric" fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
