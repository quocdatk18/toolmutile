// Content script - runs on target page
console.log('?? Auto Register Tool loaded on:', window.location.href);

// Helper function to check if current page is withdraw page
function isWithdrawPage() {
  const url = window.location.href.toLowerCase();
  return (url.includes('/financial') && (url.includes('type=withdraw') || url.includes('withdraw'))) ||
    url.includes('rut-tien') ||
    url.includes('withdraw');
}

// Prevent multiple injections - check if already loaded
if (window.autoRegisterToolLoaded) {
  console.log('?? Script already loaded, skipping duplicate initialization');

  // But still check for withdraw page in case this is a re-injection after navigation
  if (isWithdrawPage()) {
    console.log('?? Re-detected withdraw page after script re-injection');

    if (!window.withdrawFormFilled) {
      const storedWithdrawInfo = sessionStorage.getItem('withdrawInfo');
      if (storedWithdrawInfo) {
        try {
          window.withdrawInfo = JSON.parse(storedWithdrawInfo);
          console.log('? Retrieved withdraw info from storage:', window.withdrawInfo);
          console.log('? Waiting 3 seconds for form to render...');
          setTimeout(() => {
            console.log('?? Starting fillWithdrawForm (re-injection)...');
            fillWithdrawForm();
          }, 3000);
        } catch (e) {
          console.error('? Failed to parse withdraw info:', e);
        }
      }
    } else {
      console.log('? Withdraw form already filled, skipping');
    }
  }
} else {
  window.autoRegisterToolLoaded = true;
  console.log('? First time loading, initializing...');

  window.captchaAttempted = false;
  window.captchaFailed = false;
  window.captchaCompleted = false;
  window.promoCheckRunning = false;
  window.audioButtonClicked = false;
  window.replayButtonClicked = false;
  window.audioSolving = false;
  window.autoFillRunning = false;

  // Intercept console.error to capture audio URL from Mixed Content warnings
  // This is needed for Puppeteer environment where there's no real background script
  if (!window.consoleErrorIntercepted) {
    window.consoleErrorIntercepted = true;
    const originalConsoleError = console.error;
    console.error = function (...args) {
      const message = args.join(' ');
      if (message.includes('Mixed Content') && message.includes('audio')) {
        console.log('🎵 Detected audio URL from Mixed Content warning!');
        // Extract URL from message like: "...requested an insecure audio file 'http://...captcha.mp3'..."
        const urlMatch = message.match(/http[s]?:\/\/[^\s'"]+\.mp3/i);
        if (urlMatch) {
          const audioUrl = urlMatch[0].replace('http://', 'https://'); // Convert to HTTPS
          console.log('✅ Extracted audio URL:', audioUrl);
          // Use setTimeout to ensure addAudioUrl is defined
          setTimeout(() => {
            if (typeof addAudioUrl === 'function') {
              addAudioUrl(audioUrl);
            }
          }, 100);
        }
      }
      return originalConsoleError.apply(console, args);
    };
    console.log('✅ Console.error interceptor installed for audio URL capture');
  }
  window.registerFormFilled = false;
  window.withdrawFormFilled = false; // Track if withdraw form has been filled
  window.withdrawFormFilling = false; // Track if currently filling

  // FreeLXB-style: Handle tab visibility changes
  // When tab becomes visible again, resume any pending operations
  if (!window.visibilityHandlerInstalled) {
    window.visibilityHandlerInstalled = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible - resuming operations');
        // Resume any pending captcha solving
        if (window.pendingCaptchaSolve && window.currentApiKey) {
          console.log('🔄 Resuming pending captcha solve...');
          setTimeout(() => {
            if (typeof solveCaptchaAuto === 'function') {
              solveCaptchaAuto(window.currentApiKey);
            }
          }, 500);
        }
      } else {
        console.log('😴 Tab hidden - operations may be throttled');
      }
    });
    console.log('✅ Visibility change handler installed (FreeLXB-style)');
  }
  sessionStorage.removeItem('captchaAttempted');
  sessionStorage.removeItem('captchaFailed');
  sessionStorage.removeItem('captchaCompleted');
  console.log('🔓 Cleared all flags on page load');

  // Display click logs from previous session (if any)
  const clickLogs = localStorage.getItem('promoClickLogs');
  if (clickLogs) {
    try {
      const logs = JSON.parse(clickLogs);
      if (logs.length > 0) {
        console.log('📋 ===== PROMO CLICK LOGS FROM PREVIOUS SESSION =====');
        logs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.timestamp}] ${log.action} (source: ${log.source})`);
          if (log.reason) console.log(`     Reason: ${log.reason}`);
          if (log.buttonFound !== undefined) console.log(`     Button found: ${log.buttonFound}, disabled: ${log.buttonDisabled}`);
        });
        console.log(`📊 Total clicks logged: ${logs.length}`);
        console.log('📋 ===== END OF LOGS =====');

        // Clear logs after displaying
        localStorage.removeItem('promoClickLogs');
        console.log('🗑️ Logs cleared');
      }
    } catch (e) {
      console.error('❌ Failed to parse click logs:', e);
    }
  }

  if (isWithdrawPage()) {
    console.log('?? Detected withdraw page, checking for stored info...');
    console.log('?? Current URL:', window.location.href);

    const storedWithdrawInfo = sessionStorage.getItem('withdrawInfo');
    if (storedWithdrawInfo) {
      try {
        window.withdrawInfo = JSON.parse(storedWithdrawInfo);
        console.log('? Retrieved withdraw info from storage:', window.withdrawInfo);

        console.log('? Waiting 3 seconds for form to render...');

        const retryAttempts = [3000, 6000, 9000, 12000]; // Try at 3s, 6s, 9s, 12s

        retryAttempts.forEach((delay, index) => {
          setTimeout(() => {
            if (!window.withdrawFormFilled) {
              if (index === 0) {
                console.log('?? Starting fillWithdrawForm (attempt 1)...');
              } else {
                console.log(`?? Retry attempt ${index + 1} - form not filled yet...`);
              }
              fillWithdrawForm();
            } else {
              console.log(`? Form already filled, skipping retry ${index + 1}`);
            }
          }, delay);
        });
      } catch (e) {
        console.error('? Failed to parse withdraw info:', e);
      }
    } else {
      console.warn('?? No withdraw info found in sessionStorage');
      console.log('?? SessionStorage contents:', {
        keys: Object.keys(sessionStorage),
        withdrawInfo: sessionStorage.getItem('withdrawInfo'),
        shouldRedirect: sessionStorage.getItem('shouldRedirectToWithdraw')
      });
    }
  }
}

// Track audio captcha URLs from network requests
window.captchaAudioUrls = [];

// Helper function to add audio URL without duplicates
function addAudioUrl(url) {
  if (!url) return;

  const invalidPatterns = [
    'google.com/recaptcha',
    'recaptcha.net',
    'gstatic.com/recaptcha',
    '/anchor?',
    '/bframe?',
    'recaptcha/api'
  ];

  const urlLower = url.toLowerCase();
  for (const pattern of invalidPatterns) {
    if (urlLower.includes(pattern)) {
      console.log('?? ?? Skipping Google reCAPTCHA URL:', url);
      return;
    }
  }

  const validAudioPatterns = [
    '.mp3',
    '.wav',
    '.ogg',
    '.m4a',
    'audio',
    'sound',
    'captcha'
  ];

  let isValidAudio = false;
  for (const pattern of validAudioPatterns) {
    if (urlLower.includes(pattern)) {
      isValidAudio = true;
      break;
    }
  }

  if (!isValidAudio) {
    console.log('?? ?? Skipping non-audio URL:', url);
    return;
  }

  let normalizedUrl = url;
  if (normalizedUrl.startsWith('http://')) {
    normalizedUrl = normalizedUrl.replace('http://', 'https://');
  }

  if (window.captchaAudioUrls.includes(normalizedUrl)) {
    console.log('?? ?? URL already captured, skipping:', normalizedUrl);
    return;
  }

  window.captchaAudioUrls.push(normalizedUrl);
  console.log('?? ? NEW AUDIO URL CAPTURED:', normalizedUrl);
  console.log('?? ?? Total unique URLs:', window.captchaAudioUrls.length);

  // Debug flags
  console.log('🔍 DEBUG: window.apiKey =', window.apiKey ? 'SET' : 'NOT SET');
  console.log('🔍 DEBUG: window.isCheckingPromo =', window.isCheckingPromo);
  console.log('🔍 DEBUG: window.currentApiKey =', window.currentApiKey ? 'SET' : 'NOT SET');

  // Auto-solve if API key is available (use either apiKey or currentApiKey)
  const hasApiKey = window.apiKey || window.currentApiKey;
  if (hasApiKey && window.isCheckingPromo) {
    console.log('🎵 🔥 Auto-solving audio captcha for check promo...');
    setTimeout(() => {
      solveAudioCaptchaAuto(normalizedUrl);
    }, 1000);
  }
}

// Use MutationObserver to detect when audio elements are added to DOM (only if not already created)
if (!window.audioObserver) {
  window.audioObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        const node = mutation.target;
        if (node.tagName === 'AUDIO') {
          console.log('?? ? DETECTED AUDIO SRC ATTRIBUTE CHANGED');

          setTimeout(() => {
            let audioUrl = node.src || node.currentSrc;
            if (audioUrl) {
              addAudioUrl(audioUrl);
            }
          }, 1000);
        }
      }

      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'AUDIO') {
          console.log('?? ? DETECTED NEW AUDIO ELEMENT ADDED TO DOM');

          setTimeout(() => {
            let audioUrl = node.src || node.currentSrc;
            if (audioUrl) {
              addAudioUrl(audioUrl);
            }

            const sources = node.querySelectorAll('source');
            sources.forEach(source => {
              if (source.src) {
                addAudioUrl(source.src);
              }
            });
          }, 1000); // Increase delay to 1s
        }

        if (node.querySelectorAll) {
          const audios = node.querySelectorAll('audio');
          if (audios.length > 0) {
            console.log(`?? ? DETECTED ${audios.length} AUDIO ELEMENTS IN ADDED NODE`);

            setTimeout(() => {
              audios.forEach(audio => {
                const audioUrl = audio.src || audio.currentSrc;
                if (audioUrl) {
                  addAudioUrl(audioUrl);
                }

                const sources = audio.querySelectorAll('source');
                sources.forEach(source => {
                  if (source.src) {
                    addAudioUrl(source.src);
                  }
                });
              });
            }, 500);
          }
        }
      });
    });
  });

  window.audioObserver.observe(document.body, {
    childList: true,  // Watch for added/removed nodes
    subtree: true,    // Watch entire subtree
    attributes: true, // Watch for attribute changes (like src)
    attributeFilter: ['src'] // Only watch src attribute
  });

  console.log('🎵 MutationObserver started - watching for audio elements and src changes');
}

// Intercept fetch requests to capture audio URLs (only if not already intercepted)
if (!window.fetchIntercepted) {
  window.fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];

    if (typeof url === 'string') {
      console.log('🌐 Fetch request:', url);

      // Check if it's an audio URL
      const isAudio = url.includes('audio') ||
        url.includes('sound') ||
        url.includes('captcha') ||
        url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a') ||
        url.includes('deso.vn') ||
        url.includes('audio-captcha-cache') ||
        url.match(/\/(audio|sound|captcha|media)\//i);

      if (isAudio) {
        console.log('🎵 🔥 INTERCEPTED FETCH AUDIO REQUEST:', url);
        addAudioUrl(url);
      }
    }

    return originalFetch.apply(this, args);
  };
}

// Intercept XMLHttpRequest to capture audio URLs (only if not already intercepted)
if (!window.xhrIntercepted) {
  window.xhrIntercepted = true;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._requestUrl = url; // Store URL for response interceptor

    if (typeof url === 'string') {
      console.log('?? XHR request:', method, url);
    }

    if (typeof url === 'string' && (
      url.includes('audio') ||
      url.includes('sound') ||
      url.includes('captcha') ||
      url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a') ||
      url.includes('deso.vn') ||
      url.includes('audio-captcha-cache') ||
      url.match(/\/(audio|sound|captcha|media)\//i)
    )) {
      console.log('?? ? INTERCEPTED XHR AUDIO REQUEST:', url);
      addAudioUrl(url);
    }

    return originalOpen.call(this, method, url, ...rest);
  };

  // Intercept XHR response to extract audio URL from admin-ajax.php response
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      if (this._requestUrl && this._requestUrl.includes('admin-ajax.php')) {
        try {
          const response = this.responseText;
          // Look for audio URL in response (usually in JSON or HTML)
          const audioUrlMatch = response.match(/http[s]?:\/\/[^\s"']+audio-captcha-cache[^\s"']+\.mp3/i);
          if (audioUrlMatch) {
            const audioUrl = audioUrlMatch[0].replace('http://', 'https://');
            console.log('🎵 🔥 EXTRACTED AUDIO URL FROM AJAX RESPONSE:', audioUrl);
            addAudioUrl(audioUrl);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    return originalSend.apply(this, args);
  };
}

// Request any captured audio URLs from background when script loads
// This handles the case where audio was captured before content script was ready
setTimeout(() => {
  console.log('?? Requesting any previously captured audio URLs from background...');
  chrome.runtime.sendMessage({ action: 'getCapturedAudioUrls' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('⚠️ Could not get captured URLs:', chrome.runtime.lastError.message);
      return;
    }

    if (response && response.urls && response.urls.length > 0) {
      console.log(`?? Found ${response.urls.length} previously captured audio URLs`);
      response.urls.forEach(url => {
        addAudioUrl(url);

        // Auto-solve if conditions are met
        if (window.currentApiKey && window.audioButtonClicked) {
          console.log('?? Auto-solving with previously captured URL...');
          solveAudioCaptchaAuto(url);
        }
      });
    } else {
      console.log('?? No previously captured audio URLs found');
    }
  });
}, 2000); // Wait 2 seconds after script loads

// Single unified message listener to avoid duplicates
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('?? Message received:', request);

  // Handle audioUrlCaptured action
  if (request.action === 'audioUrlCaptured') {
    console.log('?? ? RECEIVED AUDIO URL FROM BACKGROUND:', request.url);
    addAudioUrl(request.url);

    // Auto-solve captcha if API key is available
    if (window.currentApiKey && window.audioButtonClicked) {
      console.log('?? Auto-solving captcha with received audio URL...');
      solveAudioCaptchaAuto(request.url);
    }

    sendResponse({ received: true });
    return true;
  }

  if (request.action === 'ping') {
    console.log('?? Ping received, responding...');
    sendResponse({ ready: true });
    return true;
  }

  if (request.action === 'findAndClickRegister') {
    console.log('?? Finding and clicking register button/link...');

    try {
      const result = findAndClickRegisterButton();
      console.log('? Register button clicked:', result);
      sendResponse({ success: true, result: result });
    } catch (error) {
      console.error('? Register button error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }

  // findAndClickWithdraw action removed - now using direct redirect

  if (request.action === 'redirectToWithdrawAndFill') {
    console.log('Navigate to withdraw page and fill form...');

    (async () => {
      try {
        if (request.data && request.data.withdrawInfo) {
          window.withdrawInfo = request.data.withdrawInfo;
          sessionStorage.setItem('withdrawInfo', JSON.stringify(request.data.withdrawInfo));
          sessionStorage.setItem('shouldRedirectToWithdraw', 'true');
          console.log('Stored withdraw info:', request.data.withdrawInfo);
        }

        console.log('Current URL:', window.location.href);

        // Check if already on withdraw page
        if (window.location.href.includes('/Financial') && window.location.href.includes('withdraw')) {
          console.log('Already on withdraw page, filling form directly...');

          // Reset form filled flag
          window.withdrawFormFilled = false;
          window.withdrawFormFilling = false;

          // Wait a bit for page to be ready, then fill form
          setTimeout(() => {
            console.log('Attempting to fill withdraw form...');
            fillWithdrawForm();
          }, 2000); // Reduced from 3000 to 2000

          sendResponse({ success: true, method: 'direct_fill' });
          return;
        }

        console.log('Not on withdraw page - this should not happen with direct redirect');
        console.log('Automation should redirect directly to withdraw URL');

        sendResponse({ success: false, error: 'Not on withdraw page - automation should redirect directly' });
      } catch (error) {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  }

  if (request.action === 'fillWithdrawForm') {
    console.log('?? Manual trigger to fill withdraw form...');

    try {
      if (request.data && request.data.withdrawInfo) {
        window.withdrawInfo = request.data.withdrawInfo;
        sessionStorage.setItem('withdrawInfo', JSON.stringify(request.data.withdrawInfo));
        console.log('?? Stored withdraw info:', request.data.withdrawInfo);
      }

      fillWithdrawForm();
      sendResponse({ success: true });
    } catch (error) {
      console.error('? Fill withdraw form error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }

  if (request.action === 'resetCaptchaFlag') {
    console.log('?? Resetting captcha flag...');

    try {
      window.captchaAttempted = false;
      window.captchaFailed = false;
      window.captchaCompleted = false;
      window.audioButtonClicked = false;
      window.replayButtonClicked = false;
      window.audioSolving = false;
      window.autoFillRunning = false;
      window.registerFormFilled = false;
      sessionStorage.removeItem('captchaAttempted');
      sessionStorage.removeItem('captchaFailed');
      sessionStorage.removeItem('captchaCompleted');
      window.promoCheckRunning = false;
      console.log('✅ Captcha flag reset successfully');
      console.log('✅ Captcha failed flag cleared');
      console.log('✅ Captcha completed flag cleared');
      console.log('✅ Audio button clicked flag cleared');
      console.log('✅ Replay button clicked flag cleared');
      console.log('✅ Audio solving flag cleared');
      console.log('✅ Auto-fill running flag cleared');
      console.log('✅ Register form filled flag cleared');
      console.log('✅ Promo check running flag cleared');

      showNotification('✅ Đã reset!');
      sendResponse({ success: true });
    } catch (error) {
      console.error('Reset error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }

  if (request.action === 'checkRegistrationResult') {
    console.log('🔍 Checking registration result by token...');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Current cookies:', document.cookie);

    (async () => {
      try {
        // Check for auth token in cookies (most reliable method)
        const maxAttempts = 10; // 10 seconds
        let attempts = 0;
        let hasToken = false;
        let tokenName = '';

        console.log('⏳ Checking for auth token in cookies (max 10 seconds)...');

        while (attempts < maxAttempts && !hasToken) {
          attempts++;
          console.log(`🔍 Attempt ${attempts}/${maxAttempts}: Checking cookies...`);

          const cookies = document.cookie;
          const tokenCookieNames = [
            '_pat',
            'token',
            'auth_token',
            'access_token',
            'session',
            'jwt',
            'bearer',
            'authToken',
            'sessionToken'
          ];

          for (const name of tokenCookieNames) {
            if (cookies.includes(`${name}=`)) {
              const cookieMatch = cookies.match(new RegExp(`${name}=([^;]+)`));
              if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
                hasToken = true;
                tokenName = name;
                console.log(`✅ Found auth token: ${name} = ${cookieMatch[1].substring(0, 20)}...`);
                break;
              }
            }
          }

          if (hasToken) {
            break;
          }

          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (hasToken) {
          console.log(`✅ Registration successful! Token found: ${tokenName}`);
          sendResponse({ success: true, token: tokenName });
        } else {
          console.log('❌ Registration failed! No auth token found after 10 seconds');

          // Check for error modal as secondary check
          const errorCheck = detectErrorModal();
          const errorMessage = errorCheck.hasError
            ? errorCheck.errorMessage
            : 'Không tìm thấy token sau 10 giây';

          sendResponse({ success: false, error: errorMessage });
        }

      } catch (error) {
        console.error('❌ Error checking registration result:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (request.action === 'checkLoginResult') {
    console.log('🔍 Checking login result by token...');

    (async () => {
      try {
        // Check for auth token in cookies (most reliable method)
        const maxAttempts = 10; // 10 seconds
        let attempts = 0;
        let hasToken = false;
        let tokenName = '';

        console.log('⏳ Checking for auth token in cookies (max 10 seconds)...');

        while (attempts < maxAttempts && !hasToken) {
          attempts++;
          console.log(`🔍 Attempt ${attempts}/${maxAttempts}: Checking cookies...`);

          const cookies = document.cookie;
          const tokenCookieNames = [
            '_pat',
            'token',
            'auth_token',
            'access_token',
            'session',
            'jwt',
            'bearer',
            'authToken',
            'sessionToken'
          ];

          for (const name of tokenCookieNames) {
            if (cookies.includes(`${name}=`)) {
              const cookieMatch = cookies.match(new RegExp(`${name}=([^;]+)`));
              if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
                hasToken = true;
                tokenName = name;
                console.log(`✅ Found auth token: ${name} = ${cookieMatch[1].substring(0, 20)}...`);
                break;
              }
            }
          }

          if (hasToken) {
            break;
          }

          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (hasToken) {
          console.log(`✅ Login successful! Token found: ${tokenName}`);
          sendResponse({ success: true, token: tokenName });
        } else {
          console.log('❌ Login failed! No auth token found after 10 seconds');

          // Check for error modal as secondary check
          const errorCheck = detectErrorModal();
          const errorMessage = errorCheck.hasError
            ? errorCheck.errorMessage
            : 'Không tìm thấy token sau 10 giây';

          sendResponse({ success: false, error: errorMessage });
        }

      } catch (error) {
        console.error('❌ Error checking login result:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (request.action === 'checkPromotion') {
    console.log('Starting promotion check flow...');

    (async () => {
      try {
        const { username, apiKey } = request.data || {};
        console.log('Username:', username);
        console.log('API Key:', apiKey ? 'Provided' : 'Not provided');

        // Store API key for auto-solving captcha
        if (apiKey) {
          window.apiKey = apiKey;
          window.currentApiKey = apiKey;
          console.log('✅ Stored API key for captcha solving');
        }

        // Check if already running
        if (window.promoCheckRunning) {
          console.log('Promo check already running, skipping...');
          sendResponse({ success: false, error: 'Already running' });
          return;
        }

        window.promoCheckRunning = true;
        window.isCheckingPromo = true; // Flag for auto-solving audio captcha
        window.promoButtonClicked = false; // Reset flag to allow clicking

        // 🔥 Wait for page to be fully ready (critical for setValue)
        console.log('⏳ Waiting 2 seconds for page to fully render...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // STEP 1: Fill username in form
        console.log('Step 1: Filling username...');
        console.log('🔍 DEBUG: username received =', username);

        // Mở rộng selector để tìm nhiều loại input username (như phiên bản cũ hoạt động tốt)
        const usernameInput = document.querySelector('input[placeholder*="tên người dùng"]') ||
          document.querySelector('input[placeholder*="Tên Tài Khoản"]') ||
          document.querySelector('input[placeholder*="tên đăng nhập"]') ||
          document.querySelector('input[placeholder*="Tên đăng nhập"]') ||
          document.querySelector('input[placeholder*="Username"]') ||
          document.querySelector('input[placeholder*="username"]') ||
          document.querySelector('input[placeholder*="Tài khoản"]') ||
          document.querySelector('input[placeholder*="tài khoản"]') ||
          document.querySelector('input[name*="username"]') ||
          document.querySelector('input[name*="account"]') ||
          document.querySelector('input[id*="username"]') ||
          document.querySelector('input[id*="account"]') ||
          document.querySelector('input[type="text"]:first-of-type');

        console.log('🔍 Found username input:', usernameInput ? (usernameInput.placeholder || usernameInput.name || usernameInput.id || 'no identifier') : 'NOT FOUND');

        if (usernameInput && username) {
          console.log('📝 Filling username:', username);
          await fillInputAdvanced(usernameInput, username, true); // Fast mode
          console.log('✅ Username filled');
          await new Promise(resolve => setTimeout(resolve, 300)); // Tăng delay để đảm bảo value được set
        } else {
          console.log('❌ Username input not found or no username provided');
          console.log('🔍 DEBUG: username =', username);
          console.log('🔍 DEBUG: All text inputs on page:', document.querySelectorAll('input[type="text"]').length);
        }

        // STEP 2: Click "Chọn Khuyến Mãi" button
        console.log('Step 2: Looking for promo button...');

        // Đợi và retry tìm promo button (tab có thể bị throttle)
        let promoButton = false;
        let promoSearchAttempts = 0;
        const maxPromoSearchAttempts = 10; // 10 x 500ms = 5 seconds max

        while (!promoButton && promoSearchAttempts < maxPromoSearchAttempts) {
          promoSearchAttempts++;

          // Log tất cả elements để debug
          const allElements = document.querySelectorAll('button, a, div, span');
          const visibleCount = Array.from(allElements).filter(el => el.offsetParent !== null).length;
          console.log(`🔍 [${promoSearchAttempts}/${maxPromoSearchAttempts}] Found ${visibleCount} visible elements`);

          promoButton = findAndClickPromoButton();

          if (promoButton) {
            console.log(`✅ Promo button found after ${promoSearchAttempts * 500}ms`);
            break;
          }

          console.log(`⏳ Promo button not found yet, waiting 500ms...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (promoButton) {
          console.log('Promo button clicked, waiting for popup...');

          // Smart wait: Check if popup appeared (max 5 seconds - increased from 3s)
          let popupReady = false;
          let popupWaitAttempts = 0;
          const maxPopupWaitAttempts = 10; // 10 x 500ms = 5 seconds max

          while (!popupReady && popupWaitAttempts < maxPopupWaitAttempts) {
            popupWaitAttempts++;

            // Check if promo options are visible (more selectors)
            const testPromo = document.querySelector('[class*="promo"]') ||
              document.querySelector('[class*="promotion"]') ||
              document.querySelector('[class*="khuyen-mai"]') ||
              document.querySelector('[class*="km-"]') ||
              document.querySelector('.popup') ||
              document.querySelector('.modal');

            if (testPromo && testPromo.offsetParent !== null) {
              popupReady = true;
              console.log(`✅ Popup detected after ${popupWaitAttempts * 500}ms`);
              break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (!popupReady) {
            console.log('⚠️ Popup not detected after 5 seconds, continuing anyway...');
          }

          // STEP 3: Find and select TAIAPP promo (with retry)
          console.log('Step 3: Looking for TAIAPP promo...');

          let taiappSelected = false;
          let taiappAttempts = 0;
          const maxTaiappAttempts = 6; // 6 x 500ms = 3 seconds

          while (!taiappSelected && taiappAttempts < maxTaiappAttempts) {
            taiappAttempts++;
            taiappSelected = findAndSelectTaiappPromo();

            if (taiappSelected) {
              console.log(`✅ TAIAPP promo selected after ${taiappAttempts * 500}ms`);
              break;
            }

            console.log(`⏳ [${taiappAttempts}/${maxTaiappAttempts}] TAIAPP not found, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (taiappSelected) {
            console.log('TAIAPP promo selected');
            console.log('⏳ Waiting for "Xác thực tại đây" button to be rendered in DOM...');

            // Wait specifically for "Xác thực tại đây" button to appear
            let verifyButtonExists = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 10; // 10 x 500ms = 5 seconds

            while (!verifyButtonExists && waitAttempts < maxWaitAttempts) {
              waitAttempts++;
              await new Promise(resolve => setTimeout(resolve, 500));

              // Check specifically for "Xác thực tại đây" button
              const verifyButton = document.querySelector('.audio-captcha-btn') ||
                document.querySelector('#showAudioCaptcha') ||
                document.querySelector('button[class*="audio-captcha"]');

              if (verifyButton && verifyButton.offsetParent !== null) {
                const buttonText = verifyButton.textContent.trim();
                verifyButtonExists = true;
                console.log(`✅ "Xác thực tại đây" button appeared after ${waitAttempts * 500}ms`);
                console.log(`   Button text: "${buttonText}"`);
                console.log(`   Button class: "${verifyButton.className}"`);
                break;
              }

              console.log(`⏳ Waiting for verify button (attempt ${waitAttempts}/${maxWaitAttempts})...`);
            }

            if (!verifyButtonExists) {
              console.log('⚠️ "Xác thực tại đây" button not found after 5s, but continuing search...');
            }

            // STEP 4: Click "Xác Thực Tại Đây" button (with retry)
            console.log('Step 4: Looking for "Xác Thực Tại Đây" button...');

            let verifyClicked = false;
            let verifyAttempts = 0;
            const maxVerifyAttempts = 6; // 6 x 500ms = 3 seconds

            while (!verifyClicked && verifyAttempts < maxVerifyAttempts) {
              verifyAttempts++;
              verifyClicked = await findAndClickVerifyButton();

              if (verifyClicked) {
                console.log(`✅ Verify button clicked after ${verifyAttempts * 500}ms`);
                break;
              }

              console.log(`⏳ [${verifyAttempts}/${maxVerifyAttempts}] Verify button not found, waiting...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (verifyClicked) {
              console.log('Verify button clicked, waiting for captcha modal...');

              // Smart wait: Check if captcha modal appeared (max 3 seconds)
              let captchaReady = false;
              let captchaWaitAttempts = 0;
              const maxCaptchaWaitAttempts = 15; // 15 x 200ms = 3 seconds max

              while (!captchaReady && captchaWaitAttempts < maxCaptchaWaitAttempts) {
                captchaWaitAttempts++;

                // Check if captcha input or audio button exists
                const testCaptcha = document.querySelector('input[type="text"]') ||
                  document.querySelector('.audio-captcha') ||
                  document.querySelector('[class*="captcha"]');

                if (testCaptcha && testCaptcha.offsetParent !== null) {
                  captchaReady = true;
                  console.log(`✅ Captcha modal ready after ${captchaWaitAttempts * 200}ms`);
                  break;
                }

                await new Promise(resolve => setTimeout(resolve, 200)); // Check every 200ms instead of 500ms
              }

              // STEP 5: Solve captcha if API key provided
              if (apiKey) {
                console.log('Step 5: Solving captcha with API key...');

                // Smart wait: Check if audio URL captured (max 3 seconds)
                console.log('Waiting for audio URL to be captured...');
                let audioReady = false;
                let audioWaitAttempts = 0;
                const maxAudioWaitAttempts = 15; // 15 x 200ms = 3 seconds max

                while (!audioReady && audioWaitAttempts < maxAudioWaitAttempts) {
                  audioWaitAttempts++;

                  if (window.captchaAudioUrls && window.captchaAudioUrls.length > 0) {
                    audioReady = true;
                    console.log(`✅ Audio URL captured after ${audioWaitAttempts * 200}ms`);
                    break;
                  }

                  await new Promise(resolve => setTimeout(resolve, 200)); // Check every 200ms instead of 500ms
                }

                if (!audioReady) {
                  console.log('⚠️ No audio URL captured after 3 seconds');
                }

                if (window.captchaAudioUrls && window.captchaAudioUrls.length > 0) {
                  // Use selectBestAudioUrl to choose the best candidate
                  const audioUrl = selectBestAudioUrl(window.captchaAudioUrls);
                  console.log('Audio URL selected:', audioUrl);
                  console.log('Total candidates:', window.captchaAudioUrls.length);

                  // Validate audio URL
                  console.log('Validating audio URL...');
                  const isValid = await isUrlAudioByHead(audioUrl);
                  if (!isValid) {
                    console.warn('⚠️ Selected URL may not be valid audio, but will try anyway');
                  } else {
                    console.log('✅ Audio URL validated successfully');
                  }

                  try {
                    // Initialize solver
                    console.log('Initializing CaptchaSolver...');
                    const solver = new CaptchaSolver(apiKey);

                    // Solve audio captcha
                    console.log('Calling solver.solveAudioCaptcha()...');
                    showNotification('🎵 Đang giải audio captcha...\n\nVui lòng đợi...');

                    const captchaText = await solver.solveAudioCaptcha(audioUrl);
                    console.log('Audio captcha solved:', captchaText);

                    if (captchaText) {
                      // Fill captcha input - Use same logic as solveAudioCaptchaAuto
                      console.log('Filling captcha input...');

                      // Find captcha input with priority order
                      let captchaInput = null;

                      // Method 1: By ID or class (most specific)
                      captchaInput = document.querySelector('input#audioCaptchaInput') ||
                        document.querySelector('input.audio-captcha-input') ||
                        document.querySelector('input.captcha-input');

                      if (captchaInput) {
                        console.log('✅ Found captcha input by ID/class:', captchaInput.id || captchaInput.className);
                      }

                      // Method 2: By pattern (numeric only)
                      if (!captchaInput) {
                        const numericInputs = document.querySelectorAll('input[pattern*="0-9"], input[inputmode="numeric"]');
                        for (const input of numericInputs) {
                          if (input.offsetParent === null) continue;
                          const pattern = input.pattern || '';
                          if (pattern.includes('[0-9]') && !pattern.includes('a-z') && !pattern.includes('A-Z')) {
                            captchaInput = input;
                            console.log('✅ Found captcha input by numeric pattern');
                            break;
                          }
                        }
                      }

                      // Method 3: By placeholder
                      if (!captchaInput) {
                        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
                        for (const input of inputs) {
                          const placeholder = (input.placeholder || '').toLowerCase();
                          if (placeholder.includes('nhập 6 số') ||
                            placeholder.includes('xác thực') ||
                            placeholder.includes('captcha')) {
                            captchaInput = input;
                            console.log('✅ Found captcha input by placeholder');
                            break;
                          }
                        }
                      }

                      if (captchaInput) {
                        console.log('📝 Filling captcha input:', captchaInput.placeholder || captchaInput.id);
                        // Use fast mode and NO FOCUS for check promo captcha
                        await fillInputAdvanced(captchaInput, captchaText, true, true);
                        console.log('Captcha filled (fast mode, no focus)');
                        showNotification('✅ Đã điền captcha: ' + captchaText);

                        // Wait a bit then click submit
                        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 1000ms to 300ms

                        // Click "Xác Thực" submit button
                        const submitButton = document.querySelector('button.audio-captcha-submit') ||
                          document.querySelector('button[type="submit"]');

                        if (submitButton) {
                          console.log('Clicking submit button...');
                          await clickElementNaturally(submitButton);
                          showNotification('✅ Đã submit captcha!');

                          // Note: "Nhận khuyến mãi" button will be clicked automatically
                          // by solveAudioCaptchaAuto() function after captcha is verified
                          console.log('⏳ Waiting for auto-click "Nhận khuyến mãi" from solveAudioCaptchaAuto...');
                        } else {
                          console.log('Submit button not found');
                          showNotification('⚠️ Vui lòng click "Xác Thực" thủ công');
                        }
                      } else {
                        console.log('Captcha input not found');
                        showNotification('⚠️ Không tìm thấy ô nhập captcha');
                      }
                    } else {
                      console.log('Failed to solve captcha');
                      showNotification('❌ Giải captcha thất bại!');
                    }
                  } catch (error) {
                    console.error('Error solving captcha:', error);
                    showNotification('❌ Lỗi: ' + error.message);
                  }
                } else {
                  console.log('No audio URL captured');
                  showNotification('⚠️ Không lấy được audio URL');
                }
              } else {
                console.log('No API key, user needs to solve captcha manually');
                showNotification('⚠️ Không có API key\n\nVui lòng giải captcha thủ công');
              }
            } else {
              console.log('Verify button not found');
            }
          } else {
            console.log('TAIAPP promo not found');
          }
        } else {
          console.log('Promo button not found');
        }

        // STEP 6: Flow completed, page will reload after "Nhận KM" click
        // Puppeteer will handle waiting for navigation and checking result
        console.log('Step 6: Check promo flow completed');

        console.log('✅ Check promo action completed');
        console.log('ℹ️  Page will reload after "Nhận KM" button click');
        console.log('ℹ️  Puppeteer will wait for navigation and check result');

        // STEP 7: Check promotions on page
        console.log('Step 7: Checking promotions on page...');
        const promotions = checkPromotions();
        console.log('Found promotions:', promotions);

        window.promoCheckRunning = false;
        sendResponse({
          success: true,
          promotions: promotions
        });
      } catch (error) {
        console.error('Check promotion error:', error);
        window.promoCheckRunning = false;
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  }

  if (request.action === 'findAndClickLogin') {
    console.log('?? Finding and clicking login button/link...');

    try {
      const result = findAndClickLoginButton();
      console.log('? Login button clicked:', result);
      sendResponse({ success: true, result: result });
    } catch (error) {
      console.error('? Login button error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }

  if (request.action === 'autoLogin') {
    // Prevent duplicate calls
    if (window.autoLoginRunning) {
      console.log('?? Auto-login already running, ignoring duplicate call');
      sendResponse({ success: false, error: 'Already running' });
      return true;
    }

    window.autoLoginRunning = true;
    console.log('?? Starting auto-login with data:', request.data);

    if (request.data.withdrawInfo) {
      window.withdrawInfo = request.data.withdrawInfo;
      sessionStorage.setItem('withdrawInfo', JSON.stringify(request.data.withdrawInfo));

      console.log('?? Stored withdraw info for later use');
    }

    // Step 0: Wait for page to fully load first
    console.log('?? Step 0: Checking if page is fully loaded...');
    console.log('?? Current readyState:', document.readyState);
    console.log('?? Current URL:', window.location.href);

    const waitForPageLoad = () => {
      if (document.readyState === 'complete') {
        console.log('? Page fully loaded, proceeding...');
        proceedWithLogin();
      } else {
        console.log('? Page still loading, waiting...');
        setTimeout(waitForPageLoad, 500);
      }
    };

    const proceedWithLogin = () => {
      // Step 1: Try to click login button first (in case form is hidden)
      console.log('Step 1: Looking for login button to click...');

      let loginButton = null;

      // PRIORITY 1: routerlink attribute (Angular)
      loginButton = document.querySelector('[routerlink="/Account/Login"]') ||
        document.querySelector('[routerlink="/account/login"]') ||
        document.querySelector('[routerlink*="Login"]') ||
        document.querySelector('[routerlink*="login"]');

      if (loginButton && loginButton.offsetParent !== null) {
        console.log('Found login button by routerlink:', loginButton.getAttribute('routerlink'));
      }

      // PRIORITY 2: translate attribute (Angular i18n)
      if (!loginButton) {
        loginButton = document.querySelector('[translate="Home_Login"]') ||
          document.querySelector('[translate*="Login"]');
        if (loginButton && loginButton.offsetParent !== null) {
          console.log('Found login button by translate attribute');
        }
      }

      // PRIORITY 3: class name
      if (!loginButton) {
        loginButton = document.querySelector('.btn-login') ||
          document.querySelector('button.login') ||
          document.querySelector('[class*="btn-login"]');
        if (loginButton && loginButton.offsetParent !== null) {
          console.log('Found login button by class');
        }
      }

      // PRIORITY 4: href attribute - any tag
      if (!loginButton) {
        loginButton = document.querySelector('[href*="/login"]') ||
          document.querySelector('[href*="/Login"]') ||
          document.querySelector('[href*="dang-nhap"]');
        if (loginButton && loginButton.offsetParent !== null) {
          console.log('Found login button by href');
        }
      }

      // PRIORITY 5: id attribute - any tag
      if (!loginButton) {
        loginButton = document.querySelector('[id*="login"]') ||
          document.querySelector('[id*="Login"]');
        if (loginButton && loginButton.offsetParent !== null) {
          console.log('Found login button by id');
        }
      }

      // PRIORITY 6: text content (fallback)
      if (!loginButton) {
        const allClickable = document.querySelectorAll('button, a, div[tabindex], span[tabindex], [onclick]');
        for (const el of allClickable) {
          if (el.offsetParent === null) continue;
          const text = el.textContent.trim().toLowerCase();
          if (text === 'đăng nhập' || text === 'login') {
            loginButton = el;
            console.log('Found login button by text:', text);
            break;
          }
        }
      }

      let needToWaitForForm = false;
      if (loginButton && loginButton.offsetParent !== null) {
        console.log('Clicking login button...');
        loginButton.click();
        needToWaitForForm = true;
        console.log('Will wait 1.5s for login form to appear');
      } else {
        console.log('No login button found, assuming form is already visible');
      }

      // Wait for form to appear if we clicked the button, then start smart check
      const initialDelay = needToWaitForForm ? 1500 : 0;

      setTimeout(() => {
        console.log('?? Step 2: Smart check - Looking for login form (will check 2 times)...');

        let checkCount = 0;
        const maxChecks = 2; // Reduced from 3 to 2 for speed
        const checkDelay = 500; // Reduced from 2000ms to 500ms
        let formCheckResults = [];

        const checkInterval = setInterval(() => {
          checkCount++;
          console.log(`?? [${checkCount}/${maxChecks}] Checking for login form...`);

          const allInputs = findAllInputs();
          const passwordInputs = allInputs.filter(inp =>
            inp.type === 'password' && inp.offsetParent !== null
          );

          // hasLoginForm = true if we found password inputs
          // hasLoginForm = false if we found NO password inputs BUT page has loaded (has visible content)
          // hasLoginForm = null if page not loaded yet (no inputs at all)
          let hasLoginForm = null;
          if (passwordInputs.length > 0) {
            hasLoginForm = true; // Found login form
          } else if (allInputs.length > 0) {
            // Has inputs but no password field = likely already logged in
            hasLoginForm = false;
          } else {
            // No inputs at all - check if page has meaningful content
            const hasContent = document.body && document.body.textContent.trim().length > 100;
            const hasImages = document.querySelectorAll('img').length > 0;
            const hasButtons = document.querySelectorAll('button, a').length > 5;

            if (hasContent || hasImages || hasButtons) {
              // Page has content but no inputs = might be logged in (dashboard/home page)
              hasLoginForm = false;
            } else {
              // Page has no content = not loaded yet
              hasLoginForm = null;
            }
          }

          formCheckResults.push(hasLoginForm);

          console.log(`?? Check ${checkCount}:`, {
            totalInputs: allInputs.length,
            passwordInputs: passwordInputs.length,
            hasLoginForm: hasLoginForm === true ? 'YES' : hasLoginForm === false ? 'NO (logged in)' : 'UNKNOWN (loading)'
          });

          // After 3 checks, make decision
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);

            // Count results
            const foundFormCount = formCheckResults.filter(r => r === true).length;
            const notFoundFormCount = formCheckResults.filter(r => r === false).length;
            const unknownCount = formCheckResults.filter(r => r === null).length;

            console.log('?? Final decision:', {
              checks: formCheckResults,
              foundFormCount,
              notFoundFormCount,
              unknownCount
            });

            // If we found login form at least once = Need to login
            if (foundFormCount > 0) {
              console.log('?? Found login form, proceeding with login...');
              tryAutoLogin();
              return;
            }

            // If we found NO login form AND page has loaded (notFoundFormCount > 0) = Maybe already logged in
            if (notFoundFormCount > 0 && unknownCount < maxChecks) {
              console.log('Page loaded but no login form found...');

              // Verify if truly logged in by checking for auth tokens
              console.log('🔍 Verifying login status by checking auth tokens...');
              const hasToken = checkLoginStatus();

              if (hasToken) {
                console.log('✅ Auth token found - truly already logged in!');
                console.log('Skipping login, going directly to withdraw page...');
                showNotification('✅ Đã đăng nhập rồi!\n\n💰 Chuyển thẳng đến trang rút tiền...');
                console.log('Login completed. Use "Thêm Ngân Hàng" button if needed.');
                window.autoLoginRunning = false;
                sendResponse({ success: true, alreadyLoggedIn: true });
                return;
              } else {
                console.log('❌ No auth token found - not actually logged in!');
                console.log('🔄 Will try to find login form again or show error...');
                // Continue to error handling below
              }
            }

            // If all checks returned null (page never loaded) = ERROR
            if (unknownCount === maxChecks) {
              console.error('❌ Page not loaded after 3 checks - No inputs found!');
              console.error('❌ Possible reasons: Page error, slow loading, or wrong URL');
              showNotification('❌ Lỗi: Không tìm thấy form đăng nhập!\n\n⚠️ Trang có thể chưa load xong hoặc URL sai.');
              window.autoLoginRunning = false;
              sendResponse({ success: false, error: 'No login form found after 3 checks' });
              return;
            }

            // Default: Try to login
            console.log('?? Found login form, proceeding with login...');
            tryAutoLogin();
          }
        }, checkDelay);
      }, initialDelay); // Close the setTimeout that waits for form to appear
    }; // Close proceedWithLogin function

    // Start by waiting for page load
    waitForPageLoad();

    let attempts = 0;
    const maxAttempts = 5;

    async function tryAutoLogin() {
      attempts++;
      console.log(`?? Auto-login attempt ${attempts}/${maxAttempts}...`);

      try {
        const result = await autoLoginForm(request.data.username, request.data.password, request.data.apiKey);

        const filledSomething = result.username || result.password;

        if (filledSomething) {
          console.log('? Auto-login completed:', result);
          window.autoLoginRunning = false;
          sendResponse({ success: true, result: result });
        } else if (attempts < maxAttempts) {
          console.log(`?? No inputs filled, retrying in ${attempts * 1000}ms...`);
          setTimeout(tryAutoLogin, attempts * 1000);
        } else {
          console.error('? Failed to login after', maxAttempts, 'attempts');
          window.autoLoginRunning = false;
          sendResponse({ success: false, error: 'No inputs found after multiple attempts' });
        }
      } catch (error) {
        console.error('? Auto-login error:', error);
        if (attempts < maxAttempts) {
          console.log(`?? Error occurred, retrying in ${attempts * 1000}ms...`);
          setTimeout(tryAutoLogin, attempts * 1000);
        } else {
          window.autoLoginRunning = false;
          sendResponse({ success: false, error: error.message });
        }
      }
    }

    return true;
  }

  if (request.action === 'autoFill') {
    console.log('📝 Starting auto-fill with data:', request.data);

    // Check if already logged in (skip register form fill)
    const currentUrl = window.location.href;
    const isLoggedIn = currentUrl.includes('/home') ||
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/profile') ||
      currentUrl.includes('/Financial') ||
      document.cookie.includes('token=') ||
      document.cookie.includes('_pat=');

    if (isLoggedIn) {
      console.log('✅ Already logged in, skipping register form fill');
      console.log('📍 Current URL:', currentUrl);
      sendResponse({ success: true, result: 'Already logged in' });
      return true;
    }

    // Prevent duplicate auto-fill
    if (window.autoFillRunning) {
      console.log('⚠️ Auto-fill already running, ignoring duplicate request');
      sendResponse({ success: false, error: 'Already running' });
      return true;
    }

    if (window.registerFormFilled) {
      console.log('✅ Form already filled, ignoring duplicate request');
      sendResponse({ success: true, result: 'Already filled' });
      return true;
    }

    window.autoFillRunning = true;

    if (request.data.apiKey) {
      window.currentApiKey = request.data.apiKey;
      console.log('🔑 Stored API key for captcha solving');
    }

    if (request.data.autoSubmit !== undefined) {
      window.autoSubmitRegister = request.data.autoSubmit;
      console.log('⚙️ Stored autoSubmit flag:', request.data.autoSubmit);
    }

    let attempts = 0;
    const maxAttempts = 2; // Reduced from 5 to 2 for speed

    async function tryAutoFill() {
      attempts++;
      console.log(`?? Auto-fill attempt ${attempts}/${maxAttempts}...`);

      try {
        const result = await autoFillForm(
          request.data.username,
          request.data.password,
          request.data.withdrawPassword,
          request.data.fullname
        );

        const filledSomething = result.username || result.password || result.fullname;

        if (filledSomething) {
          console.log('✅ Auto-fill completed:', result);
          window.registerFormFilled = true;
          window.autoFillRunning = false;
          sendResponse({ success: true, result: result });
        } else if (attempts < maxAttempts) {
          console.log(`⏳ No inputs filled, retrying in 500ms...`);
          setTimeout(tryAutoFill, 500); // Reduced from attempts * 1000 to fixed 500ms
        } else {
          console.error('❌ Failed to fill form after', maxAttempts, 'attempts');
          window.autoFillRunning = false;
          sendResponse({ success: false, error: 'No inputs found after multiple attempts' });
        }
      } catch (error) {
        console.error('❌ Auto-fill error:', error);
        if (attempts < maxAttempts) {
          console.log(`⏳ Error occurred, retrying in ${attempts * 1000}ms...`);
          setTimeout(tryAutoFill, attempts * 1000);
        } else {
          window.autoFillRunning = false;
          sendResponse({ success: false, error: error.message });
        }
      }
    }

    setTimeout(tryAutoFill, 500); // Reduced from 1500ms to 500ms for speed

    return true; // Keep channel open for async response
  }
});

async function autoFillForm(username, password, withdrawPassword, fullname) {
  console.log('📝 Starting auto-fill with:', { username, password: '***', withdrawPassword: '***', fullname });
  console.log('🌐 Current page:', window.location.href);

  // Check if form already filled
  if (window.registerFormFilled) {
    console.log('✅ Form already filled, skipping');
    return {
      username: true,
      password: true,
      withdrawPassword: true,
      fullname: true,
      checkbox: false
    };
  }

  let filled = {
    username: false,
    password: false,
    withdrawPassword: false,
    fullname: false,
    checkbox: false
  };

  // Priority 1: Use Angular formcontrolname attributes (most reliable)
  const accountInput = document.querySelector('input[formcontrolname="account"]');
  const passwordInput = document.querySelector('input[formcontrolname="password"]');
  const confirmPasswordInput = document.querySelector('input[formcontrolname="confirmPassword"]');
  const moneyPasswordInput = document.querySelector('input[formcontrolname="moneyPassword"]');
  const nameInput = document.querySelector('input[formcontrolname="name"]');

  if (accountInput && passwordInput) {
    console.log('? Found Angular form inputs by formcontrolname');

    // Fill all inputs in parallel for speed
    const fillPromises = [];

    if (accountInput) {
      fillPromises.push(fillInputAdvanced(accountInput, username, true).then(() => { filled.username = true; }));
    }

    if (passwordInput) {
      fillPromises.push(fillInputAdvanced(passwordInput, password, true).then(() => { filled.password = true; }));
    }

    if (confirmPasswordInput) {
      fillPromises.push(fillInputAdvanced(confirmPasswordInput, password, true));
    }

    if (moneyPasswordInput) {
      fillPromises.push(fillInputAdvanced(moneyPasswordInput, withdrawPassword, true).then(() => { filled.withdrawPassword = true; }));
    }

    if (nameInput) {
      fillPromises.push(fillInputAdvanced(nameInput, fullname, true).then(() => { filled.fullname = true; }));
    }

    // Wait for all fills to complete
    await Promise.all(fillPromises);
  } else {
    // Priority 2: Fallback to DOM order method
    console.log('?? Angular attributes not found, using fallback method');

    const allInputs = findAllInputs();
    console.log('?? Found inputs:', allInputs.length);

    const textInputs = [];
    const passwordInputs = [];
    const checkboxInputs = [];

    allInputs.forEach((input) => {
      if (input.type === 'hidden' || input.offsetParent === null) {
        return;
      }

      const type = input.type.toLowerCase();

      if (type === 'password') {
        passwordInputs.push(input);
      } else if (type === 'checkbox') {
        checkboxInputs.push(input);
      } else if (type === 'text' || type === 'tel' || type === 'email' || type === 'number' || !type) {
        textInputs.push(input);
      }
    });

    console.log('?? Categorized:', {
      text: textInputs.length,
      password: passwordInputs.length,
      checkbox: checkboxInputs.length
    });

    // Fill all inputs in parallel for speed
    const fillPromises = [];

    if (textInputs.length >= 1) {
      fillPromises.push(fillInputAdvanced(textInputs[0], username, true).then(() => { filled.username = true; }));
    }
    if (passwordInputs.length >= 1) {
      fillPromises.push(fillInputAdvanced(passwordInputs[0], password, true).then(() => { filled.password = true; }));
    }
    if (passwordInputs.length >= 2) {
      fillPromises.push(fillInputAdvanced(passwordInputs[1], password, true));
    }
    if (passwordInputs.length >= 3) {
      fillPromises.push(fillInputAdvanced(passwordInputs[2], withdrawPassword, true).then(() => { filled.withdrawPassword = true; }));
    }
    if (textInputs.length >= 2) {
      fillPromises.push(fillInputAdvanced(textInputs[1], fullname, true).then(() => { filled.fullname = true; }));
    }

    // Wait for all fills to complete
    await Promise.all(fillPromises);
  }

  // Priority 1: Find checkbox by formcontrolname="agree"
  let agreeCheckbox = document.querySelector('input[formcontrolname="agree"]');

  // Priority 2: Find checkbox by type (fallback)
  if (!agreeCheckbox) {
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log(`?? Found ${allCheckboxes.length} checkboxes in document`);
    if (allCheckboxes.length > 0) {
      agreeCheckbox = allCheckboxes[0];
    }
  }

  if (agreeCheckbox) {
    if (!agreeCheckbox.checked) {
      console.log('? Clicking agree checkbox');
      agreeCheckbox.click();

      // Wait and verify
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!agreeCheckbox.checked) {
        agreeCheckbox.checked = true;
        agreeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        agreeCheckbox.dispatchEvent(new Event('input', { bubbles: true }));
      }

      filled.checkbox = true;
      console.log('? Checkbox checked:', agreeCheckbox.checked);
    } else {
      console.log('? Checkbox already checked');
      filled.checkbox = true;
    }
  } else {
    console.log('?? No checkbox found');
  }

  // Highlight filled fields with animation
  setTimeout(() => {
    const allVisibleInputs = document.querySelectorAll('input');
    allVisibleInputs.forEach(input => {
      if (input.value && input.type !== 'hidden' && input.offsetParent !== null) {
        input.style.transition = 'all 0.3s ease';
        input.style.border = '3px solid #00ff00';
        input.style.boxShadow = '0 0 15px #00ff00';
        input.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
      }
    });
  }, 500);

  console.log('📊 Fill result:', filled);

  // FIXED: Always auto-submit when API key is available (like content-fixed.js)
  const apiKey = window.currentApiKey || '';
  const hasApiKey = apiKey && apiKey.trim() !== '';

  // Auto submit if API key available OR autoSubmitRegister flag is set
  const autoSubmit = hasApiKey || window.autoSubmitRegister || false;
  console.log('🔧 Auto Submit Mode:', autoSubmit ? 'ENABLED ✅' : 'DISABLED ❌');
  console.log('🔑 API Key available:', hasApiKey ? 'YES' : 'NO');

  // Handle captcha if present and API key available
  const captchaInput = document.querySelector('input[formcontrolname="checkCode"]') ||
    document.querySelector('input[placeholder*="xác minh"]') ||
    document.querySelector('input[placeholder*="captcha"]') ||
    document.querySelector('input[placeholder*="Captcha"]');

  if (captchaInput && captchaInput.offsetParent !== null && hasApiKey) {
    console.log('🔐 Captcha input found, attempting auto-solve');

    try {
      const captchaSolved = await solveCaptchaAuto(apiKey);
      filled.captcha = captchaSolved;

      if (captchaSolved) {
        console.log('✅ Captcha solved, preparing for submit...');

        // Wait for captcha to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify captcha input still has value
        const captchaValue = captchaInput.value;
        console.log(`🔍 Captcha verification - Input value: "${captchaValue}"`);

        if (captchaValue && captchaValue.length > 0) {
          console.log('🚀 Captcha verified, attempting submit...');

          // Find submit button
          const submitButton = document.querySelector('button[type="submit"]') ||
            document.querySelector('.submit-btn') ||
            document.querySelector('.btn-submit') ||
            document.querySelector('button.btn-primary') ||
            document.querySelector('input[type="submit"]');

          if (submitButton && submitButton.offsetParent !== null) {
            console.log('✅ Found submit button, clicking...');

            // Click submit button
            submitButton.click();
            submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            // Also try form submit
            const form = submitButton.closest('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true }));
            }

            filled.submitted = true;
            console.log('✅ Submit triggered successfully');

            // Wait for server to process
            console.log('⏳ Waiting for server to process registration...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check token every 500ms for 10 seconds after submit
            console.log('🔍 Starting token monitoring (500ms x 20 = 10s)...');

            let tokenFound = false;
            let attempts = 0;
            const maxAttempts = 20; // 20 x 500ms = 10 seconds

            const initialUrl = window.location.href;

            const tokenMonitor = setInterval(() => {
              attempts++;

              const cookies = document.cookie;
              const hasToken = cookies.includes('token=') ||
                cookies.includes('_pat=') ||
                localStorage.getItem('token');

              const currentUrl = window.location.href;
              const urlChanged = currentUrl !== initialUrl;
              const stillOnRegister = currentUrl.includes('/Register');

              console.log(`🔍 Check ${attempts}/${maxAttempts}: token=${hasToken ? 'YES' : 'NO'}, urlChanged=${urlChanged}, stillOnRegister=${stillOnRegister}`);

              // Priority 1: Token found - immediate redirect
              if (hasToken) {
                tokenFound = true;
                clearInterval(tokenMonitor);

                console.log('🎉 TOKEN FOUND! Redirecting immediately...');
                filled.submitSuccessful = true;

                const withdrawUrl = window.location.origin + '/Financial?type=withdraw';
                console.log('🚀 Redirect to:', withdrawUrl);

                window.location.href = withdrawUrl;
                filled.autoRedirected = true;
                return;
              }

              // Priority 2: URL changed away from Register page (backup method)
              if (urlChanged && !stillOnRegister) {
                tokenFound = true;
                clearInterval(tokenMonitor);

                console.log('🔄 URL CHANGED away from Register page - assuming success');
                filled.submitSuccessful = true;

                const withdrawUrl = window.location.origin + '/Financial?type=withdraw';
                console.log('🚀 Redirect to:', withdrawUrl);

                window.location.href = withdrawUrl;
                filled.autoRedirected = true;
                return;
              }

              // Timeout after 10 seconds
              if (attempts >= maxAttempts) {
                clearInterval(tokenMonitor);
                console.warn('⚠️ No token or URL change after 10 seconds - registration may have failed');
                filled.submitMayHaveFailed = true;
              }
            }, 500); // Check every 500ms
          } else {
            console.warn('⚠️ Submit button not found');
            filled.submitError = 'Submit button not found';
          }
        } else {
          console.warn('⚠️ Captcha input lost value');
          filled.captchaLost = true;
        }
      }
    } catch (captchaError) {
      console.error('❌ Captcha solve error:', captchaError);
      filled.captchaError = captchaError.message;
    }
  } else if (autoSubmit && !hasApiKey) {
    console.log('⚠️ Auto submit enabled but no API key - cannot solve captcha');
    showNotification('⚠️ Không có API key!\n\n⚠️ Vui lòng tự điền captcha và click "Đăng Ký"');
  } else {
    console.log('📝 Manual mode: Form filled, user will handle captcha and submit');
  }

  // Show notification
  if (filled.submitted) {
    showNotification('✅ Đã điền form và submit!\n\n⏳ Đang xử lý...');
  } else if (hasApiKey) {
    showNotification('✅ Đã điền form!\n\n⏳ Đang giải captcha...');
  } else {
    showNotification('✅ Đã điền form!\n\n⚠️ Vui lòng tự điền captcha và click "Đăng Ký"');
  }

  return filled;
}

async function autoLoginForm(username, password, apiKey) {
  console.log('?? Starting auto-login form fill');

  let filled = {
    username: false,
    password: false,
    captcha: false
  };

  // Priority 1: Use Angular formcontrolname attributes
  const accountInput = document.querySelector('input[formcontrolname="account"]');
  const passwordInput = document.querySelector('input[formcontrolname="password"]');
  const captchaInput = document.querySelector('input[formcontrolname="checkCode"]');

  if (accountInput && passwordInput) {
    console.log('? Found login form inputs by formcontrolname');

    if (accountInput) {
      await fillInputAdvanced(accountInput, username, true); // Fast mode
      filled.username = true;
    }

    if (passwordInput) {
      await fillInputAdvanced(passwordInput, password); // Normal mode
      filled.password = true;
    }

    // Handle captcha if present
    if (captchaInput && captchaInput.offsetParent !== null) {
      console.log('?? Captcha input found, will attempt to solve');

      // Step 1: Find and click the captcha refresh icon to trigger image display
      console.log('?? Looking for captcha refresh icon...');
      const captchaParent = captchaInput.parentElement;
      const refreshIcon = captchaParent ? captchaParent.querySelector('.fas.fa-sync.refresh') : null;

      if (refreshIcon) {
        console.log('? Found refresh icon, clicking to trigger captcha...');
        refreshIcon.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        refreshIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      } else {
        console.log('?? Refresh icon not found, trying to click input instead...');
        captchaInput.focus();
        captchaInput.click();
      }

      // Wait for captcha image to appear
      console.log('? Waiting 2s for captcha image to load...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to solve captcha with API key if available
      if (apiKey && apiKey.trim() !== '') {
        console.log('?? API key available, attempting auto-solve captcha');
        await solveCaptchaAuto(apiKey);
        filled.captcha = true;
      } else {
        console.log('?? No API key, captcha must be solved manually');
      }
    }
  } else {
    console.log('?? Angular form not found, using fallback');

    // Fallback: Find inputs by type
    const allInputs = findAllInputs();
    const visibleInputs = allInputs.filter(inp =>
      inp.type !== 'hidden' && inp.offsetParent !== null
    );

    const textInputs = visibleInputs.filter(inp =>
      inp.type === 'text' || inp.type === 'tel' || inp.type === 'email'
    );
    const passwordInputs = visibleInputs.filter(inp => inp.type === 'password');

    if (textInputs.length >= 1) {
      await fillInputAdvanced(textInputs[0], username, true); // Fast mode
      filled.username = true;
    }

    if (passwordInputs.length >= 1) {
      await fillInputAdvanced(passwordInputs[0], password); // Normal mode
      filled.password = true;
    }
  }

  console.log('?? Login fill result:', filled);

  // Auto-submit login form after filling
  if (filled.username && filled.password) {
    console.log('✅ Form filled successfully, attempting to submit...');

    // Wait a bit for form validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find and click submit button
    const submitButton = findLoginSubmitButton();
    if (submitButton) {
      console.log('✅ Found submit button, clicking...');
      await clickElementNaturally(submitButton);
      console.log('✅ Login form submitted!');

      // Mark that we submitted
      filled.submitted = true;

      // Start monitoring for token immediately after submit
      console.log('🔍 Starting token monitoring (10 seconds)...');
      startLoginTokenMonitor();
    } else {
      console.warn('⚠️ Submit button not found, form not submitted');
      filled.submitted = false;
    }
  } else {
    console.warn('⚠️ Form not fully filled, skipping submit');
    filled.submitted = false;
  }

  return filled;
}

async function fillInputAdvanced(input, value, fastMode = false, noFocus = false) {
  if (!input) {
    console.warn('⚠️ Input is null');
    return false;
  }

  if (input.value === value.toString()) {
    console.log('✅ Input already has correct value, skipping:', input.placeholder || input.name);
    return true;
  }

  console.log('⚡ Setting value directly:', input.placeholder || input.name, '→', value);
  if (noFocus) {
    console.log('⚠️ NO FOCUS mode - will not focus/click input (for captcha)');
  }

  try {
    // Only focus/click if noFocus is false
    if (!noFocus) {
      input.focus();
      input.click();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (input.value !== '') {
      console.log('   Clearing existing value:', input.value);
      input.value = '';
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;

    // Set value directly (no typing simulation)
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value.toString());
    } else {
      input.value = value.toString();
    }

    // Trigger all necessary events for Angular/React/Vue frameworks
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    console.log('✅ Value set successfully:', input.value);

    return true;
  } catch (e) {
    console.error('❌ Error in fillInputAdvanced:', e);
    return false;
  }
}

// Touch element naturally like a human on mobile to avoid bot detection
async function clickElementNaturally(element) {
  if (!element) {
    console.warn('? Element is null');
    return false;
  }

  console.log('? Simuulating natural touch on:', element.tagName, element.textContent.trim().substring(0, 30));

  try {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() * 10 - 5); // Add random offset
    const y = rect.top + rect.height / 2 + (Math.random() * 10 - 5);

    console.log('? Toucsh position:', { x, y });

    // Scroll element into view first
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 150));

    // Create touch object
    const touch = new Touch({
      identifier: Date.now(),
      target: element,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      pageX: x + window.pageXOffset,
      pageY: y + window.pageYOffset,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 0,
      force: 0.5
    });

    console.log('  1?? Dispatching touchstart...');
    element.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      view: window,
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch]
    }));
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 70));

    if (element.focus) {
      console.log('  2?? Focusing element...');
      element.focus();
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    console.log('  3?? Dispatching touchend...');
    element.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      view: window,
      touches: [],
      targetTouches: [],
      changedTouches: [touch]
    }));
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log('  4?? Dispatching click...');
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    }));

    element.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('? Natural touch sequence completed');
    return true;

  } catch (error) {
    console.error('? Touch error:', error);
    // Fallback to simple click
    element.click();
    return false;
  }
}



