// Extension loaded
console.log('Auto Register Tool loaded - Unified Version');

// ============================================
// AUTO TAB - RUN ALL STEPS SEQUENTIALLY
// ============================================

// Load bank list for auto tab
async function loadAutoBankList() {
    try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();

        if (data.code === '00' && data.data) {
            const bankSelect = document.getElementById('autoBankName');
            bankSelect.innerHTML = '<option value="">-- Chọn ngân hàng --</option>';

            data.data.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.shortName;
                option.textContent = `${bank.shortName} - ${bank.name}`;
                bankSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load bank list for auto tab:', error);
    }
}

loadAutoBankList();

// Toggle auto password visibility
document.getElementById('toggleAutoPassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('autoPassword');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈';
});

// Load saved API key
chrome.storage.local.get(['phoneVerifyApiKey'], function (result) {
    if (result.phoneVerifyApiKey) {
        document.getElementById('autoApiKey').value = result.phoneVerifyApiKey;
    }
});

// Auto Start button
document.getElementById('autoStartBtn').addEventListener('click', async function () {
    const username = document.getElementById('autoUsername').value.trim();
    const password = document.getElementById('autoPassword').value.trim();
    const fullname = document.getElementById('autoFullname').value.trim();
    const withdrawPassword = document.getElementById('autoWithdrawPassword').value.trim();
    const bankAccount = document.getElementById('autoBankAccount').value.trim();
    const bankName = document.getElementById('autoBankName').value;
    const apiKey = document.getElementById('autoApiKey').value.trim();

    // Validation
    if (!username || !password || !fullname) {
        showAutoStatus('❌ Vui lòng điền đầy đủ thông tin tài khoản!', 'error');
        return;
    }

    if (!withdrawPassword || withdrawPassword.length !== 6 || !/^\d{6}$/.test(withdrawPassword)) {
        showAutoStatus('❌ Mật khẩu rút tiền phải là 6 số!', 'error');
        return;
    }

    if (!bankAccount || bankAccount.length < 8) {
        showAutoStatus('❌ Vui lòng nhập số tài khoản ngân hàng!', 'error');
        return;
    }

    if (!bankName) {
        showAutoStatus('❌ Vui lòng chọn ngân hàng!', 'error');
        return;
    }

    if (!apiKey) {
        showAutoStatus('❌ Vui lòng nhập API Key SIM!', 'error');
        return;
    }

    // Get selected sites
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');
    if (checkboxes.length === 0) {
        showAutoStatus('❌ Vui lòng chọn ít nhất 1 trang!', 'error');
        return;
    }

    const registerUrls = Array.from(checkboxes).map(cb => cb.getAttribute('data-register-url')).filter(url => url);
    const promoUrls = Array.from(checkboxes).map(cb => cb.getAttribute('data-promo-url')).filter(url => url);
    const selectedCount = checkboxes.length;

    // Save credentials
    chrome.storage.local.set({
        lastUsername: username,
        lastPassword: password,
        phoneVerifyApiKey: apiKey
    });

    // Disable button
    const btn = document.getElementById('autoStartBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang chạy...';

    // Show progress
    document.getElementById('autoProgressSection').style.display = 'block';
    document.getElementById('autoProgressText').textContent = `0 / ${selectedCount}`;
    document.getElementById('autoProgressFill').style.width = '0%';

    showAutoStatus('🚀 Bắt đầu quy trình tự động...', 'info');

    // Send message to background
    chrome.runtime.sendMessage(
        {
            action: 'startAutoSequence',
            data: {
                registerUrls,
                promoUrls,
                selectedCount,
                username,
                password,
                fullname,
                withdrawPassword,
                bankAccount,
                bankName,
                apiKey
            }
        },
        (response) => {
            if (chrome.runtime.lastError) {
                showAutoStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
                btn.disabled = false;
                btn.textContent = '🚀 BẮT ĐẦU TỰ ĐỘNG';
            } else {
                showAutoStatus('✅ Đã khởi động! Tool sẽ chạy tự động...', 'success');
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

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusSection.style.display = 'none';
        }, 5000);
    }
}

// Auto Tab switching
document.getElementById('autoTab').addEventListener('click', function () {
    document.getElementById('autoTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('autoForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Tự Động';
    document.querySelector('.url-section').style.display = 'block';
});

// ============================================
// PHONE VERIFICATION TAB
// ============================================

// Load saved API key for phone verification
chrome.storage.local.get(['phoneVerifyApiKey'], function (result) {
    if (result.phoneVerifyApiKey) {
        document.getElementById('phoneVerifyApiKey').value = result.phoneVerifyApiKey;
        document.getElementById('phoneBalanceSection').style.display = 'block';
        checkPhoneBalance();
    }
});

// Save API key when user types
document.getElementById('phoneVerifyApiKey').addEventListener('input', function () {
    const apiKey = this.value.trim();
    if (apiKey) {
        chrome.storage.local.set({ phoneVerifyApiKey: apiKey });
        document.getElementById('phoneBalanceSection').style.display = 'block';
    } else {
        document.getElementById('phoneBalanceSection').style.display = 'none';
    }
});

// Check balance for phone verification
async function checkPhoneBalance() {
    const apiKey = document.getElementById('phoneVerifyApiKey').value.trim();

    if (!apiKey) {
        alert('❌ Vui lòng nhập API key trước!');
        return;
    }

    const balanceAmount = document.getElementById('phoneBalanceAmount');
    const checkBtn = document.getElementById('checkPhoneBalanceBtn');

    balanceAmount.textContent = '⏳ Đang kiểm tra...';
    balanceAmount.style.color = '#666';
    checkBtn.disabled = true;
    checkBtn.textContent = '⏳';

    try {
        const response = await fetch(`https://apisim.codesim.net/yourself/information-by-api-key?api_key=${apiKey}`);
        const data = await response.json();

        if (data.status === 200 && data.data) {
            const balance = data.data.balance;
            balanceAmount.textContent = `${balance.toLocaleString('vi-VN')} VNĐ`;
            balanceAmount.style.color = balance > 0 ? '#00aa00' : '#ff0000';
        } else {
            balanceAmount.textContent = '❌ Lỗi';
            balanceAmount.style.color = '#ff0000';
            alert('❌ API key không hợp lệ!');
        }
    } catch (error) {
        balanceAmount.textContent = '❌ Lỗi';
        balanceAmount.style.color = '#ff0000';
        alert('❌ Lỗi kết nối!');
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '🔄 Kiểm tra';
    }
}

document.getElementById('checkPhoneBalanceBtn').addEventListener('click', checkPhoneBalance);

// Select/Deselect all SMS checkboxes (removed - using main checkboxes now)

// Fetch bank list from VietQR API
async function loadBankList() {
    try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();

        if (data.code === '00' && data.data) {
            const bankSelect = document.getElementById('bankName');
            bankSelect.innerHTML = '<option value="">-- Chọn ngân hàng --</option>';

            data.data.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.shortName;
                option.textContent = `${bank.shortName} - ${bank.name}`;
                option.setAttribute('data-code', bank.code);
                option.setAttribute('data-fullname', bank.name);
                bankSelect.appendChild(option);
            });

            console.log(`Loaded ${data.data.length} banks from VietQR`);
        }
    } catch (error) {
        console.error('Failed to load bank list:', error);
        const bankSelect = document.getElementById('bankName');
        bankSelect.innerHTML = '<option value="">❌ Không tải được danh sách ngân hàng</option>';
    }
}

