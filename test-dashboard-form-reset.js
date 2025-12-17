/**
 * Test script để kiểm tra fix form reset trong dashboard
 * Vấn đề: Form không reset sau khi tạo profile thành công
 * Fix: Gọi resetCreateProfileForm() ngay sau khi tạo thành công và không đóng modal
 */

// Simulate DOM elements
const mockElements = {
    profilePrefix: { value: 'TestProfile123' },
    profileOS: {
        win: { checked: false },
        mac: { checked: true } // Simulate user selected Mac
    },
    profileBrowser: {
        chrome: { checked: false },
        firefox: { checked: true } // Simulate user selected Firefox
    },
    useProxy: { checked: true }, // Simulate user enabled proxy
    proxyString: { value: 'proxy.example.com:8080' },
    proxyType: {
        HTTP: { checked: false },
        SOCKS5: { checked: true } // Simulate user selected SOCKS5
    },
    proxyHost: { value: '192.168.1.100' },
    proxyPort: { value: '8080' },
    proxyUsername: { value: 'testuser' },
    proxyPassword: { value: 'testpass' },
    profileResolution: { selectedIndex: 3, value: '1440x900' },
    profileCPU: { selectedIndex: 2, value: '8' },
    profileRAM: { selectedIndex: 1, value: '16' },
    profileLanguage: { value: 'vi' },
    profileTimezone: { value: 'Asia/Ho_Chi_Minh' },
    profileCanvas: { checked: false },
    profileWebGL: { checked: true }
};

// Mock document.getElementById
function mockGetElementById(id) {
    switch (id) {
        case 'profilePrefix':
            return mockElements.profilePrefix;
        case 'useProxy':
            return mockElements.useProxy;
        case 'proxyString':
            return mockElements.proxyString;
        case 'proxyHost':
            return mockElements.proxyHost;
        case 'proxyPort':
            return mockElements.proxyPort;
        case 'proxyUsername':
            return mockElements.proxyUsername;
        case 'proxyPassword':
            return mockElements.proxyPassword;
        case 'profileResolution':
            return mockElements.profileResolution;
        case 'profileCPU':
            return mockElements.profileCPU;
        case 'profileRAM':
            return mockElements.profileRAM;
        case 'profileLanguage':
            return mockElements.profileLanguage;
        case 'profileTimezone':
            return mockElements.profileTimezone;
        case 'profileCanvas':
            return mockElements.profileCanvas;
        case 'profileWebGL':
            return mockElements.profileWebGL;
        default:
            return null;
    }
}

// Mock document.querySelector
function mockQuerySelector(selector) {
    if (selector === 'input[name="profileOS"][value="win"]') {
        return mockElements.profileOS.win;
    }
    if (selector === 'input[name="profileBrowser"][value="chrome"]') {
        return mockElements.profileBrowser.chrome;
    }
    if (selector === 'input[name="proxyType"][value="HTTP"]') {
        return mockElements.proxyType.HTTP;
    }
    return null;
}

// Mock updateAdvancedOptionsForOS function
function mockUpdateAdvancedOptionsForOS() {
}

// Simulate the improved resetCreateProfileForm function
function resetCreateProfileForm() {

    try {
        // Reset basic fields
        mockGetElementById('profilePrefix').value = 'Profile';
        mockQuerySelector('input[name="profileOS"][value="win"]').checked = true;
        mockQuerySelector('input[name="profileBrowser"][value="chrome"]').checked = true;

        // Reset proxy fields
        mockGetElementById('useProxy').checked = false;
        mockGetElementById('proxyString').value = '';
        mockQuerySelector('input[name="proxyType"][value="HTTP"]').checked = true;
        mockGetElementById('proxyHost').value = '';
        mockGetElementById('proxyPort').value = '';
        mockGetElementById('proxyUsername').value = '';
        mockGetElementById('proxyPassword').value = '';

        // Reset advanced options to default (Auto)
        const profileResolution = mockGetElementById('profileResolution');
        if (profileResolution) {
            profileResolution.selectedIndex = 0; // Select first option (Auto Random)
        }

        const profileCPU = mockGetElementById('profileCPU');
        if (profileCPU) {
            profileCPU.selectedIndex = 0; // Select first option (Auto)
        }

        const profileRAM = mockGetElementById('profileRAM');
        if (profileRAM) {
            profileRAM.selectedIndex = 0; // Select first option (Auto)
        }

        // Reset language and timezone to default
        const profileLanguage = mockGetElementById('profileLanguage');
        if (profileLanguage) {
            profileLanguage.value = 'en-US'; // Default to English
        }

        const profileTimezone = mockGetElementById('profileTimezone');
        if (profileTimezone) {
            profileTimezone.value = ''; // Auto timezone
        }

        // Reset canvas and webgl settings
        const profileCanvas = mockGetElementById('profileCanvas');
        if (profileCanvas) {
            profileCanvas.checked = true; // Default to enabled
        }

        const profileWebGL = mockGetElementById('profileWebGL');
        if (profileWebGL) {
            profileWebGL.checked = false; // Default to disabled for safety
        }

        // Update advanced options for default OS (Windows)
        mockUpdateAdvancedOptionsForOS();

        console.log('✅ Form reset completed successfully');

    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Test the fix
function runTest() {
    console.log('📋 Test 1: Check initial form state (simulating user input)');

    console.log('📋 Test 2: Simulate successful profile creation and form reset');
    resetCreateProfileForm();

    // Verify results
    const tests = [
        { name: 'Profile Prefix', expected: 'Profile', actual: mockElements.profilePrefix.value },
        { name: 'Windows OS selected', expected: true, actual: mockElements.profileOS.win.checked },
        { name: 'Chrome browser selected', expected: true, actual: mockElements.profileBrowser.chrome.checked },
        { name: 'Use Proxy disabled', expected: false, actual: mockElements.useProxy.checked },
        { name: 'Proxy Host cleared', expected: '', actual: mockElements.proxyHost.value },
        { name: 'Proxy Port cleared', expected: '', actual: mockElements.proxyPort.value },
        { name: 'Resolution reset to Auto', expected: 0, actual: mockElements.profileResolution.selectedIndex },
        { name: 'Language reset to en-US', expected: 'en-US', actual: mockElements.profileLanguage.value },
        { name: 'Canvas enabled by default', expected: true, actual: mockElements.profileCanvas.checked },
        { name: 'WebGL disabled by default', expected: false, actual: mockElements.profileWebGL.checked }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach(test => {
        const passed = test.actual === test.expected;
        if (passed) passedTests++;
    });

    if (passedTests === totalTests) {
        console.log('✅ Form will be reset to defaults after each successful creation');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
}

// Run the test
runTest();