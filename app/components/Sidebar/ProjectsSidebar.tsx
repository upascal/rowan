import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { Project } from '../../types';
import { theme } from '../../utils/theme';
import { useAppState } from '../../services/stateManager';

interface ProjectsSidebarProps {
  selectedProjectId: number | null;
  onSelectProject: (project: Project) => void;
}

export const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({ 
  selectedProjectId, 
  onSelectProject 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { state, createNewProject, deleteProject } = useAppState();

  // Keep local projects in sync with state
  useEffect(() => {
    if (state.settings.recentProjects) {
      setProjects(state.settings.recentProjects);
      
      // If no project is selected and we have projects, select the first one
      if (selectedProjectId === null && state.settings.recentProjects.length > 0) {
        onSelectProject(state.settings.recentProjects[0]);
      }
    }
  }, [state.settings.recentProjects, selectedProjectId, onSelectProject]);

  // Create a new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Project name cannot be empty');
      return;
    }

    try {
      await createNewProject(newProjectName);
      setNewProjectName('');
      setIsCreatingProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    }
  };

  // Delete a project
  const handleDeleteProject = async (id: number) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteProject(id);
              if (success) {
                const updatedProjects = projects.filter(p => p.id !== id);
                
                // If the deleted project was selected, select another one
                if (selectedProjectId === id && updatedProjects.length > 0) {
                  onSelectProject(updatedProjects[0]);
                } else if (updatedProjects.length === 0) {
                  onSelectProject(null as any); // No projects left
                }
              }
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  // Render a project item
  const renderProjectItem = ({ item }: { item: Project }) => {
    const isSelected = selectedProjectId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.projectItem,
          isSelected && styles.selectedProjectItem
        ]}
        onPress={() => onSelectProject(item)}
      >
        <Text 
          style={[
            styles.projectName,
            isSelected && styles.selectedProjectName
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProject(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsCreatingProject(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {isCreatingProject ? (
        <View style={styles.createProjectContainer}>
          <TextInput
            style={styles.input}
            value={newProjectName}
            onChangeText={setNewProjectName}
            placeholder="Project name"
            autoFocus
          />
          <View style={styles.createProjectButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsCreatingProject(false);
                setNewProjectName('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.createButton]}
              onPress={handleCreateProject}
            >
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {projects.length === 0 && !isCreatingProject ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No projects yet. Create your first project to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item, index) => item?.id?.toString() || `project-${index}`}
          style={styles.projectsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: '100%',
    backgroundColor: theme.colors.background,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  projectsList: {
    flex: 1,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedProjectItem: {
    backgroundColor: theme.colors.primaryLight,
  },
  projectName: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  selectedProjectName: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: 20,
    fontWeight: 'bold',
  },
  createProjectContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  createProjectButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 14,
  },
});
