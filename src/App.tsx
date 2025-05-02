import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
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

          {/* Radix Toggle Group for View Mode */}
          <ToggleGroup.Root
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewModeDirectly(value as ViewMode);
            }}
            aria-label="View mode selection"
            className="segmented-control" // Reuse existing class for styling
            disabled={!selectedProject}
          >
            <ToggleGroup.Item
              value="raw"
              className="segmented-control-option" // Reuse existing class
              aria-label="Markdown View"
              title="Markdown View"
              disabled={!selectedProject}
            >
              <svg width="28" height="28" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="60" y="134" width="41" height="41" rx="5" transform="rotate(90 60 134)" stroke="currentColor" strokeWidth="10"/>
                <rect x="60" y="74" width="41" height="41" rx="5" transform="rotate(90 60 74)" stroke="currentColor" strokeWidth="10"/>
                <rect x="60" y="14" width="41" height="41" rx="5" transform="rotate(90 60 14)" stroke="currentColor" strokeWidth="10"/>
                <rect width="20" height="109" rx="4" transform="matrix(1.25383e-07 1 1 -1.37149e-07 78 144)" fill="currentColor"/>
                <rect width="20" height="109" rx="4" transform="matrix(1.25383e-07 1 1 -1.37149e-07 78 84)" fill="currentColor"/>
                <path d="M78 40L78 28C78 25.7909 79.7909 24 82 24L183 24C185.209 24 187 25.7908 187 28L187 40C187 42.2091 185.209 44 183 44L82 44C79.7909 44 78 42.2092 78 40Z" fill="currentColor"/>
              </svg>
              <span className="sr-only">Markdown</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="wysiwyg"
              className="segmented-control-option" // Reuse existing class
              aria-label="Kanban View"
              title="Kanban View"
              disabled={!selectedProject}
            >
              <svg width="28" height="28" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="19" y="52" width="41" height="99" rx="5" stroke="currentColor" strokeWidth="10"/>
                <rect x="79" y="52" width="41" height="127" rx="5" stroke="currentColor" strokeWidth="10"/>
                <rect x="139" y="52" width="41" height="64" rx="5" stroke="currentColor" strokeWidth="10"/>
                <rect width="51" height="20" rx="4" transform="matrix(1 0 0 -1 14 36)" fill="currentColor"/>
                <rect width="51" height="20" rx="4" transform="matrix(1 0 0 -1 74 36)" fill="currentColor"/>
                <rect width="51" height="20" rx="4" transform="matrix(1 0 0 -1 134 36)" fill="currentColor"/>
              </svg>
              <span className="sr-only">Kanban</span>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
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
