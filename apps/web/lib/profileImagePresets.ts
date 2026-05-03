const profileImageFilenames = [
  "spider.png",
  "peacock.png",
  "armadlio.png",
  "parrot.png",
  "eliphant.png",
  "blackleopard.png",
] as const;

export const profileImagePresets = profileImageFilenames.map((filename) => `/profile/${filename}`);

function hashSeed(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function pickProfileImagePreset(seed: string) {
  const normalizedSeed = seed.trim();

  if (!normalizedSeed) {
    return profileImagePresets[0];
  }

  return profileImagePresets[hashSeed(normalizedSeed) % profileImagePresets.length];
}

export function isProfileImagePreset(image: string | null | undefined) {
  return image ? profileImagePresets.includes(image) : false;
}

export function normalizeProfileImagePreset(
  image: string | null | undefined,
  fallbackSeed: string
) {
  return isProfileImagePreset(image) ? image : pickProfileImagePreset(fallbackSeed);
}
