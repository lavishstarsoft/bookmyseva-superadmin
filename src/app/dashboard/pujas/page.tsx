"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, MoreVertical, Star, Loader2, Eye, EyeOff, BookOpen, Clock, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Puja {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    category: string;
    duration: string;
    rating: number;
    reviewCount: number;
    image: string;
    isActive: boolean;
    versions: any[];
}

type TabType = "all" | "active" | "inactive";

export default function PujasPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [pujas, setPujas] = useState<Puja[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    const fetchPujas = async () => {
        try {
            setLoading(true);
            const response = await api.get("/pujas/admin/all");
            setPujas(Array.isArray(response.data?.pujas) ? response.data.pujas : []);
        } catch {
            toast.error("Failed to load pujas");
            setPujas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPujas(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this puja?")) return;
        try {
            await api.delete(`/pujas/${id}`);
            toast.success("Puja deleted successfully");
            fetchPujas();
        } catch {
            toast.error("Failed to delete puja");
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await api.patch(`/pujas/${id}/toggle-status`);
            toast.success("Status updated");
            fetchPujas();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const filteredPujas = pujas.filter(puja => {
        const matchSearch = puja.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            puja.category.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        if (activeTab === "active") return puja.isActive;
        if (activeTab === "inactive") return !puja.isActive;
        return true;
    });

    const counts = {
        all: pujas.length,
        active: pujas.filter(p => p.isActive).length,
        inactive: pujas.filter(p => !p.isActive).length,
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: "all", label: "All" },
        { key: "active", label: "Active" },
        { key: "inactive", label: "Inactive" },
    ];

    const categoryBadge = (category: string) => {
        const config: Record<string, string> = {
            homam: "bg-orange-100 text-orange-800",
            archana: "bg-blue-100 text-blue-800",
            abhishekam: "bg-indigo-100 text-indigo-800",
            vratham: "bg-purple-100 text-purple-800",
            pooja: "bg-amber-100 text-amber-800",
            special: "bg-rose-100 text-rose-800",
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${config[category] || "bg-gray-100 text-gray-800"}`}>
                {category}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Puja Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage all pujas with Basic, Premium & Super Premium versions.</p>
                </div>
                <Link href="/dashboard/pujas/create">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add New Puja
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pujas</CardTitle>
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900">{counts.all}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Eye className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">{counts.active}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-l-orange-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        <EyeOff className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">{counts.inactive}</div>
                    </CardContent>
                </Card>
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
                            <span className="ml-1.5 text-xs font-bold">({counts[tab.key]})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search pujas by name or category..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Puja Details</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Pricing (B / P / SP)</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-40 text-center"><div className="flex flex-col items-center justify-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /><p className="text-muted-foreground">Loading pujas...</p></div></TableCell></TableRow>
                            ) : filteredPujas.map((puja) => (
                                <TableRow key={puja._id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                            {puja.image ? (
                                                <img src={puja.image} alt={puja.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-lg">🪔</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900">{puja.title}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{puja.shortDescription || "No description"}</div>
                                        {puja.duration && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {puja.duration}</div>}
                                    </TableCell>
                                    <TableCell>{categoryBadge(puja.category)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 text-xs">
                                            {puja.versions.map(v => (
                                                <span key={v.id} className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                                    ₹{v.price}
                                                </span>
                                            ))}
                                            {puja.versions.length === 0 && <span className="text-muted-foreground">Not set</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-semibold">{puja.rating}</span>
                                            <span className="text-xs text-muted-foreground">({puja.reviewCount})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${puja.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {puja.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/dashboard/pujas/${puja._id}/edit`}>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Edit className="w-4 h-4 mr-2" /> Edit Puja
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleToggleStatus(puja._id)}>
                                                    {puja.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                                    {puja.isActive ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleDelete(puja._id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredPujas.length === 0 && (
                                <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                    {searchTerm ? "No pujas matching your search." : "No pujas found. Add your first puja!"}
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
