import { AppSettings, Project } from '../types';

// Store file handles for persistent access
const fileHandles: Map<string, FileSystemFileHandle> = new Map();

// Check if File System Access API is supported
const isFileSystemAccessSupported = () => {
  return 'showOpenFilePicker' in window;
};

/**
 * Opens a file picker dialog and returns the selected file
 * @returns The file handle and file name
 */
export const pickFile = async (): Promise<{ handle: FileSystemFileHandle; name: string; path: string }> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Markdown Files',
          accept: {
            'text/markdown': ['.md', '.markdown'],
          },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    const name = file.name;
    
    // Create a virtual path for the file
    const path = `file://${name}`;
    
    // Store the handle for later use
    fileHandles.set(path, handle);
    
    return { handle, name, path };
  } catch (error) {
    console.error('Error picking file:', error);
    throw new Error(`Failed to pick file: ${error}`);
  }
};

/**
 * Creates a new file with the given name and content
 * @param fileName The name of the file
 * @param content The content to write
 * @returns The file handle and file name
 */
export const createFile = async (
  fileName: string,
  content: string
): Promise<{ handle: FileSystemFileHandle; name: string; path: string }> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'Markdown Files',
          accept: {
            'text/markdown': ['.md', '.markdown'],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    const file = await handle.getFile();
    const name = file.name;
    
    // Create a virtual path for the file
    const path = `file://${name}`;
    
    // Store the handle for later use
    fileHandles.set(path, handle);
    
    return { handle, name, path };
  } catch (error) {
    console.error('Error creating file:', error);
    throw new Error(`Failed to create file: ${error}`);
  }
};

/**
 * Reads a file from the file system
 * @param filePath The path to the file
 * @returns The file contents as a string
 */
export const readFile = async (filePath: string): Promise<string> => {
  try {
    const handle = fileHandles.get(filePath);
    
    if (!handle) {
      throw new Error(`File handle not found for path: ${filePath}`);
    }
    
    const file = await handle.getFile();
    return await file.text();
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error}`);
  }
};

/**
 * Writes content to a file
 * @param filePath The path to the file
 * @param content The content to write
 */
// Verify file permissions
const verifyPermissions = async (handle: FileSystemFileHandle): Promise<boolean> => {
  try {
    // Check if we already have permission
    const opts = { mode: 'readwrite' } as const;
    const permission = await handle.queryPermission(opts);
    
    if (permission === 'granted') {
      return true;
    }
    
    // Request permission if needed
    const newPermission = await handle.requestPermission(opts);
    return newPermission === 'granted';
  } catch (error) {
    console.error('Error verifying permissions:', error);
    return false;
  }
};

export const writeFile = async (filePath: string, content: string): Promise<void> => {
  try {
    const handle = fileHandles.get(filePath);
    
    if (!handle) {
      throw new Error(`File handle not found for path: ${filePath}`);
    }
    
    // Verify we have permission to write to the file
    const hasPermission = await verifyPermissions(handle);
    if (!hasPermission) {
      throw new Error('Permission denied to write to file');
    }
    
    // Create a backup of the file content first
    const file = await handle.getFile();
    const backupContent = await file.text();
    
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (writeError) {
      // If writing fails, try to restore the backup
      console.error('Error writing file, attempting to restore backup:', writeError);
      const writable = await handle.createWritable();
      await writable.write(backupContent);
      await writable.close();
      throw writeError;
    }
  } catch (error) {
    console.error('Error writing file:', error);
    throw new Error(`Failed to write file: ${error}`);
  }
};

/**
 * Checks if a file exists
 * @param filePath The path to the file
 * @returns True if the file exists, false otherwise
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  return fileHandles.has(filePath);
};

/**
 * Gets the app's settings from localStorage
 * @returns The app settings
 */
export const readSettings = async (): Promise<AppSettings> => {
  try {
    const settingsJson = localStorage.getItem('markdownKanbanSettings');
    
    if (!settingsJson) {
      // Return default settings if not found
    return {
      recentProjects: [],
      theme: 'dark',
    };
    }
    
    return JSON.parse(settingsJson) as AppSettings;
  } catch (error) {
    console.error('Error reading settings:', error);
    // Return default settings on error
    return {
      recentProjects: [],
      theme: 'dark',
    };
  }
};

/**
 * Writes the app settings to localStorage
 * @param settings The app settings to write
 */
export const writeSettings = async (settings: AppSettings): Promise<void> => {
  try {
    localStorage.setItem('markdownKanbanSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error writing settings:', error);
    throw new Error(`Failed to write settings: ${error}`);
  }
};

/**
 * Updates the recent files list in the app settings
 * @param filePath The file path to add to the recent files list
 */
export const updateRecentProjects = async (project: Project): Promise<void> => {
  try {
    const settings = await readSettings();
    
    // Remove the project if it already exists in the list
    settings.recentProjects = settings.recentProjects.filter(
      p => p.id !== project.id
    );
    
    // Add the project to the beginning of the list
    settings.recentProjects.unshift(project);
    
    // Limit the list to 10 items
    if (settings.recentProjects.length > 10) {
      settings.recentProjects = settings.recentProjects.slice(0, 10);
    }
    
    // Update the last opened project
    settings.lastOpenedProjectId = project.id;
    
    await writeSettings(settings);
  } catch (error) {
    console.error('Error updating recent projects:', error);
    throw new Error(`Failed to update recent projects: ${error}`);
  }
};

/**
 * Sets up a file watcher for a file
 * @param filePath The path to the file
 * @param onChange The callback to call when the file changes
 * @returns A function to stop watching the file
 */
export const watchFile = (
  filePath: string,
  onChange: (content: string) => void
): (() => void) => {
  // File watching is not directly supported in the File System Access API
  // This is a simple polling implementation
  let lastModified = Date.now();
  let isWatching = true;
  
  const checkFile = async () => {
    if (!isWatching) return;
    
    try {
      const handle = fileHandles.get(filePath);
      
      if (handle) {
        const file = await handle.getFile();
        const lastModifiedTime = file.lastModified;
        
        if (lastModifiedTime > lastModified) {
          lastModified = lastModifiedTime;
          const content = await file.text();
          onChange(content);
        }
      }
    } catch (error) {
      console.error('Error watching file:', error);
    }
    
    // Check again after 1 second
    setTimeout(checkFile, 1000);
  };
  
  // Start checking
  checkFile();
  
  // Return a function to stop watching
  return () => {
    isWatching = false;
  };
};
