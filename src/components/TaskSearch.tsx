import React from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { Search } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../config/theme';
import { TaskFilter } from '../types/task';

interface TaskSearchProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

export function TaskSearch({ searchText, onSearchChange, filter, onFilterChange }: TaskSearchProps) {
  const getChipColor = (type: string, value: string) => {
    if (type === 'priority') {
      switch (value) {
        case 'URGENT': return colors.error;
        case 'HIGH': return colors.secondary;
        case 'MEDIUM': return colors.warning;
        case 'LOW': return colors.info;
        default: return colors.primary;
      }
    } else if (type === 'status') {
      switch (value) {
        case 'OPEN': return colors.primary;
        case 'IN_PROGRESS': return colors.warning;
        case 'COMPLETED': return colors.success;
        case 'CANCELLED': return colors.textTertiary;
        default: return colors.primary;
      }
    } else if (type === 'category') {
      switch (value) {
        case 'FEEDING': return colors.info;
        case 'CLEANING': return colors.secondary;
        case 'HEALTH': return colors.error;
        case 'SHELTER': return colors.warning;
        default: return colors.primary;
      }
    }
    return colors.primary;
  };

  const renderFilterChip = (label: string, filterKey: keyof TaskFilter, value: any) => {
    const isSelected = filter[filterKey] === value;
    const chipColor = getChipColor(String(filterKey), value);
    
    return (
      <Chip
        mode={isSelected ? "flat" : "outlined"}
        selected={isSelected}
        selectedColor={isSelected ? "#ffffff" : chipColor}
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: chipColor }
        ]}
        onPress={() =>
          onFilterChange({
            ...filter,
            [filterKey]: filter[filterKey] === value ? undefined : value,
          })
        }
      >
        {label}
      </Chip>
    );
  };

  return (
    <View style={styles.container}>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    top: 10,
    height: 48,
    flex: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    bottom:2,
    height: 48,
    color: colors.text,
  },
  filterChipsContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: "#ffffff",
    borderRadius: 50,
    height: 36,
  },
}); 