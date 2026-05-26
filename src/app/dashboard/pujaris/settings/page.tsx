"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Loader2, Save, Phone, ScrollText, Image as ImageIcon, Laptop, Globe, ArrowRight, Eye, Upload, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const settingsSchema = z.object({
    pujariSupportPhone: z.string().min(1, "Support phone is required"),
    pujariGuidelines: z.string().min(1, "Guidelines are required"),
})

type SettingsValues = z.infer<typeof settingsSchema>

export default function PujariSettingsPage() {
    const [activeTab, setActiveTab] = useState<"general" | "banner">("general")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Banner States
    const [bannerId, setBannerId] = useState<string | null>(null)
    const [bannerTitle, setBannerTitle] = useState("")
    const [bannerSubtitle, setBannerSubtitle] = useState("")
    const [actionType, setActionType] = useState("none")
    const [actionValue, setActionValue] = useState("")
    const [bgColor, setBgColor] = useState("#8D0303")
    const [textColor, setTextColor] = useState("#FFFFFF")
    const [opacity, setOpacity] = useState(0.15)
    const [isActive, setIsActive] = useState(true)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [isSavingBanner, setIsSavingBanner] = useState(false)

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            pujariSupportPhone: "",
            pujariGuidelines: "",
        },
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch general settings
                const generalRes = await api.get(`/app-config`)
                if (generalRes.data) {
                    form.reset({
                        pujariSupportPhone: generalRes.data.pujariSupportPhone || "+91 9999999999",
                        pujariGuidelines: generalRes.data.pujariGuidelines || "",
                    })
                }

                // Fetch banners list
                const bannerRes = await api.get("/admin/banners")
                if (bannerRes.data?.banners && bannerRes.data.banners.length > 0) {
                    const activeB = bannerRes.data.banners[0] // Get current active banner
                    setBannerId(activeB._id)
                    setBannerTitle(activeB.title || "")
                    setBannerSubtitle(activeB.subtitle || "")
                    setActionType(activeB.actionType || "none")
                    setActionValue(activeB.actionValue || "")
                    setBgColor(activeB.backgroundColor || "#8D0303")
                    setTextColor(activeB.textColor || "#FFFFFF")
                    setOpacity(activeB.overlayOpacity !== undefined ? activeB.overlayOpacity : 0.15)
                    setIsActive(activeB.isActive !== undefined ? activeB.isActive : true)
                    setImagePreview(activeB.imageUrl || "")
                }
            } catch (err) {
                console.error("Failed to load settings:", err)
                toast.error("Failed to load settings data")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [form])

    const onSubmitGeneral = async (data: SettingsValues) => {
        setIsSaving(true)
        try {
            await api.put("/app-config", data)
            toast.success("General settings saved successfully")
        } catch {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSaveBanner = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingBanner(true)
        try {
            const formData = new FormData()
            formData.append("title", bannerTitle)
            formData.append("subtitle", bannerSubtitle)
            formData.append("actionType", actionType)
            formData.append("actionValue", actionValue)
            formData.append("backgroundColor", bgColor)
            formData.append("textColor", textColor)
            formData.append("overlayOpacity", String(opacity))
            formData.append("isActive", String(isActive))
            
            if (imageFile) {
                formData.append("bannerImage", imageFile)
            } else if (!imagePreview) {
                toast.error("Please select a background image")
                setIsSavingBanner(false)
                return
            }

            let res
            if (bannerId) {
                // Update existing banner configuration
                res = await api.put(`/admin/banners/${bannerId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            } else {
                // Create a new banner configuration
                res = await api.post("/admin/banners", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            }

            if (res.data?.success) {
                toast.success("Promo Banner saved successfully")
                if (res.data.banner) {
                    setBannerId(res.data.banner._id)
                    setImagePreview(res.data.banner.imageUrl)
                    setImageFile(null)
                }
            }
        } catch (err: any) {
            console.error("Save Banner Error:", err)
            const errMsg = err.response?.data?.message || "Failed to save promo banner"
            toast.error(errMsg)
        } finally {
            setIsSavingBanner(false)
        }
    }

    const handleDeleteBanner = async () => {
        if (!bannerId) return
        if (!confirm("Are you sure you want to delete this banner configuration?")) return
        
        setIsSavingBanner(true)
        try {
            const res = await api.delete(`/admin/banners/${bannerId}`)
            if (res.data?.success) {
                toast.success("Banner config deleted successfully")
                setBannerId(null)
                setBannerTitle("")
                setBannerSubtitle("")
                setActionType("none")
                setActionValue("")
                setBgColor("#8D0303")
                setTextColor("#FFFFFF")
                setOpacity(0.15)
                setIsActive(true)
                setImageFile(null)
                setImagePreview("")
            }
        } catch (err: any) {
            toast.error("Failed to delete banner configuration")
        } finally {
            setIsSavingBanner(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 w-full pb-10">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                    <ScrollText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Pujari App Settings</h3>
                    <p className="text-muted-foreground">
                        Manage Pujari support, conduct guidelines, and dynamic promotional banners.
                    </p>
                </div>
            </div>
            
            {/* Tabs List */}
            <div className="flex border-b border-gray-200 mt-6">
                <button 
                    onClick={() => setActiveTab("general")}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "general" 
                            ? "border-[#8D0303] text-[#8D0303]" 
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <Phone className="h-4 w-4" />
                    General Settings
                </button>
                <button 
                    onClick={() => setActiveTab("banner")}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "banner" 
                            ? "border-[#8D0303] text-[#8D0303]" 
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <ImageIcon className="h-4 w-4" />
                    Home Promo Banner
                </button>
            </div>

            {/* General Tab */}
            {activeTab === "general" && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitGeneral)} className="space-y-8 mt-2">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-1 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Phone className="h-5 w-5 text-[#8D0303]" />
                                        Support Contact
                                    </CardTitle>
                                    <CardDescription>Pujaris can call this number directly from their dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="pujariSupportPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Support Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91 9999999999" {...field} className="border-[#8D0303]/20" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-1 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ScrollText className="h-5 w-5 text-[#8D0303]" />
                                        Guidelines Status
                                    </CardTitle>
                                    <CardDescription>Verify the sacred conduct rules for all registered Pujaris.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center py-10">
                                    <div className="text-center">
                                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            Active in App
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-3">Updates reflect instantly on mobile devices.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ScrollText className="h-5 w-5 text-[#8D0303]" />
                                    Pujari Guidelines & Code of Conduct
                                </CardTitle>
                                <CardDescription>This text will be displayed in a premium popup modal when Pujaris click "Review Guidelines" in their app.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="pujariGuidelines"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sacred Guidelines Content</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Enter guidelines here... Use new lines for better readability." 
                                                    className="min-h-[250px] border-[#8D0303]/20 focus-visible:ring-[#8D0303] text-base leading-relaxed"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" size="lg" className="bg-[#8D0303] hover:bg-[#720202] text-white px-10 shadow-md transition-all" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}

            {/* Banner Customizer Tab */}
            {activeTab === "banner" && (
                <div className="grid gap-8 md:grid-cols-3 mt-2">
                    {/* Left: Designer Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-[#8D0303]">
                                    <ImageIcon className="h-5 w-5" />
                                    Promo Banner Settings
                                </CardTitle>
                                <CardDescription>Customize the home screen advertisement card style and dynamic click behavior.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveBanner} className="space-y-5">
                                    {/* Upload Image Section */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 block">Banner Background Image</label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="relative border-2 border-dashed border-[#8D0303]/10 hover:border-[#8D0303]/30 transition-all rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 cursor-pointer">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                                                    />
                                                    <Upload className="h-6 w-6 text-[#8D0303]/60 mb-2" />
                                                    <span className="text-xs font-semibold text-[#8D0303]/80">Drag and drop or click to upload banner</span>
                                                    <span className="text-[10px] text-gray-400 mt-1">PNG, JPG or WebP (Recommended aspect ratio 2.5:1, e.g. 1000x400)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Title text */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Title (Primary Header)</label>
                                            <Input 
                                                value={bannerTitle} 
                                                onChange={(e) => setBannerTitle(e.target.value)} 
                                                placeholder="e.g. Boost Visibility"
                                                className="border-[#8D0303]/10 focus-visible:ring-[#8D0303]"
                                            />
                                        </div>
                                        {/* Subtitle text */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subtitle (Overlay Topline)</label>
                                            <Input 
                                                value={bannerSubtitle} 
                                                onChange={(e) => setBannerSubtitle(e.target.value)} 
                                                placeholder="e.g. Expand Your Divine Reach"
                                                className="border-[#8D0303]/10 focus-visible:ring-[#8D0303]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Fallback bg color */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Fallback Color</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="color" 
                                                    value={bgColor} 
                                                    onChange={(e) => setBgColor(e.target.value)} 
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer p-0.5" 
                                                />
                                                <Input 
                                                    value={bgColor} 
                                                    onChange={(e) => setBgColor(e.target.value)}
                                                    className="h-10 text-xs border-[#8D0303]/10"
                                                />
                                            </div>
                                        </div>

                                        {/* Text color */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Text Color</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="color" 
                                                    value={textColor} 
                                                    onChange={(e) => setTextColor(e.target.value)} 
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer p-0.5" 
                                                />
                                                <Input 
                                                    value={textColor} 
                                                    onChange={(e) => setTextColor(e.target.value)}
                                                    className="h-10 text-xs border-[#8D0303]/10"
                                                />
                                            </div>
                                        </div>

                                        {/* Opacity slider */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block flex justify-between">
                                                <span>Dark Overlay</span>
                                                <span className="text-[#8D0303]">{Math.round(opacity * 100)}%</span>
                                            </label>
                                            <div className="pt-2">
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="0.8" 
                                                    step="0.05" 
                                                    value={opacity} 
                                                    onChange={(e) => setOpacity(parseFloat(e.target.value))} 
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8D0303]" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                                        {/* Action Type */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Click Action Behavior</label>
                                            <select 
                                                value={actionType}
                                                onChange={(e) => {
                                                    setActionType(e.target.value)
                                                    setActionValue("")
                                                }}
                                                className="w-full h-10 px-3 border border-[#8D0303]/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8D0303] bg-background"
                                            >
                                                <option value="none">No Action (Informative only)</option>
                                                <option value="url">Open External Web Link</option>
                                                <option value="navigation">Navigate to Mobile App Screen</option>
                                            </select>
                                        </div>

                                        {/* Action Value */}
                                        {actionType !== "none" && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                                                    {actionType === "url" ? "Target Web Address" : "Select Mobile App Screen"}
                                                </label>
                                                {actionType === "url" ? (
                                                    <Input 
                                                        value={actionValue} 
                                                        onChange={(e) => setActionValue(e.target.value)} 
                                                        placeholder="e.g. https://youtube.com/watch?v=..."
                                                        className="border-[#8D0303]/10"
                                                    />
                                                ) : (
                                                    <select
                                                        value={actionValue}
                                                        onChange={(e) => setActionValue(e.target.value)}
                                                        className="w-full h-10 px-3 border border-[#8D0303]/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8D0303] bg-background"
                                                    >
                                                        <option value="">-- Choose Screen --</option>
                                                        <option value="SevaHub">Seva Hub / Job Board</option>
                                                        <option value="Financials">Financial Analytics</option>
                                                        <option value="Withdraw">Withdraw / Wallet History</option>
                                                        <option value="BankDetails">Bank Account Settings</option>
                                                        <option value="Profile">Pujari Profile Details</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Is Active Toggle */}
                                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-800">Banner Visibility</label>
                                            <p className="text-xs text-gray-400">Toggle whether this banner is shown on the Pujari dashboard</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={isActive} 
                                                onChange={(e) => setIsActive(e.target.checked)}
                                                className="w-5 h-5 accent-[#8D0303] rounded cursor-pointer"
                                                id="banner-active"
                                            />
                                            <label htmlFor="banner-active" className="text-sm font-bold cursor-pointer text-gray-700">
                                                {isActive ? "Active" : "Disabled"}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
                                        {bannerId ? (
                                            <Button 
                                                type="button" 
                                                onClick={handleDeleteBanner}
                                                className="bg-transparent border border-red-200 text-red-500 hover:bg-red-50"
                                                disabled={isSavingBanner}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Config
                                            </Button>
                                        ) : <div />}

                                        <Button 
                                            type="submit" 
                                            className="bg-[#8D0303] hover:bg-[#720202] text-white px-8 shadow"
                                            disabled={isSavingBanner}
                                        >
                                            {isSavingBanner ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Banner Design
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Live Preview Box */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="shadow-sm sticky top-6 bg-gray-50 border border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Live Mobile App Preview
                                </CardTitle>
                                <CardDescription className="text-xs">This mimics exactly how the banner displays in the Pujari app.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Simulated Mobile screen segment */}
                                <div className="border-4 border-gray-800 rounded-[30px] p-4 bg-white shadow-xl overflow-hidden relative">
                                    {/* Phone notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3.5 w-24 bg-gray-800 rounded-b-xl z-20" />
                                    
                                    <div className="w-full flex items-center justify-between text-[10px] text-gray-400 font-bold mb-4 mt-2 px-1">
                                        <span>9:41 AM</span>
                                        <div className="flex gap-1 items-center">
                                            <div className="w-2.5 h-1.5 bg-gray-400 rounded-xs" />
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-xs" />
                                        </div>
                                    </div>

                                    {/* App Header segment */}
                                    <div className="mb-4 flex justify-between items-center px-1">
                                        <div>
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase">Om Namah Shivaya</h5>
                                            <h4 className="text-sm font-black text-gray-900 leading-tight">Pandit Ji</h4>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300" />
                                    </div>

                                    {/* Rating segment */}
                                    <div className="mb-4 bg-[#FFFBEB] p-2.5 rounded-xl border border-[#FEF3C7] flex justify-between items-center">
                                        <div>
                                            <span className="text-[8px] font-extrabold uppercase text-amber-700 tracking-wider">SACRED MEDAL</span>
                                            <p className="text-xs font-black text-amber-800">Bronze Level</p>
                                        </div>
                                        <div className="bg-amber-100 px-2 py-0.5 rounded text-[8px] font-extrabold text-amber-800 uppercase">
                                            Active
                                        </div>
                                    </div>

                                    {/* The Dynamic Banner Preview Card */}
                                    {isActive ? (
                                        <div 
                                            className="w-full h-32 rounded-xl overflow-hidden relative flex items-end p-4 shadow-sm border border-gray-100 transition-all"
                                            style={{
                                                backgroundColor: bgColor,
                                                backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {/* Tint overlay */}
                                            <div 
                                                className="absolute inset-0 bg-black transition-opacity duration-150" 
                                                style={{ opacity: opacity }}
                                            />
                                            
                                            {/* Content overlay */}
                                            <div className="relative z-10 w-full flex items-center justify-between">
                                                <div className="flex-1 pr-2">
                                                    <p 
                                                        className="text-[7px] font-extrabold uppercase tracking-widest mb-0.5 opacity-90 transition-colors"
                                                        style={{ color: textColor }}
                                                    >
                                                        {bannerSubtitle || "Expand Your Divine Reach"}
                                                    </p>
                                                    <h4 
                                                        className="text-xs font-black transition-colors"
                                                        style={{ color: textColor }}
                                                    >
                                                        {bannerTitle || "Boost Visibility"}
                                                    </h4>
                                                </div>
                                                
                                                <div 
                                                    className="p-1 rounded-full border transition-all"
                                                    style={{ 
                                                        borderColor: `${textColor}40`,
                                                        backgroundColor: `${textColor}10`
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-100/50">
                                            <span className="text-[10px] text-gray-400 font-bold">Banner is currently disabled</span>
                                            <span className="text-[8px] text-gray-300 mt-0.5">Toggle visibility to display</span>
                                        </div>
                                    )}

                                    {/* Action description info bubble */}
                                    {isActive && (
                                        <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded-lg flex gap-1.5 items-start">
                                            {actionType === "none" && (
                                                <div className="text-[8px] leading-relaxed text-blue-700">
                                                    <strong>Info banner:</strong> No click action configured. Clicking this banner on mobile won't trigger any redirect.
                                                </div>
                                            )}
                                            {actionType === "url" && (
                                                <div className="text-[8px] leading-relaxed text-blue-700">
                                                    <strong>Web redirect:</strong> Clicking this banner will open the external link: <span className="underline font-bold text-blue-800 break-all">{actionValue || "None configured"}</span>
                                                </div>
                                            )}
                                            {actionType === "navigation" && (
                                                <div className="text-[8px] leading-relaxed text-blue-700">
                                                    <strong>In-App navigation:</strong> Clicking this banner will automatically open the mobile app screen: <strong className="text-blue-800">{actionValue || "None selected"}</strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
