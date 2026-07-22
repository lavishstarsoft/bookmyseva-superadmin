"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    RevenueChart,
    StatusPieChart,
    BookingTrendChart,
    AcceptanceTrendChart,
} from "@/components/dashboard/analytics-charts";
import api from "@/lib/axios";
import { toast } from "sonner";

function defaultFromTo() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(from), to: fmt(to) };
}

export default function PujaAnalyticsPage() {
    const defaults = defaultFromTo();
    const [from, setFrom] = useState(defaults.from);
    const [to, setTo] = useState(defaults.to);
    const [preset, setPreset] = useState("custom");
    const [inactiveDays, setInactiveDays] = useState("14");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { inactiveDays };
            if (preset === "week" || preset === "month" || preset === "today") {
                params.range = preset;
            } else {
                params.from = from;
                params.to = to;
            }
            const res = await api.get("/admin/dashboard/puja-analytics", { params });
            setData(res.data);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [from, to, preset, inactiveDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const summary = data?.summary || {};
    const revenueChart = (data?.bookingTrends || []).map((r: any) => ({
        name: r.name,
        total: r.revenue,
    }));

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-[#8D0303]" />
                        Puja Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Bookings, revenue, acceptance, cancellations, top &amp; inactive pujaris (IST).
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <Label>Preset</Label>
                        <Select
                            value={preset}
                            onValueChange={(v) => setPreset(v)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">Last 7 days</SelectItem>
                                <SelectItem value="month">Last 30 days</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {preset === "custom" && (
                        <>
                            <div className="space-y-1">
                                <Label>From</Label>
                                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>To</Label>
                                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                            </div>
                        </>
                    )}
                    <div className="space-y-1">
                        <Label>Inactive days</Label>
                        <Input
                            type="number"
                            className="w-[100px]"
                            value={inactiveDays}
                            onChange={(e) => setInactiveDays(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchData}>Apply</Button>
                    {data?.range && (
                        <p className="text-xs text-muted-foreground w-full">
                            Range: {data.range.fromKey} → {data.range.toKey}
                        </p>
                    )}
                </CardContent>
            </Card>

            {loading && !data ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: "Bookings", value: summary.totalBookings },
                            { label: "Completed", value: summary.completed, sub: `${summary.completionRate || 0}%` },
                            { label: "Cancelled", value: summary.cancelled, sub: `${summary.cancellationRate || 0}%` },
                            {
                                label: "Revenue (paid)",
                                value: `₹${Number(summary.revenue || 0).toLocaleString("en-IN")}`,
                            },
                            { label: "Accepted", value: summary.accepted, sub: `${summary.acceptanceRate || 0}%` },
                            { label: "Rejected", value: summary.rejected },
                            {
                                label: "Pujari earnings",
                                value: `₹${Number(summary.pujariEarnings || 0).toLocaleString("en-IN")}`,
                            },
                            {
                                label: "Commission",
                                value: `₹${Number(summary.commission || 0).toLocaleString("en-IN")}`,
                            },
                        ].map((k) => (
                            <Card key={k.label}>
                                <CardHeader className="pb-2">
                                    <CardDescription>{k.label}</CardDescription>
                                    <CardTitle className="text-2xl">{k.value ?? 0}</CardTitle>
                                </CardHeader>
                                {k.sub ? (
                                    <CardContent className="pt-0 text-xs text-muted-foreground">{k.sub}</CardContent>
                                ) : null}
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Booking trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BookingTrendChart data={data?.bookingTrends || []} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue (completed)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RevenueChart data={revenueChart} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Acceptance vs rejection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AcceptanceTrendChart data={data?.acceptanceTrends || []} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Status breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <StatusPieChart data={summary.statusBreakdown || []} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top pujaris</CardTitle>
                                <CardDescription>By completed bookings in range</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(data?.topPujaris || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-6 text-center">No data</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pujari</TableHead>
                                                <TableHead>Done</TableHead>
                                                <TableHead>Earnings</TableHead>
                                                <TableHead>Rating</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.topPujaris.map((p: any) => (
                                                <TableRow key={p.pujariId}>
                                                    <TableCell>
                                                        <div className="font-medium">{p.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {p.code} · {p.phone}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{p.completed}</TableCell>
                                                    <TableCell>
                                                        ₹{Number(p.earnings || 0).toLocaleString("en-IN")}
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.avgRating != null ? p.avgRating : "—"}
                                                        {p.isOnline ? (
                                                            <Badge className="ml-2" variant="secondary">Live</Badge>
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Inactive pujaris</CardTitle>
                                <CardDescription>
                                    Approved, offline, last online older than{" "}
                                    {data?.inactivePujaris?.inactiveDays || inactiveDays} days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(data?.inactivePujaris?.rows || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-6 text-center">None matched</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pujari</TableHead>
                                                <TableHead>Last online</TableHead>
                                                <TableHead>Lifetime</TableHead>
                                                <TableHead>Recent</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.inactivePujaris.rows.map((p: any) => (
                                                <TableRow key={p.pujariId}>
                                                    <TableCell>
                                                        <div className="font-medium">{p.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {p.code} · {p.phone}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {p.lastOnlineAt
                                                            ? new Date(p.lastOnlineAt).toLocaleString("en-IN")
                                                            : "Never"}
                                                    </TableCell>
                                                    <TableCell>{p.completedBookings}</TableCell>
                                                    <TableCell>{p.recentBookings}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {(data?.cancellationTrends?.byActor || []).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Cancellations by actor</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                {data.cancellationTrends.byActor.map((a: any) => (
                                    <Badge key={a.name} variant="outline" className="text-sm px-3 py-1">
                                        {a.name}: {a.value}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
