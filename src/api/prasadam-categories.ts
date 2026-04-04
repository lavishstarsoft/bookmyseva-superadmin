import api from "@/lib/axios";

export interface PrasadamCategory {
    _id?: string;
    name: string;
    slug?: string;
    label: string;
    description?: string;
    image?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
    count?: number;
    createdAt?: string;
    updatedAt?: string;
}

export const prasadamCategoriesApi = {
    getAll: async () => {
        const response = await api.get<PrasadamCategory[]>("prasadam-categories");
        return response.data;
    },
    getAllAdmin: async () => {
        const response = await api.get<PrasadamCategory[]>("prasadam-categories/admin/all");
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<PrasadamCategory>(`prasadam-categories/admin/${id}`);
        return response.data;
    },
    create: async (data: Partial<PrasadamCategory>) => {
        const response = await api.post<PrasadamCategory>("prasadam-categories", data);
        return response.data;
    },
    update: async (id: string, data: Partial<PrasadamCategory>) => {
        const response = await api.put<PrasadamCategory>(`prasadam-categories/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`prasadam-categories/${id}`);
        return response.data;
    },
    toggleStatus: async (id: string) => {
        const response = await api.patch(`prasadam-categories/${id}/toggle-status`);
        return response.data;
    },
    reorder: async (categories: { _id: string; order: number }[]) => {
        const response = await api.post("prasadam-categories/reorder", { categories });
        return response.data;
    },
    seedDefault: async () => {
        const response = await api.post("prasadam-categories/seed");
        return response.data;
    }
};
