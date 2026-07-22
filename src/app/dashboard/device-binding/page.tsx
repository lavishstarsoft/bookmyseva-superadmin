"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Smartphone, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Settings {
    enabled: boolean;
    singleDeviceLogin: boolean;
    maxActiveSessions: number;
    enforceDeviceMatchOnRefresh: boolean;
    requireDeviceId: boolean;
}

const defaults: Settings = {
    enabled: false,
    singleDeviceLogin: true,
    maxActiveSessions: 1,
    enforceDeviceMatchOnRefresh: false,
    requireDeviceId: false,
};

export default function DeviceBindingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>(defaults);
    const [pujariId, setPujariId] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [pujari, setPujari] = useState<any>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/device-binding");
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/device-binding/settings", settings);
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
            toast.success("Device binding settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const loadSessions = async () => {
        if (!pujariId.trim()) {
            toast.error("Enter a pujari MongoDB id");
            return;
        }
        setLoadingSessions(true);
        try {
            const res = await api.get(`/admin/device-binding/pujari/${pujariId.trim()}/sessions`);
            setSessions(res.data?.sessions || []);
            setPujari(res.data?.pujari || null);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load sessions");
            setSessions([]);
            setPujari(null);
        } finally {
            setLoadingSessions(false);
        }
    };

    const revokeSession = async (sessionId: string) => {
        try {
            await api.delete(`/admin/device-binding/pujari/${pujariId.trim()}/sessions/${sessionId}`);
            toast.success("Session revoked");
            loadSessions();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to revoke");
        }
    };

    const revokeAll = async () => {
        try {
            await api.post(`/admin/device-binding/pujari/${pujariId.trim()}/revoke-all`);
            toast.success("All sessions revoked");
            loadSessions();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to revoke all");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Smartphone className="h-6 w-6 text-indigo-700" />
                    Device Binding
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Optional single-device login for pujaris. Default OFF — existing multi-session auth unchanged.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Policy</CardTitle>
                    <CardDescription>
                        When enabled with single-device login, a new OTP login revokes other active sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Enable device binding</Label>
                            <p className="text-xs text-muted-foreground">Master switch</p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Single-device login</Label>
                            <p className="text-xs text-muted-foreground">Revoke all other sessions on new login</p>
                        </div>
                        <Switch
                            checked={settings.singleDeviceLogin}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, singleDeviceLogin: v }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max active sessions (if single-device off)</Label>
                        <Input
                            type="number"
                            min={1}
                            max={10}
                            value={settings.maxActiveSessions}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    maxActiveSessions: Number(e.target.value) || 1,
                                }))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Enforce device match on refresh</Label>
                            <p className="text-xs text-muted-foreground">
                                Reject refresh if deviceId differs from session
                            </p>
                        </div>
                        <Switch
                            checked={settings.enforceDeviceMatchOnRefresh}
                            onCheckedChange={(v) =>
                                setSettings((s) => ({ ...s, enforceDeviceMatchOnRefresh: v }))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Require device ID on login</Label>
                        </div>
                        <Switch
                            checked={settings.requireDeviceId}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, requireDeviceId: v }))}
                        />
                    </div>
                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inspect pujari sessions</CardTitle>
                    <CardDescription>Paste pujari `_id` to list / revoke active devices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Pujari MongoDB ObjectId"
                            value={pujariId}
                            onChange={(e) => setPujariId(e.target.value)}
                        />
                        <Button variant="outline" onClick={loadSessions} disabled={loadingSessions}>
                            {loadingSessions ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                        </Button>
                    </div>
                    {pujari && (
                        <div className="text-sm">
                            <span className="font-semibold">{pujari.name}</span> · {pujari.phone} ·{" "}
                            {pujari.pujariId}
                            {pujari.deviceBinding?.lastDeviceId ? (
                                <span className="text-muted-foreground">
                                    {" "}
                                    · last device {pujari.deviceBinding.lastDeviceId.slice(0, 12)}…
                                </span>
                            ) : null}
                        </div>
                    )}
                    {sessions.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={revokeAll}>
                            Revoke all sessions
                        </Button>
                    )}
                    {sessions.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Last used</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell>
                                                <div className="font-medium">{s.deviceName || "—"}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {s.deviceId || "no deviceId"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{s.platform || "unknown"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                    onClick={() => revokeSession(s.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : pujari ? (
                        <p className="text-sm text-muted-foreground">No active sessions</p>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