function showNotification(message, autoHide = true) {
  const existing = document.getElementById('auto-register-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'auto-register-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    font-size: 14px;
    font-family: Arial, sans-serif;
    white-space: pre-line;
    animation: slideIn 0.5s ease;
    max-width: 300px;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  notification.textContent = message;
  document.body.appendChild(notification);

  if (autoHide) {
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.5s ease reverse';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }
}

// Show persistent notification that won't auto-hide (user must close manually)
function showPersistentNotification(message) {
  const existing = document.getElementById('auto-register-notification-persistent');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'auto-register-notification-persistent';
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f44336;
    color: white;
    padding: 25px 30px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 9999999;
    font-size: 15px;
    font-family: Arial, sans-serif;
    white-space: pre-line;
    max-width: 400px;
    animation: fadeIn 0.3s ease;
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    font-size: 20px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  closeButton.onmouseover = () => closeButton.style.background = 'rgba(255,255,255,0.3)';
  closeButton.onmouseout = () => closeButton.style.background = 'rgba(255,255,255,0.2)';
  closeButton.onclick = () => notification.remove();

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  notification.textContent = message;
  notification.appendChild(closeButton);
  document.body.appendChild(notification);
}

// Enhanced function to find ALL inputs including Shadow DOM and iframes
function findAllInputs() {
  const inputs = [];

  console.log('?? Method 1: Searching regular DOM...');
  const regularInputs = document.querySelectorAll('input');
  inputs.push(...regularInputs);
  console.log(`  Found ${regularInputs.length} inputs in regular DOM`);

  console.log('?? Method 2: Searching Shadow DOM...');
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    if (el.shadowRoot) {
      const shadowInputs = el.shadowRoot.querySelectorAll('input');
      if (shadowInputs.length > 0) {
        console.log(`  Found ${shadowInputs.length} inputs in Shadow DOM of`, el.tagName);
        inputs.push(...shadowInputs);
      }
    }
  });

  console.log('?? Method 3: Searching iframes...');
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, index) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const iframeInputs = iframeDoc.querySelectorAll('input');
      if (iframeInputs.length > 0) {
        console.log(`  Found ${iframeInputs.length} inputs in iframe ${index}`);
        inputs.push(...iframeInputs);
      }
    } catch (e) {
      console.log(`  Cannot access iframe ${index} (cross-origin):`, e.message);
    }
  });

  console.log('?? Method 4: Searching for Vant UI fields...');
  const vanFields = document.querySelectorAll('.van-field, .van-cell, [class*="van-field"]');
  console.log(`  Found ${vanFields.length} Vant field containers`);
  vanFields.forEach((field) => {
    const fieldInputs = field.querySelectorAll('input');
    fieldInputs.forEach(inp => {
      if (!inputs.includes(inp)) {
        inputs.push(inp);
      }
    });
  });

  console.log(`? Total unique inputs found: ${inputs.length}`);

  return inputs;
}

