import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { CustomTaskItem, TaskGroupNode, TaskGroupExtension, TaskGroupMarkdownSerializer } from './extensions';

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // track whether document has any level-1 headings
  const [hasSections, setHasSections] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: false,
      }),
      TaskList.configure({
        HTMLAttributes: { class: 'task-list pl-0' },
      }),
      CustomTaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'task-item' },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing your tasks...',
      }),
      // Add the new task group extensions in the correct order
      // First register the node type
      TaskGroupNode.configure({
        priority: 1000, // High priority to ensure it's registered early
      }),
      // Then add the markdown serializer
      TaskGroupMarkdownSerializer.configure({
        priority: 900,
      }),
      // Finally add the extension that transforms the document
      TaskGroupExtension.configure({
        priority: 800,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none p-4 h-full w-full',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // post-process markdown to fix empty task items
  useEffect(() => {
    if (!editor) return;
    const originalGetMarkdown = editor.storage.markdown.getMarkdown;
    editor.storage.markdown.getMarkdown = () => {
      let md = originalGetMarkdown();
      return md.replace(/- \\\[ \\\]/g, '- [ ]');
    };
  }, [editor]);

  // detect presence of any H1 headings to toggle Kanban
  useEffect(() => {
    if (!editor) return;
    const checkSections = () => {
      let found = false;
      editor.state.doc.descendants(node => {
        if (node.type.name === 'heading' && node.attrs.level === 1) {
          found = true;
          return false;
        }
      });
      setHasSections(found);
    };

    checkSections();
    editor.on('update', checkSections);
    return () => {
      editor.off('update', checkSections);
    };
  }, [editor]);

  // Function to manually trigger wrapping headings in task groups
  const wrapHeadingsInGroups = () => {
    if (editor) {
      console.log('Manually wrapping headings in task groups')
      
      // Get all headings
      const headings = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({ node, pos })
        }
        return true
      })
      
      console.log(`Found ${headings.length} headings to wrap`)
      
      if (headings.length === 0) {
        return
      }
      
      // Create a transaction
      let { tr } = editor.state
      let modified = false
      
      // Process from end to start to avoid position shifts
      for (let i = headings.length - 1; i >= 0; i--) {
        const { node: heading, pos } = headings[i]
        
        // Check if already in a task group
        const $pos = editor.state.doc.resolve(pos)
        if ($pos.parent.type.name === 'taskGroup') {
          continue
        }
        
        // Find content end
        const level = heading.attrs.level
        let endPos = editor.state.doc.nodeSize - 2
        
        for (let j = i + 1; j < headings.length; j++) {
          if (headings[j].node.attrs.level <= level) {
            endPos = headings[j].pos
            break
          }
        }
        
        // Skip if there's no content after the heading
        if (endPos <= pos + heading.nodeSize) {
          continue
        }
        
        // Create task group
        const contentSlice = editor.state.doc.slice(pos, endPos)
        const taskGroupType = editor.schema.nodes.taskGroup
        
        if (taskGroupType) {
          tr = tr
            .delete(pos, endPos)
            .insert(
              pos,
              taskGroupType.create({ level }, contentSlice.content)
            )
          modified = true
        }
      }
      
      if (modified) {
        editor.view.dispatch(tr)
      }
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={hasSections ? 'editor-wrapper kanban' : 'editor-wrapper'}
    >
      <div className="editor-tools mb-2">
        <button 
          onClick={wrapHeadingsInGroups}
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Group Headings
        </button>
      </div>
      <div className="editor-scroll-container h-full w-full overflow-auto">
        <EditorContent
          editor={editor}
          className="w-full border rounded shadow-inner transition-colors"
        />
      </div>
    </div>
  );
};

export default TiptapEditor;
