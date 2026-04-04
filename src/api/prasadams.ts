import api from "@/lib/axios";

export interface PricingTier {
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
    label?: string;
}

export interface ComboItem {
    itemId?: string;
    itemName: string;
    quantity: number;
    image?: string;
}

export interface TempleSource {
    templeName?: string;
    templeLocation?: string;
    templeImage?: string;
}

export interface DietaryInfo {
    isVegetarian: boolean;
    isVegan: boolean;
    containsNuts: boolean;
    containsDairy: boolean;
}

export interface PrasadamBadges {
    templeBlessed: boolean;
    freshlyPrepared: boolean;
    hygienic: boolean;
    doorstepDelivery: boolean;
    qualityAssured: boolean;
    easyCancel: boolean;
}

export interface PrasadamShipping {
    freeShipping: boolean;
    freeShippingAbove: number;
    shippingCharge: number;
    deliveryText: string;
    showShipping: boolean;
}

export interface PrasadamTimeSlot {
    id: string;
    label: string;
    active: boolean;
}

export interface PrasadamDeliveryConfig {
    timeSlots: PrasadamTimeSlot[];
    leadDays: number;
    maxAdvanceDays: number;
    availableDays: string[];
}

export interface Prasadam {
    _id?: string;
    title: string;
    slug?: string;
    shortDescription: string;
    fullDescription?: string;
    category: string;
    image?: string;
    images?: string[];
    basePrice: number;
    marketPrice?: number;
    pricingTiers?: PricingTier[];
    comboItems?: ComboItem[];
    unit: string;
    weightPerUnit?: number;
    defaultRating?: number;
    reviewCount?: number;
    templeSource?: TempleSource;
    ingredients?: string[];
    shelfLife?: number;
    dietary?: DietaryInfo;
    inStock?: boolean;
    stockQuantity?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    shipping?: PrasadamShipping;
    deliveryConfig?: PrasadamDeliveryConfig;
    badges?: PrasadamBadges;
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
    isFeatured?: boolean;
    isPopular?: boolean;
    isActive?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    value: string;
    label: string;
    count: number;
}

export const prasadamsApi = {
    getAll: async () => {
        const response = await api.get<Prasadam[]>("prasadams");
        return response.data;
    },
    getAllAdmin: async () => {
        const response = await api.get<Prasadam[]>("prasadams/admin/all");
        return response.data;
    },
    getPending: async () => {
        const response = await api.get<Prasadam[]>("prasadams/admin/pending");
        return response.data;
    },
    getCategories: async () => {
        const response = await api.get<Category[]>("prasadams/categories");
        return response.data;
    },
    getComboItems: async () => {
        const response = await api.get<Prasadam[]>("prasadams/combo-items");
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<Prasadam>(`prasadams/${id}`);
        return response.data;
    },
    create: async (data: Prasadam) => {
        const response = await api.post<Prasadam>("prasadams", data);
        return response.data;
    },
    update: async (id: string, data: Partial<Prasadam>) => {
        const response = await api.put<Prasadam>(`prasadams/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`prasadams/${id}`);
        return response.data;
    },
    toggleActive: async (id: string) => {
        const response = await api.patch(`prasadams/${id}/toggle-active`);
        return response.data;
    },
    toggleFeatured: async (id: string) => {
        const response = await api.patch(`prasadams/${id}/toggle-featured`);
        return response.data;
    },
    approve: async (id: string, data: { commissionType: string; commissionValue: number }) => {
        const response = await api.patch(`prasadams/${id}/approve`, data);
        return response.data;
    },
    reject: async (id: string, reason: string) => {
        const response = await api.patch(`prasadams/${id}/reject`, { reason });
        return response.data;
    }
};
