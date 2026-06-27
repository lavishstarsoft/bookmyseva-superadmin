"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, Save, Plus, Loader2, Trash2, 
    Info, Image as ImageIcon, IndianRupee, 
    Gift, Utensils, LayoutGrid, CheckCircle2, Clock, Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload, MultiImageUpload } from "@/components/ui/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

interface KitItem {
    icon: string;
    image: string;
    text: string;
}

interface PujaVersion {
    id: string;
    title: string;
    price: number;
    description: string;
    method: string;
    rating: number;
    includes: { icon: string; text: string }[];
    kitItems: KitItem[];
}

interface PrasadamOption {
    id: string;
    label: string;
    price: number;
    description: string;
    image: string;
    includes: { icon: string; text: string }[];
}

interface AdditionalOffering {
    id: string;
    label: string;
    price: number;
    description: string;
    image: string;
}

interface Tax {
    id: string;
    name: string;
    percentage: number;
    registrationNumber: string;
}

const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "media", label: "Images & Gallery", icon: ImageIcon },
    { id: "pricing", label: "Pricing Tiers", icon: IndianRupee },
    { id: "availability", label: "Availability Setup", icon: Calendar },
    { id: "prasadam", label: "Prasadam Setup", icon: Utensils },
    { id: "addons", label: "Additional Offerings", icon: Gift },
];

