(()=>{var k="flipchecker-overlay",L="flipchecker-trigger",E="https://flipchecker.io";var m={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function B(e){m={...m,...e}}function b(){return m.authToken}function ae(){return m.currentUser}function le(e){m.lastExtractedData=e}function w(){return m.lastExtractedData}function se(){m.lastExtractedData=null}function ce(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return m.currentJobId=e,m.isExtracting=!0,console.log("[FlipChecker] Started job:",e),e}function h(e){return m.currentJobId===e}function S(e){m.currentJobId===e&&(m.isExtracting=!1,console.log("[FlipChecker] Ended job:",e))}var H=typeof window<"u"?window.location.href:"",q=null,N=null,pe=!1,de=[];function ue(e){de.push(e)}function Je(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function G(e=window.location.href){return e.includes("/marketplace/item/")}function We(){let e=document.getElementById(L),t=document.getElementById(k);e&&e.remove(),t&&t.remove()}function je(e,t){de.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Navigation callback error:",o)}})}function $(){let e=window.location.href;if(console.log("[FlipChecker] Navigation detected:",e),G(e)){let t=Je(e),o=w()?.itemId;t!==o&&(console.log("[FlipChecker] New item detected, clearing cache. Previous:",o,"New:",t),se()),je(e,t)}else We()}function Qe(){let e=history.pushState,t=history.replaceState;history.pushState=function(...r){e.apply(this,r),$()},history.replaceState=function(...r){t.apply(this,r),$()},window.addEventListener("popstate",$),console.log("[FlipChecker] History API listeners installed")}function Ke(){N&&(N.disconnect(),N=null);let e=new MutationObserver(()=>{q&&clearTimeout(q),q=setTimeout(()=>{window.location.href!==H&&(H=window.location.href,$())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),N=e,console.log("[FlipChecker] MutationObserver backup installed"),e}function fe(){if(pe){console.log("[FlipChecker] Navigation already initialized, skipping");return}pe=!0,H=window.location.href,Qe(),Ke()}var me=new Map,Ye=[];function ge(e){return me.get(e)||null}function Ze(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let r=t.data.marketplace_product_details_page;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,currency:r.listing_price?.currency,location:r.location?.reverse_geocode?.city||r.location_text?.text,seller:r.marketplace_listing_seller?.name,description:r.redacted_description?.text,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),condition:r.condition,category:r.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let r=t.data.node;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,location:r.location_text?.text,seller:r.story?.comet_sections?.seller?.seller?.name,source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let r=t.data.marketplace_pdp.product;return{itemId:r.id,title:r.title||r.name,price:r.price?.amount,priceFormatted:r.price?.formatted,location:r.location,seller:r.seller?.name,source:"graphql"}}return null}catch(t){return console.warn("[FlipChecker] GraphQL parse error:",t.message),null}}function et(e,t){console.log("[FlipChecker] Intercepted GraphQL data for item:",e),me.set(e,t),Ye.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Data callback error:",o)}})}function he(){let e=document.createElement("script");e.textContent=`
    (function() {
      // Only install once
      if (window.__flipcheckerInterceptorInstalled) return;
      window.__flipcheckerInterceptorInstalled = true;

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
                type: 'FLIPCHECKER_GRAPHQL_RESPONSE',
                source: 'fetch',
                url: url,
                data: data
              }, '*');
            }).catch(function(err) {
              if (err && err.name !== 'AbortError') {
                console.warn('[FlipChecker] Fetch intercept parse error:', err.message);
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
        this._flipcheckerUrl = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        if (!this._flipcheckerListenerAdded) {
          this._flipcheckerListenerAdded = true;
          this.addEventListener('load', function() {
            try {
              const url = this._flipcheckerUrl;
              if (url && (url.includes('/api/graphql') || url.includes('/graphql'))) {
                const data = JSON.parse(this.responseText);
                window.postMessage({
                  type: 'FLIPCHECKER_GRAPHQL_RESPONSE',
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

      console.log('[FlipChecker] Network interceptor installed in page context');
    })();
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let r=Ze(t.data.data);r&&r.itemId&&et(r.itemId,r)}}),console.log("[FlipChecker] Network interception listener installed")}var xe={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var be={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},ye={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},ke={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]'],tier3:[]};function T(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var V=/^\$[\d,]+(\.\d{2})?$/,_e=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],ve=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var rt=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],ot=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function F(e){if(!e)return!0;let t=e.toLowerCase().trim();if(rt.includes(t))return!0;for(let r of ot)if(r.test(e))return!0;return e.length<5}function Ee(e,t){if(!e||!t)return!1;let r=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&r.test(t)}function W(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function O(){return document.querySelector('div[role="main"]')}function Ce(e=1e4){let t=O();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function y(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function we(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function _(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),r=parseFloat(t);return isNaN(r)?null:r}function x(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function A(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function j(e,t,r,o=.84){return{low:Math.round(t*o-e),high:Math.round(r*o-e)}}function Q(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function K(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function U(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function M(){return window.location.href.includes("/marketplace/item/")}function Ie(e,t,r=5e3,o=null){return new Promise(n=>{let i=Date.now(),a=w();if(a?.itemId===t&&a?.title){console.log("[FlipChecker] Same item, using cached title:",a.title),n(!0);return}let d=()=>{if(o&&!h(o)){console.log("[FlipChecker] waitForNewContent cancelled \u2014 job no longer current"),n(!1);return}let c=Le(),s=Date.now()-i,u=F(c);if(c&&!u&&c!==e&&s>=500){console.log("[FlipChecker] Content changed, new title:",c),n(!0);return}if(!e&&c&&!u&&s>=500){console.log("[FlipChecker] First load, found title:",c),n(!0);return}if(s>r){console.log("[FlipChecker] Timeout waiting for content change, current title:",c),n(!1);return}setTimeout(d,200)};d()})}function Le(){let e=T(xe);for(let o of e)try{let n=document.querySelectorAll(o);for(let i of n){let a=i.textContent.trim();if(a.length>15&&a.length<300&&!a.startsWith("$")&&!/^\d+$/.test(a)&&!F(a))return console.log("[FlipChecker] Found title via selector:",a),a}}catch{}let t=O();if(t){let o=t.querySelectorAll('span[dir="auto"]'),n=[];for(let i of o){let a=i.textContent.trim();if(a.length>15&&a.length<200&&!a.startsWith("$")&&!F(a)&&!/^\d+$/.test(a)){let d=W(i);n.push({text:a,fontSize:d,element:i})}}if(n.sort((i,a)=>a.fontSize-i.fontSize),n.length>0)return console.log("[FlipChecker] Found title by prominence:",n[0].text),n[0].text}let r=document.querySelectorAll('h1, h2, [role="heading"]');for(let o of r){let n=o.textContent.trim();if(n.length>10&&n.length<300&&!F(n)&&!n.startsWith("$"))return console.log("[FlipChecker] Found title in heading:",n),n}return console.log("[FlipChecker] Could not extract title"),null}function st(){let e=document.querySelector("h1");if(e){let n=e.closest("div");if(n){let i=n.parentElement?.querySelectorAll("span")||[];for(let a of i){let d=a.textContent.trim();if(V.test(d)){let c=_(d);return console.log("[FlipChecker] Found price near title:",c),c}}}}let t=document.querySelectorAll("span"),r=[];for(let n of t){let i=n.textContent.trim();if(V.test(i)){let a=W(n),d=_(i);r.push({element:n,price:d,fontSize:a})}}if(r.sort((n,i)=>i.fontSize-n.fontSize),r.length>0){let n=r.find(i=>i.price>=5&&i.fontSize>=14);return n?(console.log("[FlipChecker] Found prominent price:",n.price,"fontSize:",n.fontSize),n.price):(console.log("[FlipChecker] Using largest price:",r[0].price),r[0].price)}let o=O();if(o){let i=o.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i){let a=_(i[0]);return console.log("[FlipChecker] Found price in main content:",a),a}}return console.log("[FlipChecker] Could not extract price"),null}function ct(){let e=T(be);for(let t of e)try{let r=document.querySelectorAll(t);for(let o of r){let n=o.textContent.trim();for(let i of _e){let a=n.match(i);if(a)return a[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function pt(){let e=T(ye);for(let t of e)try{let r=document.querySelector(t);if(r&&r.textContent.trim()&&r.textContent.trim().length<50)return r.textContent.trim()}catch{}return null}function dt(){let e=document.querySelectorAll("span");for(let t of e){let r=t.textContent.trim();for(let o of ve)if(o.test(r))return r}return null}function R(){let e=T(ke);for(let t of e)try{let r=document.querySelector(t);if(r&&r.src)return r.src}catch{}return null}function Te(e){return{title:Le(),price:st(),location:ct(),seller:pt(),daysListed:dt(),imageUrl:R(),itemId:e,source:"dom"}}async function Fe(){let e=b();return e?new Promise(t=>{let r=Ce(1e4);console.log("[FlipChecker] Sending page text to AI extraction ("+r.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${E}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:r,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!o){console.log("[FlipChecker] AI extraction - no response"),t(null);return}if(!o.ok){console.log("[FlipChecker] AI extraction failed:",o.status,o.error||o.data?.error),t(null);return}console.log("[FlipChecker] AI extraction successful:",o.data),t(o.data)})}):(console.log("[FlipChecker] AI extraction skipped - not logged in"),null)}function Ae(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:_(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:R(),itemId:t,source:"ai"}}function ut(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Screenshot capture error:",chrome.runtime.lastError),e(null);return}if(!t||!t.success){console.log("[FlipChecker] Screenshot capture failed:",t?.error),e(null);return}e(t.screenshot)})})}async function Me(){let e=b();if(!e)return console.log("[FlipChecker] Vision extraction skipped - not logged in"),null;let t=await ut();return t?(console.log("[FlipChecker] Sending screenshot to vision extraction ("+Math.round(t.length/1024)+" KB)"),new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${E}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Vision extraction message error:",chrome.runtime.lastError),r(null);return}if(!o){console.log("[FlipChecker] Vision extraction - no response"),r(null);return}if(!o.ok){console.log("[FlipChecker] Vision extraction failed:",o.status,o.error||o.data?.error),r(null);return}o.data?.error&&console.log("[FlipChecker] Vision extraction API error:",o.data.error),console.log("[FlipChecker] Vision extraction successful:",o.data),r(o.data)})})):(console.log("[FlipChecker] Vision extraction skipped - screenshot capture failed"),null)}function Re(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:_(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:R(),itemId:t,source:"vision"}}async function Ne(e){let t=b();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${E}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{title:e}},o=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Price lookup message error:",chrome.runtime.lastError),r({error:"network_error"});return}if(!o){r({error:"network_error"});return}if(o.status===401){r({error:"auth_required"});return}if(o.status===429){r({error:"limit_reached",message:o.data?.error});return}if(!o.ok){r({error:"api_error"});return}r(o.data)})}):{error:"auth_required"}}async function $e(e,t){let r=b();return r?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${E}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{source_url:window.location.href,user_title:e.title,user_asking_price:e.price,ebay_estimate_low:t?.ebay_low,ebay_estimate_high:t?.ebay_high,ebay_search_url:t?.ebay_url||A(e.title)}},n=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Save deal message error:",chrome.runtime.lastError),D(e),o({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){D(e),o({success:!0,local:!0});return}if(n?.status===429){o({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipChecker] API save failed:",n?.error||n?.status),D(e),o({success:!0,local:!0});return}console.log("[FlipChecker] Deal saved to cloud successfully"),o({success:!0})})}):(D(e),{success:!0,local:!0})}function D(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,ebayUrl:A(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],r=>{let o=r.savedDeals||[];o.unshift(t),o.length>100&&o.pop(),chrome.storage.local.set({savedDeals:o},()=>{chrome.runtime.lastError?console.error("[FlipChecker] Failed to save deal locally:",chrome.runtime.lastError.message):console.log("[FlipChecker] Deal saved locally")})})}async function Oe(e){return new Promise(t=>{if(!e){t(null);return}let o=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([o,"flipchecker_last_sold"],n=>{if(n[o]&&K(n[o].timestamp,864e5)){console.log("[FlipChecker] Found exact match for sold data"),t(n[o]);return}if(n.flipchecker_last_sold&&K(n.flipchecker_last_sold.timestamp,864e5)){let i=n.flipchecker_last_sold.query.toLowerCase(),a=e.toLowerCase(),d=i.split(/\s+/).filter(g=>g.length>3),c=a.split(/\s+/).filter(g=>g.length>3),s=d.filter(g=>c.some(P=>P.includes(g)||g.includes(P))),u=c.length>0?s.length/c.length:0;if(console.log("[FlipChecker] Fuzzy match check - overlap:",s.length,"ratio:",u),u>=.6&&s.length>=3){console.log("[FlipChecker] Using fuzzy matched sold data"),t(n.flipchecker_last_sold);return}}t(null)})})}async function Y(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(B({authToken:t.token,currentUser:t.user}),console.log("[FlipChecker] Auth state loaded:",t.user?.email||"no user")),e()})})}function Ue(e){let t=r=>{r.type==="authSuccess"&&(console.log("[FlipChecker] Auth success received"),B({authToken:null,currentUser:r.user}),Y().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function De(e){let t=r=>{r.type==="soldDataAvailable"&&(console.log("[FlipChecker] Received sold data from eBay:",r.data),e(r.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function I(){return!!b()}function ze(){chrome.runtime.sendMessage({type:"openLogin"})}function Be(){chrome.runtime.sendMessage({type:"openUpgrade"})}function mt(){return`
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
  `}function gt(){let e=ae();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function Z(e,t=null){let r=U();if(e.itemId&&e.itemId!==r){console.log("[FlipChecker] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",r);return}let o=document.getElementById(k);o&&o.remove();let n=document.createElement("div");n.id=k;let i=n.attachShadow({mode:"open"}),a=t&&!t.error,d=I(),c=t?.error==="limit_reached",s=null,u=null,g="profit-positive";if(a&&e.price){let l=j(e.price,t.ebay_low,t.ebay_high);s=l.low,u=l.high,g=Q(s,u)}let P=Ee(e.price,e.title),oe=t?.ebay_url||A(e.title),Ve=gt(),f=`
    ${mt()}
    <div class="container">
      <div class="header">
        <span class="logo">FlipChecker ${Ve}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        <div class="current-price">${x(e.price)}</div>
        <div class="title" title="${y(e.title||"")}">${y(e.title)||"Unknown Item"}</div>
      </div>

      ${P?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;d||(f+=`
      <div class="login-prompt">
        <div>Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),c&&(f+=`
      <div class="upgrade-prompt">
        <div>Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let v=await Oe(e.title);if(v&&v.stats&&v.stats.count>0){let l=v.stats;if(e.price){let p=j(e.price,l.low,l.high);s=p.low,u=p.high,g=Q(s,u)}f+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${x(l.low)} - ${x(l.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${x(l.median)}</span>
          <span>Avg: ${x(l.avg)}</span>
        </div>
        <div class="source-tag">${l.count} sold listings analyzed</div>
        ${v.samples&&v.samples.length>0?`
          <div class="samples">
            ${v.samples.slice(0,3).map(p=>`
              <div class="sample-item">
                <span>${y(p.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(p.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,s!==null&&(f+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${g}">
            ${s>=0?"+":""}$${s} to ${u>=0?"+":""}$${u}
          </div>
        </div>
      `)}else if(a){let p={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;f+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${x(t.ebay_low)} - ${x(t.ebay_high)}</div>
        <div class="source-tag">Source: ${y(p)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(C=>`
              <div class="sample-item">
                <span>${y(C.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(C.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,s!==null&&(f+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${g}">
            ${s>=0?"+":""}$${s} to ${u>=0?"+":""}$${u}
          </div>
        </div>
      `)}else if(!d||c){let l=e.price?Math.round(e.price*.7):null,p=e.price?Math.round(e.price*1.5):null;l&&p&&(f+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${x(l)} - ${x(p)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}f+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${y(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${y(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${y(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${oe?`<a href="${we(oe)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
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
  `,f+="</div>",i.innerHTML=f,i.getElementById("close-overlay").addEventListener("click",()=>{n.remove()});let ne=i.getElementById("login-btn");ne&&ne.addEventListener("click",()=>{ze()});let ie=i.getElementById("upgrade-btn");ie&&ie.addEventListener("click",()=>{Be()}),i.getElementById("save-deal").addEventListener("click",async()=>{let l=i.getElementById("save-deal"),p=i.getElementById("saved-msg");l.disabled=!0,l.textContent="Saving...";let C=await $e(e,t);l.disabled=!1,l.textContent="Save Deal",C.success?(p.textContent=C.local?"Saved locally!":"Deal saved!",p.className="saved-msg success"):(p.textContent=C.error||"Failed to save",p.className="saved-msg error"),p.style.display="block",setTimeout(()=>{p.style.display="none"},3e3)}),document.body.appendChild(n)}function qe(e){let t=document.getElementById(k);t&&t.remove();let r=document.createElement("div");r.id=k;let o=r.attachShadow({mode:"open"});return o.innerHTML=`
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
        <span class="logo">FlipChecker</span>
      </div>
      <div class="loading">
        <div class="spinner"></div>
        <span>Fetching prices...</span>
      </div>
    </div>
  `,document.body.appendChild(r),r}function ee(e){console.log("[FlipChecker] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(k);t&&(console.log("[FlipChecker] Removing old overlay"),t.remove());let r=document.getElementById(L);r&&(console.log("[FlipChecker] Removing old button"),r.remove());let o=document.createElement("button");o.id=L,o.innerHTML="\u{1F4B0} Check Flip",o.style.cssText=`
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
  `,o.addEventListener("click",()=>{o.remove(),e()}),document.body.appendChild(o),console.log("[FlipChecker] Button added to page")}async function xt(e,t){let r=null,o="none";if(!h(e))return console.log("[FlipChecker] Job cancelled before extraction, aborting"),null;let n=ge(t);if(n&&(console.log("[FlipChecker] Using intercepted GraphQL data"),r=n,o="graphql"),!r&&I()){console.log("[FlipChecker] Attempting vision extraction...");let i=await Me();if(!h(e))return console.log("[FlipChecker] Job cancelled during vision extraction"),null;i&&(i.title||i.price)?(r=Re(i,t),o="vision",console.log("[FlipChecker] Vision extraction successful:",r.title)):console.log("[FlipChecker] Vision extraction returned no usable data")}if(!r&&I()){console.log("[FlipChecker] Attempting AI extraction...");let i=await Fe();if(!h(e))return console.log("[FlipChecker] Job cancelled during AI extraction"),null;i&&(i.title||i.price)?(r=Ae(i,t),o="ai",console.log("[FlipChecker] AI extraction successful:",r.title)):console.log("[FlipChecker] AI extraction returned no usable data")}if(!r||!r.title&&!r.price){console.log("[FlipChecker] Using DOM extraction (fallback)...");let i=w()?.title||null;if(await Ie(i,t,void 0,e),!h(e))return console.log("[FlipChecker] Job cancelled during DOM wait"),null;r=Te(t),o="dom",console.log("[FlipChecker] DOM extraction result:",r.title)}return console.log("[FlipChecker] Extraction complete (method:",o+"):",r?.title),{data:r,method:o}}async function z(){let e=ce(),t=window.location.href,r=U();if(console.log("[FlipChecker] initOverlay started, job:",e,"item:",r),qe({title:"Loading...",itemId:r}),await new Promise(d=>setTimeout(d,1e3)),!h(e)||window.location.href!==t){console.log("[FlipChecker] Navigation during init wait, aborting job:",e),S(e);return}await Y();let o=await xt(e,r);if(!o||!h(e)){console.log("[FlipChecker] Extraction failed or job cancelled"),S(e);return}let{data:n,method:i}=o;if(le(n),console.log("[FlipChecker] Final data (method: "+i+"):",n),!n.title&&!n.price){console.log("[FlipChecker] Could not extract listing data"),await Z({title:null,price:null,itemId:r},null),S(e);return}let a=null;if(I()&&n.title&&(a=await Ne(n.title),!h(e))){console.log("[FlipChecker] Job cancelled during price lookup"),S(e);return}await Z(n,a),S(e)}function bt(e,t){console.log("[FlipChecker] Handling marketplace navigation:",e),ee(()=>{z()})}var He=!1,te=null,re=null;function Ge(){if(He){console.log("[FlipChecker] Already initialized, skipping");return}He=!0,console.log("[FlipChecker] Content script loaded on:",window.location.href),console.log("[FlipChecker] Is marketplace item page:",M()),he(),fe(),ue((e,t)=>{G(e)&&bt(e,t)}),te&&te(),re&&re(),te=Ue(()=>{console.log("[FlipChecker] Auth success, checking if should refresh overlay"),M()&&z()}),re=De(e=>{console.log("[FlipChecker] Received sold data, checking if should refresh overlay"),document.getElementById("flipchecker-overlay")&&M()&&z()}),M()&&(console.log("[FlipChecker] Initial page is marketplace item, showing trigger button"),ee(()=>{z()}))}document.readyState==="loading"?(console.log("[FlipChecker] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",Ge)):(console.log("[FlipChecker] Document ready, initializing..."),Ge());})();
