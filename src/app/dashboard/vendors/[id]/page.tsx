"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    ArrowLeft, CheckCircle, XCircle, Ban, Loader2, Package, Mail,
    Phone, MapPin, CreditCard, FileText, Shield, ExternalLink, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { vendorsApi, type Vendor, type VendorProduct } from "@/api/vendors";

export default function VendorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<VendorProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [actionDialog, setActionDialog] = useState<{
        type: "approve" | "reject" | "suspend" | "delete" | "approve-product" | "reject-product";
        targetId: string;
        targetName: string;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchVendor = async () => {
        try {
            const res = await vendorsApi.getById(id);
            setVendor(res.vendor);
        } catch {
            toast.error("Failed to load vendor");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await vendorsApi.getProducts(id);
            setProducts(res.products || []);
        } catch {
            toast.error("Failed to load vendor products");
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchVendor();
            fetchProducts();
        }
    }, [id]);

    const handleAction = async () => {
        if (!actionDialog) return;
        setActionLoading(true);
        try {
            switch (actionDialog.type) {
                case "approve":
                    await vendorsApi.approve(actionDialog.targetId);
                    toast.success("Vendor approved");
                    break;
                case "reject":
                    await vendorsApi.reject(actionDialog.targetId, rejectReason);
                    toast.success("Vendor rejected");
                    break;
                case "suspend":
                    await vendorsApi.suspend(actionDialog.targetId);
                    toast.success("Vendor suspended");
                    break;
                case "delete":
                    await vendorsApi.delete(actionDialog.targetId);
                    toast.success("Vendor deleted permanently");
                    router.push("/dashboard/vendors");
                    return;
                case "approve-product":
                    await vendorsApi.approveProduct(actionDialog.targetId);
                    toast.success("Product approved");
                    break;
                case "reject-product":
                    await vendorsApi.rejectProduct(actionDialog.targetId);
                    toast.success("Product rejected");
                    break;
            }
            fetchVendor();
            fetchProducts();
        } catch {
            toast.error(`Action failed`);
        } finally {
            setActionLoading(false);
            setActionDialog(null);
            setRejectReason("");
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            approved: { variant: "default", label: "Approved" },
            pending: { variant: "outline", label: "Pending" },
            rejected: { variant: "destructive", label: "Rejected" },
            suspended: { variant: "secondary", label: "Suspended" },
        };
        const s = map[status] || { variant: "outline" as const, label: status };
        return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Vendor not found.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/vendors")}>
                    Back to Vendors
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/vendors")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={vendor.profilePhoto} />
                            <AvatarFallback className="text-lg">
                                {(vendor.firstName?.[0] || "") + (vendor.surname?.[0] || "")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{vendor.firstName} {vendor.surname}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(vendor.status)}
                                <span className="text-sm text-muted-foreground">
                                    Joined {format(new Date(vendor.createdAt), "MMM dd, yyyy")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {vendor.status !== "approved" && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setActionDialog({ type: "approve", targetId: vendor._id, targetName: `${vendor.firstName} ${vendor.surname}` })}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                    )}
                    {vendor.status !== "rejected" && (
                        <Button
                            variant="destructive"
                            onClick={() => setActionDialog({ type: "reject", targetId: vendor._id, targetName: `${vendor.firstName} ${vendor.surname}` })}
                        >
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                    )}
                    {vendor.status === "approved" && (
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ type: "suspend", targetId: vendor._id, targetName: `${vendor.firstName} ${vendor.surname}` })}
                        >
                            <Ban className="h-4 w-4 mr-2" /> Suspend
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setActionDialog({ type: "delete", targetId: vendor._id, targetName: `${vendor.firstName} ${vendor.surname}` })}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                </div>
            </div>

            {vendor.status === "rejected" && vendor.rejectionReason && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-4">
                        <p className="text-sm font-semibold text-red-600">Rejection Reason:</p>
                        <p className="text-sm text-red-700 mt-1">{vendor.rejectionReason}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-4 w-4" /> Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>{vendor.fullAddress || "No address"}{vendor.pincode ? `, ${vendor.pincode}` : ""}{vendor.state ? `, ${vendor.state}` : ""}</span>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">License No.</span>
                                <p className="font-medium">{vendor.licenseNumber || "—"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">PAN Card</span>
                                <p className="font-medium">{vendor.panCard || "—"}</p>
                            </div>
                        </div>
                        {vendor.knownLanguages && vendor.knownLanguages.length > 0 && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Languages:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {vendor.knownLanguages.map((lang, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{lang}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4" /> Bank Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vendor.bankDetails?.accountNumber ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Account Holder</span>
                                    <p className="font-medium">{vendor.bankDetails.accountHolderName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-muted-foreground">Account Number</span>
                                        <p className="font-medium">{vendor.bankDetails.accountNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Bank Name</span>
                                        <p className="font-medium">{vendor.bankDetails.bankName}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-muted-foreground">IFSC Code</span>
                                        <p className="font-medium">{vendor.bankDetails.ifscCode}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">MMIC Code</span>
                                        <p className="font-medium">{vendor.bankDetails.mmicCode || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No bank details provided.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Custom Registration Fields */}
            {vendor.customFields && Object.keys(vendor.customFields).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" /> Registration Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(vendor.customFields).map(([key, val]) => (
                                <div key={key} className="text-sm">
                                    <span className="text-muted-foreground">{key}</span>
                                    {typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")) ? (
                                        val.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <div className="mt-1">
                                                <img src={val} alt={key} className="h-20 w-20 rounded object-cover border" />
                                            </div>
                                        ) : (
                                            <p className="font-medium">
                                                <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block">
                                                    View File
                                                </a>
                                            </p>
                                        )
                                    ) : (
                                        <p className="font-medium">{val || "—"}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" /> Documents ({vendor.documents?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {vendor.documents && vendor.documents.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {vendor.documents.map((doc, i) => (
                                <div key={i} className="rounded-lg border p-3 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <Badge variant="secondary" className="text-xs capitalize mb-1">
                                            {doc.type.replace("_", " ")}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="shrink-0"
                                    >
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                    )}
                </CardContent>
            </Card>

            {/* Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4" /> Products ({products.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {productsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No products listed.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Approval</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0] && (
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium">{product.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{product.category}</TableCell>
                                        <TableCell>
                                            {product.offerPrice ? (
                                                <div>
                                                    <span className="font-medium">₹{product.offerPrice}</span>
                                                    <span className="text-xs text-muted-foreground line-through ml-1">₹{product.price}</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">₹{product.price}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.vendorApproved ? "default" : "outline"}>
                                                {product.vendorApproved ? "Approved" : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(product.createdAt), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {!product.vendorApproved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => setActionDialog({
                                                            type: "approve-product",
                                                            targetId: product._id,
                                                            targetName: product.title,
                                                        })}
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => setActionDialog({
                                                            type: "reject-product",
                                                            targetId: product._id,
                                                            targetName: product.title,
                                                        })}
                                                    >
                                                        <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <AlertDialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRejectReason(""); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionDialog?.type === "approve" && "Approve Vendor"}
                            {actionDialog?.type === "reject" && "Reject Vendor"}
                            {actionDialog?.type === "suspend" && "Suspend Vendor"}
                            {actionDialog?.type === "delete" && "Delete Vendor Permanently"}
                            {actionDialog?.type === "approve-product" && "Approve Product"}
                            {actionDialog?.type === "reject-product" && "Revoke Product Approval"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionDialog?.type === "approve" && (
                                <>Approve <strong>{actionDialog.targetName}</strong>? They will gain dashboard access.</>
                            )}
                            {actionDialog?.type === "reject" && (
                                <div className="space-y-3">
                                    <p>Reject <strong>{actionDialog.targetName}</strong>?</p>
                                    <Input
                                        placeholder="Rejection reason (optional)"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                </div>
                            )}
                            {actionDialog?.type === "suspend" && (
                                <>Suspend <strong>{actionDialog.targetName}</strong>? They will lose dashboard access.</>
                            )}
                            {actionDialog?.type === "delete" && (
                                <>Permanently delete <strong>{actionDialog.targetName}</strong>? This will remove the vendor account, all their products, and payout records. This action cannot be undone.</>
                            )}
                            {actionDialog?.type === "approve-product" && (
                                <>Approve <strong>{actionDialog.targetName}</strong>? It will become visible to customers.</>
                            )}
                            {actionDialog?.type === "reject-product" && (
                                <>Revoke approval for <strong>{actionDialog.targetName}</strong>? It will be hidden from customers.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={
                                actionDialog?.type === "approve" || actionDialog?.type === "approve-product"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : actionDialog?.type === "reject" || actionDialog?.type === "reject-product" || actionDialog?.type === "delete"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : ""
                            }
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {actionDialog?.type === "delete" ? "Delete Permanently" : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
