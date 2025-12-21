// Content script - Fixed for Vue app

// Mark that content script is loaded
window.__autoRegisterToolLoaded = true;

// Global flags to prevent multiple executions
window.__isAutoFilling = false;
window.__isAutoLogging = false;
window.__isProcessingWithdraw = false;

// Check if there's pending bank add (after redirect from password setup)
function checkPendingBankAdd() {
  chrome.storage.local.get(['pendingBankAdd'], function (result) {
    if (result.pendingBankAdd) {
      const data = result.pendingBankAdd;
      const age = Date.now() - data.timestamp;

      // Only process if less than 60 seconds old (increased from 30)
      if (age < 60000) {
        console.log('💾 Found pending bank add:', data);

        // Clear storage
        chrome.storage.local.remove('pendingBankAdd');

        // Wait for page to fully load
        const waitForPageReady = setInterval(() => {
          // Check if page has loaded (look for withdraw page elements)
          const pageText = document.body.textContent;
          const hasWithdrawElements =
            document.querySelector('._addAccountInputBtn_lj38l_39') ||
            pageText.includes('Thêm Tài Khoản') ||
            pageText.includes('Thêm tài khoản') ||
            pageText.includes('Quản Lý Rút Tiền');

          if (hasWithdrawElements) {
            clearInterval(waitForPageReady);
            console.log('✅ Withdraw page loaded! Adding bank...');
            showNotification('🏦 Đang thêm ngân hàng tự động...');

            clickAddBankAccount(data.password, data.bankAccount, data.bankName, (response) => {
              console.log('✅ Bank add result:', response);
            });
          }
        }, 500);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(waitForPageReady);
          
        }, 15000);
      } else {
        console.log('⚠️ Pending bank add too old, ignoring');
        chrome.storage.local.remove('pendingBankAdd');
      }
    }
  });
}

// Check immediately
checkPendingBankAdd();

// Also check after a delay (in case page loads slowly)
setTimeout(checkPendingBankAdd, 2000);
setTimeout(checkPendingBankAdd, 5000);

// ============================================
// HUMAN-LIKE BEHAVIOR HELPERS (Anti-Bot Detection)
// ============================================

// Random delay between min and max milliseconds
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Human-like click with touch events and random delay
async function humanClick(element) {
  if (!element) return false;

  // Scroll element into view smoothly
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Wait random time (human reaction time: 200-800ms)
  await randomDelay(200, 800);

  // Get element position with random offset
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
  const y = rect.top + rect.height / 2 + (Math.random() * 10 - 5);

  // Touch events (primary method for mobile sites)
  try {
    const touchObj = new Touch({
      identifier: Date.now(),
      target: element,
      clientX: x,
      clientY: y,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 0,
      force: 1
    });

    element.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [touchObj],
      targetTouches: [touchObj],
      changedTouches: [touchObj]
    }));

    // Hold for random time (50-150ms)
    await randomDelay(50, 150);

    element.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [touchObj]
    }));
  } catch (e) {
  }

  // Fallback to regular click
  await randomDelay(50, 100);
  element.click();

  return true;
}

// Simple fast fill (set value directly)
async function humanType(input, text) {
  if (!input) return false;

  input.focus();
  await randomDelay(50, 100);

  input.click();
  await randomDelay(50, 100);

  // Set value directly (fast)
  input.value = text;

  // Trigger events
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  await randomDelay(50, 100);
  input.dispatchEvent(new Event('blur', { bubbles: true }));

  return true;
}

// Type character by character (for fullname only)
async function humanTypeCharByChar(input, text) {
  if (!input) return false;

  input.focus();
  await randomDelay(100, 200);

  input.click();
  await randomDelay(50, 100);

  // Clear existing value
  input.value = '';

  // Type character by character
  for (let i = 0; i < text.length; i++) {
    input.value += text[i];
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Random typing speed (50-120ms per character)
    await randomDelay(50, 120);
  }

  // Final events
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await randomDelay(100, 200);
  input.dispatchEvent(new Event('blur', { bubbles: true }));

  return true;
}

// ============================================
// END OF HUMAN BEHAVIOR HELPERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'ping') {
    sendResponse({ ready: true });
    return true;
  }

  if (request.action === 'setWithdrawPassword') {
    try {
      const result = setWithdrawPassword(request.data.withdrawPassword);
      sendResponse({ success: true, result: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  if (request.action === 'autoFill') {

    // Prevent duplicate auto-fill
    if (window.__isAutoFilling) {
      sendResponse({ success: false, error: 'Already in progress' });
      return true;
    }

    window.__isAutoFilling = true;

    let attempts = 0;
    const maxAttempts = 5;

    async function tryAutoFill() {
      attempts++;

      try {
        const inputs = findAllInputs();

        if (inputs.length >= 4) {
          const result = await fillForm(inputs, request.data.username, request.data.password, request.data.fullname);

          if (result.username || result.password || result.fullname) {
            console.log('✅ Fill SUCCESS!');
            window.__isAutoFilling = false;

            if (request.data.autoSubmit === true) {

              // Wait for autoSubmitForm to complete (it has 3s delay + click)
              await new Promise(resolve => {
                autoSubmitForm(true);
                // Wait 6 seconds total (3s delay + 3s for click to process)
                setTimeout(resolve, 6000);
              });

              console.log('✅ Submit completed');
            }

            sendResponse({ success: true, result: result });
            return;
          }
        }

        if (attempts < maxAttempts) {
          const delay = 2000;
          setTimeout(tryAutoFill, delay);
        } else {
          console.error('❌ FAILED after', maxAttempts, 'attempts');
          window.__isAutoFilling = false;
          sendResponse({ success: false, error: 'No inputs found' });
        }
      } catch (error) {
        console.error('❌ Auto-fill error:', error);
        if (attempts < maxAttempts) {
          setTimeout(tryAutoFill, 2000);
        } else {
          window.__isAutoFilling = false;
          sendResponse({ success: false, error: error.message });
        }
      }
    }

    setTimeout(tryAutoFill, 2000);
    return true; // Keep channel open for async response
  }

  if (request.action === 'autoLogin') {
    startAutoLogin(request.data, sendResponse);
    return true;
  }

  if (request.action === 'goToWithdraw') {
    // Prevent duplicate processing
    if (window.__isProcessingWithdraw) {
      console.log('⏹️ Already processing withdraw, ignoring duplicate request');
      sendResponse({ success: false, error: 'Already in progress' });
      return true;
    }

    window.__isProcessingWithdraw = true;
    console.log('💰 Going to withdraw page...');
    const withdrawPassword = request.data?.withdrawPassword;
    const bankAccount = request.data?.bankAccount || '1234567890';
    const bankName = request.data?.bankName || 'Vikki Bank';

    goToWithdrawPage(withdrawPassword, bankAccount, bankName, (response) => {
      window.__isProcessingWithdraw = false;
      sendResponse(response);
    });
    return true;
  }

  if (request.action === 'addBankDirectly') {
    console.log('🏦 Adding bank directly on withdraw page...');
    const { password, bankAccount, bankName } = request.data;

    setTimeout(() => {
      clickAddBankAccount(password, bankAccount, bankName, sendResponse);
    }, 2000);

    return true;
  }

  if (request.action === 'verifyPhone') {
    console.log('📱 Starting phone verification...');
    const apiKey = request.apiKey;
    goToSecurityPage(apiKey, sendResponse);
    return true;
  }

  if (request.action === 'claimPromotion') {
    ...');
    claimPromotionWithoutPhoneVerify(sendResponse);
    return true;
  }
});

function startAutoLogin(data, sendResponse) {
  // Check global flag to prevent multiple instances
  if (window.__isAutoLogging) {
    sendResponse({ success: false, error: 'Already in progress' });
    return;
  }

  window.__isAutoLogging = true;
  let attempts = 0;
  const maxAttempts = 20;
  let isCompleted = false; // Flag to prevent multiple executions

  async function tryAutoLogin() {
    if (isCompleted) {
      console.log('⏹️ Already completed, stopping...');
      return;
    }

    attempts++;

    const inputs = findAllInputs();

    // Login form usually has 2 inputs (username + password)
    if (inputs.length >= 2) {
      const result = await fillLoginForm(inputs, data.username, data.password);

      if (result.username && result.password) {
        console.log('✅ Login fill SUCCESS!');
        isCompleted = true; // Mark as completed
        window.__isAutoLogging = false; // Release global flag

        // Auto submit login form
        autoSubmitLoginForm();

        sendResponse({ success: true, result: result });
        return;
      }
    }

    if (attempts < maxAttempts && !isCompleted) {
      const delay = 2000;
      setTimeout(tryAutoLogin, delay);
    } else if (!isCompleted) {
      console.error('❌ FAILED after', maxAttempts, 'attempts');
      showNotification('❌ Không tìm thấy form đăng nhập!');
      sendResponse({ success: false, error: 'No login inputs found' });
      isCompleted = true;
      window.__isAutoLogging = false; // Release global flag
    }
  }

  setTimeout(tryAutoLogin, 2000);
}

async function fillLoginForm(inputs, username, password) {

  const result = { username: false, password: false };

  // Find inputs by data-input-name or type
  const accountInput = Array.from(inputs).find(inp =>
    inp.getAttribute('data-input-name') === 'account' ||
    inp.type === 'text' ||
    inp.type === 'tel' ||
    !inp.type
  );

  const passInput = Array.from(inputs).find(inp =>
    inp.getAttribute('data-input-name') === 'userpass' ||
    inp.type === 'password'
  );

  if (accountInput) {
    await fillInput(accountInput, username);
    result.username = true;
  }

  if (passInput) {
    await fillInput(passInput, password);
    result.password = true;
  }

  // Highlight
  setTimeout(() => {
    [accountInput, passInput].forEach(inp => {
      if (inp && inp.value) {
        inp.style.border = '3px solid #00ff00';
        inp.style.boxShadow = '0 0 15px #00ff00';
      }
    });
  }, 500);

  if (result.username && result.password) {
    showNotification('✅ Đã điền form đăng nhập!');
  }

  return result;
}

function autoSubmitLoginForm() {

  setTimeout(() => {
    // Find login button
    let submitBtn = document.querySelector('button[type="submit"]') ||
      document.querySelector('button.ui-button--primary') ||
      Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Đăng nhập') ||
        btn.textContent.includes('Login') ||
        btn.textContent.includes('登录')
      );

    // Search in iframes if not found
    if (!submitBtn) {
      const iframes = document.querySelectorAll('iframe');

      for (let iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          submitBtn = iframeDoc.querySelector('button[type="submit"]') ||
            iframeDoc.querySelector('button.ui-button--primary');

          if (submitBtn) {
            break;
          }
        } catch (e) {
        }
      }
    }

    if (submitBtn) {
      showNotification('⏳ Đang nhấn Đăng Nhập trong 2s...');

      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {

        // Touch events
        try {
          submitBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
          submitBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
        } catch (e) { }

        // Mouse events
        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        submitBtn.click();

        showNotification('✅ Đã nhấn nút Đăng Nhập!');
      }, 2000);
    } else {
      console.error('❌ Login button not found');
      showNotification('❌ Không tìm thấy nút Đăng Nhập');
    }
  }, 1000);
}

