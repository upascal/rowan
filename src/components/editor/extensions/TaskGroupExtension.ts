import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findChildren } from '@tiptap/core'

export const TaskGroupExtension = Extension.create({
  name: 'taskGroupExtension',

  // Set a very high priority to ensure it runs before other extensions
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskGroupExtension'),
        
        // Run on every state update
        appendTransaction: (transactions, oldState, newState) => {
          // Skip if there are no transactions
          if (!transactions.some(transaction => transaction.docChanged)) {
            return null
          }

          console.log('TaskGroupExtension: Processing document changes')

          // Get the current document and transaction
          const { tr, doc } = newState
          let modified = false

          try {
            // Find all headings in the document
            const headings = findChildren(doc, node => node.type.name === 'heading')
            console.log(`TaskGroupExtension: Found ${headings.length} headings`)
            
            // Check if taskGroup node type exists in schema
            const schema = newState.schema
            const taskGroupType = schema.nodes.taskGroup
            
            if (!taskGroupType) {
              console.error('TaskGroupExtension: taskGroup node type not found in schema')
              console.log('Available node types:', Object.keys(schema.nodes).join(', '))
              return null
            }
            
            console.log('TaskGroupExtension: taskGroup node type found in schema')

            // Process each heading from the end to avoid position shifts
            for (let i = headings.length - 1; i >= 0; i--) {
              const heading = headings[i]
              
              // Check if this heading is already inside a taskGroup
              const pos = heading.pos
              const $pos = doc.resolve(pos)
              const parentType = $pos.parent.type.name
              
              console.log(`TaskGroupExtension: Heading at pos ${pos}, parent type: ${parentType}`)
              
              if (parentType === 'taskGroup') {
                console.log('TaskGroupExtension: Heading already in a taskGroup, skipping')
                continue
              }

              // Determine the end position of this heading's content
              const currentLevel = heading.node.attrs.level
              let endPos = doc.nodeSize - 2 // Default to end of document

              // Find the next heading of same or higher level
              for (let j = i + 1; j < headings.length; j++) {
                const nextHeading = headings[j]
                if (nextHeading.node.attrs.level <= currentLevel) {
                  endPos = nextHeading.pos
                  break
                }
              }

              console.log(`TaskGroupExtension: Heading level ${currentLevel}, content ends at ${endPos}`)

              // Skip if there's no content after the heading
              if (endPos <= pos + heading.node.nodeSize) {
                console.log('TaskGroupExtension: No content after heading, skipping')
                continue
              }

              // Create a slice of content from heading to endPos
              const contentSlice = doc.slice(heading.pos, endPos)
              console.log(`TaskGroupExtension: Content slice has ${contentSlice.content.childCount} children`)
              
              // Log the content of the slice for debugging
              const contentTypes = []
              contentSlice.content.forEach(node => {
                contentTypes.push(node.type.name)
              })
              console.log('TaskGroupExtension: Content types:', contentTypes.join(', '))

              try {
                // Delete the original content
                tr.delete(heading.pos, endPos)
                
                // Insert the new taskGroup node
                tr.insert(
                  heading.pos,
                  taskGroupType.create(
                    { level: currentLevel }, 
                    contentSlice.content
                  )
                )
                
                console.log(`TaskGroupExtension: Successfully wrapped heading in taskGroup`)
                modified = true
              } catch (error) {
                console.error('TaskGroupExtension: Error transforming document', error)
                console.error(error)
              }
            }
          } catch (error) {
            console.error('TaskGroupExtension: Unexpected error', error)
          }

          return modified ? tr : null
        },
        
        // Add view plugin to observe DOM changes
        view: () => {
          return {
            update: (view) => {
              // Log the document structure after each update
              console.log('Current document structure:')
              view.state.doc.forEach((node, offset) => {
                console.log(`Node at ${offset}: ${node.type.name}`, node.attrs)
              })
            }
          }
        }
      }),
    ]
  },
  
  // Add commands to manually wrap headings
  addCommands() {
    return {
      wrapHeadingsInTaskGroups: () => ({ editor }) => {
        console.log('Manually wrapping headings in task groups')
        
        const { doc, schema, tr } = editor.state
        let transaction = tr
        let modified = false
        
        // Find all headings
        const headings = []
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            headings.push({ node, pos })
          }
          return true
        })
        
        console.log(`Found ${headings.length} headings to wrap`)
        
        // Process from end to start to avoid position shifts
        for (let i = headings.length - 1; i >= 0; i--) {
          const { node: heading, pos } = headings[i]
          
          // Check if already in a task group
          const $pos = doc.resolve(pos)
          if ($pos.parent.type.name === 'taskGroup') {
            continue
          }
          
          // Find content end
          const level = heading.attrs.level
          let endPos = doc.nodeSize - 2
          
          for (let j = i + 1; j < headings.length; j++) {
            if (headings[j].node.attrs.level <= level) {
              endPos = headings[j].pos
              break
            }
          }
          
          // Create task group
          const contentSlice = doc.slice(pos, endPos)
          const taskGroupType = schema.nodes.taskGroup
          
          if (taskGroupType) {
            transaction = transaction
              .delete(pos, endPos)
              .insert(
                pos,
                taskGroupType.create({ level }, contentSlice.content)
              )
            modified = true
          }
        }
        
        if (modified) {
          return editor.view.dispatch(transaction)
        }
        
        return false
      }
    }
  }
})
