import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Star, Trophy } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { bounceIn, pulse } from '../utils/animations';

interface XPProgressProps {
  currentXP: number;
  levelXP: number;
  level: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const XPProgress: React.FC<XPProgressProps> = ({
  currentXP,
  levelXP,
  level,
  rank,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Progress bar animasyonu
    Animated.timing(progressAnim, {
      toValue: currentXP / levelXP,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Seviye göstergesi animasyonu
    bounceIn(scaleAnim).start();

    // XP ikonu pulse animasyonu
    pulse(pulseAnim, 2000).start();
  }, [currentXP, levelXP]);

  const rankColors = colors.level[rank];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelContainer}>
          <Animated.View
            style={[
              styles.levelBadge,
              {
                backgroundColor: rankColors.start,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Trophy size={24} color={rankColors.text} />
            <Text style={[styles.levelText, { color: rankColors.text }]}>
              Seviye {level}
            </Text>
          </Animated.View>
        </View>
        <Animated.View
          style={[
            styles.xpContainer,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: colors.points.xp.background,
            },
          ]}
        >
          <Star size={20} color={colors.points.xp.text} />
          <Text style={[styles.xpText, { color: colors.points.xp.text }]}>
            {currentXP} / {levelXP} XP
          </Text>
        </Animated.View>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBackground,
            {
              backgroundColor: rankColors.start,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: rankColors.text,
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelContainer: {
    flex: 1,
    marginRight: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  levelText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  xpText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBackground: {
    flex: 1,
    borderRadius: 4,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
}); 