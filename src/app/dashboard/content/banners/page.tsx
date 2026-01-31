"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Loader2, Save, Plus, Trash2, Upload, GripVertical, Image as ImageIcon, Crop } from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ImageCropper } from "@/components/ui/image-cropper"

// Schema
const bannerSchema = z.object({
    id: z.number(),
    badge: z.string().min(1, "Badge is required"),
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    primaryCTA: z.string().optional(), // Exploring Poojas
    secondaryCTA: z.string().optional(), // Live Darshan
    desktopImage: z.string().min(1, "Desktop Image is required"),
    mobileImage: z.string().min(1, "Mobile Image is required"),
})

const bannersFormSchema = z.object({
    banners: z.array(bannerSchema)
})

type BannersValues = z.infer<typeof bannersFormSchema>

export default function BannersPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [uploadingIndex, setUploadingIndex] = useState<{ index: number, type: 'desktop' | 'mobile' } | null>(null)

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [cropConfig, setCropConfig] = useState<{ index: number, type: 'desktop' | 'mobile', aspect: number } | null>(null)

    const form = useForm<BannersValues>({
        resolver: zodResolver(bannersFormSchema),
        defaultValues: {
            banners: []
        },
    })

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "banners"
    })

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/content/home-hero`)
                if (response.data && response.data.content && Array.isArray(response.data.content.slides)) {
                    form.reset({ banners: response.data.content.slides })
                } else {
                    // Initialize with some default if empty or load fallback logic
                    form.reset({ banners: [] })
                }
            } catch (error) {
                // If 404, it might just mean no config exists yet, which is fine
                console.log("No existing banner config found or error fetching.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [form])

    // Image Upload Handler - Step 1: Read File & Open Cropper
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number, type: 'desktop' | 'mobile') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setSelectedImage(reader.result as string)
            setCropConfig({
                index,
                type,
                aspect: type === 'desktop' ? 16 / 9 : 9 / 16
            })
            setCropperOpen(true)
        })
        reader.readAsDataURL(file)

        // Reset input value so same file can be selected again
        e.target.value = ''
    }

    // Step 2: Upload Cropped Image
    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!cropConfig) return

        const { index, type } = cropConfig
        setCropperOpen(false)
        setUploadingIndex({ index, type })

        const formData = new FormData()
        formData.append("image", croppedBlob, "cropped-image.jpg")

        try {
            const uploadResponse = await api.post("/upload/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            const url = uploadResponse.data.url

            const fieldName = type === 'desktop' ? `banners.${index}.desktopImage` : `banners.${index}.mobileImage`
            form.setValue(fieldName as any, url, { shouldDirty: true })

            toast.success("Image cropped & uploaded successfully")
        } catch {
            toast.error("Upload failed")
        } finally {
            setUploadingIndex(null)
            setSelectedImage(null)
            setCropConfig(null)
        }
    }

    // Submit Handler
    const onSubmit = async (data: BannersValues) => {
        setIsSaving(true)
        try {
            await api.post("/content", {
                identifier: "home-hero",
                type: "slider",
                title: "Home Page Hero Slider",
                content: {
                    slides: data.banners
                }
            })
            toast.success("Banners saved successfully")
        } catch {
            toast.error("Failed to save banners")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 max-w-5xl pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Home Banners</h3>
                    <p className="text-muted-foreground">
                        Manage the sliding banners on the home page.
                    </p>
                </div>
                <Button
                    onClick={() => append({
                        id: Date.now(),
                        badge: "🙏 Welcome",
                        title: "New Banner",
                        subtitle: "Subtitle here",
                        description: "Description goes here",
                        primaryCTA: "Explore",
                        secondaryCTA: "Learn More",
                        desktopImage: "",
                        mobileImage: ""
                    })}
                    className="bg-[#FEB703] text-[#8D0303] hover:bg-[#FEB703]/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Banner
                </Button>
            </div>

            <Separator className="my-4" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {fields.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-muted-foreground">No Banners Added</h3>
                            <p className="text-sm text-muted-foreground/70 mb-4">Click "Add Banner" to start creating your home slider.</p>
                            <Button
                                type="button"
                                onClick={() => append({
                                    id: Date.now(),
                                    badge: "🙏 New",
                                    title: "Welcome",
                                    subtitle: "To BookMySeva",
                                    description: "Start your spiritual journey today.",
                                    primaryCTA: "Explore Poojas",
                                    secondaryCTA: "View Temples",
                                    desktopImage: "",
                                    mobileImage: ""
                                })}
                                variant="outline"
                            >
                                Create First Banner
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="relative group hover:border-[#FEB703]/50 transition-all duration-300">
                                    <div className="absolute right-4 top-4 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                            title="Drag to reorder (Coming soon)"
                                        >
                                            <GripVertical className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="h-8 w-8"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <CardHeader className="pb-3 border-b bg-muted/5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[#8D0303] text-white text-xs font-bold px-2 py-1 rounded">
                                                Slide {index + 1}
                                            </div>
                                            <CardTitle className="text-lg">
                                                {form.watch(`banners.${index}.title`) || "Untitled Banner"}
                                            </CardTitle>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6 grid gap-6">
                                        {/* Text Content */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.badge`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Badge (Small Tag)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. 🙏 Welcome" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.title`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Main Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Divine Services" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.subtitle`}
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
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Short description..." className="h-10 min-h-[40px] resize-none" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.primaryCTA`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Primary Button</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Button Text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.secondaryCTA`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Secondary Button</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Button Text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Separator />

                                        {/* Images */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Desktop Image */}
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.desktopImage`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Desktop Image (Landscape)</FormLabel>
                                                        <div className="mt-2 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-40 bg-muted/10 relative overflow-hidden transition-colors hover:bg-muted/20">
                                                            {field.value ? (
                                                                <img src={field.value} alt="Desktop" className="h-full w-full object-cover rounded-md" />
                                                            ) : (
                                                                <div className="text-center">
                                                                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                                                                    <span className="text-xs text-muted-foreground">Upload Desktop Image</span>
                                                                </div>
                                                            )}

                                                            {/* Upload Overlay */}
                                                            <div className="absolute inset-0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
                                                                    Change & Crop
                                                                </Button>
                                                            </div>

                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                                accept="image/*"
                                                                disabled={uploadingIndex?.index === index && uploadingIndex?.type === 'desktop'}
                                                                onChange={(e) => handleImageSelect(e, index, 'desktop')}
                                                            />

                                                            {uploadingIndex?.index === index && uploadingIndex?.type === 'desktop' && (
                                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Mobile Image */}
                                            <FormField
                                                control={form.control}
                                                name={`banners.${index}.mobileImage`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mobile Image (Portrait)</FormLabel>
                                                        <div className="mt-2 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-40 bg-muted/10 relative overflow-hidden transition-colors hover:bg-muted/20">
                                                            {field.value ? (
                                                                <img src={field.value} alt="Mobile" className="h-full w-full object-cover rounded-md" />
                                                            ) : (
                                                                <div className="text-center">
                                                                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                                                                    <span className="text-xs text-muted-foreground">Upload Mobile Image</span>
                                                                </div>
                                                            )}

                                                            {/* Upload Overlay */}
                                                            <div className="absolute inset-0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
                                                                    Change & Crop
                                                                </Button>
                                                            </div>

                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                                accept="image/*"
                                                                disabled={uploadingIndex?.index === index && uploadingIndex?.type === 'mobile'}
                                                                onChange={(e) => handleImageSelect(e, index, 'mobile')}
                                                            />

                                                            {uploadingIndex?.index === index && uploadingIndex?.type === 'mobile' && (
                                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {fields.length > 0 && (
                        <div className="sticky bottom-4 z-50 flex justify-end bg-background/80 backdrop-blur p-4 rounded-xl border shadow-lg">
                            <Button type="submit" size="lg" className="bg-[#8D0303] hover:bg-[#720202] text-white shadow-md shadow-red-900/20" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save All Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </form>
            </Form>

            {/* Cropper Modal */}
            {selectedImage && cropConfig && (
                <ImageCropper
                    open={cropperOpen}
                    onClose={() => setCropperOpen(false)}
                    imageSrc={selectedImage}
                    aspect={cropConfig.aspect}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    )
}
