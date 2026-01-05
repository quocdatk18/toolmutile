// Extension loaded
console.log('Auto Register Tool loaded');

// Load banks from VietQR API
async function loadBanks() {
  const bankSelect = document.getElementById('bankName');

  try {
    console.log('🏦 Loading banks from API...');
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const data = await response.json();

    if (data.code === '00' && data.data) {
      console.log(`✅ Loaded ${data.data.length} banks`);

      // Clear loading option
      bankSelect.innerHTML = '<option value="">Vui lòng chọn ngân hàng</option>';

      // Add banks sorted by name
      data.data
        .sort((a, b) => a.shortName.localeCompare(b.shortName))
        .forEach(bank => {
          const option = document.createElement('option');
          option.value = bank.shortName;
          option.textContent = `${bank.shortName} - ${bank.name}`;
          bankSelect.appendChild(option);
        });
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('❌ Failed to load banks:', error);

    // Fallback to hardcoded list
    console.log('⚠️ Using fallback bank list');
    bankSelect.innerHTML = `
      <option value="">Vui lòng chọn ngân hàng</option>
      <option value="ABBANK">ABBANK</option>
      <option value="ACB">ACB</option>
      <option value="Agribank">Agribank</option>
      <option value="BIDV">BIDV</option>
      <option value="Eximbank">Eximbank</option>
      <option value="HDBank">HDBank</option>
      <option value="MB">MB</option>
      <option value="MSB">MSB</option>
      <option value="OCB">OCB</option>
      <option value="Sacombank">Sacombank</option>
      <option value="SCB">SCB</option>
      <option value="SeABank">SeABank</option>
      <option value="SHB">SHB</option>
      <option value="Techcombank">Techcombank</option>
      <option value="TPBank">TPBank</option>
      <option value="VIB">VIB</option>
      <option value="Vietcombank">Vietcombank</option>
      <option value="VietinBank">VietinBank</option>
      <option value="VPBank">VPBank</option>
    `;
  }
}

// Load banks when popup opens
loadBanks();

// Select/Deselect all buttons
document.getElementById('selectAllBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check').forEach(checkbox => {
    checkbox.checked = true;
  });
});

document.getElementById('deselectAllBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check').forEach(checkbox => {
    checkbox.checked = false;
  });
});

// Toggle password visibility
document.getElementById('togglePassword1').addEventListener('click', function () {
  const passwordInput = document.getElementById('password');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});

document.getElementById('togglePassword2').addEventListener('click', function () {
  const passwordInput = document.getElementById('confirmPassword');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});

document.getElementById('togglePassword3').addEventListener('click', function () {
  const passwordInput = document.getElementById('withdrawPassword');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});



// Show status message
function showStatus(message, type = 'info') {
  const statusSection = document.getElementById('statusSection');
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusSection.style.display = 'block';

  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 5000);
}

// Removed saved accounts functionality

// Auto Register button
document.getElementById('registerBtn').addEventListener('click', async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const withdrawPassword = document.getElementById('withdrawPassword').value;
  const fullname = document.getElementById('fullname').value;

  // Validation
  if (!username || !password || !confirmPassword || !withdrawPassword || !fullname) {
    showStatus('Vui lòng điền đầy đủ thông tin!', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showStatus('Mật khẩu không khớp!', 'error');
    return;
  }

  // Get URLs from checked checkboxes
  const checkedBoxes = document.querySelectorAll('.site-check:checked');
  const urls = Array.from(checkedBoxes).map(checkbox => checkbox.dataset.url);

  if (urls.length === 0) {
    showStatus('Vui lòng chọn ít nhất 1 trang!', 'error');
    return;
  }

  console.log('Selected sites:', urls);

  // No need to save accounts anymore

  // Show progress
  if (urls.length > 1) {
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('progressText').textContent = `0 / ${urls.length}`;
    document.getElementById('progressFill').style.width = '0%';
  }

  // Get auto-submit checkbox value
  const autoSubmit = document.getElementById('autoSubmitRegister').checked;
  console.log('🎯 Auto Submit:', autoSubmit);

  // Get API key (same as login)
  let apiKey = '';
  try {
    const apiKeyElement = document.getElementById('autoApiKey');
    if (apiKeyElement) {
      apiKey = apiKeyElement.value.trim();
    }
  } catch (e) {
    console.log('⚠️ Could not get API key');
  }
  console.log('🔑 API Key for register:', apiKey ? (apiKey.substring(0, 10) + '...') : 'NONE');

  // Send message to background script
  showStatus(`🚀 Đang đăng ký ${urls.length} trang...${autoSubmit ? ' (Tự động submit)' : ''}`, 'info');

  chrome.runtime.sendMessage(
    {
      action: 'startMultiAutoRegister',
      data: {
        urls,
        username,
        password,
        withdrawPassword,
        fullname,
        autoSubmit,
        apiKey
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('✅ Đã khởi động! Tool sẽ chạy ngầm...', 'success');
      }
    }
  );
});

