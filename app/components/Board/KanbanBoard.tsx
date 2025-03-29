import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ProjectData, Column, Card, Subtask, Group } from '../../types'; // Added Group
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

  // Update a card (searches in column.cards and column.groups[].cards)
  const handleUpdateCard = async (cardId: number, updatedCard: Card & { subtasks: Subtask[] }) => { // Changed cardId to number
    const updatedProject = {
      ...projectData,
      columns: projectData.columns.map(column => {
        // Check direct cards
        let cardIndex = column.cards?.findIndex(card => card.id === cardId) ?? -1;
        if (cardIndex !== -1) {
          const updatedCards = [...(column.cards || [])];
          updatedCards[cardIndex] = updatedCard;
          return { ...column, cards: updatedCards };
        }
        
        // Check group cards
        let updatedGroups = column.groups;
        let groupFound = false;
        if (column.groups) {
          updatedGroups = column.groups.map(group => {
            const groupCardIndex = group.cards?.findIndex(card => card.id === cardId) ?? -1;
            if (groupCardIndex !== -1) {
              groupFound = true;
              const updatedGroupCards = [...(group.cards || [])];
              updatedGroupCards[groupCardIndex] = updatedCard;
              return { ...group, cards: updatedGroupCards };
            }
            return group;
          });
        }

        if (groupFound) {
          return { ...column, groups: updatedGroups };
        }

        // If not found in this column, return original column
        return column;
      }),
    };
    
    await saveProjectChanges(updatedProject);
  };
  
  // Reorder cards within a column's direct list or a group's list
  const handleReorderCards = async (
    columnId: number, 
    groupId: number | null, 
    reorderedCards: (Card & { subtasks: Subtask[] })[]
  ) => {
    const updatedProject = {
      ...projectData,
      columns: projectData.columns.map(column => {
        if (column.id !== columnId) return column;

        if (groupId === null) {
          // Reorder direct column cards
          return { ...column, cards: reorderedCards };
        } else {
          // Reorder cards within a specific group
          const updatedGroups = column.groups?.map(group => {
            if (group.id === groupId) {
              return { ...group, cards: reorderedCards };
            }
            return group;
          });
          return { ...column, groups: updatedGroups };
        }
      }),
    };
    
    await saveProjectChanges(updatedProject);
  };
  
  // Move a card from one column to another (simplified: always adds to target column's direct cards)
  const handleDragCard = async (cardId: number, sourceColumnId: number, targetColumnId: number) => { // Changed cardId to number
    let cardToMove: (Card & { subtasks: Subtask[] }) | null = null;
    let sourceIsGroup: boolean = false;
    let sourceGroupId: number | null = null;

    // Find and remove card from source
    const columnsAfterRemoval = projectData.columns.map(column => {
      if (column.id !== sourceColumnId) return column;

      // Check direct cards
      const directCardIndex = column.cards?.findIndex(c => c.id === cardId) ?? -1;
      if (directCardIndex !== -1) {
        cardToMove = column.cards![directCardIndex];
        const updatedCards = [...column.cards!];
        updatedCards.splice(directCardIndex, 1);
        return { ...column, cards: updatedCards };
      }

      // Check group cards
      let groupFound = false;
      const updatedGroups = column.groups?.map(group => {
        const groupCardIndex = group.cards?.findIndex(c => c.id === cardId) ?? -1;
        if (groupCardIndex !== -1) {
          cardToMove = group.cards![groupCardIndex];
          sourceIsGroup = true;
          sourceGroupId = group.id; // Store source group ID if needed later
          groupFound = true;
          const updatedGroupCards = [...group.cards!];
          updatedGroupCards.splice(groupCardIndex, 1);
          return { ...group, cards: updatedGroupCards };
        }
        return group;
      });

      if (groupFound) {
        return { ...column, groups: updatedGroups };
      }
      
      return column; // Card not found in this column
    });

    if (!cardToMove) {
      console.error(`Card with ID ${cardId} not found in source column ${sourceColumnId}`);
      return;
    }

    // Add card to target column (directly under column for now)
    const finalColumns = columnsAfterRemoval.map(column => {
      if (column.id === targetColumnId) {
        const updatedCard = { 
          ...cardToMove!, 
          columnId: targetColumnId, // Update columnId
          groupId: undefined // Remove groupId when moving between columns
        };
        const updatedCards = [...(column.cards || []), updatedCard];
        return { ...column, cards: updatedCards };
      }
      return column;
    });

    const updatedProject = { ...projectData, columns: finalColumns };
    await saveProjectChanges(updatedProject);
  };
  
  // Find a card anywhere within the project data (helper function)
  const findCardById = (id: number): (Card & { subtasks: Subtask[] }) | null => { // Changed id to number
    for (const column of projectData.columns) {
      const directCard = column.cards?.find(c => c.id === id);
      if (directCard) return directCard;
      if (column.groups) {
        for (const group of column.groups) {
          const groupCard = group.cards?.find(c => c.id === id);
          if (groupCard) return groupCard;
        }
      }
    }
    return null;
  };

  // The main return statement for the component starts here
  return (
    <ScrollView
      horizontal
      contentContainerStyle={[styles.board, boardStyles.container]}
      showsHorizontalScrollIndicator={false}
    >
      {projectData.columns?.map((column, index) => ( // Added index parameter
        <KanbanColumnComponent
          // Use index for temporary key if id is 0 (unsaved)
          key={column.id === 0 ? `col-temp-${index}` : `col-${column.id}`} 
          column={column}
          onUpdateCard={handleUpdateCard} // Pass updated handler
          onReorderCards={handleReorderCards} // Pass updated handler
          // Pass simplified onDragCard - it now only needs IDs
          onDragCard={handleDragCard} 
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
