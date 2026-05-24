export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function createGraphSeedPosition(index: number, total: number) {
  const spread = Math.max(160, Math.sqrt(total) * 120);
  const radius = Math.sqrt(index + 0.5) * (spread / Math.max(1, Math.sqrt(total)));
  const angle = index * GOLDEN_ANGLE;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}
