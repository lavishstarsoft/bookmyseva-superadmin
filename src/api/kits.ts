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
    createdAt?: string;
    updatedAt?: string;
}

export const kitsApi = {
    getAll: async () => {
        const response = await api.get<Kit[]>("kits");
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
    }
};
