import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description:
    "worlddigital.ai Cookies Policy — how we use cookies and similar tracking technologies on our platform.",
  alternates: { canonical: "https://worlddigital.ai/cookies-policy", languages: { "en-US": "https://worlddigital.ai/cookies-policy", "en-CA": "https://worlddigital.ai/cookies-policy", "x-default": "https://worlddigital.ai/cookies-policy" } },
};

const UPDATED = "April 1, 2025";

const cookieTypes = [
  {
    name: "Strictly Necessary",
    description:
      "These cookies are essential for the platform to function correctly. They enable core features like user authentication, session management, and security. You cannot opt out of these cookies.",
    examples: ["Session token", "CSRF protection token", "Cookie consent preference"],
  },
  {
    name: "Performance & Analytics",
    description:
      "These cookies help us understand how visitors interact with our platform by collecting aggregated, anonymous information. This helps us improve page performance and user experience.",
    examples: ["Page view counts", "Feature usage metrics", "Error tracking"],
  },
  {
    name: "Functional",
    description:
      "Functional cookies allow the platform to remember your preferences and personalize your experience, such as language settings, dashboard layout, and notification preferences.",
    examples: ["UI preferences", "Dashboard layout", "Notification settings"],
  },
  {
    name: "Marketing & Targeting",
    description:
      "These cookies may be used to serve you relevant advertising and track marketing campaign performance. They are placed by third-party advertising networks we partner with.",
    examples: ["Google Analytics", "Meta Pixel", "Snapchat Pixel"],
  },
];

export default function CookiesPolicyPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="pt-24 pb-12 px-6"
        style={{ background: "linear-gradient(160deg, #FDE8E2 0%, #E8F4FD 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="eyebrow-line mb-4">Legal</div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Cookies Policy
          </h1>
          <p className="text-gray-500 text-sm">Last updated: {UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-2xl mx-auto">
          <div className="space-y-10 text-gray-600 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">What are cookies?</h2>
              <p>
                Cookies are small text files placed on your device by websites you visit. They are widely
                used to make websites work efficiently and to provide information to website owners.
                worlddigital.ai uses cookies and similar technologies (such as local storage and pixel tags)
                to operate our platform and improve your experience.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-5">Types of cookies we use</h2>
              <div className="space-y-4">
                {cookieTypes.map(({ name, description, examples }) => (
                  <div
                    key={name}
                    className="rounded-xl p-5"
                    style={{
                      background: "white",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{description}</p>
                    <div className="flex flex-wrap gap-2">
                      {examples.map((ex) => (
                        <span
                          key={ex}
                          className="text-xs px-2.5 py-1 rounded-full text-gray-600"
                          style={{ background: "rgba(66,133,199,0.08)", border: "1px solid rgba(66,133,199,0.15)" }}
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Third-party cookies</h2>
              <p>
                Some cookies on our platform are set by third-party services we use, such as Google
                Analytics, the Meta Pixel, and Snapchat Pixel. These third parties have their own privacy
                policies governing their use of cookies. We recommend reviewing their policies for more
                information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">How to manage cookies</h2>
              <p className="mb-3">
                You can control cookies through your browser settings. Most browsers allow you to refuse
                cookies or delete cookies that have already been set. Be aware that disabling cookies may
                affect the functionality of our platform.
              </p>
              <p>
                To learn more about managing cookies in your browser, visit the relevant help pages:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-3">
                {[
                  { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
                  { label: "Mozilla Firefox", href: "https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" },
                  { label: "Safari", href: "https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" },
                  { label: "Microsoft Edge", href: "https://support.microsoft.com/help/4027947/microsoft-edge-delete-cookies" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#C13A2A" }}
                      className="hover:underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Your consent</h2>
              <p>
                By continuing to use our platform after we display our cookie notice, you consent to our
                use of cookies as described in this policy. You may withdraw consent at any time by
                adjusting your browser settings or contacting us directly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Changes to this policy</h2>
              <p>
                We may update this Cookies Policy from time to time. We will notify you of significant
                changes by posting the new policy on this page with an updated revision date. We recommend
                reviewing this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Contact us</h2>
              <p>
                If you have questions about our use of cookies, contact us at:{" "}
                <a href="mailto:privacy@worlddigital.ai" style={{ color: "#C13A2A" }} className="underline">
                  privacy@worlddigital.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
