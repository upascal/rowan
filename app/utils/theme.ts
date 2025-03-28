import { StyleSheet } from 'react-native';

// Define the color palette
export const colors = {
  dark: {
    background: '#1E1E1E',
    surface: '#252526',
    primary: '#569CD6',
    secondary: '#6A9955',
    text: '#D4D4D4',
    textMuted: '#8C8C8C',
    border: '#3E3E42',
    error: '#F44747',
    success: '#6A9955',
    cardBackground: '#2D2D30',
    columnBackground: '#252526',
    headerBackground: '#1E1E1E',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    primary: '#0078D4',
    secondary: '#107C10',
    text: '#333333',
    textMuted: '#767676',
    border: '#CCCCCC',
    error: '#E74C3C',
    success: '#107C10',
    cardBackground: '#FFFFFF',
    columnBackground: '#F5F5F5',
    headerBackground: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

// Create theme-based styles
export const createThemedStyles = (theme: 'dark' | 'light') => {
  const palette = colors[theme];
  
  return StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    
    // Text styles
    text: {
      color: palette.text,
      fontSize: 14,
    },
    textMuted: {
      color: palette.textMuted,
      fontSize: 14,
    },
    heading: {
      color: palette.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    title: {
      color: palette.text,
      fontSize: 24,
      fontWeight: 'bold',
    },
    
    // Button styles
    button: {
      backgroundColor: palette.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 4,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: palette.primary,
    },
    buttonOutlineText: {
      color: palette.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    
    // Input styles
    input: {
      backgroundColor: palette.surface,
      color: palette.text,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 4,
      padding: 10,
      fontSize: 16,
    },
    
    // Card styles
    card: {
      backgroundColor: palette.cardBackground,
      borderRadius: 4,
      padding: 12,
      marginVertical: 6,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    cardContent: {
      color: palette.text,
      fontSize: 14,
    },
    
    // Column styles
    column: {
      backgroundColor: palette.columnBackground,
      borderRadius: 4,
      padding: 8,
      margin: 8,
      width: 280,
      maxHeight: '100%',
      borderWidth: 1,
      borderColor: palette.border,
    },
    columnHeader: {
      backgroundColor: palette.headerBackground,
      padding: 12,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    columnTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    
    // Board styles
    board: {
      flexDirection: 'row',
      padding: 8,
    },
    
    // Header styles
    header: {
      backgroundColor: palette.headerBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    // Checkbox styles
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    
    // Subtask styles
    subtask: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingLeft: 16,
    },
    subtaskText: {
      color: palette.text,
      fontSize: 14,
      flex: 1,
    },
    subtaskCompleted: {
      textDecorationLine: 'line-through',
      color: palette.textMuted,
    },
  });
};

// Helper function to get the current theme styles
export const getThemeStyles = (theme: 'dark' | 'light') => {
  return createThemedStyles(theme);
};

// Default theme object for direct use
export const theme = {
  colors: {
    background: colors.light.background,
    surface: colors.light.surface,
    primary: colors.light.primary,
    primaryLight: '#E1F0FF', // Light version of primary color
    secondary: colors.light.secondary,
    text: colors.light.text,
    textLight: colors.light.textMuted,
    border: colors.light.border,
    error: colors.light.error,
    success: colors.light.success,
    cardBackground: colors.light.cardBackground,
    columnBackground: colors.light.columnBackground,
    headerBackground: colors.light.headerBackground,
    shadow: colors.light.shadow,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
};
