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
    Users,
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

export default function NewPujariZonePage() {
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
        pincodes: "",
        color: "#4F46E5", // Indigo for Pujaris
        isActive: true,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const polygonRef = useRef<google.maps.Polygon | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const fetchPincodesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPincodesForShape = useCallback(async (mode: DrawingMode, polygon: Coordinate[], circle: { center: Coordinate, radius: number } | null) => {
        if (!window.google) return;
        if (!geocoderRef.current) {
            geocoderRef.current = new window.google.maps.Geocoder();
        }

        const candidatePoints: google.maps.LatLng[] = [];
        let bounds = new window.google.maps.LatLngBounds();

        if (mode === "polygon" && polygon.length >= 3) {
            polygon.forEach(p => {
                const pt = new window.google.maps.LatLng(p.lat, p.lng);
                bounds.extend(pt);
                candidatePoints.push(pt);
            });
        } else if (mode === "circle" && circle) {
            const { center, radius } = circle;
            const centerLatLng = new window.google.maps.LatLng(center.lat, center.lng);
            candidatePoints.push(centerLatLng);
            
            const north = window.google.maps.geometry.spherical.computeOffset(centerLatLng, radius, 0);
            const east = window.google.maps.geometry.spherical.computeOffset(centerLatLng, radius, 90);
            const south = window.google.maps.geometry.spherical.computeOffset(centerLatLng, radius, 180);
            const west = window.google.maps.geometry.spherical.computeOffset(centerLatLng, radius, 270);
            
            bounds.extend(north);
            bounds.extend(east);
            bounds.extend(south);
            bounds.extend(west);
        }

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const gridSteps = 10; // 10x10 grid = 100 points
        const latStep = (ne.lat() - sw.lat()) / gridSteps;
        const lngStep = (ne.lng() - sw.lng()) / gridSteps;

        let googlePolygon: google.maps.Polygon | null = null;
        if (mode === "polygon") {
            googlePolygon = new window.google.maps.Polygon({ paths: polygon });
        }

        for (let i = 0; i <= gridSteps; i++) {
            for (let j = 0; j <= gridSteps; j++) {
                const pt = new window.google.maps.LatLng(
                    sw.lat() + i * latStep,
                    sw.lng() + j * lngStep
                );
                
                if (mode === "polygon" && googlePolygon) {
                    if (window.google.maps.geometry.poly.containsLocation(pt, googlePolygon)) {
                        candidatePoints.push(pt);
                    }
                } else if (mode === "circle" && circle) {
                    const centerLatLng = new window.google.maps.LatLng(circle.center.lat, circle.center.lng);
                    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(pt, centerLatLng);
                    if (distance <= circle.radius) {
                        candidatePoints.push(pt);
                    }
                }
            }
        }

        if (candidatePoints.length === 0) return;

        toast.info(`Scanning ${candidatePoints.length} points for high-accuracy pincodes...`);
        
        try {
            const geocoder = geocoderRef.current;
            const newPincodes = new Set<string>();

            const batchSize = 5;
            for (let i = 0; i < candidatePoints.length; i += batchSize) {
                const batch = candidatePoints.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(point => 
                        new Promise<void>((resolve) => {
                            geocoder.geocode({ location: point }, (results, status) => {
                                if (status === "OK" && results) {
                                    for (const result of results) {
                                        const postalComponent = result.address_components.find(c => c.types.includes("postal_code"));
                                        if (postalComponent) {
                                            newPincodes.add(postalComponent.long_name);
                                            break;
                                        }
                                    }
                                }
                                resolve();
                            });
                        })
                    )
                );
                
                if (i + batchSize < candidatePoints.length) {
                    await new Promise(r => setTimeout(r, 400));
                }
            }

            if (newPincodes.size > 0) {
                setFormData(prev => {
                    const existingPincodes = prev.pincodes.split(',').map(p => p.trim()).filter(p => p !== "");
                    const combined = new Set([...existingPincodes, ...Array.from(newPincodes)]);
                    return {
                        ...prev,
                        pincodes: Array.from(combined).join(", ")
                    };
                });
                toast.success(`Found ${newPincodes.size} new exact pincode(s)!`);
            } else {
                toast.warning("No pincodes found in this area.");
            }
        } catch (error) {
            console.error("Geocoding failed", error);
            toast.error("Failed to fetch some pincodes.");
        }
    }, []);

    const triggerPincodeFetch = useCallback((mode: DrawingMode, polygon: Coordinate[], circle: { center: Coordinate, radius: number } | null) => {
        if (fetchPincodesTimeoutRef.current) {
            clearTimeout(fetchPincodesTimeoutRef.current);
        }
        fetchPincodesTimeoutRef.current = setTimeout(() => {
            fetchPincodesForShape(mode, polygon, circle);
        }, 1500); // 1.5s debounce
    }, [fetchPincodesForShape]);

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
                        const newRadius = circleRef.current.getRadius();
                        setCurrentCircle((prev) => {
                            const updated = prev ? { ...prev, radius: newRadius } : null;
                            if (updated) triggerPincodeFetch("circle", [], updated);
                            return updated;
                        });
                    }
                });

                marker.addListener("dragend", () => {
                    if (circleRef.current && marker.getPosition()) {
                        const pos = marker.getPosition()!;
                        circleRef.current.setCenter(pos);
                        setCurrentCircle((prev) => {
                            const updated = prev ? { ...prev, center: { lat: pos.lat(), lng: pos.lng() } } : null;
                            if (updated) triggerPincodeFetch("circle", [], updated);
                            return updated;
                        });
                    }
                });
            }
        },
        [drawingMode, currentPolygon, formData.color, triggerPincodeFetch]
    );

    const updatePolygonFromMarkers = () => {
        const points = markersRef.current.map((marker) => {
            const pos = marker.getPosition()!;
            return { lat: pos.lat(), lng: pos.lng() };
        });
        setCurrentPolygon(points);

        if (polygonRef.current && points.length >= 3) {
            polygonRef.current.setPath(points);
            triggerPincodeFetch("polygon", points, null);
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

        const pincodeArray = formData.pincodes.split(',').map(p => p.trim()).filter(p => p !== "");

        setSaving(true);

        try {
            await deliveryZonesApi.create({
                name: formData.name.trim(),
                description: formData.description.trim(),
                type: drawingMode || 'polygon',
                coordinates: drawingMode === "polygon" ? currentPolygon : [],
                center: drawingMode === "circle" ? currentCircle?.center : undefined,
                radius: drawingMode === "circle" ? currentCircle?.radius : undefined,
                color: formData.color,
                pincodes: pincodeArray,
                category: 'pujari',
                isActive: formData.isActive,
            });

            toast.success("Pujari zone created successfully!");
            router.push("/dashboard/pujari-zones");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create zone");
        } finally {
            setSaving(false);
        }
    };

    if (loadError) {
        return (
            <Card className="m-6">
                <CardContent className="py-10 text-center text-destructive">
                    Failed to load Google Maps.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-0 pb-24 w-full">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/pujari-zones">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Dashboard / Pujari Zones / New</div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Create Pujari Zone</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSave} size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                            Create Zone
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-3">
                    {isLoaded && (
                        <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={onPlaceSelected}>
                            <Input placeholder="Search location..." className="h-11" />
                        </Autocomplete>
                    )}

                    <Card className="border-border shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <Button variant={drawingMode === "polygon" ? "default" : "outline"} size="sm" onClick={() => startDrawing("polygon")}>
                                <Pentagon className="mr-1.5 h-4 w-4" /> Polygon
                            </Button>
                            <Button variant={drawingMode === "circle" ? "default" : "outline"} size="sm" onClick={() => startDrawing("circle")}>
                                <Circle className="mr-1.5 h-4 w-4" /> Circle
                            </Button>
                            {drawingMode && (
                                <>
                                    <div className="h-6 w-px bg-border mx-1" />
                                    <Button variant="outline" size="sm" onClick={clearDrawing}><Trash2 className="mr-1.5 h-4 w-4" /> Clear</Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-md h-[500px]">
                        {isLoaded && (
                            <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={12} onLoad={onMapLoad} onClick={handleMapClick}>
                                {/* Existing drawings are handled via refs in handleMapClick */}
                            </GoogleMap>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-indigo-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4" />
                                <CardTitle className="text-base">Zone Info</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Zone Name *</Label>
                                <Input placeholder="e.g., Gachibowli Zone" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea placeholder="Zone details..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label>Pincodes (Comma separated)</Label>
                                <Input placeholder="500032, 500081..." value={formData.pincodes} onChange={(e) => setFormData({...formData, pincodes: e.target.value})} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Active Status</Label>
                                <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({...formData, isActive: checked})} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-purple-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <Palette className="w-4 h-4" />
                                <CardTitle className="text-base">Appearance</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Label>Zone Color</Label>
                            <div className="flex items-center gap-3 mt-2">
                                <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-10 h-10 cursor-pointer" />
                                <Input value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="font-mono h-10" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
