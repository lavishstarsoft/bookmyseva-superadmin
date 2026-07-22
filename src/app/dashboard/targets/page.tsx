"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Target, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";
import { toast } from "sonner";

interface TargetSettings {
    enabled: boolean;
    timezone: string;
    includePeakBonusInEarnings: boolean;
    rewardOnHit: { enabled: boolean; amount: number };
    defaults: {
        monthlyCompletedBookings: { enabled: boolean; goal: number };
        monthlyEarnings: { enabled: boolean; goal: number };
    };
}

interface Row {
    _id: string;
    periodKey: string;
    metric: string;
    goal: number;
    current: number;
    status: string;
    pujariId?: { name?: string; phone?: string; pujariId?: string } | null;
}

const defaults: TargetSettings = {
    enabled: false,
    timezone: "Asia/Kolkata",
    includePeakBonusInEarnings: true,
    rewardOnHit: { enabled: false, amount: 0 },
    defaults: {
        monthlyCompletedBookings: { enabled: true, goal: 20 },
        monthlyEarnings: { enabled: true, goal: 15000 },
    },
};

export default function TargetsPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [period, setPeriod] = useState("");
    const [metric, setMetric] = useState("all");
    const [status, setStatus] = useState("all");
    const [settings, setSettings] = useState<TargetSettings>(defaults);
    const [periodKey, setPeriodKey] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "60" };
            if (period) params.period = period;
            if (metric !== "all") params.metric = metric;
            if (status !== "all") params.status = status;
            const res = await api.get("/admin/targets", { params });
            setRows(res.data?.rows || []);
            setPeriodKey(res.data?.periodKey || period || "");
            if (res.data?.settings) {
                setSettings({
                    ...defaults,
                    ...res.data.settings,
                    rewardOnHit: { ...defaults.rewardOnHit, ...(res.data.settings.rewardOnHit || {}) },
                    defaults: {
                        monthlyCompletedBookings: {
                            ...defaults.defaults.monthlyCompletedBookings,
                            ...(res.data.settings.defaults?.monthlyCompletedBookings || {}),
                        },
                        monthlyEarnings: {
                            ...defaults.defaults.monthlyEarnings,
                            ...(res.data.settings.defaults?.monthlyEarnings || {}),
                        },
                    },
                });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load targets");
        } finally {
            setLoading(false);
        }
    }, [period, metric, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/targets/settings", settings);
            if (res.data?.settings) {
                setSettings({
                    ...defaults,
                    ...res.data.settings,
                    rewardOnHit: { ...defaults.rewardOnHit, ...(res.data.settings.rewardOnHit || {}) },
                    defaults: {
                        monthlyCompletedBookings: {
                            ...defaults.defaults.monthlyCompletedBookings,
                            ...(res.data.settings.defaults?.monthlyCompletedBookings || {}),
                        },
                        monthlyEarnings: {
                            ...defaults.defaults.monthlyEarnings,
                            ...(res.data.settings.defaults?.monthlyEarnings || {}),
                        },
                    },
                });
            }
            toast.success("Target settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const pct = (r: Row) =>
        r.goal > 0 ? Math.min(100, Math.round((Number(r.current) / Number(r.goal)) * 100)) : 0;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Target className="h-6 w-6 text-indigo-600" />
                    Monthly Targets
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Period goals (bookings + earnings). Separate from lifetime Achievement badges.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Program settings</CardTitle>
                    <CardDescription>Default OFF — enable when ops wants monthly quotas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Enabled</Label>
                            <p className="text-xs text-muted-foreground">Turn monthly targets on</p>
                        </div>
                        <Switch
                            checked={!!settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Include peak bonus in earnings target</Label>
                        </div>
                        <Switch
                            checked={!!settings.includePeakBonusInEarnings}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, includePeakBonusInEarnings: v }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Monthly sevas goal</Label>
                                <Switch
                                    checked={!!settings.defaults.monthlyCompletedBookings.enabled}
                                    onCheckedChange={(v) =>
                                        setSettings((s) => ({
                                            ...s,
                                            defaults: {
                                                ...s.defaults,
                                                monthlyCompletedBookings: {
                                                    ...s.defaults.monthlyCompletedBookings,
                                                    enabled: v,
                                                },
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <Input
                                type="number"
                                min={1}
                                value={settings.defaults.monthlyCompletedBookings.goal}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        defaults: {
                                            ...s.defaults,
                                            monthlyCompletedBookings: {
                                                ...s.defaults.monthlyCompletedBookings,
                                                goal: Number(e.target.value) || 1,
                                            },
                                        },
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Monthly earnings goal ₹</Label>
                                <Switch
                                    checked={!!settings.defaults.monthlyEarnings.enabled}
                                    onCheckedChange={(v) =>
                                        setSettings((s) => ({
                                            ...s,
                                            defaults: {
                                                ...s.defaults,
                                                monthlyEarnings: {
                                                    ...s.defaults.monthlyEarnings,
                                                    enabled: v,
                                                },
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <Input
                                type="number"
                                min={1}
                                value={settings.defaults.monthlyEarnings.goal}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        defaults: {
                                            ...s.defaults,
                                            monthlyEarnings: {
                                                ...s.defaults.monthlyEarnings,
                                                goal: Number(e.target.value) || 1,
                                            },
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Reward on hit</Label>
                            <p className="text-xs text-muted-foreground">Wallet credit when a goal is hit</p>
                        </div>
                        <Switch
                            checked={!!settings.rewardOnHit.enabled}
                            onCheckedChange={(v) =>
                                setSettings((s) => ({
                                    ...s,
                                    rewardOnHit: { ...s.rewardOnHit, enabled: v },
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2 max-w-xs">
                        <Label>Reward amount ₹</Label>
                        <Input
                            type="number"
                            min={0}
                            value={settings.rewardOnHit.amount}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    rewardOnHit: { ...s.rewardOnHit, amount: Number(e.target.value) || 0 },
                                }))
                            }
                        />
                    </div>
                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Progress {periodKey ? `· ${periodKey}` : ""}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            type="month"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="sm:w-44"
                        />
                        <Select value={metric} onValueChange={setMetric}>
                            <SelectTrigger className="w-full sm:w-52">
                                <SelectValue placeholder="Metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All metrics</SelectItem>
                                <SelectItem value="monthly_completed_bookings">Sevas</SelectItem>
                                <SelectItem value="monthly_earnings">Earnings</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="in_progress">In progress</SelectItem>
                                <SelectItem value="hit">Hit</SelectItem>
                                <SelectItem value="missed">Missed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchData}>Refresh</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No progress rows yet.</p>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pujari</TableHead>
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>%</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell>
                                                <div className="font-medium text-sm">{r.pujariId?.name || "—"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {r.pujariId?.pujariId || r.pujariId?.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {r.metric === "monthly_earnings" ? "Earnings" : "Sevas"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {r.metric === "monthly_earnings"
                                                    ? `₹${Number(r.current).toLocaleString("en-IN")} / ₹${Number(r.goal).toLocaleString("en-IN")}`
                                                    : `${r.current} / ${r.goal}`}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{pct(r)}%</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {String(r.status || "").replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
