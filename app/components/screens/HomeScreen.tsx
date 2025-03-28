import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useAppState } from '../../services/stateManager';
import Button from '../common/Button';
import { getThemeStyles } from '../../utils/theme';
import * as FileSystem from '../../services/fileSystem';

interface HomeScreenProps {
  onNavigateToBoard: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToBoard }) => {
  const { state, loadFile, createNewFile, toggleTheme } = useAppState();
  const { settings } = state;
  const styles = getThemeStyles(settings.theme);
  
  // Handle opening a file
  const handleOpenFile = async (filePath: string) => {
    try {
      await loadFile(filePath);
      onNavigateToBoard();
    } catch (error) {
      Alert.alert('Error', `Failed to open file: ${error}`);
    }
  };
  
  // Handle picking a file
  const handlePickFile = async () => {
    try {
      const { path } = await FileSystem.pickFile();
      await loadFile(path);
      onNavigateToBoard();
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.message !== 'The user aborted a request.') {
        Alert.alert('Error', `Failed to open file: ${error}`);
      }
    }
  };
  
  // Handle creating a new file
  const handleCreateNewFile = async () => {
    try {
      // Create a simple template
      const template = `# To Do\n- [ ] New Task\n\n# In Progress\n\n# Done\n`;
      
      const { path } = await FileSystem.createFile('new-kanban.md', template);
      await loadFile(path);
      onNavigateToBoard();
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.message !== 'The user aborted a request.') {
        Alert.alert('Error', `Failed to create file: ${error}`);
      }
    }
  };
  
  // Render a recent file item
  const renderRecentFile = ({ item }: { item: string }) => {
    // Extract the file name from the path
    const fileName = item.split('/').pop() || item;
    
    return (
      <TouchableOpacity
        style={[styles.card, homeStyles.fileItem]}
        onPress={() => handleOpenFile(item)}
      >
        <Text style={styles.cardTitle}>{fileName}</Text>
        <Text style={styles.textMuted} numberOfLines={1}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Markdown Kanban</Text>
        <Button
          title={settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          onPress={toggleTheme}
          theme={settings.theme}
          variant="outline"
        />
      </View>
      
      <View style={homeStyles.content}>
        {/* Recent Files Section */}
        <View style={homeStyles.section}>
          <Text style={styles.heading}>Recent Files</Text>
          
          {settings.recentFiles.length === 0 ? (
            <View style={homeStyles.emptyState}>
              <Text style={styles.textMuted}>No recent files</Text>
            </View>
          ) : (
            <FlatList
              data={settings.recentFiles}
              renderItem={renderRecentFile}
              keyExtractor={(item) => item}
              style={homeStyles.fileList}
            />
          )}
        </View>
        
        {/* Actions Section */}
        <View style={homeStyles.section}>
          <Text style={styles.heading}>Actions</Text>
          
          <View style={homeStyles.buttonRow}>
            <Button
              title="Open File"
              onPress={handlePickFile}
              theme={settings.theme}
              style={homeStyles.actionButton}
            />
            
            <Button
              title="Create New File"
              onPress={handleCreateNewFile}
              theme={settings.theme}
              style={homeStyles.actionButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const homeStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    marginVertical: 4,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  actionButton: {
    marginRight: 16,
    minWidth: 120,
  },
});

export default HomeScreen;
