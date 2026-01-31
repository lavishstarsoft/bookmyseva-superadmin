import api from '@/lib/axios';

// Types
export interface ChatSession {
    _id: string;
    socketId: string;
    userId: string | null;
    guestDetails?: {
        name: string;
        phone: string;
        email: string;
    };
    isActive: boolean;
    lastActivity: string;
    escalated: boolean;
    unreadCount?: number;
    lastMessage?: string;
    createdAt: string;
}

export interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'bot' | 'admin';
    message: string;
    isRead: boolean;
    isDeleted?: boolean;
    createdAt: string;
}

export interface BotIntent {
    _id: string;
    keywords: string[];
    response: string;
    isActive: boolean;
    priority: number;
    createdAt: string;
}

// Chat API endpoints
export const chatApi = {
    // Sessions
    getSessions: async (params?: { 
        isActive?: boolean; 
        escalated?: boolean;
        page?: number;
        limit?: number;
    }): Promise<ChatSession[]> => {
        const response = await api.get<ChatSession[]>('/chat/sessions', { params });
        return response.data;
    },

    getSessionById: async (sessionId: string): Promise<ChatSession> => {
        const response = await api.get(`/chat/sessions/${sessionId}`);
        return response.data;
    },

    getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
        return response.data;
    },

    endSession: async (sessionId: string): Promise<void> => {
        await api.post(`/chat/sessions/${sessionId}/end`);
    },

    // Bot Intents
    getIntents: async (): Promise<BotIntent[]> => {
        const response = await api.get<BotIntent[]>('/chat/intents');
        return response.data;
    },

    createIntent: async (data: Omit<BotIntent, '_id' | 'createdAt'>): Promise<BotIntent> => {
        const response = await api.post<BotIntent>('/chat/intents', data);
        return response.data;
    },

    updateIntent: async (id: string, data: Partial<BotIntent>): Promise<BotIntent> => {
        const response = await api.patch<BotIntent>(`/chat/intents/${id}`, data);
        return response.data;
    },

    deleteIntent: async (id: string): Promise<void> => {
        await api.delete(`/chat/intents/${id}`);
    },

    // Quick Actions
    getQuickActions: async (): Promise<unknown[]> => {
        const response = await api.get('/chat/quick-actions');
        return response.data;
    },

    // Analytics
    getAnalytics: async (params?: { 
        startDate?: string; 
        endDate?: string;
    }): Promise<unknown> => {
        const response = await api.get('/chat/analytics', { params });
        return response.data;
    },
};

export default chatApi;
