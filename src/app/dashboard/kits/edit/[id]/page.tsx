"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Plus, X, Upload, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import { kitsApi, Kit, PricingPlan, KitItem } from "@/api/kits";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

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
    const [image, setImage] = useState("");

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

    useEffect(() => {
        const fetchKit = async () => {
            try {
                setLoading(true);
                const kit = await kitsApi.getById(kitId);
                setTitle(kit.title);
                setShortDescription(kit.shortDescription || "");
                setCategory(kit.category);
                setImage(kit.image || "");
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
        if (!title || !category) {
            toast.error("Please fill in the required fields (Title and Category)");
            return;
        }

        try {
            setSaving(true);

            const kitData: Partial<Kit> = {
                title,
                shortDescription,
                category,
                itemsIncluded: items,
                image: image
            };

            // Always save pricing plans
            kitData.pricingPlans = pricingPlans.map(p => ({
                ...p,
                price: Number(p.price) || 0
            }));

            // Also save market/offer price if provided
            if (marketPrice) kitData.marketPrice = Number(marketPrice) || 0;
            if (offerPrice) kitData.offerPrice = Number(offerPrice) || 0;

            await kitsApi.update(kitId, kitData);
            toast.success("Kit updated successfully!");
            router.push("/dashboard/kits");
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update pooja kit");
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
        <div className="space-y-6 pb-20 w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/kits">
                        <Button variant="outline" size="icon">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Pooja Kit</h1>
                        <p className="text-muted-foreground text-sm">Update standardized kit for the platform.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        className="bg-[#8D0303] hover:bg-[#700202] text-white"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Details</CardTitle>
                            <CardDescription>Enter the primary information about this pooja kit.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kit Title *</label>
                                <Input
                                    placeholder="e.g., Satyanarayana Swamy Vratham Kit"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kit Category *</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
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
                                <label className="text-sm font-medium">Short Description</label>
                                <Textarea
                                    placeholder="Briefly describe what this kit is for..."
                                    rows={3}
                                    value={shortDescription}
                                    onChange={(e) => setShortDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items Included</CardTitle>
                            <CardDescription>List all the items that come inside this pooja kit.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add an item (e.g., Camphor, Betel Leaves)"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                                />
                                <Button type="button" onClick={handleAddItem}>
                                    <Plus className="w-4 h-4 mr-2" /> Add
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border">
                                        <span className="text-sm">{item.text}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => removeItem(item.id)}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Pricing & Image */}
                <div className="space-y-6">
                    {category === "daily" && <Card>
                        <CardHeader>
                            <CardTitle>Pricing Plans</CardTitle>
                            <CardDescription>Add pricing plans for this kit. You can add as many plans as needed (e.g., Weekly, Monthly, Quarterly, Yearly, Offer, etc.)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Add Suggestions */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Quick Add</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PLAN_SUGGESTIONS.map(suggestion => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => addSuggestedPlan(suggestion)}
                                            className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border hover:border-[#8D0303]/40 hover:bg-[#8D0303]/5 hover:text-[#8D0303] transition-all cursor-pointer"
                                        >
                                            + {suggestion.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Added Plans */}
                            {pricingPlans.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    {pricingPlans.map((plan) => (
                                        <div key={plan.id} className={`p-3 border rounded-lg space-y-3 transition-all ${plan.active ? 'border-[#8D0303]/30 bg-[#8D0303]/5' : 'border-border bg-muted/20 opacity-60'}`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Switch
                                                        checked={plan.active}
                                                        onCheckedChange={() => togglePlan(plan.id)}
                                                        className="data-[state=checked]:bg-[#8D0303] shrink-0"
                                                    />
                                                    <Input
                                                        value={plan.label}
                                                        onChange={(e) => updatePlanLabel(plan.id, e.target.value)}
                                                        className="h-8 text-sm font-semibold border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                                                        className="pl-7 h-9"
                                                        value={plan.price}
                                                        onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                                                    />
                                                </div>
                                                <Input
                                                    placeholder="Badge (optional)"
                                                    className="w-32 h-9 text-xs"
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
                                <div className="p-3 border-2 border-dashed border-[#8D0303]/30 rounded-lg space-y-3 bg-[#8D0303]/5">
                                    <label className="text-xs font-semibold text-[#8D0303]">Add Custom Plan</label>
                                    <Input
                                        placeholder="Plan name (e.g., Bi-Weekly)"
                                        value={newPlanLabel}
                                        onChange={(e) => setNewPlanLabel(e.target.value)}
                                        className="h-9"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newPlanLabel.trim()) {
                                                addPlan(newPlanLabel.trim(), newPlanBadge.trim());
                                            }
                                        }}
                                    />
                                    <Input
                                        placeholder="Badge text (optional, e.g., Popular)"
                                        value={newPlanBadge}
                                        onChange={(e) => setNewPlanBadge(e.target.value)}
                                        className="h-9"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-[#8D0303] hover:bg-[#700202] text-white"
                                            disabled={!newPlanLabel.trim()}
                                            onClick={() => addPlan(newPlanLabel.trim(), newPlanBadge.trim())}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Plan
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
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
                                    className="w-full border-dashed"
                                    onClick={() => setShowAddPlan(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Custom Plan
                                </Button>
                            )}

                            {pricingPlans.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    No plans added yet. Use Quick Add buttons above or add a custom plan.
                                </p>
                            )}
                        </CardContent>
                    </Card>}

                    {/* Optional Market/Offer Price */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Market Price (Optional)</CardTitle>
                            <CardDescription>Set MRP and offer price for display purposes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">MRP</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="1200"
                                        className="pl-7"
                                        value={marketPrice}
                                        onChange={(e) => setMarketPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Offer Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="999"
                                        className="pl-7"
                                        value={offerPrice}
                                        onChange={(e) => setOfferPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            {savings > 0 && (
                                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium border border-green-200">
                                    User Savings: ₹{savings} ({Math.round((savings / Number(marketPrice)) * 100)}% off)
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Kit Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={image}
                                onChange={setImage}
                                aspectRatio={1}
                                className="aspect-square w-full"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
