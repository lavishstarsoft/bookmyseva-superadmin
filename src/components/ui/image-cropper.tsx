"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import getCroppedImg from "@/lib/canvasUtils"
import { Loader2 } from "lucide-react"

interface ImageCropperProps {
    open: boolean
    imageSrc: string
    aspect: number
    onClose: () => void
    onCropComplete: (croppedImageBlob: Blob) => void
}

export function ImageCropper({ open, imageSrc, aspect, onClose, onCropComplete }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return

        setIsCropping(true)
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsCropping(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-[400px] bg-black/90">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium w-12">Zoom</span>
                        <Slider
                            defaultValue={[1]}
                            min={1}
                            max={3}
                            step={0.1}
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10">
                    <Button variant="outline" onClick={onClose} disabled={isCropping}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isCropping} className="bg-[#8D0303] hover:bg-[#720202]">
                        {isCropping ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cropping...
                            </>
                        ) : (
                            "Apply Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