// Helper function to find captcha input in login form
function findCaptchaInputInLoginForm() {
  console.log('?? Finding captcha input...');

  // Re-find all inputs (in case page changed)
  const allInputsNow = findAllInputs();
  const visibleInputsNow = Array.from(allInputsNow).filter(inp =>
    inp.type !== 'hidden' && inp.offsetParent !== null
  );

  console.log('?? Found visible inputs:', visibleInputsNow.length);

  let captchaInput = null;
  const captchaKeywords = ['m� x�c minh', 'm� x�c th?c', 'captcha', 'verification', 'verify', 'code', '???', 'x�c minh', 'xac minh', 'checkcode'];

  for (const input of visibleInputsNow) {
    const placeholder = (input.placeholder || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const formControlName = (input.getAttribute('formcontrolname') || '').toLowerCase();
    const label = input.labels && input.labels[0] ? input.labels[0].textContent.toLowerCase() : '';

    for (const keyword of captchaKeywords) {
      if (placeholder.includes(keyword) || label.includes(keyword) || name.includes(keyword) || id.includes(keyword) || formControlName.includes(keyword)) {
        captchaInput = input;
        console.log('? Found captcha input by keyword:', keyword);
        console.log('   Input:', input.placeholder, input.name, input.id, input.getAttribute('formcontrolname'));
        return captchaInput;
      }
    }
  }

  if (!captchaInput && visibleInputsNow.length >= 3) {
    const thirdInput = visibleInputsNow[2];
    if (!thirdInput.value || thirdInput.value.trim() === '') {
      captchaInput = thirdInput;
      console.log('? Found captcha input as 3rd input (fallback)');
    }
  }

  return captchaInput;
}

// Helper function to click captcha input and trigger captcha display
async function clickCaptchaInputToTrigger(captchaInput) {
  console.log('??? Attempting to click captcha input to trigger captcha...');

  if (!captchaInput) {
    console.log('? No captcha input provided');
    return false;
  }

  // Scroll into view
  captchaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('  Method 1: Focus...');
  captchaInput.focus();
  await new Promise(resolve => setTimeout(resolve, 1000));

  let captchaImages = findCaptchaImagesInForm(captchaInput);
  if (captchaImages.length > 0) {
    console.log('  ? Captcha appeared after focus!');
    return true;
  }

  console.log('  Method 2: Native click...');
  captchaInput.click();
  await new Promise(resolve => setTimeout(resolve, 1000));

  captchaImages = findCaptchaImagesInForm(captchaInput);
  if (captchaImages.length > 0) {
    console.log('  ? Captcha appeared after click!');
    return true;
  }

  console.log('  Method 3: Dispatch events...');
  captchaInput.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 50));
  captchaInput.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 50));
  captchaInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 1000));

  captchaImages = findCaptchaImagesInForm(captchaInput);
  if (captchaImages.length > 0) {
    console.log('  ? Captcha appeared after dispatch events!');
    return true;
  }

  console.log('  ?? Could not trigger captcha automatically');
  return false;
}

