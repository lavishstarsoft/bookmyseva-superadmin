"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useState, useEffect } from "react"
import axios from "axios"

export function UserButton() {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const fetchUser = async () => {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            if (!token) return

            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (response.data.avatar) {
                    setAvatarUrl(response.data.avatar)
                }
            } catch (error: any) {
                console.error("Error fetching user for header:", error)
                if (error.response?.status === 401) {
                    document.cookie = 'token=';
                    window.location.href = '/login';
                }
            }
        }
        fetchUser()
    }, [])

    // Prevent hydration mismatch by not rendering dropdown until mounted
    if (!mounted) {
        return (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>SC</AvatarFallback>
                </Avatar>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || ""} alt="@admin" className="object-cover" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Super Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            admin@bookmyseva.com
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                    document.cookie = 'token=; Max-Age=0; path=/;';
                    window.location.reload();
                }}>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
