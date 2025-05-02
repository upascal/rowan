import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
 // import { Markdown } from 'tiptap-markdown'; // Import the markdown extension
import './TiptapEditor.css'; // We'll create this for styling
 // 
interface TiptapEditorProps {
  content: string; // Expect markdown content
  onChange: (newContent: string) => void; // Will provide markdown content
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      // Markdown.configure({ html: true, tightLists: true, tightListClass: 'tight', bulletListMarker: '-', linkify: true, breaks: false }),
      TaskList.configure({ HTMLAttributes: { class: 'task-list pl-0' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-item' } }),
      Placeholder.configure({ placeholder: placeholder || 'Start typing your tasks...' }),
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

  // If editor isn't ready yet, show a loading state
  if (!editor) {
    return <div className="h-full w-full overflow-auto border rounded shadow-inner p-4">Loading editor...</div>;
  }

  // Render the editor content area wrapped in our DragAndDropProvider
  return (
      <EditorContent editor={editor} className="h-full w-full overflow-auto border rounded shadow-inner" />
  );
};

export default TiptapEditor;
