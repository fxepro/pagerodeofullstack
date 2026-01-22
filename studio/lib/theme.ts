/**
 * Centralized Theme Configuration
 * Single source of truth for all styling across the application
 */

// Theme types
export type ThemeVariant = 'light' | 'dark' | 'auto';
export type ThemeMode = 'light' | 'dark';

// Theme storage key
const THEME_STORAGE_KEY = 'pagerodeo-theme';

// Get current theme from localStorage or system preference
export const getCurrentTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant;
  
  if (stored === 'auto' || !stored) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return stored;
};

// Set theme preference
export const setTheme = (theme: ThemeVariant) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  
  // Apply theme immediately
  const currentMode = getCurrentTheme();
  document.documentElement.setAttribute('data-theme', currentMode);
};

// Initialize theme on app load
export const initializeTheme = () => {
  if (typeof window === 'undefined') return;
  
  const currentMode = getCurrentTheme();
  document.documentElement.setAttribute('data-theme', currentMode);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant;
    if (stored === 'auto' || !stored) {
      const newMode = getCurrentTheme();
      document.documentElement.setAttribute('data-theme', newMode);
    }
  });
};

export const theme = {
  // Color Palette
  colors: {
    // Light Theme (Default)
    light: {
      // Background Colors
      background: 'bg-gradient-to-br from-slate-100 to-slate-200',
      backgroundSolid: 'bg-slate-100',
      
      // Card Colors
      card: 'bg-white',
      cardBorder: 'border-slate-200',
      cardShadow: 'shadow-sm',
      
      // Text Colors
      textPrimary: 'text-slate-800',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-500',
      
      // Header Colors
      headerBackground: 'bg-gradient-to-r from-slate-100 to-slate-200/80 backdrop-blur-sm',
      headerBorder: 'border-slate-300/50',
      
      // Sidebar Colors
      sidebarBackground: 'bg-gradient-to-b from-slate-100 to-slate-200/80 backdrop-blur-sm',
      sidebarBorder: 'border-slate-300/50',
      
      // Button Colors
      buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
      buttonSecondary: 'bg-white hover:bg-purple-50 border-purple-200 text-slate-800',
      buttonGhost: 'text-slate-600 hover:text-purple-700 hover:bg-purple-200/50',
      
      // Status Colors
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-purple-600',
      
      // Icon Colors
      iconPrimary: 'text-purple-600',
      iconSecondary: 'text-green-600',
      iconTertiary: 'text-purple-600',
      iconWarning: 'text-yellow-600',
      iconError: 'text-red-600',
    },
    
    // Dark Theme
    dark: {
      // Background Colors
      background: 'bg-gradient-to-br from-gray-900 to-gray-800',
      backgroundSolid: 'bg-gray-900',
      
      // Card Colors
      card: 'bg-gray-800',
      cardBorder: 'border-gray-700',
      cardShadow: 'shadow-lg',
      
      // Text Colors
      textPrimary: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      
      // Header Colors
      headerBackground: 'bg-gradient-to-r from-gray-900 to-gray-800/80 backdrop-blur-sm',
      headerBorder: 'border-gray-700/50',
      
      // Sidebar Colors
      sidebarBackground: 'bg-gradient-to-b from-gray-900 to-gray-800/80 backdrop-blur-sm',
      sidebarBorder: 'border-gray-700/50',
      
      // Button Colors
      buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
      buttonSecondary: 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-white',
      buttonGhost: 'text-gray-300 hover:text-white hover:bg-gray-700/50',
      
      // Status Colors
      success: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      info: 'text-purple-400',
      
      // Icon Colors
      iconPrimary: 'text-purple-400',
      iconSecondary: 'text-green-400',
      iconTertiary: 'text-purple-400',
      iconWarning: 'text-yellow-400',
      iconError: 'text-red-400',
    }
  },
  
  // Layout Classes
  layout: {
    // Page Layout
    pageContainer: 'p-6 space-y-6',
    pageBackground: 'min-h-screen bg-gradient-to-br from-slate-100 to-slate-200',
    
    // Header Layout
    headerContainer: 'bg-gradient-to-r from-slate-100 to-slate-200/80 backdrop-blur-sm border-b border-slate-300/50 px-6 py-4',
    headerBox: 'bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm flex items-center h-14',
    
    // Sidebar Layout
    sidebarContainer: 'fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-slate-100 to-slate-200/80 backdrop-blur-sm border-r border-slate-300/50 overflow-y-auto',
    sidebarItem: 'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group',
    sidebarItemActive: 'bg-slate-600 text-white',
    sidebarItemInactive: 'text-slate-700 hover:text-slate-800 hover:bg-slate-200/50',
    
    // Card Layout
    cardContainer: 'bg-white border-slate-200 shadow-sm',
    cardHeader: 'p-6',
    cardContent: 'p-6',
    
    // Grid Layout
    statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    contentGrid: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  },
  
  // Typography
  typography: {
    // Headings (using dynamic typography from Theme Manager)
    h1: 'text-h1-dynamic font-bold',
    h2: 'text-h2-dynamic font-bold',
    h3: 'text-h3-dynamic font-semibold',
    h4: 'text-h4-dynamic font-semibold',
    
    // Body Text
    body: 'text-base-dynamic text-slate-600',
    bodyLarge: 'text-h4-dynamic text-slate-600',
    bodySmall: 'text-sm text-slate-600',
    
    // Labels
    label: 'text-sm font-medium text-slate-600',
    labelSmall: 'text-xs font-medium text-slate-600',
  },
  
  // Component Styles
  components: {
    // Buttons
    button: {
      primary: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors',
      secondary: 'bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 px-4 py-2 rounded-lg font-medium transition-colors',
      ghost: 'text-slate-600 hover:text-purple-700 hover:bg-purple-200/50 px-4 py-2 rounded-lg font-medium transition-colors',
    },
    
    // Cards
    card: {
      container: 'bg-white border border-slate-200 rounded-lg shadow-sm',
      header: 'p-6 border-b border-slate-200',
      content: 'p-6',
      footer: 'p-6 border-t border-slate-200',
    },
    
    // Forms
    input: {
      container: 'w-full',
      field: 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent',
      label: 'block text-sm font-medium text-slate-600 mb-2',
    },
    
    // Badges
    badge: {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  },
  
  // Animation Classes
  animations: {
    transition: 'transition-all duration-200',
    hover: 'hover:scale-105 hover:shadow-lg',
    fadeIn: 'animate-fade-in',
    slideIn: 'animate-slide-in',
  },
} as const;

// Helper functions for easy theme application
export const getTheme = (variant: ThemeMode = 'light') => theme.colors[variant];

export const applyTheme = {
  // Page-level theming
  page: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors.background} ${theme.layout.pageContainer}`;
  },
  
  // Header theming
  header: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors.headerBackground} ${theme.layout.headerContainer}`;
  },
  headerBox: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors.card} ${themeColors.cardBorder} ${theme.layout.headerBox}`;
  },
  
  // Sidebar theming
  sidebar: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors.sidebarBackground} ${theme.layout.sidebarContainer}`;
  },
  sidebarItem: (active: boolean = false) => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${theme.layout.sidebarItem} ${active ? theme.layout.sidebarItemActive : theme.layout.sidebarItemInactive}`;
  },
  
  // Card theming
  card: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors.card} ${themeColors.cardBorder} ${themeColors.cardShadow} rounded-lg`;
  },
  cardHeader: () => `${theme.components.card.header}`,
  cardContent: () => `${theme.components.card.content}`,
  
  // Button theming
  button: (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${themeColors[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof themeColors]} ${theme.animations.transition}`;
  },
  
  // Text theming
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6 = 1) => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    // Use dynamic typography classes from Theme Manager (respects Theme Manager settings)
    const dynamicSize = `text-h${level}-dynamic`;
    // Use palette primary color for headings to make them dynamic
    return `${dynamicSize} font-bold text-palette-primary`;
  },
  text: (size: 'body' | 'bodyLarge' | 'bodySmall' | 'primary' | 'secondary' | 'muted' | 'label' = 'body') => {
    if (size === 'label') {
      const currentTheme = getCurrentTheme();
      const themeColors = getTheme(currentTheme);
      return `${theme.typography.label} ${themeColors.textSecondary}`;
    }
    
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    
    if (size === 'primary') return themeColors.textPrimary;
    if (size === 'secondary') return themeColors.textSecondary;
    if (size === 'muted') return themeColors.textMuted;
    
    return `${theme.typography[size]} ${themeColors.textSecondary}`;
  },
  
  // Status theming
  status: (type: 'success' | 'warning' | 'error' | 'info') => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return themeColors[type];
  },
  
  // Label theming
  label: () => {
    const currentTheme = getCurrentTheme();
    const themeColors = getTheme(currentTheme);
    return `${theme.typography.label} ${themeColors.textSecondary}`;
  },
};

// Export theme constants for direct use
export const COLORS = theme.colors.light;
export const LAYOUT = theme.layout;
export const TYPOGRAPHY = theme.typography;
export const COMPONENTS = theme.components;
export const ANIMATIONS = theme.animations;
