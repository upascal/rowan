import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAppState } from '../../services/stateManager';
import KanbanBoard from '../Board/KanbanBoard';
import Button from '../common/Button';
import { getThemeStyles, colors } from '../../utils/theme';

interface BoardScreenProps {
  onNavigateToHome: () => void;
}

const BoardScreen: React.FC<BoardScreenProps> = ({ onNavigateToHome }) => {
  const { state, saveBoard, toggleTheme } = useAppState();
  const { board, settings, isLoading, error } = state;
  const styles = getThemeStyles(settings.theme);
  
  // Handle save button press
  const handleSave = async () => {
    try {
      await saveBoard();
      Alert.alert('Success', 'Board saved successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to save board: ${error}`);
    }
  };
  
  // Extract file name from path
  const getFileName = () => {
    if (!board) return '';
    return board.filePath.split('/').pop() || board.filePath;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, boardStyles.centered]}>
        <ActivityIndicator size="large" color={styles.text.color} />
        <Text style={[styles.text, boardStyles.loadingText]}>Loading...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={[styles.container, boardStyles.centered]}>
        <Text style={[styles.text, { color: colors[settings.theme].error }]}>{error}</Text>
        <Button
          title="Go Back"
          onPress={onNavigateToHome}
          theme={settings.theme}
          style={boardStyles.errorButton}
        />
      </View>
    );
  }
  
  // Render empty state
  if (!board) {
    return (
      <View style={[styles.container, boardStyles.centered]}>
        <Text style={styles.text}>No board loaded</Text>
        <Button
          title="Go Back"
          onPress={onNavigateToHome}
          theme={settings.theme}
          style={boardStyles.errorButton}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={boardStyles.headerLeft}>
          <Button
            title="Back"
            onPress={onNavigateToHome}
            theme={settings.theme}
            variant="outline"
          />
          <Text style={[styles.title, boardStyles.fileName]}>{getFileName()}</Text>
        </View>
        
        <View style={boardStyles.headerRight}>
          <Button
            title="Save"
            onPress={handleSave}
            theme={settings.theme}
            style={boardStyles.saveButton}
          />
          <Button
            title={settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            onPress={toggleTheme}
            theme={settings.theme}
            variant="outline"
          />
        </View>
      </View>
      
      <KanbanBoard board={board} theme={settings.theme} />
    </View>
  );
};

const boardStyles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorButton: {
    marginTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  fileName: {
    marginLeft: 16,
  },
  saveButton: {
    marginRight: 8,
  },
});

export default BoardScreen;
