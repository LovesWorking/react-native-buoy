import { Dimensions } from 'react-native';
import type { DimensionsAdapter } from './dimensions.types';

/**
 * React Native dimensions adapter using Dimensions API
 *
 * Provides window dimensions and listens to dimension change events.
 */
export const rnDimensionsAdapter: DimensionsAdapter = {
  getWindow: () => Dimensions.get('window'),

  onChange: (callback) => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      callback(window);
    });

    return () => {
      subscription?.remove();
    };
  },
};
