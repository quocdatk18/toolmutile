/**
 * Hidemium Multi-Tool Dashboard
 * Main JavaScript File
 */

// Global state
let currentTool = null;
let tools = [];
let runningProfiles = new Set(); // Track profiles currently running automation

// Check if admin features are available
async function checkAdminFeatures() {
    try {
        const response = await fetch('/api/admin/packages');
        if (response.ok) {
            // Admin features available - show Admin button, hide License button
            document.getElementById('adminBtn').style.display = 'inline-flex';
            document.getElementById('licenseBtn').style.display = 'none';
        } else {
            // Customer version - show License button, hide Admin button
            document.getElementById('adminBtn').style.display = 'none';
            document.getElementById('licenseBtn').style.display = 'inline-flex';
            
        }
    } catch (error) {
        // Default to customer version
        document.getElementById('adminBtn').style.display = 'none';
        document.getElementById('licenseBtn').style.display = 'inline-flex';
    }
}

// Global license state
let isLicensed = false;
let isMasterVersion = false;

// Helper function to check license and redirect if needed
function requireLicense(action = 'sử dụng tính năng này') {
    if (!isLicensed && !isMasterVersion) {
        showToast('error', 'License Required', `Vui lòng kích hoạt bản quyền để ${action}`);
        setTimeout(() => {
            window.location.href = '/license.html';
        }, 1500);
        return false;
    }
    return true;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {

    // Check if admin features available
    await checkAdminFeatures();

    // Check license first - CRITICAL
    const licenseValid = await checkLicense();

    // If not licensed and not master version, redirect to license page
    if (!licenseValid && !isMasterVersion) {
        console.warn('⚠️ No valid license - redirecting to license page');
        showToast('warning', 'License Required', 'Vui lòng kích hoạt bản quyền để sử dụng tool');
        setTimeout(() => {
            window.location.href = '/license.html';
        }, 2000);
        return;
    }

    // Check Hidemium connection
    await checkHidemiumConnection();

    // Load API key info
    loadApiKeyInfo();
    loadSimApiKeyInfo();

    // Load tools
    await loadTools();

    // Restore previous state from localStorage
    restoreNavigationState();

    // Start polling for automation status updates
    startAutomationStatusPolling();

});

// ============================================
// LICENSE CHECK
// ============================================

async function checkLicense() {
    const licenseStatus = document.getElementById('licenseStatus');

    if (!licenseStatus) return false;

    try {
        const response = await fetch('/api/license/info');
        const data = await response.json();

        // Set global state
        isLicensed = data.licensed && data.info;
        isMasterVersion = data.isMaster || false;

        // Display customer name if available
        if (data.customerDisplayName) {
            const customerNameLabel = document.getElementById('customerNameLabel');
            const customerNameValue = document.getElementById('customerNameValue');
            if (customerNameLabel && customerNameValue) {
                customerNameValue.textContent = data.customerDisplayName;
                customerNameLabel.style.display = 'inline';
            }
        }

        licenseStatus.style.display = 'flex';
        const statusIcon = licenseStatus.querySelector('.status-icon');
        const statusText = licenseStatus.querySelector('.status-text');

        if (data.licensed && data.info) {
            // Check if this is master version
            if (data.isMaster) {
                statusIcon.textContent = '👑';
                statusText.textContent = 'Master Version';
                licenseStatus.classList.add('status-connected');
                licenseStatus.classList.remove('status-error');
                licenseStatus.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                licenseStatus.style.color = '#000';
            } else {
                statusIcon.textContent = '✅';
                // Use remainingText if available, otherwise fallback to days
                let daysText;
                if (data.info.remainingText) {
                    daysText = data.info.remainingText;
                } else if (data.info.isLifetime) {
                    daysText = 'Lifetime';
                } else {
                    daysText = `${data.info.remainingDays}d`;
                }
                statusText.textContent = `Licensed (${daysText})`;
                licenseStatus.classList.add('status-connected');
                licenseStatus.classList.remove('status-error');
            }
            return true;
        } else {
            statusIcon.textContent = '❌';
            statusText.textContent = 'No License';
            licenseStatus.classList.add('status-error');
            licenseStatus.classList.remove('status-connected');
            return false;
        }
    } catch (error) {
        console.error('Error checking license:', error);
        return false;
    }
}

// ============================================
// HIDEMIUM CONNECTION
// ============================================

async function checkHidemiumConnection() {
    const statusBadge = document.getElementById('hidemiumStatus');
    const statusIcon = statusBadge.querySelector('.status-icon');
    const statusText = statusBadge.querySelector('.status-text');

    try {
        const response = await fetch('/api/hidemium/status');
        const data = await response.json();

        if (data.connected) {
            statusIcon.textContent = '✅';
            statusText.textContent = 'Hidemium Connected';
            statusBadge.classList.add('status-connected');
            statusBadge.classList.remove('status-error');
        } else {
            throw new Error('Hidemium not responding');
        }
    } catch (error) {
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'Hidemium Offline';
        statusBadge.classList.add('status-error');
        statusBadge.classList.remove('status-connected');
        showToast('warning', 'Hidemium Offline', 'Vui lòng mở Hidemium và bật Local API');
        console.error('Hidemium connection error:', error);
    }
}

// ============================================
// API KEY MANAGEMENT
// ============================================

function loadApiKeyInfo() {
    const info = apiKeyManager.getInfo();
    const apiStatus = document.getElementById('apiStatus');
    const statusIcon = apiStatus.querySelector('.status-icon');
    const statusText = apiStatus.querySelector('.status-text');
    const apiKeyInput = document.getElementById('globalApiKey');
    const apiKeyInfo = document.getElementById('apiKeyInfo');

    if (info.hasKey) {
        apiKeyInput.value = info.key;
        // Set to password type for security
        apiKeyInput.type = 'password';
        statusIcon.textContent = '✅';
        statusText.textContent = 'API Key Active';
        apiStatus.classList.add('status-active');
        apiKeyInfo.style.display = 'block';
    } else {
        statusIcon.textContent = '🔑';
        statusText.textContent = 'No API Key';
        apiStatus.classList.remove('status-active');
        apiKeyInfo.style.display = 'none';
    }
}

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('globalApiKey');
    const toggleIcon = document.getElementById('toggleIcon');

    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Hide icon
    } else {
        apiKeyInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Show icon
    }
}

async function saveGlobalApiKey() {
    
    const apiKey = document.getElementById('globalApiKey').value.trim();

    if (!apiKey) {
        showToast('warning', 'Thiếu API Key', 'Vui lòng nhập API Key');
        return;
    }

    // Validate format first (client-side)
    const validation = validateApiKeyFormat(apiKey);
    if (!validation.valid) {
        showToast('error', 'API Key không hợp lệ', validation.error);
        return;
    }

    const result = apiKeyManager.save(apiKey);

    if (result.success) {
        console.log('✅ Save successful, loading info and checking balance...');
        loadApiKeyInfo();

        // Auto check balance (this will validate with API server)
        try {
            await checkGlobalBalance();
        } catch (error) {
            console.error('❌ Error in checkGlobalBalance:', error);
            showToast('error', 'Lỗi kiểm tra số dư', error.message);
        }
    } else {
        console.log('❌ Save failed:', result.error);
        showToast('error', 'Lỗi', result.error);
    }
}

