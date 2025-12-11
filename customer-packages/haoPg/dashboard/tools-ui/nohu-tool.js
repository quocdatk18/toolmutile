/**
 * NOHU Auto Tool - JavaScript
 */

// Initialize tool when loaded
window.initToolUI = function (tool) {
    console.log('🎰 Initializing NOHU Tool UI...', tool);

    // Load banks
    loadBanksForTool();

    console.log('✅ NOHU Tool initialized');
};

// ============================================
// TAB SWITCHING
// ============================================

function switchToolTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tool-tab-content').forEach(c => c.classList.remove('active'));

    // Add active to clicked tab
    document.querySelector(`.tool-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tool-tab-${tabName}`).classList.add('active');
}

// ============================================
// SITE SELECTION
// ============================================

function selectAllSites() {
    document.querySelectorAll('.site-check').forEach(cb => cb.checked = true);
}

function deselectAllSites() {
    document.querySelectorAll('.site-check').forEach(cb => cb.checked = false);
}

function getSelectedSites(action) {
    const sites = [];
    document.querySelectorAll('.site-check:checked').forEach(checkbox => {
        const name = checkbox.getAttribute('data-name');
        const url = checkbox.getAttribute(`data-${action}`);
        if (url) {
            sites.push({ name, url });
        }
    });
    return sites;
}

// ============================================
// LOAD BANKS
// ============================================

async function loadBanksForTool() {
    const selects = ['autoBankName', 'bankBankName'];

    try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();

        if (data.code === '00' && data.data) {
            const sortedBanks = data.data.sort((a, b) => a.shortName.localeCompare(b.shortName));

            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Chọn ngân hàng...</option>';
                    sortedBanks.forEach(bank => {
                        const option = document.createElement('option');
                        option.value = bank.shortName;
                        option.textContent = `${bank.shortName} - ${bank.name}`;
                        select.appendChild(option);
                    });
                }
            });

            console.log(`✅ Loaded ${sortedBanks.length} banks`);
        }
    } catch (error) {
        console.error('❌ Failed to load banks:', error);
        showToast('error', 'Lỗi', 'Không thể tải danh sách ngân hàng');
    }
}

// ============================================
// RANDOM USERNAME GENERATOR
// ============================================

const uniqueWords = {
    prefixes: [
        'Sky', 'Moon', 'Star', 'Sun', 'Fire', 'Ice', 'Wind', 'Storm',
        'Dark', 'Light', 'Shadow', 'Ghost', 'Dragon', 'Phoenix', 'Tiger',
        'Wolf', 'Eagle', 'Hawk', 'Lion', 'Bear', 'Fox', 'Raven'
    ],
    suffixes: [
        'Blade', 'Strike', 'Storm', 'Fire', 'Frost', 'Bolt', 'Flash',
        'Fury', 'Rage', 'Soul', 'Spirit', 'Heart', 'Mind', 'Force',
        'Power', 'Might', 'Glory', 'Honor', 'Pride', 'Valor', 'Brave'
    ],
    numbers: ['', '1', '7', '9', '88', '99', '777', '888', '999']
};

function generateRandomUsername() {
    const prefix = uniqueWords.prefixes[Math.floor(Math.random() * uniqueWords.prefixes.length)];
    const suffix = uniqueWords.suffixes[Math.floor(Math.random() * uniqueWords.suffixes.length)];
    const number = uniqueWords.numbers[Math.floor(Math.random() * uniqueWords.numbers.length)];
    return prefix + suffix + number;
}

function generateUsername(inputId) {
    const username = generateRandomUsername();
    const input = document.getElementById(inputId);

    if (input) {
        input.value = username;

        // Highlight effect
        input.style.background = 'linear-gradient(135deg, #ebf4ff, #e0e7ff)';
        setTimeout(() => {
            input.style.background = '';
        }, 1000);

        console.log(`✅ Generated username: ${username}`);
    }
}

// ============================================
// AUTOMATION FUNCTIONS
// ============================================

async function runAutoSequence() {
    if (!profileManager.selectedProfileId) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn profile từ sidebar');
        return;
    }

    const sites = getSelectedSites('register');
    if (sites.length === 0) {
        showToast('warning', 'Chưa chọn trang', 'Vui lòng chọn ít nhất 1 trang');
        return;
    }

    const config = {
        username: document.getElementById('autoUsername').value,
        fullname: document.getElementById('autoFullname').value,
        password: document.getElementById('autoPassword').value,
        withdrawPassword: document.getElementById('autoWithdrawPassword').value,
        bankName: document.getElementById('autoBankName').value,
        bankBranch: document.getElementById('autoBankBranch').value,
        accountNumber: document.getElementById('autoAccountNumber').value,
        apiKey: apiKeyManager.get(),
        sites: sites
    };

    if (!config.username || !config.password) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ Username và Password');
        return;
    }

    showToast('info', 'Đang chạy', `Automation đang chạy trên ${sites.length} trang...`);

    try {
        // Use relative URL to automatically use current port
        const response = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'nohu-tool',
                profileId: profileManager.selectedProfileId,
                config: config
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Hoàn thành', 'Automation đã chạy xong', 7000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        showToast('error', 'Lỗi', error.message);
        console.error('❌ Automation error:', error);
    }
}