// Helper function to find captcha images in form
function findCaptchaImagesInForm(captchaInput) {
  const parent = captchaInput ? captchaInput.closest('form, .form, div[class*="form"], div[class*="login"]') : document.body;
  const images = Array.from(parent.querySelectorAll('img, canvas')).filter(img => {
    if (img.tagName === 'CANVAS') return true;
    const src = (img.src || '').toLowerCase();
    const id = (img.id || '').toLowerCase();
    return src.includes('captcha') || src.includes('verify') || src.includes('code') ||
      id.includes('captcha') || src.startsWith('data:');
  });
  return images.filter(img => img.offsetParent !== null);
}

// Helper function to find captcha refresh icon
function findCaptchaRefreshIcon(captchaInput) {
  console.log('?? Searching for captcha refresh icon...');

  if (!captchaInput) return null;

  console.log('   Method 0: Direct search for fa-sync refresh...');
  const formParent = captchaInput.closest('form, .form, div[class*="form"], div[class*="login"]') || document.body;

  // Look for FontAwesome refresh icon
  const faRefresh = formParent.querySelector('i.fa-sync, i.refresh, i[class*="fa-sync"], i[class*="refresh"]');
  if (faRefresh) {
    console.log('   ? Found FontAwesome refresh icon:', faRefresh.className);
    return faRefresh;
  }

  // Look for any <i> tag with refresh in class
  const allIcons = Array.from(formParent.querySelectorAll('i'));
  for (const icon of allIcons) {
    const className = (icon.className || '').toLowerCase();
    if (className.includes('refresh') || className.includes('sync') || className.includes('reload')) {
      console.log('   ? Found <i> with refresh class:', icon.className);
      return icon;
    }
  }

  const inputParent = captchaInput.parentElement;
  if (inputParent) {
    console.log('   Method 1: Checking input parent...');
    const iconsInParent = Array.from(inputParent.querySelectorAll('i, svg, img, button, a, span, div'));

    console.log(`   Found ${iconsInParent.length} elements in input parent`);

    for (const el of iconsInParent) {
      if (el === captchaInput) continue;

      const className = (el.className || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const text = (el.textContent || '').trim();

      if (className.includes('refresh') || className.includes('sync')) {
        console.log(`   Checking element:`, {
          tag: el.tagName,
          class: className,
          visible: el.offsetParent !== null,
          html: el.outerHTML.substring(0, 100)
        });
      }

      if (className.includes('refresh') || className.includes('reload') ||
        className.includes('sync') || className.includes('rotate') ||
        className.includes('fa-sync') || className.includes('fas') ||
        id.includes('refresh') || id.includes('reload') ||
        text === '??' || text === '?' || text === '?') {

        // Don't check offsetParent for <i> tags (FontAwesome icons may not have offsetParent)
        if (el.tagName === 'I' || el.offsetParent !== null) {
          console.log(`   ? Found in input parent:`, el.tagName, className || id || text);
          return el;
        }
      }
    }
  }

  console.log('   Method 2: Checking elements near input...');
  const inputRect = captchaInput.getBoundingClientRect();

  const parent = captchaInput.closest('form, .form, div[class*="form"], div[class*="login"]') || document.body;
  const allElements = Array.from(parent.querySelectorAll('i, svg, img, button, a, span, div'));

  console.log(`   Found ${allElements.length} elements in form`);

  for (const el of allElements) {
    const className = (el.className || '').toLowerCase();

    // Special handling for FontAwesome icons
    if (className.includes('fa-sync') || className.includes('refresh')) {
      console.log(`   Found refresh icon:`, {
        tag: el.tagName,
        class: className,
        html: el.outerHTML.substring(0, 100)
      });
      return el;
    }

    // Position-based check
    if (!el.offsetParent && el.tagName !== 'I') continue;

    const elRect = el.getBoundingClientRect();

    const isRightOfInput = elRect.left >= inputRect.right - 50 && elRect.left <= inputRect.right + 100;
    const isSameRow = Math.abs(elRect.top - inputRect.top) < 50;

    if (isRightOfInput && isSameRow) {
      const text = (el.textContent || '').trim();

      // If it looks like an icon (small element or has icon class)
      if (elRect.width < 50 || elRect.height < 50 ||
        className.includes('icon') || className.includes('refresh') ||
        className.includes('sync') ||
        text === '??' || text === '?') {
        console.log(`   ? Found near input (right side):`, el.tagName, className || text);
        return el;
      }
    }
  }

  console.log('   Method 3: Looking near captcha image...');
  const captchaImage = parent.querySelector('img[id*="captcha"], img[src*="captcha"], img[id="captcha"]');

  if (captchaImage) {
    const imageRect = captchaImage.getBoundingClientRect();

    const imageParent = captchaImage.parentElement;
    if (imageParent) {
      const siblings = Array.from(imageParent.children);

      for (const sibling of siblings) {
        if (sibling === captchaImage || !sibling.offsetParent) continue;

        const siblingRect = sibling.getBoundingClientRect();
        const distance = Math.abs(siblingRect.left - imageRect.right) + Math.abs(siblingRect.top - imageRect.top);

        if (distance < 100) {
          console.log(`   ? Found near captcha image:`, sibling.tagName);
          return sibling;
        }
      }
    }
  }

  console.log('   ? No refresh icon found');
  return null;
}

// Helper function to find login/submit button
function findLoginSubmitButton() {
  console.log('?? Searching for login/submit button...');

  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a[role="button"]'));

  console.log(`   Found ${buttons.length} total buttons`);

  const visibleButtons = buttons.filter(btn => btn.offsetParent !== null);
  console.log(`   Found ${visibleButtons.length} visible buttons`);

  // Keywords for login button
  const loginKeywords = ['đăng nhập', 'dang nhap', 'login', 'sign in', 'submit'];

  for (const btn of visibleButtons) {
    const text = (btn.textContent || btn.value || '').toLowerCase().trim();

    for (const keyword of loginKeywords) {
      if (text === keyword || text.includes(keyword)) {
        console.log(`   ? Found by text: "${text}"`);
        return btn;
      }
    }
  }

  for (const btn of visibleButtons) {
    const className = (btn.className || '').toLowerCase();
    const id = (btn.id || '').toLowerCase();

    if (className.includes('login') || className.includes('submit') ||
      id.includes('login') || id.includes('submit')) {
      console.log(`   ? Found by class/id`);
      return btn;
    }
  }

  // Fallback: find submit button in form
  const form = document.querySelector('form');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && submitBtn.offsetParent !== null) {
      console.log(`   ? Found submit button in form`);
      return submitBtn;
    }
  }

  console.log('   ? No login button found');
  return null;
}


// Find and click login button - Use attributes first
function findAndClickLoginButton() {
  console.log('Searching for login button...');
  console.log('Current URL:', window.location.href);

  const currentUrl = window.location.href.toLowerCase();
  if (currentUrl.includes('/login') || currentUrl.includes('dang-nhap')) {
    console.log('Already on login page');
    return { success: true, method: 'already-on-page' };
  }

  // PRIORITY 1: routerlink/href attributes
  const loginSelectors = [
    '[routerlink="/Account/Login"]',
    '[routerlink="/account/login"]',
    '[routerlink*="Login"]',
    '[routerlink*="login"]',
    'a[href="/Account/Login"]',
    'a[href*="/login"]',
    'a[href*="/Login"]'
  ];

  for (const selector of loginSelectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) {
      console.log('Found login by attribute:', selector);
      el.click();
      return { success: true, method: 'attribute' };
    }
  }

  // PRIORITY 2: translate attribute
  const loginByTranslate = document.querySelector('[translate="Login"], [translate="Shared_Login"]');
  if (loginByTranslate && loginByTranslate.offsetParent !== null) {
    console.log('Found login by translate');
    const clickable = loginByTranslate.closest('a') || loginByTranslate.closest('button') || loginByTranslate;
    clickable.click();
    return { success: true, method: 'translate' };
  }

  // PRIORITY 3: Class-based
  const loginByClass = document.querySelector('.btn-login, .login-btn, [class*="login"]');
  if (loginByClass && loginByClass.offsetParent !== null) {
    const text = loginByClass.textContent.toLowerCase();
    if (text.includes('đăng nhập') || text.includes('login')) {
      console.log('Found login by class');
      loginByClass.click();
      return { success: true, method: 'class' };
    }
  }

  // PRIORITY 4: Icon class
  const loginIcon = document.querySelector('i.icon.login, i.login');
  if (loginIcon && loginIcon.offsetParent !== null) {
    console.log('Found login by icon');
    const clickable = loginIcon.closest('a') || loginIcon.closest('button') || loginIcon.closest('li') || loginIcon.parentElement;
    clickable.click();
    return { success: true, method: 'icon' };
  }

  // PRIORITY 5: Text search (fallback)
  console.log('Trying text search...');
  const allClickable = document.querySelectorAll('button, a, li, div[tabindex], span[tabindex]');
  for (const el of allClickable) {
    if (el.offsetParent === null) continue;
    const text = el.textContent.trim().toUpperCase();
    if (text === 'ĐĂNG NHẬP' || text === 'LOGIN' || text === 'SIGN IN') {
      console.log('Found login by text');
      el.click();
      return { success: true, method: 'text' };
    }
  }

  console.log('Login button not found');
  return { success: false };
}

