"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ga } from "@/lib/gtag";

interface BusinessProfile {
  businessName: string;
  websiteUrl: string;
  destinationUrl: string;
  category: string;
  description: string;
  targetAudience: string;
  brandTone: string;
  location: string;
  mainOffer: string;
}

interface GeneratedContent {
  id: string;
  title: string;
  caption: string;
  shortCaption: string;
  longCaption: string;
  hashtags: string[];
  cta: string;
  destinationUrl: string;
  imagePrompt: string;
  imageUrl?: string;
  reelScript: string;
  shotList: string[];
  platformVersions: Record<string, string>;
  suggestedPostingTime: string;
  aiAvailable: boolean;
}

type VideoStatus = "idle" | "queued" | "generating" | "rendering" | "completed" | "failed" | "unsupported";

interface VideoJobState {
  jobId: string | null;
  status: VideoStatus;
  progress: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  unsupportedReason: string | null;
}

interface PlatformPublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
  dryRun?: boolean;
  preview?: string;
}

const CONTENT_TYPES = [
  { value: "caption",          label: "Caption Only",        d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { value: "image_post",       label: "Image Post",          d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { value: "full_social_post", label: "Full Social Post",    d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
  { value: "ad_creative",      label: "Ad Creative Pack",    d: "M13 10V3L4 14h7v7l9-11h-7z" },
  { value: "campaign_pack",    label: "Full Campaign Pack",  d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { value: "video",            label: "Video Script",        d: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" },
];

const PLATFORMS = [
  { value: "facebook", label: "Meta (Facebook)", color: "#1877F2" },
  { value: "tiktok",   label: "TikTok",          color: "#000000" },
  { value: "snapchat", label: "Snapchat",         color: "#FFFC00" },
];


const TONES = ["Professional", "Friendly", "Energetic", "Playful", "Luxurious", "Bold", "Casual", "Inspirational"];

type AdGender = "all" | "male" | "female";

interface AdSettings {
  ageMin: number;
  ageMax: number;
  gender: AdGender;
  location: string;
  radiusMiles: number;
  targetingMode: "broad";
  budget: number;
  durationDays: number;
  platforms: string[];
}

interface PlatformAdResult {
  platform: string;
  status: "draft" | "ready" | "running" | "failed";
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  dryRun?: boolean;
  message?: string;
  error?: string;
}

interface AdLaunchResult {
  success: boolean;
  dry_run: boolean;
  summary: { total: number; launched: number; failed: number };
  adSettings: AdSettings;
  results: PlatformAdResult[];
}

const AD_PLATFORMS = [
  { value: "meta",     label: "Meta (Facebook + Instagram)", icon: "/icons/meta.png" },
  { value: "tiktok",  label: "TikTok",                      icon: "/icons/tiktok.jpeg" },
  { value: "snapchat",label: "Snapchat",                    icon: "/icons/snapchat.png" },
  { value: "youtube", label: "YouTube",                     icon: "/icons/youtube.png" },
];

const AD_MIN_BUDGETS: Record<string, number> = {
  youtube: 50,
};

const AD_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  running: { label: "Running",      color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  draft:   { label: "Draft",        color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  ready:   { label: "Ready",        color: "#4285C7", bg: "rgba(66,133,199,0.1)" },
  failed:  { label: "Failed",       color: "#C13A2A", bg: "rgba(193,58,42,0.08)" },
};

function Spinner({ size = 6, color = "#C13A2A" }: { size?: number; color?: string }) {
  return (
    <svg className={`w-${size} h-${size} animate-spin`} style={{ color }} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ProgressBar({ value, color = "#4285C7" }: { value: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(0,0,0,0.07)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

export default function ContentStudioPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [contentType, setContentType] = useState("full_social_post");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "tiktok"]);
  const [generatedWithType, setGeneratedWithType] = useState<string | null>(null);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [audience, setAudience] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"caption" | "platforms" | "reel" | "image" | "video">("caption");
  const [approving, setApproving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoadingMsg, setImageLoadingMsg] = useState("Generating your image…");
  const [socialReady, setSocialReady] = useState<Record<string, boolean>>({});
  const [isAd, setIsAd] = useState(false);
  const [adSettings, setAdSettings] = useState<AdSettings>({
    ageMin: 18, ageMax: 65, gender: "all",
    location: "", radiusMiles: 5, targetingMode: "broad",
    budget: 0, durationDays: 7, platforms: ["meta"],
  });
  const [adLaunching, setAdLaunching] = useState(false);
  const [adResult, setAdResult] = useState<AdLaunchResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Video generation state
  const [video, setVideo] = useState<VideoJobState>({
    jobId: null, status: "idle", progress: 0,
    videoUrl: null, thumbnailUrl: null, error: null, unsupportedReason: null,
  });
  const videoElemRef = useRef<HTMLVideoElement>(null);
  const [videoStarting, setVideoStarting] = useState(false);
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Publishing state
  const [sendingToQueue, setSendingToQueue] = useState(false);
  const [publishingNow, setPublishingNow] = useState(false);
  const [publishResult, setPublishResult] = useState<Record<string, PlatformPublishResult> | null>(null);
  const [publishMsg, setPublishMsg] = useState("");

  // Load social readiness on mount
  useEffect(() => {
    fetch("/api/social/debug")
      .then((r) => r.json())
      .then((d: {
        meta?: { canPostFacebook?: boolean; canPostInstagram?: boolean };
        x?: { postingReady?: boolean };
        linkedin?: { postingReady?: boolean };
        youtube?: { uploadReady?: boolean };
        tiktok?: { postingReady?: boolean };
        snapchat?: { marketingApiReady?: boolean };
      }) => {
        setSocialReady({
          facebook:       !!d.meta?.canPostFacebook,
          instagram:      !!d.meta?.canPostInstagram,
          x:              !!d.x?.postingReady,
          linkedin:       !!d.linkedin?.postingReady,
          youtube_shorts: !!d.youtube?.uploadReady,
          tiktok:         !!d.tiktok?.postingReady,
          snapchat:       !!d.snapchat?.marketingApiReady,
        });
      })
      .catch(() => {});
  }, []);

  // Load business profile
  useEffect(() => {
    apiFetch<BusinessProfile | null>("/v1/dashboard/business").then((res) => {
      if (res.ok && res.data) {
        setProfile(res.data);
        setTone(res.data.brandTone || "Friendly");
        setAudience(res.data.targetAudience || "");
        setOffer(res.data.mainOffer || "");
        if (res.data.location) setAdSettings(prev => ({ ...prev, location: res.data!.location }));
      }
      setProfileLoading(false);
    });
  }, []);

  // Video polling
  useEffect(() => {
    const videoActive = video.status === "queued" || video.status === "generating" || video.status === "rendering";
    if (video.jobId && videoActive) {
      videoPollRef.current = setInterval(async () => {
        const res = await apiFetch<{
          jobId: string; status: VideoStatus; progress: number;
          videoUrl: string | null; thumbnailUrl: string | null;
          error: string | null; unsupportedReason: string | null;
        }>(`/v1/ai/reel-video/status/${video.jobId}`);

        if (res.ok && res.data) {
          const d = res.data;
          setVideo(prev => ({
            ...prev,
            status: d.status,
            progress: d.progress,
            videoUrl: d.videoUrl,
            thumbnailUrl: d.thumbnailUrl,
            error: d.error,
            unsupportedReason: d.unsupportedReason,
          }));

          const videoTerminal = d.status === "completed" || d.status === "failed" || d.status === "unsupported";
          if (videoTerminal) {
            if (videoPollRef.current) clearInterval(videoPollRef.current);
            if (d.status === "completed") {
              setSavedMsg("Video generated! Save it to your content library.");
              setTimeout(() => setSavedMsg(""), 5000);
            }
          }
        }
      }, 5000);
    }

    return () => {
      if (videoPollRef.current) clearInterval(videoPollRef.current);
    };
  }, [video.jobId, video.status]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    if (!campaignGoal.trim() || !offer.trim()) {
      setError("Please fill in campaign goal and offer/product.");
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);
    setImageError(null);
    setVideo({ jobId: null, status: "idle", progress: 0, videoUrl: null, thumbnailUrl: null, error: null, unsupportedReason: null });
    setPublishResult(null);
    setPublishMsg("");

    const res = await apiFetch<GeneratedContent>("/v1/dashboard/content/generate", {
      method: "POST",
      body: { contentType, platforms, campaignGoal, offer, tone, audience, extraInstructions },
      timeoutMs: 90000,
    });

    if (res.ok) {
      ga.contentGenerate(contentType);
      setResult(res.data);
      setEditedCaption(res.data.caption ?? "");
      setGeneratedWithType(contentType);
      // Default to the most relevant tab for the content type chosen
      if (contentType === "image_post") setActiveTab("image");
      else if (contentType === "video") setActiveTab("reel");
      else setActiveTab("caption");
    } else if (res.status === 400) {
      setError("Please complete your business profile before generating content.");
    } else if (res.status === 403) {
      setError("Not enough tokens. Buy more to continue.");
    } else {
      setError(res.error || "Generation failed. Please try again.");
    }
    setGenerating(false);
  };

  const handleGenerateImage = async (forceRegenerate = false) => {
    if (!result) return;
    setImageGenerating(true);
    setImageError(null);
    setImageLoadingMsg("Generating your image…");

    const platform = platforms[0] || "instagram";
    const contentId = result.id;

    const LOADING_PHASES = [
      { after: 0,   msg: "Generating your image…" },
      { after: 20,  msg: "Still creating… hang tight" },
      { after: 45,  msg: "Almost there…" },
      { after: 70,  msg: "Finalizing your image…" },
      { after: 100, msg: "Just a few more seconds…" },
    ];
    const startTime = Date.now();
    const phaseTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const phase = [...LOADING_PHASES].reverse().find(p => elapsed >= p.after);
      if (phase) setImageLoadingMsg(phase.msg);
    }, 2000);

    // Retry loop — max 4 attempts, only hard-stop on token error.
    // Always use 90s timeout: chatgpt-image-latest can take up to 55s server-side,
    // and 40s was consistently cutting off valid in-flight generations.
    let attempt = 0;
    const MAX_IMAGE_RETRIES = 4;
    while (attempt < MAX_IMAGE_RETRIES) {
      // Alternate: on even attempts try fresh generation, odd attempts check cache first
      const useForce = attempt === 0 ? forceRegenerate : attempt % 2 === 0;

      const res = await apiFetch<{ imageUrl: string; cached: boolean; revisedPrompt?: string }>(
        `/v1/dashboard/content/${contentId}/generate-image`,
        { method: "POST", body: { platform, forceRegenerate: useForce }, timeoutMs: 90000 }
      );

      if (res.ok && res.data?.imageUrl) {
        clearInterval(phaseTimer);
        ga.imageGenerate(platform);
        setResult((prev) => prev ? { ...prev, imageUrl: res.data!.imageUrl } : prev);
        setImageGenerating(false);
        return;
      }

      // Only hard-stop on token error
      if (res.status === 403) {
        clearInterval(phaseTimer);
        setImageError("Not enough tokens. Buy more to continue.");
        setImageGenerating(false);
        return;
      }

      // Wait before retrying — longer waits on later attempts
      const delay = Math.min(3000 + attempt * 1000, 8000);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }

    // Max retries exhausted
    clearInterval(phaseTimer);
    setImageError("Image generation timed out after multiple attempts. Please try again.");
    setImageGenerating(false);
  };

  const handleDownloadImage = (imageUrl: string, filename = "worlddigitalai-image.png") => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  const handleApprove = async () => {
    if (!result) return;
    setApproving(true);
    const body: Record<string, unknown> = {
      status: "approved",
      generatedCaption: editedCaption || result.caption,
    };
    if (video.videoUrl) body["videoUrl"] = video.videoUrl;
    const res = await apiFetch(`/v1/dashboard/content/${result.id}`, {
      method: "PUT",
      body,
    });
    if (res.ok) {
      setShowSaveModal(false);
      setSavedMsg("Saved to library!");
      setTimeout(() => setSavedMsg(""), 4000);
    }
    setApproving(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  const handleLaunchAd = async () => {
    if (!result || !isAd) return;
    const hasYouTube = adSettings.platforms.includes("youtube");
    const minBudget = hasYouTube ? 50 : 10;
    if (adSettings.budget < minBudget) {
      setError(hasYouTube
        ? "YouTube requires a minimum daily budget of $50/day."
        : "Minimum daily budget is $10/day.");
      return;
    }
    setAdLaunching(true);
    setAdResult(null);
    setError(null);

    const res = await apiFetch<AdLaunchResult>("/ads/launch", {
      method: "POST",
      body: {
        campaignName: `${profile?.businessName || "WorldDigital.ai"} — ${campaignGoal.slice(0, 40)}`,
        caption: result.caption,
        destinationUrl: result.destinationUrl || profile?.destinationUrl || profile?.websiteUrl || "",
        adSettings,
      },
    });

    if (res.ok) {
      setAdResult(res.data);
      setSavedMsg(res.data.dry_run ? "Ad simulated (dry-run mode)" : "Ad campaign launched!");
      setTimeout(() => setSavedMsg(""), 6000);
    } else {
      setError(res.error || "Ad launch failed. Check your ad settings and try again.");
    }
    setAdLaunching(false);
  };

  function toggleAdPlatform(p: string) {
    setAdSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  }

  // ── Video generation ────────────────────────────────────────────────────────

  const handleStartVideoGeneration = async () => {
    if (!result) return;
    if (!result.reelScript?.trim()) {
      setError("No reel script found. Generate content with Reel Script type first.");
      return;
    }

    setVideoStarting(true);
    setVideo(prev => ({ ...prev, status: "queued", progress: 5, error: null }));

    const res = await apiFetch<{ jobId: string; status: VideoStatus; unsupportedReason?: string }>(
      "/v1/ai/reel-video/start",
      {
        method: "POST",
        body: {
          contentId: result.id,
          script: result.reelScript,
          shotList: result.shotList || [],
          businessProfile: profile ? { businessName: profile.businessName } : undefined,
          platform: platforms[0] || "instagram",
          durationSeconds: 8,
          aspectRatio: "9:16",
          style: tone.toLowerCase(),
          ctaUrl: result.destinationUrl || profile?.destinationUrl || "",
        },
      }
    );

    if (res.ok && res.data) {
      setVideo(prev => ({
        ...prev,
        jobId: res.data!.jobId,
        status: res.data!.status,
        progress: res.data!.status === "unsupported" ? 0 : 10,
        unsupportedReason: res.data!.unsupportedReason ?? null,
      }));
      setActiveTab("video");
    } else if (res.status === 403) {
      setError(res.error || "Not enough tokens to generate a video. Buy more to continue.");
      setVideo(prev => ({ ...prev, status: "idle", progress: 0, error: null }));
    } else {
      setVideo(prev => ({
        ...prev,
        status: "failed",
        error: res.error || "Could not start video generation.",
        progress: 0,
      }));
    }
    setVideoStarting(false);
  };

  const handleRegenerateVideo = async () => {
    if (!video.jobId) return;
    setVideo(prev => ({ ...prev, status: "queued", progress: 5, error: null, videoUrl: null, thumbnailUrl: null, unsupportedReason: null }));

    const res = await apiFetch<{ jobId: string; status: VideoStatus; unsupportedReason?: string }>(
      "/v1/ai/reel-video/regenerate",
      { method: "POST", body: { jobId: video.jobId } }
    );

    if (res.ok && res.data) {
      setVideo(prev => ({
        ...prev,
        jobId: res.data!.jobId,
        status: res.data!.status,
        progress: 10,
        unsupportedReason: res.data!.unsupportedReason ?? null,
      }));
    } else if (res.status === 403) {
      setError(res.error || "Not enough tokens to regenerate a video. Buy more to continue.");
      setVideo(prev => ({ ...prev, status: "failed", error: null, progress: 0 }));
    } else {
      setVideo(prev => ({ ...prev, status: "failed", error: res.error || "Regeneration failed." }));
    }
  };

  const handleDownloadVideo = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result?.title || "reel"}.mp4`;
    link.target = "_blank";
    link.click();
  };

  // ── Publishing ──────────────────────────────────────────────────────────────

  const handleSendToQueue = async () => {
    if (!result) return;
    if (!result.destinationUrl && !profile?.destinationUrl) {
      setError("Add a customer destination URL before sending to queue.");
      return;
    }
    ga.publishAttempt(platforms);
    setSendingToQueue(true);
    setPublishMsg("");

    const res = await apiFetch("/v1/dashboard/publishing", {
      method: "POST",
      body: {
        contentId: result.id,
        platforms,
        caption: result.caption,
        hashtags: result.hashtags,
        mediaUrl: result.imageUrl ?? undefined,
        videoUrl: video.videoUrl ?? undefined,
        destinationUrl: result.destinationUrl || profile?.destinationUrl || "",
      },
    });

    if (res.ok) {
      setPublishMsg("Added to publishing queue!");
      setTimeout(() => setPublishMsg(""), 4000);
    } else {
      setPublishMsg(res.error || "Failed to add to queue.");
    }
    setSendingToQueue(false);
  };

  const handlePostNow = async () => {
    if (!result) return;
    if (!result.destinationUrl && !profile?.destinationUrl) {
      setError("Add a customer destination URL before publishing.");
      return;
    }
    const readyPlatforms = platforms.filter(p => socialReady[p]);
    if (readyPlatforms.length === 0) {
      setError("No connected platforms selected. Connect social accounts in Admin → Integrations.");
      return;
    }
    ga.publishAttempt(readyPlatforms);
    setPublishingNow(true);
    setPublishResult(null);
    setPublishMsg("");

    const res = await apiFetch<{
      success: boolean; dry_run: boolean; partial?: boolean;
      results: Record<string, PlatformPublishResult>;
      summary: { total: number; succeeded: number; failed: number };
    }>("/social/publish", {
      method: "POST",
      body: {
        platforms: readyPlatforms,
        caption: result.caption,
        mediaUrl: result.imageUrl ?? undefined,
        videoUrl: video.videoUrl ?? undefined,
        link: result.destinationUrl || profile?.destinationUrl || "",
      },
    });

    if (res.ok && res.data) {
      setPublishResult(res.data.results);
      const { succeeded, failed } = res.data.summary;
      setPublishMsg(
        res.data.dry_run
          ? `Dry-run complete: ${succeeded} platform${succeeded !== 1 ? "s" : ""} simulated`
          : `Published to ${succeeded} platform${succeeded !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`
      );
    } else {
      setPublishMsg(res.error || "Publishing failed.");
    }
    setPublishingNow(false);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all";
  const inputStyle = { background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "#1A1A1A" };

  // ── Video status label/color helpers ────────────────────────────────────────

  const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
    idle: "", queued: "Video generation queued", generating: "Generating vertical reel…",
    rendering: "Rendering MP4…", completed: "Video ready!", failed: "Generation failed",
    unsupported: "Not available on this account",
  };

  if (profileLoading) return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={7} />
    </div>
  );

  const hasReelScript = !!result?.reelScript?.trim();
  const videoInProgress = video.status === "queued" || video.status === "generating" || video.status === "rendering";

  // Only show tabs relevant to the content type that was generated
  const visibleTabs = ((): Array<"caption" | "platforms" | "reel" | "image" | "video"> => {
    const t = generatedWithType;
    if (t === "caption")          return ["caption"];
    if (t === "image_post")       return ["image", "caption"];
    if (t === "full_social_post") return ["caption", "platforms", "image"];
    if (t === "ad_creative")      return ["caption", "image"];
    if (t === "campaign_pack")    return ["caption", "platforms", "reel", "image", "video"];
    if (t === "video")            return ["reel", "video", "caption"];
    return ["caption", "platforms", "reel", "image", ...(hasReelScript ? ["video" as const] : [])];
  })();

  const selectedReadyPlatforms = platforms.filter(p => socialReady[p]);
  const destinationUrl = result?.destinationUrl || profile?.destinationUrl || profile?.websiteUrl || "";

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>AI Content Studio</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Generate AI-powered marketing content for {profile?.businessName || "your business"}
          </p>
        </div>
        {profile && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(66,133,199,0.08)", color: "#1D4ED8" }}>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Publishing from: WorldDigital.ai socials
          </div>
        )}
      </div>

      {!profile && (
        <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: "white", border: "2px dashed rgba(193,58,42,0.3)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#C13A2A" }}>Business Profile Required</p>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Set up your business profile to start generating content.</p>
          <a href="/dashboard/business" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}>
            Set Up Business Profile →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN — config form ─────────────────────────────────────── */}
        <div className="space-y-5">
          {/* 1. Content type */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>1. CONTENT TYPE</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CONTENT_TYPES.map(({ value, label, d }) => (
                <button
                  key={value}
                  onClick={() => setContentType(value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: contentType === value ? "rgba(193,58,42,0.08)" : "rgba(0,0,0,0.02)",
                    border: `1.5px solid ${contentType === value ? "#C13A2A" : "rgba(0,0,0,0.08)"}`,
                    color: contentType === value ? "#C13A2A" : "#6B7280",
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                  </svg>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Platforms */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>2. PLATFORMS</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(({ value, label }) => {
                const on = platforms.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => togglePlatform(value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: on ? "rgba(193,58,42,0.1)" : "rgba(0,0,0,0.04)",
                      border: `1.5px solid ${on ? "#C13A2A" : "rgba(0,0,0,0.1)"}`,
                      color: on ? "#C13A2A" : "#6B7280",
                    }}
                  >
                    <PlatformIcon platform={value} size={16} rounded="rounded-sm" />
                    {on ? "✓ " : ""}{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Campaign details */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black" style={{ color: "#111827" }}>3. CAMPAIGN DETAILS</p>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Campaign Goal <span className="text-red-500">*</span></label>
              <input className={inputClass} style={inputStyle} placeholder="e.g. Drive orders to our new lunch menu" value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Offer / Product / Service <span className="text-red-500">*</span></label>
              <input className={inputClass} style={inputStyle} placeholder="e.g. Free delivery on orders over $25 this weekend" value={offer} onChange={e => setOffer(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Tone / Style</label>
                <select className={inputClass} style={inputStyle} value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Target Audience</label>
                <input className={inputClass} style={inputStyle} placeholder="Families, millennials…" value={audience} onChange={e => setAudience(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Extra Instructions</label>
              <textarea className={inputClass} style={inputStyle} rows={2} placeholder="Mention our loyalty program, avoid using the word 'cheap'..." value={extraInstructions} onChange={e => setExtraInstructions(e.target.value)} />
            </div>
          </div>

          {/* 4. Post type */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-black mb-3" style={{ color: "#111827" }}>4. POST TYPE</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: false, label: "Post Organically", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z", desc: "Free — post to followers" },
                { value: true,  label: "Run as Paid Ad",   icon: "M13 10V3L4 14h7v7l9-11h-7z", desc: "Reach new audiences" },
              ].map(({ value, label, icon, desc }) => (
                <button
                  key={String(value)}
                  onClick={() => { setIsAd(value); setError(null); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isAd === value ? (value ? "rgba(193,58,42,0.07)" : "rgba(66,133,199,0.07)") : "rgba(0,0,0,0.02)",
                    border: `1.5px solid ${isAd === value ? (value ? "#C13A2A" : "#4285C7") : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isAd === value ? (value ? "rgba(193,58,42,0.12)" : "rgba(66,133,199,0.12)") : "rgba(0,0,0,0.04)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                      style={{ color: isAd === value ? (value ? "#C13A2A" : "#4285C7") : "#9CA3AF" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isAd === value ? (value ? "#C13A2A" : "#1D4ED8") : "#374151" }}>{label}</p>
                    <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Ad settings */}
          {isAd && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(193,58,42,0.03)", border: "1.5px solid rgba(193,58,42,0.18)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs font-black" style={{ color: "#C13A2A" }}>5. AD CAMPAIGN SETTINGS</p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "#374151" }}>Ad Networks</label>
                <div className="flex flex-col gap-1.5">
                  {AD_PLATFORMS.map(({ value, label, icon }) => {
                    const on = adSettings.platforms.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleAdPlatform(value)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left"
                        style={{
                          background: on ? "white" : "rgba(0,0,0,0.02)",
                          border: `1.5px solid ${on ? "#C13A2A" : "rgba(0,0,0,0.08)"}`,
                          color: on ? "#C13A2A" : "#6B7280",
                        }}
                      >
                        <img src={icon} alt={label} width={18} height={18} style={{ objectFit: "contain", borderRadius: 3, flexShrink: 0 }} />
                        <span className="flex-1">{label}</span>
                        {on && <span className="text-green-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Daily Budget (USD) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#94A3B8" }}>$</span>
                    <input type="number" min={adSettings.platforms.includes("youtube") ? 50 : 10} step={1} className={inputClass} style={{ ...inputStyle, paddingLeft: "1.5rem" }}
                      placeholder={adSettings.platforms.includes("youtube") ? "50" : "10"} value={adSettings.budget || ""}
                      onChange={e => setAdSettings(prev => ({ ...prev, budget: Number(e.target.value) }))} />
                  </div>
                  {adSettings.platforms.includes("youtube") && (
                    <p className="text-[10px] mt-1" style={{ color: "#D97706" }}>YouTube minimum: $50/day</p>
                  )}
                  {!adSettings.platforms.includes("youtube") && (
                    <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Minimum: $10/day</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Duration (days)</label>
                  <select className={inputClass} style={inputStyle} value={adSettings.durationDays}
                    onChange={e => setAdSettings(prev => ({ ...prev, durationDays: Number(e.target.value) }))}>
                    {[1,3,7,14,30].map(d => <option key={d} value={d}>{d} {d === 1 ? "day" : "days"}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Targeting</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] mb-1" style={{ color: "#94A3B8" }}>Minimum Age</label>
                    <input type="number" min={13} max={65} className={inputClass} style={inputStyle}
                      value={adSettings.ageMin} onChange={e => setAdSettings(prev => ({ ...prev, ageMin: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] mb-1" style={{ color: "#94A3B8" }}>Gender</label>
                    <select className={inputClass} style={inputStyle} value={adSettings.gender}
                      onChange={e => setAdSettings(prev => ({ ...prev, gender: e.target.value as AdGender }))}>
                      <option value="all">All genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] mb-1" style={{ color: "#94A3B8" }}>Location</label>
                    <input className={inputClass} style={inputStyle} placeholder="City, State or Country"
                      value={adSettings.location} onChange={e => setAdSettings(prev => ({ ...prev, location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] mb-1" style={{ color: "#94A3B8" }}>Radius (miles)</label>
                    <select className={inputClass} style={inputStyle} value={adSettings.radiusMiles}
                      onChange={e => setAdSettings(prev => ({ ...prev, radiusMiles: Number(e.target.value) }))}>
                      {[1,2,5,10,25,50].map(r => <option key={r} value={r}>{r} miles</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(193,58,42,0.06)", color: "#C13A2A" }}>
                <span className="font-bold">Ad Targeting: </span>
                {adSettings.ageMin}+ · {adSettings.gender === "all" ? "All genders" : adSettings.gender} · {adSettings.radiusMiles}mi · Broad ·{" "}
                ${adSettings.budget}/day · {adSettings.durationDays}d · Total ≈ ${adSettings.budget * adSettings.durationDays}
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !profile}
            className="w-full py-4 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)", boxShadow: "0 8px 24px rgba(193,58,42,0.28)" }}
          >
            {generating ? (
              <><Spinner size={4} color="white" /> Generating with AI…</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT COLUMN — preview / results ──────────────────────────────── */}
        <div>
          {!result && !generating && (
            <div className="rounded-2xl h-full min-h-64 flex flex-col items-center justify-center p-8 text-center" style={{ background: "white", border: "2px dashed rgba(0,0,0,0.1)" }}>
              <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Your generated content will appear here</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Fill in the form and click Generate</p>
            </div>
          )}

          {generating && (
            <div className="rounded-2xl h-full min-h-64 flex flex-col items-center justify-center p-8 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              <Spinner size={8} />
              <p className="text-sm font-semibold mt-3" style={{ color: "#111827" }}>AI is generating your content…</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>This usually takes 5–15 seconds</p>
            </div>
          )}

          {result && (
            <div className="rounded-2xl overflow-hidden space-y-0" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
              {/* Header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#111827" }}>{result.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                      Promoting: {profile?.businessName} → {result.destinationUrl || profile?.destinationUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAd && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(193,58,42,0.1)", color: "#C13A2A" }}>
                        ⚡ Paid Ad
                      </span>
                    )}
                    {!result.aiAvailable && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
                        AI not connected — sample content
                      </span>
                    )}
                  </div>
                </div>

                {isAd && (
                  <div className="mt-3 p-3 rounded-xl space-y-1" style={{ background: "rgba(193,58,42,0.04)", border: "1px solid rgba(193,58,42,0.14)" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#C13A2A" }}>Campaign Preview</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        ["Networks", adSettings.platforms.map(p => p === "meta" ? "Meta (FB+IG)" : p.charAt(0).toUpperCase() + p.slice(1)).join(", ")],
                        ["Targeting", `${adSettings.ageMin}+ · ${adSettings.gender === "all" ? "All" : adSettings.gender} · Broad`],
                        ["Location", `${adSettings.location || "United States"} (${adSettings.radiusMiles}mi)`],
                        ["Budget", `$${adSettings.budget}/day × ${adSettings.durationDays}d = $${adSettings.budget * adSettings.durationDays} total`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-1 text-[10px]">
                          <span style={{ color: "#9CA3AF" }}>{k}:</span>
                          <span className="font-semibold" style={{ color: "#374151" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tab bar */}
              <div className="flex border-b overflow-x-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {visibleTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className="flex-shrink-0 flex-1 py-2.5 text-[11px] font-semibold capitalize transition-all relative"
                    style={{
                      borderBottom: activeTab === tab ? "2px solid #C13A2A" : "2px solid transparent",
                      color: activeTab === tab ? "#C13A2A" : "#6B7280",
                      minWidth: 64,
                    }}
                  >
                    {tab === "caption" ? "Captions" : tab === "platforms" ? "By Platform" : tab === "reel" ? "Reel Script" : tab === "image" ? "Image" : "Video"}
                    {tab === "image" && result.imageUrl && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-middle" />
                    )}
                    {tab === "video" && video.status === "completed" && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-middle" />
                    )}
                    {tab === "video" && videoInProgress && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block align-middle" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">

                {/* ── Caption tab ── */}
                {activeTab === "caption" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Main Caption</p>
                          <p className="text-[9px] mt-0.5" style={{ color: "#C3C9D4" }}>Edit before saving — only captions can be changed here</p>
                        </div>
                        <button onClick={() => copyToClipboard(editedCaption, "caption")} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === "caption" ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === "caption" ? "#16A34A" : "#6B7280" }}>
                          {copied === "caption" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <textarea
                        value={editedCaption}
                        onChange={e => setEditedCaption(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                        style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.1)", color: "#374151", lineHeight: "1.6" }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Short Caption</p>
                        <button onClick={() => copyToClipboard(result.shortCaption, "shortCaption")} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === "shortCaption" ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === "shortCaption" ? "#16A34A" : "#6B7280" }}>
                          {copied === "shortCaption" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-sm p-3 rounded-xl" style={{ background: "#F8FBFE", color: "#374151" }}>{result.shortCaption}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Hashtags</p>
                        <button onClick={() => copyToClipboard(result.hashtags.join(" "), "hashtags")} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === "hashtags" ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === "hashtags" ? "#16A34A" : "#6B7280" }}>
                          {copied === "hashtags" ? "✓ Copied" : "Copy all"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtags.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(66,133,199,0.1)", color: "#1D4ED8" }}>{h}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(193,58,42,0.05)", border: "1px solid rgba(193,58,42,0.15)" }}>
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: "#C13A2A" }}>CTA: {result.cta}</p>
                        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>→ {result.destinationUrl}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Best Posting Time</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{result.suggestedPostingTime}</p>
                    </div>
                  </>
                )}

                {/* ── Platforms tab ── */}
                {activeTab === "platforms" && (
                  <div className="space-y-3">
                    {Object.entries(result.platformVersions).map(([platform, text]) => (
                      <div key={platform}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{platform.replace("_", " ")}</p>
                          <button onClick={() => copyToClipboard(text, `platform_${platform}`)} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === `platform_${platform}` ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === `platform_${platform}` ? "#16A34A" : "#6B7280" }}>
                            {copied === `platform_${platform}` ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed p-3 rounded-xl whitespace-pre-wrap" style={{ background: "#F8FBFE", color: "#374151" }}>{text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Reel Script tab ── */}
                {activeTab === "reel" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Reel Script</p>
                        <button onClick={() => copyToClipboard(result.reelScript, "reelScript")} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === "reelScript" ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === "reelScript" ? "#16A34A" : "#6B7280" }}>
                          {copied === "reelScript" ? "✓ Copied" : "Copy Script"}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed p-3 rounded-xl whitespace-pre-wrap" style={{ background: "#F8FBFE", color: "#374151" }}>{result.reelScript}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>Shot List</p>
                      <ol className="space-y-1.5">
                        {result.shotList.map((shot, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#374151" }}>
                            <span className="font-bold shrink-0" style={{ color: "#C13A2A" }}>{i + 1}.</span>
                            {shot}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Reel metadata */}
                    <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.12)" }}>
                      {[
                        ["Estimated Duration", "8 seconds"],
                        ["Format", "Vertical 9:16"],
                        ["Target Platforms", "TikTok, Meta Reels, Snapchat"],
                        ["CTA Link", result.destinationUrl || profile?.destinationUrl || "—"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-[10px]">
                          <span className="font-bold flex-shrink-0" style={{ color: "#4285C7" }}>{k}:</span>
                          <span style={{ color: "#374151" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Proceed to Video Generation */}
                    {video.status === "idle" && !videoStarting && (
                      <div className="rounded-xl p-4 text-center space-y-3" style={{ background: "rgba(0,0,0,0.02)", border: "1.5px dashed rgba(0,0,0,0.12)" }}>
                        <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center" style={{ background: "rgba(193,58,42,0.08)" }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: "#111827" }}>Ready to generate video from this reel script</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Uses 200 tokens · 8 seconds · 9:16 vertical · MP4</p>
                        </div>
                        <button
                          onClick={handleStartVideoGeneration}
                          disabled={videoStarting}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg, #C13A2A, #4285C7)" }}
                        >
                          Proceed to Video Generation
                        </button>
                      </div>
                    )}

                    {(videoStarting || videoInProgress) && (
                      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.15)" }}>
                        <Spinner size={5} color="#4285C7" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: "#1D4ED8" }}>
                            {VIDEO_STATUS_LABELS[video.status] || "Processing…"}
                          </p>
                          {video.progress > 0 && (
                            <div className="mt-1.5">
                              <ProgressBar value={video.progress} />
                            </div>
                          )}
                        </div>
                        <button onClick={() => setActiveTab("video")} className="text-[10px] font-bold flex-shrink-0" style={{ color: "#4285C7" }}>
                          View →
                        </button>
                      </div>
                    )}

                    {video.status === "completed" && (
                      <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.12)" }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold flex-1" style={{ color: "#15803D" }}>Video generated!</p>
                        <button onClick={() => setActiveTab("video")} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: "#16A34A", color: "white" }}>
                          View Video
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── Image tab ── */}
                {activeTab === "image" && (
                  <div className="space-y-4">
                    {result.imageUrl && !imageGenerating && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Generated Image</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Generated by WorldDigital.ai</span>
                        </div>
                        <img src={result.imageUrl} alt="AI generated marketing image" className="w-full rounded-xl object-contain" style={{ maxHeight: 360, background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.08)" }} />
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleDownloadImage(result.imageUrl!, `${result.title || "image"}.png`)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80" style={{ background: "#16A34A", color: "white" }}>
                            Download PNG
                          </button>
                          <button onClick={() => void handleGenerateImage(true)} disabled={imageGenerating}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7", border: "1px solid rgba(66,133,199,0.2)" }}>
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}

                    {imageGenerating && (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#E2E8F0" }} viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
                          </svg>
                          <svg className="absolute inset-0 w-16 h-16 animate-spin" style={{ color: "#4285C7", animationDuration: "1.2s" }} viewBox="0 0 64 64" fill="none">
                            <path d="M32 4a28 28 0 0128 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>{imageLoadingMsg}</p>
                          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>AI image generation · typically 20–60 seconds</p>
                        </div>
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#4285C7", animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {imageError && !imageGenerating && (
                      <div className="p-4 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <p className="text-sm font-semibold mb-3" style={{ color: "#DC2626" }}>{imageError}</p>
                        <a href="/dashboard/tokens" className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#4285C7" }}>Buy More Tokens</a>
                      </div>
                    )}

                    {!result.imageUrl && !imageGenerating && !imageError && (
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>Generate your image</p>
                          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Generated with gpt-image-1 · takes 15–45 seconds</p>
                        </div>
                        <button onClick={() => void handleGenerateImage(false)} disabled={imageGenerating}
                          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #4285C7, #C13A2A)" }}>
                          Generate Image
                        </button>
                      </div>
                    )}

                    <details className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                      <summary className="px-3 py-2 text-[10px] font-bold cursor-pointer" style={{ color: "#9CA3AF", background: "#F8FBFE" }}>
                        Prompt used ▸
                      </summary>
                      <div className="px-3 pb-3 pt-2">
                        <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{result.imagePrompt}</p>
                        <button onClick={() => copyToClipboard(result.imagePrompt, "imagePrompt")} className="text-[10px] mt-2 px-2 py-0.5 rounded-lg font-semibold transition-all" style={{ background: copied === "imagePrompt" ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)", color: copied === "imagePrompt" ? "#16A34A" : "#6B7280" }}>
                          {copied === "imagePrompt" ? "✓ Copied" : "Copy Prompt"}
                        </button>
                      </div>
                    </details>
                  </div>
                )}

                {/* ── Video tab ── */}
                {activeTab === "video" && (
                  <div className="space-y-4">
                    {/* Queued / Generating / Rendering */}
                    {(video.status === "queued" || video.status === "generating" || video.status === "rendering") && (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <Spinner size={10} color="#4285C7" />
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>{VIDEO_STATUS_LABELS[video.status]}</p>
                          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>This can take 2–10 minutes. You can navigate away — polling continues automatically.</p>
                        </div>
                        {video.progress > 0 && (
                          <div className="w-full max-w-xs">
                            <ProgressBar value={video.progress} color="#4285C7" />
                            <p className="text-[10px] text-center mt-1" style={{ color: "#9CA3AF" }}>{video.progress}%</p>
                          </div>
                        )}
                        <div className="rounded-xl p-3 w-full text-left space-y-1" style={{ background: "rgba(66,133,199,0.05)", border: "1px solid rgba(66,133,199,0.12)" }}>
                          <p className="text-[10px] font-bold" style={{ color: "#4285C7" }}>Generation details</p>
                          <div className="text-[10px] space-y-0.5" style={{ color: "#6B7280" }}>
                            <p>Format: Vertical 9:16 · 8 seconds · MP4</p>
                            <p>Platform: TikTok, Meta Reels, Snapchat</p>
                            <p>Based on: Your approved reel script + shot list</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completed */}
                    {video.status === "completed" && video.videoUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Generated Video</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Runway Gen-4</span>
                        </div>
                        <video
                          ref={videoElemRef}
                          src={video.videoUrl}
                          controls
                          playsInline
                          className="w-full rounded-xl"
                          style={{ maxHeight: 400, background: "#000", border: "1px solid rgba(0,0,0,0.08)" }}
                          poster={video.thumbnailUrl ?? undefined}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => handleDownloadVideo(video.videoUrl!)}
                            className="py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                            style={{ background: "#16A34A" }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download MP4
                          </button>
                          <button
                            onClick={() => setShowSaveModal(true)}
                            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                            style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7", border: "1px solid rgba(66,133,199,0.2)" }}
                          >
                            Save to Library
                          </button>
                          <button
                            onClick={handleSendToQueue}
                            disabled={sendingToQueue}
                            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                            style={{ background: "rgba(193,58,42,0.08)", color: "#C13A2A", border: "1px solid rgba(193,58,42,0.2)" }}
                          >
                            {sendingToQueue ? <Spinner size={3.5} color="#C13A2A" /> : null}
                            Send to Queue
                          </button>
                          <button
                            onClick={handleRegenerateVideo}
                            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                            style={{ background: "rgba(0,0,0,0.04)", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)" }}
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completed but no URL */}
                    {video.status === "completed" && !video.videoUrl && (
                      <div className="p-4 rounded-xl text-center" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: "#D97706" }}>Video completed but URL unavailable</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>The video was generated but the URL was not returned. Check your Runway dashboard.</p>
                      </div>
                    )}

                    {/* Failed */}
                    {video.status === "failed" && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                          <p className="text-sm font-bold mb-1" style={{ color: "#B91C1C" }}>Video generation failed</p>
                          <p className="text-xs" style={{ color: "#7F1D1D" }}>{video.error || "An unexpected error occurred."}</p>
                        </div>
                        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Your reel script and shot list are saved. Credits were not deducted.</p>
                        <button onClick={handleRegenerateVideo} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#C13A2A" }}>
                          Retry Video Generation
                        </button>
                      </div>
                    )}

                    {/* Unsupported */}
                    {video.status === "unsupported" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1.5px solid rgba(245,158,11,0.25)" }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(245,158,11,0.12)" }}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: "#92400E" }}>Video generation not enabled on this account</p>
                              <p className="text-xs mt-1" style={{ color: "#78350F" }}>{video.unsupportedReason || "Set RUNWAY_API_KEY in your environment secrets to enable Runway Gen-4 video generation."}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold" style={{ color: "#374151" }}>What you can do instead:</p>
                          <div className="space-y-2">
                            {[
                              { icon: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2", label: "Copy reel script to produce manually", action: () => copyToClipboard(result?.reelScript || "", "reelScript_unsupported"), actionLabel: copied === "reelScript_unsupported" ? "✓ Copied" : "Copy Script" },
                              { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", label: "Export shot list as reference", action: () => copyToClipboard((result?.shotList || []).map((s, i) => `${i+1}. ${s}`).join("\n"), "shotList_export"), actionLabel: copied === "shotList_export" ? "✓ Copied" : "Export Shots" },
                              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Save script to content library", action: handleApprove, actionLabel: "Save Script" },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                  </svg>
                                  <p className="text-xs" style={{ color: "#374151" }}>{item.label}</p>
                                </div>
                                <button onClick={item.action} className="text-[10px] font-bold px-3 py-1 rounded-lg flex-shrink-0" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
                                  {item.actionLabel}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.12)" }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: "#4285C7" }}>Video Generation Coming Soon</p>
                          <p className="text-[10px]" style={{ color: "#6B7280" }}>
                            AI video generation is being rolled out. Check back soon or contact support to get early access.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Idle — before starting */}
                    {video.status === "idle" && (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(193,58,42,0.06)" }}>
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>Ready to generate video</p>
                          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Generate a vertical 9:16 reel from your script · 8 sec · MP4</p>
                        </div>
                        <button
                          onClick={handleStartVideoGeneration}
                          disabled={videoStarting}
                          className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          style={{ background: "linear-gradient(135deg, #C13A2A, #4285C7)" }}
                        >
                          {videoStarting ? <Spinner size={4} color="white" /> : null}
                          Proceed to Video Generation
                        </button>
                        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>200 tokens · Deducted when generation starts</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Post Preview + Publishing ─────────────────────────────────── */}
              <div className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="px-5 py-4 space-y-4">

                  {/* Video + Voiceover preview card (shows when video is ready) */}
                  {video.status === "completed" && video.videoUrl && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(193,58,42,0.2)" }}>
                      <div className="px-3 py-2" style={{ background: "rgba(193,58,42,0.05)" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#C13A2A" }}>Final Video Preview</p>
                      </div>
                      <video
                        src={video.videoUrl}
                        controls
                        playsInline
                        className="w-full"
                        style={{ maxHeight: 220, background: "#000" }}
                        poster={video.thumbnailUrl ?? undefined}
                      />
                    </div>
                  )}

                  {/* Publishing banner */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.12)" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#4285C7" }}>Final Post Preview</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        ["Publishing from", "WorldDigital.ai socials"],
                        ["Promoting", profile?.businessName || "—"],
                        ["CTA link", destinationUrl || "Not set — add Destination URL to Business Profile"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-2 text-[10px]">
                          <span className="font-bold flex-shrink-0" style={{ color: "#6B7280" }}>{k}:</span>
                          <span className="font-semibold truncate" style={{ color: destinationUrl || k !== "CTA link" ? "#111827" : "#DC2626" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {!destinationUrl && (
                      <a href="/dashboard/business" className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(193,58,42,0.08)", color: "#C13A2A" }}>
                        + Complete Business Profile
                      </a>
                    )}
                  </div>


                  {/* Status messages */}
                  {savedMsg && (
                    <div className="px-3 py-2 rounded-xl text-xs font-medium text-green-800 bg-green-50 border border-green-200">{savedMsg}</div>
                  )}
                  {publishMsg && (
                    <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{
                      background: publishMsg.toLowerCase().includes("fail") ? "#FEF2F2" : "#F0FDF4",
                      border: `1px solid ${publishMsg.toLowerCase().includes("fail") ? "#FCA5A5" : "#BBF7D0"}`,
                      color: publishMsg.toLowerCase().includes("fail") ? "#B91C1C" : "#166534",
                    }}>{publishMsg}</div>
                  )}

                  {/* Publish results breakdown */}
                  {publishResult && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                      <div className="px-3 py-2" style={{ background: "rgba(0,0,0,0.02)" }}>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#374151" }}>Publish Results</p>
                      </div>
                      {Object.entries(publishResult).map(([platform, r]) => (
                        <div key={platform} className="flex items-start justify-between gap-2 px-3 py-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <PlatformIcon platform={platform} size={14} rounded="rounded-sm" />
                            <span className="text-xs font-semibold capitalize" style={{ color: "#374151" }}>{platform}</span>
                            {r.dryRun && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>(simulated)</span>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {r.success ? (
                              <span className="text-[10px] font-bold" style={{ color: "#16A34A" }}>
                                {r.postUrl ? <a href={r.postUrl} target="_blank" rel="noopener noreferrer" className="underline">View Post</a> : "Published"}
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: "#DC2626" }}>{r.error?.slice(0, 60)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ad launch result */}
                  {adResult && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(193,58,42,0.2)" }}>
                      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "rgba(193,58,42,0.06)" }}>
                        <p className="text-xs font-black" style={{ color: "#C13A2A" }}>
                          {adResult.dry_run ? "🧪 Dry Run Complete" : "⚡ Ad Campaign Launched"}
                        </p>
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                          {adResult.summary.launched}/{adResult.summary.total} platforms
                        </span>
                      </div>
                      <div className="divide-y divide-black/[0.05]">
                        {adResult.results.map((r) => {
                          const s = AD_STATUS_STYLE[r.status] ?? AD_STATUS_STYLE.draft;
                          return (
                            <div key={r.platform} className="px-4 py-2 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-semibold capitalize" style={{ color: "#374151" }}>{r.platform}</span>
                                {r.dryRun && <span className="ml-1 text-[10px]" style={{ color: "#9CA3AF" }}>(simulated)</span>}
                                {(r.message || r.error) && (
                                  <p className="text-[10px] mt-0.5 truncate" style={{ color: r.error && !r.dryRun ? "#DC2626" : "#9CA3AF" }}>
                                    {r.error && !r.dryRun ? r.error : r.message}
                                  </p>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {isAd ? (
                      <button
                        onClick={handleLaunchAd}
                        disabled={adLaunching}
                        className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #C13A2A, #7C3AED)", boxShadow: "0 6px 20px rgba(193,58,42,0.28)" }}
                      >
                        {adLaunching ? <><Spinner size={4} color="white" /> Launching…</> : <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Launch Ad Campaign
                        </>}
                      </button>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShowSaveModal(true)}
                            className="py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save to Library
                          </button>

                          <button
                            onClick={handleSendToQueue}
                            disabled={sendingToQueue || !destinationUrl}
                            title={!destinationUrl ? "Add destination URL to Business Profile first" : "Send to publishing queue"}
                            className="py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: sendingToQueue || !destinationUrl ? "rgba(0,0,0,0.12)" : "linear-gradient(135deg, #C13A2A, #9B2C2C)", boxShadow: !destinationUrl ? "none" : "0 4px 14px rgba(193,58,42,0.28)", color: sendingToQueue || !destinationUrl ? "#9CA3AF" : "white" }}
                          >
                            {sendingToQueue ? <Spinner size={3.5} color="white" /> : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                            Send to Queue
                          </button>
                        </div>

                        <button
                          onClick={handlePostNow}
                          disabled={publishingNow || selectedReadyPlatforms.length === 0 || !destinationUrl}
                          title={
                            !destinationUrl ? "Add destination URL first" :
                            selectedReadyPlatforms.length === 0 ? "No connected platforms selected" :
                            `Post now to: ${selectedReadyPlatforms.join(", ")}`
                          }
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                          style={{
                            background: selectedReadyPlatforms.length > 0 && destinationUrl ? "linear-gradient(135deg, #4285C7, #2563EB)" : "rgba(0,0,0,0.06)",
                            color: selectedReadyPlatforms.length > 0 && destinationUrl ? "white" : "#9CA3AF",
                            boxShadow: selectedReadyPlatforms.length > 0 && destinationUrl ? "0 4px 14px rgba(66,133,199,0.3)" : "none",
                          }}
                        >
                          {publishingNow ? <Spinner size={3.5} color="white" /> : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Publish Now
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.1)", color: "#374151" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate Content
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Save to Library Modal ──────────────────────────────────────────── */}
      {showSaveModal && result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

            {/* Modal header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
              <div>
                <p className="text-base font-black" style={{ color: "#111827" }}>Save to Library</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Review what you're saving</p>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all" style={{ color: "#9CA3AF" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto">

              {/* Title */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Title</p>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>{result.title}</p>
              </div>

              {/* Goal + Offer row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campaignGoal && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Goal</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{campaignGoal}</p>
                  </div>
                )}
                {offer && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Offer / Product</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{offer}</p>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Date Created</p>
                <p className="text-xs" style={{ color: "#374151" }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>

              {/* Media preview — image takes priority over video */}
              {result.imageUrl && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Generated Image</p>
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full rounded-xl object-contain"
                    style={{ maxHeight: 220, background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.07)" }}
                  />
                </div>
              )}
              {!result.imageUrl && video.status === "completed" && video.videoUrl && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Generated Video</p>
                  <video
                    src={video.videoUrl}
                    controls
                    playsInline
                    className="w-full rounded-xl"
                    style={{ maxHeight: 200, background: "#000", border: "1px solid rgba(0,0,0,0.07)" }}
                    poster={video.thumbnailUrl ?? undefined}
                  />
                </div>
              )}

              {/* Editable caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Caption</p>
                  <p className="text-[9px]" style={{ color: "#C3C9D4" }}>You can edit this before saving</p>
                </div>
                <textarea
                  value={editedCaption}
                  onChange={e => setEditedCaption(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  style={{ background: "#F8FBFE", border: "1px solid rgba(0,0,0,0.1)", color: "#374151", lineHeight: "1.6" }}
                />
              </div>

              {/* Platforms */}
              {platforms.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#9CA3AF" }}>Platforms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {platforms.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold" style={{ background: "rgba(66,133,199,0.08)", color: "#1D4ED8" }}>
                        {p.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-gray-50 transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#6B7280" }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: "#16A34A" }}
              >
                {approving ? (
                  <><Spinner size={4} color="white" /> Saving…</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
