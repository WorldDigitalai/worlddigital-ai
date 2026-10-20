"use client";

import { useState } from "react";
import Image from "next/image";
import { ga } from "@/lib/gtag";

const perks = [
  {
    title: "Reward & Recognition",
    description: "Celebrate outstanding contributions with programs that value and reward hard work.",
    icon: "/icons/career-award.png",
  },
  {
    title: "Flexible Remote Work",
    description: "Work from anywhere with flexible remote options for better work-life balance.",
    icon: "/icons/career-remote.png",
  },
  {
    title: "Competitive Compensation",
    description: "We offer attractive, industry-aligned salaries to attract and retain top talent.",
    icon: "/icons/career-salary.png",
  },
  {
    title: "Adaptable Work Hours",
    description: "Enjoy job flexibility with work hours tailored to increase productivity and satisfaction.",
    icon: "/icons/career-flexible.png",
  },
  {
    title: "Learning & Growth",
    description: "Advance your career with access to professional development and skill-building opportunities.",
    icon: "/icons/career-award.png",
  },
];

const hiringSteps = [
  { num: "01", title: "AI Review", desc: "Your application is screened by our AI system for a fast, unbiased first pass." },
  { num: "02", title: "HR Interview", desc: "A conversation with our HR team to understand your background and goals." },
  { num: "03", title: "Skill Assessment", desc: "A practical assessment relevant to the role you are applying for." },
  { num: "04", title: "Final Decision", desc: "We review everything holistically and make a decision within 5 business days." },
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  linkedInUrl: string;
  portfolioUrl: string;
  message: string;
}

export default function CareerPage() {
  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", phone: "",
    position: "", experience: "", linkedInUrl: "", portfolioUrl: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/career/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({ message: "Unexpected server response" }));

      if (!res.ok) {
        setError(data.message || "Failed to submit application. Please try again.");
        setSubmitting(false);
        return;
      }

      ga.careerFormSubmit(form.position);
      setSubmitted(true);
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 30%, #EEF9FF 70%, #DAEEFF 100%)",
        minHeight: "100vh",
      }}
    >
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        <div
          className="absolute top-8 right-12 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(193,58,42,0.18) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-10 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(66,133,199,0.45) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-sm font-semibold mb-4" style={{ color: "#C13A2A" }}>
            Automate. Grow. Succeed.
          </p>
          <h1
            className="font-black leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#111827" }}
          >
            Career
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4B5563" }}>
            Build your future with innovation. Join a team where creativity meets technology, and your
            ideas help shape the future of AI-driven marketing. Grow, learn, and make an impact with us.
          </p>
        </div>
      </section>

      {/* ── JOIN OUR TEAM ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Join us Now</p>
            <h2
              className="font-black leading-tight mb-4"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#111827" }}
            >
              Join Our Team and Shape the Future of AI Marketing
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#4B5563" }}>
              At WorldDigital.ai, we&apos;re driven by creativity, technology, and innovation. We seek passionate
              individuals ready to make an impact in the AI-driven marketing world. Join us in building smarter
              solutions for businesses everywhere.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            {perks.slice(0, 3).map(({ title, description, icon }) => (
              <div key={title} className="feature-card text-left">
                <div className="mb-4 w-10 h-10 relative">
                  <Image src={icon} alt={title} fill sizes="40px" className="object-contain" />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{description}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {perks.slice(3).map(({ title, description, icon }) => (
              <div key={title} className="feature-card text-left">
                <div className="mb-4 w-10 h-10 relative">
                  <Image src={icon} alt={title} fill sizes="40px" className="object-contain" />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIRING JOURNEY ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Our Process</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#111827" }}
            >
              Your Hiring Journey
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {hiringSteps.map(({ num, title, desc }) => (
              <div key={num} className="card flex items-start gap-4">
                <span
                  className="text-2xl font-black shrink-0"
                  style={{ color: "#C13A2A", lineHeight: 1 }}
                >
                  {num}
                </span>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#111827" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C13A2A" }}>Apply Now</p>
            <h2
              className="font-black"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", color: "#111827" }}
            >
              Start Your Application
            </h2>
          </div>

          {submitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#ECFDF5" }}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#111827" }}>Application Submitted!</h3>
              <p style={{ color: "#6B7280" }}>We&apos;ll be in touch within 5 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-4">
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#B91C1C" }}
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>First Name *</label>
                  <input
                    className="input-light"
                    placeholder="Jane"
                    value={form.firstName}
                    onChange={set("firstName")}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Last Name *</label>
                  <input
                    className="input-light"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={set("lastName")}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Email *</label>
                <input
                  type="email"
                  className="input-light"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Phone</label>
                <input
                  type="tel"
                  className="input-light"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={set("phone")}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Position Applying For *</label>
                <input
                  className="input-light"
                  placeholder="e.g. AI Marketing Specialist"
                  value={form.position}
                  onChange={set("position")}
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Years of Experience *</label>
                <select
                  aria-label="Years of experience"
                  className="input-light"
                  value={form.experience}
                  onChange={set("experience")}
                  required
                  disabled={submitting}
                >
                  <option value="">Select experience level</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1–2 years">1–2 years</option>
                  <option value="3–5 years">3–5 years</option>
                  <option value="6–10 years">6–10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>LinkedIn URL</label>
                <input
                  className="input-light"
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedInUrl}
                  onChange={set("linkedInUrl")}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Portfolio URL</label>
                <input
                  className="input-light"
                  placeholder="https://"
                  value={form.portfolioUrl}
                  onChange={set("portfolioUrl")}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Why do you want to join? *</label>
                <textarea
                  className="input-light resize-none"
                  rows={4}
                  placeholder="Tell us about yourself and why you'd be a great fit..."
                  value={form.message}
                  onChange={set("message")}
                  required
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full py-4 text-sm disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
