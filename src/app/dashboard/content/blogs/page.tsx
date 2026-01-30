"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { Plus, Search, FileText, Calendar, MoreVertical, Edit, Trash2, Eye, Tag } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"

export default function BlogsPage() {
    const router = useRouter()
    const [blogs, setBlogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchBlogs()
    }, [])

    const fetchBlogs = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs`, { headers })
            setBlogs(response.data)
        } catch (error) {
            console.error("Failed to fetch blogs", error)
            toast.error("Failed to load blogs")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent row click
        if (!confirm("Are you sure you want to delete this blog post?")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }
            await axios.delete(`http://localhost:5001/api/blogs/${id}`, { headers })
            setBlogs(blogs.filter(blog => blog._id !== id))
            toast.success("Blog deleted successfully")
        } catch (error) {
            toast.error("Failed to delete blog")
        }
    }

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#8D0303]">Blogs</h2>
                    <p className="text-muted-foreground">Manage your articles, news, and spiritual content.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/content/categories">
                            <Tag className="mr-2 h-4 w-4" /> Manage Categories
                        </Link>
                    </Button>
                    <Button asChild className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                        <Link href="/dashboard/content/blogs/new">
                            <Plus className="mr-2 h-4 w-4" /> New Post
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>All Posts</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search title..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredBlogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">No blogs found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBlogs.map((blog) => (
                                        <TableRow
                                            key={blog._id}
                                            className="hover:bg-muted/50"
                                        >
                                            <TableCell>
                                                <div className="relative h-12 w-20 overflow-hidden rounded-md bg-muted">
                                                    {blog.image ? (
                                                        <img
                                                            src={blog.image}
                                                            alt={blog.title}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-muted-foreground">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="line-clamp-1 max-w-[200px]" title={blog.title}>{blog.title}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{blog.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-[5px]">
                                                    {blog.category || 'General'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={blog.status === 'published' ? 'default' : 'secondary'}
                                                    className={`rounded-[5px] ${blog.status === 'published'
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : blog.status === 'draft'
                                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                            : ''
                                                        }`}
                                                >
                                                    {blog.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{blog.author}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground text-sm">
                                                    <Calendar className="mr-2 h-3 w-3" />
                                                    {blog.createdAt ? format(new Date(blog.createdAt), 'MMM d, yyyy') : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/content/blogs/${blog._id}`) }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:3000/blog/${blog.slug}`, '_blank') }}>
                                                            <Eye className="mr-2 h-4 w-4" /> Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDelete(blog._id, e)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
