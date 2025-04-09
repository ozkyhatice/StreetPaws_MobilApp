import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  elevation?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'normal' | 'large';
  backgroundColor?: string;
  borderRadius?: number;
}

export const Card = ({
  children,
  style,
  variant = 'elevated',
  elevation = 'small',
  padding = 'normal',
  backgroundColor = colors.background,
  borderRadius: customBorderRadius,
}: CardProps) => {
  return (
    <View
      style={[
        styles.card,
        getPaddingStyle(padding),
        { 
          backgroundColor,
          borderRadius: customBorderRadius ?? borderRadius.medium,
        },
        variant === 'elevated' && getShadowStyle(elevation),
        variant === 'outlined' && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const getPaddingStyle = (padding: 'none' | 'small' | 'normal' | 'large') => {
  switch (padding) {
    case 'none':
      return { padding: 0 };
    case 'small':
      return { padding: spacing.sm };
    case 'large':
      return { padding: spacing.lg };
    case 'normal':
    default:
      return { padding: spacing.cardPadding };
  }
};

const getShadowStyle = (elevation: 'none' | 'small' | 'medium' | 'large') => {
  const shadowStyle = shadows[elevation];
  
  if (Platform.OS === 'android') {
    return {
      elevation: elevation === 'none' ? 0 : 
                elevation === 'small' ? 2 : 
                elevation === 'medium' ? 4 : 8,
    };
  }
  
  return shadowStyle;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    overflow: 'hidden', // Ensures content doesn't overflow the rounded corners
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
}); 