"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, StatusPieChart, TopProductsChart } from "@/components/dashboard/analytics-charts";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { Users, CreditCard, Activity, DollarSign, Store, Calendar, Filter } from "lucide-react";
import api from "@/lib/axios";
import { useSocket } from "@/providers/socket-provider";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { socket } = useSocket();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week', 'today'
    const [stats, setStats] = useState({
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        totalUsers: 0,
        usersGrowth: 0,
        activeVendors: 0,
        newVendorsThisWeek: 0,
        chartData: [],
        pieChartData: [],
        topProductsData: [],
        recentOrders: []
    });

    // Fetch initial data
    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/dashboard/stats?range=${timeRange}`);
            setStats(res.data.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        // Listen for new orders
        const handleNewOrder = (data: any) => {
            fetchStats(); 
        };

        const handleNewVendor = () => {
            fetchStats();
            toast.info("New vendor registered.");
        };
        
        const handleNewUser = () => {
            // For range filter, a simple increment might not be accurate if the new user is outside range (unlikely)
            // But usually safer to re-fetch or just increment if range is 'all' or 'today' or 'month'
            fetchStats();
        };

        socket.on("order:new", handleNewOrder);
        socket.on("kitOrder:created", handleNewOrder);
        socket.on("vendor:new", handleNewVendor);
        socket.on("user:register", handleNewUser);

        return () => {
            socket.off("order:new", handleNewOrder);
            socket.off("kitOrder:created", handleNewOrder);
            socket.off("vendor:new", handleNewVendor);
            socket.off("user:register", handleNewUser);
        };
    }, [socket, timeRange]);

    // Helper to get descriptive text for comparison
    const getComparisonText = () => {
        switch(timeRange) {
            case 'month': return 'vs last month';
            case 'week': return 'vs last week';
            case 'today': return 'vs yesterday';
            default: return 'vs prev 30 days'; // Fallback for All Time
        }
    };

    if (loading && !stats.totalRevenue) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard data...</div>;
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Tabs defaultValue="all" value={timeRange} onValueChange={setTimeRange} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All Time</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="today">Today</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1 ml-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                        Live
                    </span>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-emerald-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">₹{stats.totalRevenue?.toLocaleString()}</div>
                        <p className="text-xs text-emerald-700 font-medium h-4">
                            {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth?.toFixed(1)}% {getComparisonText()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900">{stats.totalUsers?.toLocaleString()}</div>
                        <p className="text-xs text-indigo-700 font-medium h-4">
                            {stats.usersGrowth > 0 ? '+' : ''}{stats.usersGrowth?.toFixed(1)}% {getComparisonText()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-l-4 border-l-blue-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalOrders?.toLocaleString()}</div>
                        <p className="text-xs text-blue-700 font-medium h-4">
                           {stats.ordersGrowth > 0 ? '+' : ''}{stats.ordersGrowth?.toFixed(1)}% {getComparisonText()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-l-orange-600 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Vendors
                        </CardTitle>
                        <Store className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">{stats.activeVendors?.toLocaleString()}</div>
                        <p className="text-xs text-orange-700 font-medium h-4">
                            {stats.newVendorsThisWeek > 0 ? '+' : ''}{stats.newVendorsThisWeek} new this week
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full lg:col-span-2 shadow-sm border bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            Revenue Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart data={stats.chartData} />
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm border bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            Top Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <TopProductsChart data={stats.topProductsData} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full lg:col-span-1 shadow-sm border bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-xl">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusPieChart data={stats.pieChartData} />
                    </CardContent>
                </Card>    

                <Card className="col-span-full lg:col-span-2 shadow-sm border bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentSales orders={stats.recentOrders} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
