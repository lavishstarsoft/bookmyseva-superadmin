"use client";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
    Loader2, Plus, Pencil, Trash2,
    BookOpen, Heart, Save, Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Schemas ---

const gitaSchema = z.object({
    type: z.enum(["gita", "kids-gita"]),
    telugu: z.string().min(1, "Text is required"), // Sloka or Description

    // Main Gita
    chapter: z.coerce.number().optional(),
    verse: z.coerce.number().optional(),
    translation: z.string().optional(),
    theme: z.string().optional(),

    // Kids Gita
    title: z.string().optional(),
    simpleTranslation: z.string().optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
});

type GitaValues = z.infer<typeof gitaSchema>;

interface GitaItem extends GitaValues {
    _id: string;
}

export default function GitaPage() {
    const [items, setItems] = useState<GitaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("gita");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GitaItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<GitaValues>({
        resolver: zodResolver(gitaSchema) as any,
        defaultValues: {
            type: "gita",
            telugu: "",
            chapter: 1,
            verse: 1,
            translation: "",
            theme: "",
            title: "",
            simpleTranslation: "",
            emoji: "⭐",
            color: "bg-blue-500",
        },
    });

    // --- Fetch Data ---
    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            const response = await api.get(`/content/gita-sloka?type=${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setItems(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch content");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    // --- Form Handlers ---
    const onSubmit: SubmitHandler<GitaValues> = async (data) => {
        // Ensure type matches active tab
        data.type = activeTab as "gita" | "kids-gita";

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            const headers = { 'Authorization': `Bearer ${token}` };

            if (editingItem) {
                await api.put(`/gita/${editingItem._id}`, data, { headers });
                toast.success("Updated successfully");
            } else {
                await api.post("/gita", data, { headers });
                toast.success("Created successfully");
            }

            setIsDialogOpen(false);
            setEditingItem(null);
            form.reset();
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2];
            await api.delete(`/gita/${deleteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Deleted successfully");
            fetchItems();
            setDeleteId(null);
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const openAddDialog = () => {
        setEditingItem(null);
        form.reset({
            type: activeTab as "gita" | "kids-gita",
            telugu: "",
            chapter: 1,
            verse: 1,
            translation: "",
            theme: "",
            title: "",
            simpleTranslation: "",
            emoji: "⭐",
            color: "bg-blue-500",
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: GitaItem) => {
        setEditingItem(item);
        form.reset(item);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#8D0303]">Gita Content</h2>
                    <p className="text-muted-foreground">Manage Bhagavad Gita and Kids Gita sections.</p>
                </div>
                <Button onClick={openAddDialog} className="bg-[#8D0303] hover:bg-[#720202] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="gita">Bhagavad Gita</TabsTrigger>
                    <TabsTrigger value="kids-gita">Gita for Kids</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center p-12 border rounded-lg bg-slate-50">
                            <p className="text-muted-foreground">No content found. Add your first item!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <Card key={item._id} className="relative group overflow-hidden border-orange-100 shadow-sm hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            {activeTab === "gita" ? (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    Ch {item.chapter} : Ver {item.verse}
                                                </Badge>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{item.emoji}</span>
                                                    <Badge className={`${item.color} text-white border-0`}>
                                                        {item.title}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        {activeTab === "gita" && <CardTitle className="text-sm font-medium text-muted-foreground mt-2">{item.theme}</CardTitle>}
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg font-serif text-[#8D0303] mb-2 line-clamp-2 leading-relaxed">
                                            {item.telugu}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {activeTab === "gita" ? item.translation : item.simpleTranslation}
                                        </p>

                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-md shadow-sm backdrop-blur-sm">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditDialog(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                    className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Edit Content" : "Add New Content"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            {activeTab === "gita" ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="chapter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Chapter No.</FormLabel>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="verse"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Verse No.</FormLabel>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="telugu"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telugu Sloka</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Enter sloka in Telugu..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="translation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>English Translation</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Meaning in English..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="theme"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Theme / Context</FormLabel>
                                                <FormControl><Input {...field} placeholder="e.g. Karma Yoga" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : (
                                // Kids Gita Form
                                <>
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title (English)</FormLabel>
                                                <FormControl><Input {...field} placeholder="e.g. Always Do Your Best" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="telugu"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telugu Description</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Short Telugu description..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="simpleTranslation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Simple Meaning (English)</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Simple explanation for kids..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="emoji"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Emoji</FormLabel>
                                                    <FormControl><Input {...field} placeholder="e.g. ⭐" className="text-2xl" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="color"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Background Color</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a color" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="z-[200]">
                                                            <SelectItem value="bg-blue-500">Blue</SelectItem>
                                                            <SelectItem value="bg-pink-500">Pink</SelectItem>
                                                            <SelectItem value="bg-purple-500">Purple</SelectItem>
                                                            <SelectItem value="bg-green-500">Green</SelectItem>
                                                            <SelectItem value="bg-orange-500">Orange</SelectItem>
                                                            <SelectItem value="bg-red-500">Red</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-[#8D0303] hover:bg-[#720202] text-white">
                                    <Save className="mr-2 h-4 w-4" /> Save Content
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title="Delete Content"
                description="Are you sure you want to delete this content? This action cannot be undone."
            />
        </div>
    );
}
