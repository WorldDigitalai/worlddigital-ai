import { Router, type IRouter, type Request, type Response } from "express";
import { callAIJson, isAIReady } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface DemoRequest {
  businessName?: string;
  category?: string;
  websiteUrl?: string;
  goal?: string;
}

interface DemoResult {
  caption: string;
  shortCaption: string;
  hashtags: string[];
  cta: string;
  imagePrompt: string;
  imageStyle: string;
  platform: string;
  platformReason: string;
  campaignGoal: string;
  adFormat: string;
  estimatedReach: string;
}

function buildTemplate(businessName: string, category: string, goal: string): DemoResult {
  const name = businessName || "Your Business";
  const categoryMap: Record<string, DemoResult> = {
    "Restaurant / Cafe": {
      caption: `Craving something incredible? ${name} brings bold flavors to every bite. Whether you're dining in or ordering out, every dish is crafted with care. Visit us today and taste the difference.`,
      shortCaption: `Fresh flavors, every day. Come dine with ${name} — your next favorite meal is waiting!`,
      hashtags: ["#foodie", "#localrestaurant", "#eats", "#fresh", "#dinein", "#supportlocal"],
      cta: goal === "Increase bookings" ? "Reserve a table now →" : "Order online today →",
      imagePrompt: `Mouth-watering flat lay of signature dishes from ${name}, warm lighting, restaurant interior background, professional food photography, vibrant colors`,
      imageStyle: "Warm food photography with professional plating and natural lighting",
      platform: "Instagram",
      platformReason: "Instagram drives 3.5x more food-related engagement than other platforms. High visual content performs exceptionally well.",
      campaignGoal: goal,
      adFormat: "Image carousel + Story ads with swipe-up CTA",
      estimatedReach: "8,000 – 22,000 local people per month",
    },
    "Fitness / Gym": {
      caption: `Your transformation starts today. ${name} offers world-class coaching, state-of-the-art equipment, and a community that keeps you accountable. Stop waiting. Start winning.`,
      shortCaption: `Train smarter. Get stronger. Join ${name} and transform your body — one session at a time.`,
      hashtags: ["#fitness", "#gym", "#workout", "#transformation", "#getfit", "#health"],
      cta: "Claim your free first session →",
      imagePrompt: `Energetic gym interior with motivated people working out, modern equipment, dynamic lighting, ${name} branding, professional sports photography`,
      imageStyle: "High-energy sports photography with dynamic angles and motivating atmosphere",
      platform: "Instagram + TikTok",
      platformReason: "Fitness content thrives on Instagram & TikTok. Video reels of workouts achieve 5x organic reach.",
      campaignGoal: goal,
      adFormat: "Video reel + Lead gen form for free trial",
      estimatedReach: "10,000 – 28,000 people in your area per month",
    },
    "Retail / E-Commerce": {
      caption: `Style that speaks for itself. ${name} features premium pieces designed to elevate your every look. Limited stock. Shop now before it's gone.`,
      shortCaption: `New arrivals are here. Shop ${name} — limited pieces, endless possibilities.`,
      hashtags: ["#shopnow", "#newcollection", "#fashion", "#style", "#retail", "#ootd"],
      cta: "Shop the new collection →",
      imagePrompt: `Clean product flat lay on white marble surface, ${name} aesthetic, soft natural lighting, editorial photography style, minimal background`,
      imageStyle: "Clean editorial flat lay with minimal, high-contrast composition",
      platform: "Meta (Facebook + Instagram)",
      platformReason: "Meta's product catalog ads and dynamic retargeting deliver the highest ROAS for retail businesses.",
      campaignGoal: goal,
      adFormat: "Product carousel + Dynamic retargeting ads",
      estimatedReach: "12,000 – 35,000 targeted shoppers per month",
    },
    "Health & Beauty": {
      caption: `Looking and feeling your best has never been easier. ${name} delivers premium beauty experiences with every visit. Book now and discover your best self.`,
      shortCaption: `Your glow-up starts at ${name}. Book your appointment and transform today.`,
      hashtags: ["#beauty", "#selfcare", "#glow", "#hairsalon", "#beautygoals", "#wellness"],
      cta: "Book your appointment →",
      imagePrompt: `Beautiful before-and-after beauty transformation, professional lighting, ${name} salon environment, warm tones, editorial beauty photography`,
      imageStyle: "Editorial beauty photography with warm, glowing aesthetic",
      platform: "Instagram",
      platformReason: "Instagram is the #1 platform for beauty content. Visual transformations generate massive organic engagement.",
      campaignGoal: goal,
      adFormat: "Before/after carousel + Story booking CTA",
      estimatedReach: "7,000 – 20,000 local people per month",
    },
  };

  const fallback: DemoResult = {
    caption: `${name} is redefining what great service looks like. With a focus on quality, reliability, and results, we've built a reputation that speaks for itself. Ready to experience the difference?`,
    shortCaption: `Quality you can count on. Contact ${name} today and discover why customers keep coming back.`,
    hashtags: ["#qualityservice", "#trusted", "#localbusiness", "#professional", "#excellence"],
    cta: goal === "Get more customers" ? "Get your free quote →" : goal === "Increase bookings" ? "Book your appointment →" : "Learn more →",
    imagePrompt: `Professional business environment for ${name} in ${category?.toLowerCase() || "service"}, modern interior, confident team, clean branding, high-end commercial photography`,
    imageStyle: "Professional commercial photography with clean, trustworthy aesthetic",
    platform: "Google Search + Meta",
    platformReason: "Combining Google Search intent targeting with Meta's audience-based ads maximizes both discovery and retargeting.",
    campaignGoal: goal,
    adFormat: "Search ads for intent + Display retargeting",
    estimatedReach: "6,000 – 18,000 targeted prospects per month",
  };

  return categoryMap[category] || fallback;
}

router.post("/v1/demo/generate", async (req: Request, res: Response) => {
  try {
    const { businessName = "", category = "", websiteUrl = "", goal = "Get more customers" } = req.body as DemoRequest;

    if (!category) {
      return res.status(400).json({ error: "Business category is required" });
    }

    if (isAIReady()) {
      try {
        const prompt = `Generate a premium social media marketing demo for:
Business: ${businessName || "A local business"}
Category: ${category}
Website: ${websiteUrl || "not provided"}
Goal: ${goal}

Return a JSON object with exactly these fields:
- caption (string, 2-3 sentences, engaging social post)
- shortCaption (string, 1 sentence)
- hashtags (array of 5-6 strings including the # symbol)
- cta (string, call-to-action phrase with arrow)
- imagePrompt (string, detailed AI image generation prompt)
- imageStyle (string, brief style description)
- platform (string, best platform name)
- platformReason (string, 1-2 sentences explaining why)
- campaignGoal (string, same as the goal input)
- adFormat (string, recommended ad format)
- estimatedReach (string, estimated monthly reach range)

Return only valid JSON.`;

        const aiResult = await callAIJson<DemoResult>(
          [{ role: "user", content: prompt }],
          { maxTokens: 600, temperature: 0.7 }
        );

        if (aiResult) {
          return res.json(aiResult);
        }
      } catch (aiErr) {
        logger.warn({ aiErr }, "Demo AI generation failed — using template");
      }
    }

    const result = buildTemplate(businessName, category, goal);
    return res.json(result);
  } catch (err) {
    logger.error({ err }, "POST /v1/demo/generate error");
    return res.status(500).json({ error: "Failed to generate demo" });
  }
});

export default router;