async function runRegisterOnly() {
    if (!profileManager.selectedProfileId) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn profile từ sidebar');
        return;
    }

    const sites = getSelectedSites('register');
    if (sites.length === 0) {
        showToast('warning', 'Chưa chọn trang', 'Vui lòng chọn ít nhất 1 trang');
        return;
    }

    const config = {
        username: document.getElementById('regUsername').value,
        fullname: document.getElementById('regFullname').value,
        password: document.getElementById('regPassword').value,
        withdrawPassword: document.getElementById('regWithdrawPassword').value,
        apiKey: apiKeyManager.get(),
        sites: sites
    };

    if (!config.username || !config.password) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
        return;
    }

    showToast('info', 'Đang đăng ký', `Đang đăng ký trên ${sites.length} trang...`);

    try {
        // Use relative URL to automatically use current port
        const response = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'nohu-tool',
                profileId: profileManager.selectedProfileId,
                action: 'register',
                config: config
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Hoàn thành', 'Đăng ký thành công', 5000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        showToast('error', 'Lỗi', error.message);
    }
}

async function runLoginOnly() {
    if (!profileManager.selectedProfileId) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn profile từ sidebar');
        return;
    }

    const sites = getSelectedSites('login');
    if (sites.length === 0) {
        showToast('warning', 'Chưa chọn trang', 'Vui lòng chọn ít nhất 1 trang');
        return;
    }

    const config = {
        username: document.getElementById('loginUsername').value,
        password: document.getElementById('loginPassword').value,
        sites: sites
    };

    if (!config.username || !config.password) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
        return;
    }

    showToast('info', 'Đăng nhập', `Đang đăng nhập vào ${sites.length} trang...`);

    try {
        // Use relative URL to automatically use current port
        const response = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'nohu-tool',
                profileId: profileManager.selectedProfileId,
                action: 'login',
                config: config
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Hoàn thành', 'Đăng nhập thành công', 5000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        showToast('error', 'Lỗi', error.message);
    }
}

async function runAddBankOnly() {
    if (!profileManager.selectedProfileId) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn profile từ sidebar');
        return;
    }

    const sites = getSelectedSites('login');
    if (sites.length === 0) {
        showToast('warning', 'Chưa chọn trang', 'Vui lòng chọn ít nhất 1 trang');
        return;
    }

    const config = {
        bankName: document.getElementById('bankBankName').value,
        bankBranch: document.getElementById('bankBankBranch').value,
        accountNumber: document.getElementById('bankAccountNumber').value,
        withdrawPassword: document.getElementById('bankWithdrawPassword').value,
        sites: sites
    };

    if (!config.bankName || !config.accountNumber || !config.withdrawPassword) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin ngân hàng');
        return;
    }

    showToast('info', 'Đang thêm bank', `Đang thêm ngân hàng vào ${sites.length} trang...`);

    try {
        // Use relative URL to automatically use current port
        const response = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'nohu-tool',
                profileId: profileManager.selectedProfileId,
                action: 'addbank',
                config: config
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Hoàn thành', 'Thêm ngân hàng thành công', 5000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        showToast('error', 'Lỗi', error.message);
    }
}

async function runCheckPromo() {
    if (!profileManager.selectedProfileId) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn profile từ sidebar');
        return;
    }

    const sites = getSelectedSites('promo');
    if (sites.length === 0) {
        showToast('warning', 'Chưa chọn trang', 'Vui lòng chọn ít nhất 1 trang');
        return;
    }

    const config = {
        username: document.getElementById('promoUsername').value,
        apiKey: apiKeyManager.get(),
        sites: sites
    };

    if (!config.username) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng điền Username');
        return;
    }

    showToast('info', 'Đang check KM', `Đang kiểm tra khuyến mãi trên ${sites.length} trang...`);

    try {
        // Use relative URL to automatically use current port
        const response = await fetch('/api/automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolId: 'nohu-tool',
                profileId: profileManager.selectedProfileId,
                action: 'checkpromo',
                config: config
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Hoàn thành', 'Kiểm tra khuyến mãi thành công', 5000);
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        showToast('error', 'Lỗi', error.message);
    }
}

console.log('✅ NOHU Tool JavaScript loaded');
