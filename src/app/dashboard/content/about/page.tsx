"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import RichTextEditor from "@/components/editor/RichTextEditor"

// Schema
const aboutSchema = z.object({
    content: z.string().min(1, "Content is required"),
})

type AboutValues = z.infer<typeof aboutSchema>

export default function AboutPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<AboutValues>({
        resolver: zodResolver(aboutSchema),
        defaultValues: {
            content: ""
        },
    })

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/content/about-us`)
                if (response.data && response.data.content) {
                    // Content can be string or object depending on how it was saved.
                    // If it's the rich text editor content, it might be HTML string or JSON.
                    // The RichTextEditor expects HTML string usually or JSON if configured.
                    // Based on previous usage, let's assume it stores HTML string or we handle it.
                    // valid content check
                    const content = typeof response.data.content === 'string'
                        ? response.data.content
                        : JSON.stringify(response.data.content);

                    form.reset({ content })
                }
            } catch (error) {
                console.log("No existing about content found or error fetching.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [form])

    // Submit Handler
    const onSubmit = async (data: AboutValues) => {
        setIsSaving(true)
        try {
            await api.post("/content", {
                identifier: "about-us",
                type: "rich-text", // Using generic type
                title: "About Us",
                content: data.content
            })
            toast.success("About Us content saved successfully")
        } catch {
            toast.error("Failed to save content")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 max-w-5xl pb-20">
            <div>
                <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">About Us</h3>
                <p className="text-muted-foreground">
                    Manage the content displayed on the About Us page of the app.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Page Content</CardTitle>
                    <CardDescription>Use the editor below to format text, add images, and style your page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Content</FormLabel>
                                        <FormControl>
                                            <RichTextEditor
                                                content={field.value}
                                                onChange={(content) => field.onChange(content)}
                                                height={600}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="bg-[#8D0303] hover:bg-[#720202] text-white"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Content
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
