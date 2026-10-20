// IndexNow key file (Bing, Yandex, Seznam, Naver). Search engines fetch this
// URL to confirm a submission really came from this site. Set INDEXNOW_KEY
// to any 8–128 character string of letters, numbers and dashes.
export const dynamic = "force-dynamic";

export function GET() {
  const key = process.env["INDEXNOW_KEY"];
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
