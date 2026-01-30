import Youtube from '@tiptap/extension-youtube'
import { mergeAttributes } from '@tiptap/core'

export const ResizableYoutube = Youtube.extend({
    name: 'resizableYoutube',

    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: 640,
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes => {
                    return { width: attributes.width }
                },
            },
            height: {
                default: 360,
                parseHTML: element => element.getAttribute('height'),
                renderHTML: attributes => {
                    return { height: attributes.height }
                },
            },
            float: {
                default: null,
                parseHTML: element => element.getAttribute('data-float'),
                renderHTML: attributes => {
                    if (!attributes.float) return {}
                    return { 'data-float': attributes.float }
                },
            },
        }
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const container = document.createElement('div')
            container.className = 'youtube-resizer-container'
            container.contentEditable = 'false'

            const wrapper = document.createElement('div')
            wrapper.className = 'youtube-wrapper'

            const iframe = document.createElement('iframe')
            iframe.src = node.attrs.src
            iframe.frameBorder = '0'
            iframe.allowFullscreen = true
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'

            if (node.attrs.width) wrapper.style.width = node.attrs.width + 'px'
            if (node.attrs.height) wrapper.style.height = node.attrs.height + 'px'
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
            let startWidth = 0
            let currentCorner = ''

            const handleMouseDown = (e: MouseEvent) => {
                e.preventDefault()
                const target = e.target as HTMLElement
                currentCorner = target.dataset.corner || ''

                isResizing = true
                startX = e.clientX
                startWidth = wrapper.offsetWidth
                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
            }

            const handleMouseMove = (e: MouseEvent) => {
                if (!isResizing) return

                let newWidth = startWidth

                // Calculate resize based on corner being dragged
                if (currentCorner === 'bottom-right' || currentCorner === 'top-right') {
                    const deltaX = e.clientX - startX
                    newWidth = startWidth + deltaX
                } else if (currentCorner === 'bottom-left' || currentCorner === 'top-left') {
                    const deltaX = startX - e.clientX
                    newWidth = startWidth + deltaX
                }

                // Maintain 16:9 aspect ratio
                const newHeight = (newWidth / 16) * 9

                // Minimum size constraint
                if (newWidth < 200) {
                    newWidth = 200
                }

                wrapper.style.width = newWidth + 'px'
                wrapper.style.height = newHeight + 'px'
            }

            const handleMouseUp = () => {
                if (!isResizing) return
                isResizing = false
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)

                const pos = getPos()
                if (typeof pos === 'number') {
                    editor.commands.updateAttributes('resizableYoutube', {
                        width: wrapper.offsetWidth,
                        height: wrapper.offsetHeight,
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
                        editor.commands.updateAttributes('resizableYoutube', {
                            float: floatValue === 'none' ? null : floatValue,
                        })
                    }
                }
            })

            wrapper.appendChild(iframe)
            container.appendChild(wrapper)
            container.appendChild(floatControls)

            return {
                dom: container,
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'resizableYoutube') return false

                    iframe.src = updatedNode.attrs.src
                    if (updatedNode.attrs.width) wrapper.style.width = updatedNode.attrs.width + 'px'
                    if (updatedNode.attrs.height) wrapper.style.height = updatedNode.attrs.height + 'px'

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
