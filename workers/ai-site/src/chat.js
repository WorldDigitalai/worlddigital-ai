// "AI Ahmad" chat widget on every worlddigital.ai page (worlddigital.ai only, not worlddigital.us).
// A corner button opens a small chat panel; questions go to POST /api/tools/chat (backend/app/chat.py, OpenAI).
// The panel is built on first open, so pages pay nothing until a visitor clicks. History lives in sessionStorage
// for the current tab only. Avatar: /ai-ahmad.webp (Ahmad's cartoon in the brand ring, "AI" badge in CSS).

const CSS = `
.aic-btn{position:fixed;right:20px;bottom:20px;z-index:80;width:68px;height:68px;border-radius:50%;border:0;padding:0;background:none;cursor:pointer;box-shadow:0 12px 28px -8px rgba(14,26,43,.45);transition:transform .2s}
.aic-btn:hover{transform:scale(1.06)}.aic-btn:focus-visible{outline:3px solid #0D5EC7;outline-offset:3px}
.aic-btn img{width:68px;height:68px;border-radius:50%;display:block}
.aic-ai{position:absolute;right:-4px;bottom:-2px;font:800 11px/1 Sora,Inter,sans-serif;color:#fff;background:linear-gradient(100deg,#C13A2A,#9C5A7A 50%,#0D5EC7);border:2px solid #fff;border-radius:999px;padding:3px 6px}
.aic-dot{position:absolute;right:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#22C55E;border:2px solid #fff}
.aic-tip{position:fixed;right:98px;bottom:34px;z-index:80;background:#0E1A2B;color:#fff;font:600 14px Inter,sans-serif;padding:10px 14px;border-radius:14px 14px 4px 14px;box-shadow:0 10px 24px -10px rgba(14,26,43,.5);cursor:pointer}
.aic-tip[hidden]{display:none}
.aic-panel{position:fixed;right:20px;bottom:100px;z-index:81;width:370px;max-width:calc(100vw - 24px);height:540px;max-height:calc(100vh - 130px);display:flex;flex-direction:column;background:#fff;border:1px solid #DCE5EF;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px -20px rgba(14,26,43,.45);font-family:Inter,sans-serif}
.aic-panel[hidden]{display:none}
.aic-hd{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(100deg,#0B1A33,#13284D);color:#fff}
.aic-hd img{width:42px;height:42px;border-radius:50%}
.aic-hd b{display:block;font-size:15px}.aic-hd small{font-size:12px;color:#9FE3B4}
.aic-x{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}
.aic-x:focus-visible{outline:2px solid #fff}
.aic-note{font-size:11.5px;color:#4A5B70;background:#F4F8FC;padding:7px 14px;border-bottom:1px solid #DCE5EF}
.aic-log{flex:1;overflow-y:auto;padding:14px;background:#F7F9FC;display:flex;flex-direction:column;gap:10px}
.aic-m{max-width:85%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
.aic-m.bot{align-self:flex-start;background:#fff;color:#0E1A2B;border-radius:16px 16px 16px 4px;box-shadow:0 1px 4px rgba(14,26,43,.08)}
.aic-m.me{align-self:flex-end;background:#0D5EC7;color:#fff;border-radius:16px 16px 4px 16px}
.aic-m a{color:#0D5EC7;font-weight:600}.aic-m.me a{color:#fff}
.aic-m.err{background:#FDECEA;color:#8A2A1E}
.aic-typing{align-self:flex-start;color:#4A5B70;font-size:13px}
.aic-chips[hidden]{display:none}
.aic-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#F7F9FC}
.aic-chips button{font:600 12.5px Inter,sans-serif;color:#0B4FA8;background:#fff;border:1px solid #C9D8EA;border-radius:999px;padding:6px 11px;cursor:pointer}
.aic-f{display:flex;gap:8px;padding:10px;border-top:1px solid #DCE5EF;background:#fff}
.aic-f input{flex:1;min-width:0;font:16px Inter,sans-serif;padding:11px 12px;border:1px solid #C9D8EA;border-radius:12px}
.aic-f input:focus{outline:2px solid #0D5EC7;border-color:transparent}
.aic-f button{font:700 14px Inter,sans-serif;color:#fff;background:#0D5EC7;border:0;border-radius:12px;padding:0 16px;cursor:pointer}
.aic-f button:disabled{opacity:.5;cursor:default}
@media (max-width:720px){.aic-btn{bottom:86px;right:14px;width:60px;height:60px}.aic-btn img{width:60px;height:60px}
.aic-tip{bottom:100px;right:84px}.aic-panel{right:12px;bottom:156px;height:auto;max-height:calc(100vh - 180px)}}
@media print{.aic-btn,.aic-tip,.aic-panel{display:none}}
`;

