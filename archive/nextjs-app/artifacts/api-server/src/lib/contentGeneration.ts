import { callAI, isAIReady } from "./ai.js";
import { logger } from "./logger.js";

export interface BusinessProfileInput {
  businessName: string;
  websiteUrl?: string;
  destinationUrl?: string;
  category?: string;
  description?: string;
  targetAudience?: string;
  location?: string;
  mainOffer?: string;
  brandTone?: string;
}

export interface ContentGenerationInput {
  contentType: string;
  platforms: string[];
  campaignGoal: string;
  offer: string;
  tone: string;
  audience: string;
  extraInstructions?: string;
  businessProfile: BusinessProfileInput;
}

export interface GeneratedContent {
  title: string;
  caption: string;
  shortCaption: string;
  longCaption: string;
  hashtags: string[];
  cta: string;
  destinationUrl: string;
  imagePrompt: string;
  reelScript: string;
  shotList: string[];
  platformVersions: Record<string, string>;
  suggestedPostingTime: string;
}

function businessContext(input: ContentGenerationInput): string {
  const bp = input.businessProfile;
  const dest = bp.destinationUrl || bp.websiteUrl || "";
  return `BUSINESS:
- Name: ${bp.businessName}
- Industry: ${bp.category || "General Business"}
- About: ${bp.description || ""}
- Location: ${bp.location || ""}
- Main Offer: ${bp.mainOffer || ""}
- Target Audience: ${bp.targetAudience || input.audience}
- Brand Tone: ${bp.brandTone || input.tone}
- Website: ${dest}

CAMPAIGN:
- Goal: ${input.campaignGoal}
- Promoting: ${input.offer}
- Tone: ${input.tone}
- Target Audience: ${input.audience}${input.extraInstructions ? `\n- Creative Direction: ${input.extraInstructions}` : ""}`;
}

function creativityNote(input: ContentGenerationInput): string {
  const bp = input.businessProfile;
  const dest = bp.destinationUrl || bp.websiteUrl || "";
  return `Be highly creative and specific to this business and campaign. Content should feel authentic, platform-native, and directly tied to the campaign goal ("${input.campaignGoal}") and the offer ("${input.offer}"). Reference real details about ${bp.businessName} — not generic filler. The CTA link MUST be: ${dest || "the business website"}. All content promotes ${bp.businessName}, not WorldDigital.ai.`;
}

function emptyFields(dest: string): Omit<GeneratedContent, "title" | "caption" | "shortCaption" | "longCaption" | "hashtags" | "cta" | "destinationUrl" | "suggestedPostingTime"> {
  return { imagePrompt: "", reelScript: "", shotList: [], platformVersions: {} };
}

