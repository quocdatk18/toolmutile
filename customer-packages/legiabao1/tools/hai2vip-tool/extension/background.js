// Background service worker

// Keep service worker alive (prevent Chrome from terminating it)
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) return;

  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // Just a dummy call to keep service worker alive
    });
  }, 20000); // Every 20 seconds

}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Start keep-alive when extension loads
startKeepAlive();

// Retry helper with page reload
async function retryWithReload(tabId, url, operation, maxRetries = 2) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {

      const result = await operation();

      if (result !== false) {
        
        return true;
      }

      // If result is false, retry
      throw new Error('Operation returned false');
    } catch (error) {
      attempt++;

      if (attempt <= maxRetries) {
        `);

        try {
          // Reload the page
          await chrome.tabs.reload(tabId);

          // Wait for page to load
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (reloadError) {
          console.error(`❌ [Tab ${tabId}] Reload failed:`, reloadError);
          return false;
        }
      } else {
        console.error(`❌ [Tab ${tabId}] Failed after ${maxRetries + 1} attempts`);
        return false;
      }
    }
  }

  return false;
}

// Track tabs for each operation
const withdrawTabs = new Set();
const registerTabs = new Set();
const loginTabs = new Set();
const promotionTabs = new Set();
const phoneVerifyTabs = new Set();

// Helper function to close old tabs
async function closeOldTabs(tabSet, newTabs) {

  for (const tabId of tabSet) {
    try {
      await chrome.tabs.remove(tabId);
    } catch (error) {
    }
  }

  // Clear old set and add new tabs
  tabSet.clear();
  newTabs.forEach(tabId => tabSet.add(tabId));
}

// Listen for tab navigation to re-inject script if needed
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only handle main frame (not iframes)
  if (details.frameId !== 0) return;

  const tabId = details.tabId;

  // Check if this tab is doing withdraw operation
  if (withdrawTabs.has(tabId)) {
    console.log(`🔄 [Tab ${tabId}] Navigation completed, checking for pending bank add...`);

    // Check if there's pending bank add
    chrome.storage.local.get(['pendingBankAdd'], async (result) => {
      if (result.pendingBankAdd) {
        const age = Date.now() - result.pendingBankAdd.timestamp;

        if (age < 60000) {
          console.log(`💾 [Tab ${tabId}] Found pending bank add, re-injecting script...`);

          try {
            // Wait a bit for page to stabilize
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Re-inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Failed to re-inject:`, error);
          }
        } else {
          // Remove tab from tracking if too old
          withdrawTabs.delete(tabId);
        }
      }
    });
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  withdrawTabs.delete(tabId);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'startMultiAutoRegister') {
    handleMultiAutoRegister(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startMultiLogin') {
    handleMultiLogin(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startMultiWithdraw') {
    console.log('💰 Starting multi-withdraw with', request.data.selectedCount, 'sites');
    handleMultiWithdraw(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startMultiPromotion') {
     with', request.data.urls.length, 'URLs');
    handleMultiPromotionNoPhoneVerify(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startMultiPhoneVerify') {
    console.log('📱 Starting multi-phone-verify with', request.data.selectedCount, 'sites');
    handleMultiPhoneVerify(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'startAutoSequence') {
    handleAutoSequence(request.data);
    sendResponse({ success: true });
  }

  if (request.action === 'getPhoneNumber') {
    console.log('📱 Getting phone number from codesim.net...');
    getPhoneNumberFromCodesim(request.apiKey, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'getOTP') {
    console.log('📩 Getting OTP from codesim.net...');
    getOTPFromCodesim(request.otpId, request.apiKey, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'cancelSim') {
    console.log('🗑️ Cancelling sim from codesim.net...');
    cancelSimFromCodesim(request.simId, request.apiKey, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'savePromotionResult') {
    console.log('💾 Saving promotion result:', request.data);
    savePromotionResult(request.data);
    sendResponse({ success: true });
  }

  return true;
});

async function handleMultiLogin(data) {
  const { urls, username, password } = data;

  // Close old login tabs first
  if (loginTabs.size > 0) {
    await closeOldTabs(loginTabs, []);
  }

  ...\n');

  // Create ALL tabs at once
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  const createdTabs = await Promise.all(tabPromises);

  // Track new tabs
  createdTabs.forEach(({ tab }) => loginTabs.add(tab.id));

  // Process all tabs in parallel with retry
  const loginPromises = createdTabs.map(({ tab, url, index }) => {

    return retryWithReload(
      tab.id,
      url,
      () => waitAndAutoLogin(tab.id, username, password),
      2 // Max 2 retries
    )
      .then((success) => {
        if (success) {
        } else {
          console.error(`❌ [${index + 1}/${urls.length}] FAILED after retries: ${url}`);
        }

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateLoginProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] ERROR: ${url}`, error);
      });
  });

  await Promise.all(loginPromises);
  console.log('\n🎉🎉🎉 ALL LOGINS COMPLETED!\n');
}

async function waitAndAutoLogin(tabId, username, password) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send auto-login message
            let retries = 5;
            let success = false;

            while (retries > 0 && !success) {
              try {
                const tabCheck = await chrome.tabs.get(tabId);
                if (!tabCheck) {
                  resolve(false);
                  return;
                }

                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Message timeout')), 10000);

                  chrome.tabs.sendMessage(
                    tabId,
                    {
                      action: 'autoLogin',
                      data: { username, password }
                    },
                    (response) => {
                      clearTimeout(timeout);

                      if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('Could not establish connection') ||
                          error.includes('Connection closed')) {
                          reject(new Error('RECONNECT_NEEDED'));
                        } else {
                          reject(new Error(error));
                        }
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
                console.log(`❌ [Tab ${tabId}] Send failed (${error.message}), retries left: ${retries}`);

                if (error.message === 'RECONNECT_NEEDED' && retries > 0) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } catch (e) {
                    console.error(`❌ [Tab ${tabId}] Re-inject failed:`, e);
                  }
                }

                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Inject error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

async function handleMultiAutoRegister(data) {
  const { urls, username, password, fullname, autoSubmit } = data;

  // Close old register tabs first
  if (registerTabs.size > 0) {
    await closeOldTabs(registerTabs, []);
  }

  ...\n');

  // Create ALL tabs at once - NO AWAIT in loop!
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    // Don't await - just push promise
    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  // Wait for ALL tabs to be created
  const createdTabs = await Promise.all(tabPromises);

  // Track new tabs
  createdTabs.forEach(({ tab }) => registerTabs.add(tab.id));

  // Process all tabs in parallel with retry
  const fillPromises = createdTabs.map(({ tab, url, index }) => {

    return retryWithReload(
      tab.id,
      url,
      () => waitAndAutoFill(tab.id, username, password, fullname, autoSubmit),
      2 // Max 2 retries (total 3 attempts)
    )
      .then((success) => {
        if (success) {
        } else {
          console.error(`❌ [${index + 1}/${urls.length}] FAILED after retries: ${url}`);
        }

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] ERROR: ${url}`, error);
      });
  });

  // Wait for all to complete
  await Promise.all(fillPromises);
  console.log('\n🎉🎉🎉 ALL REGISTRATIONS COMPLETED!\n');
}

async function waitAndAutoLogin(tabId, username, password) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send auto-login message
            let retries = 5;
            let success = false;

            while (retries > 0 && !success) {
              try {
                const tabCheck = await chrome.tabs.get(tabId);
                if (!tabCheck) {
                  resolve(false);
                  return;
                }

                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Message timeout')), 10000);

                  chrome.tabs.sendMessage(
                    tabId,
                    {
                      action: 'autoLogin',
                      data: { username, password }
                    },
                    (response) => {
                      clearTimeout(timeout);

                      if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('Could not establish connection') ||
                          error.includes('Connection closed')) {
                          reject(new Error('RECONNECT_NEEDED'));
                        } else {
                          reject(new Error(error));
                        }
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
                console.log(`❌ [Tab ${tabId}] Send failed (${error.message}), retries left: ${retries}`);

                if (error.message === 'RECONNECT_NEEDED' && retries > 0) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } catch (e) {
                    console.error(`❌ [Tab ${tabId}] Re-inject failed:`, e);
                  }
                }

                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Inject error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

async function waitAndAutoFill(tabId, username, password, fullname, autoSubmit) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40; // Increased from 25 to 40 (40 seconds)

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          // Wait longer for dynamic content and slow network
          
          await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 3s to 5s

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

            // Wait longer for initialization
            
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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send auto-fill message with better error handling
            let retries = 5; // Increased from 3 to 5
            let success = false;

            while (retries > 0 && !success) {
              try {
                // Check if tab still exists before sending
                const tabCheck = await chrome.tabs.get(tabId);
                if (!tabCheck) {
                  console.error(`❌ [Tab ${tabId}] Tab no longer exists`);
                  resolve(false);
                  return;
                }

                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error('Message timeout'));
                  }, 10000); // 10 second timeout

                  chrome.tabs.sendMessage(
                    tabId,
                    {
                      action: 'autoFill',
                      data: { username, password, fullname, autoSubmit }
                    },
                    (response) => {
                      clearTimeout(timeout);

                      if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        console.log(`⚠️ [Tab ${tabId}] Runtime error: ${error}`);

                        // If connection closed, try to re-inject script
                        if (error.includes('Could not establish connection') ||
                          error.includes('Connection closed')) {
                          reject(new Error('RECONNECT_NEEDED'));
                        } else {
                          reject(new Error(error));
                        }
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
                console.log(`❌ [Tab ${tabId}] Send failed (${error.message}), retries left: ${retries}`);

                // If connection error, try to re-inject script
                if (error.message === 'RECONNECT_NEEDED' && retries > 0) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } catch (e) {
                    console.error(`❌ [Tab ${tabId}] Re-inject failed:`, e);
                  }
                }

                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
                }
              }
            }

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Inject error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

async function handleWithdrawPasswordSetup(data) {
  const { urls, withdrawPassword } = data;

  console.log(`\n💰💰💰 WITHDRAW PASSWORD SETUP: ${urls.length} sites`);

  // Create ALL tabs at once
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  const createdTabs = await Promise.all(tabPromises);

  console.log('Now setting withdraw password in parallel...\n');

  // Process all tabs in parallel
  const fillPromises = createdTabs.map(({ tab, url, index }) => {

    return waitAndSetWithdrawPassword(tab.id, withdrawPassword)
      .then(() => {

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

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 25;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 3000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send withdraw password setup message with better error handling
            let retries = 5;
            let success = false;

            while (retries > 0 && !success) {
              try {
                const tabCheck = await chrome.tabs.get(tabId);
                if (!tabCheck) {
                  resolve(false);
                  return;
                }

                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Message timeout')), 10000);

                  chrome.tabs.sendMessage(
                    tabId,
                    {
                      action: 'setWithdrawPassword',
                      data: { withdrawPassword }
                    },
                    (response) => {
                      clearTimeout(timeout);

                      if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('Could not establish connection') ||
                          error.includes('Connection closed')) {
                          reject(new Error('RECONNECT_NEEDED'));
                        } else {
                          reject(new Error(error));
                        }
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
                console.log(`❌ [Tab ${tabId}] Send failed (${error.message}), retries: ${retries}`);

                if (error.message === 'RECONNECT_NEEDED' && retries > 0) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } catch (e) {
                    console.error(`❌ [Tab ${tabId}] Re-inject failed:`, e);
                  }
                }

                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

async function handleMultiWithdraw(data) {
  const { selectedCount, withdrawPassword, bankAccount, bankName } = data;

  console.log(`\n💰💰💰 MULTI WITHDRAW SETUP: ${selectedCount} sites`);

  // Get all existing tabs (should be tabs from register or login)
  const allTabs = await chrome.tabs.query({});

  // Filter tabs that are on betting sites (not chrome:// or extension pages)
  const bettingTabs = allTabs.filter(tab => {
    if (!tab.url) return false;
    return tab.url.startsWith('http://') || tab.url.startsWith('https://');
  });

  // Take only the number of tabs user selected
  const tabsToProcess = bettingTabs.slice(0, selectedCount);

  if (tabsToProcess.length === 0) {
    return;
  }

  console.log('Now setting up withdraw in parallel...\n');

  // Track skipped and completed
  let skippedCount = 0;
  let completedCount = 0;

  // Process all tabs in parallel
  const fillPromises = tabsToProcess.map((tab, index) => {
    `);

    // Add tab to tracking
    withdrawTabs.add(tab.id);

    // Directly call withdraw setup (tab is already on the site)
    return waitAndGoToWithdraw(tab.id, withdrawPassword, bankAccount, bankName)
      .then((result) => {
        if (result && result.skipped) {
          skippedCount++;
          console.log(`⏭️ [${index + 1}/${selectedCount}] SKIPPED (already has bank): ${tab.url}`);
        } else if (result) {
          completedCount++;
        } else {
          console.error(`❌ [${index + 1}/${selectedCount}] FAILED: ${tab.url}`);
        }

        // Remove from tracking after completion
        withdrawTabs.delete(tab.id);

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updateWithdrawProgress',
            data: { current: index + 1, total: selectedCount, skipped: skippedCount }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${selectedCount}] ERROR: ${tab.url}`, error);
        withdrawTabs.delete(tab.id);
      });
  });

  await Promise.all(fillPromises);
  console.log(`\n🎉🎉🎉 ALL WITHDRAW SETUPS COMPLETED!`);
  console.log(`   ✅ Completed: ${completedCount}`);
  console.log(`   ⏭️ Skipped (already has bank): ${skippedCount}\n`);
}

async function waitAndGoToWithdraw(tabId, withdrawPassword, bankAccount, bankName) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send go to withdraw message with better error handling
            let retries = 5;
            let result = null;

            while (retries > 0 && !result) {
              try {
                const tabCheck = await chrome.tabs.get(tabId);
                if (!tabCheck) {
                  resolve(false);
                  return;
                }

                result = await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Message timeout')), 15000); // Longer timeout for withdraw

                  chrome.tabs.sendMessage(
                    tabId,
                    {
                      action: 'goToWithdraw',
                      data: { withdrawPassword, bankAccount, bankName }
                    },
                    (response) => {
                      clearTimeout(timeout);

                      if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('Could not establish connection') ||
                          error.includes('Connection closed')) {
                          reject(new Error('RECONNECT_NEEDED'));
                        } else {
                          reject(new Error(error));
                        }
                      } else if (response && response.success) {
                        if (response.skipped) {
                          console.log(`⏭️ [Tab ${tabId}] Bank already exists, skipped!`);
                        } else {
                          console.log(`✅ [Tab ${tabId}] Withdraw setup successful!`);
                        }
                        resolve(response);
                      } else {
                        reject(new Error('No response'));
                      }
                    }
                  );
                });
              } catch (error) {
                retries--;
                console.log(`❌ [Tab ${tabId}] Send failed (${error.message}), retries: ${retries}`);

                if (error.message === 'RECONNECT_NEEDED' && retries > 0) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } catch (e) {
                    console.error(`❌ [Tab ${tabId}] Re-inject failed:`, e);
                  }
                }

                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              }
            }

            resolve(result || false);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

