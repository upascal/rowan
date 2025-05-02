import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import TaskGroupComponent from '../TaskGroupComponent'

export const TaskGroupNode = Node.create({
  name: 'taskGroup',
  
  group: 'block',
  
  content: 'heading block*',
  
  defining: true,
  
  // Add level attribute to store the heading level
  addAttributes() {
    return {
      level: {
        default: 1,
        parseHTML: element => {
          const heading = element.querySelector('h1, h2, h3')
          if (heading) {
            return parseInt(heading.tagName.substring(1), 10)
          }
          return 1
        },
        renderHTML: attributes => {
          return {
            'data-level': attributes.level,
          }
        },
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="task-group"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(
        HTMLAttributes, 
        { 
          'data-type': 'task-group',
          'class': `task-group task-group-level-${HTMLAttributes.level || 1}`
        }
      ), 
      0
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(TaskGroupComponent)
  },
})
