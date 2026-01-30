import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import axios from "axios"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

const profileFormSchema = z.object({
    username: z
        .string()
        .min(2, {
            message: "Username must be at least 2 characters.",
        })
        .max(30, {
            message: "Username must not be longer than 30 characters.",
        }),
    email: z.string({ message: "Please select an email to display." }).email(),
    bio: z.string().max(160).optional(),
    urls: z
        .array(
            z.object({
                value: z.string().url({ message: "Please enter a valid URL." }),
            })
        )
        .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
    initialData?: {
        name: string
        email: string
        bio?: string
    } | null
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            username: initialData?.name || "",
            email: initialData?.email || "",
            bio: initialData?.bio || "",
        },
        mode: "onChange",
    })

    // Update form values when initialData changes
    const { reset } = form
    useEffect(() => {
        if (initialData) {
            reset({
                username: initialData.name || "",
                email: initialData.email || "",
                bio: initialData.bio || "",
            })
        }
    }, [initialData, reset])

    async function onSubmit(data: ProfileFormValues) {
        setIsSaving(true)
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]

        if (!token) {
            toast.error("You must be logged in to update your profile")
            setIsSaving(false)
            return
        }

        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                name: data.username,
                bio: data.bio
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            toast.success("Profile updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border shadow-md bg-card">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Update your personal details and public profile information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your Name" {...field} className="border-[#8D0303] border-dotted border-2 bg-white/50" />
                                        </FormControl>
                                        <FormDescription>
                                            Public display name.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Email" {...field} disabled className="border-[#8D0303] border-dotted border-2 bg-white/50 opacity-70" />
                                        </FormControl>
                                        <FormDescription>
                                            Verified email address (cannot be changed).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us a little bit about yourself"
                                            className="resize-none min-h-[120px] border-[#8D0303] border-dotted border-2 bg-white/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Brief description for your profile.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
