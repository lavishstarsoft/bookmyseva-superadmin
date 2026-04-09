"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Package, PencilLine, RefreshCw, Search, User, Phone, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { PrasadamOrder, PrasadamOrderStatus, prasadamOrdersApi } from "@/api/prasadamOrders";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  packed: "bg-violet-100 text-violet-800 border-violet-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function PrasadamOrdersPage() {
  const [orders, setOrders] = useState<PrasadamOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<PrasadamOrder | null>(null);
  const [trackingData, setTrackingData] = useState({ trackingId: "", courierName: "", courierWebsite: "" });
  const [savingTracking, setSavingTracking] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await prasadamOrdersApi.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        page: 1,
        limit: 100,
      });
      setOrders(res?.orders || []);
    } catch {
      toast.error("Failed to load prasadam orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, status: PrasadamOrderStatus) => {
    setUpdatingId(orderId);
    try {
      await prasadamOrdersApi.updateStatus(orderId, { status });
      toast.success("Order status updated");
      fetchOrders();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const normalizeWebsiteUrl = (url: string) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const openTrackingDialog = (order: PrasadamOrder) => {
    setEditingTrackingOrder(order);
    setTrackingData({
      trackingId: order.trackingId || "",
      courierName: order.courierName || "",
      courierWebsite: order.courierWebsite || "",
    });
  };

  const handleSaveTracking = async () => {
    if (!editingTrackingOrder) return;
    setSavingTracking(true);
    try {
      await prasadamOrdersApi.updateStatus(editingTrackingOrder._id, {
        trackingId: trackingData.trackingId,
        courierName: trackingData.courierName,
        courierWebsite: normalizeWebsiteUrl(trackingData.courierWebsite),
      });
      toast.success("Tracking details updated");
      setEditingTrackingOrder(null);
      fetchOrders();
    } catch {
      toast.error("Failed to update tracking details");
    } finally {
      setSavingTracking(false);
    }
  };

  const filteredOrders = search
    ? orders.filter((o) => {
        const q = search.toLowerCase();
        return (
          o.orderId.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.phone?.toLowerCase().includes(q) ||
          o.items?.some((i) => i.title?.toLowerCase().includes(q))
        );
      })
    : orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Prasadam Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Razorpay success orders కూడా ఇక్కడ కనిపిస్తాయి.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer, phone, item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="font-semibold">No prasadam orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-[#8D0303]">{order.orderId}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, h:mm a") : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <User className="w-3.5 h-3.5" /> {order.user?.name || "Unknown"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {order.user?.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{order.items?.[0]?.title || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.items?.length || 0} item(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-bold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {order.totalAmount?.toLocaleString?.() || order.totalAmount}
                      </div>
                      <div className={`text-[10px] font-semibold ${order.paymentStatus === "paid" ? "text-green-700" : "text-amber-700"}`}>
                        {order.paymentStatus}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {order.deliveryAddress
                        ? `${order.deliveryAddress.line1}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {["pending", "cancelled"].includes(order.status) ? (
                          <div className="text-muted-foreground italic">
                            {order.status === "pending" ? "Available after confirmation" : "Order cancelled"}
                          </div>
                        ) : order.courierName ? (
                          <div className="font-medium text-gray-700">{order.courierName}</div>
                        ) : (
                          <div className="text-muted-foreground">No courier</div>
                        )}
                        {!["pending", "cancelled"].includes(order.status) && order.trackingId ? (
                          <div className="font-mono text-[11px]">{order.trackingId}</div>
                        ) : !["pending", "cancelled"].includes(order.status) ? (
                          <div className="text-muted-foreground">No tracking id</div>
                        ) : null}
                        {!["pending", "cancelled"].includes(order.status) && order.courierWebsite && order.trackingId && (
                          <a
                            href={normalizeWebsiteUrl(order.courierWebsite)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            Track <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border capitalize ${STATUS_BADGE[order.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order._id, value as PrasadamOrderStatus)}
                          disabled={updatingId === order._id}
                        >
                          <SelectTrigger className="w-44 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1"
                          onClick={() => openTrackingDialog(order)}
                          disabled={["pending", "cancelled"].includes(order.status)}
                        >
                          <PencilLine className="w-3.5 h-3.5" /> Tracking
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!editingTrackingOrder} onOpenChange={(open) => !open && setEditingTrackingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="trackingId">Tracking ID</Label>
              <Input
                id="trackingId"
                value={trackingData.trackingId}
                onChange={(e) => setTrackingData((p) => ({ ...p, trackingId: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courierName">Courier Name</Label>
              <Input
                id="courierName"
                value={trackingData.courierName}
                onChange={(e) => setTrackingData((p) => ({ ...p, courierName: e.target.value }))}
                placeholder="e.g. DTDC, Delhivery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courierWebsite">Courier Tracking Website</Label>
              <Input
                id="courierWebsite"
                value={trackingData.courierWebsite}
                onChange={(e) => setTrackingData((p) => ({ ...p, courierWebsite: e.target.value }))}
                placeholder="e.g. https://www.delhivery.com/tracking"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrackingOrder(null)}>Cancel</Button>
            <Button onClick={handleSaveTracking} disabled={savingTracking} className="bg-[#8D0303] hover:bg-[#700202] text-white">
              {savingTracking ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

