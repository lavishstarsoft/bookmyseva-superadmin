"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, MoreVertical, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { kitsApi, Kit } from "@/api/kits";
import { toast } from "sonner";

export default function KitsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [kits, setKits] = useState<Kit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKits = async () => {
        try {
            setLoading(true);
            const response = await kitsApi.getAll();
            console.log("Kits API response:", response);
            const dataArray = Array.isArray(response) ? response : [];
            setKits(dataArray);
        } catch (error) {
            console.error("Failed to fetch kits:", error);
            toast.error("Failed to load pooja kits");
            setKits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKits();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this kit?")) return;

        try {
            await kitsApi.delete(id);
            toast.success("Kit deleted successfully");
            fetchKits();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete kit");
        }
    };

    const filteredKits = (Array.isArray(kits) && typeof kits.filter === 'function') ? kits.filter(kit =>
        (kit.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kit.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pooja Kits</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your standard pooja kits, contents, and pricing.
                    </p>
                </div>
                <Link href="/dashboard/kits/new">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add New Kit
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search kits by name..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Kit Details</TableHead>
                                <TableHead>Price (Starting)</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                                            <p className="text-muted-foreground">Loading kits...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredKits.map((kit) => (
                                <TableRow key={kit._id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                            {kit.image ? (
                                                <img src={kit.image} alt={kit.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-center p-1">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900">{kit.title}</div>
                                        <div className="text-xs text-muted-foreground">{kit.itemsIncluded.length} Items Included</div>
                                        <div className="text-[10px] uppercase font-bold text-[#8D0303]/70">{kit.category}</div>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-800">
                                        {kit.category === 'daily'
                                            ? `₹${kit.pricingPlans?.find(p => p.active)?.price || 'N/A'}`
                                            : `₹${kit.offerPrice || 'N/A'}`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold text-gray-700">{kit.defaultRating}</span>
                                            <span className="text-muted-foreground text-xs">({kit.reviewCount})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                                            Active
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/dashboard/kits/edit/${kit._id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Edit className="w-4 h-4 mr-2" /> Edit Kit
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                                    onClick={() => kit._id && handleDelete(kit._id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredKits.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                        {searchTerm ? "No kits matching your search." : "No kits found. Click \"Add New Kit\" to create one."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
