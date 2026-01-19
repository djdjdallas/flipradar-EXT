// FlipRadar Shared State Management

// Global state object
let state = {
  currentUrl: typeof window !== 'undefined' ? window.location.href : null,
  authToken: null,
  currentUser: null,
  lastExtractedData: null,
  currentJobId: null,
  isExtracting: false
};

/**
 * Get the current state
 * @returns {object}
 */
export function getState() {
  return state;
}

/**
 * Update state with new values
 * @param {object} updates - Key/value pairs to merge into state
 */
export function setState(updates) {
  state = { ...state, ...updates };
}

/**
 * Get auth token from state
 * @returns {string|null}
 */
export function getAuthToken() {
  return state.authToken;
}

/**
 * Get current user from state
 * @returns {object|null}
 */
export function getCurrentUser() {
  return state.currentUser;
}

/**
 * Set last extracted data for comparison on navigation
 * @param {object} data
 */
export function setLastExtractedData(data) {
  state.lastExtractedData = data;
}

/**
 * Get last extracted data
 * @returns {object|null}
 */
export function getLastExtractedData() {
  return state.lastExtractedData;
}

/**
 * Clear last extracted data (called when navigating to new item)
 */
export function clearLastExtractedData() {
  state.lastExtractedData = null;
}

/**
 * Start a new extraction job and return its ID
 * Used for race condition handling - if user navigates while extracting,
 * we can cancel the old job by checking if its ID is still current
 * @returns {string} - Unique job ID
 */
export function startNewJob() {
  const jobId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  state.currentJobId = jobId;
  state.isExtracting = true;
  console.log('[FlipRadar] Started job:', jobId);
  return jobId;
}

/**
 * Check if a job ID is still the current job
 * @param {string} jobId
 * @returns {boolean}
 */
export function isJobCurrent(jobId) {
  return state.currentJobId === jobId;
}

/**
 * End a job (mark extraction as complete)
 * @param {string} jobId
 */
export function endJob(jobId) {
  if (state.currentJobId === jobId) {
    state.isExtracting = false;
    console.log('[FlipRadar] Ended job:', jobId);
  }
}

/**
 * Check if currently extracting
 * @returns {boolean}
 */
export function isExtracting() {
  return state.isExtracting;
}