loadBankList();

// Helper function: Get URLs based on active tab
function getUrlsFromCheckboxes() {
    const activeTab = document.querySelector('.tab.active').id;
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');

    let urlAttr;
    if (activeTab === 'registerTab') {
        urlAttr = 'data-register-url';
    } else if (activeTab === 'loginTab') {
        urlAttr = 'data-login-url';
    } else if (activeTab === 'promotionTab') {
        urlAttr = 'data-promo-url';
    }

    const urls = Array.from(checkboxes).map(cb => cb.getAttribute(urlAttr)).filter(url => url);
    console.log(`Active tab: ${activeTab}, URLs:`, urls);

    return urls;
}

// Select/Deselect all buttons
document.getElementById('selectAllBtn').addEventListener('click', function () {
    document.querySelectorAll('.site-check-auto').forEach(checkbox => {
        checkbox.checked = true;
    });
});

document.getElementById('deselectAllBtn').addEventListener('click', function () {
    document.querySelectorAll('.site-check-auto').forEach(checkbox => {
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

// Password strength indicator
document.getElementById('password').addEventListener('input', function () {
    const password = this.value;
    const bars = document.querySelectorAll('.bar');
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;

    bars.forEach((bar, index) => {
        if (index < strength) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
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

// Promotion feature removed - will be reimplemented later

// Auto Register button
document.getElementById('registerBtn').addEventListener('click', async function () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const fullname = document.getElementById('fullname').value;
    const autoSubmit = document.getElementById('autoSubmit').checked;

    // Validation
    if (!username || !password || !confirmPassword || !fullname) {
        showStatus('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showStatus('Mật khẩu không khớp!', 'error');
        return;
    }

    // Save username and password to storage for later use (login)
    chrome.storage.local.set({
        lastUsername: username,
        lastPassword: password
    });

    const urls = getUrlsFromCheckboxes();

    if (urls.length === 0) {
        showStatus('Vui lòng chọn ít nhất 1 trang!', 'error');
        return;
    }

    console.log('Selected sites:', urls);

    // Show progress
    if (urls.length > 1) {
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('progressText').textContent = `0 / ${urls.length}`;
        document.getElementById('progressFill').style.width = '0%';
    }

    showStatus(`🚀 Đang đăng ký ${urls.length} trang...`, 'info');

    chrome.runtime.sendMessage(
        {
            action: 'startMultiAutoRegister',
            data: {
                urls,
                username,
                password,
                fullname,
                autoSubmit
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

// Go to Withdraw button
document.getElementById('goToWithdrawBtn').addEventListener('click', async function () {
    const withdrawPassword = document.getElementById('withdrawPassword').value;
    const bankAccount = document.getElementById('bankAccount').value;
    const bankName = document.getElementById('bankName').value;

    if (!withdrawPassword || withdrawPassword.length !== 6 || !/^\d{6}$/.test(withdrawPassword)) {
        showWithdrawStatus('❌ Vui lòng nhập mật khẩu rút tiền (6 số)!', 'error');
        return;
    }

    if (!bankAccount || bankAccount.length < 8) {
        showWithdrawStatus('❌ Vui lòng nhập số tài khoản ngân hàng!', 'error');
        return;
    }

    if (!bankName) {
        showWithdrawStatus('❌ Vui lòng chọn ngân hàng!', 'error');
        return;
    }

    // For withdraw, we don't need URLs, just count selected checkboxes
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');
    const selectedCount = checkboxes.length;

    if (selectedCount === 0) {
        showWithdrawStatus('❌ Vui lòng chọn ít nhất 1 trang!', 'error');
        return;
    }

    console.log('Selected withdraw sites:', selectedCount);

    // Show progress
    if (selectedCount > 1) {
        document.getElementById('withdrawProgressSection').style.display = 'block';
        document.getElementById('withdrawProgressText').textContent = `0 / ${selectedCount}`;
        document.getElementById('withdrawProgressFill').style.width = '0%';
    }

    showWithdrawStatus(`🚀 Đang thiết lập ${selectedCount} trang...`, 'info');

    chrome.runtime.sendMessage(
        {
            action: 'startMultiWithdraw',
            data: {
                selectedCount,
                withdrawPassword,
                bankAccount,
                bankName
            }
        },
        (response) => {
            if (chrome.runtime.lastError) {
                showWithdrawStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
            } else {
                showWithdrawStatus('✅ Đã khởi động! Tool sẽ chạy ngầm...', 'success');
            }
        }
    );
});

// Check promotion results
document.getElementById('checkResultsBtn').addEventListener('click', function () {
    chrome.storage.local.get(['promotionResults'], function (result) {
        const results = result.promotionResults || [];

        if (results.length === 0) {
            alert('📊 Chưa có kết quả nào!\n\nHãy chạy tool nhận khuyến mãi trước.');
            return;
        }

        // Build result message
        let message = '📊 KẾT QUẢ NHẬN KHUYẾN MÃI\n';
        message += '═'.repeat(40) + '\n\n';

        results.slice(-10).reverse().forEach((item, index) => {
            const time = new Date(item.timestamp).toLocaleString('vi-VN');
            const site = item.site.replace('www.', '').split('.')[0].toUpperCase();
            const username = item.username || 'Unknown';
            const result = item.result.substring(0, 60);
            const status = result.includes('IP') || result.includes('đã được thu thập') ? '❌' : '✅';

            message += `${status} ${site}\n`;
            message += `👤 TK: ${username}\n`;
            message += `⏰ ${time}\n`;
            message += `📝 ${result}...\n`;
            message += '─'.repeat(40) + '\n';
        });

        alert(message);
    });
});

// Verify Phone button - multi-tab verification (using main checkboxes)
document.getElementById('verifyPhoneBtn').addEventListener('click', async function () {
    const apiKey = document.getElementById('phoneVerifyApiKey').value.trim();

    if (!apiKey) {
        showPhoneVerifyStatus('❌ Vui lòng nhập API key!', 'error');
        return;
    }

    // For phone verify, we don't need URLs, just count selected checkboxes
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');
    const selectedCount = checkboxes.length;

    if (selectedCount === 0) {
        showPhoneVerifyStatus('❌ Vui lòng chọn ít nhất 1 trang ở phần "Chọn Trang" phía trên!', 'error');
        return;
    }

    console.log('Starting multi phone verification:', selectedCount);

    // Show progress
    if (selectedCount > 1) {
        document.getElementById('phoneVerifyProgressSection').style.display = 'block';
        document.getElementById('phoneVerifyProgressText').textContent = `0 / ${selectedCount}`;
        document.getElementById('phoneVerifyProgressFill').style.width = '0%';
    }

    showPhoneVerifyStatus(`🚀 Đang xác thực ${selectedCount} trang...`, 'info');

    chrome.runtime.sendMessage(
        {
            action: 'startMultiPhoneVerify',
            data: { selectedCount, apiKey }
        },
        (response) => {
            if (chrome.runtime.lastError) {
                showPhoneVerifyStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
            } else {
                showPhoneVerifyStatus('✅ Đã khởi động! Tool sẽ chạy ngầm...', 'success');
            }
        }
    );
});

function showPhoneVerifyStatus(message, type = 'info') {
    const statusSection = document.getElementById('phoneVerifyStatusSection');
    const statusMessage = document.getElementById('phoneVerifyStatusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusSection.style.display = 'block';

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusSection.style.display = 'none';
        }, 5000);
    }
}

// Claim Promotion - WITHOUT phone verification (user must verify first)
document.getElementById('claimPromotionBtn').addEventListener('click', async function () {
    const urls = getUrlsFromCheckboxes();

    if (urls.length === 0) {
        alert('❌ Vui lòng chọn ít nhất 1 trang!');
        return;
    }

    const confirmed = confirm(
        '⚠️ LƯU Ý:\n\n' +
        'Tool này CHỈ nhận khuyến mãi cho tài khoản ĐÃ XÁC THỰC SĐT.\n\n' +
        'Nếu chưa xác thực, vui lòng:\n' +
        '1. Dùng tab "Xác Thực SĐT" trước\n' +
        '2. Sau đó mới chạy tool này\n\n' +
        'Tiếp tục?'
    );

    if (!confirmed) return;

    console.log('Starting promotion claim (no phone verify):', urls);

    // Show progress
    if (urls.length > 1) {
        document.getElementById('promotionProgressSection').style.display = 'block';
        document.getElementById('promotionProgressText').textContent = `0 / ${urls.length}`;
        document.getElementById('promotionProgressFill').style.width = '0%';
    }

    chrome.runtime.sendMessage(
        {
            action: 'startMultiPromotion',
            data: { urls }
        },
        (response) => {
            if (chrome.runtime.lastError) {
                alert('❌ Lỗi: ' + chrome.runtime.lastError.message);
            } else {
                alert('✅ Đã khởi động! Tool sẽ tự động nhận khuyến mãi...');
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

    if (request.action === 'updateWithdrawProgress') {
        const { current, total, skipped } = request.data;
        const skippedText = skipped > 0 ? ` (⏭️ ${skipped} đã có bank)` : '';
        document.getElementById('withdrawProgressText').textContent = `${current} / ${total}${skippedText}`;
        document.getElementById('withdrawProgressFill').style.width = `${(current / total) * 100}%`;

        if (current === total) {
            const completedCount = total - (skipped || 0);
            let message = `✅ Hoàn thành ${total} trang!`;
            if (skipped > 0) {
                message = `✅ Hoàn thành: ${completedCount} trang\n⏭️ Đã có bank: ${skipped} trang`;
            }
            showWithdrawStatus(message, 'success');
            setTimeout(() => {
                document.getElementById('withdrawProgressSection').style.display = 'none';
            }, 5000);
        }
    }

    if (request.action === 'updatePromotionProgress') {
        const { current, total } = request.data;
        document.getElementById('promotionProgressText').textContent = `${current} / ${total}`;
        document.getElementById('promotionProgressFill').style.width = `${(current / total) * 100}%`;

        if (current === total) {
            alert(`✅ Hoàn thành ${total} trang khuyến mãi!`);
            setTimeout(() => {
                document.getElementById('promotionProgressSection').style.display = 'none';
            }, 3000);
        }
    }

    if (request.action === 'updatePhoneVerifyProgress') {
        const { current, total } = request.data;
        document.getElementById('phoneVerifyProgressText').textContent = `${current} / ${total}`;
        document.getElementById('phoneVerifyProgressFill').style.width = `${(current / total) * 100}%`;

        if (current === total) {
            showPhoneVerifyStatus(`✅ Hoàn thành ${total} trang!`, 'success');
            setTimeout(() => {
                document.getElementById('phoneVerifyProgressSection').style.display = 'none';
            }, 3000);
        }
    }

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

    if (request.action === 'updateAutoProgress') {
        const { step, stepName, current, total } = request.data;
        document.getElementById('autoCurrentStep').textContent = `Bước ${step}/4: ${stepName}`;
        document.getElementById('autoProgressText').textContent = `${current} / ${total}`;
        document.getElementById('autoProgressFill').style.width = `${(current / total) * 100}%`;
    }

    if (request.action === 'autoCompleteFinished') {
        const { success, message } = request.data;
        if (success) {
            showAutoStatus(`🎉 ${message}!`, 'success');
        } else {
            showAutoStatus(`❌ ${message}`, 'error');
        }

        document.getElementById('autoStartBtn').disabled = false;
        document.getElementById('autoStartBtn').textContent = '🚀 BẮT ĐẦU TỰ ĐỘNG';
    }
});

// Tab switching
document.getElementById('registerTab').addEventListener('click', function () {
    document.getElementById('autoTab').classList.remove('active');
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('autoForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Đăng Ký';
});

document.getElementById('loginTab').addEventListener('click', function () {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Đăng Nhập';

    // Load and display saved credentials
    chrome.storage.local.get(['lastUsername', 'lastPassword'], function (result) {
        if (result.lastUsername && result.lastPassword) {
            document.getElementById('savedCredentials').style.display = 'block';
            document.getElementById('noCredentialsWarning').style.display = 'none';
            document.getElementById('savedUsername').textContent = result.lastUsername;
            document.getElementById('loginBtn').disabled = false;
        } else {
            document.getElementById('savedCredentials').style.display = 'none';
            document.getElementById('noCredentialsWarning').style.display = 'block';
            document.getElementById('loginBtn').disabled = true;
        }
    });
});

document.getElementById('withdrawTab').addEventListener('click', function () {
    document.getElementById('withdrawTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('withdrawForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Rút Tiền';
});

document.getElementById('phoneVerifyTab').addEventListener('click', function () {
    document.getElementById('phoneVerifyTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('phoneVerifyForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Xác Thực';
    document.querySelector('.url-section').style.display = 'block';
});

document.getElementById('promotionTab').addEventListener('click', function () {
    document.getElementById('promotionTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');

    document.getElementById('promotionForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Khuyến Mãi';
    document.querySelector('.url-section').style.display = 'block';
});

// ============================================
// LOGIN TAB
// ============================================

// Load saved credentials when popup opens
chrome.storage.local.get(['lastUsername', 'lastPassword'], function (result) {
    if (result.lastUsername) {
        document.getElementById('loginUsername').value = result.lastUsername;
    }
    if (result.lastPassword) {
        document.getElementById('loginPassword').value = result.lastPassword;
    }
});

// Toggle login password visibility
document.getElementById('toggleLoginPassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('loginPassword');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈';
});

// Login Tab switching
document.getElementById('loginTab').addEventListener('click', function () {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('withdrawTab').classList.remove('active');
    document.getElementById('phoneVerifyTab').classList.remove('active');
    document.getElementById('promotionTab').classList.remove('active');

    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('withdrawForm').style.display = 'none';
    document.getElementById('phoneVerifyForm').style.display = 'none';
    document.getElementById('promotionForm').style.display = 'none';

    document.getElementById('sectionTitle').textContent = '🔗 Chọn Trang Đăng Nhập';
    document.querySelector('.url-section').style.display = 'block';

    // Reload credentials
    chrome.storage.local.get(['lastUsername', 'lastPassword'], function (result) {
        if (result.lastUsername) {
            document.getElementById('loginUsername').value = result.lastUsername;
        }
        if (result.lastPassword) {
            document.getElementById('loginPassword').value = result.lastPassword;
        }
    });
});

// Helper function for login status
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

// Login button handler
document.getElementById('loginBtn').addEventListener('click', async function () {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Validation
    if (!username || !password) {
        showLoginStatus('❌ Chưa có thông tin đăng nhập! Hãy đăng ký tài khoản trước.', 'error');
        return;
    }

    // Get URLs from checkboxes (data-login-url)
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');
    const urls = Array.from(checkboxes).map(cb => cb.getAttribute('data-login-url')).filter(url => url);

    if (urls.length === 0) {
        showLoginStatus('❌ Vui lòng chọn ít nhất 1 trang!', 'error');
        return;
    }

    console.log('Selected login sites:', urls);

    // Show progress
    if (urls.length > 1) {
        document.getElementById('loginProgressSection').style.display = 'block';
        document.getElementById('loginProgressText').textContent = `0 / ${urls.length}`;
        document.getElementById('loginProgressFill').style.width = '0%';
    }

    showLoginStatus(`🚀 Đang đăng nhập ${urls.length} trang...`, 'info');

    chrome.runtime.sendMessage(
        {
            action: 'startMultiLogin',
            data: {
                urls,
                username,
                password
            }
        },
        (response) => {
            if (chrome.runtime.lastError) {
                showLoginStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
            } else {
                showLoginStatus('✅ Đã khởi động! Tool sẽ chạy ngầm...', 'success');
            }
        }
    );
});

// Listen for login progress updates
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

// Update getUrlsFromCheckboxes to support login
const originalGetUrlsFromCheckboxes = getUrlsFromCheckboxes;
function getUrlsFromCheckboxes() {
    const activeTab = document.querySelector('.tab.active').id;
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');

    let urlAttr;
    if (activeTab === 'registerTab') {
        urlAttr = 'data-register-url';
    } else if (activeTab === 'loginTab') {
        urlAttr = 'data-login-url';
    } else if (activeTab === 'withdrawTab') {
        urlAttr = 'data-withdraw-url';
    } else if (activeTab === 'promotionTab') {
        urlAttr = 'data-promo-url';
    }

    const urls = Array.from(checkboxes).map(cb => cb.getAttribute(urlAttr)).filter(url => url);
    console.log(`Active tab: ${activeTab}, URLs:`, urls);

    return urls;
}

// Login button handler
document.getElementById('loginBtn').addEventListener('click', async function () {
    // Get saved credentials
    chrome.storage.local.get(['lastUsername', 'lastPassword'], function (result) {
        const username = result.lastUsername;
        const password = result.lastPassword;

        if (!username || !password) {
            showLoginStatus('❌ Chưa có thông tin đăng nhập! Hãy đăng ký trước.', 'error');
            return;
        }

        const urls = getUrlsFromCheckboxes();

        if (urls.length === 0) {
            showLoginStatus('❌ Vui lòng chọn ít nhất 1 trang!', 'error');
            return;
        }

        console.log('Starting auto login:', urls);

        // Show progress
        if (urls.length > 1) {
            document.getElementById('loginProgressSection').style.display = 'block';
            document.getElementById('loginProgressText').textContent = `0 / ${urls.length}`;
            document.getElementById('loginProgressFill').style.width = '0%';
        }

        showLoginStatus(`🚀 Đang đăng nhập ${urls.length} trang...`, 'info');

        chrome.runtime.sendMessage(
            {
                action: 'startMultiLogin',
                data: {
                    urls,
                    username,
                    password
                }
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    showLoginStatus('❌ Lỗi: ' + chrome.runtime.lastError.message, 'error');
                } else {
                    showLoginStatus('✅ Đã khởi động! Tool sẽ chạy ngầm...', 'success');
                }
            }
        );
    });
});

function showLoginStatus(message, type = 'info') {
    const statusSection = document.getElementById('loginStatusSection');
    const statusMessage = document.getElementById('loginStatusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusSection.style.display = 'block';

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusSection.style.display = 'none';
        }, 5000);
    }
}

// Update getUrlsFromCheckboxes to support login
function getUrlsFromCheckboxes() {
    const activeTab = document.querySelector('.tab.active').id;
    const checkboxes = document.querySelectorAll('.site-check-auto:checked');

    let urlAttr;
    if (activeTab === 'registerTab') {
        urlAttr = 'data-register-url';
    } else if (activeTab === 'loginTab') {
        urlAttr = 'data-login-url';
    } else if (activeTab === 'withdrawTab') {
        urlAttr = 'data-withdraw-url';
    } else if (activeTab === 'promotionTab') {
        urlAttr = 'data-promo-url';
    }

    const urls = Array.from(checkboxes).map(cb => cb.getAttribute(urlAttr)).filter(url => url);
    console.log(`Active tab: ${activeTab}, URLs:`, urls);

    return urls;
}

// Listen for login progress updates (already handled in main listener above)
