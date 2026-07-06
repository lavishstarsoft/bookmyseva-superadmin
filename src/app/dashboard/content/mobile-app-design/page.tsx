"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ImageUpload } from "@/components/ui/image-upload";

export default function MobileAppUIBuilder() {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/mobile-ui-config');
            if (res.data?.success) {
                setConfig(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch UI configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const res = await api.put('/mobile-ui-config', config);
            if (res.data?.success) {
                toast.success("UI Configuration saved successfully");
                setConfig(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading configuration...</div>;
    if (!config) return <div className="p-8">Error loading configuration.</div>;

    // Helpers for updating state arrays safely
    const updateArrayItem = (arrayKey: string, index: number, field: string, value: any) => {
        const newArray = [...config[arrayKey]];
        newArray[index] = { ...newArray[index], [field]: value };
        setConfig({ ...config, [arrayKey]: newArray });
    };

    const addArrayItem = (arrayKey: string, defaultItem: any) => {
        const newArray = [...config[arrayKey], defaultItem];
        setConfig({ ...config, [arrayKey]: newArray });
    };

    const removeArrayItem = (arrayKey: string, index: number) => {
        const newArray = [...config[arrayKey]];
        newArray.splice(index, 1);
        setConfig({ ...config, [arrayKey]: newArray });
    };

    return (
        <div className="p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Mobile App UI Builder</h1>
                    <p className="text-muted-foreground">Dynamically configure the layout and navigation of the mobile app.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="grid" className="w-full bg-white p-4 rounded-xl shadow-sm border">
                <TabsList className="mb-4">
                    <TabsTrigger value="grid">BMS Service Grid</TabsTrigger>
                    <TabsTrigger value="nav">Bottom Navigation</TabsTrigger>
                    <TabsTrigger value="more">More Menu Sections</TabsTrigger>

                    <TabsTrigger value="infocards">Info Cards</TabsTrigger>
                </TabsList>

                {/* BMS Service Grid Tab */}
                <TabsContent value="grid" className="space-y-4">
                    {config.bmsServiceGrid?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                            <GripVertical className="text-gray-400 cursor-move" />
                            
                            <div className="flex-1 grid grid-cols-4 gap-3">
                                <div>
                                    <Label className="text-xs">Label</Label>
                                    <Input value={item.label} onChange={e => updateArrayItem('bmsServiceGrid', idx, 'label', e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs">Icon (Emoji/URL)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input value={item.iconValue} onChange={e => updateArrayItem('bmsServiceGrid', idx, 'iconValue', e.target.value)} />
                                        <div className="w-10 h-10 shrink-0">
                                            <ImageUpload value={item.iconValue} onChange={url => updateArrayItem('bmsServiceGrid', idx, 'iconValue', url)} hideText className="w-full h-full" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Link Target</Label>
                                    <Input value={item.linkTarget} onChange={e => updateArrayItem('bmsServiceGrid', idx, 'linkTarget', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <Switch checked={item.isVisible} onCheckedChange={c => updateArrayItem('bmsServiceGrid', idx, 'isVisible', c)} />
                                    <span className="text-sm">Visible</span>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" onClick={() => removeArrayItem('bmsServiceGrid', idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('bmsServiceGrid', { id: Date.now().toString(), label: "New Item", iconType: "emoji", iconValue: "🌟", linkTarget: "/", isVisible: true })}>
                        <Plus className="w-4 h-4 mr-2" /> Add Grid Item
                    </Button>
                </TabsContent>

                {/* Bottom Navigation Tab */}
                <TabsContent value="nav" className="space-y-4">
                    {config.bottomNavigation?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                            <GripVertical className="text-gray-400 cursor-move" />
                            
                            <div className="flex-1 grid grid-cols-5 gap-3">
                                <div>
                                    <Label className="text-xs">Label</Label>
                                    <Input value={item.label} onChange={e => updateArrayItem('bottomNavigation', idx, 'label', e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs">Icon (Lucide/Emoji)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input value={item.iconValue} onChange={e => updateArrayItem('bottomNavigation', idx, 'iconValue', e.target.value)} />
                                        <div className="w-10 h-10 shrink-0">
                                            <ImageUpload value={item.iconValue} onChange={url => updateArrayItem('bottomNavigation', idx, 'iconValue', url)} hideText className="w-full h-full" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Link Target</Label>
                                    <Input value={item.linkTarget} onChange={e => updateArrayItem('bottomNavigation', idx, 'linkTarget', e.target.value)} disabled={item.isDrawer} />
                                </div>
                                <div className="flex items-center justify-between gap-1 pt-6 col-span-2">
                                    <div className="flex items-center gap-1">
                                        <Switch checked={item.isCenter} onCheckedChange={c => updateArrayItem('bottomNavigation', idx, 'isCenter', c)} />
                                        <span className="text-xs">Center Highlight</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Switch checked={item.isDrawer} onCheckedChange={c => updateArrayItem('bottomNavigation', idx, 'isDrawer', c)} />
                                        <span className="text-xs">Opens More Menu</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Switch checked={item.isVisible} onCheckedChange={c => updateArrayItem('bottomNavigation', idx, 'isVisible', c)} />
                                        <span className="text-xs">Visible</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" onClick={() => removeArrayItem('bottomNavigation', idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('bottomNavigation', { id: Date.now().toString(), label: "New Tab", iconType: "icon", iconValue: "Menu", linkTarget: "/", isVisible: true, isCenter: false, isDrawer: false })}>
                        <Plus className="w-4 h-4 mr-2" /> Add Navigation Tab
                    </Button>
                </TabsContent>

                {/* More Menu Sections Tab */}
                <TabsContent value="more" className="space-y-6">
                    {config.moreMenuSections?.map((section: any, sectionIdx: number) => (
                        <div key={sectionIdx} className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Label className="whitespace-nowrap font-bold">Section Title</Label>
                                    <Input value={section.title} onChange={e => updateArrayItem('moreMenuSections', sectionIdx, 'title', e.target.value)} className="font-bold w-64" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={section.isVisible} onCheckedChange={c => updateArrayItem('moreMenuSections', sectionIdx, 'isVisible', c)} />
                                        <span className="text-sm">Visible</span>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={() => removeArrayItem('moreMenuSections', sectionIdx)}>Remove Section</Button>
                                </div>
                            </div>
                            
                            {/* Submenus */}
                            <div className="space-y-3 pl-6 border-l-2 ml-2">
                                {section.links?.map((link: any, linkIdx: number) => (
                                    <div key={linkIdx} className="flex items-center gap-3 bg-white p-2 border rounded-md">
                                        <Input placeholder="Label" value={link.label} onChange={e => {
                                            const newArray = [...config.moreMenuSections];
                                            newArray[sectionIdx].links[linkIdx].label = e.target.value;
                                            setConfig({ ...config, moreMenuSections: newArray });
                                        }} className="w-40" />
                                        
                                        <Input placeholder="Description" value={link.description} onChange={e => {
                                            const newArray = [...config.moreMenuSections];
                                            newArray[sectionIdx].links[linkIdx].description = e.target.value;
                                            setConfig({ ...config, moreMenuSections: newArray });
                                        }} className="w-48" />

                                        <div className="flex items-center gap-2">
                                            <Input placeholder="Icon/Emoji" value={link.iconValue} onChange={e => {
                                                const newArray = [...config.moreMenuSections];
                                                newArray[sectionIdx].links[linkIdx].iconValue = e.target.value;
                                                setConfig({ ...config, moreMenuSections: newArray });
                                            }} className="w-24" />
                                            <div className="w-10 h-10 shrink-0">
                                                <ImageUpload value={link.iconValue} onChange={url => {
                                                    const newArray = [...config.moreMenuSections];
                                                    newArray[sectionIdx].links[linkIdx].iconValue = url;
                                                    setConfig({ ...config, moreMenuSections: newArray });
                                                }} hideText className="w-full h-full" />
                                            </div>
                                        </div>

                                        <Input placeholder="Target URL" value={link.linkTarget} onChange={e => {
                                            const newArray = [...config.moreMenuSections];
                                            newArray[sectionIdx].links[linkIdx].linkTarget = e.target.value;
                                            setConfig({ ...config, moreMenuSections: newArray });
                                        }} className="w-40" />

                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newArray = [...config.moreMenuSections];
                                            newArray[sectionIdx].links.splice(linkIdx, 1);
                                            setConfig({ ...config, moreMenuSections: newArray });
                                        }} className="text-red-500 ml-auto">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={() => {
                                    const newArray = [...config.moreMenuSections];
                                    if(!newArray[sectionIdx].links) newArray[sectionIdx].links = [];
                                    newArray[sectionIdx].links.push({ id: Date.now().toString(), label: "New Link", description: "", iconValue: "✨", linkTarget: "/", isVisible: true });
                                    setConfig({ ...config, moreMenuSections: newArray });
                                }}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Link
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('moreMenuSections', { id: Date.now().toString(), title: "New Section", isVisible: true, links: [] })}>
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                    </Button>
                </TabsContent>



                {/* Info Cards Tab */}
                <TabsContent value="infocards" className="space-y-4">
                    {config.infoCards?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                            <GripVertical className="text-gray-400 cursor-move mt-6" />
                            
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <Label className="text-xs">Title</Label>
                                    <Input value={item.title} onChange={e => updateArrayItem('infoCards', idx, 'title', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Description</Label>
                                    <Input value={item.description} onChange={e => updateArrayItem('infoCards', idx, 'description', e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs">Icon (Emoji)</Label>
                                    <Input value={item.icon} onChange={e => updateArrayItem('infoCards', idx, 'icon', e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs mb-1 block">Image Upload</Label>
                                    <div className="w-24 h-24 mt-2">
                                        <ImageUpload value={item.image} onChange={url => updateArrayItem('infoCards', idx, 'image', url)} hideText className="w-full h-full border border-dashed rounded-lg" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Theme</Label>
                                    <Select value={item.theme} onValueChange={v => updateArrayItem('infoCards', idx, 'theme', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maroon">Maroon Theme</SelectItem>
                                            <SelectItem value="green">Green Theme</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Button Text</Label>
                                    <Input value={item.buttonText} onChange={e => updateArrayItem('infoCards', idx, 'buttonText', e.target.value)} />
                                </div>
                                <div>
                                    <Label className="text-xs">Link Target</Label>
                                    <Input value={item.linkTarget} onChange={e => updateArrayItem('infoCards', idx, 'linkTarget', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <Switch checked={item.isVisible} onCheckedChange={c => updateArrayItem('infoCards', idx, 'isVisible', c)} />
                                    <span className="text-sm">Visible</span>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" onClick={() => removeArrayItem('infoCards', idx)} className="text-red-500 hover:text-red-700 mt-6">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('infoCards', { id: Date.now().toString(), title: "New Info Card", description: "", icon: "✨", image: "", theme: "maroon", buttonText: "Learn More", linkTarget: "/", isVisible: true })}>
                        <Plus className="w-4 h-4 mr-2" /> Add Info Card
                    </Button>
                </TabsContent>

            </Tabs>
        </div>
    );
}