export default function PujaForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("basic");

    const [formData, setFormData] = useState({
        title: "",
        shortDescription: "",
        fullDescription: "",
        image: "",
        images: [] as string[],
        category: "pooja",
        duration: "",
        adminCommissionPercentage: 15,
        taxes: [] as Tax[],
        availableDates: {
            startDate: "",
            endDate: ""
        },
        timeSlots: [] as { id: string; label: string }[],
        versions: [
            { id: "basic", title: "Basic", price: 0, description: "", method: "Standard", rating: 4, includes: [], kitItems: [] },
            { id: "premium", title: "Premium", price: 0, description: "", method: "Agama Shastra", rating: 4.5, includes: [], kitItems: [] },
            { id: "super_premium", title: "Super Premium", price: 0, description: "", method: "Agama + Veda Ashirvadam", rating: 5, includes: [], kitItems: [] },
        ] as PujaVersion[],
        prasadamOptions: [] as PrasadamOption[],
        additionalOfferings: [] as AdditionalOffering[]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                shortDescription: initialData.shortDescription || "",
                fullDescription: initialData.fullDescription || "",
                image: initialData.image || "",
                images: initialData.images || [],
                category: initialData.category || "pooja",
                duration: initialData.duration || "",
                adminCommissionPercentage: initialData.adminCommissionPercentage || 15,
                taxes: initialData.taxes || [],
                availableDates: {
                    startDate: initialData.availableDates?.startDate ? new Date(initialData.availableDates.startDate).toISOString().split('T')[0] : "",
                    endDate: initialData.availableDates?.endDate ? new Date(initialData.availableDates.endDate).toISOString().split('T')[0] : ""
                },
                timeSlots: initialData.timeSlots || [],
                versions: initialData.versions?.length > 0 ? initialData.versions : formData.versions,
                prasadamOptions: initialData.prasadamOptions || [],
                additionalOfferings: initialData.additionalOfferings || []
            });
        }
    }, [initialData]);

    const handleSave = async () => {
        if (!formData.title) {
            toast.error("Title is required");
            return;
        }
        setSaving(true);
        try {
            if (initialData?._id) {
                await api.put(`/pujas/${initialData._id}`, formData);
                toast.success("Puja updated successfully");
            } else {
                await api.post("/pujas", formData);
                toast.success("Puja created successfully");
            }
            router.push("/dashboard/pujas");
        } catch (error) {
            toast.error("Failed to save puja");
        } finally {
            setSaving(false);
        }
    };

    const updateVersion = (index: number, field: string, value: any) => {
        const updated = [...formData.versions];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, versions: updated });
    };

    const addKitItem = (versionIndex: number) => {
        const updated = [...formData.versions];
        updated[versionIndex].kitItems.push({ icon: '📦', image: '', text: '' });
        setFormData({ ...formData, versions: updated });
    };

    const updateKitItem = (versionIndex: number, itemIndex: number, field: string, value: string) => {
        const updated = [...formData.versions];
        (updated[versionIndex].kitItems[itemIndex] as any)[field] = value;
        setFormData({ ...formData, versions: updated });
    };

    const removeKitItem = (versionIndex: number, itemIndex: number) => {
        const updated = [...formData.versions];
        updated[versionIndex].kitItems.splice(itemIndex, 1);
        setFormData({ ...formData, versions: updated });
    };

    const addTimeSlot = () => {
        setFormData({
            ...formData,
            timeSlots: [...formData.timeSlots, { id: Date.now().toString(), label: '' }]
        });
    };

    const updateTimeSlot = (index: number, value: string) => {
        const updated = [...formData.timeSlots];
        updated[index].label = value;
        setFormData({ ...formData, timeSlots: updated });
    };

    const removeTimeSlot = (index: number) => {
        const updated = [...formData.timeSlots];
        updated.splice(index, 1);
        setFormData({ ...formData, timeSlots: updated });
    };

    const addPrasadam = () => {
        setFormData({
            ...formData,
            prasadamOptions: [...formData.prasadamOptions, { id: Date.now().toString(), label: '', price: 0, description: '', image: '', includes: [] }]
        });
    };

    const updatePrasadam = (index: number, field: string, value: any) => {
        const updated = [...formData.prasadamOptions];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, prasadamOptions: updated });
    };

    const removePrasadam = (index: number) => {
        const updated = [...formData.prasadamOptions];
        updated.splice(index, 1);
        setFormData({ ...formData, prasadamOptions: updated });
    };

    const addAdditionalOffering = () => {
        setFormData({
            ...formData,
            additionalOfferings: [...formData.additionalOfferings, { id: Date.now().toString(), label: '', price: 0, description: '', image: '' }]
        });
    };

    const updateAdditionalOffering = (index: number, field: string, value: any) => {
        const updated = [...formData.additionalOfferings];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, additionalOfferings: updated });
    };

    const removeAdditionalOffering = (index: number) => {
        const updated = [...formData.additionalOfferings];
        updated.splice(index, 1);
        setFormData({ ...formData, additionalOfferings: updated });
    };

    const addTax = () => {
        setFormData({
            ...formData,
            taxes: [...formData.taxes, { id: Date.now().toString(), name: '', percentage: 0, registrationNumber: '' }]
        });
    };

    const updateTax = (index: number, field: string, value: any) => {
        const updated = [...formData.taxes];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, taxes: updated });
    };

    const removeTax = (index: number) => {
        const updated = [...formData.taxes];
        updated.splice(index, 1);
        setFormData({ ...formData, taxes: updated });
    };

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] -m-8 p-8 flex flex-col gap-8">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 py-4 -mx-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/pujas")} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{initialData ? "Edit Puja Service" : "Register New Puja Service"}</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{formData.title || "Untitled Service"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.push("/dashboard/pujas")}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#8D0303] hover:bg-[#700202] text-white shadow-lg shadow-red-900/10 min-w-[140px]">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {initialData ? "Update Puja" : "Publish Puja"}
                    </Button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start relative pb-24">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 space-y-2">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                                activeSection === section.id 
                                    ? "bg-white text-[#8D0303] shadow-sm border border-red-100 ring-2 ring-red-50" 
                                    : "text-gray-500 hover:bg-white hover:text-gray-900"
                            )}
                        >
                            <section.icon className={cn(
                                "w-4 h-4 transition-colors",
                                activeSection === section.id ? "text-[#8D0303]" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            {section.label}
                            {activeSection === section.id && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8D0303]" />
                            )}
                        </button>
                    ))}
                </aside>

                {/* Main Content Areas */}
                <div className="flex-1 w-full space-y-10">
                    {/* Basic Information */}
                    <section id="basic" className="scroll-mt-24">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-white/80 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-500" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>Help devotees discover this puja with a clear title and description.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Puja Title <span className="text-red-500">*</span></label>
                                        <Input 
                                            placeholder="e.g., Sri Satyanarayana Swamy Vratam" 
                                            className="h-12 border-gray-200 focus:ring-red-500 focus:border-red-500 text-lg font-medium" 
                                            value={formData.title} 
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category Tag</label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                            <SelectTrigger className="h-12 border-gray-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="homam">Homam / Ritual Fire</SelectItem>
                                                <SelectItem value="archana">Archana / Offering</SelectItem>
                                                <SelectItem value="abhishekam">Abhishekam / Holy Bath</SelectItem>
                                                <SelectItem value="vratham">Vratham / Fasting Ritual</SelectItem>
                                                <SelectItem value="pooja">Pooja Services</SelectItem>
                                                <SelectItem value="special">Special Occasion</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Expected Duration</label>
                                        <div className="relative">
                                            <Input 
                                                placeholder="e.g., 2-3 hours" 
                                                className="h-12 border-gray-200 pl-4" 
                                                value={formData.duration} 
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Admin Commission</label>
                                        <div className="flex items-center gap-3">
                                            <Input 
                                                type="number" 
                                                className="h-12 border-red-200 w-24 bg-red-50 text-red-700 font-bold" 
                                                value={formData.adminCommissionPercentage} 
                                                onChange={(e) => setFormData({ ...formData, adminCommissionPercentage: Number(e.target.value) })} 
                                            />
                                            <span className="text-sm font-bold text-gray-400">% (Cut)</span>
                                        </div>
                                    </div>
                                </div>


                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Short Catchy Intro</label>
                                    <Textarea 
                                        placeholder="One sentence that summarizes the benefit of this puja..." 
                                        className="border-gray-200 min-h-[80px]" 
                                        value={formData.shortDescription} 
                                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Spiritual Significance (Full History)</label>
                                    <Textarea 
                                        placeholder="Explain the origins, benefits, and how the puja is conducted..." 
                                        className="border-gray-200 min-h-[200px] leading-relaxed" 
                                        value={formData.fullDescription} 
                                        onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Media & Gallery */}
                    <section id="media" className="scroll-mt-24">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-white/80 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                                    Media & Gallery
                                </CardTitle>
                                <CardDescription>Visuals are crucial for devotee trust. Upload high-quality primary and support images.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Primary Hero Image</label>
                                            <span className="text-[10px] text-[#8D0303] bg-red-50 px-2 py-0.5 rounded-full font-bold">Required: 1:1</span>
                                        </div>
                                        <div className="aspect-square w-1/2 relative">
                                            <ImageUpload
                                                value={formData.image}
                                                onChange={(url) => setFormData({ ...formData, image: url })}
                                                aspectRatio={1}
                                                className="h-full w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-red-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Additional Gallery (Up to 5)</label>
                                        <MultiImageUpload
                                            values={formData.images}
                                            onChange={(urls) => setFormData({ ...formData, images: urls })}
                                            className="grid grid-cols-2 gap-4"
                                            aspectRatio={1}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Pricing & Tiers */}
                    <section id="pricing" className="scroll-mt-24">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-white/80 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-marigold" />
                                    Pricing Tiers (Packages)
                                </CardTitle>
                                <CardDescription>Configure distinct packages for different budgets and levels of ritual complexity.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-8 border-b bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-gray-700">Global Taxes & Fees Configuration</h3>
                                            <p className="text-xs text-muted-foreground">These taxes will apply dynamically to all pricing packages at checkout.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addTax} className="h-8 bg-white">
                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Tax/Fee
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.taxes.length === 0 ? (
                                            <div className="text-sm text-gray-500 italic p-4 border rounded-xl bg-white text-center">No taxes configured. (0% will be applied)</div>
                                        ) : (
                                            formData.taxes.map((tax, idx) => (
                                                <div key={idx} className="flex gap-4 items-start p-4 border rounded-xl bg-white relative group">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tax Name</label>
                                                                <Input placeholder="e.g., GST, VAT" value={tax.name} onChange={(e) => updateTax(idx, "name", e.target.value)} className="h-10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage (%)</label>
                                                                <Input type="number" value={tax.percentage} onChange={(e) => updateTax(idx, "percentage", Number(e.target.value))} className="h-10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reg. Number (Optional)</label>
                                                                <Input placeholder="e.g., GSTIN..." value={tax.registrationNumber} onChange={(e) => updateTax(idx, "registrationNumber", e.target.value)} className="h-10 uppercase" />
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
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="w-full h-16 bg-muted/50 rounded-none border-b p-0 flex">
                                        {formData.versions.map((ver) => (
                                            <TabsTrigger 
                                                key={ver.id} 
                                                value={ver.id} 
                                                className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:text-[#8D0303] border-r last:border-r-0 font-bold"
                                            >
                                                {ver.title}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {formData.versions.map((version, idx) => (
                                        <TabsContent key={version.id} value={version.id} className="p-8 mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-gray-700">Package Title</label>
                                                            <Input value={version.title} onChange={(e) => updateVersion(idx, "title", e.target.value)} className="h-11 border-gray-200 font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-gray-700">Ritual Method</label>
                                                            <Input value={version.method} onChange={(e) => updateVersion(idx, "method", e.target.value)} className="h-11 border-gray-200" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-700">Package Base Price (₹)</label>
                                                        <Input type="number" value={version.price} onChange={(e) => updateVersion(idx, "price", Number(e.target.value))} className="h-12 text-2xl font-black text-[#8D0303] border-gray-200" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-700">Earnings Breakdown</label>
                                                        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                                            <div className="flex justify-between p-3 border-b border-gray-200 bg-white">
                                                                <span className="text-sm font-semibold text-gray-500">Base Price</span>
                                                                <span className="text-sm font-bold text-gray-900">₹{version.price || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 border-b border-gray-200 bg-red-50/50">
                                                                <span className="text-sm font-semibold text-red-600">Admin Cut ({formData.adminCommissionPercentage}%)</span>
                                                                <span className="text-sm font-bold text-red-700">- ₹{Math.round((version.price || 0) * ((formData.adminCommissionPercentage || 0) / 100))}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 bg-emerald-50/50">
                                                                <span className="text-sm font-bold text-emerald-700">Pujari Earnings</span>
                                                                <span className="text-base font-black text-emerald-700">₹{(version.price || 0) - Math.round((version.price || 0) * ((formData.adminCommissionPercentage || 0) / 100))}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-gray-700">Display Description</label>
                                                        <Textarea 
                                                            value={version.description} 
                                                            onChange={(e) => updateVersion(idx, "description", e.target.value)} 
                                                            placeholder="Describe why this package is special..." 
                                                            className="min-h-[100px] border-gray-200"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50/50 rounded-2xl border p-6 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-[#8D0303]">Pooja Kit Contents</h4>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addKitItem(idx)} className="h-8 rounded-lg bg-white">
                                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                                        {version.kitItems.length === 0 ? (
                                                            <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-white/50 text-muted-foreground">
                                                                <LayoutGrid className="w-8 h-8 mb-2 opacity-20" />
                                                                <p className="text-xs font-semibold">No kit items added</p>
                                                            </div>
                                                        ) : (
                                                            version.kitItems.map((item, itemIdx) => (
                                                                <div key={itemIdx} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm relative group animate-in zoom-in-95">
                                                                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border bg-gray-50 relative group">
                                                                        <ImageUpload
                                                                            value={item.image}
                                                                            onChange={(url) => updateKitItem(idx, itemIdx, "image", url)}
                                                                            aspectRatio={1}
                                                                            className="w-full h-full"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 space-y-2">
                                                                        <Input 
                                                                            placeholder="Item name (e.g. Kumkum)" 
                                                                            className="h-8 text-xs font-bold border-none bg-gray-50/50 focus:bg-white px-2"
                                                                            value={item.text}
                                                                            onChange={(e) => updateKitItem(idx, itemIdx, "text", e.target.value)}
                                                                        />
                                                                        <div className="flex gap-2 items-center">
                                                                            <span className="text-[10px] font-bold text-gray-400">ICON:</span>
                                                                            <Input 
                                                                                className="h-7 w-12 text-center text-sm p-0 border-gray-100" 
                                                                                value={item.icon} 
                                                                                onChange={(e) => updateKitItem(idx, itemIdx, "icon", e.target.value)} 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white shadow-sm"
                                                                        onClick={() => removeKitItem(idx, itemIdx)}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Availability & Time Slots Setup */}
                    <section id="availability" className="scroll-mt-24">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-white/80 border-b flex flex-row items-center justify-between py-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        Availability Setup
                                    </CardTitle>
                                    <CardDescription>Configure dates and time slots when this puja can be booked.</CardDescription>
                                </div>
                                <Button type="button" onClick={addTimeSlot} className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Add Time Slot
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            Available From Date
                                        </label>
                                        <Input 
                                            type="date"
                                            className="h-12 border-gray-200" 
                                            value={formData.availableDates.startDate} 
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                availableDates: { ...formData.availableDates, startDate: e.target.value } 
                                            })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            Available Until Date
                                        </label>
                                        <Input 
                                            type="date"
                                            className="h-12 border-gray-200" 
                                            value={formData.availableDates.endDate} 
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                availableDates: { ...formData.availableDates, endDate: e.target.value } 
                                            })} 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        Booking Time Slots
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {formData.timeSlots.length === 0 ? (
                                            <div className="col-span-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-gray-50/50 text-muted-foreground">
                                                <Clock className="w-8 h-8 mb-2 opacity-20" />
                                                <p className="font-bold">No time slots added</p>
                                                <p className="text-xs">Any time will be accepted if left empty</p>
                                            </div>
                                        ) : (
                                            formData.timeSlots.map((slot, idx) => (
                                                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative group flex items-center gap-3">
                                                    <Clock className="w-5 h-5 text-gray-400" />
                                                    <Input 
                                                        placeholder="e.g. 06:00 AM - 08:00 AM" 
                                                        className="h-10 font-bold border-none bg-gray-50 focus:bg-white flex-1" 
                                                        value={slot.label} 
                                                        onChange={(e) => updateTimeSlot(idx, e.target.value)} 
                                                    />
                                                    <button 
                                                        className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeTimeSlot(idx)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Prasadam Setup */}
                    <section id="prasadam" className="scroll-mt-24">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-white/80 border-b flex flex-row items-center justify-between py-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Utensils className="w-5 h-5 text-amber-500" />
                                        Prasadam Options
                                    </CardTitle>
                                    <CardDescription>Devotees often prefer adding traditional prasadam to their ritual.</CardDescription>
                                </div>
                                <Button type="button" onClick={addPrasadam} className="rounded-full bg-amber-500 hover:bg-amber-600 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Add Prasadam
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.prasadamOptions.length === 0 ? (
                                        <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-gray-50/50 text-muted-foreground">
                                            <Utensils className="w-10 h-10 mb-2 opacity-10" />
                                            <p className="font-bold">No prasadam options mapped</p>
                                            <p className="text-xs">Devotees will only see the base service</p>
                                        </div>
                                    ) : (
                                        formData.prasadamOptions.map((opt, idx) => (
                                            <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group animate-in slide-in-from-right-4">
                                                <div className="flex gap-4">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-50 shrink-0">
                                                        <ImageUpload
                                                            value={opt.image}
                                                            onChange={(url) => updatePrasadam(idx, "image", url)}
                                                            aspectRatio={1}
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-start gap-4">
                                                            <Input 
                                                                placeholder="Prasadam name..." 
                                                                className="h-9 font-bold border-none bg-gray-50/50 px-3 focus:bg-white" 
                                                                value={opt.label} 
                                                                onChange={(e) => updatePrasadam(idx, "label", e.target.value)} 
                                                            />
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    className="h-9 w-24 pl-6 font-black text-amber-600 border-none bg-amber-50/50 focus:bg-white" 
                                                                    value={opt.price} 
                                                                    onChange={(e) => updatePrasadam(idx, "price", Number(e.target.value))} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <Textarea 
                                                            placeholder="What's included in this prasadam?" 
                                                            className="min-h-[60px] text-xs border-none bg-gray-50/50 focus:bg-white leading-relaxed" 
                                                            value={opt.description} 
                                                            onChange={(e) => updatePrasadam(idx, "description", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-red-500 shadow-md border hover:bg-red-50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                    onClick={() => removePrasadam(idx)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Additional Offerings */}
                    <section id="addons" className="scroll-mt-24 pb-12">
                        <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm shadow-indigo-500/5">
                            <CardHeader className="bg-white/80 border-b flex flex-row items-center justify-between py-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-indigo-500" />
                                        Additional Offerings (Add-ons)
                                    </CardTitle>
                                    <CardDescription>Special items like Vastra Daanam or Cow Pooja that can be added to any package.</CardDescription>
                                </div>
                                <Button type="button" onClick={addAdditionalOffering} className="rounded-full bg-indigo-500 hover:bg-indigo-600 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Add Offering
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.additionalOfferings.length === 0 ? (
                                        <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-indigo-50/20 text-indigo-300">
                                            <Gift className="w-10 h-10 mb-2 opacity-20" />
                                            <p className="font-bold">No additional offerings added</p>
                                        </div>
                                    ) : (
                                        formData.additionalOfferings.map((offering, idx) => (
                                            <div key={idx} className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm relative group animate-in slide-in-from-left-4">
                                                <div className="flex gap-4">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-50 shrink-0">
                                                        <ImageUpload
                                                            value={offering.image}
                                                            onChange={(url) => updateAdditionalOffering(idx, "image", url)}
                                                            aspectRatio={1}
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-start gap-4">
                                                            <Input 
                                                                placeholder="Offering name..." 
                                                                className="h-9 font-bold border-none bg-indigo-50/50 px-3 focus:bg-white" 
                                                                value={offering.label} 
                                                                onChange={(e) => updateAdditionalOffering(idx, "label", e.target.value)} 
                                                            />
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    className="h-9 w-24 pl-6 font-black text-indigo-600 border-none bg-indigo-50/50 focus:bg-white" 
                                                                    value={offering.price} 
                                                                    onChange={(e) => updateAdditionalOffering(idx, "price", Number(e.target.value))} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <Textarea 
                                                            placeholder="Small description of this offering..." 
                                                            className="min-h-[60px] text-xs border-none bg-indigo-50/50 focus:bg-white leading-relaxed" 
                                                            value={offering.description} 
                                                            onChange={(e) => updateAdditionalOffering(idx, "description", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-red-500 shadow-md border hover:bg-red-50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeAdditionalOffering(idx)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-8 py-4 transition-transform duration-300">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Service Status</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className={cn("w-2 h-2 rounded-full", formData.title ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]")} />
                            <span className="text-sm font-bold text-gray-700">{formData.title ? "Ready to Publish" : "Awaiting Basic Info"}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button 
                            variant="ghost" 
                            className="flex-1 md:flex-none font-bold text-gray-400 hover:text-gray-900"
                            onClick={() => router.push("/dashboard/pujas")}
                        >
                            Back To List
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className={cn(
                                "flex-1 md:min-w-[200px] h-14 rounded-2xl text-lg font-black transition-all active:scale-95",
                                "bg-[#8D0303] hover:bg-[#700202] text-white shadow-xl shadow-red-900/20"
                            )}
                        >
                            {saving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span>{initialData ? "SAVE CHANGES" : "PUBLISH SERVICE"}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
