"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, Gift, Save } from "lucide-react";
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

interface ReferralSettings {
    enabled: boolean;
    referrerRewardCoins: number;
    refereeRewardCoins: number;
    minPaidAmount: number;
    requireCompletedBooking: boolean;
}

interface ReferralRow {
    _id: string;
    referralCode: string;
    status: string;
    qualifyingBookingCode?: string;
    referrerRewardCoins?: number;
    refereeRewardCoins?: number;
    rewardedAt?: string | null;
    createdAt: string;
    referrerId?: { name?: string; phone?: string; email?: string; referralCode?: string } | null;
    refereeId?: { name?: string; phone?: string; email?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    qualified: "bg-blue-100 text-blue-800",
    rewarded: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
};

const defaultSettings: ReferralSettings = {
    enabled: true,
    referrerRewardCoins: 50,
    refereeRewardCoins: 25,
    minPaidAmount: 1,
    requireCompletedBooking: true,
};

export default function ReferralsPage() {
    const [rows, setRows] = useState<ReferralRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<ReferralSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);

    const fetchReferrals = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "50" };
            if (status !== "all") params.status = status;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/admin/referrals", { params });
            setRows(res.data?.referrals || []);
            if (res.data?.settings) setSettings(res.data.settings);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load referrals");
        } finally {
            setLoading(false);
        }
    }, [status, search]);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/referrals/settings", settings);
            if (res.data?.settings) setSettings(res.data.settings);
            toast.success("Referral settings saved");
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
                    <Gift className="h-6 w-6 text-amber-600" />
                    Referral Program
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Customer invites earn BMS coins after the first completed paid pooja.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Program settings</CardTitle>
                    <CardDescription>Rewards are issued only after a completed paid booking (anti-abuse).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 max-w-md">
                        <div>
                            <Label>Enabled</Label>
                            <p className="text-xs text-muted-foreground">Turn the referral program on or off</p>
                        </div>
                        <Switch
                            checked={!!settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                        <div className="space-y-2">
                            <Label>Referrer coins</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.referrerRewardCoins}
                                onChange={(e) => setSettings((s) => ({ ...s, referrerRewardCoins: Number(e.target.value) || 0 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Referee coins</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.refereeRewardCoins}
                                onChange={(e) => setSettings((s) => ({ ...s, refereeRewardCoins: Number(e.target.value) || 0 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Min paid amount (₹)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={settings.minPaidAmount}
                                onChange={(e) => setSettings((s) => ({ ...s, minPaidAmount: Number(e.target.value) || 0 }))}
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
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Attributions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Search code or booking…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="rewarded">Rewarded</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={fetchReferrals}>Refresh</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No referral attributions yet.</p>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Referrer</TableHead>
                                        <TableHead>Referee</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Booking</TableHead>
                                        <TableHead>Rewards</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell className="font-mono text-sm">{r.referralCode}</TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{r.referrerId?.name || "—"}</div>
                                                <div className="text-xs text-muted-foreground">{r.referrerId?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{r.refereeId?.name || "—"}</div>
                                                <div className="text-xs text-muted-foreground">{r.refereeId?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[r.status] || "bg-slate-100"}>
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{r.qualifyingBookingCode || "—"}</TableCell>
                                            <TableCell className="text-sm">
                                                {r.status === "rewarded"
                                                    ? `${r.referrerRewardCoins ?? 0} / ${r.refereeRewardCoins ?? 0}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
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
