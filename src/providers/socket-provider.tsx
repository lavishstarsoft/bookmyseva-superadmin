"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/axios";
import api from "@/lib/axios";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    notifications: AdminNotification[];
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotifications: () => void;
};

interface AdminNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    notifications: [],
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    clearNotifications: () => {},
});

export const useSocket = () => {
    return useContext(SocketContext);
};

// Helper to get token from cookie
const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);

    const fetchInitialNotifications = useCallback(async () => {
        try {
            const res = await api.get('/admin/notifications', { params: { page: 1, limit: 10 } });
            setNotifications(res.data?.notifications || []);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch {
            // Silent fail: dropdown will still work for realtime events.
        }
    }, []);

    // Initialize audio on first user interaction
    useEffect(() => {
        audioRef.current = new Audio("/superadmin/sounds/notification.mp3");
        audioRef.current.preload = "auto";

        const unlockAudio = () => {
            if (audioRef.current && !audioUnlockedRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    audioUnlockedRef.current = true;
                }).catch(() => {
                    // Silent catch - will retry on next interaction
                });
            }
        };

        const events = ["click", "keydown", "touchstart"];
        events.forEach(event => document.addEventListener(event, unlockAudio, { once: true }));

        return () => {
            events.forEach(event => document.removeEventListener(event, unlockAudio));
        };
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
                console.error("Error playing notification sound:", err);
            });
        }
    }, []);

    // Socket connection with authentication
    useEffect(() => {
        const token = getTokenFromCookie();
        
        // Don't connect if no token
        if (!token) {
            return;
        }

        const socketInstance = ClientIO(getBaseUrl(), {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            auth: {
                token, // Send token for authentication
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            if (error.message === "Authentication error") {
                // Token invalid - clear and redirect
                document.cookie = 'token=; Max-Age=0; path=/;';
            }
            setIsConnected(false);
        });

        socketInstance.on("notification:new", (data: AdminNotification) => {
            playNotificationSound();

            toast(`🔔 ${data.title}`, {
                description: data.message,
            });

            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [data, ...prev].slice(0, 10));
        });

        socketInstance.on("notification:unread_count", (data: { unreadCount: number }) => {
            setUnreadCount(data.unreadCount || 0);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [playNotificationSound]);

    useEffect(() => {
        fetchInitialNotifications();
    }, [fetchInitialNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/admin/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // no-op
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.patch('/admin/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // no-op
        }
    }, []);

    const clearNotifications = useCallback(() => {
        api.delete('/admin/notifications/clear').catch(() => {});
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                unreadCount,
                notifications,
                markAsRead,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