async function checkGlobalBalance() {
    console.log('💰 checkGlobalBalance called');
    const apiKey = apiKeyManager.get();

    if (!apiKey) {
        showToast('warning', 'Thiếu API Key', 'Vui lòng nhập API Key trước');
        return;
    }

    // Validate API key format first
    const validation = validateApiKeyFormat(apiKey);
    if (!validation.valid) {
        showToast('error', 'API Key không hợp lệ', validation.error);
        return;
    }

    const balanceElement = document.getElementById('keyBalance');

    try {
        console.log('🌐 Fetching balance from API...');
        const response = await fetch(`/api/captcha/balance?key=${apiKey}`);
        const data = await response.json();

        if (data.success) {
            balanceElement.textContent = data.balance.toLocaleString('vi-VN') + ' VNĐ';

            // Show warning if balance is low
            if (data.balance < 1) {
                showToast('warning', 'Số dư thấp', `Số dư: ${data.balance.toLocaleString('vi-VN')} VNĐ. Vui lòng nạp thêm!`);
            } else {
                showToast('success', 'API Key hợp lệ', `Số dư: ${data.balance.toLocaleString('vi-VN')} VNĐ`);
            }

            // Update API status badge
            const apiStatus = document.getElementById('apiStatus');
            const statusIcon = apiStatus.querySelector('.status-icon');
            const statusText = apiStatus.querySelector('.status-text');
            statusIcon.textContent = '✅';
            statusText.textContent = 'API Key Active';
            apiStatus.classList.add('status-active');

            // Show API info panel
            document.getElementById('apiKeyInfo').style.display = 'block';
            document.getElementById('keyStatus').textContent = '✅ Active';
        } else {
            balanceElement.textContent = '0 VNĐ';
            throw new Error(data.error || 'API Key không hợp lệ');
        }
    } catch (error) {
        balanceElement.textContent = '0 VNĐ';
        showToast('error', 'Lỗi kiểm tra API Key', error.message);

        // Update API status badge to error
        const apiStatus = document.getElementById('apiStatus');
        const statusIcon = apiStatus.querySelector('.status-icon');
        const statusText = apiStatus.querySelector('.status-text');
        statusIcon.textContent = '❌';
        statusText.textContent = 'API Key Invalid';
        apiStatus.classList.remove('status-active');
    }
}

// Validate API key format (client-side)
function validateApiKeyFormat(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return { valid: false, error: 'API key phải là chuỗi ký tự' };
    }

    const trimmed = apiKey.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: 'API key không được để trống' };
    }

    if (trimmed.length < 10) {
        return { valid: false, error: 'API key quá ngắn (tối thiểu 10 ký tự)' };
    }

    // Check for valid characters (alphanumeric and common special chars)
    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
        return { valid: false, error: 'API key chứa ký tự không hợp lệ (chỉ chấp nhận a-z, A-Z, 0-9, -, _)' };
    }

    return { valid: true, key: trimmed };
}

// ============================================
// SIM API KEY MANAGEMENT
// ============================================

async function saveSimApiKey() {
    const apiKey = document.getElementById('simApiKey').value.trim();

    if (!apiKey) {
        showToast('warning', 'Thiếu SIM API Key', 'Vui lòng nhập SIM API Key');
        return;
    }

    const result = simApiManager.save(apiKey);

    if (result.success) {
        loadSimApiKeyInfo();

        // Auto check balance
        await checkSimBalance();
    } else {
        showToast('error', 'Lỗi', result.error);
    }
}

async function checkSimBalance() {
    const apiKey = simApiManager.get();

    if (!apiKey) {
        showToast('warning', 'Thiếu SIM API Key', 'Vui lòng nhập SIM API Key trước');
        return;
    }

    const result = await simApiManager.checkBalance();

    if (result.success) {
        const balanceElement = document.getElementById('simKeyBalance');
        balanceElement.textContent = result.balanceFormatted;

        const infoElement = document.getElementById('simApiKeyInfo');
        infoElement.style.display = 'block';

        showToast('success', 'Số dư SIM', result.balanceFormatted);
    } else {
        showToast('error', 'Lỗi kiểm tra số dư', result.error);
    }
}