function findAndClickRegisterButton() {
  console.log('?? Searching for register button...');
  console.log('?? Current URL:', window.location.href);

  const currentUrl = window.location.href.toLowerCase();
  if (currentUrl.includes('/register') || currentUrl.includes('dang-ky')) {
    console.log('? Already on register page');
    return { success: true, method: 'already-on-page' };
  }

  // Priority 1: Angular routerlink attribute (most reliable - works with any tag)
  const registerSelectors = [
    '[routerlink="/Account/Register"]',
    '[routerlink="/account/register"]',
    '[routerlink*="Register"]',
    'a[href="/Account/Register"]',
    'a[href*="/register"]'
  ];

  for (const selector of registerSelectors) {
    const registerElement = document.querySelector(selector);
    if (registerElement && registerElement.offsetParent !== null) {
      console.log('? Found register element by attribute:', selector, registerElement.tagName);
      registerElement.click();
      return { success: true, method: 'attribute' };
    }
  }

  // Priority 2: translate attribute (Angular i18n)
  const registerByTranslate = document.querySelector('[translate="Register_Register"]');
  if (registerByTranslate && registerByTranslate.offsetParent !== null) {
    console.log('? Found register element by translate attribute');
    registerByTranslate.click();
    return { success: true, method: 'translate' };
  }

  // Priority 3: Class-based selector
  const registerByClass = document.querySelector('.btn-register, .register-btn, [class*="register"]');
  if (registerByClass && registerByClass.offsetParent !== null) {
    const text = registerByClass.textContent.toLowerCase();
    if (text.includes('dang k�') || text.includes('register')) {
      console.log('? Found register element by class');
      registerByClass.click();
      return { success: true, method: 'class' };
    }
  }

  // Priority 4: Text-based search (fallback)
  const allButtons = document.querySelectorAll('button, a, li[tabindex], div[tabindex]');
  for (const btn of allButtons) {
    if (btn.offsetParent === null) continue;
    const text = btn.textContent.toLowerCase().trim();
    if (text === 'dang k�' || text === 'register') {
      console.log('? Found register element by text');
      btn.click();
      return { success: true, method: 'text' };
    }
  }

  console.log('? Register element not found');
  return { success: false };
}

// findAndClickWithdrawButton function removed - now using direct redirect
async function findAndClickWithdrawButton() {
  console.log('⚠️ DEPRECATED: findAndClickWithdrawButton() - now using direct redirect');
  return { success: false, method: 'deprecated' };
}

// REMOVED OLD IMPLEMENTATION:
/*
console.log('🔍 Searching for withdraw button...');
console.log('📍 Current URL:', window.location.href);

const currentUrl = window.location.href.toLowerCase();
if (currentUrl.includes('/financial') && currentUrl.includes('withdraw')) {
  console.log('✅ Already on withdraw page');
  return { success: true, method: 'already-on-page' };
}

// STEP 1: Check if "Nạp - Rút" menu needs to be clicked first
console.log('🔍 Step 1: Checking for "Nạp - Rút" menu...');
const walletIcon = document.querySelector('i.icon.wallet');
let napRutElement = null;

if (walletIcon && walletIcon.offsetParent !== null) {
  console.log('✅ Found wallet icon');
  let parent = walletIcon.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    if (parent.tagName === 'LI' || parent.tagName === 'DIV') {
      napRutElement = parent;
      console.log('  → Found parent:', parent.tagName);
      break;
    }
    parent = parent.parentElement;
    depth++;
  }
}

if (!napRutElement) {
  const allElements = document.querySelectorAll('span, div, li');
  for (const el of allElements) {
    if (el.textContent.trim() === 'Nạp - Rút' && el.offsetParent !== null) {
      console.log('✅ Found "Nạp - Rút" by text');
      napRutElement = el.closest('li') || el.closest('div') || el;
      break;
    }
  }
}

if (napRutElement) {
  const submenu = document.querySelector('ul.subFinancial, .subFinancial');
  if (!submenu || submenu.offsetParent === null) {
    console.log('  → Opening submenu...');
    napRutElement.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// STEP 2: Find withdraw button
console.log('🔍 Step 2: Looking for withdraw button...');

// PRIORITY 1: href="/Financial?type=withdraw"
let el = document.querySelector('a[href="/Financial?type=withdraw"], a[href*="Financial?type=withdraw"]');
if (el && el.offsetParent !== null) {
  console.log('✅ Found by href');
  el.click();
  return { success: true, method: 'href' };
}

// PRIORITY 2: translate="Shared_Withdraw"
el = document.querySelector('[translate="Shared_Withdraw"]');
if (el && el.offsetParent !== null) {
  console.log('✅ Found by translate');
  (el.closest('a') || el.closest('li') || el).click();
  return { success: true, method: 'translate' };
}

// PRIORITY 3: icon class "icon withdraw"
el = document.querySelector('i.icon.withdraw');
if (el && el.offsetParent !== null) {
  console.log('✅ Found by icon class');
  (el.closest('a') || el.closest('li') || el.parentElement).click();
  return { success: true, method: 'icon' };
}

// PRIORITY 4: withdrawal/withdraw class
el = document.querySelector('i.withdrawal, i.withdraw, .withdrawal, .withdraw');
if (el && el.offsetParent !== null) {
  console.log('✅ Found by class');
  (el.closest('a') || el.closest('li') || el.parentElement).click();
  return { success: true, method: 'class' };
}

// PRIORITY 5: fas fa-hand-holding-usd
el = document.querySelector('i.fas.fa-hand-holding-usd');
if (el && el.offsetParent !== null) {
  console.log('✅ Found by FA icon');
  (el.closest('a') || el.closest('li') || el.parentElement).click();
  return { success: true, method: 'fa-icon' };
}

// PRIORITY 6: routerlink/href
const selectors = ['[routerlink*="withdraw"]', '[routerlink*="Withdraw"]', 'a[href*="withdraw"]', 'a[href*="Withdraw"]', 'a[href*="rut-tien"]'];
for (const sel of selectors) {
  el = document.querySelector(sel);
  if (el && el.offsetParent !== null) {
    console.log('✅ Found by attribute:', sel);
    el.click();
    return { success: true, method: 'attribute' };
  }
}

// PRIORITY 7: Text fallback
console.log('⚠️ Trying text search...');
const clickable = document.querySelectorAll('button, a, li, div[tabindex], span[tabindex]');
for (const el of clickable) {
  if (el.offsetParent === null) continue;
  const text = el.textContent.trim().toUpperCase();
  if (text === 'RÚT TIỀN' || text === 'RÚT TIỀN NGAY' || text === 'WITHDRAW') {
    console.log('✅ Found by text');
    el.click();
    return { success: true, method: 'text' };
  }
}

console.log('❌ Not found');
return { success: false };
*/