// startAutoFill function removed - now inline in message listener

function findAllInputs() {
  const inputs = [];

  // Method 1: Find in main document
  const dataInputs = document.querySelectorAll('[data-input-name]');
  inputs.push(...dataInputs);

  const uiInputs = document.querySelectorAll('.ui-input__input');
  uiInputs.forEach(inp => {
    if (!inputs.includes(inp)) inputs.push(inp);
  });

  const allInputs = document.querySelectorAll('input[type="text"], input[type="password"], input:not([type])');
  allInputs.forEach(inp => {
    if (!inputs.includes(inp)) inputs.push(inp);
  });

  // Method 2: Find in iframes
  const iframes = document.querySelectorAll('iframe');

  iframes.forEach((iframe, i) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      const iframeDataInputs = iframeDoc.querySelectorAll('[data-input-name]');
      const iframeUiInputs = iframeDoc.querySelectorAll('.ui-input__input');
      const iframeAllInputs = iframeDoc.querySelectorAll('input');

      iframeDataInputs.forEach(inp => {
        if (!inputs.includes(inp)) inputs.push(inp);
      });
      iframeUiInputs.forEach(inp => {
        if (!inputs.includes(inp)) inputs.push(inp);
      });
      iframeAllInputs.forEach(inp => {
        if (!inputs.includes(inp)) inputs.push(inp);
      });
    } catch (e) {
    }
  });

  // Log each input
  inputs.forEach((inp, i) => {
    const name = inp.getAttribute('data-input-name') || inp.name || inp.placeholder;
  });

  return inputs;
}

async function fillForm(inputs, username, password, fullname) {

  const result = { username: false, password: false, fullname: false, checkbox: false };

  // Find inputs by data-input-name
  const accountInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'account');
  const passInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'userpass');
  const confirmInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'confirmPassword');
  const nameInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'realName');

  if (accountInput) {
    await fillInput(accountInput, username);
    result.username = true;
  }

  if (passInput) {
    await fillInput(passInput, password);
    result.password = true;
  }

  if (confirmInput) {
    await fillInput(confirmInput, password);
  }

  if (nameInput) {
    await humanTypeCharByChar(nameInput, fullname);
    result.fullname = true;
  }

  // Check checkbox
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (!cb.checked && !cb.disabled) {
      cb.click();
      result.checkbox = true;
    }
  });

  // Highlight
  setTimeout(() => {
    [accountInput, passInput, confirmInput, nameInput].forEach(inp => {
      if (inp && inp.value) {
        inp.style.border = '3px solid #00ff00';
        inp.style.boxShadow = '0 0 15px #00ff00';
      }
    });
  }, 500);

  if (result.username || result.password) {
    showNotification('✅ Đã điền form thành công!');
  }

  return result;
}

async function fillInput(input, value) {
  if (!input) return;

  // Use humanType for realistic character-by-character typing
  await humanType(input, value);
}

function autoSubmitForm(autoSubmit) {
  if (!autoSubmit) return;

  setTimeout(() => {
    let submitBtn = document.getElementById('insideRegisterSubmitClick') ||
      document.querySelector('button.ui-button--primary.ui-button--block') ||
      document.querySelector('button[type="submit"]');

    // If not found in main document, search iframes
    if (!submitBtn) {
      const iframes = document.querySelectorAll('iframe');

      for (let iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          submitBtn = iframeDoc.getElementById('insideRegisterSubmitClick') ||
            iframeDoc.querySelector('button.ui-button--primary.ui-button--block') ||
            iframeDoc.querySelector('button[type="submit"]');

          if (submitBtn) {
            break;
          }
        } catch (e) {
        }
      }
    }

    if (submitBtn) {
      showNotification('⏳ Đang nhấn Đăng Ký trong 3s...');

      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {

        // Method 1: TouchEvent (for mobile emulator)
        try {
          const touchStart = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: [new Touch({
              identifier: 0,
              target: submitBtn,
              clientX: submitBtn.getBoundingClientRect().left + 10,
              clientY: submitBtn.getBoundingClientRect().top + 10
            })]
          });
          submitBtn.dispatchEvent(touchStart);

          const touchEnd = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          submitBtn.dispatchEvent(touchEnd);
        } catch (e) {
        }

        // Method 2: PointerEvent
        submitBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));

        // Method 3: MouseEvent (fallback)
        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        // Method 4: Native click
        submitBtn.click();

        showNotification('✅ Đã nhấn nút Đăng Ký!');
      }, 3000);
    } else {
      console.error('❌ Button not found');
      showNotification('❌ Không tìm thấy nút Đăng Ký');
    }
  }, 2000);
}

function showNotification(message) {
  const existing = document.getElementById('auto-register-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'auto-register-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #00ff00, #00cc00);
    color: #000;
    padding: 20px 30px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0,255,0,0.4);
    white-space: pre-line;
    text-align: center;
    max-width: 300px;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}

function setWithdrawPassword(withdrawPassword) {
  showWithdrawPasswordGuide(withdrawPassword);

  const passwordFields = document.querySelectorAll('input[type="password"], input[type="tel"], input[type="number"]');

  if (passwordFields.length > 0) {
    passwordFields.forEach(field => {
      field.style.border = '5px solid #00ff00';
      field.style.boxShadow = '0 0 20px #00ff00';
    });

    passwordFields[0].click();
    passwordFields[0].focus();
  }

  return { success: true };
}

function showWithdrawPasswordGuide(password) {
  const existing = document.getElementById('withdraw-password-guide');
  if (existing) existing.remove();

  const digits = password.split('');

  const guide = document.createElement('div');
  guide.id = 'withdraw-password-guide';
  guide.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #00ff00, #00cc00);
    color: #000;
    padding: 30px 50px;
    border-radius: 20px;
    z-index: 999999;
    box-shadow: 0 10px 50px rgba(0, 255, 0, 0.5);
    text-align: center;
  `;

  guide.innerHTML = `
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">
      🔑 MẬT KHẨU RÚT TIỀN
    </div>
    <div style="font-size: 72px; font-weight: bold; letter-spacing: 20px; margin: 20px 0;">
      ${digits.join(' ')}
    </div>
    <div style="font-size: 16px;">
      👆 Nhập từng số vào bàn phím ảo
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 20px;
      padding: 12px 30px;
      background: #ff3333;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    ">✖ Đóng</button>
  `;

  document.body.appendChild(guide);

  setTimeout(() => {
    if (guide.parentElement) guide.remove();
  }, 30000);
}

// Listener merged into main listener above

// NEW SIMPLE LOGIC: Direct link to withdraw page (like SMS verification)
function goToWithdrawPage(withdrawPassword, bankAccount, bankName, sendResponse) {
  console.log('💰 Starting withdraw setup by clicking buttons...');

  // Step 1: Find and click "Tôi" tab
  setTimeout(() => {

    // Method 1: Find by span text (most accurate)
    const allSpans = document.querySelectorAll('span[class*="_text"]');
    let profileTab = null;

    for (let span of allSpans) {
      const text = span.textContent.trim();
      if (text === 'Tôi') {
        // Get the parent tab element
        profileTab = span.closest('[role="tab"]') || span.closest('.ui-tabbar-item') || span.closest('[class*="tabbar-item"]');
        if (profileTab && profileTab.offsetParent !== null) {
          break;
        }
      }
    }

    // Method 2: Fallback to tab textContent
    if (!profileTab) {
      const tabs = document.querySelectorAll('[role="tab"], .ui-tabbar-item, [class*="tabbar-item"]');
      for (let tab of tabs) {
        const text = tab.textContent.trim();
        if (text === 'Tôi' && tab.offsetParent !== null) {
          profileTab = tab;
          break;
        }
      }
    }

    if (profileTab) {

      try {
        profileTab.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        profileTab.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      profileTab.click();

      // Step 2: Wait for profile page to load, then click "Rút Tiền"
      setTimeout(() => {

        // First, look for the label with "Rút Tiền" text
        const labels = document.querySelectorAll('p._label_1odty_95, p[class*="_label_"], p');
        let withdrawBtn = null;

        for (let label of labels) {
          const text = label.textContent.trim();

          if (text === 'Rút Tiền') {
            // Found the label, now get the parent div (the clickable element)
            const parentDiv = label.closest('._navItem_1odty_45') || label.closest('[class*="navItem"]') || label.parentElement;

            if (parentDiv && parentDiv.offsetParent !== null) {
              withdrawBtn = parentDiv;
              break;
            }
          }
        }

        // Fallback: search all navItems directly
        if (!withdrawBtn) {
          const navItems = document.querySelectorAll('._navItem_1odty_45, [class*="navItem"]');

          for (let item of navItems) {
            if (item.textContent.includes('Rút Tiền') && item.offsetParent !== null) {
              withdrawBtn = item;
              break;
            }
          }
        }

        if (withdrawBtn) {

          // Scroll into view first
          withdrawBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            try {
              withdrawBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
              withdrawBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
            } catch (e) { }

            withdrawBtn.click();
          }, 500);

          // Step 3: Wait for withdraw page to load
          setTimeout(() => {
            console.log('🔍 Step 3: Checking withdraw page state...');

            let attempts = 0;
            const maxAttempts = 20;

            const checkPageState = setInterval(() => {
              attempts++;

              const pageText = document.body.textContent;
              const hasWithdrawElements =
                document.querySelector('.ui-password-input__item') ||
                pageText.includes('Thêm Tài Khoản') ||
                pageText.includes('Mật Khẩu Rút Tiền') ||
                pageText.includes('Quản Lý Rút Tiền');

              if (hasWithdrawElements) {
                clearInterval(checkPageState);
                `);
                checkAndFillWithdrawPassword(withdrawPassword, bankAccount, bankName, sendResponse);
              } else if (attempts >= maxAttempts) {
                clearInterval(checkPageState);
                
                showNotification('⚠️ Không tìm thấy trang rút tiền!');
                sendResponse({ success: false, error: 'Page not found' });
              }
            }, 500);
          }, 2000);

        } else {
          showNotification('❌ Không tìm thấy nút Rút Tiền!');
          sendResponse({ success: false, error: 'Withdraw button not found' });
        }
      }, 2000);

    } else {
      showNotification('❌ Không tìm thấy tab Tôi!');
      sendResponse({ success: false, error: 'Profile tab not found' });
    }
  }, 1000);
}

