import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ProjectSidebarProps {
  projects: string[]; // Array of project names
  selectedProject: string | null;
  newProjectName: string;
  onNewProjectNameChange: (name: string) => void;
  onCreateProject: () => void;
  onSelectProject: (name: string) => void;
  onDeleteProject: (name: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  selectedProject,
  newProjectName,
  onNewProjectNameChange,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}) => {
  // Removed confirmingDelete state

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onCreateProject();
    }
  };

  // Removed handleDeleteClick, handleProjectSelect (related to confirmation), handleMouseLeave

  return (
    <div className="project-sidebar">
      <h2 className="text-lg font-semibold mb-3">Projects</h2>
      <div className="new-project-input-container">
        <input
          type="text"
          id="new-project-name"
          name="new-project-name"
          value={newProjectName}
          onChange={(e) => onNewProjectNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Create New Project..."
          className="new-project-input"
        />
        {newProjectName.trim() !== "" && (
          <button 
            onClick={onCreateProject}
            className="new-project-submit-btn"
            title="Create Project"
            aria-label="Create Project"
          >
            ↵
          </button>
        )}
      </div>
      <ul className="project-list">
        {projects.map((projectName) => (
          <li
            key={projectName}
            onClick={() => onSelectProject(projectName)} // Simplified onClick
            // Removed onMouseLeave
            className={`${selectedProject === projectName ? 'selected' : ''}`}
          >
            <span className="truncate flex-grow mr-2">{projectName}</span>

            {/* Radix Alert Dialog for Delete Confirmation */}
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()} // Prevent li onClick
                  className="delete-button"
                  title="Delete Project"
                >
                  X
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="alert-dialog-overlay" />
                <AlertDialog.Content className="alert-dialog-content">
                  <AlertDialog.Title className="alert-dialog-title">
                    Are you sure?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="alert-dialog-description">
                    This action cannot be undone. This will permanently delete the project "{projectName}".
                  </AlertDialog.Description>
                  <div style={{ display: 'flex', gap: 25, justifyContent: 'flex-end' }}>
                    <AlertDialog.Cancel asChild>
                      <button className="button mauve">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        className="button red"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent li onClick just in case
                          onDeleteProject(projectName);
                        }}
                      >
                        Yes, delete project
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectSidebar;
