import api from '@/lib/axios';

export interface Vendor {
    _id: string;
    firstName: string;
    surname: string;
    email: string;
    phone: string;
    profilePhoto: string;
    fullAddress: string;
    licenseNumber: string;
    panCard: string;
    pincode: string;
    state: string;
    knownLanguages: string[];
    documents: { type: string; url: string; uploadedAt: string }[];
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        mmicCode: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    approvedBy: string;
    approvedAt: string;
    rejectionReason: string;
    isActive: boolean;
    lastLogin: string;
    customFields: Record<string, string>;
    productCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface VendorProduct {
    _id: string;
    title: string;
    category: string;
    images: string[];
    price: number;
    offerPrice: number;
    vendorApproved: boolean;
    isActive: boolean;
    createdAt: string;
}

export const vendorsApi = {
    getAll: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
        const { data } = await api.get('/admin/vendors', { params });
        return data;
    },

    getById: async (id: string) => {
        const { data } = await api.get(`/admin/vendors/${id}`);
        return data;
    },

    approve: async (id: string) => {
        const { data } = await api.patch(`/admin/vendors/${id}/approve`);
        return data;
    },

    reject: async (id: string, reason?: string) => {
        const { data } = await api.patch(`/admin/vendors/${id}/reject`, { reason });
        return data;
    },

    suspend: async (id: string) => {
        const { data } = await api.patch(`/admin/vendors/${id}/suspend`);
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/admin/vendors/${id}`);
        return data;
    },

    getProducts: async (vendorId: string) => {
        const { data } = await api.get(`/admin/vendors/${vendorId}/products`);
        return data;
    },

    approveProduct: async (productId: string) => {
        const { data } = await api.patch(`/admin/vendor-products/${productId}/approve`);
        return data;
    },

    rejectProduct: async (productId: string) => {
        const { data } = await api.patch(`/admin/vendor-products/${productId}/reject`);
        return data;
    },
};
