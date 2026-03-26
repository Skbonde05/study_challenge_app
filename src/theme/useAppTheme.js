import { useTheme } from '../context/ThemeContext';

/**
 * Standard usage hook for application theme with fallback values
 */
export const useAppTheme = () => {
  const { theme, setTheme } = useTheme();

  const safeTheme = {
    mode: theme?.mode || 'light',
    colors: {
      primary: theme?.colors?.primary || '#4A90E2',
      primaryDark: theme?.colors?.primaryDark || '#357ABD',
      background: theme?.colors?.background || '#F5F5F7',
      card: theme?.colors?.card || '#FFFFFF',
      text: theme?.colors?.text || '#1D1D1F',
      secondaryText: theme?.colors?.secondaryText || '#666666',
      border: theme?.colors?.border || '#E5E5EA',
      headerText: theme?.mode === 'dark' ? '#FFFFFF' : '#FFFFFF', // Default as white for header with primary background
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      accent: '#FF9500',
      progressBackground: theme?.mode === 'dark' ? '#2C2C2E' : '#E5E5EA',
      progressFill: '#4A90E2',
      disabled: '#999999',
      statusBar: theme?.mode === 'dark' ? 'light-content' : 'dark-content',
    }
  };

  return { theme: safeTheme, setTheme, rawTheme: theme };
};
