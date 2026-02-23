(()=>{var S="flipchecker-overlay",D="flipchecker-trigger",f="https://www.flipchecker.io";var x={currentUrl:typeof window<"u"?window.location.href:null,authToken:null,currentUser:null,lastExtractedData:null,currentJobId:null,isExtracting:!1};function F(e){x={...x,...e}}function y(){return x.authToken}function Ce(){return x.currentUser}function ee(e){x.lastExtractedData=e}function A(){return x.lastExtractedData}function Ee(){x.lastExtractedData=null}function Te(){let e=Date.now()+"_"+Math.random().toString(36).substr(2,9);return x.currentJobId=e,x.isExtracting=!0,e}function _(e){return x.currentJobId===e}function B(e){x.currentJobId===e&&(x.isExtracting=!1)}var oe=typeof window<"u"?window.location.href:"",te=null,q=null,Se=!1,Le=[];function Fe(e){Le.push(e)}function xt(e=window.location.href){let t=e.match(/\/marketplace\/item\/(\d+)/);return t?t[1]:null}function re(e=window.location.href){return e.includes("/marketplace/item/")}function yt(){let e=document.getElementById(D),t=document.getElementById(S);e&&e.remove(),t&&t.remove()}function Ie(e,t){Le.forEach(o=>{try{o(e,t)}catch{}})}function G(){let e=window.location.href;if(re(e)){let t=xt(e),r=A()?.itemId;t!==r&&Ee(),Ie(e,t)}else yt(),Ie(e,null)}function kt(){let e=history.pushState,t=history.replaceState;history.pushState=function(...o){e.apply(this,o),G()},history.replaceState=function(...o){t.apply(this,o),G()},window.addEventListener("popstate",G)}function bt(){q&&(q.disconnect(),q=null);let e=new MutationObserver(()=>{te&&clearTimeout(te),te=setTimeout(()=>{window.location.href!==oe&&(oe=window.location.href,G())},100)});return e.observe(document.body,{childList:!0,subtree:!0}),q=e,e}function Ae(){Se||(Se=!0,oe=window.location.href,kt(),bt())}var Be=new Map,_t=[];function Me(e){return Be.get(e)||null}function vt(e){try{let t=typeof e=="string"?JSON.parse(e):e;if(t?.data?.marketplace_product_details_page){let o=t.data.marketplace_product_details_page;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,currency:o.listing_price?.currency,location:o.location?.reverse_geocode?.city||o.location_text?.text,seller:o.marketplace_listing_seller?.name,description:o.redacted_description?.text,images:o.listing_photos?.map(r=>r.image?.uri).filter(Boolean),condition:o.condition,category:o.marketplace_listing_category_id,source:"graphql"}}if(t?.data?.node?.__typename==="MarketplaceListing"){let o=t.data.node;return{itemId:o.id,title:o.marketplace_listing_title,price:o.listing_price?.amount,priceFormatted:o.listing_price?.formatted_amount,location:o.location_text?.text,seller:o.story?.comet_sections?.seller?.seller?.name,images:o.listing_photos?.map(r=>r.image?.uri).filter(Boolean),source:"graphql"}}if(t?.data?.marketplace_pdp?.product){let o=t.data.marketplace_pdp.product;return{itemId:o.id,title:o.title||o.name,price:o.price?.amount,priceFormatted:o.price?.formatted,location:o.location,seller:o.seller?.name,images:o.images?.map(r=>r.uri||r.url).filter(Boolean),source:"graphql"}}return null}catch{return null}}function wt(e,t){Be.set(e,t),_t.forEach(o=>{try{o(e,t)}catch{}})}function Pe(){window.addEventListener("message",e=>{if(e.source===window&&e.data?.type==="FLIPCHECKER_GRAPHQL_RESPONSE"){let t=vt(e.data.data);t&&t.itemId&&wt(t.itemId,t)}})}var $e={tier1:['[data-testid="marketplace_pdp_title"]','[data-testid="marketplace_pdp_component"] h1'],tier2:["span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)",'[data-testid="marketplace_pdp_component"] span[dir="auto"]','div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'],tier3:['div[role="main"] h1','h1[dir="auto"]','[role="heading"][aria-level="1"]']};var De={tier1:['[data-testid="marketplace_pdp_location"]','[data-testid="marketplace_pdp-location"]'],tier2:['span[dir="auto"]','a[href*="/marketplace/"]'],tier3:[]},Re={tier1:['[data-testid="marketplace_pdp_seller_name"]','[data-testid="marketplace_pdp-seller_profile_link"]','a[href*="/marketplace/profile/"] span'],tier2:['a[role="link"][href*="/profile.php"] span','a[role="link"][href*="facebook.com/"][href*="/"]'],tier3:[]},Ne={tier1:['img[data-testid="marketplace_pdp_image"]','[data-testid="marketplace_pdp-image"] img'],tier2:['div[role="main"] img[style*="object-fit"]','div[role="main"] div[aria-label] img[src*="scontent"]','div[role="main"] div[data-pagelet] img[src*="scontent"]'],tier3:['div[role="main"] img[src*="scontent"]','img[src*="scontent"]']};function R(e){return[...e.tier1||[],...e.tier2||[],...e.tier3||[]]}var ne=/^\$[\d,]+(\.\d{2})?$/,Ue=[/Listed in (.+)/i,/Location: (.+)/i,/in ([A-Z][a-z]+,?\s*[A-Z]{2})/],Oe=[/Listed (\d+) (day|week|hour|minute)s? ago/i,/(\d+) (day|week|hour|minute)s? ago/i];var Et=["marketplace","facebook marketplace","listing","item","product","details","seller details","description","about this item","chat history is missing","message seller","send message","is this still available","see more","see less","show more","sponsored","suggested for you","similar items","related items"],Tt=[/^(send|chat|message|call|contact)/i,/^(see|view|show|hide|load)\s+(more|less|all)/i,/facebook/i,/messenger/i,/^(listed|posted|sold)\s+(in|on|ago)/i,/^\d+\s+(views?|likes?|saves?|comments?)/i,/^(share|save|report|hide)\s*(this)?/i,/history is (missing|unavailable)/i,/^(sign|log)\s*(in|out|up)/i,/^(join|create|start)/i,/enter your pin/i,/restore chat/i,/end-to-end encrypted/i,/^\d+\s*(new\s*)?(message|notification)/i,/your (message|chat|conversation)/i,/turn on notifications/i,/^\s*•\s*/,/^(tap|click|press)\s+(to|here)/i,/learn more$/i];function M(e){if(!e)return!0;let t=e.toLowerCase().trim();if(Et.includes(t))return!0;for(let o of Tt)if(o.test(e))return!0;return e.length<5}function ze(e,t){if(!e||!t)return!1;let o=/iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;return e<10&&o.test(t)}function ae(e){let t=window.getComputedStyle(e);return parseFloat(t.fontSize)||0}function W(){return document.querySelector('div[role="main"]')}function qe(e=1e4){let t=W();return t?t.innerText.substring(0,e):document.body.innerText.substring(0,e)}function v(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function le(e){if(!e)return"#";try{let t=new URL(e);return["https:","http:"].includes(t.protocol)?e:"#"}catch{return"#"}}function b(e){if(!e)return null;if(e.toLowerCase()==="free")return 0;let t=e.replace(/[^0-9.]/g,""),o=parseFloat(t);return isNaN(o)?null:o}function w(e){return e==null?"N/A":e===0?"Free":"$"+e.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}function H(e){if(!e)return null;let t=e.replace(/[^\w\s-]/g," ").replace(/\s+/g," ").trim().substring(0,100);return`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}&LH_Complete=1&LH_Sold=1&_sop=13`}function pe(e,t,o,r=.84){return t==null||o==null||e==null?{low:null,high:null}:{low:Math.round(t*r-e),high:Math.round(o*r-e)}}function de(e,t){return t<0?"profit-negative":e<0?"profit-mixed":"profit-positive"}function ue(e,t=24*60*60*1e3){return e?Date.now()-e<t:!1}function j(){let e=window.location.href.match(/\/marketplace\/item\/(\d+)/);return e?e[1]:null}function V(){return window.location.href.includes("/marketplace/item/")}function He(e,t,o=5e3,r=null){return new Promise(n=>{let s=Date.now(),i=A();if(i?.itemId===t&&i?.title){n(!0);return}let a=()=>{if(r&&!_(r)){n(!1);return}let l=je(),p=Date.now()-s,k=M(l);if(l&&!k&&l!==e&&p>=500){n(!0);return}if(!e&&l&&!k&&p>=500){n(!0);return}if(p>o){n(!1);return}setTimeout(a,200)};a()})}function Lt(){let e=document.title||"";if(!e)return null;let t=e.replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i,"").trim();if(!t||t.length<5)return null;let o=t.replace(/\s*[-–]\s*\$[\d,]+.*$/,"").trim();return o&&o.length>=5&&(t=o),M(t)||t.startsWith("$")||/^\d+$/.test(t)?null:t}function Ft(){let t=(document.title||"").match(/\$[\d,]+/);if(t){let o=b(t[0]);if(o>=5)return o}return null}function je(){let e=Lt();if(e)return e;let t=R($e);for(let n of t)try{let s=document.querySelectorAll(n);for(let i of s){let a=i.textContent.trim();if(a.length>15&&a.length<300&&!a.startsWith("$")&&!/^\d+$/.test(a)&&!M(a))return a}}catch{}let o=W();if(o){let n=o.querySelectorAll('span[dir="auto"]'),s=[];for(let i of n){let a=i.textContent.trim();if(a.length>15&&a.length<200&&!a.startsWith("$")&&!M(a)&&!/^\d+$/.test(a)){let l=ae(i);s.push({text:a,fontSize:l,element:i})}}if(s.sort((i,a)=>a.fontSize-i.fontSize),s.length>0)return s[0].text}let r=document.querySelectorAll('h1, h2, [role="heading"]');for(let n of r){let s=n.textContent.trim();if(s.length>10&&s.length<300&&!M(s)&&!s.startsWith("$"))return s}return null}function At(){let e=Ft();if(e)return e;let t=document.querySelector("h1");if(t){let s=t.closest("div");if(s){let i=s.parentElement?.querySelectorAll("span")||[];for(let a of i){let l=a.textContent.trim();if(ne.test(l))return b(l)}}}let o=document.querySelectorAll("span"),r=[];for(let s of o){let i=s.textContent.trim();if(ne.test(i)){let a=ae(s),l=b(i);r.push({element:s,price:l,fontSize:a})}}if(r.sort((s,i)=>i.fontSize-s.fontSize),r.length>0){let s=r.find(i=>i.price>=5&&i.fontSize>=14);return s?s.price:r[0].price}let n=W();if(n){let i=n.innerText.match(/\$[\d,]+(\.\d{2})?/);if(i)return b(i[0])}return null}function Bt(){let e=R(De);for(let t of e)try{let o=document.querySelectorAll(t);for(let r of o){let n=r.textContent.trim();for(let s of Ue){let i=n.match(s);if(i)return i[1]||n}if(/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(n))return n}}catch{}return null}function Mt(){let e=R(Re);for(let t of e)try{let o=document.querySelector(t);if(o&&o.textContent.trim()&&o.textContent.trim().length<50)return o.textContent.trim()}catch{}return null}function Pt(){let e=document.querySelectorAll("span");for(let t of e){let o=t.textContent.trim();for(let r of Oe)if(r.test(o))return o}return null}function N(){let t=R(Ne);for(let o of t)try{let r=document.querySelectorAll(o),n=null,s=0;for(let i of r){if(!i.src)continue;let a=i.naturalWidth||i.width||0,l=i.naturalHeight||i.height||0,p=Math.max(a,l);p>=200&&p>s&&(n=i.src,s=p)}if(n)return n}catch{}return null}function Ve(e){return{title:je(),price:At(),location:Bt(),seller:Mt(),daysListed:Pt(),imageUrl:N(),itemId:e,source:"dom"}}async function Je(){let e=y();return e?new Promise(t=>{let o=qe(1e4);chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{pageText:o,url:window.location.href}},r=>{if(chrome.runtime.lastError){t(null);return}if(!r){t(null);return}if(!r.ok){t(null);return}t(r.data)})}):null}function Xe(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:null,itemId:t,source:"ai"}}function $t(){return new Promise(e=>{chrome.runtime.sendMessage({type:"captureScreenshot"},t=>{if(chrome.runtime.lastError){e(null);return}if(!t||!t.success){e(null);return}e(t.screenshot)})})}async function Ye(){let e=y();if(e||(e=(await new Promise(r=>chrome.storage.local.get(["authToken"],r)))?.authToken||null,e&&F({authToken:e})),!e)return null;let t=await $t();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/vision-extract`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:{screenshot:t,url:window.location.href}},r=>{if(chrome.runtime.lastError){o(null);return}if(!r){o(null);return}if(!r.ok){o(null);return}r.data?.error,o(r.data)})}):null}function Ke(e,t){return{title:e.title||null,price:typeof e.price=="number"?e.price:b(e.price),location:e.location||null,seller:e.seller||null,daysListed:e.daysListed||null,imageUrl:null,itemId:t,source:"vision"}}async function X(e){let t=y();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/price-lookup`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:{query:e}},r=>{if(chrome.runtime.lastError){o({error:"network_error"});return}if(!r){o({error:"network_error"});return}if(r.status===401){o({error:"auth_required"});return}if(r.status===429){o({error:"limit_reached",message:r.data?.error});return}if(!r.ok){o({error:"api_error"});return}let n=r.data;o({source:n.source,ebay_low:n.prices?.low,ebay_high:n.prices?.high,ebay_avg:n.prices?.avg,ebay_median:n.prices?.median,sample_count:n.prices?.sample_count,samples:n.samples,ebay_url:n.ebay_search_url,usage:n.usage})})}):{error:"auth_required"}}async function Qe(e,t){let o=y();return o?new Promise(r=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/deals`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:{url:window.location.href,title:e.title,price:e.price,itemId:e.itemId,extractionMethod:e.source,location:e.location,sellerName:e.seller,images:e.images||(e.imageUrl?[e.imageUrl]:null),ebay_search_url:t&&!t.error&&t.ebay_url||null,priceData:t&&!t.error?{ebayLow:t.ebay_low,ebayHigh:t.ebay_high,ebayAvg:t.ebay_avg}:null}},n=>{if(chrome.runtime.lastError){J(e),r({success:!0,local:!0});return}if(!n||!n.ok){if(n?.status===401){J(e),r({success:!0,local:!0});return}if(n?.status===429){r({success:!1,error:"Deal limit reached. Upgrade to save more."});return}J(e),r({success:!0,local:!0});return}r({success:!0})})}):(J(e),{success:!0,local:!0})}function J(e){let t={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),title:e.title||"Unknown Item",price:e.price,url:window.location.href,imageUrl:e.imageUrl||e.images&&e.images[0]||null,ebayUrl:H(e.title),savedAt:new Date().toISOString()};chrome.storage.local.get(["savedDeals"],o=>{let r=o.savedDeals||[];r.unshift(t),r.length>100&&r.pop(),chrome.storage.local.set({savedDeals:r},()=>{chrome.runtime.lastError})})}async function et(e){return new Promise(t=>{if(!e){t(null);return}let r=`flipchecker_sold_${e.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.get([r,"flipchecker_last_sold"],n=>{if(n[r]&&ue(n[r].timestamp,864e5)){t(n[r]);return}if(n.flipchecker_last_sold&&ue(n.flipchecker_last_sold.timestamp,864e5)){let s=n.flipchecker_last_sold.query.toLowerCase(),i=e.toLowerCase(),a=s.split(/\s+/).filter(u=>u.length>3),l=i.split(/\s+/).filter(u=>u.length>3),p=a.filter(u=>l.some(m=>m.includes(u)||u.includes(m)));if((l.length>0?p.length/l.length:0)>=.6&&p.length>=3){t(n.flipchecker_last_sold);return}}t(null)})})}async function Rt(){return new Promise(e=>{chrome.storage.local.get(["refreshToken","user"],t=>{if(!t.refreshToken){e(!1);return}chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/auth/refresh`,method:"POST",headers:{"Content-Type":"application/json"},body:{refresh_token:t.refreshToken}},o=>{if(chrome.runtime.lastError||!o?.ok){e(!1);return}let r=o.data;if(r?.access_token){let n={authToken:r.access_token};r.refresh_token&&(n.refreshToken=r.refresh_token),chrome.storage.local.set(n,()=>{F({authToken:r.access_token,currentUser:t.user||null}),e(!0)})}else e(!1)})})})}async function Y(){return new Promise(e=>{chrome.storage.local.get(["authToken","refreshToken","user"],async t=>{if(chrome.runtime.lastError){e();return}if(t.authToken){let o=!1;try{let r=JSON.parse(atob(t.authToken.split(".")[1]));o=r.exp&&r.exp*1e3<Date.now()}catch{}o?t.refreshToken?await Rt()||chrome.storage.local.remove(["authToken","refreshToken","user"]):chrome.storage.local.remove(["authToken","user"]):F({authToken:t.authToken,currentUser:t.user||null})}e()})})}function tt(e){let t=o=>{o.type==="authSuccess"&&(F({authToken:null,currentUser:o.user}),Y().then(e))};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function ot(e){let t=o=>{o.type==="soldDataAvailable"&&e(o.data)};return chrome.runtime.onMessage.addListener(t),()=>{chrome.runtime.onMessage.removeListener(t)}}function C(){return!!y()}function rt(){chrome.runtime.sendMessage({type:"openLogin"})}function nt(){chrome.runtime.sendMessage({type:"openUpgrade"})}function Nt(){return`
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
  `}function Ut(){let e=Ce();if(!e)return"";let t=e.tier||"free";return t==="flipper"?'<span class="tier-badge tier-flipper">Flipper</span>':t==="pro"?'<span class="tier-badge tier-pro">Pro</span>':'<span class="tier-badge">Free</span>'}async function fe(e,t=null,o=[]){let r=j();if(e.itemId&&e.itemId!==r)return;let n=document.getElementById(S);n&&n.remove();let s=document.createElement("div");s.id=S;let i=s.attachShadow({mode:"open"}),a=t&&!t.error,l=C(),p=t?.error==="limit_reached",k=a&&t.ebay_low!=null&&t.ebay_high!=null,u=null,m=null,z="profit-positive";if(k&&e.price){let c=pe(e.price,t.ebay_low,t.ebay_high);u=c.low,m=c.high,z=de(u,m)}let ft=ze(e.price,e.title),be=t?.ebay_url||H(e.title),mt=Ut(),_e=e.images&&e.images[0]||e.imageUrl||N()||null,g=`
    ${Nt()}
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER ${mt}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        ${_e?`<img class="listing-image" src="${le(_e)}" alt="" />`:""}
        <div class="price-info">
          <div class="current-price">${w(e.price)}</div>
          <div class="title" title="${v(e.title||"")}">${v(e.title)||"Unknown Item"}</div>
        </div>
      </div>

      ${o.length>0?o.map(c=>`<div class="alert-match"><span class="alert-match-icon">\u{1F514}</span> ALERT MATCH: ${v(c.search_query)}${c.max_price?` \u2014 under $${c.max_price}`:""}!</div>`).join(""):""}
      ${ft?'<div class="warning">Warning: Price seems suspiciously low</div>':""}
  `;l||(g+=`
      <div class="login-prompt">
        <div style="font-weight: 700;">Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `),p&&(g+=`
      <div class="upgrade-prompt">
        <div style="font-weight: 700;">Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `);let I=await et(e.title);if(I&&I.stats&&I.stats.count>0){let c=I.stats;if(e.price){let d=pe(e.price,c.low,c.high);u=d.low,m=d.high,z=de(u,m)}if(g+=`
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${w(c.low)} - ${w(c.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${w(c.median)}</span>
          <span>Avg: ${w(c.avg)}</span>
        </div>
        <div class="source-tag">${c.count} sold listings analyzed</div>
        ${I.samples&&I.samples.length>0?`
          <div class="samples">
            ${I.samples.slice(0,3).map(d=>`
              <div class="sample-item">
                <span>${v(d.title.substring(0,25))}...</span>
                <span class="sample-price">$${Number(d.price)||0}</span>
              </div>
            `).join("")}
          </div>
        `:""}
      </div>
    `,u!==null){let d=e.price?Math.round(u/e.price*100):null,h=e.price?Math.round(m/e.price*100):null;g+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${z}">
            ${u>=0?"+":""}$${u} to ${m>=0?"+":""}$${m}
          </div>
          ${d!==null?`<div class="source-tag">ROI: ${d}% \u2013 ${h}%</div>`:""}
        </div>
      `}}else if(a&&k){let d={estimate:"Basic estimate",ebay_active:"eBay active listings",ebay_sold:"eBay sold data"}[t.source]||t.source;if(g+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${w(t.ebay_low)} - ${w(t.ebay_high)}</div>
        <div class="source-tag">Source: ${v(d)}</div>
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
    `,u!==null){let h=e.price?Math.round(u/e.price*100):null,gt=e.price?Math.round(m/e.price*100):null;g+=`
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${z}">
            ${u>=0?"+":""}$${u} to ${m>=0?"+":""}$${m}
          </div>
          ${h!==null?`<div class="source-tag">ROI: ${h}% \u2013 ${gt}%</div>`:""}
        </div>
      `}}else if(a&&!k)g+=`
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range" style="font-size: 14px; color: #09090B80;">No eBay data found</div>
        <div class="source-tag">Try searching eBay manually below</div>
      </div>
    `;else if(!l||p){let c=e.price?Math.round(e.price*.7):null,d=e.price?Math.round(e.price*1.5):null;c&&d&&(g+=`
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${w(c)} - ${w(d)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `)}g+=`
    <div class="meta">
      ${e.location?`<div class="meta-item">Location: ${v(e.location)}</div>`:""}
      ${e.seller?`<div class="meta-item">Seller: ${v(e.seller)}</div>`:""}
      ${e.daysListed?`<div class="meta-item">${v(e.daysListed)}</div>`:""}
    </div>

    <div class="buttons">
      ${be?`<a href="${le(be)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>`:""}
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
  `,g+="</div>",i.innerHTML=g,i.getElementById("close-overlay").addEventListener("click",()=>{s.remove()});let ve=i.getElementById("login-btn");ve&&ve.addEventListener("click",()=>{rt()});let we=i.getElementById("upgrade-btn");we&&we.addEventListener("click",()=>{nt()}),i.getElementById("save-deal").addEventListener("click",async()=>{let c=i.getElementById("save-deal"),d=i.getElementById("saved-msg");c.disabled=!0,c.textContent="Saving...";let h=await Qe(e,t);c.disabled=!1,c.textContent="Save Deal",h.success&&!h.local?(d.textContent="Deal saved!",d.className="saved-msg success"):h.success&&h.local?(d.textContent="Saved locally (sign in to sync)",d.className="saved-msg local"):(d.textContent=h.error||"Failed to save",d.className="saved-msg error"),d.style.display="block",setTimeout(()=>{d.style.display="none"},3e3)}),document.body.appendChild(s)}function it(e){let t=document.getElementById(S);t&&t.remove();let o=document.createElement("div");o.id=S;let r=o.attachShadow({mode:"open"});return r.innerHTML=`
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
  `,document.body.appendChild(o),o}function me(e){let t=document.getElementById(S);t&&t.remove();let o=document.getElementById(D);o&&o.remove();let r=document.createElement("button");r.id=D,r.innerHTML="\u{1F4B0} CHECK FLIP",r.style.cssText=`
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
  `,r.addEventListener("mouseenter",()=>{r.style.transform="translate(1px, 1px)",r.style.boxShadow="2px 2px 0px #09090B"}),r.addEventListener("mouseleave",()=>{r.style.transform="translate(0, 0)",r.style.boxShadow="3px 3px 0px #09090B"}),r.addEventListener("click",()=>{r.remove(),e()}),document.body.appendChild(r)}var U=null,st=0,Ot=5*60*1e3;async function zt(){let e=Date.now();if(U&&e-st<Ot)return U;let t=y();return t?new Promise(o=>{chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/alerts`,method:"GET",headers:{Authorization:`Bearer ${t}`}},r=>{if(chrome.runtime.lastError||!r?.ok){o(U||[]);return}U=r.data?.alerts||[],st=e,o(U)})}):[]}function qt(e,t){if(!e||!t)return!1;let o=e.toLowerCase(),r=t.toLowerCase();if(o.includes(r))return!0;let n=r.split(/\s+/).filter(a=>a.length>2),s=o.split(/\s+/).filter(a=>a.length>2);return n.length===0?!1:n.filter(a=>s.some(l=>l.includes(a)||a.includes(l))).length/n.length>=.6}function Gt(e,t){let o=y();o&&chrome.runtime.sendMessage({type:"apiRequest",url:`${f}/api/alerts/match`,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:{alert_id:e.id,listing_title:t.title,listing_price:t.price,source_url:window.location.href}},r=>{chrome.runtime.lastError})}async function at(e){if(!e?.title)return[];let t=await zt();if(!t.length)return[];let o=[];for(let r of t){let n=qt(e.title,r.search_query),s=!r.max_price||e.price&&e.price<=r.max_price;n&&s&&(o.push(r),Gt(r,e))}return o.length>0,o}function ge(e){if(!e)return!1;try{let o=new URL(e).pathname;return!(!o.startsWith("/marketplace")||o.includes("/marketplace/item/")||o.includes("/marketplace/profile/")||o.includes("/marketplace/you/")||o.includes("/marketplace/create"))}catch{return!1}}function lt(){let e=[],t=new Set,o=document.querySelectorAll('a[href*="/marketplace/item/"]');for(let r of o){let n=r.href.match(/\/marketplace\/item\/(\d+)/);if(!n)continue;let s=n[1];if(t.has(s))continue;t.add(s);let i=Wt(r);if(!i)continue;let a=Ht(i);if(!a)continue;let l=jt(i);if(l===null)continue;let p=r.href.split("?")[0];e.push({id:s,title:a,price:l,url:p,cardElement:i})}return e}function Wt(e){let t=e;for(let o=0;o<6&&t.parentElement;o++){t=t.parentElement;let r=t.querySelector("img"),n=t.textContent||"",s=/\$[\d,]+/.test(n);if(r&&s&&n.length>20)return t}return e.closest("div[class]")||e.parentElement}function Ht(e){let t=e.querySelectorAll('span[dir="auto"]');for(let o of t){let r=o.textContent?.trim();if(r&&!/^\$[\d,]+/.test(r)&&!(r.length<10)&&!/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(r))return r}return null}function jt(e){let t=e.querySelectorAll("span");for(let o of t){let r=o.textContent?.trim();if(r&&/^\$[\d,]+(\.\d{2})?$/.test(r)){let n=b(r);if(n!==null&&n>0)return n}}return null}var P=!1,O=new Map,K=new Map,L=null,T=!1,E=null,$=null;function xe(){T=!1,C()&&chrome.storage.local.get(["watchlistFilters"],e=>{let t=e.watchlistFilters;if(!t||t.length===0)return;let o=t.filter(r=>r.is_active!==!1);o.length!==0&&(setTimeout(()=>{T||ct(o)},1e3),Yt(o))})}function Yt(e){L&&L.disconnect();let t=document.querySelector('div[role="main"]')||document.body;L=new MutationObserver(()=>{T||($&&clearTimeout($),$=setTimeout(()=>{!T&&!P&&(Zt(),ct(e))},500))}),L.observe(t,{childList:!0,subtree:!0})}async function ct(e){if(!(P||T||!C()||!e.length)){P=!0,to();try{let t=lt(),o=Date.now();for(let[i,a]of O)o-a>36e5&&O.delete(i);let r=t.filter(i=>!O.has(i.id));if(r.length===0){he(),P=!1;return}let n=[];for(let i of r){for(let a of e)if(Kt(i,a)){n.push({listing:i,filter:a});break}O.set(i.id,o)}let s=n.slice(0,10);for(let{listing:i,filter:a}of s){if(T)break;let l=await X(i.title);if(T)break;if(l?.error){if(l.error==="limit_reached"||l.error==="auth_required"||l.error==="network_error")break;continue}let p=l?.prices?.avg||l?.avg;if(!p)continue;let k=Math.round(p*.84-i.price);k>=a.min_profit&&(pt(i.cardElement,i.id,k),Qt(i,a,l,k)),T||await new Promise(u=>setTimeout(u,500))}}catch{}finally{he(),P=!1}}}function Kt(e,t){if(!e.price||e.price<=0||e.price>t.max_buy_price)return!1;let o=e.title.toLowerCase();return t.keywords.toLowerCase().split(/\s+/).filter(n=>n.length>0).every(n=>o.includes(n))}function pt(e,t,o){if(!e||e.querySelector("[data-flipchecker-badge]"))return;let n=e.querySelector("img")?.closest("div")||e;window.getComputedStyle(n).position==="static"&&(n.style.position="relative");let i=document.createElement("div");i.setAttribute("data-flipchecker-badge",t),i.style.cssText=`
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
  `,l.addEventListener("click",p=>{p.preventDefault(),p.stopPropagation(),i.remove(),K.delete(t)}),i.appendChild(a),i.appendChild(l),n.appendChild(i),K.set(t,{profit:o})}function Zt(){for(let[e,t]of K){if(document.querySelector(`[data-flipchecker-badge="${e}"]`))continue;let o=document.querySelector(`a[href*="/marketplace/item/${e}"]`);if(!o)continue;let r=o.closest("div[class]")||o.parentElement;r&&pt(r,e,t.profit)}}function Qt(e,t,o,r){let n=o?.prices?.avg||o?.avg||null,s={id:`alert_${e.id}_${Date.now()}`,filterId:t.id,title:e.title,price:e.price,ebayAvg:n,profit:r,url:e.url,listingId:e.id,foundAt:new Date().toISOString()};chrome.storage.local.get(["watchlistAlerts"],i=>{let a=i.watchlistAlerts||[];a.some(l=>l.listingId===e.id)||(a.unshift(s),a.length>50&&(a=a.slice(0,50)),chrome.storage.local.set({watchlistAlerts:a}))});try{chrome.runtime.sendMessage({type:"apiRequest",url:`${eo()}/api/watchlist/alerts`,method:"POST",headers:{"Content-Type":"application/json"},body:{filter_id:t.id,listing_title:e.title,listing_price:e.price,ebay_avg_price:n,estimated_profit:r,listing_url:e.url,fb_listing_id:e.id}})}catch{}}function eo(){return f}function to(){if(E)return;E=document.createElement("div"),E.id="flipchecker-scan-indicator",E.style.cssText=`
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
  `,!document.getElementById("flipchecker-scan-styles")){let o=document.createElement("style");o.id="flipchecker-scan-styles",o.textContent="@keyframes flipchecker-spin { to { transform: rotate(360deg); } }",document.head.appendChild(o)}let t=document.createElement("span");t.textContent="Scanning watchlist...",E.appendChild(e),E.appendChild(t),document.body.appendChild(E)}function he(){E&&(E.remove(),E=null)}function Z(){T=!0,L&&(L.disconnect(),L=null),$&&(clearTimeout($),$=null),he(),document.querySelectorAll("[data-flipchecker-badge]").forEach(e=>e.remove()),P=!1,O.clear(),K.clear()}async function ro(e,t){let o=null,r="none";if(!_(e))return null;let n=Me(t);if(n&&(o=n,r="graphql"),!o&&C()){let s=await Ye();if(!_(e))return null;s&&(s.title||s.price)&&(o=Ke(s,t),r="vision")}if(!o&&C()){let s=await Je();if(!_(e))return null;s&&(s.title||s.price)&&(o=Xe(s,t),r="ai")}if(!o||!o.title&&!o.price){let s=A()?.title||null;if(await He(s,t,void 0,e),!_(e))return null;o=Ve(t),r="dom"}return{data:o,method:r}}async function Q(){let e=Te(),t=window.location.href,o=j();if(ee(null),it({title:"Loading...",itemId:o}),await new Promise(l=>setTimeout(l,1e3)),!_(e)||window.location.href!==t){B(e);return}await Y();let r=await ro(e,o);if(!r||!_(e)){B(e);return}let{data:n,method:s}=r;if(ee(n),!n.title&&!n.price){await fe({title:null,price:null,itemId:o},null),B(e);return}let i=null;if(C()&&n.title&&(i=await X(n.title),!_(e))){B(e);return}let a=[];C()&&n.title&&(a=await at(n)),await fe(n,i,a),B(e)}function no(e,t){me(()=>{Q()})}var dt=!1,ye=null,ke=null;async function ut(){dt||(dt=!0,Pe(),await Y(),chrome.runtime.onMessage.addListener((e,t,o)=>{if(e.type==="getListingImage"){let r=N();o({imageUrl:r})}return!1}),Ae(),Fe((e,t)=>{re(e)?(Z(),no(e,t)):ge(e)?(Z(),xe()):Z()}),ye&&ye(),ke&&ke(),ye=tt(()=>{V()&&Q()}),ke=ot(e=>{document.getElementById("flipchecker-overlay")&&V()&&Q()}),V()?me(()=>{Q()}):ge(window.location.href)&&xe())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ut):ut();})();
