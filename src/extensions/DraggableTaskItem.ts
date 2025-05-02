// src/extensions/DraggableTaskItem.ts
import TaskItem from '@tiptap/extension-task-item';

export const DraggableTaskItem = TaskItem.extend({
  // Turn on ProseMirror's native drag support for this node type
  draggable: true,
});
