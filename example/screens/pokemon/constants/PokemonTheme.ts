export const PokemonTheme = {
  colors: {
    // Primary Pokemon colors
    pokemonRed: "#FF0000",
    pokemonBlue: "#3B4CCA",
    pokemonYellow: "#FFDE00",
    pokemonGold: "#B3A125",

    // Type colors with neon glow effect
    electric: {
      primary: "#FFD700",
      glow: "#FFF59D",
      dark: "#F9A825",
    },
    fire: {
      primary: "#FF6B35",
      glow: "#FF8A65",
      dark: "#E64A19",
    },
    water: {
      primary: "#4FC3F7",
      glow: "#81D4FA",
      dark: "#0288D1",
    },
    grass: {
      primary: "#66BB6A",
      glow: "#81C784",
      dark: "#388E3C",
    },
    psychic: {
      primary: "#BA68C8",
      glow: "#CE93D8",
      dark: "#7B1FA2",
    },
    dark: {
      primary: "#424242",
      glow: "#616161",
      dark: "#212121",
    },
    normal: {
      primary: "#B0BEC5",
      glow: "#CFD8DC",
      dark: "#607D8B",
    },

    // UI Colors
    cardBg: "rgba(255, 255, 255, 0.1)",
    glassBg: "rgba(255, 255, 255, 0.05)",
    darkBg: "#0A0E27",
    lightBg: "#F7F9FF",
  },

  shadows: {
    neon: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 10,
      elevation: 10,
    }),
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
  },

  gradients: {
    electric: ["#FFD700", "#FFA000", "#FF6B35"] as const,
    water: ["#4FC3F7", "#29B6F6", "#0288D1"] as const,
    fire: ["#FF6B35", "#FF5722", "#E64A19"] as const,
    grass: ["#66BB6A", "#4CAF50", "#388E3C"] as const,
    psychic: ["#BA68C8", "#9C27B0", "#7B1FA2"] as const,
    dark: ["#424242", "#303030", "#212121"] as const,
    normal: ["#B0BEC5", "#90A4AE", "#607D8B"] as const,
    flying: ["#A890F0", "#9575CD", "#7E57C2"] as const,
    poison: ["#A040A0", "#8E24AA", "#6A1B9A"] as const,
    ground: ["#E0C068", "#FFB300", "#F57C00"] as const,
    fighting: ["#C03028", "#E53935", "#C62828"] as const,
    rock: ["#B8A038", "#9E9D24", "#827717"] as const,
    bug: ["#A8B820", "#9CCC65", "#689F38"] as const,
    ghost: ["#705898", "#5E35B1", "#4527A0"] as const,
    steel: ["#B8B8D0", "#90A4AE", "#607D8B"] as const,
    ice: ["#98D8D8", "#4DD0E1", "#00ACC1"] as const,
    dragon: ["#7038F8", "#651FFF", "#6200EA"] as const,
    fairy: ["#EE99AC", "#F48FB1", "#E91E63"] as const,
    rainbow: ["#FF6B35", "#FFD700", "#66BB6A", "#4FC3F7", "#BA68C8"] as const,
    aurora: ["#00D4FF", "#7F00FF", "#FF00E5", "#FFD700"] as const,
  },
};
