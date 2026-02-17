(()=>{(function(){"use strict";let r="flipchecker-ebay-badge";function u(){let e=window.location.href;return e.includes("LH_Sold=1")||e.includes("LH_Complete=1")}function h(){return new URLSearchParams(window.location.search).get("_nkw")||""}function b(e){if(!e)return null;let t=e.match(/\$[\d,]+\.?\d*/);if(!t)return null;let c=t[0].replace(/[^0-9.]/g,""),o=parseFloat(c);return isNaN(o)?null:o}function m(){let e=[];return document.querySelectorAll(".s-item").forEach((c,o)=>{if(o===0)return;let l=c.querySelector(".s-item__title"),i=c.querySelector(".s-item__price"),a=c.querySelector(".s-item__endedDate")||c.querySelector(".s-item__ended-date")||c.querySelector(".POSITIVE"),f=c.querySelector(".s-item__link");if(l&&i){let s=b(i.textContent);s&&s>0&&s<1e5&&e.push({title:l.textContent.trim().substring(0,100),price:s,soldDate:a?a.textContent.trim():null,url:f?f.href:null})}}),e}function v(e){if(e.length===0)return{count:0,low:null,high:null,avg:null,median:null};let t=e.map(i=>i.price).sort((i,a)=>i-a),c=t.reduce((i,a)=>i+a,0),o=Math.floor(t.length/2),l=t.length%2!==0?t[o]:(t[o-1]+t[o])/2;return{count:t.length,low:t[0],high:t[t.length-1],avg:Math.round(c/t.length),median:Math.round(l),prices:t.slice(0,20)}}function k(e,t,c){let o={query:e.toLowerCase().trim(),stats:t,samples:c.slice(0,10),timestamp:Date.now(),url:window.location.href},l=`flipchecker_sold_${e.toLowerCase().replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.set({[l]:o,flipchecker_last_sold:o},()=>{console.log("[FlipChecker] Sold data stored:",t)}),chrome.runtime.sendMessage({type:"soldDataCaptured",data:o})}function n(e){return e?`$${e.toLocaleString()}`:"N/A"}function x(e,t){let c=document.getElementById(r);c&&c.remove();let o=document.createElement("div");o.id=r,o.innerHTML=`
      <style>
        #${r} {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .flipchecker-badge-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          width: 260px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid #2d2d44;
        }
        .flipchecker-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #2d2d44;
        }
        .flipchecker-badge-logo {
          font-weight: 700;
          font-size: 14px;
          color: #4ade80;
        }
        .flipchecker-badge-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .flipchecker-badge-close:hover { color: #fff; }
        .flipchecker-badge-title {
          font-size: 11px;
          color: #888;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .flipchecker-badge-query {
          font-size: 12px;
          color: #fff;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .flipchecker-badge-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .flipchecker-badge-stat {
          background: #1a1a2e;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
        }
        .flipchecker-badge-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #4ade80;
        }
        .flipchecker-badge-stat-label {
          font-size: 9px;
          color: #888;
          text-transform: uppercase;
        }
        .flipchecker-badge-range {
          background: #1a1a2e;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 12px;
        }
        .flipchecker-badge-range-value {
          font-size: 18px;
          font-weight: 600;
          color: #4ade80;
        }
        .flipchecker-badge-range-label {
          font-size: 10px;
          color: #888;
        }
        .flipchecker-badge-footer {
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .flipchecker-badge-check {
          color: #4ade80;
          margin-right: 4px;
        }
      </style>
      <div class="flipchecker-badge-container">
        <div class="flipchecker-badge-header">
          <span class="flipchecker-badge-logo">FlipChecker</span>
          <button class="flipchecker-badge-close" id="flipchecker-close-badge">&times;</button>
        </div>

        <div class="flipchecker-badge-title">Sold Prices Captured</div>
        <div class="flipchecker-badge-query" title="${t}">"${t}"</div>

        <div class="flipchecker-badge-range">
          <div class="flipchecker-badge-range-value">${n(e.low)} - ${n(e.high)}</div>
          <div class="flipchecker-badge-range-label">Sold Price Range</div>
        </div>

        <div class="flipchecker-badge-stats">
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${n(e.median)}</div>
            <div class="flipchecker-badge-stat-label">Median</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${n(e.avg)}</div>
            <div class="flipchecker-badge-stat-label">Average</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${e.count}</div>
            <div class="flipchecker-badge-stat-label">Listings</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">&#10003;</div>
            <div class="flipchecker-badge-stat-label">Saved</div>
          </div>
        </div>

        <div class="flipchecker-badge-footer">
          <span class="flipchecker-badge-check">&#10003;</span> Data saved - return to FB Marketplace to see profit
        </div>
      </div>
    `,document.body.appendChild(o),document.getElementById("flipchecker-close-badge").addEventListener("click",()=>{o.remove()}),setTimeout(()=>{document.getElementById(r)&&(o.style.transition="opacity 0.5s",o.style.opacity="0",setTimeout(()=>o.remove(),500))},3e4)}function d(){if(!u()){console.log("[FlipChecker] Not a sold listings page, skipping");return}setTimeout(()=>{let e=h();if(!e){console.log("[FlipChecker] No search query found");return}let t=m();if(console.log(`[FlipChecker] Found ${t.length} sold items`),t.length===0){console.log("[FlipChecker] No sold items found on page");return}let c=v(t);console.log("[FlipChecker] Stats:",c),k(e,c,t),x(c,e)},1500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",d):d();let g=window.location.href,p=null,_=100;new MutationObserver(()=>{p&&clearTimeout(p),p=setTimeout(()=>{window.location.href!==g&&(g=window.location.href,setTimeout(d,1500))},_)}).observe(document.body,{childList:!0,subtree:!0})})();})();