// Navigate back to home page by clicking back button repeatedly
function navigateBackToHome(callback) {

  const checkAndClickBack = () => {
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);

    // Check if we're at home page (only domain, or /home, or /)
    const isHomePage = urlObj.pathname === '/' ||
      urlObj.pathname === '/home' ||
      urlObj.pathname === '' ||
      (urlObj.pathname === '/home/' && !urlObj.search);

    if (isHomePage) {
      callback();
      return;
    }

    // Find back button
    const backButton = document.querySelector('._back_cflif_51, [class*="_back_"], .ui-arrow--left') ||
      Array.from(document.querySelectorAll('div, button, i')).find(el => {
        return el.querySelector('.ui-arrow--left') ||
          el.classList.contains('ui-arrow--left');
      });

    if (backButton) {

      try {
        backButton.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        backButton.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      backButton.click();

      // Wait and check again
      setTimeout(checkAndClickBack, 800);
    } else {
      callback();
    }
  };

  checkAndClickBack();
}

async function closeAllPopups() {

  let closedCount = 0;

  // Check if we're in bank form - don't close if we are
  const allText = document.body.textContent;
  const isInBankForm = allText.includes('Thêm tài khoản ngân hàng') ||
    allText.includes('Nhập mật khẩu') ||
    allText.includes('Số tài khoản ngân hàng') ||
    allText.includes('Chọn ngân hàng phát hành');

  if (isInBankForm) {
    console.log('  ⚠️ Bank form detected, skipping popup close');
    return 0;
  }

  // Step 0A: First check if confirmation popup is showing (second step)
  const hasConfirmationPopup = allText.includes('Lời nhắc quan trọng') ||
    allText.includes('Sau khi đóng, phần thưởng') ||
    allText.includes('Khi từ nguyện từ bỏ');

  if (hasConfirmationPopup) {

    // Find button with specific classes
    const confirmButtons = document.querySelectorAll(
      'button.ui-dialog__confirm, ' +
      'button.ui-button--primary, ' +
      '.ui-dialog__confirm, ' +
      'button, ' +
      'div[role="button"], ' +
      'a'
    );

    for (let btn of confirmButtons) {
      const text = btn.textContent.trim();
      const hasConfirmClass = btn.classList.contains('ui-dialog__confirm') ||
        btn.classList.contains('ui-button--primary');

      if ((text === 'Xác Nhận' || text === 'Xác nhận' || text === 'OK' || text === 'Đồng ý') &&
        btn.offsetParent !== null) {

        // Scroll into view
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await randomDelay(200, 400);

        // Multiple click methods
        try {
          btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
          await randomDelay(50, 100);
          btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));
        } catch (e) {
          console.log('  Touch events failed:', e.message);
        }

        await randomDelay(50, 100);

        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await randomDelay(50, 100);
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        await randomDelay(50, 100);
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        btn.click();
        closedCount++;

        return closedCount;
      }
    }

  }

  // Step 0B: Close promotional popups (like "ĐÓN MUA LÌ XÌ") - click X first
  const hasPromoPopup = allText.includes('ĐÓN MUA') ||
    allText.includes('NHẬN LỘC') ||
    allText.includes('MỞ');

  if (hasPromoPopup && !hasConfirmationPopup) {
    console.log('  Found promotional popup (step 1), clicking X button...');

    // Find all X buttons (circle SVG elements)
    const allElements = document.querySelectorAll('*');

    for (let elem of allElements) {
      // Check if it's a circle (X button background)
      if (elem.tagName === 'circle' && elem.offsetParent !== null) {
        const parent = elem.parentElement;

        // Check if parent is SVG and visible
        if (parent && parent.tagName === 'svg') {

          // Click the parent SVG or its parent
          const clickTarget = parent.parentElement || parent;

          try {
            clickTarget.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            clickTarget.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          clickTarget.click();
          closedCount++;

          // Don't recursively call - let the watcher handle it
          return closedCount;
        }
      }
    }

  }

  // Step 1: Check for "Lời nhắc quan trọng" popup
  const hasImportantNotice = allText.includes('Lời nhắc quan trọng') || allText.includes('lời nhắc quan trọng');

  if (hasImportantNotice) {

    // Find "Xác Nhận" button
    const allButtons = document.querySelectorAll('button, div[role="button"], a');

    for (let btn of allButtons) {
      const text = btn.textContent.trim().toLowerCase();

      if (text === 'xác nhận' || text === 'ok' || text === 'đồng ý' || text === 'confirm') {
        if (btn.offsetParent !== null) {

          // Touch click
          try {
            btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          btn.click();
          closedCount++;
          break; // Only click first confirm button
        }
      }
    }
  }

  // Step 2: Close UI dialogs (ui-dialog-close-box)
  const uiDialogCloseButtons = document.querySelectorAll('.ui-dialog-close-box, .ui-dialog-close-box__icon, [class*="ui-dialog-close"]');

  uiDialogCloseButtons.forEach(btn => {
    if (btn.offsetParent !== null) {

      // Click parent if this is the icon
      const clickTarget = btn.closest('.ui-dialog-close-box') || btn;

      try {
        clickTarget.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        clickTarget.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      clickTarget.click();
      closedCount++;
    }
  });

  // Step 3: Close other popups with X button
  const closeButtons = document.querySelectorAll('button, div, span, a, i');

  closeButtons.forEach(btn => {
    const text = btn.textContent.trim();
    const className = (btn.className || '').toLowerCase();

    // Check if it's a close button (X)
    if (text === '×' || text === 'X' || text === '✕' ||
      className.includes('close') ||
      className.includes('dismiss') ||
      btn.getAttribute('aria-label')?.toLowerCase().includes('close')) {

      // Check if it's visible
      if (btn.offsetParent !== null) {

        // Touch click
        try {
          btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
          btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
        } catch (e) { }

        btn.click();
        closedCount++;
      }
    }
  });

  return closedCount;
}

function clickMoButton() {

  // Check if popup exists
  const pageText = document.body.textContent;
  const hasPopup = pageText.includes('ĐÓN MUA LÌ XÌ') ||
    pageText.includes('NHẬN LỘC ĐẦU TAY') ||
    pageText.includes('MỞ');

  if (!hasPopup) {
    return false;
  }

  // Find "MỞ" button
  const allButtons = document.querySelectorAll('button, div, span, a, [role="button"]');

  for (let btn of allButtons) {
    const text = btn.textContent.trim().toUpperCase();

    // Look for "MỞ" button (exact match)
    if (text === 'MỞ' || text === 'MO') {
      if (btn.offsetParent !== null) {

        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          try {
            btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          btn.click();

        }, 500);

        return true;
      }
    }
  }

  // If not found
  console.error('❌ "MỞ" button not found');
  return false;
}

function checkAndFillWithdrawPassword(password, bankAccount, bankName, sendResponse) {
  console.log('🔍 Checking withdraw page state...');

  // Setup popup watcher in background (non-blocking)
  let popupClosed = false;

  const popupWatcher = setInterval(() => {
    if (popupClosed) {
      clearInterval(popupWatcher);
      return;
    }

    const pageText = document.body.textContent;

    // Check if promotional popup exists
    const hasPromoPopup = pageText.includes('ĐÓN MUA') ||
      pageText.includes('NHẬN LỘC') ||
      pageText.includes('MỞ');

    // Check if confirmation popup exists
    const hasConfirmPopup = pageText.includes('Lời nhắc quan trọng') ||
      pageText.includes('Sau khi đóng');

    if (hasPromoPopup || hasConfirmPopup) {
      closeAllPopups().then(closed => {
        if (closed > 0) {
          console.log('✅ Popup closed successfully');
          popupClosed = true;

          // Stop watcher after 2 seconds (give time for confirmation step)
          setTimeout(() => {
            clearInterval(popupWatcher);
          }, 2000);
        }
      });
    }
  }, 500); // Check every 500ms

  // Stop watcher after 10 seconds (reduced from 30s)
  setTimeout(() => {
    if (!popupClosed) {
      clearInterval(popupWatcher);
    }
  }, 10000);

  // Store interval ID so we can stop it later if needed
  window.autoPopupCloser = popupWatcher;

  // Continue processing page immediately (don't wait for popup)
  const pageText = document.body.textContent;

  // Check if this is "Edit Password" page (password already set)
  const hasEditPassword = pageText.includes('Sửa Đổi Mật Khẩu Rút Tiền') ||
    pageText.includes('Sửa đổi mật khẩu rút tiền') ||
    document.querySelector('[data-security-edit-label="withdrawpass"]');

  if (hasEditPassword) {
    console.log('✅ Password already set! Navigating to add bank page...');

    // Stop popup watcher
    if (window.autoPopupCloser) {
      clearInterval(window.autoPopupCloser);
    }

    showNotification('✅ Mật khẩu đã có, đang tìm nút quay lại...');

    // Find and click back button to go to withdraw management
    const backButton = document.querySelector('.ui-nav-bar__left, [class*="back"], [class*="arrow-left"]');

    if (backButton) {

      try {
        backButton.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        backButton.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      backButton.click();

      // After going back, wait and then add bank
      setTimeout(() => {
        console.log('  Now adding bank...');
        clickAddBankAccount(password, bankAccount, bankName, sendResponse);
      }, 2000);

    } else {
      console.log('  Back button not found, trying direct add bank...');
      clickAddBankAccount(password, bankAccount, bankName, sendResponse);
    }

    return;
  }

  // ONLY METHOD: Check for bank dropdown with value (most reliable)
  // Look for input[readonly] that contains bank info
  let hasBankInDropdown = false;
  const readonlyInputs = document.querySelectorAll('input[readonly]');

  readonlyInputs.forEach((input, index) => {
    const value = (input.value || '').trim();

    // Check if this input has bank name with masked number
    // Pattern: TECHCOMBANK(TCB)(****0000) or similar
    if (value.length > 15 && /[A-Z]{3,}.*\(\*{4}\d{4}\)/.test(value)) {
      console.log(`    → This is a bank! "${value}"`);
      hasBankInDropdown = true;
    }
  });

  console.log(`  - hasBankInDropdown: ${hasBankInDropdown}`);

  // ONLY check dropdown - button exists on both pages so can't use it!
  if (hasBankInDropdown) {
    console.log('✅ Bank already exists on this page!');

    // Stop popup closer
    if (window.autoPopupCloser) {
      clearInterval(window.autoPopupCloser);
    }

    showNotification('✅ Trang này đã có ngân hàng!');
    sendResponse({ success: true, skipped: true, message: 'Đã có ngân hàng' });
    return;
  }

  // Check if password already set (has "Thêm Tài Khoản" button)
  const hasAddAccountButton = pageText.includes('Thêm Tài Khoản') ||
    pageText.includes('Thêm tài khoản');

  // Check if it's password setup page (more flexible detection)
  const hasPasswordSetup = pageText.includes('Thiết Lập Mật Khẩu Rút Tiền') ||
    pageText.includes('Thiết lập mật khẩu rút tiền') ||
    pageText.includes('Cài đặt mật khẩu rút tiền') ||
    pageText.includes('Xác Nhận Mật Khẩu Mới') ||
    pageText.includes('Xác nhận mật khẩu rút tiền');

  const passwordInputs = document.querySelectorAll('.ui-password-input__item');

  // State 1: Password setup page (has 12 input boxes for 2 passwords)
  if (passwordInputs.length >= 6) {
    console.log('📝 State: Password setup page - will setup password + bank');

    // Stop popup watcher since we're proceeding
    if (window.autoPopupCloser) {
      clearInterval(window.autoPopupCloser);
    }

    fillWithdrawPassword(password, bankAccount, bankName, sendResponse);
    return;
  }

  // State 2: Password already set, need to add bank (has "Thêm Tài Khoản" button)
  if (hasAddAccountButton && passwordInputs.length < 6) {
    console.log('📝 State: Password already set - will add bank only');
    showNotification('⚠️ Mật khẩu đã có, đang thêm bank...');
    // Go directly to add bank
    setTimeout(() => {
      clickAddBankAccount(password, bankAccount, bankName, sendResponse);
    }, 1500);
    return;
  }

  // State 3: Unknown state - but if we see password inputs, try anyway
  if (passwordInputs.length > 0) {

    // Stop popup watcher
    if (window.autoPopupCloser) {
      clearInterval(window.autoPopupCloser);
    }

    fillWithdrawPassword(password, bankAccount, bankName, sendResponse);
    return;
  }

  // State 4: Really unknown - skip
  showNotification('⚠️ Không xác định được trạng thái trang!');
  sendResponse({ success: true, skipped: true, message: 'Không xác định được trạng thái' });
}

function fillWithdrawPassword(password, bankAccount, bankName, sendResponse) {
  console.log('🔐 Filling withdraw password:', password);

  if (!password || password.length !== 6) {
    console.error('❌ Invalid password length');
    showNotification('❌ Mật khẩu phải có 6 số!');
    sendResponse({ success: false, error: 'Invalid password' });
    return;
  }

  // Helper function: Wait for keyboard to appear
  const waitForKeyboard = (callback, attempts = 0) => {
    const keyboardButtons = document.querySelectorAll('button, div[role="button"]');
    const hasKeyboard = Array.from(keyboardButtons).some(btn => {
      const text = btn.textContent.trim();
      return text.length === 1 && /[0-9]/.test(text);
    });

    if (hasKeyboard) {
      `);
      callback();
    } else if (attempts >= 15) {
      
      callback();
    } else {
      setTimeout(() => waitForKeyboard(callback, attempts + 1), 200);
    }
  };

  // Find password input boxes - they are <li> elements
  const passwordInputs = document.querySelectorAll('.ui-password-input__item');

  if (passwordInputs.length < 6) {
    console.log('⚠️ Password already set, skipping to add bank account...');
    showNotification('⚠️ Mật khẩu đã thiết lập, chuyển sang thêm bank!');

    // Wait a bit then go to add bank account
    setTimeout(() => {
      clickAddBankAccount(password, bankAccount, bankName, sendResponse);
    }, 1500);
    return;
  }

  // The input boxes are <li> elements
  let firstBox = passwordInputs[0];

  // Touch first box to show virtual keyboard

  // Scroll into view first
  firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => {
    // Multiple touch methods
    try {
      const rect = firstBox.getBoundingClientRect();
      const touchObj = new Touch({
        identifier: Date.now(),
        target: firstBox,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1
      });

      firstBox.dispatchEvent(new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touchObj],
        targetTouches: [touchObj],
        changedTouches: [touchObj]
      }));

      setTimeout(() => {
        firstBox.dispatchEvent(new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          changedTouches: [touchObj]
        }));
      }, 100);
    } catch (e) {
      console.log('  Touch event failed:', e.message);
    }

    // Also try focus and click
    firstBox.focus();

    setTimeout(() => {
      firstBox.click();

      setTimeout(() => {
        // Also try clicking the parent <ul> to trigger keyboard
        const parentUl = firstBox.closest('.ui-password-input__security');
        if (parentUl) {
          parentUl.click();
        }

        // Wait for keyboard to appear (smart wait)
        
        waitForKeyboard(() => {
          clickDigitsOnKeyboard(password, 0, () => {

            // Wait for keyboard for confirmation (smart wait)
            
            waitForKeyboard(() => {
              clickDigitsOnKeyboard(password, 0, () => {
                showNotification('✅ Đã nhập mật khẩu!');

                // Click confirm button
                setTimeout(() => {
                  const confirmBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent.trim().toLowerCase() === 'xác nhận'
                  );

                  if (confirmBtn) {
                    try {
                      confirmBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                      confirmBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    confirmBtn.click();
                    showNotification('✅ Đã xác nhận mã rút tiền!');

                    // Wait for page to redirect naturally, then add bank
                    
                    showNotification('✅ Đã xác nhận, chờ trang tải...');

                    // Wait for page to redirect and stabilize
                    setTimeout(() => {
                      console.log('🏦 Now adding bank account...');
                      clickAddBankAccount(password, bankAccount, bankName, sendResponse);
                    }, 3000);
                  } else {
                    sendResponse({ success: true, message: 'Vui lòng click Xác Nhận!' });
                  }
                }, 1000);
              });
            }, 1000);
          });
        }, 2000);
      }, 500);
    }, 500);
  }, 500);
}

function clickDigitsOnKeyboard(password, index, callback) {
  if (index >= password.length) {
    callback();
    return;
  }

  const digit = password[index];

  // Wait a bit before searching for button (let UI update)
  setTimeout(() => {
    // Find number button on keyboard - be more specific
    const buttons = document.querySelectorAll('button, div[role="button"]');

    let found = false;
    let candidates = [];

    for (let btn of buttons) {
      const text = btn.textContent.trim();

      // Match EXACT digit (single character) and ensure it's visible
      if (text === digit && text.length === 1 && btn.offsetParent !== null) {
        // Check if it's likely a keyboard button (has reasonable size)
        const rect = btn.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          candidates.push({ btn, rect });
        }
      }
    }

    // If multiple candidates, prefer the one that looks like a keyboard button
    if (candidates.length > 0) {
      // Sort by size (keyboard buttons are usually similar size)
      candidates.sort((a, b) => {
        const areaA = a.rect.width * a.rect.height;
        const areaB = b.rect.width * b.rect.height;
        return Math.abs(areaB - 2500) - Math.abs(areaA - 2500); // Prefer ~50x50 buttons
      });

      const btn = candidates[0].btn;

      try {
        btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
      } catch (e) { }

      // Wait a bit between touch events
      setTimeout(() => {
        try {
          btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));
        } catch (e) { }

        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        btn.click();

        found = true;

        // Wait longer before next digit to ensure this one is registered
        setTimeout(() => {
          clickDigitsOnKeyboard(password, index + 1, callback);
        }, 800 + Math.random() * 400); // 800-1200ms delay between digits
      }, 100); // 100ms between touch events
    } else {

      // Still continue to next digit
      setTimeout(() => {
        clickDigitsOnKeyboard(password, index + 1, callback);
      }, 800 + Math.random() * 400);
    }
  }, 200); // 200ms initial delay to let UI update
}

function clickAddBankAccount(password, bankAccount, bankName, sendResponse) {

  // Find "Thêm Tài Khoản" button by TEXT (more reliable than class)
  let addAccountBtn = null;

  // Method 1: Try by class first (fast)
  addAccountBtn = document.querySelector('._addAccountInputBtn_lj38l_39');

  // Method 2: If not found, search by text (slower but more reliable)
  if (!addAccountBtn) {
    const allElements = document.querySelectorAll('button, div, span, a');

    for (let el of allElements) {
      const text = el.textContent.trim();

      // Match "Thêm Tài Khoản" or "Thêm tài khoản"
      if (text === 'Thêm Tài Khoản' || text === 'Thêm tài khoản') {
        // Make sure it's visible and clickable
        if (el.offsetParent !== null) {
          addAccountBtn = el;
          break;
        }
      }
    }
  }

  if (addAccountBtn) {

    addAccountBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      try {
        addAccountBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        addAccountBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      addAccountBtn.click();
      showNotification('✅ Đã click Thêm Tài Khoản!');

      // Wait then click "Tài khoản ngân hàng"
      setTimeout(() => {
        clickBankAccountOption(password, bankAccount, bankName, sendResponse);
      }, 2000);
    }, 500);
  } else {
    sendResponse({ success: true, message: 'Không tìm thấy nút Thêm Tài Khoản!' });
  }
}

function clickBankAccountOption(password, bankAccount, bankName, sendResponse) {

  // Find "Tài khoản ngân hàng" button
  const bankAccountBtn = Array.from(document.querySelectorAll('div, span, button')).find(el =>
    el.textContent.trim() === 'Tài khoản ngân hàng'
  );

  if (bankAccountBtn) {

    bankAccountBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      try {
        bankAccountBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        bankAccountBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      bankAccountBtn.click();
      showNotification('✅ Đã click Tài khoản ngân hàng!');

      // Wait for password popup to appear
      setTimeout(() => {
        
        reEnterWithdrawPassword(password, bankAccount, bankName, sendResponse);
      }, 2000);
    }, 500);
  } else {
    sendResponse({ success: true, message: 'Vui lòng chọn Tài khoản ngân hàng!' });
  }
}

function reEnterWithdrawPassword(password, bankAccount, bankName, sendResponse) {
  console.log('🔐 Re-entering withdraw password...');

  // Find password input boxes in popup
  const passwordInputs = document.querySelectorAll('.ui-password-input__item');

  if (passwordInputs.length < 6) {
    console.error('❌ Password popup not found');
    showNotification('❌ Không tìm thấy popup nhập mật khẩu!');
    sendResponse({ success: false, error: 'Password popup not found' });
    return;
  }

  // Click first box to open keyboard
  let firstBox = passwordInputs[0];

  firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => {
    try {
      const rect = firstBox.getBoundingClientRect();
      const touchObj = new Touch({
        identifier: Date.now(),
        target: firstBox,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1
      });

      firstBox.dispatchEvent(new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touchObj],
        targetTouches: [touchObj],
        changedTouches: [touchObj]
      }));

      setTimeout(() => {
        firstBox.dispatchEvent(new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          changedTouches: [touchObj]
        }));
      }, 100);
    } catch (e) {
      console.log('  Touch event failed:', e.message);
    }

    setTimeout(() => {
      firstBox.click();

      setTimeout(() => {
        const parentUl = firstBox.closest('.ui-password-input__security');
        if (parentUl) {
          parentUl.click();
        }

        // Now wait for keyboard using smart wait

        // Wait for keyboard to open - check if keyboard buttons exist
        const waitForKeyboard = (callback, attempts = 0) => {
          const keyboardButtons = document.querySelectorAll('button, div[role="button"]');
          const hasKeyboard = Array.from(keyboardButtons).some(btn => {
            const text = btn.textContent.trim();
            return text.length === 1 && /[0-9]/.test(text);
          });

          if (hasKeyboard || attempts >= 10) {
            if (hasKeyboard) {
            } else {
              
            }
            callback();
          } else {
            setTimeout(() => waitForKeyboard(callback, attempts + 1), 200);
          }
        };

        waitForKeyboard(() => {
          clickDigitsOnKeyboard(password, 0, () => {
            showNotification('✅ Đã nhập mật khẩu!');

            // Click "Tiếp Theo" button
            setTimeout(() => {
              const nextBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.textContent.trim() === 'Tiếp Theo'
              );

              if (nextBtn) {
                try {
                  nextBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                  nextBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                } catch (e) { }
                nextBtn.click();
                showNotification('✅ Đã click Tiếp Theo!');

                // Wait for bank form to appear
                setTimeout(() => {
                  fillBankAccountForm(bankAccount, bankName, sendResponse);
                }, 2000);
              } else {
                sendResponse({ success: true, message: 'Vui lòng click Tiếp Theo!' });
              }
            }, 1000);
          });
        }, 2000);
      }, 500);
    }, 500);
  }, 500);
}

function fillBankAccountForm(bankAccount, bankName, sendResponse) {
  console.log('🏦 Step 4: Filling bank account form...');
  console.log(`  Bank Account: ${bankAccount}`);
  console.log(`  Bank Name: ${bankName}`);

  // Wait a bit for form to fully load
  setTimeout(() => {
    // Find account number input with exact placeholder
    const accountInput = document.querySelector('input[placeholder="Vui lòng nhập số tài khoản ngân hàng"]');

    if (!accountInput) {
      console.error('❌ Account input not found');
      showNotification('❌ Không tìm thấy ô nhập số tài khoản!');
      sendResponse({ success: false, error: 'Account input not found' });
      return;
    }

    // Scroll into view
    accountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      // Fill account number
      accountInput.focus();
      accountInput.click();

      // Clear first
      accountInput.value = '';

      // Set value using native setter
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(accountInput, bankAccount);

      // Trigger events
      accountInput.dispatchEvent(new Event('input', { bubbles: true }));
      accountInput.dispatchEvent(new Event('change', { bubbles: true }));
      accountInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
      accountInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      console.log(`✅ Filled account number: ${bankAccount}`);
      showNotification(`✅ Đã nhập số TK: ${bankAccount}`);

      // Wait then select bank
      setTimeout(() => {
        // Find bank dropdown input with exact selector
        const bankDropdown = document.querySelector('input[type="search"][placeholder="Chọn ngân hàng phát hành"]');

        if (!bankDropdown) {
          console.error('❌ Bank dropdown not found');
          showNotification('❌ Không tìm thấy dropdown ngân hàng!');
          sendResponse({ success: false, error: 'Bank dropdown not found' });
          return;
        }

        // Click to open dropdown
        bankDropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          try {
            bankDropdown.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            bankDropdown.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          bankDropdown.click();

          // Type bank name to filter the list
          console.log(`  Typing bank name: ${bankName}`);

          setTimeout(() => {
            // Clear and type
            bankDropdown.value = '';

            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(bankDropdown, bankName);

            bankDropdown.dispatchEvent(new Event('input', { bubbles: true }));
            bankDropdown.dispatchEvent(new Event('change', { bubbles: true }));
            bankDropdown.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

            // Wait for list to filter
            setTimeout(() => {
              console.log('🔍 Searching for bank in dropdown...');

              // Find bank option containers directly (correct selector)
              const bankContainers = document.querySelectorAll('.ui-options__option');

              console.log(`📋 Found ${bankContainers.length} bank option containers`);

              // Multiple search strategies (from best to most flexible)
              const searchStrategies = [
                bankName.toUpperCase(), // Full name: "MBBank"
                bankName.replace(/([A-Z])([A-Z]+)/g, '$1$2 ').trim().toUpperCase(), // "MBBank" → "MB BANK"
                bankName.replace('Bank', ' Bank').toUpperCase(), // "MBBank" → "MB Bank"
                bankName.split(' ')[0].toUpperCase(), // First word: "MB"
                bankName.replace(' PAY', '').toUpperCase(), // Remove PAY
                bankName.replace(' BANK', '').toUpperCase(), // Remove BANK
                bankName.replace('BANK', '').toUpperCase(), // Remove BANK (no space)
                bankName.substring(0, 3).toUpperCase() // First 3 chars: "MBB"
              ];

              let bankOption = null;

              // Search within bank containers
              for (const container of bankContainers) {
                const text = container.textContent.trim().toUpperCase();

                for (const strategy of searchStrategies) {
                  const isMatch =
                    text === strategy ||
                    text === strategy + ' BANK' ||
                    text === strategy + 'BANK' ||
                    text.startsWith(strategy + ' ') ||
                    text.includes(strategy) ||
                    (text.startsWith(strategy) && text.length < 50);

                  if (isMatch) {
                    console.log(`✅ Found bank: "${text}" (matched with: "${strategy}")`);
                    bankOption = container;
                    break;
                  }
                }

                if (bankOption) break;
              }

              if (bankOption) {
                console.log(`✅ Found bank: ${bankOption.textContent.trim()}`);

                bankOption.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(() => {
                  try {
                    bankOption.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                    bankOption.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                  } catch (e) { }

                  bankOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                  bankOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                  bankOption.click();

                  showNotification(`✅ Đã chọn: ${bankName}`);

                  // Wait longer for bank to be selected before clicking confirm
                  setTimeout(() => {
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                      btn.textContent.trim() === 'Xác Nhận'
                    );

                    if (confirmBtn) {
                      try {
                        confirmBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        confirmBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                      } catch (e) { }
                      confirmBtn.click();
                      showNotification('✅ Đã xác nhận thêm bank!');
                      sendResponse({ success: true, message: 'Đã thêm tài khoản ngân hàng thành công!' });
                    } else {
                      sendResponse({ success: true, message: 'Vui lòng click Xác Nhận!' });
                    }
                  }, 2000);
                }, 1000);
              } else {
                console.error(`❌ Bank "${bankName}" not found in list`);
                showNotification(`❌ Không tìm thấy ${bankName}!`);
                sendResponse({ success: false, error: 'Bank not found in list' });
              }
            }, 1500);
          }, 500);
        }, 500);
      }, 1000);
    }, 500);
  }, 500);
}

// PROMOTION: Auto-click "Đăng Ký Ngay" button and handle popup

// ============================================
// PHONE VERIFICATION - Standalone Feature
// ============================================
// Listener merged into main listener above

function goToSecurityPage(apiKey, sendResponse) {

  // Step 0: Navigate back to home page first
  navigateBackToHome(() => {
    // Step 1: Find and click "Tôi" tab
    setTimeout(() => {

      // Method 1: Find by span text (most accurate)
      const allSpans = document.querySelectorAll('span[class*="_text"]');
      let profileTab = null;

      for (let span of allSpans) {
        const text = span.textContent.trim();
        if (text === 'Tôi') {
          // Get the parent tab element
          profileTab = span.closest('[role="tab"]') || span.closest('.ui-tabbar-item') || span.closest('[class*="tabbar-item"]');
          if (profileTab && profileTab.offsetParent !== null) {
            break;
          }
        }
      }

      // Method 2: Fallback to tab textContent
      if (!profileTab) {
        const tabs = document.querySelectorAll('[role="tab"], .ui-tabbar-item, [class*="tabbar-item"]');
        for (let tab of tabs) {
          const text = tab.textContent.trim();
          if (text === 'Tôi' && tab.offsetParent !== null) {
            profileTab = tab;
            break;
          }
        }
      }

      if (profileTab) {

        try {
          profileTab.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
          profileTab.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
        } catch (e) { }

        profileTab.click();

        // Step 2: Wait for profile page, then click "Bảo Mật"
        setTimeout(() => {

          const labels = document.querySelectorAll('span._label_vplua_50, span[class*="_label_"], span.mine-menulist-label, span');
          let securityBtn = null;

          for (let label of labels) {
            const text = label.textContent.trim();

            if (text === 'Bảo Mật' || text.includes('Bảo Mật')) {
              // Get parent clickable element
              const parentDiv = label.closest('._left_vplua_44') || label.closest('[class*="_left_"]') || label.parentElement;

              if (parentDiv && parentDiv.offsetParent !== null) {
                securityBtn = parentDiv;
                break;
              }
            }
          }

          if (securityBtn) {

            securityBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
              try {
                securityBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                securityBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
              } catch (e) { }

              securityBtn.click();

              // Step 3: Wait for security page, then click "Số Điện Thoại"
              setTimeout(() => {

                const listItems = document.querySelectorAll('li._item_1c3hl_56, li[class*="_item_"], li');
                let phoneItem = null;

                for (let item of listItems) {
                  const text = item.textContent;

                  if (text.includes('Số Điện Thoại')) {
                    phoneItem = item;
                    break;
                  }
                }

                if (phoneItem) {

                  phoneItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                  setTimeout(() => {
                    try {
                      phoneItem.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                      phoneItem.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }

                    phoneItem.click();

                    // Step 4: Wait for phone form to load
                    setTimeout(() => {
                      console.log('🔍 Step 4: Starting phone verification...');
                      handlePhoneVerificationStandalone(apiKey, sendResponse);
                    }, 2000);
                  }, 500);

                } else {
                  showNotification('❌ Không tìm thấy mục Số Điện Thoại!');
                  sendResponse({ success: false, error: 'Phone item not found' });
                }
              }, 2000);
            }, 500);

          } else {
            showNotification('❌ Không tìm thấy nút Bảo Mật!');
            sendResponse({ success: false, error: 'Security button not found' });
          }
        }, 2000);

      } else {
        showNotification('❌ Không tìm thấy tab Tôi!');
        sendResponse({ success: false, error: 'Profile tab not found' });
      }
    }, 1000);
  });
}

async function handlePhoneVerificationStandalone(apiKey, sendResponse, retryCount = 0) {
  const maxRetries = 3;

  ...`);

  // Check if phone form exists - find ALL matching inputs
  const allPhoneInputs = document.querySelectorAll('input[placeholder="Nhập SĐT"]');
  const allSmsInputs = document.querySelectorAll('input[placeholder="Nhập mã SMS"]');

  // Find the VISIBLE and EDITABLE phone input (not readonly, not hidden)
  let phoneInput = null;
  let smsInput = null;

  for (let input of allPhoneInputs) {
    if (input.offsetParent !== null && !input.readOnly && !input.disabled) {
      phoneInput = input;
      console.log(`✅ Selected visible phone input:`, input);
      break;
    }
  }

  for (let input of allSmsInputs) {
    if (input.offsetParent !== null && !input.readOnly && !input.disabled) {
      smsInput = input;
      break;
    }
  }

  if (!phoneInput || !smsInput) {
    console.log('⚠️ Phone verification form not found');
    showPromotionNotification('❌ Không tìm thấy form xác thực SMS!\n\nVui lòng mở trang có form xác thực.');
    sendResponse({ success: false, error: 'Phone verification form not found' });
    return;
  }

  showPromotionNotification(`📱 Đang lấy số điện thoại...\n\n🔄 Lần thử: ${retryCount + 1}/${maxRetries}`);

  try {
    // Get phone number from background
    const simData = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'getPhoneNumber', apiKey: apiKey },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Failed to get phone number'));
          }
        }
      );
    });

    const phoneNumber = simData.phone;
    const otpId = simData.otpId;
    const simId = simData.simId;

    console.log(`✅ Got phone: ${phoneNumber}`);
    showPromotionNotification(`✅ Đã lấy số: ${phoneNumber}\n\nĐang điền...`);

    // Fill phone number - use direct value set (not char-by-char) because input has dir="rtl"
    const phoneToFill = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;

    console.log(`📝 Filling phone number: ${phoneToFill}`);
    }`);

    // Focus and clear
    phoneInput.focus();
    await randomDelay(100, 200);
    phoneInput.click();
    await randomDelay(50, 100);

    // Set value directly (important for RTL inputs!)
    phoneInput.value = phoneToFill;

    // Trigger all necessary events
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    phoneInput.dispatchEvent(new Event('blur', { bubbles: true }));

    await randomDelay(200, 300);

    console.log(`✅ Filled phone: ${phoneToFill}`);

    // Check ALL phone inputs to see which one has the correct value
    const allInputsAfter = document.querySelectorAll('input[placeholder="Nhập SĐT"]');
    console.log(`🔍 Checking all ${allInputsAfter.length} phone inputs after filling:`);
    allInputsAfter.forEach((inp, idx) => {
    });

    // Wait then click "Lấy mã xác minh"
    setTimeout(async () => {
      // Check for phone error
      const hasError = await checkAndHandlePhoneError(apiKey, simId, phoneInput, smsInput, sendResponse);
      if (hasError) return;

      // Find and click "Lấy mã xác minh" button
      const getCodeBtn = findGetCodeButton();

      if (getCodeBtn) {
        showPromotionNotification('📲 Đang gửi mã...');

        getCodeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          try {
            getCodeBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            getCodeBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          getCodeBtn.click();

          // Wait and get OTP with retry callback
          waitForOTPAndFill(otpId, simId, apiKey, smsInput, phoneInput, sendResponse, retryCount, maxRetries);

        }, 500);
      } else {
        showPromotionNotification('⚠️ Không tìm thấy nút Lấy mã!');
        sendResponse({ success: false, error: 'Get code button not found' });
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error:', error);
    showPromotionNotification(`❌ Lỗi!\n\n${error.message}`);
    sendResponse({ success: false, error: error.message });
  }
}

// Find "Lấy mã xác minh" button
function findGetCodeButton() {
  // Method 1: By class
  const sendButtons = document.querySelectorAll('[class*="_sendButton"]');
  for (let btn of sendButtons) {
    const text = btn.textContent.trim();
    if (text.includes('Lấy mã') || text.includes('xác minh')) {
      return btn;
    }
  }

  // Method 2: By suffix
  const suffixElements = document.querySelectorAll('.ui-input__suffix');
  for (let el of suffixElements) {
    const text = el.textContent.trim();
    if (text.includes('Lấy mã') || text.includes('xác minh')) {
      return el;
    }
  }

  // Method 3: By text
  const allElements = document.querySelectorAll('button, div, span, a');
  for (let el of allElements) {
    const text = el.textContent.trim();
    if (text === 'Lấy mã xác minh' && el.offsetParent !== null) {
      return el;
    }
  }

  return null;
}

// Wait for OTP and fill
async function waitForOTPAndFill(otpId, simId, apiKey, smsInput, phoneInput, sendResponse, retryCount, maxRetries) {

  let attempts = 0;
  const maxAttempts = 10;
  const totalSeconds = maxAttempts * 7; // 70 seconds total
  let remainingSeconds = totalSeconds;

  // Update countdown notification every second
  const countdownInterval = setInterval(() => {
    remainingSeconds--;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    showPromotionNotification(`⏳ Đang đợi mã OTP...\n\n⏱️ Còn lại: ${timeStr}\n📊 Lần thử: ${attempts}/${maxAttempts}`);

    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  const checkOTP = async () => {
    attempts++;
    ...`);

    // Update notification immediately
    const timeLeft = (maxAttempts - attempts) * 7;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    showPromotionNotification(`⏳ Đang đợi mã OTP...\n\n⏱️ Còn lại: ${timeStr}\n📊 Lần thử: ${attempts}/${maxAttempts}`);

    try {
      const otpData = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'getOTP', otpId: otpId, apiKey: apiKey },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (otpData.success && (otpData.code || otpData.data?.code || otpData.data?.content)) {
        // Stop countdown
        clearInterval(countdownInterval);

        console.log(`📩 Raw OTP data:`, otpData);

        // Try multiple sources for OTP
        let otpCode = null;
        let source = '';

        // Priority 1: Extract from content (message text) - most reliable
        const content = otpData.data?.content || otpData.content;
        if (content) {
          const contentMatch = content.match(/\b(\d{4,6})\b/);
          if (contentMatch) {
            otpCode = contentMatch[1];
            source = 'content';
            console.log(`✅ Extracted OTP from content: ${otpCode}`);
          }
        }

        // Priority 2: Check code field (if content didn't work)
        if (!otpCode) {
          const codeField = otpData.data?.code || otpData.code;

          // If code field is clean digits, use it
          if (codeField && /^\d{4,6}$/.test(codeField)) {
            otpCode = codeField;
            source = 'code field (clean)';
            console.log(`✅ Got clean OTP from code field: ${otpCode}`);
          }
          // If code field contains digits, extract them
          else if (codeField) {
            const codeMatch = codeField.match(/\b(\d{4,6})\b/);
            if (codeMatch) {
              otpCode = codeMatch[1];
              source = 'code field (extracted)';
              console.log(`✅ Extracted OTP from code field: ${otpCode}`);
            }
          }
        }

        // If still no OTP found, show error
        if (!otpCode) {
          console.log('⚠️ Could not extract OTP from any field');
          const debugData = JSON.stringify(otpData).substring(0, 100);
          showPromotionNotification(`⚠️ Không tìm thấy mã OTP!\n\nDữ liệu: ${debugData}...`);

          // Continue checking
          if (attempts < maxAttempts) {
            setTimeout(checkOTP, 7000);
          }
          return;
        }

        console.log(`✅ Final OTP: ${otpCode} (from ${source})`);

        showPromotionNotification(`✅ Nhận được mã: ${otpCode}\n\nĐang điền...`);

        // Fill OTP character by character (human-like)
        smsInput.focus();
        await randomDelay(100, 200);
        smsInput.click();
        await randomDelay(50, 100);
        smsInput.value = '';

        console.log(`📝 Typing OTP: ${otpCode}`);

        // Type each digit with random delay
        for (let i = 0; i < otpCode.length; i++) {
          smsInput.value += otpCode[i];
          smsInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Random typing speed (100-180ms per digit)
          await randomDelay(100, 180);
        }

        smsInput.dispatchEvent(new Event('change', { bubbles: true }));
        await randomDelay(100, 200);

        console.log('✅ Typed OTP');

        // Click confirm
        setTimeout(() => {
          const confirmBtn = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim() === 'Xác Nhận'
          );

          if (confirmBtn) {
            try {
              confirmBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
              confirmBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
            } catch (e) { }

            confirmBtn.click();
            showPromotionNotification('✅ Đã xác thực SMS thành công!');
            sendResponse({ success: true, message: 'Phone verified successfully' });
          } else {
            showPromotionNotification('⚠️ Vui lòng click Xác Nhận!');
            sendResponse({ success: true, message: 'Please click confirm manually' });
          }
        }, 1000);

      } else if (attempts < maxAttempts) {
        setTimeout(checkOTP, 7000);
      } else {
        // Stop countdown on timeout
        clearInterval(countdownInterval);
        console.log('❌ OTP timeout');

        // Retry with new number if possible
        if (retryCount < maxRetries - 1) {
          showPromotionNotification(`⚠️ Không nhận được OTP!\n\n🔄 Đang hủy số và lấy số mới...\n\nLần thử: ${retryCount + 2}/${maxRetries}`);

          // Cancel current SIM
          chrome.runtime.sendMessage(
            { action: 'cancelSim', simId: simId, apiKey: apiKey },
            (response) => {
              console.log('✅ Cancelled old SIM');

              // Clear phone input
              phoneInput.value = '';
              smsInput.value = '';

              // Retry with new number after 2 seconds
              setTimeout(() => {
                handlePhoneVerificationStandalone(apiKey, sendResponse, retryCount + 1);
              }, 2000);
            }
          );
        } else {
          showPromotionNotification(`❌ Đã thử ${maxRetries} lần!\n\nKhông nhận được mã OTP.`);
          sendResponse({ success: false, error: 'OTP timeout after retries' });
        }
      }
    } catch (error) {
      if (attempts < maxAttempts) {
        setTimeout(checkOTP, 7000);
      } else {
        // Stop countdown on error
        clearInterval(countdownInterval);
        showPromotionNotification('❌ Lỗi!\n\nKhông thể lấy mã OTP.');
        sendResponse({ success: false, error: error.message });
      }
    }
  };

  // Start checking after 7 seconds
  setTimeout(checkOTP, 7000);
}

