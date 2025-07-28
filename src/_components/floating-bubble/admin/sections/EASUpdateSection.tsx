import { useCallback } from 'react';
import { Alert, Linking, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { faExternalLink, faSync } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Sentry from '@sentry/react-native';

import { Session } from '~/features/auth/types';

import { Text } from '~/components/ui/text';

import { logger } from '~/lib/utils/logger';

import { ExpandableSection } from './ExpandableSection';

interface EASUpdateSectionProps {
  closeModal: () => void;
  session: Session | null;
}

export function EASUpdateSection({ closeModal, session }: EASUpdateSectionProps) {
  const handleShowUpdateInfo = useCallback(() => {
    const updateInfo = {
      'Update ID': Updates.updateId || 'embedded',
      Channel: Updates.channel || 'production',
      'Is Embedded': Updates.isEmbeddedLaunch ? 'Yes' : 'No',
      'Runtime Version': Updates.runtimeVersion || 'unknown',
    };

    const message = Object.entries(updateInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    Alert.alert('EAS Update Info', message);
  }, []);

  const handleOpenExpoUrl = useCallback(async () => {
    try {
      const manifest = Updates.manifest;
      const metadata = 'metadata' in manifest ? manifest.metadata : undefined;
      const extra = 'extra' in manifest ? manifest.extra : undefined;
      const updateGroup = metadata && 'updateGroup' in metadata ? metadata.updateGroup : undefined;

      if (typeof updateGroup === 'string') {
        // Extract owner and slug from manifest with fallbacks
        const owner = extra?.expoClient?.owner ?? 'teamgloo';
        const slug = extra?.expoClient?.slug ?? 'gloo-messaging-app';
        const url = `https://expo.dev/accounts/${owner}/projects/${slug}/updates/${updateGroup}`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          // No alert needed for successful opens - Safari will just open
        } else {
          Alert.alert('Cannot Open URL', 'Unable to open the Expo dashboard URL in Safari.', [{ text: 'OK' }]);
        }
      } else if (Updates.isEmbeddedLaunch) {
        Alert.alert(
          'Embedded Build',
          'This is an embedded build running from the app binary. No Expo dashboard URL is available for embedded builds.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'URL Not Available',
          'Unable to generate Expo dashboard URL - update group information not found.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      logger.error('Error opening Expo URL:', { error, tags: { category: 'admin.eas' } });
      Alert.alert('Open Failed', 'Failed to open URL in browser. Please try again.', [{ text: 'OK' }]);
    }
  }, []);

  const handleTestSentryError = useCallback(() => {
    try {
      // Get current update info for logging
      const updateInfo = {
        updateId: Updates.updateId,
        channel: Updates.channel,
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
        runtimeVersion: Updates.runtimeVersion,
      };

      logger.debug('🧪 Admin test error triggered with update info:', { updateInfo, tags: { category: 'admin.eas' } });

      // Add some context to the error
      Sentry.setContext('admin-test-error-context', {
        testType: 'admin-sentry-update-tracking-test',
        triggeredAt: new Date().toISOString(),
        updateInfo,
        triggeredBy: session?.user?.email || 'unknown',
      });

      // Close modal before throwing error to avoid modal interference
      closeModal();

      // Trigger a test error
      setTimeout(() => {
        throw new Error('💀 Admin test error for Sentry update tracking verification');
      }, 500);
    } catch (error) {
      logger.error('Error setting up test error:', { error, tags: { category: 'admin.eas' } });
    }
  }, [closeModal, session?.user?.email]);

  return (
    <ExpandableSection
      icon={faSync}
      iconColor="#3B82F6"
      iconBackgroundColor="bg-blue-500/10"
      title="EAS Update Information"
      subtitle="View update details and test Sentry"
    >
      <View className="gap-y-3">
        <TouchableOpacity
          sentry-label="ignore show update info button"
          accessibilityRole="button"
          onPress={handleShowUpdateInfo}
          className="bg-purple-500 h-12 rounded-lg flex-row items-center justify-center"
        >
          <Text className="text-white font-medium text-base">Show Update Info Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore open Expo dashboard button"
          accessibilityRole="button"
          onPress={handleOpenExpoUrl}
          className="bg-blue-500 h-12 rounded-lg flex-row items-center justify-center"
        >
          <FontAwesomeIcon icon={faExternalLink} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-medium text-base">Open Expo Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore test Sentry error button"
          accessibilityRole="button"
          onPress={handleTestSentryError}
          className="bg-red-500 h-12 rounded-lg flex-row items-center justify-center"
        >
          <Text className="text-white font-medium text-base">🚨 Test Sentry Error</Text>
        </TouchableOpacity>
      </View>

      {/* Test Description */}
      <View className="bg-amber-500/10 p-4 rounded-lg mt-4">
        <Text className="text-amber-200 text-sm font-medium mb-2">🧪 Sentry Testing</Text>
        <Text className="text-amber-100 text-sm">
          Use "Test Sentry Error" to verify update tracking metadata appears correctly in the Sentry dashboard. The
          error will include current update information and admin context.
        </Text>
      </View>
    </ExpandableSection>
  );
}