function toggleSimApiKeyVisibility() {
    const input = document.getElementById('simApiKey');
    const icon = document.getElementById('toggleSimIcon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

function loadSimApiKeyInfo() {
    const info = simApiManager.getInfo();
    const input = document.getElementById('simApiKey');
    const infoElement = document.getElementById('simApiKeyInfo');

    if (info.hasKey) {
        input.value = info.key;
        infoElement.style.display = 'block';
    } else {
        infoElement.style.display = 'none';
    }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

async function loadProfiles(showNotification = false) {
    const container = document.getElementById('profilesList');

    // Check if container exists (may not exist on tool pages)
    if (!container) {
        await profileManager.loadAll();
        return;
    }

    container.innerHTML = '<p class="loading-state">Đang tải...</p>';

    const result = await profileManager.loadAll();

    if (result.success) {
        displayProfiles(result.profiles);
        // Only show notification if explicitly requested (user action)
        if (showNotification) {
            showToast('success', 'Đã tải profiles', `${result.profiles.length} profiles`);
        }
    } else {
        container.innerHTML = '<p class="error-state">Lỗi tải profiles</p>';
        if (showNotification) {
            showToast('error', 'Lỗi', result.error);
        }
    }
}

function displayProfiles(profiles) {
    const container = document.getElementById('profilesList');
    const bulkActions = document.getElementById('bulkActions');

    // Check if container exists
    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (profiles.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có profiles</p>';
        if (bulkActions) bulkActions.style.display = 'none';
        return;
    }

    // Show bulk actions
    if (bulkActions) bulkActions.style.display = 'block';

    profiles.forEach(profile => {
        const isRunning = profileManager.isRunning(profile.uuid);
        const isSelected = profileManager.selectedProfileId === profile.uuid;
        const isChecked = profileManager.selectedProfileIds.includes(profile.uuid);

        // Extract proxy IP
        let proxyIP = 'No proxy';
        if (profile.proxy && typeof profile.proxy === 'object' && profile.proxy.ip) {
            proxyIP = profile.proxy.ip;
        } else if (profile.proxy && typeof profile.proxy === 'string') {
            const parts = profile.proxy.split('|');
            if (parts.length >= 2 && parts[1]) {
                proxyIP = parts[1];
            }
        }

        // OS icons
        const osIcons = {
            'win': '🪟',
            'windows': '🪟',
            'mac': '🍎',
            'macos': '🍎',
            'linux': '🐧',
            'android': '🤖',
            'ios': '📱'
        };

        // Browser icons
        const browserIcons = {
            'chrome': '🌐',
            'firefox': '🦊',
            'edge': '🔷',
            'opera': '🔴',
            'brave': '🦁',
            'safari': '🧭'
        };

        const osIcon = osIcons[profile.os?.toLowerCase()] || '💻';
        const browserIcon = browserIcons[profile.browser?.toLowerCase()] || '🌐';

        const div = document.createElement('div');
        div.className = `profile-item ${isSelected ? 'selected' : ''} ${isRunning ? 'running' : ''} ${isChecked ? 'checked' : ''}`;
        div.setAttribute('data-uuid', profile.uuid);

        div.innerHTML = `
            <div class="profile-checkbox-wrapper">
                <input type="checkbox" class="profile-checkbox" 
                       data-uuid="${profile.uuid}" 
                       id="check-${profile.uuid}"
                       ${isChecked ? 'checked' : ''}
                       onclick="event.stopPropagation(); toggleProfileSelection('${profile.uuid}')">
                <label for="check-${profile.uuid}" class="profile-checkbox-label" onclick="event.stopPropagation()"></label>
            </div>
            <div class="profile-header">
                <div class="profile-name">
                    ${isRunning ? '<span class="status-dot running"></span>' : ''}
                    ${profile.name || 'Unnamed'}
                </div>
                <div class="profile-actions-mini">
                    <button class="btn-mini ${isRunning ? 'disabled' : ''}" 
                            onclick="event.stopPropagation(); startProfile('${profile.uuid}')" 
                            ${isRunning ? 'disabled' : ''} 
                            title="Start">▶️</button>
                    <button class="btn-mini ${!isRunning ? 'disabled' : ''}" 
                            onclick="event.stopPropagation(); stopProfile('${profile.uuid}')" 
                            ${!isRunning ? 'disabled' : ''} 
                            title="Stop">⏹️</button>
                    <button class="btn-mini btn-danger ${isRunning ? 'disabled' : ''}" 
                            onclick="event.stopPropagation(); deleteProfile('${profile.uuid}')" 
                            ${isRunning ? 'disabled' : ''} 
                            title="Delete">🗑️</button>
                </div>
            </div>
            <div class="profile-info">
                ${osIcon} ${profile.os || 'N/A'} | ${browserIcon} ${profile.browser || 'chrome'} | 🌍 ${proxyIP}
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-actions-mini') && !e.target.closest('.profile-checkbox-wrapper')) {
                // Don't allow selecting running profiles
                if (profileManager.isRunning(profile.uuid)) {
                    showToast('warning', 'Profile đang chạy', 'Không thể chọn profile đang chạy automation');
                    return;
                }
                selectProfile(profile.uuid);
            }
        });

        container.appendChild(div);
    });

    updateSelectedCount();
}

function selectProfile(uuid) {
    profileManager.select(uuid);

    // Update UI
    document.querySelectorAll('.profile-item').forEach(item => {
        item.classList.remove('selected');
    });

    const selectedItem = document.querySelector(`.profile-item[data-uuid="${uuid}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }

    const profile = profileManager.getSelected();
    showToast('info', 'Profile đã chọn', profile?.name || 'Unknown');
}

async function startProfile(uuid) {
    // Check if automation is running on this profile
    if (profileManager.isRunning(uuid)) {
        const confirmStart = confirm(
            'Profile này đang chạy automation.\n\n' +
            'Nếu bạn start lại profile, automation có thể bị lỗi.\n\n' +
            'Bạn có chắc muốn start?'
        );
        if (!confirmStart) {
            return;
        }
    }

    const result = await profileManager.start(uuid);

    if (result.success) {
        showToast('success', 'Đã start', 'Profile đã được khởi động');
        await loadProfiles(false); // Auto reload - no notification
    } else {
        showToast('error', 'Lỗi start', result.error);
    }
}

async function stopProfile(uuid) {
    // Check if automation is running
    if (profileManager.isRunning(uuid)) {
        const confirmStop = confirm(
            'Profile này đang chạy automation.\n\n' +
            'Stop profile sẽ:\n' +
            '- Dừng browser\n' +
            '- Dừng automation\n' +
            '- Unmark profile (có thể chạy lại)\n\n' +
            'Bạn có chắc muốn stop?'
        );
        if (!confirmStop) {
            return;
        }
    }

    const result = await profileManager.stop(uuid);

    if (result.success) {
        // If automation was running, unmark it
        if (profileManager.isRunning(uuid)) {
            profileManager.runningProfiles.delete(uuid);
            profileManager.saveRunningProfiles();
        }

        showToast('success', 'Đã stop', 'Profile đã được dừng và unmarked');
        await loadProfiles(false); // Auto reload - no notification
    } else {
        showToast('error', 'Lỗi stop', result.error);
    }
}

async function deleteProfile(uuid) {
    if (!confirm('Bạn có chắc muốn xóa profile này?')) {
        return;
    }

    const result = await profileManager.delete(uuid);

    if (result.success) {
        showToast('success', 'Đã xóa', 'Profile đã được xóa');
        await loadProfiles(false); // Auto reload - no notification
    } else {
        showToast('error', 'Lỗi xóa', result.error);
    }
}

// ============================================
// CREATE PROFILE MODAL
// ============================================

function openCreateProfileModal() {
    const modal = document.getElementById('createProfileModal');
    modal.style.display = 'flex';

    // Reset form sử dụng hàm chung
    resetCreateProfileForm();

    // Add event listeners for OS change
    document.querySelectorAll('input[name="profileOS"]').forEach(radio => {
        radio.addEventListener('change', updateAdvancedOptionsForOS);
    });

    // Initialize with default OS (Windows)
    updateAdvancedOptionsForOS();
}

// Update advanced settings options based on selected OS
function updateAdvancedOptionsForOS() {
    const selectedOS = document.querySelector('input[name="profileOS"]:checked').value;

    // Resolution options by OS
    const resolutionOptions = {
        'win': [
            { value: '1920x1080', label: '1920x1080 (Full HD - Phổ biến nhất)' },
            { value: '1366x768', label: '1366x768 (HD - Laptop)' },
            { value: '1536x864', label: '1536x864 (HD+ - Laptop)' },
            { value: '1440x900', label: '1440x900 (Standard)' },
            { value: '1600x900', label: '1600x900 (HD+)' },
            { value: '2560x1440', label: '2560x1440 (2K)' }
        ],
        'mac': [
            { value: '1440x900', label: '1440x900 (MacBook Air 13")' },
            { value: '1680x1050', label: '1680x1050 (MacBook Pro 15")' },
            { value: '1920x1080', label: '1920x1080 (iMac 21.5")' },
            { value: '2560x1440', label: '2560x1440 (MacBook Pro 13" Retina)' },
            { value: '2560x1600', label: '2560x1600 (MacBook Pro 16")' },
            { value: '2880x1800', label: '2880x1800 (MacBook Pro 15" Retina)' }
        ],
        'linux': [
            { value: '1920x1080', label: '1920x1080 (Full HD)' },
            { value: '1366x768', label: '1366x768 (HD - Laptop)' },
            { value: '1600x900', label: '1600x900 (HD+)' },
            { value: '1440x900', label: '1440x900 (Standard)' },
            { value: '2560x1440', label: '2560x1440 (2K)' }
        ],
        'android': [
            { value: '360x640', label: '360x640 (Galaxy S5/S6)' },
            { value: '360x780', label: '360x780 (Galaxy S8/S9)' },
            { value: '384x640', label: '384x640 (Nexus 4)' },
            { value: '390x844', label: '390x844 (Galaxy S21)' },
            { value: '393x851', label: '393x851 (Pixel 6/7)' },
            { value: '412x732', label: '412x732 (Pixel 3/4)' },
            { value: '412x915', label: '412x915 (Galaxy S20/S21+)' },
            { value: '414x896', label: '414x896 (Large Android)' },
            { value: '480x800', label: '480x800 (Galaxy S3/S4)' },
            { value: '540x960', label: '540x960 (Xiaomi Redmi Note)' },
            { value: '600x1024', label: '600x1024 (Galaxy Tab - Small Tablet)' }
        ],
        'ios': [
            { value: '375x667', label: '375x667 (iPhone 6/7/8/SE)' },
            { value: '375x812', label: '375x812 (iPhone X/XS/11 Pro)' },
            { value: '390x844', label: '390x844 (iPhone 12/13/14)' },
            { value: '393x852', label: '393x852 (iPhone 14 Pro)' },
            { value: '414x896', label: '414x896 (iPhone XR/11/XS Max)' },
            { value: '428x926', label: '428x926 (iPhone 12/13/14 Pro Max)' }
        ]
    };

    // CPU options by OS
    const cpuOptions = {
        'win': [4, 6, 8, 12, 16],
        'mac': [8, 10, 12, 16],
        'linux': [4, 6, 8, 12, 16],
        'android': [4, 6, 8],
        'ios': [4, 6, 8]
    };

    // RAM options by OS
    const ramOptions = {
        'win': [4, 8, 16, 32],
        'mac': [8, 16, 32],
        'linux': [8, 16, 32],
        'android': [4, 6, 8, 12],
        'ios': [4, 6, 8, 12]
    };

    // Update Resolution dropdown
    const resolutionSelect = document.getElementById('profileResolution');
    resolutionSelect.innerHTML = '<option value="">🎲 Auto Random</option>';
    (resolutionOptions[selectedOS] || resolutionOptions['win']).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        resolutionSelect.appendChild(option);
    });

    // Update CPU dropdown
    const cpuSelect = document.getElementById('profileCPU');
    cpuSelect.innerHTML = '<option value="">🎲 Auto</option>';
    (cpuOptions[selectedOS] || cpuOptions['win']).forEach(cores => {
        const option = document.createElement('option');
        option.value = cores;
        option.textContent = `${cores} cores`;
        cpuSelect.appendChild(option);
    });

    // Update RAM dropdown
    const ramSelect = document.getElementById('profileRAM');
    ramSelect.innerHTML = '<option value="">🎲 Auto</option>';
    (ramOptions[selectedOS] || ramOptions['win']).forEach(gb => {
        const option = document.createElement('option');
        option.value = gb;
        option.textContent = `${gb} GB`;
        ramSelect.appendChild(option);
    });
}

function closeCreateProfileModal() {
    const modal = document.getElementById('createProfileModal');
    modal.style.display = 'none';

    // Reset form để tránh giữ lại giá trị proxy từ lần tạo trước
    resetCreateProfileForm();
}

function resetCreateProfileForm() {

    try {
        // CRITICAL FIX: Force reset all form fields with multiple methods

        // Method 1: Reset basic fields with force clear first
        const profilePrefixInput = document.getElementById('profilePrefix');
        if (profilePrefixInput) {
            profilePrefixInput.value = '';
            profilePrefixInput.value = 'Profile';
        }

        // Method 2: Reset radio buttons
        const winRadio = document.querySelector('input[name="profileOS"][value="win"]');
        const chromeRadio = document.querySelector('input[name="profileBrowser"][value="chrome"]');
        if (winRadio) {
            winRadio.checked = true;
        }
        if (chromeRadio) {
            chromeRadio.checked = true;
        }

        // Method 3: Force reset proxy fields with clear first
        const proxyFields = [
            { id: 'proxyString', defaultValue: '' },
            { id: 'proxyHost', defaultValue: '' },
            { id: 'proxyPort', defaultValue: '' },
            { id: 'proxyUsername', defaultValue: '' },
            { id: 'proxyPassword', defaultValue: '' }
        ];

        proxyFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.value = '';
                element.value = field.defaultValue;
            }
        });

        // Reset proxy checkbox
        const useProxyCheckbox = document.getElementById('useProxy');
        if (useProxyCheckbox) {
            useProxyCheckbox.checked = false;
        }

        // Reset proxy type radio
        const httpRadio = document.querySelector('input[name="proxyType"][value="HTTP"]');
        if (httpRadio) {
            httpRadio.checked = true;
        }

        // Reset advanced options to default (Auto)
        const profileResolution = document.getElementById('profileResolution');
        if (profileResolution) {
            profileResolution.selectedIndex = 0; // Select first option (Auto Random)
        }

        const profileCPU = document.getElementById('profileCPU');
        if (profileCPU) {
            profileCPU.selectedIndex = 0; // Select first option (Auto)
        }

        const profileRAM = document.getElementById('profileRAM');
        if (profileRAM) {
            profileRAM.selectedIndex = 0; // Select first option (Auto)
        }

        // Reset language and timezone to default
        const profileLanguage = document.getElementById('profileLanguage');
        if (profileLanguage) {
            profileLanguage.value = 'en-US'; // Default to English
        }

        const profileTimezone = document.getElementById('profileTimezone');
        if (profileTimezone) {
            profileTimezone.value = ''; // Auto timezone
        }

        // Reset canvas and webgl settings
        const profileCanvas = document.getElementById('profileCanvas');
        if (profileCanvas) {
            profileCanvas.checked = true; // Default to enabled
        }

        const profileWebGL = document.getElementById('profileWebGL');
        if (profileWebGL) {
            profileWebGL.checked = false; // Default to disabled for safety
        }

        // Update advanced options for default OS (Windows)
        if (typeof updateAdvancedOptionsForOS === 'function') {
            updateAdvancedOptionsForOS();
        }

        console.log('✅ Form reset completed successfully');

        // Force trigger change events to ensure UI updates
        const allInputs = document.querySelectorAll('#createProfileModal input, #createProfileModal select');
        allInputs.forEach(input => {
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

    } catch (error) {
        console.error('❌ Error resetting form:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Debug function for manual testing
function testFormResetManual() {

    // Check if modal is open
    const modal = document.getElementById('createProfileModal');
    if (!modal || modal.style.display !== 'flex') {
        if (typeof openCreateProfileModal === 'function') {
            openCreateProfileModal();
        }
        setTimeout(() => {
            resetCreateProfileForm();
        }, 500);
    } else {
        resetCreateProfileForm();
    }
}

// Make function available globally for debugging
window.testFormResetManual = testFormResetManual;

function toggleProxyFields() {
    // Proxy fields are always visible now, no need to toggle
    const proxyFields = document.getElementById('proxyFields');
    if (proxyFields) {
        proxyFields.style.display = 'block';
    }
}

// ============================================
// PROFILE NAME GENERATOR
// ============================================

// Random profile name generator (similar to NOHU tool)
const profileWords = {
    prefixes: ['Sky', 'Moon', 'Star', 'Fire', 'Dragon', 'Phoenix', 'Tiger', 'Wolf', 'Eagle', 'Lion', 'Storm', 'Shadow', 'Light', 'Dark', 'Swift', 'Brave', 'Wild', 'Free', 'Gold', 'Silver'],
    suffixes: ['Hunter', 'Warrior', 'Master', 'King', 'Queen', 'Lord', 'Knight', 'Rider', 'Walker', 'Runner', 'Fighter', 'Seeker', 'Keeper', 'Maker', 'Breaker', 'Slayer', 'Guardian', 'Defender', 'Champion', 'Hero'],
    numbers: ['01', '02', '03', '07', '09', '11', '13', '17', '19', '21', '23', '27', '29', '31', '37', '39', '41', '43', '47', '49', '51', '53', '57', '59', '61', '67', '69', '71', '73', '77', '79', '81', '83', '87', '89', '91', '93', '97', '99']
};

function generateRandomProfileName() {
    const prefix = profileWords.prefixes[Math.floor(Math.random() * profileWords.prefixes.length)];
    const suffix = profileWords.suffixes[Math.floor(Math.random() * profileWords.suffixes.length)];
    const number = profileWords.numbers[Math.floor(Math.random() * profileWords.numbers.length)];

    return prefix + suffix + number;
}

function generateProfileName() {
    const profileName = generateRandomProfileName();
    const input = document.getElementById('profilePrefix');
    if (input) {
        input.value = profileName;
        showToast('success', 'Random thành công', `Tên profile: ${profileName}`);
    }
}

function parseProxyString() {
    const proxyString = document.getElementById('proxyString').value.trim();

    if (!proxyString) return;

    const parts = proxyString.split(':');

    if (parts.length >= 2) {
        document.getElementById('proxyHost').value = parts[0];
        document.getElementById('proxyPort').value = parts[1];

        if (parts.length >= 3) {
            document.getElementById('proxyUsername').value = parts[2];
        }
        if (parts.length >= 4) {
            document.getElementById('proxyPassword').value = parts[3];
        }
    }
}

async function createProfileFromModal() {
    // Check license first
    if (!requireLicense('tạo profile')) {
        closeCreateProfileModal();
        return;
    }

    const prefix = document.getElementById('profilePrefix').value.trim() || 'Profile';
    const os = document.querySelector('input[name="profileOS"]:checked').value;
    const browser = document.querySelector('input[name="profileBrowser"]:checked').value;
    // Check if proxy info is provided (optional)
    const proxyHost = document.getElementById('proxyHost').value.trim();
    const proxyPort = document.getElementById('proxyPort').value.trim();
    const useProxy = proxyHost && proxyPort; // Use proxy if both host and port are provided
    // Random realistic OS versions
    const getOSVersion = (os) => {
        const versions = {
            'win': ['10', '11'],  // Windows 10 and 11 (most common)
            'mac': ['13', '14', '15'],  // Ventura, Sonoma, Sequoia
            'linux': ['20.04', '22.04', '24.04'],  // Ubuntu LTS versions
            'android': ['11', '12', '13', '14'],  // Android versions
            'ios': ['15', '16', '17', '18']  // iOS versions
        };
        const osVersions = versions[os] || ['10'];
        return osVersions[Math.floor(Math.random() * osVersions.length)];
    };

    // Random realistic browser versions (recent versions)
    const getBrowserVersion = (browser) => {
        const versions = {
            'chrome': ['120', '121', '122', '123'],  // Recent Chrome
            'firefox': ['121', '122', '123', '124'],  // Recent Firefox
            'edge': ['120', '121', '122', '123'],  // Recent Edge
            'brave': ['120', '121', '122'],  // Recent Brave
            'opera': ['105', '106', '107', '108']  // Recent Opera
        };
        const browserVersions = versions[browser] || ['121'];
        return browserVersions[Math.floor(Math.random() * browserVersions.length)];
    };

    const config = {
        name: prefix,
        os: os,
        osVersion: getOSVersion(os),
        browser: browser,
        version: getBrowserVersion(browser)
    };

    if (useProxy) {
        // Get proxy type from radio button
        const proxyType = document.querySelector('input[name="proxyType"]:checked').value;

        config.proxy = {
            type: proxyType,
            host: proxyHost,
            port: proxyPort,
            username: document.getElementById('proxyUsername').value.trim() || '',
            password: document.getElementById('proxyPassword').value.trim() || ''
        };
    }

    showToast('info', 'Đang tạo', `Tạo profile "${prefix}"...`);

    const result = await profileManager.create(config);

    if (result.success) {
        showToast('success', 'Tạo thành công', `Profile "${prefix}" đã được tạo`);

        // CRITICAL FIX: Reset form immediately after success
        console.log('✅ Profile created successfully - resetting form...');

        // Debug: Check if elements exist before reset

        resetCreateProfileForm();

        // Debug: Check if elements were reset

        // Don't close modal automatically - let user decide when to close
        // This allows creating multiple profiles without reopening modal

        // Check if any automation is running
        const hasRunningAutomation = profileManager.runningProfiles.size > 0;

        if (hasRunningAutomation) {
            showToast('info', 'Lưu ý', 'Profile đã tạo. Danh sách sẽ cập nhật sau khi automation hoàn thành.', 3000);
        } else {
            // Reload profiles in all views only if no automation is running
            const mgmtSection = document.getElementById('profileManagementSection');
            if (mgmtSection && mgmtSection.style.display !== 'none') {
                await loadProfilesForManagement();
            }

            // Also reload carousel in tools if visible
            if (typeof loadProfilesCarousel === 'function') {
                await loadProfilesCarousel();
            }

            // Reload sidebar profiles if exists
            await loadProfiles();
        }
    } else {
        showToast('error', 'Lỗi tạo profile', result.error);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('createProfileModal');
    if (event.target === modal) {
        closeCreateProfileModal();
    }
});

// Theo dõi khi modal được mở để đảm bảo form được reset
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('createProfileModal');
    if (modal) {
        // Sử dụng MutationObserver để theo dõi khi modal được hiển thị
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isVisible = modal.style.display === 'flex';
                    if (isVisible) {
                        // Đợi một chút để DOM cập nhật xong
                        setTimeout(() => {
                            resetCreateProfileForm();
                        }, 100);
                    }
                }
            });
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['style']
        });

    }
});

