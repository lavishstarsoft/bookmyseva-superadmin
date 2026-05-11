import api from "@/lib/axios";

export interface AdminNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
    updatedAt?: string;
}

export const notificationsApi = {
    getAll: async (params?: { status?: 'all' | 'read' | 'unread'; page?: number; limit?: number }) => {
        const res = await api.get<{
            status: string;
            notifications: AdminNotification[];
            unreadCount: number;
            pagination: { total: number; page: number; limit: number; pages: number };
        }>("/admin/notifications", { params });
        return res.data;
    },

    markAsRead: async (id: string) => {
        const res = await api.patch(`/admin/notifications/${id}/read`);
        return res.data;
    },

    markAllAsRead: async () => {
        const res = await api.patch("/admin/notifications/read-all");
        return res.data;
    },

    clearAll: async () => {
        const res = await api.delete("/admin/notifications/clear");
        return res.data;
    },
    sendBroadcast: async (data: { title: string; message: string; targetRole?: string }) => {
        const res = await api.post("/admin/notifications/send-broadcast", data);
        return res.data;
    }
};
