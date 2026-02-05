"use strict";
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, PartyPopper, ChevronDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

interface Enquiry {
    _id: string;
    festivalName: string;
    userDetails: {
        name: string;
        email: string;
        phone: string;
    };
    formData: Record<string, any>;
    status: string;
    contactNote?: string;
    contactedAt?: string;
    createdAt: string;
}

function EnquiriesContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("type") || "all";

    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [festivalFields, setFestivalFields] = useState<any[]>([]);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const [contactNote, setContactNote] = useState("");
    const [showNoteInput, setShowNoteInput] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Check if content is scrollable and update indicator
    const checkScrollable = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const isScrollable = container.scrollHeight > container.clientHeight;
            const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
            setShowScrollIndicator(isScrollable && !isAtBottom);
        }
    };

    useEffect(() => {
        if (selectedEnquiry) {
            // Reset states when opening modal
            setContactNote("");
            setShowNoteInput(false);
            setTimeout(checkScrollable, 100);
        }
    }, [selectedEnquiry]);

    const fetchFestivalData = async () => {
        try {
            // Fetch Upcoming Festival Config
            const response = await api.get("/content/upcoming-festival");
            if (response.data && response.data.content && response.data.content.formFields) {
                setFestivalFields(response.data.content.formFields);
            }
        } catch {
            // Failed to fetch festival fields
        }
    };

    const fetchEnquiries = async () => {
        try {
            const response = await api.get(`/enquiries`);
            setEnquiries(response.data?.enquiries || []);
        } catch {
            setEnquiries([]);
            // Failed to fetch enquiries
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFestivalData();
        fetchEnquiries();
    }, []);

    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        // Initialize Socket
        import("socket.io-client").then(({ io }) => {
            const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001");
            setSocket(socketInstance);

            socketInstance.on("connect", () => {
                console.log("Connected to socket");
            });

            socketInstance.on("new_enquiry", (newEnquiry: Enquiry) => {
                // Play Sound
                const audio = new Audio("/sounds/notification.mp3");
                audio.play().catch(e => console.log("Audio play failed", e));

                // Show Toast
                toast("New Booking Received!", {
                    description: `${newEnquiry.festivalName} for ${newEnquiry.userDetails?.name}`,
                    action: {
                        label: "View",
                        onClick: () => setSelectedEnquiry(newEnquiry)
                    }
                });

                // Update List
                setEnquiries(prev => [newEnquiry, ...prev]);
            });

            return () => {
                socketInstance.disconnect();
            };
        });
    }, []);

    const viewDetails = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry);
    };



    // ... useEffect ...

    // ... viewDetails ...

    const [activeTab, setActiveTab] = useState(defaultTab);

    // Sync Query Param with Tab
    useEffect(() => {
        const type = searchParams.get("type");
        if (type) {
            setActiveTab(type);
        }
    }, [searchParams]);

    // Filter Logic
    const filteredEnquiries = (enquiries || []).filter(enquiry => {
        const isPanchangam = Array.isArray(enquiry.formData);
        if (activeTab === "panchangam") return isPanchangam;
        if (activeTab === "festival") return !isPanchangam;
        return true;
    });

    // ... (previous code)

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/enquiries/${deleteId}`);
            setEnquiries(prev => prev.filter(e => e._id !== deleteId));
            toast.success("Deleted!", { description: "Enquiry deleted successfully." });
            setDeleteId(null);
        } catch (error) {
            toast.error("Failed to delete enquiry");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#8D0303]">Enquiries & Bookings</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Bookings</TabsTrigger>
                    <TabsTrigger value="festival">Festival Poojas</TabsTrigger>
                    <TabsTrigger value="panchangam" className="flex items-center gap-2">
                        <PartyPopper className="h-4 w-4" />
                        Panchangam Sevas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <EnquiriesTable enquiries={filteredEnquiries} viewDetails={viewDetails} loading={loading} onDelete={(id) => setDeleteId(id)} />
                </TabsContent>
                <TabsContent value="festival" className="space-y-4">
                    <EnquiriesTable enquiries={filteredEnquiries} viewDetails={viewDetails} loading={loading} onDelete={(id) => setDeleteId(id)} />
                </TabsContent>
                <TabsContent value="panchangam" className="space-y-4">
                    <EnquiriesTable enquiries={filteredEnquiries} viewDetails={viewDetails} loading={loading} onDelete={(id) => setDeleteId(id)} />
                </TabsContent>
            </Tabs>


            {/* Details Modal */}
            <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
                    {/* ... existing dialog content ... */}
                    {selectedEnquiry && (
                        <div className="relative">
                            {/* Scrollable Content */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScrollable}
                                className="overflow-y-auto max-h-[60vh] px-6 pb-4 custom-scrollbar"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#8D0303 #f1f1f1'
                                }}
                            >
                                <div className="space-y-6 pt-4">
                                    {/* User Details Section */}
                                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">User Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Name</span>
                                                <span className="font-medium">{selectedEnquiry.userDetails?.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Phone</span>
                                                <span className="font-medium">{selectedEnquiry.userDetails?.phone}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Email</span>
                                                <span className="font-medium">{selectedEnquiry.userDetails?.email || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Submitted On</span>
                                                <span className="font-medium">{format(new Date(selectedEnquiry.createdAt), "PPpp")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Booking Data Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 text-[#8D0303]">Pooja Preferences (Form Data)</h3>
                                        <div className="bg-white dark:bg-black border rounded-lg divide-y">
                                            {Array.isArray(selectedEnquiry.formData) ? (
                                                // Handle Array Format (Panchangam Bookings)
                                                selectedEnquiry.formData.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between p-3 text-sm">
                                                        <span className="font-medium text-muted-foreground capitalize">
                                                            {item.label}
                                                        </span>
                                                        <span className="font-semibold text-right mt-1 sm:mt-0">
                                                            {String(item.value)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                // Handle Object Format (Legacy Festival Bookings)
                                                Object.entries(selectedEnquiry.formData).map(([key, value]) => {
                                                    // Skip user details if redundant
                                                    if (['name', 'phone', 'email', 'mobile'].includes(key)) return null;

                                                    // Find label from festival fields or default to key
                                                    const field = festivalFields.find((f: any) => f.id === key);
                                                    const label = field ? field.label : key.replace(/_/g, ' ');

                                                    return (
                                                        <div key={key} className="flex flex-col sm:flex-row sm:justify-between p-3 text-sm">
                                                            <span className="font-medium text-muted-foreground capitalize">
                                                                {label}
                                                            </span>
                                                            <span className="font-semibold text-right mt-1 sm:mt-0">
                                                                {String(value)}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Status Section - Show if already contacted */}
                                    {selectedEnquiry.status === 'Contacted' && (
                                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase mb-2 flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                Contact Status
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-green-600">Contacted</Badge>
                                                    {selectedEnquiry.contactedAt && (
                                                        <span className="text-xs text-muted-foreground">
                                                            on {format(new Date(selectedEnquiry.contactedAt), "PPpp")}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedEnquiry.contactNote && (
                                                    <div className="mt-2 p-3 bg-white dark:bg-black rounded border text-sm">
                                                        <span className="text-xs text-muted-foreground block mb-1">Notes:</span>
                                                        <p className="whitespace-pre-wrap">{selectedEnquiry.contactNote}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Note Input Section - Show when marking as contacted */}
                                    {selectedEnquiry.status !== 'Contacted' && showNoteInput && (
                                        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <h3 className="text-sm font-semibold text-[#8D0303] uppercase mb-3 flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                Add Contact Notes (Optional)
                                            </h3>
                                            <Textarea
                                                placeholder="Enter notes about the conversation... (e.g., Customer confirmed booking, will pay on arrival, requested callback on Monday)"
                                                value={contactNote}
                                                onChange={(e) => setContactNote(e.target.value)}
                                                className="min-h-[100px] border-[#8D0303]/30 focus:border-[#8D0303]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scroll Indicator */}
                            {showScrollIndicator && (
                                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce">
                                    <div className="bg-[#8D0303] text-white px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-medium shadow-lg">
                                        <ChevronDown className="h-4 w-4" />
                                        Scroll for more
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 dark:bg-zinc-900">
                                <Button variant="outline" onClick={() => setSelectedEnquiry(null)}>Close</Button>
                                {selectedEnquiry.status !== 'Contacted' && (
                                    <>
                                        {!showNoteInput ? (
                                            <Button
                                                className="bg-[#8D0303] hover:bg-[#720202] text-white"
                                                onClick={() => setShowNoteInput(true)}
                                            >
                                                Mark as Contacted
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-[#8D0303] hover:bg-[#720202] text-white"
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/enquiries/${selectedEnquiry._id}`,
                                                            {
                                                                status: 'Contacted',
                                                                contactNote: contactNote.trim() || undefined,
                                                                contactedAt: new Date().toISOString()
                                                            }
                                                        );
                                                        // Update local state
                                                        setEnquiries(prev => prev.map(e => e._id === selectedEnquiry._id ? {
                                                            ...e,
                                                            status: 'Contacted',
                                                            contactNote: contactNote.trim() || undefined,
                                                            contactedAt: new Date().toISOString()
                                                        } : e));
                                                        setSelectedEnquiry(null);
                                                        setContactNote("");
                                                        setShowNoteInput(false);
                                                        toast.success("Updated!", { description: "Enquiry marked as contacted successfully." });
                                                    } catch {
                                                        toast.error("Failed to update status");
                                                    }
                                                }}
                                            >
                                                Confirm & Save
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title="Confirm Deletion"
                description="Are you sure you want to delete this enquiry? This action cannot be undone."
            />

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #8D0303;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #720202;
                }
            `}</style>
        </div >
    );
}

export default function EnquiriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EnquiriesContent />
        </Suspense>
    );
}

// Extracted Table Component for reuse
import { Trash2 } from "lucide-react";

function EnquiriesTable({ enquiries, viewDetails, loading, onDelete }: { enquiries: Enquiry[], viewDetails: (e: Enquiry) => void, loading: boolean, onDelete: (id: string) => void }) {
    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (enquiries.length === 0) {
        return (
            <Card>
                <CardContent className="text-center p-8 text-muted-foreground">
                    No bookings found for this category.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookings List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>User Name</TableHead>
                            <TableHead>Festival / Pooja</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enquiries.map((enquiry) => (
                            <TableRow key={enquiry._id}>
                                <TableCell>
                                    {Array.isArray(enquiry.formData) ? (
                                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">Panchangam</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Festival</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {enquiry.userDetails?.name || "Guest"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <PartyPopper className="h-4 w-4 text-[#8D0303]" />
                                        {enquiry.festivalName}
                                    </div>
                                </TableCell>
                                <TableCell>{enquiry.userDetails?.phone || "N/A"}</TableCell>
                                <TableCell>
                                    {format(new Date(enquiry.createdAt), "PP p")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={enquiry.status === "New" ? "destructive" : "secondary"}>
                                        {enquiry.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewDetails(enquiry)}
                                            className="gap-2 border-[#8D0303] text-[#8D0303] hover:bg-[#8D0303] hover:text-white"
                                        >
                                            <Eye className="h-4 w-4" /> View
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(enquiry._id);
                                            }}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
