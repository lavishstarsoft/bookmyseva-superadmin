import api from "@/lib/axios";

export interface KitOrderUser {
    userId: string;
    name: string;
    email: string;
    phone: string;
}

export interface KitOrderKit {
    kitId: string;
    title: string;
    image: string;
    category: string;
}

export interface KitOrderPlan {
    id: string;
    label: string;
    price: number;
}

export interface KitOrderAddress {
    line1: string;
    city: string;
    state: string;
    pincode: string;
}

export interface KitOrderVendor {
    vendorId: string | null;
    vendorName: string;
}

export interface VendorDetails {
    phone: string;
    address: string;
}

export interface KitOrderCommission {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
}

export type KitOrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type KitOrderPaymentStatus = 'pending' | 'paid' | 'failed';
export type KitOrderVendorStatus = 'none' | 'pending' | 'accepted' | 'rejected' | 'packed' | 'shipped';

export interface KitOrder {
    _id: string;
    orderId: string;
    user: KitOrderUser;
    kit: KitOrderKit;
    plan: KitOrderPlan;
    quantity: number;
    totalAmount: number;
    deliveryDate?: string;
    deliverySlot: string;
    deliveryAddress: KitOrderAddress;
    status: KitOrderStatus;
    paymentStatus: KitOrderPaymentStatus;
    paymentId: string;
    notes: string;
    vendor?: KitOrderVendor;
    vendorStatus?: KitOrderVendorStatus;
    commission?: KitOrderCommission;
    vendorPayout?: number;
    trackingId?: string;
    courierName?: string;
    courierWebsite?: string;
    vendorDetails?: VendorDetails;
    createdAt: string;
    updatedAt: string;
}

export interface KitOrderStats {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
}

export interface KitOrderRevenue {
    totalRevenue: number;
    totalCommission: number;
    totalVendorPayout: number;
}

export interface KitOrdersResponse {
    orders: KitOrder[];
    pagination: { total: number; page: number; limit: number; pages: number };
    stats: KitOrderStats;
    revenue?: KitOrderRevenue;
}

export const kitOrdersApi = {
    getAll: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
        const response = await api.get<KitOrdersResponse>('kit-orders', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<KitOrder>(`kit-orders/${id}`);
        return response.data;
    },
    updateStatus: async (id: string, data: { status?: KitOrderStatus; paymentStatus?: KitOrderPaymentStatus; notes?: string; trackingId?: string; courierName?: string; courierWebsite?: string }) => {
        const response = await api.patch<{ success: boolean; order: KitOrder }>(`kit-orders/${id}/status`, data);
        return response.data;
    }
};
