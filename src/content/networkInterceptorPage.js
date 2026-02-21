// FlipChecker Network Interceptor — Page Context (world: "MAIN")
// Patches fetch() and XMLHttpRequest to capture Facebook GraphQL responses
// and forwards them to the content script via window.postMessage.

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
