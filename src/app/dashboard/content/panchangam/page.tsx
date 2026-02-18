"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Save, Sun, Moon, Calendar, Clock, Star, ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";

// Schema
const panchangamSchema = z.object({
    tithi: z.string().min(1, "Tithi is required"),
    samvatsaram: z.string().min(1, "Samvatsaram is required"),
    maasam: z.string().min(1, "Maasam is required"),
    nakshatra: z.string().min(1, "Nakshatra is required"),
    yoga: z.string().optional(),
    karana: z.string().optional(),
    sunrise: z.string().min(1, "Sunrise is required"),
    sunset: z.string().min(1, "Sunset is required"),
    moonrise: z.string().optional(),
    rahu: z.string().min(1, "Rahu Kalam is required"),
    auspiciousTime: z.string().optional(),
    specialEventName: z.string().optional(),
    specialEventDeity: z.string().optional(),
    specialEventPooja: z.string().optional(),
    specialEventImage: z.string().optional(),
    specialEventBookingLink: z.string().optional(),
    bookingButtonLabel: z.string().optional(),

    // Dynamic Form Config
    isBookingEnabled: z.boolean(),
    formFields: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "number", "email", "phone", "textarea", "select", "radio", "checkbox"]),
        label: z.string().min(1, "Label is required"),
        placeholder: z.string().optional(),
        required: z.boolean(),
        options: z.string().optional(),
        width: z.enum(["full", "half", "third"]).optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
    })).optional(),
});

type PanchangamValues = z.infer<typeof panchangamSchema>;

