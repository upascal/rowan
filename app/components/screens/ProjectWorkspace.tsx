import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { ProjectsSidebar } from '../Sidebar/ProjectsSidebar';
import { MarkdownEditor } from '../Editor/MarkdownEditor';
import KanbanBoard from '../Board/KanbanBoard';
import { Project, ProjectData } from '../../types';
import { databaseService } from '../../services/databaseService';
import { theme } from '../../utils/theme';
import { parseMarkdownToProjectData } from '../../services/markdownParser';
import { useAppState } from '../../services/stateManager';

type ViewMode = 'markdown' | 'kanban';

const VIEW_MODE_KEY = 'projectWorkspaceViewMode'; // Key for AsyncStorage

export const ProjectWorkspace: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [markdownContent, setMarkdownContent] = useState('');
  const { updateProject, loadProject, state } = useAppState();
  const pendingContentRef = useRef<string | null>(null);

  // Load initial view mode from AsyncStorage
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (savedMode === 'markdown' || savedMode === 'kanban') {
          setViewMode(savedMode);
        }
      } catch (e: unknown) { // Explicitly type 'e'
        console.error("Failed to load view mode from AsyncStorage", e);
      }
    };
    loadViewMode();
  }, []);

  // Sync project data with local state
  useEffect(() => {
    if (state.projectData) {
      setSelectedProject(state.projectData.project);
      
      // Only update markdown content if:
      // 1. We're in kanban view (so we're not editing markdown directly)
      // 2. OR this is the initial load of the project
      // 3. OR there's no pending content from the editor
      if (viewMode === 'kanban' || !markdownContent || !pendingContentRef.current) {
        setMarkdownContent(state.projectData.project.content || '');
      }
    }
  }, [state.projectData, viewMode, markdownContent]);

  // Handle project selection
  const handleSelectProject = async (project: Project) => {
    try {
      await loadProject(project.id);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  // Handle markdown content changes
  const handleContentChange = async (content: string) => {
    if (!selectedProject) return;

    // Store the content in both state and ref
    setMarkdownContent(content);
    pendingContentRef.current = content;
    
    // Parse markdown and update project data
    const data = await parseMarkdownToProjectData(content, selectedProject.name);
    const updatedData: ProjectData = {
      ...data,
      project: {
        ...selectedProject,
        content, // Pass the raw content directly
        updatedAt: new Date().toISOString()
      }
    };
    
    // Update state and database
    await updateProject(updatedData);
    
    // Clear pending content after successful update
    pendingContentRef.current = null;
  };

  // Toggle between markdown and kanban views
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'markdown' ? 'kanban' : 'markdown';
    
    // If switching from markdown to kanban, ensure any pending changes are saved
    if (viewMode === 'markdown' && pendingContentRef.current) {
      // The editor already debounces changes, but we want to ensure
      // the latest content is used when switching views
      handleContentChange(pendingContentRef.current);
    }
    
    // Save the new mode
    AsyncStorage.setItem(VIEW_MODE_KEY, newMode).catch((e: unknown) => { // Explicitly type 'e'
      console.error("Failed to save view mode to AsyncStorage", e);
    });
    
    setViewMode(newMode);
  }, [viewMode, handleContentChange]); // Keep handleContentChange dependency if needed

  // Add keyboard shortcut for view toggle
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + M
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        toggleViewMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleViewMode]);

  return (
    <View style={styles.container}>
      <ProjectsSidebar
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={handleSelectProject}
      />
      
      <View style={styles.contentContainer}>
        {selectedProject ? (
          <>
            <View style={styles.header}>
              <Text style={styles.projectTitle}>{selectedProject.name}</Text>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={toggleViewMode}
              >
                <Text style={styles.viewToggleText}>
                  {viewMode === 'markdown' ? 'Switch to Kanban' : 'Switch to Markdown'} (⌘M)
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.workspaceContent}>
              {viewMode === 'markdown' ? (
                <MarkdownEditor
                  project={selectedProject}
                  onContentChange={handleContentChange}
                />
              ) : (
                <KanbanBoard
                  projectData={state.projectData!}
                  theme="light"
                />
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No project selected. Create a new project or select an existing one to get started.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewToggle: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  viewToggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
  workspaceContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});
