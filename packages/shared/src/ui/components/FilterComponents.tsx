import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from "react-native";
import type { ReactNode } from "react";
import { X, Plus } from "../../icons";
import { macOSColors } from "../gameUI/constants/macOSDesignSystemColors";

// Container for filter section
interface FilterSectionProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function FilterSection({ children, style }: FilterSectionProps) {
  return <View style={[styles.filterSection, style]}>{children}</View>;
}

// Individual filter badge
interface FilterBadgeProps {
  filter: string;
  onRemove?: () => void;
  active?: boolean;
  color?: string;
}

export function FilterBadge({
  filter,
  onRemove,
  active = true,
  color = "#E5E7EB",
}: FilterBadgeProps) {
  const backgroundColor = active ? `${color}15` : "transparent";
  const borderColor = active ? `${color}40` : `${color}20`;
  const textColor = active ? color : `${color}80`;

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor, borderColor }]}
      onPress={onRemove}
      disabled={!onRemove}
    >
      <Text style={[styles.badgeText, { color: textColor }]} numberOfLines={1}>
        {filter}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <X size={12} color={textColor} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// Add filter input component
interface AddFilterInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
  color?: string;
}

export function AddFilterInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Add filter...",
  color = "#E5E7EB",
}: AddFilterInputProps) {
  return (
    <View style={[styles.inputContainer, { borderColor: `${color}40` }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={`${color}40`}
        style={[styles.input, { color }]}
        autoFocus
        returnKeyType="done"
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
      />
      <View style={styles.inputButtons}>
        {value.trim() && (
          <TouchableOpacity
            onPress={onSubmit}
            style={[
              styles.inlineAddButton,
              { backgroundColor: `${color}15`, borderColor: `${color}40` },
            ]}
          >
            <Text style={[styles.inlineAddButtonText, { color }]}>Add</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <X size={16} color={`${color}60`} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Add filter button
interface AddFilterButtonProps {
  onPress: () => void;
  color?: string;
  label?: string;
}

export function AddFilterButton({
  onPress,
  color = "#E5E7EB",
  label = "Add Filter",
}: AddFilterButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.addButton, { borderColor: `${color}40` }]}
      onPress={onPress}
    >
      <Plus size={14} color={color} />
      <Text style={[styles.addButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Filter list component
interface FilterListProps {
  filters: Set<string> | string[];
  onRemoveFilter?: (filter: string) => void;
  activeFilters?: Set<string>;
  color?: string;
}

export function FilterList({
  filters,
  onRemoveFilter,
  activeFilters,
  color = "#E5E7EB",
}: FilterListProps) {
  const filterArray = Array.from(filters);

  return (
    <View style={styles.filterListColumn}>
      {filterArray.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={styles.filterItemRow}
          onPress={() => onRemoveFilter?.(filter)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterItemText, { color }]} numberOfLines={1}>
            {filter}
          </Text>
          <X size={12} color={`${color}80`} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    padding: 16,
    backgroundColor: "#0F0F0F",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 150,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  inputButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cancelButton: {
    padding: 2,
  },
  inlineAddButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  inlineAddButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginRight: 8,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  filterListColumn: {
    gap: 6,
  },
  filterItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
  },
  filterItemText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "monospace",
    marginRight: 8,
  },
});
