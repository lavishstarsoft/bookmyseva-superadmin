"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Loader2, Save, PartyPopper, Plus, Trash2, GripVertical, Eye, Calendar, FileText } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { LiveFormPreview } from "./LiveFormPreview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// ... (schema remains same)

// ... (inside component)



// Schema
const festivalSchema = z.object({
    name: z.string().min(1, "Festival name is required"),
    date: z.coerce.date({
        message: "Festival date is required or invalid",
    }),
    deity: z.string().optional(),
    significance: z.string().min(10, "Please provide a brief significance (min 10 chars)"),
    isBookingEnabled: z.boolean().default(true),
    formFields: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "number", "email", "phone", "textarea", "select", "radio", "checkbox"]),
        label: z.string().min(1, "Label is required"),
        placeholder: z.string().optional(),
        required: z.boolean().default(false),
        options: z.string().optional(), // Comma separated for easier editing
        width: z.enum(["full", "half", "third"]).optional().default("full")
    })).optional(),
})

type FestivalValues = z.infer<typeof festivalSchema>

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function FestivalSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<FestivalValues>({
        resolver: zodResolver(festivalSchema) as any,
        defaultValues: {
            name: "",
            deity: "",
            significance: "",
            isBookingEnabled: true,
            // date will be handled by coercion
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "formFields",
    })

    const fetchFestivalData = async () => {
        try {
            const response = await api.get(`/content/upcoming-festival`)
            if (response.data && response.data.content) {
                const data = response.data.content
                form.reset({
                    name: data.name,
                    date: data.date ? new Date(data.date) : undefined,
                    deity: data.deity,
                    significance: data.significance,
                    isBookingEnabled: data.isBookingEnabled !== undefined ? data.isBookingEnabled : true,
                    formFields: data.formFields || [],
                })
            }
        } catch (error) {
            console.error("Failed to fetch festival data", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFestivalData()
    }, [])

    const onSubmit = async (data: FestivalValues) => {
        setIsSaving(true)
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]

        try {
            await api.post("/content", {
                identifier: "upcoming-festival",
                type: "festival",
                title: "Next Upcoming Festival",
                content: {
                    ...data,
                    date: data.date.toISOString()
                }
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            toast.success("Festival details updated successfully!")
        } catch (error) {
            toast.error("Failed to update festival details")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                                <PartyPopper className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Upcoming Festival</h3>
                                <p className="text-muted-foreground">
                                    Manage the "Upcoming Festival" card timer and details.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Preview Button */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" type="button" className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white">
                                        <Eye className="h-4 w-4" />
                                        Preview Form
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Live Form Preview</DialogTitle>
                                        <DialogDescription>
                                            This is how the users will see the booking form on the website.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="p-4 bg-muted/20 rounded-lg">
                                        <LiveFormPreview />
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button variant="outline" type="button" onClick={() => form.reset()} className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white">
                                <Trash2 className="h-4 w-4" />
                                Reset
                            </Button>
                            <Button type="submit" disabled={isSaving || isLoading} variant="outline" className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Update Festival
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <Tabs defaultValue="details" className="w-full space-y-8">
                        <TabsList className="w-full flex h-auto p-1 bg-muted/50 rounded-lg overflow-x-auto no-scrollbar justify-start md:justify-center">
                            <TabsTrigger
                                value="details"
                                className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Festival Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="form"
                                className="flex-1 min-w-fit whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#8D0303] data-[state=active]:text-white data-[state=active]:shadow-sm"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Form Builder
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-6">
                            <Card className="border-muted/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Festival Details</CardTitle>
                                    <CardDescription>
                                        Set the countdown target and display info.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <FormField
                                            control={form.control as any}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Festival Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Maha Shivaratri" {...field} className="border-[#8D0303] border-dotted border-2 bg-white/50" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Date Picker - Native Date Input */}
                                        <FormField
                                            control={form.control as any}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Festival Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                                                            onChange={(e) => field.onChange(e.target.value)} // Pass string, zod coerces to Date
                                                            className="border-[#8D0303] border-dotted border-2 bg-white/50"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The countdown will end at midnight on this date.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Deity */}
                                    <FormField
                                        control={form.control as any}
                                        name="deity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Presiding Deity (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Lord Shiva" {...field} className="border-[#8D0303] border-dotted border-2 bg-white/50" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Significance */}
                                    <FormField
                                        control={form.control as any}
                                        name="significance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Significance</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Brief description about the festival's importance..."
                                                        className="resize-none min-h-[100px] border-[#8D0303] border-dotted border-2 bg-white/50"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This text is displayed below the timer. Keep it concise (1-2 sentences).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Booking Toggle */}
                                    <FormField
                                        control={form.control as any}
                                        name="isBookingEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white/50 border-[#8D0303] border-dotted border-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Enable Booking</FormLabel>
                                                    <FormDescription>
                                                        Show the "Book Festival Special Pooja" button on the user site.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="form" className="mt-6">
                            <Card className="border-muted/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Booking Form Builder</CardTitle>
                                    <CardDescription>
                                        Customize the "Book Festival Special Pooja" form. Add fields dynamically.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border rounded-lg bg-slate-50 relative group">
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
                                                    {/* Required Switch */}
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`formFields.${index}.required`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-md border border-input shadow-sm">
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="scale-75"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-xs font-medium cursor-pointer">Required</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 shadow-sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                    <div className="md:col-span-1 flex items-center justify-center pt-3 text-muted-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>

                                                    <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Label */}
                                                        <FormField
                                                            control={form.control as any}
                                                            name={`formFields.${index}.label`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Field Label</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Label (e.g. Gotra)" {...field} className="border-[#8D0303] border-dotted border-2 bg-white/50" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Type */}
                                                        <FormField
                                                            control={form.control as any}
                                                            name={`formFields.${index}.type`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Type</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-10 border-[#8D0303] border-dotted border-2 bg-white/50">
                                                                                <SelectValue placeholder="Select type" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="text">Text Input</SelectItem>
                                                                            <SelectItem value="number">Number</SelectItem>
                                                                            <SelectItem value="email">Email</SelectItem>
                                                                            <SelectItem value="phone">Phone</SelectItem>
                                                                            <SelectItem value="textarea">Text Area</SelectItem>
                                                                            <SelectItem value="select">Dropdown</SelectItem>
                                                                            <SelectItem value="radio">Radio Buttons</SelectItem>
                                                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Options */}
                                                        <FormField
                                                            control={form.control as any}
                                                            name={`formFields.${index}.options`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Options (comma separated)</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Opt 1, Opt 2" {...field} className="border-[#8D0303] border-dotted border-2 bg-white/50" />
                                                                    </FormControl>
                                                                    <FormDescription className="text-[10px] truncate">
                                                                        For Select, Radio, Checkbox.
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Placeholder */}
                                                        <FormField
                                                            control={form.control as any}
                                                            name={`formFields.${index}.placeholder`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Placeholder</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Placeholder..." className="h-10 border-[#8D0303] border-dotted border-2 bg-white/50" {...field} />
                                                                    </FormControl>
                                                                    <FormDescription className="text-[10px] truncate">
                                                                        Text shown inside the input.
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => append({ id: generateId(), type: "text", label: "", required: false, placeholder: "", options: "", width: "full" })}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add New Field
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
        </div>
    )
}
