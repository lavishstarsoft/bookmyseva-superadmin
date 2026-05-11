"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Coins, Star, Plus, ArrowUpDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { toast } from "sonner";

interface CoinRecord {
    _id: string;
    userId: { _id: string; name: string; email: string; phone: string } | null;
    totalCoins: number;
    usedCoins: number;
    availableCoins: number;
    transactions: {
        type: "earned" | "used";
        amount: number;
        bookingId: string;
        description: string;
        paymentMode: string;
        createdAt: string;
    }[];
}

export default function BmsCoinsPage() {
    const [records, setRecords] = useState<CoinRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Add coins dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addUserId, setAddUserId] = useState("");
    const [addAmount, setAddAmount] = useState("");
    const [addDescription, setAddDescription] = useState("");
    const [adding, setAdding] = useState(false);

    // View transactions
    const [viewRecord, setViewRecord] = useState<CoinRecord | null>(null);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await api.get("/bms-coins/admin/all");
            setRecords(Array.isArray(response.data?.records) ? response.data.records : []);
        } catch {
            toast.error("Failed to load coin records");
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRecords(); }, []);

    const handleAddCoins = async () => {
        if (!addUserId || !addAmount) {
            toast.error("User ID and Amount are required");
            return;
        }
        setAdding(true);
        try {
            await api.post("/bms-coins/admin/add", {
                userId: addUserId,
                amount: Number(addAmount),
                description: addDescription || "Admin incentive bonus"
            });
            toast.success(`${addAmount} BMS Coins added successfully`);
            setAddOpen(false);
            setAddUserId("");
            setAddAmount("");
            setAddDescription("");
            fetchRecords();
        } catch {
            toast.error("Failed to add coins");
        } finally {
            setAdding(false);
        }
    };

    const filteredRecords = records.filter(r => {
        if (!searchTerm) return true;
        const name = r.userId?.name?.toLowerCase() || "";
        const phone = r.userId?.phone || "";
        return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    });

    const totalCoinsIssued = records.reduce((sum, r) => sum + r.totalCoins, 0);
    const totalCoinsUsed = records.reduce((sum, r) => sum + r.usedCoins, 0);
    const totalCoinsActive = records.reduce((sum, r) => sum + r.availableCoins, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">BMS Coins</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage user loyalty coins – earned through puja bookings.</p>
                </div>
                <Button className="bg-[#8D0303] hover:bg-[#700202] text-white" onClick={() => setAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Coins
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-l-amber-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
                        <Coins className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-amber-900">{totalCoinsIssued}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Coins</CardTitle>
                        <Star className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-emerald-900">{totalCoinsActive}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-l-4 border-l-blue-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Used</CardTitle>
                        <ArrowUpDown className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-900">{totalCoinsUsed}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Users with Coins</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-indigo-900">{records.length}</div></CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search users by name or phone..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Total Earned</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead>Transactions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-40 text-center"><div className="flex flex-col items-center justify-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /><p className="text-muted-foreground">Loading...</p></div></TableCell></TableRow>
                            ) : filteredRecords.map((record) => (
                                <TableRow key={record._id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="font-semibold">{record.userId?.name || "Unknown"}</div>
                                        <div className="text-xs text-muted-foreground">{record.userId?.phone || "—"}</div>
                                    </TableCell>
                                    <TableCell><span className="font-bold text-amber-700">{record.totalCoins}</span></TableCell>
                                    <TableCell><span className="font-medium text-blue-600">{record.usedCoins}</span></TableCell>
                                    <TableCell><span className="font-bold text-green-700">{record.availableCoins}</span></TableCell>
                                    <TableCell><span className="text-sm">{record.transactions?.length || 0}</span></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setViewRecord(record)}>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredRecords.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No coin records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* View Transactions Dialog */}
            <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-amber-600" />
                            Coin Transactions — {viewRecord?.userId?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {viewRecord && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-amber-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-amber-600">Total</div>
                                    <div className="font-bold text-amber-800">{viewRecord.totalCoins}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-blue-600">Used</div>
                                    <div className="font-bold text-blue-800">{viewRecord.usedCoins}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-xs text-green-600">Available</div>
                                    <div className="font-bold text-green-800">{viewRecord.availableCoins}</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {viewRecord.transactions?.map((tx, i) => (
                                    <div key={i} className={`p-3 rounded-lg text-sm flex items-center justify-between ${tx.type === 'earned' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div>
                                            <div className="font-medium">{tx.description || (tx.type === 'earned' ? 'Coins Earned' : 'Coins Used')}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                                        </div>
                                        <span className={`font-bold ${tx.type === 'earned' ? 'text-green-700' : 'text-red-700'}`}>
                                            {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                                        </span>
                                    </div>
                                ))}
                                {(!viewRecord.transactions || viewRecord.transactions.length === 0) && (
                                    <p className="text-center text-muted-foreground py-4">No transactions yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Coins Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#8D0303]" />
                            Add BMS Coins
                        </DialogTitle>
                        <DialogDescription>Manually add coins to a user as an incentive or bonus.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">User ID</label>
                            <Input placeholder="Enter User MongoDB ID..." value={addUserId} onChange={(e) => setAddUserId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Coins Amount</label>
                            <Input type="number" min={1} placeholder="e.g., 5" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Description (optional)</label>
                            <Textarea placeholder="e.g., Festival bonus, Referral reward..." value={addDescription} onChange={(e) => setAddDescription(e.target.value)} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
                        <Button onClick={handleAddCoins} disabled={adding} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Add Coins
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
