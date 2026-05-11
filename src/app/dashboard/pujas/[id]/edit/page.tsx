"use client";

import { use, useEffect, useState } from "react";
import PujaForm from "@/components/dashboard/PujaForm";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditPujaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPuja = async () => {
            try {
                const response = await api.get(`/pujas/${id}`);
                if (response.data.success) {
                    setInitialData(response.data.puja);
                } else {
                    toast.error("Failed to fetch puja");
                }
            } catch (error) {
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        fetchPuja();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
                    <p className="text-muted-foreground text-sm">Loading puja details...</p>
                </div>
            </div>
        );
    }

    return <PujaForm initialData={initialData} />;
}
