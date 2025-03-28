import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ProjectData, Column, Card, Subtask } from '../../types';
import KanbanColumnComponent from './KanbanColumn';
import { getThemeStyles } from '../../utils/theme';
import { useAppState } from '../../services/stateManager';
import { projectDataToMarkdown } from '../../services/markdownParser';
import { databaseService } from '../../services/databaseService';

interface KanbanBoardProps {
  projectData: ProjectData;
  theme: 'dark' | 'light';
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectData, theme }) => {
  const { updateProject, saveProject } = useAppState();
  const styles = getThemeStyles(theme);
  
  // Save project changes with error handling
  const saveProjectChanges = async (updatedProject: ProjectData) => {
    try {
      await updateProject(updatedProject);
      await saveProject();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert(
        'Error',
        'Failed to save changes. Please try again or check file permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  // Update a card in a column
  const handleUpdateCard = async (cardId: string | number, updatedCard: Card & { subtasks: Subtask[] }) => {
    const updatedProject = {
      ...projectData,
      columns: projectData.columns.map(column => {
        const cardIndex = column.cards.findIndex(card => card.id == cardId);
        if (cardIndex === -1) return column;
        
        const updatedCards = [...column.cards];
        updatedCards[cardIndex] = updatedCard;
        
        return {
          ...column,
          cards: updatedCards,
        };
      }),
    };
    
    await saveProjectChanges(updatedProject);
  };
  
  // Reorder cards within a column
  const handleReorderCards = async (columnId: string | number, reorderedCards: (Card & { subtasks: Subtask[] })[]) => {
    const updatedProject = {
      ...projectData,
      columns: projectData.columns.map(column => {
        if (column.id != columnId) return column;
        
        return {
          ...column,
          cards: reorderedCards,
        };
      }),
    };
    
    await saveProjectChanges(updatedProject);
  };
  
  // Move a card from one column to another
  const handleDragCard = async (cardId: string | number, sourceColumnId: string | number, targetColumnId: string | number, card: Card & { subtasks: Subtask[] }) => {
    // Find the source and target columns
    const sourceColumn = projectData.columns.find(col => col.id == sourceColumnId);
    const targetColumn = projectData.columns.find(col => col.id == targetColumnId);
    
    if (!sourceColumn || !targetColumn) {
      console.error('Source or target column not found');
      return;
    }
    
    // Find the card in the source column
    const cardIndex = sourceColumn.cards.findIndex(card => card.id == cardId);
    if (cardIndex === -1) {
      console.error('Card not found in source column');
      return;
    }
    
    // Get the card and remove it from the source column
    const cardWithSubtasks = sourceColumn.cards[cardIndex];
    const sourceCards = [...sourceColumn.cards];
    sourceCards.splice(cardIndex, 1);
    
    // Add the card to the target column
    const targetCards = [...targetColumn.cards, cardWithSubtasks];
    
    // Update the project
    const updatedProject = {
      ...projectData,
      columns: projectData.columns.map(column => {
        if (column.id == sourceColumnId) {
          return {
            ...column,
            cards: sourceCards,
          };
        }
        
        if (column.id == targetColumnId) {
          return {
            ...column,
            cards: targetCards,
          };
        }
        
        return column;
      }),
    };
    
    await saveProjectChanges(updatedProject);
  };
  
  return (
    <ScrollView
      horizontal
      contentContainerStyle={[styles.board, boardStyles.container]}
      showsHorizontalScrollIndicator={false}
    >
      {projectData.columns?.map((column, index) => (
        <KanbanColumnComponent
          key={`${column.id}-${index}`}
          column={column}
          onUpdateCard={handleUpdateCard}
          onReorderCards={handleReorderCards}
          onDragCard={(cardId, sourceColumnId, targetColumnId) => 
            handleDragCard(cardId, sourceColumnId, targetColumnId, column.cards.find(c => String(c.id) === String(cardId))!)
          }
          theme={theme}
        />
      ))}
    </ScrollView>
  );
};

const boardStyles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: '100%',
  },
});

export default KanbanBoard;
