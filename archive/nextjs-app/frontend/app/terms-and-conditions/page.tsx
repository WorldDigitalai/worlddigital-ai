import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "WorldDigital.ai Terms and Conditions — the rules and agreements governing use of our platform.",
  alternates: { canonical: "https://worlddigital.ai/terms-and-conditions", languages: { "en-US": "https://worlddigital.ai/terms-and-conditions", "en-CA": "https://worlddigital.ai/terms-and-conditions", "x-default": "https://worlddigital.ai/terms-and-conditions" } },
};

const UPDATED = "April 1, 2025";

export default function TermsPage() {
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
            Terms and Conditions
          </h1>
          <p className="text-gray-500 text-sm">Last updated: {UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-2xl mx-auto">
          <div className="space-y-10 text-gray-600 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using WorldDigital.ai&apos;s platform and services, you agree to be bound by
                these Terms and Conditions. If you do not agree, you may not use our services. These terms
                constitute a legally binding agreement between you and WorldDigital.ai.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description of Services</h2>
              <p>
                WorldDigital.ai provides an AI-powered digital marketing automation platform that manages
                advertising campaigns on third-party platforms including Google, Meta, and Snapchat on your
                behalf. You retain full ownership of your ad accounts and campaign data at all times.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Account Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must provide accurate and complete information during registration.</li>
                <li>You must notify us immediately of any unauthorized access to your account.</li>
                <li>You are responsible for all activity that occurs under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Billing and Payment</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Subscriptions are billed monthly or annually in advance.</li>
                <li>Advertising spend is billed directly by the respective ad platforms, not by WorldDigital.ai.</li>
                <li>You authorize us to charge your payment method on a recurring basis.</li>
                <li>Prices may be updated with 30 days&apos; notice for existing subscribers.</li>
                <li>Subscription fees are non-refundable except as required by applicable law.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
              <p className="mb-3">You agree not to use our services to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violate any applicable law or regulation.</li>
                <li>Promote illegal products, services, or activities.</li>
                <li>Create deceptive or misleading advertising.</li>
                <li>Infringe on intellectual property rights of third parties.</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p>
                All platform technology, design, and original content is the intellectual property of
                WorldDigital.ai. You retain ownership of all content, ad creative, and data you bring to
                the platform. By using our services, you grant us a limited, non-exclusive license to use
                your content solely to provide the services described herein.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, WorldDigital.ai shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from your use of the platform.
                Our total liability for any claim shall not exceed the amounts paid by you in the 12 months
                preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Termination</h2>
              <p>
                Either party may terminate this agreement at any time. We reserve the right to suspend or
                terminate accounts that violate these terms. Upon termination, your right to access the
                platform ceases immediately and your data will be retained per our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Governing Law</h2>
              <p>
                These terms are governed by the laws of the jurisdiction in which WorldDigital.ai is
                incorporated, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
              <p>
                For questions about these terms, contact us at:{" "}
                <a href="mailto:legal@worlddigital.ai" className="text-primary underline">
                  legal@worlddigital.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
