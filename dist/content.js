(()=>{var S="flipchecker-overlay",$="flipchecker-trigger",g="https://www.flipchecker.io";var h={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function D(e){h={...h,...e}}function x(){return h.authToken}function _e(){return h.currentUser}function ve(e){h.lastExtractedData=e}function F(){return h.lastExtractedData}function Ee(){h.lastExtractedData=null}function Ce(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return h.currentJobId=e,h.isExtracting=!0,console.log("[FlipChecker] Started job:",e),e}function b(e){return h.currentJobId===e}function A(e){h.currentJobId===e&&(h.isExtracting=!1,console.log("[FlipChecker] Ended job:",e))}var ee=typeof window<"u"?window.location.href:"",Z=null,q=null,Se=!1,Le=[];function Ie(e){Le.push(e)}function ht(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function te(e=window.location.href){return e.includes("/marketplace/item/")}function xt(){let e=document.getElementById($),t=document.getElementById(S);e&&e.remove(),t&&t.remove()}function Te(e,t){Le.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Navigation callback error:",o)}})}function H(){let e=window.location.href;if(console.log("[FlipChecker] Navigation detected:",e),te(e)){let t=ht(e),o=F()?.itemId;t!==o&&(console.log("[FlipChecker] New item detected, clearing cache. Previous:",o,"New:",t),Ee()),Te(e,t)}else xt(),Te(e,null)}function yt(){let e=history.pushState,t=history.replaceState;history.pushState=function(...r){e.apply(this,r),H()},history.replaceState=function(...r){t.apply(this,r),H()},window.addEventListener("popstate",H),console.log("[FlipChecker] History API listeners installed")}function kt(){q&&(q.disconnect(),q=null);let e=new MutationObserver(()=>{Z&&clearTimeout(Z),Z=setTimeout(()=>{window.location.href!==ee&&(ee=window.location.href,H())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),q=e,console.log("[FlipChecker] MutationObserver backup installed"),e}function Fe(){if(Se){console.log("[FlipChecker] Navigation already initialized, skipping");return}Se=!0,ee=window.location.href,yt(),kt()}var Ae=new Map,bt=[];function Be(e){return Ae.get(e)||null}function wt(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let r=t.data.marketplace_product_details_page;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,currency:r.listing_price?.currency,location:r.location?.reverse_geocode?.city||r.location_text?.text,seller:r.marketplace_listing_seller?.name,description:r.redacted_description?.text,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),condition:r.condition,category:r.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let r=t.data.node;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,location:r.location_text?.text,seller:r.story?.comet_sections?.seller?.seller?.name,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let r=t.data.marketplace_pdp.product;return{itemId:r.id,title:r.title||r.name,price:r.price?.amount,priceFormatted:r.price?.formatted,location:r.location,seller:r.seller?.name,images:r.images?.map(o=>o.uri||o.url).filter(Boolean),source:"graphql"}}return null}catch(t){return console.warn("[FlipChecker] GraphQL parse error:",t.message),null}}function _t(e,t){console.log("[FlipChecker] Intercepted GraphQL data for item:",e),Ae.set(e,t),bt.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Data callback error:",o)}})}function Me(){let e=document.createElement("script");e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let r=wt(t.data.data);r&&r.itemId&&_t(r.itemId,r)}}),console.log("[FlipChecker] Network interception listener installed")}var Pe={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var $e={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},De={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},Re={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]'],tier3:[]};function R(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var re=/^\$[\d,]+(\.\d{2})?$/,Ne=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],Oe=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var Et=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],Ct=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function B(e){if(!e)return!0;let t=e.toLowerCase().trim();if(Et.includes(t))return!0;for(let r of Ct)if(r.test(e))return!0;return e.length<5}function Ue(e,t){if(!e||!t)return!1;let r=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&r.test(t)}function ie(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function G(){return document.querySelector('div[role="main"]')}function ze(e=1e4){let t=G();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function w(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function se(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function k(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),r=parseFloat(t);return isNaN(r)?null:r}function _(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function W(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function ae(e,t,r,o=.84){return{low:Math.round(t*o-e),high:Math.round(r*o-e)}}function ce(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function pe(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function X(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function N(){return window.location.href.includes("/marketplace/item/")}function Ge(e,t,r=5e3,o=null){return new Promise(n=>{let i=Date.now(),s=F();if(s?.itemId===t&&s?.title){console.log("[FlipChecker] Same item, using cached title:",s.title),n(!0);return}let l=()=>{if(o&&!b(o)){console.log("[FlipChecker] waitForNewContent cancelled \u2014 job no longer current"),n(!1);return}let a=We(),d=Date.now()-i,p=B(a);if(a&&!p&&a!==e&&d>=500){console.log("[FlipChecker] Content changed, new title:",a),n(!0);return}if(!e&&a&&!p&&d>=500){console.log("[FlipChecker] First load, found title:",a),n(!0);return}if(d>r){console.log("[FlipChecker] Timeout waiting for content change, current title:",a),n(!1);return}setTimeout(l,200)};l()})}function Lt(){let e=document.title||"";if(!e)return null;let t=e.replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i,"").trim();if(!t||t.length<5)return null;let r=t.replace(/\s*[-–]\s*\$[\d,]+.*$/,"").trim();return r&&r.length>=5&&(t=r),B(t)||t.startsWith("$")||/^\d+$/.test(t)?null:t}function It(){let t=(document.title||"").match(/\$[\d,]+/);if(t){let r=k(t[0]);if(r>=5)return r}return null}function We(){let e=Lt();if(e)return console.log("[FlipChecker] Found title via document.title:",e),e;let t=R(Pe);for(let n of t)try{let i=document.querySelectorAll(n);for(let s of i){let l=s.textContent.trim();if(l.length>15&&l.length<300&&!l.startsWith("$")&&!/^\d+$/.test(l)&&!B(l))return console.log("[FlipChecker] Found title via selector:",l),l}}catch{}let r=G();if(r){let n=r.querySelectorAll('span[dir="auto"]'),i=[];for(let s of n){let l=s.textContent.trim();if(l.length>15&&l.length<200&&!l.startsWith("$")&&!B(l)&&!/^\d+$/.test(l)){let a=ie(s);i.push({text:l,fontSize:a,element:s})}}if(i.sort((s,l)=>l.fontSize-s.fontSize),i.length>0)return console.log("[FlipChecker] Found title by prominence:",i[0].text),i[0].text}let o=document.querySelectorAll('h1, h2, [role="heading"]');for(let n of o){let i=n.textContent.trim();if(i.length>10&&i.length<300&&!B(i)&&!i.startsWith("$"))return console.log("[FlipChecker] Found title in heading:",i),i}return console.log("[FlipChecker] Could not extract title"),null}function Ft(){let e=It();if(e)return console.log("[FlipChecker] Found price via document.title:",e),e;let t=document.querySelector("h1");if(t){let i=t.closest("div");if(i){let s=i.parentElement?.querySelectorAll("span")||[];for(let l of s){let a=l.textContent.trim();if(re.test(a)){let d=k(a);return console.log("[FlipChecker] Found price near title:",d),d}}}}let r=document.querySelectorAll("span"),o=[];for(let i of r){let s=i.textContent.trim();if(re.test(s)){let l=ie(i),a=k(s);o.push({element:i,price:a,fontSize:l})}}if(o.sort((i,s)=>s.fontSize-i.fontSize),o.length>0){let i=o.find(s=>s.price>=5&&s.fontSize>=14);return i?(console.log("[FlipChecker] Found prominent price:",i.price,"fontSize:",i.fontSize),i.price):(console.log("[FlipChecker] Using largest price:",o[0].price),o[0].price)}let n=G();if(n){let s=n.innerText.match(/\$[\d,]+(\.\d{2})?/);if(s){let l=k(s[0]);return console.log("[FlipChecker] Found price in main content:",l),l}}return console.log("[FlipChecker] Could not extract price"),null}function At(){let e=R($e);for(let t of e)try{let r=document.querySelectorAll(t);for(let o of r){let n=o.textContent.trim();for(let i of Ne){let s=n.match(i);if(s)return s[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function Bt(){let e=R(De);for(let t of e)try{let r=document.querySelector(t);if(r&&r.textContent.trim()&&r.textContent.trim().length<50)return r.textContent.trim()}catch{}return null}function Mt(){let e=document.querySelectorAll("span");for(let t of e){let r=t.textContent.trim();for(let o of Oe)if(o.test(r))return r}return null}function O(){let e=R(Re);for(let t of e)try{let r=document.querySelector(t);if(r&&r.src)return r.src}catch{}return null}function Xe(e){return{title:We(),price:Ft(),location:At(),seller:Bt(),daysListed:Mt(),imageUrl:O(),itemId:e,source:"dom"}}async function Ve(){let e=x();return e?new Promise(t=>{let r=ze(1e4);console.log("[FlipChecker] Sending page text to AI extraction ("+r.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:r,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!o){console.log("[FlipChecker] AI extraction - no response"),t(null);return}if(!o.ok){console.log("[FlipChecker] AI extraction failed:",o.status,o.error||o.data?.error),t(null);return}console.log("[FlipChecker] AI extraction successful:",o.data),t(o.data)})}):(console.log("[FlipChecker] AI extraction skipped - not logged in"),null)}function je(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:k(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:O(),itemId:t,source:"ai"}}function Pt(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Screenshot capture error:",chrome.runtime.lastError),e(null);return}if(!t||!t.success){console.log("[FlipChecker] Screenshot capture failed:",t?.error),e(null);return}e(t.screenshot)})})}async function Je(){let e=x();if(e||(e=(await new Promise(o=>chrome.storage.local.get(["authToken"],o)))?.authToken||null,e&&(D({authToken:e}),console.log("[FlipChecker] Vision: recovered auth token from storage"))),!e)return console.log("[FlipChecker] Vision extraction skipped - not logged in"),null;let t=await Pt();return t?(console.log("[FlipChecker] Sending screenshot to vision extraction ("+Math.round(t.length/1024)+" KB)"),new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Vision extraction message error:",chrome.runtime.lastError),r(null);return}if(!o){console.log("[FlipChecker] Vision extraction - no response"),r(null);return}if(!o.ok){console.log("[FlipChecker] Vision extraction failed:",o.status,o.error||o.data?.error),r(null);return}o.data?.error&&console.log("[FlipChecker] Vision extraction API error:",o.data.error),console.log("[FlipChecker] Vision extraction successful:",o.data),r(o.data)})})):(console.log("[FlipChecker] Vision extraction skipped - screenshot capture failed"),null)}function Ke(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:k(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:O(),itemId:t,source:"vision"}}async function j(e){let t=x();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{title:e}},o=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Price lookup message error:",chrome.runtime.lastError),r({error:"network_error"});return}if(!o){r({error:"network_error"});return}if(o.status===401){r({error:"auth_required"});return}if(o.status===429){r({error:"limit_reached",message:o.data?.error});return}if(!o.ok){r({error:"api_error"});return}r(o.data)})}):{error:"auth_required"}}async function Qe(e,t){let r=x();return r?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{url:window.location.href,title:e.title,price:e.price,itemId:e.itemId,extractionMethod:e.source,location:e.location,sellerName:e.seller,images:e.images||(e.imageUrl?[e.imageUrl]:null),priceData:t?{ebayLow:t.ebay_low,ebayHigh:t.ebay_high,ebayAvg:t.ebay_avg}:null}},n=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Save deal message error:",chrome.runtime.lastError),V(e),o({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){V(e),o({success:!0,local:!0});return}if(n?.status===429){o({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipChecker] API save failed:",n?.error||n?.status),V(e),o({success:!0,local:!0});return}console.log("[FlipChecker] Deal saved to cloud successfully"),o({success:!0})})}):(V(e),{success:!0,local:!0})}function V(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,imageUrl:e.imageUrl||e.images&&e.images[0]||null,ebayUrl:W(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],r=>{let o=r.savedDeals||[];o.unshift(t),o.length>100&&o.pop(),chrome.storage.local.set({savedDeals:o},()=>{chrome.runtime.lastError?console.error("[FlipChecker] Failed to save deal locally:",chrome.runtime.lastError.message):console.log("[FlipChecker] Deal saved locally")})})}async function Ze(e){return new Promise(t=>{if(!e){t(null);return}let o=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([o,"flipchecker_last_sold"],n=>{if(n[o]&&pe(n[o].timestamp,864e5)){console.log("[FlipChecker] Found exact match for sold data"),t(n[o]);return}if(n.flipchecker_last_sold&&pe(n.flipchecker_last_sold.timestamp,864e5)){let i=n.flipchecker_last_sold.query.toLowerCase(),s=e.toLowerCase(),l=i.split(/\s+/).filter(f=>f.length>3),a=s.split(/\s+/).filter(f=>f.length>3),d=l.filter(f=>a.some(T=>T.includes(f)||f.includes(T))),p=a.length>0?d.length/a.length:0;if(console.log("[FlipChecker] Fuzzy match check - overlap:",d.length,"ratio:",p),p>=.6&&d.length>=3){console.log("[FlipChecker] Using fuzzy matched sold data"),t(n.flipchecker_last_sold);return}}t(null)})})}async function J(){return new Promise(e=>{chrome.storage.local.get(["authToken","user"],t=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Error reading auth from storage:",chrome.runtime.lastError),e();return}t.authToken?(D({authToken:t.authToken,currentUser:t.user||null}),console.log("[FlipChecker] Auth loaded from storage:",t.user?.email||"token present")):console.log("[FlipChecker] No auth token in storage"),e()})})}function et(e){let t=r=>{r.type==="authSuccess"&&(console.log("[FlipChecker] Auth success received"),D({authToken:null,currentUser:r.user}),J().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function tt(e){let t=r=>{r.type==="soldDataAvailable"&&(console.log("[FlipChecker] Received sold data from eBay:",r.data),e(r.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function v(){return!!x()}function rt(){chrome.runtime.sendMessage({type:"openLogin"})}function ot(){chrome.runtime.sendMessage({type:"openUpgrade"})}function Dt(){return`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Space+Grotesk:wght@400;500;600;700&display=swap');

      * {
        box-sizing: border-box;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #F8F4E8;
        color: #09090B;
        padding: 0;
        width: 310px;
        border: 2px solid #09090B;
        box-shadow: 4px 4px 0px #09090B;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
        background: #09090B;
      }
      .logo {
        font-family: 'Dela Gothic One', cursive;
        font-weight: 400;
        font-size: 14px;
        color: #D2E823;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tier-badge {
        font-size: 9px;
        padding: 2px 6px;
        background: #D2E823;
        color: #09090B;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid #09090B;
      }
      .tier-flipper { background: #D2E823; color: #09090B; }
      .tier-pro { background: #D2E823; color: #09090B; }
      .close-btn {
        background: none;
        border: none;
        color: #ffffff50;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      }
      .close-btn:hover { color: #fff; }
      .price-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 2px solid #09090B;
      }
      .listing-image {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border: 2px solid #09090B;
        flex-shrink: 0;
      }
      .price-info {
        flex: 1;
        min-width: 0;
        text-align: center;
      }
      .current-price {
        font-family: 'Dela Gothic One', cursive;
        font-size: 32px;
        font-weight: 400;
        color: #09090B;
      }
      .title {
        font-size: 12px;
        color: #09090B99;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .alert-match {
        background: #D2E82340;
        color: #09090B;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 700;
        border-bottom: 2px solid #09090B;
        text-align: center;
        border-left: 4px solid #D2E823;
      }
      .alert-match-icon {
        margin-right: 4px;
      }
      .warning {
        background: #fef2f2;
        color: #dc2626;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .login-prompt {
        background: #fff;
        color: #09090B;
        padding: 12px 16px;
        font-size: 12px;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .login-btn {
        background: #09090B;
        color: #D2E823;
        border: 2px solid #09090B;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .login-btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .upgrade-prompt {
        background: #fff;
        color: #09090B;
        padding: 12px 16px;
        font-size: 12px;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .upgrade-btn {
        background: #D2E823;
        color: #09090B;
        border: 2px solid #09090B;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .upgrade-btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .ebay-section {
        background: #fff;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
      }
      .ebay-label {
        font-size: 10px;
        color: #09090B80;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .ebay-range {
        font-family: 'Dela Gothic One', cursive;
        font-size: 18px;
        font-weight: 400;
        color: #09090B;
      }
      .source-tag {
        font-size: 10px;
        color: #09090B60;
        margin-top: 4px;
        font-weight: 600;
      }
      .profit-section {
        background: #fff;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
      }
      .profit-label {
        font-size: 10px;
        color: #09090B80;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .profit-range {
        font-family: 'Dela Gothic One', cursive;
        font-size: 18px;
        font-weight: 400;
      }
      .profit-positive { color: #16a34a; }
      .profit-negative { color: #dc2626; }
      .profit-mixed { color: #ca8a04; }
      .meta {
        font-size: 11px;
        color: #09090B80;
        padding: 8px 16px;
        border-bottom: 2px solid #09090B;
      }
      .meta-item { margin-bottom: 2px; font-weight: 500; }
      .buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
      }
      .btn {
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 2px solid #09090B;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .btn-primary {
        background: #09090B;
        color: #D2E823;
      }
      .btn-secondary {
        background: #fff;
        color: #09090B;
      }
      .btn-success {
        background: #D2E823;
        color: #09090B;
      }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .saved-msg {
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        padding: 0 16px;
        display: none;
      }
      .saved-msg.success { color: #16a34a; }
      .saved-msg.error { color: #dc2626; }
      .footer {
        padding: 8px 16px;
        border-top: 2px solid #09090B;
        font-size: 10px;
        color: #09090B60;
        text-align: center;
        font-weight: 600;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #09090B80;
        font-weight: 600;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #09090B20;
        border-top-color: #D2E823;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .samples {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 2px solid #09090B20;
      }
      .sample-item {
        font-size: 11px;
        color: #09090B80;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        font-weight: 500;
      }
      .sample-price { color: #09090B; font-weight: 700; }
      .ebay-section.real-data {
        background: #D2E82320;
        border-left: 4px solid #D2E823;
      }
      .real-badge {
        background: #D2E823;
        color: #09090B;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 700;
        margin-right: 4px;
        border: 1px solid #09090B;
      }
      .ebay-stats-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #09090B80;
        margin-top: 4px;
        font-weight: 600;
      }
      .get-real-data {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 2px solid #09090B20;
        font-size: 11px;
        color: #09090B80;
        text-align: center;
        font-weight: 600;
      }
    </style>
  `}function Rt(){let e=_e();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function de(e,t=null,r=[]){let o=X();if(e.itemId&&e.itemId!==o){console.log("[FlipChecker] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",o);return}let n=document.getElementById(S);n&&n.remove();let i=document.createElement("div");i.id=S;let s=i.attachShadow({mode:"open"}),l=t&&!t.error,a=v(),d=t?.error==="limit_reached",p=null,f=null,T="profit-positive";if(l&&e.price){let c=ae(e.price,t.ebay_low,t.ebay_high);p=c.low,f=c.high,T=ce(p,f)}let ut=Ue(e.price,e.title),ye=t?.ebay_url||W(e.title),ft=Rt(),ke=e.imageUrl||e.images&&e.images[0]||null,m=`
    ${Dt()}
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER ${ft}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        ${ke?`<img class="listing-image" src="${se(ke)}" alt="" />`:""}
        <div class="price-info">
          <div class="current-price">${_(e.price)}</div>
          <div class="title" title="${w(e.title||"")}">${w(e.title)||"Unknown Item"}</div>
        </div>
      </div>

      ${r.length>0?r.map(c=>`<div class="alert-match"><span class="alert-match-icon">\u{1F514}</span> ALERT MATCH: ${w(c.search_query)}${c.max_price?` \u2014 under $${c.max_price}`:""}!</div>`).join(""):""}
      ${ut?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;a||(m+=`
      <div class="login-prompt">
        <div style="font-weight: 700;">Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),d&&(m+=`
      <div class="upgrade-prompt">
        <div style="font-weight: 700;">Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let L=await Ze(e.title);if(L&&L.stats&&L.stats.count>0){let c=L.stats;if(e.price){let u=ae(e.price,c.low,c.high);p=u.low,f=u.high,T=ce(p,f)}if(m+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${_(c.low)} - ${_(c.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${_(c.median)}</span>
          <span>Avg: ${_(c.avg)}</span>
        </div>
        <div class="source-tag">${c.count} sold listings analyzed</div>
        ${L.samples&&L.samples.length>0?`
          <div class="samples">
            ${L.samples.slice(0,3).map(u=>`
              <div class="sample-item">
                <span>${w(u.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(u.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,p!==null){let u=e.price?Math.round(p/e.price*100):null,y=e.price?Math.round(f/e.price*100):null;m+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${T}">
            ${p>=0?"+":""}$${p} to ${f>=0?"+":""}$${f}
          </div>
          ${u!==null?`<div class="source-tag">ROI: ${u}% \u2013 ${y}%</div>`:""}
        </div>
      `}}else if(l){let u={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;if(m+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${_(t.ebay_low)} - ${_(t.ebay_high)}</div>
        <div class="source-tag">Source: ${w(u)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(y=>`
              <div class="sample-item">
                <span>${w(y.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(y.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,p!==null){let y=e.price?Math.round(p/e.price*100):null,mt=e.price?Math.round(f/e.price*100):null;m+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${T}">
            ${p>=0?"+":""}$${p} to ${f>=0?"+":""}$${f}
          </div>
          ${y!==null?`<div class="source-tag">ROI: ${y}% \u2013 ${mt}%</div>`:""}
        </div>
      `}}else if(!a||d){let c=e.price?Math.round(e.price*.7):null,u=e.price?Math.round(e.price*1.5):null;c&&u&&(m+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${_(c)} - ${_(u)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}m+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${w(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${w(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${w(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${ye?`<a href="${se(ye)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(m+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),m+=`
    <div class="footer">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,m+="</div>",s.innerHTML=m,s.getElementById("close-overlay").addEventListener("click",()=>{i.remove()});let be=s.getElementById("login-btn");be&&be.addEventListener("click",()=>{rt()});let we=s.getElementById("upgrade-btn");we&&we.addEventListener("click",()=>{ot()}),s.getElementById("save-deal").addEventListener("click",async()=>{let c=s.getElementById("save-deal"),u=s.getElementById("saved-msg");c.disabled=!0,c.textContent="Saving...";let y=await Qe(e,t);c.disabled=!1,c.textContent="Save Deal",y.success?(u.textContent=y.local?"Saved locally!":"Deal saved!",u.className="saved-msg success"):(u.textContent=y.error||"Failed to save",u.className="saved-msg error"),u.style.display="block",setTimeout(()=>{u.style.display="none"},3e3)}),document.body.appendChild(i)}function nt(e){let t=document.getElementById(S);t&&t.remove();let r=document.createElement("div");r.id=S;let o=r.attachShadow({mode:"open"});return o.innerHTML=`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Space+Grotesk:wght@400;500;600;700&display=swap');

      * {
        box-sizing: border-box;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #F8F4E8;
        color: #09090B;
        padding: 0;
        width: 310px;
        border: 2px solid #09090B;
        box-shadow: 4px 4px 0px #09090B;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
        background: #09090B;
      }
      .logo {
        font-family: 'Dela Gothic One', cursive;
        font-weight: 400;
        font-size: 14px;
        color: #D2E823;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #09090B80;
        font-weight: 600;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #09090B20;
        border-top-color: #D2E823;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER</span>
      </div>
      <div class="loading">
        <div class="spinner"></div>
        <span>Fetching prices...</span>
      </div>
    </div>
  `,document.body.appendChild(r),r}function ue(e){console.log("[FlipChecker] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(S);t&&(console.log("[FlipChecker] Removing old overlay"),t.remove());let r=document.getElementById($);r&&(console.log("[FlipChecker] Removing old button"),r.remove());let o=document.createElement("button");o.id=$,o.innerHTML="\u{1F4B0} CHECK FLIP",o.style.cssText=`
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 2147483646;
    background: #D2E823;
    color: #09090B;
    border: 2px solid #09090B;
    padding: 10px 18px;
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 3px 3px 0px #09090B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: transform 0.1s, box-shadow 0.1s;
  `,o.addEventListener("mouseenter",()=>{o.style.transform="translate(1px, 1px)",o.style.boxShadow="2px 2px 0px #09090B"}),o.addEventListener("mouseleave",()=>{o.style.transform="translate(0, 0)",o.style.boxShadow="3px 3px 0px #09090B"}),o.addEventListener("click",()=>{o.remove(),e()}),document.body.appendChild(o),console.log("[FlipChecker] Button added to page")}var U=null,it=0,Nt=5*60*1e3;async function Ot(){let e=Date.now();if(U&&e-it<Nt)return U;let t=x();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/alerts`,method:"GET",headers:{Authorization:`Bearer ${t}`}},o=>{if(chrome.runtime.lastError||!o?.ok){console.warn("[FlipChecker] Failed to fetch alerts"),r(U||[]);return}U=o.data?.alerts||[],it=e,r(U)})}):[]}function Ut(e,t){if(!e||!t)return!1;let r=e.toLowerCase(),o=t.toLowerCase();if(r.includes(o))return!0;let n=o.split(/\s+/).filter(l=>l.length>2),i=r.split(/\s+/).filter(l=>l.length>2);return n.length===0?!1:n.filter(l=>i.some(a=>a.includes(l)||l.includes(a))).length/n.length>=.6}function zt(e,t){let r=x();r&&chrome.runtime.sendMessage({type:"apiRequest",url:`${g}/api/alerts/match`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{alert_id:e.id,listing_title:t.title,listing_price:t.price,source_url:window.location.href}},o=>{chrome.runtime.lastError&&console.warn("[FlipChecker] Failed to save alert match")})}async function st(e){if(!e?.title)return[];let t=await Ot();if(!t.length)return[];let r=[];for(let o of t){let n=Ut(e.title,o.search_query),i=!o.max_price||e.price&&e.price<=o.max_price;n&&i&&(r.push(o),zt(o,e))}return r.length>0&&console.log("[FlipChecker] Alert matches found:",r.length),r}function fe(e){if(!e)return!1;try{let r=new URL(e).pathname;return!(!r.startsWith("/marketplace")||r.includes("/marketplace/item/")||r.includes("/marketplace/profile/")||r.includes("/marketplace/you/")||r.includes("/marketplace/create"))}catch{return!1}}function lt(){let e=[],t=new Set,r=document.querySelectorAll('a[href*="/marketplace/item/"]');for(let o of r){let n=o.href.match(/\/marketplace\/item\/(\d+)/);if(!n)continue;let i=n[1];if(t.has(i))continue;t.add(i);let s=qt(o);if(!s)continue;let l=Ht(s);if(!l)continue;let a=Gt(s);if(a===null)continue;let d=o.href.split("?")[0];e.push({id:i,title:l,price:a,url:d,cardElement:s})}return e}function qt(e){let t=e;for(let r=0;r<6&&t.parentElement;r++){t=t.parentElement;let o=t.querySelector("img"),n=t.textContent||"",i=/\$[\d,]+/.test(n);if(o&&i&&n.length>20)return t}return e.closest("div[class]")||e.parentElement}function Ht(e){let t=e.querySelectorAll('span[dir="auto"]');for(let r of t){let o=r.textContent?.trim();if(o&&!/^\$[\d,]+/.test(o)&&!(o.length<10)&&!/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(o))return o}return null}function Gt(e){let t=e.querySelectorAll("span");for(let r of t){let o=r.textContent?.trim();if(o&&/^\$[\d,]+(\.\d{2})?$/.test(o)){let n=k(o);if(n!==null&&n>0)return n}}return null}var M=!1,z=new Map,K=new Map,I=null,C=!1,E=null,P=null;function ge(){if(C=!1,!v()){console.log("[FlipChecker] Watchlist: not logged in, skipping");return}chrome.storage.local.get(["watchlistFilters"],e=>{let t=e.watchlistFilters;if(!t||t.length===0){console.log("[FlipChecker] Watchlist: no filters configured, skipping");return}let r=t.filter(o=>o.is_active!==!1);if(r.length===0){console.log("[FlipChecker] Watchlist: no active filters, skipping");return}console.log("[FlipChecker] Watchlist: initializing scanner with",r.length,"active filters"),setTimeout(()=>{C||at(r)},1e3),jt(r)})}function jt(e){I&&I.disconnect();let t=document.querySelector('div[role="main"]')||document.body;I=new MutationObserver(()=>{C||(P&&clearTimeout(P),P=setTimeout(()=>{!C&&!M&&(Kt(),at(e))},500))}),I.observe(t,{childList:!0,subtree:!0})}async function at(e){if(!(M||C||!v()||!e.length)){M=!0,Zt();try{let t=lt(),r=Date.now();for(let[s,l]of z)r-l>36e5&&z.delete(s);let o=t.filter(s=>!z.has(s.id));if(o.length===0){console.log("[FlipChecker] Watchlist: no new listings to scan"),me(),M=!1;return}let n=[];for(let s of o){for(let l of e)if(Jt(s,l)){n.push({listing:s,filter:l});break}z.set(s.id,r)}console.log("[FlipChecker] Watchlist:",o.length,"new listings,",n.length,"matches");let i=n.slice(0,10);for(let{listing:s,filter:l}of i){if(C)break;let a=await j(s.title);if(C)break;if(a?.error){if(a.error==="limit_reached"||a.error==="auth_required"){console.log("[FlipChecker] Watchlist: stopping scan -",a.error);break}if(a.error==="network_error"){console.log("[FlipChecker] Watchlist: network error, stopping");break}continue}let d=a?.prices?.avg||a?.avg;if(!d)continue;let p=Math.round(d*.84-s.price);p>=l.min_profit&&(ct(s.cardElement,s.id,p),Yt(s,l,a,p)),C||await new Promise(f=>setTimeout(f,500))}}catch(t){console.error("[FlipChecker] Watchlist scan error:",t)}finally{me(),M=!1}}}function Jt(e,t){if(!e.price||e.price<=0||e.price>t.max_buy_price)return!1;let r=e.title.toLowerCase();return t.keywords.toLowerCase().split(/\s+/).filter(n=>n.length>0).every(n=>r.includes(n))}function ct(e,t,r){if(!e||e.querySelector("[data-flipchecker-badge]"))return;let n=e.querySelector("img")?.closest("div")||e;window.getComputedStyle(n).position==="static"&&(n.style.position="relative");let s=document.createElement("div");s.setAttribute("data-flipchecker-badge",t),s.style.cssText=`
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
  `;let l=document.createElement("span");l.textContent=`\u{1F525} +$${r} profit`;let a=document.createElement("span");a.textContent="\xD7",a.style.cssText=`
    cursor: pointer;
    margin-left: 4px;
    font-size: 14px;
    opacity: 0.7;
  `,a.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),s.remove(),K.delete(t)}),s.appendChild(l),s.appendChild(a),n.appendChild(s),K.set(t,{profit:r})}function Kt(){for(let[e,t]of K){if(document.querySelector(`[data-flipchecker-badge="${e}"]`))continue;let r=document.querySelector(`a[href*="/marketplace/item/${e}"]`);if(!r)continue;let o=r.closest("div[class]")||r.parentElement;o&&ct(o,e,t.profit)}}function Yt(e,t,r,o){let n=r?.prices?.avg||r?.avg||null,i={id:`alert_${e.id}_${Date.now()}`,filterId:t.id,title:e.title,price:e.price,ebayAvg:n,profit:o,url:e.url,listingId:e.id,foundAt:new Date().toISOString()};chrome.storage.local.get(["watchlistAlerts"],s=>{let l=s.watchlistAlerts||[];l.some(a=>a.listingId===e.id)||(l.unshift(i),l.length>50&&(l=l.slice(0,50)),chrome.storage.local.set({watchlistAlerts:l}))});try{chrome.runtime.sendMessage({type:"apiRequest",url:`${Qt()}/api/watchlist/alerts`,method:"POST",headers:{"Content-Type":"application/json"},body:{filter_id:t.id,listing_title:e.title,listing_price:e.price,ebay_avg_price:n,estimated_profit:o,listing_url:e.url,fb_listing_id:e.id}})}catch{}}function Qt(){return g}function Zt(){if(E)return;E=document.createElement("div"),E.id="flipchecker-scan-indicator",E.style.cssText=`
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
  `,!document.getElementById("flipchecker-scan-styles")){let r=document.createElement("style");r.id="flipchecker-scan-styles",r.textContent="@keyframes flipchecker-spin { to { transform: rotate(360deg); } }",document.head.appendChild(r)}let t=document.createElement("span");t.textContent="Scanning watchlist...",E.appendChild(e),E.appendChild(t),document.body.appendChild(E)}function me(){E&&(E.remove(),E=null)}function Y(){C=!0,I&&(I.disconnect(),I=null),P&&(clearTimeout(P),P=null),me(),document.querySelectorAll("[data-flipchecker-badge]").forEach(e=>e.remove()),M=!1,z.clear(),K.clear()}async function tr(e,t){let r=null,o="none";if(!b(e))return console.log("[FlipChecker] Job cancelled before extraction, aborting"),null;let n=Be(t);if(n&&(console.log("[FlipChecker] Using intercepted GraphQL data"),r=n,o="graphql"),!r&&v()){console.log("[FlipChecker] Attempting vision extraction...");let i=await Je();if(!b(e))return console.log("[FlipChecker] Job cancelled during vision extraction"),null;i&&(i.title||i.price)?(r=Ke(i,t),o="vision",console.log("[FlipChecker] Vision extraction successful:",r.title)):console.log("[FlipChecker] Vision extraction returned no usable data")}if(!r&&v()){console.log("[FlipChecker] Attempting AI extraction...");let i=await Ve();if(!b(e))return console.log("[FlipChecker] Job cancelled during AI extraction"),null;i&&(i.title||i.price)?(r=je(i,t),o="ai",console.log("[FlipChecker] AI extraction successful:",r.title)):console.log("[FlipChecker] AI extraction returned no usable data")}if(!r||!r.title&&!r.price){console.log("[FlipChecker] Using DOM extraction (fallback)...");let i=F()?.title||null;if(await Ge(i,t,void 0,e),!b(e))return console.log("[FlipChecker] Job cancelled during DOM wait"),null;r=Xe(t),o="dom",console.log("[FlipChecker] DOM extraction result:",r.title)}return console.log("[FlipChecker] Extraction complete (method:",o+"):",r?.title),{data:r,method:o}}async function Q(){let e=Ce(),t=window.location.href,r=X();if(console.log("[FlipChecker] initOverlay started, job:",e,"item:",r),nt({title:"Loading...",itemId:r}),await new Promise(a=>setTimeout(a,1e3)),!b(e)||window.location.href!==t){console.log("[FlipChecker] Navigation during init wait, aborting job:",e),A(e);return}await J();let o=await tr(e,r);if(!o||!b(e)){console.log("[FlipChecker] Extraction failed or job cancelled"),A(e);return}let{data:n,method:i}=o;if(ve(n),console.log("[FlipChecker] Final data (method: "+i+"):",n),!n.title&&!n.price){console.log("[FlipChecker] Could not extract listing data"),await de({title:null,price:null,itemId:r},null),A(e);return}let s=null;if(v()&&n.title&&(s=await j(n.title),!b(e))){console.log("[FlipChecker] Job cancelled during price lookup"),A(e);return}let l=[];v()&&n.title&&(l=await st(n)),await de(n,s,l),A(e)}function rr(e,t){console.log("[FlipChecker] Handling marketplace navigation:",e),ue(()=>{Q()})}var pt=!1,he=null,xe=null;async function dt(){if(pt){console.log("[FlipChecker] Already initialized, skipping");return}pt=!0,console.log("[FlipChecker] Content script loaded on:",window.location.href),console.log("[FlipChecker] Is marketplace item page:",N()),Me(),await J(),Fe(),Ie((e,t)=>{te(e)?(Y(),rr(e,t)):fe(e)?(Y(),ge()):Y()}),he&&he(),xe&&xe(),he=et(()=>{console.log("[FlipChecker] Auth success, checking if should refresh overlay"),N()&&Q()}),xe=tt(e=>{console.log("[FlipChecker] Received sold data, checking if should refresh overlay"),document.getElementById("flipchecker-overlay")&&N()&&Q()}),N()?(console.log("[FlipChecker] Initial page is marketplace item, showing trigger button"),ue(()=>{Q()})):fe(window.location.href)&&(console.log("[FlipChecker] Initial page is marketplace search, initializing watchlist scanner"),ge())}document.readyState==="loading"?(console.log("[FlipChecker] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",dt)):(console.log("[FlipChecker] Document ready, initializing..."),dt());})();
