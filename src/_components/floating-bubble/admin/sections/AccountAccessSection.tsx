import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { faChevronDown, faChevronRight, faUserSecret } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';

import { OrgUsersModalBody } from '~/features/admin/components/OrgUsersModalBody';
import { useAuthStore } from '~/features/auth/authStore';
import {
  clearImpersonateUserId,
  getImpersonateUserId,
  setImpersonateUserId,
} from '~/features/db/watermelon/syncConfig';

import { AdminOrgPromptModal } from '~/components/admin/AdminOrgPromptModal';
import { AdminPromptModal } from '~/components/admin/AdminPromptModal';
import { Separator } from '~/components/ui/separator';
import { Text } from '~/components/ui/text';

import { useIsGlooUserOrAdmin } from '~/lib/hooks/useIsGlooUserOrAdmin';
import { asyncStoragePersister } from '~/lib/queries/queryPersister';
import { logger } from '~/lib/utils/logger';

import { useToast } from '~/hooks/useToast';

import { ExpandableSection } from './ExpandableSection';

interface Props {
  closeModal: () => void;
}

export function AccountAccessSection({ closeModal }: Props) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, syncWithServer } = useAuthStore();
  const { isThryveAdmin } = useIsGlooUserOrAdmin();
  const [currentImpersonateUserId, setCurrentImpersonateUserId] = useState<string | null>(null);
  const [expandedOrgPermissions, setExpandedOrgPermissions] = useState<Set<number>>(new Set());
  const [expandedAccessOrgs, setExpandedAccessOrgs] = useState<Set<string>>(new Set());
  const [isImpersonationExpanded, setIsImpersonationExpanded] = useState(false);
  const [isOrgPermissionsExpanded, setIsOrgPermissionsExpanded] = useState(false);
  const [isAccessPermissionsExpanded, setIsAccessPermissionsExpanded] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isAdminPromptVisible, setIsAdminPromptVisible] = useState(false);
  const [isOrgPromptVisible, setIsOrgPromptVisible] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  // Load current impersonation status when modal opens
  useEffect(() => {
    const loadImpersonationStatus = async () => {
      try {
        const userId = await getImpersonateUserId();
        setCurrentImpersonateUserId(userId);
      } catch (error) {
        logger.error('Error loading impersonation status:', { error, tags: { category: 'admin.access' } });
      }
    };

    loadImpersonationStatus();
  }, []);

  // Helper functions for toggling expanded states
  const toggleOrgPermission = useCallback((orgId: number) => {
    setExpandedOrgPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orgId)) {
        newSet.delete(orgId);
      } else {
        newSet.add(orgId);
      }
      return newSet;
    });
  }, []);

  const toggleAccessOrg = useCallback((orgId: string) => {
    setExpandedAccessOrgs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orgId)) {
        newSet.delete(orgId);
      } else {
        newSet.add(orgId);
      }
      return newSet;
    });
  }, []);

  const handleClearImpersonation = useCallback(async () => {
    try {
      // Clear impersonation first
      await clearImpersonateUserId();
      setCurrentImpersonateUserId(null);

      // Update session using syncWithServer which handles both store and SecureStore
      await syncWithServer(queryClient);

      // Close modal first
      closeModal();

      // Navigate to profile selection
      router.replace('/auth/profile-selection');

      toast.show({
        type: 'success',
        text1: 'Impersonation Cleared',
        text2: 'Re-syncing with your normal account...',
      });
    } catch (error) {
      logger.error('Error clearing impersonation:', { error, tags: { category: 'admin.access' } });
      toast.show({
        type: 'error',
        text1: 'Clear Failed',
        text2: 'Failed to clear impersonation. Please try again.',
      });
    }
  }, [closeModal, queryClient, router, syncWithServer, toast]);

  const handleOrgUserSelect = useCallback(() => {
    // if not super admin show alert that you must be super admin to start an impersonation session
    if (!isThryveAdmin) {
      Alert.alert('Error', 'You must be a super admin to start an impersonation session');
      return;
    }

    setIsOrgPromptVisible(true);
  }, [isThryveAdmin]);

  const handleOrgSelect = useCallback((orgId: number) => {
    setSelectedOrgId(orgId);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
    setSelectedOrgId(null);
  }, []);

  const handleSnapPress = useCallback((index: number) => {
    bottomSheetModalRef.current?.snapToIndex(index);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.8} />
    ),
    [],
  );

  const handleStartSession = useCallback(() => {
    // if not super admin show alert that you must be super admin to start an impersonation session
    if (!isThryveAdmin) {
      Alert.alert('Error', 'You must be a super admin to start an impersonation session');
      return;
    }

    setIsAdminPromptVisible(true);
  }, [isThryveAdmin]);

  const handleStartSessionSubmit = useCallback(
    async (userId: string) => {
      try {
        // Set the impersonation header BEFORE clearing data and re-syncing
        await setImpersonateUserId(userId.trim());
        setCurrentImpersonateUserId(userId.trim());

        // Update session using syncWithServer which handles both store and SecureStore
        await syncWithServer(queryClient);

        // First clear the persisted cache
        await asyncStoragePersister.removeClient();
        // Clear query and mutation cache
        queryClient.clear();
        // Then reset the database
        //  await resetDatabase.refetch();
        // Close modal first
        closeModal();

        // Navigate to profile selection for admin impersonation
        router.replace('/auth/profile-selection');

        toast.show({
          type: 'info',
          text1: 'Admin Re-sync Started',
          text2: `Re-syncing as user ID: ${userId.trim()}`,
        });
      } catch (error) {
        logger.error('Error during admin re-sync:', { error, tags: { category: 'admin.access' } });
        toast.show({
          type: 'error',
          text1: 'Admin Re-sync Failed',
          text2: 'Failed to initiate re-sync. Please try again.',
        });
      }
    },
    [closeModal, queryClient, router, syncWithServer, toast],
  );

  return (
    <>
      <ExpandableSection
        icon={faUserSecret}
        iconColor={currentImpersonateUserId && session?.user?.impersonation ? '#EF4444' : '#0EA5E9'}
        iconBackgroundColor={
          currentImpersonateUserId && session?.user?.impersonation ? 'bg-red-500/10' : 'bg-sky-500/10'
        }
        title={currentImpersonateUserId && session?.user?.impersonation ? 'Active Impersonation' : 'Account Access'}
        subtitle={
          currentImpersonateUserId && session?.user?.impersonation
            ? `${session.user.impersonation.name} (${session.user.impersonation.glooUserId})`
            : session?.user?.name || 'View account details'
        }
      >
        <View className="space-y-4">
          {/* End Impersonation Button - Only show when impersonating */}
          {currentImpersonateUserId && session?.user?.impersonation && (
            <TouchableOpacity
              sentry-label="ignore end impersonation button"
              accessibilityLabel="End impersonation button"
              accessibilityHint="Stop impersonating the current user"
              onPress={handleClearImpersonation}
              className="bg-red-500 h-12 rounded-lg flex-row items-center justify-center mb-4"
            >
              <Text className="text-white font-medium text-base">End Impersonation</Text>
            </TouchableOpacity>
          )}

          <Text className="text-sm text-gray-400 mb-4">
            Start a session by entering a User ID directly or selecting from an Organization's user list.
          </Text>

          {/* Start Session Button - Always show */}
          <TouchableOpacity
            sentry-label="ignore start session by user ID button"
            accessibilityRole="button"
            onPress={handleStartSession}
            className="bg-sky-500 h-12 rounded-lg flex-row items-center justify-center mb-4"
          >
            <Text className="text-white font-medium text-base">Start Session by User ID</Text>
          </TouchableOpacity>

          {/* Select Users Button */}
          <TouchableOpacity
            sentry-label="ignore start session by org users button"
            accessibilityRole="button"
            onPress={handleOrgUserSelect}
            className="bg-sky-500 h-12 rounded-lg flex-row items-center justify-center"
          >
            <Text className="text-white font-medium text-base">Start Session by Org Users</Text>
          </TouchableOpacity>

          {/* Detailed Information - Collapsible */}
          <TouchableOpacity
            sentry-label="ignore view impersonation details button"
            accessibilityLabel="View impersonation details button"
            accessibilityHint="Toggle impersonation details visibility"
            onPress={() => setIsImpersonationExpanded(!isImpersonationExpanded)}
            className="flex-row items-center justify-between mt-4"
          >
            <Text className="text-white font-medium">View Details</Text>
            <FontAwesomeIcon
              icon={isImpersonationExpanded ? faChevronDown : faChevronRight}
              size={16}
              color="#6B7280"
            />
          </TouchableOpacity>

          {isImpersonationExpanded && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Separator className="bg-white/[0.06] my-6" />

              <View className="space-y-8">
                {/* Basic User Info */}
                <View sentry-label="ignore user details view">
                  <Text className="text-sm text-gray-500 mb-4 font-medium">USER DETAILS</Text>
                  <View className="bg-white/[0.03] p-4 rounded-lg space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Name:</Text>
                      <Text className="text-white font-medium">
                        {currentImpersonateUserId && session?.user?.impersonation
                          ? session.user.impersonation.name
                          : session?.user?.name}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Email:</Text>
                      <Text className="text-white font-medium">
                        {currentImpersonateUserId && session?.user?.impersonation
                          ? session.user.impersonation.email
                          : session?.user?.email}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">User ID:</Text>
                      <Text className="text-white font-mono">
                        {currentImpersonateUserId && session?.user?.impersonation
                          ? session.user.impersonation.glooUserId
                          : session?.user?.glooUserId}
                      </Text>
                    </View>
                    {((currentImpersonateUserId && session?.user?.impersonation?.phone) ||
                      (!currentImpersonateUserId && session?.user?.phone)) && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-400">Phone:</Text>
                        <Text className="text-white font-medium">
                          {currentImpersonateUserId && session?.user?.impersonation
                            ? session.user.impersonation.phone
                            : session?.user?.phone}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">First Name:</Text>
                      <Text className="text-white font-medium">
                        {currentImpersonateUserId && session?.user?.impersonation
                          ? session.user.impersonation.firstName
                          : session?.user?.firstName}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Last Name:</Text>
                      <Text className="text-white font-medium">
                        {currentImpersonateUserId && session?.user?.impersonation
                          ? session.user.impersonation.lastName
                          : session?.user?.lastName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Organization Permissions */}
                <View className="my-4">
                  <TouchableOpacity
                    sentry-label="ignore view org permissions button"
                    accessibilityRole="button"
                    accessibilityLabel="View org permissions button"
                    accessibilityHint="Toggle organization permissions visibility"
                    onPress={() => setIsOrgPermissionsExpanded(!isOrgPermissionsExpanded)}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-gray-500 font-medium">
                      ORGANIZATION PERMISSIONS (
                      {(currentImpersonateUserId && session?.user?.impersonation?.OrgUserPermissions?.length) ||
                        session?.user?.OrgUserPermissions?.length ||
                        0}
                      )
                    </Text>
                    <FontAwesomeIcon
                      icon={isOrgPermissionsExpanded ? faChevronDown : faChevronRight}
                      size={16}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {isOrgPermissionsExpanded && (
                    <Animated.View entering={FadeIn.duration(200)} className="mt-4">
                      {((currentImpersonateUserId && session?.user?.impersonation?.OrgUserPermissions) ||
                        session?.user?.OrgUserPermissions) &&
                      ((currentImpersonateUserId && session?.user?.impersonation?.OrgUserPermissions?.length) ||
                        session?.user?.OrgUserPermissions?.length ||
                        0) > 0 ? (
                        <View className="space-y-3">
                          {(
                            (currentImpersonateUserId && session?.user?.impersonation?.OrgUserPermissions) ||
                            session?.user?.OrgUserPermissions ||
                            []
                          ).map((permission, index) => (
                            <View key={index} className="my-1.5">
                              <TouchableOpacity
                                sentry-label="ignore view org user permissions button"
                                accessibilityLabel="View org user permissions button"
                                accessibilityHint="View permissions for this organization user"
                                onPress={() => toggleOrgPermission(permission.orgId)}
                                className="flex-row items-center justify-between bg-white/[0.03] p-4 rounded-lg"
                              >
                                <View className="flex-1">
                                  <Text className="text-white font-medium">Org ID: {permission.orgId}</Text>
                                  <Text className="text-gray-400 text-sm">
                                    User ID: {permission.orgUserId} •{' '}
                                    {permission.admin ? 'Admin Access' : 'Standard Access'}
                                  </Text>
                                </View>
                                <View className="flex-row items-center space-x-3">
                                  {permission.admin && (
                                    <View className="bg-amber-500/10 px-3 py-1.5 rounded-md">
                                      <Text className="text-amber-400 text-xs font-medium text-center">ADMIN</Text>
                                    </View>
                                  )}
                                  <FontAwesomeIcon
                                    icon={expandedOrgPermissions.has(permission.orgId) ? faChevronDown : faChevronRight}
                                    size={16}
                                    color="#6B7280"
                                  />
                                </View>
                              </TouchableOpacity>

                              {expandedOrgPermissions.has(permission.orgId) && (
                                <Animated.View entering={FadeIn.duration(200)} className="ml-4 mt-3">
                                  <View className="bg-white/[0.02] p-4 rounded-lg space-y-3">
                                    <View className="flex-row justify-between">
                                      <Text className="text-gray-400 text-sm">Created:</Text>
                                      <Text className="text-white text-sm">
                                        {new Date(permission.createdAt).toLocaleDateString()}
                                      </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                      <Text className="text-gray-400 text-sm">Updated:</Text>
                                      <Text className="text-white text-sm">
                                        {new Date(permission.updatedAt).toLocaleDateString()}
                                      </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                      <Text className="text-gray-400 text-sm">Audit Version:</Text>
                                      <Text className="text-white text-sm">{permission.auditVersion}</Text>
                                    </View>
                                    {permission.glooPlusPurchaser && (
                                      <View className="flex-row justify-between">
                                        <Text className="text-gray-400 text-sm">Gloo Plus:</Text>
                                        <Text className="text-green-400 text-sm">Yes</Text>
                                      </View>
                                    )}
                                  </View>
                                </Animated.View>
                              )}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View className="bg-white/[0.03] p-4 rounded-lg">
                          <Text className="text-gray-500 text-sm italic text-center">
                            No organization permissions found
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </View>

                {/* Access Permissions */}
                <View className="my-4">
                  <TouchableOpacity
                    sentry-label="ignore view access permissions button"
                    accessibilityLabel="View access permissions button"
                    accessibilityHint="Toggle access permissions visibility"
                    onPress={() => setIsAccessPermissionsExpanded(!isAccessPermissionsExpanded)}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-gray-500 font-medium">
                      ACCESS PERMISSIONS (
                      {
                        Object.keys(
                          (currentImpersonateUserId && session?.user?.impersonation?.access) ||
                            session?.user?.access ||
                            {},
                        ).length
                      }
                      )
                    </Text>
                    <FontAwesomeIcon
                      icon={isAccessPermissionsExpanded ? faChevronDown : faChevronRight}
                      size={16}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {isAccessPermissionsExpanded && (
                    <Animated.View entering={FadeIn.duration(200)} className="mt-4">
                      {((currentImpersonateUserId && session?.user?.impersonation?.access) || session?.user?.access) &&
                      Object.keys(
                        (currentImpersonateUserId && session?.user?.impersonation?.access) ||
                          session?.user?.access ||
                          {},
                      ).length > 0 ? (
                        <View className="space-y-3">
                          {Object.entries(
                            (currentImpersonateUserId && session?.user?.impersonation?.access) ||
                              session?.user?.access ||
                              {},
                          ).map(([orgId, accessData]) => (
                            <View key={orgId} className="my-1.5">
                              <TouchableOpacity
                                sentry-label="ignore toggle access org button"
                                accessibilityLabel={`Toggle organization ${orgId} details`}
                                accessibilityHint={`Toggle visibility of organization ${orgId} details`}
                                onPress={() => toggleAccessOrg(orgId)}
                                className="flex-row items-center justify-between bg-white/[0.03] p-4 rounded-lg"
                              >
                                <View>
                                  <Text className="text-white font-medium">Organization {orgId}</Text>
                                  <Text className="text-gray-400 text-sm">
                                    {accessData.permissions?.length || 0} permissions •{' '}
                                    {Object.keys(accessData.preferences || {}).length} preferences
                                  </Text>
                                </View>
                                <FontAwesomeIcon
                                  icon={expandedAccessOrgs.has(orgId) ? faChevronDown : faChevronRight}
                                  size={16}
                                  color="#6B7280"
                                />
                              </TouchableOpacity>

                              {expandedAccessOrgs.has(orgId) && (
                                <Animated.View entering={FadeIn.duration(200)} className="ml-4 mt-3">
                                  <View className="bg-white/[0.02] p-4 rounded-lg space-y-4">
                                    {/* Permissions */}
                                    <View>
                                      <View className="flex-row items-start">
                                        <Text className="text-gray-400 text-sm font-medium mr-2">Permissions:</Text>
                                        {(accessData.permissions || []).length > 0 ? (
                                          <Text className="text-white text-sm font-mono flex-1">
                                            [{(accessData.permissions || []).join(', ')}]
                                          </Text>
                                        ) : (
                                          <Text className="text-gray-500 text-sm italic">Not found</Text>
                                        )}
                                      </View>
                                    </View>

                                    {/* Preferences */}
                                    <View>
                                      <Text className="text-gray-400 text-sm font-medium mb-3">Preferences:</Text>
                                      {Object.keys(accessData.preferences || {}).length > 0 ? (
                                        <View className="bg-white/[0.02] p-3 rounded-lg space-y-2">
                                          {Object.entries(accessData.preferences || {}).map(([key, value]) => (
                                            <View key={key} className="flex-row justify-between items-center">
                                              <Text className="text-gray-300 text-sm">{key}</Text>
                                              <View className="flex-row items-center">
                                                <View
                                                  className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-400' : 'bg-red-400'}`}
                                                />
                                                <Text
                                                  className={`w-[30px] text-sm font-medium ${value ? 'text-green-400' : 'text-red-400'}`}
                                                >
                                                  {String(value)}
                                                </Text>
                                              </View>
                                            </View>
                                          ))}
                                        </View>
                                      ) : (
                                        <View className="bg-white/[0.02] p-3 rounded-lg">
                                          <Text className="text-gray-500 text-sm italic text-center">Not found</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* Interactions */}
                                    <View>
                                      <View className="flex-row items-start">
                                        <Text className="text-gray-400 text-sm font-medium mr-2">Interactions:</Text>
                                        {accessData.interactions && Object.keys(accessData.interactions).length > 0 ? (
                                          <Text className="text-white text-sm font-mono flex-1" numberOfLines={0}>
                                            {JSON.stringify(accessData.interactions, null, 2)}
                                          </Text>
                                        ) : (
                                          <Text className="text-gray-500 text-sm italic">Not found</Text>
                                        )}
                                      </View>
                                    </View>
                                  </View>
                                </Animated.View>
                              )}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View className="bg-white/[0.03] p-4 rounded-lg">
                          <Text className="text-gray-500 text-sm italic text-center">No access permissions found</Text>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </View>

                {/* Current Organization Context */}
                {((currentImpersonateUserId && session?.user?.currentAccount) ||
                  (!currentImpersonateUserId && session?.user?.currentAccount)) && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-4 font-medium">CURRENT ORGANIZATION CONTEXT</Text>
                    <View className="bg-white/[0.03] p-4 rounded-lg space-y-3">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-400">Name:</Text>
                        <Text className="text-white font-medium">
                          {(currentImpersonateUserId && session?.user?.currentAccount?.name) ||
                            (!currentImpersonateUserId && session?.user?.currentAccount?.name)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-400">ID:</Text>
                        <Text className="text-white font-mono">
                          {(currentImpersonateUserId && session?.user?.currentAccount?.id) ||
                            (!currentImpersonateUserId && session?.user?.currentAccount?.id)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-400">Status:</Text>
                        <Text className="text-white font-medium">
                          {(currentImpersonateUserId && session?.user?.currentAccount?.status) ||
                            (!currentImpersonateUserId && session?.user?.currentAccount?.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </ExpandableSection>

      {/* Org Users Modal */}
      <BottomSheetModal
        android_keyboardInputMode="adjustResize"
        ref={bottomSheetModalRef}
        snapPoints={['90%']}
        index={0}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: '#171717',
        }}
        handleIndicatorStyle={{
          backgroundColor: '#6B7280',
          width: 40,
          height: 5,
        }}
        style={{ marginTop: insets.top }}
        stackBehavior="push"
      >
        {selectedOrgId && (
          <OrgUsersModalBody
            handleSnapPress={handleSnapPress}
            closeModal={handleDismissModalPress}
            orgId={selectedOrgId}
          />
        )}
      </BottomSheetModal>

      {/* Admin Prompt Modal */}
      <AdminPromptModal
        visible={isAdminPromptVisible}
        onClose={() => setIsAdminPromptVisible(false)}
        onSubmit={handleStartSessionSubmit}
      />

      {/* Org Selection Modal */}
      <AdminOrgPromptModal
        visible={isOrgPromptVisible}
        onClose={() => setIsOrgPromptVisible(false)}
        onSubmit={handleOrgSelect}
      />
    </>
  );
}
