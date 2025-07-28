import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import {
  faCircleExclamation,
  faClock,
  faTriangleExclamation,
  faUserCheck,
  faUserGroup,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { useCreateTestExplorer } from '~/features/admin/hooks/useCreateTestExplorer';
import { Session } from '~/features/auth/types';

import { LoadingButton } from '~/components/LoadingButton';
import { Text } from '~/components/ui/text';

import { logger } from '~/lib/utils/logger';

import { useToast } from '~/hooks/useToast';

import { ExpandableSection } from './ExpandableSection';

interface ExplorerTestingOptions {
  isSelfHarm: boolean;
  isInappropriate: boolean;
  isValidProfile: boolean;
  minutesLeft: number;
}

interface Props {
  explorerTestingOptions: ExplorerTestingOptions;
  setExplorerTestingOptions: Dispatch<SetStateAction<ExplorerTestingOptions>>;
  session: Session | null;
}

export function ExplorerTestingSection({ explorerTestingOptions, setExplorerTestingOptions, session }: Props) {
  const toast = useToast();
  const createExplorerMutation = useCreateTestExplorer();

  const handleMinutesChange = useCallback(() => {
    Alert.prompt(
      'Set Minutes Left',
      'Enter the number of minutes left for the test explorer:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (value) => {
            const minutes = parseInt(value || '', 10);
            if (!isNaN(minutes) && minutes > 0) {
              setExplorerTestingOptions((prev) => ({
                ...prev,
                minutesLeft: minutes,
              }));
            } else {
              toast.show({
                type: 'error',
                text1: 'Invalid Input',
                text2: 'Please enter a valid number greater than 0',
              });
            }
          },
        },
      ],
      'plain-text',
      explorerTestingOptions.minutesLeft.toString(),
      'number-pad',
    );
  }, [explorerTestingOptions.minutesLeft, setExplorerTestingOptions, toast]);

  const handleCreateExplorer = useCallback(async () => {
    try {
      const orgId = session?.user?.currentAccount?.id;
      if (!orgId) {
        toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No organization ID found in session',
        });
        return;
      }

      toast.show({
        type: 'info',
        text1: 'Creating Explorer',
        text2: 'Creating test explorer with current settings...',
      });

      await createExplorerMutation.mutateAsync({
        orgId,
        ...explorerTestingOptions,
      });

      toast.show({
        type: 'success',
        text1: 'Explorer Created',
        text2: 'Test explorer created successfully',
      });
    } catch (error) {
      logger.error('Error creating test explorer:', { error, tags: { category: 'admin.testing' } });
      toast.show({
        type: 'error',
        text1: 'Creation Failed',
        text2: 'Failed to create test explorer',
      });
    }
  }, [createExplorerMutation, explorerTestingOptions, session?.user?.currentAccount?.id, toast]);

  return (
    <ExpandableSection
      icon={faUserGroup}
      iconColor="#A855F7"
      iconBackgroundColor="bg-purple-500/10"
      title="Explorer Testing"
      subtitle="Create test explorers"
    >
      <View>
        <View className="bg-white/[0.03] rounded-lg mb-4">
          <TouchableOpacity
            sentry-label="ignore toggle self harm risk button"
            accessibilityRole="button"
            onPress={() => setExplorerTestingOptions((prev) => ({ ...prev, isSelfHarm: !prev.isSelfHarm }))}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 min-w-0">
              <View
                className={`p-2 rounded-lg mr-3 ${
                  explorerTestingOptions.isSelfHarm ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  size={16}
                  color={explorerTestingOptions.isSelfHarm ? '#EF4444' : '#9CA3AF'}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white font-medium text-[12px] mb-0.5">Self Harm Risk</Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {explorerTestingOptions.isSelfHarm ? 'Risk detected' : 'No risk detected'}
                </Text>
              </View>
              <View
                className={`ml-3 px-2.5 py-1 rounded-md ${
                  explorerTestingOptions.isSelfHarm ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    explorerTestingOptions.isSelfHarm ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {explorerTestingOptions.isSelfHarm ? 'RISK' : 'SAFE'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="bg-white/[0.03] rounded-lg mb-4">
          <TouchableOpacity
            sentry-label="ignore toggle inappropriate content button"
            accessibilityRole="button"
            onPress={() => setExplorerTestingOptions((prev) => ({ ...prev, isInappropriate: !prev.isInappropriate }))}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 min-w-0">
              <View
                className={`p-2 rounded-lg mr-3 ${
                  explorerTestingOptions.isInappropriate ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  size={16}
                  color={explorerTestingOptions.isInappropriate ? '#EF4444' : '#9CA3AF'}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white font-medium text-[12px] mb-0.5">Content Check</Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {explorerTestingOptions.isInappropriate ? 'Inappropriate content' : 'Appropriate content'}
                </Text>
              </View>
              <View
                className={`ml-3 px-2.5 py-1 rounded-md ${
                  explorerTestingOptions.isInappropriate ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    explorerTestingOptions.isInappropriate ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {explorerTestingOptions.isInappropriate ? 'RISK' : 'SAFE'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="bg-white/[0.03] rounded-lg mb-4">
          <TouchableOpacity
            sentry-label="ignore toggle profile validation button"
            accessibilityRole="button"
            onPress={() => setExplorerTestingOptions((prev) => ({ ...prev, isValidProfile: !prev.isValidProfile }))}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 min-w-0">
              <View
                className={`p-2 rounded-lg mr-3 ${
                  !explorerTestingOptions.isValidProfile ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <FontAwesomeIcon
                  icon={faUserCheck}
                  size={16}
                  color={!explorerTestingOptions.isValidProfile ? '#EF4444' : '#9CA3AF'}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white font-medium text-[12px] mb-0.5">Profile Validation</Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {explorerTestingOptions.isValidProfile ? 'Valid profile' : 'Invalid profile'}
                </Text>
              </View>
              <View
                className={`ml-3 px-2.5 py-1 rounded-md ${
                  !explorerTestingOptions.isValidProfile ? 'bg-red-500/10' : 'bg-white/[0.03]'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    !explorerTestingOptions.isValidProfile ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {explorerTestingOptions.isValidProfile ? 'VALID' : 'INVALID'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="bg-white/[0.03] rounded-lg mb-4">
          <TouchableOpacity
            sentry-label="ignore set minutes left button"
            accessibilityRole="button"
            onPress={handleMinutesChange}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 min-w-0">
              <View className="p-2 rounded-lg mr-3 bg-white/[0.03]">
                <FontAwesomeIcon icon={faClock} size={16} color="#9CA3AF" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white font-medium text-[12px] mb-0.5">Minutes Left</Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {explorerTestingOptions.minutesLeft} minutes until expiration
                </Text>
              </View>
              <View className="ml-3 px-2.5 py-1 rounded-md bg-white/[0.03]">
                <Text className="text-xs font-medium text-gray-400">{explorerTestingOptions.minutesLeft}m</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <LoadingButton
          isLoading={createExplorerMutation.isPending}
          accessibilityRole="button"
          onPress={handleCreateExplorer}
          className="bg-purple-500 h-12 rounded-lg flex-row items-center justify-center"
          sentry-label="ignore create test explorer button"
          accessibilityLabel="Create test explorer"
          accessibilityHint="Creates a new test explorer with the current settings"
        >
          <Text className="text-white font-medium text-base">Create Test Explorer</Text>
        </LoadingButton>
      </View>
    </ExpandableSection>
  );
}
