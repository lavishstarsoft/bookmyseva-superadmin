"use client";

import { Suspense } from "react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SocketProvider } from "@/providers/socket-provider";
import { usePathname } from "next/navigation";

export default function DashboardClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const isChatConversations = pathname?.includes("/chat/conversations");
    const isChatPage = pathname?.includes("/chat");
    const isReviewsPage = pathname?.includes("/reviews");

    return (
        <SocketProvider>
            <div className="h-full relative">
                <div
                    className={cn(
                        "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-gray-900 transition-all duration-300",
                        isCollapsed ? "md:w-20" : "md:w-64"
                    )}
                >
                    <Suspense fallback={<div className="bg-gray-900 h-full w-full" />}>
                        <Sidebar />
                    </Suspense>
                </div>
                <main
                    className={cn(
                        "transition-all duration-300",
                        isCollapsed ? "md:pl-20" : "md:pl-64"
                    )}
                >
                    <SidebarTriggerWrapper />
                    <div className={cn(
                        "h-[calc(100vh-64px)]", // Fixed height available for content
                        isChatConversations
                            ? "p-0 overflow-hidden"
                            : (isChatPage || isReviewsPage)
                                ? "p-0 overflow-y-auto"
                                : "px-2 py-4 md:p-8 overflow-y-auto"
                    )}>
                        {children}
                    </div>
                </main>
            </div >
        </SocketProvider>
    );
}

// Wrapper for Header to keep structure clean in this file, or we can just import Header
// But Header is already separate. Let's reuse it.
// Actually, header needs to be inside the main block.
function SidebarTriggerWrapper() {
    return <Header />
}
