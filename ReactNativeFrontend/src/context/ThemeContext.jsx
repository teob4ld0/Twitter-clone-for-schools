import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const lightTheme = {
  mode: 'light',
  colors: {
    // Primary colors
    primary: '#1da1f2',
    primaryHover: '#1a91da',
    primaryActive: '#1781c2',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f5f8fa',
    backgroundTertiary: '#e1e8ed',
    backgroundHover: '#f7f9fa',
    
    // Text colors
    textPrimary: '#14171a',
    textSecondary: '#657786',
    textTertiary: '#aab8c2',
    textInverted: '#ffffff',
    textOnPrimary: '#ffffff',
    
    // Border colors
    border: '#e1e8ed',
    borderLight: '#f0f0f0',
    borderDark: '#ccd6dd',
    
    // Status colors
    success: '#17bf63',
    successBackground: '#e6f9f0',
    warning: '#ffad1f',
    warningBackground: '#fff8e6',
    error: '#e0245e',
    errorBackground: '#ffebee',
    info: '#1da1f2',
    infoBackground: '#e8f5fe',
    
    // Card & Modal
    cardBackground: '#ffffff',
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    
    // Input
    inputBackground: '#ffffff',
    inputBorder: '#e1e8ed',
    inputFocus: '#1da1f2',
    inputDisabled: '#f7f9fa',
    
    // Button
    buttonPrimary: '#1da1f2',
    buttonPrimaryHover: '#1a91da',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#ffffff',
    buttonSecondaryHover: '#e1e8ed',
    buttonSecondaryText: '#14171a',
    buttonDanger: '#e0245e',
    buttonDangerHover: '#c91c4d',
    buttonDangerText: '#ffffff',
    
    // Link
    link: '#1da1f2',
    linkHover: '#1a91da',
    linkVisited: '#8b44ac',
    
    // Navigation & Sidebar
    navbarBackground: '#ffffff',
    navbarBorder: '#e1e8ed',
    navbarText: '#14171a',
    navbarTextHover: '#1da1f2',
    
    sidebarBackground: '#ffffff',
    sidebarBorder: '#e1e8ed',
    sidebarText: '#14171a',
    sidebarTextHover: '#1da1f2',
    
    notificationBackground: '#ffffff',
    notificationBorder: '#e1e8ed',
    notificationUnreadBackground: '#f7f9fa',
    notificationBadge: '#1da1f2',
    notificationBadgeText: '#ffffff',
    
    // Chat
    chatBackground: '#ffffff',
    chatMessageOwn: '#0084ff',
    chatMessageOwnText: '#ffffff',
    chatMessageOther: '#e8d4f8',
    chatMessageOtherText: '#000000',
    chatInputBackground: '#ffffff',
    chatInputBorder: '#e1e8ed',
    
    // Misc
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    divider: '#e1e8ed',
    overlay: 'rgba(0, 0, 0, 0.5)',
    highlight: '#fff5b1',
    secondaryBackground: '#f7f9fa',
    hoverBackground: '#f0f0f0',
    cardBackgroundHover: '#f7f9fa',
  }
};

const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary colors
    primary: '#1da1f2',
    primaryHover: '#1a91da',
    primaryActive: '#1781c2',
    
    // Background colors
    background: '#15202b',
    backgroundSecondary: '#192734',
    backgroundTertiary: '#22303c',
    backgroundHover: '#1c2938',
    
    // Text colors
    textPrimary: '#ffffff',
    textSecondary: '#8899a6',
    textTertiary: '#6e7f8c',
    textInverted: '#14171a',
    textOnPrimary: '#ffffff',
    
    // Border colors
    border: '#38444d',
    borderLight: '#2f3b47',
    borderDark: '#4a5a68',
    
    // Status colors
    success: '#00ba7c',
    successBackground: '#0d3625',
    warning: '#ffad1f',
    warningBackground: '#3d2f1a',
    error: '#f4212e',
    errorBackground: '#3d1a1f',
    info: '#1da1f2',
    infoBackground: '#1a3d52',
    
    // Card & Modal
    cardBackground: '#192734',
    modalBackground: '#15202b',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    
    // Input
    inputBackground: '#22303c',
    inputBorder: '#38444d',
    inputFocus: '#1da1f2',
    inputDisabled: '#1c2938',
    
    // Button
    buttonPrimary: '#1da1f2',
    buttonPrimaryHover: '#1a91da',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#22303c',
    buttonSecondaryHover: '#2f3b47',
    buttonSecondaryText: '#ffffff',
    buttonDanger: '#f4212e',
    buttonDangerHover: '#d91b28',
    buttonDangerText: '#ffffff',
    
    // Link
    link: '#1da1f2',
    linkHover: '#5ec0f5',
    linkVisited: '#b97fd4',
    
    // Navigation & Sidebar
    navbarBackground: '#15202b',
    navbarBorder: '#38444d',
    navbarText: '#ffffff',
    navbarTextHover: '#1da1f2',
    
    sidebarBackground: '#15202b',
    sidebarBorder: '#38444d',
    sidebarText: '#ffffff',
    sidebarTextHover: '#1da1f2',
    
    notificationBackground: '#192734',
    notificationBorder: '#38444d',
    notificationUnreadBackground: '#1c2938',
    notificationBadge: '#1da1f2',
    notificationBadgeText: '#ffffff',
    
    // Chat
    chatBackground: '#15202b',
    chatMessageOwn: '#0084ff',
    chatMessageOwnText: '#ffffff',
    chatMessageOther: '#8b59b6',
    chatMessageOtherText: '#ffffff',
    chatInputBackground: '#192734',
    chatInputBorder: '#38444d',
    
    // Misc
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    divider: '#38444d',
    overlay: 'rgba(0, 0, 0, 0.7)',
    highlight: '#3d4f1a',
    secondaryBackground: '#1c2938',
    hoverBackground: '#22303c',
    cardBackgroundHover: '#1c2938',
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app-theme');
        if (savedTheme) {
          setThemeMode(savedTheme);
        } else {
          // Use system theme as default
          setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setThemeMode('light');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
      setThemeMode(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (mode) => {
    try {
      await AsyncStorage.setItem('app-theme', mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export { lightTheme, darkTheme };
