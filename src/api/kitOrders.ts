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

export type KitOrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type KitOrderPaymentStatus = 'pending' | 'paid' | 'failed';

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

export interface KitOrdersResponse {
    orders: KitOrder[];
    pagination: { total: number; page: number; limit: number; pages: number };
    stats: KitOrderStats;
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
    updateStatus: async (id: string, data: { status?: KitOrderStatus; paymentStatus?: KitOrderPaymentStatus; notes?: string }) => {
        const response = await api.patch<{ success: boolean; order: KitOrder }>(`kit-orders/${id}/status`, data);
        return response.data;
    }
};
