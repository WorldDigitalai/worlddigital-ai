/**
 * GoogleTagManager — GTM-P7FV5QN6
 *
 * Server component. No "use client" needed.
 *
 * Next.js App Router approach:
 *  - <Script strategy="beforeInteractive"> is injected into <head> by the
 *    framework, even when rendered inside <body> in the layout.
 *  - The <noscript> fallback is rendered by the layout as the very first
 *    child of <body>.
 *
 * Usage in layout.tsx:
 *   import { GTMScript, GTMNoScript } from "@/components/GoogleTagManager";
 *   <body>
 *     <GTMNoScript />          ← first child of <body>
 *     <GTMScript />            ← injected into <head> by Next.js
 *     ...rest of app
 *   </body>
 */

import Script from "next/script";

export const GTM_ID = "GTM-P7FV5QN6";

/**
 * GTMScript — placed anywhere in the layout body; Next.js injects it into
 * <head> because strategy="beforeInteractive".
 */
export function GTMScript() {
  return (
    <Script
      id="gtm-script"
      strategy="beforeInteractive"
    >{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}</Script>
  );
}

/**
 * GTMNoScript — must be the very first child of <body> in the layout.
 * Renders the <noscript> iframe fallback for environments without JS.
 */
export function GTMNoScript() {
  return (
    <noscript>
      {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
