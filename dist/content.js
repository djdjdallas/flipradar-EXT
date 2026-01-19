(()=>{var b="flipradar-overlay",S="flipradar-trigger",T="https://flipradar-iaxg.vercel.app";var f={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function U(e){f={...f,...e}}function _(){return f.authToken}function re(){return f.currentUser}function ne(e){f.lastExtractedData=e}function w(){return f.lastExtractedData}function ie(){f.lastExtractedData=null}function ae(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return f.currentJobId=e,f.isExtracting=!0,console.log("[FlipRadar] Started job:",e),e}function v(e){return f.currentJobId===e}function R(e){f.currentJobId===e&&(f.isExtracting=!1,console.log("[FlipRadar] Ended job:",e))}var B=typeof window<"u"?window.location.href:"",z=null,se=[];function le(e){se.push(e)}function ze(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function q(e=window.location.href){return e.includes("/marketplace/item/")}function Be(){let e=document.getElementById(S),t=document.getElementById(b);e&&e.remove(),t&&t.remove()}function qe(e,t){se.forEach(o=>{try{o(e,t)}catch(r){console.error("[FlipRadar] Navigation callback error:",r)}})}function P(){let e=window.location.href;if(console.log("[FlipRadar] Navigation detected:",e),q(e)){let t=ze(e),r=w()?.itemId;t!==r&&(console.log("[FlipRadar] New item detected, clearing cache. Previous:",r,"New:",t),ie()),qe(e,t)}else Be()}function He(){let e=history.pushState,t=history.replaceState;history.pushState=function(...o){e.apply(this,o),P()},history.replaceState=function(...o){t.apply(this,o),P()},window.addEventListener("popstate",P),console.log("[FlipRadar] History API listeners installed")}function Ge(){let e=new MutationObserver(()=>{z&&clearTimeout(z),z=setTimeout(()=>{window.location.href!==B&&(B=window.location.href,P())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),console.log("[FlipRadar] MutationObserver backup installed"),e}function ce(){B=window.location.href,He(),Ge()}var de=new Map,Xe=[];function pe(e){return de.get(e)||null}function je(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let o=t.data.marketplace_product_details_page;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,currency:o.listing_price?.currency,location:o.location?.reverse_geocode?.city||o.location_text?.text,seller:o.marketplace_listing_seller?.name,description:o.redacted_description?.text,images:o.listing_photos?.map(r=>r.image?.uri).filter(Boolean),condition:o.condition,category:o.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let o=t.data.node;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,location:o.location_text?.text,seller:o.story?.comet_sections?.seller?.seller?.name,source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let o=t.data.marketplace_pdp.product;return{itemId:o.id,title:o.title||o.name,price:o.price?.amount,priceFormatted:o.price?.formatted,location:o.location,seller:o.seller?.name,source:"graphql"}}return null}catch{return null}}function Je(e,t){console.log("[FlipRadar] Intercepted GraphQL data for item:",e),de.set(e,t),Xe.forEach(o=>{try{o(e,t)}catch(r){console.error("[FlipRadar] Data callback error:",r)}})}function ue(){let e=document.createElement("script");e.textContent=`
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
            }).catch(() => {});
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
            // Silently fail
          }
        });
        return originalXHRSend.apply(this, args);
      };

      console.log('[FlipRadar] Network interceptor installed in page context');
    })();
  `,(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",t=>{if(t.source===window&&t.data?.type==="FLIPRADAR_GRAPHQL_RESPONSE"){let o=je(t.data.data);o&&o.itemId&&Je(o.itemId,o)}}),console.log("[FlipRadar] Network interception listener installed")}var fe={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var me={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},ge={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},xe={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]'],tier3:[]};function L(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var H=/^\$[\d,]+(\.\d{2})?$/,he=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],be=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var Ve=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],Qe=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function k(e){if(!e)return!0;let t=e.toLowerCase().trim();if(Ve.includes(t))return!0;for(let o of Qe)if(o.test(e))return!0;return e.length<5}function ye(e,t){if(!e||!t)return!1;let o=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&o.test(t)}function j(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function D(){return document.querySelector('div[role="main"]')}function _e(e=1e4){let t=D();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function h(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function ve(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function I(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),o=parseFloat(t);return isNaN(o)?null:o}function x(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function F(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function J(e,t,o,r=.84){return{low:Math.round(t*r-e),high:Math.round(o*r-e)}}function W(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function V(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function $(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function A(){return window.location.href.includes("/marketplace/item/")}function we(e,t,o=5e3){return new Promise(r=>{let n=Date.now(),i=w();if(i?.itemId===t&&i?.title){console.log("[FlipRadar] Same item, using cached title:",i.title),r(!0);return}let a=()=>{let s=Re(),p=Date.now()-n,c=k(s);if(s&&!c&&s!==e&&p>=500){console.log("[FlipRadar] Content changed, new title:",s),r(!0);return}if(!e&&s&&!c&&p>=500){console.log("[FlipRadar] First load, found title:",s),r(!0);return}if(p>o){console.log("[FlipRadar] Timeout waiting for content change, current title:",s),r(!1);return}setTimeout(a,200)};a()})}function Re(){let e=L(fe);for(let r of e)try{let n=document.querySelectorAll(r);for(let i of n){let a=i.textContent.trim();if(a.length>15&&a.length<300&&!a.startsWith("$")&&!/^\d+$/.test(a)&&!k(a))return console.log("[FlipRadar] Found title via selector:",a),a}}catch{}let t=D();if(t){let r=t.querySelectorAll('span[dir="auto"]'),n=[];for(let i of r){let a=i.textContent.trim();if(a.length>15&&a.length<200&&!a.startsWith("$")&&!k(a)&&!/^\d+$/.test(a)){let s=j(i);n.push({text:a,fontSize:s,element:i})}}if(n.sort((i,a)=>a.fontSize-i.fontSize),n.length>0)return console.log("[FlipRadar] Found title by prominence:",n[0].text),n[0].text}let o=document.querySelectorAll('h1, h2, [role="heading"]');for(let r of o){let n=r.textContent.trim();if(n.length>10&&n.length<300&&!k(n)&&!n.startsWith("$"))return console.log("[FlipRadar] Found title in heading:",n),n}return console.log("[FlipRadar] Could not extract title"),null}function tt(){let e=document.querySelector("h1");if(e){let n=e.closest("div");if(n){let i=n.parentElement?.querySelectorAll("span")||[];for(let a of i){let s=a.textContent.trim();if(H.test(s)){let p=I(s);return console.log("[FlipRadar] Found price near title:",p),p}}}}let t=document.querySelectorAll("span"),o=[];for(let n of t){let i=n.textContent.trim();if(H.test(i)){let a=j(n),s=I(i);o.push({element:n,price:s,fontSize:a})}}if(o.sort((n,i)=>i.fontSize-n.fontSize),o.length>0){let n=o.find(i=>i.price>=5&&i.fontSize>=14);return n?(console.log("[FlipRadar] Found prominent price:",n.price,"fontSize:",n.fontSize),n.price):(console.log("[FlipRadar] Using largest price:",o[0].price),o[0].price)}let r=D();if(r){let i=r.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i){let a=I(i[0]);return console.log("[FlipRadar] Found price in main content:",a),a}}return console.log("[FlipRadar] Could not extract price"),null}function ot(){let e=L(me);for(let t of e)try{let o=document.querySelectorAll(t);for(let r of o){let n=r.textContent.trim();for(let i of he){let a=n.match(i);if(a)return a[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function rt(){let e=L(ge);for(let t of e)try{let o=document.querySelector(t);if(o&&o.textContent.trim()&&o.textContent.trim().length<50)return o.textContent.trim()}catch{}return null}function nt(){let e=document.querySelectorAll("span");for(let t of e){let o=t.textContent.trim();for(let r of be)if(r.test(o))return o}return null}function Q(){let e=L(xe);for(let t of e)try{let o=document.querySelector(t);if(o&&o.src)return o.src}catch{}return null}function Ie(e){return{title:Re(),price:tt(),location:ot(),seller:rt(),daysListed:nt(),imageUrl:Q(),itemId:e,source:"dom"}}async function Se(){let e=_();return e?new Promise(t=>{let o=_e(1e4);console.log("[FlipRadar] Sending page text to AI extraction ("+o.length+" chars)"),chrome.runtime.sendMessage({type:"apiRequest",url:`${T}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:o,url:window.location.href}},r=>{if(chrome.runtime.lastError){console.log("[FlipRadar] AI extraction message error:",chrome.runtime.lastError),t(null);return}if(!r){console.log("[FlipRadar] AI extraction - no response"),t(null);return}if(!r.ok){console.log("[FlipRadar] AI extraction failed:",r.status,r.error||r.data?.error),t(null);return}console.log("[FlipRadar] AI extraction successful:",r.data),t(r.data)})}):(console.log("[FlipRadar] AI extraction skipped - not logged in"),null)}function Te(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:I(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:Q(),itemId:t,source:"ai"}}async function ke(e){let t=_();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${T}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{title:e}},r=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Price lookup message error:",chrome.runtime.lastError),o({error:"network_error"});return}if(!r){o({error:"network_error"});return}if(r.status===401){o({error:"auth_required"});return}if(r.status===429){o({error:"limit_reached",message:r.data?.error});return}if(!r.ok){o({error:"api_error"});return}o(r.data)})}):{error:"auth_required"}}async function Fe(e,t){let o=_();return o?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${T}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:{source_url:window.location.href,user_title:e.title,user_asking_price:e.price,ebay_estimate_low:t?.ebay_low,ebay_estimate_high:t?.ebay_high,ebay_search_url:t?.ebay_url||F(e.title)}},n=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Save deal message error:",chrome.runtime.lastError),N(e),r({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){N(e),r({success:!0,local:!0});return}if(n?.status===429){r({success:!1,error:"Deal limit reached. Upgrade to save more."});return}console.error("[FlipRadar] API save failed:",n?.error||n?.status),N(e),r({success:!0,local:!0});return}console.log("[FlipRadar] Deal saved to cloud successfully"),r({success:!0})})}):(N(e),{success:!0,local:!0})}function N(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,ebayUrl:F(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],o=>{let r=o.savedDeals||[];r.unshift(t),r.length>100&&r.pop(),chrome.storage.local.set({savedDeals:r}),console.log("[FlipRadar] Deal saved locally")})}async function Ae(e){return new Promise(t=>{if(!e){t(null);return}let r=`flipradar_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([r,"flipradar_last_sold"],n=>{if(n[r]&&V(n[r].timestamp,864e5)){console.log("[FlipRadar] Found exact match for sold data"),t(n[r]);return}if(n.flipradar_last_sold&&V(n.flipradar_last_sold.timestamp,864e5)){let i=n.flipradar_last_sold.query.toLowerCase(),a=e.toLowerCase(),s=i.split(/\s+/).filter(g=>g.length>3),p=a.split(/\s+/).filter(g=>g.length>3),c=s.filter(g=>p.some(M=>M.includes(g)||g.includes(M))),m=p.length>0?c.length/p.length:0;if(console.log("[FlipRadar] Fuzzy match check - overlap:",c.length,"ratio:",m),m>=.5&&c.length>=2){console.log("[FlipRadar] Using fuzzy matched sold data"),t(n.flipradar_last_sold);return}}t(null)})})}async function Y(){return new Promise(e=>{chrome.runtime.sendMessage({type:"getAuthToken"},t=>{if(chrome.runtime.lastError){console.error("[FlipRadar] Error loading auth state:",chrome.runtime.lastError),e();return}t&&(U({authToken:t.token,currentUser:t.user}),console.log("[FlipRadar] Auth state loaded:",t.user?.email||"no user")),e()})})}function Ce(e){let t=o=>{o.type==="authSuccess"&&(console.log("[FlipRadar] Auth success received"),U({authToken:null,currentUser:o.user}),Y().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function Me(e){let t=o=>{o.type==="soldDataAvailable"&&(console.log("[FlipRadar] Received sold data from eBay:",o.data),e(o.data))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function C(){return!!_()}function Pe(){chrome.runtime.sendMessage({type:"openLogin"})}function De(){chrome.runtime.sendMessage({type:"openUpgrade"})}function at(){return`
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
  `}function st(){let e=re();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function Z(e,t=null){let o=$();if(e.itemId&&e.itemId!==o){console.log("[FlipRadar] Data item ID mismatch, aborting overlay. Expected:",e.itemId,"Current:",o);return}let r=document.getElementById(b);r&&r.remove();let n=document.createElement("div");n.id=b;let i=n.attachShadow({mode:"open"}),a=t&&!t.error,s=C(),p=t?.error==="limit_reached",c=null,m=null,g="profit-positive";if(a&&e.price){let l=J(e.price,t.ebay_low,t.ebay_high);c=l.low,m=l.high,g=W(c,m)}let M=ye(e.price,e.title),ee=t?.ebay_url||F(e.title),Oe=st(),u=`
    ${at()}
    <div class="container">
      <div class="header">
        <span class="logo">FlipRadar ${Oe}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        <div class="current-price">${x(e.price)}</div>
        <div class="title" title="${h(e.title||"")}">${h(e.title)||"Unknown Item"}</div>
      </div>

      ${M?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;s||(u+=`
      <div class="login-prompt">
        <div>Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),p&&(u+=`
      <div class="upgrade-prompt">
        <div>Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let y=await Ae(e.title);if(y&&y.stats&&y.stats.count>0){let l=y.stats;if(e.price){let d=J(e.price,l.low,l.high);c=d.low,m=d.high,g=W(c,m)}u+=`
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
        ${y.samples&&y.samples.length>0?`
          <div class="samples">
            ${y.samples.slice(0,3).map(d=>`
              <div class="sample-item">
                <span>${h(d.title.substring(0,25))}...</span>
                <span class="sample-price">$${d.price}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,c!==null&&(u+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${g}">
            ${c>=0?"+":""}$${c} to ${m>=0?"+":""}$${m}
          </div>
        </div>
      `)}else if(a){let d={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;u+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${x(t.ebay_low)} - ${x(t.ebay_high)}</div>
        <div class="source-tag">Source: ${h(d)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(E=>`
              <div class="sample-item">
                <span>${h(E.title.substring(0,30))}...</span>
                <span class="sample-price">$${E.price}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,c!==null&&(u+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${g}">
            ${c>=0?"+":""}$${c} to ${m>=0?"+":""}$${m}
          </div>
        </div>
      `)}else if(!s||p){let l=e.price?Math.round(e.price*.7):null,d=e.price?Math.round(e.price*1.5):null;l&&d&&(u+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${x(l)} - ${x(d)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}u+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${h(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${h(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${h(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${ee?`<a href="${ve(ee)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(u+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),u+=`
    <div class="footer" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #2d2d44; font-size: 10px; color: #666; text-align: center;">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,u+="</div>",i.innerHTML=u,i.getElementById("close-overlay").addEventListener("click",()=>{n.remove()});let te=i.getElementById("login-btn");te&&te.addEventListener("click",()=>{Pe()});let oe=i.getElementById("upgrade-btn");oe&&oe.addEventListener("click",()=>{De()}),i.getElementById("save-deal").addEventListener("click",async()=>{let l=i.getElementById("save-deal"),d=i.getElementById("saved-msg");l.disabled=!0,l.textContent="Saving...";let E=await Fe(e,t);l.disabled=!1,l.textContent="Save Deal",E.success?(d.textContent=E.local?"Saved locally!":"Deal saved!",d.className="saved-msg success"):(d.textContent=E.error||"Failed to save",d.className="saved-msg error"),d.style.display="block",setTimeout(()=>{d.style.display="none"},3e3)}),document.body.appendChild(n)}function $e(e){let t=document.getElementById(b);t&&t.remove();let o=document.createElement("div");o.id=b;let r=o.attachShadow({mode:"open"});return r.innerHTML=`
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
  `,document.body.appendChild(o),o}function K(e){console.log("[FlipRadar] showTriggerButton called for URL:",window.location.href);let t=document.getElementById(b);t&&(console.log("[FlipRadar] Removing old overlay"),t.remove());let o=document.getElementById(S);o&&(console.log("[FlipRadar] Removing old button"),o.remove());let r=document.createElement("button");r.id=S,r.innerHTML="\u{1F4B0} Check Flip",r.style.cssText=`
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
  `,r.addEventListener("click",()=>{r.remove(),e()}),document.body.appendChild(r),console.log("[FlipRadar] Button added to page")}async function ct(e,t){let o=null,r="none";if(!v(e))return console.log("[FlipRadar] Job cancelled before extraction, aborting"),null;let n=pe(t);if(n&&(console.log("[FlipRadar] Using intercepted GraphQL data"),o=n,r="graphql"),!o&&C()){console.log("[FlipRadar] Attempting AI extraction...");let i=await Se();if(!v(e))return console.log("[FlipRadar] Job cancelled during AI extraction"),null;i&&(i.title||i.price)?(o=Te(i,t),r="ai",console.log("[FlipRadar] AI extraction successful:",o.title)):console.log("[FlipRadar] AI extraction returned no usable data")}if(!o||!o.title&&!o.price){console.log("[FlipRadar] Using DOM extraction (fallback)...");let i=w()?.title||null;if(await we(i,t),!v(e))return console.log("[FlipRadar] Job cancelled during DOM wait"),null;o=Ie(t),r="dom",console.log("[FlipRadar] DOM extraction result:",o.title)}return console.log("[FlipRadar] Extraction complete (method:",r+"):",o?.title),{data:o,method:r}}async function O(){let e=ae(),t=window.location.href,o=$();if(console.log("[FlipRadar] initOverlay started, job:",e,"item:",o),$e({title:"Loading...",itemId:o}),await new Promise(s=>setTimeout(s,1e3)),!v(e)||window.location.href!==t){console.log("[FlipRadar] Navigation during init wait, aborting job:",e),R(e);return}await Y();let r=await ct(e,o);if(!r||!v(e)){console.log("[FlipRadar] Extraction failed or job cancelled"),R(e);return}let{data:n,method:i}=r;if(ne(n),console.log("[FlipRadar] Final data (method: "+i+"):",n),!n.title&&!n.price){console.log("[FlipRadar] Could not extract listing data"),await Z({title:null,price:null,itemId:o},null),R(e);return}let a=null;if(C()&&n.title&&(a=await ke(n.title),!v(e))){console.log("[FlipRadar] Job cancelled during price lookup"),R(e);return}await Z(n,a),R(e)}function dt(e,t){console.log("[FlipRadar] Handling marketplace navigation:",e),K(()=>{O()})}function Ne(){console.log("[FlipRadar] Content script loaded on:",window.location.href),console.log("[FlipRadar] Is marketplace item page:",A()),ue(),ce(),le((e,t)=>{q(e)&&dt(e,t)}),Ce(()=>{console.log("[FlipRadar] Auth success, checking if should refresh overlay"),A()&&O()}),Me(e=>{console.log("[FlipRadar] Received sold data, checking if should refresh overlay"),document.getElementById("flipradar-overlay")&&A()&&O()}),A()&&(console.log("[FlipRadar] Initial page is marketplace item, showing trigger button"),K(()=>{O()}))}document.readyState==="loading"?(console.log("[FlipRadar] Waiting for DOMContentLoaded..."),document.addEventListener("DOMContentLoaded",Ne)):(console.log("[FlipRadar] Document ready, initializing..."),Ne());})();
