import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { AppProvider, useAppState } from './services/stateManager';
import { ProjectWorkspace } from './components/screens/ProjectWorkspace';
import { getThemeStyles } from './utils/theme';

// Main app content component
const AppContent: React.FC = () => {
  const { state } = useAppState();
  const { settings } = state;
  const styles = getThemeStyles(settings.theme);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={styles.container.backgroundColor}
      />
      
      <ProjectWorkspace />
    </SafeAreaView>
  );
};

// Root app component with provider
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
