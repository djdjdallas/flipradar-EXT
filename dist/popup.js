(()=>{var d="https://flipchecker.io",s=null,p=null,y="cloud",h=[],m=[];function r(e){let t=document.getElementById("error-alert"),n=document.getElementById("error-text");t&&n&&(n.textContent=e,t.classList.add("show"))}function v(){let e=document.getElementById("error-alert");e&&e.classList.remove("show")}function k(){let e=document.getElementById("offline-indicator");e&&(navigator.onLine?e.classList.remove("show"):e.classList.add("show"))}document.addEventListener("DOMContentLoaded",A);async function A(){k(),window.addEventListener("online",k),window.addEventListener("offline",k);let e=document.getElementById("error-dismiss");e&&e.addEventListener("click",v),await I(),$(),D(),s?(await C(),await b()):f()}async function I(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(s=t.token,p=t.user),e()})})}function $(){let e=document.getElementById("login-section"),t=document.getElementById("user-section"),n=document.getElementById("stats-section"),a=document.getElementById("usage-section"),i=document.getElementById("tabs-section"),o=document.getElementById("upgrade-banner"),u=document.getElementById("tier-badge");if(s&&p){e.style.display="none",t.style.display="flex",n.style.display="flex",a.style.display="block",i.style.display="flex",document.getElementById("user-email").textContent=p.email||"User";let c=p.tier||"free";u.textContent=c.charAt(0).toUpperCase()+c.slice(1),u.className="tier-badge "+c,c==="free"?o.style.display="block":o.style.display="none"}else e.style.display="block",t.style.display="none",n.style.display="none",a.style.display="none",i.style.display="none",o.style.display="none",u.textContent="Free",u.className="tier-badge"}function D(){document.getElementById("login-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openLogin"})}),document.getElementById("logout-btn").addEventListener("click",S),document.getElementById("upgrade-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openUpgrade"})}),document.getElementById("clear-all").addEventListener("click",U),document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>x(e.dataset.tab))}),document.getElementById("dashboard-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${d}/dashboard`})}),document.getElementById("settings-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${d}/dashboard/settings`})}),document.getElementById("deals-container").addEventListener("click",e=>{let t=e.target.closest(".deal-btn-delete");if(!t)return;let n=t.dataset.id;n&&(y==="cloud"&&s?H(n):P(n))}),chrome.runtime.onMessage.addListener(e=>{e.type==="authSuccess"&&I().then(()=>{$(),C(),b()})}),chrome.storage.onChanged.addListener((e,t)=>{t==="local"&&e.watchlistAlerts&&y==="watchlist"&&(m=e.watchlistAlerts.newValue||[],E())})}async function S(){chrome.runtime.sendMessage({type:"logout"},()=>{chrome.runtime.lastError&&console.error("[FlipChecker] Error during logout:",chrome.runtime.lastError),s=null,p=null,$(),f()})}function x(e){y=e,document.querySelectorAll(".tab").forEach(i=>{i.classList.toggle("active",i.dataset.tab===e)});let t=document.getElementById("deals-container"),n=document.getElementById("watchlist-container"),a=document.querySelector(".section-header");e==="watchlist"?(t.style.display="none",n.style.display="block",a&&(a.style.display="none"),j()):(t.style.display="block",n.style.display="none",a&&(a.style.display="flex"),e==="cloud"?b():f())}async function C(){if(s){if(!navigator.onLine){console.log("[FlipChecker] Offline, skipping usage fetch");return}try{let e=await fetch(`${d}/api/usage`,{headers:{Authorization:`Bearer ${s}`}});if(e.status===401){console.log("[FlipChecker] Token expired");return}if(!e.ok){console.error("[FlipChecker] Failed to load usage:",e.status);return}let t=await e.json(),n=t.lookups?.used||0,a=t.lookups?.limit||10,i=Math.min(n/a*100,100);document.getElementById("usage-text").textContent=`${n}/${a}`;let o=document.getElementById("usage-fill");o.style.width=`${i}%`,o.classList.remove("warning","danger"),i>=90?o.classList.add("danger"):i>=70&&o.classList.add("warning"),document.getElementById("total-saved").textContent=t.deals?.saved||0}catch(e){console.error("[FlipChecker] Failed to load usage:",e)}}}async function b(){if(!s){f();return}let e=document.getElementById("deals-container");if(e.innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading deals...</span>
    </div>
  `,!navigator.onLine){r("You're offline. Showing local deals instead."),f();return}try{let t=await fetch(`${d}/api/deals?limit=20`,{headers:{Authorization:`Bearer ${s}`}});if(t.status===401){r("Session expired. Please sign in again."),f();return}if(!t.ok)throw new Error(`Server error: ${t.status}`);let n=await t.json();v(),M(n.deals||[]),w(n.deals||[])}catch(t){console.error("[FlipChecker] Failed to load cloud deals:",t),r("Unable to load deals. Check your connection."),f()}}function f(){chrome.storage.local.get(["savedDeals"],e=>{let t=e.savedDeals||[];L(t),w(t)})}function M(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No saved deals yet</div>
        <div class="empty-hint">Browse FB Marketplace and click "Save Deal" to track potential flips</div>
      </div>
    `;return}let n=e.map(a=>N(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`}function L(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No local deals saved</div>
        <div class="empty-hint">Deals saved while offline will appear here</div>
      </div>
    `;return}let n=e.map(a=>T(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`}function N(e){let t=Number(e.user_asking_price),n=!isNaN(t)&&t>0?`$${t.toLocaleString()}`:"N/A",a=l(_(e.created_at)),i="";if(e.ebay_estimate_low&&e.ebay_estimate_high&&e.user_asking_price){let u=Math.round(e.ebay_estimate_low*.84-e.user_asking_price),c=Math.round(e.ebay_estimate_high*.84-e.user_asking_price);i=`
      <div class="deal-profit ${c<0?"negative":""}">
        Est. profit: ${u>=0?"+":""}$${u} to ${c>=0?"+":""}$${c}
      </div>
    `}return`
    <div class="deal-card synced" data-id="${l(String(e.id))}">
      <div class="deal-title" title="${l(e.user_title)}">${l(e.user_title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${n}</span>
        <span class="deal-date">${a}</span>
      </div>
      ${i}
      <div class="deal-actions">
        <a href="${g(e.source_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebay_search_url?`<a href="${g(e.ebay_search_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${l(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function T(e){let t=Number(e.price),n=!isNaN(t)&&t>0?`$${t.toLocaleString()}`:"N/A",a=l(_(e.savedAt));return`
    <div class="deal-card" data-id="${l(String(e.id))}">
      <div class="deal-title" title="${l(e.title)}">${l(e.title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${n}</span>
        <span class="deal-date">${a}</span>
      </div>
      <div class="deal-actions">
        <a href="${g(e.url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebayUrl?`<a href="${g(e.ebayUrl)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${l(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function w(e){let t=e.length,n=new Date;n.setDate(n.getDate()-7);let a=e.filter(i=>new Date(i.savedAt||i.created_at)>=n).length;document.getElementById("total-saved").textContent=t,document.getElementById("this-week").textContent=a}async function H(e){if(s){if(!navigator.onLine){r("Cannot delete while offline.");return}try{(await fetch(`${d}/api/deals?id=${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${s}`}})).ok?(v(),b()):r("Failed to delete deal. Please try again.")}catch(t){console.error("[FlipChecker] Failed to delete deal:",t),r("Failed to delete deal. Check your connection.")}}}function P(e){chrome.storage.local.get(["savedDeals"],t=>{let a=(t.savedDeals||[]).filter(i=>i.id!==e);chrome.storage.local.set({savedDeals:a},()=>{L(a),w(a)})})}function U(){confirm("Are you sure you want to clear all deals?")&&(y==="cloud"&&s?alert("Please delete deals individually from the cloud tab, or use the dashboard for bulk actions."):chrome.storage.local.set({savedDeals:[]},()=>{L([]),w([])}))}function _(e){if(!e)return"";let t=new Date(e),a=new Date-t,i=Math.floor(a/(1e3*60*60*24));return i===0?"Today":i===1?"Yesterday":i<7?`${i} days ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function l(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function g(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}async function j(){let e=document.getElementById("watchlist-container");e.innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading watchlist...</span>
    </div>
  `,await B(),z(),F()}async function B(){if(!s){h=[];return}try{let e=await fetch(`${d}/api/watchlist/filters`,{headers:{Authorization:`Bearer ${s}`}});e.ok&&(h=(await e.json()).filters||[],chrome.storage.local.set({watchlistFilters:h}))}catch(e){console.error("[FlipChecker] Failed to load watchlist filters:",e)}}function z(){chrome.storage.local.get(["watchlistAlerts"],e=>{m=e.watchlistAlerts||[],y==="watchlist"&&E()})}function F(){let e=document.getElementById("watchlist-container"),t=`
    <div class="filter-form" id="filter-form">
      <div class="filter-form-title">Add Watchlist Filter</div>
      <input type="text" class="filter-input" id="filter-keywords" placeholder="Keywords (e.g. nintendo switch)" />
      <div class="filter-row">
        <input type="number" class="filter-input" id="filter-max-price" placeholder="Max buy price ($)" min="1" />
        <input type="number" class="filter-input" id="filter-min-profit" placeholder="Min profit ($)" min="0" />
      </div>
      <button class="filter-save-btn" id="filter-save-btn">Save Filter</button>
    </div>
  `,n=h.length>0?'<div class="watchlist-section-title">Active Filters</div>'+h.map(i=>W(i)).join(""):"";e.innerHTML=t+n+`
    <div class="watchlist-section-title">
      Recent Alerts
      ${m.length>0?'<button class="clear-alerts-btn" id="clear-alerts-btn">Clear All</button>':""}
    </div>
    <div id="alerts-list"></div>
  `,document.getElementById("filter-save-btn").addEventListener("click",O),e.querySelectorAll(".filter-delete-btn").forEach(i=>{i.addEventListener("click",()=>q(i.dataset.id))});let a=document.getElementById("clear-alerts-btn");a&&a.addEventListener("click",V),E()}function W(e){return`
    <div class="filter-card">
      <div class="filter-info">
        <div class="filter-keywords">${l(e.keywords)}</div>
        <div class="filter-details">Max: $${Number(e.max_buy_price).toLocaleString()} | Min profit: $${Number(e.min_profit).toLocaleString()}</div>
      </div>
      <button class="filter-delete-btn" data-id="${l(String(e.id))}">&times;</button>
    </div>
  `}function E(){let e=document.getElementById("alerts-list");if(!e)return;if(m.length===0){e.innerHTML=`
      <div class="empty-state" style="padding: 20px;">
        <div class="empty-text" style="font-size: 13px;">No alerts yet</div>
        <div class="empty-hint">Alerts appear when the scanner finds matching deals while you browse FB Marketplace</div>
      </div>
    `;return}let t=[...m].sort((n,a)=>(a.profit||0)-(n.profit||0));e.innerHTML=t.map(n=>`
    <div class="alert-card">
      <div class="alert-title" title="${l(n.title)}">${l(n.title)}</div>
      <div class="alert-meta">
        <span class="alert-price">$${Number(n.price).toLocaleString()}</span>
        <span class="alert-profit">+$${n.profit} profit</span>
      </div>
      <a href="${g(n.url)}" target="_blank" rel="noopener" class="alert-link">View on FB</a>
    </div>
  `).join("")}async function O(){let e=document.getElementById("filter-keywords")?.value?.trim(),t=parseFloat(document.getElementById("filter-max-price")?.value),n=parseFloat(document.getElementById("filter-min-profit")?.value);if(!e){r("Please enter keywords for your filter.");return}if(isNaN(t)||t<=0){r("Please enter a valid max buy price.");return}if(isNaN(n)||n<0){r("Please enter a valid min profit.");return}if(!s){r("Please sign in to save filters.");return}try{let a=await fetch(`${d}/api/watchlist/filters`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify({keywords:e,max_buy_price:t,min_profit:n})});if(a.status===403){let i=await a.json();r(i.error||"Filter limit reached. Upgrade for more.");return}if(!a.ok){let i=await a.json();r(i.error||"Failed to save filter.");return}v(),await B(),F()}catch(a){console.error("[FlipChecker] Failed to save filter:",a),r("Failed to save filter. Check your connection.")}}async function q(e){if(!(!s||!e))try{(await fetch(`${d}/api/watchlist/filters?id=${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${s}`}})).ok?(v(),await B(),F()):r("Failed to delete filter.")}catch(t){console.error("[FlipChecker] Failed to delete filter:",t),r("Failed to delete filter. Check your connection.")}}function V(){chrome.storage.local.set({watchlistAlerts:[]},()=>{m=[],E()})}})();
