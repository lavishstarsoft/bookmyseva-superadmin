"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, Loader2, Plus, X, Cookie, Clock, CalendarDays, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { prasadamsApi, Prasadam, PricingTier, Category, PrasadamTimeSlot, PrasadamDeliveryConfig } from "@/api/prasadams";
import { toast } from "sonner";
import { MultiImageUpload } from "@/components/ui/image-upload";

const units = [
    { value: "pieces", label: "Pieces" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "grams", label: "Grams" },
    { value: "packets", label: "Packets" },
];

// Delivery time slot suggestions
const SLOT_SUGGESTIONS = [
    { id: 'morning', label: '8 AM – 11 AM' },
    { id: 'midday', label: '11 AM – 2 PM' },
    { id: 'afternoon', label: '2 PM – 5 PM' },
    { id: 'evening', label: '5 PM – 8 PM' },
    { id: 'night', label: '6 PM – 9 PM' },
];

export default function NewPrasadamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const data = await prasadamsApi.getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                // Fallback categories if API fails
                setCategories([
                    { value: "laddu", label: "Laddu", count: 0 },
                    { value: "pulihora", label: "Pulihora", count: 0 },
                    { value: "pongal", label: "Pongal", count: 0 },
                    { value: "payasam", label: "Payasam", count: 0 },
                    { value: "special", label: "Special Items", count: 0 },
                    { value: "combo", label: "Combo Packs", count: 0 },
                ]);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Basic Info
    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [fullDescription, setFullDescription] = useState("");
    const [category, setCategory] = useState("");
    const [images, setImages] = useState<string[]>([]);

    // Pricing
    const [basePrice, setBasePrice] = useState("");
    const [marketPrice, setMarketPrice] = useState("");
    const [unit, setUnit] = useState("pieces");
    const [weightPerUnit, setWeightPerUnit] = useState("");

    // Pricing Tiers
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
    const [newTierMin, setNewTierMin] = useState("");
    const [newTierMax, setNewTierMax] = useState("");
    const [newTierPrice, setNewTierPrice] = useState("");
    const [newTierLabel, setNewTierLabel] = useState("");

    // Stock
    const [inStock, setInStock] = useState(true);
    const [stockQuantity, setStockQuantity] = useState("100");
    const [minOrderQuantity, setMinOrderQuantity] = useState("1");
    const [maxOrderQuantity, setMaxOrderQuantity] = useState("50");

    // Temple Source
    const [templeName, setTempleName] = useState("");
    const [templeLocation, setTempleLocation] = useState("");

    // Ingredients
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [newIngredient, setNewIngredient] = useState("");

    // Dietary
    const [isVegetarian, setIsVegetarian] = useState(true);
    const [isVegan, setIsVegan] = useState(false);
    const [containsNuts, setContainsNuts] = useState(false);
    const [containsDairy, setContainsDairy] = useState(true);

    // Shelf Life
    const [shelfLife, setShelfLife] = useState("3");

    // Shipping
    const [freeShipping, setFreeShipping] = useState(false);
    const [freeShippingAbove, setFreeShippingAbove] = useState("500");
    const [shippingCharge, setShippingCharge] = useState("50");
    const [deliveryText, setDeliveryText] = useState("Delivery in 2-3 days");

    // Badges
    const [templeBlessed, setTempleBlessed] = useState(true);
    const [freshlyPrepared, setFreshlyPrepared] = useState(true);
    const [hygienic, setHygienic] = useState(true);
    const [doorstepDelivery, setDoorstepDelivery] = useState(true);
    const [qualityAssured, setQualityAssured] = useState(true);

    // Status
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);

    // Delivery Schedule
    const [deliveryConfig, setDeliveryConfig] = useState<PrasadamDeliveryConfig>({
        timeSlots: [
            { id: 'morning', label: '8 AM – 11 AM', active: true },
            { id: 'midday', label: '11 AM – 2 PM', active: true },
            { id: 'afternoon', label: '2 PM – 5 PM', active: true },
        ],
        leadDays: 1,
        maxAdvanceDays: 7,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    });

    const [taxes, setTaxes] = useState<{ id: string; name: string; percentage: number; registrationNumber: string }[]>([]);

    const addTax = () => {
        setTaxes([...taxes, { id: Date.now().toString(), name: '', percentage: 0, registrationNumber: '' }]);
    };

    const updateTax = (index: number, field: string, value: any) => {
        const updated = [...taxes];
        (updated[index] as any)[field] = value;
        setTaxes(updated);
    };

    const removeTax = (index: number) => {
        const updated = [...taxes];
        updated.splice(index, 1);
        setTaxes(updated);
    };

    const addPricingTier = () => {
        if (!newTierMin || !newTierPrice) {
            toast.error("Min quantity and price are required for pricing tier");
            return;
        }
        setPricingTiers([...pricingTiers, {
            minQuantity: Number(newTierMin),
            maxQuantity: newTierMax ? Number(newTierMax) : undefined,
            pricePerUnit: Number(newTierPrice),
            label: newTierLabel || undefined
        }]);
        setNewTierMin("");
        setNewTierMax("");
        setNewTierPrice("");
        setNewTierLabel("");
    };

    const removePricingTier = (index: number) => {
        setPricingTiers(pricingTiers.filter((_, i) => i !== index));
    };

    const addIngredient = () => {
        if (!newIngredient.trim()) return;
        setIngredients([...ingredients, newIngredient.trim()]);
        setNewIngredient("");
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    // Delivery Schedule Functions
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

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        if (!category) {
            toast.error("Please select a category");
            return;
        }
        if (!basePrice || Number(basePrice) <= 0) {
            toast.error("Please enter a valid base price");
            return;
        }

        const data: Prasadam = {
            title: title.trim(),
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
            category,
            image: images[0] || "",
            images,
            basePrice: Number(basePrice),
            marketPrice: marketPrice ? Number(marketPrice) : undefined,
            unit,
            weightPerUnit: weightPerUnit ? Number(weightPerUnit) : undefined,
            pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
            templeSource: templeName || templeLocation ? {
                templeName: templeName || undefined,
                templeLocation: templeLocation || undefined,
            } : undefined,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            shelfLife: Number(shelfLife) || 3,
            dietary: {
                isVegetarian,
                isVegan,
                containsNuts,
                containsDairy,
            },
            inStock,
            stockQuantity: Number(stockQuantity) || 100,
            minOrderQuantity: Number(minOrderQuantity) || 1,
            maxOrderQuantity: Number(maxOrderQuantity) || 50,
            shipping: {
                freeShipping,
                freeShippingAbove: Number(freeShippingAbove) || 500,
                shippingCharge: Number(shippingCharge) || 50,
                deliveryText,
                showShipping: true,
            },
            badges: {
                templeBlessed,
                freshlyPrepared,
                hygienic,
                doorstepDelivery,
                qualityAssured,
                easyCancel: true,
            },
            deliveryConfig,
            taxes,
            isActive,
            isFeatured,
            source: "admin",
        };

        try {
            setLoading(true);
            await prasadamsApi.create(data);
            toast.success("Prasadam created successfully!");
            router.push("/dashboard/prasadams");
        } catch (error: any) {
            const msg = error?.response?.data?.error || "Failed to create prasadam";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b -mx-4 px-4 lg:-mx-6 lg:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/prasadams">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="text-xs text-muted-foreground">Dashboard / Prasadams / Add New</div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Cookie className="w-5 h-5 text-orange-500" />
                                Add New Prasadam
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Prasadam
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <Label>Title *</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tirupati Laddu" className="mt-1.5" />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select value={category} onValueChange={setCategory} disabled={categoriesLoading}>
                                    <SelectTrigger className="mt-1.5">
                                        {categoriesLoading ? (
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                            </span>
                                        ) : (
                                            <SelectValue placeholder="Select category" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Short Description</Label>
                                <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief description..." className="mt-1.5" rows={2} />
                            </div>
                            <div>
                                <Label>Full Description</Label>
                                <Textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description..." className="mt-1.5" rows={4} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Images</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <MultiImageUpload values={images} onChange={setImages} maxImages={5} aspectRatio={1} />
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Base Price (₹) *</Label>
                                    <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="e.g. 100" className="mt-1.5" />
                                </div>
                                <div>
                                    <Label>Market Price (₹)</Label>
                                    <Input type="number" value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} placeholder="e.g. 150" className="mt-1.5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Unit</Label>
                                    <Select value={unit} onValueChange={setUnit}>
                                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => (
                                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Weight per Unit (grams)</Label>
                                    <Input type="number" value={weightPerUnit} onChange={(e) => setWeightPerUnit(e.target.value)} placeholder="e.g. 100" className="mt-1.5" />
                                </div>
                            </div>

                            {/* Pricing Tiers */}
                            <div>
                                <Label className="mb-2 block">Bulk Pricing Tiers (Optional)</Label>
                                {pricingTiers.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {pricingTiers.map((tier, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
                                                <span>{tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : "+"} units: ₹{tier.pricePerUnit} each</span>
                                                {tier.label && <span className="text-muted-foreground">({tier.label})</span>}
                                                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removePricingTier(index)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    <Input type="number" value={newTierMin} onChange={(e) => setNewTierMin(e.target.value)} placeholder="Min Qty" className="w-20" />
                                    <Input type="number" value={newTierMax} onChange={(e) => setNewTierMax(e.target.value)} placeholder="Max Qty" className="w-20" />
                                    <Input type="number" value={newTierPrice} onChange={(e) => setNewTierPrice(e.target.value)} placeholder="Price" className="w-24" />
                                    <Input value={newTierLabel} onChange={(e) => setNewTierLabel(e.target.value)} placeholder="Label" className="w-28" />
                                    <Button variant="outline" size="sm" onClick={addPricingTier}><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ingredients */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Ingredients</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {ingredients.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {ingredients.map((ing, index) => (
                                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm">
                                            {ing}
                                            <button onClick={() => removeIngredient(index)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Input value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} placeholder="Add ingredient..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())} />
                                <Button variant="outline" onClick={addIngredient}><Plus className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Schedule */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Delivery Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {/* Quick Add Slots */}
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                                    Quick Add Slots
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {SLOT_SUGGESTIONS.map(slot => (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => addTimeSlot(slot.id, slot.label)}
                                            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
                                        >
                                            + {slot.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Active Slots */}
                            {deliveryConfig.timeSlots.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                                        Active Slots
                                    </Label>
                                    {deliveryConfig.timeSlots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                                                slot.active
                                                    ? 'border-l-[3px] border-l-blue-500 border-blue-200 bg-blue-50/50'
                                                    : 'border-border bg-muted/20 opacity-50'
                                            }`}
                                        >
                                            <Switch
                                                checked={slot.active}
                                                onCheckedChange={() => toggleTimeSlot(slot.id)}
                                                className="data-[state=checked]:bg-blue-600 shrink-0 scale-90"
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

                            {/* Add Custom Slot */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., 9 PM – 11 PM"
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
                                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
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

                            {/* Booking Date Control */}
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5 block">
                                    <CalendarDays className="w-3.5 h-3.5" /> Booking Date Control
                                </Label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={deliveryConfig.bookingStartDate || ''}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingStartDate: e.target.value || undefined }))}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">End Date <span className="text-xs text-muted-foreground/60">(optional)</span></Label>
                                            <Input
                                                type="date"
                                                value={deliveryConfig.bookingEndDate || ''}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingEndDate: e.target.value || undefined }))}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Lead Days & Max Advance Days */}
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5 block">
                                    <CalendarDays className="w-3.5 h-3.5" /> Delivery Settings
                                </Label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">Lead Days</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={deliveryConfig.leadDays}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, leadDays: Number(e.target.value) || 0 }))}
                                                className="h-9"
                                            />
                                            <p className="text-xs text-muted-foreground">Min days from today</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-muted-foreground">Max Advance Days</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={deliveryConfig.maxAdvanceDays}
                                                onChange={(e) => setDeliveryConfig(prev => ({ ...prev, maxAdvanceDays: Number(e.target.value) || 7 }))}
                                                className="h-9"
                                            />
                                            <p className="text-xs text-muted-foreground">How far ahead users can book</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Stock & Order Limits */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Stock & Order Limits</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <Label>In Stock</Label>
                                <Switch checked={inStock} onCheckedChange={setInStock} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Stock Quantity</Label>
                                    <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="mt-1.5" />
                                </div>
                                <div>
                                    <Label>Min Order</Label>
                                    <Input type="number" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} className="mt-1.5" />
                                </div>
                                <div>
                                    <Label>Max Order</Label>
                                    <Input type="number" value={maxOrderQuantity} onChange={(e) => setMaxOrderQuantity(e.target.value)} className="mt-1.5" />
                                </div>
                            </div>
                            <div>
                                <Label>Shelf Life (days)</Label>
                                <Input type="number" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} className="mt-1.5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Temple Source */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Temple Source</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label>Temple Name</Label>
                                <Input value={templeName} onChange={(e) => setTempleName(e.target.value)} placeholder="e.g. Tirumala Tirupati Temple" className="mt-1.5" />
                            </div>
                            <div>
                                <Label>Temple Location</Label>
                                <Input value={templeLocation} onChange={(e) => setTempleLocation(e.target.value)} placeholder="e.g. Tirupati, Andhra Pradesh" className="mt-1.5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dietary Info */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Dietary Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Vegetarian</Label>
                                <Switch checked={isVegetarian} onCheckedChange={setIsVegetarian} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Vegan</Label>
                                <Switch checked={isVegan} onCheckedChange={setIsVegan} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Contains Nuts</Label>
                                <Switch checked={containsNuts} onCheckedChange={setContainsNuts} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Contains Dairy</Label>
                                <Switch checked={containsDairy} onCheckedChange={setContainsDairy} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Taxes */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Taxes & Fees</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Taxes Configuration</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addTax} className="h-8">
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Tax/Fee
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {taxes.length === 0 ? (
                                        <div className="text-sm text-gray-500 italic p-4 border rounded-xl bg-gray-50 text-center">No taxes configured. (0% will be applied)</div>
                                    ) : (
                                        taxes.map((tax, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 border rounded-xl bg-white relative group">
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Tax Name</label>
                                                            <Input placeholder="e.g., GST, VAT" value={tax.name} onChange={(e) => updateTax(idx, "name", e.target.value)} className="h-9" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Percentage (%)</label>
                                                            <Input type="number" value={tax.percentage} onChange={(e) => updateTax(idx, "percentage", Number(e.target.value))} className="h-9" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Reg. Number (Optional)</label>
                                                            <Input placeholder="e.g., GSTIN..." value={tax.registrationNumber} onChange={(e) => updateTax(idx, "registrationNumber", e.target.value)} className="h-9 uppercase" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeTax(idx)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" type="button">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Shipping</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Free Shipping</Label>
                                <Switch checked={freeShipping} onCheckedChange={setFreeShipping} />
                            </div>
                            {!freeShipping && (
                                <>
                                    <div>
                                        <Label>Free Shipping Above (₹)</Label>
                                        <Input type="number" value={freeShippingAbove} onChange={(e) => setFreeShippingAbove(e.target.value)} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label>Shipping Charge (₹)</Label>
                                        <Input type="number" value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} className="mt-1.5" />
                                    </div>
                                </>
                            )}
                            <div>
                                <Label>Delivery Text</Label>
                                <Input value={deliveryText} onChange={(e) => setDeliveryText(e.target.value)} className="mt-1.5" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Trust Badges</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between"><Label>Temple Blessed</Label><Switch checked={templeBlessed} onCheckedChange={setTempleBlessed} /></div>
                            <div className="flex items-center justify-between"><Label>Freshly Prepared</Label><Switch checked={freshlyPrepared} onCheckedChange={setFreshlyPrepared} /></div>
                            <div className="flex items-center justify-between"><Label>100% Hygienic</Label><Switch checked={hygienic} onCheckedChange={setHygienic} /></div>
                            <div className="flex items-center justify-between"><Label>Doorstep Delivery</Label><Switch checked={doorstepDelivery} onCheckedChange={setDoorstepDelivery} /></div>
                            <div className="flex items-center justify-between"><Label>Quality Assured</Label><Switch checked={qualityAssured} onCheckedChange={setQualityAssured} /></div>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#B01212] text-white rounded-t-lg">
                            <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Active (Visible to customers)</Label>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Featured</Label>
                                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
