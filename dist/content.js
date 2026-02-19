(()=>{var T="flipchecker-overlay",D="flipchecker-trigger",f="https://www.flipchecker.io";var y={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function A(e){y={...y,...e}}function k(){return y.authToken}function ve(){return y.currentUser}function Ee(e){y.lastExtractedData=e}function B(){return y.lastExtractedData}function Ce(){y.lastExtractedData=null}function Se(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return y.currentJobId=e,y.isExtracting=!0,console.log("[FlipChecker] Started job:",e),e}function _(e){return y.currentJobId===e}function M(e){y.currentJobId===e&&(y.isExtracting=!1,console.log("[FlipChecker] Ended job:",e))}var te=typeof window<"u"?window.location.href:"",ee=null,H=null,Te=!1,Ie=[];function Fe(e){Ie.push(e)}function xt(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function re(e=window.location.href){return e.includes("/marketplace/item/")}function yt(){let e=document.getElementById(D),t=document.getElementById(T);e&&e.remove(),t&&t.remove()}function Le(e,t){Ie.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Navigation callback error:",o)}})}function G(){let e=window.location.href;if(console.log("[FlipChecker] Navigation detected:",e),re(e)){let t=xt(e),o=B()?.itemId;t!==o&&(console.log("[FlipChecker] New item detected, clearing cache. Previous:",o,"New:",t),Ce()),Le(e,t)}else yt(),Le(e,null)}function kt(){let e=history.pushState,t=history.replaceState;history.pushState=function(...r){e.apply(this,r),G()},history.replaceState=function(...r){t.apply(this,r),G()},window.addEventListener("popstate",G),console.log("[FlipChecker] History API listeners installed")}function bt(){H&&(H.disconnect(),H=null);let e=new MutationObserver(()=>{ee&&clearTimeout(ee),ee=setTimeout(()=>{window.location.href!==te&&(te=window.location.href,G())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),H=e,console.log("[FlipChecker] MutationObserver backup installed"),e}function Ae(){if(Te){console.log("[FlipChecker] Navigation already initialized, skipping");return}Te=!0,te=window.location.href,kt(),bt()}var Be=new Map,_t=[];function Me(e){return Be.get(e)||null}function wt(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let r=t.data.marketplace_product_details_page;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,currency:r.listing_price?.currency,location:r.location?.reverse_geocode?.city||r.location_text?.text,seller:r.marketplace_listing_seller?.name,description:r.redacted_description?.text,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),condition:r.condition,category:r.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let r=t.data.node;return{itemId:r.id,title:r.marketplace_listing_title,price:r.listing_price?.amount,priceFormatted:r.listing_price?.formatted_amount,location:r.location_text?.text,seller:r.story?.comet_sections?.seller?.seller?.name,images:r.listing_photos?.map(o=>o.image?.uri).filter(Boolean),source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let r=t.data.marketplace_pdp.product;return{itemId:r.id,title:r.title||r.name,price:r.price?.amount,priceFormatted:r.price?.formatted,location:r.location,seller:r.seller?.name,images:r.images?.map(o=>o.uri||o.url).filter(Boolean),source:"graphql"}}return null}catch(t){return console.warn("[FlipChecker] GraphQL parse error:",t.message),null}}function vt(e,t){console.log("[FlipChecker] Intercepted GraphQL data for item:",e),Be.set(e,t),_t.forEach(r=>{try{r(e,t)}catch(o){console.error("[FlipChecker] Data callback error:",o)}})}function Pe(){let e=document.createElement("script");e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let r=wt(t.data.data);r&&r.itemId&&vt(r.itemId,r)}}),console.log("[FlipChecker] Network interception listener installed")}var $e={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var Re={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},De={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},Ne={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[style*="object-fit"]','div[role="main"] div[aria-label] img[src*="scontent"]','div[role="main"] div[data-pagelet] img[src*="scontent"]'],tier3:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]']};function N(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var oe=/^\$[\d,]+(\.\d{2})?$/,Oe=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],Ue=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var Ct=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],St=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function P(e){if(!e)return!0;let t=e.toLowerCase().trim();if(Ct.includes(t))return!0;for(let r of St)if(r.test(e))return!0;return e.length<5}function ze(e,t){if(!e||!t)return!1;let r=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&r.test(t)}function se(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function W(){return document.querySelector('div[role="main"]')}function qe(e=1e4){let t=W();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function w(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function le(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function b(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),r=parseFloat(t);return isNaN(r)?null:r}function v(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function V(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function ce(e,t,r,o=.84){return t==null||r==null||e==null?{low:null,high:null}:{low:Math.round(t*o-e),high:Math.round(r*o-e)}}function pe(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function de(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function X(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function O(){return window.location.href.includes("/marketplace/item/")}function We(e,t,r=5e3,o=null){return new Promise(n=>{let s=Date.now(),i=B();if(i?.itemId===t&&i?.title){console.log("[FlipChecker] Same item, using cached title:",i.title),n(!0);return}let l=()=>{if(o&&!_(o)){console.log("[FlipChecker] waitForNewContent cancelled \u2014 job no longer current"),n(!1);return}let a=Ve(),c=Date.now()-s,m=P(a);if(a&&!m&&a!==e&&c>=500){console.log("[FlipChecker] Content changed, new title:",a),n(!0);return}if(!e&&a&&!m&&c>=500){console.log("[FlipChecker] First load, found title:",a),n(!0);return}if(c>r){console.log("[FlipChecker] Timeout waiting for content change, current title:",a),n(!1);return}setTimeout(l,200)};l()})}function It(){let e=document.title||"";if(!e)return null;let t=e.replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i,"").trim();if(!t||t.length<5)return null;let r=t.replace(/\s*[-–]\s*\$[\d,]+.*$/,"").trim();return r&&r.length>=5&&(t=r),P(t)||t.startsWith("$")||/^\d+$/.test(t)?null:t}function Ft(){let t=(document.title||"").match(/\$[\d,]+/);if(t){let r=b(t[0]);if(r>=5)return r}return null}function Ve(){let e=It();if(e)return console.log("[FlipChecker] Found title via document.title:",e),e;let t=N($e);for(let n of t)try{let s=document.querySelectorAll(n);for(let i of s){let l=i.textContent.trim();if(l.length>15&&l.length<300&&!l.startsWith("$")&&!/^\d+$/.test(l)&&!P(l))return console.log("[FlipChecker] Found title via selector:",l),l}}catch{}let r=W();if(r){let n=r.querySelectorAll('span[dir="auto"]'),s=[];for(let i of n){let l=i.textContent.trim();if(l.length>15&&l.length<200&&!l.startsWith("$")&&!P(l)&&!/^\d+$/.test(l)){let a=se(i);s.push({text:l,fontSize:a,element:i})}}if(s.sort((i,l)=>l.fontSize-i.fontSize),s.length>0)return console.log("[FlipChecker] Found title by prominence:",s[0].text),s[0].text}let o=document.querySelectorAll('h1, h2, [role="heading"]');for(let n of o){let s=n.textContent.trim();if(s.length>10&&s.length<300&&!P(s)&&!s.startsWith("$"))return console.log("[FlipChecker] Found title in heading:",s),s}return console.log("[FlipChecker] Could not extract title"),null}function At(){let e=Ft();if(e)return console.log("[FlipChecker] Found price via document.title:",e),e;let t=document.querySelector("h1");if(t){let s=t.closest("div");if(s){let i=s.parentElement?.querySelectorAll("span")||[];for(let l of i){let a=l.textContent.trim();if(oe.test(a)){let c=b(a);return console.log("[FlipChecker] Found price near title:",c),c}}}}let r=document.querySelectorAll("span"),o=[];for(let s of r){let i=s.textContent.trim();if(oe.test(i)){let l=se(s),a=b(i);o.push({element:s,price:a,fontSize:l})}}if(o.sort((s,i)=>i.fontSize-s.fontSize),o.length>0){let s=o.find(i=>i.price>=5&&i.fontSize>=14);return s?(console.log("[FlipChecker] Found prominent price:",s.price,"fontSize:",s.fontSize),s.price):(console.log("[FlipChecker] Using largest price:",o[0].price),o[0].price)}let n=W();if(n){let i=n.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i){let l=b(i[0]);return console.log("[FlipChecker] Found price in main content:",l),l}}return console.log("[FlipChecker] Could not extract price"),null}function Bt(){let e=N(Re);for(let t of e)try{let r=document.querySelectorAll(t);for(let o of r){let n=o.textContent.trim();for(let s of Oe){let i=n.match(s);if(i)return i[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function Mt(){let e=N(De);for(let t of e)try{let r=document.querySelector(t);if(r&&r.textContent.trim()&&r.textContent.trim().length<50)return r.textContent.trim()}catch{}return null}function Pt(){let e=document.querySelectorAll("span");for(let t of e){let r=t.textContent.trim();for(let o of Ue)if(o.test(r))return r}return null}function I(){let t=N(Ne);for(let r of t)try{let o=document.querySelectorAll(r),n=null,s=0;for(let i of o){if(!i.src)continue;let l=i.naturalWidth||i.width||0,a=i.naturalHeight||i.height||0,c=Math.max(l,a);c>=200&&c>s&&(n=i.src,s=c)}if(n)return console.log("[FlipChecker] Found image via selector:",r,"size:",s),n}catch{}return null}function Xe(e){return{title:Ve(),price:At(),location:Bt(),seller:Mt(),daysListed:Pt(),imageUrl:I(),itemId:e,source:"dom"}}async function je(){let e=k();return e?new Promise(t=>{let r=qe(1e4);console.log("[FlipChecker] Sending page text to AI extraction ("+r.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:r,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!o){console.log("[FlipChecker] AI extraction - no response"),t(null);return}if(!o.ok){console.log("[FlipChecker] AI extraction failed:",o.status,o.error||o.data?.error),t(null);return}console.log("[FlipChecker] AI extraction successful:",o.data),t(o.data)})}):(console.log("[FlipChecker] AI extraction skipped - not logged in"),null)}function Je(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:I(),itemId:t,source:"ai"}}function $t(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Screenshot capture error:",chrome.runtime.lastError),e(null);return}if(!t||!t.success){console.log("[FlipChecker] Screenshot capture failed:",t?.error),e(null);return}e(t.screenshot)})})}async function Ke(){let e=k();if(e||(e=(await new Promise(o=>chrome.storage.local.get(["authToken"],o)))?.authToken||null,e&&(A({authToken:e}),console.log("[FlipChecker] Vision: recovered auth token from storage"))),!e)return console.log("[FlipChecker] Vision extraction skipped - not logged in"),null;let t=await $t();return t?(console.log("[FlipChecker] Sending screenshot to vision extraction ("+Math.round(t.length/1024)+" KB)"),new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},o=>{if(chrome.runtime.lastError){console.log("[FlipChecker] Vision extraction message error:",chrome.runtime.lastError),r(null);return}if(!o){console.log("[FlipChecker] Vision extraction - no response"),r(null);return}if(!o.ok){console.log("[FlipChecker] Vision extraction failed:",o.status,o.error||o.data?.error),r(null);return}o.data?.error&&console.log("[FlipChecker] Vision extraction API error:",o.data.error),console.log("[FlipChecker] Vision extraction successful:",o.data),r(o.data)})})):(console.log("[FlipChecker] Vision extraction skipped - screenshot capture failed"),null)}function Ye(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:I(),itemId:t,source:"vision"}}async function J(e){let t=k();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{query:e}},o=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Price lookup message error:",chrome.runtime.lastError),r({error:"network_error"});return}if(!o){r({error:"network_error"});return}if(o.status===401){r({error:"auth_required"});return}if(o.status===429){r({error:"limit_reached",message:o.data?.error});return}if(!o.ok){r({error:"api_error"});return}let n=o.data;r({source:n.source,ebay_low:n.prices?.low,ebay_high:n.prices?.high,ebay_avg:n.prices?.avg,ebay_median:n.prices?.median,sample_count:n.prices?.sample_count,samples:n.samples,ebay_url:n.ebay_search_url,usage:n.usage})})}):{error:"auth_required"}}async function Ze(e,t){let r=k();return r?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{url:window.location.href,title:e.title,price:e.price,itemId:e.itemId,extractionMethod:e.source,location:e.location,sellerName:e.seller,images:e.images||(e.imageUrl?[e.imageUrl]:null),ebay_search_url:t&&!t.error&&t.ebay_url||null,priceData:t&&!t.error?{ebayLow:t.ebay_low,ebayHigh:t.ebay_high,ebayAvg:t.ebay_avg}:null}},n=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Save deal message error:",chrome.runtime.lastError),j(e),o({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){j(e),o({success:!0,local:!0});return}if(n?.status===429){o({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipChecker] API save failed:",n?.error||n?.status),j(e),o({success:!0,local:!0});return}console.log("[FlipChecker] Deal saved to cloud successfully"),o({success:!0})})}):(j(e),{success:!0,local:!0})}function j(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,imageUrl:e.imageUrl||e.images&&e.images[0]||null,ebayUrl:V(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],r=>{let o=r.savedDeals||[];o.unshift(t),o.length>100&&o.pop(),chrome.storage.local.set({savedDeals:o},()=>{chrome.runtime.lastError?console.error("[FlipChecker] Failed to save deal locally:",chrome.runtime.lastError.message):console.log("[FlipChecker] Deal saved locally")})})}async function et(e){return new Promise(t=>{if(!e){t(null);return}let o=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([o,"flipchecker_last_sold"],n=>{if(n[o]&&de(n[o].timestamp,864e5)){console.log("[FlipChecker] Found exact match for sold data"),t(n[o]);return}if(n.flipchecker_last_sold&&de(n.flipchecker_last_sold.timestamp,864e5)){let s=n.flipchecker_last_sold.query.toLowerCase(),i=e.toLowerCase(),l=s.split(/\s+/).filter(u=>u.length>3),a=i.split(/\s+/).filter(u=>u.length>3),c=l.filter(u=>a.some(g=>g.includes(u)||u.includes(g))),m=a.length>0?c.length/a.length:0;if(console.log("[FlipChecker] Fuzzy match check - overlap:",c.length,"ratio:",m),m>=.6&&c.length>=3){console.log("[FlipChecker] Using fuzzy matched sold data"),t(n.flipchecker_last_sold);return}}t(null)})})}async function Dt(){return new Promise(e=>{chrome.storage.local.get(["refreshToken","user"],t=>{if(!t.refreshToken){e(!1);return}console.log("[FlipChecker] Attempting token refresh..."),chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/auth/refresh`,method:"POST",headers:{"Content-Type":"application/json"},body:{refresh_token:t.refreshToken}},r=>{if(chrome.runtime.lastError||!r?.ok){console.warn("[FlipChecker] Token refresh failed"),e(!1);return}let o=r.data;if(o?.access_token){let n={authToken:o.access_token};o.refresh_token&&(n.refreshToken=o.refresh_token),chrome.storage.local.set(n,()=>{A({authToken:o.access_token,currentUser:t.user||null}),console.log("[FlipChecker] Token refreshed successfully"),e(!0)})}else e(!1)})})})}async function K(){return new Promise(e=>{chrome.storage.local.get(["authToken","refreshToken","user"],async t=>{if(chrome.runtime.lastError){console.error("[FlipChecker] Error reading auth from storage:",chrome.runtime.lastError),e();return}if(t.authToken){let r=!1;try{let o=JSON.parse(atob(t.authToken.split(".")[1]));r=o.exp&&o.exp*1e3<Date.now()}catch{}r?t.refreshToken?(console.log("[FlipChecker] Stored token expired, refreshing..."),await Dt()||(console.log("[FlipChecker] Refresh failed, clearing auth"),chrome.storage.local.remove(["authToken","refreshToken","user"]))):(console.log("[FlipChecker] Stored token expired, no refresh token \u2014 please re-login"),chrome.storage.local.remove(["authToken","user"])):(A({authToken:t.authToken,currentUser:t.user||null}),console.log("[FlipChecker] Auth loaded from storage:",t.user?.email||"token present"))}else console.log("[FlipChecker] No auth token in storage");e()})})}function tt(e){let t=r=>{r.type==="authSuccess"&&(console.log("[FlipChecker] Auth success received"),A({authToken:null,currentUser:r.user}),K().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function rt(e){let t=r=>{r.type==="soldDataAvailable"&&(console.log("[FlipChecker] Received sold data from eBay:",r.data),e(r.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function E(){return!!k()}function ot(){chrome.runtime.sendMessage({type:"openLogin"})}function nt(){chrome.runtime.sendMessage({type:"openUpgrade"})}function Nt(){return`
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
      .saved-msg.local { color: #ca8a04; }
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
  `}function Ot(){let e=ve();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function ue(e,t=null,r=[]){let o=X();if(e.itemId&&e.itemId!==o){console.log("[FlipChecker] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",o);return}let n=document.getElementById(T);n&&n.remove();let s=document.createElement("div");s.id=T;let i=s.attachShadow({mode:"open"}),l=t&&!t.error,a=E(),c=t?.error==="limit_reached",m=l&&t.ebay_low!=null&&t.ebay_high!=null,u=null,g=null,q="profit-positive";if(m&&e.price){let p=ce(e.price,t.ebay_low,t.ebay_high);u=p.low,g=p.high,q=pe(u,g)}let ft=ze(e.price,e.title),ke=t?.ebay_url||V(e.title),mt=Ot(),be=e.imageUrl||e.images&&e.images[0]||null,h=`
    ${Nt()}
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER ${mt}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        ${be?`<img class="listing-image" src="${le(be)}" alt="" />`:""}
        <div class="price-info">
          <div class="current-price">${v(e.price)}</div>
          <div class="title" title="${w(e.title||"")}">${w(e.title)||"Unknown Item"}</div>
        </div>
      </div>

      ${r.length>0?r.map(p=>`<div class="alert-match"><span class="alert-match-icon">\u{1F514}</span> ALERT MATCH: ${w(p.search_query)}${p.max_price?` \u2014 under $${p.max_price}`:""}!</div>`).join(""):""}
      ${ft?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;a||(h+=`
      <div class="login-prompt">
        <div style="font-weight: 700;">Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),c&&(h+=`
      <div class="upgrade-prompt">
        <div style="font-weight: 700;">Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let L=await et(e.title);if(L&&L.stats&&L.stats.count>0){let p=L.stats;if(e.price){let d=ce(e.price,p.low,p.high);u=d.low,g=d.high,q=pe(u,g)}if(h+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${v(p.low)} - ${v(p.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${v(p.median)}</span>
          <span>Avg: ${v(p.avg)}</span>
        </div>
        <div class="source-tag">${p.count} sold listings analyzed</div>
        ${L.samples&&L.samples.length>0?`
          <div class="samples">
            ${L.samples.slice(0,3).map(d=>`
              <div class="sample-item">
                <span>${w(d.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(d.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,u!==null){let d=e.price?Math.round(u/e.price*100):null,x=e.price?Math.round(g/e.price*100):null;h+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${q}">
            ${u>=0?"+":""}$${u} to ${g>=0?"+":""}$${g}
          </div>
          ${d!==null?`<div class="source-tag">ROI: ${d}% \u2013 ${x}%</div>`:""}
        </div>
      `}}else if(l&&m){let d={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;if(h+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${v(t.ebay_low)} - ${v(t.ebay_high)}</div>
        <div class="source-tag">Source: ${w(d)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(x=>`
              <div class="sample-item">
                <span>${w(x.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(x.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,u!==null){let x=e.price?Math.round(u/e.price*100):null,gt=e.price?Math.round(g/e.price*100):null;h+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${q}">
            ${u>=0?"+":""}$${u} to ${g>=0?"+":""}$${g}
          </div>
          ${x!==null?`<div class="source-tag">ROI: ${x}% \u2013 ${gt}%</div>`:""}
        </div>
      `}}else if(l&&!m)h+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range" style="font-size: 14px; color: #09090B80;">No eBay data found</div>
        <div class="source-tag">Try searching eBay manually below</div>
      </div>
    `;else if(!a||c){let p=e.price?Math.round(e.price*.7):null,d=e.price?Math.round(e.price*1.5):null;p&&d&&(h+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${v(p)} - ${v(d)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}h+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${w(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${w(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${w(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${ke?`<a href="${le(ke)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(h+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),h+=`
    <div class="footer">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,h+="</div>",i.innerHTML=h,i.getElementById("close-overlay").addEventListener("click",()=>{s.remove()});let _e=i.getElementById("login-btn");_e&&_e.addEventListener("click",()=>{ot()});let we=i.getElementById("upgrade-btn");we&&we.addEventListener("click",()=>{nt()}),i.getElementById("save-deal").addEventListener("click",async()=>{let p=i.getElementById("save-deal"),d=i.getElementById("saved-msg");p.disabled=!0,p.textContent="Saving...";let x=await Ze(e,t);p.disabled=!1,p.textContent="Save Deal",x.success&&!x.local?(d.textContent="Deal saved!",d.className="saved-msg success"):x.success&&x.local?(d.textContent="Saved locally (sign in to sync)",d.className="saved-msg local"):(d.textContent=x.error||"Failed to save",d.className="saved-msg error"),d.style.display="block",setTimeout(()=>{d.style.display="none"},3e3)}),document.body.appendChild(s)}function it(e){let t=document.getElementById(T);t&&t.remove();let r=document.createElement("div");r.id=T;let o=r.attachShadow({mode:"open"});return o.innerHTML=`
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
  `,document.body.appendChild(r),r}function fe(e){console.log("[FlipChecker] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(T);t&&(console.log("[FlipChecker] Removing old overlay"),t.remove());let r=document.getElementById(D);r&&(console.log("[FlipChecker] Removing old button"),r.remove());let o=document.createElement("button");o.id=D,o.innerHTML="\u{1F4B0} CHECK FLIP",o.style.cssText=`
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
  `,o.addEventListener("mouseenter",()=>{o.style.transform="translate(1px, 1px)",o.style.boxShadow="2px 2px 0px #09090B"}),o.addEventListener("mouseleave",()=>{o.style.transform="translate(0, 0)",o.style.boxShadow="3px 3px 0px #09090B"}),o.addEventListener("click",()=>{o.remove(),e()}),document.body.appendChild(o),console.log("[FlipChecker] Button added to page")}var U=null,st=0,Ut=5*60*1e3;async function zt(){let e=Date.now();if(U&&e-st<Ut)return U;let t=k();return t?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/alerts`,method:"GET",headers:{Authorization:`Bearer ${t}`}},o=>{if(chrome.runtime.lastError||!o?.ok){console.warn("[FlipChecker] Failed to fetch alerts"),r(U||[]);return}U=o.data?.alerts||[],st=e,r(U)})}):[]}function qt(e,t){if(!e||!t)return!1;let r=e.toLowerCase(),o=t.toLowerCase();if(r.includes(o))return!0;let n=o.split(/\s+/).filter(l=>l.length>2),s=r.split(/\s+/).filter(l=>l.length>2);return n.length===0?!1:n.filter(l=>s.some(a=>a.includes(l)||l.includes(a))).length/n.length>=.6}function Ht(e,t){let r=k();r&&chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/alerts/match`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:{alert_id:e.id,listing_title:t.title,listing_price:t.price,source_url:window.location.href}},o=>{chrome.runtime.lastError&&console.warn("[FlipChecker] Failed to save alert match")})}async function lt(e){if(!e?.title)return[];let t=await zt();if(!t.length)return[];let r=[];for(let o of t){let n=qt(e.title,o.search_query),s=!o.max_price||e.price&&e.price<=o.max_price;n&&s&&(r.push(o),Ht(o,e))}return r.length>0&&console.log("[FlipChecker] Alert matches found:",r.length),r}function me(e){if(!e)return!1;try{let r=new URL(e).pathname;return!(!r.startsWith("/marketplace")||r.includes("/marketplace/item/")||r.includes("/marketplace/profile/")||r.includes("/marketplace/you/")||r.includes("/marketplace/create"))}catch{return!1}}function at(){let e=[],t=new Set,r=document.querySelectorAll('a[href*="/marketplace/item/"]');for(let o of r){let n=o.href.match(/\/marketplace\/item\/(\d+)/);if(!n)continue;let s=n[1];if(t.has(s))continue;t.add(s);let i=Gt(o);if(!i)continue;let l=Wt(i);if(!l)continue;let a=Vt(i);if(a===null)continue;let c=o.href.split("?")[0];e.push({id:s,title:l,price:a,url:c,cardElement:i})}return e}function Gt(e){let t=e;for(let r=0;r<6&&t.parentElement;r++){t=t.parentElement;let o=t.querySelector("img"),n=t.textContent||"",s=/\$[\d,]+/.test(n);if(o&&s&&n.length>20)return t}return e.closest("div[class]")||e.parentElement}function Wt(e){let t=e.querySelectorAll('span[dir="auto"]');for(let r of t){let o=r.textContent?.trim();if(o&&!/^\$[\d,]+/.test(o)&&!(o.length<10)&&!/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(o))return o}return null}function Vt(e){let t=e.querySelectorAll("span");for(let r of t){let o=r.textContent?.trim();if(o&&/^\$[\d,]+(\.\d{2})?$/.test(o)){let n=b(o);if(n!==null&&n>0)return n}}return null}var $=!1,z=new Map,Y=new Map,F=null,S=!1,C=null,R=null;function he(){if(S=!1,!E()){console.log("[FlipChecker] Watchlist: not logged in, skipping");return}chrome.storage.local.get(["watchlistFilters"],e=>{let t=e.watchlistFilters;if(!t||t.length===0){console.log("[FlipChecker] Watchlist: no filters configured, skipping");return}let r=t.filter(o=>o.is_active!==!1);if(r.length===0){console.log("[FlipChecker] Watchlist: no active filters, skipping");return}console.log("[FlipChecker] Watchlist: initializing scanner with",r.length,"active filters"),setTimeout(()=>{S||ct(r)},1e3),Kt(r)})}function Kt(e){F&&F.disconnect();let t=document.querySelector('div[role="main"]')||document.body;F=new MutationObserver(()=>{S||(R&&clearTimeout(R),R=setTimeout(()=>{!S&&!$&&(Qt(),ct(e))},500))}),F.observe(t,{childList:!0,subtree:!0})}async function ct(e){if(!($||S||!E()||!e.length)){$=!0,tr();try{let t=at(),r=Date.now();for(let[i,l]of z)r-l>36e5&&z.delete(i);let o=t.filter(i=>!z.has(i.id));if(o.length===0){console.log("[FlipChecker] Watchlist: no new listings to scan"),ge(),$=!1;return}let n=[];for(let i of o){for(let l of e)if(Yt(i,l)){n.push({listing:i,filter:l});break}z.set(i.id,r)}console.log("[FlipChecker] Watchlist:",o.length,"new listings,",n.length,"matches");let s=n.slice(0,10);for(let{listing:i,filter:l}of s){if(S)break;let a=await J(i.title);if(S)break;if(a?.error){if(a.error==="limit_reached"||a.error==="auth_required"){console.log("[FlipChecker] Watchlist: stopping scan -",a.error);break}if(a.error==="network_error"){console.log("[FlipChecker] Watchlist: network error, stopping");break}continue}let c=a?.prices?.avg||a?.avg;if(!c)continue;let m=Math.round(c*.84-i.price);m>=l.min_profit&&(pt(i.cardElement,i.id,m),Zt(i,l,a,m)),S||await new Promise(u=>setTimeout(u,500))}}catch(t){console.error("[FlipChecker] Watchlist scan error:",t)}finally{ge(),$=!1}}}function Yt(e,t){if(!e.price||e.price<=0||e.price>t.max_buy_price)return!1;let r=e.title.toLowerCase();return t.keywords.toLowerCase().split(/\s+/).filter(n=>n.length>0).every(n=>r.includes(n))}function pt(e,t,r){if(!e||e.querySelector("[data-flipchecker-badge]"))return;let n=e.querySelector("img")?.closest("div")||e;window.getComputedStyle(n).position==="static"&&(n.style.position="relative");let i=document.createElement("div");i.setAttribute("data-flipchecker-badge",t),i.style.cssText=`
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
  `,a.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),i.remove(),Y.delete(t)}),i.appendChild(l),i.appendChild(a),n.appendChild(i),Y.set(t,{profit:r})}function Qt(){for(let[e,t]of Y){if(document.querySelector(`[data-flipchecker-badge="${e}"]`))continue;let r=document.querySelector(`a[href*="/marketplace/item/${e}"]`);if(!r)continue;let o=r.closest("div[class]")||r.parentElement;o&&pt(o,e,t.profit)}}function Zt(e,t,r,o){let n=r?.prices?.avg||r?.avg||null,s={id:`alert_${e.id}_${Date.now()}`,filterId:t.id,title:e.title,price:e.price,ebayAvg:n,profit:o,url:e.url,listingId:e.id,foundAt:new Date().toISOString()};chrome.storage.local.get(["watchlistAlerts"],i=>{let l=i.watchlistAlerts||[];l.some(a=>a.listingId===e.id)||(l.unshift(s),l.length>50&&(l=l.slice(0,50)),chrome.storage.local.set({watchlistAlerts:l}))});try{chrome.runtime.sendMessage({type:"apiRequest",url:`${er()}/api/watchlist/alerts`,method:"POST",headers:{"Content-Type":"application/json"},body:{filter_id:t.id,listing_title:e.title,listing_price:e.price,ebay_avg_price:n,estimated_profit:o,listing_url:e.url,fb_listing_id:e.id}})}catch{}}function er(){return f}function tr(){if(C)return;C=document.createElement("div"),C.id="flipchecker-scan-indicator",C.style.cssText=`
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
  `,!document.getElementById("flipchecker-scan-styles")){let r=document.createElement("style");r.id="flipchecker-scan-styles",r.textContent="@keyframes flipchecker-spin { to { transform: rotate(360deg); } }",document.head.appendChild(r)}let t=document.createElement("span");t.textContent="Scanning watchlist...",C.appendChild(e),C.appendChild(t),document.body.appendChild(C)}function ge(){C&&(C.remove(),C=null)}function Q(){S=!0,F&&(F.disconnect(),F=null),R&&(clearTimeout(R),R=null),ge(),document.querySelectorAll("[data-flipchecker-badge]").forEach(e=>e.remove()),$=!1,z.clear(),Y.clear()}async function or(e,t){let r=null,o="none";if(!_(e))return console.log("[FlipChecker] Job cancelled before extraction, aborting"),null;let n=Me(t);if(n&&(console.log("[FlipChecker] Using intercepted GraphQL data"),r=n,o="graphql"),!r&&E()){console.log("[FlipChecker] Attempting vision extraction...");let s=await Ke();if(!_(e))return console.log("[FlipChecker] Job cancelled during vision extraction"),null;s&&(s.title||s.price)?(r=Ye(s,t),o="vision",console.log("[FlipChecker] Vision extraction successful:",r.title)):console.log("[FlipChecker] Vision extraction returned no usable data")}if(!r&&E()){console.log("[FlipChecker] Attempting AI extraction...");let s=await je();if(!_(e))return console.log("[FlipChecker] Job cancelled during AI extraction"),null;s&&(s.title||s.price)?(r=Je(s,t),o="ai",console.log("[FlipChecker] AI extraction successful:",r.title)):console.log("[FlipChecker] AI extraction returned no usable data")}if(!r||!r.title&&!r.price){console.log("[FlipChecker] Using DOM extraction (fallback)...");let s=B()?.title||null;if(await We(s,t,void 0,e),!_(e))return console.log("[FlipChecker] Job cancelled during DOM wait"),null;r=Xe(t),o="dom",console.log("[FlipChecker] DOM extraction result:",r.title)}return console.log("[FlipChecker] Extraction complete (method:",o+"):",r?.title),{data:r,method:o}}async function Z(){let e=Se(),t=window.location.href,r=X();if(console.log("[FlipChecker] initOverlay started, job:",e,"item:",r),it({title:"Loading...",itemId:r}),await new Promise(a=>setTimeout(a,1e3)),!_(e)||window.location.href!==t){console.log("[FlipChecker] Navigation during init wait, aborting job:",e),M(e);return}await K();let o=await or(e,r);if(!o||!_(e)){console.log("[FlipChecker] Extraction failed or job cancelled"),M(e);return}let{data:n,method:s}=o;if(Ee(n),console.log("[FlipChecker] Final data (method: "+s+"):",n),!n.title&&!n.price){console.log("[FlipChecker] Could not extract listing data"),await ue({title:null,price:null,itemId:r},null),M(e);return}let i=null;if(E()&&n.title&&(i=await J(n.title),!_(e))){console.log("[FlipChecker] Job cancelled during price lookup"),M(e);return}let l=[];E()&&n.title&&(l=await lt(n)),await ue(n,i,l),M(e)}function nr(e,t){console.log("[FlipChecker] Handling marketplace navigation:",e),fe(()=>{Z()})}var dt=!1,xe=null,ye=null;async function ut(){if(dt){console.log("[FlipChecker] Already initialized, skipping");return}dt=!0,console.log("[FlipChecker] Content script loaded on:",window.location.href),console.log("[FlipChecker] Is marketplace item page:",O()),Pe(),await K(),chrome.runtime.onMessage.addListener((e,t,r)=>{if(e.type==="getListingImage"){let o=I();r({imageUrl:o})}return!1}),Ae(),Fe((e,t)=>{re(e)?(Q(),nr(e,t)):me(e)?(Q(),he()):Q()}),xe&&xe(),ye&&ye(),xe=tt(()=>{console.log("[FlipChecker] Auth success, checking if should refresh overlay"),O()&&Z()}),ye=rt(e=>{console.log("[FlipChecker] Received sold data, checking if should refresh overlay"),document.getElementById("flipchecker-overlay")&&O()&&Z()}),O()?(console.log("[FlipChecker] Initial page is marketplace item, showing trigger button"),fe(()=>{Z()})):me(window.location.href)&&(console.log("[FlipChecker] Initial page is marketplace search, initializing watchlist scanner"),he())}document.readyState==="loading"?(console.log("[FlipChecker] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",ut)):(console.log("[FlipChecker] Document ready, initializing..."),ut());})();
