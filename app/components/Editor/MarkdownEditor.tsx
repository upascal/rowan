import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Project } from '../../types';
import { theme } from '../../utils/theme';
import { debounce } from 'lodash';

interface MarkdownEditorProps {
  project: Project;
  onContentChange: (content: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  project, 
  onContentChange 
}) => {
  const [content, setContent] = useState(project.content || '');
  
  // Create a debounced content change handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedContentChange = useCallback(
    debounce((newContent: string) => {
      onContentChange(newContent);
    }, 1000),
    [onContentChange]
  );

  // Update content when project changes
  useEffect(() => {
    setContent(project.content || '');
  }, [project.id, project.content]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedContentChange(newContent);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.editor}
        value={content}
        onChangeText={handleContentChange}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  editor: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
});
