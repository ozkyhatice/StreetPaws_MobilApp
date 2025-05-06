import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Badge } from '../types/badge';

interface BadgeItemProps {
  badge: Badge;
  isNew?: boolean;
  onPress?: () => void;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, isNew, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.5 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 5,
        }),
      ]).start();
    }
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const getBadgeColor = () => {
    switch (badge.level) {
      case 'BRONZE':
        return '#CD7F32';
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'PLATINUM':
        return '#E5E4E2';
      default:
        return '#CD7F32';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: getBadgeColor(),
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={styles.icon}>{badge.icon}</Text>
        <Text style={styles.name}>{badge.name}</Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>Yeni!</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    width: 120,
    height: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4081',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BadgeItem; 