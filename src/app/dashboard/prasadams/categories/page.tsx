"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Edit, Trash2, Loader2, Save, X, GripVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { prasadamCategoriesApi, PrasadamCategory as PrasadamCategoryModel } from "@/api/prasadam-categories";
import { toast } from "sonner";

export default function PrasadamCategoriesPage() {
    const [categories, setCategories] = useState<PrasadamCategoryModel[]>([]);
    const [loading, setLoading] = useState(true);

    // Add/Edit Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<PrasadamCategoryModel | null>(null);
    const [name, setName] = useState("");
    const [label, setLabel] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [order, setOrder] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await prasadamCategoriesApi.getAllAdmin();
            setCategories(data);
        } catch {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openAddDialog = () => {
        setEditingCategory(null);
        setName("");
        setLabel("");
        setDescription("");
        setIcon("");
        setOrder("");
        setIsActive(true);
        setDialogOpen(true);
    };

    const openEditDialog = (category: PrasadamCategoryModel) => {
        setEditingCategory(category);
        setName(category.name);
        setLabel(category.label);
        setDescription(category.description || "");
        setIcon(category.icon || "");
        setOrder(category.order?.toString() || "0");
        setIsActive(category.isActive ?? true);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter a category name");
            return;
        }
        if (!label.trim()) {
            toast.error("Please enter a display label");
            return;
        }

        setSaving(true);
        try {
            const data = {
                name: name.trim(),
                label: label.trim(),
                description: description.trim(),
                icon: icon.trim(),
                order: Number(order) || 0,
                isActive,
            };

            if (editingCategory?._id) {
                await prasadamCategoriesApi.update(editingCategory._id, data);
                toast.success("Category updated successfully");
            } else {
                await prasadamCategoriesApi.create(data);
                toast.success("Category created successfully");
            }

            setDialogOpen(false);
            fetchCategories();
        } catch (error: any) {
            const msg = error?.response?.data?.error || `Failed to ${editingCategory ? 'update' : 'create'} category`;
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, categoryName: string) => {
        if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

        try {
            await prasadamCategoriesApi.delete(id);
            toast.success("Category deleted successfully");
            fetchCategories();
        } catch (error: any) {
            const msg = error?.response?.data?.error || "Failed to delete category";
            toast.error(msg);
        }
    };

    const handleToggleStatus = async (category: PrasadamCategoryModel) => {
        if (!category._id) return;
        try {
            await prasadamCategoriesApi.toggleStatus(category._id);
            toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchCategories();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleSeedDefault = async () => {
        if (!confirm("This will create default categories (Laddu, Pulihora, Pongal, Payasam, Special, Combo) if they don't exist. Continue?")) return;

        try {
            const result = await prasadamCategoriesApi.seedDefault();
            toast.success(result.message || "Default categories seeded");
            fetchCategories();
        } catch (error: any) {
            const msg = error?.response?.data?.error || "Failed to seed default categories";
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b -mx-4 px-4 lg:-mx-6 lg:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/prasadams">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="text-xs text-muted-foreground">Dashboard / Prasadams / Categories</div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Tag className="w-5 h-5 text-orange-500" />
                                Manage Categories
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSeedDefault}>
                            Seed Defaults
                        </Button>
                        <Button onClick={openAddDialog} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Tag className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No categories found</p>
                        <Button onClick={openAddDialog} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Category
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Order</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead className="w-[100px] text-center">Count</TableHead>
                                <TableHead className="w-[100px] text-center">Status</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                            <span className="text-sm font-mono">{category.order}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>{category.label}</TableCell>
                                    <TableCell>
                                        <code className="px-2 py-1 bg-muted rounded text-xs">{category.slug}</code>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                            {category.count || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={category.isActive}
                                            onCheckedChange={() => handleToggleStatus(category)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(category)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => category._id && handleDelete(category._id, category.name)}
                                                disabled={category.count && category.count > 0}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update the category details below.' : 'Create a new prasadam category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Category Name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Laddu"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Display Label *</Label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Laddu or Laddus"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this category"
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Icon (Emoji or Icon Name)</Label>
                            <Input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="e.g. 🍬 or cookie"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Display Order</Label>
                            <Input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                placeholder="0"
                                className="mt-1.5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Active (Visible to users)</Label>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
