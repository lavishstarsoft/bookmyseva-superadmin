"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Calendar, Clock, MapPin, Phone, Eye, EyeOff, MoreVertical, IndianRupee, UserCheck, Star, Filter, ShoppingCart, ArrowRight, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { toast } from "sonner";

interface PujaBooking {
    _id: string;
    bookingId: string;
    userId: { _id: string; name: string; phone: string; email: string } | null;
    pujariId: { _id: string; name: string; phone: string; rating: number } | null;
    pujaTitle: string;
    pujaImage: string;
    version: { id: string; title: string; price: number; method: string };
    scheduledDate: string;
    scheduledTimeSlot: string;
    actionEnableHoursBefore?: number;
    address: { line1: string; city: string; state: string; pincode: string };
    pricing: { totalAmount: number; finalAmount: number; priceIncrement: number };
    payment: { mode: string; totalPaid: number; advancePaid: boolean; remainingPaid: boolean };
    matchingStatus: string;
    status: string;
    paymentStatus: string;
    bmsCoins: { used: number; earned: number };
    pujariWorkflow: any;
    locationHistory?: { latitude: number; longitude: number; timestamp: string }[];
    feedback: { rating: number; review: string } | null;
    createdAt: string;
}

type StatusFilter = "all" | "pending" | "confirmed" | "pujari_assigned" | "journey_started" | "arrived" | "in_progress" | "completed" | "cancelled";

