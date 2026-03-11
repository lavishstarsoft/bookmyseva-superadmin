"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, MoreVertical, Loader2, Tag, Percent, IndianRupee, ToggleLeft, ToggleRight } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { couponsApi, Coupon } from "@/api/coupons";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CouponsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter !== "all") params.status = statusFilter;
            const response = await couponsApi.getAll(params);
            setCoupons(response.coupons || []);
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
            toast.error("Failed to load coupons");
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => fetchCoupons(), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await couponsApi.delete(id);
            toast.success("Coupon deleted successfully");
            fetchCoupons();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete coupon");
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            await couponsApi.update(coupon._id!, { isActive: !coupon.isActive });
            toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
            fetchCoupons();
        } catch (error) {
            toast.error("Failed to update coupon status");
        }
    };

    const getCouponStatus = (coupon: Coupon) => {
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (!coupon.isActive) return { label: "Inactive", color: "bg-gray-100 text-gray-700" };
        if (now < validFrom) return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
        if (now > validUntil) return { label: "Expired", color: "bg-red-100 text-red-700" };
        return { label: "Active", color: "bg-green-100 text-green-700" };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create and manage discount coupons for your customers.
                    </p>
                </div>
                <Link href="/dashboard/coupons/new">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Create Coupon
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by coupon code..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Min Order</TableHead>
                                <TableHead>Valid Period</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                                            <p className="text-muted-foreground">Loading coupons...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : coupons.map((coupon) => {
                                const status = getCouponStatus(coupon);
                                return (
                                    <TableRow key={coupon._id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm uppercase tracking-wider">{coupon.code}</div>
                                                    {coupon.description && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{coupon.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {coupon.discountType === 'percentage' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                        <Percent className="w-3 h-3 mr-0.5" /> {coupon.discountValue}%
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                        <IndianRupee className="w-3 h-3 mr-0.5" /> {coupon.discountValue}
                                                    </span>
                                                )}
                                            </div>
                                            {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">Max: ₹{coupon.maxDiscount}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">
                                                {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : 'None'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div>{format(new Date(coupon.validFrom), 'dd MMM yyyy')}</div>
                                                <div className="text-muted-foreground">to {format(new Date(coupon.validUntil), 'dd MMM yyyy')}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">
                                                {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.label}
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
                                                    <Link href={`/dashboard/coupons/edit/${coupon._id}`}>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => handleToggleActive(coupon)}
                                                    >
                                                        {coupon.isActive ? (
                                                            <><ToggleRight className="w-4 h-4 mr-2" /> Deactivate</>
                                                        ) : (
                                                            <><ToggleLeft className="w-4 h-4 mr-2" /> Activate</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                        onClick={() => coupon._id && handleDelete(coupon._id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!loading && coupons.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                        {searchTerm ? "No coupons matching your search." : "No coupons found. Click \"Create Coupon\" to create one."}
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
