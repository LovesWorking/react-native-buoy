import type { DimensionsAdapter } from './dimensions.types';

/**
 * Web dimensions adapter using window.innerWidth/innerHeight
 *
 * Provides window dimensions and listens to resize events.
 */
export const webDimensionsAdapter: DimensionsAdapter = {
  getWindow: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }),

  onChange: (callback) => {
    const handler = () => {
      callback({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  },
};