// PROMOTION HANDLER - Without phone verification

async function handleMultiPromotionNoPhoneVerify(data) {
  const { urls } = data;

  console.log(`\n🎁 MULTI PROMOTION (No Phone Verify): ${urls.length} sites`);

  // Close old promotion tabs first
  if (promotionTabs.size > 0) {
    console.log(`🗑️ Closing ${promotionTabs.size} old promotion tabs...`);
    await closeOldTabs(promotionTabs, []);
  }

  console.log('⚡ Opening promotion pages and auto-claiming...\n');

  // Create all tabs
  const tabPromises = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    const promise = chrome.tabs.create({
      url: url,
      active: false
    }).then(tab => {
      return { tab, url, index: i };
    });

    tabPromises.push(promise);
  }

  const createdTabs = await Promise.all(tabPromises);

  // Track new tabs
  createdTabs.forEach(({ tab }) => promotionTabs.add(tab.id));

  // Process all tabs in parallel WITHOUT retry (promotion errors are business errors, not technical)
  const claimPromises = createdTabs.map(({ tab, url, index }) => {

    return waitAndClaimPromotionNoPhoneVerify(tab.id, index, urls.length)
      .then((result) => {
        if (result && result.success) {
        } else if (result && result.error) {
          console.log(`⚠️ [${index + 1}/${urls.length}] Business error (no retry): ${result.error.substring(0, 50)}...`);
        } else {
          console.error(`❌ [${index + 1}/${urls.length}] FAILED: ${url}`);
        }

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updatePromotionProgress',
            data: { current: index + 1, total: urls.length }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] ERROR: ${url}`, error);
      });
  });

  await Promise.all(claimPromises);
  console.log('\n🎉 ALL PROMOTIONS COMPLETED!\n');
}

async function waitAndClaimPromotionNoPhoneVerify(tabId, index, total) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send claim promotion message (no apiKey)
            let retries = 3;
            let success = false;

            while (retries > 0 && !success) {
              try {
                await new Promise((resolve, reject) => {
                  chrome.tabs.sendMessage(
                    tabId,
                    { action: 'claimPromotion' },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                      } else if (response && response.success) {
                        console.log(`✅ [Tab ${tabId}] Promotion claimed!`);
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

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

// API Handlers for codesim.net (to avoid CORS in content script)

async function getPhoneNumberFromCodesim(apiKey, sendResponse) {
  const serviceId = 49; // Service ID for this platform
  const phonePrefix = '08'; // Prefer 08 prefix (easier to get OTP)
  const url = `https://apisim.codesim.net/sim/get_sim?service_id=${serviceId}&phone=${phonePrefix}&api_key=${apiKey}`;

  console.log('🔗 Calling codesim API:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('📱 Codesim response:', data);

    if (data.status === 200 && data.data) {
      sendResponse({
        success: true,
        data: {
          phone: data.data.phone,
          otpId: data.data.otpId,
          simId: data.data.simId
        }
      });
    } else {
      sendResponse({
        success: false,
        error: data.message || 'Failed to get phone number'
      });
    }
  } catch (error) {
    console.error('❌ Error calling codesim API:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function getOTPFromCodesim(otpId, apiKey, sendResponse) {
  const url = `https://apisim.codesim.net/otp/get_otp_by_phone_api_key?otp_id=${otpId}&api_key=${apiKey}`;

  console.log('🔗 Calling codesim OTP API:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('📩 Codesim OTP response:', data);

    if (data.status === 200 && data.data && data.data.code) {
      sendResponse({
        success: true,
        code: data.data.code
      });
    } else {
      sendResponse({
        success: false,
        waiting: true // Still waiting for OTP
      });
    }
  } catch (error) {
    console.error('❌ Error calling codesim OTP API:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function cancelSimFromCodesim(simId, apiKey, sendResponse) {
  const url = `https://apisim.codesim.net/sim/cancel_api_key/${simId}?api_key=${apiKey}`;

  console.log('🔗 Calling codesim cancel API:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('🗑️ Codesim cancel response:', data);

    if (data.status === 200) {
      sendResponse({
        success: true,
        message: 'Sim cancelled'
      });
    } else {
      sendResponse({
        success: false,
        error: data.message || 'Failed to cancel sim'
      });
    }
  } catch (error) {
    console.error('❌ Error calling codesim cancel API:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Save promotion result to storage
function savePromotionResult(data) {
  chrome.storage.local.get(['promotionResults'], function (result) {
    const results = result.promotionResults || [];

    // Add new result
    results.push(data);

    // Keep only last 50 results
    if (results.length > 50) {
      results.shift();
    }

    chrome.storage.local.set({ promotionResults: results }, function () {
      console.log('✅ Saved promotion result');
    });
  });
}

// PHONE VERIFICATION HANDLER - Multi-tab

async function handleMultiPhoneVerify(data) {
  const { selectedCount, apiKey } = data;

  console.log(`\n📱 MULTI PHONE VERIFY: ${selectedCount} sites`);

  // Get all existing tabs (should be tabs from register or login)
  const allTabs = await chrome.tabs.query({});

  // Filter tabs that are on betting sites (not chrome:// or extension pages)
  const bettingTabs = allTabs.filter(tab => {
    if (!tab.url) return false;
    return tab.url.startsWith('http://') || tab.url.startsWith('https://');
  });

  // Take only the number of tabs user selected
  const tabsToProcess = bettingTabs.slice(0, selectedCount);

  if (tabsToProcess.length === 0) {
    return;
  }

  // Track tabs
  tabsToProcess.forEach(tab => phoneVerifyTabs.add(tab.id));

  // Process all tabs in parallel
  const verifyPromises = tabsToProcess.map((tab, index) => {
    `);

    // Directly call phone verify (tab is already on the site)
    return waitAndVerifyPhone(tab.id, index, selectedCount, apiKey)
      .then((success) => {
        if (success) {
        } else {
          console.error(`❌ [${index + 1}/${selectedCount}] FAILED after retries: ${tab.url}`);
        }

        // Update progress
        try {
          chrome.runtime.sendMessage({
            action: 'updatePhoneVerifyProgress',
            data: { current: index + 1, total: selectedCount }
          });
        } catch (e) { }
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${selectedCount}] ERROR: ${tab.url}`, error);
      });
  });

  await Promise.all(verifyPromises);
  console.log('\n🎉 ALL PHONE VERIFICATIONS COMPLETED!\n');
}

async function waitAndVerifyPhone(tabId, index, total, apiKey) {

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40;

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
          clearInterval(checkInterval);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            });

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
              } catch (error) {
                pingRetries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            if (!ready) {
              console.error(`❌ [Tab ${tabId}] Content script not ready`);
              resolve(false);
              return;
            }

            // Send verify phone message
            let retries = 3;
            let success = false;

            while (retries > 0 && !success) {
              try {
                await new Promise((resolve, reject) => {
                  chrome.tabs.sendMessage(
                    tabId,
                    { action: 'verifyPhone', apiKey: apiKey },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                      } else if (response && response.success) {
                        console.log(`✅ [Tab ${tabId}] Phone verified!`);
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

            resolve(success);
          } catch (error) {
            console.error(`❌ [Tab ${tabId}] Error:`, error);
            resolve(false);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(`❌ [Tab ${tabId}] Timeout`);
          resolve(false);
        }
      } catch (error) {
        clearInterval(checkInterval);
        console.error(`❌ [Tab ${tabId}] Tab error:`, error);
        resolve(false);
      }
    }, 1000);
  });
}

// Open withdraw page and add bank
async function openWithdrawPageAndAddBank(data) {
  const { url, password, bankAccount, bankName } = data;

  console.log(`\n💰 Opening withdraw page: ${url}`);

  // Create tab
  const tab = await chrome.tabs.create({
    url: url,
    active: true
  });

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Ping to check if ready
    let ready = false;
    let pingRetries = 10;

    while (pingRetries > 0 && !ready) {
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        ready = true;
      } catch (error) {
        pingRetries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      console.error(`❌ Content script not ready`);
      return;
    }

    // Send message to add bank
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'addBankDirectly',
        data: { password, bankAccount, bankName }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error:', chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log('✅ Bank added successfully!');
        }
      }
    );

  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

// ============================================
// AUTO SEQUENCE - RUN ALL STEPS WITH FAILURE CHECK
// ============================================

async function handleAutoSequence(data) {
  const { registerUrls, promoUrls, selectedCount, username, password, fullname, withdrawPassword, bankAccount, bankName, apiKey } = data;

  console.log('Will run: Register → Withdraw → Phone Verify → Promotion (stop on failure)\n');

  try {
    // STEP 1: Register
    updateAutoProgress(1, 'Đăng ký', 0, selectedCount);

    const registerSuccess = await runRegisterStep(registerUrls, username, password, fullname, selectedCount);
    if (!registerSuccess) {
      console.error('❌ Step 1 failed, stopping...');
      notifyAutoComplete(false, 'Đăng ký thất bại');
      return;
    }

    // Wait between steps
    await new Promise(resolve => setTimeout(resolve, 5000));

    // STEP 2: Withdraw
    console.log('\n💰 STEP 2/4: SETTING UP WITHDRAW...\n');
    updateAutoProgress(2, 'Thiết lập rút tiền', 0, selectedCount);

    const withdrawSuccess = await runWithdrawStep(selectedCount, withdrawPassword, bankAccount, bankName);
    if (!withdrawSuccess) {
      console.error('❌ Step 2 failed, stopping...');
      notifyAutoComplete(false, 'Thiết lập rút tiền thất bại');
      return;
    }

    // Wait between steps
    await new Promise(resolve => setTimeout(resolve, 5000));

    // STEP 3: Phone Verify
    console.log('\n📱 STEP 3/4: VERIFYING PHONE...\n');
    updateAutoProgress(3, 'Xác thực SĐT', 0, selectedCount);

    const phoneSuccess = await runPhoneVerifyStep(selectedCount, apiKey);
    if (!phoneSuccess) {
      console.error('❌ Step 3 failed, stopping...');
      notifyAutoComplete(false, 'Xác thực SĐT thất bại');
      return;
    }

    // Wait between steps
    await new Promise(resolve => setTimeout(resolve, 5000));

    // STEP 4: Promotion
    console.log('\n🎁 STEP 4/4: CLAIMING PROMOTION...\n');
    updateAutoProgress(4, 'Nhận khuyến mãi', 0, selectedCount);

    const promoSuccess = await runPromotionStep(promoUrls);
    if (!promoSuccess) {
      console.error('❌ Step 4 failed');
      notifyAutoComplete(false, 'Nhận khuyến mãi thất bại');
      return;
    }

    console.log('\n🎉🎉🎉 AUTO SEQUENCE COMPLETED SUCCESSFULLY!\n');
    notifyAutoComplete(true, 'Hoàn thành tất cả các bước');

  } catch (error) {
    console.error('❌ Auto sequence error:', error);
    notifyAutoComplete(false, error.message);
  }
}

async function runRegisterStep(urls, username, password, fullname, total) {
  console.log('Creating tabs for registration...');

  const tabPromises = urls.map(url => chrome.tabs.create({ url, active: false }));
  const createdTabs = await Promise.all(tabPromises);

  let successCount = 0;
  const fillPromises = createdTabs.map((tab, index) => {
    return waitAndAutoFill(tab.id, username, password, fullname, true)
      .then((success) => {
        if (success) {
          successCount++;
          console.log(`✅ [${index + 1}/${total}] Register success`);
        }
        updateAutoProgress(1, 'Đăng ký', index + 1, total);
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${total}] Register error:`, error);
      });
  });

  await Promise.all(fillPromises);
  console.log(`✅ Step 1 complete: ${successCount}/${total} successful`);

  return successCount > 0; // Success if at least 1 succeeded
}

async function runWithdrawStep(selectedCount, withdrawPassword, bankAccount, bankName) {
  const allTabs = await chrome.tabs.query({});
  const bettingTabs = allTabs.filter(tab => {
    if (!tab.url) return false;
    return tab.url.startsWith('http://') || tab.url.startsWith('https://');
  });

  const tabsToProcess = bettingTabs.slice(0, selectedCount);

  if (tabsToProcess.length === 0) {
    console.log('❌ No tabs found for withdraw');
    return false;
  }

  let successCount = 0;
  const withdrawPromises = tabsToProcess.map((tab, index) => {
    return setupWithdrawForTab(tab.id, withdrawPassword, bankAccount, bankName)
      .then((success) => {
        if (success) {
          successCount++;
          console.log(`✅ [${index + 1}/${selectedCount}] Withdraw success`);
        }
        updateAutoProgress(2, 'Thiết lập rút tiền', index + 1, selectedCount);
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${selectedCount}] Withdraw error:`, error);
      });
  });

  await Promise.all(withdrawPromises);
  console.log(`✅ Step 2 complete: ${successCount}/${selectedCount} successful`);

  return successCount > 0;
}

