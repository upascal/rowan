// File: src/App.tsx
import React, { useState } from 'react'; // Removed useEffect
// Removed markdownParser import
import TiptapEditor from './components/TiptapEditor'; // Import the new editor
import './App.css';

type ViewMode = 'wysiwyg' | 'raw'; // Define view modes

// Remove generateId if no longer needed directly here (parser assigns UUIDs)
// const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [rawInput, setRawInput] = useState(
`# Big Task 1
- [ ] Task 1.1
  - [x] Subtask 1.1.1
  - [ ] Subtask 1.1.2
- [x] Task 1.2

## Subheading 1.A
- [ ] Another Task

# Big Task 2
- [ ] Task 2.1`
  ); // Updated default example with headings
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg'); // Add state for view mode

  // Tiptap handles its own input changes via the onChange prop
  const handleEditorChange = (markdownContent: string) => {
    setRawInput(markdownContent);
    // TODO: Add any necessary logic here when content changes,
    // e.g., saving to local storage, triggering other updates.
     console.log("Markdown Updated:", markdownContent); // For debugging
   };

  // Handler for the raw textarea input
  const handleRawInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
  };

  // Toggle between WYSIWYG and Raw Markdown view
  const toggleViewMode = () => {
    setViewMode(prevMode => (prevMode === 'wysiwyg' ? 'raw' : 'wysiwyg'));
  };

  // Removed handleToggleCheck, findAndUpdateTaskRecursive, serializeBlocksToMarkdown, TodoListDisplay

  // --- Main App Render ---

  return (
    <div className="flex flex-col h-screen p-4 gap-2">
      {/* Toggle Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleViewMode}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-sm"
        >
          Switch to {viewMode === 'wysiwyg' ? 'Raw Markdown' : 'WYSIWYG'} View
        </button>
      </div>

      {/* Editor Pane (Conditional) */}
      <div className="flex-grow border rounded shadow overflow-hidden"> {/* Container for the editor/textarea */}
        {viewMode === 'wysiwyg' ? (
          <TiptapEditor
            content={rawInput}
            onChange={handleEditorChange}
            placeholder="Enter your tasks in Markdown..."
          />
        ) : (
          <textarea
            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
            value={rawInput}
            onChange={handleRawInputChange}
            placeholder="# Enter Raw Markdown..."
            spellCheck="false"
          />
        )}
      </div>
    </div>
  );
}

export default App;
