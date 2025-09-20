import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ViewStyle,
} from "react-native";
import { Search, Edit3, Check, X } from "../../icons";
import { gameUIColors } from "../gameUI";
import { CopyButton } from "./CopyButton";

interface DataInspectorProps {
  data: any;
  mode?: "view" | "edit" | "diff";
  syntax?: "json" | "xml" | "text";
  theme?: "dark" | "light";
  collapsible?: boolean;
  searchable?: boolean;
  onEdit?: (newData: any) => void;
  style?: ViewStyle;
  title?: string;
}

export function DataInspector({
  data,
  mode = "view",
  syntax = "json",
  theme = "dark",
  collapsible = true,
  searchable = true,
  onEdit,
  style,
  title,
}: DataInspectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState("");
  const formatData = () => {
    if (syntax === "json") {
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
      }
    }
    return String(data);
  };

  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const handleEdit = () => {
    if (!isEditing) {
      setEditedData(formatData());
      setIsEditing(true);
    } else {
      try {
        const newData = syntax === "json" ? JSON.parse(editedData) : editedData;
        onEdit?.(newData);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to parse edited data", error);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedData("");
  };

  const formattedData = formatData();

  return (
    <View style={[styles.container, style]}>
      {(title || searchable || mode === "edit") && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.controls}>
            {searchable && !isEditing && (
              <View style={styles.searchContainer}>
                <Search size={12} color={gameUIColors.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={gameUIColors.tertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}
            {mode === "edit" && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={isEditing ? handleEdit : () => handleEdit()}
              >
                {isEditing ? (
                  <Check size={14} color={gameUIColors.success} />
                ) : (
                  <Edit3 size={14} color={gameUIColors.primary} />
                )}
              </TouchableOpacity>
            )}
            {isEditing && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEdit}
              >
                <X size={14} color={gameUIColors.error} />
              </TouchableOpacity>
            )}
            {!isEditing && <CopyButton value={formattedData} size={12} />}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {isEditing ? (
            <TextInput
              style={styles.editor}
              value={editedData}
              onChangeText={setEditedData}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.codeText}>
              {searchQuery
                ? (highlightSearch(formattedData) as any)
                : formattedData}
            </Text>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

interface JsonViewerProps {
  data: any;
  searchable?: boolean;
  style?: ViewStyle;
}

DataInspector.Json = function JsonViewer({
  data,
  searchable,
  style,
}: JsonViewerProps) {
  return (
    <DataInspector
      data={data}
      syntax="json"
      mode="view"
      searchable={searchable}
      style={style}
    />
  );
};

interface EditableProps {
  data: any;
  onSave: (newData: any) => void;
  style?: ViewStyle;
}

DataInspector.Editable = function Editable({
  data,
  onSave,
  style,
}: EditableProps) {
  return (
    <DataInspector data={data} mode="edit" onEdit={onSave} style={style} />
  );
};

interface DiffViewProps {
  oldData: any;
  newData: any;
  style?: ViewStyle;
}

DataInspector.Diff = function DiffView({
  oldData,
  newData,
  style,
}: DiffViewProps) {
  const [showMode, setShowMode] = useState<"old" | "new" | "diff">("diff");

  return (
    <View style={style}>
      <View style={styles.diffControls}>
        <TouchableOpacity
          style={[
            styles.diffButton,
            showMode === "old" && styles.diffButtonActive,
          ]}
          onPress={() => setShowMode("old")}
        >
          <Text style={styles.diffButtonText}>Old</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.diffButton,
            showMode === "new" && styles.diffButtonActive,
          ]}
          onPress={() => setShowMode("new")}
        >
          <Text style={styles.diffButtonText}>New</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.diffButton,
            showMode === "diff" && styles.diffButtonActive,
          ]}
          onPress={() => setShowMode("diff")}
        >
          <Text style={styles.diffButtonText}>Diff</Text>
        </TouchableOpacity>
      </View>

      {showMode === "old" && (
        <DataInspector data={oldData} searchable={false} />
      )}
      {showMode === "new" && (
        <DataInspector data={newData} searchable={false} />
      )}
      {showMode === "diff" && (
        <View style={styles.diffContainer}>
          <View style={styles.diffPane}>
            <Text style={styles.diffPaneTitle}>Old</Text>
            <DataInspector data={oldData} searchable={false} />
          </View>
          <View style={styles.diffPane}>
            <Text style={styles.diffPaneTitle}>New</Text>
            <DataInspector data={newData} searchable={false} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.background,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: gameUIColors.border + "20",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: gameUIColors.text,
  },
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gameUIColors.panel,
    borderRadius: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  searchInput: {
    fontSize: 11,
    color: gameUIColors.text,
    minWidth: 100,
    paddingVertical: 4,
  },
  editButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: gameUIColors.primary + "20",
  },
  cancelButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: gameUIColors.error + "20",
  },
  scrollView: {
    maxHeight: 300,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: gameUIColors.text,
    padding: 12,
    lineHeight: 16,
  },
  editor: {
    fontFamily: "monospace",
    fontSize: 11,
    color: gameUIColors.text,
    padding: 12,
    lineHeight: 16,
    minHeight: 200,
  },
  highlight: {
    backgroundColor: gameUIColors.warning + "40",
    color: gameUIColors.text,
  },
  diffControls: {
    flexDirection: "row",
    gap: 8,
    padding: 8,
  },
  diffButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: gameUIColors.panel,
  },
  diffButtonActive: {
    backgroundColor: gameUIColors.primary,
  },
  diffButtonText: {
    fontSize: 11,
    color: gameUIColors.text,
    fontWeight: "500",
  },
  diffContainer: {
    flexDirection: "row",
    gap: 8,
  },
  diffPane: {
    flex: 1,
  },
  diffPaneTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: gameUIColors.secondary,
    padding: 8,
    textTransform: "uppercase",
  },
});
