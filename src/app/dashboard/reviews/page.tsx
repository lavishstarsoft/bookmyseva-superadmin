"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Star, Plus, Trash2, CheckCircle, XCircle, Eye, Search, Filter, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface Review {
    _id: string
    userName: string
    userEmail?: string
    userLocation?: string
    rating: number
    comment: string
    entityType: string
    entityId?: string
    featured: boolean
    approved: boolean
    createdAt: string
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    // Form state for adding new review
    const [formData, setFormData] = useState({
        userName: "",
        userEmail: "",
        userLocation: "",
        rating: 5,
        comment: "",
        entityType: "general",
        approved: true,
        featured: false
    })

    useEffect(() => {
        fetchReviews()
    }, [])

    useEffect(() => {
        filterReviews()
    }, [reviews, searchQuery, filterStatus])

    const fetchReviews = async () => {
        try {
            setLoading(true)
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/all`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setReviews(response.data)
        } catch (error) {
            console.error("Error fetching reviews:", error)
            toast.error("Failed to load reviews")
        } finally {
            setLoading(false)
        }
    }

    const filterReviews = () => {
        let filtered = reviews

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(review =>
                review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.comment.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Status filter
        if (filterStatus === "pending") {
            filtered = filtered.filter(r => !r.approved)
        } else if (filterStatus === "approved") {
            filtered = filtered.filter(r => r.approved)
        } else if (filterStatus === "featured") {
            filtered = filtered.filter(r => r.featured)
        }

        setFilteredReviews(filtered)
    }

    const handleAddReview = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Review added successfully")
            setIsAddDialogOpen(false)
            setFormData({
                userName: "",
                userEmail: "",
                userLocation: "",
                rating: 5,
                comment: "",
                entityType: "general",
                approved: true,
                featured: false
            })
            // Immediately update the local state with the new review
            if (response.data.review) {
                setReviews(prev => [response.data.review, ...prev])
            } else {
                fetchReviews()
            }
        } catch (error) {
            console.error("Error adding review:", error)
            toast.error("Failed to add review")
        }
    }

    const handleToggleApproval = async (reviewId: string, currentStatus: boolean) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}/feature`,
                { approved: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(`Review ${!currentStatus ? 'approved' : 'unapproved'}`)
            fetchReviews()
        } catch (error) {
            console.error("Error updating review:", error)
            toast.error("Failed to update review")
        }
    }

    const handleToggleFeatured = async (reviewId: string, currentStatus: boolean, approved: boolean) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}/feature`,
                { featured: !currentStatus, approved },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(`Review ${!currentStatus ? 'featured' : 'unfeatured'}`)
            fetchReviews()
        } catch (error) {
            console.error("Error updating review:", error)
            toast.error("Failed to update review")
        }
    }

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Review deleted successfully")
            fetchReviews()
        } catch (error) {
            console.error("Error deleting review:", error)
            toast.error("Failed to delete review")
        }
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        )
    }

    // Calculate stats
    const totalReviews = reviews.length
    const pendingReviews = reviews.filter(r => !r.approved).length
    const featuredReviews = reviews.filter(r => r.featured).length
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg text-muted-foreground">Loading reviews...</div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="p-6 space-y-6 w-full">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#8D0303]">Reviews Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage customer testimonials and reviews
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#8D0303] hover:bg-[#7a0303] text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Review
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>Add New Review</DialogTitle>
                                <DialogDescription>
                                    Manually add a review or testimonial
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="mb-2 block">Name *</Label>
                                        <Input
                                            value={formData.userName}
                                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                            placeholder="Customer name"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">City</Label>
                                        <Input
                                            value={formData.userLocation}
                                            onChange={(e) => setFormData({ ...formData, userLocation: e.target.value })}
                                            placeholder="Hyderabad"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <Label className="mb-2 block">Rating *</Label>
                                        <Select
                                            value={formData.rating.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-[100]">
                                                <SelectItem value="5">5 Stars</SelectItem>
                                                <SelectItem value="4">4 Stars</SelectItem>
                                                <SelectItem value="3">3 Stars</SelectItem>
                                                <SelectItem value="2">2 Stars</SelectItem>
                                                <SelectItem value="1">1 Star</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">Type</Label>
                                        <Select
                                            value={formData.entityType}
                                            onValueChange={(value) => setFormData({ ...formData, entityType: value })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-[100]">
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="product">Product</SelectItem>
                                                <SelectItem value="poojari">Poojari</SelectItem>
                                                <SelectItem value="prasadam">Prasadam</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-2 block">Review Comment *</Label>
                                    <Textarea
                                        value={formData.comment}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 154) {
                                                setFormData({ ...formData, comment: e.target.value })
                                            }
                                        }}
                                        placeholder="Enter review content..."
                                        rows={4}
                                    />
                                    <div className="text-xs text-right text-muted-foreground mt-1">
                                        {formData.comment.length}/154 characters
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddReview}
                                        className="bg-[#8D0303] hover:bg-[#7a0303] text-white"
                                        disabled={!formData.userName || !formData.comment}
                                    >
                                        Add Review
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalReviews}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Approval
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{pendingReviews}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Featured
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#8D0303]">{featuredReviews}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Average Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-1">
                                {averageRating}
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex-1 w-full md:w-auto">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or comment..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[160px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Reviews</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="featured">Featured</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="max-w-xs">Comment</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Featured</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No reviews found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReviews.map((review) => (
                                        <TableRow key={review._id}>
                                            <TableCell className="font-medium">{review.userName}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {review.userEmail || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1 cursor-pointer w-fit">
                                                            <span className="font-medium">{review.rating}</span>
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {renderStars(review.rating)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-pointer">
                                                            {review.comment.length > 23 ? `${review.comment.slice(0, 23)}...` : review.comment}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[350px] bg-gray-800 text-white border border-gray-700 shadow-md p-3 max-h-[300px] overflow-y-auto" side="bottom">
                                                        <p className="text-sm font-normal break-words leading-relaxed text-left">{review.comment}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize rounded-[5px]">
                                                    {review.entityType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {review.approved ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 rounded-[5px]">
                                                        Approved
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-600 rounded-[5px]">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {review.featured ? (
                                                    <Badge className="bg-[#8D0303] hover:bg-[#7a0303] rounded-[5px] text-white">
                                                        Featured
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleToggleApproval(review._id, review.approved)}>
                                                            {review.approved ? <XCircle className="mr-2 h-4 w-4 text-orange-600" /> : <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                                                            {review.approved ? "Unapprove" : "Approve"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleFeatured(review._id, review.featured, review.approved)}>
                                                            <Star className={`mr-2 h-4 w-4 ${review.featured ? 'fill-[#8D0303] text-[#8D0303]' : 'text-gray-400'}`} />
                                                            {review.featured ? "Unfeature" : "Feature"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setSelectedReview(review)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteReview(review._id)} className="text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* View Review Dialog */}
                <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Review Details</DialogTitle>
                        </DialogHeader>
                        {selectedReview && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p className="font-medium">{selectedReview.userName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedReview.userEmail || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">City</Label>
                                    <p className="font-medium">{selectedReview.userLocation || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Rating</Label>
                                    <div className="mt-1">{renderStars(selectedReview.rating)}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Comment</Label>
                                    <p className="mt-1">{selectedReview.comment}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Type</Label>
                                        <p className="capitalize">{selectedReview.entityType}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Date</Label>
                                        <p>{new Date(selectedReview.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-muted-foreground">Approved:</Label>
                                        {selectedReview.approved ? (
                                            <Badge className="bg-green-500">Yes</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 border-orange-600">No</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-muted-foreground">Featured:</Label>
                                        {selectedReview.featured ? (
                                            <Badge className="bg-[#8D0303]">Yes</Badge>
                                        ) : (
                                            <Badge variant="outline">No</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}
