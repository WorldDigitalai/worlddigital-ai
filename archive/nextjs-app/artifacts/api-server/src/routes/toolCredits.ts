import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getCollection } from "../lib/mongo.js";
import { callAI } from "../lib/ai.js";
import { logger } from "../lib/logger.js";
import { getBalance, getCost, deductTokens } from "../services/tokenService.js";

const router: IRouter = Router();

const ALL_TOOLS = [
  "image-generator", "reels-generator", "keyword-research", "ai-seo", "content-marketing",
];

// Map each tool to its token-cost action key (matches DEFAULT_COSTS in tokenService)
const TOOL_TOKEN_ACTION: Record<string, string> = {
  "image-generator":   "image",
  "reels-generator":   "content",
  "keyword-research":  "campaign",
  "ai-seo":            "campaign",
  "content-marketing": "content",
};

// ─── GET /v1/dashboard/tools/credits ─────────────────────────────────────────
router.get("/v1/dashboard/tools/credits", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<Record<string, unknown>>("toolCredits");
    const docs = await col.find({ userId: req.user!.userId }).toArray();
    const credits: Record<string, { credits: number; used: number }> = {};
    for (const d of docs) {
      credits[d.tool as string] = { credits: Number(d.credits) || 0, used: Number(d.used) || 0 };
    }
    res.json({ credits });
  } catch (err) {
    logger.error({ err }, "Failed to fetch tool credits");
    res.status(500).json({ message: "Failed to fetch credits" });
  }
});

// ─── POST /v1/dashboard/tools/:tool/use ──────────────────────────────────────
router.post("/v1/dashboard/tools/:tool/use", requireAuth, async (req: AuthRequest, res: Response) => {
  const tool = req.params["tool"] as string;
  if (!ALL_TOOLS.includes(tool)) {
    res.status(400).json({ message: "Unknown tool" });
    return;
  }

  // ── Token balance gate ────────────────────────────────────────────────────
  const userId = req.user!.userId;
  const tokenAction = TOOL_TOKEN_ACTION[tool] ?? "content";
  const [balance, cost] = await Promise.all([getBalance(userId), getCost(tokenAction)]);

  if (balance < cost) {
    res.status(402).json({
      message: `Not enough tokens. This tool costs ${cost} tokens and you have ${balance}. Buy more tokens to continue.`,
      needsTokens: true,
      balance,
      cost,
    });
    return;
  }

  const { input } = req.body ?? {};

  try {
    let prompt = "";

    if (tool === "image-generator") {
      prompt = `You are a professional AI image prompt engineer for digital marketing.
Topic: ${(input as Record<string,string>)?.prompt || "professional marketing photo"}
Style: ${(input as Record<string,string>)?.style || "photorealistic"}
Platform: ${(input as Record<string,string>)?.platform || "Instagram"}

Generate 3 distinct, detailed image prompts optimized for marketing ads. Respond ONLY with valid JSON (no markdown):
{"variations":[{"title":"Variation 1","prompt":"detailed prompt here","style":"photorealistic","mood":"energetic"},{"title":"Variation 2","prompt":"...","style":"...","mood":"..."},{"title":"Variation 3","prompt":"...","style":"...","mood":"..."}]}`;

    } else if (tool === "reels-generator") {
      prompt = `You are a viral short-form video content creator.
Topic: ${(input as Record<string,string>)?.topic || "business promotion"}
Platform: ${(input as Record<string,string>)?.platform || "Instagram Reels"}
Tone: ${(input as Record<string,string>)?.tone || "engaging"}

Create a complete reel package. Respond ONLY with valid JSON (no markdown):
{"hook":"Opening 3-second text on screen","script":"Full 30-60 second script with [PAUSE] and [CUT] markers","shotList":["Shot 1","Shot 2","Shot 3","Shot 4","Shot 5"],"captions":["Short caption","Medium caption with emojis","Detailed caption"],"hashtags":["tag1","tag2"],"musicMood":"upbeat and energetic","trendingAudio":"trending audio suggestion","cta":"Call to action text"}`;

    } else if (tool === "keyword-research") {
      prompt = `You are a professional SEO and Google Ads keyword researcher.
Business: ${(input as Record<string,string>)?.business || "small business"}
Industry: ${(input as Record<string,string>)?.industry || "general retail"}
Location: ${(input as Record<string,string>)?.location || "United States"}

Generate a keyword research report. Respond ONLY with valid JSON (no markdown):
{"primaryKeywords":[{"keyword":"example keyword","intent":"transactional","competition":"medium","cpcRange":"$1.50-$3.00","priority":"high"}],"longTailKeywords":[{"keyword":"long tail example","intent":"informational","competition":"low","cpcRange":"$0.50-$1.50"}],"negativeKeywords":["keyword1","keyword2","keyword3"],"contentAngles":["angle1","angle2","angle3","angle4","angle5"],"clusters":[{"theme":"Theme 1","keywords":["kw1","kw2","kw3"]}]}
Include 8 primary keywords, 15 long-tail keywords, 10 negative keywords, 5 content angles, 3 clusters.`;

    } else if (tool === "ai-seo") {
      prompt = `You are an expert SEO consultant creating an actionable audit.
Website/Business: ${(input as Record<string,string>)?.url || "business website"}
Industry: ${(input as Record<string,string>)?.industry || "general"}
Location: ${(input as Record<string,string>)?.location || "United States"}

Generate an SEO audit report. Respond ONLY with valid JSON (no markdown):
{"healthScore":72,"summary":"Executive summary of SEO status in 2 sentences","issues":[{"severity":"high","title":"Issue title","description":"What's wrong","fix":"How to fix it"}],"metaRecommendations":[{"page":"Home","recommendedTitle":"Optimized title under 60 chars","recommendedMeta":"Optimized description under 155 chars"}],"keywordOpportunities":[{"keyword":"opportunity keyword","estimatedVolume":"1K-10K/mo","difficulty":"medium","opportunity":"Why this is valuable"}],"contentGaps":["gap1","gap2","gap3"],"technicalFixes":["fix1","fix2","fix3"],"aiSearchOptimization":"How to appear in ChatGPT/Perplexity for this niche"}
Include 4 issues (mix of critical/high/medium), 3 meta recs, 5 keyword opportunities.`;

    } else if (tool === "content-marketing") {
      prompt = `You are a professional content marketer and copywriter.
Topic: ${(input as Record<string,string>)?.topic || "industry insights"}
Format: ${(input as Record<string,string>)?.format || "blog post"}
Tone: ${(input as Record<string,string>)?.tone || "professional"}
Audience: ${(input as Record<string,string>)?.audience || "small business owners"}

Create high-quality marketing content. Respond ONLY with valid JSON (no markdown):
{"title":"Compelling headline","metaDescription":"SEO meta description under 155 chars","outline":["Introduction","Section 1","Section 2","Section 3","Conclusion"],"content":"Full content here — write 400-600 words with natural paragraph breaks. Include subheadings using markdown ##.","emailSubject":"Subject line version","socialCaption":"Short social caption with emojis","keyTakeaways":["takeaway1","takeaway2","takeaway3"],"cta":"Strong call to action"}`;
    }

    const isReels = tool === "reels-generator";
    const aiResponse = await callAI([
      { role: "system", content: "You are a professional marketing AI. Respond only with valid JSON, no markdown code fences." },
      { role: "user", content: prompt },
    ], { maxTokens: isReels ? 3500 : 2000, jsonMode: true });

    if (!aiResponse) {
      res.status(500).json({ message: "AI generation failed. Please try again." });
      return;
    }

    let result: unknown;
    try {
      const cleaned = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { raw: aiResponse };
    }

    const deductResult = await deductTokens(userId, tokenAction, `Used ${tool} tool`, { tool });

    res.json({ result, tool, tokensRemaining: deductResult.balance });
  } catch (err) {
    logger.error({ err }, `Tool generation failed for ${tool}`);
    res.status(500).json({ message: "Generation failed. Please try again." });
  }
});

