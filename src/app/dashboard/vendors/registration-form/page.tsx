"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import api from "@/lib/axios"
import { toast } from "sonner"
import {
    Loader2, Save, Plus, Trash2, GripVertical, Eye, FileText,
    Upload, Image as ImageIcon, Type, Hash, Mail, Phone,
    AlignLeft, List, CircleDot, CheckSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

const fieldTypeIcons: Record<string, React.ReactNode> = {
    text: <Type className="h-3.5 w-3.5" />,
    number: <Hash className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    phone: <Phone className="h-3.5 w-3.5" />,
    textarea: <AlignLeft className="h-3.5 w-3.5" />,
    select: <List className="h-3.5 w-3.5" />,
    radio: <CircleDot className="h-3.5 w-3.5" />,
    checkbox: <CheckSquare className="h-3.5 w-3.5" />,
    image: <ImageIcon className="h-3.5 w-3.5" />,
    file: <Upload className="h-3.5 w-3.5" />,
}

const formSchema = z.object({
    formFields: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "number", "email", "phone", "textarea", "select", "radio", "checkbox", "image", "file"]),
        label: z.string().min(1, "Label is required"),
        placeholder: z.string().optional(),
        required: z.boolean().default(false),
        options: z.string().optional(),
        width: z.enum(["full", "half", "third"]).optional().default("full"),
    })).optional(),
})

type FormValues = z.infer<typeof formSchema>

