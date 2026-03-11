import api from "@/lib/axios";

export interface Coupon {
    _id?: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    usedCount: number;
    usageLimitPerUser: number;
    usedBy?: { userId: string; count: number }[];
    validFrom: string;
    validUntil: string;
    applicableCategories: string[];
    firstOrderOnly: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const couponsApi = {
    getAll: async (params?: { search?: string; status?: string }) => {
        const response = await api.get<{ coupons: Coupon[]; pagination: any }>("coupons", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<Coupon>(`coupons/${id}`);
        return response.data;
    },
    create: async (data: Partial<Coupon>) => {
        const response = await api.post<{ success: boolean; coupon: Coupon }>("coupons", data);
        return response.data;
    },
    update: async (id: string, data: Partial<Coupon>) => {
        const response = await api.put<{ success: boolean; coupon: Coupon }>(`coupons/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`coupons/${id}`);
        return response.data;
    }
};