async function runPhoneVerifyStep(selectedCount, apiKey) {
  const allTabs = await chrome.tabs.query({});
  const bettingTabs = allTabs.filter(tab => {
    if (!tab.url) return false;
    return tab.url.startsWith('http://') || tab.url.startsWith('https://');
  });

  const tabsToProcess = bettingTabs.slice(0, selectedCount);

  if (tabsToProcess.length === 0) {
    console.log('❌ No tabs found for phone verify');
    return false;
  }

  let successCount = 0;
  const verifyPromises = tabsToProcess.map((tab, index) => {
    return verifyPhoneForTab(tab.id, apiKey)
      .then((success) => {
        if (success) {
          successCount++;
          console.log(`✅ [${index + 1}/${selectedCount}] Phone verify success`);
        }
        updateAutoProgress(3, 'Xác thực SĐT', index + 1, selectedCount);
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${selectedCount}] Phone verify error:`, error);
      });
  });

  await Promise.all(verifyPromises);
  console.log(`✅ Step 3 complete: ${successCount}/${selectedCount} successful`);

  return successCount > 0;
}

async function runPromotionStep(urls) {
  const allTabs = await chrome.tabs.query({});
  const tabsToUpdate = allTabs.slice(0, urls.length);

  let successCount = 0;
  const promoPromises = tabsToUpdate.map((tab, index) => {
    return chrome.tabs.update(tab.id, { url: urls[index] })
      .then(() => new Promise(resolve => setTimeout(resolve, 5000)))
      .then(() => claimPromotionForTab(tab.id))
      .then((success) => {
        if (success) {
          successCount++;
          console.log(`✅ [${index + 1}/${urls.length}] Promotion success`);
        }
        updateAutoProgress(4, 'Nhận khuyến mãi', index + 1, urls.length);
      })
      .catch(error => {
        console.error(`❌ [${index + 1}/${urls.length}] Promotion error:`, error);
      });
  });

  await Promise.all(promoPromises);
  console.log(`✅ Step 4 complete: ${successCount}/${urls.length} successful`);

  return successCount > 0;
}

async function setupWithdrawForTab(tabId, withdrawPassword, bankAccount, bankName) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'goToWithdraw', data: { withdrawPassword, bankAccount, bankName } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    return result && result.success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Withdraw setup failed:`, error);
    return false;
  }
}

async function verifyPhoneForTab(tabId, apiKey) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'startPhoneVerification', data: { apiKey } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    return result && result.success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Phone verify failed:`, error);
    return false;
  }
}

async function claimPromotionForTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { action: 'claimPromotion' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    return result && result.success;
  } catch (error) {
    console.error(`❌ [Tab ${tabId}] Promotion claim failed:`, error);
    return false;
  }
}

function updateAutoProgress(step, stepName, current, total) {
  try {
    chrome.runtime.sendMessage({
      action: 'updateAutoProgress',
      data: { step, stepName, current, total }
    });
  } catch (e) {
  }
}

function notifyAutoComplete(success, message) {
  try {
    chrome.runtime.sendMessage({
      action: 'autoCompleteFinished',
      data: { success, message }
    });
  } catch (e) {
  }
}
