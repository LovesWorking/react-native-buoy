import {
  JsModal,
  type ModalMode,
  devToolsStorageKeys,
  ModalHeader,
  HeaderSearchButton,
  Search,
  X,
  gameUIColors,
  macOSColors,
  displayValue,
} from "@react-buoy/shared-ui";
import { RequiredEnvVar, EnvVarInfo } from "../types";
import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Text } from "react-native";
 
import { EnvStatsOverview, type EnvFilterType } from "./EnvStatsOverview";
import { useDynamicEnv } from "../hooks/useDynamicEnv";
import { processEnvVars, calculateStats } from "../utils";
import { EnvVarSection } from "./EnvVarSection";
 

interface EnvVarsModalProps {
  visible: boolean;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

/**
 * Specialized modal for environment variables
 * Now using filter cards instead of tabs
 */
export function EnvVarsModal({
  visible,
  onClose,
  requiredEnvVars,
  onBack,
  enableSharedModalDimensions = false,
}: EnvVarsModalProps) {
  const [activeFilter, setActiveFilter] = useState<EnvFilterType>("all");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  
  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);
  
  // Focus search input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);
  
  // Clear search when changing filters
  useEffect(() => {
    setSearchQuery("");
    setIsSearchActive(false);
  }, [activeFilter]);

  // Auto-collect environment variables
  const envResults = useDynamicEnv();

  const autoCollectedEnvVars = useMemo(() => {
    const envVars: Record<string, string> = {};
    envResults.forEach(({ key, data }) => {
      if (data !== undefined && data !== null) {
        envVars[key] = typeof data === "string" ? data : displayValue(data);
      }
    });
    return envVars;
  }, [envResults]);

  // Process and categorize environment variables
  const { requiredVars, optionalVars } = useMemo(() => {
    return processEnvVars(autoCollectedEnvVars, requiredEnvVars);
  }, [autoCollectedEnvVars, requiredEnvVars]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (requiredEnvVars === undefined) {
      return {
        totalCount: 0,
        requiredCount: 0,
        optionalCount: 0,
        presentRequiredCount: 0,
        missingCount: 0,
        wrongValueCount: 0,
        wrongTypeCount: 0,
      };
    }
    return calculateStats(requiredVars, optionalVars, autoCollectedEnvVars);
  }, [requiredEnvVars, requiredVars, optionalVars, autoCollectedEnvVars]);

  // Combine all vars and sort by priority (issues first)
  const allVars = useMemo(() => {
    const combined = [...requiredVars, ...optionalVars];
    
    // Sort by status priority: errors first, then warnings, then valid
    return combined.sort((a, b) => {
      const priorityMap: Record<string, number> = {
        "required_missing": 1,
        "required_wrong_type": 2,
        "required_wrong_value": 3,
        "required_present": 4,
        "optional_present": 5,
      };
      return (priorityMap[a.status] || 999) - (priorityMap[b.status] || 999);
    });
  }, [requiredVars, optionalVars]);

  // Filter variables based on active filter and search
  const filteredVars = useMemo(() => {
    let vars: EnvVarInfo[] = [];
    
    switch (activeFilter) {
      case "all":
        vars = allVars;
        break;
      case "missing":
        vars = allVars.filter(v => v.status === "required_missing");
        break;
      case "issues":
        vars = allVars.filter(v =>
          v.status === "required_wrong_type" ||
          v.status === "required_wrong_value"
        );
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      vars = vars.filter((v) => 
        v.key.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        (typeof v.value === 'string' && v.value.toLowerCase().includes(query))
      );
    }
    
    return vars;
  }, [allVars, optionalVars, activeFilter, searchQuery]);

  // Calculate health percentage
  const healthPercentage =
    stats.requiredCount > 0
      ? Math.round((stats.presentRequiredCount / stats.requiredCount) * 100)
      : 100;

  const healthStatus =
    healthPercentage === 100
      ? "HEALTHY"
      : healthPercentage >= 75
      ? "WARNING"
      : healthPercentage >= 50
      ? "ERROR"
      : "CRITICAL";

  const healthColor =
    healthPercentage === 100
      ? macOSColors.semantic.success
      : healthPercentage >= 75
      ? macOSColors.semantic.warning
      : healthPercentage >= 50
      ? macOSColors.semantic.error
      : macOSColors.semantic.error;

  if (!visible) return null;

  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.env.modal();

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={storagePrefix}
      header={{
        customContent: (
          <ModalHeader>
            {onBack && <ModalHeader.Navigation onBack={onBack} />}
            <ModalHeader.Content title={isSearchActive ? "" : "Environment Variables"} noMargin={isSearchActive}>
              {isSearchActive && (
                <View style={styles.headerSearchContainer}>
                  <Search size={12} color={macOSColors.text.secondary} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.headerSearchInput}
                    placeholder="Search env keys..."
                    placeholderTextColor={macOSColors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setIsSearchActive(false);
                      setSearchQuery("");
                    }}
                    style={styles.clearButton}
                  >
                    <X size={12} color={macOSColors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}
            </ModalHeader.Content>
            <ModalHeader.Actions onClose={onClose}>
              {!isSearchActive && (
                <HeaderSearchButton
                  onPress={() => setIsSearchActive(true)}
                />
              )}
            </ModalHeader.Actions>
          </ModalHeader>
        ),
        showToggleButton: true,
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview with Filter Cards */}
        <EnvStatsOverview
          stats={stats}
          healthPercentage={healthPercentage}
          healthStatus={healthStatus}
          healthColor={healthColor}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        
        {/* Filtered Environment Variables */}
        {filteredVars.length > 0 ? (
          <View style={styles.varsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === "all" ? "ALL VARIABLES" : 
                 activeFilter === "missing" ? "MISSING VARIABLES" :
                 "ISSUES TO FIX"}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredVars.length}</Text>
              </View>
            </View>
            <EnvVarSection
              title=""
              count={0}
              vars={filteredVars}
              emptyMessage=""
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Search size={32} color={macOSColors.text.muted} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No results found" : "No variables"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No variables matching "${searchQuery}"`
                : `No ${activeFilter === "all" ? "" : activeFilter} variables found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </JsModal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 24,
  },
  headerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4, // Reduced from 6 to 4
    marginHorizontal: 12,
    marginVertical: 4, // Added vertical margin for proper spacing
    height: 32, // Fixed height for consistency
    borderWidth: 1,
    borderColor: macOSColors.border.input,
  },
  headerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13, // Reduced from 14 to 13
    color: macOSColors.text.primary,
    padding: 0,
    height: '100%', // Ensure it fills the container height
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  varsSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.text.muted,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  countBadge: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: macOSColors.border.default + "50",
  },
  countText: {
    fontSize: 10,
    fontWeight: "500",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: macOSColors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: macOSColors.text.secondary,
    textAlign: "center",
  },
});
