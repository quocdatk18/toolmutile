// Fetch danh sách ngân hàng từ VietQR API
async function loadVietQRBanks() {
    try {
        console.log('[popup] Fetching banks from VietQR API...');
        const response = await fetch('https://api.vietqr.io/v2/banks');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.code === '00' && data.data) {
            const bankList = data.data;
            const datalist = document.getElementById('vietQRBankList');

            // Clear existing options
            datalist.innerHTML = '';

            // Store bank data globally for later use
            window.vietQRBanks = bankList;

            // Add banks from VietQR API - display and store shortName (code)
            for (const bank of bankList) {
                const option = document.createElement('option');
                // Value: shortName (code) - e.g. "TCB (970415)"
                option.value = `${bank.shortName} (${bank.code})`;
                datalist.appendChild(option);
            }

            console.log('[popup] ✅ Loaded', bankList.length, 'banks from VietQR API');
        } else {
            console.error('[popup] ❌ VietQR API error:', data);
        }
    } catch (error) {
        console.error('[popup] ❌ Error fetching banks from VietQR:', error);
    }
}

// Tab navigation
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const page = button.getAttribute('data-page');
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(page).classList.add('active');
    });
});

// Map city click handlers
document.querySelectorAll('.map-city').forEach(city => {
    city.addEventListener('click', () => {
        const filter = city.getAttribute('data-filter');
        document.querySelectorAll('[id^="interface-group"]').forEach(group => {
            group.style.display = 'none';
        });
        document.getElementById('main-info-form').style.display = 'block';
        if (filter === 'type1') {
            document.getElementById('interface-group-1').style.display = 'block';
        } else if (filter === 'type2') {
            document.getElementById('interface-group-2').style.display = 'block';
        } else if (filter === 'type3') {
            document.getElementById('interface-group-3').style.display = 'block';
        } else if (filter === 'type4') {
            document.getElementById('interface-group-4').style.display = 'block';
        }
    });
});

// Check balance button handler
document.getElementById('checkBalanceBtn').addEventListener('click', async () => {
    const apiKey = document.getElementById('anticaptchaKey').value.trim();
    const statusEl = document.getElementById('balanceStatus');

    if (!apiKey) {
        statusEl.textContent = '❌ Vui lòng nhập API Key';
        statusEl.style.color = '#dc3545';
        return;
    }

    statusEl.textContent = '⏳ Đang kiểm tra...';
    statusEl.style.color = '#666';

    try {
        const response = await fetch(`https://autocaptcha.pro/apiv3/balance?key=${apiKey}`);
        const result = await response.json();

        if (result.success) {
            const balance = result.balance || 0;
            statusEl.textContent = `✅ Số dư: $${balance.toFixed(2)}`;
            statusEl.style.color = '#28a745';
        } else {
            statusEl.textContent = `❌ ${result.message || 'Lỗi kiểm tra số dư'}`;
            statusEl.style.color = '#dc3545';
        }
    } catch (e) {
        console.error('Error checking balance:', e);
        statusEl.textContent = '❌ Lỗi kết nối';
        statusEl.style.color = '#dc3545';
    }
});

