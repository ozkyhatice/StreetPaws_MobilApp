import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { colors } from '../config/theme';
import { TaskList } from './TaskList';
import { EmergencyTaskList } from './EmergencyTaskList';
import { TaskProgressCard } from './TaskProgressCard';
import { TaskFilter } from '../types/task';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

interface TaskTabsProps {
  navigation: NavigationProp<RootStackParamList>;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  userId?: string;
  onBadgePress: () => void;
  tabIndex: number;
  onTabChange: (index: number) => void;
}

export function TaskTabs({
  navigation,
  filter,
  onFilterChange,
  userId,
  onBadgePress,
  tabIndex,
  onTabChange
}: TaskTabsProps) {
  const routes = [
    { key: 'emergency', title: 'Acil Durumlar' },
    { key: 'regular', title: 'Görevler' }
  ];

  const EmergencyTasksRoute = () => (
    <EmergencyTaskList navigation={navigation} />
  );

  const RegularTasksRoute = () => (
    <View style={styles.tabContent}>
      <TaskList 
        filter={filter} 
        onFilterChange={onFilterChange} 
        navigation={navigation}
      />
      {userId && (
        <TaskProgressCard 
          userId={userId} 
          onBadgePress={onBadgePress} 
        />
      )}
    </View>
  );

  const renderScene = SceneMap({
    emergency: EmergencyTasksRoute,
    regular: RegularTasksRoute,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={colors.primary}
      inactiveColor={colors.textSecondary}
    />
  );

  return (
    <TabView
      navigationState={{ index: tabIndex, routes }}
      renderScene={renderScene}
      onIndexChange={onTabChange}
      initialLayout={{ width }}
      renderTabBar={renderTabBar}
    />
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.background,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 