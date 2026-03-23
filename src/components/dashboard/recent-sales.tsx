import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface RecentSalesProps {
    orders?: any[];
}

export function RecentSales({ orders = [] }: RecentSalesProps) {
    if (orders.length === 0) {
        return <div className="text-sm text-muted-foreground p-4 text-center">No recent orders</div>
    }

    // Helper for status badge colors
    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || 'pending';
        switch (s) {
            case 'delivered': return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
            case 'shipped': return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
            case 'packed': return 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200';
            case 'accepted': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
            case 'cancelled': 
            case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200';
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[100px]">Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order: any, i: number) => (
                        <TableRow key={order._id || i}>
                            <TableCell className="font-mono text-xs font-medium">
                                {order.orderId}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 hidden sm:flex">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {order.user?.name ? order.user.name.substring(0, 2).toUpperCase() : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{order.user?.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate" title={order.kit?.title}>
                                {order.kit?.title}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`capitalize font-normal border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                                +₹{order.totalAmount?.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