// ============================================
// TOOLS MANAGEMENT
// ============================================

async function loadTools() {
    const container = document.getElementById('toolsGrid');

    try {
        const response = await fetch('../config/tools.json');
        const allTools = (await response.json()).tools;

        // Check if admin features are available
        const isAdmin = document.getElementById('adminBtn').style.display !== 'none';

        // Always show all tools - check permission when opening
        tools = allTools;

        displayTools(tools);
    } catch (error) {
        container.innerHTML = '<p class="error-state">Lỗi tải tools</p>';
        showToast('error', 'Lỗi', 'Không thể tải danh sách tools');
    }
}

function displayTools(toolsList) {
    const container = document.getElementById('toolsGrid');
    container.innerHTML = '';

    // Add "Profile Management" card first
    const profileCard = document.createElement('div');
    profileCard.className = 'tool-card profile-management-card';
    profileCard.innerHTML = `
        <div class="tool-header">
            <div class="tool-icon">📋</div>
            <span class="tool-status active">✅ System</span>
        </div>
        <div class="tool-body">
            <h3>Profile Management</h3>
            <p>Quản lý Hidemium profiles: tạo, xóa, start/stop profiles</p>
            <div class="tool-meta">
                <span>🔧 System Tool</span>
            </div>
        </div>
        <div class="tool-footer">
            <button class="btn btn-primary" onclick="openProfileManagement()">📋 Quản Lý Profiles</button>
        </div>
    `;
    container.appendChild(profileCard);

    // Add automation tools
    toolsList.forEach(tool => {
        const card = createToolCard(tool);
        container.appendChild(card);
    });

    // Add "Other Tools" card
    const otherCard = document.createElement('div');
    otherCard.className = 'tool-card other-tools-card';
    otherCard.innerHTML = `
        <div class="tool-header">
            <div class="tool-icon">🚀</div>
            <span class="tool-status coming-soon">⏳ Coming Soon</span>
        </div>
        <div class="tool-body">
            <h3>Other Tools</h3>
            <p>Nhiều automation tools khác đang được phát triển và sẽ ra mắt trong tương lai</p>
            <div class="tool-meta">
                <span>🔮 Sắp Ra Mắt</span>
            </div>
        </div>
        <div class="tool-footer">
            <button class="btn btn-secondary" onclick="showFutureTools()">🔮 Xem Thêm</button>
        </div>
    `;
    container.appendChild(otherCard);
}

