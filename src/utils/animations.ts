import { Animated, Easing } from 'react-native';

export const fadeIn = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const fadeOut = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const slideUp = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.back(1.5)),
  });
};

export const slideDown = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.back(1.5)),
  });
};

export const pulse = (value: Animated.Value, duration = 1000) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: duration / 2,
      useNativeDriver: true,
      easing: Easing.ease,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: duration / 2,
      useNativeDriver: true,
      easing: Easing.ease,
    }),
  ]);
};

export const shake = (value: Animated.Value, duration = 500) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 10,
      duration: duration / 5,
      useNativeDriver: true,
      easing: Easing.linear,
    }),
    Animated.timing(value, {
      toValue: -10,
      duration: duration / 5,
      useNativeDriver: true,
      easing: Easing.linear,
    }),
    Animated.timing(value, {
      toValue: 6,
      duration: duration / 5,
      useNativeDriver: true,
      easing: Easing.linear,
    }),
    Animated.timing(value, {
      toValue: -6,
      duration: duration / 5,
      useNativeDriver: true,
      easing: Easing.linear,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: duration / 5,
      useNativeDriver: true,
      easing: Easing.linear,
    }),
  ]);
};

export const bounceIn = (value: Animated.Value, duration = 800) => {
  return Animated.spring(value, {
    toValue: 1,
    useNativeDriver: true,
    tension: 50,
    friction: 3,
  });
};

export const rotateLoop = (value: Animated.Value, duration = 2000) => {
  return Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.linear,
    })
  );
}; 