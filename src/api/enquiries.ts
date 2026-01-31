import api from '@/lib/axios';

// Types
export interface Enquiry {
    _id: string;
    festivalName: string;
    userDetails: {
        name: string;
        email: string;
        phone: string;
    };
    formData: Record<string, unknown> | Array<{ label: string; value: unknown }>;
    status: 'pending' | 'contacted' | 'completed' | 'cancelled';
    contactNote?: string;
    contactedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EnquiriesResponse {
    success: boolean;
    enquiries: Enquiry[];
    total?: number;
    page?: number;
    limit?: number;
}

// Enquiries API endpoints
export const enquiriesApi = {
    getAll: async (params?: { 
        page?: number; 
        limit?: number; 
        status?: string;
        type?: 'festival' | 'panchangam';
    }): Promise<EnquiriesResponse> => {
        const response = await api.get<EnquiriesResponse>('/enquiries', { params });
        return response.data;
    },

    getById: async (id: string): Promise<{ enquiry: Enquiry }> => {
        const response = await api.get(`/enquiries/${id}`);
        return response.data;
    },

    updateStatus: async (id: string, status: string, contactNote?: string): Promise<{ enquiry: Enquiry }> => {
        const response = await api.patch(`/enquiries/${id}/status`, { status, contactNote });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/enquiries/${id}`);
    },

    bulkUpdateStatus: async (ids: string[], status: string): Promise<void> => {
        await api.patch('/enquiries/bulk-status', { ids, status });
    },

    export: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
        const response = await api.get(`/enquiries/export`, {
            params: { format },
            responseType: 'blob',
        });
        return response.data;
    },
};

export default enquiriesApi;
