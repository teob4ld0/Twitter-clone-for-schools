import { createContext, useState, useContext, useEffect } from 'react';

// Tema Claro - Todos los colores hardcodeados
const lightTheme = {
  name: 'light',
  colors: {
    // Colores principales
    primary: '#1da1f2',
    primaryHover: '#1a91da',
    primaryLight: '#e8f5fe',
    
    // Fondos
    background: '#ffffff',
    backgroundSecondary: '#f5f8fa',
    backgroundTertiary: '#e1e8ed',
    backgroundHover: '#f7f9fa',
    
    // Texto
    textPrimary: '#0f1419',
    textSecondary: '#536471',
    textTertiary: '#8b98a5',
    textInverted: '#ffffff',
    
    // Bordes
    border: '#e1e8ed',
    borderLight: '#eff3f4',
    borderHover: '#cfd9de',
    
    // Estados
    success: '#17bf63',
    successLight: '#e8f7ed',
    error: '#f4212e',
    errorLight: '#fce8e9',
    warning: '#ffad1f',
    warningLight: '#fff3e0',
    info: '#1da1f2',
    infoLight: '#e8f5fe',
    
    // Elementos de UI
    cardBackground: '#ffffff',
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.4)',
    
    // Inputs
    inputBackground: '#ffffff',
    inputBorder: '#cfd9de',
    inputFocus: '#1da1f2',
    inputDisabled: '#f7f9fa',
    
    // Botones
    buttonPrimary: '#1da1f2',
    buttonPrimaryHover: '#1a91da',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#eff3f4',
    buttonSecondaryHover: '#e1e8ed',
    buttonSecondaryText: '#0f1419',
    buttonDanger: '#f4212e',
    buttonDangerHover: '#d91c27',
    buttonDangerText: '#ffffff',
    
    // Links
    link: '#1da1f2',
    linkHover: '#1a91da',
    linkVisited: '#9266cc',
    
    // Navbar
    navbarBackground: '#ffffff',
    navbarBorder: '#e1e8ed',
    navbarText: '#0f1419',
    navbarTextHover: '#1da1f2',
    
    // Sidebar
    sidebarBackground: '#ffffff',
    sidebarBorder: '#e1e8ed',
    sidebarText: '#0f1419',
    sidebarTextHover: '#1da1f2',
    
    // Notifications
    notificationBackground: '#ffffff',
    notificationBorder: '#e1e8ed',
    notificationUnread: '#e8f5fe',
    notificationBadge: '#f4212e',
    notificationBadgeText: '#ffffff',
    
    // Chat
    chatBackground: '#ffffff',
    chatMessageOwn: '#1da1f2',
    chatMessageOwnText: '#ffffff',
    chatMessageOther: '#eff3f4',
    chatMessageOtherText: '#0f1419',
    chatInputBackground: '#ffffff',
    chatInputBorder: '#e1e8ed',
    
    // Posts/Status
    postBackground: '#ffffff',
    postBorder: '#eff3f4',
    postHoverBackground: '#f7f9fa',
    
    // Profile
    profileHeaderBackground: '#cfd9de',
    profileAvatarBorder: '#ffffff',
    
    // Shadows
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
    shadowLg: '0 10px 20px rgba(0, 0, 0, 0.15)',
    shadowXl: '0 20px 25px rgba(0, 0, 0, 0.2)',
    
    // Scrollbar
    scrollbarTrack: '#f5f8fa',
    scrollbarThumb: '#cfd9de',
    scrollbarThumbHover: '#aab8c2',
  }
};

