"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2, Sparkles, Upload, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import RichTextEditor from "@/components/editor/RichTextEditor"
import SeoSidebar from "@/components/editor/SeoSidebar"
import Cropper from 'react-easy-crop'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import getCroppedImg from "@/lib/cropImage"

export default function BlogEditorPage() {
    const params = useParams()
    const router = useRouter()
    const blogId = params.blogId as string
    const isNew = blogId === 'new'

    const [isLoading, setIsLoading] = useState(!isNew)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [domLoaded, setDomLoaded] = useState(false)

    useEffect(() => {
        setDomLoaded(true)
    }, [])

    // Form State
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [content, setContent] = useState<any>({
        type: 'doc',
        content: [{ type: 'paragraph' }]
    })
    const [excerpt, setExcerpt] = useState("")
    const [featuredImage, setFeaturedImage] = useState("")
    const [status, setStatus] = useState("draft")
    const [category, setCategory] = useState("General")
    const [availableCategories, setAvailableCategories] = useState<any[]>([])

    // SEO State
    const [metaTitle, setMetaTitle] = useState("")
    const [metaDescription, setMetaDescription] = useState("")
    const [keywords, setKeywords] = useState("")
    const [ogImage, setOgImage] = useState("")

    // Cropping State
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [isCropping, setIsCropping] = useState(false)
    const [tempImageSrc, setTempImageSrc] = useState("")


    // Real-time Editor Stats (extracted from Tiptap content if possible, or just estimation)
    // Tiptap JSON is structured. We can count text nodes roughly or use textContent from `editor.getText()` if we had access to editor instance directly.
    // Since we only have `content` JSON state here, we'll do a rough estimation or pass a callback from Editor?
    // Actually, RichTextEditor could pass specific stats back, but let's just use stringify length as proxy or extract text recursively for accuracy.
    // Or better: Pass a `onStatsChange` prop to Editor? 
    // For MVP, allow me to parse the JSON content roughly.

    const extractText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (!node) return '';
        if (Array.isArray(node)) return node.map(extractText).join(' ');
        if (node.text) return node.text;
        if (node.content) return extractText(node.content);
        return '';
    }

    const plainText = useMemo(() => extractText(content), [content]);
    const wordCount = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // SEO Calculation
    const seoScore = useMemo(() => {
        let score = 0;
        // 1. Title Presence (10)
        if (title.length > 0) score += 10;
        // 2. Title Length (20) - ideal 30-60
        if (title.length >= 30 && title.length <= 60) score += 20;
        else if (title.length > 10) score += 10;

        // 3. Content Length (30) - ideal > 300 words
        if (wordCount > 300) score += 30;
        else if (wordCount > 100) score += 15;

        // 4. Meta Description (20) - ideal 120-160
        if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 20;
        else if (metaDescription.length > 50) score += 10;

        // 5. Keyword in Title (10)
        const firstKeyword = keywords.split(',')[0]?.trim().toLowerCase();
        if (firstKeyword && title.toLowerCase().includes(firstKeyword)) score += 10;

        // 6. Featured Image (10)
        if (featuredImage) score += 10;

        return Math.min(100, score);
    }, [title, wordCount, metaDescription, keywords, featuredImage]);

    const keywordDensity = useMemo(() => {
        const firstKeyword = keywords.split(',')[0]?.trim().toLowerCase();
        if (!firstKeyword || wordCount === 0) return 0;
        const matches = plainText.toLowerCase().match(new RegExp(firstKeyword, 'g'));
        return matches ? (matches.length / wordCount) * 100 : 0;
    }, [keywords, plainText, wordCount]);

    // Fetch Data
    useEffect(() => {
        if (!isNew) {
            const fetchData = async () => {
                try {
                    const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
                    const headers = { 'Authorization': `Bearer ${token}` };
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs/${blogId}`, { headers })
                    const data = res.data;

                    setTitle(data.title)
                    setSlug(data.slug)
                    setContent(data.content || {})
                    setExcerpt(data.excerpt || "")
                    setFeaturedImage(data.image || "")
                    setStatus(data.status || "draft")
                    setCategory(data.category || "General")
                    setMetaTitle(data.seo?.metaTitle || "")
                    setMetaDescription(data.seo?.metaDescription || "")
                    setKeywords(data.seo?.keywords?.join(', ') || "")
                    setOgImage(data.seo?.ogImage || "")

                } catch (error) {
                    console.error(error)
                    toast.error("Failed to load blog post")
                } finally {
                    setIsLoading(false)
                }
            }
            fetchData()
        }
    }, [blogId, isNew])

    // Slug Auto-generate
    useEffect(() => {
        if (isNew && title) {
            setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
        }
    }, [title, isNew])


    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }
            const response = await axios.get("http://localhost:5001/api/categories", { headers })
            setAvailableCategories(response.data)
        } catch (error) {
            console.error("Failed to fetch categories", error)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setTempImageSrc(reader.result?.toString() || "")
            setIsCropping(true)
        })
        reader.readAsDataURL(file)

        // Reset input value so same file can be selected again
        e.target.value = ''
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const uploadCroppedImage = async () => {
        try {
            if (!croppedAreaPixels) return

            setIsUploading(true)
            const croppedImageBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels)

            if (!croppedImageBlob) {
                toast.error("Failed to crop image")
                return
            }

            // Create a file from blob
            const file = new File([croppedImageBlob], "featured-image.jpg", { type: "image/jpeg" })

            const formData = new FormData()
            formData.append("image", file)

            const uploadResponse = await axios.post("http://localhost:5001/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            setFeaturedImage(uploadResponse.data.url)
            toast.success("Image uploaded")
            setIsCropping(false)
        } catch (error) {
            console.error(error)
            toast.error("Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        if (!title || !slug) {
            toast.error("Title and Slug are required")
            return
        }

        setIsSaving(true)
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
        const headers = { 'Authorization': `Bearer ${token}` }

        const payload = {
            title,
            slug,
            content,
            excerpt,
            image: featuredImage,
            status,
            category,
            seo: {
                metaTitle,
                metaDescription,
                keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
                ogImage
            }
        }

        try {
            if (isNew) {
                await axios.post("http://localhost:5001/api/blogs", payload, { headers })
                toast.success("Blog created successfully")
                router.push("/dashboard/content/blogs")
            } else {
                await axios.put(`http://localhost:5001/api/blogs/${blogId}`, payload, { headers })
                toast.success("Blog updated successfully")
            }
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save blog";
            toast.error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    if (!domLoaded) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col mx-[-0.5rem] my-[-1rem] md:m-[-2rem]">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-20">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="bg-background hover:bg-[#8D0303] hover:text-white transition-colors border-2" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">{isNew ? "New Blog Post" : "Edit Blog Post"}</h1>
                        <span className={`text-xs px-2 py-0.5 rounded-[5px] ${status === 'published' ? 'bg-green-600 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
                            {status === 'published' ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Content Area - Split Pane */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left: Editor (Scrollable) */}
                {/* Left: Editor (Scrollable) */}
                <div className="w-[70%] overflow-y-auto space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#8D0303] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#700202] [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="w-full space-y-6 p-6 md:p-8">
                        <div className="relative group">
                            <textarea
                                placeholder="Post Title"
                                className="w-full text-5xl font-extrabold bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-muted-foreground/30 leading-tight"
                                value={title}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setTitle(newTitle);
                                    // Auto-generate slug if it's a new post or slug is empty/matches old title
                                    if (isNew) {
                                        setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                                    }
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                rows={1}
                                style={{ fieldSizing: "content" } as any}
                            />
                            <div className="absolute bottom-0 left-0 h-1 w-20 bg-primary/50 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        </div>

                        <RichTextEditor
                            content={content}
                            onChange={(json) => setContent(json)}
                        />
                    </div>
                </div>

                {/* Right: Sidebar (Settings/SEO) */}
                <div className="w-[30%] border-l bg-muted/10 overflow-y-auto p-4 shrink-0 hidden xl:block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#8D0303] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#700202] [&::-webkit-scrollbar-track]:bg-transparent">
                    <Tabs defaultValue="settings">
                        <TabsList className="w-full">
                            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                            <TabsTrigger value="seo" className="flex-1">SEO & Metadata</TabsTrigger>
                        </TabsList>

                        <TabsContent value="settings" className="space-y-6 mt-4">
                            {/* Featured Image */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Featured Image</Label>
                                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">1200 x 630px recommended</span>
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 space-y-1">
                                    <p>• Aspect Ratio: 16:9 or 1.91:1</p>
                                    <p>• Max Size: 5MB (JPG, PNG, WEBP)</p>
                                </div>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center bg-background min-h-[120px] relative overflow-hidden group hover:border-[#8D0303] transition-colors">
                                    {featuredImage ? (
                                        <>
                                            <img src={featuredImage} alt="Featured" className="w-full h-full object-cover absolute inset-0" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => document.getElementById('image-upload')?.click()}>Change</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <input id="image-upload" type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                                </div>
                                {isUploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Slug</Label>
                                <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono text-xs" />
                            </div>

                            <div className="space-y-2">
                                <Label>Excerpt</Label>
                                <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="Short summary..." />
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories.length > 0 ? (
                                            availableCategories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="General" disabled>No categories found</SelectItem>
                                        )}
                                        {/* Fallback if current category is not in list (e.g. deleted) but saved on blog */}
                                        {category && !availableCategories.find(c => c.name === category) && (
                                            <SelectItem value={category}>{category}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="seo" className="space-y-6 mt-4">
                            <SeoSidebar
                                score={seoScore}
                                title={metaTitle || title}
                                description={metaDescription || excerpt || "No description"}
                                slug={slug}
                                wordCount={wordCount}
                                keywordDensity={keywordDensity}
                            />

                            <Separator />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Meta Title</Label>
                                    <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO Title" />
                                    <p className="text-xs text-muted-foreground text-right">{metaTitle.length}/60</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Meta Description</Label>
                                    <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} placeholder="SEO Description" />
                                    <p className="text-xs text-muted-foreground text-right">{metaDescription.length}/160</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Keywords (comma separated)</Label>
                                    <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. pooja, online, temple" />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Image Cropper Dialog */}
            <Dialog open={isCropping} onOpenChange={setIsCropping}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Crop Featured Image</DialogTitle>
                        <DialogDescription>Adjust the image to fit the 16:9 aspect ratio.</DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[400px] bg-black rounded-md overflow-hidden">
                        <Cropper
                            image={tempImageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium w-12">Zoom</span>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(value) => setZoom(value[0])}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCropping(false)}>Cancel</Button>
                        <Button onClick={uploadCroppedImage} disabled={isUploading} className="bg-[#8D0303] text-white hover:bg-[#700202]">
                            {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Apply & Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
