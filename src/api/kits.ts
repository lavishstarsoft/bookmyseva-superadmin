import api from "@/lib/axios";

export interface PricingPlan {
    id: string;
    label: string;
    price: number | string;
    active: boolean;
    badge: string;
}

export interface KitItem {
    id: number;
    text: string;
}

export interface KitBadges {
    verifiedQuality: boolean;
    freeDelivery: boolean;
    premiumQuality: boolean;
    doorstepDelivery: boolean;
    panditCurated: boolean;
    easyCancel: boolean;
}

export interface KitShipping {
    freeShipping: boolean;
    shippingLabel: string;
    deliveryText: string;
    showShipping: boolean;
}

export interface KitTimeSlot {
    id: string;
    label: string;
    active: boolean;
}

export interface KitDeliveryConfig {
    timeSlots: KitTimeSlot[];
    bookingStartDate?: string;
    bookingEndDate?: string;
    leadDays: number;
    maxAdvanceDays: number;
}

export interface Kit {
    _id?: string;
    title: string;
    shortDescription: string;
    category: string;
    image?: string;
    images?: string[];
    defaultRating?: number;
    reviewCount?: number;
    itemsIncluded: KitItem[];
    pricingPlans?: PricingPlan[];
    marketPrice?: number | string;
    offerPrice?: number | string;
    badges?: KitBadges;
    shipping?: KitShipping;
    deliveryConfig?: KitDeliveryConfig;
    taxes?: any[];
    vendorId?: string | {
        _id: string;
        commissionType?: string;
        commissionValue?: number;
    };
    vendorName?: string;
    vendorApproved?: boolean;
    source?: string;
    commissionType?: string;
    commissionValue?: number;
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const kitsApi = {
    getAll: async () => {
        const response = await api.get<Kit[]>("kits");
        return response.data;
    },
    getAllAdmin: async () => {
        const response = await api.get<Kit[]>("kits/admin/all");
        return response.data;
    },
    getPending: async () => {
        const response = await api.get<Kit[]>("kits/admin/pending");
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<Kit>(`kits/${id}`);
        return response.data;
    },
    create: async (data: Kit) => {
        const response = await api.post<Kit>("kits", data);
        return response.data;
    },
    update: async (id: string, data: Partial<Kit>) => {
        const response = await api.put<Kit>(`kits/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`kits/${id}`);
        return response.data;
    },
    approveKit: async (id: string, data: { commissionType: string; commissionValue: number }) => {
        const response = await api.patch(`kits/${id}/approve`, data);
        return response.data;
    },
    rejectKit: async (id: string, reason: string) => {
        const response = await api.patch(`kits/${id}/reject`, { reason });
        return response.data;
    }
};
