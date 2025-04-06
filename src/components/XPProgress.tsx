import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../config/theme';

interface XPProgressProps {
  level: number;
  progress: number;
  totalXP: number;
}

export const XPProgress = ({ level, progress, totalXP }: XPProgressProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Seviye {level}</Text>
        <Text style={styles.xpText}>{totalXP} XP</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    ...typography.h3,
    color: colors.primary,
  },
  xpText: {
    ...typography.body,
    color: colors.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    minWidth: 40,
    textAlign: 'right',
  },
}); 