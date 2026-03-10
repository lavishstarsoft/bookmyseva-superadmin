"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Plus, X, Upload, Save, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { kitsApi, Kit, PricingPlan, KitItem } from "@/api/kits";
import { toast } from "sonner";

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

    // Standard Pricing for Non-Daily Kits
    const [marketPrice, setMarketPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");

    const [items, setItems] = useState<KitItem[]>([]);
    const [newItem, setNewItem] = useState("");

    const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
        { id: "one-time", label: "One-Time Purchase", price: "", active: true, badge: "" },
        { id: "weekly", label: "Weekly Subscription", price: "", active: false, badge: "Popular" },
        { id: "monthly", label: "Monthly Subscription", price: "", active: false, badge: "Best Value" },
    ]);

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

                if (kit.category === 'daily' && kit.pricingPlans) {
                    setPricingPlans(kit.pricingPlans.map(p => ({
                        ...p,
                        price: p.price.toString()
                    })));
                } else {
                    setMarketPrice(kit.marketPrice?.toString() || "");
                    setOfferPrice(kit.offerPrice?.toString() || "");
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
                image: image || "https://images.unsplash.com/photo-1601314002592-b8734bca6604?q=80&w=400&auto=format&fit=crop"
            };

            if (category === 'daily') {
                kitData.pricingPlans = pricingPlans.map(p => ({
                    ...p,
                    price: Number(p.price) || 0
                }));
            } else {
                kitData.marketPrice = Number(marketPrice) || 0;
                kitData.offerPrice = Number(offerPrice) || 0;
            }

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
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Subscriptions</CardTitle>
                            <CardDescription>{category === "daily" ? "Daily kits allow weekly or monthly subscriptions." : "Set market and offer prices for this kit."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {category === "daily" ? (
                                <div className="space-y-4">
                                    {pricingPlans.map((plan) => (
                                        <div key={plan.id} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={plan.id}
                                                        checked={plan.active}
                                                        onCheckedChange={() => togglePlan(plan.id)}
                                                    />
                                                    <label htmlFor={plan.id} className="text-sm font-medium leading-none cursor-pointer">
                                                        {plan.label}
                                                    </label>
                                                </div>
                                                {plan.badge && (
                                                    <span className="bg-[#8D0303]/10 text-[#8D0303] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {plan.active && (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="pl-7"
                                                        value={plan.price}
                                                        onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Market Price (MRP)</label>
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
                                        <label className="text-sm font-medium">Offer Price (Selling Price)</label>
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
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Kit Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer p-4 text-center">
                                <Upload className="w-8 h-8 mb-2" />
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-[10px]">PNG, JPG up to 5MB</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
