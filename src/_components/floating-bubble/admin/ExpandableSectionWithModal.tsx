import { ReactNode, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { LucideIcon } from 'lucide-react-native';

import { ExpandableSection } from './sections/ExpandableSection';

interface ExpandableSectionWithModalProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  children: ReactNode | ((closeModal: () => void) => ReactNode); // Modal content or function that returns content
  modalSnapPoints?: string[]; // Default to ['100%']
  enableDynamicSizing?: boolean; // Default to false
  modalBackgroundColor?: string; // Default to '#0F0F0F'
  handleIndicatorColor?: string; // Default to '#6B7280'
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

export function ExpandableSectionWithModal({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  children,
  modalSnapPoints = ['100%'],
  enableDynamicSizing = false,
  modalBackgroundColor = '#0F0F0F',
  handleIndicatorColor = '#6B7280',
  onModalOpen,
  onModalClose,
}: ExpandableSectionWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const openModal = () => {
    setIsModalOpen(true);
    bottomSheetModalRef.current?.present();
    onModalOpen?.();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    bottomSheetModalRef.current?.dismiss();
    onModalClose?.();
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.8} />
  );

  return (
    <>
      <ExpandableSection
        icon={icon}
        iconColor={iconColor}
        iconBackgroundColor={iconBackgroundColor}
        title={title}
        subtitle={subtitle}
        onPress={openModal}
      >
        <></>
      </ExpandableSection>

      <BottomSheetModal
        sentry-label={`ignore ${title.toLowerCase()} modal`}
        ref={bottomSheetModalRef}
        snapPoints={modalSnapPoints}
        index={0}
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: modalBackgroundColor,
        }}
        handleIndicatorStyle={{
          backgroundColor: handleIndicatorColor,
          width: 40,
          height: 5,
        }}
        style={{
          marginTop: insets.top,
        }}
        onDismiss={closeModal}
      >
        {typeof children === 'function' ? children(closeModal) : children}
      </BottomSheetModal>
    </>
  );
}
