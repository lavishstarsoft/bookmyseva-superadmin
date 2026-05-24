"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, PencilLine, RefreshCw, Search, ShoppingCart, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { kitOrdersApi, KitOrder } from "@/api/kitOrders";
import { prasadamOrdersApi, PrasadamOrder } from "@/api/prasadamOrders";

type UnifiedOrder = {
  _id: string;
  orderId: string;
  type: "kit" | "prasadam";
  customerName: string;
  customerPhone: string;
  itemTitle: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  trackingId?: string;
  courierName?: string;
  courierWebsite?: string;
  createdAt: string;
};

const statusClass = (status: string) => {
  if (status === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "confirmed") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "preparing" || status === "packed") return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (status === "out_for_delivery") return "bg-purple-100 text-purple-800 border-purple-200";
  if (status === "delivered") return "bg-green-100 text-green-800 border-green-200";
  if (status === "cancelled") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export default function AllOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [editingOrder, setEditingOrder] = useState<UnifiedOrder | null>(null);
  const [trackingData, setTrackingData] = useState({ trackingId: "", courierName: "", courierWebsite: "" });
  const [savingTracking, setSavingTracking] = useState(false);

  // Delete
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderType, setDeleteOrderType] = useState<"kit" | "prasadam" | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const [kitRes, prasadamRes] = await Promise.all([
        kitOrdersApi.getAll({ page: 1, limit: 200 }),
        prasadamOrdersApi.getAll({ page: 1, limit: 200 }),
      ]);

      const kitOrders: UnifiedOrder[] = (kitRes?.orders || []).map((o: KitOrder) => ({
        _id: o._id,
        orderId: o.orderId,
        type: "kit",
        customerName: o.user?.name || "Unknown",
        customerPhone: o.user?.phone || "-",
        itemTitle: o.kit?.title || "Kit Order",
        totalAmount: o.totalAmount || 0,
        status: o.status,
        paymentStatus: o.paymentStatus,
        trackingId: o.trackingId || "",
        courierName: o.courierName || "",
        courierWebsite: o.courierWebsite || "",
        createdAt: o.createdAt,
      }));

      const prasadamOrders: UnifiedOrder[] = (prasadamRes?.orders || []).map((o: PrasadamOrder) => ({
        _id: o._id,
        orderId: o.orderId,
        type: "prasadam",
        customerName: o.user?.name || "Unknown",
        customerPhone: o.user?.phone || "-",
        itemTitle: o.items?.[0]?.title || "Prasadam Order",
        totalAmount: o.totalAmount || 0,
        status: o.status,
        paymentStatus: o.paymentStatus,
        trackingId: o.trackingId || "",
        courierName: o.courierName || "",
        courierWebsite: o.courierWebsite || "",
        createdAt: o.createdAt,
      }));

      const merged = [...kitOrders, ...prasadamOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(merged);
    } catch {
      toast.error("Failed to load all orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const openTrackingDialog = (order: UnifiedOrder) => {
    setEditingOrder(order);
    setTrackingData({
      trackingId: order.trackingId || "",
      courierName: order.courierName || "",
      courierWebsite: order.courierWebsite || "",
    });
  };

  const normalizeWebsiteUrl = (url: string) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const handleSaveTracking = async () => {
    if (!editingOrder) return;
    setSavingTracking(true);
    try {
      const payload = {
        trackingId: trackingData.trackingId,
        courierName: trackingData.courierName,
        courierWebsite: normalizeWebsiteUrl(trackingData.courierWebsite),
      };

      if (editingOrder.type === "kit") {
        await kitOrdersApi.updateStatus(editingOrder._id, payload);
      } else {
        await prasadamOrdersApi.updateStatus(editingOrder._id, payload);
      }

      toast.success("Tracking details updated");
      setEditingOrder(null);
      fetchAllOrders();
    } catch {
      toast.error("Failed to update tracking details");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId || !deleteOrderType) return;
    setDeleting(true);
    try {
      if (deleteOrderType === "kit") {
        await kitOrdersApi.delete(deleteOrderId, confirmPassword);
      } else {
        await prasadamOrdersApi.delete(deleteOrderId, confirmPassword);
      }
      toast.success("Order deleted successfully");
      setDeleteOrderId(null);
      setDeleteOrderType(null);
      setConfirmPassword("");
      fetchAllOrders();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete order";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.itemTitle.toLowerCase().includes(q) ||
        o.type.toLowerCase().includes(q)
    );
  }, [orders, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#8D0303]" />
            All Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kit + Prasadam unified orders view</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllOrders}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer, phone, product..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={`${order.type}-${order._id}`}>
                    <TableCell className="font-mono text-xs font-bold text-[#8D0303]">{order.orderId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{order.itemTitle}</TableCell>
                    <TableCell className="font-bold">₹{order.totalAmount?.toLocaleString?.() || order.totalAmount}</TableCell>
                    <TableCell>
                      <Badge className={`border capitalize ${statusClass(order.status)}`}>
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={order.paymentStatus === "paid" ? "text-green-700 border-green-300" : "text-amber-700 border-amber-300"}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {order.courierName ? (
                          <div className="font-medium text-gray-700">{order.courierName}</div>
                        ) : (
                          <div className="text-muted-foreground">No courier</div>
                        )}
                        {order.trackingId ? (
                          <div className="font-mono text-[11px]">{order.trackingId}</div>
                        ) : (
                          <div className="text-muted-foreground">No tracking id</div>
                        )}
                        {order.courierWebsite && order.trackingId && (
                          <a
                            href={`${normalizeWebsiteUrl(order.courierWebsite)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            Track <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, h:mm a") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openTrackingDialog(order)}>
                          <PencilLine className="w-3.5 h-3.5" /> Tracking
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setDeleteOrderId(order._id); setDeleteOrderType(order.type); }}>
                          <Trash2 className="w-3.5 h-3.5" />
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

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
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
            <Button variant="outline" onClick={() => setEditingOrder(null)}>Cancel</Button>
            <Button onClick={handleSaveTracking} disabled={savingTracking} className="bg-[#8D0303] hover:bg-[#700202] text-white">
              {savingTracking ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteOrderId} onOpenChange={() => { setDeleteOrderId(null); setDeleteOrderType(null); setConfirmPassword(""); setShowPassword(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this order? This action cannot be undone.</p>
            <div className="space-y-2">
              <Label>Secret Admin Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secret password to delete"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOrderId(null); setDeleteOrderType(null); setConfirmPassword(""); setShowPassword(false); }} disabled={deleting}>Cancel</Button>
            <Button 
              onClick={handleDeleteOrder} 
              disabled={deleting || !confirmPassword} 
              variant="destructive"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

