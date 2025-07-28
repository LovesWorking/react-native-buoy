// Custom theme for JSONTree - matches app's color palette and admin modal design
export const jsonTreeTheme = {
  scheme: 'lovesworking',
  // Base colors - using app's dark theme palette
  base00: 'transparent', // background - transparent to blend with container
  base01: '#1a1a1a', // darker background
  base02: '#262626', // selection background
  base03: '#6B7280', // comments, disabled - gray-500
  base04: '#9CA3AF', // dark foreground - gray-400
  base05: '#F9FAFB', // default foreground - gray-50
  base06: '#F3F4F6', // light foreground - gray-100
  base07: '#FFFFFF', // lightest foreground - white

  // Semantic colors using app's admin color scheme
  base08: '#EF4444', // variables, tags - red-500 (error color)
  base09: '#F97316', // integers, booleans - orange-500 (warning/orange)
  base0A: '#EAB308', // classes, search text bg - yellow-500 (warning)
  base0B: '#22D3EE', // strings, inherited class - cyan-400 (used for users/data)
  base0C: '#06B6D4', // support, regular expressions - cyan-600 (darker cyan)
  base0D: '#60A5FA', // functions, methods - blue-400 (used for org messages)
  base0E: '#A855F7', // keywords, storage - purple-500 (used for system/gloo)
  base0F: '#F472B6', // deprecated, opening/closing tags - pink-400 (used for workflows)
};
