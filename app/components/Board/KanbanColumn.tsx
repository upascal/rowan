import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Column, Card, Subtask, Group } from '../../types'; // Added Group
import KanbanCard from '../Card/KanbanCard';
import { getThemeStyles } from '../../utils/theme';
import DraggableFlatList, { RenderItemParams, DragEndParams } from 'react-native-draggable-flatlist';

interface KanbanColumnProps {
  column: Column;
  onUpdateCard: (cardId: number, updatedCard: Card & { subtasks: Subtask[] }) => void; // Changed cardId to number
  onReorderCards: (columnId: number, groupId: number | null, reorderedCards: (Card & { subtasks: Subtask[] })[]) => void;
  onDragCard: (cardId: number, sourceColumnId: number, targetColumnId: number) => void; // Changed cardId to number
  theme: 'dark' | 'light';
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onUpdateCard,
  onReorderCards,
  // onDragCard, // onDragCard is used by the parent for cross-column drag, not needed directly here yet
  theme,
}) => {
  const styles = getThemeStyles(theme);
  
  // Handle card update (ID is number now)
  const handleCardUpdate = (updatedCard: Card & { subtasks: Subtask[] }) => {
    onUpdateCard(updatedCard.id, updatedCard); // Pass numeric ID
  };
  
  // Render a card item (remains mostly the same)
  const renderCard = ({ item, drag, isActive }: RenderItemParams<Card & { subtasks: Subtask[] }>) => {
    return (
      <KanbanCard
        card={item}
        onUpdate={handleCardUpdate}
        theme={theme}
        onDragStart={drag}
      />
    );
  };
  
  // Handle card reordering within a specific list (column direct or group)
  const handleDragEnd = (params: DragEndParams<Card & { subtasks: Subtask[] }>, groupId: number | null) => {
    onReorderCards(column.id, groupId, params.data);
  };

  // Calculate total card count
  const totalCards = (column.cards?.length || 0) + (column.groups?.reduce((sum, group) => sum + (group.cards?.length || 0), 0) || 0);

  return (
    <View style={[styles.column, columnStyles.container]}>
      {/* Column Header */}
      <View style={styles.columnHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          {/* Removed level badge as level is now implicitly 1 for columns */}
        </View>
        <Text style={styles.textMuted}>{totalCards}</Text>
      </View>
      
      {/* --- TEMPORARY SIMPLIFICATION FOR DEBUGGING --- */}
      <View style={{ flex: 1, padding: 10 }}>
        <Text>Test Column Content for {column.title}</Text>
      </View>
      {/* --- END TEMPORARY SIMPLIFICATION --- */}
      
    </View>
  );
};

const columnStyles = StyleSheet.create({
  container: {
    width: 300, // Keep a fixed width for columns
    marginHorizontal: 8,
    borderRadius: 8,
    // backgroundColor is handled by styles.column from getThemeStyles
    // Removed fixed height, let content determine height within ScrollView
    overflow: 'hidden', // Prevent content spilling before ScrollView takes over
    maxHeight: '95%', // Prevent columns from becoming excessively tall
    display: 'flex', // Use flexbox for layout
    flexDirection: 'column', // Stack header and scrollview vertically
  },
  cardsContainer: {
    flex: 1, // Allows ScrollView to take available space
    paddingHorizontal: 8, // Add some horizontal padding inside the scroll area
  },
  listContainer: {
    // Styles for the DraggableFlatList container itself if needed
    marginBottom: 8, // Add space below each list
  },
  listContent: {
    paddingBottom: 8, // Reduced padding
  },
  groupContainer: {
    marginTop: 16, // Space between direct cards/groups and subsequent groups
    marginBottom: 8, // Space below group
  },
  groupHeader: { // Added definition
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4, // Slight indent for group header
  },
  groupTitle: { // Added definition (inherits from styles.text, but can be customized)
    fontWeight: '600', // Make group titles slightly bolder
    fontSize: 15,
    // color is handled by styles.text from getThemeStyles
  },
  emptyState: {
    paddingVertical: 16, // Only vertical padding needed now
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Give empty state some height
    // color is handled by styles.textMuted from getThemeStyles
  },
  // Removed levelBadge styles
});

export default KanbanColumn;
