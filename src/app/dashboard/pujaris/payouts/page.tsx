"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Loader2, Wallet, IndianRupee, Store, Clock,
    CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    RefreshCw, CreditCard, Building2, AlertCircle, Percent, Settings,
    Trash2, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { payoutsApi, WithdrawalRequest } from "@/api/payouts";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";

interface PujariSummaryStats {
    totalEarnings: number;
    pendingAmount: number;
    transferredAmount: number;
    pendingWithdrawalAmount: number;
    pendingWithdrawalCount: number;
    adminCommissionEarned: number;
    completedBookings: number;
    totalBookings: number;
    totalRevenue: number;
}

function StatCard({ label, value, color, icon, prefix = "" }: { label: string; value: number | string; color: string; icon: React.ReactNode; prefix?: string }) {
    return (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

export default function PujariPayoutsPage() {
    const [activeTab, setActiveTab] = useState("pujaris");
    const [summary, setSummary] = useState<PujariSummaryStats | null>(null);
    const [pujaris, setPujaris] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [withdrawalStats, setWithdrawalStats] = useState({ pending: 0, approved: 0, paid: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [pujariMinWithdrawal, setPujariMinWithdrawal] = useState(500);
    const [pujariMaxWithdrawal, setPujariMaxWithdrawal] = useState(10000);
    const [savingSettings, setSavingSettings] = useState(false);

    // Modal state
    const [payModal, setPayModal] = useState<{ open: boolean; id: string; name: string; amount: number; type: string } | null>(null);
    const [approveModal, setApproveModal] = useState<{ open: boolean; id: string; name: string; amount: number } | null>(null);
    const [approveTdsRate, setApproveTdsRate] = useState("1");
    const [approveGstRate, setApproveGstRate] = useState("18");
    const [approveRemarks, setApproveRemarks] = useState("");
    const [transactionRef, setTransactionRef] = useState("");
    const [remarks, setRemarks] = useState("");
    const [otherDeductionLabel, setOtherDeductionLabel] = useState("");
    const [otherDeductionAmount, setOtherDeductionAmount] = useState("");
    const [processing, setProcessing] = useState(false);

    // Delete state
    const [deleteWithdrawalId, setDeleteWithdrawalId] = useState<string | null>(null);
    const [deletePujariId, setDeletePujariId] = useState<{ id: string; name: string } | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleDeleteWithdrawal = async () => {
        if (!deleteWithdrawalId) return;
        setDeleting(true);
        try {
            await payoutsApi.deleteWithdrawal(deleteWithdrawalId, confirmPassword);
            toast.success("Withdrawal request deleted successfully");
            setDeleteWithdrawalId(null);
            setConfirmPassword("");
            fetchWithdrawals();
            fetchSummary();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to delete withdrawal request";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeletePujariPayouts = async () => {
        if (!deletePujariId) return;
        setDeleting(true);
        try {
            await payoutsApi.deletePujariPayouts(deletePujariId.id, confirmPassword);
            toast.success(`All payouts for Pujari ${deletePujariId.name} deleted successfully`);
            setDeletePujariId(null);
            setConfirmPassword("");
            fetchPujaris();
            fetchSummary();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to delete Pujari payouts";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await payoutsApi.getPujariSummary();
            setSummary(res.summary);
        } catch {
            toast.error("Failed to load Pujari summary");
        }
    };

    const fetchPujaris = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/payouts/pujari-list", {
                params: { search: search || undefined }
            });
            if (response.data.success) {
                setPujaris(response.data.pujaris || []);
            }
        } catch {
            toast.error("Failed to load Pujaris");
        } finally {
            setLoading(false);
        }
    }, [search]);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await payoutsApi.getWithdrawalRequests({
                status: statusFilter === "all" ? undefined : statusFilter,
                page,
                limit: 20,
                isPujari: true
            });
            setWithdrawals(res.requests);
            setWithdrawalStats(res.stats);
            setTotalPages(res.pagination.pages);
        } catch {
            toast.error("Failed to load withdrawals");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

    const fetchLimits = async () => {
        setLoading(true);
        try {
            const response = await api.get("/app-config");
            if (response.data) {
                setPujariMinWithdrawal(response.data.pujariMinWithdrawal ?? 500);
                setPujariMaxWithdrawal(response.data.pujariMaxWithdrawal ?? 10000);
            }
        } catch {
            toast.error("Failed to load withdrawal limits");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.post("/app-config", {
                pujariMinWithdrawal: Number(pujariMinWithdrawal),
                pujariMaxWithdrawal: Number(pujariMaxWithdrawal)
            });
            toast.success("Withdrawal limits updated successfully");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (activeTab === "pujaris") {
            fetchPujaris();
        } else if (activeTab === "withdrawals") {
            fetchWithdrawals();
        } else if (activeTab === "settings") {
            fetchLimits();
        }
    }, [activeTab, fetchPujaris, fetchWithdrawals]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, activeTab]);

    const handlePayWithdrawal = async () => {
        if (!payModal || !transactionRef.trim()) {
            toast.error("Transaction reference is required");
            return;
        }
        setProcessing(true);
        try {
            await payoutsApi.markWithdrawalPaid(
                payModal.id,
                transactionRef,
                remarks,
                Number(otherDeductionAmount) || 0,
                otherDeductionLabel
            );
            toast.success("Withdrawal marked as paid");
            setPayModal(null);
            setTransactionRef("");
            setRemarks("");
            setOtherDeductionLabel("");
            setOtherDeductionAmount("");
            fetchWithdrawals();
            fetchSummary();
        } catch {
            toast.error("Failed to process payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveWithdrawal = async () => {
        if (!approveModal) return;
        try {
            await payoutsApi.approveWithdrawal(
                approveModal.id,
                approveRemarks,
                Number(approveTdsRate) || 0,
                Number(approveGstRate) || 0
            );
            toast.success("Withdrawal approved");
            setApproveModal(null);
            setApproveTdsRate("1");
            setApproveGstRate("18");
            setApproveRemarks("");
            fetchWithdrawals();
            fetchSummary();
        } catch {
            toast.error("Failed to approve");
        }
    };

    const handleRejectWithdrawal = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await payoutsApi.rejectWithdrawal(id, reason);
            toast.success("Withdrawal rejected");
            fetchWithdrawals();
            fetchSummary();
        } catch {
            toast.error("Failed to reject");
        }
    };

    const handleRevertToPending = async (id: string) => {
        const reason = prompt("Move back to pending reason (optional):") || "";
        try {
            await payoutsApi.revertWithdrawalToPending(id, reason);
            toast.success("Moved back to pending");
            fetchWithdrawals();
            fetchSummary();
        } catch {
            toast.error("Failed to move to pending");
        }
    };

    const handleCancelApproved = async (id: string) => {
        const reason = prompt("Cancel reason (optional):") || "";
        try {
            await payoutsApi.cancelApprovedWithdrawal(id, reason);
            toast.success("Approved request cancelled");
            fetchWithdrawals();
            fetchSummary();
        } catch {
            toast.error("Failed to cancel approved request");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-[#8D0303]" />
                        Pujari Payouts
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage Pujari earnings and process payouts
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchSummary(); activeTab === "pujaris" ? fetchPujaris() : fetchWithdrawals(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Summary Stats */}
            {summary && (
                <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Pujari Earnings"
                        value={summary.totalEarnings}
                        color="bg-purple-100 text-purple-700"
                        icon={<IndianRupee className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Available to Withdraw"
                        value={summary.pendingAmount}
                        color="bg-amber-100 text-amber-700"
                        icon={<Clock className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Transferred"
                        value={summary.transferredAmount}
                        color="bg-green-100 text-green-700"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Commission"
                        value={summary.adminCommissionEarned}
                        color="bg-[#8D0303]/10 text-[#8D0303]"
                        icon={<Percent className="w-5 h-5" />}
                        prefix="₹"
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Revenue"
                        value={summary.totalRevenue}
                        color="bg-indigo-100 text-indigo-700"
                        icon={<Wallet className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Total Bookings"
                        value={`${summary.completedBookings}/${summary.totalBookings}`}
                        color="bg-teal-100 text-teal-700"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Pending Requests"
                        value={summary.pendingWithdrawalCount}
                        color="bg-blue-100 text-blue-700"
                        icon={<CreditCard className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Withdrawal Pending"
                        value={summary.pendingWithdrawalAmount}
                        color="bg-orange-100 text-orange-700"
                        icon={<AlertCircle className="w-5 h-5" />}
                        prefix="₹"
                    />
                </div>
                </>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pujaris">Pujari Summary</TabsTrigger>
                    <TabsTrigger value="withdrawals">
                        Withdrawal Requests
                        {withdrawalStats.pending > 0 && (
                            <Badge className="ml-2 bg-amber-500 text-white">{withdrawalStats.pending}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="settings">Withdrawal Settings</TabsTrigger>
                </TabsList>

                {/* Pujaris Tab */}
                <TabsContent value="pujaris" className="space-y-4">
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Pujaris by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                            </div>
                        ) : pujaris.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <Store className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="font-bold text-lg">No Pujaris found</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="font-bold text-xs uppercase">Pujari</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Total Earnings</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Pending (Available)</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Transferred</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Bookings</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Bank Details</TableHead>
                                            <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pujaris.map((pujari) => (
                                            <TableRow key={pujari._id}>
                                                <TableCell>
                                                    <div className="font-semibold">{pujari.name}</div>
                                                    <div className="text-xs text-muted-foreground">{pujari.phone}</div>
                                                    <div className="text-xs text-muted-foreground">{pujari.email || 'No email'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-lg">₹{(pujari.earnings?.total || 0).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-amber-600">₹{(pujari.earnings?.pending || 0).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-green-600">₹{(pujari.earnings?.transferred || 0).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{pujari.completedCount || 0}/{pujari.bookingCount || 0}</div>
                                                    <div className="text-xs text-muted-foreground">Completed/Total</div>
                                                </TableCell>
                                                <TableCell>
                                                    {pujari.bankDetails?.accountNumber ? (
                                                        <div className="text-xs">
                                                            <div className="font-semibold">{pujari.bankDetails.bankName}</div>
                                                            <div className="text-muted-foreground">A/C Holder: {pujari.bankDetails.accountHolderName}</div>
                                                            <div className="text-muted-foreground">A/C No: {pujari.bankDetails.accountNumber}</div>
                                                            <div className="text-muted-foreground">IFSC: {pujari.bankDetails.ifscCode}</div>
                                                            {pujari.bankDetails.upiId ? (
                                                                <div className="text-[#8D0303] font-semibold mt-0.5">UPI: {pujari.bankDetails.upiId}</div>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-500 flex items-center gap-1 font-semibold">
                                                            <AlertCircle className="w-3.5 h-3.5" /> Not set
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="text-red-600 hover:bg-red-50 border-red-200"
                                                        onClick={() => setDeletePujariId({ id: pujari._id, name: pujari.name })}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Payouts
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Withdrawals Tab */}
                <TabsContent value="withdrawals" className="space-y-4">
                    <div className="bg-white rounded-xl border p-4 shadow-sm flex gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Requests</SelectItem>
                                <SelectItem value="pending">Pending ({withdrawalStats.pending})</SelectItem>
                                <SelectItem value="approved">Approved ({withdrawalStats.approved})</SelectItem>
                                <SelectItem value="paid">Paid ({withdrawalStats.paid})</SelectItem>
                                <SelectItem value="rejected">Rejected ({withdrawalStats.rejected})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                            </div>
                        ) : withdrawals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="font-bold text-lg">No withdrawal requests</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="font-bold text-xs uppercase">Pujari</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Amount</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Bank Details</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Requested</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Status & Tax</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Audit Trail</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.map((req) => (
                                            <TableRow key={req._id}>
                                                <TableCell>
                                                    <div className="font-semibold">{req.vendorName}</div>
                                                    <div className="text-xs text-muted-foreground">{req.vendorEmail}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-black text-xl text-[#8D0303]">₹{req.amount.toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <div className="font-medium">{req.bankDetails.bankName}</div>
                                                        <div className="text-muted-foreground">{req.bankDetails.accountHolderName}</div>
                                                        <div className="text-muted-foreground">A/C: ***{req.bankDetails.accountNumber.slice(-4)}</div>
                                                        <div className="text-muted-foreground">IFSC: {req.bankDetails.ifscCode}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{format(new Date(req.requestedAt), "dd MMM yyyy")}</div>
                                                    <div className="text-xs text-muted-foreground">{format(new Date(req.requestedAt), "h:mm a")}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                        req.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        req.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }>
                                                        {req.status}
                                                    </Badge>
                                                    {req.transactionRef && (
                                                        <div className="text-xs text-muted-foreground mt-1">Ref: {req.transactionRef}</div>
                                                    )}
                                                    {req.taxBreakdown && (
                                                        <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                                                            <div>TDS ({req.taxBreakdown.tdsRate}%): ₹{req.taxBreakdown.tdsAmount.toLocaleString()}</div>
                                                            <div>GST ({req.taxBreakdown.gstRate}%): ₹{req.taxBreakdown.gstAmount.toLocaleString()}</div>
                                                            {(req.taxBreakdown.otherDeductionAmount || 0) > 0 && (
                                                                <div>
                                                                    {req.taxBreakdown.otherDeductionLabel || "Other deduction"}: ₹{(req.taxBreakdown.otherDeductionAmount || 0).toLocaleString()}
                                                                </div>
                                                            )}
                                                            <div className="font-semibold text-green-700">Net: ₹{req.taxBreakdown.netPayableAmount.toLocaleString()}</div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs space-y-1 max-w-[220px]">
                                                        {(req.auditTrail || []).slice(-2).reverse().map((a, idx) => (
                                                            <div key={`${a.createdAt}-${idx}`} className="rounded border p-1.5 bg-muted/20">
                                                                 <div className="font-semibold capitalize">{a.action.replace("_", " ")}</div>
                                                                 <div className="text-muted-foreground">{a.actorName || a.actorRole || "System"} • {format(new Date(a.createdAt), "dd MMM, h:mm a")}</div>
                                                            </div>
                                                        ))}
                                                        {!req.auditTrail?.length && <span className="text-muted-foreground">No logs</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => {
                                                                        setApproveModal({
                                                                            open: true,
                                                                            id: req._id,
                                                                            name: req.vendorName,
                                                                            amount: req.amount
                                                                        });
                                                                        setApproveTdsRate(String(req.taxBreakdown?.tdsRate ?? 1));
                                                                        setApproveGstRate(String(req.taxBreakdown?.gstRate ?? 18));
                                                                        setApproveRemarks(req.remarks || "");
                                                                    }}
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectWithdrawal(req._id)}>
                                                                    <XCircle className="w-3 h-3 mr-1" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                    onClick={() => setPayModal({
                                                                        open: true,
                                                                        id: req._id,
                                                                        name: req.vendorName,
                                                                        amount: req.amount,
                                                                        type: 'withdrawal'
                                                                    })}
                                                                >
                                                                    <CreditCard className="w-3 h-3 mr-1" /> Mark Paid
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleRevertToPending(req._id)}>
                                                                    Move Pending
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancelApproved(req._id)}>
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:bg-red-50 border-red-200"
                                                            onClick={() => setDeleteWithdrawalId(req._id)}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" /> Delete
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
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <div className="bg-white rounded-xl border p-6 shadow-sm max-w-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-[#8D0303]" />
                            Pujari Withdrawal Limits Config
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Minimum Withdrawal Limit (₹)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="500"
                                    value={pujariMinWithdrawal}
                                    onChange={(e) => setPujariMinWithdrawal(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Pujaris cannot withdraw amounts smaller than this value.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Maximum Withdrawal Limit (₹)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="10000"
                                    value={pujariMaxWithdrawal}
                                    onChange={(e) => setPujariMaxWithdrawal(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Pujaris cannot request single withdrawals larger than this value.</p>
                            </div>
                            <Button
                                className="bg-[#8D0303] hover:bg-[#720202] text-white font-bold w-full"
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                                    </>
                                ) : (
                                    "Save Withdrawal Limits"
                                )}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Approve Modal */}
            <Dialog open={!!approveModal} onOpenChange={() => {
                setApproveModal(null);
                setApproveTdsRate("1");
                setApproveGstRate("18");
                setApproveRemarks("");
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Withdrawal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-muted/30 rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Pujari</div>
                            <div className="font-semibold">{approveModal?.name}</div>
                            <div className="text-sm mt-1">Requested: <span className="font-bold">₹{approveModal?.amount?.toLocaleString()}</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">TDS %</label>
                                <Input type="number" min={0} value={approveTdsRate} onChange={(e) => setApproveTdsRate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">GST %</label>
                                <Input type="number" min={0} value={approveGstRate} onChange={(e) => setApproveGstRate(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Remarks (Optional)</label>
                            <Input value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)} placeholder="Approval note" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApproveWithdrawal}>
                            Confirm Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pay Modal */}
            <Dialog open={!!payModal} onOpenChange={() => {
                setPayModal(null);
                setTransactionRef("");
                setRemarks("");
                setOtherDeductionLabel("");
                setOtherDeductionAmount("");
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-green-600" />
                            Mark Withdrawal As Paid
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted/30 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Paying to</div>
                            <div className="font-bold text-lg">{payModal?.name}</div>
                            <div className="text-2xl font-black text-green-600 mt-2">₹{payModal?.amount.toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Transaction Reference *</label>
                            <Input
                                placeholder="Enter bank transaction ID"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                            />
                        </div>
                        {payModal?.type === 'withdrawal' && (
                            <>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Extra Deduction Label (Optional)</label>
                                    <Input
                                        placeholder="e.g. Service fee deduction"
                                        value={otherDeductionLabel}
                                        onChange={(e) => setOtherDeductionLabel(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Extra Deduction Amount (Optional)</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={otherDeductionAmount}
                                        onChange={(e) => setOtherDeductionAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Remarks (Optional)</label>
                                    <Input
                                        placeholder="Any additional notes"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayModal(null)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handlePayWithdrawal}
                            disabled={processing || !transactionRef.trim()}
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteWithdrawalId} onOpenChange={() => { setDeleteWithdrawalId(null); setConfirmPassword(""); setShowPassword(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Withdrawal Request
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this withdrawal request? This action cannot be undone.
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
                        <Button variant="outline" onClick={() => { setDeleteWithdrawalId(null); setConfirmPassword(""); setShowPassword(false); }} disabled={deleting}>Cancel</Button>
                        <Button 
                            onClick={handleDeleteWithdrawal} 
                            disabled={deleting || !confirmPassword} 
                            variant="destructive"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Permanently Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Pujari Payouts Dialog */}
            <Dialog open={!!deletePujariId} onOpenChange={() => { setDeletePujariId(null); setConfirmPassword(""); setShowPassword(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Pujari Payouts
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete all payout records/earnings for Pujari <strong>{deletePujariId?.name}</strong>? This action cannot be undone and will reset their earnings statistics.
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
                        <Button variant="outline" onClick={() => { setDeletePujariId(null); setConfirmPassword(""); setShowPassword(false); }} disabled={deleting}>Cancel</Button>
                        <Button 
                            onClick={handleDeletePujariPayouts} 
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
