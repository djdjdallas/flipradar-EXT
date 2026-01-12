// FlipRadar - Background Service Worker

// API base URL - change to production URL when deploying
const API_BASE_URL = 'http://localhost:3000';

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openLogin') {
    // Open login page in new tab
    chrome.tabs.create({
      url: `${API_BASE_URL}/auth/extension`
    });
    sendResponse({ success: true });
  }

  if (message.type === 'openUpgrade') {
    // Open pricing page in new tab
    chrome.tabs.create({
      url: `${API_BASE_URL}/pricing`
    });
    sendResponse({ success: true });
  }

  if (message.type === 'getAuthToken') {
    // Return stored auth token
    chrome.storage.local.get(['authToken', 'user'], (result) => {
      sendResponse({
        token: result.authToken || null,
        user: result.user || null
      });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'logout') {
    // Clear auth data
    chrome.storage.local.remove(['authToken', 'user'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'getApiBaseUrl') {
    sendResponse({ url: API_BASE_URL });
  }

  return true;
});

// Listen for tab updates to catch auth callback
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('/auth/extension/callback')) {
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
