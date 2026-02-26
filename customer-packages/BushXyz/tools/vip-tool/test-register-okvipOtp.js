/**
 * Test script for OKVIP OTP registration
 * Kiểm tra bước đăng ký
 */

const VIPAutomation = require('./vip-automation');
const puppeteer = require('puppeteer');

async function testOKVIPOtpRegister() {
    console.log('🧪 Testing OKVIP OTP Registration...\n');

    const automation = new VIPAutomation({
        captchaApiKey: process.env.CAPTCHA_API_KEY || null,
        viotpToken: process.env.VIOTP_TOKEN || null
    }, {
        captchaSolver: null,
        contentScript: null,
        banksScript: null
    });

    // Get sites for okvipOtp
    const categoryConfig = automation.getSitesByCategory('okvipOtp');
    if (!categoryConfig) {
        console.error('❌ Category okvipOtp not found');
        return;
    }

    console.log(`✅ Category found: ${categoryConfig.name}`);
    console.log(`📍 Sites: ${categoryConfig.sites.map(s => s.name).join(', ')}\n`);

    // Test data
    const profileData = {
        profileId: 'test-001',
        username: 'testuser123',
        password: 'Test@12345',
        fullname: 'TEST USER',
        phone: '0987654321',
        email: 'test@example.com',
        withdrawPassword: '123456',
        accountNumber: '1234567890',
        bankName: 'Vietcombank',
        bankBranch: 'TP. Hồ Chí Minh',
        simMode: 'manual'
    };

    // Launch browser
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Test with first site
        const siteConfig = categoryConfig.sites[0];
        console.log(`\n📝 Testing registration for: ${siteConfig.name}`);
        console.log(`📍 URL: ${siteConfig.registerUrl}\n`);

        // Call registerStep
        const result = await automation.registerStep(browser, 'okvipOtp', siteConfig, profileData);

        console.log('\n✅ Register Step Result:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ Registration step completed successfully!');
            console.log('📌 Next step: Add Bank');
        } else {
            console.log('\n❌ Registration step failed');
            console.log(`Error: ${result.error || result.message}`);
        }

    } catch (error) {
        console.error('\n❌ Test Error:', error.message);
        console.error(error.stack);
    } finally {
        // Keep browser open for inspection
        console.log('\n⏳ Browser will stay open for 30 seconds for inspection...');
        await new Promise(r => setTimeout(r, 30000));
        await browser.close();
    }
}

// Run test
testOKVIPOtpRegister().catch(console.error);