// ─── POST /v1/dashboard/tools/add-credits (called by Stripe webhook) ──────────
router.post("/v1/dashboard/tools/add-credits", async (req: Request, res: Response) => {
  const { userId, tool, credits } = req.body ?? {};
  if (!userId || !tool || !credits) {
    res.status(400).json({ message: "Missing userId, tool, or credits" });
    return;
  }
  try {
    const col = getCollection<Record<string, unknown>>("toolCredits");
    await col.updateOne(
      { userId, tool },
      {
        $inc: { credits: Number(credits) },
        $setOnInsert: { used: 0, createdAt: new Date() } as Record<string, unknown>,
      },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to add tool credits");
    res.status(500).json({ message: "Failed to add credits" });
  }
});

// ─── GET /v1/admin/tool-credits (admin overview) ──────────────────────────────
router.get("/v1/admin/tool-credits", async (req: Request, res: Response) => {
  const adminToken = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (!adminToken) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const col = getCollection<Record<string, unknown>>("toolCredits");
    const all = await col.find({}).sort({ lastUsedAt: -1 }).limit(200).toArray();

    const summary: Record<string, { totalCredits: number; totalUsed: number; users: number }> = {};
    for (const d of all) {
      const t = d.tool as string;
      if (!summary[t]) summary[t] = { totalCredits: 0, totalUsed: 0, users: 0 };
      summary[t].totalCredits += Number(d.credits) || 0;
      summary[t].totalUsed += Number(d.used) || 0;
      summary[t].users += 1;
    }

    res.json({ summary, records: all });
  } catch (err) {
    logger.error({ err }, "Failed to fetch admin tool credits");
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

export default router;
