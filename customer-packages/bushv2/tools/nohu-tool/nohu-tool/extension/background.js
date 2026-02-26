// Background service worker
console.log('🔧 Background service worker started');

const CAPTCHA_API_BASE = 'https://autocaptcha.pro/apiv3';

// Track running auto sequences to prevent duplicates
const runningAutoSequences = new Set();

// Track captured audio URLs per tab
const capturedAudioUrls = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received:', request.action);

  if (request.action === 'startMultiAutoRegister') {
    console.log('🚀 Starting multi-register with', request.data.urls.length, 'URLs');
    handleMultiAutoRegister(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startWithdrawPasswordSetup') {
    console.log('💰 Starting withdraw password setup with', request.data.urls.length, 'URLs');
    handleWithdrawPasswordSetup(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startMultiAutoLogin') {
    console.log('🔐 Starting multi-login with', request.data.urls.length, 'URLs');
    handleMultiAutoLogin(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startCheckPromotion') {
    console.log('🎁 Starting check promotion with', request.data.urls.length, 'URLs');
    handleCheckPromotion(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'addBankToMultipleSites') {
    console.log('💳 Starting add bank to', request.data.urls.length, 'sites');
    handleAddBankToMultipleSites(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startAutoSequence') {
    console.log('🤖 Starting auto sequence with', request.data.sites.length, 'sites');
    console.log('📋 Received sites:', JSON.stringify(request.data.sites, null, 2));

    // Create unique key for this sequence
    const sequenceKey = JSON.stringify(request.data.sites.map(s => s.registerUrl).sort());

    // Check if already running
    if (runningAutoSequences.has(sequenceKey)) {
      console.error('⚠️ WARNING: This auto sequence is already running! Ignoring duplicate request.');
      sendResponse({ success: false, error: 'Already running' });
      return true;
    }

    // ⚠️ DO NOT mark as running here - only mark when registration actually completes
    // This prevents dashboard from showing "running" before registration is done
    console.log('⏳ Sequence queued (not marked running yet):', sequenceKey.substring(0, 50) + '...');

    // Validate unique sites
    const uniqueRegisterUrls = new Set(request.data.sites.map(s => s.registerUrl));
    if (uniqueRegisterUrls.size !== request.data.sites.length) {
      console.error('⚠️ WARNING: Duplicate sites in request!');
      console.error('Unique:', uniqueRegisterUrls.size, 'Total:', request.data.sites.length);
    }

    // Run sequence and clean up when done
    handleAutoSequence(request.data, sequenceKey).finally(() => {
      runningAutoSequences.delete(sequenceKey);
      console.log('✅ Removed sequence from running set');
    });

    sendResponse({ success: true });
  }

  // Handle API calls from content script (to bypass CORS)
  if (request.action === 'apiCall') {
    console.log('🌐 API Call:', request.data.endpoint);
    handleApiCall(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  // Handle getCapturedAudioUrls from content script
  if (request.action === 'getCapturedAudioUrls') {
    const tabId = sender.tab?.id;
    if (tabId && capturedAudioUrls.has(tabId)) {
      const urls = capturedAudioUrls.get(tabId);
      console.log(`📤 Sending ${urls.length} captured URLs to tab ${tabId}`);
      sendResponse({ urls });
    } else {
      sendResponse({ urls: [] });
    }
    return true;
  }

  return true;
});

// Handle API calls to bypass CORS
async function handleApiCall(data) {
  const { endpoint, method, body, apiKey } = data;

  try {
    console.log(`📤 Fetching: ${endpoint}`);

    const options = {
      method: method || 'GET',
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, options);
    const result = await response.json();

    console.log(`📥 Response:`, result);
    return result;

  } catch (error) {
    console.error('❌ API Call failed:', error);
    throw error;
  }
}

async function handleMultiAutoRegister(data) {
  const { urls, username, password, withdrawPassword, fullname, autoSubmit, apiKey } = data;
  console.log('🎯 Auto Submit Mode:', autoSubmit ? 'ENABLED ✅' : 'DISABLED ❌');
  console.log('🔑 API Key:', apiKey ? (apiKey.substring(0, 10) + '...') : 'NONE');

  console.log(`\n🚀🚀🚀 PARALLEL MODE: ${urls.length} sites`);
  console.log('⚡ Creating ALL tabs RIGHT NOW (no waiting)...\n');

  // Create ALL tabs at once - NO AWAIT in loop!
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`📂 [${i + 1}/${urls.length}] Queueing: ${url}`);

    // Don't await - just push promise
    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      console.log(`✅ Tab ${tab.id} opened: ${url}`);
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  console.log(`\n⏳ Waiting for ALL ${urls.length} tabs to open...`);

  // Wait for ALL tabs to be created
  const createdTabs = await Promise.all(tabPromises);

  console.log(`\n✅✅✅ ALL ${createdTabs.length} TABS OPENED!`);
  console.log('Now processing them in parallel...\n');

  // Process all tabs in parallel
  const fillPromises = createdTabs.map(({ tab, url, index }) => {
    console.log(`⏳ [${index + 1}/${urls.length}] Processing tab ${tab.id}`);

    return waitAndAutoFill(tab.id, username, password, withdrawPassword, fullname, autoSubmit, apiKey)
      .then(() => {
        console.log(`✅ [${index + 1}/${urls.length}] DONE: ${url}`);

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] FAILED: ${url}`, error);
      });
  });

  // Wait for all to complete
  await Promise.all(fillPromises);
  console.log('\n🎉🎉🎉 ALL REGISTRATIONS COMPLETED!\n');
}

// Helper function: Wait for tab to load (max 20s, but proceed immediately when ready)
async function waitForTabReady(tabId, maxSeconds = 20) {
  console.log(`⏳ [Tab ${tabId}] Waiting for page to load (max ${maxSeconds}s)...`);

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = maxSeconds;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        // Check for error pages
        if (tab.url && (tab.url.startsWith('chrome-error://') || tab.url.startsWith('about:') || tab.url === 'chrome://newtab/')) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Error page detected`);
          resolve({ success: false, error: 'Error page' });
          return;
        }

        // Check if page is ready
        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);
          console.log(`✅ [Tab ${tabId}] Page loaded in ${attempts}s`);
          resolve({ success: true, tab });
          return;
        }

        // Timeout
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout after ${maxAttempts}s`);
          resolve({ success: false, error: 'Timeout' });
          return;
        }

      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error.message);
        resolve({ success: false, error: error.message });
      }
    }, 1000);
  });
}

async function waitAndAutoFill(tabId, username, password, withdrawPassword, fullname, autoSubmit = false, apiKey = '') {
  console.log(`⏳ [Tab ${tabId}] Waiting for page load... (Auto Submit: ${autoSubmit ? 'YES' : 'NO'}, API Key: ${apiKey ? 'YES' : 'NO'})`);

  // Wait for page to be ready (max 20s)
  const loadResult = await waitForTabReady(tabId, 20);

  if (!loadResult.success) {
    console.error(`❌ [Tab ${tabId}] Page load failed: ${loadResult.error}`);
    return false;
  }

  const tab = loadResult.tab;
  console.log(`✅ [Tab ${tabId}] Page loaded!`);

  // Wait longer for dynamic content and slow network
  console.log(`⏳ [Tab ${tabId}] Waiting 5 seconds for content to render...`);
  await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 3s to 5s

  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    console.log(`✅ [Tab ${tabId}] Script injected`);

    // Wait longer for initialization
    console.log(`⏳ [Tab ${tabId}] Waiting 4 seconds for script initialization...`);
    await new Promise(resolve => setTimeout(resolve, 4000)); // Increased from 3s to 4s

    // Ping to check if ready
    let ready = false;
    let pingRetries = 10;

    while (pingRetries > 0 && !ready) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        ready = true;
        console.log(`✅ [Tab ${tabId}] Content script ready`);
      } catch (error) {
        pingRetries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      console.error(`❌ [Tab ${tabId}] Content script not ready`);
      return false;
    }

    // STEP 1: Find and click register button first
    console.log(`🔍 [Tab ${tabId}] Step 1: Finding register button...`);
    let registerClicked = false;

    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tabId,
          { action: 'findAndClickRegister' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log(`⚠️ [Tab ${tabId}] Register button not found or already on register page`);
              return false;
            } else if (response && response.success) {
              console.log(`✅ [Tab ${tabId}] Register button clicked!`);
              registerClicked = true;
              resolve(true);
            } else {
              return false;
            }
          }
        );
      });
    } catch (error) {
      console.log(`⚠️ [Tab ${tabId}] Could not click register button:`, error.message);
    }

    // If register button was clicked, wait for page to load
    if (registerClicked) {
      console.log(`⏳ [Tab ${tabId}] Waiting 8 seconds for register page to load...`);
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Re-inject content script on new page
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        console.log(`✅ [Tab ${tabId}] Script re-injected on register page`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.log(`⚠️ [Tab ${tabId}] Could not re-inject script:`, error.message);
      }
    }

    // STEP 2: Send auto-fill message
    console.log(`📝 [Tab ${tabId}] Step 2: Auto-filling form...`);
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tabId,
            {
              action: 'autoFill',
              data: { username, password, withdrawPassword, fullname, autoSubmit, apiKey }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                console.log(`✅ [Tab ${tabId}] Auto-fill successful!`);
                resolve(response);
              } else {
                reject(new Error('No response'));
              }
            }
          );
        });
        success = true;
      } catch (error) {
        retries--;
        console.log(`❌ [Tab ${tabId}] Send failed, retries: ${retries}`);

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Inject error:`, error);
    return false;
  }
}

async function handleWithdrawPasswordSetup(data) {
  const { urls, withdrawPassword } = data;

  console.log(`\n💰💰💰 WITHDRAW PASSWORD SETUP: ${urls.length} sites`);
  console.log('⚡ Creating ALL tabs RIGHT NOW...\n');

  // Create ALL tabs at once
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`📂 [${i + 1}/${urls.length}] Queueing: ${url}`);

    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      console.log(`✅ Tab ${tab.id} opened: ${url}`);
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  console.log(`\n⏳ Waiting for ALL ${urls.length} tabs to open...`);

  const createdTabs = await Promise.all(tabPromises);

  console.log(`\n✅✅✅ ALL ${createdTabs.length} TABS OPENED!`);
  console.log('Now setting withdraw password in parallel...\n');

  // Process all tabs in parallel
  const fillPromises = createdTabs.map(({ tab, url, index }) => {
    console.log(`⏳ [${index + 1}/${urls.length}] Processing tab ${tab.id}`);

    return waitAndSetWithdrawPassword(tab.id, withdrawPassword)
      .then(() => {
        console.log(`✅ [${index + 1}/${urls.length}] DONE: ${url}`);

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateWithdrawProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] FAILED: ${url}`, error);
      });
  });

  await Promise.all(fillPromises);
  console.log('\n🎉🎉🎉 ALL WITHDRAW PASSWORDS SET!\n');
}

async function waitAndSetWithdrawPassword(tabId, withdrawPassword) {
  console.log(`⏳ [Tab ${tabId}] Waiting for page load...`);

  // Wait for page to be ready (max 20s)
  const loadResult = await waitForTabReady(tabId, 20);

  if (!loadResult.success) {
    console.error(`❌ [Tab ${tabId}] Page load failed: ${loadResult.error}`);
    return false;
  }

  const tab = loadResult.tab;
  console.log(`✅ [Tab ${tabId}] Page loaded!`);

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    console.log(`✅ [Tab ${tabId}] Script injected`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Ping to check if ready
    let ready = false;
    let pingRetries = 10;

    while (pingRetries > 0 && !ready) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        ready = true;
        console.log(`✅ [Tab ${tabId}] Content script ready`);
      } catch (error) {
        pingRetries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      console.error(`❌ [Tab ${tabId}] Content script not ready`);
      return false;
    }

    // Send withdraw password setup message
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tabId,
            {
              action: 'setWithdrawPassword',
              data: { withdrawPassword }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                console.log(`✅ [Tab ${tabId}] Withdraw password set!`);
                resolve(response);
              } else {
                reject(new Error('No response'));
              }
            }
          );
        });
        success = true;
      } catch (error) {
        retries--;
        console.log(`❌ [Tab ${tabId}] Send failed, retries: ${retries}`);

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Error:`, error);
    return false;
  }
}

async function handleMultiAutoLogin(data) {
  const { urls, username, password, apiKey, withdrawInfo } = data;

  console.log(`\n🔐🔐🔐 LOGIN MODE: ${urls.length} sites`);
  console.log('⚡ Creating ALL tabs RIGHT NOW...\n');

  // Create ALL tabs at once
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`📂 [${i + 1}/${urls.length}] Queueing: ${url}`);

    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      console.log(`✅ Tab ${tab.id} opened: ${url}`);
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  console.log(`\n⏳ Waiting for ALL ${urls.length} tabs to open...`);

  const createdTabs = await Promise.all(tabPromises);

  console.log(`\n✅✅✅ ALL ${createdTabs.length} TABS OPENED!`);
  console.log('Now processing login in parallel...\n');

  // Process all tabs in parallel
  const loginPromises = createdTabs.map(({ tab, url, index }) => {
    console.log(`⏳ [${index + 1}/${urls.length}] Processing login tab ${tab.id}`);

    return waitAndAutoLogin(tab.id, username, password, apiKey, withdrawInfo)
      .then(() => {
        console.log(`✅ [${index + 1}/${urls.length}] LOGIN DONE: ${url}`);

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateLoginProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] LOGIN FAILED: ${url}`, error);
      });
  });

  await Promise.all(loginPromises);
  console.log('\n🎉🎉🎉 ALL LOGINS COMPLETED!\n');
}

async function waitAndAutoLogin(tabId, username, password, apiKey, withdrawInfo) {
  console.log(`⏳ [Tab ${tabId}] Waiting for page load...`);

  // Wait for page to be ready (max 20s)
  const loadResult = await waitForTabReady(tabId, 20);

  if (!loadResult.success) {
    console.error(`❌ [Tab ${tabId}] Page load failed: ${loadResult.error}`);
    return false;
  }

  const tab = loadResult.tab;
  console.log(`✅ [Tab ${tabId}] Page loaded!`);

  console.log(`⏳ [Tab ${tabId}] Waiting 5 seconds for content to render...`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    console.log(`✅ [Tab ${tabId}] Script injected`);

    console.log(`⏳ [Tab ${tabId}] Waiting 4 seconds for script initialization...`);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Ping to check if ready
    let ready = false;
    let pingRetries = 10;

    while (pingRetries > 0 && !ready) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        ready = true;
        console.log(`✅ [Tab ${tabId}] Content script ready`);
      } catch (error) {
        pingRetries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      console.error(`❌ [Tab ${tabId}] Content script not ready`);
      return false;
    }

    // STEP 1: Find and click login button first
    console.log(`🔍 [Tab ${tabId}] Step 1: Finding login button...`);
    let loginClicked = false;

    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tabId,
          { action: 'findAndClickLogin' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log(`⚠️ [Tab ${tabId}] Login button not found or already on login page`);
              return false;
            } else if (response && response.success) {
              console.log(`✅ [Tab ${tabId}] Login button clicked!`);
              loginClicked = true;
              resolve(true);
            } else {
              return false;
            }
          }
        );
      });
    } catch (error) {
      console.log(`⚠️ [Tab ${tabId}] Could not click login button:`, error.message);
    }

    // If login button was clicked, wait for page to load
    if (loginClicked) {
      console.log(`⏳ [Tab ${tabId}] Waiting 8 seconds for login page to load...`);
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Re-inject content script on new page
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        console.log(`✅ [Tab ${tabId}] Script re-injected on login page`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.log(`⚠️ [Tab ${tabId}] Could not re-inject script:`, error.message);
      }
    }

    // STEP 2: Send auto-login message
    console.log(`🔐 [Tab ${tabId}] Step 2: Sending auto-login message...`);
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tabId,
            {
              action: 'autoLogin',
              data: { username, password, apiKey, withdrawInfo }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                console.log(`✅ [Tab ${tabId}] Auto-login successful!`);
                resolve(response);
              } else {
                reject(new Error('No response'));
              }
            }
          );
        });
        success = true;
      } catch (error) {
        retries--;
        console.log(`❌ [Tab ${tabId}] Send failed, retries: ${retries}`);

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Inject error:`, error);
    return false;
  }
}

async function handleCheckPromotion(data) {
  const { urls, username, apiKey } = data;

  console.log(`\n🎁🎁🎁 CHECK PROMOTION MODE: ${urls.length} sites`);
  console.log('⚡ Creating separate window for EACH site...\n');

  // Create separate window for EACH site
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`🪟 [${i + 1}/${urls.length}] Creating window for: ${url}`);

    const promise = chrome.windows.create({
      url: url,
      focused: false,
      type: 'normal'
    }).then(window => {
      // Get the tab from the window
      const tab = window.tabs[0];
      console.log(`✅ Window ${window.id} with tab ${tab.id} created: ${url}`);
      return { tab, window, url, index: i };
    });

    tabPromises.push(promise);
  }

  console.log(`\n⏳ Waiting for ALL ${urls.length} windows to open...`);

  const createdTabs = await Promise.all(tabPromises);

  console.log(`\n✅✅✅ ALL ${createdTabs.length} WINDOWS OPENED!`);
  console.log('⚡ Processing in PARALLEL (all at once) - each has its own window!\n');

  // 🔥 PROCESS IN PARALLEL - each window is independent
  const promoPromises = createdTabs.map(async ({ tab, window, url, index }) => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⏳ [${index + 1}/${urls.length}] Processing: ${url}`);
    console.log(`🎯 Window ${window.id} (independent)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const promotions = await waitAndCheckPromotion(tab.id, window.id, url, username, apiKey);
      console.log(`✅ [${index + 1}/${urls.length}] PROMO CHECK DONE: ${url}`);

      // Send result to popup
      try {
        chrome.runtime.sendMessage({
          action: 'promoResult',
          data: { site: getSiteName(url), promotions: promotions }
        });
      } catch (e) { }

      return { success: true, url };
    } catch (error) {
      console.error(`❌ [${index + 1}/${urls.length}] PROMO CHECK FAILED: ${url}`, error);
      return { success: false, url, error: error.message };
    }
  });

  // Wait for all to complete
  console.log(`\n⏳ Waiting for all ${createdTabs.length} promo checks to complete...\n`);
  const results = await Promise.all(promoPromises);

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎉🎉🎉 ALL PROMOTION CHECKS COMPLETED!`);
  console.log(`✅ Success: ${successCount}/${urls.length} sites\n`);
}

async function waitAndCheckPromotion(tabId, windowId, url, username, apiKey) {
  console.log(`⏳ [Tab ${tabId}] Waiting for page load...`);

  // Wait for page to be ready (max 20s)
  const loadResult = await waitForTabReady(tabId, 20);

  if (!loadResult.success) {
    console.error(`❌ [Tab ${tabId}] Page load failed: ${loadResult.error}`);
    return [];
  }

  const tab = loadResult.tab;
  console.log(`✅ [Tab ${tabId}] Page loaded!`);

  // 🔥 FOCUS WINDOW TO PREVENT THROTTLING
  console.log(`🎯 [Tab ${tabId}] Focusing window ${windowId} to prevent throttling...`);
  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });

  console.log(`⏳ [Tab ${tabId}] Waiting 5 seconds for content to render...`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Inject captcha solver first
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['captcha-solver.js']
    });

    // Then inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    console.log(`✅ [Tab ${tabId}] Scripts injected`);

    console.log(`⏳ [Tab ${tabId}] Waiting 4 seconds for script initialization...`);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Ping to check if ready
    let ready = false;
    let pingRetries = 10;

    while (pingRetries > 0 && !ready) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        ready = true;
        console.log(`✅ [Tab ${tabId}] Content script ready`);
      } catch (error) {
        pingRetries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      console.error(`❌ [Tab ${tabId}] Content script not ready`);
      return [];
    }

    // 🔥 FOCUS TAB AGAIN BEFORE SENDING MESSAGE (critical for API calls)
    console.log(`🎯 [Tab ${tabId}] Focusing tab before check promotion...`);
    await chrome.tabs.update(tabId, { active: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send check promotion message with API key
    console.log(`🎁 [Tab ${tabId}] Sending check promotion message...`);
    let retries = 3;
    let promotions = [];

    while (retries > 0) {
      try {
        promotions = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tabId,
            { action: 'checkPromotion', data: { username, apiKey } },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                console.log(`✅ [Tab ${tabId}] Check promotion successful!`);
                resolve(response.promotions || []);
              } else {
                reject(new Error('No response'));
              }
            }
          );
        });
        break;
      } catch (error) {
        retries--;
        console.log(`❌ [Tab ${tabId}] Send failed, retries: ${retries}`);

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return promotions;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Inject error:`, error);
    return [];
  }
}



