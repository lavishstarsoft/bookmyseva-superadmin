"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
    Loader2, Plus, Pencil, Trash2,
    Save, GripVertical, CheckCircle2, XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Schema ---
const mantraSchema = z.object({
    text: z.string().min(1, "Mantra text is required"),
    transliteration: z.string().optional(),
    isActive: z.boolean().default(true),
    order: z.coerce.number().default(0),
});

type MantraValues = z.infer<typeof mantraSchema>;

interface MantraItem extends MantraValues {
    _id: string;
}

export default function MantrasPage() {
    const [items, setItems] = useState<MantraItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MantraItem | null>(null);

    const form = useForm<MantraValues>({
        resolver: zodResolver(mantraSchema) as any,
        defaultValues: {
            text: "",
            transliteration: "",
            isActive: true,
            order: 0,
        },
    });

    // --- Fetch Data ---
    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/content/daily-mantra`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setItems(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch mantras");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // --- Form Handlers ---
    const onSubmit: SubmitHandler<MantraValues> = async (data) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            const headers = { 'Authorization': `Bearer ${token}` };

            if (editingItem) {
                await axios.put(`http://localhost:5001/api/mantras/${editingItem._id}`, data, { headers });
                toast.success("Mantra updated successfully");
            } else {
                await axios.post("http://localhost:5001/api/mantras", data, { headers });
                toast.success("Mantra created successfully");
            }

            setIsDialogOpen(false);
            setEditingItem(null);
            form.reset();
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save mantra");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this mantra?")) return;
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            await axios.delete(`http://localhost:5001/api/mantras/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Mantra deleted");
            fetchItems();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (item: MantraItem) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            await axios.put(`http://localhost:5001/api/mantras/${item._id}`,
                { isActive: !item.isActive },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success("Status updated");
            fetchItems(); // simple refresh
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const openAddDialog = () => {
        setEditingItem(null);
        form.reset({
            text: "",
            transliteration: "",
            isActive: true,
            order: items.length + 1, // Auto-increment order suggestion
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: MantraItem) => {
        setEditingItem(item);
        form.reset(item);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#8D0303]">Scrolling Mantras</h2>
                    <p className="text-muted-foreground">Manage the sacred mantras displayed in the marquee.</p>
                </div>
                <Button onClick={openAddDialog} className="bg-[#8D0303] hover:bg-[#720202] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New Mantra
                </Button>
            </div>

            <div className="mt-6">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-slate-50">
                        <p className="text-muted-foreground">No mantras found. Add your first sacred text!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <Card key={item._id} className="group hover:shadow-md transition-shadow duration-300 border-l-4 border-l-[#8D0303] border-t border-r border-b border-gray-200">
                                <CardContent className="py-1 px-3 flex items-center gap-3 min-h-[50px]">
                                    <div className="cursor-move text-muted-foreground/50 hover:text-muted-foreground p-1">
                                        <GripVertical className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-heading text-base font-bold text-gray-900 truncate leading-none pt-1">
                                                {item.text}
                                            </h3>
                                            {!item.isActive && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        {item.transliteration && (
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-none">
                                                {item.transliteration}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {/* Quick Status Toggle */}
                                        <div
                                            className={`p-1.5 rounded-full cursor-pointer transition-colors ${item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            onClick={() => toggleStatus(item)}
                                            title="Toggle Active Status"
                                        >
                                            {item.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        </div>

                                        <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditDialog(item)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(item._id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                    className="sm:max-w-[500px] bg-white"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Edit Mantra" : "Add New Mantra"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mantra Text (Sanskrit/Hindi)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. ॐ नमः शिवाय" className="font-heading text-lg" />
                                        </FormControl>
                                        <FormDescription>
                                            The main text displayed in the marquee.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="transliteration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transliteration (English)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Om Namah Shivaya" />
                                        </FormControl>
                                        <FormDescription>
                                            Optional English text for reference/display.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Order</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                                            <div className="space-y-0.5">
                                                <FormLabel>Active</FormLabel>
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
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-[#8D0303] hover:bg-[#720202] text-white">
                                    <Save className="mr-2 h-4 w-4" /> Save Mantra
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