export default function PanchangamPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<PanchangamValues>({
        resolver: zodResolver(panchangamSchema),
        defaultValues: {
            tithi: "",
            samvatsaram: "",
            maasam: "",
            nakshatra: "",
            yoga: "",
            karana: "",
            sunrise: "",
            sunset: "",
            moonrise: "",
            rahu: "",
            auspiciousTime: "",
            specialEventName: "",
            specialEventDeity: "",
            specialEventPooja: "",
            specialEventImage: "",
            specialEventBookingLink: "",
            bookingButtonLabel: "Book Now",
            isBookingEnabled: true,
            formFields: [],
        },
    });

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "formFields",
    });

    const fetchPanchangam = async (date: Date) => {
        setIsLoading(true);
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const response = await api.get(`/content/panchangam?date=${formattedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data && response.data.date) {
                // Populate form
                form.reset({
                    tithi: response.data.tithi,
                    samvatsaram: response.data.samvatsaram || "",
                    maasam: response.data.maasam || "",
                    nakshatra: response.data.nakshatra,
                    yoga: response.data.yoga,
                    karana: response.data.karana,
                    sunrise: response.data.sunrise,
                    sunset: response.data.sunset,
                    moonrise: response.data.moonrise,
                    rahu: response.data.rahu,
                    auspiciousTime: response.data.auspiciousTime,
                    specialEventName: response.data.specialEventName || "",
                    specialEventDeity: response.data.specialEventDeity || "",
                    specialEventPooja: response.data.specialEventPooja || "",
                    specialEventImage: response.data.specialEventImage || "",
                    specialEventBookingLink: response.data.specialEventBookingLink || "",
                    bookingButtonLabel: response.data.bookingButtonLabel || "Book Now",
                    isBookingEnabled: response.data.isBookingEnabled !== undefined ? response.data.isBookingEnabled : true,
                    formFields: (response.data.formFields || []).map((f: any) => ({
                        ...f,
                        required: f.required ?? false,
                        width: f.width || "full",
                    })),
                });
            } else {
                // Clear form if no data
                form.reset({
                    tithi: "",
                    samvatsaram: "",
                    maasam: "",
                    nakshatra: "",
                    yoga: "",
                    karana: "",
                    sunrise: "",
                    sunset: "",
                    moonrise: "",
                    rahu: "",
                    auspiciousTime: "",
                    specialEventName: "",
                    specialEventDeity: "",
                    specialEventPooja: "",
                    specialEventImage: "",
                    specialEventBookingLink: "",
                    bookingButtonLabel: "Book Now",
                    isBookingEnabled: true,
                    formFields: [],
                });
            }
        } catch (error) {
            console.error("Failed to fetch panchangam", error);
            toast.error("Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPanchangam(selectedDate);
    }, [selectedDate]);

    const onSubmit = async (data: PanchangamValues) => {
        setIsSaving(true);
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
        try {
            await api.post("/panchangam", {
                date: selectedDate, // Send full date object or ISO string
                ...data
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Panchangam saved successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save panchangam");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                                <Sun className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold tracking-tight text-[#8D0303]">Daily Panchangam</h3>
                                <p className="text-muted-foreground">
                                    Update celestial data for the mobile app.
                                </p>
                            </div>
                        </div>

                        {/* Date Navigator */}
                        <div className="flex items-center bg-white border border-[#8D0303]/20 rounded-lg p-1 shadow-sm">
                            <Button type="button" variant="ghost" size="icon" onClick={handlePreviousDay}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="px-4 py-2 min-w-[160px] text-center font-semibold text-lg text-[#8D0303]">
                                {format(selectedDate, "EEE, MMM dd, yyyy")}
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={handleNextDay}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-[#8D0303]/10" />

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#8D0303]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Card 1: Core Elements */}
                            <Card className="border-[#8D0303]/20 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent border-b border-[#8D0303]/10 py-4">
                                    <div className="flex items-center gap-2 text-[#8D0303]">
                                        <Star className="h-5 w-5" />
                                        <CardTitle className="text-lg">Core Elements</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <FormField
                                        control={form.control}
                                        name="samvatsaram"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Samvatsaram</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Shri Vishvavasu" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maasam"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maasam</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Magha Maasam" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tithi"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tithi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Shukla Paksha Dwadashi" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nakshatra"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nakshatra</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Uttara Bhadrapada" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="yoga"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Yoga</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Shubha" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="karana"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Karana</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Bava" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Timings */}
                            <Card className="border-[#8D0303]/20 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent border-b border-[#8D0303]/10 py-4">
                                    <div className="flex items-center gap-2 text-[#8D0303]">
                                        <Clock className="h-5 w-5" />
                                        <CardTitle className="text-lg">Celestial Timings</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="sunrise"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sunrise</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 06:15 AM" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="sunset"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sunset</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 06:45 PM" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="moonrise"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Moonrise</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 04:30 PM" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Card 3: Auspicious/Inauspicious */}
                            <Card className="md:col-span-2 border-[#8D0303]/20 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent border-b border-[#8D0303]/10 py-4">
                                    <div className="flex items-center gap-2 text-[#8D0303]">
                                        <Calendar className="h-5 w-5" />
                                        <CardTitle className="text-lg">Important Timings</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="rahu"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-red-600 font-semibold">Rahu Kalam (Inauspicious)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 10:30 AM - 12:00 PM" {...field} className="border-red-200 bg-red-50 focus-visible:ring-red-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="auspiciousTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-green-600 font-semibold">Shubh Muhurat (Auspicious)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 09:15 AM - 10:45 AM" {...field} className="border-green-200 bg-green-50 focus-visible:ring-green-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Special Event (Hybrid Logic) */}
                            <Card className="md:col-span-2 border-[#8D0303]/20 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent border-b border-[#8D0303]/10 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[#8D0303]">
                                            <Star className="h-5 w-5" />
                                            <CardTitle className="text-lg">Special Event (Optional)</CardTitle>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to remove this special event?")) {
                                                    form.setValue("specialEventName", "");
                                                    form.setValue("specialEventDeity", "");
                                                    form.setValue("specialEventPooja", "");
                                                    form.setValue("specialEventImage", "");
                                                    form.setValue("specialEventBookingLink", "");
                                                    form.setValue("bookingButtonLabel", "Book Now");
                                                    toast.success("Special event cleared. Click Save to apply.");
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Clear Event
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        Use this to override the default daily deity (e.g. for Shivaratri, Rama Navami). Leave empty to use default logic.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-6">
                                        {/* Top Row: Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="specialEventName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Event Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Maha Shivaratri" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="specialEventDeity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Deity Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Lord Shiva" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Second Row: Configuration (Left) & Image (Right) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column: Settings */}
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="specialEventPooja"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Recommended Pooja</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Rudrabhishekam" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="bookingButtonLabel"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Button Label</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Book Now" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="specialEventBookingLink"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Booking Link (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. https://... (Overrides Form if present)" {...field} className="border-orange-200 focus-visible:ring-[#8D0303]" />
                                                            </FormControl>
                                                            <FormDescription>If provided, "Book Now" will redirect here.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Right Column: Image */}
                                            <FormField
                                                control={form.control}
                                                name="specialEventImage"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col h-full">
                                                        <FormLabel>Event Image (Optional)</FormLabel>
                                                        <FormControl>
                                                            <div className="flex-1 border-2 border-dashed border-[#8D0303]/20 rounded-lg p-2 bg-white min-h-[220px]">
                                                                <ImageUpload
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    disabled={isSaving}
                                                                    className="h-full"
                                                                    aspectRatio={4 / 3} // Special Event Card Aspect Ratio
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="my-4 bg-[#8D0303]/10" />

                                    {/* Dynamic Form Builder */}
                                    <div className="space-y-4">
                                        <div className="flex flex-row items-center justify-between rounded-lg border border-[#8D0303]/20 p-4 bg-orange-50/50">
                                            <div className="space-y-0.5">
                                                <label className="text-base font-semibold text-[#8D0303]">Enable Booking Form</label>
                                                <p className="text-sm text-muted-foreground">
                                                    Show "Book Now" button and collect user details.
                                                </p>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="isBookingEnabled"
                                                render={({ field }) => (
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-[#8D0303]"
                                                        />
                                                    </FormControl>
                                                )}
                                            />
                                        </div>

                                        {form.watch("isBookingEnabled") && !form.watch("specialEventBookingLink") && (
                                            <div className="space-y-4 border rounded-lg p-4 border-[#8D0303]/20 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-[#8D0303] flex items-center gap-2">
                                                        <Settings2 className="h-4 w-4" />
                                                        Customize Booking Form
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => append({
                                                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                                                            type: "text",
                                                            label: "",
                                                            required: false,
                                                            width: "full"
                                                        })}
                                                        className="border-[#8D0303] text-[#8D0303] hover:bg-orange-50"
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" /> Add Field
                                                    </Button>
                                                </div>

                                                <div className="space-y-4">
                                                    {fields.map((field, index) => (
                                                        <div key={field.id} className="grid gap-4 p-4 border rounded-lg bg-gray-50 relative group hover:border-[#8D0303]/30 transition-colors">
                                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => remove(index)}
                                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pr-8">
                                                                {/* Label */}
                                                                <div className="md:col-span-4">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.label`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Field Label</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} placeholder="e.g. Devotee Name" className="h-9 bg-white" />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {/* Placeholder */}
                                                                <div className="md:col-span-5">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.placeholder`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Placeholder</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} placeholder="e.g. Enter value..." className="h-9 bg-white" />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {/* Type */}
                                                                <div className="md:col-span-3">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.type`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Type</FormLabel>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="h-9 bg-white">
                                                                                            <SelectValue placeholder="Select type" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="text">Text</SelectItem>
                                                                                        <SelectItem value="number">Number</SelectItem>
                                                                                        <SelectItem value="email">Email</SelectItem>
                                                                                        <SelectItem value="phone">Phone</SelectItem>
                                                                                        <SelectItem value="textarea">Text Area</SelectItem>
                                                                                        <SelectItem value="select">Select (Dropdown)</SelectItem>
                                                                                        <SelectItem value="radio">Radio Buttons</SelectItem>
                                                                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {/* Width */}
                                                                <div className="md:col-span-4">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.width`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Width</FormLabel>
                                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="h-9 bg-white">
                                                                                            <SelectValue placeholder="Select width" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="full">Full Width</SelectItem>
                                                                                        <SelectItem value="half">Half Width</SelectItem>
                                                                                        <SelectItem value="third">1/3 Width</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {/* Required Toggle */}
                                                                <div className="md:col-span-12 flex items-center pt-2">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.required`}
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                                <FormControl>
                                                                                    <Switch
                                                                                        checked={field.value}
                                                                                        onCheckedChange={field.onChange}
                                                                                        className="scale-90"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="text-sm font-normal cursor-pointer">Required Field</FormLabel>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Conditional Options: Options for Select */}
                                                            {(["select", "radio"] as string[]).includes(form.watch(`formFields.${index}.type`) || "") && (
                                                                <div>
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.options`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Options (comma separated)</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} placeholder="Option 1, Option 2, Option 3" className="h-9 bg-white" />
                                                                                </FormControl>
                                                                                <FormDescription className="text-[10px]">
                                                                                    Enter options separated by commas.
                                                                                </FormDescription>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Conditional Validation: Min/Max for Number/Phone */}
                                                            {(["number", "phone"] as string[]).includes(form.watch(`formFields.${index}.type`) || "") && (
                                                                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-3 rounded border border-orange-100">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.minLength`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Min Length (Digits)</FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        {...field}
                                                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                                                                                        className="h-8 bg-white"
                                                                                        placeholder="Any"
                                                                                    />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formFields.${index}.maxLength`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs">Max Length (Digits)</FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        {...field}
                                                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                                                                                        className="h-8 bg-white"
                                                                                        placeholder="Any"
                                                                                    />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {fields.length === 0 && (
                                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                            No fields fields added. Click "Add Field" to customize the form.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="sticky bottom-4 z-10 flex justify-end">
                        <Button type="submit" size="lg" disabled={isSaving || isLoading} className="bg-[#8D0303] hover:bg-[#700202] text-white shadow-lg">
                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Save Panchangam for {format(selectedDate, "MMM dd")}
                        </Button>
                    </div>

                </form>
            </Form>
        </div>
    );
}
