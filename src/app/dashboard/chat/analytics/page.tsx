"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { MessageSquare, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopIntent {
    intent: string
    matchCount: number
}

interface TopAction {
    icon: string
    title: string
    clickCount: number
}

interface ChatAnalytics {
    totalSessions: number
    activeSessions: number
    escalationRate: number
    avgMessagesPerSession: number
    topIntents: TopIntent[]
    topActions: TopAction[]
}

export default function ChatAnalyticsPage() {
    const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setAnalytics(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-3xl font-bold text-[#8D0303]">Chat Analytics</h2>
                <p className="text-muted-foreground">Monitor chat performance and insights</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalSessions || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.activeSessions || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.escalationRate || 0}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Messages/Session</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.avgMessagesPerSession || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Intents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics?.topIntents?.map((intent: TopIntent, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span>{intent.intent}</span>
                                    <span className="font-bold">{intent.matchCount}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics?.topActions?.map((action: TopAction, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span>{action.icon} {action.title}</span>
                                    <span className="font-bold">{action.clickCount}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
