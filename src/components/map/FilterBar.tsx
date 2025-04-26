import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { Filter, ChevronUp } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../config/theme';

type FilterBarProps = {
  categories: string[];
  filteredCategory: string | null;
  showFilters: boolean;
  onToggleFilters: () => void;
  onSelectCategory: (category: string | null) => void;
};

export const FilterBar = React.memo(({ 
  categories, 
  filteredCategory, 
  showFilters, 
  onToggleFilters,
  onSelectCategory 
}: FilterBarProps) => {
  return (
    <>
      <View style={styles.header}>
        <FAB
          icon={props => showFilters 
            ? <ChevronUp {...props} color={colors.primary} /> 
            : <Filter {...props} color={colors.primary} />
          }
          style={styles.filterToggleButton}
          size="small"
          onPress={onToggleFilters}
        />
      </View>
      
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, !filteredCategory && styles.activeFilterChip]}
              onPress={() => onSelectCategory(null)}
            >
              <Text style={!filteredCategory ? styles.activeFilterText : styles.filterText}>
                Tümü
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  filteredCategory === category && styles.activeFilterChip
                ]}
                onPress={() => onSelectCategory(category)}
              >
                <Text style={
                  filteredCategory === category 
                    ? styles.activeFilterText 
                    : styles.filterText
                }>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  filterToggleButton: {
    backgroundColor: colors.background,
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  filtersScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    marginRight: spacing.xs,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text,
  },
  activeFilterText: {
    color: colors.background,
  },
}); 