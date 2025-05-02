/** @refresh reset */
import React from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { EditorView } from 'prosemirror-view';

const dropPluginKey = new PluginKey<DecorationSet>('dragAndDrop');

// Create a Tiptap extension for drag and drop
export const DragAndDropExtension = Extension.create({
  name: 'dragAndDrop',

  addProseMirrorPlugins() {
    console.log('DragAndDropExtension: Adding ProseMirror plugins');
    
    const plugin = new Plugin({
      key: dropPluginKey,
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, old, oldState, newState) {
          const meta = tr.getMeta(dropPluginKey);
          if (meta && meta.decorations !== undefined) {
            return meta.decorations;
          }
          return old.map(tr.mapping, newState.doc);
        }
      },
      props: {
        decorations(state) {
          const decos = dropPluginKey.get(state) as DecorationSet | undefined;
          return decos ?? DecorationSet.empty;
        }
      },
      view: (view) => {
        console.log('DragAndDropExtension: Plugin view created');
        
        // Initial setup - add event listeners
        setTimeout(() => {
          console.log('DragAndDropExtension: Initial setup - adding event listeners');
          addDragEventListeners(view);
        }, 500);
        
        return {
          update: (view, prevState) => {
            console.log('DragAndDropExtension: Plugin view updated');
            // Update event listeners
            setTimeout(() => {
              console.log('DragAndDropExtension: Updating event listeners');
              addDragEventListeners(view);
            }, 500);
          },
          destroy: () => {
            console.log('DragAndDropExtension: Plugin view destroyed');
            // Clean up event listeners
            removeDragEventListeners();
          },
        };
      },
    });

    return [plugin];
  },
});

// Function to add drag event listeners to DOM elements
function addDragEventListeners(view: EditorView) {
  console.log('addDragEventListeners: Starting to add event listeners');
  
  // Remove existing event listeners first
  removeDragEventListeners();
  
  // Add event listeners to headings
  const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3');
  console.log('addDragEventListeners: Found headings:', headings.length);
  
  headings.forEach((heading) => {
    const headingElement = heading as HTMLElement;
    
    // Add mousedown event listener
    headingElement.addEventListener('mousedown', handleHeadingMouseDown);
    
    // Store the view on the element for later use
    (headingElement as any).__editorView = view;
  });
  
  // Add event listeners to task items
  const taskItems = document.querySelectorAll('.ProseMirror li[data-type="taskItem"], .ProseMirror li.task-item');
  console.log('addDragEventListeners: Found task items:', taskItems.length);
  
  taskItems.forEach((taskItem) => {
    const taskElement = taskItem as HTMLElement;
    
    // Add mousedown event listener
    taskElement.addEventListener('mousedown', handleTaskItemMouseDown);
    
    // Store the view on the element for later use
    (taskElement as any).__editorView = view;
  });
}

