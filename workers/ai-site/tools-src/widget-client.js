(function () {
  var C = window.WDT_CONFIG;
  var root = document.getElementById("tool");
  if (!C || !root) return;
  var $ = function (s) { return root.querySelector(s); };
  var form = $(".wdt-form"), status = $(".wdt-status"), res = $(".wdt-res"), btn = $(".wdt-go");
  var KW = C.type === "keywords";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var num = function (n) { return n == null ? "–" : Number(n).toLocaleString("en-US"); };
  var cpc = function (n) { return n == null ? "–" : "$" + Number(n).toFixed(2); };
  var comp = function (c) { return c ? c.charAt(0) + c.slice(1).toLowerCase() : "–"; };
  var ev = function (name, params) { try { if (window.gtag) window.gtag("event", name, params || {}); } catch (e) {} };
  var DUMMY = ["local", "service", "near", "best", "company", "price", "quote", "repair", "pro", "top", "online", "rated", "fast", "cost", "how", "guide", "plan", "team"];
  var fake = function (len) { var s = "", i = 0; while (s.length < len) { s += (s ? " " : "") + DUMMY[(len * 7 + i++ * 5) % DUMMY.length]; } return s.slice(0, Math.max(4, len)); };
  var STEPS = KW ? ["Reading your website…", "Pulling Google search data…", "Ranking your best keywords…"] : ["Reading your website…", "Studying your offer…", "Writing your " + "content…"];
  var timer;

  function setStatus(html, err) { status.innerHTML = html; status.className = "wdt-status" + (err ? " err" : ""); }
  function busy(on) {
    btn.disabled = on;
    clearInterval(timer);
    if (on) { var i = 0; setStatus('<span class="wdt-spin" aria-hidden="true"></span>' + STEPS[0]); timer = setInterval(function () { i = Math.min(i + 1, STEPS.length - 1); setStatus('<span class="wdt-spin" aria-hidden="true"></span>' + STEPS[i]); }, 6000); }
    else setStatus("");
  }
  function api(path, opts) {
    return fetch("/api/tools/" + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again."); return d; });
    });
  }

  // ── Content platform chips: Google only supports ads ────────────────────
  if (!KW) {
    var syncKinds = function () {
      var p = form.querySelector("input[name=platform]:checked");
      var kinds = p ? p.getAttribute("data-kinds").split(",") : ["ad", "post"];
      form.querySelectorAll("input[name=kind]").forEach(function (k) {
        k.disabled = kinds.indexOf(k.value) < 0;
        if (k.disabled && k.checked) form.querySelector("input[name=kind][value=" + kinds[0] + "]").checked = true;
      });
    };
    form.addEventListener("change", function (e) { if (e.target.name === "platform") syncKinds(); });
    syncKinds();
  }

  // ── Rendering ────────────────────────────────────────────────────────────
  function kwRow(k, i) {
    return "<tr><td class='n wdt-no'>#" + (i + 1) + "</td><td><span class='wdt-kw'>" + esc(k.keyword) + "</span><span class='wdt-why'>" + esc(k.reason) + "</span></td><td class='n' data-l='Monthly searches'>" + num(k.volume) + "</td><td class='n' data-l='CPC'>" + cpc(k.cpc) + "</td><td data-l='Competition'>" + comp(k.competition) + "</td><td data-l='Intent'><span class='wdt-pill'>" + esc(k.intent) + "</span></td></tr>";
  }
  function kwTable(rows, head) {
    return "<table class='wdt-table'>" + (head ? "<thead><tr><th>#</th><th>Keyword</th><th>Monthly searches</th><th>CPC</th><th>Competition</th><th>Intent</th></tr></thead>" : "") + "<tbody>" + rows + "</tbody></table>";
  }
  function contentCard(it, i) {
    return "<div class='wdt-item'><h4>" + (i + 1) + ". " + esc(it.angle) + "</h4>" + it.fields.map(function (f) {
      return "<div class='wdt-f'><b>" + esc(f.label) + (f.max ? " <small>(" + (f.text || "").length + "/" + f.max + ")</small>" : "") + "</b><div>" + esc(f.text) + "</div></div>";
    }).join("") + "</div>";
  }
  function fmtChoice() {
    return "<fieldset class='wdt-fmt'><legend class='wdt-vh'>File format</legend>" + [["pdf", "PDF"], ["xlsx", "Excel"], ["docx", "Word"]].map(function (f, i) {
      return "<label class='wdt-chip'><input type='radio' name='wdt-fmt' value='" + f[0] + "'" + (i === 0 ? " checked" : "") + "><span>" + f[1] + "</span></label>";
    }).join("") + "</fieldset>";
  }
  function heading(d) {
    return KW
      ? "<h3>Top keywords for " + esc(d.input.domain) + "</h3><p class='wdt-sub'>" + esc(d.meta.country) + " · Google monthly searches and cost per click</p>"
      : "<h3>" + esc(d.meta.platform) + " " + (d.meta.kind === "ad" ? "ads" : "posts") + " for " + esc(d.input.domain) + "</h3><p class='wdt-sub'>5 ready-to-use variations, each in the platform's character limits</p>";
  }

  function renderPreview(d) {
    var price = "$" + d.price.toFixed(2);
    var what = KW ? d.locked + " more keywords are ready" : d.locked + " more " + (d.meta.kind === "ad" ? "ads are" : "posts are") + " ready";
    var unlock = KW ? "Unlock all " + d.total + " keywords — " + price : "Unlock all " + d.total + " — " + price;
    var free = KW ? kwTable(d.items.map(kwRow).join(""), true) : "<div class='wdt-cards'>" + d.items.map(contentCard).join("") + "</div>";
    var locked = KW
      ? kwTable(d.lockedShapes.map(function (s, j) { return kwRow({ keyword: fake(s.len), reason: fake(60), volume: 1000 + j * 370, cpc: 2.1 + j, competition: "MEDIUM", intent: "Commercial" }, d.items.length + j); }).join(""), false)
      : "<div class='wdt-cards'>" + d.lockedShapes.map(function (s, j) { return contentCard({ angle: fake(18), fields: s.fields.map(function (f) { return { label: f.label, text: fake(f.len) }; }) }, d.items.length + j); }).join("") + "</div>";
    res.innerHTML = heading(d) + free +
      "<div class='wdt-lock'><div class='wdt-blur' aria-hidden='true'>" + locked + "</div>" +
      "<div class='wdt-cta'><div class='wdt-cta-box' role='region' aria-label='Unlock the full report'>" +
      "<h4>" + what + "</h4><p>One-time payment, no subscription. Choose your file:</p>" + fmtChoice() +
      "<button type='button' class='btn red wdt-buy'>" + unlock + "</button>" +
      "<p class='wdt-fine'>Secure Stripe checkout · Instant download + emailed copy · " + (KW ? "Real Google Ads data" : "Written for your website") + ". <a href='/terms-and-conditions'>Terms</a></p>" +
      "</div></div></div>";
    res.querySelector(".wdt-buy").addEventListener("click", function () { checkout(d); });
    res.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderOrder(d) {
    var labels = { pdf: "PDF", xlsx: "Excel", docx: "Word" };
    var order = [d.format].concat(["pdf", "xlsx", "docx"].filter(function (f) { return f !== d.format; }));
    var body = KW ? kwTable(d.items.map(kwRow).join(""), true) : "<div class='wdt-cards'>" + d.items.map(contentCard).join("") + "</div>";
    res.innerHTML = "<div class='wdt-ok' role='status'><b>Payment received — thank you!</b> " + (d.email ? "We're emailing your " + labels[d.format] + " file to " + esc(d.email) + "." : "") + " Download it in any format below.</div>" +
      "<div class='wdt-dl'>" + order.map(function (f, i) {
        return "<a class='btn " + (i ? "ghost" : "red") + "' href='/api/tools/download?session=" + encodeURIComponent(d.session) + "&format=" + f + "'>Download " + labels[f] + "</a>";
      }).join("") + "</div><div style='margin-top:22px'>" + heading(d) + body + "</div>";
    try {
      var k = "wdt-purchase-" + d.session;
      if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, "1"); ev("purchase", { transaction_id: d.session, value: d.type === "keywords" ? 9.99 : 24.99, currency: "USD", items: [{ item_name: d.type === "keywords" ? "Keyword Research Report" : "Content Pack" }] }); }
    } catch (e) {}
    res.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function checkout(d) {
    var b = res.querySelector(".wdt-buy");
    var f = res.querySelector("input[name=wdt-fmt]:checked");
    b.disabled = true; b.textContent = "Opening secure checkout…";
    ev("begin_checkout", { value: d.price, currency: "USD", items: [{ item_name: KW ? "Keyword Research Report" : "Content Pack" }] });
    api("checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id, format: f ? f.value : "pdf" }) })
      .then(function (r) { location.href = r.url; })
      .catch(function (e) { b.disabled = false; b.textContent = "Try again"; setStatus(esc(e.message), true); });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = { url: fd.get("url") };
    if (KW) body.country = fd.get("country"); else { body.platform = fd.get("platform"); body.kind = fd.get("kind"); body.offer = fd.get("offer"); }
    if (!body.url) { setStatus("Enter your website address.", true); return; }
    if (!KW && !body.platform) { setStatus("Choose a platform.", true); return; }
    var ts = form.querySelector("[name='cf-turnstile-response']");
    if (ts) body.turnstile = ts.value;
    res.innerHTML = "";
    busy(true);
    api(C.type + "/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (d) { busy(false); ev("tool_preview", { tool: C.type }); renderPreview(d); try { history.replaceState(null, "", "?preview=" + d.id + "#tool"); } catch (e) {} })
      .catch(function (err) { busy(false); setStatus(esc(err.message), true); if (window.turnstile) try { window.turnstile.reset(); } catch (e) {} });
  });

  // ── Returning from Stripe ────────────────────────────────────────────────
  var q = new URLSearchParams(location.search);
  if (q.get("order")) {
    setStatus('<span class="wdt-spin" aria-hidden="true"></span>Confirming your payment…');
    var tries = 0;
    (function load() {
      api("order?session=" + encodeURIComponent(q.get("order"))).then(function (d) { setStatus(""); renderOrder(d); })
        .catch(function (e) { if (++tries < 4) setTimeout(load, 2500); else setStatus(esc(e.message), true); });
    })();
  } else if (q.get("preview")) {
    api("job?id=" + encodeURIComponent(q.get("preview"))).then(renderPreview).catch(function () {});
  }
})();
