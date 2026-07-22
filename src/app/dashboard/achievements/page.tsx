"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, Award, Save } from "lucide-react";
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

interface MedalSettings {
    bronzeMin: number;
    silverMin: number;
    goldMin: number;
    diamondMin: number;
}

interface AchievementSettings {
    enabled: boolean;
    medal: MedalSettings;
    ratingMinReviewsFor4: number;
    ratingMinReviewsFor45: number;
}

interface UnlockRow {
    _id: string;
    code: string;
    title: string;
    category: string;
    unlockedAt: string;
    pujariId?: {
        name?: string;
        phone?: string;
        pujariId?: string;
        medal?: string;
    } | null;
}

interface CatalogItem {
    code: string;
    title: string;
    description: string;
    category: string;
}

const defaultSettings: AchievementSettings = {
    enabled: true,
    medal: { bronzeMin: 1, silverMin: 100000, goldMin: 200000, diamondMin: 500000 },
    ratingMinReviewsFor4: 5,
    ratingMinReviewsFor45: 10,
};

export default function AchievementsPage() {
    const [rows, setRows] = useState<UnlockRow[]>([]);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<AchievementSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "50" };
            if (category !== "all") params.category = category;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/admin/achievements", { params });
            setRows(res.data?.unlocks || []);
            setCatalog(res.data?.catalog || []);
            if (res.data?.settings) {
                setSettings({
                    ...defaultSettings,
                    ...res.data.settings,
                    medal: { ...defaultSettings.medal, ...(res.data.settings.medal || {}) },
                });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load achievements");
        } finally {
            setLoading(false);
        }
    }, [category, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/achievements/settings", settings);
            if (res.data?.settings) {
                setSettings({
                    ...defaultSettings,
                    ...res.data.settings,
                    medal: { ...defaultSettings.medal, ...(res.data.settings.medal || {}) },
                });
            }
            toast.success("Achievement settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Award className="h-6 w-6 text-amber-700" />
                    Pujari Achievements
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Extends Sacred Medal (Bronze→Diamond). Unlock badges for bookings, medals, and ratings.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Medal & achievement settings</CardTitle>
                    <CardDescription>
                        Sacred Medal thresholds stay on the pujari profile. Achievements unlock into a separate ledger.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Achievements enabled</Label>
                            <p className="text-xs text-muted-foreground">Turn multi-badge unlocks on or off</p>
                        </div>
                        <Switch
                            checked={!!settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(
                            [
                                ["bronzeMin", "Bronze min ₹"],
                                ["silverMin", "Silver min ₹"],
                                ["goldMin", "Gold min ₹"],
                                ["diamondMin", "Diamond min ₹"],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="space-y-2">
                                <Label>{label}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.medal[key]}
                                    onChange={(e) =>
                                        setSettings((s) => ({
                                            ...s,
                                            medal: { ...s.medal, [key]: Number(e.target.value) || 0 },
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <div className="space-y-2">
                            <Label>Trusted Guide min reviews (4.0★)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={settings.ratingMinReviewsFor4}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        ratingMinReviewsFor4: Number(e.target.value) || 1,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Excellence min reviews (4.5★)</Label>
                            <Input
                                type="number"
                                min={1}
                                value={settings.ratingMinReviewsFor45}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        ratingMinReviewsFor45: Number(e.target.value) || 1,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Catalog ({catalog.length})</CardTitle>
                    <CardDescription>Built-in badges — unlocked automatically when criteria are met.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {catalog.map((c) => (
                            <div key={c.code} className="rounded-md border p-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="capitalize">{c.category}</Badge>
                                    <span className="font-medium text-sm">{c.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                                <p className="text-[10px] font-mono text-muted-foreground mt-1">{c.code}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent unlocks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Search code or title…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                <SelectItem value="medal">Medal</SelectItem>
                                <SelectItem value="bookings">Bookings</SelectItem>
                                <SelectItem value="rating">Rating</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchData}>Refresh</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No unlocks yet.</p>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Badge</TableHead>
                                        <TableHead>Pujari</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Unlocked</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell>
                                                <div className="font-medium text-sm">{r.title}</div>
                                                <div className="text-xs font-mono text-muted-foreground">{r.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{r.pujariId?.name || "—"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {r.pujariId?.pujariId || r.pujariId?.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{r.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {r.unlockedAt
                                                    ? new Date(r.unlockedAt).toLocaleString("en-IN")
                                                    : "—"}
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
