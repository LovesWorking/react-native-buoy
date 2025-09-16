import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import type { ReactNode } from "react";

// Base ListItem container component
interface ListItemProps {
  onPress?: () => void;
  children: ReactNode;
  disabled?: boolean;
  style?: any;
}

export function ListItem({
  onPress,
  children,
  disabled = false,
  style,
}: ListItemProps) {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, disabled } : {};

  return (
    <Container {...containerProps} style={[styles.container, style]}>
      {children}
    </Container>
  );
}

// Header section for status badges, timestamps, etc.
interface HeaderProps {
  children: ReactNode;
  style?: any;
}

function Header({ children, style }: HeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

// Content section for main item content
interface ContentProps {
  children: ReactNode;
  style?: any;
}

function Content({ children, style }: ContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

// Footer section for actions, metadata, etc.
interface FooterProps {
  children: ReactNode;
  style?: any;
}

function Footer({ children, style }: FooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

// Title component for item titles
interface TitleProps {
  children: ReactNode;
  numberOfLines?: number;
  style?: any;
}

function Title({ children, numberOfLines = 1, style }: TitleProps) {
  return (
    <Text style={[styles.title, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// Subtitle component for secondary text
interface SubtitleProps {
  children: ReactNode;
  numberOfLines?: number;
  style?: any;
}

function Subtitle({ children, numberOfLines = 2, style }: SubtitleProps) {
  return (
    <Text style={[styles.subtitle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// Metadata component for timestamps, counts, etc.
interface MetadataProps {
  children: ReactNode;
  style?: any;
}

function Metadata({ children, style }: MetadataProps) {
  return <Text style={[styles.metadata, style]}>{children}</Text>;
}

// Actions container for buttons
interface ActionsProps {
  children: ReactNode;
  style?: any;
}

function Actions({ children, style }: ActionsProps) {
  return <View style={[styles.actions, style]}>{children}</View>;
}

// Attach sub-components to the main component
ListItem.Header = Header;
ListItem.Content = Content;
ListItem.Footer = Footer;
ListItem.Title = Title;
ListItem.Subtitle = Subtitle;
ListItem.Metadata = Metadata;
ListItem.Actions = Actions;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  metadata: {
    fontSize: 12,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
});
