(()=>{var y="flipradar-overlay",S="flipradar-trigger",L="https://flipradar-iaxg.vercel.app";var g={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function z(e){g={...g,...e}}function v(){return g.authToken}function ae(){return g.currentUser}function se(e){g.lastExtractedData=e}function w(){return g.lastExtractedData}function le(){g.lastExtractedData=null}function ce(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return g.currentJobId=e,g.isExtracting=!0,console.log("[FlipRadar] Started job:",e),e}function x(e){return g.currentJobId===e}function R(e){g.currentJobId===e&&(g.isExtracting=!1,console.log("[FlipRadar] Ended job:",e))}var q=typeof window<"u"?window.location.href:"",B=null,P=null,de=!1,pe=[];function ue(e){pe.push(e)}function Xe(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function H(e=window.location.href){return e.includes("/marketplace/item/")}function Je(){let e=document.getElementById(S),t=document.getElementById(y);e&&e.remove(),t&&t.remove()}function je(e,t){pe.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipRadar] Navigation callback error:",o)}})}function N(){let e=window.location.href;if(console.log("[FlipRadar] Navigation detected:",e),H(e)){let t=Xe(e),o=w()?.itemId;t!==o&&(console.log("[FlipRadar] New item detected, clearing cache. Previous:",o,"New:",t),le()),je(e,t)}else Je()}function We(){let e=history.pushState,t=history.replaceState;history.pushState=function(...r){e.apply(this,r),N()},history.replaceState=function(...r){t.apply(this,r),N()},window.addEventListener("popstate",N),console.log("[FlipRadar] History API listeners installed")}function Qe(){P&&(P.disconnect(),P=null);let e=new MutationObserver(()=>{B&&clearTimeout(B),B=setTimeout(()=>{window.location.href!==q&&(q=window.location.href,N())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),P=e,console.log("[FlipRadar] MutationObserver backup installed"),e}function fe(){if(de){console.log("[FlipRadar] Navigation already initialized, skipping");return}de=!0,q=window.location.href,We(),Qe()}var ge=new Map,Ve=[];function me(e){return ge.get(e)||null}function Ye(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let r=t.data.marketplace_product_details_page;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,currency:r.listing_price?.currency,location:r.location?.reverse_geocode?.city||r.location_text?.text,seller:r.marketplace_listing_seller?.name,description:r.redacted_description?.text,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),condition:r.condition,category:r.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let r=t.data.node;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,location:r.location_text?.text,seller:r.story?.comet_sections?.seller?.seller?.name,source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let r=t.data.marketplace_pdp.product;return{itemId:r.id,title:r.title||r.name,price:r.price?.amount,priceFormatted:r.price?.formatted,location:r.location,seller:r.seller?.name,source:"graphql"}}return null}catch(t){return console.warn("[FlipRadar] GraphQL parse error:",t.message),null}}function Ze(e,t){console.log("[FlipRadar] Intercepted GraphQL data for item:",e),ge.set(e,t),Ve.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipRadar] Data callback error:",o)}})}function he(){let e=document.createElement("script");e.textContent=`
    (function() {
      // Only install once
      if (window.__flipradarInterceptorInstalled) return;
      window.__flipradarInterceptorInstalled = true;

      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      // Intercept fetch()
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

          // Check if this is a GraphQL request
          if (url && (url.includes('/api/graphql') || url.includes('/graphql'))) {
            const clone = response.clone();
            clone.json().then(data => {
              window.postMessage({
                type: 'FLIPRADAR_GRAPHQL_RESPONSE',
                source: 'fetch',
                url: url,
                data: data
              }, '*');
            }).catch(function(err) {
              if (err && err.name !== 'AbortError') {
                console.warn('[FlipRadar] Fetch intercept parse error:', err.message);
              }
            });
          }
        } catch (e) {
          // Silently fail - don't break page functionality
        }

        return response;
      };

      // Intercept XMLHttpRequest
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._flipradarUrl = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        if (!this._flipradarListenerAdded) {
          this._flipradarListenerAdded = true;
          this.addEventListener('load', function() {
            try {
              const url = this._flipradarUrl;
              if (url && (url.includes('/api/graphql') || url.includes('/graphql'))) {
                const data = JSON.parse(this.responseText);
                window.postMessage({
                  type: 'FLIPRADAR_GRAPHQL_RESPONSE',
                  source: 'xhr',
                  url: url,
                  data: data
                }, '*');
              }
            } catch (e) {
              // Silently fail - don't break page functionality
            }
          });
        }
        return originalXHRSend.apply(this, args);
      };

      console.log('[FlipRadar] Network interceptor installed in page context');
    })();
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPRADAR_GRAPHQL_RESPONSE"){let r=Ye(t.data.data);r&&r.itemId&&Ze(r.itemId,r)}}),console.log("[FlipRadar] Network interception listener installed")}var xe={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var be={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},ye={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},_e={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]'],tier3:[]};function T(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var G=/^\$[\d,]+(\.\d{2})?$/,ve=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],Ee=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var et=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],tt=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function k(e){if(!e)return!0;let t=e.toLowerCase().trim();if(et.includes(t))return!0;for(let r of tt)if(r.test(e))return!0;return e.length<5}function we(e,t){if(!e||!t)return!1;let r=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&r.test(t)}function j(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function D(){return document.querySelector('div[role="main"]')}function Re(e=1e4){let t=D();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function b(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function Ie(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function I(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),r=parseFloat(t);return isNaN(r)?null:r}function h(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function F(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function W(e,t,r,o=.84){return{low:Math.round(t*o-e),high:Math.round(r*o-e)}}function Q(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function V(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function $(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function A(){return window.location.href.includes("/marketplace/item/")}function Le(e,t,r=5e3,o=null){return new Promise(n=>{let i=Date.now(),a=w();if(a?.itemId===t&&a?.title){console.log("[FlipRadar] Same item, using cached title:",a.title),n(!0);return}let p=()=>{if(o&&!x(o)){console.log("[FlipRadar] waitForNewContent cancelled \u2014 job no longer current"),n(!1);return}let c=Te(),l=Date.now()-i,u=k(c);if(c&&!u&&c!==e&&l>=500){console.log("[FlipRadar] Content changed, new title:",c),n(!0);return}if(!e&&c&&!u&&l>=500){console.log("[FlipRadar] First load, found title:",c),n(!0);return}if(l>r){console.log("[FlipRadar] Timeout waiting for content change, current title:",c),n(!1);return}setTimeout(p,200)};p()})}function Te(){let e=T(xe);for(let o of e)try{let n=document.querySelectorAll(o);for(let i of n){let a=i.textContent.trim();if(a.length>15&&a.length<300&&!a.startsWith("$")&&!/^\d+$/.test(a)&&!k(a))return console.log("[FlipRadar] Found title via selector:",a),a}}catch{}let t=D();if(t){let o=t.querySelectorAll('span[dir="auto"]'),n=[];for(let i of o){let a=i.textContent.trim();if(a.length>15&&a.length<200&&!a.startsWith("$")&&!k(a)&&!/^\d+$/.test(a)){let p=j(i);n.push({text:a,fontSize:p,element:i})}}if(n.sort((i,a)=>a.fontSize-i.fontSize),n.length>0)return console.log("[FlipRadar] Found title by prominence:",n[0].text),n[0].text}let r=document.querySelectorAll('h1, h2, [role="heading"]');for(let o of r){let n=o.textContent.trim();if(n.length>10&&n.length<300&&!k(n)&&!n.startsWith("$"))return console.log("[FlipRadar] Found title in heading:",n),n}return console.log("[FlipRadar] Could not extract title"),null}function at(){let e=document.querySelector("h1");if(e){let n=e.closest("div");if(n){let i=n.parentElement?.querySelectorAll("span")||[];for(let a of i){let p=a.textContent.trim();if(G.test(p)){let c=I(p);return console.log("[FlipRadar] Found price near title:",c),c}}}}let t=document.querySelectorAll("span"),r=[];for(let n of t){let i=n.textContent.trim();if(G.test(i)){let a=j(n),p=I(i);r.push({element:n,price:p,fontSize:a})}}if(r.sort((n,i)=>i.fontSize-n.fontSize),r.length>0){let n=r.find(i=>i.price>=5&&i.fontSize>=14);return n?(console.log("[FlipRadar] Found prominent price:",n.price,"fontSize:",n.fontSize),n.price):(console.log("[FlipRadar] Using largest price:",r[0].price),r[0].price)}let o=D();if(o){let i=o.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i){let a=I(i[0]);return console.log("[FlipRadar] Found price in main content:",a),a}}return console.log("[FlipRadar] Could not extract price"),null}function st(){let e=T(be);for(let t of e)try{let r=document.querySelectorAll(t);for(let o of r){let n=o.textContent.trim();for(let i of ve){let a=n.match(i);if(a)return a[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function lt(){let e=T(ye);for(let t of e)try{let r=document.querySelector(t);if(r&&r.textContent.trim()&&r.textContent.trim().length<50)return r.textContent.trim()}catch{}return null}function ct(){let e=document.querySelectorAll("span");for(let t of e){let r=t.textContent.trim();for(let o of Ee)if(o.test(r))return r}return null}function Y(){let e=T(_e);for(let t of e)try{let r=document.querySelector(t);if(r&&r.src)return r.src}catch{}return null}function ke(e){return{title:Te(),price:at(),location:st(),seller:lt(),daysListed:ct(),imageUrl:Y(),itemId:e,source:"dom"}}async function Fe(){let e=v();return e?new Promise(t=>{let r=Re(1e4);console.log("[FlipRadar] Sending page text to AI extraction ("+r.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${L}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:r,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipRadar] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!o){console.log("[FlipRadar] AI extraction - no response"),t(null);return}if(!o.ok){console.log("[FlipRadar] AI extraction failed:",o.status,o.error||o.data?.error),t(null);return}console.log("[FlipRadar] AI extraction successful:",o.data),t(o.data)})}):(console.log("[FlipRadar] AI extraction skipped - not logged in"),null)}function Ae(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:I(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:Y(),itemId:t,source:"ai"}}async function Me(e){let t=v();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${L}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{title:e}},o=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Price lookup message error:",chrome.runtime.lastError),r({error:"network_error"});return}if(!o){r({error:"network_error"});return}if(o.status===401){r({error:"auth_required"});return}if(o.status===429){r({error:"limit_reached",message:o.data?.error});return}if(!o.ok){r({error:"api_error"});return}r(o.data)})}):{error:"auth_required"}}async function Pe(e,t){let r=v();return r?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${L}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{source_url:window.location.href,user_title:e.title,user_asking_price:e.price,ebay_estimate_low:t?.ebay_low,ebay_estimate_high:t?.ebay_high,ebay_search_url:t?.ebay_url||F(e.title)}},n=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Save deal message error:",chrome.runtime.lastError),O(e),o({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){O(e),o({success:!0,local:!0});return}if(n?.status===429){o({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipRadar] API save failed:",n?.error||n?.status),O(e),o({success:!0,local:!0});return}console.log("[FlipRadar] Deal saved to cloud successfully"),o({success:!0})})}):(O(e),{success:!0,local:!0})}function O(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,ebayUrl:F(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],r=>{let o=r.savedDeals||[];o.unshift(t),o.length>100&&o.pop(),chrome.storage.local.set({savedDeals:o},()=>{chrome.runtime.lastError?console.error("[FlipRadar] Failed to save deal locally:",chrome.runtime.lastError.message):console.log("[FlipRadar] Deal saved locally")})})}async function Ne(e){return new Promise(t=>{if(!e){t(null);return}let o=`flipradar_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([o,"flipradar_last_sold"],n=>{if(n[o]&&V(n[o].timestamp,864e5)){console.log("[FlipRadar] Found exact match for sold data"),t(n[o]);return}if(n.flipradar_last_sold&&V(n.flipradar_last_sold.timestamp,864e5)){let i=n.flipradar_last_sold.query.toLowerCase(),a=e.toLowerCase(),p=i.split(/\s+/).filter(m=>m.length>3),c=a.split(/\s+/).filter(m=>m.length>3),l=p.filter(m=>c.some(M=>M.includes(m)||m.includes(M))),u=c.length>0?l.length/c.length:0;if(console.log("[FlipRadar] Fuzzy match check - overlap:",l.length,"ratio:",u),u>=.6&&l.length>=3){console.log("[FlipRadar] Using fuzzy matched sold data"),t(n.flipradar_last_sold);return}}t(null)})})}async function Z(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(z({authToken:t.token,currentUser:t.user}),console.log("[FlipRadar] Auth state loaded:",t.user?.email||"no user")),e()})})}function De(e){let t=r=>{r.type==="authSuccess"&&(console.log("[FlipRadar] Auth success received"),z({authToken:null,currentUser:r.user}),Z().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function $e(e){let t=r=>{r.type==="soldDataAvailable"&&(console.log("[FlipRadar] Received sold data from eBay:",r.data),e(r.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function C(){return!!v()}function Oe(){chrome.runtime.sendMessage({type:"openLogin"})}function Ue(){chrome.runtime.sendMessage({type:"openUpgrade"})}function pt(){return`
    <style>
      * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #1a1a2e;
        color: #ffffff;
        padding: 16px;
        border-radius: 12px;
        width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid #2d2d44;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #2d2d44;
      }
      .logo {
        font-weight: 700;
        font-size: 14px;
        color: #4ade80;
      }
      .tier-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        background: #374151;
        color: #9ca3af;
      }
      .tier-flipper { background: #1e40af; color: #93c5fd; }
      .tier-pro { background: #7c3aed; color: #c4b5fd; }
      .close-btn {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      }
      .close-btn:hover { color: #fff; }
      .price-section {
        text-align: center;
        margin-bottom: 12px;
      }
      .current-price {
        font-size: 32px;
        font-weight: 700;
        color: #fff;
      }
      .title {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .warning {
        background: #7f1d1d;
        color: #fca5a5;
        padding: 8px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .login-prompt {
        background: #1e3a5f;
        color: #93c5fd;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .login-btn {
        background: #3b82f6;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
      }
      .login-btn:hover { background: #2563eb; }
      .upgrade-prompt {
        background: #3d1f5c;
        color: #c4b5fd;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .upgrade-btn {
        background: #7c3aed;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
      }
      .upgrade-btn:hover { background: #6d28d9; }
      .ebay-section {
        background: #16213e;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      }
      .ebay-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .ebay-range {
        font-size: 18px;
        font-weight: 600;
        color: #4ade80;
      }
      .source-tag {
        font-size: 10px;
        color: #666;
        margin-top: 4px;
      }
      .profit-section {
        background: #16213e;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      }
      .profit-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .profit-range {
        font-size: 18px;
        font-weight: 600;
      }
      .profit-positive { color: #4ade80; }
      .profit-negative { color: #f87171; }
      .profit-mixed { color: #fbbf24; }
      .meta {
        font-size: 11px;
        color: #666;
        margin-bottom: 12px;
      }
      .meta-item { margin-bottom: 2px; }
      .buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .btn {
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        text-align: center;
        text-decoration: none;
        display: block;
      }
      .btn-primary { background: #3b82f6; color: #fff; }
      .btn-primary:hover { background: #2563eb; }
      .btn-secondary { background: #374151; color: #fff; }
      .btn-secondary:hover { background: #4b5563; }
      .btn-success { background: #16a34a; color: #fff; }
      .btn-success:hover { background: #15803d; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .saved-msg {
        text-align: center;
        font-size: 12px;
        margin-top: 8px;
        display: none;
      }
      .saved-msg.success { color: #4ade80; }
      .saved-msg.error { color: #f87171; }
      .footer {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
        font-size: 10px;
        color: #666;
        text-align: center;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #888;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #374151;
        border-top-color: #4ade80;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .samples {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
      }
      .sample-item {
        font-size: 11px;
        color: #888;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
      }
      .sample-price { color: #4ade80; }
      .ebay-section.real-data {
        background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
        border: 1px solid #10b981;
      }
      .real-badge {
        background: #10b981;
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
        margin-right: 4px;
      }
      .ebay-stats-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #a7f3d0;
        margin-top: 4px;
      }
      .get-real-data {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
        font-size: 11px;
        color: #fbbf24;
        text-align: center;
      }
    </style>
  `}function ut(){let e=ae();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function K(e,t=null){let r=$();if(e.itemId&&e.itemId!==r){console.log("[FlipRadar] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",r);return}let o=document.getElementById(y);o&&o.remove();let n=document.createElement("div");n.id=y;let i=n.attachShadow({mode:"open"}),a=t&&!t.error,p=C(),c=t?.error==="limit_reached",l=null,u=null,m="profit-positive";if(a&&e.price){let s=W(e.price,t.ebay_low,t.ebay_high);l=s.low,u=s.high,m=Q(l,u)}let M=we(e.price,e.title),oe=t?.ebay_url||F(e.title),He=ut(),f=`
    ${pt()}
    <div class="container">
      <div class="header">
        <span class="logo">FlipRadar ${He}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        <div class="current-price">${h(e.price)}</div>
        <div class="title" title="${b(e.title||"")}">${b(e.title)||"Unknown Item"}</div>
      </div>

      ${M?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;p||(f+=`
      <div class="login-prompt">
        <div>Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),c&&(f+=`
      <div class="upgrade-prompt">
        <div>Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let _=await Ne(e.title);if(_&&_.stats&&_.stats.count>0){let s=_.stats;if(e.price){let d=W(e.price,s.low,s.high);l=d.low,u=d.high,m=Q(l,u)}f+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${h(s.low)} - ${h(s.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${h(s.median)}</span>
          <span>Avg: ${h(s.avg)}</span>
        </div>
        <div class="source-tag">${s.count} sold listings analyzed</div>
        ${_.samples&&_.samples.length>0?`
          <div class="samples">
            ${_.samples.slice(0,3).map(d=>`
              <div class="sample-item">
                <span>${b(d.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(d.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,l!==null&&(f+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${m}">
            ${l>=0?"+":""}$${l} to ${u>=0?"+":""}$${u}
          </div>
        </div>
      `)}else if(a){let d={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;f+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${h(t.ebay_low)} - ${h(t.ebay_high)}</div>
        <div class="source-tag">Source: ${b(d)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(E=>`
              <div class="sample-item">
                <span>${b(E.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(E.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,l!==null&&(f+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${m}">
            ${l>=0?"+":""}$${l} to ${u>=0?"+":""}$${u}
          </div>
        </div>
      `)}else if(!p||c){let s=e.price?Math.round(e.price*.7):null,d=e.price?Math.round(e.price*1.5):null;s&&d&&(f+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${h(s)} - ${h(d)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}f+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${b(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${b(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${b(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${oe?`<a href="${Ie(oe)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(f+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),f+=`
    <div class="footer" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #2d2d44; font-size: 10px; color: #666; text-align: center;">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,f+="</div>",i.innerHTML=f,i.getElementById("close-overlay").addEventListener("click",()=>{n.remove()});let ne=i.getElementById("login-btn");ne&&ne.addEventListener("click",()=>{Oe()});let ie=i.getElementById("upgrade-btn");ie&&ie.addEventListener("click",()=>{Ue()}),i.getElementById("save-deal").addEventListener("click",async()=>{let s=i.getElementById("save-deal"),d=i.getElementById("saved-msg");s.disabled=!0,s.textContent="Saving...";let E=await Pe(e,t);s.disabled=!1,s.textContent="Save Deal",E.success?(d.textContent=E.local?"Saved locally!":"Deal saved!",d.className="saved-msg success"):(d.textContent=E.error||"Failed to save",d.className="saved-msg error"),d.style.display="block",setTimeout(()=>{d.style.display="none"},3e3)}),document.body.appendChild(n)}function ze(e){let t=document.getElementById(y);t&&t.remove();let r=document.createElement("div");r.id=y;let o=r.attachShadow({mode:"open"});return o.innerHTML=`
    <style>
      * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #1a1a2e;
        color: #ffffff;
        padding: 16px;
        border-radius: 12px;
        width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid #2d2d44;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .logo { font-weight: 700; font-size: 14px; color: #4ade80; }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #888;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #374151;
        border-top-color: #4ade80;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    <div class="container">
      <div class="header">
        <span class="logo">FlipRadar</span>
      </div>
      <div class="loading">
        <div class="spinner"></div>
        <span>Fetching prices...</span>
      </div>
    </div>
  `,document.body.appendChild(r),r}function ee(e){console.log("[FlipRadar] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(y);t&&(console.log("[FlipRadar] Removing old overlay"),t.remove());let r=document.getElementById(S);r&&(console.log("[FlipRadar] Removing old button"),r.remove());let o=document.createElement("button");o.id=S,o.innerHTML="\u{1F4B0} Check Flip",o.style.cssText=`
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 2147483646;
    background: #4ade80;
    color: #1a1a2e;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `,o.addEventListener("click",()=>{o.remove(),e()}),document.body.appendChild(o),console.log("[FlipRadar] Button added to page")}async function gt(e,t){let r=null,o="none";if(!x(e))return console.log("[FlipRadar] Job cancelled before extraction, aborting"),null;let n=me(t);if(n&&(console.log("[FlipRadar] Using intercepted GraphQL data"),r=n,o="graphql"),!r&&C()){console.log("[FlipRadar] Attempting AI extraction...");let i=await Fe();if(!x(e))return console.log("[FlipRadar] Job cancelled during AI extraction"),null;i&&(i.title||i.price)?(r=Ae(i,t),o="ai",console.log("[FlipRadar] AI extraction successful:",r.title)):console.log("[FlipRadar] AI extraction returned no usable data")}if(!r||!r.title&&!r.price){console.log("[FlipRadar] Using DOM extraction (fallback)...");let i=w()?.title||null;if(await Le(i,t,void 0,e),!x(e))return console.log("[FlipRadar] Job cancelled during DOM wait"),null;r=ke(t),o="dom",console.log("[FlipRadar] DOM extraction result:",r.title)}return console.log("[FlipRadar] Extraction complete (method:",o+"):",r?.title),{data:r,method:o}}async function U(){let e=ce(),t=window.location.href,r=$();if(console.log("[FlipRadar] initOverlay started, job:",e,"item:",r),ze({title:"Loading...",itemId:r}),await new Promise(p=>setTimeout(p,1e3)),!x(e)||window.location.href!==t){console.log("[FlipRadar] Navigation during init wait, aborting job:",e),R(e);return}await Z();let o=await gt(e,r);if(!o||!x(e)){console.log("[FlipRadar] Extraction failed or job cancelled"),R(e);return}let{data:n,method:i}=o;if(se(n),console.log("[FlipRadar] Final data (method: "+i+"):",n),!n.title&&!n.price){console.log("[FlipRadar] Could not extract listing data"),await K({title:null,price:null,itemId:r},null),R(e);return}let a=null;if(C()&&n.title&&(a=await Me(n.title),!x(e))){console.log("[FlipRadar] Job cancelled during price lookup"),R(e);return}await K(n,a),R(e)}function mt(e,t){console.log("[FlipRadar] Handling marketplace navigation:",e),ee(()=>{U()})}var Be=!1,te=null,re=null;function qe(){if(Be){console.log("[FlipRadar] Already initialized, skipping");return}Be=!0,console.log("[FlipRadar] Content script loaded on:",window.location.href),console.log("[FlipRadar] Is marketplace item page:",A()),he(),fe(),ue((e,t)=>{H(e)&&mt(e,t)}),te&&te(),re&&re(),te=De(()=>{console.log("[FlipRadar] Auth success, checking if should refresh overlay"),A()&&U()}),re=$e(e=>{console.log("[FlipRadar] Received sold data, checking if should refresh overlay"),document.getElementById("flipradar-overlay")&&A()&&U()}),A()&&(console.log("[FlipRadar] Initial page is marketplace item, showing trigger button"),ee(()=>{U()}))}document.readyState==="loading"?(console.log("[FlipRadar] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",qe)):(console.log("[FlipRadar] Document ready, initializing..."),qe());})();