function createToolCard(tool) {
    const card = document.createElement('div');
    let cardClass = 'tool-card';
    if (tool.status === 'active') cardClass += ' active';
    else if (tool.status === 'maintenance') cardClass += ' maintenance';
    else cardClass += ' coming-soon';

    card.className = cardClass;
    card.setAttribute('data-tool-id', tool.id);

    let statusBadge;
    if (tool.status === 'active') {
        statusBadge = '<span class="tool-status active">✅ Active</span>';
    } else if (tool.status === 'maintenance') {
        statusBadge = '<span class="tool-status maintenance">🔧 Đang Nâng Cấp</span>';
    } else {
        statusBadge = '<span class="tool-status coming-soon">⏳ Coming Soon</span>';
    }

    // Remove access level badges - show all tools

    let buttonHtml;
    if (tool.status === 'active') {
        buttonHtml = `<button class="btn btn-primary" onclick="openTool('${tool.id}')">🚀 Open Tool</button>`;
    } else if (tool.status === 'maintenance') {
        buttonHtml = `<button class="btn btn-warning" onclick="showMaintenanceMessage('${tool.id}')">🔧 Đang Nâng Cấp</button>`;
    } else {
        buttonHtml = `<button class="btn btn-secondary" disabled>🔒 Coming Soon</button>`;
    }

    card.innerHTML = `
        <div class="tool-header">
            <div class="tool-icon">${tool.icon}</div>
            ${statusBadge}
        </div>
        <div class="tool-body">
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <div class="tool-meta">
                <span>📦 v${tool.version}</span>
                ${tool.sites ? `<span>🎯 ${tool.sites.length} sites</span>` : ''}
            </div>
        </div>
        <div class="tool-footer">
            ${buttonHtml}
        </div>
    `;

    return card;
}

