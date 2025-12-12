/**
 * Test FreeLXB Bridge - Kiểm tra fix extension -> tool
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Load scripts
const contentScript = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/extension/content.js'), 'utf8');
const captchaSolver = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/captcha-solver.js'), 'utf8');
const banksScript = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/banks.js'), 'utf8');

const AutoSequence = require('./tools/nohu-tool/auto-sequence');

async function testFreeLXBBridge() {
    console.log('🧪 Testing FreeLXB Bridge...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });

    try {
        const settings = {
            autoSubmit: true,
            keepOpen: true,
            apiKey: 'test-api-key'
        };

        const scripts = {
            contentScript: contentScript,
            captchaSolver: captchaSolver,
            banksScript: banksScript
        };

        const autoSequence = new AutoSequence(settings, scripts);

        // Test data
        const profileData = {
            username: 'testuser123',
            password: 'testpass123',
            withdrawPassword: 'withdraw123',
            fullname: 'Nguyen Van Test',
            apiKey: 'test-api-key',
            bankName: 'VIETCOMBANK',
            bankBranch: 'Thành phố Hồ Chí Minh',
            accountNumber: '1234567890',
            checkPromo: false
        };

        const testSites = [
            {
                name: 'Go99',
                registerUrl: 'https://m.ghhdj-567dhdhhmm.asia/Account/Register?f=3528698&app=1',
                loginUrl: 'https://m.ghhdj-567dhdhhmm.asia/?app=1',
                withdrawUrl: 'https://m.ghhdj-567dhdhhmm.asia/m/withdraw',
                promoUrl: 'https://m.ghhdj-567dhdhhmm.asia/?app=1'
            }
        ];

        console.log('🚀 Starting FreeLXB Bridge test...\n');

        // Test single site
        const result = await autoSequence.runSequenceForSite(browser, testSites[0], profileData);

        console.log('\n📊 Test Results:');
        console.log('================');
        console.log(`Site: ${result.site}`);
        console.log(`Register: ${result.register.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.register.error) {
            console.log(`  Error: ${result.register.error}`);
        }
        console.log(`Login: ${result.login.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Add Bank: ${result.addBank.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Check Promo: ${result.checkPromo.success ? '✅ SUCCESS' : '❌ FAILED'}`);

        console.log('\n🎯 FreeLXB Bridge Test Summary:');
        const overallSuccess = result.register.success && result.login.success;
        console.log(`Overall: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (overallSuccess) {
            console.log('🎉 FreeLXB Bridge is working correctly!');
            console.log('✅ Extension logic successfully converted to tool logic');
        } else {
            console.log('❌ FreeLXB Bridge needs more work');
            console.log('🔧 Check the error messages above for debugging');
        }

        console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run test
if (require.main === module) {
    testFreeLXBBridge().catch(console.error);
}

module.exports = { testFreeLXBBridge };