// Handle add bank to multiple sites (runs in background, independent of popup)
async function handleAddBankToMultipleSites(data) {
  const { urls, withdrawInfo } = data;
  console.log(`💳 Processing ${urls.length} sites with bank info:`, withdrawInfo);

  // Process all URLs in parallel
  const promises = urls.map(async (url, index) => {
    console.log(`\n🔄 [${index + 1}/${urls.length}] Starting: ${url}`);

    try {
      // Extract domain from URL to match existing tabs
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Find existing tab with same domain
      const allTabs = await chrome.tabs.query({});
      let existingTab = allTabs.find(tab => {
        if (!tab.url) return false;
        try {
          const tabUrl = new URL(tab.url);
          return tabUrl.hostname === domain;
        } catch {
          return false;
        }
      });

      if (!existingTab) {
        console.warn(`⚠️ [${index + 1}] No existing tab found for domain: ${domain}`);
        console.warn(`⚠️ [${index + 1}] Please login to this site first: ${url}`);
        return {
          success: false,
          url,
          error: 'Trang chưa đăng nhập. Vui lòng đăng nhập trước.'
        };
      }

      console.log(`♻️ [${index + 1}] Found existing tab: ${existingTab.id} (${existingTab.url})`);
      const tab = existingTab;

      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log(`✅ [${index + 1}] Content script injected`);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send message to redirect and fill
      await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: 'redirectToWithdrawAndFill',
            data: { withdrawInfo }
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(`❌ [${index + 1}] Error:`, chrome.runtime.lastError);
            } else if (response && response.success) {
              console.log(`✅ [${index + 1}] Redirected to withdraw page`);
            }
            resolve();
          }
        );
      });

      console.log(`✅ [${index + 1}] Completed: ${url}`);
      return { success: true, url };

    } catch (error) {
      console.error(`❌ [${index + 1}] Error processing ${url}:`, error);
      return { success: false, url, error: error.message };
    }
  });

  // Wait for all to complete
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  const failedResults = results.filter(r => !r.success);

  console.log(`\n✅ Completed! ${successCount}/${urls.length} sites processed successfully`);

  if (failedResults.length > 0) {
    console.warn(`\n⚠️ Failed sites (${failedResults.length}):`);
    failedResults.forEach(result => {
      console.warn(`  - ${result.url}: ${result.error}`);
    });

    // Send notification to popup about failed sites
    try {
      chrome.runtime.sendMessage({
        action: 'addBankCompleted',
        data: {
          success: successCount,
          failed: failedResults.length,
          total: urls.length,
          failedSites: failedResults
        }
      });
    } catch (e) {
      console.log('Could not send completion message to popup');
    }
  } else {
    // All succeeded
    try {
      chrome.runtime.sendMessage({
        action: 'addBankCompleted',
        data: {
          success: successCount,
          failed: 0,
          total: urls.length,
          failedSites: []
        }
      });
    } catch (e) {
      console.log('Could not send completion message to popup');
    }
  }

  return results;
}


