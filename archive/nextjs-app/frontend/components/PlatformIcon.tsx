import Image from "next/image";

export type Platform =
  | "facebook" | "instagram" | "snapchat" | "meta" | "google"
  | "tiktok" | "x" | "linkedin" | "youtube" | "youtube_shorts";

// Clean inline Snapchat ghost SVG — no JPEG artifacts, no white canvas border.
function SnapchatGhost({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: "#FFFC00",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        fill="white"
        aria-hidden="true"
      >
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.031-.51c-.11-1.629-.239-3.653.285-4.847C7.875 1.07 11.218.793 12.206.793z" />
      </svg>
    </div>
  );
}

type Config = {
  src: string;
  imgClass: string;
  wrapClass: string;
  wrapStyle?: React.CSSProperties;
};

const PLATFORM_CONFIG: Record<Exclude<Platform, "snapchat">, Config> = {
  facebook: {
    src: "/icons/facebook.jpeg",
    imgClass: "w-full h-full object-cover scale-[1.1]",
    wrapClass: "overflow-hidden",
  },
  instagram: {
    src: "/icons/instagram.jpeg",
    imgClass: "w-full h-full object-cover scale-[1.08]",
    wrapClass: "overflow-hidden",
  },
  meta: {
    src: "/icons/meta.png",
    imgClass: "w-[70%] h-[70%] object-contain",
    wrapClass: "flex items-center justify-center",
    wrapStyle: { background: "white" },
  },
  google: {
    src: "/icons/google.webp",
    imgClass: "w-full h-full object-cover scale-[1.03]",
    wrapClass: "overflow-hidden",
  },
  tiktok: {
    src: "/icons/tiktok.jpeg",
    imgClass: "w-full h-full object-cover scale-[1.1]",
    wrapClass: "overflow-hidden",
  },
  x: {
    src: "/icons/x.png",
    imgClass: "w-full h-full object-cover scale-[1.05]",
    wrapClass: "overflow-hidden",
  },
  linkedin: {
    src: "/icons/linkedin.png",
    imgClass: "w-full h-full object-cover",
    wrapClass: "overflow-hidden",
  },
  youtube: {
    src: "/icons/youtube.png",
    imgClass: "w-full h-full object-cover",
    wrapClass: "overflow-hidden",
  },
  youtube_shorts: {
    src: "/icons/youtube-shorts.png",
    imgClass: "w-full h-full object-cover",
    wrapClass: "overflow-hidden",
  },
};

type PlatformIconProps = {
  platform: string;
  size?: number;
  rounded?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function PlatformIcon({
  platform,
  size = 48,
  rounded = "rounded-2xl",
  className = "",
  style = {},
}: PlatformIconProps) {
  // Snapchat: always render clean inline SVG ghost — no JPEG artifacts.
  if (platform === "snapchat") {
    return (
      <div
        className={`shrink-0 ${rounded} overflow-hidden ${className}`}
        style={{ width: size, height: size, minWidth: size, ...style }}
      >
        <SnapchatGhost size={size} />
      </div>
    );
  }

  const cfg = PLATFORM_CONFIG[platform as Exclude<Platform, "snapchat">];
  if (!cfg) return null;
  const { src, imgClass, wrapClass, wrapStyle } = cfg;

  return (
    <div
      className={`shrink-0 ${rounded} ${wrapClass} ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        ...(wrapStyle ?? {}),
        ...style,
      }}
    >
      <Image
        src={src}
        alt={`${platform} logo`}
        width={size}
        height={size}
        className={imgClass}
        style={{ display: "block" }}
      />
    </div>
  );
}