const JS = `(function(){
var K='aic-log',btn=document.getElementById('aic-btn'),tip=document.getElementById('aic-tip'),panel,log,input,send,busy=false,msgs=[];
function load(){try{msgs=JSON.parse(sessionStorage.getItem(K)||'[]')||[]}catch(e){msgs=[]}}
function save(){try{sessionStorage.setItem(K,JSON.stringify(msgs.slice(-20)))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function links(s){return esc(s).replace(/(^|[\\s(])(\\/[a-z0-9][a-z0-9\\-\\/]*[a-z0-9])(?=[\\s.,!?)]|$)/gi,'$1<a href="$2">$2</a>').replace(/support@worlddigital\\.ai/g,'<a href="mailto:support@worlddigital.ai">support@worlddigital.ai</a>')}
function add(role,text,cls){var d=document.createElement('div');d.className='aic-m '+(role==='user'?'me':'bot')+(cls?' '+cls:'');d.innerHTML=links(text);log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
var HELLO="Hi! I'm AI Ahmad, the AI assistant for WorldDigital.ai. Ask me about our SEO plan, Google Ads, websites, or your free SEO report.";
function build(){
 panel=document.createElement('div');panel.className='aic-panel';panel.id='aic-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Chat with AI Ahmad');panel.hidden=true;
 panel.innerHTML='<div class="aic-hd"><img src="/ai-ahmad.webp" alt="AI Ahmad" width="42" height="42"><div><b>AI Ahmad \\u00b7 WorldDigital AI</b><small>\\u25cf AI assistant \\u00b7 online</small></div><button type="button" class="aic-x" aria-label="Close chat">\\u00d7</button></div>'
 +'<div class="aic-note">I\\u2019m an AI assistant, not Ahmad in person. Need a real person? <a href="/contact">Contact us</a>.</div>'
 +'<div class="aic-log" aria-live="polite"></div><div class="aic-chips"></div>'
 +'<form class="aic-f"><label class="sr-only" for="aic-in" style="position:absolute;left:-9999px">Your question</label><input id="aic-in" maxlength="800" autocomplete="off" placeholder="Ask me anything\\u2026"><button type="submit">Send</button></form>';
 document.body.appendChild(panel);
 log=panel.querySelector('.aic-log');input=panel.querySelector('input');send=panel.querySelector('.aic-f button');
 panel.querySelector('.aic-x').onclick=close;
 panel.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 panel.querySelector('form').onsubmit=function(e){e.preventDefault();ask(input.value)};
 var chips=panel.querySelector('.aic-chips');
 ['How much is the SEO plan?','Get a free SEO report','Google Ads help','Talk to a person'].forEach(function(q){var b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=function(){ask(q)};chips.appendChild(b)});
 load();add('assistant',HELLO);msgs.forEach(function(m){add(m.role,m.content)});
 if(msgs.length)chips.hidden=true;
}
function open(){if(!panel)build();panel.hidden=false;tip.hidden=true;btn.setAttribute('aria-expanded','true');try{sessionStorage.setItem('aic-seen','1')}catch(e){}if(!window.matchMedia||matchMedia('(pointer:fine)').matches)setTimeout(function(){input.focus()},50)}
function close(){panel.hidden=true;btn.setAttribute('aria-expanded','false');btn.focus()}
function ask(q){q=String(q||'').trim();if(!q||busy)return;input.value='';panel.querySelector('.aic-chips').hidden=true;
 msgs.push({role:'user',content:q.slice(0,800)});add('user',q);save();busy=true;send.disabled=true;
 var t=document.createElement('div');t.className='aic-typing';t.textContent='AI Ahmad is typing\\u2026';log.appendChild(t);log.scrollTop=log.scrollHeight;
 fetch('/api/tools/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs.slice(-10)})})
 .then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,d:d}})})
 .then(function(x){t.remove();if(x.ok&&x.d.reply){msgs.push({role:'assistant',content:x.d.reply});save();add('assistant',x.d.reply)}else{msgs.pop();save();add('assistant',x.d.error||'Sorry, I can\\u2019t answer right now. Please try again, or use /contact.','err')}})
 .catch(function(){t.remove();msgs.pop();save();add('assistant','Connection problem. Please try again, or use /contact.','err')})
 .then(function(){busy=false;send.disabled=false;if(!window.matchMedia||matchMedia('(pointer:fine)').matches)input.focus()})}
btn.onclick=function(){panel&&!panel.hidden?close():open()};
tip.onclick=open;
var seen=false;try{seen=!!sessionStorage.getItem('aic-seen')}catch(e){}
if(!seen)setTimeout(function(){if(!panel||panel.hidden)tip.hidden=false},6000);
})();`;

export const CHAT_HTML = `<style>${CSS}</style>
<button type="button" class="aic-btn" id="aic-btn" aria-label="Chat with AI Ahmad, our AI assistant" aria-controls="aic-panel" aria-expanded="false"><img src="/ai-ahmad.webp" alt="AI Ahmad, AI assistant" width="68" height="68" loading="lazy"><span class="aic-ai" aria-hidden="true">AI</span><span class="aic-dot" aria-hidden="true"></span></button>
<div class="aic-tip" id="aic-tip" hidden>Need help? Ask AI Ahmad 👋</div>
<script>${JS}</script>`;
