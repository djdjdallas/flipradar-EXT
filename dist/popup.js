(()=>{var g="https://flipradar-iaxg.vercel.app",i=null,m=null,L="cloud";function c(e){let t=document.getElementById("error-alert"),n=document.getElementById("error-text");t&&n&&(n.textContent=e,t.classList.add("show"))}function v(){let e=document.getElementById("error-alert");e&&e.classList.remove("show")}function h(){let e=document.getElementById("offline-indicator");e&&(navigator.onLine?e.classList.remove("show"):e.classList.add("show"))}document.addEventListener("DOMContentLoaded",B);async function B(){h(),window.addEventListener("online",h),window.addEventListener("offline",h);let e=document.getElementById("error-dismiss");e&&e.addEventListener("click",v),await $(),E(),D(),i?(await k(),await p()):d()}async function $(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(i=t.token,m=t.user),e()})})}function E(){let e=document.getElementById("login-section"),t=document.getElementById("user-section"),n=document.getElementById("stats-section"),a=document.getElementById("usage-section"),s=document.getElementById("tabs-section"),o=document.getElementById("upgrade-banner"),r=document.getElementById("tier-badge");if(i&&m){e.style.display="none",t.style.display="flex",n.style.display="flex",a.style.display="block",s.style.display="flex",document.getElementById("user-email").textContent=m.email||"User";let u=m.tier||"free";r.textContent=u.charAt(0).toUpperCase()+u.slice(1),r.className="tier-badge "+u,u==="free"?o.style.display="block":o.style.display="none"}else e.style.display="block",t.style.display="none",n.style.display="none",a.style.display="none",s.style.display="none",o.style.display="none",r.textContent="Free",r.className="tier-badge"}function D(){document.getElementById("login-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openLogin"})}),document.getElementById("logout-btn").addEventListener("click",_),document.getElementById("upgrade-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openUpgrade"})}),document.getElementById("clear-all").addEventListener("click",F),document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>I(e.dataset.tab))}),document.getElementById("dashboard-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${g}/dashboard`})}),document.getElementById("settings-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${g}/dashboard/settings`})}),chrome.runtime.onMessage.addListener(e=>{e.type==="authSuccess"&&$().then(()=>{E(),k(),p()})})}async function _(){chrome.runtime.sendMessage({type:"logout"},()=>{chrome.runtime.lastError&&console.error("[FlipRadar] Error during logout:",chrome.runtime.lastError),i=null,m=null,E(),d()})}function I(e){L=e,document.querySelectorAll(".tab").forEach(t=>{t.classList.toggle("active",t.dataset.tab===e)}),e==="cloud"?p():d()}async function k(){if(i){if(!navigator.onLine){console.log("[FlipRadar] Offline, skipping usage fetch");return}try{let e=await fetch(`${g}/api/usage`,{headers:{Authorization:`Bearer ${i}`}});if(e.status===401){console.log("[FlipRadar] Token expired");return}if(!e.ok){console.error("[FlipRadar] Failed to load usage:",e.status);return}let t=await e.json(),n=t.lookups?.used||0,a=t.lookups?.limit||10,s=Math.min(n/a*100,100);document.getElementById("usage-text").textContent=`${n}/${a}`;let o=document.getElementById("usage-fill");o.style.width=`${s}%`,o.classList.remove("warning","danger"),s>=90?o.classList.add("danger"):s>=70&&o.classList.add("warning"),document.getElementById("total-saved").textContent=t.deals?.saved||0}catch(e){console.error("[FlipRadar] Failed to load usage:",e)}}}async function p(){if(!i){d();return}let e=document.getElementById("deals-container");if(e.innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading deals...</span>
    </div>
  `,!navigator.onLine){c("You're offline. Showing local deals instead."),d();return}try{let t=await fetch(`${g}/api/deals?limit=20`,{headers:{Authorization:`Bearer ${i}`}});if(t.status===401){c("Session expired. Please sign in again."),d();return}if(!t.ok)throw new Error(`Server error: ${t.status}`);let n=await t.json();v(),S(n.deals||[]),y(n.deals||[])}catch(t){console.error("[FlipRadar] Failed to load cloud deals:",t),c("Unable to load deals. Check your connection."),d()}}function d(){chrome.storage.local.get(["savedDeals"],e=>{let t=e.savedDeals||[];b(t),y(t)})}function S(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No saved deals yet</div>
        <div class="empty-hint">Browse FB Marketplace and click "Save Deal" to track potential flips</div>
      </div>
    `;return}let n=e.map(a=>A(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`,t.querySelectorAll(".deal-btn-delete").forEach(a=>{a.addEventListener("click",s=>{let o=s.target.dataset.id;M(o)})})}function b(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No local deals saved</div>
        <div class="empty-hint">Deals saved while offline will appear here</div>
      </div>
    `;return}let n=e.map(a=>C(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`,t.querySelectorAll(".deal-btn-delete").forEach(a=>{a.addEventListener("click",s=>{let o=s.target.dataset.id;x(o)})})}function A(e){let t=e.user_asking_price?`$${e.user_asking_price.toLocaleString()}`:"N/A",n=w(e.created_at),a="";if(e.ebay_estimate_low&&e.ebay_estimate_high&&e.user_asking_price){let o=Math.round(e.ebay_estimate_low*.84-e.user_asking_price),r=Math.round(e.ebay_estimate_high*.84-e.user_asking_price);a=`
      <div class="deal-profit ${r<0?"negative":""}">
        Est. profit: ${o>=0?"+":""}$${o} to ${r>=0?"+":""}$${r}
      </div>
    `}return`
    <div class="deal-card synced" data-id="${l(String(e.id))}">
      <div class="deal-title" title="${l(e.user_title)}">${l(e.user_title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${t}</span>
        <span class="deal-date">${n}</span>
      </div>
      ${a}
      <div class="deal-actions">
        <a href="${f(e.source_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebay_search_url?`<a href="${f(e.ebay_search_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${l(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function C(e){let t=e.price?`$${e.price.toLocaleString()}`:"N/A",n=w(e.savedAt);return`
    <div class="deal-card" data-id="${l(String(e.id))}">
      <div class="deal-title" title="${l(e.title)}">${l(e.title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${t}</span>
        <span class="deal-date">${n}</span>
      </div>
      <div class="deal-actions">
        <a href="${f(e.url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebayUrl?`<a href="${f(e.ebayUrl)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${l(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function y(e){let t=e.length,n=new Date;n.setDate(n.getDate()-7);let a=e.filter(s=>new Date(s.savedAt||s.created_at)>=n).length;document.getElementById("total-saved").textContent=t,document.getElementById("this-week").textContent=a}async function M(e){if(i){if(!navigator.onLine){c("Cannot delete while offline.");return}try{(await fetch(`${g}/api/deals?id=${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${i}`}})).ok?(v(),p()):c("Failed to delete deal. Please try again.")}catch(t){console.error("[FlipRadar] Failed to delete deal:",t),c("Failed to delete deal. Check your connection.")}}}function x(e){chrome.storage.local.get(["savedDeals"],t=>{let a=(t.savedDeals||[]).filter(s=>s.id!==e);chrome.storage.local.set({savedDeals:a},()=>{b(a),y(a)})})}function F(){confirm("Are you sure you want to clear all deals?")&&(L==="cloud"&&i?alert("Please delete deals individually from the cloud tab, or use the dashboard for bulk actions."):chrome.storage.local.set({savedDeals:[]},()=>{b([]),y([])}))}function w(e){if(!e)return"";let t=new Date(e),a=new Date-t,s=Math.floor(a/(1e3*60*60*24));return s===0?"Today":s===1?"Yesterday":s<7?`${s} days ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function l(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function f(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}})();
