import { useState, useEffect, useCallback } from 'react';
import { Projects, DEFAULT_PROJECT_TEMPLATE } from '../models/project';
import { loadProjects, saveProjects } from '../services/localStorage';

// Initial default project if local storage is empty
const initialDefaultProjectName = "Default Project";
const initialDefaultProjects: Projects = {
  [initialDefaultProjectName]: DEFAULT_PROJECT_TEMPLATE(initialDefaultProjectName)
};

export function useProjects() {
  // State for projects, selected project, and new project input
  const [projects, setProjects] = useState<Projects>({});
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>("");

  // Load projects from local storage on initial mount
  useEffect(() => {
    const storedProjects = loadProjects();
    if (storedProjects) {
      setProjects(storedProjects);
      // Select the first project by default if available
      const projectNames = Object.keys(storedProjects);
      if (projectNames.length > 0) {
        setSelectedProject(projectNames[0]);
      } else {
        // If storage is empty object, initialize with default
        setProjects(initialDefaultProjects);
        setSelectedProject(initialDefaultProjectName);
      }
    } else {
      // Initialize with default if nothing in storage
      setProjects(initialDefaultProjects);
      setSelectedProject(initialDefaultProjectName);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save projects to local storage whenever the projects state changes
  useEffect(() => {
    // Don't save the initial empty object before loading finishes
    if (Object.keys(projects).length > 0) {
      saveProjects(projects);
    }
  }, [projects]);

  // Handle saving content for the selected project
  const handleSaveContent = useCallback((markdownContent: string) => {
    if (selectedProject) {
      setProjects(prevProjects => ({
        ...prevProjects,
        [selectedProject]: markdownContent,
      }));
    }
  }, [selectedProject]);

  // Handle selecting a project
  const handleSelectProject = useCallback((projectName: string) => {
    setSelectedProject(projectName);
  }, []);

  // Handle creating a new project
  const handleCreateProject = useCallback(() => {
    const trimmedName = newProjectName.trim();
    if (trimmedName && !projects[trimmedName]) { // Check if name is valid and not duplicate
      const newContent = DEFAULT_PROJECT_TEMPLATE(trimmedName);
      setProjects(prevProjects => ({
        ...prevProjects,
        [trimmedName]: newContent,
      }));
      setSelectedProject(trimmedName);
      setNewProjectName(""); // Clear input field
    } else if (projects[trimmedName]) {
      alert(`Project "${trimmedName}" already exists!`);
    } else {
      alert("Please enter a valid project name.");
    }
  }, [newProjectName, projects]);

  // Handle deleting a project
  const handleDeleteProject = useCallback((projectName: string) => {
    setProjects(prevProjects => {
      const updatedProjects = { ...prevProjects };
      delete updatedProjects[projectName];
      return updatedProjects;
    });

    // Select a different project if the deleted one was active
    if (selectedProject === projectName) {
      const remainingProjectNames = Object.keys(projects).filter(p => p !== projectName);
      if (remainingProjectNames.length > 0) {
        setSelectedProject(remainingProjectNames[0]); // Select the first remaining
      } else {
        setSelectedProject(null); // No projects left
      }
    }
  }, [selectedProject, projects]);

  // Get the content for the selected project
  const currentProjectContent = selectedProject ? projects[selectedProject] ?? '' : '';

  return {
    projects,
    selectedProject,
    newProjectName,
    currentProjectContent,
    setNewProjectName,
    handleSaveContent,
    handleSelectProject,
    handleCreateProject,
    handleDeleteProject
  };
}
