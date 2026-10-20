"use client";

export function NewsletterForm() {
  return (
    <form
      className="flex gap-3 flex-col sm:flex-row"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="you@yourcompany.com"
        required
        className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        aria-label="Email address"
      />
      <button type="submit" className="btn-primary whitespace-nowrap py-3">
        Subscribe
      </button>
    </form>
  );
}
