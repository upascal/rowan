import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { CustomTaskItem } from './extensions/CustomTaskItem';

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

  return (
    <div
      ref={wrapperRef}
      className={hasSections ? 'editor-wrapper kanban' : 'editor-wrapper'}
    >
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
