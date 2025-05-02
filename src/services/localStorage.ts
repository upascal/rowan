import { Projects } from '../models/project';

const LOCAL_STORAGE_KEY = 'markdownKanbanProjects';

export const saveProjects = (projects: Projects): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
};

export const loadProjects = (): Projects | null => {
  const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedProjects) {
    try {
      return JSON.parse(storedProjects);
    } catch (error) {
      console.error("Failed to parse projects from local storage:", error);
      return null;
    }
  }
  return null;
};
