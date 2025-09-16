import { FC, useMemo, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { FloatingTools } from './floatingTools';
import type { InstalledApp, FloatingMenuActions, FloatingMenuState } from './types';
import { DialDevTools } from './dial/DialDevTools';

export interface FloatingMenuProps {
  apps: InstalledApp[];
  state?: FloatingMenuState;
  actions?: FloatingMenuActions;
  hidden?: boolean; // hide bubble when another dev app is open
}

export const FloatingMenu: FC<FloatingMenuProps> = ({ apps, state, actions, hidden }) => {
  const [internalHidden, setInternalHidden] = useState(false);
  const [showDial, setShowDial] = useState(false);
  const isHidden = useMemo(
    () => Boolean(hidden ?? (internalHidden || showDial)),
    [hidden, internalHidden, showDial]
  );

  const handlePress = (app: InstalledApp) => {
    try {
      const result = app.onPress({ state, actions });
      if (result && typeof (result as Promise<void>).then === 'function') {
        setInternalHidden(true);
        (result as Promise<void>).finally(() => setInternalHidden(false));
      }
    } catch {
      // ignore errors from user handlers; do not hide in this case
    }
  };

  return (
    <>
      <View pointerEvents={isHidden ? 'none' : 'auto'} style={{ opacity: isHidden ? 0 : 1 }}>
        <FloatingTools enablePositionPersistence>
        {/* Always-present dial launcher so users can access settings */}
        <TouchableOpacity
          accessibilityLabel="Open Dev Tools Menu"
          onPress={() => setShowDial(true)}
          style={styles.fab}
        >
          <View style={styles.menuButton}>
            <Text style={styles.menuDots}>⋮</Text>
          </View>
        </TouchableOpacity>

        {apps
          .filter((a) => (a.slot ?? 'both') !== 'dial')
          .map((app) => (
            <TouchableOpacity
              key={`row-${app.id}`}
              accessibilityLabel={app.name}
              onPress={() => handlePress(app)}
              style={styles.fab}
            >
              {typeof app.icon === 'function'
                ? app.icon({ slot: 'row', size: 16, state, actions })
                : app.icon}
            </TouchableOpacity>
          ))}
        </FloatingTools>
      </View>

      {showDial && (
        <DialDevTools
          apps={apps}
          state={state}
          actions={actions}
          onClose={() => {
            setShowDial(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    color: '#8CA2C8',
    fontSize: 14,
    fontWeight: '900',
  },
});
