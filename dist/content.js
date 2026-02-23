(()=>{var S="flipchecker-overlay",R="flipchecker-trigger",m="https://www.flipchecker.io";var x={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function B(e){x={...x,...e}}function y(){return x.authToken}function Ee(){return x.currentUser}function te(e){x.lastExtractedData=e}function M(){return x.lastExtractedData}function Te(){x.lastExtractedData=null}function Se(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return x.currentJobId=e,x.isExtracting=!0,e}function _(e){return x.currentJobId===e}function $(e){x.currentJobId===e&&(x.isExtracting=!1)}var re=typeof window<"u"?window.location.href:"",oe=null,G=null,Ie=!1,Fe=[];function Ae(e){Fe.push(e)}function kt(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function ne(e=window.location.href){return e.includes("/marketplace/item/")}function bt(){let e=document.getElementById(R),t=document.getElementById(S);e&&e.remove(),t&&t.remove()}function Le(e,t){Fe.forEach(o=>{try{o(e,t)}catch{}})}function W(){let e=window.location.href;if(ne(e)){let t=kt(e),r=M()?.itemId;t!==r&&Te(),Le(e,t)}else bt(),Le(e,null)}function _t(){let e=history.pushState,t=history.replaceState;history.pushState=function(...o){e.apply(this,o),W()},history.replaceState=function(...o){t.apply(this,o),W()},window.addEventListener("popstate",W)}function vt(){G&&(G.disconnect(),G=null);let e=new MutationObserver(()=>{oe&&clearTimeout(oe),oe=setTimeout(()=>{window.location.href!==re&&(re=window.location.href,W())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),G=e,e}function Be(){Ie||(Ie=!0,re=window.location.href,_t(),vt())}var Me=new Map,wt=[];function $e(e){return Me.get(e)||null}function Ct(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let o=t.data.marketplace_product_details_page;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,currency:o.listing_price?.currency,location:o.location?.reverse_geocode?.city||o.location_text?.text,seller:o.marketplace_listing_seller?.name,description:o.redacted_description?.text,images:o.listing_photos?.map(r=>r.image?.uri).filter(Boolean),condition:o.condition,category:o.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let o=t.data.node;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,location:o.location_text?.text,seller:o.story?.comet_sections?.seller?.seller?.name,images:o.listing_photos?.map(r=>r.image?.uri).filter(Boolean),source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let o=t.data.marketplace_pdp.product;return{itemId:o.id,title:o.title||o.name,price:o.price?.amount,priceFormatted:o.price?.formatted,location:o.location,seller:o.seller?.name,images:o.images?.map(r=>r.uri||r.url).filter(Boolean),source:"graphql"}}return null}catch{return null}}function Et(e,t){Me.set(e,t),wt.forEach(o=>{try{o(e,t)}catch{}})}function Pe(){window.addEventListener("message",e=>{if(e.source===window&&e.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let t=Ct(e.data.data);t&&t.itemId&&Et(t.itemId,t)}})}var De={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var Re={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},Ue={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},Ne={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[style*="object-fit"]','div[role="main"] div[aria-label] img[src*="scontent"]','div[role="main"] div[data-pagelet] img[src*="scontent"]'],tier3:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]']};function U(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var ie=/^\$[\d,]+(\.\d{2})?$/,Oe=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],ze=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var St=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],It=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function I(e){if(!e)return!0;let t=e.toLowerCase().trim();if(St.includes(t))return!0;for(let o of It)if(o.test(e))return!0;return e.length<5}function qe(e,t){if(!e||!t)return!1;let o=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&o.test(t)}function H(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function N(){return document.querySelector('div[role="main"]')}function Ge(e=1e4){let t=N();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function v(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function le(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function b(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),o=parseFloat(t);return isNaN(o)?null:o}function w(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function j(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function pe(e,t,o,r=.84){return t==null||o==null||e==null?{low:null,high:null}:{low:Math.round(t*r-e),high:Math.round(o*r-e)}}function de(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function ue(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function V(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function J(){return window.location.href.includes("/marketplace/item/")}function je(e,t,o=5e3,r=null){return new Promise(n=>{let s=Date.now(),i=M();if(i?.itemId===t&&i?.title){n(!0);return}let a=()=>{if(r&&!_(r)){n(!1);return}let l=Ve(),c=Date.now()-s,k=I(l),p=l&&!k&&l!==e&&c>=500,f=!e&&l&&!k&&c>=500;if(p||f){let L=At();if(L&&Bt(l,L)){n(!0);return}}if(c>o){n("timeout");return}setTimeout(a,200)};a()})}function At(){let e=document.querySelectorAll('h1, [role="heading"][aria-level="1"]');for(let o of e){let r=o.textContent.trim();if(r.length>10&&r.length<200&&!r.startsWith("$")&&!/^\d+$/.test(r)&&!I(r))return r}let t=N();if(t){let o=t.querySelectorAll('span[dir="auto"]');for(let r of o){let n=r.textContent.trim(),s=H(r);if(n.length>10&&n.length<200&&s>=20&&!n.startsWith("$")&&!/^\d+$/.test(n)&&!I(n))return n}}return null}function Bt(e,t){if(!e||!t)return!1;let o=e.replace(/^Marketplace\s*[-–]\s*/i,"").trim().toLowerCase(),r=t.replace(/^Marketplace\s*[-–]\s*/i,"").trim().toLowerCase();if(o===r||o.includes(r)||r.includes(o))return!0;let n=Math.min(o.length,r.length,30);return n>=15&&o.substring(0,n)===r.substring(0,n)}function Mt(){let e=document.title||"";if(!e)return null;let t=e.replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i,"").trim();if(!t||t.length<5)return null;let o=t.replace(/\s*[-–]\s*\$[\d,]+.*$/,"").trim();return o&&o.length>=5&&(t=o),I(t)||t.startsWith("$")||/^\d+$/.test(t)?null:t}function $t(){let t=(document.title||"").match(/\$[\d,]+/);if(t){let o=b(t[0]);if(o>=5)return o}return null}function Ve(){let e=Mt();if(e)return e;let t=U(De);for(let n of t)try{let s=document.querySelectorAll(n);for(let i of s){let a=i.textContent.trim();if(a.length>15&&a.length<300&&!a.startsWith("$")&&!/^\d+$/.test(a)&&!I(a))return a}}catch{}let o=N();if(o){let n=o.querySelectorAll('span[dir="auto"]'),s=[];for(let i of n){let a=i.textContent.trim();if(a.length>15&&a.length<200&&!a.startsWith("$")&&!I(a)&&!/^\d+$/.test(a)){let l=H(i);s.push({text:a,fontSize:l,element:i})}}if(s.sort((i,a)=>a.fontSize-i.fontSize),s.length>0)return s[0].text}let r=document.querySelectorAll('h1, h2, [role="heading"]');for(let n of r){let s=n.textContent.trim();if(s.length>10&&s.length<300&&!I(s)&&!s.startsWith("$"))return s}return null}function Pt(){let e=$t();if(e)return e;let t=document.querySelector("h1");if(t){let s=t.closest("div");if(s){let i=s.parentElement?.querySelectorAll("span")||[];for(let a of i){let l=a.textContent.trim();if(ie.test(l))return b(l)}}}let o=document.querySelectorAll("span"),r=[];for(let s of o){let i=s.textContent.trim();if(ie.test(i)){let a=H(s),l=b(i);r.push({element:s,price:l,fontSize:a})}}if(r.sort((s,i)=>i.fontSize-s.fontSize),r.length>0){let s=r.find(i=>i.price>=5&&i.fontSize>=14);return s?s.price:r[0].price}let n=N();if(n){let i=n.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i)return b(i[0])}return null}function Dt(){let e=U(Re);for(let t of e)try{let o=document.querySelectorAll(t);for(let r of o){let n=r.textContent.trim();for(let s of Oe){let i=n.match(s);if(i)return i[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function Rt(){let e=U(Ue);for(let t of e)try{let o=document.querySelector(t);if(o&&o.textContent.trim()&&o.textContent.trim().length<50)return o.textContent.trim()}catch{}return null}function Ut(){let e=document.querySelectorAll("span");for(let t of e){let o=t.textContent.trim();for(let r of ze)if(r.test(o))return o}return null}function O(){let t=U(Ne);for(let o of t)try{let r=document.querySelectorAll(o),n=null,s=0;for(let i of r){if(!i.src)continue;let a=i.naturalWidth||i.width||0,l=i.naturalHeight||i.height||0,c=Math.max(a,l);c>=200&&c>s&&(n=i.src,s=c)}if(n)return n}catch{}return null}function Je(e){return{title:Ve(),price:Pt(),location:Dt(),seller:Rt(),daysListed:Ut(),imageUrl:O(),itemId:e,source:"dom"}}async function Xe(){let e=y();return e?new Promise(t=>{let o=Ge(1e4);chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:o,url:window.location.href}},r=>{if(chrome.runtime.lastError){t(null);return}if(!r){t(null);return}if(!r.ok){t(null);return}t(r.data)})}):null}function Ye(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:null,itemId:t,source:"ai"}}function Nt(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){e(null);return}if(!t||!t.success){e(null);return}e(t.screenshot)})})}async function Ke(){let e=y();if(e||(e=(await new Promise(r=>chrome.storage.local.get(["authToken"],r)))?.authToken||null,e&&B({authToken:e})),!e)return null;let t=await Nt();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},r=>{if(chrome.runtime.lastError){o(null);return}if(!r){o(null);return}if(!r.ok){o(null);return}r.data?.error,o(r.data)})}):null}function Ze(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:null,itemId:t,source:"vision"}}async function Y(e){let t=y();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{query:e}},r=>{if(chrome.runtime.lastError){o({error:"network_error"});return}if(!r){o({error:"network_error"});return}if(r.status===401){o({error:"auth_required"});return}if(r.status===429){o({error:"limit_reached",message:r.data?.error});return}if(!r.ok){o({error:"api_error"});return}let n=r.data;o({source:n.source,ebay_low:n.prices?.low,ebay_high:n.prices?.high,ebay_avg:n.prices?.avg,ebay_median:n.prices?.median,sample_count:n.prices?.sample_count,samples:n.samples,ebay_url:n.ebay_search_url,usage:n.usage})})}):{error:"auth_required"}}async function et(e,t){let o=y();return o?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:{url:window.location.href,title:e.title,price:e.price,itemId:e.itemId,extractionMethod:e.source,location:e.location,sellerName:e.seller,images:e.images||(e.imageUrl?[e.imageUrl]:null),ebay_search_url:t&&!t.error&&t.ebay_url||null,priceData:t&&!t.error?{ebayLow:t.ebay_low,ebayHigh:t.ebay_high,ebayAvg:t.ebay_avg}:null}},n=>{if(chrome.runtime.lastError){X(e),r({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){X(e),r({success:!0,local:!0});return}if(n?.status===429){r({success:!1,error:"Deal limit reached. Upgrade to save more."});return}X(e),r({success:!0,local:!0});return}r({success:!0})})}):(X(e),{success:!0,local:!0})}function X(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,imageUrl:e.imageUrl||e.images&&e.images[0]||null,ebayUrl:j(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],o=>{let r=o.savedDeals||[];r.unshift(t),r.length>100&&r.pop(),chrome.storage.local.set({savedDeals:r},()=>{chrome.runtime.lastError})})}async function tt(e){return new Promise(t=>{if(!e){t(null);return}let r=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([r,"flipchecker_last_sold"],n=>{if(n[r]&&ue(n[r].timestamp,864e5)){t(n[r]);return}if(n.flipchecker_last_sold&&ue(n.flipchecker_last_sold.timestamp,864e5)){let s=n.flipchecker_last_sold.query.toLowerCase(),i=e.toLowerCase(),a=s.split(/\s+/).filter(p=>p.length>3),l=i.split(/\s+/).filter(p=>p.length>3),c=a.filter(p=>l.some(f=>f.includes(p)||p.includes(f)));if((l.length>0?c.length/l.length:0)>=.6&&c.length>=3){t(n.flipchecker_last_sold);return}}t(null)})})}async function zt(){return new Promise(e=>{chrome.storage.local.get(["refreshToken","user"],t=>{if(!t.refreshToken){e(!1);return}chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/auth/refresh`,method:"POST",headers:{"Content-Type":"application/json"},body:{refresh_token:t.refreshToken}},o=>{if(chrome.runtime.lastError||!o?.ok){e(!1);return}let r=o.data;if(r?.access_token){let n={authToken:r.access_token};r.refresh_token&&(n.refreshToken=r.refresh_token),chrome.storage.local.set(n,()=>{B({authToken:r.access_token,currentUser:t.user||null}),e(!0)})}else e(!1)})})})}async function K(){return new Promise(e=>{chrome.storage.local.get(["authToken","refreshToken","user"],async t=>{if(chrome.runtime.lastError){e();return}if(t.authToken){let o=!1;try{let r=JSON.parse(atob(t.authToken.split(".")[1]));o=r.exp&&r.exp*1e3<Date.now()}catch{}o?t.refreshToken?await zt()||chrome.storage.local.remove(["authToken","refreshToken","user"]):chrome.storage.local.remove(["authToken","user"]):B({authToken:t.authToken,currentUser:t.user||null})}e()})})}function ot(e){let t=o=>{o.type==="authSuccess"&&(B({authToken:null,currentUser:o.user}),K().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function rt(e){let t=o=>{o.type==="soldDataAvailable"&&e(o.data)};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function C(){return!!y()}function nt(){chrome.runtime.sendMessage({type:"openLogin"})}function it(){chrome.runtime.sendMessage({type:"openUpgrade"})}function qt(){return`
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
  `}function Gt(){let e=Ee();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function fe(e,t=null,o=[]){let r=V();if(e.itemId&&e.itemId!==r)return;let n=document.getElementById(S);n&&n.remove();let s=document.createElement("div");s.id=S;let i=s.attachShadow({mode:"open"}),a=t&&!t.error,l=C(),c=t?.error==="limit_reached",k=a&&t.ebay_low!=null&&t.ebay_high!=null,p=null,f=null,L="profit-positive";if(k&&e.price){let d=pe(e.price,t.ebay_low,t.ebay_high);p=d.low,f=d.high,L=de(p,f)}let be=qe(e.price,e.title),_e=t?.ebay_url||j(e.title),mt=Gt(),gt=e.images&&e.images[0],ht=O(),ve=gt||e.imageUrl||ht||null,g=`
    ${qt()}
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER ${mt}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        ${ve?`<img class="listing-image" src="${le(ve)}" alt="" />`:""}
        <div class="price-info">
          <div class="current-price">${w(e.price)}</div>
          <div class="title" title="${v(e.title||"")}">${v(e.title)||"Unknown Item"}</div>
        </div>
      </div>

      ${o.length>0?o.map(d=>`<div class="alert-match"><span class="alert-match-icon">\u{1F514}</span> ALERT MATCH: ${v(d.search_query)}${d.max_price?` \u2014 under $${d.max_price}`:""}!</div>`).join(""):""}
      ${be?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;l||(g+=`
      <div class="login-prompt">
        <div style="font-weight: 700;">Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),c&&(g+=`
      <div class="upgrade-prompt">
        <div style="font-weight: 700;">Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let F=await tt(e.title);if(F&&F.stats&&F.stats.count>0){let d=F.stats;if(e.price){let u=pe(e.price,d.low,d.high);p=u.low,f=u.high,L=de(p,f)}if(g+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${w(d.low)} - ${w(d.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${w(d.median)}</span>
          <span>Avg: ${w(d.avg)}</span>
        </div>
        <div class="source-tag">${d.count} sold listings analyzed</div>
        ${F.samples&&F.samples.length>0?`
          <div class="samples">
            ${F.samples.slice(0,3).map(u=>`
              <div class="sample-item">
                <span>${v(u.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(u.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,p!==null){let u=e.price?Math.round(p/e.price*100):null,h=e.price?Math.round(f/e.price*100):null;g+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${L}">
            ${p>=0?"+":""}$${p} to ${f>=0?"+":""}$${f}
          </div>
          ${u!==null?`<div class="source-tag">ROI: ${u}% \u2013 ${h}%</div>`:""}
        </div>
      `}}else if(a&&k){let u={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;if(g+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${w(t.ebay_low)} - ${w(t.ebay_high)}</div>
        <div class="source-tag">Source: ${v(u)}</div>
        ${t.samples&&t.samples.length>0?`
          <div class="samples">
            ${t.samples.slice(0,3).map(h=>`
              <div class="sample-item">
                <span>${v(h.title.substring(0,30))}...</span>
                <span class="sample-price">$${Number(h.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `,p!==null){let h=e.price?Math.round(p/e.price*100):null,xt=e.price?Math.round(f/e.price*100):null;g+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${L}">
            ${p>=0?"+":""}$${p} to ${f>=0?"+":""}$${f}
          </div>
          ${h!==null?`<div class="source-tag">ROI: ${h}% \u2013 ${xt}%</div>`:""}
        </div>
      `}}else if(a&&!k)g+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range" style="font-size: 14px; color: #09090B80;">No eBay data found</div>
        <div class="source-tag">Try searching eBay manually below</div>
      </div>
    `;else if(!l||c){let d=e.price?Math.round(e.price*.7):null,u=e.price?Math.round(e.price*1.5):null;d&&u&&(g+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${w(d)} - ${w(u)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}g+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${v(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${v(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${v(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${_e?`<a href="${le(_e)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `,t?.usage&&(g+=`
      <div class="footer">
        ${t.usage.used}/${t.usage.limit} lookups used today
      </div>
    `),g+=`
    <div class="footer">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `,g+="</div>",i.innerHTML=g,i.getElementById("close-overlay").addEventListener("click",()=>{s.remove()});let we=i.getElementById("login-btn");we&&we.addEventListener("click",()=>{nt()});let Ce=i.getElementById("upgrade-btn");Ce&&Ce.addEventListener("click",()=>{it()}),i.getElementById("save-deal").addEventListener("click",async()=>{let d=i.getElementById("save-deal"),u=i.getElementById("saved-msg");d.disabled=!0,d.textContent="Saving...";let h=await et(e,t);d.disabled=!1,d.textContent="Save Deal",h.success&&!h.local?(u.textContent="Deal saved!",u.className="saved-msg success"):h.success&&h.local?(u.textContent="Saved locally (sign in to sync)",u.className="saved-msg local"):(u.textContent=h.error||"Failed to save",u.className="saved-msg error"),u.style.display="block",setTimeout(()=>{u.style.display="none"},3e3)}),document.body.appendChild(s)}function st(e){let t=document.getElementById(S);t&&t.remove();let o=document.createElement("div");o.id=S;let r=o.attachShadow({mode:"open"});return r.innerHTML=`
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
  `,document.body.appendChild(o),o}function me(e){let t=document.getElementById(S);t&&t.remove();let o=document.getElementById(R);o&&o.remove();let r=document.createElement("button");r.id=R,r.innerHTML="\u{1F4B0} CHECK FLIP",r.style.cssText=`
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
  `,r.addEventListener("mouseenter",()=>{r.style.transform="translate(1px, 1px)",r.style.boxShadow="2px 2px 0px #09090B"}),r.addEventListener("mouseleave",()=>{r.style.transform="translate(0, 0)",r.style.boxShadow="3px 3px 0px #09090B"}),r.addEventListener("click",()=>{r.remove(),e()}),document.body.appendChild(r)}var z=null,at=0,Wt=5*60*1e3;async function Ht(){let e=Date.now();if(z&&e-at<Wt)return z;let t=y();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/alerts`,method:"GET",headers:{Authorization:`Bearer ${t}`}},r=>{if(chrome.runtime.lastError||!r?.ok){o(z||[]);return}z=r.data?.alerts||[],at=e,o(z)})}):[]}function jt(e,t){if(!e||!t)return!1;let o=e.toLowerCase(),r=t.toLowerCase();if(o.includes(r))return!0;let n=r.split(/\s+/).filter(a=>a.length>2),s=o.split(/\s+/).filter(a=>a.length>2);return n.length===0?!1:n.filter(a=>s.some(l=>l.includes(a)||a.includes(l))).length/n.length>=.6}function Vt(e,t){let o=y();o&&chrome.runtime.sendMessage({type:"apiRequest",url:`${m}/api/alerts/match`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:{alert_id:e.id,listing_title:t.title,listing_price:t.price,source_url:window.location.href}},r=>{chrome.runtime.lastError})}async function lt(e){if(!e?.title)return[];let t=await Ht();if(!t.length)return[];let o=[];for(let r of t){let n=jt(e.title,r.search_query),s=!r.max_price||e.price&&e.price<=r.max_price;n&&s&&(o.push(r),Vt(r,e))}return o.length>0,o}function ge(e){if(!e)return!1;try{let o=new URL(e).pathname;return!(!o.startsWith("/marketplace")||o.includes("/marketplace/item/")||o.includes("/marketplace/profile/")||o.includes("/marketplace/you/")||o.includes("/marketplace/create"))}catch{return!1}}function ct(){let e=[],t=new Set,o=document.querySelectorAll('a[href*="/marketplace/item/"]');for(let r of o){let n=r.href.match(/\/marketplace\/item\/(\d+)/);if(!n)continue;let s=n[1];if(t.has(s))continue;t.add(s);let i=Jt(r);if(!i)continue;let a=Xt(i);if(!a)continue;let l=Yt(i);if(l===null)continue;let c=r.href.split("?")[0];e.push({id:s,title:a,price:l,url:c,cardElement:i})}return e}function Jt(e){let t=e;for(let o=0;o<6&&t.parentElement;o++){t=t.parentElement;let r=t.querySelector("img"),n=t.textContent||"",s=/\$[\d,]+/.test(n);if(r&&s&&n.length>20)return t}return e.closest("div[class]")||e.parentElement}function Xt(e){let t=e.querySelectorAll('span[dir="auto"]');for(let o of t){let r=o.textContent?.trim();if(r&&!/^\$[\d,]+/.test(r)&&!(r.length<10)&&!/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(r))return r}return null}function Yt(e){let t=e.querySelectorAll("span");for(let o of t){let r=o.textContent?.trim();if(r&&/^\$[\d,]+(\.\d{2})?$/.test(r)){let n=b(r);if(n!==null&&n>0)return n}}return null}var P=!1,q=new Map,Z=new Map,A=null,T=!1,E=null,D=null;function xe(){T=!1,C()&&chrome.storage.local.get(["watchlistFilters"],e=>{let t=e.watchlistFilters;if(!t||t.length===0)return;let o=t.filter(r=>r.is_active!==!1);o.length!==0&&(setTimeout(()=>{T||pt(o)},1e3),eo(o))})}function eo(e){A&&A.disconnect();let t=document.querySelector('div[role="main"]')||document.body;A=new MutationObserver(()=>{T||(D&&clearTimeout(D),D=setTimeout(()=>{!T&&!P&&(oo(),pt(e))},500))}),A.observe(t,{childList:!0,subtree:!0})}async function pt(e){if(!(P||T||!C()||!e.length)){P=!0,io();try{let t=ct(),o=Date.now();for(let[i,a]of q)o-a>36e5&&q.delete(i);let r=t.filter(i=>!q.has(i.id));if(r.length===0){he(),P=!1;return}let n=[];for(let i of r){for(let a of e)if(to(i,a)){n.push({listing:i,filter:a});break}q.set(i.id,o)}let s=n.slice(0,10);for(let{listing:i,filter:a}of s){if(T)break;let l=await Y(i.title);if(T)break;if(l?.error){if(l.error==="limit_reached"||l.error==="auth_required"||l.error==="network_error")break;continue}let c=l?.prices?.avg||l?.avg;if(!c)continue;let k=Math.round(c*.84-i.price);k>=a.min_profit&&(dt(i.cardElement,i.id,k),ro(i,a,l,k)),T||await new Promise(p=>setTimeout(p,500))}}catch{}finally{he(),P=!1}}}function to(e,t){if(!e.price||e.price<=0||e.price>t.max_buy_price)return!1;let o=e.title.toLowerCase();return t.keywords.toLowerCase().split(/\s+/).filter(n=>n.length>0).every(n=>o.includes(n))}function dt(e,t,o){if(!e||e.querySelector("[data-flipchecker-badge]"))return;let n=e.querySelector("img")?.closest("div")||e;window.getComputedStyle(n).position==="static"&&(n.style.position="relative");let i=document.createElement("div");i.setAttribute("data-flipchecker-badge",t),i.style.cssText=`
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
  `;let a=document.createElement("span");a.textContent=`\u{1F525} +$${o} profit`;let l=document.createElement("span");l.textContent="\xD7",l.style.cssText=`
    cursor: pointer;
    margin-left: 4px;
    font-size: 14px;
    opacity: 0.7;
  `,l.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),i.remove(),Z.delete(t)}),i.appendChild(a),i.appendChild(l),n.appendChild(i),Z.set(t,{profit:o})}function oo(){for(let[e,t]of Z){if(document.querySelector(`[data-flipchecker-badge="${e}"]`))continue;let o=document.querySelector(`a[href*="/marketplace/item/${e}"]`);if(!o)continue;let r=o.closest("div[class]")||o.parentElement;r&&dt(r,e,t.profit)}}function ro(e,t,o,r){let n=o?.prices?.avg||o?.avg||null,s={id:`alert_${e.id}_${Date.now()}`,filterId:t.id,title:e.title,price:e.price,ebayAvg:n,profit:r,url:e.url,listingId:e.id,foundAt:new Date().toISOString()};chrome.storage.local.get(["watchlistAlerts"],i=>{let a=i.watchlistAlerts||[];a.some(l=>l.listingId===e.id)||(a.unshift(s),a.length>50&&(a=a.slice(0,50)),chrome.storage.local.set({watchlistAlerts:a}))});try{chrome.runtime.sendMessage({type:"apiRequest",url:`${no()}/api/watchlist/alerts`,method:"POST",headers:{"Content-Type":"application/json"},body:{filter_id:t.id,listing_title:e.title,listing_price:e.price,ebay_avg_price:n,estimated_profit:r,listing_url:e.url,fb_listing_id:e.id}})}catch{}}function no(){return m}function io(){if(E)return;E=document.createElement("div"),E.id="flipchecker-scan-indicator",E.style.cssText=`
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
  `,!document.getElementById("flipchecker-scan-styles")){let o=document.createElement("style");o.id="flipchecker-scan-styles",o.textContent="@keyframes flipchecker-spin { to { transform: rotate(360deg); } }",document.head.appendChild(o)}let t=document.createElement("span");t.textContent="Scanning watchlist...",E.appendChild(e),E.appendChild(t),document.body.appendChild(E)}function he(){E&&(E.remove(),E=null)}function Q(){T=!0,A&&(A.disconnect(),A=null),D&&(clearTimeout(D),D=null),he(),document.querySelectorAll("[data-flipchecker-badge]").forEach(e=>e.remove()),P=!1,q.clear(),Z.clear()}async function ao(e,t){let o=null,r="none";if(!_(e))return null;let n=$e(t);if(n&&(o=n,r="graphql"),!o&&C()){let s=await Ke();if(!_(e))return null;s&&(s.title||s.price)&&(o=Ze(s,t),r="vision")}if(!o&&C()){let s=await Xe();if(!_(e))return null;s&&(s.title||s.price)&&(o=Ye(s,t),r="ai")}if(!o||!o.title&&!o.price){let s=M()?.title||null,i=await je(s,t,void 0,e);if(!_(e))return null;if(i==="timeout"){let a=document.title.replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i,"").replace(/\s*[-–]\s*\$[\d,]+.*$/,"").trim(),l=document.title.match(/\$[\d,]+/),c=l?parseFloat(l[0].replace(/[$,]/g,"")):null;o={title:a||null,price:c,location:null,seller:null,daysListed:null,imageUrl:null,itemId:t,source:"document_title"},r="document_title"}else o=Je(t),r="dom"}return{data:o,method:r}}async function ee(){let e=Se(),t=window.location.href,o=V();if(te(null),st({title:"Loading...",itemId:o}),await new Promise(l=>setTimeout(l,1e3)),!_(e)||window.location.href!==t){$(e);return}await K();let r=await ao(e,o);if(!r||!_(e)){$(e);return}let{data:n,method:s}=r;if(te(n),!n.title&&!n.price){await fe({title:null,price:null,itemId:o},null),$(e);return}let i=null;if(C()&&n.title&&(i=await Y(n.title),!_(e))){$(e);return}let a=[];C()&&n.title&&(a=await lt(n)),await fe(n,i,a),$(e)}function lo(e,t){me(()=>{ee()})}var ut=!1,ye=null,ke=null;async function ft(){ut||(ut=!0,Pe(),await K(),chrome.runtime.onMessage.addListener((e,t,o)=>{if(e.type==="getListingImage"){let r=O();o({imageUrl:r})}return!1}),Be(),Ae((e,t)=>{ne(e)?(Q(),lo(e,t)):ge(e)?(Q(),xe()):Q()}),ye&&ye(),ke&&ke(),ye=ot(()=>{J()&&ee()}),ke=rt(e=>{document.getElementById("flipchecker-overlay")&&J()&&ee()}),J()?me(()=>{ee()}):ge(window.location.href)&&xe())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ft):ft();})();
