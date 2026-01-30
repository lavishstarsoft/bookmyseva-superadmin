"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { AlertCircle, CheckCircle, Smartphone } from "lucide-react"

interface SeoSidebarProps {
    score: number
    title: string
    description: string
    slug: string
    wordCount: number
    keywordDensity: number
}

export default function SeoSidebar({
    score = 0,
    title = "",
    description = "",
    slug = "",
    wordCount = 0,
    keywordDensity = 0
}: SeoSidebarProps) {

    // Determine color based on score
    const getScoreColor = (s: number) => {
        if (s >= 80) return "bg-green-500"
        if (s >= 50) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <div className="space-y-6">

            {/* Overall Score */}
            <Card className="border-t-4 border-t-marigold shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center text-lg">
                        SEO Score
                        <span className={`text-sm font-bold px-2 py-1 rounded text-white ${getScoreColor(score)}`}>
                            {score}/100
                        </span>
                    </CardTitle>
                    <CardDescription>Real-time analysis based on content</CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={score} className="h-2" />

                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Word Count:</span>
                            <span className="font-semibold">{wordCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Keyword Density:</span>
                            <span className={`font-semibold ${keywordDensity > 2.5 ? "text-red-500" : "text-green-600"}`}>
                                {keywordDensity.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search Preview */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Google Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border text-left">
                        <div className="flex items-center gap-2 text-xs mb-1">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px]">
                                🔍
                            </div>
                            <div className="flex flex-col">
                                <span className="text-black dark:text-gray-200">bookmyseva.com</span>
                                <span className="text-gray-500 dark:text-gray-400 text-[10px]">https://bookmyseva.com/blog/{slug}</span>
                            </div>
                        </div>
                        <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg hover:underline truncate cursor-pointer font-medium">
                            {title || "Blog Title..."}
                        </h3>
                        <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 mt-1">
                            {description || "Meta description will appear here..."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        {title.length > 30 && title.length < 60 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        <span className={title.length > 30 && title.length < 60 ? "" : "text-muted-foreground"}>Title length (30-60 chars)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {description.length > 120 && description.length < 160 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        <span className={description.length > 120 && description.length < 160 ? "" : "text-muted-foreground"}>Desc length (120-160 chars)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {wordCount > 300 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        <span className={wordCount > 300 ? "" : "text-muted-foreground"}>Content length ({'>'}300 words)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        {keywordDensity < 2.5 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                        <span className={keywordDensity < 2.5 ? "" : "text-muted-foreground"}>No keyword stuffing</span>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