// ============================================
// PROMOTION - Without Phone Verification
// ============================================
// Listener merged into main listener above

function claimPromotionWithoutPhoneVerify(sendResponse) {
  // Wait for page to load
  setTimeout(() => {

    const allButtons = document.querySelectorAll('button, div[role="button"], a');
    let registerButton = null;

    // Find "Đăng Ký Ngay" button
    for (let btn of allButtons) {
      const text = btn.textContent.trim();

      if (text === 'Đăng Ký Ngay' || text === 'ĐĂNG KÝ NGAY' ||
        text.toLowerCase() === 'đăng ký ngay') {
        if (btn.offsetParent !== null) {
          registerButton = btn;
          break;
        }
      }
    }

    if (registerButton) {
      showPromotionNotification('✅ Tìm thấy nút Đăng Ký Ngay!\n\nĐang click...');

      // Use human-like click
      humanClick(registerButton).then(() => {

        // Wait random time before checking (1.5-3 seconds)
        randomDelay(1500, 3000).then(() => {
          checkAfterRegisterClickNoPhoneVerify(sendResponse);
        });
      });
    } else {
      showPromotionNotification('⚠️ Không tìm thấy nút Đăng Ký Ngay!');
      sendResponse({ success: false, error: 'Register button not found' });
    }
  }, 3000);
}

