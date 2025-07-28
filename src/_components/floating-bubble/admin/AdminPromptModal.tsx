import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (userId: string) => void;
}

export function AdminPromptModal({ visible, onClose, onSubmit }: AdminPromptModalProps) {
  const { bottom } = useSafeAreaInsets();
  const [userId, setUserId] = useState('');

  // Reset user ID when modal becomes visible
  useEffect(() => {
    if (visible) {
      setUserId('');
    }
  }, [visible]);

  const handleSubmit = useCallback(() => {
    if (userId.trim()) {
      onSubmit(userId.trim());
      onClose();
    }
  }, [userId, onSubmit, onClose]);

  return (
    <Modal
      sentry-label="ignore admin prompt modal"
      accessibilityLabel="Admin prompt modal"
      accessibilityHint="Enter admin password"
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
                sentry-label="ignore cancel admin session button"
                accessibilityRole="button"
                onPress={onClose}
                className="px-3 py-2"
              >
                <Text className="text-base text-gray-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-base font-semibold text-white">Start Admin Session</Text>
              <TouchableOpacity
                sentry-label="ignore start admin session button"
                accessibilityRole="button"
                onPress={handleSubmit}
                disabled={!userId.trim()}
                className="px-3 py-2"
              >
                <Text className={`text-base font-semibold ${userId.trim() ? 'text-sky-400' : 'text-gray-600'}`}>
                  Start Session
                </Text>
              </TouchableOpacity>
            </View>

            <View className="p-4">
              <Text className="text-sm text-gray-400 mb-4">Enter the Org User ID to impersonate:</Text>

              <TextInput
                sentry-label="ignore user ID input field"
                accessibilityLabel="User ID input field"
                accessibilityHint="Enter the Org User ID to impersonate"
                className="bg-white/[0.05] text-white rounded-lg px-4 py-3 mb-4 border border-white/[0.08]"
                placeholder="Enter User ID..."
                placeholderTextColor="#6B7280"
                value={userId}
                onChangeText={setUserId}
                keyboardType="numeric"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                <Text className="text-xs font-semibold text-green-400 mb-1">ALLOWED (Local Only):</Text>
                <Text className="text-xs text-gray-300">• Mock send messages</Text>
                <Text className="text-xs text-gray-300">• Create/edit broadcasts</Text>
                <Text className="text-xs text-gray-300">• Assign users to conversations</Text>
                <Text className="text-xs text-gray-300">• Edit conversation statuses</Text>
                <Text className="text-xs text-gray-300">• View all user data</Text>

                <Text className="text-xs font-semibold text-red-400 mt-3 mb-1">BLOCKED (Protected):</Text>
                <Text className="text-xs text-gray-300">• Profile editing</Text>
                <Text className="text-xs text-gray-300">• Contact changes</Text>
                <Text className="text-xs text-gray-300">• Group/workflow modifications</Text>
                <Text className="text-xs text-gray-300">• Phone verification</Text>
              </View>
            </View>
          </View>
        </KeyboardStickyView>
      </View>
    </Modal>
  );
}
