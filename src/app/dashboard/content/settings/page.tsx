"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { toast } from "sonner"
import { Loader2, Save, Upload, Youtube, Music, ScrollText } from "lucide-react"

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

// Form Schema
const settingsSchema = z.object({
    logoUrl: z.string().optional(),
    liveVideoUrl: z.string().optional(),
    audioStreamUrl: z.string().optional(),
    headerMarqueeText: z.string().optional(),

    // App Config
    androidLink: z.string().optional(),
    iosLink: z.string().optional(),
    androidQrImage: z.string().optional(),
    iosQrImage: z.string().optional(),
})

type SettingsValues = z.infer<typeof settingsSchema>

export default function GlobalSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingAudio, setIsUploadingAudio] = useState(false)
    const [isUploadingAppImage, setIsUploadingAppImage] = useState(false)

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            logoUrl: "",
            liveVideoUrl: "",
            audioStreamUrl: "",
            headerMarqueeText: "",
            androidLink: "",
            iosLink: "",
            androidQrImage: "",
            iosQrImage: "",
        },
    })

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Site Config
                const siteConfigRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/content/site-config`)

                // Fetch App Config
                const appConfigRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/app-config`, { headers })

                let mergedData = {}
                if (siteConfigRes.data && siteConfigRes.data.content) {
                    mergedData = { ...siteConfigRes.data.content }
                }
                if (appConfigRes.data) {
                    mergedData = { ...mergedData, ...appConfigRes.data }
                }

                form.reset(mergedData)
            } catch (error) {
                console.error("Failed to fetch settings", error)
                toast.error("Failed to load some settings")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [form])

    // Generic Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SettingsValues) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (fieldName === "logoUrl") setIsUploading(true)
        else setIsUploadingAppImage(true)

        const formData = new FormData()
        formData.append("image", file)

        try {
            const uploadResponse = await axios.post("http://localhost:5001/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            const url = uploadResponse.data.url
            form.setValue(fieldName, url, { shouldDirty: true })
            toast.success("Image uploaded successfully")
        } catch (error) {
            toast.error("Upload failed")
        } finally {
            if (fieldName === "logoUrl") setIsUploading(false)
            else setIsUploadingAppImage(false)
        }
    }

    // Audio Upload Handler
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingAudio(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const uploadResponse = await axios.post("http://localhost:5001/api/upload-file", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            const url = uploadResponse.data.url
            form.setValue("audioStreamUrl", url, { shouldDirty: true })
            toast.success("Audio uploaded successfully")
        } catch (error) {
            console.error(error)
            toast.error("Audio upload failed")
        } finally {
            setIsUploadingAudio(false)
        }
    }

    // Submit Handler
    const onSubmit = async (data: SettingsValues) => {
        setIsSaving(true)
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
        const headers = { 'Authorization': `Bearer ${token}` }

        try {
            // 1. Save Site Config (Legacy/Global)
            await axios.post("http://localhost:5001/api/content", {
                identifier: "site-config",
                type: "config",
                title: "Global Site Settings",
                content: {
                    logoUrl: data.logoUrl,
                    liveVideoUrl: data.liveVideoUrl,
                    audioStreamUrl: data.audioStreamUrl,
                    headerMarqueeText: data.headerMarqueeText
                }
            }, { headers })

            // 2. Save App Config
            await axios.post("http://localhost:5001/api/app-config", {
                androidLink: data.androidLink,
                iosLink: data.iosLink,
                androidQrImage: data.androidQrImage,
                iosQrImage: data.iosQrImage,
            }, { headers })

            toast.success("All settings saved successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Global Site Settings</h3>
                <p className="text-muted-foreground">
                    Manage branding, live media, and app download configurations.
                </p>
            </div>
            <Separator className="my-4" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">


                    {/* Announcement Bar Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ScrollText className="h-5 w-5 text-[#8D0303]" />
                                Announcement Bar
                            </CardTitle>
                            <CardDescription>Top header scrolling text (Marquee).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="headerMarqueeText"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Announcement Text</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Special Offer: Book any Pooja & get Prasadam delivered FREE!🪔" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Branding Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-[#8D0303]" />
                                Branding
                            </CardTitle>
                            <CardDescription>Upload your website logo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="logoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website Logo</FormLabel>
                                        <div className="flex items-center gap-6">
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex items-center justify-center h-32 w-32 bg-muted/10 relative overflow-hidden">
                                                {field.value ? (
                                                    <img src={field.value} alt="Logo" className="object-contain h-full w-full" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No Logo</span>
                                                )}
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                                        <Loader2 className="h-6 w-6 animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Button type="button" variant="outline" className="relative cursor-pointer" disabled={isUploading}>
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 cursor-pointer opacity-0"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, "logoUrl")}
                                                    />
                                                    Choose File
                                                </Button>
                                                <p className="text-[0.8rem] text-muted-foreground">
                                                    Recommended: PNG or SVG, 200x60px.
                                                </p>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Live Media Controls Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Video Control Card */}
                        <Card className="border-t-4 border-t-red-600 shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center justify-between text-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Youtube className="h-5 w-5 text-red-600" />
                                        </div>
                                        Live Video
                                    </div>
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Configure the YouTube live stream ID.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="liveVideoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Video ID (e.g. ixTqMdxQq4o)"
                                                        {...field}
                                                        className="pl-9 border-red-200 focus-visible:ring-red-600 font-mono"
                                                    />
                                                </div>
                                            </FormControl>

                                            {/* YouTube Preview */}
                                            <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video w-full shadow-inner relative group">
                                                {field.value && field.value.length === 11 ? (
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${field.value}`}
                                                        title="YouTube video preview"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="absolute inset-0 w-full h-full"
                                                    ></iframe>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                                                        <Youtube className="h-10 w-10 opacity-50" />
                                                        <span className="text-sm font-medium">No Video ID</span>
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Audio Control Card */}
                        <Card className="border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center justify-between text-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Music className="h-5 w-5 text-blue-600" />
                                        </div>
                                        Live Audio
                                    </div>
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Upload MP3 for the continuous audio stream.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="audioStreamUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-blue-50/50 transition-colors bg-gradient-to-b from-white to-blue-50/20 group relative overflow-hidden min-h-[220px]">
                                                {field.value ? (
                                                    <div className="relative z-30 pointer-events-none w-full flex flex-col items-center gap-3">
                                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Music className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div className="space-y-1 max-w-full px-2">
                                                            <p className="text-sm font-semibold text-foreground truncate max-w-[200px] mx-auto">
                                                                Audio Uploaded
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto opacity-70">
                                                                {field.value}
                                                            </p>
                                                        </div>
                                                        <div className="w-full max-w-[240px] mt-2 relative z-30 pointer-events-auto">
                                                            <audio controls src={field.value} className="h-8 w-full shadow-sm rounded-full" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground z-10">
                                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                            <Upload className="h-6 w-6" />
                                                        </div>
                                                        <p className="text-sm font-medium text-foreground">Click to upload MP3</p>
                                                        <p className="text-xs">Max size: 10MB</p>
                                                    </div>
                                                )}

                                                {/* Upload Input Overlay */}
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    accept="audio/*"
                                                    disabled={isUploadingAudio}
                                                    onChange={handleAudioUpload}
                                                />

                                                {/* Loading Overlay */}
                                                {isUploadingAudio && (
                                                    <div className="absolute inset-0 bg-white/90 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
                                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                                                        <p className="text-sm font-medium text-blue-600">Uploading Audio...</p>
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* App Downloads Section */}
                    <Card className="border-t-4 border-t-purple-600 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <ScrollText className="h-5 w-5 text-purple-600" />
                                </div>
                                App Downloads
                            </CardTitle>
                            <CardDescription>
                                Manage App Store links and promotional images (Sidebar, Footer, Hero).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="androidLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Android App Link (Play Store)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://play.google.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="iosLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>iOS App Link (App Store)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://apps.apple.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Android QR Code Upload */}
                                <FormField
                                    control={form.control}
                                    name="androidQrImage"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Android QR Code</FormLabel>
                                            <div className="mt-2 text-xs text-muted-foreground mb-2">Displayed in Hero Section when "Android" selected</div>
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 flex flex-col items-center justify-center flex-1 min-h-[150px] relative">
                                                {field.value ? (
                                                    <img src={field.value} alt="Android QR" className="object-contain h-32 w-32" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Upload Android QR</span>
                                                )}
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, "androidQrImage")}
                                                />
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {/* iOS QR Code Upload */}
                                <FormField
                                    control={form.control}
                                    name="iosQrImage"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>iOS QR Code</FormLabel>
                                            <div className="mt-2 text-xs text-muted-foreground mb-2">Displayed in Hero Section when "iOS" selected</div>
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 flex flex-col items-center justify-center flex-1 min-h-[150px] relative">
                                                {field.value ? (
                                                    <img src={field.value} alt="iOS QR" className="object-contain h-32 w-32" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Upload iOS QR</span>
                                                )}
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, "iosQrImage")}
                                                />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    <Button type="submit" size="lg" className="bg-[#8D0303] hover:bg-[#720202] text-white" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
