import { useState } from "react";
import { RequiredEnvVar } from "../admin/sections/env-vars/types";
import { DevToolsModalRouter, SectionType } from "./DevToolsModalRouter";
import { DevToolsSectionListModal } from "./DevToolsSectionListModal";

interface DevToolsConsoleProps {
  visible: boolean;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
  selectedSection?: string | null;
  setSelectedSection?: (section: string | null) => void;
}

/**
 * Refactored DevToolsConsole following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Separated section list and detail modals
 * - Prefer Composition over Configuration: Uses specialized modal components
 * - Extract Reusable Logic: Modal routing logic extracted to DevToolsModalRouter
 * - Utilize Render Props: Each modal handles its own rendering responsibility
 */
export function DevToolsConsole({
  visible,
  onClose,
  requiredEnvVars,
  getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
  selectedSection: externalSelectedSection,
  setSelectedSection: externalSetSelectedSection,
}: DevToolsConsoleProps) {
  // Use external state if provided (for persistence), otherwise use internal state
  const [internalSelectedSection, setInternalSelectedSection] =
    useState<SectionType | null>(null);
  const selectedSection =
    (externalSelectedSection as SectionType | null) || internalSelectedSection;
  const setSelectedSection =
    externalSetSelectedSection || setInternalSelectedSection;

  console.log("🛠️ [DEV TOOLS CONSOLE] Render with props:", {
    visible,
    externalSelectedSection,
    finalSelectedSection: selectedSection,
    willShowSectionList: visible && selectedSection === null,
    willShowModal: selectedSection !== null,
  });

  const handleSectionSelect = (sectionType: SectionType) => {
    console.log("📑 [DEV TOOLS CONSOLE] Section selected:", sectionType);
    setSelectedSection(sectionType);
  };

  const handleModalClose = () => {
    setSelectedSection(null);
    onClose();
  };

  const handleSectionListClose = () => {
    onClose();
  };

  // Show section list when main modal is visible but no section selected
  const showSectionList = visible && selectedSection === null;

  // Show section detail when a section is selected
  const showSectionDetail = selectedSection !== null;

  return (
    <>
      {/* Section List Modal - shown when no section is selected */}
      <DevToolsSectionListModal
        visible={showSectionList}
        onClose={handleSectionListClose}
        onSectionSelect={handleSectionSelect}
        requiredEnvVars={requiredEnvVars}
        getSentrySubtitle={getSentrySubtitle}
        getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
        envVarsSubtitle={envVarsSubtitle}
      />

      {/* Specialized Section Detail Modals - each handles its own visibility */}
      <DevToolsModalRouter
        selectedSection={selectedSection}
        onClose={handleModalClose}
        requiredEnvVars={requiredEnvVars}
        getSentrySubtitle={getSentrySubtitle}
        getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
        envVarsSubtitle={envVarsSubtitle}
      />
    </>
  );
}

// No styles needed - each specialized modal handles its own styling
