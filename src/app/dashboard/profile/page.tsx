"use client"

import { useState, useEffect } from "react"
import { ProfileForm } from "./profile-form"
import { SecurityForm } from "./security-form"
import { PreferencesForm } from "./preferences-form"
import { LoginHistory } from "./login-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Shield, User, Camera, Loader2, History } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "sonner"

export default function SettingsProfilePage() {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [userData, setUserData] = useState<any>(null)

    // Helper to get token
    const getToken = () => {
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'))
        return match ? match[2] : null
    }

    // Fetch user data on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/user/me`)
                if (response.data.avatar) {
                    setAvatarUrl(response.data.avatar)
                }
                setUserData(response.data)
            } catch {
                // Error fetching user
            } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("image", file)

        try {
            // 1. Upload image
            const uploadResponse = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            const newAvatarUrl = uploadResponse.data.url

            // 2. Update User Profile in Database
            await api.put("/user/profile", {
                avatar: newAvatarUrl
            })

            // 3. Update Local State
            setAvatarUrl(newAvatarUrl)
            toast.success("Profile picture updated")
        } catch {
            toast.error("Failed to update profile picture")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="h-40 bg-gradient-to-r from-[#8D0303] via-[#D35400] to-[#FEB703] opacity-90" />
                <div className="px-8 pb-8 text-center">
                    <div className="relative flex flex-col items-center -mt-16">
                        <div className="relative group">
                            <div className="overflow-hidden rounded-full border-4 border-background bg-background p-1 shadow-md">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="h-32 w-32 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-4xl font-bold text-slate-700">
                                        SC
                                    </div>
                                )}
                            </div>

                            {/* Upload Overlay Button */}
                            <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95">
                                {isUploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Camera className="h-5 w-5" />
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        <div className="mt-4 space-y-1">
                            <h3 className="text-3xl font-bold tracking-tight">Super Admin</h3>
                            <p className="text-sm font-medium text-muted-foreground">admin@bookmyseva.com</p>
                            <div className="flex items-center justify-center gap-2 pt-1">
                                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    Administrator
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full space-y-8">
                <TabsList className="w-full flex h-auto p-1 bg-muted/50 rounded-lg overflow-x-auto no-scrollbar justify-start md:justify-center">
                    <TabsTrigger
                        value="general"
                        className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        <User className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        <History className="mr-2 h-4 w-4" />
                        Login History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <ProfileForm initialData={userData} />
                </TabsContent>
                <TabsContent value="security" className="space-y-4">
                    <SecurityForm />
                </TabsContent>
                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesForm />
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                    <LoginHistory />
                </TabsContent>
            </Tabs>
        </div>
    )
}
