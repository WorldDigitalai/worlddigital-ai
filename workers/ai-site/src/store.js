// One SQLite-backed Durable Object holds the blog (posts, images), editor sign-in and form submissions.
import { DurableObject } from 'cloudflare:workers';
import { AUTOPILOT_DEFAULTS, callAi, cleanAutopilot, nextLocalHour, runAutopilot, savePost as saveAiPost } from './autopilot.js';
import { sendEmail, validate } from './admin.js';
import { shareToBuffer } from './buffer.js';

const DEPS = { sendEmail, validate };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, seo_title TEXT, description TEXT, excerpt TEXT, category TEXT,
  body TEXT NOT NULL DEFAULT '', cover_id TEXT, cover_alt TEXT,
  status TEXT NOT NULL DEFAULT 'draft', publish_at TEXT, published_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, author TEXT, pinged_at TEXT
);
CREATE TABLE IF NOT EXISTS redirects (old_slug TEXT PRIMARY KEY, new_slug TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, type TEXT NOT NULL, bytes BLOB NOT NULL, size INTEGER, alt TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_tokens (hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, data TEXT NOT NULL, ip_hash TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ai_jobs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, input TEXT NOT NULL, state TEXT NOT NULL, result TEXT, error TEXT, who TEXT, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, who TEXT, action TEXT NOT NULL, detail TEXT);
`;

const nowIso = () => new Date().toISOString();
const rows = (cur) => cur.toArray();
const one = (cur) => { const r = cur.toArray(); return r.length ? r[0] : null; };

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      for (const s of SCHEMA.split(';')) if (s.trim()) this.sql.exec(s);
      // Merged blog topics: "AI & Marketing" is now "AI Marketing" (one topic page instead of two competing ones).
      this.sql.exec(`UPDATE posts SET category = 'AI Marketing' WHERE category = 'AI & Marketing'`);
      // Buffer sharing: when each post was sent to social, and what Buffer answered per channel.
      for (const col of ['shared_at TEXT', 'shared TEXT']) { try { this.sql.exec(`ALTER TABLE posts ADD COLUMN ${col}`); } catch {} }
      // Only posts published from now on are shared (the older ones are not re-posted).
      this.sql.exec(`INSERT OR IGNORE INTO kv (k,v) VALUES ('social_since', ?)`, nowIso());
      // Requested 2026-11-02: Autopilot once a day, trending across all services, publish + share to Buffer.
      if (!one(this.sql.exec(`SELECT v FROM kv WHERE k = 'autopilot_daily_v1'`))) {
        const c = this.getAutopilot();
        Object.assign(c, { enabled: true, every_days: 1, mode: 'publish', topics: [], mix_vs: true, next_run: nextLocalHour(Date.now() + 60e3, c.hour || 9) });
        this.putAutopilot(c);
        this.sql.exec(`INSERT INTO kv (k,v) VALUES ('autopilot_daily_v1', ?)`, nowIso());
      }
    });
  }

  // ---- setup ----
  seed(posts) {
    if (one(this.sql.exec(`SELECT v FROM kv WHERE k = 'seeded'`))) return 0;
    const t = nowIso();
    for (const p of posts) {
      this.sql.exec(`INSERT OR IGNORE INTO posts (slug,title,seo_title,description,excerpt,category,body,status,published_at,created_at,updated_at,author,pinged_at)
        VALUES (?,?,?,?,?,?,?,'published',?,?,?,?,?)`, p.slug, p.title, p.seo_title || null, p.description || '', p.excerpt || '', p.category || '',
        p.body, p.published_at, t, t, 'WorldDigital.ai Team', t);
    }
    this.sql.exec(`INSERT INTO kv (k,v) VALUES ('seeded', ?)`, t);
    return posts.length;
  }

  secret() {
    let r = one(this.sql.exec(`SELECT v FROM kv WHERE k = 'hmac'`));
    if (r) return r.v;
    const b = new Uint8Array(32); crypto.getRandomValues(b);
    const v = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    this.sql.exec(`INSERT INTO kv (k,v) VALUES ('hmac', ?)`, v);
    return v;
  }

  // ---- posts ----
  // A scheduled post counts as published once its time has passed.
  listPosts({ all = false } = {}) {
    const n = nowIso();
    const list = rows(this.sql.exec(`SELECT slug,title,seo_title,description,excerpt,category,cover_id,cover_alt,status,publish_at,published_at,updated_at,created_at,author,length(body) AS chars,
      substr(body,1,4000) AS body_head FROM posts ORDER BY COALESCE(published_at, publish_at, updated_at) DESC`));
    for (const p of list) p.live = p.status === 'published' || (p.status === 'scheduled' && p.publish_at && p.publish_at <= n);
    for (const p of list) if (p.live && p.status === 'scheduled') p.published_at = p.publish_at;
    return all ? list : list.filter((p) => p.live).sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
  }

  getPost(slug) {
    const p = one(this.sql.exec(`SELECT * FROM posts WHERE slug = ?`, slug));
    if (!p) {
      const r = one(this.sql.exec(`SELECT new_slug FROM redirects WHERE old_slug = ?`, slug));
      return r ? { redirect: r.new_slug } : null;
    }
    const n = nowIso();
    p.live = p.status === 'published' || (p.status === 'scheduled' && p.publish_at && p.publish_at <= n);
    if (p.live && p.status === 'scheduled') p.published_at = p.publish_at;
    return p;
  }

  slugTaken(slug) { return !!one(this.sql.exec(`SELECT 1 AS x FROM posts WHERE slug = ?`, slug)); }

  // data: {originalSlug?, slug, title, seo_title, description, excerpt, category, body, cover_id, cover_alt, action, publish_at}
  savePost(data, who) {
    const t = nowIso();
    const orig = data.originalSlug ? one(this.sql.exec(`SELECT * FROM posts WHERE slug = ?`, data.originalSlug)) : null;
    if (!orig && this.slugTaken(data.slug)) return { error: 'slug_taken' };
    if (orig && data.slug !== orig.slug && this.slugTaken(data.slug)) return { error: 'slug_taken' };
    let status = orig ? orig.status : 'draft';
    let publishAt = orig ? orig.publish_at : null;
    let publishedAt = orig ? orig.published_at : null;
    if (data.action === 'publish') { status = 'published'; publishedAt = publishedAt || t; publishAt = null; }
    if (data.action === 'schedule') { status = 'scheduled'; publishAt = data.publish_at; }
    if (data.action === 'unpublish') { status = 'draft'; publishAt = null; }
    const pinged = data.action === 'publish' || data.action === 'update' ? null : orig?.pinged_at || null;
    if (orig) {
      this.sql.exec(`UPDATE posts SET slug=?,title=?,seo_title=?,description=?,excerpt=?,category=?,body=?,cover_id=?,cover_alt=?,status=?,publish_at=?,published_at=?,updated_at=?,pinged_at=? WHERE slug=?`,
        data.slug, data.title, data.seo_title || null, data.description, data.excerpt, data.category, data.body, data.cover_id || null, data.cover_alt || null,
        status, publishAt, publishedAt, t, pinged, orig.slug);
      if (data.slug !== orig.slug) {
        this.sql.exec(`INSERT OR REPLACE INTO redirects (old_slug,new_slug) VALUES (?,?)`, orig.slug, data.slug);
        this.sql.exec(`UPDATE redirects SET new_slug = ? WHERE new_slug = ?`, data.slug, orig.slug);
        this.sql.exec(`DELETE FROM redirects WHERE old_slug = ?`, data.slug);
      }
    } else {
      this.sql.exec(`INSERT INTO posts (slug,title,seo_title,description,excerpt,category,body,cover_id,cover_alt,status,publish_at,published_at,created_at,updated_at,author)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, data.slug, data.title, data.seo_title || null, data.description, data.excerpt, data.category, data.body,
        data.cover_id || null, data.cover_alt || null, status, publishAt, publishedAt, t, t, 'WorldDigital.ai Team');
    }
    this.log(who, `post_${data.action || 'save'}`, data.slug);
    return { ok: true, slug: data.slug, status };
  }

  // Live posts that search engines have not been told about yet.
  unpinged() {
    const n = nowIso();
    return rows(this.sql.exec(`SELECT slug FROM posts WHERE pinged_at IS NULL AND (status='published' OR (status='scheduled' AND publish_at <= ?))`, n)).map((r) => r.slug);
  }
  markPinged(slugs) { const t = nowIso(); for (const s of slugs) this.sql.exec(`UPDATE posts SET pinged_at=? WHERE slug=?`, t, s); }

  // ---- media ----
  putMedia(bytes, type, alt, who) {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    this.sql.exec(`INSERT INTO media (id,type,bytes,size,alt,created_at) VALUES (?,?,?,?,?,?)`, id, type, bytes, bytes.byteLength, alt || '', nowIso());
    this.log(who, 'media_upload', `${id} ${type} ${bytes.byteLength}`);
    return id;
  }
  getMedia(id) {
    const r = one(this.sql.exec(`SELECT type, bytes FROM media WHERE id = ?`, id));
    return r ? { type: r.type, bytes: r.bytes } : null;
  }
  listMedia() { return rows(this.sql.exec(`SELECT id,type,size,alt,created_at FROM media ORDER BY created_at DESC LIMIT 60`)); }

  // ---- editor sign-in ----
  // At most 5 links per email per hour.
  addLoginToken(hash, email, ttlMs) {
    const n = Date.now();
    const recent = one(this.sql.exec(`SELECT COUNT(*) AS c FROM login_tokens WHERE email = ? AND created > ?`, email, n - 3600e3)).c;
    if (recent >= 5) return false;
    this.sql.exec(`DELETE FROM login_tokens WHERE expires < ?`, n - 86400e3);
    this.sql.exec(`INSERT INTO login_tokens (hash,email,expires,created) VALUES (?,?,?,?)`, hash, email, n + ttlMs, n);
    return true;
  }
  useLoginToken(hash) {
    const r = one(this.sql.exec(`SELECT email, expires, used FROM login_tokens WHERE hash = ?`, hash));
    if (!r || r.used || r.expires < Date.now()) return null;
    this.sql.exec(`UPDATE login_tokens SET used = 1 WHERE hash = ?`, hash);
    return r.email;
  }
  addSession(hash, email, ttlMs) {
    const n = Date.now();
    this.sql.exec(`DELETE FROM sessions WHERE expires < ?`, n);
    this.sql.exec(`INSERT INTO sessions (hash,email,expires,created) VALUES (?,?,?,?)`, hash, email, n + ttlMs, n);
    this.log(email, 'signed_in', '');
  }
  getSession(hash) {
    const r = one(this.sql.exec(`SELECT email, expires FROM sessions WHERE hash = ?`, hash));
    return r && r.expires > Date.now() ? r.email : null;
  }
  endSession(hash) { this.sql.exec(`DELETE FROM sessions WHERE hash = ?`, hash); }

  // ---- forms ----
  // Max 5 submissions per hour per visitor (hashed IP) and kind.
  addLead(kind, data, ipHash) {
    const since = new Date(Date.now() - 3600e3).toISOString();
    const c = one(this.sql.exec(`SELECT COUNT(*) AS c FROM leads WHERE kind = ? AND ip_hash = ? AND created_at > ?`, kind, ipHash, since)).c;
    if (c >= 5) return false;
    this.sql.exec(`INSERT INTO leads (kind,data,ip_hash,created_at) VALUES (?,?,?,?)`, kind, JSON.stringify(data), ipHash, nowIso());
    return true;
  }
  listLeads() { return rows(this.sql.exec(`SELECT id,kind,data,created_at FROM leads ORDER BY id DESC LIMIT 200`)); }

  log(who, action, detail) { this.sql.exec(`INSERT INTO audit (at,who,action,detail) VALUES (?,?,?,?)`, nowIso(), who || null, action, detail || null); }

  // ---- AI jobs (blog editor assistant + Autopilot), run by the alarm so long drafts never time out ----
  async arm(at) {
    const cur = await this.ctx.storage.getAlarm();
    if (!cur || at < cur) await this.ctx.storage.setAlarm(Math.max(at, Date.now()));
  }
  async aiStart(kind, input, who) {
    if (!['research', 'draft', 'autopilot', 'share'].includes(kind)) return { error: 'Unknown job.' };
    const n = Date.now();
    const busy = one(this.sql.exec(`SELECT COUNT(*) AS c FROM ai_jobs WHERE state IN ('queued','running') AND created > ?`, n - 15 * 60e3)).c;
    if (busy >= 4) return { error: 'A few AI jobs are already running. Wait for them to finish, then try again.' };
    const id = crypto.randomUUID();
    this.sql.exec(`INSERT INTO ai_jobs (id,kind,input,state,who,created,updated) VALUES (?,?,?,?,?,?,?)`, id, kind, JSON.stringify(input || {}).slice(0, 8000), 'queued', who || null, n, n);
    this.sql.exec(`DELETE FROM ai_jobs WHERE created < ?`, n - 7 * 86400e3);
    await this.arm(n);
    return { id };
  }
  aiJob(id) {
    const j = one(this.sql.exec(`SELECT id,kind,state,result,error,created,updated FROM ai_jobs WHERE id = ?`, String(id || '')));
    if (!j) return null;
    return { id: j.id, kind: j.kind, state: j.state, error: j.error, result: j.result ? JSON.parse(j.result) : null, seconds: Math.round((Date.now() - j.created) / 1000) };
  }
  getAutopilot() {
    const r = one(this.sql.exec(`SELECT v FROM kv WHERE k = 'autopilot'`));
    return { ...AUTOPILOT_DEFAULTS, ...(r ? JSON.parse(r.v) : {}) };
  }
  putAutopilot(cfg) { this.sql.exec(`INSERT OR REPLACE INTO kv (k,v) VALUES ('autopilot', ?)`, JSON.stringify(cfg)); }
  async setAutopilot(input, who) {
    const prev = this.getAutopilot();
    const cfg = cleanAutopilot(input || {}, prev);
    if (cfg.enabled && (!prev.enabled || !cfg.next_run || cfg.every_days !== prev.every_days || cfg.hour !== prev.hour)) {
      cfg.next_run = nextLocalHour(Date.now() + 60e3, cfg.hour);
    }
    if (!cfg.enabled) cfg.next_run = null;
    this.putAutopilot(cfg);
    this.log(who, 'autopilot_settings', JSON.stringify({ enabled: cfg.enabled, every_days: cfg.every_days, mode: cfg.mode }));
    if (cfg.enabled) await this.arm(cfg.next_run);
    return cfg;
  }
  // ---- Buffer: share each newly published post to every social channel once ----
  async queueShare(slug) {
    const p = one(this.sql.exec(`SELECT slug,status,publish_at,shared_at FROM posts WHERE slug = ?`, slug));
    const live = p && (p.status === 'published' || (p.status === 'scheduled' && p.publish_at && p.publish_at <= nowIso()));
    if (!live || p.shared_at) return false;
    const n = Date.now();
    this.sql.exec(`UPDATE posts SET shared_at=?, shared=? WHERE slug=?`, nowIso(), JSON.stringify({ state: 'queued' }), slug);
    this.sql.exec(`INSERT INTO ai_jobs (id,kind,input,state,who,created,updated) VALUES (?,?,?,?,?,?,?)`, crypto.randomUUID(), 'share', JSON.stringify({ slug }), 'queued', 'buffer', n, n);
    await this.arm(n);
    return true;
  }
  async shareSweep() {
    const since = (one(this.sql.exec(`SELECT v FROM kv WHERE k = 'social_since'`)) || {}).v || nowIso();
    const due = rows(this.sql.exec(`SELECT slug FROM posts WHERE shared_at IS NULL AND (status='published' OR (status='scheduled' AND publish_at <= ?))
      AND COALESCE(publish_at, published_at) >= ? LIMIT 3`, nowIso(), since));
    for (const r of due) await this.queueShare(r.slug);
  }
  async sharePost(slug) {
    const p = this.getPost(slug);
    if (!p || p.redirect || !p.live) throw new Error('Post is not live.');
    const url = `https://worlddigital.ai/blog/${p.slug}`;
    let coverId = p.cover_id, imageNote = null;
    if (!coverId) {
      try {
        const im = await callAi(this.env, 'image', { title: p.title, keyword: p.category || '', idea: '' });
        const bytes = Uint8Array.from(atob(im.b64), (ch) => ch.charCodeAt(0));
        if (bytes.byteLength > 1900 * 1024) throw new Error('image too large');
        coverId = this.putMedia(bytes.buffer, 'image/jpeg', im.alt || '', 'ai');
        this.sql.exec(`UPDATE posts SET cover_id=?, cover_alt=? WHERE slug=?`, coverId, im.alt || '', p.slug);
      } catch (e) { imageNote = 'No cover image: ' + e.message; console.log('cover image failed', e.message); }
    }
    const imageUrl = coverId ? `https://worlddigital.ai/media/${coverId}` : 'https://worlddigital.ai/og.png';
    const texts = await callAi(this.env, 'social', { title: p.title, excerpt: p.excerpt || p.description || '', url, category: p.category || '', keyword: '' });
    // Short video with voiceover + music for YouTube Shorts and TikTok (the backend refuses silent videos).
    let videoUrl = null, videoNote = null;
    try {
      const v = await callAi(this.env, 'video', { title: p.title, excerpt: p.excerpt || p.description || '',
        body: String(p.body || '').slice(0, 4000), cover_url: coverId ? imageUrl : '' });
      const bytes = Uint8Array.from(atob(v.b64), (ch) => ch.charCodeAt(0));
      if (bytes.byteLength > 1900 * 1024) throw new Error('video too large');
      const vid = this.putMedia(bytes.buffer, 'video/mp4', `Video for ${p.title}`.slice(0, 200), 'ai');
      videoUrl = `https://worlddigital.ai/media/${vid}.mp4`;
      this.sql.exec(`UPDATE posts SET shared=? WHERE slug=?`, JSON.stringify({ state: 'queued', video: videoUrl }), p.slug);
    } catch (e) { videoNote = 'No video: ' + e.message; console.log('blog video failed', e.message); }
    const results = await shareToBuffer(this.env, { url, title: p.title, texts, imageUrl, videoUrl });
    const out = { state: 'done', at: nowIso(), image: imageUrl, imageNote, video: videoUrl, videoNote, results };
    this.sql.exec(`UPDATE posts SET shared=? WHERE slug=?`, JSON.stringify(out), p.slug);
    return out;
  }

  // Called by the hourly cron as a safety net in case an alarm was lost.
  async autopilotTick() {
    await this.shareSweep();
    const cfg = this.getAutopilot();
    if (cfg.enabled && cfg.next_run) await this.arm(cfg.next_run);
    const queued = one(this.sql.exec(`SELECT COUNT(*) AS c FROM ai_jobs WHERE state = 'queued'`)).c;
    if (queued) await this.arm(Date.now());
  }
  async runJob(kind, input, who) {
    if (kind === 'research') return callAi(this.env, 'research', input);
    if (kind === 'share') return this.sharePost(input.slug);
    if (kind === 'draft') {
      const d = await callAi(this.env, 'draft', input);
      if (!input.publish) return d;
      const r = saveAiPost(this, d, 'publish', who, DEPS);
      await this.queueShare(r.slug);
      return { ...d, slug: r.slug, published: true };
    }
    const cfg = this.getAutopilot();
    const out = await runAutopilot(this, this.env, cfg, DEPS);
    const after = this.getAutopilot();  // settings may have changed while it ran
    after.runs = (after.runs || 0) + 1;
    if (out.keyword) after.used = [out.keyword, ...(after.used || [])].slice(0, 300);
    after.last_run = { at: new Date().toISOString(), ...out };
    this.putAutopilot(after);
    return out;
  }
  async alarm() {
    const n = Date.now();
    this.sql.exec(`UPDATE ai_jobs SET state='error', error='It took too long. Please try again.', updated=? WHERE state='running' AND updated < ?`, n, n - 20 * 60e3);
    const cfg = this.getAutopilot();
    if (cfg.enabled && cfg.next_run && cfg.next_run <= n + 30e3) {
      const pending = one(this.sql.exec(`SELECT COUNT(*) AS c FROM ai_jobs WHERE kind='autopilot' AND state IN ('queued','running')`)).c;
      if (!pending) this.sql.exec(`INSERT INTO ai_jobs (id,kind,input,state,who,created,updated) VALUES (?,?,?,?,?,?,?)`, crypto.randomUUID(), 'autopilot', '{}', 'queued', 'autopilot', n, n);
      cfg.next_run = nextLocalHour(n + cfg.every_days * 86400e3 - 6 * 3600e3, cfg.hour);
      this.putAutopilot(cfg);
    }
    const jobs = rows(this.sql.exec(`SELECT id,kind,input,who FROM ai_jobs WHERE state='queued' ORDER BY created LIMIT 4`));
    await Promise.all(jobs.map(async (j) => {
      this.sql.exec(`UPDATE ai_jobs SET state='running', updated=? WHERE id=?`, Date.now(), j.id);
      try {
        const result = await this.runJob(j.kind, JSON.parse(j.input), j.who);
        this.sql.exec(`UPDATE ai_jobs SET state='done', result=?, updated=? WHERE id=?`, JSON.stringify(result), Date.now(), j.id);
      } catch (e) {
        console.log('ai job failed', j.kind, e.message);
        this.sql.exec(`UPDATE ai_jobs SET state='error', error=?, updated=? WHERE id=?`, String(e.message || 'Failed').slice(0, 300), Date.now(), j.id);
        if (j.kind === 'share') {
          const slug = JSON.parse(j.input).slug;
          this.sql.exec(`UPDATE posts SET shared=? WHERE slug=?`, JSON.stringify({ state: 'error', at: nowIso(), error: String(e.message || 'Failed').slice(0, 300) }), slug);
        }
        if (j.kind === 'autopilot') {
          const c = this.getAutopilot(); c.last_run = { at: new Date().toISOString(), error: String(e.message || 'Failed').slice(0, 300) }; this.putAutopilot(c);
        }
      }
    }));
    const more = one(this.sql.exec(`SELECT COUNT(*) AS c FROM ai_jobs WHERE state='queued'`)).c;
    const c2 = this.getAutopilot();
    if (more) await this.ctx.storage.setAlarm(Date.now() + 1000);
    else if (c2.enabled && c2.next_run) await this.ctx.storage.setAlarm(c2.next_run);
  }
}