// Wrapper function that accepts apiKey parameter
function solveCaptchaWithApiKey(apiKey) {
  console.log('?? Closing popups/overlays...');

  const closeSelectors = [
    '.van-popup__close-icon',
    '.van-icon-cross',
    '.van-icon-close',
    '[class*="close-icon"]',
    '[class*="close"]',
    '[class*="Close"]',
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    '.popup-close',
    '.modal-close',
    '.overlay-close',
    'i[class*="close"]',
    'span[class*="close"]'
  ];

  let closedCount = 0;
  closeSelectors.forEach(selector => {
    try {
      const closeButtons = document.querySelectorAll(selector);
      closeButtons.forEach(btn => {
        if (btn.offsetParent !== null) {
          console.log('  ? Clicking close button:', selector);
          btn.click();
          closedCount++;
        }
      });
    } catch (e) {
      // Ignore errors
    }
  });

  console.log(`  Clicked ${closedCount} close buttons`);

  const overlaySelectors = [
    '.van-popup',
    '.van-overlay',
    '[class*="popup"]',
    '[class*="Popup"]',
    '[class*="overlay"]',
    '[class*="Overlay"]',
    '[class*="modal"]',
    '[class*="Modal"]',
    '[class*="mask"]',
    '[class*="Mask"]'
  ];

  let hiddenCount = 0;
  overlaySelectors.forEach(selector => {
    try {
      const overlays = document.querySelectorAll(selector);
      overlays.forEach(overlay => {
        if (overlay.offsetParent !== null) {
          console.log('  ? Hiding overlay:', selector);
          overlay.style.display = 'none !important';
          overlay.style.visibility = 'hidden !important';
          overlay.style.opacity = '0 !important';
          overlay.style.pointerEvents = 'none !important';
          overlay.style.zIndex = '-9999 !important';
          hiddenCount++;
        }
      });
    } catch (e) {
      // Ignore errors
    }
  });

  console.log(`  Hidden ${hiddenCount} overlays`);

  const allElements = document.querySelectorAll('*');
  let removedCount = 0;
  allElements.forEach(el => {
    try {
      const style = window.getComputedStyle(el);
      const position = style.position;
      const zIndex = parseInt(style.zIndex) || 0;

      // If element is fixed/absolute with high z-index and covers most of screen
      if ((position === 'fixed' || position === 'absolute') && zIndex > 1000) {
        const rect = el.getBoundingClientRect();
        const coveragePercent = (rect.width * rect.height) / (window.innerWidth * window.innerHeight);

        // If covers more than 50% of screen, likely a popup
        if (coveragePercent > 0.5) {
          console.log('  ? Removing large overlay element');
          el.style.display = 'none !important';
          removedCount++;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  });

  console.log(`  Removed ${removedCount} large overlay elements`);
  console.log(`? Popup cleanup complete`);
}


function findAndClickPromoButton() {
  console.log('?? Finding "Ch?n Khuy?n M�i" button...');

  const allElements = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('div[role="button"]'),
    ...document.querySelectorAll('a'),
    ...document.querySelectorAll('span'),
    ...document.querySelectorAll('div')
  ];

  console.log(`?? Found ${allElements.length} total elements`);

  const visibleElements = allElements.filter(el => {
    return el.offsetParent !== null;
  });

  console.log(`??? Visible elements: ${visibleElements.length}`);

  // Keywords for promo button
  const promoKeywords = [
    'ch?n khuy?n m�i',
    'chon khuyen mai',
    'ch?n km',
    'chon km',
    'khuy?n m�i',
    'khuyen mai',
    'promotion',
    'select promo',
    'choose promo'
  ];

  console.log('?? Method 1: Searching by exact text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    // Must be short text (not a paragraph)
    if (text.length > 50) continue;

    for (let keyword of promoKeywords) {
      if (text === keyword) {
        console.log('? Found promo button by exact text:', text);
        clickPromoButton(element);
        return true;
      }
    }
  }

  console.log('?? Method 2: Searching by partial text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    // Must be short text
    if (text.length > 50) continue;

    if (text.includes('ch?n khuy?n m�i') ||
      text.includes('chon khuyen mai') ||
      text.includes('ch?n km') ||
      text.includes('khuy?n m�i')) {
      console.log('? Found promo button by partial text:', text);
      clickPromoButton(element);
      return true;
    }
  }

  console.log('?? Method 3: Searching by class name...');
  const promoClassElements = document.querySelectorAll(
    '[class*="promo"], [class*="Promo"], [class*="promotion"], [class*="Promotion"], ' +
    '[class*="khuyen-mai"], [class*="khuyenmai"], [class*="km"]'
  );

  for (let element of promoClassElements) {
    if (element.offsetParent !== null) {
      const text = element.textContent.trim().toLowerCase();

      if (element.tagName === 'BUTTON' ||
        element.tagName === 'A' ||
        element.getAttribute('role') === 'button' ||
        text.includes('ch?n') ||
        text.includes('chon')) {
        console.log('? Found promo button by class:', element.className);
        console.log('   Text:', text);
        clickPromoButton(element);
        return true;
      }
    }
  }

  console.log('?? Method 4: Searching by icon pattern...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    const hasIcon = element.querySelector('svg, img, [class*="icon"]');
    const hasPromoText = text.includes('khuy?n m�i') || text.includes('khuyen mai');

    if (hasIcon && hasPromoText && text.length < 50) {
      console.log('? Found promo button by icon+text pattern:', text);
      clickPromoButton(element);
      return true;
    }
  }

  console.log('?? No "Ch?n Khuy?n M�i" button found');
  console.log('?? Listing all buttons with text for debugging:');

  // Debug: List all button-like elements
  const buttons = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('[role="button"]'),
    ...document.querySelectorAll('a')
  ].filter(el => el.offsetParent !== null);

  buttons.slice(0, 20).forEach((btn, i) => {
    const text = btn.textContent.trim();
    if (text && text.length < 100) {
      console.log(`  ${i}: "${text}" (${btn.tagName}.${btn.className})`);
    }
  });

  return false;
}

/**
 * Click promo button with animation
 */
async function clickPromoButton(element) {
  console.log('?? Preparing to click promo button...');

  // Highlight element
  element.style.border = '5px solid #ffd700 !important';
  element.style.boxShadow = '0 0 30px #ffd700 !important';
  element.style.zIndex = '999999 !important';
  element.style.position = 'relative';
  element.style.backgroundColor = 'rgba(255, 215, 0, 0.3) !important';

  // Scroll to element
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Show notification
  showNotification('⏳ Đang chọn khuyến mãi...');

  // Click immediately with minimal delay (just for scroll to complete)
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('??? Clicking promo button with natural simulation...');

  const clickSuccess = await clickElementNaturally(element);

  if (clickSuccess) {
    showNotification('✅ Đã chọn khuyến mãi!');
    console.log('? Promo button clicked successfully');
  } else {
    // Fallback to regular click if natural click fails
    console.log('?? Natural click failed, trying fallback...');
    element.click();
    showNotification('✅ Đã chọn!');
  }

  // Find TAIAPP promo immediately after click (minimal delay)
  await new Promise(resolve => setTimeout(resolve, 500));
  findAndSelectTaiappPromo();
}

/**
 * Find and select TAIAPP promo code from popup
 */
async function findAndSelectTaiappPromo() {
  console.log('?? Finding TAIAPP promo code in popup...');

  console.log('? Waiting for popup to render (checking continuously)...');

  // Check continuously for popup instead of fixed delay
  let attempts = 0;
  const maxAttempts = 10; // Check for 5 seconds max

  while (attempts < maxAttempts) {
    attempts++;

    // Check if popup has rendered (has visible elements)
    const hasPopup = document.querySelectorAll('.modal, .popup, [role="dialog"]').length > 0 ||
      document.querySelectorAll('*').length > 100; // Page has content

    if (hasPopup) {
      console.log(`✅ Popup detected after ${attempts * 500}ms`);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  performTaiappSearch();
}

async function performTaiappSearch() {
  console.log('?? Starting TAIAPP search...');
  console.log('?? Current URL:', window.location.href);

  if (window.taiappClicked) {
    console.log('?? TAIAPP already clicked, skipping to prevent duplicate!');
    return true;
  }

  const allElements = Array.from(document.querySelectorAll('*'));

  console.log(`?? Found ${allElements.length} total elements`);

  const visibleElements = allElements.filter(el => {
    if (!el.offsetParent || el.clientHeight === 0 || el.clientWidth === 0) return false;
    const text = el.textContent.trim();
    return text.length > 0 && text.length < 200;
  });

  console.log(`??? Visible elements with text: ${visibleElements.length}`);

  console.log('?? Listing ALL visible text (first 50):');
  visibleElements.slice(0, 50).forEach((el, i) => {
    const text = el.textContent.trim();
    console.log(`  ${i}: "${text.substring(0, 80)}" (${el.tagName}.${el.className.substring(0, 30)})`);
  });

  // PRIORITY 1: Click "M� KHUY?N M�I" tab first (if exists)
  console.log('?? PRIORITY 1: Looking for "M� KHUY?N M�I" tab...');

  let tabClicked = false;
  for (let element of visibleElements) {
    const text = element.textContent.trim();

    if (text.length < 30 && (text === 'M� KHUY?N M�I' || text === 'M� Khuy?n M�i')) {
      console.log('? FOUND "M� KHUY?N M�I" TAB!');
      console.log('   Clicking to ensure it\'s active...');

      element.click();
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      tabClicked = true;

      console.log('? Tab clicked, waiting for content to load...');
      break; // Only click once
    }
  }

  if (tabClicked) {
    // Wait for tab content to load (check continuously instead of fixed delay)
    let tabLoadAttempts = 0;
    const maxTabLoadAttempts = 10; // Check for 2 seconds max

    while (tabLoadAttempts < maxTabLoadAttempts) {
      tabLoadAttempts++;

      // Check if tab content has loaded (has new visible elements)
      const currentElements = document.querySelectorAll('*').length;
      if (currentElements > 100) { // Has content
        console.log(`✅ Tab content loaded after ${tabLoadAttempts * 200}ms`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // PRIORITY 2: Search for APP-related promo in "M� KHUY?N M�I" section
  console.log('?? PRIORITY 2: Searching for APP promo in list...');

  const allElementsNow = Array.from(document.querySelectorAll('*'));
  const visibleNow = allElementsNow.filter(el => {
    if (!el.offsetParent || el.clientHeight === 0 || el.clientWidth === 0) return false;
    const text = el.textContent.trim();
    return text.length > 0 && text.length < 200;
  });

  for (let element of visibleNow) {
    const text = element.textContent.trim();
    const textLower = text.toLowerCase();

    // Must be short text (promo item name)
    if (text.length > 3 && text.length < 50) {
      const hasApp =
        textLower.includes('taiapp') ||
        textLower.includes('tai app') ||
        textLower.includes('t?i app') ||
        text.includes('TAIAPP') ||
        text.includes('TAI APP') ||
        text.includes('T?I APP');

      if (hasApp) {
        console.log('? FOUND APP PROMO IN LIST (PRIORITY 2)!');
        console.log('   Text:', text);
        console.log('   Element:', element.tagName, element.className);

        clickTaiappPromo(element);
        return true; // STOP HERE - Found and clicked!
      }
    }
  }

  // PRIORITY 3: Fallback - Search for TAIAPP anywhere
  console.log('?? PRIORITY 3: Fallback - Searching for TAIAPP anywhere...');

  for (let element of visibleElements) {
    const text = element.textContent.trim();
    const textLower = text.toLowerCase();

    const found =
      textLower.includes('taiapp') ||
      textLower.includes('tai app') ||
      textLower.includes('t?i app') ||
      text.includes('TAIAPP') ||
      text.includes('TAI APP') ||
      text.includes('T?I APP');

    if (found) {
      console.log('? FOUND TAIAPP (PRIORITY 3)!');
      console.log('   Text:', text);
      console.log('   Element:', element.tagName, element.className);
      console.log('   Parent:', element.parentElement?.tagName, element.parentElement?.className);

      clickTaiappPromo(element);
      return true; // STOP HERE - Found and clicked!
    }
  }

  // PRIORITY 4: Last resort - broader search
  console.log('?? PRIORITY 4: Last resort - Looking for any element with "app" in text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    // Look for short text with "app"
    if (text.length > 2 && text.length < 80 && text.includes('app')) {
      console.log('?? Found APP-related element (PRIORITY 4 fallback):', text);
      clickTaiappPromo(element);
      return true; // STOP HERE - Found and clicked!
    }
  }

  // If not found after checking all elements
  console.log('? Could not find any TAIAPP promo code after all attempts');
  console.log('?? This might mean:');
  console.log('   1. Popup not fully loaded yet');
  console.log('   2. Text is different (check logs above)');
  console.log('   3. Element is in shadow DOM or iframe');

  showNotification('⚠️ Không tìm thấy mã!');
  return false;
}

/**
 * Click TAIAPP promo code with animation
 */
async function clickTaiappPromo(element) {
  console.log('?? Preparing to click TAIAPP promo...');

  if (window.taiappClicked) {
    console.log('?? TAIAPP already clicked, skipping to prevent duplicate!');
    return;
  }

  // Mark as clicked IMMEDIATELY to prevent any other search from clicking again
  window.taiappClicked = true;
  console.log('?? Marked TAIAPP as clicked - will not click again');

  // Highlight element
  element.style.border = '5px solid #00ff00 !important';
  element.style.boxShadow = '0 0 30px #00ff00 !important';
  element.style.zIndex = '999999 !important';
  element.style.position = 'relative';
  element.style.backgroundColor = 'rgba(0, 255, 0, 0.3) !important';

  // Scroll to element
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Show notification
  showNotification('⏳ Đang chọn mã...');

  // Click immediately with minimal delay (just for scroll to complete)
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('??? Clicking TAIAPP promo with natural simulation...');

  const clickSuccess = await clickElementNaturally(element);

  if (clickSuccess) {
    showNotification('✅ Đã chọn mã TAIAPP!');
    console.log('? TAIAPP clicked successfully - proceeding to next step');
  } else {
    // Fallback to multiple click methods if natural click fails
    console.log('?? Natural click failed, trying fallback methods...');
    element.click();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    if (element.parentElement) {
      element.parentElement.click();
    }

    showNotification('✅ Đã chọn mã TAIAPP (fallback)!');
  }

  // Find verify button immediately after click (minimal delay)
  await new Promise(resolve => setTimeout(resolve, 300));
  findAndClickVerifyButton();
}

/**
 * Find and click "X�c Th?c T?i ��y" button
 */
function findAndClickVerifyButton() {
  console.log('🔍 Finding verify button (ENHANCED for 88vv/33win)...');

  const allElements = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('a'),
    ...document.querySelectorAll('div[role="button"]'),
    ...document.querySelectorAll('[onclick]'),
    ...document.querySelectorAll('div'),
    ...document.querySelectorAll('span'),
    ...document.querySelectorAll('input[type="button"]'),
    ...document.querySelectorAll('input[type="submit"]')
  ];

  console.log(`🔍 Found ${allElements.length} total elements`);

  const visibleElements = allElements.filter(el => {
    return el.offsetParent !== null && el.clientHeight > 0 && el.clientWidth > 0;
  });

  console.log(`👁️ Visible elements: ${visibleElements.length}`);

  // ENHANCED: Log ALL visible text elements for 88vv/33win debugging
  console.log('📋 ALL visible text elements (for debugging):');
  visibleElements.slice(0, 50).forEach((el, i) => {
    const text = el.textContent.trim();
    if (text && text.length < 100) {
      console.log(`  ${i}: "${text}" (${el.tagName}.${el.className})`);
    }
  });

  // FOCUSED: Only verify button keywords (NOT submit button)
  const verifyKeywords = [
    // Primary verify button keywords - EXACT MATCH ONLY
    'xác thực tại đây', 'xac thuc tai day', 'xác thực', 'xac thuc',
    'verify', 'confirm', 'xác nhận', 'xac nhan'
    // NOTE: 'nhận khuyến mãi' is for SUBMIT button, not verify button
  ];

  console.log('🎯 Method 0: Direct ID/Class search (88vv/33win specific)...');
  // Priority search for the exact button you found
  const directSelectors = [
    '#showAudioCaptcha',
    '.audio-captcha-btn',
    'button[id="showAudioCaptcha"]',
    'button.audio-captcha-btn',
    'button[class*="audio-captcha"]'
  ];

  for (let selector of directSelectors) {
    const element = document.querySelector(selector);
    console.log(`🔍 Checking selector "${selector}": ${element ? 'FOUND' : 'NOT FOUND'}`);
    if (element) {
      console.log(`   - Visible: ${element.offsetParent !== null}`);
      console.log(`   - Text: "${element.textContent.trim()}"`);
      if (element.offsetParent !== null) {
        const text = element.textContent.trim();
        console.log(`✅ Found verify button by direct selector "${selector}": "${text}"`);
        clickVerifyButton(element);
        return true;
      }
    }
  }

  console.log('❌ Method 0 failed - no direct selectors found');

  console.log('🎯 Method 1: EXACT keyword search (no partial matches)...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    if (!text || text.length > 100) continue;

    // EXACT MATCH ONLY - no partial matches to avoid confusion
    for (let keyword of verifyKeywords) {
      if (text === keyword) {
        console.log(`✅ Found verify button by EXACT keyword: "${text}"`);
        clickVerifyButton(element);
        return true;
      }
    }
  }

  console.log('🎯 Method 2: Button-like elements with action words...');
  const actionWords = ['xác', 'verify', 'confirm', 'nhận', 'get', 'apply', 'submit', 'ok', 'lấy'];

  for (let element of visibleElements) {
    const isButtonLike = element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.getAttribute('role') === 'button' ||
      element.onclick ||
      element.style.cursor === 'pointer' ||
      element.className.includes('btn') ||
      element.className.includes('button');

    if (isButtonLike) {
      const text = element.textContent.trim().toLowerCase();

      for (let word of actionWords) {
        if (text.includes(word) && text.length < 50 && text.length > 0) {
          console.log(`✅ Found action button: "${text}" (contains: ${word})`);
          clickVerifyButton(element);
          return true;
        }
      }
    }
  }

  console.log('🎯 Method 3: Colored buttons (red/orange/green)...');
  for (let element of visibleElements) {
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const text = element.textContent.trim().toLowerCase();

    if (bgColor.includes('rgb(') && text && text.length < 100 && text.length > 0) {
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);

        // Any prominent colored button
        if ((r > 150 && g < 150) || (r > 150 && g > 150 && b < 100) || (g > 150 && r < 100)) {
          console.log(`🎨 Found colored button: "${text}" (color: ${bgColor})`);
          clickVerifyButton(element);
          return true;
        }
      }
    }
  }

  console.log('🎯 Method 4: Class-based search (enhanced)...');
  const verifySelectors = [
    '[class*="verify"]', '[class*="Verify"]', '[class*="confirm"]', '[class*="Confirm"]',
    '[class*="submit"]', '[class*="Submit"]', '[class*="btn"]', '[class*="button"]',
    '[class*="apply"]', '[class*="Apply"]', '[class*="xac-thuc"]', '[class*="xacthuc"]',
    '[class*="nhan"]', '[class*="get"]', '[class*="action"]', '[class*="primary"]'
  ];

  for (let selector of verifySelectors) {
    const elements = document.querySelectorAll(selector);
    for (let element of elements) {
      if (element.offsetParent !== null) {
        const text = element.textContent.trim();
        if (text && text.length < 100 && text.length > 0) {
          console.log(`✅ Found by class "${selector}": "${text}"`);
          clickVerifyButton(element);
          return true;
        }
      }
    }
  }

  console.log('❌ No verify button found after ENHANCED search');
  console.log('💡 This might be normal for 88vv/33win - some sites may not have this step');

  return false;
}

/**
 * Click verify button with animation
 */
async function clickVerifyButton(element) {
  console.log('?? Preparing to click verify button...');

  // Highlight element
  element.style.border = '5px solid #ff0000 !important';
  element.style.boxShadow = '0 0 30px #ff0000 !important';
  element.style.zIndex = '999999 !important';
  element.style.position = 'relative';
  element.style.backgroundColor = 'rgba(255, 0, 0, 0.3) !important';

  // Scroll to element
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Show notification
  showNotification('🔐 Đang xác thực...');

  // Click immediately with minimal delay (just for scroll to complete)
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('🎯 Using simple click method (like working package)...');

  const clickSuccess = await clickElementNaturally(element);

  if (clickSuccess) {
    showNotification('✅ Đã click "Xác thực tại đây"!');
    console.log('Verify button clicked successfully');
  } else {
    // Fallback to regular click if natural click fails
    console.log('Natural click failed, trying fallback...');
    element.click();
    showNotification('✅ Đã xác thực (fallback)!');
  }

  // After clicking verify button, wait and check for captcha modal
  // Simple delay like working package (antisena)
  await new Promise(resolve => setTimeout(resolve, 300));

  // Now click "TẠO AUDIO CAPTCHA" button in the modal
  console.log('🎵 Looking for "TẠO AUDIO CAPTCHA" button in modal...');
  findAndClickCreateAudioButton();
}

/**
 * Find and click "T?o Audio Captcha" button
 */
function findAndClickCreateAudioButton() {
  console.log('?? Finding "T?o Audio Captcha" button...');

  const allElements = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('a'),
    ...document.querySelectorAll('div[role="button"]'),
    ...document.querySelectorAll('[onclick]'),
    ...document.querySelectorAll('div'),
    ...document.querySelectorAll('span')
  ];

  console.log(`?? Found ${allElements.length} total elements`);

  const visibleElements = allElements.filter(el => {
    return el.offsetParent !== null && el.clientHeight > 0 && el.clientWidth > 0;
  });

  console.log(`??? Visible elements: ${visibleElements.length}`);

  console.log('?? Listing all button-like elements:');
  const buttons = visibleElements.filter(el => {
    return el.tagName === 'BUTTON' ||
      el.tagName === 'A' ||
      el.getAttribute('role') === 'button' ||
      el.onclick ||
      el.style.cursor === 'pointer';
  });

  buttons.slice(0, 20).forEach((btn, i) => {
    const text = btn.textContent.trim();
    console.log(`  ${i}: "${text}" (${btn.tagName}.${btn.className})`);
  });

  // Keywords for create audio button
  const createAudioKeywords = [
    't?o audio captcha',
    'tao audio captcha',
    't?o audio',
    'tao audio',
    'create audio',
    'generate audio',
    'audio captcha'
  ];

  console.log('?? Method 1: Searching by exact text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    // Skip if too long
    if (text.length > 100) continue;

    for (let keyword of createAudioKeywords) {
      if (text === keyword) {
        console.log('? Found create audio button by exact text:', text);
        clickCreateAudioButton(element);
        return true;
      }
    }
  }

  console.log('?? Method 2: Searching by partial text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim().toLowerCase();

    // Skip if too long
    if (text.length > 100) continue;

    if (text.includes('t?o audio captcha') ||
      text.includes('tao audio captcha') ||
      text.includes('t?o audio')) {
      console.log('? Found create audio button by partial text:', text);
      clickCreateAudioButton(element);
      return true;
    }
  }

  console.log('?? Method 3: Searching by uppercase text...');
  for (let element of visibleElements) {
    const text = element.textContent.trim();

    // Skip if too long
    if (text.length > 100) continue;

    if (text.includes('T?O AUDIO CAPTCHA') ||
      text.includes('TAO AUDIO CAPTCHA') ||
      text.includes('T?O AUDIO')) {
      console.log('? Found create audio button by uppercase text:', text);
      clickCreateAudioButton(element);
      return true;
    }
  }

  console.log('?? Method 4: Searching for red button with audio text...');
  for (let element of visibleElements) {
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const text = element.textContent.trim().toLowerCase();

    if (bgColor.includes('rgb(') && text.length < 100) {
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);

        // Red button: R > 200, G < 100, B < 100
        if (r > 200 && g < 100 && b < 100) {
          if (text.includes('audio') || text.includes('t?o') || text.includes('tao')) {
            console.log('? Found red audio button:', text);
            clickCreateAudioButton(element);
            return true;
          }
        }
      }
    }
  }

  console.log('?? Method 5: Searching by class name...');
  const audioClassElements = document.querySelectorAll(
    '[class*="audio"], [class*="Audio"], [class*="captcha"], [class*="Captcha"], ' +
    '[class*="create"], [class*="Create"], [class*="generate"]'
  );

  for (let element of audioClassElements) {
    if (element.offsetParent !== null) {
      const text = element.textContent.trim().toLowerCase();
      if (text.includes('audio') || text.includes('t?o') || text.includes('captcha')) {
        console.log('? Found audio button by class:', element.className);
        console.log('   Text:', text);
        clickCreateAudioButton(element);
        return true;
      }
    }
  }

  console.log('?? No "T?o Audio Captcha" button found');
  console.log('?? User may need to click manually');
  showNotification('⚠️ Không tìm thấy audio!');

  return false;
}

/**
 * Click create audio button with animation
 */
async function clickCreateAudioButton(element) {
  console.log('?? Preparing to click create audio button...');

  if (window.audioButtonClicked) {
    console.log('?? Audio button already clicked, skipping to prevent multiple clicks');
    return;
  }

  // Mark as clicked immediately
  window.audioButtonClicked = true;
  console.log('?? Marked audio button as clicked - will not click again');

  // Highlight element
  element.style.border = '5px solid #ff6600 !important';
  element.style.boxShadow = '0 0 30px #ff6600 !important';
  element.style.zIndex = '999999 !important';
  element.style.position = 'relative';
  element.style.backgroundColor = 'rgba(255, 102, 0, 0.3) !important';

  // Scroll to element
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Show notification
  showNotification('⏳ Đang tạo audio...');

  // Click immediately with minimal delay (just for scroll to complete)
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('??? Clicking create audio button with natural simulation (ONE TIME ONLY)...');

  const clickSuccess = await clickElementNaturally(element);

  if (clickSuccess) {
    showNotification('✅ Đã click "Tạo Audio"!\n\n⏳ Đợi audio load...');
    console.log('Create audio button clicked successfully');
  } else {
    // Fallback to regular click if natural click fails
    console.log('Natural click failed, trying fallback...');
    element.click();
    showNotification('⏳ Đang load audio (fallback)...');
  }

  // Wait for audio to load, then manually check for audio element (multiple attempts)
  console.log('⏳ Starting audio detection (will check multiple times)...');

  let checkAttempts = 0;
  const maxAttempts = 20; // Increased to 20 attempts over 10 seconds (check until timeout)

  const checkForAudio = () => {
    checkAttempts++;
    console.log(`🔍 Audio check attempt ${checkAttempts}/${maxAttempts}...`);

    // Method 1: Check audio elements in DOM
    const audioElements = document.querySelectorAll('audio');
    console.log(`📊 Found ${audioElements.length} audio elements in DOM`);

    if (audioElements.length > 0) {
      audioElements.forEach((audio, index) => {
        const audioUrl = audio.src || audio.currentSrc;
        console.log(`  Audio ${index + 1}: ${audioUrl}`);

        if (audioUrl) {
          console.log('✅ Audio URL found from DOM, triggering addAudioUrl...');
          addAudioUrl(audioUrl);
        }
      });
      return; // Stop checking
    }

    // Method 2: Check window.captchaAudioUrls array (captured by interceptors)
    if (window.captchaAudioUrls && window.captchaAudioUrls.length > 0) {
      console.log(`📊 Found ${window.captchaAudioUrls.length} URLs in captchaAudioUrls array`);
      const latestUrl = window.captchaAudioUrls[window.captchaAudioUrls.length - 1];
      console.log(`  Latest URL: ${latestUrl}`);

      // Trigger auto-solve if in check promo mode
      if (window.apiKey && window.isCheckingPromo) {
        console.log('✅ Audio URL found from array, triggering auto-solve...');
        solveAudioCaptchaAuto(latestUrl);
      }
      return; // Stop checking
    }

    // Continue checking if not found and haven't reached max attempts
    if (checkAttempts < maxAttempts) {
      setTimeout(checkForAudio, 500); // Check every 500ms
    } else {
      console.log('❌ No audio found after 20 attempts (10 seconds)');
      console.log(`📊 captchaAudioUrls array: ${window.captchaAudioUrls ? window.captchaAudioUrls.length : 0} items`);
    }
  };

  // Also listen for console errors (Mixed Content warnings contain audio URL)
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const message = args.join(' ');
    if (message.includes('Mixed Content') && message.includes('audio')) {
      console.log('🎵 Detected audio URL from Mixed Content warning!');
      // Extract URL from message like: "...requested an insecure audio file 'http://...captcha.mp3'..."
      const urlMatch = message.match(/http[s]?:\/\/[^\s'"]+\.mp3/i);
      if (urlMatch) {
        const audioUrl = urlMatch[0].replace('http://', 'https://'); // Convert to HTTPS
        console.log('✅ Extracted audio URL:', audioUrl);
        addAudioUrl(audioUrl);
      }
    }
    return originalConsoleError.apply(console, args);
  };

  // Start checking immediately (no delay)
  checkForAudio();
}

function checkPromotions() {
  console.log('?? Checking for promotions on page...');
  console.log('?? Current URL:', window.location.href);

  const promotions = [];

  // Keywords to search for promotions
  const promoKeywords = [
    'khuy?n m�i', 'khuyen mai', 'promotion', 'bonus', 'thu?ng',
    'uu d�i', 'uu dai', 'qu� t?ng', 'qua tang', 'gift',
    'ho�n tr?', 'hoan tra', 'cashback', 'rebate'
  ];

  const allElements = document.querySelectorAll('*');

  allElements.forEach(el => {
    const text = el.textContent.trim();

    // Skip if too long (likely not a promo title)
    if (text.length > 200 || text.length < 5) return;

    const lowerText = text.toLowerCase();
    const hasPromoKeyword = promoKeywords.some(keyword => lowerText.includes(keyword));

    if (hasPromoKeyword) {
      const hasNumber = /\d+/.test(text);

      if (hasNumber) {
        // Avoid duplicates
        if (!promotions.includes(text)) {
          promotions.push(text);
        }
      }
    }
  });

  console.log(`?? Found ${promotions.length} promotions`);

  // Limit to top 10 promotions
  return promotions.slice(0, 10);
}

/**
 * Solve image captcha using 2Captcha API
 * @param {string} base64Image - Base64 encoded image
 * @param {string} apiKey - 2Captcha API key
 * @returns {Promise<object>} - {text: string} or null
 */
async function solveImageCaptcha(base64Image, apiKey) {
  try {
    console.log('?? Solving image captcha with autocaptcha.pro...');

    // Use the CaptchaSolver class from captcha-solver.js
    const solver = new CaptchaSolver(apiKey);
    const result = await solver.solveImageCaptcha(base64Image);

    if (result) {
      console.log('? Captcha solved:', result);
      return result;
    } else {
      console.error('? No result from API');
      return null;
    }

  } catch (error) {
    console.error('? Error solving image captcha:', error);
    return null;
  }
}

/**
 * Convert audio URL to base64
 * @param {string} audioUrl - URL of audio file
 * @returns {Promise<string>} - Base64 encoded audio
 */
async function audioUrlToBase64(audioUrl) {
  console.log('?? Downloading audio from:', audioUrl);

  try {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log('? Audio downloaded, size:', blob.size, 'bytes');
    console.log('   Type:', blob.type);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        console.log('? Audio converted to base64');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('? Failed to download audio:', error);
    throw error;
  }
}

/**
 * Choose the best audio URL from the captured list.
 * Priority: URLs with 'captcha' keyword, then audio extensions, then audio path, then most recent
 */
function selectBestAudioUrl(urls) {
  if (!urls || urls.length === 0) return null;

  // Prefer URLs with 'captcha' keyword
  const hasCaptcha = urls.find(u => u.toLowerCase().includes('captcha') || u.toLowerCase().includes('audio-captcha'));
  if (hasCaptcha) {
    console.log('🎵 Selected URL with "captcha" keyword:', hasCaptcha);
    return hasCaptcha;
  }

  // Prefer exact audio extension file (.mp3/.wav/.ogg/.m4a)
  const exts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  for (const ext of exts) {
    const found = urls.find(u => u.toLowerCase().includes(ext));
    if (found) {
      console.log(`🎵 Selected URL with extension "${ext}":`, found);
      return found;
    }
  }

  // Prefer URLs that contain 'audio' in path (not just query strings)
  const audioPath = urls.find(u => u.toLowerCase().includes('/audio/') || u.toLowerCase().includes('/sound/'));
  if (audioPath) {
    console.log('🎵 Selected URL with audio path:', audioPath);
    return audioPath;
  }

  // Otherwise return the last one (most recent) as fallback
  console.log('🎵 Selected most recent URL:', urls[urls.length - 1]);
  return urls[urls.length - 1];
}

/**
 * Validate audio URL by checking Content-Type header
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} - True if URL is audio
 */
async function isUrlAudioByHead(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();

  // Blob or data URL -> treat as valid audio
  if (lower.startsWith('blob:') || lower.startsWith('data:audio/') || lower.startsWith('data:')) {
    console.log('🎵 URL is blob/data, treating as valid audio');
    return true;
  }

  // If url has typical audio extension, treat as likely audio
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  for (const ext of audioExtensions) {
    if (lower.endsWith(ext) || lower.includes(ext + '?') || lower.includes(ext + '&')) {
      console.log(`🎵 URL has audio extension "${ext}", treating as valid`);
      return true;
    }
  }

  // Try HEAD first - if blocked due to CORS, fall back to GET with Range
  try {
    console.log('🎵 Checking Content-Type with HEAD request...');
    const head = await fetch(url, { method: 'HEAD' });
    const ct = head.headers.get('content-type') || '';
    if (ct.toLowerCase().includes('audio')) {
      console.log('🎵 HEAD request confirmed audio Content-Type:', ct);
      return true;
    }
  } catch (e) {
    console.log('🎵 HEAD request failed, trying GET with Range...');
    // Fall back to GET limited range
    try {
      const r = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-1023' }
      });
      const ct2 = r.headers.get('content-type') || '';
      if (ct2.toLowerCase().includes('audio')) {
        console.log('🎵 GET request confirmed audio Content-Type:', ct2);
        return true;
      }
    } catch (e2) {
      console.log('🎵 Both HEAD and GET failed, cannot verify');
      return false;
    }
  }
  return false;
}

