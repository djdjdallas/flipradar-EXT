// FlipChecker - Background Service Worker

// API base URL
const API_BASE_URL = 'https://www.flipchecker.io';

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
  } else if (message.type === 'captureScreenshot') {
    // Capture visible tab as JPEG screenshot for vision extraction
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipChecker] Screenshot capture error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      // Strip the data URL prefix to get raw base64
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      sendResponse({ success: true, screenshot: base64Data });
    });
    return true; // Keep channel open for async response
  } else if (message.type === 'apiRequest') {
    // Proxy API requests from content scripts to bypass CORS
    // Only allow requests to our own API
    if (!message.url || !message.url.startsWith(API_BASE_URL)) {
      console.warn('[FlipChecker] API proxy blocked request to non-API URL:', message.url);
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
          console.warn('[FlipChecker] API proxy: failed to parse JSON response:', jsonError.message);
          data = null;
        }

        sendResponse({
          ok: response.ok,
          status: response.status,
          data
        });
      } catch (error) {
        console.error('[FlipChecker] API proxy error:', error);
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
    // Validate the callback URL origin matches our API (normalize www vs non-www)
    try {
      const urlObj = new URL(changeInfo.url);
      const apiObj = new URL(API_BASE_URL);
      const normalizeHost = (h) => h.replace(/^www\./, '');
      if (urlObj.protocol !== apiObj.protocol || normalizeHost(urlObj.hostname) !== normalizeHost(apiObj.hostname)) {
        console.warn('[FlipChecker] Auth callback blocked from unexpected origin:', urlObj.origin);
        return;
      }
    } catch {
      console.warn('[FlipChecker] Auth callback URL parse failed:', changeInfo.url);
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
    const refreshToken = urlObj.searchParams.get('refresh_token');
    const userJson = urlObj.searchParams.get('user');

    if (token) {
      const user = userJson ? JSON.parse(decodeURIComponent(userJson)) : null;

      // Store the token, refresh token, and user info
      const storageData = {
        authToken: token,
        user: user
      };
      if (refreshToken) {
        storageData.refreshToken = refreshToken;
      }
      await chrome.storage.local.set(storageData);

      console.log('[FlipChecker] Auth successful, token stored (refresh token:', !!refreshToken, ')');

      // Close the auth tab and show success
      chrome.tabs.remove(tabId);

      // Notify any open extension pages
      chrome.runtime.sendMessage({ type: 'authSuccess', user });
    }
  } catch (error) {
    console.error('[FlipChecker] Auth callback error:', error);
  }
}

// Periodic token refresh — use refresh_token to get a new access token
chrome.alarms.create('tokenRefresh', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tokenRefresh') {
    const result = await chrome.storage.local.get(['authToken', 'refreshToken', 'user']);
    if (!result.authToken) return;

    try {
      // First check if current token is still valid
      const checkResponse = await fetch(`${API_BASE_URL}/api/usage`, {
        headers: {
          'Authorization': `Bearer ${result.authToken}`
        }
      });

      if (checkResponse.ok) {
        console.log('[FlipChecker] Token still valid');
        return;
      }

      if (checkResponse.status === 401 && result.refreshToken) {
        // Token expired — attempt refresh via Supabase
        console.log('[FlipChecker] Token expired, attempting refresh...');
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: result.refreshToken })
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.access_token) {
            const storageUpdate = { authToken: data.access_token };
            if (data.refresh_token) {
              storageUpdate.refreshToken = data.refresh_token;
            }
            await chrome.storage.local.set(storageUpdate);
            console.log('[FlipChecker] Token refreshed successfully');

            // Notify content scripts about the new token
            chrome.tabs.query({ url: '*://www.facebook.com/marketplace/*' }, (tabs) => {
              tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'authSuccess',
                  user: result.user
                }).catch(() => {});
              });
            });
            return;
          }
        }

        // Refresh failed — clear auth
        console.log('[FlipChecker] Token refresh failed, clearing auth');
        await chrome.storage.local.remove(['authToken', 'refreshToken', 'user']);
      } else if (checkResponse.status === 401) {
        // No refresh token available — clear auth
        console.log('[FlipChecker] Token expired, no refresh token available');
        await chrome.storage.local.remove(['authToken', 'user']);
      }
    } catch (error) {
      console.error('[FlipChecker] Token refresh check failed:', error);
    }
  }
});
