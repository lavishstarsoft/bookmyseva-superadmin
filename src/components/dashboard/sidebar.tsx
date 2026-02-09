"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Store,
    Bike,
    HandHeart,
    Settings,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    FileText,
    ShoppingBag,
    LayoutTemplate,
    UserCircle,
    PartyPopper,
    BookOpen,
    ScrollText,
    Tag,
    MessageSquare,
    Bot,
    BarChart3,
    Star,
    Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useSidebar } from "./sidebar-context";

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Commerce",
        isHeader: true,
    },
    {
        label: "Products & Pooja",
        icon: ShoppingBag,
        href: "/dashboard/products",
        color: "text-orange-700",
    },
    {
        label: "Vendors",
        icon: Store,
        href: "/dashboard/vendors",
        color: "text-blue-500",
    },
    {
        label: "Pujaris",
        icon: Users,
        href: "/dashboard/pujaris",
        color: "text-indigo-500",
    },
    {
        label: "Enquiries",
        isHeader: true,
    },
    {
        label: "Enquiries",
        icon: PartyPopper,
        href: "#",
        color: "text-rose-500",
        submenu: [
            {
                label: "Festival Bookings",
                href: "/dashboard/enquiries?type=festival",
                icon: PartyPopper
            },
            {
                label: "Panchangam Sevas",
                href: "/dashboard/enquiries?type=panchangam",
                icon: FileText
            }
        ]
    },
    {
        label: "Content & Settings",
        isHeader: true,
    },
    {
        label: "Site Management",
        icon: LayoutTemplate,
        href: "#",
        color: "text-emerald-500",
        submenu: [
            {
                label: "Global Settings", // Logo, Audio, Live
                href: "/dashboard/content/settings",
                icon: Settings
            },
            {
                label: "Banners & Sections",
                href: "/dashboard/content/banners",
                icon: LayoutTemplate
            },
            {
                label: "Blogs & News",
                href: "/dashboard/content/blogs",
                icon: FileText
            },
            {
                label: "About Us Content",
                href: "/dashboard/content/about",
                icon: FileText
            },
            {
                label: "Blog Categories",
                href: "/dashboard/content/categories",
                icon: Tag
            },
            {
                label: "Scrolling Mantras",
                href: "/dashboard/content/mantras",
                icon: ScrollText
            },
            {
                label: "Upcoming Festival",
                href: "/dashboard/content/festival",
                icon: PartyPopper
            },
            {
                label: "Daily Panchangam",
                href: "/dashboard/content/panchangam",
                icon: PartyPopper // Using same icon as festival or could import Sun
            },
            {
                label: "Reviews & Testimonials",
                href: "/dashboard/reviews",
                icon: Star
            },
            {
                label: "Gita Content",
                href: "/dashboard/content/gita",
                icon: BookOpen
            },
            {
                label: "Storage Manager",
                href: "/dashboard/storage",
                icon: Database
            }
        ]
    },
    {
        label: "Customer Support",
        isHeader: true,
    },
    {
        label: "Chat & Support",
        icon: MessageSquare,
        href: "#",
        color: "text-blue-500",
        submenu: [
            {
                label: "Live Conversations",
                href: "/dashboard/chat/conversations",
                icon: MessageSquare
            },
            {
                label: "Bot Configuration",
                href: "/dashboard/chat/bot-config",
                icon: Bot
            },
            {
                label: "Chat Analytics",
                href: "/dashboard/chat/analytics",
                icon: BarChart3
            }
        ]
    },
    {
        label: "Community",
        isHeader: true,
    },
    {
        label: "Website Users",
        icon: UserCircle,
        href: "/dashboard/users",
        color: "text-violet-500",
    },
    {
        label: "Volunteers",
        icon: HandHeart,
        href: "/dashboard/volunteers",
        color: "text-emerald-500",
    },
];

