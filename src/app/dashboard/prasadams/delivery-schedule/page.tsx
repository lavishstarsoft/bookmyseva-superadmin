"use client";

import { useState, useEffect } from "react";
import {
    Calendar, Clock, Save, Plus, Trash2, Eye, EyeOff, Search,
    Truck, Settings2, CheckCircle2, XCircle, AlertCircle, Cookie
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { prasadamsApi, Prasadam, PrasadamTimeSlot, PrasadamDeliveryConfig } from "@/api/prasadams";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
];

const DEFAULT_TIME_SLOTS = [
    { id: 'delivery_morning', label: '8 AM – 11 AM', active: true },
    { id: 'delivery_mid', label: '11 AM – 2 PM', active: true },
    { id: 'delivery_afternoon', label: '2 PM – 5 PM', active: true }
];

export default function PrasadamDeliverySchedule() {
    const [prasadams, setPrasadams] = useState<Prasadam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState<string | null>(null);

    // Edit dialog state
    const [editingPrasadam, setEditingPrasadam] = useState<Prasadam | null>(null);
    const [editConfig, setEditConfig] = useState<PrasadamDeliveryConfig>({
        timeSlots: DEFAULT_TIME_SLOTS,
        leadDays: 1,
        maxAdvanceDays: 7,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    });

    // New time slot dialog
    const [showNewSlotDialog, setShowNewSlotDialog] = useState(false);
    const [newSlotLabel, setNewSlotLabel] = useState("");

    useEffect(() => {
        fetchPrasadams();
    }, []);

    const fetchPrasadams = async () => {
        try {
            setLoading(true);
            const response = await prasadamsApi.getAllAdmin();
            setPrasadams(Array.isArray(response) ? response : []);
        } catch (error) {
            toast.error("Failed to load prasadams");
            console.error("Error loading prasadams:", error);
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (prasadam: Prasadam) => {
        setEditingPrasadam(prasadam);

        // Set edit config with existing delivery config or defaults
        const config = prasadam.deliveryConfig || {
            timeSlots: DEFAULT_TIME_SLOTS,
            leadDays: 1,
            maxAdvanceDays: 7,
            availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        };

        setEditConfig({
            ...config,
            timeSlots: config.timeSlots || DEFAULT_TIME_SLOTS,
            availableDays: config.availableDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        });
    };

    const handleSaveDeliveryConfig = async () => {
        if (!editingPrasadam?._id) return;

        try {
            setSaving(editingPrasadam._id);

            await prasadamsApi.update(editingPrasadam._id, {
                deliveryConfig: editConfig
            });

            toast.success("Delivery schedule updated successfully");
            setEditingPrasadam(null);
            fetchPrasadams();
        } catch (error) {
            toast.error("Failed to update delivery schedule");
            console.error("Error updating delivery config:", error);
        } finally {
            setSaving(null);
        }
    };

    const addTimeSlot = () => {
        if (!newSlotLabel.trim()) {
            toast.error("Please enter a time slot label");
            return;
        }

        const newSlot: PrasadamTimeSlot = {
            id: `slot_${Date.now()}`,
            label: newSlotLabel.trim(),
            active: true
        };

        setEditConfig(prev => ({
            ...prev,
            timeSlots: [...(prev.timeSlots || []), newSlot]
        }));

        setNewSlotLabel("");
        setShowNewSlotDialog(false);
        toast.success("Time slot added");
    };

    const removeTimeSlot = (slotId: string) => {
        setEditConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots?.filter(slot => slot.id !== slotId) || []
        }));
        toast.success("Time slot removed");
    };

    const toggleTimeSlot = (slotId: string) => {
        setEditConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots?.map(slot =>
                slot.id === slotId ? { ...slot, active: !slot.active } : slot
            ) || []
        }));
    };

    const toggleAvailableDay = (day: string) => {
        setEditConfig(prev => {
            const currentDays = prev.availableDays || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];

            return {
                ...prev,
                availableDays: newDays
            };
        });
    };

    const filteredPrasadams = prasadams.filter(prasadam =>
        prasadam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prasadam.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDeliveryStatus = (prasadam: Prasadam) => {
        const config = prasadam.deliveryConfig;
        if (!config) return { status: 'not-configured', label: 'Not Configured', color: 'bg-gray-100 text-gray-800' };

        const activeSlots = config.timeSlots?.filter(slot => slot.active).length || 0;
        const availableDays = config.availableDays?.length || 0;

        if (activeSlots === 0 || availableDays === 0) {
            return { status: 'incomplete', label: 'Incomplete', color: 'bg-amber-100 text-amber-800' };
        }

        return { status: 'configured', label: 'Configured', color: 'bg-green-100 text-green-800' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D0303] mx-auto"></div>
                    <p className="text-muted-foreground">Loading prasadam delivery schedules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Truck className="w-8 h-8 text-blue-600" />
                        Prasadam Delivery Schedule
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure delivery time slots and availability for prasadam orders.
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search prasadams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Prasadams List */}
            <div className="grid gap-4">
                {filteredPrasadams.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12 text-muted-foreground">
                                <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>{searchTerm ? "No prasadams found matching your search." : "No prasadams available."}</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredPrasadams.map((prasadam) => {
                        const deliveryStatus = getDeliveryStatus(prasadam);
                        const config = prasadam.deliveryConfig;
                        const activeSlotsCount = config?.timeSlots?.filter(slot => slot.active).length || 0;
                        const availableDaysCount = config?.availableDays?.length || 0;

                        return (
                            <Card key={prasadam._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {prasadam.image ? (
                                                    <img
                                                        src={prasadam.image}
                                                        alt={prasadam.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Cookie className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg truncate">{prasadam.title}</h3>
                                                    {!prasadam.isActive && (
                                                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground capitalize mb-3">
                                                    {prasadam.category} • ₹{prasadam.basePrice}
                                                </p>
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    <Badge className={deliveryStatus.color}>
                                                        {deliveryStatus.label}
                                                    </Badge>
                                                    {config && (
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {activeSlotsCount} Time Slots
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {availableDaysCount} Days Available
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Truck className="w-3 h-3" />
                                                                Lead: {config.leadDays} days
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => openEditDialog(prasadam)}
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            <Settings2 className="w-4 h-4 mr-2" />
                                            Configure
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Edit Delivery Config Dialog */}
            <Dialog open={!!editingPrasadam} onOpenChange={(open) => !open && setEditingPrasadam(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            Configure Delivery Schedule
                        </DialogTitle>
                        <DialogDescription>
                            Set up delivery time slots and availability for "{editingPrasadam?.title}"
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="slots" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="slots">Time Slots</TabsTrigger>
                            <TabsTrigger value="schedule">Schedule Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="slots" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Delivery Time Slots</Label>
                                <Dialog open={showNewSlotDialog} onOpenChange={setShowNewSlotDialog}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Slot
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Time Slot</DialogTitle>
                                            <DialogDescription>Create a new delivery time slot</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div>
                                                <Label htmlFor="slot-label">Time Slot Label</Label>
                                                <Input
                                                    id="slot-label"
                                                    placeholder="e.g., 5 PM – 8 PM"
                                                    value={newSlotLabel}
                                                    onChange={(e) => setNewSlotLabel(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowNewSlotDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={addTimeSlot}>Add Slot</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="space-y-3">
                                {editConfig.timeSlots?.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={slot.active}
                                                onCheckedChange={() => toggleTimeSlot(slot.id)}
                                            />
                                            <div className="flex items-center gap-2">
                                                {slot.active ? (
                                                    <Eye className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                                )}
                                                <span className={slot.active ? "font-medium" : "text-muted-foreground"}>
                                                    {slot.label}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTimeSlot(slot.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {editConfig.timeSlots?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No time slots configured. Add a time slot to get started.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="lead-days">Lead Days</Label>
                                    <Input
                                        id="lead-days"
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={editConfig.leadDays}
                                        onChange={(e) => setEditConfig(prev => ({
                                            ...prev,
                                            leadDays: parseInt(e.target.value) || 0
                                        }))}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Minimum days before delivery
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="max-advance-days">Max Advance Days</Label>
                                    <Input
                                        id="max-advance-days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={editConfig.maxAdvanceDays}
                                        onChange={(e) => setEditConfig(prev => ({
                                            ...prev,
                                            maxAdvanceDays: parseInt(e.target.value) || 7
                                        }))}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Maximum days in advance to book
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-base font-semibold">Available Days</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Select which days of the week delivery is available
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <div
                                            key={day.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                editConfig.availableDays?.includes(day.id)
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() => toggleAvailableDay(day.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{day.label}</span>
                                                {editConfig.availableDays?.includes(day.id) && (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPrasadam(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDeliveryConfig}
                            disabled={saving === editingPrasadam?._id}
                        >
                            {saving === editingPrasadam?._id ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}