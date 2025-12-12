/**
 * Debug script để test form reset trực tiếp trong browser
 * Paste script này vào Console của browser khi đang ở trang dashboard
 */

console.log('🔧 Debug Form Reset Script');

// Test function để kiểm tra form reset
function testFormReset() {
    console.log('🧪 Testing form reset...');

    // Check if elements exist
    const elements = {
        profilePrefix: document.getElementById('profilePrefix'),
        proxyString: document.getElementById('proxyString'),
        proxyHost: document.getElementById('proxyHost'),
        proxyPort: document.getElementById('proxyPort'),
        proxyUsername: document.getElementById('proxyUsername'),
        proxyPassword: document.getElementById('proxyPassword')
    };

    console.log('📋 Elements found:');
    Object.keys(elements).forEach(key => {
        const element = elements[key];
        console.log(`  ${key}:`, element ? `✅ Found (value: "${element.value}")` : '❌ Not found');
    });

    // Set some test values
    console.log('📝 Setting test values...');
    if (elements.profilePrefix) elements.profilePrefix.value = 'TestProfile123';
    if (elements.proxyString) elements.proxyString.value = '192.168.1.100:8080:user:pass';
    if (elements.proxyHost) elements.proxyHost.value = '192.168.1.100';
    if (elements.proxyPort) elements.proxyPort.value = '8080';
    if (elements.proxyUsername) elements.proxyUsername.value = 'testuser';
    if (elements.proxyPassword) elements.proxyPassword.value = 'testpass';

    console.log('📋 Values after setting:');
    Object.keys(elements).forEach(key => {
        const element = elements[key];
        if (element) {
            console.log(`  ${key}: "${element.value}"`);
        }
    });

    // Test reset function
    console.log('🔄 Testing resetCreateProfileForm...');
    if (typeof resetCreateProfileForm === 'function') {
        resetCreateProfileForm();

        console.log('📋 Values after reset:');
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element) {
                console.log(`  ${key}: "${element.value}"`);
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
        console.log('📱 Modal found:', modal.style.display === 'flex' ? '✅ Open' : '❌ Closed');
        return modal.style.display === 'flex';
    } else {
        console.error('❌ Modal not found!');
        return false;
    }
}

// Main debug function
function debugFormReset() {
    console.log('🚀 Starting form reset debug...');

    if (!checkModal()) {
        console.log('⚠️ Modal is not open. Opening modal...');
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

console.log('✅ Debug script loaded. You can run:');
console.log('  - debugFormReset() - Full debug test');
console.log('  - testFormReset() - Test reset only');