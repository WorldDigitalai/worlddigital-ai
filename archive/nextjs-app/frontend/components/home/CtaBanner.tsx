import Link from "next/link";

type CtaBannerProps = {
  heading: string;
  subheading: string;
  cta: string;
  ctaHref: string;
  secondary?: string;
  secondaryHref?: string;
  variant?: "gradient" | "light" | "dark";
};

export function CtaBanner({
  heading,
  subheading,
  cta,
  ctaHref,
  secondary,
  secondaryHref,
  variant = "gradient",
}: CtaBannerProps) {
  const isDark = variant === "dark";

  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={
        isDark
          ? { background: "linear-gradient(135deg, #0F172A, #1a2a4a)" }
          : { background: "linear-gradient(135deg, #EAF3FB, #FDE8E2)" }
      }
    >
      {/* Subtle glow */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #4285C7, transparent 70%)" }} />
        </div>
      )}

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className={`text-4xl lg:text-5xl font-black leading-tight mb-5 tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          {heading}
        </h2>
        <p className={`text-lg leading-relaxed mb-10 max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {subheading}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="py-4 px-10 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
            style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
          >
            {cta}
          </Link>
          {secondary && secondaryHref && (
            <Link
              href={secondaryHref}
              className="py-4 px-10 rounded-full font-semibold text-base transition-all border"
              style={isDark
                ? { color: "white", borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }
                : { color: "#374151", borderColor: "#d1d5db", background: "white" }
              }
            >
              {secondary}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
