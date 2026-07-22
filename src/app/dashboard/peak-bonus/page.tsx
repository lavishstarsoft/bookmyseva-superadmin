"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Zap, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";

interface PeakWindow {
    name: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    amountType: "fixed" | "percent";
    amount: number;
    percent: number;
}

interface FestivalDate {
    date: string;
    amount: number;
    name: string;
}

interface PeakSettings {
    enabled: boolean;
    timezone: string;
    payer: string;
    festivalDefaultAmount: number;
    windows: PeakWindow[];
    festivalDates: FestivalDate[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyWindow = (): PeakWindow => ({
    name: "Evening Peak",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: "17:00",
    endTime: "21:00",
    amountType: "fixed",
    amount: 50,
    percent: 0,
});

export default function PeakBonusPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PeakSettings>({
        enabled: false,
        timezone: "Asia/Kolkata",
        payer: "platform",
        festivalDefaultAmount: 100,
        windows: [emptyWindow()],
        festivalDates: [],
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/peak-bonus");
            if (res.data?.settings) {
                setSettings({
                    enabled: !!res.data.settings.enabled,
                    timezone: res.data.settings.timezone || "Asia/Kolkata",
                    payer: "platform",
                    festivalDefaultAmount: Number(res.data.settings.festivalDefaultAmount) || 100,
                    windows: Array.isArray(res.data.settings.windows) && res.data.settings.windows.length
                        ? res.data.settings.windows
                        : [emptyWindow()],
                    festivalDates: Array.isArray(res.data.settings.festivalDates)
                        ? res.data.settings.festivalDates
                        : [],
                });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load peak bonus settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/peak-bonus/settings", settings);
            if (res.data?.settings) {
                setSettings((s) => ({ ...s, ...res.data.settings, payer: "platform" }));
            }
            toast.success("Peak bonus settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (wi: number, day: number) => {
        setSettings((s) => {
            const windows = [...s.windows];
            const w = { ...windows[wi] };
            const set = new Set(w.daysOfWeek || []);
            if (set.has(day)) set.delete(day);
            else set.add(day);
            w.daysOfWeek = Array.from(set).sort();
            windows[wi] = w;
            return { ...s, windows };
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Zap className="h-6 w-6 text-indigo-600" />
                    Peak Bonus
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Platform-funded pujari incentive for peak hours / festivals. Separate from Waiting Charge.
                    Customer price does not change.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Program</CardTitle>
                    <CardDescription>
                        Snapshot at booking create · credited to wallet on complete as <code>peak_bonus</code>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Enabled</Label>
                            <p className="text-xs text-muted-foreground">Turn peak bonuses on or off</p>
                        </div>
                        <Switch
                            checked={!!settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Input
                                value={settings.timezone}
                                onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payer</Label>
                            <Input value="platform (fixed)" disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Time windows</CardTitle>
                        <CardDescription>Matched against scheduled date + time slot</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings((s) => ({ ...s, windows: [...s.windows, emptyWindow()] }))}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add window
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {settings.windows.map((w, wi) => (
                        <div key={wi} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <Input
                                    className="max-w-xs font-medium"
                                    value={w.name}
                                    onChange={(e) => {
                                        const windows = [...settings.windows];
                                        windows[wi] = { ...w, name: e.target.value };
                                        setSettings((s) => ({ ...s, windows }));
                                    }}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setSettings((s) => ({
                                            ...s,
                                            windows: s.windows.filter((_, i) => i !== wi),
                                        }))
                                    }
                                    disabled={settings.windows.length <= 1}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {DAY_LABELS.map((label, day) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => toggleDay(wi, day)}
                                        className={`px-2 py-1 text-xs rounded border ${
                                            (w.daysOfWeek || []).includes(day)
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-muted-foreground"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Start</Label>
                                    <Input
                                        value={w.startTime}
                                        onChange={(e) => {
                                            const windows = [...settings.windows];
                                            windows[wi] = { ...w, startTime: e.target.value };
                                            setSettings((s) => ({ ...s, windows }));
                                        }}
                                        placeholder="17:00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">End</Label>
                                    <Input
                                        value={w.endTime}
                                        onChange={(e) => {
                                            const windows = [...settings.windows];
                                            windows[wi] = { ...w, endTime: e.target.value };
                                            setSettings((s) => ({ ...s, windows }));
                                        }}
                                        placeholder="21:00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Type</Label>
                                    <Select
                                        value={w.amountType}
                                        onValueChange={(v: "fixed" | "percent") => {
                                            const windows = [...settings.windows];
                                            windows[wi] = { ...w, amountType: v };
                                            setSettings((s) => ({ ...s, windows }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed ₹</SelectItem>
                                            <SelectItem value="percent">% of earnings</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{w.amountType === "percent" ? "Percent" : "Amount ₹"}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={w.amountType === "percent" ? w.percent : w.amount}
                                        onChange={(e) => {
                                            const windows = [...settings.windows];
                                            const n = Number(e.target.value) || 0;
                                            windows[wi] =
                                                w.amountType === "percent"
                                                    ? { ...w, percent: n }
                                                    : { ...w, amount: n };
                                            setSettings((s) => ({ ...s, windows }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Festival dates</CardTitle>
                        <CardDescription>YYYY-MM-DD flat bonus (overrides windows that day)</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setSettings((s) => ({
                                ...s,
                                festivalDates: [
                                    ...s.festivalDates,
                                    { date: "", amount: s.festivalDefaultAmount || 100, name: "Festival Peak" },
                                ],
                            }))
                        }
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add date
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {settings.festivalDates.length === 0 && (
                        <p className="text-sm text-muted-foreground">No festival dates configured.</p>
                    )}
                    {settings.festivalDates.map((f, fi) => (
                        <div key={fi} className="flex flex-wrap gap-2 items-end">
                            <div className="space-y-1">
                                <Label className="text-xs">Date</Label>
                                <Input
                                    type="date"
                                    value={f.date}
                                    onChange={(e) => {
                                        const festivalDates = [...settings.festivalDates];
                                        festivalDates[fi] = { ...f, date: e.target.value };
                                        setSettings((s) => ({ ...s, festivalDates }));
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input
                                    value={f.name}
                                    onChange={(e) => {
                                        const festivalDates = [...settings.festivalDates];
                                        festivalDates[fi] = { ...f, name: e.target.value };
                                        setSettings((s) => ({ ...s, festivalDates }));
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Amount ₹</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={f.amount}
                                    onChange={(e) => {
                                        const festivalDates = [...settings.festivalDates];
                                        festivalDates[fi] = { ...f, amount: Number(e.target.value) || 0 };
                                        setSettings((s) => ({ ...s, festivalDates }));
                                    }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setSettings((s) => ({
                                        ...s,
                                        festivalDates: s.festivalDates.filter((_, i) => i !== fi),
                                    }))
                                }
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    <div className="pt-2">
                        <Badge variant="secondary">Default festival amount: ₹{settings.festivalDefaultAmount}</Badge>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save settings
            </Button>
        </div>
    );
}