function buildPrompt(input: ContentGenerationInput): string {
  const bp = input.businessProfile;
  const dest = bp.destinationUrl || bp.websiteUrl || "";
  const ctx = businessContext(input);
  const creative = creativityNote(input);

  switch (input.contentType) {
    case "caption":
      return `You are a premium social media copywriter. Your only job is writing compelling captions.

${ctx}

${creative}

Generate ONLY caption content. Respond with valid JSON:
{
  "title": "short internal title",
  "caption": "main caption (150–250 chars) — lead with the campaign goal, make it compelling and specific to this business",
  "shortCaption": "punchy short version (40–70 chars) — great for stories or TikTok",
  "longCaption": "detailed storytelling version (300–500 chars) — ideal for Facebook/LinkedIn, mention the goal and what makes this business stand out",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Call to action (e.g. Book Now, Order Today, Visit Us)",
  "destinationUrl": "${dest}",
  "imagePrompt": "",
  "reelScript": "",
  "shotList": [],
  "platformVersions": {},
  "suggestedPostingTime": "Best posting time for this type of business"
}`;

    case "image_post":
      return `You are a premium visual content director for social media.

${ctx}

${creative}

Generate ONLY image-focused content — a great image concept and supporting caption. Respond with valid JSON:
{
  "title": "short internal title",
  "caption": "caption to accompany the image (120–200 chars) — compelling, specific to the campaign goal",
  "shortCaption": "short caption (40–70 chars)",
  "longCaption": "longer version (200–350 chars) with more context about the offer",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Call to action text",
  "destinationUrl": "${dest}",
  "imagePrompt": "Detailed, vivid DALL-E image generation prompt: describe composition, lighting, mood, colors, and key visual elements that represent ${bp.businessName}'s ${input.offer}. Include the business category and campaign goal. Be specific — not generic stock photo language.",
  "reelScript": "",
  "shotList": [],
  "platformVersions": {},
  "suggestedPostingTime": "Best posting time for this type of business"
}`;

    case "full_social_post":
      return `You are a premium social media strategist creating a full multi-platform post package.

${ctx}

${creative}

Generate a complete social post package across platforms. Respond with valid JSON:
{
  "title": "short internal title",
  "caption": "main caption (150–250 chars) — hook + campaign goal + CTA",
  "shortCaption": "punchy version (40–70 chars)",
  "longCaption": "detailed LinkedIn/Facebook version (300–500 chars) — tell a story, mention what makes this business special",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Call to action text",
  "destinationUrl": "${dest}",
  "imagePrompt": "Vivid image prompt for DALL-E capturing the essence of this campaign for ${bp.businessName}",
  "reelScript": "",
  "shotList": [],
  "platformVersions": {
    "facebook": "Facebook post — conversational, 2–3 sentences, include the goal and offer with a link",
    "tiktok": "TikTok caption — trendy hook, punchy, use relevant trending style for this category",
    "snapchat": "Snapchat caption — short, fun, direct, emoji-friendly"
  },
  "suggestedPostingTime": "Best posting time for this business type and goal"
}`;

    case "ad_creative":
      return `You are a performance marketing copywriter specializing in paid social ads.

${ctx}

${creative}

Generate high-converting ad creative copy. Ads must be attention-grabbing in the first 3 words, benefit-led, and have a strong CTA. Respond with valid JSON:
{
  "title": "short internal title",
  "caption": "Primary ad copy (100–180 chars) — hook in first 3 words, lead with the biggest benefit from '${input.offer}', end with CTA",
  "shortCaption": "Short ad variant (40–65 chars) — punchy benefit statement",
  "longCaption": "Long-form ad copy (250–400 chars) — problem → solution → proof → CTA structure. Specific to ${bp.businessName}'s offer",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "cta": "Ad CTA button text (e.g. Shop Now, Get Offer, Book Free Consult)",
  "destinationUrl": "${dest}",
  "imagePrompt": "High-converting ad visual prompt: clean composition, bold focal point showcasing '${input.offer}', professional quality, ${bp.brandTone || input.tone} tone, suitable for ${input.platforms.join('/')} paid ads",
  "reelScript": "",
  "shotList": [],
  "platformVersions": {
    "facebook": "Facebook ad primary text — benefit-led, problem/solution format, includes social proof angle",
    "tiktok": "TikTok ad hook + copy — native-feeling, starts with a question or bold statement",
    "snapchat": "Snapchat ad copy — short, direct, high energy"
  },
  "suggestedPostingTime": "Best time to run ads for this business category"
}`;

    case "campaign_pack":
      return `You are a senior marketing strategist creating a full campaign content pack.

${ctx}

${creative}

Generate a complete campaign pack with everything needed to run this campaign. Respond with valid JSON:
{
  "title": "campaign title — specific to the goal",
  "caption": "primary campaign caption (150–250 chars)",
  "shortCaption": "short version (40–70 chars)",
  "longCaption": "long-form version (350–500 chars) — deep dive into the offer and why it matters to the audience",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Campaign CTA text",
  "destinationUrl": "${dest}",
  "imagePrompt": "Detailed campaign visual prompt — describes the hero image concept for this campaign",
  "reelScript": "Complete short video script with scene-by-scene breakdown: [Scene 1] opening hook relevant to the goal, [Scene 2] show the offer/product, [Scene 3] customer reaction or social proof angle, [CTA] visit ${dest}",
  "shotList": ["Opening shot description", "Product/service shot", "Lifestyle or testimonial shot", "CTA screen with URL"],
  "platformVersions": {
    "facebook": "Facebook post copy",
    "tiktok": "TikTok caption with hook",
    "snapchat": "Snapchat story copy"
  },
  "suggestedPostingTime": "Campaign launch time recommendation with rationale"
}`;

    case "video":
    default:
      return `You are a short-form video director and script writer.

${ctx}

${creative}

Generate a compelling short video script and shot list optimized for vertical 9:16 format (TikTok, Reels, Snapchat). Respond with valid JSON:
{
  "title": "video title — specific to the campaign",
  "caption": "video caption/description (100–180 chars) to post alongside the video",
  "shortCaption": "ultra short version (30–60 chars)",
  "longCaption": "full video description for YouTube/Facebook (150–300 chars)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "Video CTA text",
  "destinationUrl": "${dest}",
  "imagePrompt": "",
  "reelScript": "Scene-by-scene vertical video script: [Hook - 0-2s] Attention-grabbing opening tied to '${input.campaignGoal}', [Scene 2 - 2-4s] Show '${input.offer}' visually, [Scene 3 - 4-6s] Benefit or social proof moment, [CTA - 6-8s] Strong call to action with ${dest}",
  "shotList": ["Hook shot: ${bp.businessName} — opening visual that grabs attention", "Product/service showcase: ${input.offer} in action", "Customer reaction or lifestyle moment", "CTA screen with URL: ${dest}"],
  "platformVersions": {},
  "suggestedPostingTime": "Best posting time for short-form video for this business type"
}`;
  }
}

