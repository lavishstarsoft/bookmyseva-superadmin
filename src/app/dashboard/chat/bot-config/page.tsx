"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Bot, Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Intent {
    _id?: string
    intent: string
    keywords: string[]
    response: string
    quickReplies?: string[]
    matchCount?: number
    priority?: number
    isActive?: boolean
}

interface QuickAction {
    _id?: string
    icon: string
    title: string
    subtitle?: string
    type: string
    config?: {
        message?: string
    }
    isActive: boolean
    order: number
    clickCount?: number
}

export default function BotConfigPage() {
    const [intents, setIntents] = useState<Intent[]>([])
    const [quickActions, setQuickActions] = useState<QuickAction[]>([])
    const [loading, setLoading] = useState(true)
    const [editingIntent, setEditingIntent] = useState<Partial<Intent> | null>(null)
    const [editingAction, setEditingAction] = useState<Partial<QuickAction> | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }

            const [intentsRes, actionsRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/intents`, { headers }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/quick-actions/all`, { headers })
            ])

            setIntents(intentsRes.data)
            setQuickActions(actionsRes.data)
        } catch (error) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const saveIntent = async (data: any) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }

            if (editingIntent?._id) {
                await axios.put(`http://localhost:5001/api/chat/intents/${editingIntent._id}`, data, { headers })
                toast.success("Intent updated")
            } else {
                await axios.post("http://localhost:5001/api/chat/intents", data, { headers })
                toast.success("Intent created")
            }

            fetchData()
            setEditingIntent(null)
        } catch (error) {
            toast.error("Failed to save intent")
        }
    }

    const deleteIntent = async (id: any) => {
        if (!confirm("Delete this intent?")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.delete(`http://localhost:5001/api/chat/intents/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            toast.success("Intent deleted")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const deleteAction = async (id: any) => {
        if (!confirm("Delete this quick action?")) return

        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            await axios.delete(`http://localhost:5001/api/chat/quick-actions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            toast.success("Action deleted")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const saveQuickAction = async (data: any) => {
        try {
            const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
            const headers = { 'Authorization': `Bearer ${token}` }

            if (editingAction?._id) {
                await axios.put(`http://localhost:5001/api/chat/quick-actions/${editingAction._id}`, data, { headers })
                toast.success("Action updated")
            } else {
                await axios.post("http://localhost:5001/api/chat/quick-actions", data, { headers })
                toast.success("Action created")
            }

            fetchData()
            setEditingAction(null)
        } catch (error) {
            toast.error("Failed to save action")
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-3xl font-bold text-[#8D0303]">Bot Configuration</h2>
                <p className="text-muted-foreground">Manage chat bot responses and quick actions</p>
            </div>

            {/* Bot Intents Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Bot Intents ({intents.length})
                        </CardTitle>
                        <Dialog open={!!editingIntent} onOpenChange={(open) => !open && setEditingIntent(null)}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingIntent({})} className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Add Intent
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingIntent?._id ? "Edit" : "Create"} Intent</DialogTitle>
                                </DialogHeader>
                                <IntentForm intent={editingIntent} onSave={saveIntent} onCancel={() => setEditingIntent(null)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {intents.map(intent => (
                            <div key={intent._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium">{intent.intent}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Keywords: {intent.keywords.join(', ')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Matches: {intent.matchCount || 0}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setEditingIntent(intent)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteIntent(intent._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Quick Actions ({quickActions.length})</CardTitle>
                        <Dialog open={!!editingAction} onOpenChange={(open) => !open && setEditingAction(null)}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setEditingAction({ type: 'message', isActive: true, order: quickActions.length } as any)} className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Add Action
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingAction?._id ? "Edit" : "Create"} Quick Action</DialogTitle>
                                </DialogHeader>
                                <ActionForm action={editingAction} onSave={saveQuickAction} onCancel={() => setEditingAction(null)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <div key={action._id} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-2xl mb-2">{action.icon}</div>
                                        <h4 className="font-medium">{action.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Clicks: {action.clickCount || 0}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingAction(action)}>
                                            Edit
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteAction(action._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface IntentFormProps {
    intent?: Partial<Intent> | null
    onSave: (data: any) => void
    onCancel: () => void
}

function IntentForm({ intent, onSave, onCancel }: IntentFormProps) {
    const [formData, setFormData] = useState({
        intent: intent?.intent || '',
        keywords: intent?.keywords?.join(', ') || '',
        response: intent?.response || '',
        quickReplies: intent?.quickReplies?.join(', ') || '',
        priority: intent?.priority || 0,
        isActive: intent?.isActive ?? true
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            keywords: formData.keywords.split(',').map((k: string) => k.trim()),
            quickReplies: formData.quickReplies.split(',').map((q: string) => q.trim()).filter(Boolean)
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Intent Name*</Label>
                <Input value={formData.intent} onChange={(e) => setFormData({ ...formData, intent: e.target.value })} required />
            </div>
            <div>
                <Label>Keywords (comma separated)*</Label>
                <Input value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} required placeholder="book, booking, reserve" />
            </div>
            <div>
                <Label>Bot Response*</Label>
                <Textarea value={formData.response} onChange={(e) => setFormData({ ...formData, response: e.target.value })} required rows={3} />
            </div>
            <div>
                <Label>Quick Replies (optional, comma separated)</Label>
                <Input value={formData.quickReplies} onChange={(e) => setFormData({ ...formData, quickReplies: e.target.value })} placeholder="Yes, No, Tell me more" />
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                    <Save className="h-4 w-4 mr-2" /> Save
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    )
}

interface ActionFormProps {
    action?: Partial<QuickAction> | null
    onSave: (data: any) => void
    onCancel: () => void
}

function ActionForm({ action, onSave, onCancel }: ActionFormProps) {
    const [formData, setFormData] = useState({
        icon: action?.icon || '💬',
        title: action?.title || '',
        subtitle: action?.subtitle || '',
        type: action?.type || 'message',
        config: action?.config || { message: '' },
        isActive: action?.isActive ?? true,
        order: action?.order || 0
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Icon (emoji)*</Label>
                <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} required />
            </div>
            <div>
                <Label>Title*</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
                <Label>Subtitle</Label>
                <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>
            <div>
                <Label>Message (for simple message type)</Label>
                <Textarea value={formData.config.message || ''} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, message: e.target.value } })} rows={3} />
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="bg-[#8D0303] hover:bg-[#7d0202] text-white">
                    <Save className="h-4 w-4 mr-2" /> Save
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    )
}
