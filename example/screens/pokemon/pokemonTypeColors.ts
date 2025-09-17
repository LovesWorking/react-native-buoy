export const pokemonTypeColors: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export function getTypeColor(type: string): string {
  return pokemonTypeColors[type] || "#68A090";
}

export function getStatBarColor(value: number): string {
  if (value > 90) return "#78C850";
  if (value > 50) return "#6890F0";
  return "#F08030";
}
