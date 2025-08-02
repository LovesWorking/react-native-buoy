import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { SentryLogsContent } from "../sections";

interface SentryLogsModalProps {
  visible: boolean;
  onClose: () => void;
  getSentrySubtitle: () => string;
}

/**
 * Specialized modal for Sentry logs following "Decompose by Responsibility"
 * Single purpose: Display sentry logs in a modal context
 */
export function SentryLogsModal({
  visible,
  onClose,
  getSentrySubtitle,
}: SentryLogsModalProps) {
  if (!visible) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@sentry_logs_modal"
      showToggleButton={true}
      customHeaderContent={null}
      headerSubtitle={getSentrySubtitle()}
    >
      <SentryLogsContent onClose={onClose} />
    </BaseFloatingModal>
  );
}
