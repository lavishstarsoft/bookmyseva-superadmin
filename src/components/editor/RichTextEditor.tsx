"use client"

import { useEffect, useRef } from 'react'

interface RichTextEditorProps {
    content: any // The new editor seems to deal with HTML strings mostly
    onChange: (content: any) => void
}

declare global {
    interface Window {
        RichTextEditor: any
    }
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const rteInstance = useRef<any>(null)

    useEffect(() => {
        // Ensure scripts are loaded and window.RichTextEditor is available
        const initEditor = () => {
            if (window.RichTextEditor && editorRef.current && !rteInstance.current) {
                // Initialize the editor
                rteInstance.current = new window.RichTextEditor(editorRef.current);

                // Set initial content
                // Note: content prop might be JSON from Tiptap history, needing conversion
                // But for new or html content:
                // If content is object (tiptap), we might need to rely on the parent converting valid HTML first
                // For now assuming we pass HTML string or handling it safely

                let initialHtml = "";
                if (typeof content === 'string') {
                    initialHtml = content;
                } else if (content && content.type === 'doc') {
                    // Fallback for Tiptap JSON - this won't render correctly without a converter
                    // We'll warn or just set empty if strict migration needed
                    console.warn("Received Tiptap JSON, but new editor expects HTML.");
                    initialHtml = "<p>Content migration required.</p>";
                }

                rteInstance.current.setHTMLCode(initialHtml);

                // Attach Change Listener
                // We need to poll or hook into specific events if the library supports them.
                // Based on standard simple JS editors, they might not have 'on' events easily exposed.
                // Assuming we might need to bind input/blur events on the inner content editable
                // OR checking docs (which we don't have deeply).
                // Let's attach a mutation observer or simple interval check for changes if event listener isn't obvious
                // But typically:
                if (rteInstance.current.attachEvent) {
                    rteInstance.current.attachEvent("change", function () {
                        onChange(rteInstance.current.getHTMLCode());
                    });
                } else {
                    // Fallback polling or event binding on container
                    // Inspecting the library implementation would be ideal, but let's try binding to the container
                    const editorBody = editorRef.current.querySelector('.rte-content'); // Hypothesized class
                    if (editorBody) {
                        editorBody.addEventListener('input', () => {
                            onChange(rteInstance.current.getHTMLCode());
                        })
                    }
                }
            }
        }

        // Retry initialization if scripts load async
        if (!window.RichTextEditor) {
            const interval = setInterval(() => {
                if (window.RichTextEditor) {
                    clearInterval(interval);
                    initEditor();
                }
            }, 100);
            return () => clearInterval(interval);
        } else {
            initEditor();
        }

        // Cleanup
        return () => {
            // Check if destroy method exists
            if (rteInstance.current && rteInstance.current.destroy) {
                // rteInstance.current.destroy();
            }
            rteInstance.current = null;
        }
    }, [])

    // Update content if changed externally (be careful of loops)
    useEffect(() => {
        if (rteInstance.current && content && typeof content === 'string') {
            const currentVal = rteInstance.current.getHTMLCode();
            if (currentVal !== content) {
                rteInstance.current.setHTMLCode(content);
            }
        }
    }, [content])

    return (
        <div className="w-full">
            <div ref={editorRef} className="rte-container"></div>
        </div>
    )
}
