export const colors = {
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
  },

  // Brand colors
  blue: {
    400: '#60A5FA',
    500: '#3B82F6',
  },
  cyan: {
    400: '#22D3EE',
    500: '#06B6D4',
  },
  red: {
    400: '#F87171',
    500: '#EF4444',
  },
  yellow: {
    400: '#FBBF24',
    500: '#F59E0B',
  },
  orange: {
    400: '#FB923C',
    500: '#F97316',
  },
  purple: {
    400: '#A78BFA',
    500: '#8B5CF6',
  },
  pink: {
    400: '#F472B6',
    500: '#EC4899',
  },
  emerald: {
    400: '#34D399',
    500: '#10B981',
  },
  teal: {
    400: '#2DD4BF',
    500: '#14B8A6',
  },
  violet: {
    400: '#A78BFA',
    500: '#8B5CF6',
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
  },
  slate: {
    400: '#94A3B8',
    500: '#64748B',
  },
};

export const overlayColors = {
  white: {
    '0.02': 'rgba(255, 255, 255, 0.02)',
    '0.03': 'rgba(255, 255, 255, 0.03)',
    '0.05': 'rgba(255, 255, 255, 0.05)',
    '0.1': 'rgba(255, 255, 255, 0.1)',
  },
  black: {
    '0.2': 'rgba(0, 0, 0, 0.2)',
  },
};

export const commonStyles = {
  // Common container styles
  container: {
    flex: 1,
  },

  // Common text styles
  text: {
    base: {
      fontSize: 14,
      color: colors.white,
    },
    small: {
      fontSize: 12,
      color: colors.white,
    },
    mono: {
      fontFamily: 'monospace',
    },
  },

  // Common border styles
  border: {
    radius: {
      sm: 4,
      md: 6,
      lg: 8,
      full: 9999,
    },
    width: {
      thin: 1,
      medium: 2,
      thick: 3,
    },
  },

  // Common spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
};

export const getTypeConfig = (type: string) => {
  switch (type) {
    case 'Auth':
      return {
        color: colors.yellow[500],
        bgColor: `rgba(245, 158, 11, 0.2)`,
      };
    case 'Custom':
      return {
        color: colors.cyan[500],
        bgColor: `rgba(6, 182, 212, 0.2)`,
      };
    case 'Debug':
      return {
        color: colors.blue[400],
        bgColor: `rgba(96, 165, 250, 0.2)`,
      };
    case 'Error':
      return {
        color: colors.red[400],
        bgColor: `rgba(248, 113, 113, 0.2)`,
      };
    case 'Generic':
      return {
        color: colors.slate[400],
        bgColor: `rgba(148, 163, 184, 0.2)`,
      };
    case 'HTTP Request':
      return {
        color: colors.teal[400],
        bgColor: `rgba(45, 212, 191, 0.2)`,
      };
    case 'Navigation':
      return {
        color: colors.emerald[400],
        bgColor: `rgba(52, 211, 153, 0.2)`,
      };
    case 'System':
      return {
        color: colors.violet[400],
        bgColor: `rgba(167, 139, 250, 0.2)`,
      };
    case 'Touch':
      return {
        color: colors.amber[400],
        bgColor: `rgba(251, 191, 36, 0.2)`,
      };
    case 'User Action':
      return {
        color: colors.orange[400],
        bgColor: `rgba(251, 146, 60, 0.2)`,
      };
    case 'State':
      return {
        color: colors.purple[500],
        bgColor: `rgba(139, 92, 246, 0.2)`,
      };
    case 'Replay':
      return {
        color: colors.pink[500],
        bgColor: `rgba(236, 72, 153, 0.2)`,
      };
    default:
      return {
        color: colors.slate[400],
        bgColor: `rgba(148, 163, 184, 0.2)`,
      };
  }
};
