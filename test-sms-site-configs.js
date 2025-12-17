// Test SMS Site Configs
const SmsToolOptimized = require('./tools/sms-tool/optimized-automation.js');

async function testSiteConfigs() {

    // Create instance
    const smstool = new SmsToolOptimized();

    // Test data from UI (như từ dashboard gửi)
    const testSites = [
        { name: 'SHBET', category: 'okvip' },
        { name: 'F8BET', category: 'okvip' },
        { name: 'J88', category: 'abcvip' },
        { name: 'QQ88', category: 'kjc' },
        { name: 'JUN88', category: '78win' }
    ];

    const testUserData = {
        username: 'TestUser123',
        password: 'test123456',
        fullname: 'NGUYEN VAN TEST',
        email: 'test@example.com',
        phone: '0123456789'
    };

    const testOptions = {
        profileId: 'test-profile-123',
        apiKey: 'test-api-key',
        autoSubmit: false,
        keepOpen: true
    };

    );

    // Test each site individually
    for (const site of testSites) {

        const config = smstools.siteConfigs[site.name];
        if (config) {
                type: config.type,
                registerUrl: config.registerUrl,
                loginUrl: config.loginUrl
            });
        } else {
        }
    }

    // Test batchProcess (without actually running browser)
    try {

        // Mock the browser initialization to avoid actual browser launch
        smstools.browser = { newPage: () => ({ goto: () => { }, close: () => { } }) };

        // This should show us the debug logs we added
        await smstools.batchProcess(testSites, testUserData, testOptions);

    } catch (error) {
        console.log('📋 Expected error (no real browser):', error.message);
    }
}

// Run test
testSiteConfigs().catch(console.error);