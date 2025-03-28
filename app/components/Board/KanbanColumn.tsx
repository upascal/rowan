import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Column, Card, Subtask } from '../../types';
import KanbanCard from '../Card/KanbanCard';
import { getThemeStyles } from '../../utils/theme';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

interface KanbanColumnProps {
  column: Column;
  onUpdateCard: (cardId: number, updatedCard: Card & { subtasks: Subtask[] }) => void;
  onReorderCards: (columnId: number, cards: (Card & { subtasks: Subtask[] })[]) => void;
  onDragCard: (cardId: number, sourceColumnId: number, targetColumnId: number) => void;
  theme: 'dark' | 'light';
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onUpdateCard,
  onReorderCards,
  onDragCard,
  theme,
}) => {
  const styles = getThemeStyles(theme);
  
  // Handle card update
  const handleCardUpdate = (updatedCard: Card & { subtasks: Subtask[] }) => {
    onUpdateCard(updatedCard.id, updatedCard);
  };
  
  // Render a card item
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
  
  // Handle card reordering
  const handleDragEnd = ({ data }: { data: (Card & { subtasks: Subtask[] })[] }) => {
    onReorderCards(column.id, data);
  };
  
  return (
    <View style={[styles.column, columnStyles.container]}>
      <View style={styles.columnHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          <View style={[columnStyles.levelBadge, { backgroundColor: column.level === 1 ? '#4ade80' : '#60a5fa' }]}>
            <Text style={columnStyles.levelText}>L{column.level}</Text>
          </View>
        </View>
        <Text style={styles.textMuted}>{column.cards.length}</Text>
      </View>
      
      <View style={columnStyles.cardsContainer}>
        {!column.cards || column.cards.length === 0 ? (
          <View style={columnStyles.emptyState}>
            <Text style={styles.textMuted}>No tasks</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={column.cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            onDragEnd={handleDragEnd}
            contentContainerStyle={columnStyles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const columnStyles = StyleSheet.create({
  container: {
    height: '100%',
  },
  cardsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default KanbanColumn;