// Listen for progress updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateProgress') {
    const { current, total } = request.data;
    document.getElementById('progressText').textContent = `${current} / ${total}`;
    document.getElementById('progressFill').style.width = `${(current / total) * 100}%`;

    if (current === total) {
      showStatus(`✅ Hoàn thành ${total} trang!`, 'success');
      setTimeout(() => {
        document.getElementById('progressSection').style.display = 'none';
      }, 3000);
    }
  }
});


// Tab switching
document.getElementById('registerTab').addEventListener('click', function () {
  // Switch active tab
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('registerTab').classList.add('active');

  // Switch content
  document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
  document.getElementById('registerContent').classList.add('active');
});

document.getElementById('loginTab').addEventListener('click', function () {
  // Switch active tab
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('loginTab').classList.add('active');

  // Switch content
  document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
  document.getElementById('loginContent').classList.add('active');
});

document.getElementById('withdrawTab').addEventListener('click', function () {
  // Switch active tab
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('withdrawTab').classList.add('active');

  // Switch content
  document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
  document.getElementById('withdrawContent').classList.add('active');
});

// Login tab - Select/Deselect all buttons
document.getElementById('selectAllLoginBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-login').forEach(checkbox => {
    checkbox.checked = true;
  });
});

document.getElementById('deselectAllLoginBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-login').forEach(checkbox => {
    checkbox.checked = false;
  });
});

// Withdraw tab - Select/Deselect all buttons
document.getElementById('selectAllWithdrawBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-withdraw').forEach(checkbox => {
    checkbox.checked = true;
  });
});

document.getElementById('deselectAllWithdrawBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-withdraw').forEach(checkbox => {
    checkbox.checked = false;
  });
});

// Login tab - Toggle password visibility
document.getElementById('toggleLoginPassword').addEventListener('click', function () {
  const passwordInput = document.getElementById('loginPassword');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});

// Login button (Đăng Nhập & Thêm Ngân Hàng) - REMOVED
// Use separate buttons: "🔐 Đăng Nhập" and "💳 Thêm Ngân Hàng" instead

function showLoginStatus(message, type = 'info') {
  const statusSection = document.getElementById('loginStatusSection');
  const statusMessage = document.getElementById('loginStatusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusSection.style.display = 'block';

  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 5000);
}

// Listen for login progress updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateLoginProgress') {
    const { current, total } = request.data;
    document.getElementById('loginProgressText').textContent = `${current} / ${total}`;
    document.getElementById('loginProgressFill').style.width = `${(current / total) * 100}%`;

    if (current === total) {
      showLoginStatus(`✅ Hoàn thành ${total} trang!`, 'success');
      setTimeout(() => {
        document.getElementById('loginProgressSection').style.display = 'none';
      }, 3000);
    }
  }
});


// Promo tab switching
document.getElementById('promoTab').addEventListener('click', function () {
  // Switch active tab
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('promoTab').classList.add('active');

  // Switch content
  document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
  document.getElementById('promoContent').classList.add('active');
});

// Update register and login tab clicks to handle promo tab
// Tab switching already handled above with querySelectorAll - no need for duplicate listeners

// Promo tab - Select/Deselect all buttons
document.getElementById('selectAllPromoBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-promo').forEach(checkbox => {
    checkbox.checked = true;
  });
});

document.getElementById('deselectAllPromoBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-promo').forEach(checkbox => {
    checkbox.checked = false;
  });
});

// Load saved API key (shared across all tabs)
chrome.storage.local.get(['captchaApiKey'], function (result) {
  if (result.captchaApiKey) {
    document.getElementById('autoApiKey').value = result.captchaApiKey;
  }
});

