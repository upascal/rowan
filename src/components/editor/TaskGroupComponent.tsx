import React, { useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

interface TaskGroupComponentProps {
  node: any;
  editor: any;
  getPos: () => number;
}

const TaskGroupComponent: React.FC<TaskGroupComponentProps> = ({ node, editor }) => {
  // Get the level from the node's attributes or from the first child heading
  const level = node.attrs.level || node.content.firstChild?.attrs.level || 1
  
  // Log for debugging
  useEffect(() => {
    console.log('TaskGroupComponent: Rendering task group', { 
      level, 
      nodeType: node.type.name,
      childCount: node.content.childCount,
      firstChildType: node.content.firstChild?.type.name
    })
  }, [node, level])
  
  return (
    <NodeViewWrapper className={`task-group task-group-level-${level}`} data-level={level}>
      <NodeViewContent />
    </NodeViewWrapper>
  )
}

export default TaskGroupComponent