// Handle auto sequence: Register → Login → Add Bank for each site
async function handleAutoSequence(data, sequenceKey) {
  const { sites, username, password, withdrawPassword, fullname, bankName, bankBranch, accountNumber, apiKey } = data;

  console.log(`\n🤖🤖🤖 AUTO SEQUENCE MODE: ${sites.length} sites`);
  console.log('📋 Sites data:', JSON.stringify(sites, null, 2));
  console.log('👤 Username:', username);
  console.log('🏦 Bank:', bankName);
  console.log('Will run: Register → Login → Add Bank for each site\n');

  if (!sites || sites.length === 0) {
    console.error('❌ No sites provided!');
    return;
  }

  const totalSteps = sites.length * 4; // 4 steps per site (register, login, add bank, check promo)
  let currentStep = 0;

  // ✅ Mark as running NOW (when sequence actually starts processing)
  runningAutoSequences.add(sequenceKey);
  console.log('✅ Marked sequence as running:', sequenceKey.substring(0, 50) + '...');

  // Create login window ONCE before parallel processing
  // IMPORTANT: Declare outside of map() so all parallel tasks share the same variables
  let sharedLoginWindow = null;
  let sharedLoginWindowPromise = null; // Will be set when first site needs it

  // Process ALL sites in PARALLEL
  const promises = sites.map(async (site, i) => {
    try {
      const siteName = getSiteName(site.registerUrl);

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🤖 [${i + 1}/${sites.length}] Starting: ${siteName}`);
      console.log(`   Register URL: ${site.registerUrl}`);
      console.log(`   Login URL: ${site.loginUrl}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // STEP 1: Register
      console.log(`📝 [${i + 1}] STEP 1/3: Registering on ${siteName}...`);
      currentStep++;
      updateAutoProgress(currentStep, totalSteps, `Đăng ký ${siteName}`);

      let registerTab = null;
      let registerSuccess = false;
      try {
        registerTab = await processAutoRegister(site.registerUrl, username, password, withdrawPassword, fullname, apiKey);
        console.log(`✅ [${i + 1}] Register completed for ${siteName}`);
        registerSuccess = true;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ [${i + 1}] Register failed for ${siteName}:`, error);
        console.log(`⏭️ [${i + 1}] Skipping login and add bank due to register failure`);

        // Close register tab if exists
        if (registerTab) {
          try {
            await chrome.tabs.remove(registerTab.id);
          } catch (e) { }
        }

        // Skip remaining steps
        currentStep += 2; // Skip login and add bank steps
        return { success: false, site: siteName, error: 'Register failed' };
      }

      // STEP 2: Login (only if register succeeded)
      if (!registerSuccess) {
        console.log(`⏭️ [${i + 1}] Skipping login - register failed`);
        currentStep += 2;
        return { success: false, site: siteName, error: 'Register failed' };
      }

      console.log(`🔐 [${i + 1}] STEP 2/3: Logging in to ${siteName}...`);
      currentStep++;
      updateAutoProgress(currentStep, totalSteps, `Đăng nhập ${siteName}`);

      // Create login window NOW (only once, shared by all sites)
      // Use a promise to ensure only one window is created even in parallel
      console.log(`🔍 [${i + 1}] Login window status: sharedLoginWindow=${!!sharedLoginWindow}, sharedLoginWindowPromise=${!!sharedLoginWindowPromise}`);

      if (!sharedLoginWindow) {
        // Check if another site is already creating the window
        if (!sharedLoginWindowPromise) {
          console.log(`🪟 [${i + 1}] I am the FIRST - Creating shared login window...`);
          sharedLoginWindowPromise = chrome.windows.create({
            url: 'about:blank',
            focused: false,
            type: 'normal'
          });
        } else {
          console.log(`⏳ [${i + 1}] Another site is already creating window, waiting...`);
        }

        // Wait for the window to be created (either by this site or another)
        sharedLoginWindow = await sharedLoginWindowPromise;
        console.log(`✅ [${i + 1}] Got shared login window: ${sharedLoginWindow.id}`);
      } else {
        console.log(`♻️ [${i + 1}] Reusing existing shared login window: ${sharedLoginWindow.id}`);
      }

      let loginResult = null;
      let loginSuccess = false;
      try {
        loginResult = await processAutoLogin(site.loginUrl, username, password, apiKey, registerTab, sharedLoginWindow);
        console.log(`✅ [${i + 1}] Login completed for ${siteName}`);
        loginSuccess = true;
        // Register tab is already closed inside processAutoLogin after successful login
        registerTab = null; // Clear reference
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ [${i + 1}] Login failed for ${siteName}:`, error);
        console.log(`⏭️ [${i + 1}] Skipping add bank due to login failure`);

        // Close register tab if login failed
        if (registerTab) {
          console.log(`🗑️ [${i + 1}] Closing register tab ${registerTab.id} due to login failure...`);
          try {
            await chrome.tabs.remove(registerTab.id);
            console.log(`✅ [${i + 1}] Register tab closed`);
          } catch (e) {
            console.log(`⚠️ [${i + 1}] Could not close register tab:`, e.message);
          }
        }

        // Skip add bank step
        currentStep += 1;
        return { success: false, site: siteName, error: 'Login failed' };
      }

      // STEP 3: Add Bank (only if login succeeded)
      if (!loginSuccess) {
        console.log(`⏭️ [${i + 1}] Skipping add bank and check promo - login failed`);
        currentStep += 2; // Skip add bank and check promo
        return { success: false, site: siteName, error: 'Login failed' };
      }

      console.log(`💳 [${i + 1}] STEP 3/4: Adding bank to ${siteName}...`);
      currentStep++;
      updateAutoProgress(currentStep, totalSteps, `Thêm bank ${siteName}`);

      let addBankSuccess = false;
      try {
        const addBankResult = await processAddBank(loginResult, bankName, bankBranch, accountNumber);
        console.log(`✅ [${i + 1}] Add bank completed for ${siteName}, result:`, addBankResult);
        addBankSuccess = true;
      } catch (error) {
        console.error(`❌ [${i + 1}] Add bank failed for ${siteName}:`);
        console.error(`   Error message:`, error.message);
        console.error(`   Error stack:`, error.stack);
        console.log(`⏭️ [${i + 1}] Skipping check promo due to add bank failure`);
        currentStep += 1; // Skip check promo
        return { success: false, site: siteName, error: 'Add bank failed: ' + error.message };
      }

      // STEP 4: Check Promotion will be done LATER (sequentially)
      // For now, just return success with login tab info
      console.log(`\n✅ [${i + 1}] Completed register/login/add bank for ${siteName}`);
      console.log(`   Check promo will run later (sequentially)\n`);

      return {
        success: true,
        site: siteName,
        loginTab: loginResult.tab // Pass login tab for check promo later
      };

    } catch (error) {
      console.error(`\n❌❌❌ [${i + 1}] CRITICAL ERROR:`, error);
      return { success: false, site: getSiteName(site.registerUrl), error: error.message };
    }
  });

  // Wait for ALL sites to complete (register, login, add bank)
  console.log(`\n⏳ Waiting for ALL ${sites.length} sites to complete register/login/add bank...\n`);
  const results = await Promise.all(promises);

  const successCount = results.filter(r => r.success && r.loginTab).length;
  console.log(`\n✅ Completed register/login/add bank for ${successCount}/${sites.length} sites`);

  // Debug: Log results to see what we have
  console.log('\n📊 Results summary:');
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.site}: success=${r.success}, hasLoginTab=${!!r.loginTab}`);
  });

  // Now run CHECK PROMO in PARALLEL (each in its own window)
  if (successCount > 0) {
    console.log(`\n🎁🎁🎁 Starting CHECK PROMO phase (parallel - each in own window)...`);
    console.log(`Will create ${successCount} separate windows to avoid throttling\n`);

    // Process all sites in PARALLEL, each in its own window
    const promoPromises = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.success && result.loginTab) {
        const site = sites[i];
        const siteName = getSiteName(site.registerUrl);

        console.log(`🪟 [${i + 1}] Creating window for ${siteName}...`);

        currentStep++;
        updateAutoProgress(currentStep, totalSteps, `Check promo ${siteName}`);

        const promise = (async () => {
          try {
            // Create a NEW window for this site
            const sitePromoWindow = await chrome.windows.create({
              url: 'about:blank',
              focused: false,
              type: 'normal'
            });
            console.log(`✅ [${i + 1}] Created window ${sitePromoWindow.id} for ${siteName}`);

            // Process check promo in this window (use promoUrl if available, fallback to loginUrl)
            const checkPromoUrl = site.promoUrl || site.loginUrl;
            console.log(`🎁 [${i + 1}] Check promo URL: ${checkPromoUrl}`);
            await processCheckPromo(checkPromoUrl, username, apiKey, sitePromoWindow, result.loginTab);
            console.log(`✅ [${i + 1}] Check promo completed for ${siteName}`);
          } catch (error) {
            console.error(`❌ [${i + 1}] Check promo failed for ${siteName}:`, error);
          }
        })();

        promoPromises.push(promise);
      }
    }

    // Wait for all check promos to complete
    console.log(`\n⏳ Waiting for all ${successCount} check promos to complete...\n`);
    await Promise.all(promoPromises);
    console.log(`\n✅ All check promos completed!\n`);
  }

  console.log(`\n🎉🎉🎉 AUTO SEQUENCE COMPLETED!`);
  console.log(`✅ Success: ${successCount}/${sites.length} sites`);
  if (sharedLoginWindow) {
    console.log(`📂 Login window kept open with all login/add bank tabs`);
  }
  console.log(`📂 Each check promo has its own window (${successCount} windows total)`);
  console.log();
}

// Helper function to process register for one site
async function processAutoRegister(url, username, password, withdrawPassword, fullname, apiKey) {
  const tab = await chrome.tabs.create({ url, active: false });
  console.log(`✅ Tab ${tab.id} opened for register: ${url}`);

  // Wait for page load
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Inject content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Find and click register button
  try {
    await sendMessageToTab(tab.id, { action: 'findAndClickRegister' });
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Re-inject after navigation
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.log('Already on register page or button not found');
  }

  // Fill form
  await sendMessageToTab(tab.id, {
    action: 'autoFill',
    data: { username, password, withdrawPassword, fullname, autoSubmit: true, apiKey }
  });

  // Wait for registration to complete and page to redirect
  console.log('⏳ Waiting 3 seconds for registration and redirect...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get current tab URL to see if redirected
  const currentTab = await chrome.tabs.get(tab.id);
  console.log('📍 Current URL after registration:', currentTab.url);

  // Re-inject content script (page may have redirected)
  console.log('🔄 Re-injecting content script after redirect...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log('✅ Content script re-injected');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.log('⚠️ Could not re-inject script:', e.message);
  }

  // Check if registration was successful by checking for token in cookies
  console.log('🔍 Checking registration result by token...');
  console.log('🔍 Sending checkRegistrationResult message to tab', tab.id);
  let registerSuccess = false;

  try {
    const checkResult = await sendMessageToTab(tab.id, { action: 'checkRegistrationResult' });
    console.log('📥 Received checkResult:', JSON.stringify(checkResult));

    if (checkResult && checkResult.success) {
      console.log('✅ Registration successful! Token:', checkResult.token);
      registerSuccess = true;
    } else if (checkResult && checkResult.error) {
      console.error('❌ Registration failed:', checkResult.error);
      throw new Error(`Registration failed: ${checkResult.error}`);
    } else {
      // If no clear result, it might be undefined - treat as error
      console.log('⚠️ checkResult is:', checkResult);
      console.error('❌ No response from content script - registration likely failed');
      throw new Error('No response from content script');
    }
  } catch (error) {
    console.error('❌ Error checking registration result:', error);
    console.error('❌ Error stack:', error.stack);
    // ❌ THROW ERROR - Stop here if register failed
    throw error;
  }

  console.log('📊 Final registerSuccess:', registerSuccess);

  // DON'T close tab yet - keep it open, will close after login
  console.log(`✅ Register tab ${tab.id} kept open for later cleanup`);
  return tab; // Return tab to close later
}

// Helper function to process login for one site (creates tab in SHARED login window)
async function processAutoLogin(url, username, password, apiKey, registerTab, loginWindow) {
  // Verify window still exists
  try {
    await chrome.windows.get(loginWindow.id);
  } catch (e) {
    console.error('❌ Login window no longer exists!');
    throw new Error('Login window was closed');
  }

  // Create tab in the SHARED login window (not a new window)
  // This will automatically replace the about:blank tab if it's the only tab
  const tab = await chrome.tabs.create({
    url,
    windowId: loginWindow.id,
    active: false
  });

  console.log(`✅ Created login tab ${tab.id} in shared window ${loginWindow.id}: ${url}`);

  // NOW close any about:blank tabs AFTER creating the new tab
  try {
    const existingTabs = await chrome.tabs.query({ windowId: loginWindow.id });
    for (const existingTab of existingTabs) {
      // Don't close the tab we just created
      if (existingTab.id !== tab.id &&
        (existingTab.url === 'about:blank' || existingTab.url === 'chrome://newtab/')) {
        console.log('🗑️ Closing blank tab:', existingTab.id);
        try {
          await chrome.tabs.remove(existingTab.id);
          console.log('✅ Blank tab closed');
        } catch (e) {
          console.log('⚠️ Could not close blank tab (may already be closed):', e.message);
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Error querying tabs:', e.message);
  }

  // Wait a bit for tab to stabilize
  await new Promise(resolve => setTimeout(resolve, 500));

  await new Promise(resolve => setTimeout(resolve, 8000));

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Find and click login button
  try {
    await sendMessageToTab(tab.id, { action: 'findAndClickLogin' });
    await new Promise(resolve => setTimeout(resolve, 8000));

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.log('Already on login page or button not found');
  }

  // Login
  await sendMessageToTab(tab.id, {
    action: 'autoLogin',
    data: { username, password, apiKey, withdrawInfo: null }
  });

  // Wait for login to complete and page to redirect/reload
  console.log('⏳ Waiting 15 seconds for login to complete and redirect...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Get current tab URL to see if redirected
  let currentTab = await chrome.tabs.get(tab.id);
  const loginUrl = currentTab.url;
  console.log('📍 Current URL after login submit:', loginUrl);

  // Wait for page to redirect away from login page
  console.log('⏳ Waiting for page to redirect away from login page...');
  let redirectAttempts = 0;
  const maxRedirectAttempts = 15; // 15 seconds max
  let hasRedirected = false;

  while (redirectAttempts < maxRedirectAttempts) {
    currentTab = await chrome.tabs.get(tab.id);
    const currentUrl = currentTab.url.toLowerCase();

    // Check if URL has changed from login page
    if (!currentUrl.includes('/login') && !currentUrl.includes('dang-nhap')) {
      console.log('✅ Page redirected away from login!');
      console.log('📍 New URL:', currentTab.url);
      hasRedirected = true;
      break;
    }

    console.log(`⏳ Still on login page... (${redirectAttempts + 1}/${maxRedirectAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    redirectAttempts++;
  }

  if (!hasRedirected) {
    console.warn('⚠️ Page did not redirect after 15 seconds - may still be on login page');
  }

  // Wait for page to fully load
  console.log('⏳ Waiting for page to fully load...');
  let loadAttempts = 0;
  const maxLoadAttempts = 10; // 10 seconds max

  while (loadAttempts < maxLoadAttempts) {
    currentTab = await chrome.tabs.get(tab.id);
    if (currentTab.status === 'complete') {
      console.log('✅ Page fully loaded');
      break;
    }
    console.log(`⏳ Page still loading... (${loadAttempts + 1}/${maxLoadAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadAttempts++;
  }

  // Wait additional 3 seconds for dynamic content to load
  console.log('⏳ Waiting 3 seconds for dynamic content...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Re-inject content script (page may have redirected/reloaded after login)
  console.log('🔄 Re-injecting content script after login redirect...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log('✅ Content script re-injected after login');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.log('⚠️ Could not re-inject script:', e.message);
  }

  // Check if login was successful by checking for token
  console.log('🔍 Checking login result...');
  let loginSuccess = false;

  try {
    const checkResult = await sendMessageToTab(tab.id, { action: 'checkLoginResult' });

    if (checkResult && checkResult.success) {
      console.log('✅ Login appears successful');
      loginSuccess = true;
    } else if (checkResult && checkResult.error) {
      console.error('❌ Login failed:', checkResult.error);
      throw new Error(`Login failed: ${checkResult.error}`);
    } else {
      // ❌ STRICT MODE: Don't assume success, throw error
      console.error('❌ Could not determine login result - treating as failure');
      throw new Error('Login result unclear - no token found');
    }
  } catch (error) {
    console.error('❌ Error checking login result:', error);
    // ❌ THROW ERROR - Stop here if login failed
    throw error;
  }

  // ✅ Login successful - NOW close the register tab
  console.log(`✅ Login successful! Now closing register tab ${registerTab?.id}...`);
  if (registerTab) {
    try {
      await chrome.tabs.remove(registerTab.id);
      console.log(`✅ Closed register tab ${registerTab.id} after login completed`);
    } catch (e) {
      console.log(`⚠️ Could not close register tab ${registerTab.id}:`, e.message);
    }
  }

  // Return login window and tab for next step (add bank)
  return { window: loginWindow, tab };
}

// Helper function to process add bank for one site (reuse login window/tab)
async function processAddBank(loginResult, bankName, bankBranch, accountNumber) {
  if (!loginResult || !loginResult.tab) {
    console.error('❌ No login tab available for add bank');
    throw new Error('No login tab available');
  }

  const { window: loginWindow, tab } = loginResult;
  console.log(`✅ Reusing login tab ${tab.id} from window ${loginWindow.id} for add bank`);

  // Verify tab still exists
  let currentTab;
  try {
    currentTab = await chrome.tabs.get(tab.id);
  } catch (e) {
    console.error('❌ Login tab no longer exists!');
    throw new Error('Login tab was closed');
  }

  // Wait for page to be fully loaded after login
  console.log('⏳ Waiting for page to be fully loaded after login...');
  let loadAttempts = 0;
  const maxLoadAttempts = 15; // 15 seconds max

  while (loadAttempts < maxLoadAttempts) {
    currentTab = await chrome.tabs.get(tab.id);
    if (currentTab.status === 'complete') {
      console.log('✅ Page fully loaded');
      break;
    }
    console.log(`⏳ Page still loading... (${loadAttempts + 1}/${maxLoadAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadAttempts++;
  }

  // Wait additional 3 seconds for dynamic content
  console.log('⏳ Waiting 3 seconds for dynamic content to render...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Re-inject content script (page may have changed after login)
  console.log('🔄 Re-injecting content script before add bank...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log('✅ Content script injected');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (e) {
    console.error('❌ Failed to inject content script:', e.message);
    throw new Error('Failed to inject content script');
  }

  // Redirect to withdraw page and fill
  console.log('💳 Sending redirectToWithdrawAndFill message...');
  try {
    const response = await sendMessageToTab(tab.id, {
      action: 'redirectToWithdrawAndFill',
      data: {
        withdrawInfo: { bankName, bankBranch, accountNumber }
      }
    });
    console.log('✅ Message sent successfully, response:', response);
  } catch (e) {
    console.error('❌ Failed to send message:', e.message);
    console.error('   This is OK - page may have navigated, will auto-inject');
    // Don't throw - page will auto-inject script when it detects withdraw page
  }

  // Wait for bank to be added
  console.log('⏳ Waiting 25 seconds for bank to be added...');
  await new Promise(resolve => setTimeout(resolve, 25000));

  // DON'T close the tab - keep it open so user can see the result
  console.log(`✅ Keeping login tab ${tab.id} open for user to view result`);

  // Return success (assume success if no exception)
  return true;
}

// Helper function to process check promo for one site (reuse login tab or create new tab)
async function processCheckPromo(url, username, apiKey, promoWindow, loginTab) {
  console.log(`🎁 Starting check promo process...`);

  // Verify promo window still exists
  try {
    await chrome.windows.get(promoWindow.id);
  } catch (e) {
    console.error('❌ Promo window no longer exists!');
    throw new Error('Promo window was closed');
  }

  // DUPLICATE existing login tab to promo window (keep original in login window)
  console.log(`📋 Duplicating login tab ${loginTab.id} to promo window ${promoWindow.id}...`);

  // First, duplicate the tab (it will be created in the same window)
  const duplicatedTab = await chrome.tabs.duplicate(loginTab.id);
  console.log(`✅ Created duplicate tab ${duplicatedTab.id}`);

  // Wait a bit for duplicate to stabilize
  await new Promise(resolve => setTimeout(resolve, 500));

  // Then move the duplicate to promo window
  const tab = await chrome.tabs.move(duplicatedTab.id, {
    windowId: promoWindow.id,
    index: -1
  });

  // Make it active
  await chrome.tabs.update(tab.id, { active: true });

  console.log(`✅ Moved duplicate tab ${tab.id} to promo window ${promoWindow.id}`);

  // Close any about:blank tabs
  try {
    const existingTabs = await chrome.tabs.query({ windowId: promoWindow.id });
    for (const existingTab of existingTabs) {
      if (existingTab.id !== tab.id &&
        (existingTab.url === 'about:blank' || existingTab.url === 'chrome://newtab/')) {
        console.log('🗑️ Closing blank tab:', existingTab.id);
        try {
          await chrome.tabs.remove(existingTab.id);
          console.log('✅ Blank tab closed');
        } catch (e) {
          console.log('⚠️ Could not close blank tab:', e.message);
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Error querying tabs:', e.message);
  }

  // Wait a bit for tab to settle in new window
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get current tab URL to check where we are
  const currentTab = await chrome.tabs.get(tab.id);
  console.log(`📍 Current tab URL: ${currentTab.url}`);

  // Navigate to check promo URL (the url parameter passed to this function)
  console.log(`🎁 Navigating to check promo URL: ${url}`);
  await chrome.tabs.update(tab.id, { url: url });

  // Wait for navigation to complete
  console.log('⏳ Waiting for check promo page to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Wait for page to be fully loaded
  let loadAttempts = 0;
  const maxLoadAttempts = 10;
  while (loadAttempts < maxLoadAttempts) {
    const updatedTab = await chrome.tabs.get(tab.id);
    if (updatedTab.status === 'complete') {
      console.log('✅ Check promo page loaded');
      break;
    }
    console.log(`⏳ Page still loading... (${loadAttempts + 1}/${maxLoadAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadAttempts++;
  }

  // Wait additional time for dynamic content
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Re-inject scripts (to ensure they're fresh after navigation)
  console.log(`🔄 Re-injecting scripts on tab ${tab.id}...`);

  try {
    // Inject captcha solver first
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['captcha-solver.js']
    });

    // Then inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    console.log(`✅ Scripts injected`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (e) {
    console.error(`❌ Failed to inject scripts:`, e.message);
    throw new Error('Failed to inject scripts');
  }

  // 🔥 FOCUS TAB TO PREVENT THROTTLING (critical for API calls)
  console.log(`🎯 Focusing tab ${tab.id} to prevent throttling...`);
  await chrome.tabs.update(tab.id, { active: true });

  // Also focus the window
  if (promoWindow) {
    await chrome.windows.update(promoWindow.id, { focused: true });
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send check promotion message
  console.log(`📤 Sending check promotion message...`);
  try {
    const response = await sendMessageToTab(tab.id, {
      action: 'checkPromotion',
      data: { username, apiKey }
    });
    console.log('✅ Check promotion response:', response);
  } catch (error) {
    console.error('❌ Check promotion failed:', error.message);
    console.error('   This usually means content script is not ready or page not loaded');
  }

  // Wait for check promo to complete
  console.log('⏳ Waiting 30 seconds for check promo to complete...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // DON'T close the tab - keep it open so user can see the result
  console.log(`✅ Keeping tab ${tab.id} open for user to view promo result`);
}

// Helper function to get site name from URL
function getSiteName(url) {
  if (url.includes('1go99') || url.includes('ghhdj')) return 'Go99';
  if (url.includes('8nohu') || url.includes('88111188')) return 'NOHU';
  if (url.includes('1tt88') || url.includes('1bedd')) return 'TT88';
  if (url.includes('mmoo') || url.includes('0mmoo')) return 'MMOO';
  if (url.includes('789p') || url.includes('jvdf76')) return '789P';
  if (url.includes('3333win') || url.includes('336049')) return '33WIN';
  if (url.includes('888vvv') || url.includes('88vv')) return '88VV';
  return 'Unknown';
}

// Helper function to send message to tab with retry
async function sendMessageToTab(tabId, message) {
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      return response;
    } catch (error) {
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

function updateAutoProgress(current, total, status) {
  try {
    chrome.runtime.sendMessage({
      action: 'updateAutoProgress',
      data: { current, total, status }
    });
  } catch (e) {
    // Ignore if popup is closed
  }
}

// Listen for web requests to capture audio URLs
if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const url = details.url;

      // Check if URL is audio-related
      if (url && (
        url.includes('audio') ||
        url.includes('sound') ||
        url.includes('captcha') ||
        url.includes('.mp3') ||
        url.includes('.wav') ||
        url.includes('.ogg') ||
        url.includes('.m4a') ||
        url.match(/\/(audio|sound|captcha|media)\//i)
      )) {
        // Skip Google reCAPTCHA URLs
        const invalidPatterns = [
          'google.com/recaptcha',
          'recaptcha.net',
          'gstatic.com/recaptcha'
        ];

        const urlLower = url.toLowerCase();
        let isInvalid = false;
        for (const pattern of invalidPatterns) {
          if (urlLower.includes(pattern)) {
            isInvalid = true;
            break;
          }
        }

        if (!isInvalid) {
          console.log('🎵 Captured audio URL:', url);

          // Store URL per tab
          const tabId = details.tabId;
          if (tabId && tabId > 0) {
            if (!capturedAudioUrls.has(tabId)) {
              capturedAudioUrls.set(tabId, []);
            }

            const urls = capturedAudioUrls.get(tabId);
            if (!urls.includes(url)) {
              urls.push(url);
              console.log(`📥 Stored audio URL for tab ${tabId}, total: ${urls.length}`);

              // Send to content script
              chrome.tabs.sendMessage(tabId, {
                action: 'audioUrlCaptured',
                url: url
              }).catch(err => {
                console.log('Could not send to content script:', err.message);
              });
            }
          }
        }
      }
    },
    { urls: ['<all_urls>'] }
  );

  console.log('✅ WebRequest listener registered for audio capture');
} else {
  console.warn('⚠️ WebRequest API not available - audio capture disabled');
}
