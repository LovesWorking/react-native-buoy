import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Terminal } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ExpandableSectionHeader } from "../sections/ExpandableSectionHeader";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";

// Stable constants moved to module scope to prevent re-renders [[memory:4875251]]
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

// Section definition interface
export interface DebugSection {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  content: (onClose: () => void) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}

interface ReusableDebugModalProps {
  visible: boolean;
  onClose: () => void;
  sections: DebugSection[];
  defaultTitle?: string;
  modalTitle?: string;
}

export function ReusableDebugModal({
  visible,
  onClose,
  sections,
  defaultTitle = "Debug Console",
  modalTitle,
}: ReusableDebugModalProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleSectionPress = (section: DebugSection) => {
    setSelectedSection(section.id);
    section.onOpen?.();
  };

  const handleBackPress = () => {
    const currentSection = sections.find((s) => s.id === selectedSection);
    currentSection?.onClose?.();
    setSelectedSection(null);
  };

  const handleCloseModal = () => {
    const currentSection = sections.find((s) => s.id === selectedSection);
    currentSection?.onClose?.();
    setSelectedSection(null);
    onClose();
  };

  // Helper function to render the content-specific header elements
  const renderHeaderContent = () => {
    const currentSection = sections.find((s) => s.id === selectedSection);

    return (
      <View style={styles.headerContainer}>
        {selectedSection && (
          <Pressable
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={HIT_SLOP}
          >
            <ChevronLeft color="#E5E7EB" size={20} />
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {selectedSection && currentSection
              ? currentSection.title || "NO TITLE"
              : modalTitle || defaultTitle || "DEFAULT TITLE"}
          </Text>
        </View>
      </View>
    );
  };

  // Get the subtitle for the currently selected section
  const getHeaderSubtitle = () => {
    if (!selectedSection) return undefined;
    const currentSection = sections.find((s) => s.id === selectedSection);
    return currentSection?.subtitle;
  };

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={handleCloseModal}
      storagePrefix="@reusable_debug_modal"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={getHeaderSubtitle()}
    >
      {/* Main content */}
      <View style={styles.content}>
        {selectedSection ? (
          // Detail View - Show selected section content
          <>
            <ScrollView
              style={styles.detailScrollContainer}
              contentContainerStyle={styles.detailScrollContent}
            >
              {(() => {
                const section = sections.find((s) => s.id === selectedSection);
                return section?.content(handleCloseModal) || null;
              })()}
            </ScrollView>
            {/* Safe area for detail view */}
            <View style={[styles.detailSafeArea, { height: insets.bottom }]} />
          </>
        ) : (
          // Section List View - Show all sections
          <>
            <ScrollView
              style={styles.sectionListContainer}
              contentContainerStyle={styles.sectionListContent}
            >
              {sections.map((section) => (
                <Pressable
                  key={section.id}
                  onPress={() => handleSectionPress(section)}
                  style={styles.sectionCard}
                  android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                >
                  <View style={styles.sectionCardContent}>
                    <ExpandableSectionHeader
                      title={section.title}
                      subtitle={section.subtitle || ""}
                      icon={section.icon}
                      iconColor={section.iconColor}
                      iconBackgroundColor={section.iconBackgroundColor}
                      isExpanded={false}
                      onPress={() => handleSectionPress(section)}
                    />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            {/* Safe area for section list */}
            <View
              style={[styles.sectionListSafeArea, { height: insets.bottom }]}
            />
          </>
        )}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
  },

  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)",
    zIndex: 1002,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12, // Space after back button
  },

  title: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
  },

  // Section list styles
  sectionListContainer: {
    flex: 1,
  },

  sectionListContent: {
    paddingHorizontal: 12, // Match AdminModal contentContainer
    paddingVertical: 8,
    flexGrow: 1,
  },

  sectionCard: {
    backgroundColor: "#1F1F1F", // Match ExpandableSection background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", // Match ExpandableSection border
    overflow: "hidden",
    marginBottom: 16, // Match ExpandableSection spacing
  },

  sectionCardContent: {
    padding: 24, // Match ExpandableSection padding
  },

  // Detail view styles
  detailScrollContainer: {
    flex: 1,
  },

  detailScrollContent: {
    padding: 8,
    flexGrow: 1,
  },

  // Safe area styles
  sectionListSafeArea: {
    backgroundColor: "#2A2A2A",
  },

  detailSafeArea: {
    backgroundColor: "#2A2A2A",
  },
});
