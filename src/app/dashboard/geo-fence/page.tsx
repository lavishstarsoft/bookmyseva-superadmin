"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPinned, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";
import { toast } from "sonner";

interface GeoFenceSettings {
    enabled: boolean;
    radiusMeters: number;
    maxAccuracyMeters: number;
    allowManualOverride: boolean;
    skipIfNoDestinationCoords: boolean;
}

const defaults: GeoFenceSettings = {
    enabled: false,
    radiusMeters: 200,
    maxAccuracyMeters: 150,
    allowManualOverride: true,
    skipIfNoDestinationCoords: true,
};

export default function GeoFencePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GeoFenceSettings>(defaults);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/geo-fence");
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load geo-fence settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await api.put("/admin/geo-fence/settings", settings);
            if (res.data?.settings) setSettings({ ...defaults, ...res.data.settings });
            toast.success("Geo-fence settings saved");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <MapPinned className="h-6 w-6 text-orange-700" />
                    Arrival Geo Fence
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Optional GPS check when pujari taps &quot;Arrived&quot;. Default is OFF — existing bookings keep working.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Validates distance from booking destination. Waiting Charge / payments are not affected.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Enable geo-fence on Arrived</Label>
                            <p className="text-xs text-muted-foreground">When off, arrive works as before</p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Radius (meters)</Label>
                        <Input
                            type="number"
                            min={30}
                            max={5000}
                            value={settings.radiusMeters}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    radiusMeters: Number(e.target.value) || 200,
                                }))
                            }
                        />
                        <p className="text-xs text-muted-foreground">Pujari must be within this distance (default 200m)</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Max GPS accuracy (meters)</Label>
                        <Input
                            type="number"
                            min={10}
                            max={1000}
                            value={settings.maxAccuracyMeters}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    maxAccuracyMeters: Number(e.target.value) || 150,
                                }))
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Reject if reported accuracy is worse than this (unless override)
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Allow manual override</Label>
                            <p className="text-xs text-muted-foreground">Indoor / weak GPS with reason</p>
                        </div>
                        <Switch
                            checked={settings.allowManualOverride}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, allowManualOverride: v }))}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label>Skip if booking has no coordinates</Label>
                            <p className="text-xs text-muted-foreground">Allow arrive when destination lat/lng missing</p>
                        </div>
                        <Switch
                            checked={settings.skipIfNoDestinationCoords}
                            onCheckedChange={(v) =>
                                setSettings((s) => ({ ...s, skipIfNoDestinationCoords: v }))
                            }
                        />
                    </div>

                    <Button onClick={saveSettings} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
