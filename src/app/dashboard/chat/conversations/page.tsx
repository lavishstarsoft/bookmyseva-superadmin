"use client"

import { useState, useEffect, useRef } from "react"
import api from "@/lib/axios"
import { io, Socket } from "socket.io-client"
import {
    MessageSquare,
    Send,
    Bell,
    Volume2,
    User,
    Bot,
    Shield,
    Search,
    MoreVertical,
    Phone,
    Video,
    CheckCheck,
    Clock,
    AlertCircle,
    Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Message {
    _id: string;
    sessionId: string;
    sender: 'user' | 'bot' | 'admin';
    message: string;
    isRead: boolean;
    isDeleted?: boolean;
    createdAt: string;
}

interface Session {
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
    lastMessage?: string; // Hypothetical field for preview
}

export default function LiveConversationsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [replyMessage, setReplyMessage] = useState("")
    const [unreadNotifications, setUnreadNotifications] = useState<{ [key: string]: number }>({})
    const [searchQuery, setSearchQuery] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    // Ref for selectedSession to access in socket callbacks without re-triggering effect
    const selectedSessionRef = useRef<string | null>(null)

    // Keep ref in sync with state
    useEffect(() => {
        selectedSessionRef.current = selectedSession
    }, [selectedSession])

    // Unlock AudioContext on first user interaction
    useEffect(() => {
        const unlockAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            // Remove listener once unlocked
            console.log("Audio Context Unlocked");
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio); // Also unlock on keyboard press

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        }
    }, [])

    // Initialize Socket.io
    useEffect(() => {
        const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
            path: "/socket.io",
            auth: { token }
        })
        setSocket(newSocket)

        newSocket.on("connect", () => {
            console.log("Admin connected to chat server")
        })

        // Listen for new messages from users
        newSocket.on("admin_new_message", (data) => {
            console.log("New message from user:", data)

            // Play notification sound
            playNotificationSound()

            // Update unread count
            setUnreadNotifications(prev => ({
                ...prev,
                [data.sessionId]: (prev[data.sessionId] || 0) + 1
            }))

            // Update sessions list
            setSessions(prev => {
                const exists = prev.find(s => s._id === data.sessionId)
                if (exists) {
                    return prev.map(s =>
                        s._id === data.sessionId
                            ? {
                                ...s,
                                lastActivity: new Date().toISOString(),
                                unreadCount: (s.unreadCount || 0) + 1,
                                lastMessage: data.message.message
                            }
                            : s
                    )
                } else {
                    return [data.session, ...prev]
                }
            })

            // If this session is currently selected, add message
            if (selectedSession === data.sessionId) {
                setMessages(prev => [...prev, data.message])
            }

            // Show browser notification
            showBrowserNotification(data.message.message)
        })

        // Listen for messages in joined session
        newSocket.on("message", (msg: Message) => {
            if (selectedSession === msg.sessionId) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.find(m => m._id === msg._id)) return prev
                    return [...prev, msg]
                })
            }
        })

        newSocket.on("admin_message_sent", (msg: Message) => {
            setMessages(prev => [...prev, msg])
        })
        newSocket.on("message_deleted", ({ messageId }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, isDeleted: true, message: "🚫 This message was deleted" }
                    : msg
            ))
        })


        return () => {
            newSocket.disconnect()
        }
    }, [selectedSession])

    // Fetch initial sessions
    useEffect(() => {
        fetchSessions()
    }, [])

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission()
        }
    }, [])

    const fetchSessions = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const res = await api.get(`/chat/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setSessions(res.data?.data || res.data || [])
        } catch (error) {
            console.error(error)
            setSessions([])
        } finally {
            setLoading(false)
        }
    }

    const playNotificationSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;

            // Ensure context is running (might be suspended if no interaction yet, but we try)
            if (ctx.state === 'suspended') {
                ctx.resume().catch(e => console.error("Could not resume audio context:", e));
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }

    const showBrowserNotification = (message: string) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New Chat Message", {
                body: message.substring(0, 100),
                icon: "/favicon.ico"
            })
        }
    }

    const selectSession = async (sessionId: string) => {
        setSelectedSession(sessionId)

        // Clear unread for this session
        setUnreadNotifications(prev => ({ ...prev, [sessionId]: 0 }))
        setSessions(prev => prev.map(s =>
            s._id === sessionId ? { ...s, unreadCount: 0 } : s
        ))

        socket?.emit("admin_join_session", sessionId)

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const res = await api.get(`/chat/history/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setMessages(res.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch messages:", error)
        }
    }

    const sendReply = () => {
        if (!replyMessage.trim() || !socket || !selectedSession) return

        socket.emit("admin_reply", {
            sessionId: selectedSession,
            message: replyMessage
        })

        setReplyMessage("")
    }

    const deleteMessage = (messageId: string) => {
        if (!socket || !selectedSession) return

        socket.emit("delete_message", {
            messageId,
            sessionId: selectedSession
        })
    }

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the session when clicking delete
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        console.log("Deleting session:", sessionId);

        // Optimistic UI update: Remove immediately
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        if (selectedSession === sessionId) {
            setSelectedSession(null);
            setMessages([]);
        }

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await api.delete(`/chat/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        } catch (error) {
            console.error("Failed to delete session:", error)
            // Revert on failure (optional but good practice)
            fetchSessions()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendReply();
        }
    }

    const filteredSessions = sessions.filter(s =>
        s.socketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userId?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalUnread = Object.values(unreadNotifications).reduce((a, b) => a + b, 0)

    // Get currently selected session full object
    const currentSession = sessions.find(s => s.socketId === selectedSession);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D0303]"></div>
        </div>
    )

    return (
        <div className="h-full flex gap-4 bg-gray-50/50 p-4">
            {/* Sidebar - Sessions List */}
            <Card className="w-80 md:w-96 flex flex-col h-full border-none shadow-md overflow-hidden bg-white">
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Messages
                            {totalUnread > 0 && (
                                <Badge variant="destructive" className="h-5 px-1.5 min-w-[1.25rem] rounded-full">
                                    {totalUnread}
                                </Badge>
                            )}
                        </h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-[#8D0303]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-2 py-2 space-y-1">
                        {filteredSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">No conversations found</p>
                            </div>
                        ) : (
                            filteredSessions.map(session => {
                                const isSelected = selectedSession === session._id;
                                const unread = session.unreadCount || unreadNotifications[session._id] || 0;

                                return (
                                    <div
                                        key={session._id}
                                        onClick={() => selectSession(session._id)}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-100",
                                            isSelected && "bg-[#8D0303]/5 hover:bg-[#8D0303]/10"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-10 w-10 border border-gray-100">
                                                <AvatarFallback className={cn(
                                                    "text-sm font-medium",
                                                    isSelected ? "bg-[#8D0303] text-white" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    {session.userId ? session.userId.substring(0, 2).toUpperCase() : (session.guestDetails?.name ? session.guestDetails.name.substring(0, 2).toUpperCase() : 'GS')}
                                                </AvatarFallback>
                                            </Avatar>
                                            {session.isActive && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white bg-green-500 rounded-full" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 overflow-hidden group/item">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={cn(
                                                    "font-semibold text-sm truncate",
                                                    isSelected ? "text-[#8D0303]" : "text-gray-900"
                                                )}>
                                                    {session.userId || (session.guestDetails?.name ? `${session.guestDetails.name}` : `Guest-${session.socketId.substring(0, 4)}`)}
                                                </p>
                                                <span className="text-[10px] text-gray-400 shrink-0 group-hover/item:hidden">
                                                    {new Date(session.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="hidden group-hover/item:block">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={(e) => deleteSession(session._id, e)}
                                                        title="Delete Conversation"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-500 truncate pr-2">
                                                    {session.lastMessage || (session.isActive ? "Active now" : "Offline")}
                                                </p>
                                                <div className="flex gap-1">
                                                    {session.escalated && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-red-200 text-red-600 bg-red-50">
                                                            Escalated
                                                        </Badge>
                                                    )}
                                                    {unread > 0 && (
                                                        <Badge className="h-4 min-w-[1rem] px-1 rounded-full bg-[#8D0303] text-[10px] flex items-center justify-center">
                                                            {unread}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col h-full border-none shadow-md overflow-hidden bg-white">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                    <AvatarFallback className="bg-[#8D0303]/10 text-[#8D0303]">
                                        {currentSession?.userId ? currentSession.userId.substring(0, 2).toUpperCase() : (currentSession?.guestDetails?.name ? currentSession.guestDetails.name.substring(0, 2).toUpperCase() : 'GS')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                        {currentSession?.userId || (currentSession?.guestDetails?.name || `Guest User`)}
                                        <Badge variant="outline" className="text-[10px] font-normal text-gray-500 border-gray-200">
                                            {selectedSession.slice(0, 8)}
                                        </Badge>
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            currentSession?.isActive ? "bg-green-500" : "bg-gray-300"
                                        )} />
                                        <p className="text-xs text-muted-foreground">
                                            {currentSession?.isActive ? 'Online' : `Last seen ${new Date(currentSession?.lastActivity || "").toLocaleTimeString()}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#8D0303] hover:bg-[#8D0303]/5">
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#8D0303] hover:bg-[#8D0303]/5">
                                    <Video className="h-4 w-4" />
                                </Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">Ban User</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">End Session</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 bg-[#FDFBF7]">
                            {/* #FDFBF7 is a warm background color often associated with Seva/Spiritual themes or just clean UI */}
                            <div className="p-6 space-y-6">
                                {/* Date Divider Example */}
                                <div className="flex items-center justify-center">
                                    <div className="bg-gray-200/50 text-gray-500 text-[10px] px-3 py-1 rounded-full font-medium">
                                        Today
                                    </div>
                                </div>

                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    const isBot = msg.sender === 'bot';
                                    const isUser = msg.sender === 'user';

                                    return (
                                        <div
                                            key={msg._id || idx}
                                            className={cn(
                                                "flex w-full gap-2",
                                                isAdmin ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {!isAdmin && (
                                                <Avatar className="h-8 w-8 mt-1 border border-white shadow-sm shrink-0">
                                                    {isBot ? (
                                                        <AvatarFallback className="bg-blue-100 text-blue-600"><Bot className="h-4 w-4" /></AvatarFallback>
                                                    ) : (
                                                        <AvatarFallback className="bg-gray-100 text-gray-600"><User className="h-4 w-4" /></AvatarFallback>
                                                    )}
                                                </Avatar>
                                            )}

                                            <div className={cn(
                                                "flex flex-col max-w-[70%]",
                                                isAdmin ? "items-end" : "items-start"
                                            )}>
                                                {/* Sender Name (Optional, good for Bot) */}
                                                {isBot && <span className="text-[10px] text-gray-400 mb-1 ml-1">AI Assistant</span>}

                                                <div className={cn(
                                                    "px-4 py-2.5 shadow-sm text-sm relative group",
                                                    isAdmin
                                                        ? "bg-[#8D0303] text-white rounded-2xl rounded-tr-sm"
                                                        : isBot
                                                            ? "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                                                            : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm",
                                                    msg.isDeleted && "opacity-60 italic bg-gray-50 border-gray-200 text-gray-500"
                                                )}>
                                                    {msg.isDeleted ? (
                                                        <span className="flex items-center gap-2">
                                                            <AlertCircle className="h-3 w-3" />
                                                            This message was deleted
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                            {!msg.isDeleted && (
                                                                <div className={cn(
                                                                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                                                    isAdmin ? "-left-10" : "-right-10"
                                                                )}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full bg-white shadow-sm border border-gray-100"
                                                                        onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }}
                                                                        title="Delete message"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Message Metadata */}
                                                    {!msg.isDeleted && (
                                                        <div className={cn(
                                                            "text-[10px] mt-1 flex items-center justify-end gap-1 opacity-70",
                                                            isAdmin ? "text-white/80" : "text-gray-400"
                                                        )}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isAdmin && (
                                                                <CheckCheck className="h-3 w-3" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <Avatar className="h-8 w-8 mt-1 border border-white shadow-sm shrink-0">
                                                    <AvatarFallback className="bg-[#8D0303] text-white">
                                                        <Shield className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t mt-auto">
                            <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-[#8D0303]/30 focus-within:ring-4 focus-within:ring-[#8D0303]/5 transition-all">
                                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-gray-400 hover:text-gray-600 rounded-full">
                                    <Bot className="h-5 w-5" />
                                </Button>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 text-sm"
                                    rows={1}
                                    style={{ minHeight: '40px' }}
                                />
                                <div className="flex gap-1 shrink-0 pb-1">
                                    <Button
                                        onClick={sendReply}
                                        size="icon"
                                        disabled={!replyMessage.trim()}
                                        className={cn(
                                            "h-9 w-9 rounded-full transition-all",
                                            replyMessage.trim()
                                                ? "bg-[#8D0303] hover:bg-[#7a0303] text-white shadow-md hover:shadow-lg"
                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="h-4 w-4 ml-0.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">
                                    Press <kbd className="font-sans px-1 py-0.5 bg-gray-100 border rounded text-xs mx-0.5">Enter</kbd> to send
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-6 animate-pulse">
                            <MessageSquare className="h-12 w-12 text-[#8D0303]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Select a Conversation</h3>
                        <p className="text-gray-500 max-w-sm mt-2 mb-8">
                            Choose a conversation from the sidebar to view messages and respond to users.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm">
                                <span className="block w-2 h-2 bg-green-500 rounded-full" />
                                Online Users
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm">
                                <Clock className="h-4 w-4 text-[#8D0303]" />
                                Recent Chats
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
