import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { 
  ChevronRight, 
  BarChart3, 
  Share2, 
  Target, 
  PenTool, 
  Mail, 
  MonitorSmartphone,
  ArrowUpRight,
  Activity,
  Zap,
  Globe,
  MessageSquare
} from "lucide-react";

// @ts-ignore
import heroBg from "../assets/images/hero-bg.png";
// @ts-ignore
import servicesBg from "../assets/images/services-bg.png";

const services = [
  {
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    title: "SEO & Search Optimization",
    description: "Dominate search rankings with data-driven strategies that capture high-intent traffic."
  },
  {
    icon: <Share2 className="w-6 h-6 text-secondary" />,
    title: "Social Media Marketing",
    description: "Build a loyal audience and drive engagement across platforms that matter."
  },
  {
    icon: <Target className="w-6 h-6 text-accent" />,
    title: "PPC & Paid Advertising",
    description: "Laser-targeted campaigns designed for maximum ROI and immediate scale."
  },
  {
    icon: <PenTool className="w-6 h-6 text-primary" />,
    title: "Content Marketing",
    description: "Compelling narratives that educate, inspire, and convert visitors into customers."
  },
  {
    icon: <Mail className="w-6 h-6 text-secondary" />,
    title: "Email Marketing",
    description: "Automated sequences and broadcast campaigns that nurture leads and drive sales."
  },
  {
    icon: <MonitorSmartphone className="w-6 h-6 text-accent" />,
    title: "Web Design & Development",
    description: "High-performance, conversion-optimized websites that serve as your digital headquarters."
  }
];

const stats = [
  { value: "$250M+", label: "Ad Spend Managed" },
  { value: "4.8x", label: "Average ROI" },
  { value: "10k+", label: "Leads Generated" },
  { value: "98%", label: "Client Retention" }
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50 py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>WORLD<span className="text-primary">DIGITAL</span>AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <a href="#approach" className="hover:text-primary transition-colors">Approach</a>
            <a href="#results" className="hover:text-primary transition-colors">Results</a>
            <a href="#contact">
              <Button variant="default" className="shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all">
                Command Attention
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
          <img src={heroBg} alt="Neon Command Center" className="w-full h-full object-cover opacity-60" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in-up">
              <Activity className="w-4 h-4" />
              <span>The Next Generation of Digital Growth</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Don't Just Exist.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Command Attention.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Worlddigitalai is the high-performance agency ambitious businesses turn to when they need elite-level digital marketing, engineering, and growth strategy.
            </p>
            <div className="flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" className="h-14 px-8 text-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-all group">
                Deploy Campaign
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary/20 hover:bg-primary/5">
                View Intelligence
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-card/50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/95 z-10" />
          <img src={servicesBg} alt="Abstract Tech" className="w-full h-full object-cover opacity-30" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Tactical Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A full-spectrum arsenal designed to acquire, engage, and convert your target audience at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Card key={i} className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="approach" className="py-32 relative overflow-hidden bg-background">
        {/* Background orbs */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/8 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-6">

          {/* Top eyebrow label */}
          <div className="flex justify-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Our Mission
            </span>
          </div>

          {/* Big bold statement */}
          <div className="text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
              We exist to make{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  ordinary brands
                </span>
                {/* Underline decoration */}
                <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-secondary to-accent rounded-full opacity-60" />
              </span>
              {" "}impossible to ignore.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We fuse creative intelligence with data precision — building brands that don't just compete, they redefine the category entirely.
            </p>
          </div>

          {/* Three pillar cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: <Target className="w-7 h-7" />,
                color: "primary",
                headline: "Ruthlessly Precise",
                body: "Every dollar, every word, every pixel is placed with intention. We eliminate waste and engineer campaigns that hit with surgical accuracy."
              },
              {
                icon: <Zap className="w-7 h-7" />,
                color: "secondary",
                headline: "AI-Augmented Speed",
                body: "Our proprietary AI stack cuts strategy-to-launch time by 70%. While others plan, you're already capturing market share."
              },
              {
                icon: <Globe className="w-7 h-7" />,
                color: "accent",
                headline: "Built to Scale",
                body: "From a single campaign to a global domination strategy — our systems grow as fast as your ambition does."
              }
            ].map((card, i) => (
              <div
                key={i}
                className="relative group rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${card.color}/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                <div className={`w-14 h-14 rounded-xl bg-${card.color}/10 flex items-center justify-center text-${card.color} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{card.headline}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Bold quote stripe */}
          <div className="relative rounded-3xl overflow-hidden border border-border/40">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/60 via-secondary/40 to-accent/60" />
            <div className="relative z-10 px-10 py-12 md:px-20 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:max-w-xl">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">The Worlddigital Promise</div>
                <blockquote className="text-2xl md:text-3xl font-bold leading-snug">
                  "Generic marketing is a{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    tax on the uncreative.
                  </span>
                  {" "}We refuse to pay it."
                </blockquote>
              </div>
              <div className="flex flex-col gap-5 shrink-0">
                {[
                  { value: "4.8×", label: "Average client ROI" },
                  { value: "98%", label: "Retention rate" },
                  { value: "72h", label: "Average time to launch" }
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                      {m.value}
                    </div>
                    <div className="text-sm text-muted-foreground leading-tight">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA / Contact Section */}
      <section id="contact" className="py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 p-10 flex flex-col justify-between border-r border-border/50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                <div>
                  <h3 className="text-3xl font-bold mb-4">Initialize Contact</h3>
                  <p className="text-muted-foreground mb-8">
                    Ready to scale? Transmit your coordinates and our strategic team will connect within 24 hours.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>hello@worlddigitalai.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-secondary" />
                    <span>Global Operations</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 p-10 bg-card/50">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" className="bg-background border-border/50 focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" className="bg-background border-border/50 focus:border-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" placeholder="john@company.com" className="bg-background border-border/50 focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">What are you trying to conquer?</Label>
                    <Textarea id="message" placeholder="Tell us your goal — traffic, leads, brand awareness, all of the above..." className="min-h-[120px] bg-background border-border/50 focus:border-primary" />
                  </div>
                  <Button className="w-full h-12 text-md shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                    Transmit Request
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>WORLD<span className="text-primary">DIGITAL</span>AI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Worlddigitalai. All systems operational.
          </div>
          <div className="flex gap-4 text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
