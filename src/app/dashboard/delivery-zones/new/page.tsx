"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import { deliveryZonesApi, type Coordinate } from "@/api/deliveryZones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    ChevronLeft,
    Save,
    Loader2,
    Pentagon,
    Circle,
    Undo2,
    Trash2,
    MapPin,
    MousePointerClick,
    Truck,
    Palette,
    Info,
} from "lucide-react";
import Link from "next/link";

type DrawingMode = "polygon" | "circle" | null;

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "500px",
    borderRadius: "0 0 8px 8px",
};

const defaultCenter = { lat: 17.385, lng: 78.4867 }; // Hyderabad

export default function NewDeliveryZonePage() {
    const router = useRouter();
    const { isLoaded, loadError } = useGoogleMaps();

    const [saving, setSaving] = useState(false);
    const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
    const [currentPolygon, setCurrentPolygon] = useState<Coordinate[]>([]);
    const [currentCircle, setCurrentCircle] = useState<{
        center: Coordinate;
        radius: number;
    } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        deliveryCharge: 0,
        minOrderValue: 0,
        freeDeliveryAbove: 0,
        estimatedDays: "2-3 days",
        color: "#8D0303",
        isActive: true,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const polygonRef = useRef<google.maps.Polygon | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const handleMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (!e.latLng || !mapRef.current || !window.google) return;

            const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (drawingMode === "polygon") {
                const marker = new window.google.maps.Marker({
                    position: e.latLng,
                    map: mapRef.current,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: formData.color,
                        fillOpacity: 1,
                        strokeColor: "#fff",
                        strokeWeight: 2,
                    },
                    draggable: true,
                    label: {
                        text: String(markersRef.current.length + 1),
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: "bold",
                    },
                });

                marker.addListener("dragend", () => {
                    updatePolygonFromMarkers();
                });

                markersRef.current.push(marker);

                const newPolygon = [...currentPolygon, point];
                setCurrentPolygon(newPolygon);

                if (polygonRef.current) {
                    polygonRef.current.setPath(
                        newPolygon.map((p) => ({ lat: p.lat, lng: p.lng }))
                    );
                } else if (newPolygon.length >= 3) {
                    polygonRef.current = new window.google.maps.Polygon({
                        paths: newPolygon.map((p) => ({ lat: p.lat, lng: p.lng })),
                        strokeColor: formData.color,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: formData.color,
                        fillOpacity: 0.25,
                        map: mapRef.current,
                        editable: false,
                    });
                }
            } else if (drawingMode === "circle") {
                clearDrawing();

                const marker = new window.google.maps.Marker({
                    position: e.latLng,
                    map: mapRef.current,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: formData.color,
                        fillOpacity: 1,
                        strokeColor: "#fff",
                        strokeWeight: 2,
                    },
                    draggable: true,
                });

                markersRef.current.push(marker);

                const radius = 2000;
                setCurrentCircle({ center: point, radius });

                circleRef.current = new window.google.maps.Circle({
                    center: e.latLng,
                    radius: radius,
                    strokeColor: formData.color,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: formData.color,
                    fillOpacity: 0.25,
                    map: mapRef.current,
                    editable: true,
                });

                circleRef.current.addListener("radius_changed", () => {
                    if (circleRef.current) {
                        setCurrentCircle((prev) =>
                            prev
                                ? { ...prev, radius: circleRef.current!.getRadius() }
                                : null
                        );
                    }
                });

                marker.addListener("dragend", () => {
                    if (circleRef.current && marker.getPosition()) {
                        circleRef.current.setCenter(marker.getPosition()!);
                        const pos = marker.getPosition()!;
                        setCurrentCircle((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      center: { lat: pos.lat(), lng: pos.lng() },
                                  }
                                : null
                        );
                    }
                });
            }
        },
        [drawingMode, currentPolygon, formData.color]
    );

    const updatePolygonFromMarkers = () => {
        const points = markersRef.current.map((marker) => {
            const pos = marker.getPosition()!;
            return { lat: pos.lat(), lng: pos.lng() };
        });
        setCurrentPolygon(points);

        if (polygonRef.current && points.length >= 3) {
            polygonRef.current.setPath(points);
        }
    };

    const clearDrawing = () => {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (polygonRef.current) {
            polygonRef.current.setMap(null);
            polygonRef.current = null;
        }

        if (circleRef.current) {
            circleRef.current.setMap(null);
            circleRef.current = null;
        }

        setCurrentPolygon([]);
        setCurrentCircle(null);
    };

    const startDrawing = (mode: DrawingMode) => {
        clearDrawing();
        setDrawingMode(mode);
    };

    const cancelDrawing = () => {
        clearDrawing();
        setDrawingMode(null);
    };

    const undoLastPoint = () => {
        if (currentPolygon.length === 0) return;

        const lastMarker = markersRef.current.pop();
        if (lastMarker) lastMarker.setMap(null);

        const newPolygon = currentPolygon.slice(0, -1);
        setCurrentPolygon(newPolygon);

        if (polygonRef.current) {
            if (newPolygon.length < 3) {
                polygonRef.current.setMap(null);
                polygonRef.current = null;
            } else {
                polygonRef.current.setPath(newPolygon);
            }
        }
    };

    const onPlaceSelected = () => {
        if (autocompleteRef.current && mapRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                mapRef.current.setCenter(place.geometry.location);
                mapRef.current.setZoom(15);
            }
        }
    };

    // Update polygon/circle color when form color changes
    useEffect(() => {
        if (!window.google) return;
        if (polygonRef.current) {
            polygonRef.current.setOptions({
                strokeColor: formData.color,
                fillColor: formData.color,
            });
        }
        if (circleRef.current) {
            circleRef.current.setOptions({
                strokeColor: formData.color,
                fillColor: formData.color,
            });
        }
        markersRef.current.forEach((marker) => {
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: formData.color,
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
            });
        });
    }, [formData.color]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Zone name is required");
            return;
        }

        if (drawingMode === "polygon" && currentPolygon.length < 3) {
            toast.error("Please draw a polygon with at least 3 points");
            return;
        }

        if (drawingMode === "circle" && !currentCircle) {
            toast.error("Please click on the map to set circle center");
            return;
        }

        if (!drawingMode) {
            toast.error("Please select a drawing mode and draw a zone on the map");
            return;
        }

        setSaving(true);

        try {
            await deliveryZonesApi.create({
                name: formData.name.trim(),
                description: formData.description.trim(),
                type: drawingMode,
                coordinates: drawingMode === "polygon" ? currentPolygon : [],
                center:
                    drawingMode === "circle" ? currentCircle?.center : undefined,
                radius:
                    drawingMode === "circle" ? currentCircle?.radius : undefined,
                color: formData.color,
                deliveryCharge: formData.deliveryCharge,
                minOrderValue: formData.minOrderValue,
                freeDeliveryAbove: formData.freeDeliveryAbove || null,
                estimatedDays: formData.estimatedDays,
                isActive: formData.isActive,
            });

            toast.success("Delivery zone created successfully!");
            router.push("/dashboard/delivery-zones");
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || "Failed to create zone"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loadError) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/delivery-zones">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Create Delivery Zone</h1>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-16">
                        <p className="text-destructive">
                            Failed to load Google Maps. Please check your API key.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-0 pb-24 w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/delivery-zones">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-muted"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                                <span>Dashboard</span>
                                <span>/</span>
                                <span>Delivery Zones</span>
                                <span>/</span>
                                <span className="text-[#8D0303] font-medium">New</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">
                                Create Delivery Zone
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-[#8D0303] hover:bg-[#700202] text-white"
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-1.5" />
                            )}
                            Create Zone
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content - Map + Form */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Map Section */}
                <div className="lg:col-span-3 space-y-3">
                    {/* Search Bar */}
                    {isLoaded && (
                        <Autocomplete
                            onLoad={(autocomplete) => {
                                autocompleteRef.current = autocomplete;
                            }}
                            onPlaceChanged={onPlaceSelected}
                        >
                            <Input
                                type="text"
                                placeholder="Search for a location..."
                                className="w-full h-11"
                            />
                        </Autocomplete>
                    )}

                    {/* Drawing Tools */}
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-muted-foreground mr-1">
                                    Draw:
                                </span>
                                <Button
                                    variant={
                                        drawingMode === "polygon" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => startDrawing("polygon")}
                                    className={
                                        drawingMode === "polygon"
                                            ? "bg-[#8D0303] hover:bg-[#700202]"
                                            : ""
                                    }
                                >
                                    <Pentagon className="mr-1.5 h-4 w-4" />
                                    Polygon
                                </Button>
                                <Button
                                    variant={
                                        drawingMode === "circle" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => startDrawing("circle")}
                                    className={
                                        drawingMode === "circle"
                                            ? "bg-[#8D0303] hover:bg-[#700202]"
                                            : ""
                                    }
                                >
                                    <Circle className="mr-1.5 h-4 w-4" />
                                    Circle
                                </Button>

                                {drawingMode && (
                                    <>
                                        <div className="h-6 w-px bg-border mx-1" />
                                        {drawingMode === "polygon" &&
                                            currentPolygon.length > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={undoLastPoint}
                                                >
                                                    <Undo2 className="mr-1.5 h-4 w-4" />
                                                    Undo
                                                </Button>
                                            )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearDrawing}
                                        >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Clear
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelDrawing}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Drawing Instructions */}
                    {drawingMode && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                            <MousePointerClick className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                {drawingMode === "polygon" ? (
                                    <>
                                        <strong>Polygon Mode:</strong> Click on the map
                                        to add boundary points. Need at least 3 points.
                                        Drag markers to adjust.
                                        {currentPolygon.length > 0 && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                                {currentPolygon.length} point
                                                {currentPolygon.length !== 1 && "s"}
                                                {currentPolygon.length < 3 &&
                                                    ` (need ${3 - currentPolygon.length} more)`}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <strong>Circle Mode:</strong> Click to set
                                        center. Drag edge to resize.
                                        {currentCircle && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                                {(currentCircle.radius / 1000).toFixed(2)}{" "}
                                                km radius
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {!drawingMode && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Select <strong>Polygon</strong> or{" "}
                                <strong>Circle</strong> above to start drawing a
                                delivery zone on the map.
                            </p>
                        </div>
                    )}

                    {/* Map */}
                    <Card className="overflow-hidden shadow-md border-border">
                        <CardContent className="p-0 h-[500px]">
                            {!isLoaded ? (
                                <div className="flex items-center justify-center h-full bg-muted/30">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">
                                        Loading map...
                                    </span>
                                </div>
                            ) : (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={defaultCenter}
                                    zoom={12}
                                    onLoad={onMapLoad}
                                    onClick={handleMapClick}
                                    options={{
                                        mapTypeControl: true,
                                        streetViewControl: false,
                                        fullscreenControl: true,
                                        zoomControl: true,
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Form Panel */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Zone Details */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                        Zone Details
                                    </h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">
                                        Name & Description
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">
                                    Zone Name *
                                </Label>
                                <Input
                                    placeholder="e.g., Hyderabad Central"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">
                                    Description
                                </Label>
                                <Textarea
                                    placeholder="Optional zone description..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Settings */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-orange-500 to-orange-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                        Delivery Settings
                                    </h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">
                                        Charges & Timing
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Delivery Fee (₹)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                            ₹
                                        </span>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="pl-8 h-11 font-bold"
                                            value={formData.deliveryCharge}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    deliveryCharge:
                                                        parseFloat(e.target.value) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Min Order (₹)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                            ₹
                                        </span>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="pl-8 h-11"
                                            value={formData.minOrderValue}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    minOrderValue:
                                                        parseFloat(e.target.value) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Free Delivery Above (₹)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                        ₹
                                    </span>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0 = no free delivery"
                                        className="pl-8 h-11"
                                        value={formData.freeDeliveryAbove}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                freeDeliveryAbove:
                                                    parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Orders above this amount get free delivery
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Estimated Delivery Time
                                </Label>
                                <Input
                                    placeholder="e.g., 2-3 days"
                                    value={formData.estimatedDays}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            estimatedDays: e.target.value,
                                        })
                                    }
                                    className="h-11"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance & Status */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-purple-600 to-purple-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <Palette className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                        Appearance & Status
                                    </h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">
                                        Color & Active Toggle
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">
                                    Zone Color
                                </Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                color: e.target.value,
                                            })
                                        }
                                        className="w-10 h-10 rounded cursor-pointer border border-input"
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                color: e.target.value,
                                            })
                                        }
                                        className="flex-1 font-mono h-10"
                                    />
                                    <div
                                        className="w-10 h-10 rounded-lg border border-border"
                                        style={{
                                            backgroundColor: formData.color,
                                            opacity: 0.5,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-600">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold">
                                            Zone Active
                                        </span>
                                        <p className="text-[10px] text-muted-foreground">
                                            Enable this zone for delivery
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            isActive: checked,
                                        })
                                    }
                                    className="data-[state=checked]:bg-[#8D0303]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zone Preview Summary */}
                    {((drawingMode === "polygon" && currentPolygon.length > 0) ||
                        (drawingMode === "circle" && currentCircle)) && (
                        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 shadow-md">
                            <CardContent className="py-4 px-5">
                                <div className="text-sm space-y-1.5">
                                    <p className="font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: formData.color,
                                            }}
                                        />
                                        Zone Preview
                                    </p>
                                    {drawingMode === "polygon" && (
                                        <>
                                            <p className="text-green-600 dark:text-green-400">
                                                Type: Polygon (
                                                {currentPolygon.length} points)
                                            </p>
                                            {currentPolygon.length < 3 && (
                                                <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                                                    Need at least 3 points to
                                                    save
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {drawingMode === "circle" && currentCircle && (
                                        <p className="text-green-600 dark:text-green-400">
                                            Type: Circle (Radius:{" "}
                                            {(
                                                currentCircle.radius / 1000
                                            ).toFixed(2)}{" "}
                                            km)
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
