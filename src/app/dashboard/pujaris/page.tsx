"use client";

// Vercel trigger redeploy
import { useState, useEffect } from "react";
import { Search, Loader2, UserCheck, UserX, Users, Star, MapPin, Phone, Eye, Shield, Clock, MoreVertical, CheckCircle, XCircle, Ban, FileText, Trash2, EyeOff } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Pujari {
    _id: string;
    name: string;
    phone: string;
    email: string;
    profilePhoto: string;
    qualification: string;
    specializations: string[];
    experience: number;
    knownLanguages: string[];
    location: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    isOnline: boolean;
    isVerified: boolean;
    rating: number;
    totalRatings: number;
    completedBookings: number;
    status: "pending" | "approved" | "rejected" | "suspended";
    rejectionReason: string;
    earnings: { total: number; pending: number; withdrawn: number };
    customFields?: Record<string, any>;
    zoneId?: string;
    medal?: "none" | "Bronze" | "Silver" | "Gold" | "Diamond";
    createdAt: string;
}

type TabType = "all" | "pending" | "approved" | "suspended";

export default function PujarisPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [pujaris, setPujaris] = useState<Pujari[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    // View detail
    const [viewPujari, setViewPujari] = useState<Pujari | null>(null);

    // Reject dialog
    const [rejectPujari, setRejectPujari] = useState<Pujari | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);
    
    // Delete dialog
    const [deletePujari, setDeletePujari] = useState<Pujari | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [dynamicFields, setDynamicFields] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [updatingZone, setUpdatingZone] = useState(false);

    const fetchPujaris = async () => {
        try {
            setLoading(true);
            const response = await api.get("/pujari-auth/admin/all");
            setPujaris(Array.isArray(response.data?.pujaris) ? response.data.pujaris : []);
        } catch {
            toast.error("Failed to load pujaris");
            setPujaris([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormConfig = async () => {
        try {
            const response = await api.get("/content/pujari-registration-form");
            if (response.data?.content?.formFields) {
                setDynamicFields(response.data.content.formFields);
            }
        } catch (err) {
            console.error("Failed to fetch form config", err);
        }
    };

    const fetchZones = async () => {
        try {
            const data = await api.get("/delivery-zones", { params: { category: 'pujari' } });
            setZones(data.data.zones || []);
        } catch (err) {
            console.error("Failed to fetch zones", err);
        }
    };
 
    useEffect(() => { 
        fetchPujaris(); 
        fetchFormConfig();
        fetchZones();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/pujari-auth/admin/${id}/status`, { status: "approved" });
            toast.success("Pujari approved successfully");
            fetchPujaris();
        } catch {
            toast.error("Failed to approve");
        }
    };

    const handleReject = async () => {
        if (!rejectPujari) return;
        setRejecting(true);
        try {
            await api.patch(`/pujari-auth/admin/${rejectPujari._id}/status`, {
                status: "rejected",
                rejectionReason: rejectReason
            });
            toast.success("Pujari rejected");
            setRejectPujari(null);
            setRejectReason("");
            fetchPujaris();
        } catch {
            toast.error("Failed to reject");
        } finally {
            setRejecting(false);
        }
    };

    const handleSuspend = async (id: string) => {
        if (!confirm("Are you sure you want to suspend this pujari?")) return;
        try {
            await api.patch(`/pujari-auth/admin/${id}/status`, { status: "suspended" });
            toast.success("Pujari suspended");
            fetchPujaris();
        } catch {
            toast.error("Failed to suspend");
        }
    };

    const handleDelete = async () => {
        if (!deletePujari) return;
        setDeleting(true);
        try {
            await api.delete(`/pujari-auth/admin/${deletePujari._id}`, {
                data: { password: confirmPassword }
            });
            toast.success("Pujari deleted successfully");
            setDeletePujari(null);
            setConfirmPassword("");
            fetchPujaris();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to delete";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };
 
    const handleUpdateZone = async (pujariId: string, zoneId: string) => {
        try {
            setUpdatingZone(true);
            await api.patch(`/pujari-auth/admin/${pujariId}/profile`, { zoneId });
            toast.success("Zone assigned successfully");
            fetchPujaris();
            setViewPujari(prev => prev ? { ...prev, zoneId } : null);
        } catch {
            toast.error("Failed to assign zone");
        } finally {
            setUpdatingZone(false);
        }
    };

    const filteredPujaris = pujaris.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone.includes(searchTerm) ||
            p.qualification.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        return p.status === activeTab;
    });

    const counts = {
        all: pujaris.length,
        pending: pujaris.filter(p => p.status === "pending").length,
        approved: pujaris.filter(p => p.status === "approved").length,
        suspended: pujaris.filter(p => p.status === "suspended").length,
    };

    const tabs: { key: TabType; label: string; color: string }[] = [
        { key: "all", label: "All", color: "" },
        { key: "pending", label: "Pending", color: "text-amber-600" },
        { key: "approved", label: "Approved", color: "text-green-600" },
        { key: "suspended", label: "Suspended", color: "text-red-600" },
    ];

    const statusBadge = (status: string) => {
        const config: Record<string, { label: string; classes: string }> = {
            pending: { label: "Pending", classes: "bg-amber-100 text-amber-800" },
            approved: { label: "Approved", classes: "bg-green-100 text-green-800" },
            rejected: { label: "Rejected", classes: "bg-red-100 text-red-800" },
            suspended: { label: "Suspended", classes: "bg-gray-100 text-gray-800" },
        };
        const c = config[status] || config.pending;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.classes}`}>{c.label}</span>;
    };
 
    const medalBadge = (medal: string, earnings: number = 0) => {
        let displayMedal = medal;
        
        // Auto-calculate if not set or "none"
        if (!displayMedal || displayMedal === "none") {
            if (earnings >= 500000) displayMedal = "Diamond";
            else if (earnings >= 200000) displayMedal = "Gold";
            else if (earnings >= 100000) displayMedal = "Silver";
            else if (earnings > 0) displayMedal = "Bronze";
            else return null;
        }

        const config: Record<string, { bg: string; text: string; border: string }> = {
            Bronze: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
            Silver: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
            Gold: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
            Diamond: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        };
        const c = config[displayMedal] || config.Bronze;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${c.bg} ${c.text} ${c.border} shadow-sm animate-in fade-in zoom-in duration-300`}>
                <Star className="w-2.5 h-2.5 fill-current" />
                {displayMedal}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pujari Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage pujari registrations, approvals, and assignments.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pujaris</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900">{counts.all}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-l-amber-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">{counts.pending}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-emerald-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">{counts.approved}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-l-4 border-l-red-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                        <Ban className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{counts.suspended}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {counts.pending > 0 && activeTab !== "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">{counts.pending} pujari(s) waiting for approval</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setActiveTab("pending")}>Review Now</Button>
                </div>
            )}

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
                            <span className={`ml-1.5 text-xs font-bold ${tab.key === "pending" && counts.pending > 0 ? "text-amber-600" : ""}`}>
                                ({counts[tab.key]})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search pujaris by name, phone, qualification..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[60px]">Photo</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Pujari Details</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Qualification</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Location & Zone</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Performance</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Earnings</TableHead>
                                <TableHead className="font-bold text-[#8D0303]">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-40 text-center"><div className="flex flex-col items-center justify-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /><p className="text-muted-foreground">Loading pujaris...</p></div></TableCell></TableRow>
                            ) : filteredPujaris.map((pujari) => (
                                <TableRow key={pujari._id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-visible relative group">
                                            <div className="w-10 h-10 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-[3] group-hover:shadow-2xl group-hover:z-50 relative border-2 border-transparent group-hover:border-white origin-left group-hover:translate-x-4">
                                                {pujari.profilePhoto ? (
                                                    <img src={pujari.profilePhoto} alt={pujari.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center text-sm font-bold text-indigo-700">
                                                        {pujari.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            {pujari.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-[51] group-hover:hidden" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-x border-border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-bold text-gray-900">{pujari.name}</div>
                                            {medalBadge(pujari.medal || "none", pujari.earnings?.total || 0)}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3 text-[#8D0303]" /> {pujari.phone}</div>
                                        <div className="text-[11px] font-medium text-indigo-600 mt-1">
                                            {pujari.experience} Years Exp {pujari.knownLanguages?.length > 0 && `· ${pujari.knownLanguages.join(", ")}`}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{pujari.qualification}</div>
                                        <div className="text-xs text-muted-foreground">{pujari.specializations?.join(", ")}</div>
                                    </TableCell>
                                    <TableCell className="border-x border-border">
                                        <div className="text-xs flex items-center gap-1 font-medium text-gray-700">
                                            <MapPin className="w-3 h-3 text-red-500" /> {pujari.location?.city || "—"}
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">Service Zone</span>
                                            <div className="text-[11px] font-bold text-[#8D0303] bg-[#8D0303]/5 px-2 py-0.5 rounded-md border border-[#8D0303]/10 w-fit">
                                                {zones.find(z => z._id === pujari.zoneId)?.name || "Not Assigned"}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-x border-border">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-bold">{pujari.rating || "0"}</span>
                                            <span className="text-[10px] text-muted-foreground">({pujari.totalRatings})</span>
                                        </div>
                                        <div className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 w-fit">
                                            {pujari.completedBookings} Completed
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-x border-border">
                                        <div className="text-sm font-black text-gray-900">₹{pujari.earnings?.total || 0}</div>
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Life Time</div>
                                    </TableCell>
                                    <TableCell>{statusBadge(pujari.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => setViewPujari(pujari)}>
                                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                {pujari.status === "pending" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600" onClick={() => handleApprove(pujari._id)}>
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => setRejectPujari(pujari)}>
                                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {pujari.status === "approved" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleSuspend(pujari._id)}>
                                                            <Ban className="w-4 h-4 mr-2" /> Suspend
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {pujari.status === "suspended" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600" onClick={() => handleApprove(pujari._id)}>
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Re-Approve
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 font-semibold" onClick={() => setDeletePujari(pujari)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Pujari
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredPujaris.length === 0 && (
                                <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                    {searchTerm ? "No pujaris matching your search." : "No pujaris registered yet."}
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* View Detail Dialog */}
            <Dialog open={!!viewPujari} onOpenChange={() => setViewPujari(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#8D0303]" />
                            Pujari Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewPujari && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center text-2xl font-bold text-indigo-700 overflow-hidden">
                                    {viewPujari.profilePhoto ? <img src={viewPujari.profilePhoto} alt="" className="w-full h-full object-cover" /> : viewPujari.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{viewPujari.name}</h3>
                                    <p className="text-sm text-muted-foreground">{viewPujari.phone} · {viewPujari.email || "No email"}</p>
                                    {statusBadge(viewPujari.status)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-muted/50 p-3 rounded-lg">
                                    <div className="text-xs text-muted-foreground">Rating</div>
                                    <div className="font-semibold flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {viewPujari.rating} ({viewPujari.totalRatings})</div>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg">
                                    <div className="text-xs text-muted-foreground">Completed</div>
                                    <div className="font-semibold">{viewPujari.completedBookings} bookings</div>
                                </div>
                            </div>

                            {/* Dynamic Fields Section */}
                            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-3">
                                <div className="text-xs text-muted-foreground mb-1 font-bold flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Registration Details
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dynamicFields.length > 0 ? (
                                        dynamicFields.map((field) => {
                                            const normalizedLabel = field.label.toLowerCase();
                                            // Skip fields handled in header
                                            if (normalizedLabel.includes('name') || normalizedLabel.includes('phone') || normalizedLabel.includes('mobile')) return null;

                                            let value = viewPujari.customFields?.[field.label];
                                            
                                            // Fallback for mapped fields
                                            if (!value) {
                                                if (normalizedLabel.includes('qualification')) value = viewPujari.qualification;
                                                if (normalizedLabel.includes('experience')) value = viewPujari.experience ? `${viewPujari.experience} years` : null;
                                                if (normalizedLabel.includes('location') || normalizedLabel === 'city') value = `${viewPujari.location?.address || ""} ${viewPujari.location?.city || ""}`.trim();
                                                if (normalizedLabel.includes('specialization')) value = viewPujari.specializations?.join(", ");
                                            }

                                            if (!value && !field.required) return null;

                                            return (
                                                <div key={field.id} className="flex justify-between items-start border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                                                    <span className="text-muted-foreground font-medium">{field.label}:</span>
                                                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                                                        {Array.isArray(value) ? value.join(", ") : value}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        // Fallback if form config fails or is empty
                                        viewPujari.customFields && Object.entries(viewPujari.customFields).map(([label, value]) => (
                                            <div key={label} className="flex justify-between items-start border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                                                <span className="text-muted-foreground font-medium">{label}:</span>
                                                <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                                                    {Array.isArray(value) ? value.join(", ") : String(value)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Zone Assignment Section */}
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Assigned Service Zone
                                </div>
                                <div className="space-y-3">
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-indigo-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={viewPujari.zoneId || ""}
                                        onChange={(e) => handleUpdateZone(viewPujari._id, e.target.value)}
                                        disabled={updatingZone}
                                    >
                                        <option value="">No Zone Assigned</option>
                                        {zones.map((zone) => (
                                            <option key={zone._id} value={zone._id}>
                                                {zone.name} ({zone.type})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-indigo-500 italic">
                                        * Assigning a zone restricts this pujari to bookings within that specific geofenced area.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-green-600">Total Earned</div>
                                    <div className="font-bold text-green-800">₹{viewPujari.earnings?.total || 0}</div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-amber-600">Pending</div>
                                    <div className="font-bold text-amber-800">₹{viewPujari.earnings?.pending || 0}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-blue-600">Withdrawn</div>
                                    <div className="font-bold text-blue-800">₹{viewPujari.earnings?.withdrawn || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectPujari} onOpenChange={() => setRejectPujari(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Reject Pujari Registration
                        </DialogTitle>
                        <DialogDescription>Reject &quot;{rejectPujari?.name}&quot; registration</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Rejection Reason</label>
                            <Textarea
                                placeholder="Explain why this registration is being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectPujari(null)} disabled={rejecting}>Cancel</Button>
                        <Button onClick={handleReject} disabled={rejecting} className="bg-red-600 hover:bg-red-700 text-white">
                            {rejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletePujari} onOpenChange={() => { setDeletePujari(null); setConfirmPassword(""); setShowPassword(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5 text-red-600" />
                            Delete Pujari
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete &quot;{deletePujari?.name}&quot;? This action cannot be undone.
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
                        <Button variant="outline" onClick={() => { setDeletePujari(null); setConfirmPassword(""); setShowPassword(false); }} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete} 
                            disabled={deleting || !confirmPassword} 
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Permanently Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
