"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Plus, Trash2, Tag, ArrowLeft, Pencil } from "lucide-react"

import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)

    useEffect(() => {
        if (!isDialogOpen) {
            setEditingCategory(null)
            setNewCategoryName("")
        }
    }, [isDialogOpen])

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }
            // Using absolute URL for consistency, but relative works if proxy set nicely
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { headers })
            setCategories(response.data)
        } catch (error) {
            console.error("Failed to fetch categories", error)
            toast.error("Failed to load categories")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!newCategoryName.trim()) return

        try {
            setIsSubmitting(true)
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }

            if (editingCategory) {
                // Update
                const response = await axios.put(`http://localhost:5001/api/categories/${editingCategory._id}`, {
                    name: newCategoryName
                }, { headers })

                setCategories(categories.map(cat => cat._id === editingCategory._id ? response.data : cat))
                toast.success("Category updated successfully")
            } else {
                // Create
                const response = await axios.post("http://localhost:5001/api/categories", {
                    name: newCategoryName
                }, { headers })

                setCategories([response.data, ...categories])
                toast.success("Category created successfully")
            }

            setNewCategoryName("")
            setEditingCategory(null)
            setIsDialogOpen(false)
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to save category"
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will not remove the category from existing blogs, but it won't be available for new ones.")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }
            await axios.delete(`http://localhost:5001/api/categories/${id}`, { headers })
            setCategories(categories.filter(cat => cat._id !== id))
            toast.success("Category deleted")
        } catch (error) {
            toast.error("Failed to delete category")
        }
    }

    const openEditDialog = (category: any) => {
        setEditingCategory(category)
        setNewCategoryName(category.name)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/content/blogs">
                        <Button variant="outline" size="icon" className="bg-background hover:bg-[#8D0303] hover:text-white transition-colors border-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#8D0303]">Categories</h2>
                        <p className="text-muted-foreground">Manage blog categories for your content.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? "Update the category name. Slugs will be regenerated." : "Create a new category for your blog posts. Slugs are auto-generated."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Input
                                    id="name"
                                    placeholder="e.g. Rituals"
                                    className="col-span-4"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    // Auto-focus on open would be nice
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!newCategoryName.trim() || isSubmitting}
                                className="bg-[#8D0303] hover:bg-[#7d0202] text-white"
                            >
                                {isSubmitting ? "Saving..." : (editingCategory ? "Update Category" : "Create Category")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                    <CardDescription>
                        Total {categories.length} categories found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No categories found. Add one above.</TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((category, index) => (
                                        <TableRow key={category._id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {category.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {category.slug}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {category.createdAt ? format(new Date(category.createdAt), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-1"
                                                    onClick={() => openEditDialog(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(category._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
