import Image from '@tiptap/extension-image'
import { mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const ResizableImage = Image.extend({
    name: 'resizableImage',

    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes => {
                    if (!attributes.width) return {}
                    return { width: attributes.width }
                },
            },
            height: {
                default: null,
                parseHTML: element => element.getAttribute('height'),
                renderHTML: attributes => {
                    if (!attributes.height) return {}
                    return { height: attributes.height }
                },
            },
            float: {
                default: null,
                parseHTML: element => element.getAttribute('data-float'),
                renderHTML: attributes => {
                    if (!attributes.float) return {}
                    return { 'data-float': attributes.float, style: `float: ${attributes.float}; margin: ${attributes.float === 'left' ? '0 1rem 1rem 0' : '0 0 1rem 1rem'};` }
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('imageResize'),
                props: {
                    decorations(state) {
                        const { doc, selection } = state
                        const decorations: Decoration[] = []

                        doc.descendants((node, pos) => {
                            if (node.type.name === 'resizableImage') {
                                const { from, to } = selection
                                if (pos >= from && pos < to) {
                                    decorations.push(
                                        Decoration.node(pos, pos + node.nodeSize, {
                                            class: 'ProseMirror-selectednode',
                                        })
                                    )
                                }
                            }
                        })

                        return DecorationSet.create(doc, decorations)
                    },
                },
            }),
        ]
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            draggable: false,
            contenteditable: false,
        })]
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const container = document.createElement('div')
            container.className = 'image-resizer-container'
            container.contentEditable = 'false'

            const img = document.createElement('img')
            img.src = node.attrs.src
            img.alt = node.attrs.alt || ''
            img.title = node.attrs.title || ''

            if (node.attrs.width) img.style.width = node.attrs.width + 'px'
            if (node.attrs.height) img.style.height = node.attrs.height + 'px'
            if (node.attrs.float) {
                container.style.float = node.attrs.float
                container.style.margin = node.attrs.float === 'left' ? '0 1rem 1rem 0' : '0 0 1rem 1rem'
            }

            // Create 4 corner resize handles
            const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
            const resizeHandles: HTMLElement[] = []

            corners.forEach(corner => {
                const handle = document.createElement('div')
                handle.className = `resize-handle resize-handle-${corner}`
                handle.dataset.corner = corner
                resizeHandles.push(handle)
                container.appendChild(handle)
            })

            let isResizing = false
            let startX = 0
            let startY = 0
            let startWidth = 0
            let startHeight = 0
            let currentCorner = ''

            const handleMouseDown = (e: MouseEvent) => {
                e.preventDefault()
                const target = e.target as HTMLElement
                currentCorner = target.dataset.corner || ''

                isResizing = true
                startX = e.clientX
                startY = e.clientY
                startWidth = img.offsetWidth
                startHeight = img.offsetHeight

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
            }

            const handleMouseMove = (e: MouseEvent) => {
                if (!isResizing) return

                const aspectRatio = startWidth / startHeight
                let newWidth = startWidth
                let newHeight = startHeight

                // Calculate resize based on corner being dragged
                if (currentCorner === 'bottom-right') {
                    const deltaX = e.clientX - startX
                    newWidth = startWidth + deltaX
                } else if (currentCorner === 'bottom-left') {
                    const deltaX = startX - e.clientX
                    newWidth = startWidth + deltaX
                } else if (currentCorner === 'top-right') {
                    const deltaX = e.clientX - startX
                    newWidth = startWidth + deltaX
                } else if (currentCorner === 'top-left') {
                    const deltaX = startX - e.clientX
                    newWidth = startWidth + deltaX
                }

                // Maintain aspect ratio
                newHeight = newWidth / aspectRatio

                // Minimum size constraint
                if (newWidth < 50) {
                    newWidth = 50
                    newHeight = 50 / aspectRatio
                }

                img.style.width = newWidth + 'px'
                img.style.height = newHeight + 'px'
            }

            const handleMouseUp = () => {
                if (!isResizing) return
                isResizing = false
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)

                const pos = getPos()
                if (typeof pos === 'number') {
                    editor.commands.updateAttributes('resizableImage', {
                        width: img.offsetWidth,
                        height: img.offsetHeight,
                    })
                }
            }

            // Add mousedown listeners to all corner handles
            resizeHandles.forEach(handle => {
                handle.addEventListener('mousedown', handleMouseDown)
            })

            // Float controls
            const floatControls = document.createElement('div')
            floatControls.className = 'float-controls'
            floatControls.innerHTML = `
        <button class="float-btn" data-float="left" title="Float Left">←</button>
        <button class="float-btn" data-float="none" title="No Float">○</button>
        <button class="float-btn" data-float="right" title="Float Right">→</button>
        <button class="float-btn" data-action="delete" title="Remove" style="background-color: #ef4444; border-color: #ffffff;">×</button>
      `

            floatControls.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                if (target.classList.contains('float-btn')) {
                    const floatValue = target.getAttribute('data-float')
                    const action = target.getAttribute('data-action')

                    if (action === 'delete') {
                        editor.commands.deleteSelection()
                        return
                    }

                    const pos = getPos()
                    if (typeof pos === 'number') {
                        editor.commands.updateAttributes('resizableImage', {
                            float: floatValue === 'none' ? null : floatValue,
                        })
                    }
                }
            })

            container.appendChild(img)
            container.appendChild(floatControls)

            return {
                dom: container,
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'resizableImage') return false

                    img.src = updatedNode.attrs.src
                    if (updatedNode.attrs.width) img.style.width = updatedNode.attrs.width + 'px'
                    if (updatedNode.attrs.height) img.style.height = updatedNode.attrs.height + 'px'

                    if (updatedNode.attrs.float) {
                        container.style.float = updatedNode.attrs.float
                        container.style.margin = updatedNode.attrs.float === 'left' ? '0 1rem 1rem 0' : '0 0 1rem 1rem'
                    } else {
                        container.style.float = 'none'
                        container.style.margin = '0'
                    }

                    return true
                },
            }
        }
    },
})
