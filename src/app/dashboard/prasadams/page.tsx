"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, MoreVertical, Star, Loader2, CheckCircle, XCircle, Clock, Store, Percent, Eye, EyeOff, Cookie, Tag, Truck, Info, TrendingUp } from "lucide-react";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { prasadamsApi, Prasadam } from "@/api/prasadams";
import { toast } from "sonner";
import { getBaseUrl } from "@/api";

type TabType = "all" | "admin" | "vendor-pending" | "vendor-approved" | "vendor-rejected";

const categoryLabels: Record<string, string> = {
    laddu: "Laddu",
    pulihora: "Pulihora",
    pongal: "Pongal",
    payasam: "Payasam",
    special: "Special Items",
    combo: "Combo Packs"
};

export default function PrasadamsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [prasadams, setPrasadams] = useState<Prasadam[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    // Approve dialog
    const [approvePrasadam, setApprovePrasadam] = useState<Prasadam | null>(null);
    const [commissionType, setCommissionType] = useState("percentage");
    const [commissionValue, setCommissionValue] = useState("");
    const [approving, setApproving] = useState(false);

    // Reject dialog
    const [rejectPrasadam, setRejectPrasadam] = useState<Prasadam | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const fetchPrasadams = async () => {
        try {
            setLoading(true);
            const response = await prasadamsApi.getAllAdmin();
            setPrasadams(Array.isArray(response) ? response : []);
        } catch {
            toast.error("Failed to load prasadams");
            setPrasadams([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPrasadams(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this prasadam?")) return;
        try {
            await prasadamsApi.delete(id);
            toast.success("Prasadam deleted successfully");
            fetchPrasadams();
        } catch {
            toast.error("Failed to delete prasadam");
        }
    };

    const handleToggleActive = async (prasadam: Prasadam) => {
        if (!prasadam._id) return;
        try {
            await prasadamsApi.toggleActive(prasadam._id);
            toast.success(`Prasadam ${prasadam.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchPrasadams();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleToggleFeatured = async (prasadam: Prasadam) => {
        if (!prasadam._id) return;
        try {
            await prasadamsApi.toggleFeatured(prasadam._id);
            toast.success(`Prasadam ${prasadam.isFeatured ? 'unfeatured' : 'featured'} successfully`);
            fetchPrasadams();
        } catch {
            toast.error("Failed to update featured status");
        }
    };

    const handleApprove = async () => {
        if (!approvePrasadam?._id) return;
        setApproving(true);
        try {
            await prasadamsApi.approve(approvePrasadam._id, {
                commissionType,
                commissionValue: Number(commissionValue) || 0,
            });
            toast.success("Prasadam approved successfully");
            setApprovePrasadam(null);
            setCommissionValue("");
            fetchPrasadams();
        } catch {
            toast.error("Failed to approve prasadam");
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectPrasadam?._id) return;
        setRejecting(true);
        try {
            await prasadamsApi.reject(rejectPrasadam._id, rejectReason);
            toast.success("Prasadam rejected");
            setRejectPrasadam(null);
            setRejectReason("");
            fetchPrasadams();
        } catch {
            toast.error("Failed to reject prasadam");
        } finally {
            setRejecting(false);
        }
    };

    const getPrasadamStatus = (prasadam: Prasadam) => {
        if (prasadam.source === "admin") return "admin";
        if (prasadam.vendorApproved) return "vendor-approved";
        if (prasadam.rejectionReason) return "vendor-rejected";
        return "vendor-pending";
    };

    const filteredPrasadams = prasadams.filter(prasadam => {
        const matchSearch = (prasadam.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (prasadam.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (prasadam.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        return getPrasadamStatus(prasadam) === activeTab;
    });

    const counts = {
        all: prasadams.length,
        admin: prasadams.filter(p => p.source === "admin").length,
        "vendor-pending": prasadams.filter(p => p.source === "vendor" && !p.vendorApproved && !p.rejectionReason).length,
        "vendor-approved": prasadams.filter(p => p.source === "vendor" && p.vendorApproved).length,
        "vendor-rejected": prasadams.filter(p => p.source === "vendor" && !p.vendorApproved && !!p.rejectionReason).length,
    };

    const tabs: { key: TabType; label: string; color: string }[] = [
        { key: "all", label: "All", color: "" },
        { key: "admin", label: "Admin", color: "text-blue-600" },
        { key: "vendor-pending", label: "Pending", color: "text-amber-600" },
        { key: "vendor-approved", label: "Approved", color: "text-green-600" },
        { key: "vendor-rejected", label: "Rejected", color: "text-red-600" },
    ];

    const statusBadge = (prasadam: Prasadam) => {
        const status = getPrasadamStatus(prasadam);
        const config: Record<string, { label: string; classes: string }> = {
            admin: { label: "Admin", classes: "bg-blue-100 text-blue-800" },
            "vendor-pending": { label: "Pending", classes: "bg-amber-100 text-amber-800" },
            "vendor-approved": { label: "Approved", classes: "bg-green-100 text-green-800" },
            "vendor-rejected": { label: "Rejected", classes: "bg-red-100 text-red-800" },
        };
        const c = config[status];
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.classes}`}>{c.label}</span>;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Cookie className="w-8 h-8 text-orange-500" />
                        Prasadams
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage sacred prasadam offerings.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/prasadams/delivery-schedule">
                        <Button variant="outline"><Truck className="w-4 h-4 mr-2" /> Delivery Schedule</Button>
                    </Link>
                    <Link href="/dashboard/prasadams/categories">
                        <Button variant="outline"><Tag className="w-4 h-4 mr-2" /> Manage Categories</Button>
                    </Link>
                    <Link href="/dashboard/prasadams/new">
                        <Button className="bg-[#8D0303] hover:bg-[#700202] text-white"><Plus className="w-4 h-4 mr-2" /> Add New Prasadam</Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-muted-foreground hover:text-gray-700'}`}
                    >
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span className={`ml-1.5 text-xs font-bold ${tab.key === "vendor-pending" && counts["vendor-pending"] > 0 ? "text-amber-600" : ""}`}>
                                ({counts[tab.key]})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Pending Alert */}
            {counts["vendor-pending"] > 0 && activeTab !== "vendor-pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">{counts["vendor-pending"]} prasadam(s) waiting for approval</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setActiveTab("vendor-pending")}>Review Now</Button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search prasadams by name, category, vendor..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <TooltipProvider>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">Image</TableHead>
                                        <TableHead>Prasadam Details</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Price (Hover details)</TableHead>
                                        <TableHead>Commission</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPrasadams.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                No prasadams found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPrasadams.map((prasadam) => {
                                            const basePriceNum = Number(prasadam.basePrice) || 0;
                                            const vendorInfo = typeof prasadam.vendorId === "object" ? prasadam.vendorId : null;

                                            const commValue = prasadam.commissionValue !== undefined && Number(prasadam.commissionValue) > 0
                                                ? Number(prasadam.commissionValue)
                                                : (vendorInfo?.commissionValue !== undefined ? Number(vendorInfo.commissionValue) : 0);

                                            const commType = prasadam.commissionValue !== undefined && Number(prasadam.commissionValue) > 0
                                                ? (prasadam.commissionType || "percentage")
                                                : (vendorInfo?.commissionType || "percentage");

                                            let commission = 0;
                                            if (commValue > 0 && basePriceNum > 0) {
                                                commission = commType === "percentage"
                                                    ? Math.round((basePriceNum * commValue) / 100)
                                                    : commValue;
                                            }
                                            if (commission > basePriceNum) commission = basePriceNum;
                                            const vendorPayout = Math.max(0, basePriceNum - commission);

                                            return (
                                                <TableRow key={prasadam._id} className={`hover:bg-muted/30 ${!prasadam.isActive ? "opacity-50" : ""}`}>
                                                    <TableCell>
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                                            {prasadam.image ? (
                                                                <img
                                                                    src={prasadam.image.startsWith("http") ? prasadam.image : `${getBaseUrl()}${prasadam.image}`}
                                                                    alt={prasadam.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                                                    <Cookie className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="font-semibold text-gray-900">{prasadam.title}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            <span className="uppercase font-bold text-[#8D0303]/70">{categoryLabels[prasadam.category] || prasadam.category}</span>
                                                            {prasadam.isFeatured && (
                                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                                                                    <Star className="w-3 h-3 mr-0.5 fill-current" /> Featured
                                                                </span>
                                                            )}
                                                            {prasadam.inStock === false && (
                                                                <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                                    Out of stock
                                                                </span>
                                                            )}
                                                            {prasadam.inStock && prasadam.stockQuantity !== undefined && (
                                                                <span className="ml-2 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                    Stock: {prasadam.stockQuantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {prasadam.source === "vendor" ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Store className="w-3.5 h-3.5 text-purple-600" />
                                                                <div>
                                                                    <p className="text-xs font-medium">{prasadam.vendorName || "Vendor"}</p>
                                                                    <p className="text-[10px] text-muted-foreground">Vendor Prasadam</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-medium text-blue-600">Admin</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {basePriceNum > 0 ? (
                                                            prasadam.source !== "vendor" ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="font-black text-gray-900 text-base">₹{basePriceNum}</div>
                                                                    {prasadam.marketPrice && Number(prasadam.marketPrice) > basePriceNum && (
                                                                        <div className="text-xs text-muted-foreground line-through">
                                                                            ₹{Number(prasadam.marketPrice)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="inline-flex items-center gap-1.5 cursor-help group">
                                                                            <span className="font-black text-[#8D0303] text-base group-hover:underline">₹{basePriceNum}</span>
                                                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#8D0303]/10 group-hover:text-[#8D0303] transition-all">
                                                                                <Info className="w-3 h-3" />
                                                                            </div>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right" className="p-4 w-64 bg-white border-2 border-gray-100 shadow-xl rounded-xl z-50">
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center font-bold text-gray-900 pb-2 border-b border-gray-100">
                                                                                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                                                                                Payout Breakdown
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center justify-between text-sm">
                                                                                    <span className="text-gray-500">Sell Price:</span>
                                                                                    <span className="font-bold text-gray-900">₹{basePriceNum}</span>
                                                                                </div>
                                                                                <div className="flex items-center justify-between text-sm text-[#8D0303]">
                                                                                    <span className="flex items-center gap-1">
                                                                                        BMS Commission
                                                                                        <span className="text-[10px] bg-red-50 px-1 rounded">
                                                                                            {commType === "percentage" ? `${commValue}%` : `₹${commValue}`}
                                                                                        </span>
                                                                                    </span>
                                                                                    <span className="font-bold">+ ₹{commission}</span>
                                                                                </div>
                                                                                <div className="pt-2 mt-2 border-t-2 border-green-100 flex items-center justify-between">
                                                                                    <span className="font-bold text-green-700">Vendor Payout:</span>
                                                                                    <span className="text-xl font-black text-green-700">₹{vendorPayout}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400 font-medium whitespace-nowrap">Price N/A</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {prasadam.source === "vendor" && prasadam.vendorApproved ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                                    <Percent className="w-3 h-3 text-emerald-600" />
                                                                </div>
                                                                <span className="text-sm font-bold text-emerald-700">
                                                                    {commValue}{commType === "percentage" ? "%" : " ₹"}
                                                                </span>
                                                            </div>
                                                        ) : prasadam.source === "vendor" ? (
                                                            <span className="text-xs font-medium text-amber-600 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">Not Set</span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>{statusBadge(prasadam)}</TableCell>

                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <Link href={`/dashboard/prasadams/edit/${prasadam._id}`}>
                                                                    <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                                </Link>
                                                                <DropdownMenuItem onClick={() => handleToggleActive(prasadam)}>
                                                                    {prasadam.isActive ? (
                                                                        <><EyeOff className="w-4 h-4 mr-2" /> Deactivate</>
                                                                    ) : (
                                                                        <><Eye className="w-4 h-4 mr-2" /> Activate</>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleToggleFeatured(prasadam)}>
                                                                    <Star className={`w-4 h-4 mr-2 ${prasadam.isFeatured ? "fill-current text-orange-500" : ""}`} />
                                                                    {prasadam.isFeatured ? "Unfeature" : "Feature"}
                                                                </DropdownMenuItem>
                                                                {prasadam.source === "vendor" && !prasadam.vendorApproved && !prasadam.rejectionReason && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => setApprovePrasadam(prasadam)} className="text-green-600">
                                                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setRejectPrasadam(prasadam)} className="text-red-600">
                                                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleDelete(prasadam._id!)} className="text-red-600">
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TooltipProvider>
                )}
            </div>

            {/* Approve Dialog */}
            <Dialog open={!!approvePrasadam} onOpenChange={() => setApprovePrasadam(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Prasadam</DialogTitle>
                        <DialogDescription>Set commission for "{approvePrasadam?.title}".</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium">Commission Type</label>
                                <Select value={commissionType} onValueChange={setCommissionType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium">Value</label>
                                <Input
                                    type="number"
                                    value={commissionValue}
                                    onChange={(e) => setCommissionValue(e.target.value)}
                                    placeholder={commissionType === "percentage" ? "e.g. 10" : "e.g. 50"}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApprovePrasadam(null)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700 text-white">
                            {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectPrasadam} onOpenChange={() => setRejectPrasadam(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Prasadam</DialogTitle>
                        <DialogDescription>Provide a reason for rejecting "{rejectPrasadam?.title}".</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium">Rejection Reason</label>
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectPrasadam(null)}>Cancel</Button>
                        <Button onClick={handleReject} disabled={rejecting || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                            {rejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
