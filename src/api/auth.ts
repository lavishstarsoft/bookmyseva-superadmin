import api from '@/lib/axios';

// Types
export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
    };
}

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

// Auth API endpoints
export const authApi = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', { email, password });
        return response.data;
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Ignore logout errors - cookie will be cleared client-side
        }
    },

    getMe: async (): Promise<{ data: AuthUser }> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    refreshToken: async (): Promise<{ token: string }> => {
        const response = await api.post('/auth/refresh-token');
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },

    forgotPassword: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token: string, password: string): Promise<void> => {
        await api.post('/auth/reset-password', { token, password });
    },
};

export default authApi;