function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default function VendorRegistrationFormPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            formFields: [],
        },
    })

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "formFields",
    })

    const fetchFormConfig = async () => {
        try {
            const response = await api.get("/content/vendor-registration-form")
            if (response.data && response.data.content) {
                const data = response.data.content
                form.reset({
                    formFields: data.formFields || [],
                })
            }
        } catch {
            // No config yet — that's ok, start with empty
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFormConfig()
    }, [])

    const onSubmit = async (data: FormValues) => {
        setIsSaving(true)
        try {
            await api.post("/content", {
                identifier: "vendor-registration-form",
                type: "vendor-form",
                title: "Vendor Registration Form Config",
                content: {
                    formFields: data.formFields || [],
                },
            })
            toast.success("Registration form updated successfully!")
        } catch {
            toast.error("Failed to save form config")
        } finally {
            setIsSaving(false)
        }
    }

    const addDefaultFields = () => {
        const defaults = [
            { id: generateId(), type: "text" as const, label: "First Name", placeholder: "Enter first name", required: true, options: "", width: "half" as const },
            { id: generateId(), type: "text" as const, label: "Surname", placeholder: "Enter surname", required: false, options: "", width: "half" as const },
            { id: generateId(), type: "email" as const, label: "Email Address", placeholder: "Enter email", required: true, options: "", width: "full" as const },
            { id: generateId(), type: "image" as const, label: "Profile Photo", placeholder: "", required: false, options: "", width: "full" as const },
            { id: generateId(), type: "text" as const, label: "Full Address", placeholder: "Enter your complete address", required: false, options: "", width: "full" as const },
            { id: generateId(), type: "text" as const, label: "State", placeholder: "Enter state", required: false, options: "", width: "half" as const },
            { id: generateId(), type: "text" as const, label: "Pincode", placeholder: "Enter pincode", required: false, options: "", width: "half" as const },
        ]
        form.setValue("formFields", defaults)
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">
                                    Vendor Registration Form
                                </h3>
                                <p className="text-muted-foreground">
                                    Configure what fields vendors see during registration.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Form Preview</DialogTitle>
                                        <DialogDescription>
                                            This is how vendors will see the registration form.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="p-4 bg-muted/20 rounded-lg">
                                        <FormPreview fields={form.watch("formFields") || []} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                variant="outline"
                                className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />
                                Save Form
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Fields List */}
                    <Card className="border-muted/40 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Form Fields</CardTitle>
                                    <CardDescription>
                                        Add, remove, and configure registration form fields.
                                        {fields.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {fields.length} field{fields.length !== 1 ? "s" : ""}
                                            </Badge>
                                        )}
                                    </CardDescription>
                                </div>
                                {fields.length === 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDefaultFields}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        Load Default Fields
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">No fields configured yet</p>
                                    <p className="text-sm mt-1">
                                        Add fields below or click "Load Default Fields" to start with common fields.
                                    </p>
                                </div>
                            )}

                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="grid gap-4 p-4 border rounded-lg bg-slate-50 relative group"
                                >
                                    {/* Top Controls */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
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
                                                    <FormLabel className="text-xs font-medium cursor-pointer">
                                                        Required
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shadow-sm"
                                                onClick={() => move(index, index - 1)}
                                            >
                                                <span className="text-xs">&#8593;</span>
                                            </Button>
                                        )}
                                        {index < fields.length - 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shadow-sm"
                                                onClick={() => move(index, index + 1)}
                                            >
                                                <span className="text-xs">&#8595;</span>
                                            </Button>
                                        )}
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
                                                            <Input
                                                                placeholder="e.g. First Name"
                                                                {...field}
                                                                className="border-[#8D0303] border-dotted border-2 bg-white/50"
                                                            />
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
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 border-[#8D0303] border-dotted border-2 bg-white/50">
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="text">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.text} Text Input</span>
                                                                </SelectItem>
                                                                <SelectItem value="number">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.number} Number</span>
                                                                </SelectItem>
                                                                <SelectItem value="email">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.email} Email</span>
                                                                </SelectItem>
                                                                <SelectItem value="phone">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.phone} Phone</span>
                                                                </SelectItem>
                                                                <SelectItem value="textarea">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.textarea} Text Area</span>
                                                                </SelectItem>
                                                                <SelectItem value="select">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.select} Dropdown</span>
                                                                </SelectItem>
                                                                <SelectItem value="radio">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.radio} Radio Buttons</span>
                                                                </SelectItem>
                                                                <SelectItem value="checkbox">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.checkbox} Checkbox</span>
                                                                </SelectItem>
                                                                <SelectItem value="image">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.image} Image Upload</span>
                                                                </SelectItem>
                                                                <SelectItem value="file">
                                                                    <span className="flex items-center gap-2">{fieldTypeIcons.file} File / PDF Upload</span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Options (for select/radio) */}
                                            {(form.watch(`formFields.${index}.type`) === "select" ||
                                                form.watch(`formFields.${index}.type`) === "radio") && (
                                                <FormField
                                                    control={form.control as any}
                                                    name={`formFields.${index}.options`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Options (comma separated)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Option 1, Option 2, Option 3"
                                                                    {...field}
                                                                    className="border-[#8D0303] border-dotted border-2 bg-white/50"
                                                                />
                                                            </FormControl>
                                                            <FormDescription className="text-[10px]">
                                                                Separate options with commas.
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            {/* Placeholder (not for image/file/checkbox) */}
                                            {!["image", "file", "checkbox"].includes(
                                                form.watch(`formFields.${index}.type`) || ""
                                            ) && (
                                                <FormField
                                                    control={form.control as any}
                                                    name={`formFields.${index}.placeholder`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Placeholder</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Placeholder text..."
                                                                    {...field}
                                                                    className="border-[#8D0303] border-dotted border-2 bg-white/50"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            {/* Width */}
                                            <FormField
                                                control={form.control as any}
                                                name={`formFields.${index}.width`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Width</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value || "full"}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 border-[#8D0303] border-dotted border-2 bg-white/50">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="full">Full Width</SelectItem>
                                                                <SelectItem value="half">Half Width</SelectItem>
                                                                <SelectItem value="third">One Third</SelectItem>
                                                            </SelectContent>
                                                        </Select>
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
                                onClick={() =>
                                    append({
                                        id: generateId(),
                                        type: "text",
                                        label: "",
                                        required: false,
                                        placeholder: "",
                                        options: "",
                                        width: "full",
                                    })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Field
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}

// ─── Form Preview Component ─────────────────────────────────────────────────

interface PreviewField {
    id: string
    type: string
    label: string
    placeholder?: string
    required?: boolean
    options?: string
    width?: string
}

function FormPreview({ fields }: { fields: PreviewField[] }) {
    if (!fields || fields.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No fields configured. Add fields to see a preview.
            </p>
        )
    }

    const getColSpan = (width?: string) => {
        switch (width) {
            case "half": return "col-span-6"
            case "third": return "col-span-4"
            default: return "col-span-12"
        }
    }

    return (
        <div className="grid grid-cols-12 gap-4">
            {fields.map((field) => (
                <div key={field.id} className={getColSpan(field.width)}>
                    <label className="text-sm font-medium mb-1.5 block">
                        {field.label || "Untitled"}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {!field.required && (
                            <span className="text-muted-foreground text-xs ml-1">(Optional)</span>
                        )}
                    </label>

                    {(field.type === "text" || field.type === "number" || field.type === "email" || field.type === "phone") && (
                        <input
                            type={field.type}
                            placeholder={field.placeholder}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            disabled
                        />
                    )}

                    {field.type === "textarea" && (
                        <textarea
                            placeholder={field.placeholder}
                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                            disabled
                        />
                    )}

                    {field.type === "select" && (
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" disabled>
                            <option>{field.placeholder || "Select..."}</option>
                            {field.options?.split(",").map((opt, i) => (
                                <option key={i}>{opt.trim()}</option>
                            ))}
                        </select>
                    )}

                    {field.type === "radio" && (
                        <div className="flex flex-wrap gap-3 mt-1">
                            {(field.options || "Option 1, Option 2").split(",").map((opt, i) => (
                                <label key={i} className="flex items-center gap-1.5 text-sm">
                                    <input type="radio" name={field.id} disabled />
                                    {opt.trim()}
                                </label>
                            ))}
                        </div>
                    )}

                    {field.type === "checkbox" && (
                        <label className="flex items-center gap-2 text-sm mt-1">
                            <input type="checkbox" disabled />
                            {field.label}
                        </label>
                    )}

                    {field.type === "image" && (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center bg-white">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">Click to upload image</p>
                        </div>
                    )}

                    {field.type === "file" && (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center bg-white">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">Click to upload file / PDF</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
