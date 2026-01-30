"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Trash2, File, Image as ImageIcon, Music, Video, RefreshCw, CheckCircle, XCircle, Search, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from "recharts"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StorageFile {
    key: string
    url: string
    size: number
    lastModified: string
    type: 'image' | 'video' | 'audio' | 'other'
    isUsed: boolean
}

interface StorageStats {
    image: { count: number, size: number }
    video: { count: number, size: number }
    audio: { count: number, size: number }
    other: { count: number, size: number }
    totalSize: number
    totalCount: number
    operations?: { classAOps: number, classBOps: number }
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function StoragePage() {
    const [files, setFiles] = useState<StorageFile[]>([])
    const [stats, setStats] = useState<StorageStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'unused'>('all')
    const [analytics, setAnalytics] = useState<{ classAOps: number, classBOps: number } | null>(null)

    // Bulk operations & search
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date')

    useEffect(() => {
        fetchStorageData()
        fetchAnalytics()
    }, [])

    const fetchStorageData = async () => {
        try {
            setLoading(true)
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/storage/files`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFiles(response.data.files)
            setStats(response.data.stats)
        } catch (error) {
            console.error("Failed to fetch storage:", error)
            toast.error("Failed to load storage data")
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/storage/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setAnalytics(response.data)
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
            // Don't show error toast, analytics is optional
        }
    }

    const handleDelete = async (key: string) => {
        if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/storage/file?key=${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("File deleted successfully")
            // Optimistic update
            const deletedFile = files.find(f => f.key === key)
            setFiles(files.filter(f => f.key !== key))
            if (deletedFile && stats) {
                // simple stats update refetch is safer usually, but easy enough
                fetchStorageData()
            }
        } catch (error) {
            console.error("Delete Error:", error)
            toast.error("Failed to delete file")
        }
    }

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files? This cannot be undone.`)) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            let deleted = 0
            for (const key of selectedFiles) {
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/storage/file?key=${encodeURIComponent(key)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                deleted++
            }
            toast.success(`${deleted} files deleted successfully`)
            setSelectedFiles(new Set())
            fetchStorageData()
            fetchAnalytics()
        } catch (error) {
            console.error("Bulk Delete Error:", error)
            toast.error("Failed to delete some files")
        }
    }

    // Toggle selection
    const toggleSelect = (key: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Select all visible files
    const selectAll = () => {
        const visible = getFilteredAndSortedFiles()
        if (selectedFiles.size === visible.length) {
            setSelectedFiles(new Set())
        } else {
            setSelectedFiles(new Set(visible.map(f => f.key)))
        }
    }

    // Enhanced filtering + sorting
    const getFilteredAndSortedFiles = () => {
        let result = files.filter(f => {
            // Type filter
            if (filter !== 'all') {
                if (filter === 'unused' && f.isUsed) return false
                if (filter !== 'unused' && f.type !== filter) return false
            }
            // Search filter
            if (searchQuery && !f.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
            return true
        })

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'name') return a.key.localeCompare(b.key)
            if (sortBy === 'size') return b.size - a.size
            if (sortBy === 'date') return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            return 0
        })

