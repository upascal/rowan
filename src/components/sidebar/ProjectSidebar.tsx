import React, { useState } from 'react';

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
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onCreateProject();
    }
  };

  const handleDeleteClick = (projectName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the project when clicking delete
    if (confirmingDelete === projectName) {
      onDeleteProject(projectName);
      setConfirmingDelete(null); // Reset confirmation state
    } else {
      setConfirmingDelete(projectName); // Set this project for confirmation
    }
  };

  // Reset confirmation if clicking outside or on another project
  const handleProjectSelect = (projectName: string) => {
    setConfirmingDelete(null); // Cancel any pending delete confirmation
    onSelectProject(projectName);
  };

  // Reset confirmation if mouse leaves the list item where confirmation is pending
  const handleMouseLeave = (projectName: string) => {
     if (confirmingDelete === projectName) {
        // Optional: Automatically cancel confirmation if mouse leaves
        // setConfirmingDelete(null);
     }
  };

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
            onClick={() => handleProjectSelect(projectName)}
            onMouseLeave={() => handleMouseLeave(projectName)}
            className={`${selectedProject === projectName ? 'selected' : ''}`}
          >
            <span className="truncate flex-grow mr-2">{projectName}</span>
            <button
              onClick={(e) => handleDeleteClick(projectName, e)}
              className={`delete-button ${confirmingDelete === projectName ? 'confirming' : ''}`}
              title={confirmingDelete === projectName ? "Confirm Delete" : "Delete Project"}
            >
              {confirmingDelete === projectName ? 'Sure?' : 'X'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectSidebar;