function showMaintenanceMessage(toolId) {
    const tool = tools.find(t => t.id === toolId);

    if (tool && tool.maintenanceMessage) {
        showToast('warning', '🔧 Tool Đang Nâng Cấp', tool.maintenanceMessage);
    } else {
        showToast('warning', '🔧 Tool Đang Nâng Cấp', 'Tool này đang trong quá trình nâng cấp. Vui lòng quay lại sau!');
    }
}

async function openTool(toolId) {
    // Check license first
    if (!requireLicense('sử dụng tool')) return;

    const tool = tools.find(t => t.id === toolId);

    if (!tool || tool.status !== 'active') {
        if (tool && tool.status === 'maintenance') {
            showMaintenanceMessage(toolId);
        } else {
            showToast('warning', 'Tool không khả dụng', 'Tool này chưa được kích hoạt');
        }
        return;
    }

    // Check tool permission from license
    const isAdmin = document.getElementById('adminBtn').style.display !== 'none';
    if (!isAdmin) {
        try {
            const licenseResponse = await fetch('/api/license/allowed-tools');
            const licenseData = await licenseResponse.json();

            if (licenseData.success && licenseData.allowedTools) {
                const allowedTools = licenseData.allowedTools;

                if (!allowedTools.includes('*') && !allowedTools.includes(toolId)) {
                    showToast('error', '🔒 Nâng cấp license để sử dụng',
                        `${tool.name} không có trong gói license hiện tại.\n\n💎 Liên hệ admin để nâng cấp license và sử dụng tool này.`);
                    return;
                }
            } else {
                showToast('error', 'License không hợp lệ', 'Vui lòng kích hoạt license để sử dụng tool');
                return;
            }
        } catch (error) {
            showToast('error', 'Lỗi kiểm tra license', 'Không thể xác minh quyền truy cập tool');
            return;
        }
    }

    // Check if this is a fresh reload (to avoid infinite loop)
    const urlParams = new URLSearchParams(window.location.search);
    const isFromReload = urlParams.get('tool') === toolId || sessionStorage.getItem('toolReloadFlag') === toolId;

    if (!isFromReload) {
        // First time opening tool - reload for clean state

        // Set flag to prevent infinite reload
        sessionStorage.setItem('toolReloadFlag', toolId);

        // Save navigation state before reload
        saveNavigationState('tool', toolId);

        // Force reload with timestamp to bypass cache
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now() + '&tool=' + toolId;
        return;
    } else {
        // This is after reload - clear flag and proceed normally
        sessionStorage.removeItem('toolReloadFlag');
    }

    currentTool = tool;

    // Save navigation state
    saveNavigationState('tool', toolId);

    // Hide tools section
    document.getElementById('toolsSection').style.display = 'none';

    // Show tool content
    const toolContent = document.getElementById('toolContent');
    const toolTitle = document.getElementById('toolTitle');
    const toolBody = document.getElementById('toolBody');

    toolTitle.textContent = `${tool.icon} ${tool.name}`;
    toolContent.style.display = 'block';

    // Load tool-specific UI
    try {
        const response = await fetch(tool.uiPath);
        const html = await response.text();

        // Parse HTML to extract link and script tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract and load CSS links
        const links = doc.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !document.querySelector(`link[href="${href}"]`)) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href;
                document.head.appendChild(newLink);
            }
            link.remove();
        });

        // Extract and remove script tags
        const scripts = doc.querySelectorAll('script');
        const scriptContents = [];
        scripts.forEach(script => {
            scriptContents.push(script.textContent);
            script.remove();
        });

        // Set HTML without scripts and links
        toolBody.innerHTML = doc.body.innerHTML;

        // Execute scripts
        scriptContents.forEach(scriptContent => {
            const script = document.createElement('script');
            script.textContent = scriptContent;
            toolBody.appendChild(script);
        });

        // Clear previous tool data to prevent cross-contamination
        if (window.resultsData) {
            Object.keys(window.resultsData).forEach(key => delete window.resultsData[key]);
        }
        if (window.processedResults) {
            window.processedResults.clear();
        }

        // Clear results table immediately to show tool switching
        const resultsTableBody = document.getElementById('resultsTableBody');
        if (resultsTableBody) {
            resultsTableBody.innerHTML = `<tr><td colspan="100%" class="text-center">🔄 Đang tải dữ liệu ${tool.name}...</td></tr>`;
        }

        // Initialize tool-specific scripts
        setTimeout(() => {
            // Set current tool globally for cross-contamination prevention
            window.currentTool = tool;

            if (window.initToolUI) {
                window.initToolUI(tool);
            }
            // Restore active tab if saved
            restoreActiveTab();

            // Auto-refresh data when loading tool
            if (window.refreshAllData) {
                window.refreshAllData();
            }
        }, 100);
    } catch (error) {
        console.error('Tool load error:', error);
        toolBody.innerHTML = '<p class="error-state">Lỗi tải UI tool</p>';
        showToast('error', 'Lỗi', 'Không thể tải giao diện tool');
    }
}

function backToTools() {
    // Hide tool content
    document.getElementById('toolContent').style.display = 'none';

    // Hide profile management
    document.getElementById('profileManagementSection').style.display = 'none';

    // Show tools section
    document.getElementById('toolsSection').style.display = 'block';

    // Clear tool data to prevent cross-contamination
    if (window.resultsData) {
        Object.keys(window.resultsData).forEach(key => delete window.resultsData[key]);
    }
    if (window.processedResults) {
        window.processedResults.clear();
    }

    currentTool = null;

    // Clear navigation state
    clearNavigationState();
}

// ============================================
// PROFILE MANAGEMENT SECTION
// ============================================

function openProfileManagement() {
    // Check license first
    if (!requireLicense('quản lý profiles')) return;

    // Save navigation state
    saveNavigationState('profile-management');

    // Hide tools section
    document.getElementById('toolsSection').style.display = 'none';

    // Hide tool content
    document.getElementById('toolContent').style.display = 'none';

    // Show profile management
    document.getElementById('profileManagementSection').style.display = 'block';

    // Auto-load profiles
    loadProfilesForManagement();
}

async function loadProfilesForManagement() {
    const container = document.getElementById('profilesManagementGrid');
    const bulkActions = document.getElementById('bulkActionsBar');
    container.innerHTML = '<p class="loading-state">Đang tải...</p>';

    const result = await profileManager.loadAll();

    if (result.success) {
        displayProfilesInManagement(result.profiles);
        if (bulkActions) bulkActions.style.display = 'flex';
        showToast('success', 'Đã tải profiles', `${result.profiles.length} profiles`);
    } else {
        container.innerHTML = '<p class="error-state">Lỗi tải profiles</p>';
        showToast('error', 'Lỗi', result.error);
    }
}

