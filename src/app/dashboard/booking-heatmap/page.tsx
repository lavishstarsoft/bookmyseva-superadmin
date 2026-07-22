"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Circle } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import { Flame, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { deliveryZonesApi } from "@/api/deliveryZones";
import { toast } from "sonner";

const mapContainerStyle = { width: "100%", height: "560px", borderRadius: "8px" };

function intensityColor(count: number, maxCount: number) {
    const max = Math.max(1, maxCount || 1);
    const t = Math.min(1, Math.max(0, count / max));
    if (t < 0.33) return "#FBBF24";
    if (t < 0.66) return "#F97316";
    return "#DC2626";
}

function circleRadiusMeters(count: number, maxCount: number) {
    const max = Math.max(1, maxCount || 1);
    const t = Math.min(1, Math.max(0, count / max));
    return Math.round(180 + t * 720);
}

function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(from), to: fmt(to) };
}

interface Cell {
    lat: number;
    lng: number;
    count: number;
    byStatus?: Record<string, number>;
}

export default function BookingHeatMapPage() {
    const { isLoaded, loadError } = useGoogleMaps();
    const range = useMemo(() => defaultRange(), []);
    const [from, setFrom] = useState(range.from);
    const [to, setTo] = useState(range.to);
    const [zoneId, setZoneId] = useState("all");
    const [mode, setMode] = useState("demand"); // demand | searching | completed
    const [cellSize, setCellSize] = useState("0.01");
    const [zones, setZones] = useState<any[]>([]);
    const [cells, setCells] = useState<Cell[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        deliveryZonesApi
            .getAll({ category: "pujari", status: "active" })
            .then((data) => setZones(data.zones || []))
            .catch(() => setZones([]));
    }, []);

    const fetchHeat = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {
                from,
                to,
                cellSizeDeg: cellSize,
                dateField: "scheduledDate",
            };
            if (zoneId !== "all") params.zoneId = zoneId;
            if (mode === "completed") params.statuses = "completed";
            else if (mode === "searching") {
                params.statuses = "pending,awaiting_payment,pujari_assigned";
                params.matchingStatus = "searching";
            }
            // demand = default server status set

            const res = await api.get("/admin/heatmaps/bookings", { params });
            setCells(res.data?.cells || []);
            setMeta(res.data?.meta || null);
            const center = res.data?.meta?.center;
            if (center && mapRef.current) {
                mapRef.current.panTo(center);
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load heat map");
        } finally {
            setLoading(false);
        }
    }, [from, to, zoneId, mode, cellSize]);

    useEffect(() => {
        fetchHeat();
    }, [fetchHeat]);

    const maxCount = meta?.maxCount || 1;
    const center = meta?.center || { lat: 17.385, lng: 78.4867 };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Flame className="h-6 w-6 text-orange-600" />
                    Booking Heat Map
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Ops demand visualization — where bookings concentrate. Separate from live pujari tracking.
                    Read-only; does not affect matching or payments.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Filters</CardTitle>
                    <CardDescription>
                        Grid cells are ~{Number(cellSize) * 111} km across (approx) at equator scale.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">From</Label>
                            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">To</Label>
                            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Zone</Label>
                            <Select value={zoneId} onValueChange={setZoneId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All zones" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All pujari zones</SelectItem>
                                    {zones.map((z) => (
                                        <SelectItem key={z._id} value={z._id}>
                                            {z.name || z._id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Mode</Label>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="demand">Overall demand</SelectItem>
                                    <SelectItem value="completed">Completed only</SelectItem>
                                    <SelectItem value="searching">Still searching</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Cell size</Label>
                            <Select value={cellSize} onValueChange={setCellSize}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.005">Fine (~0.5 km)</SelectItem>
                                    <SelectItem value="0.01">Default (~1 km)</SelectItem>
                                    <SelectItem value="0.02">Coarse (~2 km)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button onClick={fetchHeat} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Refresh
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            {meta ? (
                                <>
                                    <span className="font-medium text-foreground">{meta.total || 0}</span> bookings ·{" "}
                                    <span className="font-medium text-foreground">{cells.length}</span> cells · max density{" "}
                                    <span className="font-medium text-foreground">{meta.maxCount || 0}</span>
                                </>
                            ) : (
                                "—"
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    {loadError ? (
                        <p className="text-sm text-red-600 py-10 text-center">Google Maps failed to load.</p>
                    ) : !isLoaded ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center rounded-lg">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                </div>
                            )}
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={center}
                                zoom={12}
                                onLoad={(map) => {
                                    mapRef.current = map;
                                }}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: true,
                                }}
                            >
                                {cells.map((c, i) => (
                                    <Circle
                                        key={`${c.lat}-${c.lng}-${i}`}
                                        center={{ lat: c.lat, lng: c.lng }}
                                        radius={circleRadiusMeters(c.count, maxCount)}
                                        options={{
                                            fillColor: intensityColor(c.count, maxCount),
                                            fillOpacity: 0.35 + Math.min(0.4, c.count / Math.max(1, maxCount) * 0.4),
                                            strokeColor: intensityColor(c.count, maxCount),
                                            strokeOpacity: 0.7,
                                            strokeWeight: 1,
                                            clickable: true,
                                        }}
                                        onClick={() =>
                                            toast.message(`Cell density: ${c.count}`, {
                                                description: Object.entries(c.byStatus || {})
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(" · ") || undefined,
                                            })
                                        }
                                    />
                                ))}
                            </GoogleMap>
                            {!loading && cells.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground mt-4">
                                    No geo-tagged bookings in this range. Bookings need latitude/longitude on the address.
                                </p>
                            )}
                            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> Low</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Medium</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600" /> High</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
