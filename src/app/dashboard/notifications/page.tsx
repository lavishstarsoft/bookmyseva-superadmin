"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { notificationsApi, AdminNotification } from "@/api/notifications";
import { toast } from "sonner";

const getEntityRoute = (notification: AdminNotification) => {
    if (notification.entityType === "order") return "/dashboard/kit-orders";
    if (notification.entityType === "vendor") return "/dashboard/vendors";
    if (notification.entityType === "withdrawal") return "/dashboard/payouts";
    if (notification.entityType === "enquiry") return "/dashboard/enquiries";
    return "/dashboard";
};

const formatRelativeTime = (dateStr: string) => {
    const ts = new Date(dateStr).getTime();
    const diffSec = Math.floor((Date.now() - ts) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationsApi.getAll({
                status: statusFilter,
                page,
                limit: 20
            });
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
            setPages(res.pagination?.pages || 1);
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            toast.error("Failed to mark notification as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        setProcessing(true);
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch {
            toast.error("Failed to mark all as read");
        } finally {
            setProcessing(false);
        }
    };

    const handleClearAll = async () => {
        setProcessing(true);
        try {
            await notificationsApi.clearAll();
            setNotifications([]);
            setUnreadCount(0);
            toast.success("Notifications cleared");
        } catch {
            toast.error("Failed to clear notifications");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">
                        <Bell className="w-6 h-6 text-[#8D0303]" /> Notifications
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">System events from orders, vendors, payouts, and enquiries.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-[#8D0303] text-white">Unread: {unreadCount}</Badge>
                    <Button variant="outline" size="sm" onClick={fetchNotifications}>
                        <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(v: "all" | "read" | "unread") => setStatusFilter(v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                </Select>

                <Button size="sm" variant="outline" onClick={handleMarkAllAsRead} disabled={processing}>
                    <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All Read
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={handleClearAll} disabled={processing}>
                    <Trash2 className="w-4 h-4 mr-1.5" /> Clear All
                </Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /></div>
                ) : notifications.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">No notifications found.</div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((n) => (
                            <div key={n._id} className={`p-4 hover:bg-muted/20 transition ${n.isRead ? "" : "bg-rose-50/40"}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#8D0303]">{n.title}</p>
                                        <p className="text-sm mt-1">{n.message}</p>
                                        <div className="text-xs text-muted-foreground mt-2">{formatRelativeTime(n.createdAt)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!n.isRead && (
                                            <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(n._id)}>
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white" onClick={() => (window.location.href = getEntityRoute(n))}>
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>Next</Button>
                </div>
            )}
        </div>
    );
}
