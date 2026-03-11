"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Plus, X, Save, Loader2, Trash2, ImagePlus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { kitsApi, Kit, KitItem, KitBadges, KitShipping, KitDeliveryConfig } from "@/api/kits";
import { toast } from "sonner";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { ShieldCheck, Truck, Star, Package, UserCheck, RefreshCw, Clock, CalendarDays } from "lucide-react";

const SLOT_SUGGESTIONS = [
    { id: "morning", label: "8 AM – 11 AM" },
    { id: "midday", label: "11 AM – 2 PM" },
    { id: "afternoon", label: "2 PM – 5 PM" },
    { id: "evening", label: "5 PM – 8 PM" },
];

const PLAN_SUGGESTIONS = [
    { id: "one-time", label: "One-Time Purchase", badge: "" },
    { id: "weekly", label: "Weekly", badge: "" },
    { id: "monthly", label: "Monthly", badge: "Popular" },
    { id: "quarterly", label: "Quarterly", badge: "Save 10%" },
    { id: "half-yearly", label: "Half-Yearly", badge: "Save 15%" },
    { id: "yearly", label: "Yearly", badge: "Best Value" },
    { id: "offer", label: "Special Offer", badge: "Limited" },
];

export default function EditKitPage() {
    const router = useRouter();
    const params = useParams();
    const kitId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [category, setCategory] = useState("daily");
    const [images, setImages] = useState<string[]>([]);

    const [marketPrice, setMarketPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");

    const [items, setItems] = useState<KitItem[]>([]);
    const [newItem, setNewItem] = useState("");

    const [pricingPlans, setPricingPlans] = useState<
        { id: string; label: string; price: string; active: boolean; badge: string }[]
    >([]);

    const [showAddPlan, setShowAddPlan] = useState(false);
    const [newPlanLabel, setNewPlanLabel] = useState("");
    const [newPlanBadge, setNewPlanBadge] = useState("");

    const [badges, setBadges] = useState<KitBadges>({
        verifiedQuality: true,
        freeDelivery: true,
        premiumQuality: true,
        doorstepDelivery: true,
        panditCurated: true,
        easyCancel: true,
    });

    const toggleBadge = (key: keyof KitBadges) => {
        setBadges(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [shipping, setShipping] = useState<KitShipping>({
        freeShipping: true,
        shippingLabel: 'Free Shipping',
        deliveryText: 'Delivery in 2-3 days',
        showShipping: true,
    });

    const updateShipping = (key: keyof KitShipping, value: string | boolean) => {
        setShipping(prev => ({ ...prev, [key]: value }));
    };

    const [deliveryConfig, setDeliveryConfig] = useState<KitDeliveryConfig>({
        timeSlots: [
            { id: 'morning', label: '8 AM – 11 AM', active: true },
            { id: 'midday', label: '11 AM – 2 PM', active: true },
            { id: 'afternoon', label: '2 PM – 5 PM', active: true },
        ],
        leadDays: 0,
        maxAdvanceDays: 30,
    });

    const addTimeSlot = (id: string, label: string) => {
        if (deliveryConfig.timeSlots.some(s => s.label === label)) {
            toast.error(`"${label}" slot already exists`);
            return;
        }
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: [...prev.timeSlots, { id: id + '-' + Date.now(), label, active: true }]
        }));
    };

    const removeTimeSlot = (id: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s.id !== id)
        }));
    };

    const toggleTimeSlot = (id: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map(s => s.id === id ? { ...s, active: !s.active } : s)
        }));
    };

    const updateSlotLabel = (id: string, label: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map(s => s.id === id ? { ...s, label } : s)
        }));
    };

    useEffect(() => {
        const fetchKit = async () => {
            try {
                setLoading(true);
                const kit = await kitsApi.getById(kitId);
                setTitle(kit.title);
                setShortDescription(kit.shortDescription || "");
                setCategory(kit.category);
                setImages(kit.images?.length ? kit.images : (kit.image ? [kit.image] : []));
                setItems(kit.itemsIncluded);

                if (kit.pricingPlans && kit.pricingPlans.length > 0) {
                    setPricingPlans(kit.pricingPlans.map(p => ({
                        ...p,
                        price: p.price.toString()
                    })));
                }

                setMarketPrice(kit.marketPrice?.toString() || "");
                setOfferPrice(kit.offerPrice?.toString() || "");

                if (kit.badges) {
                    setBadges({
                        verifiedQuality: kit.badges.verifiedQuality ?? true,
                        freeDelivery: kit.badges.freeDelivery ?? true,
                        premiumQuality: kit.badges.premiumQuality ?? true,
                        doorstepDelivery: kit.badges.doorstepDelivery ?? true,
                        panditCurated: kit.badges.panditCurated ?? true,
                        easyCancel: kit.badges.easyCancel ?? true,
                    });
                }

                if (kit.shipping) {
                    setShipping({
                        freeShipping: kit.shipping.freeShipping ?? true,
                        shippingLabel: kit.shipping.shippingLabel || 'Free Shipping',
                        deliveryText: kit.shipping.deliveryText || 'Delivery in 2-3 days',
                        showShipping: kit.shipping.showShipping ?? true,
                    });
                }

                if (kit.deliveryConfig) {
                    setDeliveryConfig({
                        timeSlots: kit.deliveryConfig.timeSlots?.length
                            ? kit.deliveryConfig.timeSlots
                            : [
                                { id: 'morning', label: '8 AM – 11 AM', active: true },
                                { id: 'midday', label: '11 AM – 2 PM', active: true },
                                { id: 'afternoon', label: '2 PM – 5 PM', active: true },
                            ],
                        bookingStartDate: kit.deliveryConfig.bookingStartDate
                            ? new Date(kit.deliveryConfig.bookingStartDate).toISOString().split('T')[0]
                            : undefined,
                        bookingEndDate: kit.deliveryConfig.bookingEndDate
                            ? new Date(kit.deliveryConfig.bookingEndDate).toISOString().split('T')[0]
                            : undefined,
                        leadDays: kit.deliveryConfig.leadDays ?? 0,
                        maxAdvanceDays: kit.deliveryConfig.maxAdvanceDays ?? 30,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch kit:", error);
                toast.error("Failed to load kit details");
                router.push("/dashboard/kits");
            } finally {
                setLoading(false);
            }
        };

        if (kitId) fetchKit();
    }, [kitId, router]);

    const handleAddItem = () => {
        if (newItem.trim()) {
            setItems([...items, { id: Date.now(), text: newItem.trim() }]);
            setNewItem("");
        }
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const addPlan = (label: string, badge: string) => {
        const planId = label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        setPricingPlans([...pricingPlans, {
            id: planId,
            label,
            price: "",
            active: true,
            badge
        }]);
        setNewPlanLabel("");
        setNewPlanBadge("");
        setShowAddPlan(false);
    };

    const addSuggestedPlan = (suggestion: typeof PLAN_SUGGESTIONS[0]) => {
        if (pricingPlans.some(p => p.label === suggestion.label)) {
            toast.error(`"${suggestion.label}" plan already exists`);
            return;
        }
        setPricingPlans([...pricingPlans, {
            id: suggestion.id + '-' + Date.now(),
            label: suggestion.label,
            price: "",
            active: true,
            badge: suggestion.badge
        }]);
    };

    const removePlan = (id: string) => {
        setPricingPlans(pricingPlans.filter(p => p.id !== id));
    };

    const togglePlan = (id: string) => {
        setPricingPlans(pricingPlans.map(plan =>
            plan.id === id ? { ...plan, active: !plan.active } : plan
        ));
    };

    const updatePlanPrice = (id: string, price: string) => {
        setPricingPlans(pricingPlans.map(plan =>
            plan.id === id ? { ...plan, price } : plan
        ));
    };

    const updatePlanLabel = (id: string, label: string) => {
        setPricingPlans(pricingPlans.map(plan =>
            plan.id === id ? { ...plan, label } : plan
        ));
    };

    const updatePlanBadge = (id: string, badge: string) => {
        setPricingPlans(pricingPlans.map(plan =>
            plan.id === id ? { ...plan, badge } : plan
        ));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Please enter a kit title");
            return;
        }

        if (!category) {
            toast.error("Please select a category");
            return;
        }

        try {
            setSaving(true);

            const kitData: Partial<Kit> = {
                title: title.trim(),
                shortDescription: shortDescription.trim(),
                category,
                itemsIncluded: items.filter(item => item.text.trim() !== ""),
                image: images[0] || "",
                images: images
            };

            if (pricingPlans.length > 0) {
                kitData.pricingPlans = pricingPlans.map(p => ({
                    id: p.id,
                    label: p.label,
                    price: Number(p.price) || 0,
                    active: p.active,
                    badge: p.badge
                }));
            }

            if (marketPrice) kitData.marketPrice = Number(marketPrice) || 0;
            if (offerPrice) kitData.offerPrice = Number(offerPrice) || 0;

            kitData.badges = badges;
            kitData.shipping = shipping;
            kitData.deliveryConfig = deliveryConfig;

            await kitsApi.update(kitId, kitData);
            toast.success("Kit updated successfully!");
            router.push("/dashboard/kits");
        } catch (error: unknown) {
            console.error("Update failed:", error);

            let errorMessage = "Failed to update pooja kit";
            if (error && typeof error === "object" && "response" in error) {
                const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
                const serverMsg = axiosError.response?.data?.error || axiosError.response?.data?.message;
                const status = axiosError.response?.status;

                if (status === 401) {
                    errorMessage = "Session expired. Please login again.";
                } else if (status === 403) {
                    errorMessage = "Access denied. Admin privileges required.";
                } else if (status === 429) {
                    errorMessage = "Too many requests. Please wait and try again.";
                } else if (serverMsg) {
                    errorMessage = serverMsg;
                }
            } else if (error instanceof Error) {
                if (error.message.includes("Network Error") || error.message.includes("ECONNREFUSED")) {
                    errorMessage = "Cannot connect to server. Please check if the backend is running.";
                } else {
                    errorMessage = error.message;
                }
            }

            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const savings = marketPrice && offerPrice ? Number(marketPrice) - Number(offerPrice) : 0;

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#8D0303]" />
                <p className="text-muted-foreground animate-pulse text-lg font-medium">Fetching kit details...</p>
            </div>
        );
    }

    return (
        <div className="space-y-0 pb-24 w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/kits">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                                <span>Dashboard</span>
                                <span>/</span>
                                <span>Pooja Kits</span>
                                <span>/</span>
                                <span className="text-[#8D0303] font-medium">Edit Kit</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Edit Pooja Kit</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-[#8D0303] hover:bg-[#700202] text-white"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: Kit Identity & Visuals */}
                <div className="space-y-6">
                    {/* Basic Details */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Kit Identity</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Title & Classification</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-1.5 text-gray-700">
                                    Kit Title <span className="text-[#8D0303]">*</span>
                                </label>
                                <Input
                                    placeholder="e.g., Satyanarayana Swamy Vratham Kit"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-11 border-gray-200 focus:border-[#8D0303] focus:ring-[#8D0303]/20"
                                />
                                <p className="text-[11px] text-muted-foreground italic">Use a clear, specific name customers can search for.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Category <span className="text-[#8D0303]">*</span></label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily Pooja Kit</SelectItem>
                                        <SelectItem value="festival">Festival Pooja Kit</SelectItem>
                                        <SelectItem value="vratham">Vratham Kit</SelectItem>
                                        <SelectItem value="homam">Homam Kit</SelectItem>
                                        <SelectItem value="special">Special Occasion Kit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Short Description</label>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{shortDescription.length} / 300</span>
                                </div>
                                <Textarea
                                    placeholder="Briefly describe what this kit is for..."
                                    rows={4}
                                    maxLength={300}
                                    value={shortDescription}
                                    onChange={(e) => setShortDescription(e.target.value)}
                                    className="resize-none border-gray-200 focus:border-[#8D0303] focus:ring-[#8D0303]/20"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kit Visuals */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-amber-500 to-amber-600 py-4 px-6 text-white text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Visual Gallery</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Up to 5 High-Quality images</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                <MultiImageUpload
                                    values={images}
                                    onChange={setImages}
                                    maxImages={5}
                                    aspectRatio={1}
                                />
                                <div className="mt-4 flex items-start gap-2 text-[11px] text-amber-700 font-medium">
                                    <ImagePlus className="w-3.5 h-3.5 mt-0.5" />
                                    <p>First image will be the primary cover photo. Recommended size: 1000x1000px.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Schedule */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-purple-500 to-purple-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Delivery Schedule</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Time slots & booking dates</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {/* Time Slots */}
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Quick Add Slots</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {SLOT_SUGGESTIONS.map(slot => (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => addTimeSlot(slot.id, slot.label)}
                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer"
                                        >
                                            + {slot.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Added Slots */}
                            {deliveryConfig.timeSlots.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Active Slots</label>
                                    {deliveryConfig.timeSlots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${slot.active
                                                ? 'border-l-[3px] border-l-purple-500 border-purple-200 bg-purple-50/50'
                                                : 'border-border bg-muted/20 opacity-50'
                                                }`}
                                        >
                                            <Switch
                                                checked={slot.active}
                                                onCheckedChange={() => toggleTimeSlot(slot.id)}
                                                className="data-[state=checked]:bg-purple-600 shrink-0 scale-90"
                                            />
                                            <Input
                                                value={slot.label}
                                                onChange={(e) => updateSlotLabel(slot.id, e.target.value)}
                                                className="h-7 text-sm font-medium border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                                                placeholder="Slot label"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeTimeSlot(slot.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Custom Slot Entry */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Custom slot (e.g., 6 AM – 9 AM)"
                                    id="newSlotLabel"
                                    className="h-9 flex-1"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const input = e.target as HTMLInputElement;
                                            if (input.value.trim()) {
                                                addTimeSlot('custom-' + Date.now(), input.value.trim());
                                                input.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
                                    onClick={() => {
                                        const input = document.getElementById('newSlotLabel') as HTMLInputElement;
                                        if (input?.value.trim()) {
                                            addTimeSlot('custom-' + Date.now(), input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                            </div>

                            <hr className="border-border" />

                            {/* Booking Date Config */}
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5 block">
                                    <CalendarDays className="w-3.5 h-3.5" /> Booking Date Control
                                </label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                            <Input
                                                type="date"
                                                value={deliveryConfig.bookingStartDate || ''}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingStartDate: e.target.value || undefined }))}
                                                className="h-9 border-gray-200"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">End Date <span className="text-[10px] text-muted-foreground/60">(optional)</span></label>
                                            <Input
                                                type="date"
                                                value={deliveryConfig.bookingEndDate || ''}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingEndDate: e.target.value || undefined }))}
                                                className="h-9 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Lead Days</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={deliveryConfig.leadDays}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, leadDays: Number(e.target.value) || 0 }))}
                                                className="h-9 border-gray-200"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Min days from today (0 = same day)</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Max Advance Days</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={deliveryConfig.maxAdvanceDays}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, maxAdvanceDays: Number(e.target.value) || 30 }))}
                                                className="h-9 border-gray-200"
                                            />
                                            <p className="text-[10px] text-muted-foreground">How far ahead users can book</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Pricing & Capabilities */}
                <div className="space-y-6">
                    {/* Pricing Plans — daily only */}
                    {category === "daily" && (
                        <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">₹</div>
                                    <div>
                                        <h3 className="font-bold text-base leading-tight">Subscription Plans</h3>
                                        <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Weekly, Monthly, & Custom options</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Quick Add */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Quick Add Suggestions</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLAN_SUGGESTIONS.map(suggestion => (
                                            <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => addSuggestedPlan(suggestion)}
                                                className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#8D0303] hover:bg-[#8D0303]/5 hover:text-[#8D0303] transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3 h-3" /> {suggestion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Added Plans */}
                                {pricingPlans.length > 0 && (
                                    <div className="space-y-3">
                                        {pricingPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`p-4 rounded-xl border transition-all duration-300 ${plan.active
                                                    ? 'border-[#8D0303]/30 bg-[#8D0303]/[0.02] shadow-sm'
                                                    : 'border-gray-100 bg-gray-50/50 opacity-60 grayscale'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <Switch
                                                            checked={plan.active}
                                                            onCheckedChange={() => togglePlan(plan.id)}
                                                            className="data-[state=checked]:bg-[#8D0303]"
                                                        />
                                                        <Input
                                                            value={plan.label}
                                                            onChange={(e) => updatePlanLabel(plan.id, e.target.value)}
                                                            className="h-8 text-sm font-bold border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
                                                            placeholder="Plan name"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                                                        onClick={() => removePlan(plan.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Price"
                                                            className="pl-7 h-9 text-sm font-bold border-gray-200"
                                                            value={plan.price}
                                                            onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                                        <Input
                                                            placeholder="Badge (e.g. Popular)"
                                                            className="pl-8 h-9 text-[11px] font-medium border-gray-200"
                                                            value={plan.badge}
                                                            onChange={(e) => updatePlanBadge(plan.id, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Custom Plan Add */}
                                {showAddPlan ? (
                                    <div className="p-4 border-2 border-dashed border-[#8D0303]/20 rounded-xl space-y-3 bg-[#8D0303]/[0.02]">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-[#8D0303] uppercase tracking-wider">New Custom Plan</h4>
                                        </div>
                                        <Input
                                            placeholder="Plan name (e.g., Bi-Weekly)"
                                            value={newPlanLabel}
                                            onChange={(e) => setNewPlanLabel(e.target.value)}
                                            className="h-9 border-gray-200"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && newPlanLabel.trim()) {
                                                    addPlan(newPlanLabel.trim(), newPlanBadge.trim());
                                                }
                                            }}
                                        />
                                        <Input
                                            placeholder="Badge text (optional)"
                                            value={newPlanBadge}
                                            onChange={(e) => setNewPlanBadge(e.target.value)}
                                            className="h-9 border-gray-200"
                                        />
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                type="button"
                                                className="bg-[#8D0303] hover:bg-[#700202] text-white h-9 flex-1"
                                                disabled={!newPlanLabel.trim()}
                                                onClick={() => addPlan(newPlanLabel.trim(), newPlanBadge.trim())}
                                            >
                                                <Plus className="w-4 h-4 mr-1.5" /> Create Plan
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-9 px-4 border-gray-200"
                                                onClick={() => { setShowAddPlan(false); setNewPlanLabel(""); setNewPlanBadge(""); }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-dashed border-2 h-11 text-sm font-semibold hover:bg-gray-50 text-gray-600 rounded-xl"
                                        onClick={() => setShowAddPlan(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2 text-[#8D0303]" /> Add Custom Plan
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Simple Pricing */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-emerald-600 to-emerald-700 py-4 px-6 text-white text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">₹</div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">One-Time Pricing</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">MRP and Discounted pricing</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">MRP (Market Price)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="1200"
                                            className="pl-8 h-11 border-gray-200 font-bold"
                                            value={marketPrice}
                                            onChange={(e) => setMarketPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Offer Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="999"
                                            className="pl-8 h-11 border-emerald-100 bg-emerald-50/30 text-emerald-700 font-bold focus:ring-emerald-500/20 focus:border-emerald-500"
                                            value={offerPrice}
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {savings > 0 && (
                                <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 shadow-xs">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Star className="w-4 h-4 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Savings</p>
                                        <span className="text-sm font-black">₹{savings} saved · {Math.round((savings / Number(marketPrice)) * 100)}% off</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items Included */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Package className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Kit Contents</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">{items.length} items listed</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add item (e.g., Kumkum, Agarbatti)"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                    className="h-11 border-gray-200"
                                />
                                <Button type="button" onClick={handleAddItem} className="h-11 bg-[#8D0303] hover:bg-[#700202] text-white shrink-0 px-6 font-bold rounded-lg shadow-sm">
                                    <Plus className="w-4 h-4 mr-1.5" /> Add
                                </Button>
                            </div>

                            <div className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-xl p-4 bg-gray-50/30">
                                {items.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#8D0303]/10 text-sm font-medium text-gray-700 shadow-xs hover:shadow-sm hover:border-[#8D0303]/30 transition-all group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs" />
                                                <span>{item.text}</span>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="ml-1 p-0.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <Package className="w-8 h-8 text-gray-300 mb-2" />
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No Items Added</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 py-4 px-6 text-white text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Trust & Quality</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Features shown to customers</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {([
                                    { key: "verifiedQuality" as const, label: "Verified Quality", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                                    { key: "freeDelivery" as const, label: "Free Delivery", icon: Truck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                    { key: "premiumQuality" as const, label: "Premium Quality", icon: Star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                                    { key: "doorstepDelivery" as const, label: "Doorstep Delivery", icon: Package, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                                    { key: "panditCurated" as const, label: "Pandit Curated", icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                                    { key: "easyCancel" as const, label: "Easy Cancel", icon: RefreshCw, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
                                ]).map(({ key, label, icon: Icon, color, bg, border }) => (
                                    <div
                                        key={key}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${badges[key]
                                            ? `${bg} ${border} shadow-xs`
                                            : 'border-gray-100 bg-gray-50/50 grayscale opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg bg-white shadow-xs ${color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${badges[key] ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
                                        </div>
                                        <Switch
                                            checked={badges[key]}
                                            onCheckedChange={() => toggleBadge(key)}
                                            className="data-[state=checked]:bg-[#8D0303] scale-90"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping & Delivery */}
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-orange-500 to-orange-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Shipping & Delivery</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Shown on product page</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-white shadow-xs text-orange-600">
                                        <Package className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800">Show Shipping Info</span>
                                </div>
                                <Switch
                                    checked={shipping.showShipping}
                                    onCheckedChange={(v) => updateShipping('showShipping', v)}
                                    className="data-[state=checked]:bg-[#8D0303] scale-90"
                                />
                            </div>

                            {shipping.showShipping && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-green-100 bg-green-50/50">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-white shadow-xs text-green-600">
                                                <Truck className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800">Free Shipping</span>
                                        </div>
                                        <Switch
                                            checked={shipping.freeShipping}
                                            onCheckedChange={(v) => updateShipping('freeShipping', v)}
                                            className="data-[state=checked]:bg-[#8D0303] scale-90"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Shipping Label</label>
                                        <Input
                                            placeholder="e.g., Free Shipping, ₹50 Shipping"
                                            value={shipping.shippingLabel}
                                            onChange={(e) => updateShipping('shippingLabel', e.target.value)}
                                            className="h-10 border-gray-200 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Delivery Text</label>
                                        <Input
                                            placeholder="e.g., Delivery in 2-3 days"
                                            value={shipping.deliveryText}
                                            onChange={(e) => updateShipping('deliveryText', e.target.value)}
                                            className="h-10 border-gray-200 font-medium"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
