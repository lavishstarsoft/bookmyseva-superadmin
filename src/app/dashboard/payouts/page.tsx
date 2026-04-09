"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Loader2, Wallet, IndianRupee, Store, Clock,
    CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    RefreshCw, CreditCard, Building2, AlertCircle, Percent
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { payoutsApi, PayoutSummary, VendorPayoutSummary, WithdrawalRequest } from "@/api/payouts";
import { toast } from "sonner";
import { format } from "date-fns";

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

export default function PayoutsPage() {
    const [activeTab, setActiveTab] = useState("vendors");
    const [summary, setSummary] = useState<PayoutSummary | null>(null);
    const [vendors, setVendors] = useState<VendorPayoutSummary[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [withdrawalStats, setWithdrawalStats] = useState({ pending: 0, approved: 0, paid: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    const fetchSummary = async () => {
        try {
            const res = await payoutsApi.getSummary();
            setSummary(res.summary);
        } catch {
            toast.error("Failed to load summary");
        }
    };

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await payoutsApi.getVendorSummaries({ search: search || undefined, page, limit: 20 });
            setVendors(res.vendors);
            setTotalPages(res.pagination.pages);
        } catch {
            toast.error("Failed to load vendors");
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await payoutsApi.getWithdrawalRequests({
                status: statusFilter === "all" ? undefined : statusFilter,
                page,
                limit: 20
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

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (activeTab === "vendors") {
            fetchVendors();
        } else {
            fetchWithdrawals();
        }
    }, [activeTab, fetchVendors, fetchWithdrawals]);

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
        } catch {
            toast.error("Failed to reject");
        }
    };

    const handleSendStatement = async (id: string) => {
        try {
            await payoutsApi.sendStatementToVendor(id);
            toast.success("Statement sent to vendor");
            fetchWithdrawals();
        } catch {
            toast.error("Failed to send statement");
        }
    };

    const handleRevertToPending = async (id: string) => {
        const reason = prompt("Move back to pending reason (optional):") || "";
        try {
            await payoutsApi.revertWithdrawalToPending(id, reason);
            toast.success("Moved back to pending");
            fetchWithdrawals();
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
                        Vendor Payouts
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage vendor earnings and process payouts
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchSummary(); activeTab === "vendors" ? fetchVendors() : fetchWithdrawals(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Pending Payouts"
                        value={summary.pendingPayoutAmount}
                        color="bg-amber-100 text-amber-700"
                        icon={<Clock className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Paid Out"
                        value={summary.paidPayoutAmount}
                        color="bg-green-100 text-green-700"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        prefix="₹"
                    />
                    <StatCard
                        label="Withdrawal Requests"
                        value={summary.pendingWithdrawalCount}
                        color="bg-blue-100 text-blue-700"
                        icon={<CreditCard className="w-5 h-5" />}
                    />
                    <StatCard
                        label="Commission Earned"
                        value={summary.totalCommissionEarned}
                        color="bg-[#8D0303]/10 text-[#8D0303]"
                        icon={<Percent className="w-5 h-5" />}
                        prefix="₹"
                    />
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="vendors">Vendor Summary</TabsTrigger>
                    <TabsTrigger value="withdrawals">
                        Withdrawal Requests
                        {withdrawalStats.pending > 0 && (
                            <Badge className="ml-2 bg-amber-500 text-white">{withdrawalStats.pending}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Vendors Tab */}
                <TabsContent value="vendors" className="space-y-4">
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vendors..."
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
                        ) : vendors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <Store className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="font-bold text-lg">No vendors found</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="font-bold text-xs uppercase">Vendor</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Total Earnings</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Pending</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Paid</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Available To Withdraw</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Bank Details</TableHead>
                                            <TableHead className="font-bold text-xs uppercase">Payout Flow</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendors.map((vendor) => (
                                            <TableRow key={vendor._id}>
                                                <TableCell>
                                                    <div className="font-semibold">{vendor.name}</div>
                                                    <div className="text-xs text-muted-foreground">{vendor.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-lg">₹{vendor.totalEarnings.toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-amber-600">₹{vendor.pendingAmount.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">{vendor.pendingCount} orders</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-green-600">₹{vendor.paidAmount.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">{vendor.paidCount} orders</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-blue-700">₹{(vendor.availableForWithdrawal || 0).toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Pending req: ₹{(vendor.pendingWithdrawalAmount || 0).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {vendor.bankDetails?.accountNumber ? (
                                                        <div className="text-xs">
                                                            <div className="font-medium">{vendor.bankDetails.bankName}</div>
                                                            <div className="text-muted-foreground">***{vendor.bankDetails.accountNumber.slice(-4)}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Not set
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        Use <span className="font-semibold text-[#8D0303]">Withdrawal Requests</span> tab to release payments.
                                                    </span>
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
                                            <TableHead className="font-bold text-xs uppercase">Vendor</TableHead>
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
                                                                <Button size="sm" variant="outline" onClick={() => handleSendStatement(req._id)}>
                                                                    Send Statement
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleRevertToPending(req._id)}>
                                                                    Move Pending
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancelApproved(req._id)}>
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        )}
                                                        {req.status === 'paid' && (
                                                            <Button size="sm" variant="outline" onClick={() => handleSendStatement(req._id)}>
                                                                Resend Statement
                                                            </Button>
                                                        )}
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
                            <div className="text-sm text-muted-foreground">Vendor</div>
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
                                        placeholder="e.g. Damaged items, packaging fee"
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
        </div>
    );
}
