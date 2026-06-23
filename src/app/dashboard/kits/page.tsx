"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, MoreVertical, Star, Loader2, CheckCircle, XCircle, Clock, Store, Percent, Info, TrendingUp } from "lucide-react";
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
import { kitsApi, Kit } from "@/api/kits";
import { toast } from "sonner";

type TabType = "all" | "admin" | "vendor-pending" | "vendor-approved" | "vendor-rejected";

export default function KitsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [kits, setKits] = useState<Kit[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    // Approve dialog
    const [approveKit, setApproveKit] = useState<Kit | null>(null);
    const [commissionType, setCommissionType] = useState("percentage");
    const [commissionValue, setCommissionValue] = useState("");
    const [approving, setApproving] = useState(false);

    // Reject dialog
    const [rejectKit, setRejectKit] = useState<Kit | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const fetchKits = async () => {
        try {
            setLoading(true);
            const response = await kitsApi.getAllAdmin();
            setKits(Array.isArray(response) ? response : []);
        } catch {
            toast.error("Failed to load pooja kits");
            setKits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKits(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this kit?")) return;
        try {
            await kitsApi.delete(id);
            toast.success("Kit deleted successfully");
            fetchKits();
        } catch {
            toast.error("Failed to delete kit");
        }
    };

    const handleApprove = async () => {
        if (!approveKit?._id) return;
        setApproving(true);
        try {
            await kitsApi.approveKit(approveKit._id, {
                commissionType,
                commissionValue: Number(commissionValue) || 0,
            });
            toast.success("Kit approved successfully");
            setApproveKit(null);
            setCommissionValue("");
            fetchKits();
        } catch {
            toast.error("Failed to approve kit");
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectKit?._id) return;
        setRejecting(true);
        try {
            await kitsApi.rejectKit(rejectKit._id, rejectReason);
            toast.success("Kit rejected");
            setRejectKit(null);
            setRejectReason("");
            fetchKits();
        } catch {
            toast.error("Failed to reject kit");
        } finally {
            setRejecting(false);
        }
    };

    const getKitStatus = (kit: Kit) => {
        if (kit.source === "admin") return "admin";
        if (kit.vendorApproved) return "vendor-approved";
        if (kit.rejectionReason) return "vendor-rejected";
        return "vendor-pending";
    };

    const filteredKits = kits.filter(kit => {
        const matchSearch = (kit.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (kit.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (kit.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        return getKitStatus(kit) === activeTab;
    });

    const counts = {
        all: kits.length,
        admin: kits.filter(k => k.source === "admin").length,
        "vendor-pending": kits.filter(k => k.source === "vendor" && !k.vendorApproved && !k.rejectionReason).length,
        "vendor-approved": kits.filter(k => k.source === "vendor" && k.vendorApproved).length,
        "vendor-rejected": kits.filter(k => k.source === "vendor" && !k.vendorApproved && !!k.rejectionReason).length,
    };

    const tabs: { key: TabType; label: string; color: string }[] = [
        { key: "all", label: "All", color: "" },
        { key: "admin", label: "Admin", color: "text-blue-600" },
        { key: "vendor-pending", label: "Pending", color: "text-amber-600" },
        { key: "vendor-approved", label: "Approved", color: "text-green-600" },
        { key: "vendor-rejected", label: "Rejected", color: "text-red-600" },
    ];

    const statusBadge = (kit: Kit) => {
        const status = getKitStatus(kit);
        const config: Record<string, { label: string; classes: string }> = {
            admin: { label: "Admin", classes: "bg-blue-100 text-blue-800" },
            "vendor-pending": { label: "Pending", classes: "bg-amber-100 text-amber-800" },
            "vendor-approved": { label: "Approved", classes: "bg-green-100 text-green-800" },
            "vendor-rejected": { label: "Rejected", classes: "bg-red-100 text-red-800" },
        };
        const c = config[status];
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.classes}`}>{c.label}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pooja Kits</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage admin and vendor pooja kits.</p>
                </div>
                <Link href="/dashboard/kits/new">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white"><Plus className="w-4 h-4 mr-2" /> Add New Kit</Button>
                </Link>
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
                        <span className="text-sm font-medium text-amber-800">{counts["vendor-pending"]} vendor kit(s) waiting for approval</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setActiveTab("vendor-pending")}>Review Now</Button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search kits by name, category, vendor..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <TooltipProvider>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Kit Details</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Price (Hover details)</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="h-40 text-center"><div className="flex flex-col items-center justify-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /><p className="text-muted-foreground">Loading kits...</p></div></TableCell></TableRow>
                                ) : filteredKits.map((kit) => (
                                    <TableRow key={kit._id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                                {kit.image ? (
                                                    <img src={kit.image} alt={kit.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-center p-1">No Image</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">{kit.title}</div>
                                            <div className="text-xs text-muted-foreground">{kit.itemsIncluded?.length || 0} Items · <span className="uppercase font-bold text-[#8D0303]/70">{kit.category}</span></div>
                                        </TableCell>
                                        <TableCell>
                                            {kit.source === "vendor" ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="w-3.5 h-3.5 text-purple-600" />
                                                    <div>
                                                        <p className="text-xs font-medium">{kit.vendorName || "Vendor"}</p>
                                                        <p className="text-[10px] text-muted-foreground">Vendor Kit</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-blue-600">Admin</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const price = kit.category === 'daily'
                                                    ? (kit.pricingPlans?.find(p => p.active)?.price || kit.offerPrice || kit.marketPrice || 0)
                                                    : (kit.offerPrice || kit.marketPrice || 0);

                                                const priceNum = Number(price);
                                                if (!priceNum || priceNum <= 0) return <span className="text-gray-400 font-medium whitespace-nowrap">Price N/A</span>;

                                                // Fallback to vendor commission if kit level is not set
                                                const vendorInfo = typeof kit.vendorId === 'object' ? kit.vendorId : null;
                                                const commValue = kit.commissionValue !== undefined && kit.commissionValue > 0
                                                    ? Number(kit.commissionValue)
                                                    : (vendorInfo?.commissionValue !== undefined ? Number(vendorInfo.commissionValue) : 0);

                                                const commType = kit.commissionValue !== undefined && kit.commissionValue > 0
                                                    ? (kit.commissionType || "percentage")
                                                    : (vendorInfo?.commissionType || "percentage");

                                                // Calculate total tax percentage
                                                let totalTaxPercentage = 0;
                                                if (kit.taxes && Array.isArray(kit.taxes)) {
                                                    kit.taxes.forEach((tax: any) => {
                                                        totalTaxPercentage += Number(tax.percentage) || 0;
                                                    });
                                                }

                                                // Total Price inclusive of Taxes
                                                const totalPriceNum = priceNum + (priceNum * totalTaxPercentage) / 100;

                                                let commission = 0;
                                                if (commValue > 0) {
                                                    if (commType === "percentage") {
                                                        commission = Math.round((totalPriceNum * commValue) / 100);
                                                    } else {
                                                        commission = commValue;
                                                    }
                                                }
                                                if (commission > totalPriceNum) commission = totalPriceNum;
                                                const earnings = totalPriceNum - commission;

                                                if (kit.source !== 'vendor') {
                                                    return (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="inline-flex items-center gap-1.5 cursor-help group">
                                                                    <span className="font-black text-[#8D0303] text-base group-hover:underline">
                                                                        ₹{totalPriceNum}
                                                                        {totalTaxPercentage > 0 && <span className="text-xs text-muted-foreground ml-1">inc. GST</span>}
                                                                    </span>
                                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#8D0303]/10 group-hover:text-[#8D0303] transition-all">
                                                                        <Info className="w-3 h-3" />
                                                                    </div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="p-4 w-64 bg-white border-2 border-gray-100 shadow-xl rounded-xl z-50">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center font-bold text-gray-900 pb-2 border-b border-gray-100">
                                                                        <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                                                                        Price Breakdown
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between text-sm">
                                                                            <span className="text-gray-500">Base Price:</span>
                                                                            <span className="font-bold text-gray-900">₹{priceNum}</span>
                                                                        </div>
                                                                        {totalTaxPercentage > 0 && (
                                                                            <div className="flex items-center justify-between text-sm">
                                                                                <span className="text-gray-500">Taxes ({totalTaxPercentage}%):</span>
                                                                                <span className="font-bold text-gray-900">+ ₹{(priceNum * totalTaxPercentage) / 100}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="pt-2 mt-2 border-t-2 border-blue-100 flex items-center justify-between">
                                                                            <span className="font-bold text-blue-700">Total Price:</span>
                                                                            <span className="text-xl font-black text-blue-700">₹{totalPriceNum}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                }

                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center gap-1.5 cursor-help group">
                                                                <span className="font-black text-[#8D0303] text-base group-hover:underline">
                                                                    ₹{totalPriceNum}
                                                                    {totalTaxPercentage > 0 && <span className="text-xs text-muted-foreground ml-1">inc. GST</span>}
                                                                </span>
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
                                                                        <span className="text-gray-500">Base Price:</span>
                                                                        <span className="font-bold text-gray-900">₹{priceNum}</span>
                                                                    </div>
                                                                    {totalTaxPercentage > 0 && (
                                                                        <div className="flex items-center justify-between text-sm">
                                                                            <span className="text-gray-500">Taxes ({totalTaxPercentage}%):</span>
                                                                            <span className="font-bold text-gray-900">+ ₹{(priceNum * totalTaxPercentage) / 100}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-500">Total Sell Price:</span>
                                                                        <span className="font-bold text-gray-900">₹{totalPriceNum}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-sm text-[#8D0303]">
                                                                        <span className="flex items-center gap-1">
                                                                            BMS Commission
                                                                            <span className="text-[10px] bg-red-50 px-1 rounded">
                                                                                {commType === 'percentage' ? `${commValue}%` : `₹${commValue}`}
                                                                            </span>
                                                                        </span>
                                                                        <span className="font-bold">+ ₹{commission}</span>
                                                                    </div>
                                                                    <div className="pt-2 mt-2 border-t-2 border-green-100 flex items-center justify-between">
                                                                        <span className="font-bold text-green-700">Vendor Payout:</span>
                                                                        <span className="text-xl font-black text-green-700">₹{earnings}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            {kit.source === "vendor" && kit.vendorApproved ? (() => {
                                                const vendorInfo = typeof kit.vendorId === 'object' ? kit.vendorId : null;
                                                const commValue = kit.commissionValue !== undefined && kit.commissionValue > 0
                                                    ? kit.commissionValue
                                                    : (vendorInfo?.commissionValue || 0);
                                                const commType = kit.commissionValue !== undefined && kit.commissionValue > 0
                                                    ? (kit.commissionType || "percentage")
                                                    : (vendorInfo?.commissionType || "percentage");

                                                return (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                                            <Percent className="w-3 h-3 text-emerald-600" />
                                                        </div>
                                                        <span className="text-sm font-bold text-emerald-700">
                                                            {commValue}{commType === "percentage" ? "%" : " ₹"}
                                                        </span>
                                                    </div>
                                                );
                                            })() : kit.source === "vendor" ? (
                                                <span className="text-xs font-medium text-amber-600 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">Not Set</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{statusBadge(kit)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <Link href={`/dashboard/kits/edit/${kit._id}`}>
                                                        <DropdownMenuItem className="cursor-pointer"><Edit className="w-4 h-4 mr-2" /> Edit Kit</DropdownMenuItem>
                                                    </Link>
                                                    {kit.source === "vendor" && !kit.vendorApproved && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600" onClick={() => { setApproveKit(kit); setCommissionType(kit.commissionType || "percentage"); setCommissionValue(String(kit.commissionValue || "")); }}>
                                                                <CheckCircle className="w-4 h-4 mr-2" /> Approve Kit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setRejectKit(kit)}>
                                                                <XCircle className="w-4 h-4 mr-2" /> Reject Kit
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {kit.source === "vendor" && kit.vendorApproved && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="cursor-pointer text-amber-600 focus:text-amber-600" onClick={() => { setApproveKit(kit); setCommissionType(kit.commissionType || "percentage"); setCommissionValue(String(kit.commissionValue || "")); }}>
                                                                <Percent className="w-4 h-4 mr-2" /> Update Commission
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => kit._id && handleDelete(kit._id)}>
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && filteredKits.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                        {searchTerm ? "No kits matching your search." : "No kits found."}
                                    </TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TooltipProvider>
            </div>

            {/* Approve Dialog */}
            <Dialog open={!!approveKit} onOpenChange={() => setApproveKit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            {approveKit?.vendorApproved ? "Update Commission" : "Approve Vendor Kit"}
                        </DialogTitle>
                        <DialogDescription>
                            {approveKit?.vendorApproved
                                ? `Update commission for "${approveKit?.title}"`
                                : `Set commission and approve "${approveKit?.title}" by ${approveKit?.vendorName}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                            <p><span className="font-medium">Kit:</span> {approveKit?.title}</p>
                            <p><span className="font-medium">Vendor:</span> {approveKit?.vendorName}</p>
                            {(() => {
                                let taxPct = 0;
                                if (approveKit?.taxes && Array.isArray(approveKit.taxes)) {
                                    approveKit.taxes.forEach((tax: any) => { taxPct += Number(tax.percentage) || 0; });
                                }
                                const base = Number(approveKit?.offerPrice || approveKit?.marketPrice || 0);
                                const total = base + (base * taxPct) / 100;
                                return (
                                    <p><span className="font-medium">Total Price:</span> ₹{total} {taxPct > 0 && <span className="text-muted-foreground text-xs">(₹{base} + {taxPct}% GST)</span>}</p>
                                );
                            })()}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Commission Type</label>
                            <Select value={commissionType} onValueChange={setCommissionType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Commission Value</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                                    {commissionType === "percentage" ? "%" : "₹"}
                                </span>
                                <Input
                                    type="number" min={0}
                                    placeholder={commissionType === "percentage" ? "e.g., 15" : "e.g., 50"}
                                    value={commissionValue}
                                    onChange={(e) => setCommissionValue(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {commissionType === "percentage" && commissionValue && approveKit?.offerPrice && (
                                <p className="text-xs text-muted-foreground">
                                    Platform earns ₹{Math.round(Number(approveKit.offerPrice) * Number(commissionValue) / 100)} per kit sold
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveKit(null)} disabled={approving}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700 text-white">
                            {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            {approveKit?.vendorApproved ? "Update" : "Approve"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectKit} onOpenChange={() => setRejectKit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Reject Vendor Kit
                        </DialogTitle>
                        <DialogDescription>Reject &quot;{rejectKit?.title}&quot; by {rejectKit?.vendorName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Rejection Reason</label>
                            <Textarea
                                placeholder="Explain why this kit is being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectKit(null)} disabled={rejecting}>Cancel</Button>
                        <Button onClick={handleReject} disabled={rejecting} className="bg-red-600 hover:bg-red-700 text-white">
                            {rejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject Kit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
