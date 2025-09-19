import { FC } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Tab = { key: string; label: string };

export const TabSelector: FC<{
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {tabs.map((t) => {
        const active = t.key === activeTab;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onTabChange(t.key)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? 'rgba(0,184,230,0.2)' : 'transparent',
              borderWidth: active ? 1 : 1,
              borderColor: active ? 'rgba(0,184,230,0.4)' : '#2a3550',
            }}
          >
            <Text style={{ color: active ? '#00B8E6' : '#8CA2C8', fontWeight: '700' }}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

