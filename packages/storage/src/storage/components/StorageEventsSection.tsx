import { Database } from "rn-better-dev-tools/icons";
import { CyberpunkSectionButton } from "@/rn-better-dev-tools/src/shared/ui/console/CyberpunkSectionButton";

interface StorageEventsSectionProps {
  onPress: () => void;
  eventCount?: number;
}

export function StorageEventsSection({
  onPress,
  eventCount = 0,
}: StorageEventsSectionProps) {
  const subtitle = eventCount > 0 ? `${eventCount} events` : "Monitoring";

  return (
    <CyberpunkSectionButton
      id="storage-events"
      title="EVENTS"
      subtitle={subtitle}
      icon={Database}
      iconColor="#00E5FF"
      iconBackgroundColor="rgba(0, 229, 255, 0.1)"
      onPress={onPress}
      index={3}
    />
  );
}
