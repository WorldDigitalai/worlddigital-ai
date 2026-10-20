/**
 * GET /api/social/debug
 * Safe social integration status report.
 * Never exposes full credential values — only masked previews and boolean flags.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { testMetaConnection }        from "../services/social/meta.js";
import { testYouTubeConnection }     from "../services/social/youtube.js";
import { testLinkedInConnection }    from "../services/social/linkedin.js";
import { testXConnection }           from "../services/social/x.js";
import { testSnapchatConnection }    from "../services/social/snapchat.js";
import { testTikTokSocialConnection} from "../services/social/tiktok.js";
import { logger }                    from "../lib/logger.js";

const router = Router();

router.get("/social/debug", async (_req: Request, res: Response) => {
  logger.info("Social integration debug check requested");

  const [metaStatus, youtubeStatus, linkedinStatus, xStatus, snapchatStatus, tiktokStatus] =
    await Promise.all([
      testMetaConnection().catch((e): ReturnType<typeof testMetaConnection> =>
        Promise.resolve({
          configured: false, tokenValid: false, tokenMasked: null,
          pagesFound: false, pageName: null, instagramBusinessFound: false,
          canPostFacebook: false, canPostInstagram: false,
          issues: [e instanceof Error ? e.message : "Meta check failed"],
        })
      ),
      testYouTubeConnection().catch((e): ReturnType<typeof testYouTubeConnection> =>
        Promise.resolve({
          apiKeyConfigured: false, apiKeyValid: false, apiKeyMasked: null,
          oauthConfigured: false, uploadReady: false,
          issues: [e instanceof Error ? e.message : "YouTube check failed"],
        })
      ),
      testLinkedInConnection().catch((e): ReturnType<typeof testLinkedInConnection> =>
        Promise.resolve({
          clientConfigured: false, accessTokenConfigured: false, accessTokenMasked: null,
          organizationConfigured: false, postingReady: false,
          tokenExpiresAt: null, daysUntilExpiry: null, tokenExpiringSoon: false,
          tokenRefreshAvailable: false, tokenRefreshFailed: false, autoRefreshed: false,
          issues: [e instanceof Error ? e.message : "LinkedIn check failed"],
        })
      ),
      testXConnection().catch((e): ReturnType<typeof testXConnection> =>
        Promise.resolve({
          configured: false, credentialsValid: false, userHandle: null,
          readWriteAccess: false, postingReady: false,
          issues: [e instanceof Error ? e.message : "X check failed"],
        })
      ),
      testSnapchatConnection().catch((e): ReturnType<typeof testSnapchatConnection> =>
        Promise.resolve({
          clientIdSet: false, clientSecretSet: false, accessTokenSet: false,
          refreshTokenSet: false, adAccountIdSet: false,
          accessTokenMasked: null, refreshTokenMasked: null,
          clientConfigured: false, marketingApiReady: false,
          tokenExpired: false, canRefresh: false,
          issues: [e instanceof Error ? e.message : "Snapchat check failed"],
        })
      ),
      testTikTokSocialConnection().catch((e): ReturnType<typeof testTikTokSocialConnection> =>
        Promise.resolve({
          clientKeySet: false, accessTokenSet: false, openIdSet: false,
          accessTokenMasked: null, postingReady: false, awaitingApproval: false,
          issues: [e instanceof Error ? e.message : "TikTok check failed"],
        })
      ),
    ]);

  const summary = {
    readyToPost: [
      metaStatus.canPostFacebook   && "facebook",
      metaStatus.canPostInstagram  && "instagram",
      xStatus.postingReady         && "x",
      linkedinStatus.postingReady  && "linkedin",
      snapchatStatus.marketingApiReady && "snapchat_ads",
      tiktokStatus.postingReady    && "tiktok",
    ].filter(Boolean),
    needsOAuth: [
      !linkedinStatus.accessTokenConfigured && linkedinStatus.clientConfigured && "linkedin",
      !youtubeStatus.oauthConfigured && youtubeStatus.apiKeyValid && "youtube",
      !xStatus.configured && "x",
      !tiktokStatus.accessTokenSet && tiktokStatus.clientKeySet && "tiktok",
    ].filter(Boolean),
    needsAppApproval: [
      tiktokStatus.awaitingApproval && "tiktok",
    ].filter(Boolean),
    notConfigured: [
      !metaStatus.configured          && "meta",
      !snapchatStatus.clientConfigured && "snapchat",
    ].filter(Boolean),
    tokenExpiringSoon: [
      linkedinStatus.tokenExpiringSoon && `linkedin (${linkedinStatus.daysUntilExpiry ?? "?"} days)`,
    ].filter(Boolean),
  };

  const dryRunEnabled = process.env["SOCIAL_DRY_RUN"] === "true";

  res.json({
    checked_at: new Date().toISOString(),
    dry_run_mode: dryRunEnabled,
    summary,
    meta: {
      configured:              metaStatus.configured,
      tokenValid:              metaStatus.tokenValid,
      tokenMasked:             metaStatus.tokenMasked,
      pagesFound:              metaStatus.pagesFound,
      pageName:                metaStatus.pageName,
      instagramBusinessFound:  metaStatus.instagramBusinessFound,
      canPostFacebook:         metaStatus.canPostFacebook,
      canPostInstagram:        metaStatus.canPostInstagram,
      issues:                  metaStatus.issues,
    },
    tiktok: {
      clientKeySet:       tiktokStatus.clientKeySet,
      accessTokenSet:     tiktokStatus.accessTokenSet,
      openIdSet:          tiktokStatus.openIdSet,
      accessTokenMasked:  tiktokStatus.accessTokenMasked,
      postingReady:       tiktokStatus.postingReady,
      awaitingApproval:   tiktokStatus.awaitingApproval,
      issues:             tiktokStatus.issues,
      note:               "TikTok requires Content Posting API approval from TikTok before video.publish scope is active.",
    },
    youtube: {
      apiKeyConfigured: youtubeStatus.apiKeyConfigured,
      apiKeyValid:      youtubeStatus.apiKeyValid,
      apiKeyMasked:     youtubeStatus.apiKeyMasked,
      oauthConfigured:  youtubeStatus.oauthConfigured,
      uploadReady:      youtubeStatus.uploadReady,
      issues:           youtubeStatus.issues,
    },
    linkedin: {
      clientConfigured:      linkedinStatus.clientConfigured,
      accessTokenConfigured: linkedinStatus.accessTokenConfigured,
      accessTokenMasked:     linkedinStatus.accessTokenMasked,
      organizationConfigured: linkedinStatus.organizationConfigured,
      postingReady:          linkedinStatus.postingReady,
      tokenExpiresAt:        linkedinStatus.tokenExpiresAt,
      daysUntilExpiry:       linkedinStatus.daysUntilExpiry,
      tokenExpiringSoon:     linkedinStatus.tokenExpiringSoon,
      tokenRefreshAvailable: linkedinStatus.tokenRefreshAvailable,
      tokenRefreshFailed:    linkedinStatus.tokenRefreshFailed,
      autoRefreshed:         linkedinStatus.autoRefreshed,
      issues:                linkedinStatus.issues,
    },
    x: {
      configured:     xStatus.configured,
      credentialsValid: xStatus.credentialsValid,
      userHandle:     xStatus.userHandle,
      readWriteAccess: xStatus.readWriteAccess,
      postingReady:   xStatus.postingReady,
      issues:         xStatus.issues,
    },
    snapchat: {
      note:            "Snapchat does not offer an organic content posting API. This integration covers the Snapchat Marketing API for paid ad campaigns only.",
      adsSupported:    true,
      organicPosting:  false,
      clientIdSet:         snapchatStatus.clientIdSet,
      clientSecretSet:     snapchatStatus.clientSecretSet,
      accessTokenSet:      snapchatStatus.accessTokenSet,
      refreshTokenSet:     snapchatStatus.refreshTokenSet,
      adAccountIdSet:      snapchatStatus.adAccountIdSet,
      accessTokenMasked:   snapchatStatus.accessTokenMasked,
      refreshTokenMasked:  snapchatStatus.refreshTokenMasked,
      clientConfigured:    snapchatStatus.clientConfigured,
      marketingApiReady:   snapchatStatus.marketingApiReady,
      tokenExpired:        snapchatStatus.tokenExpired,
      canRefresh:          snapchatStatus.canRefresh,
      issues:              snapchatStatus.issues,
      oauthSetupUrl:       "/admin/integrations/snapchat",
    },
  });
});

export default router;