// Save API key when changed (from Auto tab)
document.getElementById('autoApiKey').addEventListener('change', function () {
  const apiKey = this.value.trim();
  chrome.storage.local.set({ captchaApiKey: apiKey }, function () {
    console.log('✅ API key saved and shared across all tabs');
  });
});

// Reset Captcha button
document.getElementById('resetCaptchaBtn').addEventListener('click', async function () {
  const btn = this;
  btn.disabled = true;
  btn.textContent = '⏳ Đang reset...';

  try {
    // Send message to content script to reset flag
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'resetCaptchaFlag' }, function (response) {
      if (chrome.runtime.lastError) {
        showPromoStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
      } else if (response && response.success) {
        showPromoStatus('✅ Đã reset! Có thể thử giải captcha lại.', 'success');
      } else {
        showPromoStatus('⚠️ Không thể reset. Reload trang để thử lại.', 'error');
      }

      btn.disabled = false;
      btn.textContent = '🔄 Reset Captcha';
    });
  } catch (error) {
    showPromoStatus('❌ Lỗi: ' + error.message, 'error');
    btn.disabled = false;
    btn.textContent = '🔄 Reset Captcha';
  }
});

// Check Balance button
document.getElementById('checkBalanceBtn').addEventListener('click', async function () {
  const apiKey = document.getElementById('autoApiKey').value.trim();
  const balanceDisplay = document.getElementById('balanceDisplay');
  const balanceAmount = document.getElementById('balanceAmount');
  const btn = this;

  if (!apiKey) {
    showPromoStatus('❌ Vui lòng nhập API Key trước!', 'error');
    return;
  }

  // Disable button
  btn.disabled = true;
  btn.textContent = '⏳ Đang kiểm tra...';
  balanceDisplay.style.display = 'none';

  try {
    // Call API to check balance
    const response = await fetch(`https://autocaptcha.pro/apiv3/balance?key=${apiKey}`);
    const data = await response.json();

    console.log('💰 Balance response:', data);

    if (data.success === true) {
      // Show balance
      balanceAmount.textContent = data.balance.toLocaleString('vi-VN');
      balanceDisplay.style.display = 'block';
      showPromoStatus(`✅ Số dư: ${data.balance.toLocaleString('vi-VN')} VNĐ`, 'success');
    } else {
      showPromoStatus(`❌ Lỗi: ${data.message || 'Không thể kiểm tra số dư'}`, 'error');
    }
  } catch (error) {
    console.error('❌ Check balance error:', error);
    showPromoStatus(`❌ Lỗi kết nối: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    btn.disabled = false;
    btn.textContent = '💰 Check Balance';
  }
});

// Check Promotion button
document.getElementById('promoBtn').addEventListener('click', async function () {
  const username = document.getElementById('promoUsername').value;
  const apiKey = document.getElementById('autoApiKey').value.trim();

  // Validation
  if (!username) {
    showPromoStatus('Vui lòng điền tên tài khoản!', 'error');
    return;
  }

  if (!apiKey) {
    showPromoStatus('Vui lòng nhập API Key để giải captcha tự động!', 'error');
    return;
  }

  // Get URLs from checked checkboxes
  const checkedBoxes = document.querySelectorAll('.site-check-promo:checked');
  const urls = Array.from(checkedBoxes).map(checkbox => checkbox.dataset.url);

  if (urls.length === 0) {
    showPromoStatus('Vui lòng chọn ít nhất 1 trang!', 'error');
    return;
  }

  console.log('Selected promo sites:', urls);

  // Clear previous results
  document.getElementById('promoResults').style.display = 'none';
  document.getElementById('promoResultsList').innerHTML = '';

  // Show progress
  if (urls.length > 1) {
    document.getElementById('promoProgressSection').style.display = 'block';
    document.getElementById('promoProgressText').textContent = `0 / ${urls.length}`;
    document.getElementById('promoProgressFill').style.width = '0%';
  }

  // Debug: Log API Key
  console.log('🔑 API Key being sent:', apiKey ? (apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5)) : 'EMPTY');
  console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);

  // Send message to background script
  showPromoStatus(`🎁 Đang check khuyến mãi ${urls.length} trang...\n\n⚠️ LƯU Ý: Tool sẽ tự động CHUYỂN TAB từng trang một để tránh bị Chrome throttle API captcha.\n\nVui lòng không đóng các tab cho đến khi hoàn tất!`, 'info');

  chrome.runtime.sendMessage(
    {
      action: 'startCheckPromotion',
      data: { urls, username, apiKey }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showPromoStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showPromoStatus('✅ Đã khởi động! Tool sẽ tự động chuyển tab...', 'success');
      }
    }
  );
});

function showPromoStatus(message, type = 'info') {
  const statusSection = document.getElementById('promoStatusSection');
  const statusMessage = document.getElementById('promoStatusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusSection.style.display = 'block';

  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 5000);
}

// Listen for promo results from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'promoResult') {
    const { site, promotions } = request.data;

    // Show results section
    document.getElementById('promoResults').style.display = 'block';

    // Add result to list
    const resultsList = document.getElementById('promoResultsList');
    const resultItem = document.createElement('div');
    resultItem.className = 'promo-item';

    if (promotions && promotions.length > 0) {
      resultItem.innerHTML = `
        <div class="promo-item-title">🎁 ${site}</div>
        <div class="promo-item-content">
          ${promotions.map(p => `• ${p}`).join('<br>')}
        </div>
      `;
    } else {
      resultItem.innerHTML = `
        <div class="promo-item-title">❌ ${site}</div>
        <div class="promo-item-content">Không tìm thấy khuyến mãi hoặc chưa đăng nhập</div>
      `;
    }

    resultsList.appendChild(resultItem);
  }
});


// Test withdraw form fill button - REMOVED (button doesn't exist in HTML)
// Commented out to prevent blocking other event listeners


// ===== NEW BUTTONS: Login Only & Add Bank Only =====

// Login Button - Đăng nhập vào các trang đã chọn
document.getElementById('loginOnlyBtn').addEventListener('click', async function () {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  // Validation
  if (!username || !password) {
    showLoginStatus('Vui lòng điền đầy đủ thông tin!', 'error');
    return;
  }

  // Get URLs
  const checkedBoxes = document.querySelectorAll('.site-check-login:checked');
  const urls = Array.from(checkedBoxes).map(checkbox => checkbox.dataset.url);

  if (urls.length === 0) {
    showLoginStatus('Vui lòng chọn ít nhất 1 trang!', 'error');
    return;
  }

  console.log('🔐 Login Only - Selected sites:', urls);

  // Show progress
  if (urls.length > 1) {
    document.getElementById('loginProgressSection').style.display = 'block';
    document.getElementById('loginProgressText').textContent = `0 / ${urls.length}`;
    document.getElementById('loginProgressFill').style.width = '0%';
  }

  showLoginStatus(`🔐 Đang đăng nhập ${urls.length} trang...`, 'info');

  // Get API key
  let apiKey = '';
  try {
    const apiKeyElement = document.getElementById('autoApiKey');
    if (apiKeyElement) {
      apiKey = apiKeyElement.value.trim();
    }
  } catch (e) {
    console.log('⚠️ Could not get API key');
  }

  // Send message WITHOUT withdrawInfo
  chrome.runtime.sendMessage(
    {
      action: 'startMultiAutoLogin',
      data: {
        urls,
        username,
        password,
        apiKey,
        withdrawInfo: null // NO withdraw info - just login
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showLoginStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showLoginStatus('✅ Đã khởi động! Chỉ đăng nhập, không thêm ngân hàng.', 'success');
      }
    }
  );
});

// Add Bank Button - Thêm ngân hàng vào các trang đã chọn (dùng khi đã login)
const addBankBtn = document.getElementById('addBankBtn');
console.log('🔍 addBankBtn element:', addBankBtn);

if (addBankBtn) {
  console.log('✅ addBankBtn found, attaching event listener...');
  addBankBtn.addEventListener('click', async function () {
    console.log('🔘 Button "Thêm Ngân Hàng" clicked!');

    // Get withdraw information
    const bankName = document.getElementById('bankName').value;
    const bankBranch = document.getElementById('bankBranch').value;
    const accountNumber = document.getElementById('accountNumber').value;

    // Validation - Only check bank info, NOT login info
    console.log('🔍 Validating bank info:', { bankName, bankBranch, accountNumber });

    if (!bankName) {
      showWithdrawStatus('⚠️ Vui lòng chọn ngân hàng!', 'error');
      return;
    }

    if (!bankBranch) {
      showWithdrawStatus('⚠️ Vui lòng điền chi nhánh ngân hàng!', 'error');
      return;
    }

    if (!accountNumber) {
      showWithdrawStatus('⚠️ Vui lòng điền số tài khoản!', 'error');
      return;
    }

    console.log('💳 Add Bank Only - Bank info:', { bankName, bankBranch, accountNumber });

    const withdrawInfo = {
      bankName,
      bankBranch,
      accountNumber
    };

    // Get checked withdraw sites
    const checkedSites = document.querySelectorAll('.site-check-withdraw:checked');

    if (checkedSites.length === 0) {
      showWithdrawStatus('⚠️ Vui lòng chọn ít nhất 1 trang!', 'error');
      return;
    }

    const urls = Array.from(checkedSites).map(cb => cb.dataset.url);
    console.log('🌐 Selected sites:', urls);

    showWithdrawStatus(`⏳ Đang mở ${urls.length} trang và thêm ngân hàng...`, 'info');

    // Show progress bar
    if (urls.length > 1) {
      document.getElementById('withdrawProgressSection').style.display = 'block';
      document.getElementById('withdrawProgressText').textContent = `0 / ${urls.length}`;
      document.getElementById('withdrawProgressFill').style.width = '0%';
    }

    // Send to background script to process (runs independently of popup)
    chrome.runtime.sendMessage(
      {
        action: 'addBankToMultipleSites',
        data: {
          urls,
          withdrawInfo
        }
      },
      (response) => {
        if (response && response.success) {
          console.log('✅ Background script started processing');
          showWithdrawStatus(`✅ Đã khởi động! Tool đang chạy ${urls.length} trang.\n\nBạn có thể đóng popup, tool vẫn tiếp tục chạy.`, 'success');
        } else {
          showWithdrawStatus('❌ Lỗi khởi động background script', 'error');
        }
      }
    );
  });
} else {
  console.error('❌ addBankBtn NOT FOUND! Check HTML for id="addBankBtn"');
}


// Show withdraw status message
function showWithdrawStatus(message, type = 'info') {
  const statusSection = document.getElementById('withdrawStatusSection');
  const statusMessage = document.getElementById('withdrawStatusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusSection.style.display = 'block';

  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 5000);
}


// ===== AUTO TAB - Chạy tự động tuần tự =====

// Tab switching for Auto tab
document.getElementById('autoTab').addEventListener('click', function () {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('autoTab').classList.add('active');
  document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
  document.getElementById('autoContent').classList.add('active');
});

// Load banks for auto tab
async function loadAutoBanks() {
  const bankSelect = document.getElementById('autoBankName');
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const data = await response.json();
    if (data.code === '00' && data.data) {
      bankSelect.innerHTML = '<option value="">Vui lòng chọn ngân hàng</option>';
      data.data.sort((a, b) => a.shortName.localeCompare(b.shortName)).forEach(bank => {
        const option = document.createElement('option');
        option.value = bank.shortName;
        option.textContent = `${bank.shortName} - ${bank.name}`;
        bankSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load banks:', error);
  }
}
loadAutoBanks();

// Select/Deselect all for auto tab
document.getElementById('selectAllAutoBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-auto').forEach(checkbox => {
    checkbox.checked = true;
  });
});

document.getElementById('deselectAllAutoBtn').addEventListener('click', function () {
  document.querySelectorAll('.site-check-auto').forEach(checkbox => {
    checkbox.checked = false;
  });
});

// Toggle password visibility for auto tab
document.getElementById('toggleAutoPassword').addEventListener('click', function () {
  const passwordInput = document.getElementById('autoPassword');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});

document.getElementById('toggleAutoWithdrawPassword').addEventListener('click', function () {
  const passwordInput = document.getElementById('autoWithdrawPassword');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  this.textContent = type === 'password' ? '👁️' : '🙈';
});

// Auto Run button - Chạy tuần tự: Register → Login → Add Bank
let autoRunInProgress = false; // Prevent duplicate runs

document.getElementById('autoRunBtn').addEventListener('click', async function () {
  // Prevent duplicate clicks
  if (autoRunInProgress) {
    console.log('⚠️ Auto run already in progress, ignoring click');
    showAutoStatus('⚠️ Tool đang chạy, vui lòng đợi...', 'error');
    return;
  }

  const apiKey = document.getElementById('autoApiKey').value.trim();
  const username = document.getElementById('autoUsername').value.trim();
  const password = document.getElementById('autoPassword').value.trim();
  const withdrawPassword = document.getElementById('autoWithdrawPassword').value.trim();
  const fullname = document.getElementById('autoFullname').value.trim();
  const bankName = document.getElementById('autoBankName').value;
  const bankBranch = document.getElementById('autoBankBranch').value.trim();
  const accountNumber = document.getElementById('autoAccountNumber').value.trim();

  // Validation
  if (!apiKey) {
    showAutoStatus('❌ Vui lòng nhập API Key!', 'error');
    return;
  }
  if (!username || !password || !withdrawPassword || !fullname) {
    showAutoStatus('❌ Vui lòng điền đầy đủ thông tin tài khoản!', 'error');
    return;
  }
  if (!bankName || !bankBranch || !accountNumber) {
    showAutoStatus('❌ Vui lòng điền đầy đủ thông tin ngân hàng!', 'error');
    return;
  }

  // Mark as in progress
  autoRunInProgress = true;
  this.disabled = true;
  this.textContent = '⏳ Đang chạy...';

  // Get checked sites
  const checkedBoxes = document.querySelectorAll('.site-check-auto:checked');
  console.log('🔍 Found checked boxes:', checkedBoxes.length);

  if (checkedBoxes.length === 0) {
    showAutoStatus('❌ Vui lòng chọn ít nhất 1 trang!', 'error');
    return;
  }

  const sites = Array.from(checkedBoxes).map((cb, index) => {
    console.log(`  [${index}] Checkbox:`, {
      registerUrl: cb.dataset.registerUrl,
      loginUrl: cb.dataset.loginUrl,
      promoUrl: cb.dataset.promoUrl,
      getAttribute_register: cb.getAttribute('data-register-url'),
      getAttribute_login: cb.getAttribute('data-login-url'),
      getAttribute_promo: cb.getAttribute('data-promo-url')
    });

    return {
      registerUrl: cb.getAttribute('data-register-url') || cb.dataset.registerUrl,
      loginUrl: cb.getAttribute('data-login-url') || cb.dataset.loginUrl,
      promoUrl: cb.getAttribute('data-promo-url') || cb.dataset.promoUrl
    };
  });

  console.log('🤖 Auto mode - Selected sites:', sites);
  console.log('📊 Total sites:', sites.length);
  console.log('📊 Sites JSON:', JSON.stringify(sites, null, 2));

  // Validate that we have unique sites
  const uniqueRegisterUrls = new Set(sites.map(s => s.registerUrl));
  if (uniqueRegisterUrls.size !== sites.length) {
    console.error('⚠️ WARNING: Duplicate sites detected!');
    console.error('Unique register URLs:', uniqueRegisterUrls.size);
    console.error('Total sites:', sites.length);
  }

  // Show progress
  document.getElementById('autoProgressSection').style.display = 'block';
  document.getElementById('autoProgressText').textContent = `0 / ${sites.length * 3}`; // 3 steps per site
  document.getElementById('autoProgressFill').style.width = '0%';

  showAutoStatus(`🚀 Bắt đầu chạy tự động ${sites.length} trang...\n\nBước 1: Đăng ký\nBước 2: Đăng nhập\nBước 3: Thêm ngân hàng\nBước 4: Check khuyến mãi`, 'info');

  // Send to background script
  chrome.runtime.sendMessage(
    {
      action: 'startAutoSequence',
      data: {
        sites,
        username,
        password,
        withdrawPassword,
        fullname,
        bankName,
        bankBranch,
        accountNumber,
        apiKey
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showAutoStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
        // Reset button
        autoRunInProgress = false;
        document.getElementById('autoRunBtn').disabled = false;
        document.getElementById('autoRunBtn').textContent = '🤖 Chạy Tự Động';
      } else {
        showAutoStatus('✅ Đã khởi động! Tool đang chạy tự động...', 'success');
        // Will reset when completed
        setTimeout(() => {
          autoRunInProgress = false;
          document.getElementById('autoRunBtn').disabled = false;
          document.getElementById('autoRunBtn').textContent = '🤖 Chạy Tự Động';
        }, 5000); // Reset after 5 seconds to allow re-run
      }
    }
  );
});

function showAutoStatus(message, type = 'info') {
  const statusSection = document.getElementById('autoStatusSection');
  const statusMessage = document.getElementById('autoStatusMessage');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusSection.style.display = 'block';

  setTimeout(() => {
    statusSection.style.display = 'none';
  }, 5000);
}

// Listen for auto progress updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateAutoProgress') {
    const { current, total, step } = request.data;
    document.getElementById('autoProgressText').textContent = `${current} / ${total} - ${step}`;
    document.getElementById('autoProgressFill').style.width = `${(current / total) * 100}%`;

    if (current === total) {
      showAutoStatus(`✅ Hoàn thành tất cả ${total / 4} trang!`, 'success');
      setTimeout(() => {
        document.getElementById('autoProgressSection').style.display = 'none';
      }, 3000);
    }
  }
});

// Listen for add bank completion
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addBankCompleted') {
    const { success, failed, total, failedSites } = request.data;

    if (failed > 0) {
      const failedList = failedSites.map(site => {
        const urlObj = new URL(site.url);
        return `• ${urlObj.hostname}: ${site.error}`;
      }).join('\n');

      showWithdrawStatus(
        `⚠️ Hoàn thành ${success}/${total} trang\n\n❌ Thất bại (${failed}):\n${failedList}`,
        'error'
      );
    } else {
      showWithdrawStatus(`✅ Hoàn thành tất cả ${total} trang!`, 'success');
    }
  }
});





// ============================================
// RANDOM USERNAME GENERATOR
// ============================================

// Danh sách từ độc đáo để tạo username
const uniqueWords = {
  prefixes: [
    'Sky', 'Moon', 'Star', 'Sun', 'Fire', 'Ice', 'Wind', 'Storm',
    'Dark', 'Light', 'Shadow', 'Ghost', 'Dragon', 'Phoenix', 'Tiger',
    'Wolf', 'Eagle', 'Hawk', 'Lion', 'Bear', 'Fox', 'Raven',
    'Cyber', 'Neon', 'Pixel', 'Quantum', 'Cosmic', 'Mystic', 'Epic',
    'Ultra', 'Mega', 'Super', 'Hyper', 'Alpha', 'Beta', 'Omega',
    'Ninja', 'Samurai', 'Knight', 'Warrior', 'Hunter', 'Ranger',
    'Ace', 'King', 'Queen', 'Prince', 'Duke', 'Lord', 'Master',
    'Void', 'Nova', 'Aura', 'Zen', 'Flux', 'Apex', 'Vortex',
    'Blaze', 'Frost', 'Thunder', 'Lightning', 'Crystal', 'Diamond',
    'Steel', 'Iron', 'Gold', 'Silver', 'Platinum', 'Titanium'
  ],
  suffixes: [
    'Blade', 'Strike', 'Storm', 'Fire', 'Frost', 'Bolt', 'Flash',
    'Fury', 'Rage', 'Soul', 'Spirit', 'Heart', 'Mind', 'Force',
    'Power', 'Might', 'Glory', 'Honor', 'Pride', 'Valor', 'Brave',
    'Swift', 'Quick', 'Sharp', 'Keen', 'Wise', 'True', 'Pure',
    'Wild', 'Free', 'Bold', 'Fierce', 'Strong', 'Tough', 'Hard',
    'Slayer', 'Hunter', 'Seeker', 'Walker', 'Rider', 'Runner',
    'Maker', 'Breaker', 'Keeper', 'Watcher', 'Guardian', 'Defender',
    'Master', 'Lord', 'King', 'Emperor', 'Legend', 'Hero', 'Champion',
    'Warrior', 'Fighter', 'Soldier', 'Knight', 'Paladin', 'Crusader'
  ],
  numbers: ['', '1', '2', '3', '7', '9', '88', '99', '777', '888', '999', 'X', 'Z']
};

// Hàm tạo username ngẫu nhiên
function generateRandomUsername() {
  const style = Math.random();

  if (style < 0.4) {
    // Style 1: Prefix + Suffix (40%)
    const prefix = uniqueWords.prefixes[Math.floor(Math.random() * uniqueWords.prefixes.length)];
    const suffix = uniqueWords.suffixes[Math.floor(Math.random() * uniqueWords.suffixes.length)];
    const number = uniqueWords.numbers[Math.floor(Math.random() * uniqueWords.numbers.length)];
    return prefix + suffix + number;
  } else if (style < 0.7) {
    // Style 2: Prefix + Number (30%)
    const prefix = uniqueWords.prefixes[Math.floor(Math.random() * uniqueWords.prefixes.length)];
    const number = Math.floor(Math.random() * 9999) + 100;
    return prefix + number;
  } else {
    // Style 3: Random letters + numbers (30%)
    const consonants = 'bcdfghjklmnpqrstvwxz';
    const vowels = 'aeiou';
    let username = '';

    // Tạo 3-4 cặp consonant-vowel
    const pairs = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < pairs; i++) {
      username += consonants[Math.floor(Math.random() * consonants.length)];
      username += vowels[Math.floor(Math.random() * vowels.length)];
    }

    // Thêm số ngẫu nhiên
    if (Math.random() > 0.5) {
      username += Math.floor(Math.random() * 999) + 1;
    }

    // Capitalize chữ cái đầu
    username = username.charAt(0).toUpperCase() + username.slice(1);

    return username;
  }
}

// Hàm kiểm tra username hợp lệ
function isValidUsername(username) {
  // 5-15 ký tự, bắt đầu bằng chữ cái, chỉ chứa chữ cái, số và gạch dưới
  const regex = /^[a-zA-Z][a-zA-Z0-9_]{4,14}$/;
  return regex.test(username);
}

// Hàm generate và fill username
function generateAndFillUsername(inputId) {
  let username = '';
  let attempts = 0;
  const maxAttempts = 10;

  // Thử generate cho đến khi có username hợp lệ
  while (attempts < maxAttempts) {
    username = generateRandomUsername();

    // Đảm bảo độ dài 5-15 ký tự
    if (username.length < 5) {
      username += Math.floor(Math.random() * 99) + 1;
    } else if (username.length > 15) {
      username = username.substring(0, 15);
    }

    if (isValidUsername(username)) {
      break;
    }

    attempts++;
  }

  // Fill vào input
  const input = document.getElementById(inputId);
  if (input) {
    input.value = username;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Animation effect
    input.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
    setTimeout(() => {
      input.style.background = '';
    }, 1000);
  }

  return username;
}

// Thêm nút random cho các input username
function addRandomButtonToUsername() {
  const usernameInputs = [
    { id: 'autoUsername', label: '🎲' },
    { id: 'username', label: '🎲' }
  ];

  usernameInputs.forEach(({ id, label }) => {
    const input = document.getElementById(id);
    if (!input) return;

    const inputGroup = input.closest('.input-group');
    if (!inputGroup) return;

    // Kiểm tra xem đã có nút chưa
    if (inputGroup.querySelector('.random-username-btn')) return;

    // Tạo nút random
    const randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.className = 'random-username-btn';
    randomBtn.innerHTML = label;
    randomBtn.title = 'Tạo username ngẫu nhiên';
    randomBtn.style.cssText = `
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 16px;
      margin-left: 8px;
      transition: all 0.3s;
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
    `;

    // Hover effect
    randomBtn.addEventListener('mouseenter', () => {
      randomBtn.style.transform = 'scale(1.1) rotate(180deg)';
      randomBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
    });

    randomBtn.addEventListener('mouseleave', () => {
      randomBtn.style.transform = 'scale(1) rotate(0deg)';
      randomBtn.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.3)';
    });

    // Click event
    randomBtn.addEventListener('click', () => {
      const username = generateAndFillUsername(id);
      console.log('✅ Generated username:', username);

      // Animation
      randomBtn.style.transform = 'scale(0.9) rotate(360deg)';
      setTimeout(() => {
        randomBtn.style.transform = 'scale(1) rotate(0deg)';
      }, 300);
    });

    // Thêm vào input group
    inputGroup.appendChild(randomBtn);
  });
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Đợi một chút để đảm bảo tất cả elements đã load
  setTimeout(() => {
    addRandomButtonToUsername();
  }, 500);
});

// Thêm nút random khi chuyển tab
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    setTimeout(() => {
      addRandomButtonToUsername();
    }, 100);
  });
});
