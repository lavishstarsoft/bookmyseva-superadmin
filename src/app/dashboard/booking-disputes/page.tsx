"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Search, Loader2, Eye, AlertTriangle, MessageSquareWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { toast } from "sonner";

interface DisputeRow {
    _id: string;
    disputeId: string;
    bookingCode: string;
    category: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    adminResponse?: string;
    createdAt: string;
    resolvedAt?: string | null;
    userId?: { name?: string; phone?: string; email?: string } | null;
    pujariId?: { name?: string; phone?: string } | null;
    bookingId?: { bookingId?: string; pujaTitle?: string; status?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    open: "bg-amber-100 text-amber-800",
    under_review: "bg-blue-100 text-blue-800",
    resolved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    closed: "bg-slate-100 text-slate-700",
};

export default function BookingDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<DisputeRow | null>(null);
    const [editStatus, setEditStatus] = useState("under_review");
    const [adminResponse, setAdminResponse] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchDisputes = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "50" };
            if (status !== "all") params.status = status;
            if (search.trim()) params.search = search.trim();
            const res = await api.get("/puja-bookings/admin/disputes", { params });
            setDisputes(res.data?.disputes || []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to load disputes");
        } finally {
            setLoading(false);
        }
    }, [status, search]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    const openDetail = (d: DisputeRow) => {
        setSelected(d);
        setEditStatus(d.status === "open" ? "under_review" : d.status);
        setAdminResponse(d.adminResponse || "");
    };

    const saveUpdate = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await api.patch(`/puja-bookings/admin/disputes/${selected._id}`, {
                status: editStatus,
                adminResponse,
            });
            toast.success("Dispute updated");
            setSelected(res.data.dispute);
            fetchDisputes();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const openCount = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquareWarning className="h-6 w-6 text-orange-600" />
                        Booking Disputes
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Customer complaints linked to puja bookings (separate from CMS reviews).
                    </p>
                </div>
                <Badge variant="outline" className="w-fit">
                    {openCount} open / in review
                </Badge>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search dispute ID, booking, subject…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchDisputes()}
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="under_review">Under review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="secondary" onClick={fetchDisputes}>Refresh</Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : disputes.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                            <AlertTriangle className="h-8 w-8 opacity-40" />
                            <p>No disputes found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dispute</TableHead>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[80px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disputes.map((d) => (
                                    <TableRow key={d._id}>
                                        <TableCell>
                                            <div className="font-medium">{d.disputeId}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{d.subject}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {d.bookingCode || d.bookingId?.bookingId || "—"}
                                            {d.bookingId?.pujaTitle ? (
                                                <div className="text-xs text-muted-foreground">{d.bookingId.pujaTitle}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {d.userId?.name || "—"}
                                            {d.userId?.phone ? (
                                                <div className="text-xs text-muted-foreground">{d.userId.phone}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-sm capitalize">
                                            {d.category?.replace(/_/g, " ")}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] || STATUS_COLORS.open}`}>
                                                {d.status.replace(/_/g, " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(d.createdAt).toLocaleDateString("en-IN")}
                                        </TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="ghost" onClick={() => openDetail(d)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selected?.disputeId}</DialogTitle>
                        <DialogDescription>
                            Booking {selected?.bookingCode || selected?.bookingId?.bookingId}
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold text-foreground">{selected.subject}</p>
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Customer</span>
                                    <p>{selected.userId?.name} · {selected.userId?.phone}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Pujari</span>
                                    <p>{selected.pujariId?.name || "—"} · {selected.pujariId?.phone || ""}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Priority</span>
                                    <p className="capitalize">{selected.priority}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Category</span>
                                    <p className="capitalize">{selected.category?.replace(/_/g, " ")}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Status</label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="under_review">Under review</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Admin response</label>
                                <Textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    rows={4}
                                    placeholder="Resolution notes visible to customer via notification context"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                        <Button onClick={saveUpdate} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
