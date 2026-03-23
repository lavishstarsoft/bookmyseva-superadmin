"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    ArrowLeft, CheckCircle, XCircle, Ban, Loader2, Package, Mail,
    Phone, MapPin, CreditCard, FileText, Shield, ExternalLink, Trash2,
    Image as ImageIcon,
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
import { contentApi } from "@/api/content";

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    width?: string;
}

export default function VendorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<VendorProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [actionDialog, setActionDialog] = useState<{
        type: "approve" | "reject" | "suspend" | "delete" | "approve-product" | "reject-product";
        targetId: string;
        targetName: string;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
    const [commissionValue, setCommissionValue] = useState("");

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

    const fetchFormFields = async () => {
        try {
            const res = await contentApi.getContent("vendor-registration-form");
            const fields = (res?.content?.formFields as FormField[]) || [];
            setFormFields(fields);
        } catch {
            // Form config not available, will fall back to raw display
        }
    };

    useEffect(() => {
        if (id) {
            fetchVendor();
            fetchProducts();
            fetchFormFields();
        }
    }, [id]);

    const handleAction = async () => {
        if (!actionDialog) return;
        setActionLoading(true);
        try {
            switch (actionDialog.type) {
                case "approve":
                    await vendorsApi.approve(actionDialog.targetId, {
                        commissionType,
                        commissionValue: Number(commissionValue) || 0,
                    });
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
            setCommissionValue("");
            setCommissionType("percentage");
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
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-sm font-semibold text-red-600">Rejection Reason:</p>
                        <p className="text-sm text-red-700 mt-1">{vendor.rejectionReason}</p>
                    </CardContent>
                </Card>
            )}

            {/* Commission Info */}
            {vendor.status === "approved" && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-sm">%</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Commission</p>
                                <p className="text-lg font-bold text-blue-700">
                                    {vendor.commissionValue || 0}{vendor.commissionType === "fixed" ? " ₹ per order" : "%"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCommissionType(vendor.commissionType || "percentage");
                                setCommissionValue(String(vendor.commissionValue || ""));
                                setActionDialog({ type: "approve", targetId: vendor._id, targetName: `${vendor.firstName} ${vendor.surname}` });
                            }}
                        >
                            Edit Commission
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Custom Registration Fields */}
            {vendor.customFields && Object.keys(vendor.customFields).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" /> Registration Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const customFields = vendor.customFields;
                            const entries = Object.entries(customFields);

                            // Use form field config for types and ordering if available
                            const fieldTypeMap: Record<string, string> = {};
                            if (formFields.length > 0) {
                                formFields.forEach(f => {
                                    fieldTypeMap[f.label] = f.type;
                                });
                            }

                            const isImageUrl = (val: string) => {
                                if (typeof val !== "string") return false;
                                if (!(val.startsWith("http://") || val.startsWith("https://"))) return false;
                                // Check file extensions
                                if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(val)) return true;
                                // Check known image hosting domains
                                if (/r2\.dev|cloudinary\.com|imgur\.com|googleapis\.com.*\/images/i.test(val)) return true;
                                return false;
                            };

                            const isFileUrl = (val: string) => {
                                if (typeof val !== "string") return false;
                                if (!(val.startsWith("http://") || val.startsWith("https://"))) return false;
                                // Check file extensions
                                if (/\.(pdf|doc|docx|xls|xlsx|csv|zip|rar|txt)(\?.*)?$/i.test(val)) return true;
                                // If it's a URL but not an image, treat as file
                                return !isImageUrl(val);
                            };

                            // Separate image/file fields from text fields
                            const imageFields: [string, unknown][] = [];
                            const fileFields: [string, unknown][] = [];
                            const textFields: [string, unknown][] = [];

                            // Order entries by form field config if available
                            const orderedEntries = formFields.length > 0
                                ? formFields
                                    .filter(f => customFields[f.label] !== undefined)
                                    .map(f => [f.label, customFields[f.label]] as [string, unknown])
                                    .concat(entries.filter(([key]) => !formFields.some(f => f.label === key)))
                                : entries;

                            orderedEntries.forEach(([key, val]) => {
                                const fieldType = fieldTypeMap[key];
                                const strVal = String(val || "");

                                if (fieldType === "image" || (!fieldType && isImageUrl(strVal))) {
                                    imageFields.push([key, val]);
                                } else if (fieldType === "file" || (!fieldType && typeof val === "string" && isFileUrl(strVal))) {
                                    fileFields.push([key, val]);
                                } else {
                                    textFields.push([key, val]);
                                }
                            });

                            return (
                                <div className="space-y-6">
                                    {/* Text fields in grid */}
                                    {textFields.length > 0 && (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {/* Registered Mobile Number */}
                                            <div className="text-sm rounded-lg border p-3 border-green-200 bg-green-50/50">
                                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Registered Mobile</span>
                                                <p className="font-semibold mt-1 text-gray-900">{vendor.phone || "—"}</p>
                                            </div>
                                            {textFields.map(([key, val]) => (
                                                <div key={key} className="text-sm rounded-lg border p-3">
                                                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{key}</span>
                                                    <p className="font-semibold mt-1 text-gray-900">
                                                        {val === true ? "Yes" : val === false ? "No" : String(val || "—")}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Image fields */}
                                    {imageFields.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Photos / Images</p>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {imageFields.map(([key, val]) => (
                                                    <div key={key} className="rounded-lg border p-3">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key}</span>
                                                        {val ? (
                                                            <a href={String(val)} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                                                <img
                                                                    src={String(val)}
                                                                    alt={key}
                                                                    className="w-full h-40 rounded-lg object-cover border hover:opacity-90 transition-opacity cursor-pointer"
                                                                />
                                                            </a>
                                                        ) : (
                                                            <div className="mt-2 h-40 rounded-lg bg-gray-100 flex items-center justify-center">
                                                                <ImageIcon className="h-8 w-8 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* File fields */}
                                    {fileFields.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Documents / Files</p>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {fileFields.map(([key, val]) => (
                                                    <div key={key} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key}</span>
                                                            <p className="text-sm text-gray-600 truncate mt-0.5">{String(val || "").split("/").pop() || "File"}</p>
                                                        </div>
                                                        {val ? (
                                                            <Button variant="outline" size="sm" asChild className="shrink-0">
                                                                <a href={String(val)} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                                                                </a>
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}

            {/* Bank Details */}
            {vendor.bankDetails?.accountNumber && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4" /> Bank Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                            <div className="rounded-lg border p-3">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Account Holder</span>
                                <p className="font-semibold mt-1 text-gray-900">{vendor.bankDetails.accountHolderName}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Account Number</span>
                                <p className="font-semibold mt-1 text-gray-900">{vendor.bankDetails.accountNumber}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Bank Name</span>
                                <p className="font-semibold mt-1 text-gray-900">{vendor.bankDetails.bankName}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">IFSC Code</span>
                                <p className="font-semibold mt-1 text-gray-900">{vendor.bankDetails.ifscCode}</p>
                            </div>
                            {vendor.bankDetails.mmicCode && (
                                <div className="rounded-lg border p-3">
                                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">MMIC Code</span>
                                    <p className="font-semibold mt-1 text-gray-900">{vendor.bankDetails.mmicCode}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents - only show if vendor has documents */}
            {vendor.documents && vendor.documents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" /> Documents ({vendor.documents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            )}

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
            <AlertDialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRejectReason(""); setCommissionValue(""); setCommissionType("percentage"); }}>
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
                        <AlertDialogDescription asChild>
                            <div>
                            {actionDialog?.type === "approve" && (
                                <div className="space-y-4">
                                    <p>Approve <strong>{actionDialog.targetName}</strong>? They will gain dashboard access.</p>
                                    <div className="rounded-lg border p-4 space-y-3 bg-gray-50">
                                        <p className="text-sm font-semibold text-gray-900">Set Commission</p>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={commissionType}
                                                onChange={(e) => setCommissionType(e.target.value as "percentage" | "fixed")}
                                                className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed (₹)</option>
                                            </select>
                                            <Input
                                                type="number"
                                                placeholder={commissionType === "percentage" ? "e.g. 15" : "e.g. 100"}
                                                value={commissionValue}
                                                onChange={(e) => setCommissionValue(e.target.value)}
                                                className="w-32"
                                                min="0"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {commissionType === "percentage" ? "%" : "₹ per order"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
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
                            </div>
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
