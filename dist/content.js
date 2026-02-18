(()=>{var w="flipchecker-overlay",P="flipchecker-trigger",k="https://flipchecker.io";var g={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function Y(e){g={...g,...e}}function _(){return g.authToken}function ye(){return g.currentUser}function ke(e){g.lastExtractedData=e}function I(){return g.lastExtractedData}function _e(){g.lastExtractedData=null}function ve(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return g.currentJobId=e,g.isExtracting=!0,console.log("[FlipChecker] Started job:",e),e}function h(e){return g.currentJobId===e}function F(e){g.currentJobId===e&&(g.isExtracting=!1,console.log("[FlipChecker] Ended job:",e))}var K=typeof window<"u"?window.location.href:"",Q=null,B=null,Ce=!1,we=[];function Se(e){we.push(e)}function ct(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function Z(e=window.location.href){return e.includes("/marketplace/item/")}function pt(){let e=document.getElementById(P),t=document.getElementById(w);e&&e.remove(),t&&t.remove()}function Ee(e,t){we.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Navigation callback error:",o)}})}function q(){let e=window.location.href;if(console.log("[FlipChecker] Navigation detected:",e),Z(e)){let t=ct(e),o=I()?.itemId;t!==o&&(console.log("[FlipChecker] New item detected, clearing cache. Previous:",o,"New:",t),_e()),Ee(e,t)}else pt(),Ee(e,null)}function dt(){let e=history.pushState,t=history.replaceState;history.pushState=function(...r){e.apply(this,r),q()},history.replaceState=function(...r){t.apply(this,r),q()},window.addEventListener("popstate",q),console.log("[FlipChecker] History API listeners installed")}function ut(){B&&(B.disconnect(),B=null);let e=new MutationObserver(()=>{Q&&clearTimeout(Q),Q=setTimeout(()=>{window.location.href!==K&&(K=window.location.href,q())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),B=e,console.log("[FlipChecker] MutationObserver backup installed"),e}function Te(){if(Ce){console.log("[FlipChecker] Navigation already initialized, skipping");return}Ce=!0,K=window.location.href,dt(),ut()}var Le=new Map,ft=[];function Ie(e){return Le.get(e)||null}function mt(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let r=t.data.marketplace_product_details_page;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,currency:r.listing_price?.currency,location:r.location?.reverse_geocode?.city||r.location_text?.text,seller:r.marketplace_listing_seller?.name,description:r.redacted_description?.text,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),condition:r.condition,category:r.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let r=t.data.node;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,location:r.location_text?.text,seller:r.story?.comet_sections?.seller?.seller?.name,source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let r=t.data.marketplace_pdp.product;return{itemId:r.id,title:r.title||r.name,price:r.price?.amount,priceFormatted:r.price?.formatted,location:r.location,seller:r.seller?.name,source:"graphql"}}return null}catch(t){return console.warn("[FlipChecker] GraphQL parse error:",t.message),null}}function gt(e,t){console.log("[FlipChecker] Intercepted GraphQL data for item:",e),Le.set(e,t),ft.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Data callback error:",o)}})}function Fe(){let e=document.createElement("script");e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let r=mt(t.data.data);r&&r.itemId&&gt(r.itemId,r)}}),console.log("[FlipChecker] Network interception listener installed")}var Ae={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var Me={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},Pe={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},Re={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]'],tier3:[]};function R(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var ee=/^\$[\d,]+(\.\d{2})?$/,$e=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],Ne=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var xt=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],bt=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function $(e){if(!e)return!0;let t=e.toLowerCase().trim();if(xt.includes(t))return!0;for(let r of bt)if(r.test(e))return!0;return e.length<5}function De(e,t){if(!e||!t)return!1;let r=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&r.test(t)}function oe(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function H(){return document.querySelector('div[role="main"]')}function Ue(e=1e4){let t=H();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function v(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function Oe(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function x(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),r=parseFloat(t);return isNaN(r)?null:r}function b(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function N(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function ie(e,t,r,o=.84){return{low:Math.round(t*o-e),high:Math.round(r*o-e)}}function ae(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function se(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function W(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function D(){return window.location.href.includes("/marketplace/item/")}function Be(e,t,r=5e3,o=null){return new Promise(n=>{let a=Date.now(),i=I();if(i?.itemId===t&&i?.title){console.log("[FlipChecker] Same item, using cached title:",i.title),n(!0);return}let s=()=>{if(o&&!h(o)){console.log("[FlipChecker] waitForNewContent cancelled \u2014 job no longer current"),n(!1);return}let l=qe(),c=Date.now()-a,d=$(l);if(l&&!d&&l!==e&&c>=500){console.log("[FlipChecker] Content changed, new title:",l),n(!0);return}if(!e&&l&&!d&&c>=500){console.log("[FlipChecker] First load, found title:",l),n(!0);return}if(c>r){console.log("[FlipChecker] Timeout waiting for content change, current title:",l),n(!1);return}setTimeout(s,200)};s()})}function qe(){let e=R(Ae);for(let o of e)try{let n=document.querySelectorAll(o);for(let a of n){let i=a.textContent.trim();if(i.length>15&&i.length<300&&!i.startsWith("$")&&!/^\d+$/.test(i)&&!$(i))return console.log("[FlipChecker] Found title via selector:",i),i}}catch{}let t=H();if(t){let o=t.querySelectorAll('span[dir="auto"]'),n=[];for(let a of o){let i=a.textContent.trim();if(i.length>15&&i.length<200&&!i.startsWith("$")&&!$(i)&&!/^\d+$/.test(i)){let s=oe(a);n.push({text:i,fontSize:s,element:a})}}if(n.sort((a,i)=>i.fontSize-a.fontSize),n.length>0)return console.log("[FlipChecker] Found title by prominence:",n[0].text),n[0].text}let r=document.querySelectorAll('h1, h2, [role="heading"]');for(let o of r){let n=o.textContent.trim();if(n.length>10&&n.length<300&&!$(n)&&!n.startsWith("$"))return console.log("[FlipChecker] Found title in heading:",n),n}return console.log("[FlipChecker] Could not extract title"),null}function vt(){let e=document.querySelector("h1");if(e){let n=e.closest("div");if(n){let a=n.parentElement?.querySelectorAll("span")||[];for(let i of a){let s=i.textContent.trim();if(ee.test(s)){let l=x(s);return console.log("[FlipChecker] Found price near title:",l),l}}}}let t=document.querySelectorAll("span"),r=[];for(let n of t){let a=n.textContent.trim();if(ee.test(a)){let i=oe(n),s=x(a);r.push({element:n,price:s,fontSize:i})}}if(r.sort((n,a)=>a.fontSize-n.fontSize),r.length>0){let n=r.find(a=>a.price>=5&&a.fontSize>=14);return n?(console.log("[FlipChecker] Found prominent price:",n.price,"fontSize:",n.fontSize),n.price):(console.log("[FlipChecker] Using largest price:",r[0].price),r[0].price)}let o=H();if(o){let a=o.innerText.match(/\$[\d,]+(\.\d{2})?/);if(a){let i=x(a[0]);return console.log("[FlipChecker] Found price in main content:",i),i}}return console.log("[FlipChecker] Could not extract price"),null}function Ct(){let e=R(Me);for(let t of e)try{let r=document.querySelectorAll(t);for(let o of r){let n=o.textContent.trim();for(let a of $e){let i=n.match(a);if(i)return i[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function Et(){let e=R(Pe);for(let t of e)try{let r=document.querySelector(t);if(r&&r.textContent.trim()&&r.textContent.trim().length<50)return r.textContent.trim()}catch{}return null}function wt(){let e=document.querySelectorAll("span");for(let t of e){let r=t.textContent.trim();for(let o of Ne)if(o.test(r))return r}return null}function U(){let e=R(Re);for(let t of e)try{let r=document.querySelector(t);if(r&&r.src)return r.src}catch{}return null}function He(e){return{title:qe(),price:vt(),location:Ct(),seller:Et(),daysListed:wt(),imageUrl:U(),itemId:e,source:"dom"}}async function We(){let e=_();return e?new Promise(t=>{let r=Ue(1e4);console.log("[FlipChecker] Sending page text to AI extraction ("+r.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${k}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:r,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!o){console.log("[FlipChecker] AI extraction - no response"),t(null);return}if(!o.ok){console.log("[FlipChecker] AI extraction failed:",o.status,o.error||o.data?.error),t(null);return}console.log("[FlipChecker] AI extraction successful:",o.data),t(o.data)})}):(console.log("[FlipChecker] AI extraction skipped - not logged in"),null)}function Ge(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:x(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:U(),itemId:t,source:"ai"}}function St(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Screenshot capture error:",chrome.runtime.lastError),e(null);return}if(!t||!t.success){console.log("[FlipChecker] Screenshot capture failed:",t?.error),e(null);return}e(t.screenshot)})})}async function Xe(){let e=_();if(!e)return console.log("[FlipChecker] Vision extraction skipped - not logged in"),null;let t=await St();return t?(console.log("[FlipChecker] Sending screenshot to vision extraction ("+Math.round(t.length/1024)+" KB)"),new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${k}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Vision extraction message error:",chrome.runtime.lastError),r(null);return}if(!o){console.log("[FlipChecker] Vision extraction - no response"),r(null);return}if(!o.ok){console.log("[FlipChecker] Vision extraction failed:",o.status,o.error||o.data?.error),r(null);return}o.data?.error&&console.log("[FlipChecker] Vision extraction API error:",o.data.error),console.log("[FlipChecker] Vision extraction successful:",o.data),r(o.data)})})):(console.log("[FlipChecker] Vision extraction skipped - screenshot capture failed"),null)}function Ve(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:x(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:U(),itemId:t,source:"vision"}}async function X(e){let t=_();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${k}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{title:e}},o=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Price lookup message error:",chrome.runtime.lastError),r({error:"network_error"});return}if(!o){r({error:"network_error"});return}if(o.status===401){r({error:"auth_required"});return}if(o.status===429){r({error:"limit_reached",message:o.data?.error});return}if(!o.ok){r({error:"api_error"});return}r(o.data)})}):{error:"auth_required"}}async function Je(e,t){let r=_();return r?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${k}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{source_url:window.location.href,user_title:e.title,user_asking_price:e.price,ebay_estimate_low:t?.ebay_low,ebay_estimate_high:t?.ebay_high,ebay_search_url:t?.ebay_url||N(e.title)}},n=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Save deal message error:",chrome.runtime.lastError),G(e),o({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){G(e),o({success:!0,local:!0});return}if(n?.status===429){o({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipChecker] API save failed:",n?.error||n?.status),G(e),o({success:!0,local:!0});return}console.log("[FlipChecker] Deal saved to cloud successfully"),o({success:!0})})}):(G(e),{success:!0,local:!0})}function G(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,ebayUrl:N(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],r=>{let o=r.savedDeals||[];o.unshift(t),o.length>100&&o.pop(),chrome.storage.local.set({savedDeals:o},()=>{chrome.runtime.lastError?console.error("[FlipChecker] Failed to save deal locally:",chrome.runtime.lastError.message):console.log("[FlipChecker] Deal saved locally")})})}async function Ye(e){return new Promise(t=>{if(!e){t(null);return}let o=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([o,"flipchecker_last_sold"],n=>{if(n[o]&&se(n[o].timestamp,864e5)){console.log("[FlipChecker] Found exact match for sold data"),t(n[o]);return}if(n.flipchecker_last_sold&&se(n.flipchecker_last_sold.timestamp,864e5)){let a=n.flipchecker_last_sold.query.toLowerCase(),i=e.toLowerCase(),s=a.split(/\s+/).filter(f=>f.length>3),l=i.split(/\s+/).filter(f=>f.length>3),c=s.filter(f=>l.some(z=>z.includes(f)||f.includes(z))),d=l.length>0?c.length/l.length:0;if(console.log("[FlipChecker] Fuzzy match check - overlap:",c.length,"ratio:",d),d>=.6&&c.length>=3){console.log("[FlipChecker] Using fuzzy matched sold data"),t(n.flipchecker_last_sold);return}}t(null)})})}async function le(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(Y({authToken:t.token,currentUser:t.user}),console.log("[FlipChecker] Auth state loaded:",t.user?.email||"no user")),e()})})}function Qe(e){let t=r=>{r.type==="authSuccess"&&(console.log("[FlipChecker] Auth success received"),Y({authToken:null,currentUser:r.user}),le().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function Ke(e){let t=r=>{r.type==="soldDataAvailable"&&(console.log("[FlipChecker] Received sold data from eBay:",r.data),e(r.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function C(){return!!_()}function Ze(){chrome.runtime.sendMessage({type:"openLogin"})}function et(){chrome.runtime.sendMessage({type:"openUpgrade"})}function Lt(){return`
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
  `}function It(){let e=ye();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function ce(e,t=null){let r=W();if(e.itemId&&e.itemId!==r){console.log("[FlipChecker] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",r);return}let o=document.getElementById(w);o&&o.remove();let n=document.createElement("div");n.id=w;let a=n.attachShadow({mode:"open"}),i=t&&!t.error,s=C(),l=t?.error==="limit_reached",c=null,d=null,f="profit-positive";if(i&&e.price){let p=ie(e.price,t.ebay_low,t.ebay_high);c=p.low,d=p.high,f=ae(c,d)}let z=De(e.price,e.title),he=t?.ebay_url||N(e.title),st=It(),m=`
    ${Lt()}
    <div class="container">
      <div class="header">
        <span class="logo">FlipChecker ${st}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        <div class="current-price">${b(e.price)}</div>
        <div class="title" title="${v(e.title||"")}">${v(e.title)||"Unknown Item"}</div>
      </div>

      ${z?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;s||(m+=`
      <div class="login-prompt">
        <div>Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),l&&(m+=`
      <div class="upgrade-prompt">
        <div>Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let S=await Ye(e.title);if(S&&S.stats&&S.stats.count>0){let p=S.stats;if(e.price){let u=ie(e.price,p.low,p.high);c=u.low,d=u.high,f=ae(c,d)}m+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${b(p.low)} - ${b(p.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${b(p.median)}</span>
          <span>Avg: ${b(p.avg)}</span>
        </div>
        <div class="source-tag">${p.count} sold listings analyzed</div>
        ${S.samples&&S.samples.length>0?`
          <div class="samples">
            ${S.samples.slice(0,3).map(u=>`
              <div class="sample-item">
                <span>${v(u.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(u.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,c!==null&&(m+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${f}">
            ${c>=0?"+":""}$${c} to ${d>=0?"+":""}$${d}
          </div>
        </div>
      `)}else if(i){let u={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;m+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${b(t.ebay_low)} - ${b(t.ebay_high)}</div>
        <div class="source-tag">Source: ${v(u)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(L=>`
              <div class="sample-item">
                <span>${v(L.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(L.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,c!==null&&(m+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${f}">
            ${c>=0?"+":""}$${c} to ${d>=0?"+":""}$${d}
          </div>
        </div>
      `)}else if(!s||l){let p=e.price?Math.round(e.price*.7):null,u=e.price?Math.round(e.price*1.5):null;p&&u&&(m+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${b(p)} - ${b(u)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}m+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${v(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${v(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${v(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${he?`<a href="${Oe(he)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(m+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),m+=`
    <div class="footer" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #2d2d44; font-size: 10px; color: #666; text-align: center;">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,m+="</div>",a.innerHTML=m,a.getElementById("close-overlay").addEventListener("click",()=>{n.remove()});let xe=a.getElementById("login-btn");xe&&xe.addEventListener("click",()=>{Ze()});let be=a.getElementById("upgrade-btn");be&&be.addEventListener("click",()=>{et()}),a.getElementById("save-deal").addEventListener("click",async()=>{let p=a.getElementById("save-deal"),u=a.getElementById("saved-msg");p.disabled=!0,p.textContent="Saving...";let L=await Je(e,t);p.disabled=!1,p.textContent="Save Deal",L.success?(u.textContent=L.local?"Saved locally!":"Deal saved!",u.className="saved-msg success"):(u.textContent=L.error||"Failed to save",u.className="saved-msg error"),u.style.display="block",setTimeout(()=>{u.style.display="none"},3e3)}),document.body.appendChild(n)}function tt(e){let t=document.getElementById(w);t&&t.remove();let r=document.createElement("div");r.id=w;let o=r.attachShadow({mode:"open"});return o.innerHTML=`
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
  `,document.body.appendChild(r),r}function pe(e){console.log("[FlipChecker] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(w);t&&(console.log("[FlipChecker] Removing old overlay"),t.remove());let r=document.getElementById(P);r&&(console.log("[FlipChecker] Removing old button"),r.remove());let o=document.createElement("button");o.id=P,o.innerHTML="\u{1F4B0} Check Flip",o.style.cssText=`
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
  `,o.addEventListener("click",()=>{o.remove(),e()}),document.body.appendChild(o),console.log("[FlipChecker] Button added to page")}function de(e){if(!e)return!1;try{let r=new URL(e).pathname;return!(!r.startsWith("/marketplace")||r.includes("/marketplace/item/")||r.includes("/marketplace/profile/")||r.includes("/marketplace/you/")||r.includes("/marketplace/create"))}catch{return!1}}function rt(){let e=[],t=new Set,r=document.querySelectorAll('a[href*="/marketplace/item/"]');for(let o of r){let n=o.href.match(/\/marketplace\/item\/(\d+)/);if(!n)continue;let a=n[1];if(t.has(a))continue;t.add(a);let i=Ft(o);if(!i)continue;let s=At(i);if(!s)continue;let l=Mt(i);if(l===null)continue;let c=o.href.split("?")[0];e.push({id:a,title:s,price:l,url:c,cardElement:i})}return e}function Ft(e){let t=e;for(let r=0;r<6&&t.parentElement;r++){t=t.parentElement;let o=t.querySelector("img"),n=t.textContent||"",a=/\$[\d,]+/.test(n);if(o&&a&&n.length>20)return t}return e.closest("div[class]")||e.parentElement}function At(e){let t=e.querySelectorAll('span[dir="auto"]');for(let r of t){let o=r.textContent?.trim();if(o&&!/^\$[\d,]+/.test(o)&&!(o.length<10)&&!/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(o))return o}return null}function Mt(e){let t=e.querySelectorAll("span");for(let r of t){let o=r.textContent?.trim();if(o&&/^\$[\d,]+(\.\d{2})?$/.test(o)){let n=x(o);if(n!==null&&n>0)return n}}return null}var A=!1,O=new Map,V=new Map,T=null,E=!1,y=null,M=null;function fe(){if(E=!1,!C()){console.log("[FlipChecker] Watchlist: not logged in, skipping");return}chrome.storage.local.get(["watchlistFilters"],e=>{let t=e.watchlistFilters;if(!t||t.length===0){console.log("[FlipChecker] Watchlist: no filters configured, skipping");return}let r=t.filter(o=>o.is_active!==!1);if(r.length===0){console.log("[FlipChecker] Watchlist: no active filters, skipping");return}console.log("[FlipChecker] Watchlist: initializing scanner with",r.length,"active filters"),setTimeout(()=>{E||ot(r)},1e3),Nt(r)})}function Nt(e){T&&T.disconnect();let t=document.querySelector('div[role="main"]')||document.body;T=new MutationObserver(()=>{E||(M&&clearTimeout(M),M=setTimeout(()=>{!E&&!A&&(Ut(),ot(e))},500))}),T.observe(t,{childList:!0,subtree:!0})}async function ot(e){if(!(A||E||!C()||!e.length)){A=!0,Bt();try{let t=rt(),r=Date.now();for(let[i,s]of O)r-s>36e5&&O.delete(i);let o=t.filter(i=>!O.has(i.id));if(o.length===0){console.log("[FlipChecker] Watchlist: no new listings to scan"),ue(),A=!1;return}let n=[];for(let i of o){for(let s of e)if(Dt(i,s)){n.push({listing:i,filter:s});break}O.set(i.id,r)}console.log("[FlipChecker] Watchlist:",o.length,"new listings,",n.length,"matches");let a=n.slice(0,10);for(let{listing:i,filter:s}of a){if(E)break;let l=await X(i.title);if(E)break;if(l?.error){if(l.error==="limit_reached"||l.error==="auth_required"){console.log("[FlipChecker] Watchlist: stopping scan -",l.error);break}if(l.error==="network_error"){console.log("[FlipChecker] Watchlist: network error, stopping");break}continue}let c=l?.prices?.avg||l?.avg;if(!c)continue;let d=Math.round(c*.84-i.price);d>=s.min_profit&&(nt(i.cardElement,i.id,d),Ot(i,s,l,d)),E||await new Promise(f=>setTimeout(f,500))}}catch(t){console.error("[FlipChecker] Watchlist scan error:",t)}finally{ue(),A=!1}}}function Dt(e,t){if(!e.price||e.price<=0||e.price>t.max_buy_price)return!1;let r=e.title.toLowerCase();return t.keywords.toLowerCase().split(/\s+/).filter(n=>n.length>0).every(n=>r.includes(n))}function nt(e,t,r){if(!e||e.querySelector("[data-flipchecker-badge]"))return;let n=e.querySelector("img")?.closest("div")||e;window.getComputedStyle(n).position==="static"&&(n.style.position="relative");let i=document.createElement("div");i.setAttribute("data-flipchecker-badge",t),i.style.cssText=`
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    background: #16a34a;
    color: #fff;
    border-radius: 9999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    pointer-events: auto;
  `;let s=document.createElement("span");s.textContent=`\u{1F525} +$${r} profit`;let l=document.createElement("span");l.textContent="\xD7",l.style.cssText=`
    cursor: pointer;
    margin-left: 4px;
    font-size: 14px;
    opacity: 0.7;
  `,l.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),i.remove(),V.delete(t)}),i.appendChild(s),i.appendChild(l),n.appendChild(i),V.set(t,{profit:r})}function Ut(){for(let[e,t]of V){if(document.querySelector(`[data-flipchecker-badge="${e}"]`))continue;let r=document.querySelector(`a[href*="/marketplace/item/${e}"]`);if(!r)continue;let o=r.closest("div[class]")||r.parentElement;o&&nt(o,e,t.profit)}}function Ot(e,t,r,o){let n=r?.prices?.avg||r?.avg||null,a={id:`alert_${e.id}_${Date.now()}`,filterId:t.id,title:e.title,price:e.price,ebayAvg:n,profit:o,url:e.url,listingId:e.id,foundAt:new Date().toISOString()};chrome.storage.local.get(["watchlistAlerts"],i=>{let s=i.watchlistAlerts||[];s.some(l=>l.listingId===e.id)||(s.unshift(a),s.length>50&&(s=s.slice(0,50)),chrome.storage.local.set({watchlistAlerts:s}))});try{chrome.runtime.sendMessage({type:"apiRequest",url:`${zt()}/api/watchlist/alerts`,method:"POST",headers:{"Content-Type":"application/json"},body:{filter_id:t.id,listing_title:e.title,listing_price:e.price,ebay_avg_price:n,estimated_profit:o,listing_url:e.url,fb_listing_id:e.id}})}catch{}}function zt(){return k}function Bt(){if(y)return;y=document.createElement("div"),y.id="flipchecker-scan-indicator",y.style.cssText=`
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 10000;
    background: rgba(22, 33, 62, 0.9);
    color: #4ade80;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;let e=document.createElement("div");if(e.style.cssText=`
    width: 14px;
    height: 14px;
    border: 2px solid #374151;
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: flipchecker-spin 1s linear infinite;
  `,!document.getElementById("flipchecker-scan-styles")){let r=document.createElement("style");r.id="flipchecker-scan-styles",r.textContent="@keyframes flipchecker-spin { to { transform: rotate(360deg); } }",document.head.appendChild(r)}let t=document.createElement("span");t.textContent="Scanning watchlist...",y.appendChild(e),y.appendChild(t),document.body.appendChild(y)}function ue(){y&&(y.remove(),y=null)}function j(){E=!0,T&&(T.disconnect(),T=null),M&&(clearTimeout(M),M=null),ue(),document.querySelectorAll("[data-flipchecker-badge]").forEach(e=>e.remove()),A=!1,O.clear(),V.clear()}async function Ht(e,t){let r=null,o="none";if(!h(e))return console.log("[FlipChecker] Job cancelled before extraction, aborting"),null;let n=Ie(t);if(n&&(console.log("[FlipChecker] Using intercepted GraphQL data"),r=n,o="graphql"),!r&&C()){console.log("[FlipChecker] Attempting vision extraction...");let a=await Xe();if(!h(e))return console.log("[FlipChecker] Job cancelled during vision extraction"),null;a&&(a.title||a.price)?(r=Ve(a,t),o="vision",console.log("[FlipChecker] Vision extraction successful:",r.title)):console.log("[FlipChecker] Vision extraction returned no usable data")}if(!r&&C()){console.log("[FlipChecker] Attempting AI extraction...");let a=await We();if(!h(e))return console.log("[FlipChecker] Job cancelled during AI extraction"),null;a&&(a.title||a.price)?(r=Ge(a,t),o="ai",console.log("[FlipChecker] AI extraction successful:",r.title)):console.log("[FlipChecker] AI extraction returned no usable data")}if(!r||!r.title&&!r.price){console.log("[FlipChecker] Using DOM extraction (fallback)...");let a=I()?.title||null;if(await Be(a,t,void 0,e),!h(e))return console.log("[FlipChecker] Job cancelled during DOM wait"),null;r=He(t),o="dom",console.log("[FlipChecker] DOM extraction result:",r.title)}return console.log("[FlipChecker] Extraction complete (method:",o+"):",r?.title),{data:r,method:o}}async function J(){let e=ve(),t=window.location.href,r=W();if(console.log("[FlipChecker] initOverlay started, job:",e,"item:",r),tt({title:"Loading...",itemId:r}),await new Promise(s=>setTimeout(s,1e3)),!h(e)||window.location.href!==t){console.log("[FlipChecker] Navigation during init wait, aborting job:",e),F(e);return}await le();let o=await Ht(e,r);if(!o||!h(e)){console.log("[FlipChecker] Extraction failed or job cancelled"),F(e);return}let{data:n,method:a}=o;if(ke(n),console.log("[FlipChecker] Final data (method: "+a+"):",n),!n.title&&!n.price){console.log("[FlipChecker] Could not extract listing data"),await ce({title:null,price:null,itemId:r},null),F(e);return}let i=null;if(C()&&n.title&&(i=await X(n.title),!h(e))){console.log("[FlipChecker] Job cancelled during price lookup"),F(e);return}await ce(n,i),F(e)}function Wt(e,t){console.log("[FlipChecker] Handling marketplace navigation:",e),pe(()=>{J()})}var it=!1,me=null,ge=null;function at(){if(it){console.log("[FlipChecker] Already initialized, skipping");return}it=!0,console.log("[FlipChecker] Content script loaded on:",window.location.href),console.log("[FlipChecker] Is marketplace item page:",D()),Fe(),Te(),Se((e,t)=>{Z(e)?(j(),Wt(e,t)):de(e)?(j(),fe()):j()}),me&&me(),ge&&ge(),me=Qe(()=>{console.log("[FlipChecker] Auth success, checking if should refresh overlay"),D()&&J()}),ge=Ke(e=>{console.log("[FlipChecker] Received sold data, checking if should refresh overlay"),document.getElementById("flipchecker-overlay")&&D()&&J()}),D()?(console.log("[FlipChecker] Initial page is marketplace item, showing trigger button"),pe(()=>{J()})):de(window.location.href)&&(console.log("[FlipChecker] Initial page is marketplace search, initializing watchlist scanner"),fe())}document.readyState==="loading"?(console.log("[FlipChecker] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",at)):(console.log("[FlipChecker] Document ready, initializing..."),at());})();