function displayProfilesInManagement(profiles) {
    const container = document.getElementById('profilesManagementGrid');
    container.innerHTML = '';

    if (profiles.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có profiles</p>';
        return;
    }

    profiles.forEach(profile => {
        const isRunning = profileManager.isRunning(profile.uuid);
        const isChecked = profileManager.selectedProfileIds.includes(profile.uuid);

        // Extract proxy IP
        let proxyIP = 'No proxy';
        if (profile.proxy && typeof profile.proxy === 'object' && profile.proxy.ip) {
            proxyIP = profile.proxy.ip;
        } else if (profile.proxy && typeof profile.proxy === 'string') {
            const parts = profile.proxy.split('|');
            if (parts.length >= 2 && parts[1]) {
                proxyIP = parts[1];
            }
        }

        // OS & Browser icons
        const osIcons = { 'win': '🪟', 'windows': '🪟', 'mac': '🍎', 'macos': '🍎', 'linux': '🐧', 'android': '🤖', 'ios': '📱' };
        const browserIcons = { 'chrome': '🌐', 'firefox': '🦊', 'edge': '🔷', 'opera': '🔴', 'brave': '🦁', 'safari': '🧭' };
        const osIcon = osIcons[profile.os?.toLowerCase()] || '💻';
        const browserIcon = browserIcons[profile.browser?.toLowerCase()] || '🌐';

        const card = document.createElement('div');
        card.className = `profile-card-management ${isRunning ? 'running' : ''} ${isChecked ? 'checked' : ''}`;
        card.setAttribute('data-uuid', profile.uuid);

        card.innerHTML = `
            <div class="profile-checkbox-wrapper">
                <input type="checkbox" class="profile-checkbox" 
                       data-uuid="${profile.uuid}" 
                       id="mgmt-check-${profile.uuid}"
                       ${isChecked ? 'checked' : ''}
                       onclick="event.stopPropagation(); toggleProfileSelection('${profile.uuid}')">
                <label for="mgmt-check-${profile.uuid}" class="profile-checkbox-label" onclick="event.stopPropagation()"></label>
            </div>
            <div class="profile-icon ${isRunning ? 'running' : ''}">
                ${profile.name ? profile.name.substring(0, 2).toUpperCase() : 'PR'}
            </div>
            <div class="profile-name-mgmt">
                ${isRunning ? '<span style="color: #48bb78;">●</span> ' : ''}
                ${profile.name || 'Unnamed'}
            </div>
            <div class="profile-info-mgmt">
                ${osIcon} ${profile.os || 'N/A'} | ${browserIcon} ${profile.browser || 'chrome'}
            </div>
            <div class="profile-info-mgmt">
                🌍 ${proxyIP}
            </div>
            <div class="profile-actions-mgmt">
                <button class="btn-mini ${isRunning ? 'disabled' : ''}" 
                        onclick="event.stopPropagation(); startProfileMgmt('${profile.uuid}')" 
                        ${isRunning ? 'disabled' : ''} 
                        title="Start">▶️</button>
                <button class="btn-mini ${!isRunning ? 'disabled' : ''}" 
                        onclick="event.stopPropagation(); stopProfileMgmt('${profile.uuid}')" 
                        ${!isRunning ? 'disabled' : ''} 
                        title="Stop">⏹️</button>
                <button class="btn-mini btn-danger ${isRunning ? 'disabled' : ''}" 
                        onclick="event.stopPropagation(); deleteProfileMgmt('${profile.uuid}')" 
                        ${isRunning ? 'disabled' : ''} 
                        title="Delete">🗑️</button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            // If clicking on buttons, do nothing
            if (e.target.closest('.profile-actions-mgmt')) {
                return;
            }

            // If clicking anywhere on card (including checkbox area), toggle checkbox
            toggleProfileSelection(profile.uuid);
        });

        container.appendChild(card);
    });

    updateMainSelectedCount();
}

async function startProfileMgmt(uuid) {
    const result = await profileManager.start(uuid);
    if (result.success) {
        showToast('success', 'Đã start', 'Profile đã được khởi động');
        await loadProfilesForManagement();
    } else {
        showToast('error', 'Lỗi start', result.error);
    }
}

async function stopProfileMgmt(uuid) {
    const result = await profileManager.stop(uuid);
    if (result.success) {
        showToast('success', 'Đã stop', 'Profile đã được dừng');
        await loadProfilesForManagement();
    } else {
        showToast('error', 'Lỗi stop', result.error);
    }
}

async function deleteProfileMgmt(uuid) {
    if (!confirm('Bạn có chắc muốn xóa profile này?')) {
        return;
    }

    const result = await profileManager.delete(uuid);
    if (result.success) {
        showToast('success', 'Đã xóa', 'Profile đã được xóa');
        await loadProfilesForManagement();
    } else {
        showToast('error', 'Lỗi xóa', result.error);
    }
}

function updateMainSelectedCount() {
    const countElement = document.getElementById('selectedCountMain');
    if (countElement) {
        const count = profileManager.selectedProfileIds.length;
        countElement.textContent = `Đã chọn: ${count}`;
    }
}

// Sidebar profile list removed - profiles are now selected in tool forms

function showComingSoon() {
    showToast('info', 'Coming Soon', 'Tính năng này sẽ có trong phiên bản tương lai');
}

function showFutureTools() {
    const message = `
🚀 <strong>Các Tool Đang Phát Triển:</strong><br><br>
🎮 <strong>Casino Tools</strong> - Automation cho các trang casino<br>
🎯 <strong>Sports Betting Tools</strong> - Tự động đặt cược thể thao<br>
🎰 <strong>Slot Tools</strong> - Automation cho game slot<br>
💰 <strong>Payment Tools</strong> - Quản lý thanh toán tự động<br><br>
📅 <strong>Dự kiến:</strong> Q1-Q2 2025<br>
📞 <strong>Liên hệ:</strong> @datpham231 để biết thêm chi tiết
    `;

    showToast('info', '🔮 Tools Tương Lai', message);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(type, title, message, duration = 5000) {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// BULK OPERATIONS
// ============================================

function toggleProfileSelection(uuid) {
    profileManager.toggleSelection(uuid);

    const isChecked = profileManager.selectedProfileIds.includes(uuid);

    // Update all checkboxes with this uuid (both in sidebar and management)
    document.querySelectorAll(`.profile-checkbox[data-uuid="${uuid}"]`).forEach(checkbox => {
        checkbox.checked = isChecked;
    });

    // Update all cards with this uuid
    document.querySelectorAll(`[data-uuid="${uuid}"]`).forEach(card => {
        if (isChecked) {
            card.classList.add('checked');
        } else {
            card.classList.remove('checked');
        }
    });

    updateSelectedCount();
    updateMainSelectedCount();
}

function selectAllProfiles() {
    profileManager.selectAll();

    // Update all checkboxes (both sidebar and management)
    document.querySelectorAll('.profile-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });

    // Update all cards (both sidebar and management)
    document.querySelectorAll('.profile-item, .profile-card-management').forEach(card => {
        card.classList.add('checked');
    });

    updateSelectedCount();
    updateMainSelectedCount();
}

function deselectAllProfiles() {
    profileManager.deselectAll();

    // Update all checkboxes (both sidebar and management)
    document.querySelectorAll('.profile-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Update all cards (both sidebar and management)
    document.querySelectorAll('.profile-item, .profile-card-management').forEach(card => {
        card.classList.remove('checked');
    });

    updateSelectedCount();
    updateMainSelectedCount();
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        const count = profileManager.selectedProfileIds.length;
        countElement.textContent = `${count} đã chọn`;
    }
}

async function startSelectedProfiles() {
    const selectedIds = profileManager.selectedProfileIds;

    if (selectedIds.length === 0) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn ít nhất 1 profile');
        return;
    }

    if (!confirm(`Bạn có chắc muốn start ${selectedIds.length} profile(s)?`)) {
        return;
    }

    showToast('info', 'Đang start profiles', `${selectedIds.length} profile(s)...`);

    const result = await profileManager.startMultiple(selectedIds);

    const successCount = result.results.filter(r => r.success).length;
    showToast('success', 'Hoàn thành', `Đã start ${successCount}/${selectedIds.length} profile(s)`);

    // Reload profiles in management view if visible
    const mgmtSection = document.getElementById('profileManagementSection');
    if (mgmtSection && mgmtSection.style.display !== 'none') {
        await loadProfilesForManagement();
    } else {
        await loadProfiles();
    }
}

async function stopSelectedProfiles() {
    const selectedIds = profileManager.selectedProfileIds;

    if (selectedIds.length === 0) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn ít nhất 1 profile');
        return;
    }

    if (!confirm(`Bạn có chắc muốn stop ${selectedIds.length} profile(s)?`)) {
        return;
    }

    showToast('info', 'Đang stop profiles', `${selectedIds.length} profile(s)...`);

    const result = await profileManager.stopMultiple(selectedIds);

    const successCount = result.results.filter(r => r.success).length;
    showToast('success', 'Hoàn thành', `Đã stop ${successCount}/${selectedIds.length} profile(s)`);

    // Reload profiles in management view if visible
    const mgmtSection = document.getElementById('profileManagementSection');
    if (mgmtSection && mgmtSection.style.display !== 'none') {
        await loadProfilesForManagement();
    } else {
        await loadProfiles();
    }
}

async function deleteSelectedProfiles() {
    const selectedIds = profileManager.selectedProfileIds;

    if (selectedIds.length === 0) {
        showToast('warning', 'Chưa chọn profile', 'Vui lòng chọn ít nhất 1 profile');
        return;
    }

    if (!confirm(`⚠️ BẠN CÓ CHẮC MUỐN XÓA ${selectedIds.length} PROFILE(S)?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    showToast('info', 'Đang xóa profiles', `${selectedIds.length} profile(s)...`);

    const result = await profileManager.deleteMultiple(selectedIds);

    const successCount = result.results.filter(r => r.success).length;
    showToast('success', 'Hoàn thành', `Đã xóa ${successCount}/${selectedIds.length} profile(s)`);

    profileManager.deselectAll();

    // Reload profiles in management view if visible
    const mgmtSection = document.getElementById('profileManagementSection');
    if (mgmtSection && mgmtSection.style.display !== 'none') {
        await loadProfilesForManagement();
    } else {
        await loadProfiles();
    }
}

// ============================================
// NAVIGATION STATE MANAGEMENT
// ============================================

function saveNavigationState(view, toolId = null, activeTab = null) {
    const state = {
        view: view, // 'home', 'tool', 'profile-management'
        toolId: toolId,
        activeTab: activeTab,
        timestamp: Date.now()
    };

    localStorage.setItem('dashboardNavigationState', JSON.stringify(state));
}

function clearNavigationState() {
    localStorage.removeItem('dashboardNavigationState');
}

async function restoreNavigationState() {
    const stateJson = localStorage.getItem('dashboardNavigationState');

    if (!stateJson) {
        
        return;
    }

    try {
        const state = JSON.parse(stateJson);

        // Check if state is not too old (e.g., 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - state.timestamp > maxAge) {
            clearNavigationState();
            return;
        }

        // Restore based on view
        if (state.view === 'tool' && state.toolId) {
            // Wait a bit for tools to load
            await new Promise(resolve => setTimeout(resolve, 200));
            await openTool(state.toolId);
        } else if (state.view === 'profile-management') {
            openProfileManagement();
        }
        // If 'home', do nothing (default view)

    } catch (error) {
        console.error('❌ Error restoring navigation state:', error);
        clearNavigationState();
    }
}

function saveActiveTab(tabName) {
    const stateJson = localStorage.getItem('dashboardNavigationState');
    if (stateJson) {
        const state = JSON.parse(stateJson);
        state.activeTab = tabName;
        localStorage.setItem('dashboardNavigationState', JSON.stringify(state));
    }
}

function restoreActiveTab() {
    const stateJson = localStorage.getItem('dashboardNavigationState');
    if (!stateJson) return;

    try {
        const state = JSON.parse(stateJson);
        if (state.activeTab) {

            // Find and click the tab
            const tab = document.querySelector(`.nohu-tool-container .tab[data-tab="${state.activeTab}"]`);
            if (tab) {
                tab.click();
            }
        }
    } catch (error) {
        console.error('❌ Error restoring active tab:', error);
    }
}

// Clear all running statuses (manual - for stuck profiles)
async function clearAllRunningStatuses() {
    const count = profileManager.runningProfiles.size;

    if (count === 0) {
        showToast('info', 'Không có gì', 'Không có profile nào đang marked running');
        return;
    }

    // Use custom modal instead of browser confirm
    showConfirmModal(
        '🔄 Clear Running Statuses',
        `<p>Có <strong>${count} profile</strong> đang marked running.</p>
        <p style="margin-top: 12px;"><strong>Chức năng này dùng để:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
            <li>Clear profiles bị "stuck" (không tự động clear)</li>
            <li>Cho phép chạy automation lại</li>
        </ul>
        <p style="margin-top: 12px; color: #10b981;"><strong>💡 Lưu ý:</strong> Profiles đã hoàn thành (có kết quả) sẽ tự động clear, không cần thủ công.</p>
        <p style="margin-top: 8px; color: #f59e0b;"><strong>⚠️ Cảnh báo:</strong> Nếu automation thực sự đang chạy, nó sẽ tiếp tục chạy (không bị stop).</p>`,
        async () => {
            profileManager.clearAllRunningStatuses();
            await loadProfiles();
            showToast('success', 'Đã clear', `Đã clear ${count} profiles`);
        }
    );
}

// ============================================
// CONFIRM MODAL
// ============================================

let confirmModalCallback = null;

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');

    if (!modal || !titleEl || !messageEl) return;

    titleEl.textContent = title;
    messageEl.innerHTML = message;
    confirmModalCallback = onConfirm;

    modal.classList.add('active');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    confirmModalCallback = null;
}

