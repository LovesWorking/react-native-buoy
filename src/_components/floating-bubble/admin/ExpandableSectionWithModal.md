# ExpandableSectionWithModal

A reusable component that combines an expandable section with a bottom sheet modal. Perfect for admin panels and debug interfaces where you want to show a list item that opens a detailed modal when tapped.

## Features

- **Unified Component**: Combines `ExpandableSection` UI with built-in animated Modal
- **Customizable Modal**: Configurable snap points, background colors, and behavior
- **Automatic State Management**: Handles modal open/close state internally
- **Safe Area Support**: Automatically handles device safe areas
- **Flexible Content**: Pass any React component as modal content

## Basic Usage

```tsx
import { ExpandableSectionWithModal } from "~/components/admin";
import { FileText } from "lucide-react-native";

function MyAdminSection() {
  return (
    <ExpandableSectionWithModal
      icon={FileText}
      iconColor="#8B5CF6"
      iconBackgroundColor="rgba(139, 92, 246, 0.1)"
      title="My Feature"
      subtitle="Click to open modal"
    >
      <MyModalContent onClose={() => {}} />
    </ExpandableSectionWithModal>
  );
}
```

## Props

| Prop                   | Type         | Default     | Description                            |
| ---------------------- | ------------ | ----------- | -------------------------------------- |
| `icon`                 | `LucideIcon` | required    | Icon to display in the section header  |
| `iconColor`            | `string`     | required    | Color of the icon                      |
| `iconBackgroundColor`  | `string`     | required    | Background color of the icon container |
| `title`                | `string`     | required    | Title text for the section             |
| `subtitle`             | `string`     | required    | Subtitle text for the section          |
| `children`             | `ReactNode`  | required    | Modal content to display               |
| `modalSnapPoints`      | `string[]`   | `['100%']`  | Bottom sheet snap points               |
| `enableDynamicSizing`  | `boolean`    | `false`     | Enable dynamic modal sizing            |
| `modalBackgroundColor` | `string`     | `'#0F0F0F'` | Modal background color                 |
| `handleIndicatorColor` | `string`     | `'#6B7280'` | Modal handle indicator color           |
| `onModalOpen`          | `() => void` | optional    | Callback when modal opens              |
| `onModalClose`         | `() => void` | optional    | Callback when modal closes             |

## Advanced Usage

### Custom Modal Sizing

```tsx
<ExpandableSectionWithModal
  // ... other props
  modalSnapPoints={["50%", "90%"]}
  enableDynamicSizing={true}
>
  <MyModalContent />
</ExpandableSectionWithModal>
```

### Custom Colors

```tsx
<ExpandableSectionWithModal
  // ... other props
  modalBackgroundColor="#1F1F1F"
  handleIndicatorColor="#FFFFFF"
>
  <MyModalContent />
</ExpandableSectionWithModal>
```

### With Callbacks

```tsx
<ExpandableSectionWithModal
  // ... other props
  onModalOpen={() => {
    console.log("Modal opened");
    // Refresh data, track analytics, etc.
  }}
  onModalClose={() => {
    console.log("Modal closed");
    // Cleanup, save state, etc.
  }}
>
  <MyModalContent />
</ExpandableSectionWithModal>
```

## Modal Content Best Practices

Your modal content component should:

1. **Accept an `onClose` prop** to handle closing from within the modal
2. **Use safe area insets** for proper spacing
3. **Include a header** with title and close button
4. **Handle its own state** for any interactions

```tsx
interface MyModalContentProps {
  onClose: () => void;
}

function MyModalContent({ onClose }: MyModalContentProps) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      {/* Header with close button */}
      <View style={{ paddingTop: insets.top }}>
        <TouchableOpacity onPress={onClose}>
          <X size={24} />
        </TouchableOpacity>
        <Text>My Modal Title</Text>
      </View>

      {/* Your content here */}
      <ScrollView>{/* Modal content */}</ScrollView>

      {/* Bottom spacing */}
      <View style={{ paddingBottom: insets.bottom }} />
    </View>
  );
}
```

## Complete Example: Log Dump Section

```tsx
import { useEffect, useState } from "react";
import { FileText } from "lucide-react-native";
import { ExpandableSectionWithModal } from "~/components/admin";

function LogDumpSection() {
  const [entries, setEntries] = useState([]);

  const refreshEntries = () => {
    // Refresh your data
    setEntries(getLogEntries());
  };

  return (
    <ExpandableSectionWithModal
      icon={FileText}
      iconColor="#8B5CF6"
      iconBackgroundColor="rgba(139, 92, 246, 0.1)"
      title="Log Dump"
      subtitle={`${entries.length} entries`}
      onModalOpen={refreshEntries}
    >
      <LogViewerModalContent entries={entries} onClose={() => {}} />
    </ExpandableSectionWithModal>
  );
}
```

This approach makes it easy to create consistent admin sections while keeping the modal content flexible and reusable.