export default function PujaBookingsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [bookings, setBookings] = useState<PujaBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    // View detail
    const [viewBooking, setViewBooking] = useState<PujaBooking | null>(null);

    // Manual assignment
    const [assignBooking, setAssignBooking] = useState<PujaBooking | null>(null);
    const [pujariIdInput, setPujariIdInput] = useState("");
    const [assigning, setAssigning] = useState(false);
    
    // Edit Booking
    const [editBooking, setEditBooking] = useState<PujaBooking | null>(null);
    const [editScheduledDate, setEditScheduledDate] = useState("");
    const [editScheduledTimeSlot, setEditScheduledTimeSlot] = useState("");
    const [editActionHours, setEditActionHours] = useState(6);
    const [editing, setEditing] = useState(false);

    // Delete
    const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleEditSubmit = async () => {
        if (!editBooking) return;
        setEditing(true);
        try {
            await api.put(`/puja-bookings/admin/${editBooking._id}`, {
                scheduledDate: editScheduledDate,
                scheduledTimeSlot: editScheduledTimeSlot,
                actionEnableHoursBefore: Number(editActionHours)
            });
            toast.success("Booking updated successfully");
            setEditBooking(null);
            fetchBookings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update booking");
        } finally {
            setEditing(false);
        }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (searchTerm) params.set("search", searchTerm);
            const response = await api.get(`/puja-bookings/admin/all?${params.toString()}`);
            setBookings(Array.isArray(response.data?.bookings) ? response.data.bookings : []);
        } catch {
            toast.error("Failed to load bookings");
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, [statusFilter]);

    const handleManualAssign = async () => {
        if (!assignBooking || !pujariIdInput) {
            toast.error("Please enter Pujari ID");
            return;
        }
        setAssigning(true);
        try {
            await api.post("/puja-bookings/admin/manual-assign", {
                bookingId: assignBooking._id,
                pujariId: pujariIdInput
            });
            toast.success("Pujari assigned manually");
            setAssignBooking(null);
            setPujariIdInput("");
            fetchBookings();
        } catch {
            toast.error("Failed to assign pujari");
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!deleteBookingId) return;
        setDeleting(true);
        try {
            await api.delete(`/puja-bookings/admin/${deleteBookingId}`, {
                data: { password: confirmPassword }
            });
            toast.success("Booking deleted successfully");
            setDeleteBookingId(null);
            setConfirmPassword("");
            fetchBookings();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to delete booking";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    const statusBadge = (status: string) => {
        const config: Record<string, { label: string; classes: string }> = {
            pending: { label: "Pending", classes: "bg-amber-100 text-amber-800" },
            confirmed: { label: "Confirmed", classes: "bg-blue-100 text-blue-800" },
            pujari_assigned: { label: "Pujari Assigned", classes: "bg-indigo-100 text-indigo-800" },
            address_shared: { label: "Address Shared", classes: "bg-cyan-100 text-cyan-800" },
            journey_started: { label: "Journey Started", classes: "bg-violet-100 text-violet-800" },
            arrived: { label: "Arrived", classes: "bg-teal-100 text-teal-800" },
            in_progress: { label: "In Progress", classes: "bg-sky-100 text-sky-800" },
            completed: { label: "Completed", classes: "bg-green-100 text-green-800" },
            cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-800" },
            failed: { label: "Failed", classes: "bg-gray-100 text-gray-800" },
        };
        const c = config[status] || { label: status, classes: "bg-gray-100 text-gray-800" };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${c.classes}`}>{c.label}</span>;
    };

    const paymentBadge = (ps: string) => {
        const config: Record<string, { label: string; classes: string }> = {
            pending: { label: "Unpaid", classes: "bg-red-50 text-red-700" },
            partial_paid: { label: "50% Paid", classes: "bg-amber-50 text-amber-700" },
            paid: { label: "Paid", classes: "bg-green-50 text-green-700" },
            refunded: { label: "Refunded", classes: "bg-gray-50 text-gray-700" },
        };
        const c = config[ps] || { label: ps, classes: "bg-gray-50 text-gray-700" };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${c.classes}`}>{c.label}</span>;
    };

    // Stats
    const stats = {
        total: bookings.length,
        active: bookings.filter(b => !["completed", "cancelled", "failed"].includes(b.status)).length,
        completed: bookings.filter(b => b.status === "completed").length,
        revenue: bookings.reduce((sum, b) => sum + (b.payment?.totalPaid || 0), 0),
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Puja Bookings</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage all puja bookings, assignments, and payments.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-indigo-900">{stats.total}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-l-amber-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-amber-900">{stats.active}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-emerald-900">{stats.completed}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-900">₹{stats.revenue.toLocaleString()}</div></CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by booking ID or puja name..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchBookings()} />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="pujari_assigned">Pujari Assigned</SelectItem>
                        <SelectItem value="journey_started">Journey Started</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Puja</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Pujari</TableHead>
                                <TableHead>Scheduled</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="h-40 text-center"><div className="flex flex-col items-center justify-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /><p className="text-muted-foreground">Loading bookings...</p></div></TableCell></TableRow>
                            ) : bookings.map((booking) => (
                                <TableRow key={booking._id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <span className="font-mono text-xs font-bold text-[#8D0303]">{booking.bookingId}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-sm">{booking.pujaTitle}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{booking.version?.title} — {booking.version?.method}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{booking.userId?.name || "—"}</div>
                                        <div className="text-xs text-muted-foreground">{booking.userId?.phone || ""}</div>
                                    </TableCell>
                                    <TableCell>
                                        {booking.pujariId ? (
                                            <div>
                                                <div className="text-sm font-medium">{booking.pujariId.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {booking.pujariId.rating}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-amber-600 font-medium">Not Assigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.scheduledDate).toLocaleDateString()}</div>
                                        <div className="text-xs text-muted-foreground">{booking.scheduledTimeSlot}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-sm">₹{booking.pricing?.finalAmount || 0}</div>
                                        {paymentBadge(booking.paymentStatus)}
                                    </TableCell>
                                    <TableCell>{statusBadge(booking.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => setViewBooking(booking)}>
                                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                {!booking.pujariId && booking.status !== "cancelled" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-indigo-600 focus:text-indigo-600" onClick={() => setAssignBooking(booking)}>
                                                            <UserCheck className="w-4 h-4 mr-2" /> Assign Pujari
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="cursor-pointer" 
                                                    onClick={() => {
                                                        setEditBooking(booking);
                                                        setEditScheduledDate(booking.scheduledDate.split('T')[0]);
                                                        setEditScheduledTimeSlot(booking.scheduledTimeSlot);
                                                        setEditActionHours(booking.actionEnableHoursBefore ?? 6);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" /> Edit Booking
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setDeleteBookingId(booking._id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Booking
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && bookings.length === 0 && (
                                <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">No bookings found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* View Detail Dialog */}
            <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-[#8D0303]" />
                            Booking: {viewBooking?.bookingId}
                        </DialogTitle>
                    </DialogHeader>
                    {viewBooking && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                {statusBadge(viewBooking.status)}
                                {paymentBadge(viewBooking.paymentStatus)}
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                                <div className="font-bold text-base">{viewBooking.pujaTitle}</div>
                                <div className="text-muted-foreground">{viewBooking.version?.title} — {viewBooking.version?.method}</div>
                                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(viewBooking.scheduledDate).toLocaleDateString()} · {viewBooking.scheduledTimeSlot}</div>
                                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {viewBooking.address?.line1}, {viewBooking.address?.city}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-xs text-blue-600">User</div>
                                    <div className="font-semibold">{viewBooking.userId?.name || "—"}</div>
                                    <div className="text-xs text-muted-foreground">{viewBooking.userId?.phone}</div>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-lg">
                                    <div className="text-xs text-indigo-600">Pujari</div>
                                    <div className="font-semibold">{viewBooking.pujariId?.name || "Not Assigned"}</div>
                                    <div className="text-xs text-muted-foreground">{viewBooking.pujariId?.phone || "—"}</div>
                                </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg space-y-1 text-sm">
                                <div className="font-bold text-green-800">Payment Summary</div>
                                <div className="flex justify-between"><span>Total Amount</span><span className="font-bold">₹{viewBooking.pricing?.totalAmount}</span></div>
                                <div className="flex justify-between"><span>Final Amount</span><span className="font-bold text-green-700">₹{viewBooking.pricing?.finalAmount}</span></div>
                                <div className="flex justify-between"><span>Payment Mode</span><span className="font-medium capitalize">{viewBooking.payment?.mode}</span></div>
                                <div className="flex justify-between"><span>Total Paid</span><span className="font-bold text-green-600">₹{viewBooking.payment?.totalPaid}</span></div>
                                {viewBooking.bmsCoins?.used > 0 && <div className="flex justify-between"><span>BMS Coins Used</span><span className="font-medium text-amber-600">{viewBooking.bmsCoins.used}</span></div>}
                                {viewBooking.bmsCoins?.earned > 0 && <div className="flex justify-between"><span>Coins Earned</span><span className="font-medium text-green-600">+{viewBooking.bmsCoins.earned}</span></div>}
                            </div>
                            
                            {/* Pujari Workflow / Tracking UI */}
                            {viewBooking.pujariWorkflow && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm mt-4">
                                    <div className="font-bold text-slate-800 mb-2">Pujari Tracking & Selfies</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-slate-500">Journey Started At</div>
                                            <div>{viewBooking.pujariWorkflow.journeyStartedAt ? new Date(viewBooking.pujariWorkflow.journeyStartedAt).toLocaleString() : 'Not started'}</div>
                                            {viewBooking.pujariWorkflow.journeyStartSelfie && (
                                                <div className="mt-2 h-32 w-full rounded-md overflow-hidden border border-slate-300">
                                                    <img src={viewBooking.pujariWorkflow.journeyStartSelfie} alt="Start Selfie" className="w-full h-full object-cover hover:object-contain transition-all bg-black/5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold text-slate-500">Completed At</div>
                                            <div>{viewBooking.pujariWorkflow.completedAt ? new Date(viewBooking.pujariWorkflow.completedAt).toLocaleString() : 'Not completed'}</div>
                                            {viewBooking.pujariWorkflow.completionSelfie && (
                                                <div className="mt-2 h-32 w-full rounded-md overflow-hidden border border-slate-300">
                                                    <img src={viewBooking.pujariWorkflow.completionSelfie} alt="Completion Selfie" className="w-full h-full object-cover hover:object-contain transition-all bg-black/5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs flex flex-col gap-2 border-t border-slate-200 pt-2">
                                        {viewBooking.pujariWorkflow.arrivedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Arrived At:</span>
                                                <span className="font-medium text-slate-700">{new Date(viewBooking.pujariWorkflow.arrivedAt).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {viewBooking.locationHistory && viewBooking.locationHistory.length > 0 && (
                                            <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                                <span className="text-blue-700 font-medium">Live Tracking:</span>
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${viewBooking.locationHistory[viewBooking.locationHistory.length - 1].latitude},${viewBooking.locationHistory[viewBooking.locationHistory.length - 1].longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    <MapPin className="w-3 h-3" /> View on Google Maps
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {viewBooking.feedback?.rating && (
                                <div className="bg-amber-50 p-3 rounded-lg text-sm">
                                    <div className="font-bold text-amber-800 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {viewBooking.feedback.rating}/5</div>
                                    <div className="text-amber-700 mt-1">{viewBooking.feedback.review || "No review"}</div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual Assign Dialog */}
            <Dialog open={!!assignBooking} onOpenChange={() => setAssignBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                            Manually Assign Pujari
                        </DialogTitle>
                        <DialogDescription>Assign a pujari to booking {assignBooking?.bookingId}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p><span className="font-medium">Puja:</span> {assignBooking?.pujaTitle}</p>
                            <p><span className="font-medium">Date:</span> {assignBooking && new Date(assignBooking.scheduledDate).toLocaleDateString()}</p>
                            <p><span className="font-medium">Location:</span> {assignBooking?.address?.city}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Pujari ID</label>
                            <Input placeholder="Enter Pujari MongoDB ID..." value={pujariIdInput} onChange={(e) => setPujariIdInput(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignBooking(null)} disabled={assigning}>Cancel</Button>
                        <Button onClick={handleManualAssign} disabled={assigning} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {assigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                            Assign Pujari
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Booking Dialog */}
            <Dialog open={!!editBooking} onOpenChange={() => setEditBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-indigo-600" />
                            Edit Booking Details
                        </DialogTitle>
                        <DialogDescription>Modify scheduled date, time, and action visibility rules.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Scheduled Date</label>
                            <Input 
                                type="date" 
                                value={editScheduledDate} 
                                onChange={(e) => setEditScheduledDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Scheduled Time Slot</label>
                            <Input 
                                placeholder="e.g. 09:00 AM - 10:00 AM" 
                                value={editScheduledTimeSlot} 
                                onChange={(e) => setEditScheduledTimeSlot(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Actions Enable (Hours Before)</label>
                            <p className="text-xs text-muted-foreground">Set to 0 to enable actions right now.</p>
                            <Input 
                                type="number" 
                                value={editActionHours} 
                                onChange={(e) => setEditActionHours(Number(e.target.value))} 
                                min={0}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditBooking(null)} disabled={editing}>Cancel</Button>
                        <Button onClick={handleEditSubmit} disabled={editing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {editing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteBookingId} onOpenChange={() => { setDeleteBookingId(null); setConfirmPassword(""); setShowPassword(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Booking
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this booking? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Secret Admin Password</label>
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
                        <Button variant="outline" onClick={() => { setDeleteBookingId(null); setConfirmPassword(""); setShowPassword(false); }} disabled={deleting}>Cancel</Button>
                        <Button 
                            onClick={handleDeleteBooking} 
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
