"use client"

import { useState, useCallback } from "react"
import { Upload, Loader2, ImagePlus, X, Crop as CropIcon, Save } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Cropper from 'react-easy-crop'
import getCroppedImg from "@/lib/cropImage"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    disabled?: boolean
    className?: string
    aspectRatio?: number // If provided, enables cropping
}

export const ImageUpload = ({
    value,
    onChange,
    disabled,
    className,
    aspectRatio
}: ImageUploadProps) => {
    const [isUploading, setIsUploading] = useState(false)

    // Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [isUploadingCrop, setIsUploadingCrop] = useState(false)

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // If aspectRatio is provided, open cropper
        if (aspectRatio) {
            const objectUrl = URL.createObjectURL(file)
            setCropImageSrc(objectUrl)
            setIsCropping(true)
            setZoom(1)
            setCrop({ x: 0, y: 0 })

            e.target.value = '' // Reset input
            return
        }

        // Direct Upload (No Crop)
        setIsUploading(true)
        const formData = new FormData()
        formData.append("image", file)

        try {
            const response = await api.post(`/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            onChange(response.data.url)
            toast.success("Image uploaded successfully")
        } catch {
            toast.error("Something went wrong with the upload")
        } finally {
            setIsUploading(false)
        }
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const onUploadCroppedImage = async () => {
        if (!cropImageSrc || !croppedAreaPixels) return

        setIsUploadingCrop(true)
        try {
            const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error("Could not create crop blob")

            const formData = new FormData()
            const file = new File([croppedImageBlob], `crop-${Date.now()}.jpg`, { type: "image/jpeg" })
            formData.append("image", file)

            const uploadResponse = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            onChange(uploadResponse.data.url)
            setIsCropping(false)
            setCropImageSrc(null)
            toast.success("Image cropped & uploaded")

        } catch {
            toast.error("Failed to upload cropped image")
        } finally {
            setIsUploadingCrop(false)
        }
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-center w-full h-full relative overflow-hidden rounded-lg">
                {value ? (
                    <>
                        <div className="volume-off absolute top-2 right-2 z-10">
                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onChange("");
                                }}
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            style={{ objectFit: "contain" }}
                            alt="Upload"
                            src={value}
                            className="w-full h-full"
                        />
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <Loader2 className="w-8 h-8 mb-4 text-gray-500 animate-spin" />
                            ) : (
                                <Upload className="w-6 h-6 mb-2 text-gray-500" />
                            )}
                            <p className="text-xs text-gray-500 font-semibold">Click to upload</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={onUpload}
                            disabled={disabled || isUploading}
                        />
                    </label>
                )}
            </div>
            {/* Cropper Modal */}
            <Dialog open={isCropping} onOpenChange={setIsCropping}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-zinc-900 border-zinc-800 text-white z-[200]">
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <CropIcon className="h-5 w-5" />
                            Crop Image
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Adjust the image to fit the aspect ratio.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[400px] bg-black">
                        {cropImageSrc && (
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio || 1}
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
                                        Save & Upload
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