export function Sidebar({ isMobile = false, onClose }: { isMobile?: boolean, onClose?: () => void }) {
    const pathname = usePathname();
    const { isCollapsed: contextCollapsed, toggleSidebar } = useSidebar();
    const isCollapsed = isMobile ? false : contextCollapsed;
    const [logoUrl, setLogoUrl] = useState("");

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await api.get("/content/site-config");
                if (response.data?.content?.logoUrl) {
                    setLogoUrl(response.data.content.logoUrl);
                }
            } catch {
                // Failed to fetch logo - use default
            }
        };
        fetchLogo();
    }, []);

    return (
        <div className={cn("space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border", isMobile ? "w-full overflow-hidden" : "overflow-visible")}>
            {/* Header: Logo + Toggle */}
            <div className="px-3 py-2 relative shrink-0">
                <div className="flex items-center pl-3 mb-6 transition-all duration-300 min-h-[40px]">
                    <div className="relative w-8 h-8 mr-4 shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            /* Golden Logo Box */
                            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-full h-full rounded-lg shadow-inner border border-yellow-200" />
                        )}
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-2xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300">
                            BookMySeva
                        </h1>
                    )}
                </div>

                {/* Toggle Button - Hide on Mobile */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-[-12px] top-2 z-50 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-6 w-6 hidden md:flex"
                        onClick={toggleSidebar}
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </Button>
                )}
            </div>

            {/* Scrollable Routes Area */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#8D0303] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#700202] [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="space-y-1">
                    {routes.map((route, index) => {
                        return (
                            <SidebarItem
                                key={index}
                                route={route}
                                pathname={pathname}
                                isCollapsed={isCollapsed}
                                onClose={onClose}
                            />
                        )
                    })}
                </div>
            </div>
            <div className="px-3">
                <button
                    className={cn(
                        "text-sm group flex p-3 w-full font-medium cursor-pointer bg-[#8D0303] text-white hover:bg-[#700202] rounded-lg transition shadow-md",
                        isCollapsed ? "justify-center" : "justify-start"
                    )}
                    onClick={() => {
                        document.cookie = 'token=; Max-Age=0; path=/;';
                        window.location.href = '/login';
                    }}
                    title={isCollapsed ? "Logout" : ""}
                >
                    <div className={cn("flex items-center flex-1", isCollapsed ? "justify-center" : "")}>
                        <LogOut className={cn("h-5 w-5 shrink-0 text-white group-hover:text-white/90 transition-colors", isCollapsed ? "mr-0" : "mr-3")} />
                        {!isCollapsed && "Logout"}
                    </div>
                </button>
            </div>
        </div >
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
            </Button>
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#111827]">
                <Sidebar isMobile={true} onClose={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

function SidebarItem({ route, pathname, isCollapsed, onClose }: { route: any, pathname: string, isCollapsed: boolean, onClose?: () => void }) {
    const searchParams = useSearchParams();

    // Helper to check if a specific href is active
    const isActive = (href: string) => {
        if (!href || href === "#") return false;

        // If link has query params, we must match them
        if (href.includes("?")) {
            const [path, query] = href.split("?");
            if (pathname !== path) return false;

            // Check if all params in the link exist in the current URL
            const linkParams = new URLSearchParams(query);
            for (const [key, value] of linkParams.entries()) {
                if (searchParams.get(key) !== value) return false;
            }
            return true;
        }

        // Otherwise exact path match
        return pathname === href;
    };

    // Check if any child is active
    const isChildActive = route.submenu?.some((child: any) => isActive(child.href));
    const [isOpen, setIsOpen] = useState(isChildActive);

    // Auto-open/close based on navigation
    // If we navigate to a child, open it.
    // If we navigate AWAY (isChildActive becomes false), close it.
    useEffect(() => {
        if (isChildActive) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [pathname, isChildActive]);

    if (route.isHeader) {
        return !isCollapsed && (
            <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {route.label}
            </div>
        );
    }

    if (route.submenu) {
        return (
            <div className="space-y-1">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "text-sm group flex p-3 w-full font-medium rounded-lg transition overflow-hidden cursor-pointer select-none",
                        isCollapsed ? "justify-center" : "justify-start",
                        // Active State: Maroon Bg + White Text
                        isChildActive
                            ? "bg-[#8D0303] text-white shadow-md hover:bg-[#700202]"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                >
                    <div className={cn("flex items-center flex-1", isCollapsed ? "justify-center" : "")}>
                        {/* Icon Color: White if active, else route.color */}
                        {route.icon && <route.icon className={cn("h-5 w-5 shrink-0 transition-colors", isCollapsed ? "mr-0" : "mr-3", isChildActive ? "text-white" : route.color)} />}
                        {!isCollapsed && (
                            <>
                                <span className={cn("whitespace-nowrap flex-1", isChildActive ? "text-white" : "")}>{route.label}</span>
                                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-90" : "", isChildActive ? "text-white" : "")} />
                            </>
                        )}
                    </div>
                </div>
                {!isCollapsed && isOpen && (
                    <div className="pl-6 ml-3 space-y-1 animate-in slide-in-from-top-1 duration-200 relative">
                        {/* Continuous Vertical Line for the entire group */}
                        <div className="absolute left-[0px] top-0 bottom-3 w-[1px] bg-[#8D0303]/20" />

                        {route.submenu.map((subItem: any, index: number) => {
                            return (
                                <div key={subItem.href} className="relative">
                                    {/* Horizontal Branch Connector */}
                                    <div className="absolute left-[-24px] top-[18px] w-6 h-[1px] bg-[#8D0303]/20">
                                        {/* Corner Rounding/Dot effect (Optional - keeping simple for now) */}
                                    </div>

                                    <Link
                                        href={subItem.href || "#"}
                                        className={cn(
                                            "text-sm group flex px-3 py-2 w-full font-medium cursor-pointer hover:text-[#8D0303] hover:bg-[#8D0303]/5 rounded-md transition relative",
                                            isActive(subItem.href)
                                                ? "text-[#8D0303] font-bold"
                                                : "text-muted-foreground"
                                        )}
                                        onClick={() => { if (onClose) onClose(); }}
                                    >
                                        <div className="flex items-center">
                                            {subItem.icon && <subItem.icon className="h-4 w-4 mr-2 opacity-70" />}
                                            <span>{subItem.label}</span>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={route.href || "#"}
            className={cn(
                "text-sm group flex p-3 w-full font-medium cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition overflow-hidden border-b border-[#8D0303]/20 last:border-0",
                isCollapsed ? "justify-center" : "justify-start",
                pathname === route.href ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm" : "text-muted-foreground"
            )}
            title={isCollapsed ? route.label : ""}
            onClick={() => {
                if (onClose) onClose();
            }}
        >
            <div className={cn("flex items-center flex-1", isCollapsed ? "justify-center" : "")}>
                {route.icon && <route.icon className={cn("h-5 w-5 shrink-0 transition-colors", pathname === route.href ? "text-primary" : "text-muted-foreground group-hover:text-primary", isCollapsed ? "mr-0" : "mr-3", route.color)} />}
                {!isCollapsed && (
                    <span className="whitespace-nowrap transition-all duration-300 opacity-100">
                        {route.label}
                    </span>
                )}
            </div>
        </Link>
    );
}
