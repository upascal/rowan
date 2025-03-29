/**
 * TypeScript interfaces for the Markdown Kanban app
 */

/**
 * Represents a project in the database
 */
export interface Project {
  id: number;
  name: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a column in the database
 */
export interface Column {
  id: number;
  projectId: number;
  title: string;
  position: number;
  level: number;
  createdAt: string;
  updatedAt: string;
  groups: Group[]; // Added groups
  cards: Card[]; // Cards directly under the column
}

/**
 * Represents a group within a column
 */
export interface Group {
  id: number;
  columnId: number;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards: Card[];
}

/**
 * Represents a card in the database
 */
export interface Card {
  id: number; // Changed from string to number to match DB schema
  columnId: number;
  groupId?: number; // Optional: ID of the group this card belongs to
  text: string;
  completed: boolean;
  position: number;
  // groupName: string; // Removed, use groupId instead
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

/**
 * Represents a subtask in the database
 */
export interface Subtask {
  id: number;
  cardId: number;
  text: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a complete project with all its data
 */
export interface ProjectData {
  project: Project;
  columns: Column[];
}

/**
 * Represents the app settings
 */
export interface AppSettings {
  recentProjects: Project[];
  theme: 'dark' | 'light';
  lastOpenedProjectId?: number;
}

/**
 * Represents the app state
 */
export interface AppState {
  projectData: ProjectData | null;
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

/**
 * Database service interface
 */
export interface DatabaseService {
  getProjects(): Promise<Project[]>;
  getProjectData(projectId: number): Promise<ProjectData>;
  createProject(name: string): Promise<ProjectData>;
  createProjectWithColumns(
    name: string, 
    content: string,
    columns: Column[]
  ): Promise<ProjectData>;
  updateProject(project: Project): Promise<boolean>;
  updateProjectColumns(projectId: number, columns: Column[]): Promise<void>;
  deleteProject(id: number): Promise<boolean>;
}
