declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID =
  process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"] ?? "";

export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export function event(action: string, params?: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params ?? {});
}

export const ga = {
  signupStart:         () => event("signup_start"),
  signupComplete:      () => event("signup_complete"),
  login:               (method = "email") => event("login", { method }),
  packageView:         (name: string, price?: number) => event("package_view", { package_name: name, value: price }),
  packageSelect:       (name: string, price?: number) => event("package_select", { package_name: name, value: price }),
  checkoutStart:       (name: string, value?: number) => event("checkout_start", { package_name: name, value }),
  checkoutSuccess:     (name: string, value?: number) => event("checkout_success", { package_name: name, value }),
  contactFormSubmit:   () => event("contact_form_submit"),
  careerFormSubmit:    (position?: string) => event("career_form_submit", { position }),
  contentGenerate:     (contentType?: string) => event("content_generate", { content_type: contentType }),
  imageGenerate:       (platform?: string) => event("image_generate", { platform }),
  publishAttempt:      (platforms?: string[]) => event("publish_attempt", { platforms: platforms?.join(",") }),
};
