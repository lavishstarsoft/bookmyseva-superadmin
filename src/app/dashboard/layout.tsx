"use client";

import { Header } from "@/components/dashboard/header";
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="h-full relative">
            <div className={cn(
                "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] transition-all duration-300",
                isCollapsed ? "md:w-[80px]" : "md:w-64"
            )}>
                <Sidebar />
            </div>
            <main className={cn(
                "h-full transition-all duration-300",
                isCollapsed ? "md:pl-[80px]" : "md:pl-64"
            )}>
                <Header />
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