        return result
    }

    const filteredFiles = getFilteredAndSortedFiles()

    const TOTAL_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB

    const chartData = stats ? [
        { name: 'Images', value: stats.image.size, color: '#0088FE' },
        { name: 'Videos', value: stats.video.size, color: '#00C49F' },
        { name: 'Audio', value: stats.audio.size, color: '#FFBB28' },
        { name: 'Other', value: stats.other.size, color: '#FF8042' },
        {
            name: 'Free Space',
            value: Math.max(0, TOTAL_LIMIT - stats.totalSize),
            color: '#d1fae5' // green-100/200ish
        }
    ].filter(d => d.value > 0) : []

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

    if (loading && !stats) {
        return <div className="p-8 text-center text-muted-foreground">Loading storage data...</div>
    }

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cloudflare R2 Storage</h1>
                    <p className="text-muted-foreground">Manage your uploaded assets efficiently</p>
                </div>
                <Button variant="outline" onClick={fetchStorageData} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Storage Overview</CardTitle>
                        <CardDescription>R2 Bucket Usage</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[250px] flex flex-col md:flex-row items-center gap-4">
                        {/* Chart */}
                        <div className="w-full md:w-1/2 h-[250px] relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
                                                const RADIAN = Math.PI / 180;
                                                const safeMidAngle = midAngle || 0;
                                                const safePercent = percent || 0;
                                                const entry = payload;

                                                // Don't show label for small slices (< 5%) to prevent overlap
                                                if (safePercent < 0.05) return null;

                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-safeMidAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-safeMidAngle * RADIAN);

                                                const isFreeSpace = entry.name === 'Free Space';
                                                return (
                                                    <text x={x} y={y} fill={isFreeSpace ? '#022c22' : 'white'} textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                                        {`${(safePercent * 100).toFixed(1)}%`}
                                                    </text>
                                                );
                                            }}
                                            outerRadius="80%"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.name === 'Free Space' ? '#86efac' : 'none'} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => formatBytes(Number(value))} />
                                        <Legend verticalAlign="top" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No usage data
                                </div>
                            )}
                        </div>

                        {/* Summary Details */}
                        <div className="w-full md:w-1/2 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-muted-foreground">Total Bucket Limit (Est.)</span>
                                    <span className="text-green-600 font-bold">10 GB</span>
                                </div>

                                {/* Stacked Progress Bar */}
                                <div className="h-4 w-full bg-green-100/50 rounded-full overflow-hidden flex border border-green-200" title="Green area represents Free Space">
                                    {chartData.map((item) => {
                                        const TOTAL_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB
                                        const percent = (item.value / TOTAL_LIMIT) * 100;
                                        if (percent <= 0) return null;

                                        return (
                                            <div
                                                key={item.name}
                                                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                                style={{
                                                    width: `${percent}%`,
                                                    backgroundColor: item.color
                                                }}
                                                title={`${item.name}: ${formatBytes(Number(item.value))} (${percent.toFixed(2)}%)`}
                                            />
                                        )
                                    })}
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Used: {formatBytes(stats?.totalSize || 0)}</span>
                                    <span className="text-green-600 font-medium">Free: {formatBytes((10 * 1024 * 1024 * 1024) - (stats?.totalSize || 0))}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Breakdown</h4>
                                {chartData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="font-mono">{formatBytes(Number(item.value))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Card className="flex flex-row items-center justify-between p-3 bg-blue-50/50 shadow-sm border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold leading-none">{stats?.image.count}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Images</div>
                            </div>
                        </div>
                        <div className="text-xs font-semibold bg-white/60 px-2 py-1 rounded text-blue-700">
                            {formatBytes(stats?.image.size || 0)}
                        </div>
                    </Card>
                    <Card className="flex flex-row items-center justify-between p-3 bg-green-50/50 shadow-sm border-green-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-1.5 rounded-md">
                                <Video className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold leading-none">{stats?.video.count}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Videos</div>
                            </div>
                        </div>
                        <div className="text-xs font-semibold bg-white/60 px-2 py-1 rounded text-green-700">
                            {formatBytes(stats?.video.size || 0)}
                        </div>
                    </Card>
                    <Card className="flex flex-row items-center justify-between p-3 bg-yellow-50/50 shadow-sm border-yellow-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-1.5 rounded-md">
                                <Music className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold leading-none">{stats?.audio.count}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Audio</div>
                            </div>
                        </div>
                        <div className="text-xs font-semibold bg-white/60 px-2 py-1 rounded text-yellow-700">
                            {formatBytes(stats?.audio.size || 0)}
                        </div>
                    </Card>
                    <Card className="flex flex-row items-center justify-between p-3 bg-gray-50/50 shadow-sm border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-1.5 rounded-md">
                                <File className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <div className="text-lg font-bold leading-none">{stats?.other.count}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Other</div>
                            </div>
                        </div>
                        <div className="text-xs font-semibold bg-white/60 px-2 py-1 rounded text-gray-700">
                            {formatBytes(stats?.other.size || 0)}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Operations & Cost Insights */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Operations & Usage Estimator</CardTitle>
                    <CardDescription>Understanding R2 Costs & Limits (Class A vs Class B)</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8">
                    {/* Graph */}
                    <div className="w-full md:w-1/2 h-[250px]">
                        <div className="text-xs text-center text-muted-foreground mb-4">Free Tier Monthly Limits</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Class A', limit: 1, label: '1 Million', desc: 'Uploads/Mgmt' },
                                { name: 'Class B', limit: 10, label: '10 Million', desc: 'Downloads/Views' },
                            ]} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-popover border text-popover-foreground p-2 rounded shadow-sm text-sm">
                                                    <div className="font-bold">{data.name}</div>
                                                    <div>Limit: {data.label}</div>
                                                    <div className="text-xs text-muted-foreground">{data.desc}</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="limit" radius={[0, 4, 4, 0]} barSize={40}>
                                    {
                                        [{ color: '#f97316' }, { color: '#0ea5e9' }].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                    }
                                    <LabelList dataKey="label" position="right" style={{ fill: 'foreground', fontSize: '12px', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Remedies / Explanations */}
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <h4 className="font-semibold text-orange-800 flex items-center gap-2 text-sm">
                                <File className="h-4 w-4" /> Class A Operations (Costly)
                            </h4>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-orange-700">
                                    Changes to state: <strong>Uploads, Deletes, Listing files</strong>.
                                </p>
                                <div className="bg-orange-100 text-orange-800 font-bold text-sm px-3 py-1 rounded-full">
                                    {analytics?.classAOps?.toLocaleString() || 0} / 1M
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-orange-800 font-medium">
                                Remedies:
                                <ul className="list-disc list-inside mt-1 space-y-1 text-orange-700/80 font-normal">
                                    <li>Avoid unnecessary file deletions.</li>
                                    <li>Batch your uploads where possible.</li>
                                    <li>Don't refresh the file list excessively.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                            <h4 className="font-semibold text-sky-800 flex items-center gap-2 text-sm">
                                <ImageIcon className="h-4 w-4" /> Class B Operations (Cheap)
                            </h4>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-sky-700">
                                    Retrieving data: <strong>Viewing Images, Downloading Files</strong>.
                                </p>
                                <div className="bg-sky-100 text-sky-800 font-bold text-sm px-3 py-1 rounded-full">
                                    {analytics?.classBOps?.toLocaleString() || 0} / 10M
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-sky-800 font-medium">
                                Remedies:
                                <ul className="list-disc list-inside mt-1 space-y-1 text-sky-700/80 font-normal">
                                    <li>Use browser caching (Cache-Control headers).</li>
                                    <li>Use a CDN (Cloudflare handles this automatically).</li>
                                    <li>Optimize image sizes for faster loading.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cost Estimator Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        💰 Cost Estimator
                        <span className="text-xs font-normal text-muted-foreground">(Current Month)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(() => {
                        const classAOps = analytics?.classAOps || 0;
                        const classBOps = analytics?.classBOps || 0;
                        const storageGB = stats ? stats.totalSize / (1024 * 1024 * 1024) : 0;

                        // Free tier limits
                        const FREE_CLASS_A = 1_000_000;
                        const FREE_CLASS_B = 10_000_000;
                        const FREE_STORAGE_GB = 10;

                        // Pricing (per million / per GB)
                        const PRICE_CLASS_A = 4.50;
                        const PRICE_CLASS_B = 0.36;
                        const PRICE_STORAGE = 0.015; // per GB per month

                        // Calculate billable amounts
                        const billableClassA = Math.max(0, classAOps - FREE_CLASS_A);
                        const billableClassB = Math.max(0, classBOps - FREE_CLASS_B);
                        const billableStorage = Math.max(0, storageGB - FREE_STORAGE_GB);

                        // Calculate costs
                        const costClassA = (billableClassA / 1_000_000) * PRICE_CLASS_A;
                        const costClassB = (billableClassB / 1_000_000) * PRICE_CLASS_B;
                        const costStorage = billableStorage * PRICE_STORAGE;
                        const totalCost = costClassA + costClassB + costStorage;

                        const isFreeTier = totalCost === 0;

                        return (
                            <div className="space-y-4">
                                {/* Free Tier Status */}
                                <div className={`p-3 rounded-lg border ${isFreeTier ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{isFreeTier ? '✅' : '⚠️'}</span>
                                            <span className={`font-semibold ${isFreeTier ? 'text-green-800' : 'text-amber-800'}`}>
                                                {isFreeTier ? 'Within Free Tier' : 'Paid Usage Detected'}
                                            </span>
                                        </div>
                                        <div className={`text-xl font-bold ${isFreeTier ? 'text-green-700' : 'text-amber-700'}`}>
                                            ${totalCost.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Breakdown Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="text-left p-2 font-medium">Resource</th>
                                                <th className="text-right p-2 font-medium">Usage</th>
                                                <th className="text-right p-2 font-medium">Free Limit</th>
                                                <th className="text-right p-2 font-medium">Billable</th>
                                                <th className="text-right p-2 font-medium">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t">
                                                <td className="p-2">Class A Ops</td>
                                                <td className="p-2 text-right">{classAOps.toLocaleString()}</td>
                                                <td className="p-2 text-right text-muted-foreground">1,000,000</td>
                                                <td className="p-2 text-right">{billableClassA.toLocaleString()}</td>
                                                <td className="p-2 text-right font-medium">${costClassA.toFixed(4)}</td>
                                            </tr>
                                            <tr className="border-t">
                                                <td className="p-2">Class B Ops</td>
                                                <td className="p-2 text-right">{classBOps.toLocaleString()}</td>
                                                <td className="p-2 text-right text-muted-foreground">10,000,000</td>
                                                <td className="p-2 text-right">{billableClassB.toLocaleString()}</td>
                                                <td className="p-2 text-right font-medium">${costClassB.toFixed(4)}</td>
                                            </tr>
                                            <tr className="border-t">
                                                <td className="p-2">Storage</td>
                                                <td className="p-2 text-right">{storageGB >= 1 ? `${storageGB.toFixed(2)} GB` : `${(storageGB * 1024).toFixed(2)} MB`}</td>
                                                <td className="p-2 text-right text-muted-foreground">10 GB</td>
                                                <td className="p-2 text-right">{billableStorage > 0 ? `${billableStorage.toFixed(3)} GB` : '0'}</td>
                                                <td className="p-2 text-right font-medium">${costStorage.toFixed(4)}</td>
                                            </tr>
                                        </tbody>
                                        <tfoot className="bg-muted font-semibold">
                                            <tr className="border-t">
                                                <td className="p-2" colSpan={4}>Estimated Monthly Total</td>
                                                <td className="p-2 text-right text-lg">${totalCost.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Usage Progress Bars */}
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Class A</span>
                                            <span>{((classAOps / FREE_CLASS_A) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${classAOps > FREE_CLASS_A ? 'bg-red-500' : 'bg-orange-400'}`}
                                                style={{ width: `${Math.min(100, (classAOps / FREE_CLASS_A) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Class B</span>
                                            <span>{((classBOps / FREE_CLASS_B) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${classBOps > FREE_CLASS_B ? 'bg-red-500' : 'bg-sky-400'}`}
                                                style={{ width: `${Math.min(100, (classBOps / FREE_CLASS_B) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span>Storage</span>
                                            <span>{((storageGB / FREE_STORAGE_GB) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${storageGB > FREE_STORAGE_GB ? 'bg-red-500' : 'bg-green-400'}`}
                                                style={{ width: `${Math.min(100, (storageGB / FREE_STORAGE_GB) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>

            {/* File Gallery */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex flex-col gap-4">
                        {/* Row 1: Title and Tabs */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <CardTitle className="flex items-center gap-2">
                                File Gallery
                                <Badge variant="secondary">{filteredFiles.length} files</Badge>
                            </CardTitle>
                            <Tabs defaultValue="all" value={filter} onValueChange={(v: any) => setFilter(v)}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="image">Images</TabsTrigger>
                                    <TabsTrigger value="audio">Audio</TabsTrigger>
                                    <TabsTrigger value="video">Video</TabsTrigger>
                                    <TabsTrigger value="unused" className="text-red-600">Unused</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Row 2: Search, Sort, Bulk Actions */}
                        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                            {/* Search */}
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Sort */}
                            <select
                                className="border rounded-md px-3 py-2 text-sm bg-background"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                            >
                                <option value="date">Sort: Latest</option>
                                <option value="name">Sort: Name</option>
                                <option value="size">Sort: Size</option>
                            </select>

                            {/* Bulk Actions */}
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={selectAll}>
                                    {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? 'Deselect All' : 'Select All'}
                                </Button>
                                {selectedFiles.size > 0 && (
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete {selectedFiles.size}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => (
                            <div key={file.key} className={`group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-background ${selectedFiles.has(file.key) ? 'ring-2 ring-primary' : ''}`}>
                                {/* Selection Checkbox */}
                                <div
                                    className="absolute top-2 left-2 z-10 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); toggleSelect(file.key); }}
                                >
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${selectedFiles.has(file.key) ? 'bg-primary border-primary text-white' : 'bg-white/80 border-gray-300'}`}>
                                        {selectedFiles.has(file.key) && <CheckCircle className="h-3 w-3" />}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                                    {file.type === 'image' ? (
                                        <img src={file.url} alt={file.key} className="object-cover w-full h-full" loading="lazy" />
                                    ) : file.type === 'video' ? (
                                        <Video className="h-10 w-10 text-muted-foreground" />
                                    ) : file.type === 'audio' ? (
                                        <Music className="h-10 w-10 text-muted-foreground" />
                                    ) : (
                                        <File className="h-10 w-10 text-muted-foreground" />
                                    )}

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(file.key)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="h-8 w-8" asChild>
                                            <a href={file.url} target="_blank" rel="noreferrer">
                                                <File className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    {file.isUsed ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500 fill-white" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500 fill-white" />
                                                    )}
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {file.isUsed ? "Used in App" : "Unused / Orphaned"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-2 space-y-1">
                                    <p className="text-xs font-medium truncate" title={file.key}>{file.key.split('/').pop()}</p>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                        <span>{formatBytes(file.size)}</span>
                                        <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredFiles.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No files found for this filter.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
