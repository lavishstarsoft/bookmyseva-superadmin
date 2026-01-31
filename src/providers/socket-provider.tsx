"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/axios";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    latestEnquiries: EnquiryNotification[];
    markAsRead: () => void;
    clearNotifications: () => void;
};

interface EnquiryNotification {
    _id: string;
    festivalName: string;
    userDetails?: {
        name: string;
        email?: string;
        phone?: string;
    };
    createdAt: string;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    latestEnquiries: [],
    markAsRead: () => {},
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
    const [latestEnquiries, setLatestEnquiries] = useState<EnquiryNotification[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);

    // Initialize audio on first user interaction
    useEffect(() => {
        audioRef.current = new Audio("/sounds/notification.mp3");
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
        if (audioRef.current && audioUnlockedRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Audio play failed - user interaction required
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

        // Listen for new enquiries
        socketInstance.on("new_enquiry", (data: EnquiryNotification) => {
            playNotificationSound();

            toast("🔔 New Booking Received!", {
                description: `${data.userDetails?.name || 'Guest'} booked ${data.festivalName}`,
                action: {
                    label: "View",
                    onClick: () => {
                        window.location.href = "/dashboard/enquiries";
                    },
                },
            });

            setUnreadCount((prev) => prev + 1);
            setLatestEnquiries((prev) => [data, ...prev].slice(0, 5));
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [playNotificationSound]);

    const markAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const clearNotifications = useCallback(() => {
        setLatestEnquiries([]);
        setUnreadCount(0);
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                unreadCount,
                latestEnquiries,
                markAsRead,
                clearNotifications,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
