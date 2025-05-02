import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown'; // Import the markdown extension
import './TiptapEditor.css'; // We'll create this for styling

interface TiptapEditorProps {
  content: string; // Expect markdown content
  onChange: (newContent: string) => void; // Will provide markdown content
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit options if needed
        // Exclude extensions if they conflict or are not needed
        heading: {
          levels: [1, 2, 3], // Allow H1, H2, H3
        },
        // Keep other defaults like paragraphs, bold, italic, etc.
      }),
      Markdown.configure({
        html: true, // Allow HTML input/output? Set to false if only markdown needed
        tightLists: true, // No <p> inside <li> in markdown output
        tightListClass: 'tight', // Class for tight lists
        bulletListMarker: '-', // Or '*'
        linkify: true, // Auto-detect links
        breaks: false, // Add <br> for single newlines?
        // transformPastedText: true, // Transform pasted text to markdown
        // transformCopiedText: true, // Transform copied text to markdown
      }),
      TaskList.configure({
        // TaskList configuration if needed
        HTMLAttributes: {
          class: 'task-list pl-0', // Add class for styling, remove padding
        },
      }),
      TaskItem.configure({
        nested: true, // Allow nested task items
        HTMLAttributes: {
          // Simplified class to avoid potential conflicts
          class: 'task-item',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing your tasks...',
      }),
    ],
    content: content, // Set initial content
    editorProps: {
      attributes: {
        // Removed Tailwind's typography plugin classes as they may conflict with task list styling
        class: 'focus:outline-none p-4 h-full w-full',
      },
    },
    onUpdate: ({ editor }) => {
      // When the editor content changes, call the onChange prop
      // Use the markdown extension to get the markdown content
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // Render the editor content area
  return (
    <EditorContent editor={editor} className="h-full w-full overflow-auto border rounded shadow-inner" />
  );
};

export default TiptapEditor;
