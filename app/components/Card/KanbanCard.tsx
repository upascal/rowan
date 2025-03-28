import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Subtask } from '../../types';
import Checkbox from '../common/Checkbox';
import { getThemeStyles } from '../../utils/theme';

interface KanbanCardProps {
  card: Card & { subtasks: Subtask[] };
  onUpdate: (updatedCard: Card & { subtasks: Subtask[] }) => void;
  theme: 'dark' | 'light';
  onDragStart?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  onUpdate,
  theme,
  onDragStart,
}) => {
  const [expanded, setExpanded] = useState(false);
  const styles = getThemeStyles(theme);
  
  // Toggle card completion
  const toggleCompleted = () => {
    onUpdate({
      ...card,
      completed: !card.completed,
    });
  };
  
  // Toggle subtask completion
  const toggleSubtaskCompleted = (subtask: Subtask) => {
    const updatedSubtasks = card.subtasks.map(st => 
      st.id === subtask.id ? { ...st, completed: !st.completed } : st
    );
    
    onUpdate({
      ...card,
      subtasks: updatedSubtasks,
    });
  };
  
  // Calculate completion status
  const getCompletionStatus = () => {
    if (card.subtasks.length === 0) return null;
    
    const completedCount = card.subtasks.filter(st => st.completed).length;
    return `${completedCount}/${card.subtasks.length}`;
  };
  
  const completionStatus = getCompletionStatus();
  
  return (
    <TouchableOpacity
      style={[styles.card, { opacity: card.completed ? 0.8 : 1 }]}
      onPress={() => setExpanded(!expanded)}
      onLongPress={onDragStart}
      activeOpacity={0.7}
    >
      <View style={cardStyles.header}>
        <View style={cardStyles.checkboxContainer}>
          <Checkbox
            checked={card.completed}
            onToggle={toggleCompleted}
            theme={theme}
          />
        </View>
        <Text
          style={[
            styles.cardTitle,
            card.completed && cardStyles.completedText,
          ]}
          numberOfLines={expanded ? undefined : 2}
        >
          {card.text}
        </Text>
      </View>
      
      {completionStatus && (
        <View style={cardStyles.statusContainer}>
          <Text style={styles.textMuted}>{completionStatus}</Text>
        </View>
      )}
      
      {expanded && card.subtasks.length > 0 && (
        <View style={cardStyles.subtasksContainer}>
          {card.subtasks.map(subtask => (
            <View key={subtask.id} style={styles.subtask}>
              <Checkbox
                checked={subtask.completed}
                onToggle={() => toggleSubtaskCompleted(subtask)}
                theme={theme}
              />
              <Text
                style={[
                  styles.subtaskText,
                  subtask.completed && styles.subtaskCompleted,
                ]}
              >
                {subtask.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 8,
    paddingTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  subtasksContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
});

export default KanbanCard;
