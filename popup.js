// FlipRadar - Popup Script

const API_BASE_URL = 'https://flipradar-iaxg.vercel.app';

let authToken = null;
let currentUser = null;
let currentTab = 'cloud';

// Error handling
function showError(message) {
  const errorAlert = document.getElementById('error-alert');
  const errorText = document.getElementById('error-text');
  if (errorAlert && errorText) {
    errorText.textContent = message;
    errorAlert.classList.add('show');
  }
}

function hideError() {
  const errorAlert = document.getElementById('error-alert');
  if (errorAlert) {
    errorAlert.classList.remove('show');
  }
}

// Offline detection
function updateOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    if (!navigator.onLine) {
      indicator.classList.add('show');
    } else {
      indicator.classList.remove('show');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Setup offline detection
  updateOfflineIndicator();
  window.addEventListener('online', updateOfflineIndicator);
  window.addEventListener('offline', updateOfflineIndicator);

  // Setup error dismiss
  const dismissBtn = document.getElementById('error-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', hideError);
  }

  await loadAuthState();
  updateUI();
  setupEventListeners();

  if (authToken) {
    await loadUsage();
    await loadCloudDeals();
  } else {
    loadLocalDeals();
  }
}

async function loadAuthState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'getAuthToken' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipRadar] Error loading auth state:', chrome.runtime.lastError);
        resolve();
        return;
      }
      if (response) {
        authToken = response.token;
        currentUser = response.user;
      }
      resolve();
    });
  });
}

function updateUI() {
  const loginSection = document.getElementById('login-section');
  const userSection = document.getElementById('user-section');
  const statsSection = document.getElementById('stats-section');
  const usageSection = document.getElementById('usage-section');
  const tabsSection = document.getElementById('tabs-section');
  const upgradeBanner = document.getElementById('upgrade-banner');
  const tierBadge = document.getElementById('tier-badge');

  if (authToken && currentUser) {
    // Logged in
    loginSection.style.display = 'none';
    userSection.style.display = 'flex';
    statsSection.style.display = 'flex';
    usageSection.style.display = 'block';
    tabsSection.style.display = 'flex';

    // Show email
    document.getElementById('user-email').textContent = currentUser.email || 'User';

    // Update tier badge
    const tier = currentUser.tier || 'free';
    tierBadge.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    tierBadge.className = 'tier-badge ' + tier;

    // Show upgrade banner for free tier
    if (tier === 'free') {
      upgradeBanner.style.display = 'block';
    } else {
      upgradeBanner.style.display = 'none';
    }
  } else {
    // Not logged in
    loginSection.style.display = 'block';
    userSection.style.display = 'none';
    statsSection.style.display = 'none';
    usageSection.style.display = 'none';
    tabsSection.style.display = 'none';
    upgradeBanner.style.display = 'none';
    tierBadge.textContent = 'Free';
    tierBadge.className = 'tier-badge';
  }
}

function setupEventListeners() {
  // Login button
  document.getElementById('login-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'openLogin' });
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Upgrade button
  document.getElementById('upgrade-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'openUpgrade' });
  });

  // Clear all button
  document.getElementById('clear-all').addEventListener('click', clearAllDeals);

  // Tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => handleTabChange(tab.dataset.tab));
  });

  // Footer links
  document.getElementById('dashboard-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
  });

  document.getElementById('settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${API_BASE_URL}/dashboard/settings` });
  });

  // Listen for auth success
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'authSuccess') {
      loadAuthState().then(() => {
        updateUI();
        loadUsage();
        loadCloudDeals();
      });
    }
  });
}

async function handleLogout() {
  chrome.runtime.sendMessage({ type: 'logout' }, () => {
    if (chrome.runtime.lastError) {
      console.error('[FlipRadar] Error during logout:', chrome.runtime.lastError);
    }
    authToken = null;
    currentUser = null;
    updateUI();
    loadLocalDeals();
  });
}

