"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, Tag, Percent, IndianRupee, Calendar, Shield, Shuffle } from "lucide-react";
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
import { couponsApi } from "@/api/coupons";
import { toast } from "sonner";

const CATEGORIES = [
    { value: "daily", label: "Daily Pooja" },
    { value: "festival", label: "Festival" },
    { value: "vratham", label: "Vratham" },
    { value: "homam", label: "Homam" },
    { value: "special", label: "Special Occasion" },
];

function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "BMS";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default function CreateCouponPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrderValue, setMinOrderValue] = useState("");
    const [maxDiscount, setMaxDiscount] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [usageLimitPerUser, setUsageLimitPerUser] = useState("1");
    const [validFrom, setValidFrom] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
    const [firstOrderOnly, setFirstOrderOnly] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const toggleCategory = (cat: string) => {
        setApplicableCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSave = async () => {
        if (!code.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }
        if (!discountValue || Number(discountValue) <= 0) {
            toast.error("Please enter a valid discount value");
            return;
        }
        if (!validFrom || !validUntil) {
            toast.error("Please set validity dates");
            return;
        }
        if (new Date(validUntil) <= new Date(validFrom)) {
            toast.error("End date must be after start date");
            return;
        }

        try {
            setLoading(true);
            await couponsApi.create({
                code: code.toUpperCase().trim(),
                description: description.trim(),
                discountType,
                discountValue: Number(discountValue),
                minOrderValue: Number(minOrderValue) || 0,
                maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
                usageLimit: usageLimit ? Number(usageLimit) : undefined,
                usageLimitPerUser: Number(usageLimitPerUser) || 1,
                validFrom,
                validUntil,
                applicableCategories,
                firstOrderOnly,
                isActive,
                usedCount: 0,
            });
            toast.success("Coupon created successfully!");
            router.push("/dashboard/coupons");
        } catch (error: unknown) {
            let errorMessage = "Failed to create coupon";
            if (error && typeof error === "object" && "response" in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-0 pb-24 w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/coupons">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                                <span>Dashboard</span>
                                <span>/</span>
                                <span>Coupons</span>
                                <span>/</span>
                                <span className="text-[#8D0303] font-medium">Create New</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Create New Coupon</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-[#8D0303] hover:bg-[#700202] text-white"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                            Create Coupon
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Basic Details */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-purple-600 to-purple-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Coupon Details</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Code & Description</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Coupon Code <span className="text-[#8D0303]">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g., SAVE20"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="h-11 border-gray-200 font-mono font-bold uppercase tracking-widest"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 shrink-0"
                                        onClick={() => setCode(generateCode())}
                                    >
                                        <Shuffle className="w-4 h-4 mr-1.5" /> Generate
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Customers will enter this code at checkout.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <Textarea
                                    placeholder="e.g., Get 20% off on your first order"
                                    rows={3}
                                    maxLength={200}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="resize-none border-gray-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Discount Configuration */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-emerald-600 to-emerald-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">₹</div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Discount Settings</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Type, Value & Limits</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Discount Type <span className="text-[#8D0303]">*</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${discountType === 'percentage' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-emerald-200'}`}
                                        onClick={() => setDiscountType('percentage')}
                                    >
                                        <Percent className={`w-6 h-6 mx-auto mb-1 ${discountType === 'percentage' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <div className="text-sm font-bold">Percentage</div>
                                        <div className="text-[10px] text-muted-foreground">e.g., 20% off</div>
                                    </button>
                                    <button
                                        type="button"
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${discountType === 'flat' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-emerald-200'}`}
                                        onClick={() => setDiscountType('flat')}
                                    >
                                        <IndianRupee className={`w-6 h-6 mx-auto mb-1 ${discountType === 'flat' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <div className="text-sm font-bold">Flat Amount</div>
                                        <div className="text-[10px] text-muted-foreground">e.g., ₹100 off</div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                        {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-[#8D0303]">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                            {discountType === 'percentage' ? '%' : '₹'}
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder={discountType === 'percentage' ? '20' : '100'}
                                            className="pl-8 h-11 border-gray-200 font-bold"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Min Order Value</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="pl-8 h-11 border-gray-200"
                                            value={minOrderValue}
                                            onChange={(e) => setMinOrderValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {discountType === 'percentage' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Max Discount Cap (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 200 (leave empty for no cap)"
                                            className="pl-8 h-11 border-gray-200"
                                            value={maxDiscount}
                                            onChange={(e) => setMaxDiscount(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Maximum discount amount in rupees for percentage coupons.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Validity & Usage Limits */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Validity & Limits</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Date range & usage caps</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                        Valid From <span className="text-[#8D0303]">*</span>
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className="h-11 border-gray-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                        Valid Until <span className="text-[#8D0303]">*</span>
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="h-11 border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Total Usage Limit</label>
                                    <Input
                                        type="number"
                                        placeholder="Unlimited"
                                        className="h-11 border-gray-200"
                                        value={usageLimit}
                                        onChange={(e) => setUsageLimit(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Leave empty for unlimited uses.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Per User Limit</label>
                                    <Input
                                        type="number"
                                        placeholder="1"
                                        className="h-11 border-gray-200"
                                        value={usageLimitPerUser}
                                        onChange={(e) => setUsageLimitPerUser(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">How many times each user can use this.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-white shadow-xs text-amber-600">
                                        <Shield className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800">First Order Only</span>
                                        <p className="text-[10px] text-muted-foreground">Only works for users who haven't ordered before</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={firstOrderOnly}
                                    onCheckedChange={setFirstOrderOnly}
                                    className="data-[state=checked]:bg-[#8D0303] scale-90"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Targeting */}
                    <Card className="border-border shadow-md overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-orange-500 to-orange-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">Targeting</h3>
                                    <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Categories & Status</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                                    Applicable Categories
                                </label>
                                <p className="text-[10px] text-muted-foreground mb-3">Leave all unchecked to apply to all categories.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <label
                                            key={cat.value}
                                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${applicableCategories.includes(cat.value) ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={applicableCategories.includes(cat.value)}
                                                onChange={() => toggleCategory(cat.value)}
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl border border-green-100 bg-green-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-white shadow-xs text-green-600">
                                        <Tag className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800">Active</span>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-[#8D0303] scale-90"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
