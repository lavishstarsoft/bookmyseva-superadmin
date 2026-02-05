"use client"

import { useEffect, useRef, useState } from 'react'

// Declare the RichTextEditor type for TypeScript
declare global {
    interface Window {
        RichTextEditor: any
        RTE_DefaultConfig: any
    }
}

interface RichTextEditorProps {
    content?: any
    onChange?: (content: any) => void
    height?: number
}

export default function RichTextEditor({
    content,
    onChange,
    height = 400
}: RichTextEditorProps) {
    const editorRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [scriptsLoaded, setScriptsLoaded] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const onChangeRef = useRef(onChange)
    const initAttempted = useRef(false)

    // Keep onChange ref updated
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // Load scripts in order and inject CSS
    useEffect(() => {
        const basePath = '/superadmin';

        // Inject CSS
        const cssId = 'rte-theme-css'
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link')
            link.id = cssId
            link.rel = 'stylesheet'
            link.href = `${basePath}/richtexteditor/rte_theme_default.css`
            document.head.appendChild(link)
        }

        // Check if already loaded
        if (window.RichTextEditor) {
            setScriptsLoaded(true)
            return
        }

        // Load main rte.js first
        const rteScript = document.createElement('script')
        rteScript.src = `${basePath}/richtexteditor/rte.js`
        rteScript.async = false

        rteScript.onload = () => {
            // After main script loads, load plugins
            const pluginsScript = document.createElement('script')
            pluginsScript.src = `${basePath}/richtexteditor/plugins/all_plugins.js`
            pluginsScript.async = false

            pluginsScript.onload = () => {
                setTimeout(() => {
                    setScriptsLoaded(true)
                }, 100)
            }

            document.body.appendChild(pluginsScript)
        }

        document.body.appendChild(rteScript)
    }, [])

    // Initialize editor when scripts are loaded
    useEffect(() => {
        if (!scriptsLoaded || !containerRef.current || initAttempted.current) {
            return
        }

        if (!window.RichTextEditor) {
            console.log('RichTextEditor not available yet')
            return
        }

        initAttempted.current = true

        try {
            const uploadImage = async (file: File, callback: (url: string) => void) => {
                try {
                    const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2]
                    if (!token) {
                        console.error("No token found")
                        return
                    }

                    const formData = new FormData()
                    formData.append('image', file)

                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    })

                    if (!response.ok) {
                        throw new Error('Upload failed')
                    }

                    const data = await response.json()
                    callback(data.url)
                } catch (error) {
                    console.error("Image upload failed:", error)
                    // Fallback to base64 or show error? 
                    // Most editors expect the callback to be called with a URL, or nothing if failed.
                }
            }

            editorRef.current = new window.RichTextEditor(containerRef.current, {
                file_upload_handler: uploadImage
            });
            (window as any)._editor = editorRef.current;

            // Set initial content
            if (content && typeof content === 'string' && content.length > 0) {
                editorRef.current.setHTMLCode(content)
            }

            // Setup change listener
            const checkForChanges = () => {
                if (editorRef.current && onChangeRef.current) {
                    try {
                        const html = editorRef.current.getHTMLCode()
                        onChangeRef.current(html)
                    } catch (e) {
                        // Ignore
                    }
                }
            }

            intervalRef.current = setInterval(checkForChanges, 1000)
            console.log('RichTextEditor initialized successfully')
        } catch (error) {
            console.error('Error initializing RichTextEditor:', error)
            initAttempted.current = false // Allow retry
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [scriptsLoaded])

    return (
        <div className="w-full">
            <div
                ref={containerRef}
                style={{ height: `${height}px`, minHeight: '300px' }}
            />
        </div>
    )
}
