"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { format } from "date-fns"
import { Laptop, Smartphone, Monitor } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LoginEntry {
    _id: string
    ip: string
    browser: string
    os: string
    device: string
    timestamp: string
}

export function LoginHistory() {
    const [history, setHistory] = useState<LoginEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            if (!token) return

            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/login-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                setHistory(response.data)
            } catch (error) {
                console.error("Failed to fetch login history", error)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [])

    const getDeviceIcon = (device: string) => {
        if (device.toLowerCase().includes("mobile")) return <Smartphone className="h-4 w-4" />
        return <Laptop className="h-4 w-4" />
    }

    return (
        <Card className="border shadow-md bg-card">
            <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>
                    Recent login activity for your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Browser</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Loading history...
                                    </TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No login history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                                {getDeviceIcon(entry.device)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {entry.os}
                                            <div className="text-xs text-muted-foreground hidden sm:block">
                                                {entry.device}
                                            </div>
                                        </TableCell>
                                        <TableCell>{entry.browser}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {entry.ip}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