// Check what appeared after clicking "Đăng Ký Ngay" (no phone verify version)
function checkAfterRegisterClickNoPhoneVerify(sendResponse) {
  // Check if "Vào" button exists
  const allButtons = document.querySelectorAll('button, div[role="button"], a');
  let vaoButton = null;

  for (let btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === 'Vào' || text === 'VÀO') {
      if (btn.offsetParent !== null) {
        vaoButton = btn;
        break;
      }
    }
  }

  if (vaoButton) {
    // Has "Vào" button → Need to click it (assume already verified)
    showPromotionNotification('✅ Đang vào...');

    humanClick(vaoButton).then(() => {

      randomDelay(1500, 3000).then(() => {
        
        handleBonusQuestionForm(sendResponse);
      });
    });
  } else {
    // No "Vào" button → Go directly to 58K form
    showPromotionNotification('✅ Đang tìm form 58K...');

    setTimeout(() => {
      handleBonusQuestionForm(sendResponse);
    }, 1000);
  }
}

// Check if phone number is already linked and retry with new number
// Returns: true if has error and handled, false if no error
async function checkAndHandlePhoneError(apiKey, currentSimId, phoneInput, smsInput, sendResponse, retryCount = 0) {
  const maxRetries = 3; // Maximum 3 retries

  // Wait a bit for error popup to appear
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check for error notification (by icon, not just text)
  let hasPhoneError = false;
  let hasSuccessNotification = false;

  // Method 1: Check for success icon (checkmark/tick)
  const successIcons = document.querySelectorAll('svg, i, span');
  for (let icon of successIcons) {
    const className = (icon.className || '').toString().toLowerCase();
    const innerHTML = (icon.innerHTML || '').toLowerCase();

    // Check for success indicators
    if (className.includes('success') ||
      className.includes('check') ||
      innerHTML.includes('check') ||
      icon.textContent.includes('✓') ||
      icon.textContent.includes('✔')) {

      // Make sure it's visible and near text about "mã xác minh"
      const parent = icon.closest('div');
      if (parent && parent.offsetParent !== null) {
        const parentText = parent.textContent.toLowerCase();
        if (parentText.includes('mã xác minh') || parentText.includes('thành công')) {
          hasSuccessNotification = true;
          console.log('✅ Success notification detected (by icon)');
          break;
        }
      }
    }
  }

  // Method 2: Only check for error if no success notification
  if (!hasSuccessNotification) {
    // Look for error icon (X mark or error indicator)
    const errorIcons = document.querySelectorAll('svg, i, span');
    for (let icon of errorIcons) {
      const className = (icon.className || '').toString().toLowerCase();
      const innerHTML = (icon.innerHTML || '').toLowerCase();

      // Check for error indicators
      if (className.includes('error') ||
        className.includes('close') ||
        innerHTML.includes('close') ||
        icon.textContent.includes('✕') ||
        icon.textContent.includes('✖') ||
        icon.textContent.includes('×')) {

        // Make sure it's visible and near text about phone number
        const parent = icon.closest('div');
        if (parent && parent.offsetParent !== null) {
          const parentText = parent.textContent.toLowerCase();
          if (parentText.includes('số điện thoại') &&
            (parentText.includes('đã được liên kết') ||
              parentText.includes('đã liên kết') ||
              parentText.includes('tài khoản khác'))) {
            hasPhoneError = true;
            console.log('⚠️ Phone number already linked error detected (by icon)!');
            break;
          }
        }
      }
    }
  }

  if (hasPhoneError) {
    if (retryCount >= maxRetries) {
      showPromotionNotification(`❌ Đã thử ${maxRetries} số!\n\nTất cả đều bị liên kết.\n\nĐÃ DỪNG!`);
      sendResponse({ success: false, error: 'All phone numbers already linked', stopped: true });
      return true; // Has error and stopped
    }

    console.log(`🔄 Retry ${retryCount + 1}/${maxRetries}: Getting new phone number...`);
    showPromotionNotification(`🔄 Số bị trùng!\n\nĐang lấy số mới (${retryCount + 1}/${maxRetries})...`);

    // Cancel current sim
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'cancelSim', simId: currentSimId, apiKey: apiKey },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log('⚠️ Failed to cancel sim:', chrome.runtime.lastError.message);
            } else {
              console.log('✅ Cancelled old sim');
            }
            resolve();
          }
        );
      });
    } catch (e) {
      console.log('⚠️ Error cancelling sim:', e);
    }

    // Get new phone number
    try {
      const newSimData = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'getPhoneNumber', apiKey: apiKey },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || 'Failed to get new phone number'));
            }
          }
        );
      });

      const newPhone = newSimData.phone;
      const newPhoneToFill = newPhone.startsWith('0') ? newPhone.substring(1) : newPhone;

      console.log(`✅ Got new phone: ${newPhone}`);
      showPromotionNotification(`✅ Số mới: ${newPhone}\n\nĐang điền...`);

      // Clear old phone and fill new one
      phoneInput.value = '';
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(phoneInput, newPhoneToFill);
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Retry the whole process with new phone
      setTimeout(() => {
        checkAndHandlePhoneError(apiKey, newSimData.simId, phoneInput, smsInput, sendResponse, retryCount + 1);
      }, 1000);

      return true; // Has error and retrying

    } catch (error) {
      console.error('❌ Error getting new phone:', error);
      showPromotionNotification(`❌ Lỗi lấy số mới!\n\n${error.message}`);
      sendResponse({ success: false, error: error.message });
      return true; // Has error
    }
  }

  return false; // No error, continue
}

