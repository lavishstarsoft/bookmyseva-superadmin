"use client";

import { useState, useEffect } from "react";
import { GripVertical, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/axios";

interface AppSection {
    _id: string;
    name: string;
    identifier: string;
    isVisible: boolean;
    order: number;
}

export default function MobileAppSectionsPage() {
    const [sections, setSections] = useState<AppSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // New Section State
    const [newName, setNewName] = useState("");
    const [newIdentifier, setNewIdentifier] = useState("");
    
    // Drag State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const res = await api.get('/mobile-app-sections');
            if (res.data?.success) {
                // Ensure sections are sorted by order
                const sorted = res.data.data.sort((a: AppSection, b: AppSection) => a.order - b.order);
                setSections(sorted);
            }
        } catch (error) {
            toast.error("Failed to fetch mobile app sections");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newIdentifier) {
            toast.error("Please fill in both name and identifier");
            return;
        }

        try {
            const res = await api.post('/mobile-app-sections', {
                name: newName,
                identifier: newIdentifier,
                order: sections.length
            });
            
            if (res.data?.success) {
                toast.success("Section added successfully");
                setNewName("");
                setNewIdentifier("");
                fetchSections();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add section");
        }
    };

    const toggleVisibility = async (id: string, currentVisibility: boolean) => {
        try {
            // Optimistic update
            setSections(sections.map(s => s._id === id ? { ...s, isVisible: !currentVisibility } : s));
            
            await api.put(`/mobile-app-sections/${id}`, {
                isVisible: !currentVisibility
            });
            toast.success("Visibility updated");
        } catch (error) {
            toast.error("Failed to update visibility");
            fetchSections(); // Revert on failure
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this section?")) return;
        
        try {
            await api.delete(`/mobile-app-sections/${id}`);
            toast.success("Section deleted");
            fetchSections();
        } catch (error) {
            toast.error("Failed to delete section");
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newSections = [...sections];
        const draggedItem = newSections[draggedItemIndex];
        
        newSections.splice(draggedItemIndex, 1);
        newSections.splice(index, 0, draggedItem);
        
        // Update order properties based on new index
        const updatedSections = newSections.map((sec, idx) => ({ ...sec, order: idx }));
        
        setDraggedItemIndex(index);
        setSections(updatedSections);
    };

    const handleDragEnd = async () => {
        setDraggedItemIndex(null);
        try {
            // Bulk update orders API (assuming backend supports it or iterating)
            // If backend expects bulk, we can do: await api.put('/mobile-app-sections/reorder', { sections })
            // Alternatively, update each one:
            await Promise.all(sections.map(sec => 
                api.put(`/mobile-app-sections/${sec._id}`, { order: sec.order })
            ));
            toast.success("Order updated");
        } catch (error) {
            toast.error("Failed to save new order");
            fetchSections(); // Revert
        }
    };

    return (
        <div className="p-6 w-full space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dynamic Home Sections</h1>
                <p className="text-muted-foreground">Manage the content sections like 'Pooja Kits', 'Prasadam', 'Book A Pooja' appearing on the mobile homepage.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-lg font-bold mb-4">Add New Section</h2>
                <form onSubmit={handleAddSection} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Label>Display Name (e.g., Pooja Kits)</Label>
                        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display Name" />
                    </div>
                    <div className="flex-1">
                        <Label>Component Identifier</Label>
                        <Input value={newIdentifier} onChange={e => setNewIdentifier(e.target.value)} placeholder="e.g., pooja-kits, prasadam" />
                    </div>
                    <Button type="submit">
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                    </Button>
                </form>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-4">
                <h2 className="text-lg font-bold mb-4">Manage Sections Order & Visibility</h2>
                
                {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : sections.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No sections added yet.</div>
                ) : (
                    <div className="space-y-3">
                        {sections.map((section, idx) => (
                            <div 
                                key={section._id}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-4 p-3 bg-gray-50 border rounded-lg transition-all ${draggedItemIndex === idx ? 'opacity-50' : ''}`}
                            >
                                <div className="cursor-move text-gray-400">
                                    <GripVertical />
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                    <div>
                                        <div className="font-semibold">{section.name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {section.identifier}</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="text-sm">Visible:</span>
                                        <Switch 
                                            checked={section.isVisible} 
                                            onCheckedChange={() => toggleVisibility(section._id, section.isVisible)} 
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(section._id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
