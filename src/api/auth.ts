import api from "@/lib/axios";

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post("/api/login", { email, password });
        return response.data;
    },
};