// Handle 58K bonus question form
function handleBonusQuestionForm(sendResponse) {

  setTimeout(() => {
    const pageText = document.body.textContent;
    const hasBonusForm = pageText.includes('58K') ||
      pageText.includes('TRẢI NGHIỆM') ||
      pageText.includes('QUÝ HỘI VIÊN CÓ MUỐN NHẬN');

    if (!hasBonusForm) {
      
      setTimeout(() => {
        handleBonusQuestionForm(sendResponse);
      }, 2000);
      return;
    }

    showPromotionNotification('🎁 Tìm thấy form 58K!\n\nĐang điền "Có"...');

    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    let answerInput = null;

    for (let input of inputs) {
      const placeholder = (input.placeholder || '').toLowerCase();
      if (placeholder.includes('câu trả lời') || placeholder.includes('nhập')) {
        answerInput = input;
        break;
      }
    }

    if (answerInput) {
      answerInput.focus();
      answerInput.click();
      answerInput.value = '';

      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(answerInput, 'Có');

      answerInput.dispatchEvent(new Event('input', { bubbles: true }));
      answerInput.dispatchEvent(new Event('change', { bubbles: true }));

      showPromotionNotification('✅ Đã điền "Có"!\n\nĐang click Đăng Ký Ngay...');

      setTimeout(() => {
        clickFinalRegisterButton(sendResponse);
      }, 1000);
    } else {
      showPromotionNotification('⚠️ Không tìm thấy ô nhập câu trả lời!');
      sendResponse({ success: false, error: 'Answer input not found' });
    }
  }, 2000);
}

