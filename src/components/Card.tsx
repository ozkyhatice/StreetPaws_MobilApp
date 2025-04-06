import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, borderRadius } from '../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card = ({ children, style, variant = 'elevated' }: CardProps) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    padding: 16,
  },
  elevated: {
    ...shadows.small,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
}); 