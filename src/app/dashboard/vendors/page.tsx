"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Search,
    MoreVertical,
    Store,
    CheckCircle,
    XCircle,
    Ban,
    Clock,
    Loader2,
    Package,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { vendorsApi, type Vendor } from "@/api/vendors";

type StatusFilter = "" | "pending" | "approved" | "rejected" | "suspended";

export default function VendorsPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
    const [actionDialog, setActionDialog] = useState<{
        type: "approve" | "reject" | "suspend" | "delete";
        vendorId: string;
        vendorName: string;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter) params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;
            const res = await vendorsApi.getAll(params);
            setVendors(res.vendors || []);
        } catch {
            toast.error("Failed to load vendors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, [statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAction = async () => {
        if (!actionDialog) return;
        setActionLoading(true);
        try {
            if (actionDialog.type === "approve") {
                await vendorsApi.approve(actionDialog.vendorId);
                toast.success("Vendor approved successfully");
            } else if (actionDialog.type === "reject") {
                await vendorsApi.reject(actionDialog.vendorId, rejectReason);
                toast.success("Vendor rejected");
            } else if (actionDialog.type === "suspend") {
                await vendorsApi.suspend(actionDialog.vendorId);
                toast.success("Vendor suspended");
            } else if (actionDialog.type === "delete") {
                await vendorsApi.delete(actionDialog.vendorId);
                toast.success("Vendor deleted permanently");
            }
            fetchVendors();
        } catch {
            toast.error(`Failed to ${actionDialog.type} vendor`);
        } finally {
            setActionLoading(false);
            setActionDialog(null);
            setRejectReason("");
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            approved: { variant: "default", label: "Approved" },
            pending: { variant: "outline", label: "Pending" },
            rejected: { variant: "destructive", label: "Rejected" },
            suspended: { variant: "secondary", label: "Suspended" },
        };
        const s = map[status] || { variant: "outline" as const, label: status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const stats = {
        total: vendors.length,
        pending: vendors.filter(v => v.status === "pending").length,
        approved: vendors.filter(v => v.status === "approved").length,
        rejected: vendors.filter(v => v.status === "rejected").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
                    <p className="text-muted-foreground mt-1">Review, approve, and manage vendor accounts.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle>Vendors Directory</CardTitle>
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            <div className="relative w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, phone..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : vendors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vendors.map((vendor) => (
                                    <TableRow
                                        key={vendor._id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => router.push(`/dashboard/vendors/${vendor._id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={vendor.profilePhoto} />
                                                    <AvatarFallback>
                                                        {(vendor.firstName?.[0] || "") + (vendor.surname?.[0] || "")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{vendor.firstName} {vendor.surname}</span>
                                                    <span className="text-xs text-muted-foreground">{vendor.state || "—"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{vendor.email}</span>
                                                <span className="text-xs text-muted-foreground">{vendor.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{vendor.productCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(vendor.createdAt), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/vendors/${vendor._id}`)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {vendor.status !== "approved" && (
                                                        <DropdownMenuItem onClick={() => setActionDialog({ type: "approve", vendorId: vendor._id, vendorName: `${vendor.firstName} ${vendor.surname}` })}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                                                        </DropdownMenuItem>
                                                    )}
                                                    {vendor.status !== "rejected" && (
                                                        <DropdownMenuItem onClick={() => setActionDialog({ type: "reject", vendorId: vendor._id, vendorName: `${vendor.firstName} ${vendor.surname}` })}>
                                                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                                                        </DropdownMenuItem>
                                                    )}
                                                    {vendor.status === "approved" && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setActionDialog({ type: "suspend", vendorId: vendor._id, vendorName: `${vendor.firstName} ${vendor.surname}` })}>
                                                                <Ban className="mr-2 h-4 w-4" /> Suspend
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => setActionDialog({ type: "delete", vendorId: vendor._id, vendorName: `${vendor.firstName} ${vendor.surname}` })}
                                                    >
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
                </CardContent>
            </Card>

            {/* Action Confirmation Dialog */}
            <AlertDialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRejectReason(""); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionDialog?.type === "approve" && "Approve Vendor"}
                            {actionDialog?.type === "reject" && "Reject Vendor"}
                            {actionDialog?.type === "suspend" && "Suspend Vendor"}
                            {actionDialog?.type === "delete" && "Delete Vendor Permanently"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionDialog?.type === "approve" && (
                                <>Are you sure you want to approve <strong>{actionDialog.vendorName}</strong>? They will be able to log in and manage products.</>
                            )}
                            {actionDialog?.type === "reject" && (
                                <div className="space-y-3">
                                    <p>Are you sure you want to reject <strong>{actionDialog.vendorName}</strong>?</p>
                                    <Input
                                        placeholder="Rejection reason (optional)"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                </div>
                            )}
                            {actionDialog?.type === "suspend" && (
                                <>Are you sure you want to suspend <strong>{actionDialog.vendorName}</strong>? They will lose access to their dashboard.</>
                            )}
                            {actionDialog?.type === "delete" && (
                                <>Are you sure you want to permanently delete <strong>{actionDialog.vendorName}</strong>? This will remove the vendor account, all their products, and payout records. This action cannot be undone.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={
                                actionDialog?.type === "approve" ? "bg-green-600 hover:bg-green-700" :
                                actionDialog?.type === "reject" || actionDialog?.type === "delete" ? "bg-red-600 hover:bg-red-700" :
                                ""
                            }
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {actionDialog?.type === "approve" && "Approve"}
                            {actionDialog?.type === "reject" && "Reject"}
                            {actionDialog?.type === "suspend" && "Suspend"}
                            {actionDialog?.type === "delete" && "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
