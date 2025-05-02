import React from 'react';
import { TiptapEditor } from './components/editor';
import { ProjectSidebar } from './components/sidebar';
import { useProjects } from './hooks/useProjects';
import { useEditor } from './hooks/useEditor';
import { ViewMode } from './models/project';

function App() {
  // Use custom hooks for state management
  const {
    projects,
    selectedProject,
    newProjectName,
    currentProjectContent,
    setNewProjectName,
    handleSaveContent,
    handleSelectProject,
    handleCreateProject,
    handleDeleteProject
  } = useProjects();

  const { viewMode, setViewModeDirectly } = useEditor();

  return (
    <div className="app-container transition-colors">
      {/* Sidebar */}
      <ProjectSidebar
        projects={Object.keys(projects)} // Pass only names
        selectedProject={selectedProject}
        newProjectName={newProjectName}
        onNewProjectNameChange={setNewProjectName}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header: Project Name & Toggle Button */}
        <div className="project-header">
          <h1 className="text-xl font-semibold">
            {selectedProject || "No Project Selected"}
          </h1>

          <div className="segmented-control" aria-label="View mode selection">
            <button
              onClick={() => setViewModeDirectly('raw')}
              className={`segmented-control-option ${viewMode === 'raw' ? 'active' : ''}`}
              disabled={!selectedProject}
              aria-pressed={viewMode === 'raw'}
              title="Markdown View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 5H21M3 9H21M3 13H21M3 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="sr-only">Markdown</span>
            </button>
            <button
              onClick={() => setViewModeDirectly('wysiwyg')}
              className={`segmented-control-option ${viewMode === 'wysiwyg' ? 'active' : ''}`}
              disabled={!selectedProject}
              aria-pressed={viewMode === 'wysiwyg'}
              title="Kanban View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="3" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="10" y="3" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="17" y="3" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="sr-only">Kanban</span>
            </button>
          </div>
        </div>

        {/* Editor Pane (Conditional on Project Selection) */}
        <div className="editor-container">
          {selectedProject ? (
            viewMode === 'wysiwyg' ? (
              <TiptapEditor
                // Use key to force re-render when project changes
                key={selectedProject}
                content={currentProjectContent}
                onChange={handleSaveContent}
                placeholder="Enter your tasks in Markdown..."
              />
            ) : (
              // Raw Markdown View
              <textarea
                key={selectedProject + "-raw"} // Key to force re-render
                id="raw-markdown-editor"
                name="raw-markdown-editor"
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                value={currentProjectContent}
                onChange={(e) => handleSaveContent(e.target.value)}
                placeholder="# Enter Raw Markdown..."
                spellCheck="false"
              />
            )
          ) : (
            <div className="empty-message">
              Select a project from the sidebar or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
