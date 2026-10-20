/**
 * Canonical secret alias map for all integrations.
 *
 * Priority order: first candidate checked first — primary/canonical name first,
 * then legacy/alternate names. First present non-empty value wins in resolveEnv().
 */

export interface AliasGroup {
  label: string;
  candidates: string[];
  required: boolean;
  hint?: string;
}

export interface IntegrationAliases {
  id: string;
  name: string;
  groups: AliasGroup[];
}

export const SECRET_ALIASES: IntegrationAliases[] = [
  // ── Meta / Facebook ────────────────────────────────────────────────────────
  {
    id: "meta",
    name: "Meta (Facebook + Instagram)",
    groups: [
      {
        label: "Page Access Token",
        candidates: [
          "META_ACCESS_TOKEN",
          "FB_ACCESS_TOKEN",
          "FACEBOOK_ACCESS_TOKEN",
          "FB_PAGE_ACCESS_TOKEN",
          "META_PAGE_ACCESS_TOKEN",
        ],
        required: true,
        hint: "Long-lived page access token from Meta Business Suite → Settings → Advanced → Page Access Tokens",
      },
      {
        label: "Facebook Page ID",
        candidates: ["FB_PAGE_ID", "FACEBOOK_PAGE_ID", "META_PAGE_ID"],
        required: true,
        hint: "Found in your Facebook Page → About → Page transparency → Page ID",
      },
      {
        label: "Instagram Business Account ID",
        candidates: [
          "INSTAGRAM_BUSINESS_ACCOUNT_ID",
          "IG_BUSINESS_ACCOUNT_ID",
          "INSTAGRAM_ACCOUNT_ID",
          "IG_ACCOUNT_ID",
        ],
        required: false,
        hint: "Facebook Graph API: GET /me/accounts → Instagram Business Account",
      },
      {
        label: "Meta Ad Account ID",
        candidates: ["FB_AD_ACCOUNT_ID", "META_AD_ACCOUNT_ID", "FACEBOOK_AD_ACCOUNT_ID"],
        required: false,
        hint: "Format: act_XXXXXXXXXX — found in Meta Ads Manager",
      },
      {
        label: "Meta API Version",
        candidates: ["META_API_VERSION"],
        required: false,
        hint: "Default: v19.0 — update when Meta releases a new API version",
      },
    ],
  },

  // ── Snapchat ───────────────────────────────────────────────────────────────
  {
    id: "snapchat",
    name: "Snapchat",
    groups: [
      {
        label: "Client ID",
        candidates: ["SNAPCHAT_CLIENT_ID", "SNAP_CLIENT_ID"],
        required: true,
        hint: "OAuth app Client ID from Snapchat Business → Marketing API",
      },
      {
        label: "Client Secret",
        candidates: ["SNAP_CLIENT_SECRET", "SNAPCHAT_CLIENT_SECRET"],
        required: true,
        hint: "OAuth app Client Secret from Snapchat Business → Marketing API",
      },
      {
        label: "Access Token",
        candidates: ["SNAP_ACCESS_TOKEN", "SNAPCHAT_ACCESS_TOKEN"],
        required: true,
        hint: "Short-lived access token. Use Admin → Integrations → Snapchat to refresh via SNAP_REFRESH_TOKEN",
      },
      {
        label: "Refresh Token",
        candidates: ["SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN"],
        required: false,
        hint: "Used to auto-refresh the access token when it expires",
      },
      {
        label: "Ad Account ID",
        candidates: ["SNAP_AD_ACCOUNT_ID", "SNAPCHAT_AD_ACCOUNT_ID"],
        required: false,
        hint: "Snapchat Ads Manager → Settings → Ad Account ID",
      },
      {
        label: "Redirect URI",
        candidates: ["SNAP_REDIRECT_URI", "SNAPCHAT_REDIRECT_URI"],
        required: false,
        hint: "Must match URI registered in Snapchat app settings",
      },
    ],
  },

  // ── Google Ads ─────────────────────────────────────────────────────────────
  {
    id: "google",
    name: "Google Ads",
    groups: [
      {
        label: "OAuth Client ID",
        candidates: ["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID"],
        required: true,
        hint: "From Google Cloud Console → APIs & Services → Credentials",
      },
      {
        label: "OAuth Client Secret",
        candidates: ["GOOGLE_CLIENT_SECRET", "GOOGLE_OAUTH_CLIENT_SECRET"],
        required: true,
        hint: "From Google Cloud Console → APIs & Services → Credentials",
      },
      {
        label: "Developer Token",
        candidates: [
          "GOOGLE_DEVELOPER_TOKEN",
          "GOOGLE_ADS_DEVELOPER_TOKEN",
          "GOOGLEADS_DEVELOPER_TOKEN",
        ],
        required: true,
        hint: "Google Ads Manager → Tools → API Center → Developer Token",
      },
      {
        label: "MCC Refresh Token",
        candidates: [
          "MCC_REFRESH_TOKEN",
          "GOOGLE_MCC_REFRESH_TOKEN",
          "GOOGLE_ADS_REFRESH_TOKEN",
          "GOOGLE_REFRESH_TOKEN",
        ],
        required: true,
        hint: "OAuth refresh token for your Google Ads MCC account",
      },
      {
        label: "MCC Customer ID",
        candidates: ["MCC_CUSTOMER_ID", "GOOGLE_MCC_CUSTOMER_ID", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLEADS_CUSTOMER_ID"],
        required: false,
        hint: "Manager account customer ID (without dashes)",
      },
      {
        label: "Client Customer ID",
        candidates: ["CLIENT_CUSTOMER_ID", "GOOGLE_ADS_CLIENT_CUSTOMER_ID"],
        required: false,
        hint: "Managed account customer ID (without dashes)",
      },
      {
        label: "Redirect URI",
        candidates: ["GOOGLE_REDIRECT_URI"],
        required: false,
        hint: "Set to https://<domain>/api/v1/auth/google/callback",
      },
    ],
  },

  // ── Google Search Console / SEO ────────────────────────────────────────────
  {
    id: "googleSearch",
    name: "Google Search Console",
    groups: [
      {
        label: "Site Verification Token",
        candidates: ["GOOGLE_SITE_VERIFICATION", "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"],
        required: false,
        hint: "Google Search Console → Settings → Ownership verification → HTML tag → content attribute value",
      },
      {
        label: "Search Console API Key",
        candidates: ["GOOGLE_SEARCH_CONSOLE_KEY"],
        required: false,
        hint: "Google Cloud Console → APIs & Services → Credentials → API Key (Search Console API enabled)",
      },
    ],
  },

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  {
    id: "linkedin",
    name: "LinkedIn",
    groups: [
      {
        label: "OAuth Client ID",
        candidates: ["LINKEDIN_CLIENT_ID", "LINKEDIN_APP_ID"],
        required: true,
        hint: "LinkedIn Developer Portal → App → Auth → Client ID",
      },
      {
        label: "OAuth Client Secret",
        candidates: ["LINKEDIN_CLIENT_SECRET", "LINKEDIN_APP_SECRET"],
        required: true,
        hint: "LinkedIn Developer Portal → App → Auth → Client Secret",
      },
      {
        label: "Access Token",
        candidates: [
          "LINKEDIN_ACCESS_TOKEN",
          "LINKEDIN_TOKEN",
          "LINKEDIN_OAUTH_TOKEN",
          "LINKEDIN_PAGE_ACCESS_TOKEN",
        ],
        required: true,
        hint: "Long-lived token with r_liteprofile, r_emailaddress, w_member_social scopes — expires in 60 days",
      },
      {
        label: "Organization ID",
        candidates: [
          "LINKEDIN_ORGANIZATION_ID",
          "LINKEDIN_COMPANY_ID",
          "LINKEDIN_PAGE_ID",
          "LINKEDIN_ORG_ID",
        ],
        required: true,
        hint: "Your LinkedIn Company Page ID (digits only) — found in the URL: linkedin.com/company/<ID>",
      },
    ],
  },

  // ── X (Twitter) ────────────────────────────────────────────────────────────
  {
    id: "x",
    name: "X (Twitter)",
    groups: [
      {
        label: "API Key (Consumer Key)",
        candidates: [
          "X_API_KEY",
          "TWITTER_API_KEY",
          "X_CONSUMER_KEY",
          "TWITTER_CONSUMER_KEY",
        ],
        required: true,
        hint: "X Developer Portal → Your App → Keys and Tokens → API Key",
      },
      {
        label: "API Secret (Consumer Secret)",
        candidates: [
          "X_API_SECRET",
          "TWITTER_API_SECRET",
          "X_CONSUMER_SECRET",
          "TWITTER_CONSUMER_SECRET",
        ],
        required: true,
        hint: "X Developer Portal → Your App → Keys and Tokens → API Key Secret",
      },
      {
        label: "Access Token",
        candidates: ["X_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN"],
        required: true,
        hint: "X Developer Portal → Your App → Keys and Tokens → Access Token",
      },
      {
        label: "Access Token Secret",
        candidates: ["X_ACCESS_TOKEN_SECRET", "TWITTER_ACCESS_TOKEN_SECRET"],
        required: true,
        hint: "X Developer Portal → Your App → Keys and Tokens → Access Token Secret",
      },
    ],
  },

  // ── YouTube ────────────────────────────────────────────────────────────────
  {
    id: "youtube",
    name: "YouTube",
    groups: [
      {
        label: "API Key",
        candidates: ["YOUTUBE_API_KEY", "GOOGLE_YOUTUBE_API_KEY", "GOOGLE_API_KEY"],
        required: false,
        hint: "Google Cloud Console → APIs & Services → Credentials → API Key (YouTube Data API v3 enabled)",
      },
      {
        label: "OAuth Client ID",
        candidates: ["YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID"],
        required: false,
        hint: "Google Cloud Console → Credentials → OAuth 2.0 Client ID",
      },
      {
        label: "OAuth Client Secret",
        candidates: ["YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"],
        required: false,
        hint: "Google Cloud Console → Credentials → OAuth 2.0 Client Secret",
      },
      {
        label: "Refresh Token",
        candidates: [
          "YOUTUBE_REFRESH_TOKEN",
          "GOOGLE_YOUTUBE_REFRESH_TOKEN",
          "GOOGLE_REFRESH_TOKEN",
        ],
        required: false,
        hint: "OAuth refresh token with youtube.upload scope",
      },
      {
        label: "Channel ID",
        candidates: ["YOUTUBE_CHANNEL_ID", "GOOGLE_YOUTUBE_CHANNEL_ID"],
        required: false,
        hint: "Your YouTube channel ID (starts with UC...)",
      },
    ],
  },

  // ── TikTok ─────────────────────────────────────────────────────────────────
  {
    id: "tiktok",
    name: "TikTok",
    groups: [
      {
        label: "Site Verification Token",
        candidates: [
          "TIKTOK_SITE_VERIFICATION",
          "TIKTOK_DEVELOPERS_SITE_VERIFICATION",
          "TIKTOK_VERIFICATION",
          "TIKTOK_VERIFICATION_CODE",
        ],
        required: false,
        hint: "From TikTok for Business → Tools → Domain Verification",
      },
      {
        label: "Access Token",
        candidates: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_OAUTH_TOKEN"],
        required: false,
        hint: "Requires TikTok Marketing API approval. Apply at ads.tiktok.com/marketing_api",
      },
      {
        label: "Client Key / App ID",
        candidates: ["TIKTOK_CLIENT_KEY", "TIKTOK_APP_ID", "TIKTOK_CLIENT_ID"],
        required: false,
        hint: "TikTok Developer Portal → My Apps → App ID / Client Key",
      },
      {
        label: "Client Secret",
        candidates: ["TIKTOK_CLIENT_SECRET"],
        required: false,
        hint: "TikTok Developer Portal → My Apps → Client Secret",
      },
      {
        label: "Advertiser ID",
        candidates: ["TIKTOK_ADVERTISER_ID"],
        required: false,
        hint: "TikTok Ads Manager → Account ID",
      },
    ],
  },

  // ── Resend (Email) ─────────────────────────────────────────────────────────
  {
    id: "resend",
    name: "Resend (Email)",
    groups: [
      {
        label: "API Key",
        candidates: ["RESEND_API_KEY"],
        required: true,
        hint: "Resend dashboard → API Keys → Create API Key — use 'Full access' or restrict to Sending access",
      },
    ],
  },

  // ── Stripe ─────────────────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    groups: [
      {
        label: "Secret Key",
        candidates: ["STRIPE_SECRET_KEY", "STRIPE_SK"],
        required: true,
        hint: "Stripe Dashboard → Developers → API Keys → Secret key (sk_live_... or sk_test_...)",
      },
      {
        label: "Webhook Secret",
        candidates: ["STRIPE_WEBHOOK_SECRET", "STRIPE_WH_SECRET"],
        required: true,
        hint: "Stripe Dashboard → Developers → Webhooks → Signing secret (whsec_...)",
      },
      {
        label: "Publishable Key",
        candidates: [
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
          "STRIPE_PUBLISHABLE_KEY",
          "VITE_STRIPE_PUBLISHABLE_KEY",
        ],
        required: false,
        hint: "Stripe Dashboard → Developers → API Keys → Publishable key (pk_live_...)",
      },
    ],
  },

  // ── AI / OpenAI ────────────────────────────────────────────────────────────
  {
    id: "ai",
    name: "AI (OpenAI)",
    groups: [
      {
        label: "API Key",
        candidates: ["CHATGPT_IMAGE_LATEST", "CHAT_BOT", "OPENAI_API_KEY", "AI_API_KEY"],
        required: true,
        hint: "OpenAI API key. CHATGPT_IMAGE_LATEST is the primary key — used for all AI features including chat, captions, images, and content generation.",
      },
    ],
  },

  // ── AWS / S3 ───────────────────────────────────────────────────────────────
  {
    id: "aws",
    name: "AWS / S3",
    groups: [
      {
        label: "Access Key ID",
        candidates: ["AWS_ACCESS_KEY_ID"],
        required: false,
        hint: "AWS IAM → Users → Security credentials → Access keys",
      },
      {
        label: "Secret Access Key",
        candidates: ["AWS_SECRET_ACCESS_KEY"],
        required: false,
        hint: "Generated alongside Access Key ID",
      },
      {
        label: "S3 Bucket Name",
        candidates: ["S3_BUCKET_NAME", "AWS_S3_BUCKET"],
        required: false,
        hint: "The name of your S3 bucket for media uploads",
      },
      {
        label: "AWS Region",
        candidates: ["AWS_REGION", "AWS_DEFAULT_REGION"],
        required: false,
        hint: "e.g. us-east-1",
      },
    ],
  },

  // ── App Config ─────────────────────────────────────────────────────────────
  {
    id: "app",
    name: "App Config",
    groups: [
      {
        label: "JWT Secret",
        candidates: ["ACCESS_TOKEN_SECRET", "JWT_SECRET"],
        required: true,
        hint: "Long random string used to sign user JWTs — never rotate without invalidating all sessions",
      },
      {
        label: "MongoDB URI",
        candidates: ["MONGODB_URI", "MONGO_URI", "DATABASE_URL"],
        required: true,
        hint: "MongoDB Atlas connection string (mongodb+srv://...)",
      },
      {
        label: "Admin Password",
        candidates: ["ADMIN_PASSWORD"],
        required: true,
        hint: "Password for /admin login",
      },
      {
        label: "Frontend URL",
        candidates: ["FRONTEND_URL", "CLIENT_URL", "NEXT_PUBLIC_SITE_URL"],
        required: false,
        hint: "Production domain, e.g. https://worlddigital.ai",
      },
    ],
  },
];
