import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design System Constants
export const DESIGN_SYSTEM = {
  // Screen Dimensions
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 375,
    isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
    isLarge: SCREEN_WIDTH >= 414,
  },

  // Colors
  colors: {
    // Primary
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#22c55e',
    primaryBg: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    
    // Success
    success: '#16a34a',
    successBg: '#dcfce7',
    successText: '#166534',
    
    // Error
    error: '#dc2626',
    errorBg: '#fee2e2',
    errorText: '#991b1b',
    
    // Warning
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    warningText: '#92400e',
    
    // Info
    info: '#3b82f6',
    infoBg: '#dbeafe',
    infoText: '#1e40af',
    
    // Neutral
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Background
    background: '#f9fafb',
    surface: '#ffffff',
    
    // Text
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
  },

  // Spacing (8px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Typography
  typography: {
    // Font Sizes
    fontSize: {
      xs: 10,
      sm: 11,
      base: 12,
      md: 13,
      lg: 14,
      xl: 16,
      xxl: 18,
      xxxl: 20,
      huge: 24,
      massive: 28,
      giant: 32,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 6,
    md: 8,
    lg: 10,
    xl: 12,
    xxl: 16,
    full: 9999,
  },

  // Shadows
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  // Component Sizes
  components: {
    // Header
    header: {
      height: Platform.OS === 'ios' ? 100 : 80,
      paddingTop: Platform.OS === 'ios' ? 50 : 40,
    },
    
    // Buttons
    button: {
      height: {
        sm: 32,
        base: 40,
        lg: 48,
      },
      paddingHorizontal: {
        sm: 12,
        base: 16,
        lg: 20,
      },
    },
    
    // Cards
    card: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    
    // Input
    input: {
      height: 44,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    
    // Badge
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    
    // Icon
    icon: {
      sm: 16,
      base: 20,
      md: 24,
      lg: 28,
      xl: 32,
    },
  },

  // Layout
  layout: {
    containerPadding: 16,
    sectionSpacing: 16,
    cardSpacing: 12,
    maxWidth: 600,
  },

  // Animation
  animation: {
    duration: {
      fast: 150,
      base: 250,
      slow: 350,
    },
    easing: {
      default: 'ease-in-out',
      in: 'ease-in',
      out: 'ease-out',
    },
  },
};

// Helper Functions
export const getResponsiveSize = (size) => {
  if (DESIGN_SYSTEM.screen.isSmall) return size * 0.9;
  if (DESIGN_SYSTEM.screen.isLarge) return size * 1.1;
  return size;
};

export const getCardStyle = (variant = 'default') => {
  const base = {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: DESIGN_SYSTEM.spacing.base,
    ...DESIGN_SYSTEM.shadows.base,
  };

  const variants = {
    default: {
      ...base,
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.gray200,
    },
    elevated: {
      ...base,
      ...DESIGN_SYSTEM.shadows.md,
    },
    success: {
      ...base,
      backgroundColor: DESIGN_SYSTEM.colors.primaryBg,
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.primaryBorder,
    },
    warning: {
      ...base,
      backgroundColor: DESIGN_SYSTEM.colors.warningBg,
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.warningBg,
    },
  };

  return variants[variant] || variants.default;
};

export const getButtonStyle = (variant = 'primary', size = 'base') => {
  const base = {
    height: DESIGN_SYSTEM.components.button.height[size],
    paddingHorizontal: DESIGN_SYSTEM.components.button.paddingHorizontal[size],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  const variants = {
    primary: {
      ...base,
      backgroundColor: DESIGN_SYSTEM.colors.primary,
    },
    secondary: {
      ...base,
      backgroundColor: DESIGN_SYSTEM.colors.surface,
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.gray200,
    },
    ghost: {
      ...base,
      backgroundColor: 'transparent',
    },
    danger: {
      ...base,
      backgroundColor: DESIGN_SYSTEM.colors.error,
    },
  };

  return variants[variant] || variants.primary;
};

export const getTextStyle = (variant = 'body', weight = 'regular') => {
  const variants = {
    h1: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.huge,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight.bold,
      color: DESIGN_SYSTEM.colors.textPrimary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.huge * DESIGN_SYSTEM.typography.lineHeight.tight,
    },
    h2: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.xxxl,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
      color: DESIGN_SYSTEM.colors.textPrimary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.xxxl * DESIGN_SYSTEM.typography.lineHeight.tight,
    },
    h3: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.xxl,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
      color: DESIGN_SYSTEM.colors.textPrimary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.xxl * DESIGN_SYSTEM.typography.lineHeight.normal,
    },
    body: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.md,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight[weight],
      color: DESIGN_SYSTEM.colors.textPrimary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.md * DESIGN_SYSTEM.typography.lineHeight.normal,
    },
    caption: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.base,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight[weight],
      color: DESIGN_SYSTEM.colors.textSecondary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.base * DESIGN_SYSTEM.typography.lineHeight.normal,
    },
    small: {
      fontSize: DESIGN_SYSTEM.typography.fontSize.sm,
      fontWeight: DESIGN_SYSTEM.typography.fontWeight[weight],
      color: DESIGN_SYSTEM.colors.textSecondary,
      lineHeight: DESIGN_SYSTEM.typography.fontSize.sm * DESIGN_SYSTEM.typography.lineHeight.normal,
    },
  };

  return variants[variant] || variants.body;
};

export default DESIGN_SYSTEM;