// Tema Oscuro - Todos los colores hardcodeados
const darkTheme = {
  name: 'dark',
  colors: {
    // Colores principales
    primary: '#1da1f2',
    primaryHover: '#1a91da',
    primaryLight: '#1e3a52',
    
    // Fondos
    background: '#000000',
    backgroundSecondary: '#16181c',
    backgroundTertiary: '#202327',
    backgroundHover: '#1c1f23',
    
    // Texto
    textPrimary: '#e7e9ea',
    textSecondary: '#71767b',
    textTertiary: '#565a5e',
    textInverted: '#000000',
    
    // Bordes
    border: '#2f3336',
    borderLight: '#38383a',
    borderHover: '#3e4144',
    
    // Estados
    success: '#00ba7c',
    successLight: '#0d3625',
    error: '#f4212e',
    errorLight: '#3d1a1c',
    warning: '#ffad1f',
    warningLight: '#3d3018',
    info: '#1da1f2',
    infoLight: '#1e3a52',
    
    // Elementos de UI
    cardBackground: '#16181c',
    modalBackground: '#000000',
    modalOverlay: 'rgba(91, 112, 131, 0.4)',
    
    // Inputs
    inputBackground: '#202327',
    inputBorder: '#2f3336',
    inputFocus: '#1da1f2',
    inputDisabled: '#16181c',
    
    // Botones
    buttonPrimary: '#1da1f2',
    buttonPrimaryHover: '#1a91da',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#202327',
    buttonSecondaryHover: '#2f3336',
    buttonSecondaryText: '#e7e9ea',
    buttonDanger: '#f4212e',
    buttonDangerHover: '#d91c27',
    buttonDangerText: '#ffffff',
    
    // Links
    link: '#1da1f2',
    linkHover: '#5eb5f4',
    linkVisited: '#9266cc',
    
    // Navbar
    navbarBackground: '#000000',
    navbarBorder: '#2f3336',
    navbarText: '#e7e9ea',
    navbarTextHover: '#1da1f2',
    
    // Sidebar
    sidebarBackground: '#000000',
    sidebarBorder: '#2f3336',
    sidebarText: '#e7e9ea',
    sidebarTextHover: '#1da1f2',
    
    // Notifications
    notificationBackground: '#16181c',
    notificationBorder: '#2f3336',
    notificationUnread: '#1e3a52',
    notificationBadge: '#f4212e',
    notificationBadgeText: '#ffffff',
    
    // Chat
    chatBackground: '#000000',
    chatMessageOwn: '#1da1f2',
    chatMessageOwnText: '#ffffff',
    chatMessageOther: '#2f3336',
    chatMessageOtherText: '#e7e9ea',
    chatInputBackground: '#202327',
    chatInputBorder: '#2f3336',
    
    // Posts/Status
    postBackground: '#000000',
    postBorder: '#2f3336',
    postHoverBackground: '#16181c',
    
    // Profile
    profileHeaderBackground: '#333639',
    profileAvatarBorder: '#000000',
    
    // Shadows
    shadowSm: '0 1px 3px rgba(255, 255, 255, 0.05)',
    shadowMd: '0 4px 6px rgba(255, 255, 255, 0.07)',
    shadowLg: '0 10px 20px rgba(255, 255, 255, 0.1)',
    shadowXl: '0 20px 25px rgba(255, 255, 255, 0.15)',
    
    // Scrollbar
    scrollbarTrack: '#16181c',
    scrollbarThumb: '#2f3336',
    scrollbarThumbHover: '#565a5e',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Leer tema guardado del localStorage, por defecto 'light'
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('app-theme');
      // Solo aceptar 'dark' si está explícitamente guardado, sino siempre 'light'
      return savedTheme === 'dark' ? 'dark' : 'light';
    } catch (error) {
      // Si hay error accediendo a localStorage, usar 'light' por defecto
      console.warn('Error reading theme from localStorage:', error);
      return 'light';
    }
  });

  // Siempre asegurarnos de que theme esté definido, con fallback a lightTheme
  const theme = currentTheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Guardar el tema en localStorage
    localStorage.setItem('app-theme', currentTheme);
    
    // Aplicar clase al body para estilos globales
    document.body.setAttribute('data-theme', currentTheme);
    
    // Aplicar color de fondo al body inmediatamente
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.textPrimary;
  }, [currentTheme, theme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (themeName) => {
    if (themeName === 'light' || themeName === 'dark') {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    theme,
    currentTheme,
    toggleTheme,
    setTheme,
    isDark: currentTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // En desarrollo, mostrar error claro
    console.error('useTheme must be used within a ThemeProvider');
    // Retornar un tema por defecto para evitar crashes
    return {
      theme: lightTheme,
      currentTheme: 'light',
      toggleTheme: () => console.warn('ThemeProvider not found'),
      setTheme: () => console.warn('ThemeProvider not found'),
      isDark: false,
    };
  }
  return context;
}
