"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Siren, Save, CheckCircle2, Eye } from "lucide-react";
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

interface SosSettings {
    enabled: boolean;
    cooldownSeconds: number;
    maxOpenAlerts: number;
    helplineNumber: string;
    requireLocation: boolean;
    notifyAdmin: boolean;
    supportPhone?: string;
}

interface SosRow {
    _id: string;
    alertId: string;
    status: string;
    note?: string;
    createdAt?: string;
    location?: { latitude?: number | null; longitude?: number | null };
    pujariSnapshot?: { name?: string; phone?: string; pujariId?: string };
    pujariId?: { name?: string; phone?: string; pujariId?: string } | null;
}

const defaults: SosSettings = {
    enabled: true,
    cooldownSeconds: 120,
    maxOpenAlerts: 1,
    helplineNumber: "112",
    requireLocation: false,
    notifyAdmin: true,
};

export default function SosPage() {
    const [rows, setRows] = useState<SosRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("open");
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<SosSettings>(defaults);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "50" };
            if (status !== "all") params.status = status;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/admin/sos", { params });
            setRows(res.data?.rows || []);
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load SOS alerts");
        } finally {
            setLoading(false);
        }
    }, [status, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/sos/settings", settings);
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
            toast.success("SOS settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (id: string, next: "acknowledged" | "resolved") => {
        try {
            await api.patch(`/admin/sos/${id}/status`, { status: next });
            toast.success(`Marked ${next}`);
            fetchData();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to update");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Siren className="h-6 w-6 text-red-700" />
                    Pujari SOS Alerts
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Emergency alerts from the pujari app. Does not affect bookings or payments.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Cooldown, helpline, and notification behaviour</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between gap-4 md:col-span-2">
                        <div>
                            <Label>SOS enabled</Label>
                            <p className="text-xs text-muted-foreground">Allow pujaris to trigger alerts</p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Cooldown (seconds)</Label>
                        <Input
                            type="number"
                            value={settings.cooldownSeconds}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    cooldownSeconds: Number(e.target.value) || 120,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Helpline number</Label>
                        <Input
                            value={settings.helplineNumber}
                            onChange={(e) =>
                                setSettings((s) => ({ ...s, helplineNumber: e.target.value }))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label>Require GPS</Label>
                        <Switch
                            checked={settings.requireLocation}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, requireLocation: v }))}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label>Notify admin inbox</Label>
                        <Switch
                            checked={settings.notifyAdmin}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, notifyAdmin: v }))}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button onClick={saveSettings} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="acknowledged">Acknowledged</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1 flex-1 min-w-[180px]">
                    <Label>Search</Label>
                    <Input
                        placeholder="Name / phone / alert id"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={fetchData}>Refresh</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : rows.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No SOS alerts for this filter.</p>
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Alert</TableHead>
                                <TableHead>Pujari</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => {
                                const p = r.pujariId || r.pujariSnapshot || {};
                                const maps =
                                    r.location?.latitude != null && r.location?.longitude != null
                                        ? `https://www.google.com/maps?q=${r.location.latitude},${r.location.longitude}`
                                        : null;
                                return (
                                    <TableRow key={r._id}>
                                        <TableCell>
                                            <div className="font-semibold">{r.alertId}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                                            </div>
                                            {r.note ? (
                                                <div className="text-xs mt-1 text-muted-foreground">{r.note}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{(p as any).name || "—"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {(p as any).phone} · {(p as any).pujariId}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {maps ? (
                                                <a
                                                    href={maps}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-700 underline"
                                                >
                                                    Open map
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No GPS</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={r.status === "open" ? "destructive" : "secondary"}>
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {(r.status === "open") && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(r._id, "acknowledged")}>
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Ack
                                                </Button>
                                            )}
                                            {(r.status === "open" || r.status === "acknowledged") && (
                                                <Button size="sm" onClick={() => updateStatus(r._id, "resolved")}>
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
