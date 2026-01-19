// FlipRadar Authentication Management
// Handles auth state initialization and auth success events

import { setState, getState, getAuthToken } from './state.js';

/**
 * Initialize auth state from Chrome storage via background worker
 * @returns {Promise<void>}
 */
export async function initAuth() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'getAuthToken' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipRadar] Error loading auth state:', chrome.runtime.lastError);
        resolve();
        return;
      }

      if (response) {
        setState({
          authToken: response.token,
          currentUser: response.user
        });
        console.log('[FlipRadar] Auth state loaded:', response.user?.email || 'no user');
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
      console.log('[FlipRadar] Auth success received');
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
      console.log('[FlipRadar] Received sold data from eBay:', message.data);
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
