// FlipChecker Authentication Management
// Handles auth state initialization and auth success events

import { API_BASE_URL } from './config.js';
import { setState, getState, getAuthToken } from './state.js';

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Calls the service worker to proxy the request.
 * @returns {Promise<boolean>} - true if refresh succeeded
 */
async function tryRefreshToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['refreshToken', 'user'], (result) => {
      if (!result.refreshToken) {
        resolve(false);
        return;
      }

      console.log('[FlipChecker] Attempting token refresh...');

      chrome.runtime.sendMessage({
        type: 'apiRequest',
        url: `${API_BASE_URL}/api/auth/refresh`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { refresh_token: result.refreshToken }
      }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          console.warn('[FlipChecker] Token refresh failed');
          resolve(false);
          return;
        }

        const data = response.data;
        if (data?.access_token) {
          const storageUpdate = { authToken: data.access_token };
          if (data.refresh_token) {
            storageUpdate.refreshToken = data.refresh_token;
          }
          chrome.storage.local.set(storageUpdate, () => {
            setState({
              authToken: data.access_token,
              currentUser: result.user || null
            });
            console.log('[FlipChecker] Token refreshed successfully');
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    });
  });
}

/**
 * Initialize auth state from Chrome storage directly.
 * If the stored token appears expired, tries to refresh it.
 * @returns {Promise<void>}
 */
export async function initAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'refreshToken', 'user'], async (result) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipChecker] Error reading auth from storage:', chrome.runtime.lastError);
        resolve();
        return;
      }

      if (result.authToken) {
        // Check if JWT is expired by decoding payload
        let isExpired = false;
        try {
          const payload = JSON.parse(atob(result.authToken.split('.')[1]));
          isExpired = payload.exp && (payload.exp * 1000) < Date.now();
        } catch {
          // Can't decode — assume it might be valid
        }

        if (isExpired && result.refreshToken) {
          console.log('[FlipChecker] Stored token expired, refreshing...');
          const refreshed = await tryRefreshToken();
          if (!refreshed) {
            console.log('[FlipChecker] Refresh failed, clearing auth');
            chrome.storage.local.remove(['authToken', 'refreshToken', 'user']);
          }
        } else {
          setState({
            authToken: result.authToken,
            currentUser: result.user || null
          });
          console.log('[FlipChecker] Auth loaded from storage:', result.user?.email || 'token present');
        }
      } else {
        console.log('[FlipChecker] No auth token in storage');
      }
      resolve();
    });
  });
}

/**
 * Listen for auth success messages from background worker
 * Called when user completes login flow
 *
 * @param {Function} callback - Called when auth succeeds
 * @returns {Function} - Cleanup function to remove listener
 */
export function onAuthSuccess(callback) {
  const listener = (message) => {
    if (message.type === 'authSuccess') {
      console.log('[FlipChecker] Auth success received');
      // Clear token so it gets re-fetched
      setState({
        authToken: null,
        currentUser: message.user
      });
      // Re-initialize auth and call callback
      initAuth().then(callback);
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Listen for sold data updates from eBay reader tabs
 * @param {Function} callback - Called with sold data when received
 * @returns {Function} - Cleanup function to remove listener
 */
export function onSoldDataReceived(callback) {
  const listener = (message) => {
    if (message.type === 'soldDataAvailable') {
      console.log('[FlipChecker] Received sold data from eBay:', message.data);
      callback(message.data);
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Check if user is currently logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getAuthToken();
}

/**
 * Get current user info
 * @returns {object|null}
 */
export function getCurrentUser() {
  return getState().currentUser;
}

/**
 * Open login page
 */
export function openLogin() {
  chrome.runtime.sendMessage({ type: 'openLogin' });
}

/**
 * Open upgrade/pricing page
 */
export function openUpgrade() {
  chrome.runtime.sendMessage({ type: 'openUpgrade' });
}