// Click final "Đăng Ký Ngay" button
function clickFinalRegisterButton(sendResponse) {
  const allButtons = document.querySelectorAll('button, div, span, a');
  let finalRegisterBtn = null;

  for (let btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === 'Đăng Ký Ngay' || text === 'ĐĂNG KÝ NGAY') {
      if (btn.offsetParent !== null) {
        finalRegisterBtn = btn;
        break;
      }
    }
  }

  if (finalRegisterBtn) {
    finalRegisterBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      try {
        finalRegisterBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        finalRegisterBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      } catch (e) { }

      finalRegisterBtn.click();

      // Wait for captcha to appear
      setTimeout(() => {
        console.log('🔍 Checking for captcha...');

        const hasCaptcha = document.querySelector('.botion_box_71ce3a00, .botion_box, [class*="botion"]') ||
          document.body.textContent.includes('Chọn hình ảnh với');

        if (hasCaptcha) {
          
          showPromotionNotification('🤖 CAPTCHA XUẤT HIỆN!\n\n⏸️ Vui lòng tự giải captcha...\n\n✅ Tool sẽ tự động tiếp tục sau khi bạn giải xong!');

          // Wait for captcha to be solved (check every 2 seconds)
          waitForCaptchaSolved(() => {
            console.log('✅ Captcha solved! Continuing...');
            showPromotionNotification('✅ Captcha đã giải!\n\nĐang kiểm tra kết quả...');

            setTimeout(() => {
              checkPromotionResult(sendResponse);
            }, 2000);
          });
        } else {
          // No captcha, check result directly
          checkPromotionResult(sendResponse);
        }
      }, 2000);
    }, 1000);
  } else {
    showPromotionNotification('⚠️ Vui lòng click Đăng Ký Ngay!');
    sendResponse({ success: true, message: 'Please click register manually' });
  }
}

