"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import {
    Plus,
    Search,
    MapPin,
    Users,
    Trash2,
    Pencil,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Eye,
    Pentagon,
    Circle,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { deliveryZonesApi, DeliveryZone } from "@/api/deliveryZones";
import { toast } from "sonner";

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0 0 8px 8px",
};

const defaultCenter = { lat: 17.385, lng: 78.4867 };

export default function PujariZonesPage() {
    const router = useRouter();
    const { isLoaded } = useGoogleMaps();
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const overlaysRef = useRef<(google.maps.Polygon | google.maps.Circle)[]>([]);

    const fetchZones = async () => {
        try {
            setLoading(true);
            const params: any = { category: 'pujari' };
            if (search) params.search = search;
            if (statusFilter !== "all") params.status = statusFilter;
            const data = await deliveryZonesApi.getAll(params);
            setZones(data.zones || []);
        } catch {
            toast.error("Failed to load pujari zones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchZones(), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Render all zones on the map
    useEffect(() => {
        if (!mapRef.current || !window.google || loading) return;

        // Clear existing overlays
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        zones.forEach((zone) => {
            const color = zone.color || "#4F46E5"; // Indigo for Pujaris

            if (zone.type === "polygon" && zone.coordinates?.length >= 3) {
                const polygon = new window.google.maps.Polygon({
                    paths: zone.coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
                    strokeColor: color,
                    strokeOpacity: zone.isActive ? 0.8 : 0.3,
                    strokeWeight: 2,
                    fillColor: color,
                    fillOpacity: zone.isActive ? 0.25 : 0.08,
                    map: mapRef.current,
                });

                polygon.addListener("click", () => {
                    router.push(`/dashboard/pujari-zones/edit/${zone._id}`);
                });

                overlaysRef.current.push(polygon);

                zone.coordinates.forEach((c) => {
                    bounds.extend({ lat: c.lat, lng: c.lng });
                    hasPoints = true;
                });
            } else if (zone.type === "circle" && zone.center && zone.radius) {
                const circle = new window.google.maps.Circle({
                    center: zone.center,
                    radius: zone.radius,
                    strokeColor: color,
                    strokeOpacity: zone.isActive ? 0.8 : 0.3,
                    strokeWeight: 2,
                    fillColor: color,
                    fillOpacity: zone.isActive ? 0.25 : 0.08,
                    map: mapRef.current,
                });

                circle.addListener("click", () => {
                    router.push(`/dashboard/pujari-zones/edit/${zone._id}`);
                });

                overlaysRef.current.push(circle);

                bounds.extend(zone.center);
                hasPoints = true;
            }
        });

        if (hasPoints) {
            mapRef.current.fitBounds(bounds, 50);
        }
    }, [zones, loading, isLoaded]);

    const focusOnZone = (zone: DeliveryZone) => {
        if (!mapRef.current || !window.google) return;

        if (zone.type === "polygon" && zone.coordinates?.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            zone.coordinates.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
            mapRef.current.fitBounds(bounds, 50);
        } else if (zone.type === "circle" && zone.center) {
            mapRef.current.setCenter(zone.center);
            mapRef.current.setZoom(13);
        }
    };

    const handleToggle = async (zone: DeliveryZone) => {
        try {
            await deliveryZonesApi.update(zone._id!, { isActive: !zone.isActive });
            toast.success(`Zone ${zone.isActive ? "deactivated" : "activated"}`);
            fetchZones();
        } catch {
            toast.error("Failed to update zone");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pujari zone?")) return;
        try {
            setDeletingId(id);
            await deliveryZonesApi.delete(id);
            toast.success("Zone deleted");
            fetchZones();
        } catch {
            toast.error("Failed to delete zone");
        } finally {
            setDeletingId(null);
        }
    };

    const activeZones = zones.filter((z) => z.isActive).length;

    return (
        <div className="space-y-0 pb-24 w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                            <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
                            <span>/</span>
                            <span className="text-[#8D0303] font-medium">Pujari Zones</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">
                            Pujari Delivery Zones
                        </h1>
                    </div>
                    <Link href="/dashboard/pujari-zones/new">
                        <Button size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            <Plus className="w-4 h-4 mr-1.5" /> Add Pujari Zone
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{zones.length}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Total Zones
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{activeZones}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Active Zones
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
                            <Pentagon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">
                                {zones.filter((z) => z.type === "polygon").length} /{" "}
                                {zones.filter((z) => z.type === "circle").length}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Polygon / Circle
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map Preview */}
            {isLoaded && (
                <Card className="mb-6 overflow-hidden shadow-md border-border">
                    <CardContent className="p-0 h-[350px]">
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={defaultCenter}
                            zoom={12}
                            onLoad={onMapLoad}
                            options={{
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: true,
                                zoomControl: true,
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Search & Filters */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by zone name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    {(["all", "active", "inactive"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
                                statusFilter === s
                                    ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100"
                                    : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zones List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                </div>
            ) : zones.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="font-bold text-lg mb-1">No pujari zones found</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Define service areas for pujaris to start accepting bookings.
                    </p>
                    <Link href="/dashboard/pujari-zones/new">
                        <Button size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            <Plus className="w-4 h-4 mr-1.5" /> Create Pujari Zone
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {zones.map((zone) => (
                        <Card
                            key={zone._id}
                            className={`border shadow-sm transition-all hover:shadow-md ${
                                zone.isActive
                                    ? "border-border"
                                    : "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10"
                            }`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="p-1.5 rounded-lg"
                                            style={{
                                                backgroundColor: (zone.color || "#4F46E5") + "15",
                                                color: zone.color || "#4F46E5",
                                            }}
                                        >
                                            {zone.type === "circle" ? (
                                                <Circle className="w-4 h-4" />
                                            ) : (
                                                <Pentagon className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base leading-tight">
                                                {zone.name}
                                            </h3>
                                            {zone.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {zone.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => focusOnZone(zone)}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                            title="Show on map"
                                        >
                                            <Eye className="w-4 h-4 text-blue-500" />
                                        </button>
                                        <button
                                            onClick={() => handleToggle(zone)}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                            title={zone.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {zone.isActive ? (
                                                <ToggleRight className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/pujari-zones/edit/${zone._id}`
                                                )
                                            }
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <Pencil className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(zone._id!)}
                                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                            disabled={deletingId === zone._id}
                                        >
                                            {deletingId === zone._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Zone type badge */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border capitalize"
                                        style={{
                                            backgroundColor: (zone.color || "#4F46E5") + "12",
                                            color: zone.color || "#4F46E5",
                                            borderColor: (zone.color || "#4F46E5") + "30",
                                        }}
                                    >
                                        {zone.type === "circle" ? (
                                            <Circle className="w-3 h-3" />
                                        ) : (
                                            <Pentagon className="w-3 h-3" />
                                        )}
                                        {zone.type || "polygon"}
                                    </span>
                                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-md border border-indigo-100">
                                        Pujari Service
                                    </span>
                                </div>

                                {/* Zone details */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 text-center">
                                        <div className="text-lg font-black">
                                            {zone.pincodes?.length || 0}
                                        </div>
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Pincodes Linked
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5 text-center">
                                        <div className="text-lg font-black uppercase">
                                            {zone.type}
                                        </div>
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Zone Type
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
