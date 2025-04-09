import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { colors, typography, borderRadius, spacing, shadows } from '../config/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.textDisabled;
    
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
      case 'text':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return colors.primary;
      case 'text':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          minHeight: 32,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          minHeight: 56,
        };
      case 'medium':
      default:
        return {
          paddingVertical: spacing.buttonPadding,
          paddingHorizontal: spacing.md,
          minHeight: 44,
        };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return { ...typography.button, fontSize: 14 };
      case 'large':
        return { ...typography.button, fontSize: 18 };
      case 'medium':
      default:
        return typography.button;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineButton,
        variant !== 'text' && variant !== 'outline' && styles.elevated,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <React.Fragment>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text style={[styles.text, getTextSize(), { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </React.Fragment>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  elevated: {
    ...shadows.small,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {},
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
}); 