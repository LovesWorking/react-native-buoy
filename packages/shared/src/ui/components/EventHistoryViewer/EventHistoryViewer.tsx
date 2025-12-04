/**
 * EventHistoryViewer
 *
 * Main container component for viewing event history with current/diff views.
 * Composes ViewToggleCards, DiffModeTabs, CompareBar, and EventStepperFooter.
 * This is a dumb component - all state is controlled externally.
 */

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { macOSColors } from "../../gameUI/constants/macOSDesignSystemColors";
import { EventStepperFooter } from "../EventStepperFooter";
import { ViewToggleCards } from "./ViewToggleCards";
import { DiffModeTabs } from "./DiffModeTabs";
import { CompareBar } from "./CompareBar";
import type { EventHistoryViewerProps } from "./types";

/**
 * EventHistoryViewer is the main container for viewing event history.
 * It composes sub-components to display current value or diff views.
 */
export const EventHistoryViewer = memo(function EventHistoryViewer({
  // View Toggle
  activeView,
  onViewChange,
  currentViewLabel,
  currentViewDescription,
  currentViewIcon,
  diffViewLabel,
  diffViewDescription,
  diffViewIcon,

  // Current View Content
  renderCurrentView,

  // Diff View
  diffModeTabs,
  activeDiffMode,
  onDiffModeChange,
  renderDiffContent,

  // Compare Bar
  leftEvent,
  rightEvent,
  showCompareNavigation,
  onLeftPrevious,
  onLeftNext,
  onRightPrevious,
  onRightNext,
  canLeftPrevious,
  canLeftNext,
  canRightPrevious,
  canRightNext,
  onLeftPickerOpen,
  onRightPickerOpen,

  // Footer
  disableInternalFooter,
  footerCurrentIndex,
  footerTotalItems,
  footerItemLabel,
  footerSubtitle,
  onFooterPrevious,
  onFooterNext,
}: EventHistoryViewerProps) {
  const diffDisabled = footerTotalItems <= 1;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingBottom: !disableInternalFooter && footerTotalItems > 1 ? 80 : 0,
          },
        ]}
      >
        {/* View Toggle Cards */}
        <ViewToggleCards
          activeView={activeView}
          onViewChange={onViewChange}
          currentLabel={currentViewLabel}
          currentDescription={currentViewDescription}
          currentIcon={currentViewIcon}
          diffLabel={diffViewLabel}
          diffDescription={diffViewDescription}
          diffIcon={diffViewIcon}
          diffDisabled={diffDisabled}
        />

        {/* Current View Content */}
        {activeView === "current" && (
          <View style={styles.contentSection}>{renderCurrentView()}</View>
        )}

        {/* Diff View Content */}
        {activeView === "diff" && (
          <View style={styles.contentSection}>
            {/* Diff Mode Tabs (optional) */}
            {diffModeTabs && diffModeTabs.length > 0 && onDiffModeChange && (
              <DiffModeTabs
                tabs={diffModeTabs}
                activeTab={activeDiffMode ?? diffModeTabs[0]?.key ?? ""}
                onTabChange={onDiffModeChange}
              />
            )}

            {/* Compare Bar */}
            <CompareBar
              leftEvent={leftEvent}
              rightEvent={rightEvent}
              showNavigation={showCompareNavigation}
              onLeftPrevious={onLeftPrevious}
              onLeftNext={onLeftNext}
              onRightPrevious={onRightPrevious}
              onRightNext={onRightNext}
              canLeftPrevious={canLeftPrevious}
              canLeftNext={canLeftNext}
              canRightPrevious={canRightPrevious}
              canRightNext={canRightNext}
              onLeftPress={onLeftPickerOpen}
              onRightPress={onRightPickerOpen}
            />

            {/* Diff Content */}
            {renderDiffContent()}
          </View>
        )}
      </View>

      {/* Footer */}
      {!disableInternalFooter && (
        <EventStepperFooter
          currentIndex={footerCurrentIndex}
          totalItems={footerTotalItems}
          onPrevious={onFooterPrevious}
          onNext={onFooterNext}
          itemLabel={footerItemLabel}
          subtitle={footerSubtitle}
          absolute
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