// Wait for captcha to be solved by user
function waitForCaptchaSolved(callback) {
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes max

  const checkInterval = setInterval(() => {
    attempts++;

    const hasCaptcha = document.querySelector('.botion_box_71ce3a00, .botion_box, [class*="botion"]') ||
      document.body.textContent.includes('Chọn hình ảnh với');

    if (!hasCaptcha) {
      clearInterval(checkInterval);
      
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      
      showPromotionNotification('⏱️ Timeout!\n\nVui lòng giải captcha nhanh hơn.');
      callback(); // Continue anyway
    } else if (attempts % 5 === 0) {
      // Update notification every 10 seconds
      const remaining = Math.floor((maxAttempts - attempts) * 2 / 60);
      showPromotionNotification(`🤖 Đang chờ bạn giải captcha...\n\n⏱️ Còn ${remaining} phút\n\n✅ Tool sẽ tự động tiếp tục!`);
    }
  }, 2000);
}

// Check promotion result
function checkPromotionResult(sendResponse) {
  setTimeout(() => {
    const resultMessage = getResultNotification();
    const currentUrl = window.location.hostname;

    // If error detected, stop immediately
    if (resultMessage.includes('IP') || resultMessage.includes('đã được thu thập') ||
      resultMessage.includes('đã đạt số người') || resultMessage.includes('Phần thưởng này đã')) {
      console.log('⚠️ Error detected, stopping...');
      showPromotionNotification('⚠️ Lỗi!\n\n' + resultMessage.substring(0, 100) + '...');
      sendResponse({ success: false, error: resultMessage });
      return; // Stop here
    }

    chrome.storage.local.get(['lastUsername'], function (result) {
      const username = result.lastUsername || getUsername();

      chrome.runtime.sendMessage({
        action: 'savePromotionResult',
        data: {
          site: currentUrl,
          username: username,
          result: resultMessage,
          timestamp: new Date().toISOString()
        }
      });

      // Success case
      showPromotionNotification('✅ HOÀN THÀNH!\n\n' + resultMessage.substring(0, 100));
      sendResponse({ success: true, message: resultMessage });
    });
  }, 3000); // Wait 3 seconds for notification to appear
}

// Get username from page
function getUsername() {
  const pageText = document.body.textContent;

  const memberIdMatch = pageText.match(/Mã số thành viên[:\s]+(\d+)/i);
  if (memberIdMatch) {
    return memberIdMatch[1];
  }

  const usernameElements = document.querySelectorAll('[class*="username"], [class*="user-name"], [class*="member"]');
  for (let el of usernameElements) {
    const text = el.textContent.trim();
    if (text && text.length > 3 && text.length < 30 && !text.includes(' ')) {
      return text;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const urlUsername = urlParams.get('username') || urlParams.get('user');
  if (urlUsername) {
    return urlUsername;
  }

  return 'Unknown';
}

// Get result notification
function getResultNotification() {
  const notifications = document.querySelectorAll('div, span, p');

  for (let el of notifications) {
    const text = el.textContent.trim();

    if (text.includes('IP của bạn') || text.includes('đã được thu thập') ||
      text.includes('Đã đạt số người') || text.includes('Phần thưởng này đã')) {
      console.log('Found error notification:', text);
      return text;
    }

    if (text.includes('thành công') || text.includes('Chúc mừng') ||
      text.includes('đã nhận')) {
      console.log('Found success notification:', text);
      return text;
    }
  }

  return 'Đã hoàn thành đăng ký (không có thông báo)';
}

// Show promotion notification
function showPromotionNotification(message) {
  const existing = document.getElementById('promo-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'promo-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #00ff00, #00cc00);
    color: #000;
    padding: 20px 30px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0,255,0,0.4);
    white-space: pre-line;
    text-align: center;
    max-width: 300px;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}

function clickVaoButton() {

  // Check if popup exists
  const pageText = document.body.textContent;
  const hasPopup = pageText.includes('Lời nhắc quan trọng') ||
    pageText.includes('Bạn cần hoàn thành việc rằng buộc thẻ ngân hàng') ||
    pageText.includes('Vào');

  if (!hasPopup) {
    return false;
  }

  // Find "Vào" button
  const allButtons = document.querySelectorAll('button, div, span, a, [role="button"]');

  for (let btn of allButtons) {
    const text = btn.textContent.trim();

    // Look for "Vào" button (exact match)
    if (text === 'Vào' || text === 'VÀO') {
      if (btn.offsetParent !== null) {

        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          try {
            btn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
            btn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
          } catch (e) { }

          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          btn.click();

        }, 500);

        return true;
      }
    }
  }

  // If not found
  console.error('❌ "Vào" button not found');
  return false;
}

// ============================================
// EXPORT FUNCTIONS TO WINDOW (for automation)
// ============================================

// startAutoFill removed - now inline in message listener
window.startAutoLogin = startAutoLogin;
window.goToWithdrawPage = goToWithdrawPage;
window.goToSecurityPage = goToSecurityPage;
window.claimPromotionWithoutPhoneVerify = claimPromotionWithoutPhoneVerify;

