import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { ReactNode } from "react";
import { ChevronLeft, X } from "../../icons";
import { gameUIColors } from "../gameUI";

// Base ModalHeader container component
interface ModalHeaderProps {
  children: ReactNode;
}

export function ModalHeader({ children }: ModalHeaderProps) {
  return <View style={styles.headerContainer}>{children}</View>;
}

// Navigation component for back/close buttons
interface NavigationProps {
  onBack?: () => void;
  onClose?: () => void;
  backIcon?: ReactNode;
  closeIcon?: ReactNode;
}

function Navigation({ onBack, onClose, backIcon, closeIcon }: NavigationProps) {
  // When only showing close button, position it on the right
  if (!onBack && onClose) {
    return (
      <>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onClose} style={styles.navigationButton}>
          {closeIcon || <X size={20} color={gameUIColors.secondary} />}
        </TouchableOpacity>
      </>
    );
  }

  // When only showing back button
  if (onBack && !onClose) {
    return (
      <TouchableOpacity onPress={onBack} style={styles.navigationButton}>
        {backIcon || <ChevronLeft size={20} color={gameUIColors.primary} />}
      </TouchableOpacity>
    );
  }

  // When showing both, we need to handle them separately
  // The close button will be rendered separately on the right
  if (onBack && onClose) {
    return (
      <TouchableOpacity onPress={onBack} style={styles.navigationButton}>
        {backIcon || <ChevronLeft size={20} color={gameUIColors.primary} />}
      </TouchableOpacity>
    );
  }

  return null;
}

// Content component for title and subtitle
interface ContentProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  centered?: boolean;
  noMargin?: boolean;
}

function Content({
  title,
  subtitle,
  children,
  centered,
  noMargin,
}: ContentProps) {
  if (children) {
    return (
      <View
        style={[styles.headerContent, noMargin && styles.headerContentNoMargin]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[styles.headerContent, centered && styles.headerContentCentered]}
    >
      {title && (
        <Text
          style={[styles.headerTitle, centered && styles.headerTitleCentered]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={[
            styles.headerSubtitle,
            centered && styles.headerSubtitleCentered,
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// Actions component for header action buttons
interface ActionsProps {
  children?: ReactNode;
  onClose?: () => void;
  closeIcon?: ReactNode;
}

function Actions({ children, onClose, closeIcon }: ActionsProps) {
  return (
    <View style={styles.headerActions}>
      {children}
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.navigationButton}>
          {closeIcon || <X size={20} color={gameUIColors.secondary} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Attach sub-components to the main component
ModalHeader.Navigation = Navigation;
ModalHeader.Content = Content;
ModalHeader.Actions = Actions;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minHeight: 32,
    paddingLeft: 4,
  },
  navigationButton: {
    padding: 4,
  },
  closeButtonOnly: {
    marginLeft: "auto",
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerContentCentered: {
    justifyContent: "center",
  },
  headerTitle: {
    color: gameUIColors.primaryLight,
    fontSize: 14,
    fontWeight: "500",
  },
  headerTitleCentered: {
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: gameUIColors.secondary,
    marginTop: 2,
  },
  headerSubtitleCentered: {
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
    marginRight: 4,
  },
  headerContentNoMargin: {
    marginHorizontal: 0,
  },
});
