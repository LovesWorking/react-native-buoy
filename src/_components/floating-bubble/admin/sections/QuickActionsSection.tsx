import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { faBroadcastTower, faCircleExclamation, faMessage } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { Session } from '~/features/auth/types';

import { Text } from '~/components/ui/text';

import { useToast } from '~/hooks/useToast';

import { ExpandableSection } from './ExpandableSection';
import { ExplorerTestingSection } from './ExplorerTestingSection';

interface ExplorerTestingOptions {
  isSelfHarm: boolean;
  isInappropriate: boolean;
  isValidProfile: boolean;
  minutesLeft: number;
}

interface Props {
  isBroadcastUploadFailureEnabled: boolean;
  isMessageUploadFailureEnabled: boolean;
  setIsBroadcastUploadFailureEnabled: (value: boolean) => void;
  setIsMessageUploadFailureEnabled: (value: boolean) => void;
  explorerTestingOptions: ExplorerTestingOptions;
  setExplorerTestingOptions: Dispatch<SetStateAction<ExplorerTestingOptions>>;
  session: Session | null;
}

export function QuickActionsSection({
  isBroadcastUploadFailureEnabled,
  isMessageUploadFailureEnabled,
  setIsBroadcastUploadFailureEnabled,
  setIsMessageUploadFailureEnabled,
  explorerTestingOptions,
  setExplorerTestingOptions,
  session,
}: Props) {
  const toast = useToast();

  const handleToggleBroadcastUploadFailure = useCallback(() => {
    const newState = !isBroadcastUploadFailureEnabled;
    setIsBroadcastUploadFailureEnabled(newState);

    toast.show({
      type: newState ? 'info' : 'success',
      text1: `Broadcast Upload Failure ${newState ? 'Enabled' : 'Disabled'}`,
      text2: newState ? 'Next broadcast upload will fail' : 'Upload failures disabled',
    });
  }, [isBroadcastUploadFailureEnabled, setIsBroadcastUploadFailureEnabled, toast]);

  const handleToggleMessageUploadFailure = useCallback(() => {
    const newState = !isMessageUploadFailureEnabled;
    setIsMessageUploadFailureEnabled(newState);

    toast.show({
      type: newState ? 'info' : 'success',
      text1: `Message Upload Failure ${newState ? 'Enabled' : 'Disabled'}`,
      text2: newState ? 'Next message upload will fail' : 'Upload failures disabled',
    });
  }, [isMessageUploadFailureEnabled, setIsMessageUploadFailureEnabled, toast]);

  return (
    <View className="space-y-6">
      {/* Upload Testing Section */}
      <ExpandableSection
        icon={faCircleExclamation}
        iconColor="#F59E0B"
        iconBackgroundColor="bg-amber-500/10"
        title="Upload Testing"
        subtitle="Simulate upload failures"
      >
        <View>
          <View className="bg-white/[0.03] rounded-lg mb-4">
            <TouchableOpacity
              sentry-label="ignore toggle broadcast upload failure button"
              accessibilityRole="button"
              onPress={handleToggleBroadcastUploadFailure}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 min-w-0">
                <View
                  className={`p-2 rounded-lg mr-3 ${
                    isBroadcastUploadFailureEnabled ? 'bg-red-500/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faBroadcastTower}
                    size={16}
                    color={isBroadcastUploadFailureEnabled ? '#EF4444' : '#9CA3AF'}
                  />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white font-medium text-[12px] mb-0.5">Broadcast Uploads</Text>
                  <Text className="text-gray-400 text-xs" numberOfLines={1}>
                    {isBroadcastUploadFailureEnabled ? 'Failures enabled' : 'Normal operation'}
                  </Text>
                </View>
                <View
                  className={`ml-3 px-2.5 py-1 rounded-md ${
                    isBroadcastUploadFailureEnabled ? 'bg-red-500/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isBroadcastUploadFailureEnabled ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {isBroadcastUploadFailureEnabled ? 'FAIL' : 'OK'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View className="bg-white/[0.03] rounded-lg">
            <TouchableOpacity
              sentry-label="ignore toggle message upload failure button"
              accessibilityRole="button"
              onPress={handleToggleMessageUploadFailure}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 min-w-0">
                <View
                  className={`p-2 rounded-lg mr-3 ${
                    isMessageUploadFailureEnabled ? 'bg-red-500/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faMessage}
                    size={16}
                    color={isMessageUploadFailureEnabled ? '#EF4444' : '#9CA3AF'}
                  />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white font-medium text-[12px] mb-0.5">Message Uploads</Text>
                  <Text className="text-gray-400 text-xs" numberOfLines={1}>
                    {isMessageUploadFailureEnabled ? 'Failures enabled' : 'Normal operation'}
                  </Text>
                </View>
                <View
                  className={`ml-3 px-2.5 py-1 rounded-md ${
                    isMessageUploadFailureEnabled ? 'bg-red-500/10' : 'bg-white/[0.03]'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isMessageUploadFailureEnabled ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {isMessageUploadFailureEnabled ? 'FAIL' : 'OK'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-xs text-center px-1 mt-2">Toggle to simulate upload failures</Text>
        </View>
      </ExpandableSection>

      {/* Explorer Testing Section */}
      <ExplorerTestingSection
        explorerTestingOptions={explorerTestingOptions}
        setExplorerTestingOptions={setExplorerTestingOptions}
        session={session}
      />
    </View>
  );
}
