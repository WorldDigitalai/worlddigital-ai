"use client";

// Always use a relative URL so requests go through the same-origin proxy.
// NEXT_PUBLIC_API_URL is intentionally ignored — it is set to a localhost
// value in Replit Secrets which breaks browser requests.
const API_BASE = "/api";

const DEFAULT_TIMEOUT_MS = 20_000;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wdai_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem("wdai_token", token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem("wdai_token");
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  rawBody?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; ok: boolean; status: number; error?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (!options.rawBody) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal
    ? anySignal([options.signal, controller.signal])
    : controller.signal;

  try {
    const resp = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body && !options.rawBody ? JSON.stringify(options.body) : (options.body as BodyInit | null),
      signal,
    });

    clearTimeout(timer);

    let data: T;
    const ct = resp.headers.get("content-type");
    if (ct && ct.includes("application/json")) {
      data = await resp.json();
    } else {
      data = (await resp.text()) as unknown as T;
    }

    if (!resp.ok) {
      const errorData = data as Record<string, unknown>;
      return {
        data,
        ok: false,
        status: resp.status,
        error: (errorData.message as string) || `Error ${resp.status}`,
      };
    }

    return { data, ok: true, status: resp.status };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("aborted"));
    return {
      data: null as unknown as T,
      ok: false,
      status: 0,
      error: isTimeout
        ? "Request timed out. Please try again."
        : "Unable to connect to the server. Please check your connection.",
    };
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ token: string; user: UserProfile }>("/v1/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    signup: (name: string, email: string, password: string, recaptchaToken?: string) =>
      apiFetch<{ token: string; user: UserProfile }>("/v1/auth/signup", {
        method: "POST",
        body: { name, email, password, recaptchaToken },
      }),
    logout: () => apiFetch("/v1/auth/logout", { method: "POST" }),
    me: () => apiFetch<UserProfile>("/v1/auth/me"),
  },
  stripe: {
    checkout: (plan: string) =>
      apiFetch<{ url: string }>("/v1/stripe/checkout", { method: "POST", body: { plan } }),
    customCheckout: (
      services: Array<{ id: string; name: string; price: number; quantity?: number }>,
      opts?: { plan?: string; billingInterval?: "month" | "year" }
    ) =>
      apiFetch<{ url: string }>("/v1/stripe/checkout-custom", {
        method: "POST",
        body: { services, ...(opts?.plan && { plan: opts.plan }), ...(opts?.billingInterval && { billingInterval: opts.billingInterval }) },
      }),
    portal: () => apiFetch<{ url: string }>("/v1/stripe/portal", { method: "POST" }),
  },
  ads: {
    generate: (input: AdGenerationInput) =>
      apiFetch<AdGenerationResult>("/v1/ads/generate", { method: "POST", body: input }),
    confirm: (generationId: string, selectedDescription: string, selectedImageUrl: string) =>
      apiFetch("/v1/ads/confirm", {
        method: "POST",
        body: { generationId, selectedDescription, selectedImageUrl },
      }),
    history: () => apiFetch<{ items: AdHistoryItem[] }>("/v1/ads/history"),
  },
  career: {
    apply: (data: CareerApplication) =>
      apiFetch("/v1/career/apply", { method: "POST", body: data }),
  },
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  subscriptionStatus: "none" | "active" | "paused" | "cancelled";
}

export interface AdGenerationInput {
  businessName: string;
  category: string;
  subcategory: string;
  websiteUrl?: string;
  location?: string;
  logoUrl?: string;
}

export interface AdGenerationResult {
  generationId: string;
  descriptions: string[];
  imageUrls: string[];
}

export interface AdHistoryItem {
  id: string;
  businessName: string;
  category: string;
  subcategory: string;
  status: "generated" | "confirmed";
  createdAt: string;
  selectedDescription?: string;
  selectedImageUrl?: string;
}

export interface CareerApplication {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  experience: string;
  message: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  recaptchaToken?: string;
}
