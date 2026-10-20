import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "WorldDigital.ai Privacy Policy — how we collect, use, and protect your data.",
  alternates: { canonical: "https://worlddigital.ai/privacy-policy", languages: { "en-US": "https://worlddigital.ai/privacy-policy", "en-CA": "https://worlddigital.ai/privacy-policy", "x-default": "https://worlddigital.ai/privacy-policy" } },
};

const UPDATED = "April 1, 2025";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm">Last updated: {UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-2xl mx-auto">
          <div className="space-y-10 text-gray-600 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                WorldDigital.ai (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to
                protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our platform and services. Please read this policy
                carefully. If you disagree with any part of it, please discontinue use of our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect information in the following ways:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold text-gray-800">Account information:</span> Name, email address, company name, and billing details when you register.</li>
                <li><span className="font-semibold text-gray-800">Usage data:</span> Log files, pages visited, features used, and timestamps of interactions.</li>
                <li><span className="font-semibold text-gray-800">Ad platform data:</span> Campaign performance metrics and audience data from your connected Google, Meta, and Snapchat accounts.</li>
                <li><span className="font-semibold text-gray-800">Communications:</span> Support tickets, email correspondence, and chat logs.</li>
                <li><span className="font-semibold text-gray-800">Device and technical data:</span> IP address, browser type, operating system, and device identifiers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide, operate, and improve our AI marketing platform.</li>
                <li>To process payments and manage subscriptions.</li>
                <li>To optimize and automate your advertising campaigns.</li>
                <li>To send transactional emails, billing notices, and product updates.</li>
                <li>To respond to support requests and communicate with you.</li>
                <li>To detect, prevent, and address fraud and security incidents.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Sharing</h2>
              <p className="mb-3">We do not sell your personal data. We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold text-gray-800">Service providers:</span> Cloud infrastructure, payment processors, and analytics tools that help us operate the platform.</li>
                <li><span className="font-semibold text-gray-800">Ad platforms:</span> Google, Meta, and Snapchat receive data necessary to manage campaigns on your behalf.</li>
                <li><span className="font-semibold text-gray-800">Legal authorities:</span> When required by law, regulation, or valid legal process.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active and for a reasonable period
                thereafter to comply with legal obligations and resolve disputes. You may request deletion of
                your account and data by contacting us at{" "}
                <a href="mailto:privacy@worlddigital.ai" className="text-primary underline">
                  privacy@worlddigital.ai
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Your Rights</h2>
              <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of your data.</li>
                <li>Object to certain processing activities.</li>
                <li>Data portability in a machine-readable format.</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{" "}
                <a href="mailto:privacy@worlddigital.ai" className="text-primary underline">
                  privacy@worlddigital.ai
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Security</h2>
              <p>
                We implement industry-standard security measures including encryption at rest and in transit,
                access controls, and regular security audits. However, no method of transmission over the
                Internet is 100% secure and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to operate and improve our platform. For full
                details on how we use cookies, see our{" "}
                <a href="/cookies-policy" className="text-primary underline">
                  Cookies Policy
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Contact Us</h2>
              <p className="mb-2">
                For privacy-related inquiries, contact us at:{" "}
                <a href="mailto:privacy@worlddigital.ai" className="text-primary underline">
                  privacy@worlddigital.ai
                </a>
              </p>
              <p>
                WorldDigital.ai<br />
                3343 Memorial Blvd<br />
                Murfreesboro, TN
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
