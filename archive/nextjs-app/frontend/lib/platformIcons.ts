/**
 * Centralized platform icon map.
 * Use this everywhere instead of hard-coded icon paths or emoji.
 * All icons are in /public/icons/ and served statically.
 */

export const platformIcons: Record<string, string> = {
  facebook:       "/icons/facebook.png",
  instagram:      "/icons/instagram.jpeg",
  meta:           "/icons/meta.png",
  google:         "/icons/google.webp",
  snapchat:       "/icons/snapchat.png",
  tiktok:         "/icons/tiktok.jpeg",
  youtube:        "/icons/youtube.png",
  youtube_shorts: "/icons/youtube-shorts.png",
  linkedin:       "/icons/linkedin.png",
  x:              "/icons/x.png",
  twitter:        "/icons/x.png",
};

export type Platform = keyof typeof platformIcons;

/** Returns the icon src for a platform, or a fallback if unknown. */
export function getPlatformIcon(platform: string): string {
  return platformIcons[platform.toLowerCase()] ?? "/icons/meta.png";
}