/**
 * Automatically solve audio captcha when URL is received
 * @param {string} audioUrl - Audio captcha URL
 */
async function solveAudioCaptchaAuto(audioUrl) {
  console.log('🎵 Starting auto-solve for audio captcha...');
  console.log('🔗 Audio URL:', audioUrl);

  const apiKey = window.currentApiKey;
  if (!apiKey) {
    console.log('❌ No API key available');
    return;
  }

  // Prevent duplicate solving
  if (window.audioSolving) {
    console.log('⚠️ Already solving audio captcha, skipping...');
    return;
  }

  window.audioSolving = true;

  try {
    const solver = new CaptchaSolver(apiKey);
    showNotification('🎵 Đang giải audio captcha...\n\nVui lòng đợi...');

    const captchaText = await solver.solveAudioCaptcha(audioUrl);
    console.log('✅ Audio captcha solved:', captchaText);

    if (captchaText) {
      // Find and fill captcha input - PRIORITY ORDER MATTERS!
      console.log('🔍 Searching for captcha input...');

      // First, try to find captcha input by specific attributes
      let captchaInput = null;

      // Method 1: By ID or class (most specific) - HIGHEST PRIORITY
      captchaInput = document.querySelector('input#audioCaptchaInput') ||
        document.querySelector('input.audio-captcha-input') ||
        document.querySelector('input.captcha-input');

      if (captchaInput) {
        console.log('✅ Found captcha input by ID/class:', captchaInput.id || captchaInput.className);
        console.log('   Pattern:', captchaInput.pattern);
        console.log('   InputMode:', captchaInput.inputMode);
      }

      // Method 2: By pattern (numeric only) - VERY SPECIFIC
      if (!captchaInput) {
        const numericInputs = document.querySelectorAll('input[pattern*="0-9"], input[inputmode="numeric"]');
        for (const input of numericInputs) {
          // Skip if hidden
          if (input.offsetParent === null) continue;

          const pattern = input.pattern || '';
          const placeholder = (input.placeholder || '').toLowerCase();

          // Check if it's numeric-only pattern (captcha is usually 6 digits)
          if (pattern.includes('[0-9]') && !pattern.includes('a-z') && !pattern.includes('A-Z')) {
            captchaInput = input;
            console.log('✅ Found captcha input by numeric pattern:', input.pattern);
            console.log('   Placeholder:', input.placeholder);
            break;
          }
        }
      }

      // Method 3: By placeholder text (very specific)
      if (!captchaInput) {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of inputs) {
          const placeholder = (input.placeholder || '').toLowerCase();
          if (placeholder.includes('nhập 6 số') ||
            placeholder.includes('xác thực') ||
            placeholder.includes('captcha') ||
            placeholder.includes('mã xác nhận')) {
            captchaInput = input;
            console.log('✅ Found captcha input by placeholder:', input.placeholder);
            break;
          }
        }
      }

      // Method 4: By name attribute
      if (!captchaInput) {
        captchaInput = document.querySelector('input[name*="captcha"]') ||
          document.querySelector('input[name*="verify"]') ||
          document.querySelector('input[name*="code"]');
        if (captchaInput) {
          console.log('✅ Found captcha input by name:', captchaInput.name);
        }
      }

      // Method 5: Find input near audio element or captcha modal
      if (!captchaInput) {
        const modal = document.querySelector('.audio-captcha-modal') ||
          document.querySelector('[class*="captcha"]');
        if (modal) {
          const modalInputs = modal.querySelectorAll('input[type="text"], input:not([type])');
          // Find empty input or input with short value (likely captcha)
          for (const input of modalInputs) {
            if (input.value.length < 10 && input.offsetParent !== null) {
              captchaInput = input;
              console.log('✅ Found captcha input in modal');
              break;
            }
          }
        }
      }

      // Method 6: Exclude common inputs (username, password, etc.) - LAST RESORT
      if (!captchaInput) {
        const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of allInputs) {
          // Skip if hidden
          if (input.offsetParent === null) continue;

          // Skip if it's username/password/email field
          const name = (input.name || '').toLowerCase();
          const id = (input.id || '').toLowerCase();
          const placeholder = (input.placeholder || '').toLowerCase();
          const pattern = input.pattern || '';

          // IMPORTANT: Skip if pattern allows letters (username field)
          const allowsLetters = pattern.includes('a-z') || pattern.includes('A-Z');

          const isUserField = name.includes('user') || name.includes('name') || name.includes('tai_khoan') ||
            id.includes('user') || id.includes('name') || id.includes('tai_khoan') ||
            placeholder.includes('tên') || placeholder.includes('user') || placeholder.includes('người dùng');

          const isPasswordField = name.includes('pass') || id.includes('pass') ||
            placeholder.includes('mật khẩu') || placeholder.includes('password');

          const isEmailField = name.includes('email') || id.includes('email') ||
            placeholder.includes('email');

          // Skip if it's a username/password/email field OR allows letters
          if (allowsLetters || isUserField || isPasswordField || isEmailField) {
            console.log('⏭️  Skipping input (username/password/email or allows letters):', input.placeholder || input.name || input.id);
            continue;
          }

          if (input.value.length < 10) {
            captchaInput = input;
            console.log('✅ Found captcha input by exclusion:', input.placeholder || input.name || input.id);
            break;
          }
        }
      }

      if (captchaInput) {
        console.log('📝 Filling captcha input with:', captchaText);
        console.log('   Input details:', {
          id: captchaInput.id,
          name: captchaInput.name,
          placeholder: captchaInput.placeholder,
          className: captchaInput.className
        });

        // Use fast mode and NO FOCUS for audio captcha too
        await fillInputAdvanced(captchaInput, captchaText, true, true);
        console.log('✅ Captcha filled');
        showNotification('✅ Đã điền: ' + captchaText);

        // Wait before submitting (for validation)
        console.log('⏳ Waiting before submit...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s for server to process captcha input

        // Click submit button
        const submitBtn = document.querySelector('button.audio-captcha-submit') ||
          document.querySelector('button[type="submit"]') ||
          document.querySelector('button:contains("Xác Thực")');

        if (submitBtn) {
          console.log('✅ Clicking submit...');

          await clickElementNaturally(submitBtn);
          console.log('✅ Captcha submitted successfully');

          // If this is check promo flow, try to click "Nhận khuyến mãi" automatically
          if (window.isCheckingPromo) {
            console.log('🎁 Check promo flow - will try to auto-click "Nhận khuyến mãi"');
            showNotification('✅ Đã xác thực captcha!\n\n⏳ Đang tự động click "Nhận KM"...');

            // Find button first
            const promoBtn = document.getElementById('casinoSubmit') ||
              document.querySelector('button.submit-btn');

            if (promoBtn) {
              // Setup observer to watch for button enable and click immediately
              console.log('🎯 Setting up observer to watch for button enable...');

              let buttonClicked = false;

              const clickWhenEnabled = () => {
                if (!buttonClicked && !promoBtn.disabled) {
                  buttonClicked = true;
                  console.log('✅ Button enabled, clicking immediately!');
                  promoBtn.click();
                  window.promoButtonClickedSuccess = true;
                  showNotification('✅ Đã click "Nhận khuyến mãi"!');
                  return true;
                }
                return false;
              };

              // Check immediately
              if (clickWhenEnabled()) {
                console.log('✅ Button already enabled, clicked immediately');
              } else {
                console.log('⏳ Button disabled, watching for enable event...');

                // Watch for disabled attribute change
                const observer = new MutationObserver(() => {
                  if (clickWhenEnabled()) {
                    observer.disconnect();
                  }
                });

                observer.observe(promoBtn, {
                  attributes: true,
                  attributeFilter: ['disabled']
                });

                // Also poll every 100ms for faster detection
                const pollInterval = setInterval(() => {
                  if (clickWhenEnabled()) {
                    clearInterval(pollInterval);
                    observer.disconnect();
                  }
                }, 100);

                // Timeout after 5 seconds (reduced from 10s)
                setTimeout(() => {
                  clearInterval(pollInterval);
                  observer.disconnect();
                  if (!buttonClicked) {
                    console.log('⏰ Observer timeout after 5s');
                    if (!promoBtn.disabled) {
                      console.log('✅ Button enabled, clicking now');
                      promoBtn.click();
                      window.promoButtonClickedSuccess = true;
                      showNotification('✅ Đã click "Nhận khuyến mãi"!');
                    } else {
                      console.log('⚠️ Button still disabled after 5s');
                      showNotification('⚠️ Vui lòng click "Nhận khuyến mãi" thủ công');
                    }
                  }
                }, 5000);
              }
            } else {
              console.log('❌ Button not found');
              showNotification('⚠️ Không tìm thấy nút "Nhận khuyến mãi"');
            }
          } else {
            showNotification('✅ Đã xác thực captcha!');
          }
        } else {
          console.log('⚠️ Submit button not found, please click manually');
          showNotification('⚠️ Vui lòng click "Xác Thực" thủ công');
        }
      } else {
        console.log('❌ Captcha input not found');
        showNotification('❌ Không tìm thấy ô nhập captcha');
      }
    } else {
      console.log('❌ Failed to solve captcha');
      showNotification('❌ Giải captcha thất bại!');
    }
  } catch (error) {
    console.error('❌ Error solving audio captcha:', error);
    showNotification('❌ Lỗi: ' + error.message);
  } finally {
    window.audioSolving = false;
  }
}

/**
 * Automatically solve captcha using API
 * @param {string} apiKey - API key for captcha service
 * @returns {Promise<boolean>} - True if solved successfully
 */
async function solveCaptchaAuto(apiKey) {
  console.log('?? Starting automatic captcha solver...');
  console.log('?? Received API Key:', apiKey ? (apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5)) : 'EMPTY/UNDEFINED');

  if (window.captchaCompleted || sessionStorage.getItem('captchaCompleted') === 'true') {
    console.log('?? Captcha already COMPLETED and submitted, STOPPING completely!');
    showNotification('✅ Hoàn tất!');
    return true;
  }

  if (window.captchaFailed || sessionStorage.getItem('captchaFailed') === 'true') {
    console.log('?? Captcha FAILED (wrong answer), STOPPING completely!');
    showNotification('❌ Captcha sai!');
    return false;
  }

  if (window.captchaAttempted || sessionStorage.getItem('captchaAttempted') === 'true') {
    console.log('?? Captcha solving already attempted, skipping to prevent loop...');
    showNotification('⚠️ Đã thử rồi!');
    return false;
  }

  console.log('?? Starting captcha solve (not marked as attempted yet)');

  if (!apiKey) {
    console.error('? No API key provided');
    showNotification('❌ Chưa có API Key!');
    return false;
  }

  try {
    // Priority 1: Try to solve IMAGE captcha (for register/login forms)
    console.log('??? Step 1: Looking for IMAGE captcha...');
    const captchaInputField = document.querySelector('input[formcontrolname="checkCode"]') ||
      document.querySelector('input[placeholder*="x�c minh"]') ||
      document.querySelector('input[placeholder*="captcha"]');

    if (captchaInputField) {
      console.log('? Found captcha input');

      // Find captcha image near the input - try multiple times with increasing delays
      const form = captchaInputField.closest('form');
      let captchaImage = null;

      // Try 3 times with increasing delays (image appears after click)
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`?? Attempt ${attempt}/3: Looking for captcha image...`);

        // Priority 1: Find by id="captcha" (from HTML structure)
        captchaImage = form ? form.querySelector('img#captcha') : null;

        // Priority 2: Find by src starting with data:image
        if (!captchaImage) {
          captchaImage = form ? form.querySelector('img[src^="data:image"]') : null;
        }

        // Priority 3: Find any img in captcha input's parent
        if (!captchaImage) {
          const parent = captchaInputField.parentElement;
          if (parent) {
            captchaImage = parent.querySelector('img');
          }
        }

        if (captchaImage && captchaImage.src && captchaImage.src.startsWith('data:image')) {
          console.log(`? Found captcha image on attempt ${attempt}`);
          break;
        } else {
          if (attempt < 3) {
            const waitTime = attempt * 500; // 500ms, 1000ms
            console.log(`? Image not found, waiting ${waitTime}ms before retry...`);
            await new Promise(r => setTimeout(r, waitTime));
          }
        }
      }

      if (captchaImage && captchaImage.src && captchaImage.src.startsWith('data:image')) {
        console.log('? Found base64 captcha image');
        const base64Data = captchaImage.src.split(',')[1];

        if (base64Data) {
          console.log('?? Sending image to autocaptcha.pro API...');
          showNotification('⏳ Đang giải captcha...');

          // Mark as attempted BEFORE calling API to prevent duplicate calls
          window.captchaAttempted = true;
          sessionStorage.setItem('captchaAttempted', 'true');
          console.log('?? Marked as attempted before API call');

          const result = await solveImageCaptcha(base64Data, apiKey);

          if (result) {
            console.log('? Captcha solved:', result);
            // Use fast mode and NO FOCUS to prevent captcha change
            await fillInputAdvanced(captchaInputField, result, true, true);
            showNotification(`✅ Đã giải: ${result}\n\n⏳ Đang submit...`);

            // Wait a bit for the input to be processed
            await new Promise(r => setTimeout(r, 1000));

            // Find and click submit button
            console.log('?? Looking for submit button...');
            const submitButton = document.querySelector('button[type="submit"]') ||
              document.querySelector('.submit-btn') ||
              document.querySelector('.btn-submit');

            if (submitButton && submitButton.offsetParent !== null) {
              console.log('? Found submit button, clicking...');
              submitButton.click();
              submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              showNotification('✅ Đã submit!\n\n⏳ Đợi kết quả...');

              // Mark as completed
              window.captchaCompleted = true;
              sessionStorage.setItem('captchaCompleted', 'true');
              return true;
            } else {
              console.log('?? Submit button not found');
              showNotification(`✅ Đã giải: ${result}\n\n⚠️ Vui lòng click "Đăng Nhập"`);
              return true;
            }
          } else {
            console.error('? Failed to solve captcha');
            showNotification('❌ Giải captcha thất bại!');
            return false;
          }
        }
      } else {
        console.log('? No image captcha found after 3 attempts');
        showNotification('❌ Không tìm thấy captcha!\n\n⚠️ Vui lòng tự điền');
        return false;
      }
    } else {
      console.log('? Captcha input not found');
      return false;
    }


  } catch (error) {
    console.error('? Auto captcha solve error:', error);
    showNotification(`❌ LỖI GIẢI CAPTCHA!\n\n${error.message}\n\n⚠️ VUI LÒNG GIẢI THỦ CÔNG!\n\n(Đã dừng để tránh lặp lại)`);
    return false;
  }
}

/**
 * Find and click submit button
 */
function findAndClickSubmitButton() {
  console.log('?? Finding submit button...');

  const buttons = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('input[type="submit"]'),
    ...document.querySelectorAll('input[type="button"]'),
    ...document.querySelectorAll('div[role="button"]'),
    ...document.querySelectorAll('a[role="button"]')
  ];

  console.log(`?? Found ${buttons.length} buttons`);

  // Keywords for submit button
  const submitKeywords = [
    'submit', 'check', 'ki?m tra', 'kiem tra', 'x�c nh?n', 'xac nhan',
    'g?i', 'gui', 'ok', 'confirm', 'search', 't�m', 'tim'
  ];

  for (let button of buttons) {
    if (button.offsetParent === null) continue;

    const text = button.textContent.trim().toLowerCase();
    const hasKeyword = submitKeywords.some(keyword => text.includes(keyword));

    if (hasKeyword) {
      console.log('? Found submit button:', text);

      // Highlight button
      button.style.border = '3px solid #00ff00';
      button.style.boxShadow = '0 0 15px #00ff00';

      // Click button
      setTimeout(() => {
        console.log('?? Clicking submit button...');
        button.click();
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }, 500);

      return true;
    }
  }

  console.log('?? No submit button found');
  return false;
}


