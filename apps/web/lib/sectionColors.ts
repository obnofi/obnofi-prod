export const SECTION_COLORS = [
  { name: "Fern", color: "#2E7D45", bg: "rgba(46,125,69,0.08)" },
  { name: "Ocean", color: "#1E3A5F", bg: "rgba(30,58,95,0.08)" },
  { name: "Berry", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  { name: "Sun", color: "#D97706", bg: "rgba(217,119,6,0.08)" },
  { name: "Orchid", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  { name: "Slate", color: "#475569", bg: "rgba(71,85,105,0.08)" },
];

export function getBorderColor(color: string) {
  if (color.startsWith("rgba")) {
    return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),[^)]+\)/, "rgba($1, $2, $3, 0.4)");
  }
  return color;
}
