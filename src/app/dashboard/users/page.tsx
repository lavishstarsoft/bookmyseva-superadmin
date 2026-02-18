"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import {
    Search,
    Trash2,
    Ban,
    CheckCircle,
    MoreVertical,
    User as UserIcon,
    ShieldAlert
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    status: string;
    createdAt: string;
    authProvider: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/frontend-users");
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
            await api.put(`/frontend-users/${id}`, { status: newStatus });

            setUsers(users.map(user =>
                user._id === id ? { ...user, status: newStatus } : user
            ));

            toast.success(`User ${newStatus === "Active" ? "Unblocked" : "Blocked"} successfully`);
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update user status");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/frontend-users/${deleteId}`);
            setUsers(users.filter(user => user._id !== deleteId));
            toast.success("User deleted successfully");
        } catch (error) {
            console.error("Failed to delete user", error);
            toast.error("Failed to delete user");
        } finally {
            setDeleteId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery))
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === "Active").length,
        blocked: users.filter(u => u.status === "Blocked").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage platform users, view details, and handle security.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Currently active accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
                        <Ban className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                        <p className="text-xs text-muted-foreground">Restricted from access</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Users Directory</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name, email..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user._id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedUserId(user._id)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{user.authProvider}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{user.email}</span>
                                                <span className="text-xs text-muted-foreground">{user.phone || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusChange(user._id, user.status)}>
                                                        {user.status === "Active" ? (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4" /> Block User
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Unblock User
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteId(user._id)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* User Details Sheet */}
            <UserDetailsSheet
                userId={selectedUserId}
                open={!!selectedUserId}
                onOpenChange={(open) => !open && setSelectedUserId(null)}
            />
        </div>
    );
}

// --- User Details Sheet Component ---
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Package, Clock } from "lucide-react";

function UserDetailsSheet({ userId, open, onOpenChange }: { userId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "India"
    });

    useEffect(() => {
        if (userId && open) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const res = await api.get(`/frontend-users/${userId}/details`);
                    setData(res.data);

                    // Pre-fill form if address exists
                    if (res.data.user.address) {
                        setEditForm({
                            name: res.data.user.address.name || "",
                            phone: res.data.user.address.phone || "",
                            street: res.data.user.address.street || "",
                            city: res.data.user.address.city || "",
                            state: res.data.user.address.state || "",
                            zip: res.data.user.address.zip || "",
                            country: res.data.user.address.country || "India"
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch user details", error);
                    toast.error("Could not load user details");
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
            setIsEditing(false); // Reset editing state on open
        } else {
            setData(null);
        }
    }, [userId, open]);

    const handleSaveAddress = async () => {
        try {
            await api.put(`/frontend-users/${userId}`, {
                address: editForm
            });

            // Update local state
            const updatedUser = { ...data.user, address: editForm };
            setData({ ...data, user: updatedUser, derivedAddress: editForm });

            toast.success("Address updated successfully");
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update address", error);
            toast.error("Failed to update address");
        }
    };

    if (!userId) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>User Profile</SheetTitle>
                    <SheetDescription>
                        Complete overview of user activity and details.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : data ? (
                    <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                        <div className="space-y-6 py-6">
                            {/* Header Section */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={data.user.avatar} />
                                    <AvatarFallback className="text-xl">{data.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{data.user.name}</h3>
                                    <p className="text-muted-foreground">{data.user.email}</p>
                                    <p className="text-sm text-muted-foreground">{data.user.phone || "No phone number"}</p>
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant={data.user.status === "Active" ? "default" : "destructive"}>
                                            {data.user.status}
                                        </Badge>
                                        <Badge variant="outline" className="capitalize">
                                            {data.user.authProvider}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Bookings</div>
                                    <div className="text-2xl font-bold">{data.stats.totalBookings}</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Completed</div>
                                    <div className="text-2xl font-bold text-green-600">{data.stats.completedBookings}</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Waitlist</div>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {data.stats.totalBookings - data.stats.completedBookings}
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="flex items-center gap-2 font-semibold">
                                        <MapPin className="h-4 w-4 text-primary" /> Address / Location
                                    </h4>
                                    {!isEditing ? (
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            Edit Details
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleSaveAddress}>Save</Button>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border p-4 bg-muted/50">
                                    {isEditing ? (
                                        <div className="grid gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Recipient Name"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Phone Number"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Street Address / Door No"
                                                value={editForm.street}
                                                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="City"
                                                    value={editForm.city}
                                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="State"
                                                    value={editForm.state}
                                                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="ZIP Code"
                                                    value={editForm.zip}
                                                    onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                                                />
                                                <Input
                                                    defaultValue="India" readOnly disabled
                                                    className="bg-muted"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        data.derivedAddress ? (
                                            typeof data.derivedAddress === 'string' ? (
                                                <p className="text-sm leading-relaxed">{data.derivedAddress}</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {data.derivedAddress.name && (
                                                        <p className="font-semibold text-base">{data.derivedAddress.name}</p>
                                                    )}
                                                    <p className="font-medium">{data.derivedAddress.street}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {[data.derivedAddress.city, data.derivedAddress.state, data.derivedAddress.zip].filter(Boolean).join(", ")}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{data.derivedAddress.country}</p>
                                                    {data.derivedAddress.phone && (
                                                        <p className="text-sm text-muted-foreground">📞 {data.derivedAddress.phone}</p>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-muted-foreground italic mb-2">No address found.</p>
                                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                                    Add Address Manually
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Recent Activity / Bookings */}
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold mb-3">
                                    <Clock className="h-4 w-4 text-primary" /> Recent History
                                </h4>
                                <div className="space-y-4">
                                    {data.enquiries.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No recent activity.</p>
                                    ) : (
                                        data.enquiries.map((enquiry: any) => (
                                            <div key={enquiry._id} className="flex flex-col gap-1 rounded-lg border p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{enquiry.festivalName || "Pooja Booking"}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(enquiry.createdAt), "MMM dd, yyyy")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs lowercase">
                                                        {enquiry.type}
                                                    </Badge>
                                                    <Badge className={
                                                        enquiry.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            enquiry.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    } variant="secondary">
                                                        {enquiry.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
