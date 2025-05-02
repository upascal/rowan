import { useState, useCallback } from 'react';
import { ViewMode } from '../models/project';

export function useEditor() {
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');

  // Toggle between WYSIWYG and raw markdown view
  const toggleViewMode = useCallback(() => {
    setViewMode(prevMode => (prevMode === 'wysiwyg' ? 'raw' : 'wysiwyg'));
  }, []);

  // Set a specific view mode
  const setViewModeDirectly = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return {
    viewMode,
    toggleViewMode,
    setViewModeDirectly
  };
}
