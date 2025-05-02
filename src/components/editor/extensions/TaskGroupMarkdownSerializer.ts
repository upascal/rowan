import { Extension } from '@tiptap/core'

export const TaskGroupMarkdownSerializer = Extension.create({
  name: 'taskGroupMarkdownSerializer',

  addStorage() {
    return {
      // This is a flag to indicate that the extension has been loaded
      initialized: false,
    }
  },

  onBeforeCreate() {
    console.log('TaskGroupMarkdownSerializer: Initializing')
    
    // Get the markdown serializer from the editor
    const markdownSerializer = this.editor.storage.markdown?.serializer

    if (markdownSerializer && !this.storage.initialized) {
      console.log('TaskGroupMarkdownSerializer: Adding serializer for taskGroup')
      
      // Add a custom serializer for the taskGroup node
      markdownSerializer.nodes.taskGroup = (state: any, node: any) => {
        console.log('TaskGroupMarkdownSerializer: Serializing taskGroup', node)
        
        // Just serialize the content of the taskGroup without adding any wrapper
        state.renderContent(node)
      }

      // Also ensure the serializer is registered with the editor
      this.editor.extensionManager.extensions.forEach(extension => {
        if (extension.name === 'markdown') {
          console.log('TaskGroupMarkdownSerializer: Found markdown extension')
          if (extension.storage.serializer) {
            extension.storage.serializer.nodes.taskGroup = markdownSerializer.nodes.taskGroup
          }
        }
      })

      this.storage.initialized = true
    }
  },
  
  // Make sure this runs after the document is loaded
  onUpdate() {
    if (!this.storage.initialized) {
      console.log('TaskGroupMarkdownSerializer: Initializing on update')
      
      // Get the markdown serializer from the editor
      const markdownSerializer = this.editor.storage.markdown?.serializer

      if (markdownSerializer) {
        console.log('TaskGroupMarkdownSerializer: Adding serializer for taskGroup on update')
        
        // Add a custom serializer for the taskGroup node
        markdownSerializer.nodes.taskGroup = (state: any, node: any) => {
          console.log('TaskGroupMarkdownSerializer: Serializing taskGroup', node)
          
          // Just serialize the content of the taskGroup without adding any wrapper
          state.renderContent(node)
        }

        this.storage.initialized = true
      }
    }
  }
})