function handleTabChange(tab) {
  currentTab = tab;

  // Update tab UI
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // Load appropriate deals
  if (tab === 'cloud') {
    loadCloudDeals();
  } else {
    loadLocalDeals();
  }
}

async function loadUsage() {
  if (!authToken) return;

  // Check if offline
  if (!navigator.onLine) {
    console.log('[FlipRadar] Offline, skipping usage fetch');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/usage`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) {
      // Token expired, will be handled by auth refresh
      console.log('[FlipRadar] Token expired');
      return;
    }

    if (!response.ok) {
      console.error('[FlipRadar] Failed to load usage:', response.status);
      return;
    }

    const data = await response.json();

    // Update usage bar
    const used = data.lookups?.used || 0;
    const limit = data.lookups?.limit || 10;
    const percentage = Math.min((used / limit) * 100, 100);

    document.getElementById('usage-text').textContent = `${used}/${limit}`;
    const usageFill = document.getElementById('usage-fill');
    usageFill.style.width = `${percentage}%`;

    // Color based on usage
    usageFill.classList.remove('warning', 'danger');
    if (percentage >= 90) {
      usageFill.classList.add('danger');
    } else if (percentage >= 70) {
      usageFill.classList.add('warning');
    }

    // Update deal count
    document.getElementById('total-saved').textContent = data.deals?.saved || 0;
  } catch (error) {
    console.error('[FlipRadar] Failed to load usage:', error);
    // Don't show error for usage - it's not critical
  }
}

async function loadCloudDeals() {
  if (!authToken) {
    loadLocalDeals();
    return;
  }

  const container = document.getElementById('deals-container');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading deals...</span>
    </div>
  `;

  // Check if offline
  if (!navigator.onLine) {
    showError('You\'re offline. Showing local deals instead.');
    loadLocalDeals();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/deals?limit=20`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 401) {
      showError('Session expired. Please sign in again.');
      loadLocalDeals();
      return;
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    hideError(); // Clear any previous errors
    renderCloudDeals(data.deals || []);
    updateStats(data.deals || []);
  } catch (error) {
    console.error('[FlipRadar] Failed to load cloud deals:', error);
    showError('Unable to load deals. Check your connection.');
    // Fallback to local deals
    loadLocalDeals();
  }
}

function loadLocalDeals() {
  chrome.storage.local.get(['savedDeals'], (result) => {
    const deals = result.savedDeals || [];
    renderLocalDeals(deals);
    updateStats(deals);
  });
}

function renderCloudDeals(deals) {
  const container = document.getElementById('deals-container');

  if (deals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-text">No saved deals yet</div>
        <div class="empty-hint">Browse FB Marketplace and click "Save Deal" to track potential flips</div>
      </div>
    `;
    return;
  }

  const dealsHtml = deals.map(deal => createCloudDealCard(deal)).join('');
  container.innerHTML = `<div class="deals-list">${dealsHtml}</div>`;

  // Add delete button listeners
  container.querySelectorAll('.deal-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dealId = e.target.dataset.id;
      deleteCloudDeal(dealId);
    });
  });
}

