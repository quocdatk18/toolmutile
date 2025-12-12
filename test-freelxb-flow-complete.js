/**
 * Test FreeLXB Flow Complete - Kiểm tra flow hoàn chỉnh: Register → Bank Fill
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testFreeLXBFlowComplete() {
    console.log('🔄 Testing Complete FreeLXB Flow: Register → Bank Fill...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });

    try {
        const page = await browser.newPage();

        // Test data
        const profileData = {
            username: 'TestUser' + Math.floor(Math.random() * 1000),
            password: 'testpass123',
            withdrawPassword: 'withdraw123',
            fullname: 'Nguyen Van Test',
            apiKey: '2560b8b1c4b2b8b1c4b2b8b1c4b2b8b1c4b2b8b1c4b2b8b1c4b2b8b1c4b2b8b1',
            bankName: 'VIETCOMBANK',
            bankBranch: 'Thành phố Hồ Chí Minh',
            accountNumber: '1234567890'
        };

        console.log('📋 Test Profile Data:');
        console.log(`   Username: ${profileData.username}`);
        console.log(`   Password: ${profileData.password}`);
        console.log(`   Bank: ${profileData.bankName}`);
        console.log(`   Account: ${profileData.accountNumber}\n`);

        // STEP 1: Navigate to register page
        const registerUrl = 'https://m.ghhdj-567dhdhhmm.asia/Account/Register?f=3528698&app=1';
        console.log('📍 STEP 1: Navigating to register page...');
        console.log(`   URL: ${registerUrl}`);

        await page.goto(registerUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // STEP 2: Inject content-fixed.js
        console.log('\n💉 STEP 2: Injecting content-fixed.js...');
        const contentFixedScript = fs.readFileSync(
            path.join(__dirname, 'tools/nohu-tool/extension/content-fixed.js'),
            'utf8'
        );

        await page.evaluate(contentFixedScript);

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // STEP 3: Test registration
        console.log('\n📝 STEP 3: Testing registration...');
        const registerResult = await page.evaluate((userData) => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Registration timeout' });
                }, 20000);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'autoFill',
                            data: userData
                        },
                        {},
                        (response) => {
                            clearTimeout(timeout);
                            resolve(response);
                        }
                    );
                } else {
                    clearTimeout(timeout);
                    resolve({ success: false, error: 'No message listener' });
                }
            });
        }, profileData);

        console.log('   Registration result:', registerResult.success ? '✅ SUCCESS' : '❌ FAILED');
        if (registerResult.error) {
            console.log('   Error:', registerResult.error);
        }

        if (!registerResult.success) {
            console.log('\n❌ Registration failed, cannot test bank fill');
            return;
        }

        // Wait for registration to complete
        console.log('\n⏳ Waiting for registration to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // STEP 4: Navigate to withdraw page
        const withdrawUrl = 'https://m.ghhdj-567dhdhhmm.asia/m/withdraw';
        console.log('\n💳 STEP 4: Navigating to withdraw page...');
        console.log(`   URL: ${withdrawUrl}`);

        await page.goto(withdrawUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Re-inject script on new page
        console.log('\n💉 Re-injecting content-fixed.js on withdraw page...');
        await page.evaluate(contentFixedScript);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // STEP 5: Test bank form filling
        console.log('\n🏦 STEP 5: Testing bank form filling...');
        const bankResult = await page.evaluate((bankData) => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Bank fill timeout' });
                }, 20000);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'fillWithdrawForm',
                            data: {
                                withdrawInfo: {
                                    bankName: bankData.bankName,
                                    bankBranch: bankData.bankBranch,
                                    accountNumber: bankData.accountNumber,
                                    withdrawPassword: bankData.withdrawPassword
                                }
                            }
                        },
                        {},
                        (response) => {
                            clearTimeout(timeout);
                            resolve(response);
                        }
                    );
                } else {
                    clearTimeout(timeout);
                    resolve({ success: false, error: 'No message listener' });
                }
            });
        }, profileData);

        console.log('   Bank fill result:', bankResult.success ? '✅ SUCCESS' : '❌ FAILED');
        if (bankResult.error) {
            console.log('   Error:', bankResult.error);
        }
        if (bankResult.data) {
            console.log('   Details:', bankResult.data);
        }

        // STEP 6: Check form state
        console.log('\n🔍 STEP 6: Checking final form state...');
        const formState = await page.evaluate(() => {
            const bankDropdown = document.querySelector('[formcontrolname="bankName"]') ||
                document.querySelector('select[name*="bank"]');
            const branchInput = document.querySelector('[formcontrolname="city"]') ||
                document.querySelector('input[placeholder*="chi nhánh"]');
            const accountInput = document.querySelector('[formcontrolname="account"]') ||
                document.querySelector('input[placeholder*="tài khoản"]');

            return {
                bankValue: bankDropdown ? bankDropdown.value : 'not found',
                branchValue: branchInput ? branchInput.value : 'not found',
                accountValue: accountInput ? accountInput.value : 'not found',
                formFound: !!(bankDropdown && branchInput && accountInput)
            };
        });

        console.log('   Form found:', formState.formFound ? '✅' : '❌');
        console.log('   Bank field:', formState.bankValue);
        console.log('   Branch field:', formState.branchValue);
        console.log('   Account field:', formState.accountValue);

        // Summary
        console.log('\n📊 COMPLETE FLOW TEST SUMMARY:');
        console.log('===============================');

        const tests = [
            { name: 'Registration', result: registerResult.success },
            { name: 'Bank Form Fill', result: bankResult.success },
            { name: 'Form Verification', result: formState.formFound && formState.accountValue !== 'not found' }
        ];

        tests.forEach((test, i) => {
            console.log(`${i + 1}. ${test.name}: ${test.result ? '✅ PASS' : '❌ FAIL'}`);
        });

        const passedTests = tests.filter(t => t.result).length;
        const totalTests = tests.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

        if (passedTests === totalTests) {
            console.log('🎉 COMPLETE FLOW SUCCESS! FreeLXB-style automation working!');
            console.log('✅ Register → Bank Fill flow is now working like extension');
        } else if (passedTests >= 2) {
            console.log('✅ Partial success. Most steps working.');
        } else {
            console.log('⚠️ Flow needs more work.');
        }

        console.log('\n📝 Next Steps:');
        console.log('1. Check browser tabs - both register and withdraw pages should be filled');
        console.log('2. Verify bank dropdown, branch, and account fields are populated');
        console.log('3. Test with dashboard to confirm full integration');

        console.log('\n⏳ Keeping browser open for 60 seconds for inspection...');
        await new Promise(resolve => setTimeout(resolve, 60000));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        console.log('\n🔚 Test completed - you can close the browser manually');
        // Don't auto-close for inspection
        // await browser.close();
    }
}

// Run test
if (require.main === module) {
    testFreeLXBFlowComplete().catch(console.error);
}

module.exports = { testFreeLXBFlowComplete };