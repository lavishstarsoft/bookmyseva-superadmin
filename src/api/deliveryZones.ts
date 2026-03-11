import api from "@/lib/axios";

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface DeliveryZone {
    _id?: string;
    name: string;
    description?: string;
    type: 'polygon' | 'circle';
    coordinates: Coordinate[];
    center?: Coordinate;
    radius?: number;
    color: string;
    pincodes: string[];
    deliveryCharge: number;
    minOrderValue: number;
    freeDeliveryAbove?: number | null;
    estimatedDays: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const deliveryZonesApi = {
    getAll: async (params?: { search?: string; status?: string }) => {
        const response = await api.get<{ zones: DeliveryZone[] }>("delivery-zones", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<DeliveryZone>(`delivery-zones/${id}`);
        return response.data;
    },
    create: async (data: Partial<DeliveryZone>) => {
        const response = await api.post<{ success: boolean; zone: DeliveryZone }>("delivery-zones", data);
        return response.data;
    },
    update: async (id: string, data: Partial<DeliveryZone>) => {
        const response = await api.put<{ success: boolean; zone: DeliveryZone }>(`delivery-zones/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`delivery-zones/${id}`);
        return response.data;
    },
    checkPincode: async (pincode: string) => {
        const response = await api.get<{
            serviceable: boolean;
            zone?: { name: string; deliveryCharge: number; minOrderValue: number; freeDeliveryAbove: number | null; estimatedDays: string };
            message?: string;
        }>(`delivery-zones/check/${pincode}`);
        return response.data;
    },
    checkLocation: async (lat: number, lng: number) => {
        const response = await api.post<{
            serviceable: boolean;
            zone?: { name: string; deliveryCharge: number; minOrderValue: number; freeDeliveryAbove: number | null; estimatedDays: string };
            message?: string;
        }>("delivery-zones/check-location", { lat, lng });
        return response.data;
    }
};
