"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Save, X, Crop as CropIcon, Smartphone, Monitor, Pencil, MousePointerClick, BarChart3 } from "lucide-react"
import Cropper from 'react-easy-crop'
import getCroppedImg from "@/lib/cropImage"

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
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Schema for a single banner
const bannerSchema = z.object({
    badge: z.string().optional(), // e.g. "🙏 Welcome"
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    desktopImageUrl: z.string().min(1, "Desktop Image is required"),
    mobileImageUrl: z.string().min(1, "Mobile Image is required"),

    // Primary CTA
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),

    // Secondary CTA
    secondaryCtaText: z.string().optional(),
    secondaryCtaLink: z.string().optional(),

    // Stats (Array of 3 objects)
    stats: z.array(z.object({
        value: z.string(), // e.g. "10K+"
        label: z.string()  // e.g. "Poojas"
    })).optional()
})

type BannerValues = z.infer<typeof bannerSchema>

export default function BannersPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [banners, setBanners] = useState<BannerValues[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    // Form
    const form = useForm<BannerValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            badge: "🙏 Welcome",
            title: "",
            subtitle: "",
            desktopImageUrl: "",
            mobileImageUrl: "",
            ctaText: "Learn More",
            ctaLink: "",
            secondaryCtaText: "View Video",
            secondaryCtaLink: "",
            stats: [
                { value: "10K+", label: "Poojas" },
                { value: "500+", label: "Poojaris" },
                { value: "4.9★", label: "Rating" }
            ]
        },
    })

    const fetchBanners = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/content/banner-1`);
            if (response.data && response.data.content && Array.isArray(response.data.content)) {
                setBanners(response.data.content)
            }
        } catch (error) {
            console.error("Failed to fetch banners", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch Banners
    useEffect(() => {
        fetchBanners()
    }, [])

    // --- CROPPER STATE & LOGIC ---
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [cropType, setCropType] = useState<"desktop" | "mobile">("desktop") // Which field are we cropping for?
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [isUploadingCrop, setIsUploadingCrop] = useState(false)

    // 1. Select File -> Open Cropper
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener("load", () => {
                setCropImageSrc(reader.result as string)
                setCropType(type)
                setIsCropping(true)
                setZoom(1)
                setCrop({ x: 0, y: 0 })
            })
            reader.readAsDataURL(file)
        }
        // Reset input so same file can be selected again if needed
        e.target.value = ''
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    // 2. Save Crop -> Upload Blob -> Set URL
    const onUploadCroppedImage = async () => {
        if (!cropImageSrc || !croppedAreaPixels) return

        setIsUploadingCrop(true)
        try {
            const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error("Could not create crop blob")

            const formData = new FormData()
            // Create a File from the Blob
            const file = new File([croppedImageBlob], `banner-${cropType}-${Date.now()}.jpg`, { type: "image/jpeg" })
            formData.append("image", file)

            const uploadResponse = await axios.post("http://localhost:5001/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            const url = uploadResponse.data.url
            if (cropType === "desktop") {
                form.setValue("desktopImageUrl", url, { shouldDirty: true })
            } else {
                form.setValue("mobileImageUrl", url, { shouldDirty: true })
            }

            setIsCropping(false) // Close cropper
            setCropImageSrc(null)
            toast.success("Image cropped & uploaded!")

        } catch (e) {
            console.error(e)
            toast.error("Failed to upload cropped image")
        } finally {
            setIsUploadingCrop(false)
        }
    }


    // --- MAIN FORM ACTIONS ---

    const openAddDialog = () => {
        setEditingIndex(null)
        form.reset({
            badge: "🙏 Welcome",
            title: "",
            subtitle: "",
            desktopImageUrl: "",
            mobileImageUrl: "",
            ctaText: "Learn More",
            ctaLink: "",
            secondaryCtaText: "View Video",
            secondaryCtaLink: "",
            stats: [
                { value: "10K+", label: "Poojas" },
                { value: "500+", label: "Poojaris" },
                { value: "4.9★", label: "Rating" }
            ]
        })
        setIsDialogOpen(true)
    }

    const onEditBanner = (index: number) => {
        setEditingIndex(index)
        form.reset(banners[index])
        setIsDialogOpen(true)
    }

    const onSubmitBanner = async (data: BannerValues) => {
        let newBanners = [...banners]
        if (editingIndex !== null) {
            newBanners[editingIndex] = data
        } else {
            newBanners = [...banners, data]
        }
        await saveBanners(newBanners)
        setIsDialogOpen(false)
        form.reset()
        setEditingIndex(null)
    }

    const onDeleteBanner = async (index: number) => {
        const newBanners = banners.filter((_, i) => i !== index)
        await saveBanners(newBanners)
    }

    const saveBanners = async (newBanners: BannerValues[]) => {
        setIsSaving(true)
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]

        try {
            await axios.post("http://localhost:5001/api/content", {
                identifier: "home-banners",
                type: "slider",
                title: "Homepage Hero Banners",
                content: newBanners
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setBanners(newBanners)
            toast.success("Banners updated successfully")
        } catch (error) {
            toast.error("Failed to update banners")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Hero Banners</h3>
                    <p className="text-muted-foreground">
                        Manage the sliding banners on the homepage (Desktop & Mobile).
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddDialog} className="bg-[#8D0303] hover:bg-[#720202] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#8D0303] [&::-webkit-scrollbar-thumb]:rounded-full">
                        <DialogHeader>
                            <DialogTitle>{editingIndex !== null ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                            <DialogDescription>
                                {editingIndex !== null ? "Update banner details and images." : "Create a new slide. Upload separate images for Desktop and Mobile."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitBanner)} className="space-y-6">
                                {/* BADGE Input */}
                                <FormField
                                    control={form.control}
                                    name="badge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Badge Text</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 🙏 Welcome" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Title & Subtitle */}
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Divine Services" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="subtitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subtitle</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. At Your Doorstep" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* IMAGE UPLOADS ROW */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Desktop Image Field */}
                                    <FormField
                                        control={form.control}
                                        name="desktopImageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Monitor className="h-4 w-4 text-blue-600" />
                                                    Desktop Image (16:9)
                                                </FormLabel>
                                                <div className="space-y-2">
                                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 h-32 flex items-center justify-center bg-muted/10 relative overflow-hidden group">
                                                        {field.value ? (
                                                            <>
                                                                <img src={field.value} alt="Desktop Preview" className="h-full w-full object-cover rounded-md" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button type="button" variant="secondary" size="sm" className="pointer-events-none">Change</Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-muted-foreground">
                                                                <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                                                                <span className="text-[10px]">Select & Crop (Landscape)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" className="w-full relative border-blue-200 hover:bg-blue-50 text-blue-700">
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 cursor-pointer opacity-0"
                                                            accept="image/*"
                                                            onChange={(e) => onSelectFile(e, "desktop")}
                                                        />
                                                        {field.value ? "Change Desktop Image" : "Select Desktop Image"}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Mobile Image Field */}
                                    <FormField
                                        control={form.control}
                                        name="mobileImageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Smartphone className="h-4 w-4 text-green-600" />
                                                    Mobile Image (4:5)
                                                </FormLabel>
                                                <div className="space-y-2">
                                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 h-32 flex items-center justify-center bg-muted/10 relative overflow-hidden group">
                                                        {field.value ? (
                                                            <>
                                                                <img src={field.value} alt="Mobile Preview" className="h-full w-full object-cover rounded-md" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button type="button" variant="secondary" size="sm" className="pointer-events-none">Change</Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-muted-foreground">
                                                                <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                                                                <span className="text-[10px]">Select & Crop (Portrait)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" className="w-full relative border-green-200 hover:bg-green-50 text-green-700">
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 cursor-pointer opacity-0"
                                                            accept="image/*"
                                                            onChange={(e) => onSelectFile(e, "mobile")}
                                                        />
                                                        {field.value ? "Change Mobile Image" : "Select Mobile Image"}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="ctaText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Button Text</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Book Now" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ctaLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Button Link</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. /book-pooja" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="secondaryCtaText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Secondary Button Text</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. View Video" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="secondaryCtaLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Secondary Button Link</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. /video" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />
                                <Label>Stats / Ratings</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Stat 1 */}
                                    <div className="space-y-2">
                                        <Input placeholder="Value (e.g. 10K+)" {...form.register(`stats.${0}.value`)} />
                                        <Input placeholder="Label (e.g. Poojas)" {...form.register(`stats.${0}.label`)} />
                                    </div>
                                    {/* Stat 2 */}
                                    <div className="space-y-2">
                                        <Input placeholder="Value (e.g. 500+)" {...form.register(`stats.${1}.value`)} />
                                        <Input placeholder="Label (e.g. Poojaris)" {...form.register(`stats.${1}.label`)} />
                                    </div>
                                    {/* Stat 3 */}
                                    <div className="space-y-2">
                                        <Input placeholder="Value (e.g. 4.9★)" {...form.register(`stats.${2}.value`)} />
                                        <Input placeholder="Label (e.g. Rating)" {...form.register(`stats.${2}.label`)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-[#8D0303] text-white hover:bg-[#720202] w-full md:w-auto" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingIndex !== null ? "Update Banner" : "Save Banner"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Separator />

            {/* Banners List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {banners.map((banner, index) => (
                    <div key={index} className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-500 shadow-2xl">

                        {/* 1. MAIN DESKTOP PREVIEW (Full Bleed Background) */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <img
                                src={banner.desktopImageUrl}
                                alt="Desktop Banner"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Cinematic Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />

                            {/* Top Left: Badge */}
                            {banner.badge && (
                                <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10">
                                    {banner.badge}
                                </div>
                            )}

                            {/* Top Right: Actions (Visible on Hover in Desktop, always on Touch if needed) */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 z-20">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => onEditBanner(index)}
                                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black border border-white/10"
                                    title="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => onDeleteBanner(index)}
                                    className="h-8 w-8 rounded-full bg-red-500/20 backdrop-blur-md hover:bg-red-500 text-red-100 hover:text-white border border-red-500/30"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Bottom Content Area (Immersive) */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                                <h4 className="text-xl font-bold font-heading leading-tight mb-1 drop-shadow-md">
                                    {banner.title}
                                </h4>
                                {banner.subtitle && (
                                    <p className="text-sm text-zinc-300 line-clamp-1 mb-3 opacity-90">
                                        {banner.subtitle}
                                    </p>
                                )}

                                {/* Metadata Pills (Glassmorphic) */}
                                <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                                    {banner.ctaLink && (
                                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-zinc-100">
                                            <MousePointerClick className="h-3 w-3 text-[#FEB703]" />
                                            <span>{banner.ctaText || "Primary CTA"}</span>
                                        </div>
                                    )}
                                    {banner.secondaryCtaLink && (
                                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-zinc-300">
                                            <LinkIcon className="h-3 w-3" />
                                            <span>{banner.secondaryCtaText || "Secondary"}</span>
                                        </div>
                                    )}
                                    {banner.stats && banner.stats.length > 0 && (
                                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-zinc-300">
                                            <BarChart3 className="h-3 w-3" />
                                            <span>{banner.stats.length} Stats</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. MOBILE FLOATING MOCKUP (Hover Reveal/Transition) */}
                        {/* We position this slightly off-canvas or tucked in, creating a fun parallax feel */}
                        <div className="absolute -bottom-16 -right-6 w-[28%] aspect-[4/5] bg-black rounded-2xl border-[4px] border-zinc-800 shadow-2xl overflow-hidden rotate-[-12deg] group-hover:rotate-[-6deg] group-hover:bottom-[-20px] group-hover:right-[-10px] transition-all duration-500 ease-out z-20 pointer-events-none">
                            <div className="relative h-full w-full">
                                <img
                                    src={banner.mobileImageUrl}
                                    alt="Mobile Banner"
                                    className="h-full w-full object-cover"
                                />
                                {/* Mobile Glossy Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
                        <p>No banners added yet.</p>
                        <p className="text-sm">Click "Add Banner" to get started.</p>
                    </div>
                )}
            </div>

            {/* CROPPER MODAL/OVERLAY */}
            {/* CROPPER MODAL/OVERLAY */}
            <Dialog open={isCropping} onOpenChange={setIsCropping}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <CropIcon className="h-5 w-5" />
                            Crop {cropType === "desktop" ? "Desktop" : "Mobile"} Image
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Adjust the image to fit the {cropType === "desktop" ? "16:9" : "4:5"} aspect ratio.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[400px] bg-black">
                        {cropImageSrc && (
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropType === "desktop" ? 16 / 9 : 4 / 5}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-16 text-zinc-300">Zoom</Label>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(vals: number[]) => setZoom(vals[0])}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => setIsCropping(false)} className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white">
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={onUploadCroppedImage}
                                disabled={isUploadingCrop}
                                className="bg-[#8D0303] hover:bg-[#720202] text-white"
                            >
                                {isUploadingCrop ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Crop & Upload
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