// Start button handler
document.getElementById('startBtn').addEventListener('click', async () => {
    const username = document.getElementById('f_username').value.trim();
    const password = document.getElementById('f_password').value.trim();
    const fullname = document.getElementById('f_fullname').value.trim();
    const phone = document.getElementById('f_phone').value.trim();
    const gmail = document.getElementById('f_gmail').value.trim();
    const bankNameInput = document.getElementById('f_bankName').value.trim();
    const accountNumber = document.getElementById('f_accountNumber').value.trim();
    const branch = document.getElementById('f_branch').value.trim();
    const withdrawPass = document.getElementById('f_withdrawPass').value.trim();
    const anticaptchaKey = document.getElementById('anticaptchaKey')?.value.trim() || '';

    // bankNameInput is already shortName (code) from datalist
    let bankName = bankNameInput;
    console.log('[popup] Using bank:', bankName);

    const selectedSites = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const site = checkbox.getAttribute('data-site');
        if (site) selectedSites.push(site);
    });

    if (!username || !password || !fullname || !phone || !gmail) {
        alert('Vui lòng điền đầy đủ thông tin cơ bản');
        return;
    }

    if (selectedSites.length === 0) {
        alert('Vui lòng chọn ít nhất một trang web');
        return;
    }

    const payload = {
        username,
        password,
        fullname,
        phone,
        gmail,
        bankName,
        accountNumber,
        branch,
        withdrawPass,
        anticaptchaKey,
        sites: selectedSites,
        timestamp: Date.now()
    };

    const statusEl = document.getElementById('status');
    statusEl.textContent = `⏳ Đang mở ${selectedSites.length} trang web...`;

    chrome.storage.local.set({ lastRunPayload: payload }, () => {
        chrome.runtime.sendMessage({
            type: 'RUN_BATCH_OPEN',
            sites: selectedSites
        }, response => {
            if (response && response.ok) {
                statusEl.textContent = `✅ Đã mở ${selectedSites.length} trang web. Đang tự động điền...`;
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                statusEl.textContent = `❌ Lỗi khi mở trang web`;
            }
        });
    });
});

// Promo button handler
document.getElementById('startPromoBtn').addEventListener('click', async () => {
    const username = document.getElementById('promo_username').value.trim();
    const promoType = document.getElementById('promo_type').value;

    const selectedSites = [];
    document.querySelectorAll('.promo-sites input[type="checkbox"]:checked').forEach(checkbox => {
        const site = checkbox.getAttribute('data-site');
        if (site) selectedSites.push(site);
    });

    if (!username) {
        alert('Vui lòng nhập tên đăng nhập');
        return;
    }

    if (selectedSites.length === 0) {
        alert('Vui lòng chọn ít nhất một trang web');
        return;
    }

    const payload = {
        username,
        promoType,
        sites: selectedSites,
        timestamp: Date.now()
    };

    const statusEl = document.getElementById('promoStatus');
    statusEl.textContent = `⏳ Đang mở ${selectedSites.length} trang web...`;

    // Thêm site info vào payload
    const payloadWithSites = {
        ...payload,
        selectedSites: selectedSites
    };

    chrome.storage.local.set({ lastPromoPayload: payloadWithSites }, () => {
        chrome.runtime.sendMessage({
            type: 'RUN_PROMO_OPEN',
            sites: selectedSites,
            payload: payloadWithSites
        }, response => {
            if (response && response.ok) {
                statusEl.textContent = `✅ Đã mở ${selectedSites.length} trang web`;
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                statusEl.textContent = `❌ Lỗi khi mở trang web`;
            }
        });
    });
});

// Load saved data on popup open
window.addEventListener('load', () => {
    // Load VietQR banks
    loadVietQRBanks();

    chrome.storage.local.get(['lastRunPayload'], (result) => {
        if (result.lastRunPayload) {
            const data = result.lastRunPayload;
            document.getElementById('f_username').value = data.username || '';
            document.getElementById('f_password').value = data.password || '';
            document.getElementById('f_fullname').value = data.fullname || '';
            document.getElementById('f_phone').value = data.phone || '';
            document.getElementById('f_gmail').value = data.gmail || '';
            document.getElementById('f_bankName').value = data.bankName || '';
            document.getElementById('f_accountNumber').value = data.accountNumber || '';
            document.getElementById('f_branch').value = data.branch || '';
            document.getElementById('f_withdrawPass').value = data.withdrawPass || '';

            const anticaptchaKeyEl = document.getElementById('anticaptchaKey');
            if (anticaptchaKeyEl) {
                anticaptchaKeyEl.value = data.anticaptchaKey || '';
            }
        }
    });
});
