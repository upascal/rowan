// relative path: src/App.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import TiptapEditor from './components/TiptapEditor';
import ProjectSidebar from './components/ProjectSidebar'; // Import the new sidebar
import KanbanBoard from './components/KanbanBoard';

import './App.css';

type ViewMode = 'wysiwyg' | 'raw' | 'kanban';

type Projects = { [key: string]: string }; // Type for projects object

const LOCAL_STORAGE_KEY = 'markdownKanbanProjects';
const DEFAULT_PROJECT_TEMPLATE = (projectName: string) => `# TODO

- [ ] Task 1
- [ ] task 2

## Task Group A
- [ ] Task A.1
- [ ] task A.2

## Task Group B
- [ ] Task B.1
  - [ ] task B.1.1
  - [ ] task B.1.2
- [ ] task B.2

# In Progress

- [ ] Task 1
- [ ] task 2

# Done

- [ ] task 3`;

// Initial default project if local storage is empty
const initialDefaultProjectName = "Default Project";
const initialDefaultProjects: Projects = {
  [initialDefaultProjectName]: DEFAULT_PROJECT_TEMPLATE(initialDefaultProjectName)
};




function App() {
  // State for projects, selected project, and new project input
  const [projects, setProjects] = useState<Projects>({});
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg'); // Keep view mode state

  // --- Effects for Local Storage ---

  // Load projects from local storage on initial mount
  useEffect(() => {
    const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedProjects) {
      try {
        const parsedProjects: Projects = JSON.parse(storedProjects);
        setProjects(parsedProjects);
        // Select the first project by default if available
        const projectNames = Object.keys(parsedProjects);
        if (projectNames.length > 0) {
          setSelectedProject(projectNames[0]);
        } else {
          // If storage is empty object, initialize with default
           setProjects(initialDefaultProjects);
           setSelectedProject(initialDefaultProjectName);
        }
      } catch (error) {
        console.error("Failed to parse projects from local storage:", error);
        // Fallback to default if parsing fails
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
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);


  // Tiptap handles its own input changes via the onChange prop
  // Renamed to handleSaveContent and implemented correctly
  const handleSaveContent = useCallback((markdownContent: string) => {
     if (selectedProject) {
       setProjects(prevProjects => ({
         ...prevProjects,
         [selectedProject]: markdownContent,
       }));
     }
     // console.log("Markdown Updated for", selectedProject, ":", markdownContent); // For debugging
   }, [selectedProject]); // Re-create if selectedProject changes


  // --- Project Handling Functions ---

  const handleSelectProject = useCallback((projectName: string) => {
    setSelectedProject(projectName);
  }, []);

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
  }, [newProjectName, projects]); // Re-create if input or projects change

  const handleDeleteProject = useCallback((projectName: string) => {
    // Confirmation is handled in the sidebar component
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
  }, [selectedProject, projects]); // Re-create if selection or projects change


  // --- View Mode Toggle ---
  const toggleViewMode = () => {
    setViewMode(prevMode => (prevMode === 'wysiwyg' ? 'raw' : 'wysiwyg'));
  };

  // Removed handleToggleCheck, findAndUpdateTaskRecursive, serializeBlocksToMarkdown, TodoListDisplay

  // --- Main App Render ---

  // Get the content for the selected project, or an empty string if none selected
  const currentProjectContent = selectedProject ? projects[selectedProject] ?? '' : '';

  return (
    <div className="app-container flex h-screen">
      {/* Sidebar */}
      <ProjectSidebar
        projects={Object.keys(projects)} // Pass only names
        selectedProject={selectedProject}
        newProjectName={newProjectName}
        onNewProjectNameChange={setNewProjectName} // Directly pass setter
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main Content Area */}
      <div className="main-content flex-grow flex flex-col p-4 gap-2 overflow-auto">
         {/* Header: Project Name & Toggle Button */}
         <div className="project-header">

         <h1 className="text-xl font-semibold">
            {selectedProject || "No Project Selected"}
          </h1>

          <button
            onClick={toggleViewMode}
            className="view-mode-button px-3 py-1 border rounded"
            disabled={!selectedProject}
          >
            {viewMode === 'wysiwyg' ? 'Raw Markdown' : 'WYSIWYG'}
          </button>


        </div>

        {/* Editor Pane (Conditional on Project Selection) */}
        <div className="editor-container flex-grow border rounded shadow overflow-hidden">
          {selectedProject ? (
            viewMode === 'wysiwyg' ? (
              <TiptapEditor
                // Use key to force re-render when project changes
                key={selectedProject}
                content={currentProjectContent}
                onChange={handleSaveContent} // Use the correct handler
                placeholder="Enter your tasks in Markdown..."
              />
            ) : (
              // Raw Markdown View (Optional - kept for now)
              // Note: This textarea should ideally sync using handleSaveContent too
              <textarea
                key={selectedProject + "-raw"} // Key to force re-render
                id="raw-markdown-editor"
                name="raw-markdown-editor"
                className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                value={currentProjectContent}
                onChange={(e) => handleSaveContent(e.target.value)} // Save on change
                placeholder="# Enter Raw Markdown..."
                spellCheck="false"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a project from the sidebar or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
