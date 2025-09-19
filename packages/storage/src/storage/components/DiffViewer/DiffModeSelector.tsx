import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  gameUIColors,
  macOSColors,
  FileCode,
  Layers,
  FileText,
  GitBranch,
} from "@monorepo/shared";

export type DiffMode = "inline" | "side-by-side" | "unified" | "structure";

interface DiffModeSelectorProps {
  currentMode: DiffMode;
  onModeChange: (mode: DiffMode) => void;
  changeCount: number;
}

const MODES = [
  { id: "inline" as DiffMode, label: "Inline", icon: FileCode },
  { id: "side-by-side" as DiffMode, label: "Split", icon: Layers },
  { id: "unified" as DiffMode, label: "Unified", icon: FileText },
  { id: "structure" as DiffMode, label: "Structure", icon: GitBranch },
];

export function DiffModeSelector({
  currentMode,
  onModeChange,
  changeCount,
}: DiffModeSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Found {changeCount} change{changeCount !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.modeSelector}>
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeButton, isActive && styles.modeButtonActive]}
              onPress={() => onModeChange(mode.id)}
              activeOpacity={0.7}
            >
              <Icon
                size={12}
                color={isActive ? macOSColors.semantic.info : macOSColors.text.muted}
              />
              <Text
                style={[styles.modeLabel, isActive && styles.modeLabelActive]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    padding: 2,
    gap: 2,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  modeButtonActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
  },
  modeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  modeLabelActive: {
    color: macOSColors.semantic.info,
  },
});
