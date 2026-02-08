(()=>{var g="https://flipradar-iaxg.vercel.app",o=null,m=null,v="cloud";function u(e){let t=document.getElementById("error-alert"),n=document.getElementById("error-text");t&&n&&(n.textContent=e,t.classList.add("show"))}function b(){let e=document.getElementById("error-alert");e&&e.classList.remove("show")}function h(){let e=document.getElementById("offline-indicator");e&&(navigator.onLine?e.classList.remove("show"):e.classList.add("show"))}document.addEventListener("DOMContentLoaded",k);async function k(){h(),window.addEventListener("online",h),window.addEventListener("offline",h);let e=document.getElementById("error-dismiss");e&&e.addEventListener("click",b),await $(),E(),D(),o?(await w(),await p()):c()}async function $(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(o=t.token,m=t.user),e()})})}function E(){let e=document.getElementById("login-section"),t=document.getElementById("user-section"),n=document.getElementById("stats-section"),a=document.getElementById("usage-section"),s=document.getElementById("tabs-section"),i=document.getElementById("upgrade-banner"),d=document.getElementById("tier-badge");if(o&&m){e.style.display="none",t.style.display="flex",n.style.display="flex",a.style.display="block",s.style.display="flex",document.getElementById("user-email").textContent=m.email||"User";let l=m.tier||"free";d.textContent=l.charAt(0).toUpperCase()+l.slice(1),d.className="tier-badge "+l,l==="free"?i.style.display="block":i.style.display="none"}else e.style.display="block",t.style.display="none",n.style.display="none",a.style.display="none",s.style.display="none",i.style.display="none",d.textContent="Free",d.className="tier-badge"}function D(){document.getElementById("login-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openLogin"})}),document.getElementById("logout-btn").addEventListener("click",I),document.getElementById("upgrade-btn").addEventListener("click",()=>{chrome.runtime.sendMessage({type:"openUpgrade"})}),document.getElementById("clear-all").addEventListener("click",F),document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>_(e.dataset.tab))}),document.getElementById("dashboard-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${g}/dashboard`})}),document.getElementById("settings-link").addEventListener("click",e=>{e.preventDefault(),chrome.tabs.create({url:`${g}/dashboard/settings`})}),document.getElementById("deals-container").addEventListener("click",e=>{let t=e.target.closest(".deal-btn-delete");if(!t)return;let n=t.dataset.id;n&&(v==="cloud"&&o?x(n):A(n))}),chrome.runtime.onMessage.addListener(e=>{e.type==="authSuccess"&&$().then(()=>{E(),w(),p()})})}async function I(){chrome.runtime.sendMessage({type:"logout"},()=>{chrome.runtime.lastError&&console.error("[FlipRadar] Error during logout:",chrome.runtime.lastError),o=null,m=null,E(),c()})}function _(e){v=e,document.querySelectorAll(".tab").forEach(t=>{t.classList.toggle("active",t.dataset.tab===e)}),e==="cloud"?p():c()}async function w(){if(o){if(!navigator.onLine){console.log("[FlipRadar] Offline, skipping usage fetch");return}try{let e=await fetch(`${g}/api/usage`,{headers:{Authorization:`Bearer ${o}`}});if(e.status===401){console.log("[FlipRadar] Token expired");return}if(!e.ok){console.error("[FlipRadar] Failed to load usage:",e.status);return}let t=await e.json(),n=t.lookups?.used||0,a=t.lookups?.limit||10,s=Math.min(n/a*100,100);document.getElementById("usage-text").textContent=`${n}/${a}`;let i=document.getElementById("usage-fill");i.style.width=`${s}%`,i.classList.remove("warning","danger"),s>=90?i.classList.add("danger"):s>=70&&i.classList.add("warning"),document.getElementById("total-saved").textContent=t.deals?.saved||0}catch(e){console.error("[FlipRadar] Failed to load usage:",e)}}}async function p(){if(!o){c();return}let e=document.getElementById("deals-container");if(e.innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading deals...</span>
    </div>
  `,!navigator.onLine){u("You're offline. Showing local deals instead."),c();return}try{let t=await fetch(`${g}/api/deals?limit=20`,{headers:{Authorization:`Bearer ${o}`}});if(t.status===401){u("Session expired. Please sign in again."),c();return}if(!t.ok)throw new Error(`Server error: ${t.status}`);let n=await t.json();b(),S(n.deals||[]),y(n.deals||[])}catch(t){console.error("[FlipRadar] Failed to load cloud deals:",t),u("Unable to load deals. Check your connection."),c()}}function c(){chrome.storage.local.get(["savedDeals"],e=>{let t=e.savedDeals||[];L(t),y(t)})}function S(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No saved deals yet</div>
        <div class="empty-hint">Browse FB Marketplace and click "Save Deal" to track potential flips</div>
      </div>
    `;return}let n=e.map(a=>C(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`}function L(e){let t=document.getElementById("deals-container");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">\u{1F4E6}</div>
        <div class="empty-text">No local deals saved</div>
        <div class="empty-hint">Deals saved while offline will appear here</div>
      </div>
    `;return}let n=e.map(a=>M(a)).join("");t.innerHTML=`<div class="deals-list">${n}</div>`}function C(e){let t=Number(e.user_asking_price),n=!isNaN(t)&&t>0?`$${t.toLocaleString()}`:"N/A",a=r(B(e.created_at)),s="";if(e.ebay_estimate_low&&e.ebay_estimate_high&&e.user_asking_price){let d=Math.round(e.ebay_estimate_low*.84-e.user_asking_price),l=Math.round(e.ebay_estimate_high*.84-e.user_asking_price);s=`
      <div class="deal-profit ${l<0?"negative":""}">
        Est. profit: ${d>=0?"+":""}$${d} to ${l>=0?"+":""}$${l}
      </div>
    `}return`
    <div class="deal-card synced" data-id="${r(String(e.id))}">
      <div class="deal-title" title="${r(e.user_title)}">${r(e.user_title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${n}</span>
        <span class="deal-date">${a}</span>
      </div>
      ${s}
      <div class="deal-actions">
        <a href="${f(e.source_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebay_search_url?`<a href="${f(e.ebay_search_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${r(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function M(e){let t=Number(e.price),n=!isNaN(t)&&t>0?`$${t.toLocaleString()}`:"N/A",a=r(B(e.savedAt));return`
    <div class="deal-card" data-id="${r(String(e.id))}">
      <div class="deal-title" title="${r(e.title)}">${r(e.title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${n}</span>
        <span class="deal-date">${a}</span>
      </div>
      <div class="deal-actions">
        <a href="${f(e.url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${e.ebayUrl?`<a href="${f(e.ebayUrl)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>`:""}
        <button class="deal-btn deal-btn-delete" data-id="${r(String(e.id))}" title="Delete">\xD7</button>
      </div>
    </div>
  `}function y(e){let t=e.length,n=new Date;n.setDate(n.getDate()-7);let a=e.filter(s=>new Date(s.savedAt||s.created_at)>=n).length;document.getElementById("total-saved").textContent=t,document.getElementById("this-week").textContent=a}async function x(e){if(o){if(!navigator.onLine){u("Cannot delete while offline.");return}try{(await fetch(`${g}/api/deals?id=${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${o}`}})).ok?(b(),p()):u("Failed to delete deal. Please try again.")}catch(t){console.error("[FlipRadar] Failed to delete deal:",t),u("Failed to delete deal. Check your connection.")}}}function A(e){chrome.storage.local.get(["savedDeals"],t=>{let a=(t.savedDeals||[]).filter(s=>s.id!==e);chrome.storage.local.set({savedDeals:a},()=>{L(a),y(a)})})}function F(){confirm("Are you sure you want to clear all deals?")&&(v==="cloud"&&o?alert("Please delete deals individually from the cloud tab, or use the dashboard for bulk actions."):chrome.storage.local.set({savedDeals:[]},()=>{L([]),y([])}))}function B(e){if(!e)return"";let t=new Date(e),a=new Date-t,s=Math.floor(a/(1e3*60*60*24));return s===0?"Today":s===1?"Yesterday":s<7?`${s} days ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function r(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function f(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}})();
