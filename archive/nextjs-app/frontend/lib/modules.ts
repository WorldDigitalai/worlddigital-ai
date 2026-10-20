export type Module = {
  slug: string;
  title: string;
  category: "Ad Management" | "AI Tools";
  shortDesc: string;
  iconType: "img" | "badge";
  iconSrc?: string;
  badgeLabel?: string;
  badgeBg?: string;
  badgeTextColor?: string;
  bullets: [string, string, string];
  headline: string;
  subheading: string;
  problem: { heading: string; text: string };
  howItWorks: { step: string; title: string; desc: string }[];
  features: { title: string; desc: string }[];
  roi: { heading: string; text: string };
  integrations: string[];
};

export const MODULES: Module[] = [
  {
    slug: "google-ads",
    title: "Google Ads",
    category: "Ad Management",
    shortDesc: "Capture high-intent search traffic the moment customers are looking for what you sell.",
    iconType: "img",
    iconSrc: "/icons/google.webp",
    bullets: ["Search, Display & Performance Max", "AI keyword discovery & negative filtering", "Automated A/B testing & bid optimization"],
    headline: "Capture Intent When It Matters Most",
    subheading: "Google users are searching for exactly what you sell. Our AI puts your ad in front of them at the perfect moment — without wasting your budget.",
    problem: {
      heading: "The Old Way Burns Budget. The AI Way Builds Revenue.",
      text: "Manual Google Ads means setting up one campaign, picking a few keywords, and hoping for the best — then checking back a week later to find half your budget gone and zero conversions. Our AI starts with your URL and business category, crawls your pages to understand your offer, builds hundreds of high-intent keywords, writes 15+ ad variations, and begins optimizing bids within 48 hours. You get a weekly plain-English snapshot — not jargon.",
    },
    howItWorks: [
      { step: "01", title: "Search Ads", desc: "Text ads at the top of Google results for high-intent queries. Our AI optimizes for intent matching, not just keywords, and adds negative keywords automatically to block irrelevant clicks." },
      { step: "02", title: "Display Ads", desc: "Image ads on websites your customers already visit. We generate display banners using your logo and colors, then target users based on browsing behavior for brand awareness and retargeting." },
      { step: "03", title: "Performance Max", desc: "Google's most powerful campaign type — runs across Search, Display, YouTube, Gmail, and Maps from one campaign. Our AI feeds it your best assets and lets Google's algorithm find the winning combinations." },
    ],
    features: [
      { title: "Smart Keyword Discovery", desc: "Hundreds of high-intent terms sourced from your website and competitor analysis." },
      { title: "Dynamic Ad Generation", desc: "Responsive Search Ads with 15+ headline and description combinations, always fresh." },
      { title: "Automated Bid Adjustments", desc: "Bids optimized by device, location, time of day, and audience segment." },
      { title: "Negative Keyword Protection", desc: "Block irrelevant searches instantly — save 20–40% of wasted ad spend." },
      { title: "Conversion Tracking", desc: "Full setup included. No coding required. Accurate attribution from day one." },
      { title: "Weekly Performance Snapshot", desc: "Plain English reports — which keywords, headlines, and time slots drive the lowest cost per conversion." },
    ],
    roi: {
      heading: "Why Most SMBs Fail at Google Ads — And How We Fix It",
      text: "They bid on high-volume terms that cost $50/click and convert poorly. They ignore negative keywords and pay for 'free' or 'cheap' clicks. They never test ad copy so Google gives them low Quality Scores and charges more. Our AI solves all three — finding long-tail gems at $5/click that convert 4× better, automatically blocking junk searches, and running continuous A/B tests so winning ads stay and losers pause.",
    },
    integrations: ["AI Image Generator for Ads", "AI Keyword Research Tool", "Analytics Dashboard"],
  },
  {
    slug: "meta-ads",
    title: "Meta Ads",
    category: "Ad Management",
    shortDesc: "Facebook + Instagram campaigns that actually convert — AI handles targeting, creative, and optimization.",
    iconType: "img",
    iconSrc: "/icons/meta.png",
    bullets: ["Feed, Reels & Stories ad formats", "Dynamic creative optimization", "Lookalike & retargeting audiences"],
    headline: "Facebook + Instagram Ads That Actually Deliver ROI",
    subheading: "Stop burning budget on ads that don't convert. Our AI handles targeting, creative, and optimization across both platforms — automatically.",
    problem: {
      heading: "Audience Fragmentation Killed the 'One Ad, Pray' Strategy",
      text: "Facebook and Instagram users now expect hyper-personalized content. If your ad feels generic, they scroll past. If it feels tailored, they stop and click. The old 'one ad set, one audience, pray' is dead. WorldDigital.ai's Meta Ads engine solves this with dynamic creative optimization and real-time audience layering — we let the AI learn what works for your specific business, then double down automatically.",
    },
    howItWorks: [
      { step: "01", title: "Feed Ads (Image + Carousel)", desc: "Perfect for product showcases. Our AI tests up to 10 different headlines and descriptions simultaneously to find the winning combination." },
      { step: "02", title: "Reels Ads (Vertical Video)", desc: "The highest organic reach on Instagram right now. We repurpose your existing visuals into 9:16 Reels with captions, music, and your logo — optimized for silent viewing." },
      { step: "03", title: "Stories Ads (Full-Screen)", desc: "Immersive and hard to ignore. Our generator creates Story-specific visuals with built-in swipe-up or reply CTAs for maximum engagement." },
    ],
    features: [
      { title: "Platform-Specific Creative", desc: "Instagram prefers visual-rich aesthetic content. Facebook favors informative posts. Our AI auto-adapts your creative for each — same campaign, different look and feel." },
      { title: "Ad Fatigue Prevention", desc: "Once frequency hits 2.5, our AI automatically rotates in fresh image or video variations. No manual redesign needed." },
      { title: "Lookalike Audiences", desc: "Built from your website visitors, email list, or engaged social followers — the most qualified audience possible." },
      { title: "Precise Budget Control", desc: "Small budgets work fine with precise targeting. Many SME clients start small and see positive ROI within 30 days." },
      { title: "No Ads Manager Required", desc: "Provide your logo, business category, and website URL. Our platform builds campaign structures, sets budgets, and launches ads." },
      { title: "30–50% Lower CPC", desc: "Based on internal SME data — AI management consistently outperforms manual optimization." },
    ],
    roi: {
      heading: "Manual Meta Management = Constant Babysitting",
      text: "Adjusting bids, pausing losers, refreshing creatives — that's hours per week of work. Our AI does it in seconds. The result: higher ad relevance scores, lower cost per click, and more time back in your day to run your actual business.",
    },
    integrations: ["AI Image Generator for Ads", "AI Reels Generator", "Analytics Dashboard"],
  },
  {
    slug: "snapchat-ads",
    title: "Snapchat Ads",
    category: "Ad Management",
    shortDesc: "Reach Gen Z and Millennials where they're most engaged — at 20–40% lower CPMs than Meta.",
    iconType: "img",
    iconSrc: "/icons/snapchat.png",
    bullets: ["Snap Ads, Story Ads & Geofilters", "Vertical 9:16 AI-generated creatives", "20–40% lower CPMs than Meta"],
    headline: "Reach the Audience Other Platforms Miss",
    subheading: "Gen Z and Millennials spend over 30 minutes daily on Snapchat. Our AI creates authentic, full-screen ads they actually want to watch.",
    problem: {
      heading: "Two Mistakes That Kill Snapchat ROI",
      text: "Most businesses use horizontal video (gets cropped, looks amateur) and skip sound-off captions (60% of Snaps are viewed silently). Our generator outputs vertical-only, caption-burned videos. We also A/B test your first 3 seconds — because on Snapchat, if you don't hook them immediately, they swipe to the next friend's story.",
    },
    howItWorks: [
      { step: "01", title: "Snap Ad Creation", desc: "Vertical video/image ads between friends' stories. Our AI takes your product photos or website copy and generates 9:16 creatives with bold text overlays, your logo, and auto-captions." },
      { step: "02", title: "Story Ads", desc: "A tile that opens into a collection of your brand's Snapchat Stories. Our AI builds these from blog posts, user testimonials, or AI Reels — turning passive viewers into engaged explorers." },
      { step: "03", title: "Filter & Lens Suggestions", desc: "We identify when a sponsored geofilter makes sense — for events, store openings, or local promotions — and recommend budget and targeting based on foot traffic data." },
    ],
    features: [
      { title: "Less Competition, Lower Costs", desc: "Snapchat auction prices are 20–40% lower than Meta because fewer advertisers know how to crack the format." },
      { title: "Intentional Engagement", desc: "Snapchat users actively open messages and scan stories — your ad gets full-screen attention, not a tiny thumbnail." },
      { title: "Young Demographic Precision", desc: "Target by interest, location, and device type to reach customers under 35 with proven purchase intent." },
      { title: "Automatic Bid Optimization", desc: "Bids adjusted every 2 hours for maximum efficiency across all Snap Ad formats." },
      { title: "Complete Creative Suite", desc: "Snap Ads, Story Ads, and Collection Ads all generated from your existing assets — no fancy editing software." },
      { title: "Conversion Reporting", desc: "Swipe-up rate, view time, and conversion data in one unified dashboard." },
    ],
    roi: {
      heading: "Higher Completion Rates, Lower Cost Per Swipe-Up",
      text: "By combining vertical-first creative, burned-in captions, and first-3-second A/B testing, our campaigns consistently achieve higher completion rates and lower cost per swipe-up than industry averages. Your Snapchat budget works harder from day one.",
    },
    integrations: ["AI Reels Generator", "AI Image Generator for Ads", "Analytics Dashboard"],
  },
  {
    slug: "tiktok-ads",
    title: "TikTok Ads",
    category: "Ad Management",
    shortDesc: "AI-powered short-form video ads that crack TikTok's algorithm for 50–70% lower costs.",
    iconType: "img",
    iconSrc: "/icons/tiktok.jpeg",
    bullets: ["In-Feed, Spark & Search Ads", "AI creative production in seconds", "50–70% lower costs than competing platforms"],
    headline: "TikTok is No Longer Optional.",
    subheading: "Stop guessing and start converting. We use AI to crack the code on short-form video ads so you get engagement, traffic, and sales.",
    problem: {
      heading: "Manual TikTok Content Creation Burns 28–42 Hours Before You See Traction",
      text: "TikTok demands speed. If you try to create content manually, you're looking at 28–42 hours of production before you see meaningful data. Young users now use TikTok as a primary search engine. If you aren't ranking there, your competitors are. Our AI Reels Generator combined with this TikTok service creates platform-native, vertical videos in seconds, not hours — and our AI monitors metrics 24/7, refreshing creative before ad fatigue sets in.",
    },
    howItWorks: [
      { step: "01", title: "In-Feed Ads", desc: "Scroll-stopping content optimized for the first 3 seconds — because research shows that's how long you have to hook a user before they scroll past." },
      { step: "02", title: "Spark Ads", desc: "The secret weapon. Instead of corporate polish, we promote organic, raw-feeling content. Creator-led ads deliver 70% higher CTR and 159% higher engagement than traditional polished ads." },
      { step: "03", title: "Search Ads", desc: "Target users actively searching for solutions — conversion rates are typically 60% higher in search placement." },
    ],
    features: [
      { title: "AI Creative Production", desc: "Platform-native vertical videos (9:16) generated in seconds from your brand assets — no filming required." },
      { title: "Authenticity Engine", desc: "Our AI creates user-generated-style content that looks like a friend recorded it — exactly what TikTok's algorithm rewards." },
      { title: "Value-First Hooks", desc: "We put the product result in the first frame. No slow intros, no corporate energy." },
      { title: "Automated Bid Optimization", desc: "AI monitors CPM and CTR 24/7. When ads fatigue (usually day 5–6), the system auto-refreshes creative." },
      { title: "Interactive Elements", desc: "Polling stickers and curiosity gaps embedded to maximize watch time and engagement." },
      { title: "50–70% Lower Ad Costs", desc: "TikTok CPMs are significantly lower than Meta and Google — your budget goes much further." },
    ],
    roi: {
      heading: "Stop Fighting the Algorithm — Start Riding It",
      text: "TikTok success is a science of iteration. You need to test dozens of thumbnails, sounds, and caption variants. Doing this manually is impossible for a small business owner. Our AI automates the creative testing, optimizes the landing page, and manages the bid strategy — so you get compounding results without compounding workload.",
    },
    integrations: ["AI Reels Generator", "AI Image Generator for Ads", "Analytics Dashboard"],
  },
  {
    slug: "linkedin-ads",
    title: "LinkedIn Ads",
    category: "Ad Management",
    shortDesc: "Reach B2B decision-makers by job title, industry, and seniority with AI precision targeting.",
    iconType: "badge",
    badgeLabel: "in",
    badgeBg: "#0A66C2",
    badgeTextColor: "#ffffff",
    bullets: ["Sponsored Content, Message & Text Ads", "Audience layering by title, industry, company size", "AI-generated professional creatives"],
    headline: "Reach Decision-Makers Where They Actually Engage",
    subheading: "Stop spraying generic ads across the internet. Target by job title, industry, company size, and seniority — with AI that optimizes every dollar.",
    problem: {
      heading: "LinkedIn CPMs Are Higher — But One Qualified Lead Closes at 3–5× the Value",
      text: "Over 70% of B2B decision-makers have made a purchase after seeing a relevant LinkedIn ad. But most small businesses never run LinkedIn campaigns because they think it's too expensive or complicated. Here's the truth: the lead quality is dramatically better. One qualified LinkedIn lead can close at 3–5× the value of a click from elsewhere. The math works — if you target correctly. That's where our AI changes the game.",
    },
    howItWorks: [
      { step: "01", title: "Sponsored Content", desc: "Appears directly in the LinkedIn feed. Our AI generates carousel ads, single images, and video ads tailored to professional audiences — testing headlines like 'Reduce Churn by 40%' vs 'Case Study: How X Saved $50k'." },
      { step: "02", title: "Message Ads", desc: "Land directly in a user's LinkedIn inbox with 30–50% open rates. Our AI crafts conversational, non-spammy messages and spaces them out to avoid fatigue." },
      { step: "03", title: "Text Ads", desc: "Small, pay-per-click sidebar ads — low cost, great for retargeting. Our system automatically A/B tests copy and pauses underperformers." },
    ],
    features: [
      { title: "Audience Layering", desc: "We don't just target 'CEO.' We target CEO + company size 10–200 + industry SaaS + location US — a precise, affordable audience." },
      { title: "Professional Creative Generation", desc: "AI creates clean, data-driven visuals — charts, customer logos, bullet points — not stock photos of fake teams shaking hands." },
      { title: "Continuous A/B Testing", desc: "Every campaign runs 5+ ad variations. The AI shifts budget to winners every 6 hours." },
      { title: "Lead Gen Forms", desc: "Pre-filled with LinkedIn user data (name, email, company) — one click to submit. Highest-converting format on the platform." },
      { title: "Budget Pacing", desc: "Daily or lifetime caps, automatically adjusted for performance — never overspend on low-intent clicks." },
      { title: "Complete Reporting", desc: "Cost per lead, open rate, click-through rate, and form completion rate all in one dashboard." },
    ],
    roi: {
      heading: "Enterprise-Grade LinkedIn Management for Flat Monthly Fee",
      text: "You don't have a marketing team of five. You don't have time to learn Campaign Manager. You just need leads that turn into meetings. We give you the same automation that enterprise marketers use — for a flat monthly fee. No percentage of ad spend. No hidden fees. Just AI-driven management that works while you sleep.",
    },
    integrations: ["AI Image Generator for Ads", "AI Content Marketing", "Analytics Dashboard"],
  },
  {
    slug: "youtube-shorts",
    title: "YouTube Shorts Ads",
    category: "Ad Management",
    shortDesc: "8-second vertical ads that front-load value and convert mobile viewers without a film crew.",
    iconType: "img",
    iconSrc: "/icons/youtube-shorts.png",
    bullets: ["9:16 vertical video, up to 60 seconds", "AI hook library with 10+ opening variations", "Animated captions for silent viewing"],
    headline: "8 Seconds. Full Attention. Zero Production Headache.",
    subheading: "YouTube Shorts is the fastest-growing short-video platform. Our AI creates, captions, and optimizes vertical ads so you can capture mobile viewers without a film crew.",
    problem: {
      heading: "74% of Top-Performing Shorts Ads Are Repurposed Content — Not Studio Productions",
      text: "You don't need fancy cameras or a scriptwriter. Viewers care about value, not production value. With the right hook and CTA, Shorts ads drive direct clicks to your website, product pages, or lead forms. YouTube's algorithm now prioritizes Shorts in search results — making them as actionable as long-form video. The catch: Shorts audiences have a 3-second attention span. If your first frame is a logo fade-in, you've lost them.",
    },
    howItWorks: [
      { step: "01", title: "Feed Your Existing Content", desc: "Upload product photos, logo, website URL, or a previous blog post. Our AI analyzes what makes your brand unique and extracts the most compelling benefit." },
      { step: "02", title: "AI Writes the Hook", desc: "We generate 5–10 different opening lines (3 seconds or less). Choose the best or let our A/B test pick the winner automatically." },
      { step: "03", title: "Auto-Captions + Music", desc: "Over 60% of YouTube Shorts are watched with sound off. Our AI burns in animated captions that match your brand colors and selects royalty-free tracks the algorithm favors." },
      { step: "04", title: "Publish or Schedule", desc: "Receive a fully formatted 9:16 vertical video. Download or connect your YouTube channel for one-click publishing directly from WorldDigital.ai." },
    ],
    features: [
      { title: "Vertical Video Generation", desc: "1080×1920, 60s max, MP4 format — perfectly spec'd for YouTube Shorts from the start." },
      { title: "Captions + Kinetic Typography", desc: "Animated, branded, readable on mute — increases watch time and accessibility." },
      { title: "AI Hook Library", desc: "10+ headline variations tested against YouTube's trending patterns to maximize first-3-second retention." },
      { title: "Music Suggestion Engine", desc: "Tracks chosen for viewer retention, not just background noise — selected to extend organic reach." },
      { title: "Performance Dashboard", desc: "Views, average watch time, swipe-away rate, and clicks — all tracked in one place." },
      { title: "Organic Reach Bonus", desc: "YouTube is actively pushing Shorts into the main feed and search results — your ad rides the same wave as organic creators." },
    ],
    roi: {
      heading: "Consistency Is the Only Shortcut on YouTube Shorts",
      text: "You don't need a production budget. You need the right hooks and consistent publishing. Our AI handles both — generating a week's worth of Shorts content in under 30 minutes. More content means more algorithm exposure, more followers, and more conversions — without adding to your workload.",
    },
    integrations: ["AI Reels Generator", "AI Image Generator for Ads", "Analytics Dashboard"],
  },
  {
    slug: "x-ads",
    title: "X Ads",
    category: "Ad Management",
    shortDesc: "Real-time trend hijacking and sentiment-based bidding to turn conversations into customers.",
    iconType: "img",
    iconSrc: "/icons/x.png",
    bullets: ["Promoted Tweets, Follower & Conversation Ads", "Real-time trend hijacking & monitoring", "Sentiment-based automated bidding"],
    headline: "Turn Conversations Into Customers",
    subheading: "X moves fast. Your ads should too. Our AI helps you join the right conversations at the exact moment your audience is listening.",
    problem: {
      heading: "X Rewards Relevance, Not Volume — And Manual Posting Can't Keep Up",
      text: "Most brands blast promotional links into the void, ignore replies, and treat X like a billboard instead of a living town square. X's algorithm prioritizes engagement velocity — how quickly people interact with your post after it goes live. If your ad doesn't spark a reply, retweet, or like within the first 15 minutes, X stops showing it. That's why manual posting fails. You can't be everywhere at once.",
    },
    howItWorks: [
      { step: "01", title: "Promoted Tweets", desc: "Your best organic post gets a budget boost. Our AI identifies which of your tweets already have high engagement and amplifies them — no guessing which content to promote." },
      { step: "02", title: "Follower Ads", desc: "Target users who follow similar accounts. Our algorithm builds a lookalike audience based on your existing followers and serves them a 'Follow us' card." },
      { step: "03", title: "Conversation Ads", desc: "Users see a primary tweet with up to four customizable CTA buttons (Learn More, Get Offer, Watch Video). Each click opens a separate reply thread — perfect for guiding customers down different conversion paths." },
    ],
    features: [
      { title: "Real-Time Trend Hijacking", desc: "Our AI monitors trending hashtags in your niche. When a conversation spikes, it generates reply-ads that insert your brand naturally." },
      { title: "Sentiment-Based Bidding", desc: "Higher bids during positive sentiment windows around your keywords. Lower bids during negativity. Maximizes ROI automatically." },
      { title: "Auto-Generated Variations", desc: "10+ versions of your X ad — different hooks, CTAs, visuals — A/B tested continuously. Losers pause. Winners double down." },
      { title: "Auto-Reply Engine", desc: "Scans public tweets containing your product category + a question mark, then auto-replies (with your approval) using your brand voice." },
      { title: "Weekly Insight Reports", desc: "Which conversation topics drove the most clicks, best time of day for your audience, and real-time sentiment shifts." },
      { title: "X-Optimized Copy", desc: "AI-generated copy respects X's character limits (280–500 chars) and platform tone — no corporate-speak." },
    ],
    roi: {
      heading: "Traditional X Ads Management Requires a Human Watching the Feed 24/7",
      text: "That's expensive and exhausting. We automate the watching, tweaking, and optimizing. If you run a local service or a B2B brand, X is a goldmine — people actively search for solutions and ask questions. Your job is to answer before your competitor does. Our AI does the answering for you.",
    },
    integrations: ["AI Content Marketing", "AI Image Generator for Ads", "Analytics Dashboard"],
  },
  {
    slug: "ai-seo",
    title: "AI SEO",
    category: "AI Tools",
    shortDesc: "Optimize for Google, ChatGPT, and voice search simultaneously with one unified AI system.",
    iconType: "img",
    iconSrc: "/icons/icon-search-gear2.png",
    bullets: ["Traditional SEO + GEO + AEO", "Rank inside ChatGPT & Gemini answers", "Featured snippet & voice search optimization"],
    headline: "Rank on Google, ChatGPT, and Voice Search — All at Once",
    subheading: "SEO has evolved. You now need to optimize for three engines: traditional search, generative AI, and voice assistants. Our AI handles all three automatically.",
    problem: {
      heading: "Over 25% of Searches Never Reach a Traditional Search Engine",
      text: "Users ask ChatGPT, Gemini, Perplexity, or their voice assistant (Siri, Alexa). If your content isn't optimized for those answers, you've disappeared from half the internet. For decades, SEO meant pleasing Google. Write keywords. Build backlinks. Climb the blue link rankings. That world is over. You now need a unified system that optimizes for three distinct engines simultaneously.",
    },
    howItWorks: [
      { step: "01", title: "Traditional SEO (Google, Bing)", desc: "Keyword discovery with search volume and difficulty scoring, meta tag generation, schema markup for rich snippets, internal linking suggestions, and technical audits for broken links, speed, and mobile issues." },
      { step: "02", title: "GEO — Generative Engine Optimization", desc: "When someone asks ChatGPT 'Which marketing platform is best for a small bakery?' it generates one synthesized answer from 5–10 sources. Our GEO engine restructures your content to become citation-worthy — your brand name appearing inside AI answers." },
      { step: "03", title: "AEO — Answer Engine Optimization", desc: "Voice search and featured snippets require concise 40–60 word answers. Our AI identifies question-based queries, creates dedicated FAQ schema blocks, and formats content for position zero." },
    ],
    features: [
      { title: "Keyword Discovery & Scoring", desc: "Search volume, difficulty, and CPC data to prioritize terms that offer the best ROI for your business." },
      { title: "Meta Tag Generation", desc: "AI-written titles, descriptions, and headers optimized for click-through rate across all three engine types." },
      { title: "Schema Markup", desc: "Rich snippets for FAQs, reviews, and events that increase visibility on Google's results page." },
      { title: "GEO Citation Engine", desc: "Structures your content with clear lists, tables, and step-by-step guides that generative AI models extract and cite." },
      { title: "AEO Featured Snippets", desc: "Optimized for position zero — the box above organic results — and natural-language voice queries." },
      { title: "Unified Dashboard", desc: "Traditional ranking reports, GEO citation frequency, and AEO snippet ownership — all in one view." },
    ],
    roi: {
      heading: "One Dashboard. Three Optimization Engines. One Growing Business.",
      text: "You don't need three separate SEO tools. Our AI SEO dashboard shows you traditional rankings, how often your brand appears in LLM answers, and which question boxes you've captured. Every insight feeds directly into our AI Content Marketing tool — so you can generate new articles optimized for all three engines with one click.",
    },
    integrations: ["AI Keyword Research Tool", "AI Content Marketing", "Analytics Dashboard"],
  },
  {
    slug: "keyword-research",
    title: "AI Keyword Research",
    category: "AI Tools",
    shortDesc: "Discover high-intent keywords and topic clusters in minutes — including zero-volume queries competitors miss.",
    iconType: "img",
    iconSrc: "/icons/icon-search-gear.png",
    bullets: ["Topic clusters & intent classification", "Predictive trend analysis before peak volume", "Zero-volume query identification"],
    headline: "Discover Untapped Keywords & Dominate Search Rankings with AI",
    subheading: "Move beyond manual guesswork. Unlock high-intent keywords and build authoritative content pillars in minutes, not days.",
    problem: {
      heading: "Traditional Keyword Research Is Backward-Looking — And Missing 15% of All Daily Searches",
      text: "It relies on manual data extraction and historical volumes, causing you to miss emerging trends and the 15% of daily Google searches that are entirely new. Search engines now reward coherent content authority over individual keyword rankings. You need a system that helps you map entire ecosystems of search queries — not just single-word targets. Our AI uses advanced machine learning to analyze user intent, cluster semantically related topics, and surface zero-volume questions that drive real conversions.",
    },
    howItWorks: [
      { step: "01", title: "AI-Powered Topic Discovery", desc: "Simply provide your business niche. Our AI analyzes millions of data points — SERP overlays, autocomplete suggestions, competitor gaps — to generate a massive list of contextually relevant topics." },
      { step: "02", title: "Intent & Semantic Clustering", desc: "Automatically groups thousands of keywords into distinct clusters based on search intent — Informational, Navigational, Commercial, and Transactional — to build a pillar-and-cluster model." },
      { step: "03", title: "Predictive Trend Analysis", desc: "Flags emerging topics before they hit peak volume, analyzing real-time search patterns and seasonal data — giving you a first-mover advantage." },
      { step: "04", title: "Zero-Volume Query Identification", desc: "Detects specific questions users type into LLMs or niche forums that currently drive actual sales and traffic but have zero reported search volume." },
    ],
    features: [
      { title: "Instant Keyword Lists", desc: "Generate thousands of long-tail keywords from a single seed topic in seconds, not hours." },
      { title: "SERP Analysis Integration", desc: "Analyzes the top 50 ranking pages for any keyword — showing you exactly what type of content Google prefers." },
      { title: "Competitor Gap Analysis", desc: "Enter a competitor's URL to see which profitable keywords they rank for but you don't. Use gaps to steal market share." },
      { title: "Real-Time Search Data", desc: "Live search volume, competition, and CPC data to prioritize terms that offer the best ROI." },
      { title: "Auto-Create Content Briefs", desc: "Once you select a keyword cluster, the system automatically generates an SEO-optimized brief with headings and FAQs." },
      { title: "Direct Feed to Campaigns", desc: "Keyword data feeds directly into AI Image Generator for Ads, AI Content Marketing, and AI Reels Generator." },
    ],
    roi: {
      heading: "From Keyword Data to Published Content in One Workflow",
      text: "This tool is part of our fully automated marketing ecosystem. When you use the AI Marketing Plan, keyword data feeds directly into our other services. Automated content generation creates blog posts and captions based on validated keywords. Smart ad design creates visuals optimized for the keywords you want to rank for. End-to-end automation — from research to revenue.",
    },
    integrations: ["AI SEO", "AI Content Marketing", "AI Image Generator for Ads"],
  },
  {
    slug: "content-marketing",
    title: "AI Content Marketing",
    category: "AI Tools",
    shortDesc: "Strategic, SEO-driven blogs, posts, and emails in your brand voice — published consistently without the headache.",
    iconType: "img",
    iconSrc: "/icons/icon-content.png",
    bullets: ["Blog posts, captions, emails & ad scripts", "SEO-optimized from first draft", "One blog → 5 LinkedIn posts + email + Reel script"],
    headline: "Publish High-Ranking Blogs, Posts & Emails — All Powered by AI",
    subheading: "Stop staring at blank pages. Our AI researches, writes, and optimizes content that drives traffic, builds trust, and converts readers into customers.",
    problem: {
      heading: "Most Small Businesses Can't Produce Even One Blog Post Per Week",
      text: "Content marketing works — but only if you publish consistently. The reality is most small businesses struggle to produce one blog post per week, let alone social captions, email newsletters, and landing pages. Hiring writers is expensive. Doing it yourself burns hours you don't have. Our AI Content Marketing doesn't just generate words — it creates strategic, SEO-driven content tailored to your brand voice, your audience, and your goals.",
    },
    howItWorks: [
      { step: "01", title: "Set Your Brand Voice", desc: "Upload past emails, blogs, or simply describe your tone — professional, casual, witty, or authoritative. Our AI learns how you sound." },
      { step: "02", title: "Choose Your Content Type", desc: "Select from blog posts, landing pages, social captions, email sequences, product descriptions, or complete ad scripts." },
      { step: "03", title: "Give a Topic or Keyword", desc: "Type in a subject, or let our AI Keyword Research Tool suggest high-value topics your competitors are missing." },
      { step: "04", title: "Generate & Refine", desc: "Within seconds, receive fully structured, ready-to-publish content. Edit with our built-in editor or regenerate until it's perfect." },
    ],
    features: [
      { title: "SEO-Optimized from the Start", desc: "Every piece includes internal heading structure, meta descriptions, and natural keyword placement — no separate SEO tool needed." },
      { title: "Fact-Checked & Plagiarism-Free", desc: "Our AI cross-references reliable sources and runs real-time plagiarism checks — original content you can publish immediately." },
      { title: "Multichannel Adaptation", desc: "Turn one blog post into five LinkedIn posts, three X threads, an email newsletter, and a Reel script — with one click." },
      { title: "Content Repurposing Engine", desc: "Feed a video transcript or podcast episode. Our AI extracts key points and rewrites them into fresh blog content." },
      { title: "Performance Tracking", desc: "See which headlines, formats, and topics drive the most engagement. AI learns from results and improves future content." },
      { title: "Direct Campaign Integration", desc: "Finished content flows directly into scheduled campaigns across Google, Meta, and Snapchat." },
    ],
    roi: {
      heading: "One Blog Post = Organic Traffic for Months",
      text: "One blog post earns organic traffic for months. One email sequence drives direct sales. One social post generates free reach. With traditional methods, producing all three takes days. With our AI, it takes minutes. Publish more, rank higher, convert better — without adding headcount. That's the compounding ROI of consistent AI-powered content.",
    },
    integrations: ["AI Keyword Research Tool", "AI SEO", "AI Image Generator for Ads", "AI Reels Generator"],
  },
  {
    slug: "image-generator",
    title: "AI Image Generator",
    category: "AI Tools",
    shortDesc: "Brand-consistent, platform-ready ad creatives generated in seconds — no design skills required.",
    iconType: "img",
    iconSrc: "/icons/icon-sparkle.png",
    bullets: ["Google, Meta & Snapchat format outputs", "Brand colors, logo & font built in", "Performance-aware design trained on millions of ads"],
    headline: "Generate High-Converting Ad Creatives in Seconds — No Design Skills Needed",
    subheading: "Stop wasting hours on Photoshop or hiring expensive designers. Our AI crafts stunning, brand-consistent visuals for Google, Meta, and Snapchat ads automatically.",
    problem: {
      heading: "Manual Design Creates Bottlenecks That Slow Down Testing and Scaling",
      text: "The difference between a click and a scroll-past is often just one image. But creating fresh, professional ad visuals for every campaign is time-consuming and costly. Manual design creates bottlenecks, slows down testing, and makes it hard to scale. With traditional design, each test takes days and dollars. With our AI Image Generator, you can test 10 different visuals in the time it takes to brief one designer.",
    },
    howItWorks: [
      { step: "01", title: "Upload Your Brand Assets", desc: "Provide your logo, primary brand colors, and any style preferences. Our AI learns your visual identity instantly." },
      { step: "02", title: "Describe Your Offer", desc: "Tell us what you're promoting — or let our AI analyze your website and generate relevant visual concepts automatically." },
      { step: "03", title: "Choose Ad Format & Platform", desc: "Select Google Display Ads, Meta feed or stories, or Snapchat Ads. Our AI automatically resizes and optimizes for each platform's specifications." },
      { step: "04", title: "Generate & Download", desc: "Within seconds, receive multiple high-resolution ad creatives. Pick the best, or let our A/B testing engine run them all to find the winner." },
    ],
    features: [
      { title: "Brand Consistency Guaranteed", desc: "Every image automatically incorporates your logo, color palette, and font preferences — no random AI generations." },
      { title: "Platform-Optimized Outputs", desc: "One click generates Google (square, landscape), Meta (1:1, 4:5, 9:16), and Snapchat (vertical full-screen) versions simultaneously." },
      { title: "Performance-Aware Design", desc: "Trained on millions of high-performing ad creatives — knows what colors, layouts, and text placements drive clicks in your industry." },
      { title: "Real-Time Editing", desc: "Adjust colors, replace elements, or regenerate variations without starting over — no design software needed." },
      { title: "No Watermark, No Hidden Fees", desc: "Everything you generate is yours to use immediately across all paid campaigns." },
      { title: "Direct Campaign Deployment", desc: "Deploy new images directly into active Google, Meta, or Snapchat campaigns with one click." },
    ],
    roi: {
      heading: "Higher Engagement, Lower Ad Fatigue, Constant Fresh Assets",
      text: "Testing ad creatives is the fastest way to lower your cost per click and increase conversion rates. With our AI Image Generator, you get higher engagement, lower ad fatigue, and a constant stream of fresh assets — all without increasing your workload. Stop letting design be your bottleneck.",
    },
    integrations: ["AI Keyword Research Tool", "AI Reels Generator", "All Ad Campaign Tools"],
  },
  {
    slug: "reels-generator",
    title: "AI Reels Generator",
    category: "AI Tools",
    shortDesc: "Turn product photos and brand assets into scroll-stopping short videos for Reels, TikTok & Shorts.",
    iconType: "img",
    iconSrc: "/icons/icon-performance.png",
    bullets: ["Reels, TikTok & YouTube Shorts ready", "Auto-captions, music & transitions included", "Batch generate 5–20 variations at once"],
    headline: "Create Scroll-Stopping Short Videos for Reels, TikTok & YouTube Shorts — In Minutes",
    subheading: "No video editing experience? No problem. Our AI turns your product photos, logos, and text into high-engagement reels that drive views and sales.",
    problem: {
      heading: "Short-Form Video Is No Longer Optional — But Producing It Weekly Is Unsustainable Manually",
      text: "Instagram Reels, TikTok, and YouTube Shorts now dominate organic and paid reach. But producing professional, on-brand reels every week is expensive and time-consuming. Most small businesses simply can't keep up. Our AI Reels Generator transforms your existing assets — logos, product images, website copy — into platform-optimized vertical videos. No cameras. No editing software. No learning curve.",
    },
    howItWorks: [
      { step: "01", title: "Provide Your Assets", desc: "Upload your logo, brand colors, product photos, or a text description of your offer. Our AI instantly understands your visual identity." },
      { step: "02", title: "Choose Your Reel Style", desc: "Pick from templates: product showcase, testimonial slider, educational tip, sale announcement, or brand story — each optimized for retention and engagement." },
      { step: "03", title: "Let AI Write the Script", desc: "Not sure what to say? Our AI generates short, punchy scripts and captions tailored to your industry. Edit or use as-is." },
      { step: "04", title: "Auto-Generate & Export", desc: "Within seconds, receive a fully edited 9:16 vertical video with background music, transitions, text overlays, and your logo — ready to post." },
    ],
    features: [
      { title: "One-Click Platform Optimization", desc: "Export directly for Instagram Reels, TikTok, YouTube Shorts, and Snapchat Spotlight — aspect ratios and file sizes auto-adjusted." },
      { title: "Automated Captions & Subtitles", desc: "Over 85% of short videos are watched without sound. Animated captions burned in automatically — increasing watch time and accessibility." },
      { title: "Brand Consistency", desc: "Every video uses your logo, fonts, and color palette — no random styles that confuse your audience." },
      { title: "Batch Generation", desc: "Create 5, 10, or 20 variations of a single reel with different hooks, music, or endings — test which one performs best without extra work." },
      { title: "Direct Ad Deployment", desc: "Use generated reels as video ads for Meta, TikTok, or YouTube directly from WorldDigital.ai." },
    ],
    roi: {
      heading: "A Week's Worth of Videos in Under 30 Minutes",
      text: "Short videos generate the highest engagement rates of any content format — but consistency is key. Posting one reel a week won't move the needle. You need volume and variety. Our AI Reels Generator lets you produce a week's worth of videos in under 30 minutes. More content means more reach, more followers, and more conversions — without burning out your team or budget.",
    },
    integrations: ["AI Image Generator for Ads", "AI Keyword Research Tool", "All Ad Campaign Tools"],
  },
];

export function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
}
