import { Globe } from 'lucide-react-native';
import { ConsoleSection } from '../../../_components/floating-bubble/console/ConsoleSection';
import { useNetworkEvents } from '../hooks/useNetworkEvents';

interface NetworkSectionProps {
  onPress: () => void;
}

export function NetworkSection({ onPress }: NetworkSectionProps) {
  const { stats, isEnabled } = useNetworkEvents();

  const getNetworkSubtitle = () => {
    if (stats.totalRequests === 0) {
      return isEnabled ? "Recording • No requests yet" : "Not recording";
    }
    
    const parts = [];
    
    if (isEnabled) {
      parts.push("Recording");
    }
    
    parts.push(`${stats.totalRequests} requests`);
    
    if (stats.failedRequests > 0) {
      parts.push(`${stats.failedRequests} failed`);
    }
    
    if (stats.pendingRequests > 0) {
      parts.push(`${stats.pendingRequests} pending`);
    }
    
    return parts.join(" • ");
  };

  return (
    <ConsoleSection
      id="network"
      title="Network Monitor"
      subtitle={getNetworkSubtitle()}
      icon={Globe}
      iconColor="#8B5CF6"
      iconBackgroundColor="rgba(139, 92, 246, 0.1)"
      onPress={onPress}
    />
  );
}