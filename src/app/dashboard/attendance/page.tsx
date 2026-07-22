"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ClipboardCheck, Save } from "lucide-react";
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

interface AttendanceSettings {
    enabled: boolean;
    timezone: string;
    requireSelfieOnCheckIn: boolean;
    requireCheckInToGoOnline: boolean;
    requireCheckInForSameDayJobs: boolean;
}

interface Row {
    _id: string;
    dateKey: string;
    status: string;
    checkInAt?: string;
    checkOutAt?: string;
    pujariId?: {
        name?: string;
        phone?: string;
        pujariId?: string;
        isOnline?: boolean;
    } | null;
}

const defaults: AttendanceSettings = {
    enabled: true,
    timezone: "Asia/Kolkata",
    requireSelfieOnCheckIn: false,
    requireCheckInToGoOnline: false,
    requireCheckInForSameDayJobs: false,
};

export default function AttendancePage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState<AttendanceSettings>(defaults);
    const [dateKey, setDateKey] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "80" };
            if (date) params.date = date;
            if (status !== "all") params.status = status;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/admin/attendance", { params });
            setRows(res.data?.rows || []);
            setDateKey(res.data?.dateKey || date || "");
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [date, status, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/attendance/settings", settings);
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
            toast.success("Attendance settings saved");
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
                    <ClipboardCheck className="h-6 w-6 text-emerald-700" />
                    Pujari Attendance
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Daily duty check-in log. Separate from Online toggle, weekly hours, and booking selfies.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Policy settings</CardTitle>
                    <CardDescription>
                        Gates are off by default — enable only when ops wants to enforce duty check-in.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(
                        [
                            ["enabled", "Attendance enabled", "Allow check-in/out logging"],
                            ["requireSelfieOnCheckIn", "Require selfie on check-in", "Camera selfie mandatory"],
                            ["requireCheckInToGoOnline", "Require check-in to go Online", "Blocks Live toggle until checked in"],
                            ["requireCheckInForSameDayJobs", "Require check-in for same-day jobs", "Matching / job board gate"],
                        ] as const
                    ).map(([key, label, hint]) => (
                        <div key={key} className="flex items-center justify-between gap-4 max-w-xl">
                            <div>
                                <Label>{label}</Label>
                                <p className="text-xs text-muted-foreground">{hint}</p>
                            </div>
                            <Switch
                                checked={!!settings[key]}
                                onCheckedChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
                            />
                        </div>
                    ))}
                    <div className="space-y-2 max-w-sm">
                        <Label>Timezone</Label>
                        <Input
                            value={settings.timezone}
                            onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
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
                    <CardTitle className="text-lg">
                        Logs {dateKey ? `· ${dateKey}` : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-44" />
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="checked_in">Checked in</SelectItem>
                                <SelectItem value="checked_out">Checked out</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Search name / phone / ID"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outline" onClick={fetchData}>Refresh</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No attendance rows for this filter.</p>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pujari</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Check-in</TableHead>
                                        <TableHead>Check-out</TableHead>
                                        <TableHead>Live now</TableHead>
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
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {String(r.status || "").replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {r.checkInAt ? new Date(r.checkInAt).toLocaleString("en-IN") : "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {r.checkOutAt ? new Date(r.checkOutAt).toLocaleString("en-IN") : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {r.pujariId?.isOnline ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800">Online</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Offline</Badge>
                                                )}
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
