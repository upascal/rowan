import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { ProjectsSidebar } from '../Sidebar/ProjectsSidebar';
import { MarkdownEditor } from '../Editor/MarkdownEditor';
import KanbanBoard from '../Board/KanbanBoard';
import { Project, ProjectData } from '../../types';
import { databaseService } from '../../services/databaseService';
import { theme } from '../../utils/theme';
import { parseMarkdownToProjectData, projectDataToMarkdown } from '../../services/markdownParser';
import { useAppState } from '../../services/stateManager';

type ViewMode = 'markdown' | 'kanban';

export const ProjectWorkspace: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [markdownContent, setMarkdownContent] = useState('');
  const { updateProject, loadProject, state } = useAppState();

  // Sync markdown content with project data
  useEffect(() => {
    if (state.projectData) {
      setSelectedProject(state.projectData.project);
      // Generate markdown from current project data
      const content = projectDataToMarkdown(state.projectData);
      setMarkdownContent(content);
    }
  }, [state.projectData]);

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

    setMarkdownContent(content);
    
    // Parse markdown and update project data
    const data = await parseMarkdownToProjectData(content, selectedProject.name);
    const updatedData: ProjectData = {
      ...data,
      project: {
        ...selectedProject,
        content,
        updatedAt: new Date().toISOString()
      }
    };
    
    // Update state and database
    await updateProject(updatedData);
  };

  // Toggle between markdown and kanban views
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'markdown' ? 'kanban' : 'markdown';
    setViewMode(newMode);
  }, [viewMode]);

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
