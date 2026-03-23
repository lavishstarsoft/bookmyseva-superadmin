"use client"

import { Pie, Cell, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart, Legend, BarChart, Bar } from "recharts"

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

interface ChartProps {
    data: any[];
}

export function RevenueChart({ data }: ChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">No data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8d0303" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8d0303" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8d0303" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function StatusPieChart({ data }: ChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-medium text-gray-600">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

export function TopProductsChart({ data }: ChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="value" fill="#8d0303" radius={[0, 4, 4, 0]} barSize={24} name="Revenue" />
            </BarChart>
        </ResponsiveContainer>
    )
}
