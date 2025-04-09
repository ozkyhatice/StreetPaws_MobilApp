export const colors = {
  // Primary brand colors
  primary: '#4CAF50', // Green - Main brand color
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  
  // Secondary accent colors
  secondary: '#FF6B6B', // Coral - Secondary accent
  secondaryLight: '#FF9E80',
  secondaryDark: '#E64A19',
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceVariant: '#F0F2F5',
  
  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  textDisabled: '#BDBDBD',
  
  // Status colors
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Borders and dividers
  border: '#E0E0E0',
  divider: '#EEEEEE',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Common component spacing
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  subtitle1: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  subtitle2: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#757575',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const borderRadius = {
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  round: 999,
}; 