import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminOrgPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (orgId: number) => void;
}

export function AdminOrgPromptModal({ visible, onClose, onSubmit }: AdminOrgPromptModalProps) {
  const { bottom } = useSafeAreaInsets();
  const [orgId, setOrgId] = useState('');

  // Reset org ID when modal becomes visible
  useEffect(() => {
    if (visible) {
      setOrgId('');
    }
  }, [visible]);

  const handleSubmit = useCallback(() => {
    if (orgId.trim()) {
      onSubmit(Number(orgId.trim()));
      onClose();
    }
  }, [orgId, onSubmit, onClose]);

  return (
    <Modal
      sentry-label="ignore admin org prompt modal"
      accessibilityLabel="Admin org prompt modal"
      accessibilityHint="Enter organization ID for admin access"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50">
        <KeyboardStickyView
          offset={{
            closed: 0,
            opened: Platform.select({
              ios: 0,
              android: 0,
            }),
          }}
          className="flex-1"
        >
          <View
            className="absolute bottom-0 left-0 right-0 bg-[#1F1F1F] rounded-t-xl"
            style={{ paddingBottom: bottom }}
          >
            <View className="flex-row justify-between items-center border-b border-white/[0.08] px-4 py-3.5">
              <TouchableOpacity
                sentry-label="ignore cancel org selection button"
                accessibilityRole="button"
                onPress={onClose}
                className="px-3 py-2"
              >
                <Text className="text-base text-gray-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-base font-semibold text-white">Select Organization</Text>
              <TouchableOpacity
                sentry-label="ignore view org users button"
                accessibilityRole="button"
                onPress={handleSubmit}
                disabled={!orgId.trim()}
                className="px-3 py-2"
              >
                <Text className={`text-base font-semibold ${orgId.trim() ? 'text-sky-400' : 'text-gray-600'}`}>
                  View Users
                </Text>
              </TouchableOpacity>
            </View>

            <View className="p-4">
              <Text className="text-sm text-gray-400 mb-4">Enter the Organization ID to view users:</Text>

              <TextInput
                sentry-label="ignore organization ID input"
                accessibilityLabel="Organization ID input"
                accessibilityHint="Enter the organization ID you want to access"
                className="bg-white/[0.05] text-white rounded-lg px-4 py-3 mb-4 border border-white/[0.08]"
                placeholder="Enter Organization ID..."
                placeholderTextColor="#6B7280"
                value={orgId}
                onChangeText={setOrgId}
                keyboardType="numeric"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View className="bg-white/[0.03] rounded-lg p-3 space-y-2" sentry-label="ignore organization users view">
                <Text className="text-xs font-semibold text-gray-300 mb-1">ORGANIZATION USERS:</Text>
                <Text className="text-xs text-gray-300">• View all users in the organization</Text>
                <Text className="text-xs text-gray-300">• Select a user to impersonate</Text>
                <Text className="text-xs text-gray-300">• See user roles and permissions</Text>
                <Text className="text-xs text-gray-300">• Access user details</Text>
              </View>
            </View>
          </View>
        </KeyboardStickyView>
      </View>
    </Modal>
  );
}
