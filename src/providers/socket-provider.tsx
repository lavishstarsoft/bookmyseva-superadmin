"use strict";
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io as ClientIO } from "socket.io-client";
import { toast } from "sonner";

type SocketContextType = {
    socket: any | null;
    isConnected: boolean;
    unreadCount: number;
    latestEnquiries: any[];
    markAsRead: () => void;
    clearNotifications: () => void;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    latestEnquiries: [],
    markAsRead: () => { },
    clearNotifications: () => { },
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<any | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestEnquiries, setLatestEnquiries] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);

    // Initialize audio and unlock on first user interaction
    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio("/sounds/notification.mp3");
        audioRef.current.preload = "auto";

        // Function to unlock audio on user interaction
        const unlockAudio = () => {
            if (audioRef.current && !audioUnlockedRef.current) {
                // Play and immediately pause to unlock
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    audioUnlockedRef.current = true;
                    console.log("🔊 Audio unlocked for notifications");
                }).catch(() => {
                    // Silent catch - will try again on next interaction
                });
            }
        };

        // Add listeners for user interaction
        document.addEventListener("click", unlockAudio, { once: false });
        document.addEventListener("keydown", unlockAudio, { once: false });
        document.addEventListener("touchstart", unlockAudio, { once: false });

        return () => {
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
            document.removeEventListener("touchstart", unlockAudio);
        };
    }, []);

    // Function to play notification sound
    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.log("Audio play failed - user interaction required first");
            });
        }
    };

    useEffect(() => {
        // Connect to Backend URL
        const socketInstance = ClientIO(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
            path: "/api/socket.io",
            transports: ["websocket"], // Force websocket
        });

        socketInstance.on("connect", () => {
            console.log("Socket Connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket Disconnected");
            setIsConnected(false);
        });

        // Listen for New Enquiry
        socketInstance.on("new_enquiry", (data: any) => {
            console.log("New Enquiry Received:", data);

            // Play Sound
            playNotificationSound();

            // Show Toast
            toast("🔔 New Booking Received!", {
                description: `${data.userDetails?.name || 'Guest'} booked ${data.festivalName}`,
                action: {
                    label: "View",
                    onClick: () => window.location.href = "/dashboard/enquiries",
                },
            });

            // Update State
            setUnreadCount((prev) => prev + 1);
            setLatestEnquiries((prev) => [data, ...prev].slice(0, 5)); // Keep last 5
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const markAsRead = () => {
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setLatestEnquiries([]);
        setUnreadCount(0);
    };

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
