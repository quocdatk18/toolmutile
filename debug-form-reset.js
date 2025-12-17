/**
 * Debug script để test form reset trực tiếp trong browser
 * Paste script này vào Console của browser khi đang ở trang dashboard
 */

// Test function để kiểm tra form reset
function testFormReset() {

    // Check if elements exist
    const elements = {
        profilePrefix: document.getElementById('profilePrefix'),
        proxyString: document.getElementById('proxyString'),
        proxyHost: document.getElementById('proxyHost'),
        proxyPort: document.getElementById('proxyPort'),
        proxyUsername: document.getElementById('proxyUsername'),
        proxyPassword: document.getElementById('proxyPassword')
    };

    Object.keys(elements).forEach(key => {
        const element = elements[key];
    });

    // Set some test values
    if (elements.profilePrefix) elements.profilePrefix.value = 'TestProfile123';
    if (elements.proxyString) elements.proxyString.value = '192.168.1.100:8080:user:pass';
    if (elements.proxyHost) elements.proxyHost.value = '192.168.1.100';
    if (elements.proxyPort) elements.proxyPort.value = '8080';
    if (elements.proxyUsername) elements.proxyUsername.value = 'testuser';
    if (elements.proxyPassword) elements.proxyPassword.value = 'testpass';

    Object.keys(elements).forEach(key => {
        const element = elements[key];
        if (element) {
        }
    });

    // Test reset function
    if (typeof resetCreateProfileForm === 'function') {
        resetCreateProfileForm();

        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
            }
        });
    } else {
        console.error('❌ resetCreateProfileForm function not found!');
    }
}

// Test if modal is open
function checkModal() {
    const modal = document.getElementById('createProfileModal');
    if (modal) {
        return modal.style.display === 'flex';
    } else {
        console.error('❌ Modal not found!');
        return false;
    }
}

// Main debug function
function debugFormReset() {

    if (!checkModal()) {
        if (typeof openCreateProfileModal === 'function') {
            openCreateProfileModal();
            setTimeout(() => {
                testFormReset();
            }, 500);
        } else {
            console.error('❌ openCreateProfileModal function not found!');
        }
    } else {
        testFormReset();
    }
}

// Auto-run debug
debugFormReset();

// Export functions for manual testing
window.debugFormReset = debugFormReset;
window.testFormReset = testFormReset;
