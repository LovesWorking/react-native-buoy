import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { ReactQueryDetailContent } from "../sections";

interface ReactQueryModalProps {
  visible: boolean;
  onClose: () => void;
  getRnBetterDevToolsSubtitle: () => string;
}

/**
 * Specialized modal for React Query details following "Decompose by Responsibility"
 * Single purpose: Display React Query information in a modal context
 */
export function ReactQueryModal({
  visible,
  onClose,
  getRnBetterDevToolsSubtitle,
}: ReactQueryModalProps) {
  if (!visible) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@react_query_detail_modal"
      showToggleButton={true}
      customHeaderContent={null}
      headerSubtitle={getRnBetterDevToolsSubtitle()}
    >
      <ReactQueryDetailContent onClose={onClose} />
    </BaseFloatingModal>
  );
}
