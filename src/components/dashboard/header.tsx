"use client";

import { MobileSidebar } from "@/components/dashboard/sidebar";
import { UserButton } from "@/components/dashboard/user-button";
import { Search, Bell, PartyPopper } from "lucide-react";
import { useSocket } from "@/providers/socket-provider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export function Header() {
    const { unreadCount, latestEnquiries, markAsRead, clearNotifications } = useSocket();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    // Prevent hydration mismatch by only rendering dropdowns after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleNotificationClick = (enquiry: any) => {
        markAsRead();
        router.push(`/dashboard/enquiries`);
    };

    const handleViewAllClick = () => {
        markAsRead();
        router.push('/dashboard/enquiries');
    };

    return (
        <div className="flex items-center p-4 border-b h-16 bg-white dark:bg-black">
            <MobileSidebar />
            <div className="hidden md:flex items-center ml-4 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 w-96">
                <Search className="w-4 h-4 text-zinc-500 mr-2" />
                <input
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500 dark:text-zinc-200"
                    placeholder="Search riders, vendors, orders..."
                />
            </div>

            <div className="ml-auto flex items-center gap-x-4">
                {mounted && <ModeToggle />}

                {/* Notification Bell */}
                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition relative" onClick={markAsRead}>
                                <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8D0303] text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                                {latestEnquiries.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearNotifications();
                                        }}
                                        className="text-[10px] text-muted-foreground hover:text-[#8D0303] font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {latestEnquiries.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            ) : (
                                latestEnquiries.map((enquiry, i) => (
                                    <DropdownMenuItem
                                        key={i}
                                        className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-[#8D0303] focus:text-white group"
                                        onClick={() => handleNotificationClick(enquiry)}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="font-semibold text-[#8D0303] group-focus:text-white flex items-center gap-2">
                                                <PartyPopper className="h-3 w-3" />
                                                {enquiry.festivalName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground group-focus:text-white/80">
                                                Just now
                                            </span>
                                        </div>
                                        <p className="text-sm group-focus:text-white/90">
                                            <span className="font-medium">{enquiry.userDetails?.name || 'Guest'}</span> sent a booking request.
                                        </p>
                                    </DropdownMenuItem>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="justify-center text-[#8D0303] font-medium cursor-pointer"
                                onClick={handleViewAllClick}
                            >
                                View All Enquiries
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition relative">
                        <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                    </button>
                )}

                <UserButton />
            </div>
        </div>
    );
}
