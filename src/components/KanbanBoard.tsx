import React from 'react';
import ReactMarkdown from 'react-markdown';
import './KanbanBoard.css';

interface KanbanBoardProps {
  content: string;  // the raw markdown string
}

export default function KanbanBoard({ content }: KanbanBoardProps) {
  // 1. Trim and split on each top-level heading (“# ”)
  const chunks = content
    .trim()
    .split(/^#\s+/m)
    .filter(Boolean)
    .map(chunk => '# ' + chunk);  // put the “# ” back

  if (chunks.length === 0) {
    return <div className="kanban-empty">No sections to display.</div>;
  }

  return (
    <div className="kanban-board">
      {chunks.map((md, i) => (
        <div key={i} className="kanban-column">
          <ReactMarkdown>{md}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
}
