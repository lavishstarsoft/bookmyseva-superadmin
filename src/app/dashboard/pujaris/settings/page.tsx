"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Loader2, Save, Phone, ScrollText } from "lucide-react"

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
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

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
                const response = await api.get(`/app-config`)
                if (response.data) {
                    form.reset({
                        pujariSupportPhone: response.data.pujariSupportPhone || "+91 9999999999",
                        pujariGuidelines: response.data.pujariGuidelines || "",
                    })
                }
            } catch {
                toast.error("Failed to load settings")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [form])

    const onSubmit = async (data: SettingsValues) => {
        setIsSaving(true)
        try {
            await api.put("/app-config", data)
            toast.success("Settings saved successfully")
        } catch {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 w-full pb-10">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                    <Phone className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Pujari App Settings</h3>
                    <p className="text-muted-foreground">
                        Manage support contact and conduct guidelines for the Pujari mobile app.
                    </p>
                </div>
            </div>
            <Separator className="my-4" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="md:col-span-1 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
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
                                <CardTitle className="flex items-center gap-2">
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
                            <CardTitle className="flex items-center gap-2">
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
                                                className="min-h-[300px] border-[#8D0303]/20 focus-visible:ring-[#8D0303] text-base leading-relaxed"
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
                        <Button type="submit" size="lg" className="bg-[#8D0303] hover:bg-[#720202] text-white px-10 shadow-lg transition-all" disabled={isSaving}>
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
        </div>
    )
}
