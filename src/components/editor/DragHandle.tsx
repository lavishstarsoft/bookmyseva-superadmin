import { Editor } from '@tiptap/react'
import { GripVertical, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { NodeSelection } from 'prosemirror-state'

interface DragHandleProps {
    editor: Editor | null
}

export const DragHandle = ({ editor }: DragHandleProps) => {
    const [position, setPosition] = useState<number | null>(null)
    const [top, setTop] = useState<number>(0)
    const [opacity, setOpacity] = useState<number>(0)
    const dragHandleRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!editor) return

        const updatePosition = () => {
            if (editor.isDestroyed) return

            const { view } = editor
            const { selection } = view.state

            // Logic to find current block node
            // This is a simplified version; robust implementations use `posAtCoords` on mousemove
            // But we start with tracking selection or hover
        }

        // We will use a global mousemove listener on the editor element to position the handle
        const editorElement = editor.view.dom

        const handleMouseMove = (event: MouseEvent) => {
            const coords = { left: event.clientX, top: event.clientY }
            const pos = editor.view.posAtCoords(coords)

            if (pos) {
                let node = editor.view.domAtPos(pos.pos).node as HTMLElement

                // Traverse up to find the direct child of ProseMirror (the block)
                const editorContent = editorElement
                if (!editorContent) return

                while (node && node.parentNode !== editorContent && node.parentNode !== null) {
                    node = node.parentNode as HTMLElement
                }

                if (node && node.nodeType === 1) { // Element node
                    const rect = node.getBoundingClientRect()
                    const editorRect = editorElement.getBoundingClientRect()

                    // Position handle to the left of the block
                    // Adjust offsets based on your layout
                    setTop(rect.top - editorRect.top)
                    setOpacity(1)

                    // Store the position of this node for dragging
                    // We need the exact document position
                    const nodePos = editor.view.posAtDOM(node, 0)
                    setPosition(nodePos)
                }
            }
        }

        const handleMouseLeave = () => {
            setOpacity(0)
        }

        editorElement.addEventListener('mousemove', handleMouseMove)
        editorElement.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            editorElement.removeEventListener('mousemove', handleMouseMove)
            editorElement.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [editor])

    const handleDragStart = (event: React.DragEvent) => {
        if (!editor || position === null) return

        event.dataTransfer.effectAllowed = 'move'

        // Select the node so ProseMirror knows what to drag
        const transaction = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, position))
        editor.view.dispatch(transaction)

        // Let ProseMirror handle the drag via its internal handler if possible,
        // or we manually construct the drag slice.
        // Tiptap/ProseMirror has built-in drag handling if selection is set.

        // We can force the drag image to be the node itself or a custom ghost
        const node = editor.view.nodeDOM(position) as HTMLElement
        if (node) {
            event.dataTransfer.setDragImage(node, 0, 0)
        }
    }

    if (!editor) return null

    return (
        <div
            ref={dragHandleRef}
            className="absolute left-2 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-all duration-100 z-50"
            style={{
                top: `${top}px`,
                opacity: opacity,
                pointerEvents: opacity ? 'auto' : 'none'
            }}
            draggable="true"
            onDragStart={handleDragStart}
        >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
    )
}