function checkLoginStatus() {
  console.log('?? Checking if user is already logged in...');

  // BEST METHOD: Check for authentication token in cookies
  // Common token cookie names: _pat, token, auth_token, access_token, session, etc.
  const cookies = document.cookie;
  const tokenCookieNames = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'jwt', 'bearer'];

  let hasAuthToken = false;
  let foundTokenName = '';

  for (const tokenName of tokenCookieNames) {
    if (cookies.includes(`${tokenName}=`)) {
      // Extract cookie value
      const cookieMatch = cookies.match(new RegExp(`${tokenName}=([^;]+)`));
      if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
        // Token exists and has reasonable length (> 10 chars)
        hasAuthToken = true;
        foundTokenName = tokenName;
        console.log(`   ? Found auth token: ${tokenName} (length: ${cookieMatch[1].length})`);
        break;
      }
    }
  }

  console.log('   Cookie check:', {
    hasAuthToken,
    foundTokenName,
    cookiesLength: cookies.length
  });

  // If we have auth token, user is definitely logged in!
  if (hasAuthToken) {
    console.log('?? Login status result:', {
      isLoggedIn: true,
      reason: `Auth token found: ${foundTokenName}`
    });

    return {
      isLoggedIn: true,
      reason: `Auth token found: ${foundTokenName}`
    };
  }

  // If no token, continue with other checks
  const currentUrl = window.location.href.toLowerCase();
  const bodyText = document.body.textContent.toLowerCase();

  // If URL contains login/signin/register, user is NOT logged in
  const isOnLoginPage = currentUrl.includes('/login') ||
    currentUrl.includes('/signin') ||
    currentUrl.includes('/dang-nhap') ||
    currentUrl.includes('/dangnhap') ||
    currentUrl.includes('/register') ||
    currentUrl.includes('/dang-ky') ||
    currentUrl.includes('/dangky');

  // If URL contains member area patterns, user IS logged in
  const isOnMemberArea = currentUrl.includes('/home') ||
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/account') ||
    currentUrl.includes('/member') ||
    currentUrl.includes('/user') ||
    currentUrl.includes('/profile') ||
    currentUrl.includes('/financial') ||
    currentUrl.includes('/wallet');

  console.log('   URL check:', {
    isOnLoginPage,
    isOnMemberArea,
    currentUrl: currentUrl.substring(0, 100)
  });

  const hasLoginForm = document.querySelector('form input[type="password"]') !== null;
  const hasLoginButton = Array.from(document.querySelectorAll('button, a')).some(el => {
    const text = (el.textContent || '').toLowerCase();
    return text.includes('đăng nhập') || text.includes('login') || text.includes('sign in');
  });

  console.log('   Form check:', {
    hasLoginForm,
    hasLoginButton
  });

  const hasLogoutButton = Array.from(document.querySelectorAll('button, a')).some(el => {
    const text = (el.textContent || '').toLowerCase();
    return text.includes('dang xu?t') || text.includes('logout') || text.includes('sign out') || text.includes('tho�t');
  });

  const hasUserInfo = bodyText.includes('t�i kho?n:') ||
    bodyText.includes('s? du:') ||
    bodyText.includes('balance:') ||
    bodyText.includes('ch�o m?ng') ||
    bodyText.includes('welcome back');

  console.log('   Content check:', {
    hasLogoutButton,
    hasUserInfo
  });

  const hasMemberMenu = document.querySelector('.user-menu, .member-menu, .account-menu, [class*="user-info"]') !== null;
  const hasFinancialMenu = Array.from(document.querySelectorAll('a, button, div')).some(el => {
    const text = (el.textContent || '').toLowerCase();
    return text.includes('nạp tiền') || text.includes('rút tiền') || text.includes('deposit') || text.includes('withdraw');
  });

  console.log('   Menu check:', {
    hasMemberMenu,
    hasFinancialMenu
  });

  // Decision logic
  let isLoggedIn = false;
  let reason = '';

  if (isOnMemberArea && !isOnLoginPage) {
    isLoggedIn = true;
    reason = 'URL indicates member area';
  } else if (hasLogoutButton) {
    isLoggedIn = true;
    reason = 'Logout button found';
  } else if (hasMemberMenu || hasFinancialMenu) {
    isLoggedIn = true;
    reason = 'Member menu found';
  } else if (hasLoginForm || hasLoginButton) {
    isLoggedIn = false;
    reason = 'Login form/button found';
  } else if (isOnLoginPage) {
    isLoggedIn = false;
    reason = 'On login page';
  }

  console.log('?? Login status result:', {
    isLoggedIn,
    reason
  });

  return {
    isLoggedIn,
    reason
  };
}

// Monitor for token immediately after login submit (10 seconds only)
function startLoginTokenMonitor() {
  console.log('🔍 Starting login token monitor (10 seconds)...');
  console.log('📍 Current URL:', window.location.href);

  let checkCount = 0;
  const maxChecks = 10; // Check for 10 seconds
  const checkInterval = 1000; // Check every 1 second
  let tokenFound = false;

  const monitorInterval = setInterval(() => {
    checkCount++;
    console.log(`🔍 [${checkCount}/${maxChecks}] Checking for auth token...`);

    const cookies = document.cookie;
    const tokenCookieNames = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'jwt', 'bearer', 'authToken', 'sessionToken'];
    let hasAuthToken = false;
    let foundTokenName = '';

    for (const tokenName of tokenCookieNames) {
      if (cookies.includes(`${tokenName}=`)) {
        const cookieMatch = cookies.match(new RegExp(`${tokenName}=([^;]+)`));
        if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
          hasAuthToken = true;
          foundTokenName = tokenName;
          console.log(`✅ Auth token found: ${tokenName} (length: ${cookieMatch[1].length})`);
          break;
        }
      }
    }

    if (hasAuthToken && !tokenFound) {
      tokenFound = true;
      console.log('✅ Login token detected!');
      console.log(`   Token: ${foundTokenName}`);
      clearInterval(monitorInterval);

      // Show success notification
      showNotification('✅ Đăng nhập thành công!\n\n⏳ Đang chuyển đến trang rút tiền...', false);
      return;
    }

    // Stop checking after max attempts
    if (checkCount >= maxChecks) {
      console.error('❌ No auth token found after 10 seconds!');
      clearInterval(monitorInterval);

      if (!tokenFound) {
        // Show persistent error notification (won't auto-hide)
        showPersistentNotification(
          '❌ KHÔNG PHÁT HIỆN TOKEN!\n\n' +
          '⚠️ Đăng nhập có thể thất bại.\n\n' +
          '💡 Nguyên nhân:\n' +
          '   • Sai tên đăng nhập/mật khẩu\n' +
          '   • Captcha sai\n' +
          '   • Trang web lỗi\n\n' +
          '🔄 Vui lòng kiểm tra và thử lại!'
        );
      }
    }
  }, checkInterval);
}

// Monitor for successful login and redirect to withdraw page
function startLoginSuccessMonitor() {
  console.log('?? Starting login success monitor (SIMPLE: Only check cookie token)...');
  console.log('?? Current URL:', window.location.href);

  let checkCount = 0;
  const maxChecks = 20; // Check for 20 seconds
  const checkInterval = 1000; // Check every 1 second

  const monitorInterval = setInterval(() => {
    checkCount++;
    console.log(`?? [${checkCount}/${maxChecks}] Checking for auth token in cookies...`);

    const cookies = document.cookie;
    const tokenCookieNames = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'jwt', 'bearer'];
    let hasAuthToken = false;
    let foundTokenName = '';

    for (const tokenName of tokenCookieNames) {
      if (cookies.includes(`${tokenName}=`)) {
        const cookieMatch = cookies.match(new RegExp(`${tokenName}=([^;]+)`));
        if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
          hasAuthToken = true;
          foundTokenName = tokenName;
          console.log(`   ? Auth token found: ${tokenName} (length: ${cookieMatch[1].length})`);
          break;
        }
      }
    }

    console.log(`   Token check: ${hasAuthToken ? '? Found' : '? Not found'}`);

    // SIMPLE DECISION: Only check token
    if (hasAuthToken) {
      console.log('? Login successful! (Auth token found)');
      console.log(`   Token: ${foundTokenName}`);

      clearInterval(monitorInterval);

      // Show notification
      showNotification('✅ Đăng nhập thành công!\n\n💰 Đang tìm nút rút tiền...');

      // Click withdraw button instead of redirect
      console.log('Finding and clicking withdraw button in 2 seconds...');
      setTimeout(async () => {
        console.log('REMOVED: findAndClickWithdrawButton() - now using direct redirect');
        const result = { success: false, method: 'removed' };
        if (result.success) {
          console.log('Successfully clicked withdraw button');
        } else {
          console.log('Could not find withdraw button, trying redirect...');
          redirectToWithdrawPage();
        }
      }, 2000); // Increased to 2s to ensure page is stable

      return;
    }

    // Stop checking after max attempts
    if (checkCount >= maxChecks) {
      console.log('?? Login monitor timeout - stopping checks');
      console.log('? No auth token found after 20 seconds');

      clearInterval(monitorInterval);

      const hasWithdrawInfo = sessionStorage.getItem('withdrawInfo');
      if (hasWithdrawInfo) {
        console.log('No token found, but have withdraw info');
        console.log('Will try to click withdraw button anyway (maybe login successful but no token yet)...');
        setTimeout(async () => {
          const result = { success: false, method: 'removed' }; // REMOVED: findAndClickWithdrawButton()
          if (!result.success) {
            console.log('Could not find withdraw button, trying redirect...');
            redirectToWithdrawPage();
          }
        }, 1000);
      } else {
        console.log('No token and no withdraw info - login likely failed');
        showNotification('❌ Đăng nhập không thành công!\n\n⚠️ Vui lòng chạy lại tool để đăng nhập.\n\n💡 Lưu ý: Kiểm tra tên đăng nhập và mật khẩu.');
      }
    }
  }, checkInterval);
}

// Redirect to withdraw page
function redirectToWithdrawPage() {
  console.log('?? Redirecting to withdraw page...');

  // PREVENT DUPLICATE REDIRECT: Check if already redirecting
  if (window.isRedirectingToWithdraw) {
    console.log('?? Already redirecting to withdraw page, skipping duplicate redirect');
    return;
  }

  if (isWithdrawPage()) {
    console.log('?? Already on withdraw page, no need to redirect');
    return;
  }

  // Set flag to prevent duplicate redirects
  window.isRedirectingToWithdraw = true;
  console.log('?? Set redirect flag to prevent duplicates');

  // Make sure withdrawInfo is saved to sessionStorage BEFORE redirect
  if (window.withdrawInfo) {
    sessionStorage.setItem('withdrawInfo', JSON.stringify(window.withdrawInfo));
    console.log('?? Saved withdraw info to sessionStorage before redirect:', window.withdrawInfo);
  } else {
    console.warn('?? No withdrawInfo available to save!');
  }

  sessionStorage.removeItem('shouldRedirectToWithdraw');
  console.log('??? Cleared redirect flag');

  try {
    const currentUrl = new URL(window.location.href);
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    const withdrawUrl = `${baseUrl}/Financial?type=withdraw`;

    console.log('?? Current URL:', window.location.href);
    console.log('?? Base URL:', baseUrl);
    console.log('?? Withdraw URL:', withdrawUrl);

    showNotification('💰 Đang chuyển đến trang rút tiền...');

    // Redirect after a short delay
    setTimeout(() => {
      console.log('?? EXECUTING REDIRECT NOW...');
      console.log('?? Target:', withdrawUrl);

      try {
        window.location.href = withdrawUrl;
      } catch (e) {
        console.error('? window.location.href failed:', e);
        try {
          window.location.assign(withdrawUrl);
        } catch (e2) {
          console.error('? window.location.assign failed:', e2);
          window.location.replace(withdrawUrl);
        }
      }

      console.log('? Redirect command executed');
      // Note: Code after this line won't execute because page will reload
    }, 1000);
  } catch (error) {
    console.error('Error in redirectToWithdrawPage:', error);
    showNotification('❌ Lỗi khi chuyển trang\n\nVui lòng vào trang rút tiền thủ công.');
  }
}

// Optimized fillWithdrawForm - Only use formcontrolname attributes
function fillWithdrawForm() {
  console.log('Attempting to fill withdraw form...');

  if (!window.withdrawInfo) {
    console.log('No withdraw info available');
    return;
  }

  const { bankName, bankBranch, accountNumber } = window.withdrawInfo;
  console.log('Withdraw info:', { bankName, bankBranch, accountNumber });

  // EARLY CHECK: See if bank already exists (FIXED logic)
  console.log('Early check: Does bank already exist?');

  // QUAN TRỌNG: Kiểm tra xem có FORM input không trước
  // Nếu có form input thì CHƯA thêm bank (form chỉ hiển thị khi chưa có bank)
  const bankFormExists = document.querySelector('mat-select[formcontrolname="bankName"]') ||
    document.querySelector('[formcontrolname="bankName"]') ||
    document.querySelector('[formcontrolname="city"]') ||
    document.querySelector('[formcontrolname="account"]') ||
    document.querySelector('input[placeholder*="thành phố"]') ||
    document.querySelector('input[placeholder*="9704"]') ||
    document.querySelector('input[placeholder*="chi nhánh"]');

  if (bankFormExists) {
    console.log('Bank form input found - bank NOT added yet, proceeding to fill...');
    // Không return, tiếp tục fill form
  } else {
    // Chỉ kiểm tra bank-detail khi KHÔNG có form
    const bankDetailDiv = document.querySelector('.bank-detail, .px-4.bank-detail');
    let hasBankInfo = false;

    if (bankDetailDiv) {
      // Verify bank-detail có chứa value thực sự
      const rows = bankDetailDiv.querySelectorAll('.block.w-full');
      rows.forEach(row => {
        const valueSpan = row.querySelector('span.text-right, span:last-child');
        if (valueSpan) {
          const value = valueSpan.textContent.trim();
          if (value && value.length > 2 && !value.includes('Vui lòng') && !value.includes('Ví dụ')) {
            hasBankInfo = true;
          }
        }
      });
    }

    if (hasBankInfo) {
      console.log('Bank already exists! Stopping.');
      showNotification('✅ Đã có ngân hàng rồi!\n\n💳 Tài khoản đã được thêm trước đó.\n\n🛑 Dừng tool.');
      window.withdrawFormFilled = true;
      sessionStorage.removeItem('shouldRedirectToWithdraw');
      return;
    }
  }

  console.log('No existing bank found, proceeding to fill form...');

  let attempts = 0;
  const maxAttempts = 15; // Increased from 10 to 15

  const fillInterval = setInterval(() => {
    attempts++;
    console.log(`[${attempts}/${maxAttempts}] Looking for withdraw form...`);

    // ENHANCED: Multiple selector strategies
    const bankDropdown = document.querySelector('[formcontrolname="bankName"]') ||
      document.querySelector('[formcontrolname="bank"]') ||
      document.querySelector('select[name*="bank"]') ||
      document.querySelector('select') ||
      document.querySelector('mat-select');

    const branchInput = document.querySelector('[formcontrolname="city"]') ||
      document.querySelector('[formcontrolname="branch"]') ||
      document.querySelector('input[placeholder*="chi nhánh"]') ||
      document.querySelector('input[placeholder*="thành phố"]') ||
      document.querySelector('input[name*="branch"]') ||
      document.querySelector('input[name*="city"]');

    const accountInput = document.querySelector('[formcontrolname="account"]') ||
      document.querySelector('[formcontrolname="accountNumber"]') ||
      document.querySelector('input[placeholder*="tài khoản"]') ||
      document.querySelector('input[placeholder*="số tài khoản"]') ||
      document.querySelector('input[name*="account"]');

    console.log('Found elements:', {
      bankDropdown: !!bankDropdown,
      branchInput: !!branchInput,
      accountInput: !!accountInput
    });

    // Check if we have all required fields
    const hasAllFields = bankDropdown && branchInput && accountInput;

    if (hasAllFields) {
      clearInterval(fillInterval);
      console.log('Found withdraw form, filling...');

      // Prevent multiple fills
      if (window.withdrawFormFilling) {
        console.log('Already filling form, skipping duplicate...');
        return;
      }
      window.withdrawFormFilling = true;

      // Use async IIFE to handle await
      (async () => {
        // Fill bank name (mat-select dropdown)
        if (bankDropdown) {
          console.log('Filling bank name:', bankName);

          // Click to open dropdown
          await clickElementNaturally(bankDropdown);
          await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 1000ms to 300ms

          // Find bank option in dropdown với mapping chính xác
          const dropdownOptions = document.querySelectorAll('mat-option, [role="option"]');
          console.log(`Found ${dropdownOptions.length} options`);

          let found = false;

          // Sử dụng mapping từ banks.js
          const mappedBankName = window.mapBankName ? window.mapBankName(bankName) : bankName;
          console.log(`🏦 Original bank: ${bankName} → Mapped: ${mappedBankName}`);

          const searchName = mappedBankName.toUpperCase();

          for (const option of dropdownOptions) {
            // PRIORITY 1: Check value attribute
            const value = (option.getAttribute('value') || '').toUpperCase();
            const dataValue = (option.getAttribute('data-value') || '').toUpperCase();
            const ngReflectValue = (option.getAttribute('ng-reflect-value') || '').toUpperCase();

            // PRIORITY 2: Check text content
            const text = option.textContent.trim().toUpperCase();

            // Exact match trước, sau đó mới includes
            const isExactMatch = value === searchName ||
              dataValue === searchName ||
              ngReflectValue === searchName ||
              text === searchName;

            const isPartialMatch = value.includes(searchName) ||
              dataValue.includes(searchName) ||
              ngReflectValue.includes(searchName) ||
              text.includes(searchName);

            if (isExactMatch || isPartialMatch) {
              console.log(`✅ Found bank match: "${text}" (${isExactMatch ? 'exact' : 'partial'})`);
              await clickElementNaturally(option);
              found = true;
              await new Promise(resolve => setTimeout(resolve, 200));
              break;
            }
          }

          if (!found) {
            console.warn('Could not find bank in dropdown:', searchName);
            showNotification('⚠️ Không tìm thấy ngân hàng: ' + bankName + '\n\nHãy chọn thủ công!');
          }
        }

        // Fill branch
        if (branchInput) {
          console.log('Filling bank branch:', bankBranch);
          await fillInputAdvanced(branchInput, bankBranch, true); // Fast mode
          await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 300ms to 100ms
        }

        // Fill account number
        if (accountInput) {
          console.log('Filling account number:', accountNumber);
          await fillInputAdvanced(accountInput, accountNumber, true); // Fast mode
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log('Waiting 2 seconds for form to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Highlight filled fields
        [bankDropdown, branchInput, accountInput].forEach(el => {
          if (el && el.offsetParent !== null) {
            el.style.transition = 'all 0.3s ease';
            el.style.border = '3px solid #00ff00';
            el.style.boxShadow = '0 0 15px #00ff00';
            el.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
          }
        });

        showNotification('✅ Đã điền form rút tiền!\n\n🏦 Ngân hàng: ' + bankName + '\n🏢 Chi nhánh: ' + bankBranch + '\n🔢 Số TK: ' + accountNumber);
        console.log('Withdraw form filled successfully');

        // Mark as filled
        window.withdrawFormFilled = true;
        window.withdrawFormFilling = false;

        // Look for submit button (enhanced selectors)
        console.log('Looking for submit button...');
        const submitButton = document.querySelector('button[type="submit"]') ||
          document.querySelector('[translate="Common_Submit"]') ||
          document.querySelector('button:contains("Gửi đi")') ||
          document.querySelector('button:contains("Submit")') ||
          Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim().includes('Gửi đi') ||
            btn.textContent.trim().includes('Submit') ||
            btn.textContent.trim().includes('Xác nhận')
          );

        if (submitButton && submitButton.offsetParent !== null) {
          console.log('Found submit button');
          console.log('Button disabled:', submitButton.disabled);

          if (!submitButton.disabled) {
            console.log('Clicking submit button...');
            await clickElementNaturally(submitButton);
            showNotification('✅ Đã click "Gửi đi"!\n\nVui lòng kiểm tra kết quả.');
          } else {
            console.log('Submit button is disabled, skipping click');
            showNotification('✅ Đã điền form!\n\n⚠️ Nút "Gửi đi" đang bị vô hiệu hóa.');
          }
        } else {
          console.warn('Could not find submit button');
          showNotification('✅ Đã điền form!\n\n⚠️ Vui lòng click "Gửi đi" thủ công.');
        }
      })().catch(error => {
        console.error('Error filling withdraw form:', error);
        window.withdrawFormFilling = false;
        showNotification('❌ Lỗi khi điền form!\n\n' + error.message);
      });

      return;
    }

    // Stop after max attempts
    if (attempts >= maxAttempts) {
      clearInterval(fillInterval);
      console.log('Timeout - could not find withdraw form');

      // Check if bank already exists (FIXED logic - only check bank-detail div)
      const bankDetailDiv = document.querySelector('.bank-detail, .px-4.bank-detail');
      let hasBankInfo = false;

      if (bankDetailDiv) {
        const rows = bankDetailDiv.querySelectorAll('.block.w-full');
        rows.forEach(row => {
          const valueSpan = row.querySelector('span.text-right, span:last-child');
          if (valueSpan) {
            const value = valueSpan.textContent.trim();
            if (value && value.length > 2 && !value.includes('Vui lòng') && !value.includes('Ví dụ')) {
              hasBankInfo = true;
            }
          }
        });
      }

      if (hasBankInfo) {
        console.log('Bank already exists! No need to add.');
        showNotification('✅ Đã có ngân hàng rồi!\n\n💳 Tài khoản đã được thêm trước đó.\n\n🛑 Dừng tool.');
        window.withdrawFormFilled = true;
        sessionStorage.removeItem('shouldRedirectToWithdraw');
      } else {
        console.log('Form might exist but not found yet');
        showNotification('⚠️ Không tìm thấy form rút tiền\n\nForm có thể đang load...');
      }
    }
  }, 1000);
}




