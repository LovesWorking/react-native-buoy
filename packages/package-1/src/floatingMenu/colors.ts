export const gameUIColors = {
  // Neutral, portable defaults
  primary: '#FFFFFF',
  secondary: '#B8BFC9',
  muted: '#7A8599',
  info: '#00B8E6',
  error: '#FF5252',
  success: '#4AFF9F',
  optional: '#9D4EDD',
  panel: 'rgba(16, 22, 35, 0.98)',
} as const;

export const dialColors = {
  dialBackground: '#000000',
  dialGradient1: `${gameUIColors.info}10`,
  dialGradient2: `${gameUIColors.info}08`,
  dialGradient3: `${gameUIColors.info}15`,
  dialBorder: `${gameUIColors.info}40`,
  dialShadow: gameUIColors.info,
  dialGridLine: `${gameUIColors.info}26`,
} as const;