function fallbackContent(input: ContentGenerationInput): GeneratedContent {
  const bp = input.businessProfile;
  const dest = bp.destinationUrl || bp.websiteUrl || "";
  const name = bp.businessName;

  return {
    title: `${name} — ${input.contentType}`,
    caption: `${input.campaignGoal} — ${name} offers ${input.offer}. Visit us today!`,
    shortCaption: `${name} — ${input.offer}`,
    longCaption: `${name} is here to help with ${input.offer}. ${input.campaignGoal}. ${bp.description || ""} Don't wait — visit us now!`,
    hashtags: [`#${name.replace(/\s/g, "")}`, `#${bp.category?.replace(/\s/g, "") || "Business"}`, "#Marketing", "#LocalBusiness", "#AI"],
    cta: "Learn More",
    destinationUrl: dest,
    imagePrompt: input.contentType === "caption" || input.contentType === "video" ? "" : `Professional marketing image for ${name}, showcasing ${input.offer}, ${bp.category} business, clean modern style`,
    reelScript: (input.contentType === "video" || input.contentType === "campaign_pack")
      ? `[Scene 1] Open on ${name}\n[Scene 2] Show ${input.offer}\n[Scene 3] Happy customers\n[CTA] Visit ${dest}`
      : "",
    shotList: (input.contentType === "video" || input.contentType === "campaign_pack")
      ? [`${name} opening shot`, `Product/service: ${input.offer}`, "Customer or lifestyle shot", `CTA: ${dest}`]
      : [],
    platformVersions: (input.contentType === "full_social_post" || input.contentType === "ad_creative" || input.contentType === "campaign_pack")
      ? {
          facebook: `${name}: ${input.offer}. ${input.campaignGoal}. Visit us: ${dest}`,
          tiktok: `POV: You just discovered ${name} 👀 ${input.offer} #fyp`,
          snapchat: `${name} — ${input.offer} 👀 ${dest}`,
        }
      : {},
    suggestedPostingTime: "Tuesday–Thursday, 10am–12pm or 7pm–9pm local time",
  };
}

export async function generateContent(input: ContentGenerationInput): Promise<GeneratedContent> {
  if (!isAIReady()) {
    logger.warn("CHAT_BOT not configured — using fallback content");
    return fallbackContent(input);
  }

  try {
    const raw = await callAI(
      [
        { role: "system", content: "You are a premium AI marketing content creator. Always respond with valid JSON only. No markdown, no explanation — only the JSON object." },
        { role: "user", content: buildPrompt(input) },
      ],
      { temperature: 0.85, maxTokens: 1800, jsonMode: true }
    );

    if (!raw) return fallbackContent(input);

    const parsed = JSON.parse(raw) as GeneratedContent;
    if (!parsed.destinationUrl) {
      parsed.destinationUrl = input.businessProfile.destinationUrl || input.businessProfile.websiteUrl || "";
    }
    // Ensure arrays exist even if AI omitted them
    if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
    if (!Array.isArray(parsed.shotList)) parsed.shotList = [];
    if (!parsed.platformVersions || typeof parsed.platformVersions !== "object") parsed.platformVersions = {};
    return parsed;
  } catch (err) {
    logger.error({ err }, "Content generation failed");
    return fallbackContent(input);
  }
}
