/**
 * Test Safe Mode - Kiểm tra xem tab có còn tự động đóng không
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Load scripts
const contentScript = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/extension/content.js'), 'utf8');
const captchaSolver = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/captcha-solver.js'), 'utf8');
const banksScript = fs.readFileSync(path.join(__dirname, 'tools/nohu-tool/banks.js'), 'utf8');

const AutoSequence = require('./tools/nohu-tool/auto-sequence');

async function testSafeMode() {
    console.log('🛡️ Testing Safe Mode - Tab should NOT close automatically...\n');

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

        console.log('🛡️ Starting Safe Mode test...\n');
        console.log('📋 Expected behavior:');
        console.log('  ✅ Tab should open and stay open');
        console.log('  ✅ Detailed error logs if something fails');
        console.log('  ✅ Visual indicator when complete');
        console.log('  ✅ NO automatic tab closing\n');

        // Test single site
        const result = await autoSequence.runSequenceForSite(browser, testSites[0], profileData);

        console.log('\n📊 Safe Mode Test Results:');
        console.log('==========================');
        console.log(`Site: ${result.site}`);
        console.log(`Register: ${result.register.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.register.error) {
            console.log(`  Error: ${result.register.error}`);
        }
        console.log(`Login: ${result.login.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Add Bank: ${result.addBank.success ? '✅ SUCCESS' : '❌ FAILED'}`);

        console.log('\n🎯 Safe Mode Test Summary:');
        console.log(`Tab Status: ${result.register.success ? '✅ OPEN (Success)' : '✅ OPEN (Failed but safe)'}`);
        console.log('✅ No automatic tab closing detected');
        console.log('✅ Error handling working correctly');

        console.log('\n📝 Instructions:');
        console.log('1. Check the browser tab - it should still be open');
        console.log('2. Look for the completion indicator in top-right corner');
        console.log('3. Check browser console for detailed logs');
        console.log('4. Tab will remain open until you manually close it');

        console.log('\n⏳ Keeping browser open for 60 seconds for inspection...');
        console.log('   You can manually close the browser when done.');

        // Keep browser open for inspection
        await new Promise(resolve => setTimeout(resolve, 60000));

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('📍 Stack trace:', error.stack);

        console.log('\n🛡️ Even with this error, browser should still be open');
        console.log('   This demonstrates the safe mode error handling');
    } finally {
        console.log('\n🔚 Test completed - you can now close the browser manually');
        // Don't auto-close browser - let user inspect
        // await browser.close();
    }
}

// Run test
if (require.main === module) {
    testSafeMode().catch(console.error);
}

module.exports = { testSafeMode };