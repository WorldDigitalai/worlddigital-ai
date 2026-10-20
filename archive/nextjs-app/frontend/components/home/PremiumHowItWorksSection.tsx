import Image from "next/image";

const steps = [
  {
    num: "01",
    imgSrc: "/icons/icon-box.png",
    title: "Upload Your Logo",
    desc: "Add your brand identity. Our AI uses it as the visual anchor for every piece of content it creates.",
  },
  {
    num: "02",
    imgSrc: "/icons/icon-search-eye.png",
    title: "Select Your Category",
    desc: "Choose your industry and business type. This tells our AI the right tone, messaging style, and offer framing.",
  },
  {
    num: "03",
    imgSrc: "/icons/icon-gears.png",
    title: "Pick Subcategories",
    desc: "Narrow down your niche. The AI tailors campaign angles specifically to your customer segment and offers.",
  },
  {
    num: "04",
    imgSrc: "/icons/icon-search-gear.png",
    title: "Add Website & Location",
    desc: "Connect your online presence and service area so the AI can personalize campaigns with real business context.",
  },
  {
    num: "05",
    imgSrc: "/icons/icon-megaphone.png",
    title: "Review & Launch",
    desc: "Browse your AI-generated ad descriptions, visuals, and video concepts. Approve and launch in one click.",
  },
];

export function PremiumHowItWorksSection() {
  return (
    <section className="py-24 lg:py-32 px-6" style={{ background: "white" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1D7FE8" }}>How It Works</p>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4" style={{ color: "#111827" }}>
            From business info to live campaign in five simple steps.
          </h2>
          <p className="text-lg" style={{ color: "#4B5563" }}>
            Give WorldDigital.ai the basics. The platform generates the assets, structure, and campaign options you need to launch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {steps.map(({ num, imgSrc, title, desc }, i) => (
            <div key={num} className="relative group">
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-10 left-[calc(50%+32px)] right-[-50%] h-px z-0"
                  style={{ background: "linear-gradient(to right, #E5EAF2, transparent)" }}
                />
              )}

              <div
                className="relative z-10 rounded-3xl p-6 flex flex-col items-start h-full transition-all hover:-translate-y-1"
                style={{
                  background: "#F7FAFC",
                  border: "1.5px solid #E5EAF2",
                  boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
                }}
              >
                <div className="mb-4 transition-all group-hover:scale-110">
                  <Image
                    src={imgSrc}
                    alt={title}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <span className="text-[11px] font-black mb-1.5" style={{ color: "#9CA3AF", letterSpacing: "0.08em" }}>{num}</span>
                <h3 className="text-sm font-bold mb-2 leading-snug" style={{ color: "#111827" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
