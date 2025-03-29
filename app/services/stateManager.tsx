import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppSettings, AppState, ProjectData } from '../types';
import { databaseService } from './databaseService';
import { writeSettings } from './fileSystem';
import { projectDataToMarkdown, parseMarkdownToProjectData } from './markdownParser';

// Create the context
const AppContext = createContext<{
  state: AppState;
  loadProject: (projectId: number) => Promise<void>;
  saveProject: () => Promise<void>;
  updateProject: (projectData: ProjectData) => Promise<void>;
  toggleTheme: () => void;
  createNewProject: (projectName: string) => Promise<void>;
  deleteProject: (id: number) => Promise<boolean>;
} | null>(null);

// Custom hook to use the app context
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

// Initial app state
const initialState: AppState = {
  projectData: null,
  settings: {
    recentProjects: [],
    theme: 'dark',
  },
  isLoading: false,
  error: null,
};

// App provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const saveTimeout = useRef<NodeJS.Timeout>();
  
  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setState(prevState => ({
          ...prevState,
          isLoading: true,
          error: null,
        }));

        // Load projects
        const projects = await databaseService.getProjects();
        
        // Update state with projects
        setState(prevState => ({
          ...prevState,
          settings: {
            ...prevState.settings,
            recentProjects: projects,
          },
        }));
        
        // Load last opened project if available
        if (projects.length > 0) {
          const projectData = await databaseService.getProjectData(projects[0].id);
          
          setState(prevState => ({
            ...prevState,
            projectData,
            isLoading: false,
            settings: {
              ...prevState.settings,
              recentProjects: [
                projectData.project,
                ...projects.slice(1),
              ],
            },
          }));
        } else {
          setState(prevState => ({
            ...prevState,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          error: 'Failed to load initial state',
        }));
      }
    };
    
    loadInitialState();
  }, []);
  
  // Load a project
  const loadProject = async (projectId: number): Promise<void> => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));
    
    try {
      // Get project data from database
      const projectData = await databaseService.getProjectData(projectId);
      
      // Ensure we have proper project structure
      if (!projectData.columns) {
        projectData.columns = [];
      }
      
      // If markdown content exists, parse it and replace existing data
      if (projectData?.project?.content) {
        try {
          const parsedData = await parseMarkdownToProjectData(projectData.project.content, projectData.project.name);
          if (parsedData) {
            // Update both columns and content in database
            await databaseService.updateProject({
              ...projectData.project,
              content: projectData.project.content
            });
            await databaseService.updateProjectColumns(
              projectData.project.id,
              parsedData.columns
            );
            
            // Update local project data with parsed values
            projectData.columns = parsedData.columns;
            projectData.project.content = projectData.project.content;
          }
        } catch (error) {
          console.error('Error parsing markdown:', error);
        }
      }
      
      // Single state update to prevent flickering
      setState(prevState => ({
        ...prevState,
        projectData,
        isLoading: false,
        settings: {
          ...prevState.settings,
          recentProjects: [
            projectData.project,
            ...prevState.settings.recentProjects.filter(p => p.id !== projectId),
          ],
        },
      }));
    } catch (error) {
      console.error('Error loading project:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: `Failed to load project: ${error}`,
      }));
    }
  };
  
  // Save the project
  const saveProject = async () => {
    if (!state.projectData) return;
    
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));
    
    try {
      // Generate markdown content from current state
      const content = projectDataToMarkdown(state.projectData);
      
      // Update project with new content
      const updatedProject = {
        ...state.projectData.project,
        content,
        updatedAt: new Date().toISOString()
      };
      
      // Update project in database
      await databaseService.updateProject(updatedProject);
      
      // Update state with new content
      setState(prevState => ({
        ...prevState,
        projectData: {
          ...prevState.projectData!,
          project: updatedProject
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error saving project:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: `Failed to save project: ${error}`,
      }));
    }
  };
  
  // Update the project - trusts the caller to provide consistent data
  const updateProject = async (projectData: ProjectData) => {
    // Cancel any pending saves (if applicable, though ProjectWorkspace handles debouncing now)
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = undefined;
    }

    // Ensure updatedAt is set
    projectData.project.updatedAt = new Date().toISOString();

    // Optimistic UI update with the provided data
    // The caller (ProjectWorkspace or KanbanBoard) is responsible for ensuring
    // projectData.project.content and projectData.columns are consistent.
    setState(prev => ({
      ...prev,
      projectData // Use the fully updated projectData object passed in
    }));

    // Persist all changes atomically
    try {
      // Save the project metadata (including the potentially updated content)
      await databaseService.updateProject(projectData.project);
      
      // Save the updated column/group/card structure
      await databaseService.updateProjectColumns(
        projectData.project.id,
        projectData.columns
      );

      // No need to refresh from DB, trust optimistic update.
      console.log('Project updated successfully in DB');

    } catch (error) {
      console.error('Update failed:', error);
      // Consider reverting optimistic update or showing a more specific error
      setState(prev => ({
        ...prev,
        error: `Update failed: ${error}`
      }));
    }
  };
  
  // Toggle the theme
  const toggleTheme = async () => {
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    
    // Update the settings
    const updatedSettings: AppSettings = {
      ...state.settings,
      theme: newTheme,
    };
    
    // Save the settings
    await writeSettings(updatedSettings);
    
    // Update the state
    setState(prevState => ({
      ...prevState,
      settings: updatedSettings,
    }));
  };
  
  // Create a new project
  const createNewProject = async (projectName: string) => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));
    
    try {
      // First parse template to get initial structure
      const templateContent = `# Backlog\n- [ ] New Task`;
      const parsedData = await parseMarkdownToProjectData(templateContent, projectName);
      
      // Create project with initial data in single transaction
      const projectData = await databaseService.createProjectWithColumns(
        projectName,
        templateContent,
        parsedData?.columns || []
      );

      // Build complete project structure
      const updatedProject = {
        ...projectData.project,
        content: templateContent,
        updatedAt: new Date().toISOString()
      };
      
      // Update state with complete project data AND updated recent projects list
      setState(prevState => ({
        ...prevState,
        projectData: {
          project: updatedProject,
          columns: parsedData?.columns || []
        },
        settings: {
          ...prevState.settings,
          recentProjects: [
            projectData.project, // Add the new project to the beginning
            ...prevState.settings.recentProjects,
          ],
        },
        isLoading: false,
        error: null, // Clear any previous error
      }));

    } catch (error) {
      console.error('Error creating project:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: `Failed to create project: ${error}`,
      }));
    }
  };
  
  // Delete a project
  const deleteProject = async (id: number): Promise<boolean> => {
    try {
      const success = await databaseService.deleteProject(id);
      if (success) {
        // Update recent projects list
        setState(prevState => ({
          ...prevState,
          settings: {
            ...prevState.settings,
            recentProjects: prevState.settings.recentProjects.filter(p => p.id !== id)
          }
        }));
      }
      return success;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  // Context value
  const contextValue = {
    state,
    loadProject,
    saveProject,
    updateProject,
    toggleTheme,
    createNewProject,
    deleteProject,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
