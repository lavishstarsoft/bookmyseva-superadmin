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
import { kitsApi, Kit, KitItem, KitBadges } from "@/api/kits";
import { toast } from "sonner";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { ShieldCheck, Truck, Star, Package, UserCheck, RefreshCw } from "lucide-react";

// Suggested plan templates for quick add
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

    // Standard Pricing (optional)
    const [marketPrice, setMarketPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");

    const [items, setItems] = useState<KitItem[]>([]);
    const [newItem, setNewItem] = useState("");

    // Dynamic pricing plans
    const [pricingPlans, setPricingPlans] = useState<
        { id: string; label: string; price: string; active: boolean; badge: string }[]
    >([]);

    // New plan form
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [newPlanLabel, setNewPlanLabel] = useState("");
    const [newPlanBadge, setNewPlanBadge] = useState("");

    // Trust badges
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

                // Load existing pricing plans
                if (kit.pricingPlans && kit.pricingPlans.length > 0) {
                    setPricingPlans(kit.pricingPlans.map(p => ({
                        ...p,
                        price: p.price.toString()
                    })));
                }

                setMarketPrice(kit.marketPrice?.toString() || "");
                setOfferPrice(kit.offerPrice?.toString() || "");

                // Load existing badges (default all true if not set)
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

    // Dynamic plan management
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

            // Add pricing plans if any exist
            if (pricingPlans.length > 0) {
                kitData.pricingPlans = pricingPlans.map(p => ({
                    id: p.id,
                    label: p.label,
                    price: Number(p.price) || 0,
                    active: p.active,
                    badge: p.badge
                }));
            }

            // Also save market/offer price if provided
            if (marketPrice) kitData.marketPrice = Number(marketPrice) || 0;
            if (offerPrice) kitData.offerPrice = Number(offerPrice) || 0;

            // Save trust badges
            kitData.badges = badges;

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Basic Details */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-l-4 border-l-[#8D0303] bg-muted/20 py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#8D0303] text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">Basic Details</div>
                                    <div className="text-xs text-muted-foreground">Title, category and description</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Kit Title <span className="text-[#8D0303]">*</span></label>
                                <Input
                                    placeholder="e.g., Satyanarayana Swamy Vratham Kit"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-10"
                                />
                                <p className="text-xs text-muted-foreground">Use a clear, specific name customers can search for.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Kit Category <span className="text-[#8D0303]">*</span></label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-10">
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

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Short Description</label>
                                    <span className="text-xs text-muted-foreground">{shortDescription.length} / 300</span>
                                </div>
                                <Textarea
                                    placeholder="Briefly describe what this kit is for..."
                                    rows={3}
                                    maxLength={300}
                                    value={shortDescription}
                                    onChange={(e) => setShortDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Included */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-l-4 border-l-[#8D0303] bg-muted/20 py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#8D0303] text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">Items Included</div>
                                    <div className="text-xs text-muted-foreground">
                                        {items.length > 0
                                            ? <span className="text-[#8D0303] font-medium">{items.length} items added</span>
                                            : "List all items in this kit"}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add an item (e.g., Camphor, Betel Leaves)"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                    className="h-10"
                                />
                                <Button type="button" onClick={handleAddItem} className="h-10 bg-[#8D0303] hover:bg-[#700202] text-white shrink-0">
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>

                            {items.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8D0303]/5 border border-[#8D0303]/20 text-sm group">
                                            <Tag className="w-3 h-3 text-[#8D0303]/60 shrink-0" />
                                            <span className="text-sm text-gray-700">{item.text}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="ml-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                    <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No items added yet. Type above and press Enter or click Add.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-5">

                    {/* Kit Images — top of right column */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-l-4 border-l-[#8D0303] bg-muted/20 py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#8D0303]/10 flex items-center justify-center shrink-0">
                                    <ImagePlus className="w-4 h-4 text-[#8D0303]" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">Kit Images</div>
                                    <div className="text-xs text-muted-foreground">First image = cover · Up to 5</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <MultiImageUpload
                                values={images}
                                onChange={setImages}
                                maxImages={5}
                                aspectRatio={1}
                            />
                        </CardContent>
                    </Card>

                    {/* Pricing Plans — daily only */}
                    {category === "daily" && (
                        <Card className="border-border shadow-sm overflow-hidden">
                            <CardHeader className="border-l-4 border-l-[#8D0303] bg-muted/20 py-4 px-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#8D0303] text-white flex items-center justify-center text-xs font-black shrink-0">₹</div>
                                    <div>
                                        <div className="font-semibold text-sm leading-tight">Pricing Plans</div>
                                        <div className="text-xs text-muted-foreground">Weekly, monthly, yearly and more</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {/* Quick Add */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Quick Add</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PLAN_SUGGESTIONS.map(suggestion => (
                                            <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => addSuggestedPlan(suggestion)}
                                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border hover:border-[#8D0303]/40 hover:bg-[#8D0303]/5 hover:text-[#8D0303] transition-all cursor-pointer"
                                            >
                                                + {suggestion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Added Plans */}
                                {pricingPlans.length > 0 && (
                                    <div className="space-y-2.5">
                                        {pricingPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`p-3 rounded-lg border transition-all ${plan.active
                                                    ? 'border-l-[3px] border-l-[#8D0303] border-[#8D0303]/20 bg-[#8D0303]/5'
                                                    : 'border-border bg-muted/20 opacity-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Switch
                                                            checked={plan.active}
                                                            onCheckedChange={() => togglePlan(plan.id)}
                                                            className="data-[state=checked]:bg-[#8D0303] shrink-0"
                                                        />
                                                        <Input
                                                            value={plan.label}
                                                            onChange={(e) => updatePlanLabel(plan.id, e.target.value)}
                                                            className="h-7 text-sm font-semibold border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            placeholder="Plan name"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                                        onClick={() => removePlan(plan.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Price"
                                                            className="pl-7 h-8 text-sm"
                                                            value={plan.price}
                                                            onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <Input
                                                        placeholder="Badge"
                                                        className="w-28 h-8 text-xs"
                                                        value={plan.badge}
                                                        onChange={(e) => updatePlanBadge(plan.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Custom Plan Add */}
                                {showAddPlan ? (
                                    <div className="p-3 border-2 border-dashed border-[#8D0303]/30 rounded-lg space-y-2.5 bg-[#8D0303]/5">
                                        <label className="text-xs font-semibold text-[#8D0303]">Custom Plan</label>
                                        <Input
                                            placeholder="Plan name (e.g., Bi-Weekly)"
                                            value={newPlanLabel}
                                            onChange={(e) => setNewPlanLabel(e.target.value)}
                                            className="h-8"
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
                                            className="h-8"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-[#8D0303] hover:bg-[#700202] text-white h-8"
                                                disabled={!newPlanLabel.trim()}
                                                onClick={() => addPlan(newPlanLabel.trim(), newPlanBadge.trim())}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
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
                                        className="w-full border-dashed h-9 text-sm"
                                        onClick={() => setShowAddPlan(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Custom Plan
                                    </Button>
                                )}

                                {pricingPlans.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                        No plans yet. Use Quick Add or create a custom plan.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Market Price */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-l-4 border-l-amber-500 bg-muted/20 py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">Market Price <span className="text-[10px] font-normal text-muted-foreground ml-1">(Optional)</span></div>
                                    <div className="text-xs text-muted-foreground">MRP and offer price for display</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MRP</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="1200"
                                            className="pl-7 h-10"
                                            value={marketPrice}
                                            onChange={(e) => setMarketPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Offer Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="999"
                                            className="pl-7 h-10"
                                            value={offerPrice}
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {savings > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200">
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    <span className="text-sm font-semibold">₹{savings} saved · {Math.round((savings / Number(marketPrice)) * 100)}% off</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-l-4 border-l-blue-500 bg-muted/20 py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm leading-tight">Trust Badges</div>
                                    <div className="text-xs text-muted-foreground">Shown on the customer product page</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-2">
                            {([
                                { key: "verifiedQuality" as const, label: "Verified Quality", icon: ShieldCheck, color: "text-green-600", accent: "border-l-green-500" },
                                { key: "freeDelivery" as const, label: "Free Delivery", icon: Truck, color: "text-blue-600", accent: "border-l-blue-500" },
                                { key: "premiumQuality" as const, label: "Premium Quality", icon: Star, color: "text-amber-600", accent: "border-l-amber-500" },
                                { key: "doorstepDelivery" as const, label: "Doorstep Delivery", icon: Package, color: "text-orange-600", accent: "border-l-orange-500" },
                                { key: "panditCurated" as const, label: "Pandit Curated", icon: UserCheck, color: "text-purple-600", accent: "border-l-purple-500" },
                                { key: "easyCancel" as const, label: "Easy Cancel", icon: RefreshCw, color: "text-teal-600", accent: "border-l-teal-500" },
                            ]).map(({ key, label, icon: Icon, color, accent }) => (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${badges[key]
                                        ? `border-l-2 ${accent} border-t border-r border-b border-t-border border-r-border border-b-border bg-muted/30`
                                        : 'border-border bg-muted/10 opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className="text-sm font-medium">{label}</span>
                                    </div>
                                    <Switch
                                        checked={badges[key]}
                                        onCheckedChange={() => toggleBadge(key)}
                                        className="data-[state=checked]:bg-[#8D0303]"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
