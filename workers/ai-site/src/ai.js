// Workers AI for the knowledge base (docs/rag.md): embeddings and reranking on Cloudflare, called server-to-server
// by the backend. POST /api/internal/ai  (header x-internal-token = TOOLS_API_TOKEN)
//   {op: "embed",  model?, texts: [...]}          -> {vectors: [[...]], model, dims}
//   {op: "rerank", model?, query, texts: [...]}   -> {scores: [...]}   (one score per text, same order)
// Only the models below can be called, so the endpoint cannot be used to run anything else on the account.
import { sha256 } from './admin.js';

export const EMBED_MODELS = { '@cf/baai/bge-m3': 1024 };
export const RERANK_MODELS = ['@cf/baai/bge-reranker-base'];
const MAX_TEXTS = 32;
const MAX_CHARS = 4000;

const j = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function embedTexts(env, texts, model = '@cf/baai/bge-m3') {
  const out = await env.AI.run(model, { text: texts, truncate_inputs: true });
  const vecs = out?.data || out?.response;
  if (!Array.isArray(vecs) || vecs.length !== texts.length) throw new Error('unexpected embedding response');
  return vecs;
}

export async function rerankTexts(env, query, texts, model = RERANK_MODELS[0]) {
  const out = await env.AI.run(model, { query, contexts: texts.map((text) => ({ text })), top_k: texts.length });
  const scores = new Array(texts.length).fill(0);
  for (const r of out?.response || []) if (Number.isInteger(r.id) && r.id < texts.length) scores[r.id] = Number(r.score) || 0;
  return scores;
}

export async function internalAi(req, env) {
  if (req.method !== 'POST') return j({ error: 'POST only' }, 405);
  const want = env.TOOLS_API_TOKEN || '';
  const [a, b] = await Promise.all([sha256(want), sha256(req.headers.get('x-internal-token') || '')]);
  if (!want || a !== b) return j({ error: 'Forbidden' }, 403);
  if (!env.AI) return j({ error: 'Workers AI binding missing' }, 503);
  let body; try { body = JSON.parse((await req.text()).slice(0, 200000)); } catch { return j({ error: 'JSON body required' }, 400); }
  const texts = Array.isArray(body?.texts) ? body.texts.map((t) => String(t ?? '').slice(0, MAX_CHARS)) : [];
  if (!texts.length || texts.length > MAX_TEXTS) return j({ error: `texts: 1 to ${MAX_TEXTS} strings` }, 400);
  try {
    if (body.op === 'embed') {
      const model = body.model || '@cf/baai/bge-m3';
      if (!EMBED_MODELS[model]) return j({ error: 'model not allowed' }, 400);
      const vectors = await embedTexts(env, texts, model);
      return j({ vectors, model, dims: vectors[0]?.length || 0 });
    }
    if (body.op === 'rerank') {
      const model = body.model || RERANK_MODELS[0];
      const query = String(body.query || '').slice(0, 1000);
      if (!RERANK_MODELS.includes(model) || !query) return j({ error: 'model not allowed or empty query' }, 400);
      return j({ scores: await rerankTexts(env, query, texts, model), model });
    }
    return j({ error: 'op: embed or rerank' }, 400);
  } catch (e) {
    // 3036 = daily free allocation used up (Workers Free plan); the backend falls back to keyword search
    const msg = String(e?.message || e);
    return j({ error: msg.slice(0, 300) }, /3036|limit/i.test(msg) ? 429 : 502);
  }
}