// Function to remove drag event listeners
function removeDragEventListeners() {
  // Remove event listeners from headings
  const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3');
  
  headings.forEach((heading) => {
    const headingElement = heading as HTMLElement;
    
    // Remove mousedown event listener
    headingElement.removeEventListener('mousedown', handleHeadingMouseDown);
  });
  
  // Remove event listeners from task items
  const taskItems = document.querySelectorAll('.ProseMirror li[data-type="taskItem"], .ProseMirror li.task-item');
  
  taskItems.forEach((taskItem) => {
    const taskElement = taskItem as HTMLElement;
    
    // Remove mousedown event listener
    taskElement.removeEventListener('mousedown', handleTaskItemMouseDown);
  });
  
  // Remove global event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

function handleHeadingMouseDown(e: MouseEvent) {
  // Only handle mousedown on the drag handle (::before pseudo-element)
  const headingElement = e.currentTarget as HTMLElement;
  const rect = headingElement.getBoundingClientRect();

  // Check if the click is within the drag handle area (first 20px)
  if (e.clientX - rect.left > 20) {
    return;
  }

  e.preventDefault();

  // Get the editor view
  const view = (headingElement as any).__editorView as EditorView;
  if (!view) return;

  // Find the position of this heading
  const headingPos = findNodePosition(view, headingElement);
  if (headingPos === null) return;

  // Create a ghost element for dragging
  const ghost = headingElement.cloneNode(true) as HTMLElement;
  ghost.style.position = 'absolute';
  ghost.style.pointerEvents = 'none';
  ghost.style.left = `${rect.left + window.scrollX}px`;
  ghost.style.top = `${rect.top + window.scrollY}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.zIndex = '9999';
  ghost.style.opacity = '0.8';
  ghost.classList.add('drag-ghost');
  document.body.appendChild(ghost);

  // Store drag data
  const dragData = {
    type: 'heading',
    element: headingElement,
    startPos: headingPos,
    view: view,
    initialMouse: { x: e.clientX, y: e.clientY },
    origin: { left: rect.left + window.scrollX, top: rect.top + window.scrollY },
    ghost,
  };

  // Store drag data globally
  (window as any).__dragData = dragData;

  // Add dragging class
  headingElement.classList.add('is-dragging');

  // Set up global drag events
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleTaskItemMouseDown(e: MouseEvent) {
  // Only handle mousedown on the drag handle (::before pseudo-element)
  const taskElement = e.currentTarget as HTMLElement;
  const rect = taskElement.getBoundingClientRect();

  // Check if the click is within the drag handle area (first 20px)
  if (e.clientX - rect.left > 20) {
    return;
  }

  e.preventDefault();

  // Get the editor view
  const view = (taskElement as any).__editorView as EditorView;
  if (!view) return;

  // Check if this task has subtasks
  const hasChildren = taskElement.querySelector('ul') !== null;

  // Find the position of this task item
  const taskPos = findNodePosition(view, taskElement);
  if (taskPos === null) return;

  // Create a ghost element for dragging
  const ghost = taskElement.cloneNode(true) as HTMLElement;
  ghost.style.position = 'absolute';
  ghost.style.pointerEvents = 'none';
  ghost.style.left = `${rect.left + window.scrollX}px`;
  ghost.style.top = `${rect.top + window.scrollY}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.zIndex = '9999';
  ghost.style.opacity = '0.8';
  ghost.classList.add('drag-ghost');
  document.body.appendChild(ghost);

  // Store drag data
  const dragData = {
    type: 'taskItem',
    element: taskElement,
    startPos: taskPos,
    hasChildren: hasChildren,
    view: view,
    initialMouse: { x: e.clientX, y: e.clientY },
    origin: { left: rect.left + window.scrollX, top: rect.top + window.scrollY },
    ghost,
  };

  // Store drag data globally
  (window as any).__dragData = dragData;

  // Add dragging class
  taskElement.classList.add('is-dragging');

  // Set up global drag events
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  const dragData = (window as any).__dragData;
  if (!dragData) return;

  const { ghost, initialMouse, origin, view } = dragData;
  if (!ghost || !view) return;

  // Move ghost element visually
  const dx = e.clientX - initialMouse.x;
  const dy = e.clientY - initialMouse.y;
  ghost.style.left = `${origin.left + dx}px`;
  ghost.style.top = `${origin.top + dy}px`;

  // Remove previous placeholder
  view.dispatch(view.state.tr.setMeta(dropPluginKey, { decorations: DecorationSet.empty }));

  // Calculate drop position in the document
  const coords = view.posAtCoords({ x: e.clientX, y: e.clientY });
  if (coords && typeof coords.pos === 'number') {
    const deco = Decoration.widget(coords.pos, () => {
      const el = document.createElement('div');
      el.style.width = '100%';
      el.style.height = '2px';
      el.style.backgroundColor = '#4299e1';
      el.style.margin = '0.5rem 0';
      return el;
    });
    const decorations = DecorationSet.create(view.state.doc, [deco]);
    const tr = view.state.tr.setMeta(dropPluginKey, { decorations });
    view.dispatch(tr);
  }

  e.preventDefault();
}

function handleMouseUp(e: MouseEvent) {
  const dragData = (window as any).__dragData;
  if (!dragData) return;

  const { type, element, startPos, hasChildren, view, ghost } = dragData;

  // Clear drop placeholder decoration
  view.dispatch(view.state.tr.setMeta(dropPluginKey, { decorations: DecorationSet.empty }));

  // Find the element under the cursor
  const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

  // Find a valid drop target
  let dropTarget = null;

  for (const el of elementsUnderCursor) {
    if (type === 'heading' && (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3')) {
      dropTarget = el;
      break;
    } else if (type === 'taskItem' && el.matches('li[data-type="taskItem"], li.task-item')) {
      dropTarget = el;
      break;
    }
  }

  if (dropTarget && dropTarget !== element) {
    // Find the position of the drop target
    const dropPos = findNodePosition(view, dropTarget as HTMLElement);

    if (dropPos !== null) {
      // Create a transaction to move the node
      const tr = view.state.tr;

      if (type === 'heading') {
        // Find the range of content that belongs to this heading
        const endPos = findNextHeadingPosition(view, startPos) || view.state.doc.content.size;

        // Get the content to move
        const contentToMove = view.state.doc.slice(startPos, endPos);

        // Delete the original content
        tr.delete(startPos, endPos);

        // Calculate the new position after deletion
        const newDropPos = dropPos > startPos ? dropPos - (endPos - startPos) : dropPos;

        // Insert at the new position
        tr.insert(newDropPos, contentToMove.content);
      } else if (type === 'taskItem') {
        if (hasChildren) {
          // Find the range of the task and its subtasks
          let endPos = startPos;
          const node = view.state.doc.nodeAt(startPos);

          if (node) {
            endPos = startPos + node.nodeSize;
          }

          // Get the content to move
          const contentToMove = view.state.doc.slice(startPos, endPos);

          // Delete the original content
          tr.delete(startPos, endPos);

          // Calculate the new position after deletion
          const newDropPos = dropPos > startPos ? dropPos - (endPos - startPos) : dropPos;

          // Insert at the new position
          tr.insert(newDropPos, contentToMove.content);
        } else {
          // Simple move for a single task
          const node = view.state.doc.nodeAt(startPos);

          if (node) {
            tr.delete(startPos, startPos + node.nodeSize);

            // Calculate the new position after deletion
            const newDropPos = dropPos > startPos ? dropPos - node.nodeSize : dropPos;

            tr.insert(newDropPos, node);
          }
        }
      }

      // Dispatch the transaction
      view.dispatch(tr);
    }
  }

  // Remove ghost element if present
  if (ghost && ghost.parentNode) {
    ghost.parentNode.removeChild(ghost);
  }

  // Remove dragging class
  element.classList.remove('is-dragging');

  // Clean up
  (window as any).__dragData = null;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

// Helper function to find the position of a DOM node in the ProseMirror document
function findNodePosition(view: EditorView, domNode: HTMLElement): number | null {
  try {
    const pos = view.posAtDOM(domNode, 0);
    return pos >= 0 ? pos : null;
  } catch (e) {
    console.error('Error finding node position:', e);
    return null;
  }
}

// Helper function to find the position of the next heading
function findNextHeadingPosition(view: EditorView, startPos: number): number | null {
  const { doc } = view.state;
  let result: number | null = null;
  
  doc.nodesBetween(startPos + 1, doc.content.size, (node, pos) => {
    if (node.type.name === 'heading' && result === null) {
      result = pos;
      return false;
    }
    return true;
  });
  
  return result;
}

// DragAndDrop Provider Component
export const DragAndDropProvider: React.FC<{
  editor: any;
  children: React.ReactNode;
}> = ({ editor, children }) => {
  // We're using native drag and drop, so this is just a wrapper
  return <>{children}</>;
};
