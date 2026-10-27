// One SQLite-backed Durable Object holds the blog (posts, images), editor sign-in and form submissions.
import { DurableObject } from 'cloudflare:workers';

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
}