function renderLocalDeals(deals) {
  const container = document.getElementById('deals-container');

  if (deals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-text">No local deals saved</div>
        <div class="empty-hint">Deals saved while offline will appear here</div>
      </div>
    `;
    return;
  }

  const dealsHtml = deals.map(deal => createLocalDealCard(deal)).join('');
  container.innerHTML = `<div class="deals-list">${dealsHtml}</div>`;

  // Add delete button listeners
  container.querySelectorAll('.deal-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dealId = e.target.dataset.id;
      deleteLocalDeal(dealId);
    });
  });
}

function createCloudDealCard(deal) {
  const price = deal.user_asking_price ? `$${deal.user_asking_price.toLocaleString()}` : 'N/A';
  const date = formatDate(deal.created_at);

  // Calculate profit if we have eBay data
  let profitHtml = '';
  if (deal.ebay_estimate_low && deal.ebay_estimate_high && deal.user_asking_price) {
    const feeMultiplier = 0.84;
    const profitLow = Math.round((deal.ebay_estimate_low * feeMultiplier) - deal.user_asking_price);
    const profitHigh = Math.round((deal.ebay_estimate_high * feeMultiplier) - deal.user_asking_price);
    const isNegative = profitHigh < 0;
    profitHtml = `
      <div class="deal-profit ${isNegative ? 'negative' : ''}">
        Est. profit: ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
      </div>
    `;
  }

  return `
    <div class="deal-card synced" data-id="${escapeHtml(String(deal.id))}">
      <div class="deal-title" title="${escapeHtml(deal.user_title)}">${escapeHtml(deal.user_title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${price}</span>
        <span class="deal-date">${date}</span>
      </div>
      ${profitHtml}
      <div class="deal-actions">
        <a href="${sanitizeUrl(deal.source_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${deal.ebay_search_url ? `<a href="${sanitizeUrl(deal.ebay_search_url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>` : ''}
        <button class="deal-btn deal-btn-delete" data-id="${escapeHtml(String(deal.id))}" title="Delete">×</button>
      </div>
    </div>
  `;
}

function createLocalDealCard(deal) {
  const price = deal.price ? `$${deal.price.toLocaleString()}` : 'N/A';
  const date = formatDate(deal.savedAt);

  return `
    <div class="deal-card" data-id="${escapeHtml(String(deal.id))}">
      <div class="deal-title" title="${escapeHtml(deal.title)}">${escapeHtml(deal.title)}</div>
      <div class="deal-meta">
        <span class="deal-price">${price}</span>
        <span class="deal-date">${date}</span>
      </div>
      <div class="deal-actions">
        <a href="${sanitizeUrl(deal.url)}" target="_blank" rel="noopener" class="deal-btn deal-btn-fb">View on FB</a>
        ${deal.ebayUrl ? `<a href="${sanitizeUrl(deal.ebayUrl)}" target="_blank" rel="noopener" class="deal-btn deal-btn-ebay">eBay</a>` : ''}
        <button class="deal-btn deal-btn-delete" data-id="${escapeHtml(String(deal.id))}" title="Delete">×</button>
      </div>
    </div>
  `;
}

function updateStats(deals) {
  const totalSaved = deals.length;

  // Count deals saved this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeek = deals.filter(deal => {
    const savedDate = new Date(deal.savedAt || deal.created_at);
    return savedDate >= oneWeekAgo;
  }).length;

  document.getElementById('total-saved').textContent = totalSaved;
  document.getElementById('this-week').textContent = thisWeek;
}

async function deleteCloudDeal(dealId) {
  if (!authToken) return;

  if (!navigator.onLine) {
    showError('Cannot delete while offline.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/deals?id=${dealId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      hideError();
      loadCloudDeals();
    } else {
      showError('Failed to delete deal. Please try again.');
    }
  } catch (error) {
    console.error('[FlipRadar] Failed to delete deal:', error);
    showError('Failed to delete deal. Check your connection.');
  }
}

function deleteLocalDeal(dealId) {
  chrome.storage.local.get(['savedDeals'], (result) => {
    const deals = result.savedDeals || [];
    const filtered = deals.filter(d => d.id !== dealId);
    chrome.storage.local.set({ savedDeals: filtered }, () => {
      renderLocalDeals(filtered);
      updateStats(filtered);
    });
  });
}

function clearAllDeals() {
  if (!confirm('Are you sure you want to clear all deals?')) return;

  if (currentTab === 'cloud' && authToken) {
    // Would need a bulk delete endpoint - for now just refresh
    alert('Please delete deals individually from the cloud tab, or use the dashboard for bulk actions.');
  } else {
    chrome.storage.local.set({ savedDeals: [] }, () => {
      renderLocalDeals([]);
      updateStats([]);
    });
  }
}

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}
