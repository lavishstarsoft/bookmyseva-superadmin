"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, DollarSign, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";
import { toast } from "sonner";

interface AcceptancePricingSettings {
    enableAutoAcceptanceIncrement: boolean;
    enableManualOfferIncrease: boolean;
    offerDelaySeconds: number;
    quickIncreaseAmounts: number[];
    allowCustomAmount: boolean;
    maxManualIncreaseLimit: number;
    matchingTimeoutMinutes: number;
    paymentTimeoutSec: number;
}

const defaults: AcceptancePricingSettings = {
    enableAutoAcceptanceIncrement: false,
    enableManualOfferIncrease: true,
    offerDelaySeconds: 30,
    quickIncreaseAmounts: [10, 20, 40, 50, 100],
    allowCustomAmount: true,
    maxManualIncreaseLimit: 500,
    matchingTimeoutMinutes: 10,
    paymentTimeoutSec: 900,
};

const PAYMENT_TIMEOUT_PRESETS = [30, 60, 120, 300, 600, 900, 1800, 3000];

export default function AcceptancePricingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AcceptancePricingSettings>(defaults);
    const [quickInputStr, setQuickInputStr] = useState("10, 20, 40, 50, 100");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/acceptance-pricing");
            if (res.data?.settings) {
                const fetched = { ...defaults, ...res.data.settings };
                setSettings(fetched);
                if (Array.isArray(fetched.quickIncreaseAmounts)) {
                    setQuickInputStr(fetched.quickIncreaseAmounts.join(", "));
                }
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load pricing settings");
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
            // Parse quick amounts
            const parsedAmounts = quickInputStr
                .split(",")
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n) && n > 0);

            const payload = {
                ...settings,
                quickIncreaseAmounts: parsedAmounts.length > 0 ? parsedAmounts : [10, 20, 40, 50, 100]
            };

            const res = await api.put("/admin/acceptance-pricing/settings", payload);
            if (res.data?.settings) {
                const updated = { ...defaults, ...res.data.settings };
                setSettings(updated);
                if (Array.isArray(updated.quickIncreaseAmounts)) {
                    setQuickInputStr(updated.quickIncreaseAmounts.join(", "));
                }
            }
            toast.success("Pricing & Manual Offer settings saved");
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
        <div className="space-y-6 p-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-amber-600" />
                    Offer & Acceptance Pricing Settings
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Configure Rapido-style Customer Manual Offer Increase and system-wide Acceptance Pricing behavior.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-600" />
                        Rapido Style Customer Manual Offer
                    </CardTitle>
                    <CardDescription>
                        Allows customers to increase their offer amount when waiting for a Pujari.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label className="font-semibold">Enable Customer Manual Offer Increase</Label>
                            <p className="text-xs text-muted-foreground">Shows &quot;Increase Offer&quot; bottom sheet on customer screen</p>
                        </div>
                        <Switch
                            checked={settings.enableManualOfferIncrease}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enableManualOfferIncrease: v }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Offer Delay Time (Seconds)</Label>
                            <p className="text-xs text-muted-foreground">Wait time before &quot;Increase Offer&quot; button appears</p>
                            <Input
                                type="number"
                                value={settings.offerDelaySeconds}
                                onChange={(e) => setSettings((s) => ({ ...s, offerDelaySeconds: Number(e.target.value) }))}
                                min={0}
                                max={300}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Matching Timeout (Minutes)</Label>
                            <p className="text-xs text-muted-foreground">Auto-cancel booking if no Pujari accepts in time</p>
                            <Input
                                type="number"
                                value={settings.matchingTimeoutMinutes}
                                onChange={(e) => setSettings((s) => ({ ...s, matchingTimeoutMinutes: Number(e.target.value) }))}
                                min={1}
                                max={120}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Timeout After Pujari Acceptance</Label>
                            <p className="text-xs text-muted-foreground">Customer must pay within this window after a pujari accepts; otherwise the booking auto-cancels and the pujari is released.</p>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                value={PAYMENT_TIMEOUT_PRESETS.includes(settings.paymentTimeoutSec) ? String(settings.paymentTimeoutSec) : "custom"}
                                onChange={(e) => { const v = e.target.value; if (v !== "custom") setSettings((s) => ({ ...s, paymentTimeoutSec: Number(v) })); }}
                            >
                                <option value="30">30 seconds</option>
                                <option value="60">1 minute</option>
                                <option value="120">2 minutes</option>
                                <option value="300">5 minutes</option>
                                <option value="600">10 minutes</option>
                                <option value="900">15 minutes</option>
                                <option value="1800">30 minutes</option>
                                <option value="3000">50 minutes</option>
                                {!PAYMENT_TIMEOUT_PRESETS.includes(settings.paymentTimeoutSec) && (
                                    <option value="custom">Custom: {settings.paymentTimeoutSec}s</option>
                                )}
                            </select>
                            <p className="text-[11px] text-muted-foreground">Currently active: {settings.paymentTimeoutSec} seconds</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Max Increase Limit per Booking (₹)</Label>
                            <p className="text-xs text-muted-foreground">Maximum total manual increase allowed</p>
                            <Input
                                type="number"
                                value={settings.maxManualIncreaseLimit}
                                onChange={(e) => setSettings((s) => ({ ...s, maxManualIncreaseLimit: Number(e.target.value) }))}
                                min={10}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 self-center pt-5">
                            <div>
                                <Label>Allow Custom Amount Input</Label>
                                <p className="text-xs text-muted-foreground">Customer can type custom amount</p>
                            </div>
                            <Switch
                                checked={settings.allowCustomAmount}
                                onCheckedChange={(v) => setSettings((s) => ({ ...s, allowCustomAmount: v }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Quick Increase Amounts (Comma separated)</Label>
                        <p className="text-xs text-muted-foreground">Values shown as quick buttons to customer (e.g. 10, 20, 40, 50, 100)</p>
                        <Input
                            value={quickInputStr}
                            onChange={(e) => setQuickInputStr(e.target.value)}
                            placeholder="10, 20, 40, 50, 100"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-slate-800">Auto Acceptance Increment (Legacy System)</CardTitle>
                    <CardDescription>
                        System automatically increases price on a timer. Default is OFF.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label className="font-semibold text-slate-900">Enable Auto Acceptance Increment</Label>
                            <p className="text-xs text-muted-foreground">
                                ⚠️ When OFF (Default), price DOES NOT increase automatically via timer.
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableAutoAcceptanceIncrement}
                            onCheckedChange={(v) => setSettings((s) => ({ ...s, enableAutoAcceptanceIncrement: v }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Pricing Settings
                </Button>
            </div>
        </div>
    );
}
