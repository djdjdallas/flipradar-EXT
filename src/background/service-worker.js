// FlipRadar - Background Service Worker

// API base URL
const API_BASE_URL = 'https://flipradar-iaxg.vercel.app';

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openLogin') {
    // Open login page in new tab
    chrome.tabs.create({
      url: `${API_BASE_URL}/auth/extension`
    });
    sendResponse({ success: true });
  } else if (message.type === 'openUpgrade') {
    // Open pricing page in new tab
    chrome.tabs.create({
      url: `${API_BASE_URL}/pricing`
    });
    sendResponse({ success: true });
  } else if (message.type === 'getAuthToken') {
    // Return stored auth token
    chrome.storage.local.get(['authToken', 'user'], (result) => {
      sendResponse({
        token: result.authToken || null,
        user: result.user || null
      });
    });
    return true; // Keep channel open for async response
  } else if (message.type === 'logout') {
    // Clear auth data
    chrome.storage.local.remove(['authToken', 'user'], () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (message.type === 'getApiBaseUrl') {
    sendResponse({ url: API_BASE_URL });
  } else if (message.type === 'soldDataCaptured') {
    // Relay sold data capture events from eBay tabs to FB Marketplace tabs
    chrome.tabs.query({ url: '*://www.facebook.com/marketplace/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'soldDataAvailable',
          data: message.data
        }).catch(() => {}); // Ignore errors for inactive tabs
      });
    });
    sendResponse({ success: true });
  } else if (message.type === 'apiRequest') {
    // Proxy API requests from content scripts to bypass CORS
    // Only allow requests to our own API
    if (!message.url || !message.url.startsWith(API_BASE_URL)) {
      console.warn('[FlipRadar] API proxy blocked request to non-API URL:', message.url);
      sendResponse({
        ok: false,
        status: 0,
        error: 'URL not allowed'
      });
      return true;
    }

    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const fetchOptions = {
          method: message.method || 'GET',
          headers: message.headers || {},
          signal: controller.signal
        };

        // Only add body for non-GET requests
        if (message.body && message.method !== 'GET') {
          fetchOptions.body = JSON.stringify(message.body);
        }

        const response = await fetch(message.url, fetchOptions);

        // Try to parse JSON response
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn('[FlipRadar] API proxy: failed to parse JSON response:', jsonError.message);
          data = null;
        }

        sendResponse({
          ok: response.ok,
          status: response.status,
          data
        });
      } catch (error) {
        console.error('[FlipRadar] API proxy error:', error);
        sendResponse({
          ok: false,
          status: 0,
          error: error.name === 'AbortError' ? 'Request timed out' : error.message
        });
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    return true; // Keep channel open for async response
  }

  return true;
});

// Listen for tab updates to catch auth callback
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('/auth/extension/callback')) {
    // Validate the callback URL origin matches our API
    try {
      const urlObj = new URL(changeInfo.url);
      const apiOrigin = new URL(API_BASE_URL).origin;
      if (urlObj.origin !== apiOrigin) {
        console.warn('[FlipRadar] Auth callback blocked from unexpected origin:', urlObj.origin);
        return;
      }
    } catch {
      console.warn('[FlipRadar] Auth callback URL parse failed:', changeInfo.url);
      return;
    }
    handleAuthCallback(changeInfo.url, tabId);
  }
});

// Handle the auth callback URL
async function handleAuthCallback(url, tabId) {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    const userJson = urlObj.searchParams.get('user');

    if (token) {
      const user = userJson ? JSON.parse(decodeURIComponent(userJson)) : null;

      // Store the token and user info
      await chrome.storage.local.set({
        authToken: token,
        user: user
      });

      console.log('[FlipRadar] Auth successful, token stored');

      // Close the auth tab and show success
      chrome.tabs.remove(tabId);

      // Notify any open extension pages
      chrome.runtime.sendMessage({ type: 'authSuccess', user });
    }
  } catch (error) {
    console.error('[FlipRadar] Auth callback error:', error);
  }
}

// Periodic token refresh (check if token is still valid)
chrome.alarms.create('tokenRefresh', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tokenRefresh') {
    const result = await chrome.storage.local.get(['authToken']);
    if (result.authToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/usage`, {
          headers: {
            'Authorization': `Bearer ${result.authToken}`
          }
        });

        if (response.status === 401) {
          // Token expired, clear it
          await chrome.storage.local.remove(['authToken', 'user']);
          console.log('[FlipRadar] Token expired, cleared');
        }
      } catch (error) {
        console.error('[FlipRadar] Token refresh check failed:', error);
      }
    }
  }
});
