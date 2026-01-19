(()=>{(function(){"use strict";let l="flipradar-ebay-badge";function u(){let e=window.location.href;return e.includes("LH_Sold=1")||e.includes("LH_Complete=1")}function b(){return new URLSearchParams(window.location.search).get("_nkw")||""}function m(e){if(!e)return null;let a=e.match(/\$[\d,]+\.?\d*/);if(!a)return null;let r=a[0].replace(/[^0-9.]/g,""),t=parseFloat(r);return isNaN(t)?null:t}function v(){let e=[];return document.querySelectorAll(".s-item").forEach((r,t)=>{if(t===0)return;let i=r.querySelector(".s-item__title"),o=r.querySelector(".s-item__price"),d=r.querySelector(".s-item__endedDate")||r.querySelector(".s-item__ended-date")||r.querySelector(".POSITIVE"),f=r.querySelector(".s-item__link");if(i&&o){let s=m(o.textContent);s&&s>0&&s<1e5&&e.push({title:i.textContent.trim().substring(0,100),price:s,soldDate:d?d.textContent.trim():null,url:f?f.href:null})}}),e}function h(e){if(e.length===0)return{count:0,low:null,high:null,avg:null,median:null};let a=e.map(o=>o.price).sort((o,d)=>o-d),r=a.reduce((o,d)=>o+d,0),t=Math.floor(a.length/2),i=a.length%2!==0?a[t]:(a[t-1]+a[t])/2;return{count:a.length,low:a[0],high:a[a.length-1],avg:Math.round(r/a.length),median:Math.round(i),prices:a.slice(0,20)}}function x(e,a,r){let t={query:e.toLowerCase().trim(),stats:a,samples:r.slice(0,10),timestamp:Date.now(),url:window.location.href},i=`flipradar_sold_${e.toLowerCase().replace(/\s+/g,"_").substring(0,50)}`;chrome.storage.local.set({[i]:t,flipradar_last_sold:t},()=>{console.log("[FlipRadar] Sold data stored:",a)}),chrome.runtime.sendMessage({type:"soldDataCaptured",data:t})}function n(e){return e?`$${e.toLocaleString()}`:"N/A"}function _(e,a){let r=document.getElementById(l);r&&r.remove();let t=document.createElement("div");t.id=l,t.innerHTML=`
      <style>
        #${l} {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .flipradar-badge-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          width: 260px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid #2d2d44;
        }
        .flipradar-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #2d2d44;
        }
        .flipradar-badge-logo {
          font-weight: 700;
          font-size: 14px;
          color: #4ade80;
        }
        .flipradar-badge-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .flipradar-badge-close:hover { color: #fff; }
        .flipradar-badge-title {
          font-size: 11px;
          color: #888;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .flipradar-badge-query {
          font-size: 12px;
          color: #fff;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .flipradar-badge-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .flipradar-badge-stat {
          background: #1a1a2e;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
        }
        .flipradar-badge-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #4ade80;
        }
        .flipradar-badge-stat-label {
          font-size: 9px;
          color: #888;
          text-transform: uppercase;
        }
        .flipradar-badge-range {
          background: #1a1a2e;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 12px;
        }
        .flipradar-badge-range-value {
          font-size: 18px;
          font-weight: 600;
          color: #4ade80;
        }
        .flipradar-badge-range-label {
          font-size: 10px;
          color: #888;
        }
        .flipradar-badge-footer {
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .flipradar-badge-check {
          color: #4ade80;
          margin-right: 4px;
        }
      </style>
      <div class="flipradar-badge-container">
        <div class="flipradar-badge-header">
          <span class="flipradar-badge-logo">FlipRadar</span>
          <button class="flipradar-badge-close" id="flipradar-close-badge">&times;</button>
        </div>

        <div class="flipradar-badge-title">Sold Prices Captured</div>
        <div class="flipradar-badge-query" title="${a}">"${a}"</div>

        <div class="flipradar-badge-range">
          <div class="flipradar-badge-range-value">${n(e.low)} - ${n(e.high)}</div>
          <div class="flipradar-badge-range-label">Sold Price Range</div>
        </div>

        <div class="flipradar-badge-stats">
          <div class="flipradar-badge-stat">
            <div class="flipradar-badge-stat-value">${n(e.median)}</div>
            <div class="flipradar-badge-stat-label">Median</div>
          </div>
          <div class="flipradar-badge-stat">
            <div class="flipradar-badge-stat-value">${n(e.avg)}</div>
            <div class="flipradar-badge-stat-label">Average</div>
          </div>
          <div class="flipradar-badge-stat">
            <div class="flipradar-badge-stat-value">${e.count}</div>
            <div class="flipradar-badge-stat-label">Listings</div>
          </div>
          <div class="flipradar-badge-stat">
            <div class="flipradar-badge-stat-value">&#10003;</div>
            <div class="flipradar-badge-stat-label">Saved</div>
          </div>
        </div>

        <div class="flipradar-badge-footer">
          <span class="flipradar-badge-check">&#10003;</span> Data saved - return to FB Marketplace to see profit
        </div>
      </div>
    `,document.body.appendChild(t),document.getElementById("flipradar-close-badge").addEventListener("click",()=>{t.remove()}),setTimeout(()=>{document.getElementById(l)&&(t.style.transition="opacity 0.5s",t.style.opacity="0",setTimeout(()=>t.remove(),500))},3e4)}function c(){if(!u()){console.log("[FlipRadar] Not a sold listings page, skipping");return}setTimeout(()=>{let e=b();if(!e){console.log("[FlipRadar] No search query found");return}let a=v();if(console.log(`[FlipRadar] Found ${a.length} sold items`),a.length===0){console.log("[FlipRadar] No sold items found on page");return}let r=h(a);console.log("[FlipRadar] Stats:",r),x(e,r,a),_(r,e)},1500)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",c):c();let g=window.location.href,p=null,E=100;new MutationObserver(()=>{p&&clearTimeout(p),p=setTimeout(()=>{window.location.href!==g&&(g=window.location.href,setTimeout(c,1500))},E)}).observe(document.body,{childList:!0,subtree:!0})})();})();
