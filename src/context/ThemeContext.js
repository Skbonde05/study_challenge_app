// src/context/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

export const themes = {
  light: {
    mode: 'light',
    colors: {
      primary: '#4A90E2',
      primaryDark: '#357ABD',
      background: '#F5F5F7',
      card: '#FFFFFF',
      text: '#1D1D1F',
      secondaryText: '#666666',
      border: '#E5E5EA',
    },
  },
  dark: {
    mode: 'dark',
    colors: {
      primary: '#5C9CE6',
      primaryDark: '#4A8BD4',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      secondaryText: '#8E8E93',
      border: '#2C2C2E',
    },
  },
};

const ThemeContext = createContext({
  theme: themes.light,
  setTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(themes.light);

  const setTheme = (mode) => {
    if (mode === 'dark') {
      setThemeState(themes.dark);
    } else {
      setThemeState(themes.light);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};