"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Loader2, ShoppingCart, Package, CheckCircle2,
    Truck, XCircle, Clock, ChevronLeft, ChevronRight,
    RefreshCw, Calendar, Phone, User, IndianRupee
} from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { kitOrdersApi, KitOrder, KitOrderStatus, KitOrderStats } from "@/api/kitOrders";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KitOrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: {
        label: "Pending",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Clock className="w-3 h-3" />
    },
    confirmed: {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle2 className="w-3 h-3" />
    },
    out_for_delivery: {
        label: "Out for Delivery",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Truck className="w-3 h-3" />
    },
    delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle2 className="w-3 h-3" />
    },
    cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-3 h-3" />
    }
};

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    return (
        <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-gray-900">{value}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KitOrdersPage() {
    const [orders, setOrders] = useState<KitOrder[]>([]);
    const [stats, setStats] = useState<KitOrderStats>({ total: 0, pending: 0, confirmed: 0, delivered: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await kitOrdersApi.getAll({
                status: statusFilter === "all" ? undefined : statusFilter,
                search: search || undefined,
                page,
                limit: 20
            });
            setOrders(res?.orders || []);
            setStats(res?.stats || { total: 0, pending: 0, confirmed: 0, delivered: 0, cancelled: 0 });
            setTotalPages(res?.pagination?.pages || 1);
        } catch {
            toast.error("Failed to load kit orders");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, search]);

    const handleStatusUpdate = async (orderId: string, newStatus: KitOrderStatus) => {
        setUpdatingId(orderId);
        try {
            await kitOrdersApi.updateStatus(orderId, { status: newStatus });
            toast.success(`Order status updated to ${STATUS_CONFIG[newStatus].label}`);
            fetchOrders();
        } catch {
            toast.error("Failed to update order status");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-[#8D0303]" />
                        Kit Orders
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage all pooja kit delivery orders
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchOrders}
                    className="self-start"
                >
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                    label="Total"
                    value={stats.total}
                    color="bg-gray-100 text-gray-600"
                    icon={<Package className="w-5 h-5" />}
                />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    color="bg-amber-100 text-amber-700"
                    icon={<Clock className="w-5 h-5" />}
                />
                <StatCard
                    label="Confirmed"
                    value={stats.confirmed}
                    color="bg-blue-100 text-blue-700"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                />
                <StatCard
                    label="Delivered"
                    value={stats.delivered}
                    color="bg-green-100 text-green-700"
                    icon={<Truck className="w-5 h-5" />}
                />
                <StatCard
                    label="Cancelled"
                    value={stats.cancelled}
                    color="bg-red-100 text-red-700"
                    icon={<XCircle className="w-5 h-5" />}
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by order ID, name, phone, kit..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">No orders found</h3>
                        <p className="text-muted-foreground text-sm">
                            {search || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No kit orders have been placed yet"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Order ID</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Customer</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Kit</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Qty</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Delivery</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const statusInfo = STATUS_CONFIG[order.status];
                                    const isUpdating = updatingId === order._id;

                                    return (
                                        <TableRow key={order._id} className="hover:bg-muted/10 transition-colors">
                                            {/* Order ID */}
                                            <TableCell>
                                                <div className="font-mono text-xs font-bold text-[#8D0303] bg-[#8D0303]/5 px-2 py-1 rounded border border-[#8D0303]/10 w-fit">
                                                    {order.orderId}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, h:mm a") : "—"}
                                                </div>
                                            </TableCell>

                                            {/* Customer */}
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span className="truncate max-w-[120px]">{order.user.name || "Unknown"}</span>
                                                </div>
                                                {order.user.phone && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {order.user.phone}
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Kit */}
                                            <TableCell>
                                                <div className="font-semibold text-sm text-gray-900 max-w-[160px] truncate">
                                                    {order.kit.title}
                                                </div>
                                                {order.kit.category && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide bg-marigold/10 text-amber-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                        {order.kit.category}
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Plan */}
                                            <TableCell>
                                                <div className="text-sm font-medium text-gray-700">{order.plan.label}</div>
                                                <div className="text-xs text-muted-foreground">₹{order.plan.price}/unit</div>
                                            </TableCell>

                                            {/* Qty */}
                                            <TableCell>
                                                <span className="font-bold text-gray-900">{order.quantity}</span>
                                            </TableCell>

                                            {/* Amount */}
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-black text-gray-900">
                                                    <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {order.totalAmount}
                                                </div>
                                                <div className={`text-[10px] font-semibold mt-0.5 ${order.paymentStatus === 'paid' ? 'text-green-700' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                                                </div>
                                            </TableCell>

                                            {/* Delivery */}
                                            <TableCell>
                                                {order.deliveryDate && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {format(new Date(order.deliveryDate), "dd MMM yyyy")}
                                                    </div>
                                                )}
                                                {order.deliverySlot && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {order.deliverySlot}
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Status Badge */}
                                            <TableCell>
                                                <Badge className={`flex items-center gap-1 w-fit text-[11px] border ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>

                                            {/* Action: Status Select */}
                                            <TableCell>
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(val) => handleStatusUpdate(order._id, val as KitOrderStatus)}
                                                    disabled={isUpdating}
                                                >
                                                    <SelectTrigger className="w-44 h-8 text-xs">
                                                        {isUpdating ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                Updating...
                                                            </div>
                                                        ) : (
                                                            <SelectValue />
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