async function confirmModalAction() {
    if (confirmModalCallback) {
        await confirmModalCallback();
    }
    closeConfirmModal();
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmModal();
    }
});

// ============================================
// AUTOMATION STATUS POLLING
// ============================================

let automationStatusPollingInterval = null;
let lastKnownStatuses = new Map();

function startAutomationStatusPolling() {
    // Poll every 3 seconds
    automationStatusPollingInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/automation/statuses');
            const data = await response.json();

            if (data.success && data.statuses) {
                for (const status of data.statuses) {
                    const key = status.username;
                    const lastStatus = lastKnownStatuses.get(key);

                    // Check if status changed from "running" to "completed" or "error"
                    if (lastStatus === 'running' && (status.status === 'completed' || status.status === 'error')) {
                        console.log(`🔄 Automation completed for ${status.username}, reloading profiles...`);

                        // Reload profiles to update UI (without notification)
                        await loadProfiles(false);

                        // Show toast notification for automation completion only
                        if (status.status === 'completed') {
                            showToast('success', 'Hoàn thành', `Automation cho ${status.username} đã hoàn thành`);
                        } else {
                            showToast('error', 'Lỗi', `Automation cho ${status.username} gặp lỗi`);
                        }
                    }

                    // Update last known status
                    lastKnownStatuses.set(key, status.status);
                }
            }
        } catch (error) {
            // Silently fail - don't spam console
        }
    }, 3000); // Poll every 3 seconds
}

function stopAutomationStatusPolling() {
    if (automationStatusPollingInterval) {
        clearInterval(automationStatusPollingInterval);
        automationStatusPollingInterval = null;
    }
}
