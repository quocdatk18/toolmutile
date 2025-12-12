/**
 * Test Content Fixed - Kiểm tra content-fixed.js hoạt động đúng
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testContentFixed() {
    console.log('🔧 Testing Content Fixed Script...\n');

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

        // Navigate to a NOHU site
        const testUrl = 'https://m.ghhdj-567dhdhhmm.asia/Account/Register?f=3528698&app=1';
        console.log('📍 Navigating to:', testUrl);

        await page.goto(testUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Inject content-fixed.js
        console.log('💉 Injecting content-fixed.js...');
        const contentFixedScript = fs.readFileSync(
            path.join(__dirname, 'tools/nohu-tool/extension/content-fixed.js'),
            'utf8'
        );

        await page.evaluate(contentFixedScript);

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 1: Check if script loaded
        console.log('\n🧪 TEST 1: Script Loading');
        const scriptLoaded = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.autoRegisterToolLoaded,
                messageListener: typeof window._chromeMessageListener === 'function',
                audioTracking: window.audioTrackingInitialized
            };
        });

        console.log('   Script loaded:', scriptLoaded.autoRegisterToolLoaded ? '✅' : '❌');
        console.log('   Message listener:', scriptLoaded.messageListener ? '✅' : '❌');
        console.log('   Audio tracking:', scriptLoaded.audioTracking ? '✅' : '❌');

        // Test 2: Test autoFill action (working version logic)
        console.log('\n🧪 TEST 2: AutoFill Action');
        const autoFillResult = await page.evaluate(() => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Timeout' });
                }, 10000);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'autoFill',
                            data: {
                                username: 'testuser123',
                                password: 'testpass123',
                                withdrawPassword: 'withdraw123',
                                fullname: 'Nguyen Van Test',
                                apiKey: 'test-api-key'
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
        });

        console.log('   AutoFill result:', autoFillResult.success ? '✅' : '❌');
        if (autoFillResult.error) {
            console.log('   Error:', autoFillResult.error);
        }
        if (autoFillResult.result) {
            console.log('   Fields filled:', autoFillResult.result);
        }

        // Test 3: Test freelxbFlow action (optimized version logic)
        console.log('\n🧪 TEST 3: FreeLXB Flow Action');
        const flowResult = await page.evaluate(() => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Timeout' });
                }, 10000);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'freelxbFlow',
                            data: {
                                username: 'testuser123',
                                password: 'testpass123',
                                withdrawPassword: 'withdraw123',
                                fullname: 'Nguyen Van Test',
                                apiKey: 'test-api-key',
                                bankName: 'VIETCOMBANK',
                                accountNumber: '1234567890',
                                checkKM: false
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
        });

        console.log('   FreeLXB Flow result:', flowResult.success ? '✅' : '❌');
        if (flowResult.error) {
            console.log('   Error:', flowResult.error);
        }
        if (flowResult.data) {
            console.log('   Flow data:', flowResult.data);
        }

        // Test 4: Check form state
        console.log('\n🧪 TEST 4: Form State Check');
        const formState = await page.evaluate(() => {
            const accountInput = document.querySelector('input[formcontrolname="account"]');
            const passwordInput = document.querySelector('input[formcontrolname="password"]');
            const nameInput = document.querySelector('input[formcontrolname="name"]');

            return {
                accountValue: accountInput ? accountInput.value : 'not found',
                passwordValue: passwordInput ? (passwordInput.value ? '***filled***' : 'empty') : 'not found',
                nameValue: nameInput ? nameInput.value : 'not found',
                formFound: !!(accountInput && passwordInput)
            };
        });

        console.log('   Form found:', formState.formFound ? '✅' : '❌');
        console.log('   Account field:', formState.accountValue);
        console.log('   Password field:', formState.passwordValue);
        console.log('   Name field:', formState.nameValue);

        // Test 5: Test ping action
        console.log('\n🧪 TEST 5: Ping Action');
        const pingResult = await page.evaluate(() => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Timeout' });
                }, 5000);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        { action: 'ping' },
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
        });

        console.log('   Ping result:', pingResult.success ? '✅' : '❌');

        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');

        const tests = [
            { name: 'Script Loading', result: scriptLoaded.autoRegisterToolLoaded && scriptLoaded.messageListener },
            { name: 'AutoFill Action', result: autoFillResult.success },
            { name: 'FreeLXB Flow', result: flowResult.success },
            { name: 'Form Detection', result: formState.formFound },
            { name: 'Ping Action', result: pingResult.success }
        ];

        tests.forEach((test, i) => {
            console.log(`${i + 1}. ${test.name}: ${test.result ? '✅ PASS' : '❌ FAIL'}`);
        });

        const passedTests = tests.filter(t => t.result).length;
        const totalTests = tests.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

        if (passedTests === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Content-fixed.js is working correctly!');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('✅ Most tests passed. Content-fixed.js is mostly working.');
        } else {
            console.log('⚠️ Some tests failed. Content-fixed.js needs more work.');
        }

        console.log('\n📝 Next Steps:');
        console.log('1. Check browser console for detailed logs');
        console.log('2. Inspect form fields to see if they were filled');
        console.log('3. Test with real automation tools');
        console.log('4. Use content-fixed.js in auto-sequence-safe.js');

        console.log('\n⏳ Keeping browser open for 30 seconds for inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));

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
    testContentFixed().catch(console.error);
}

module.exports = { testContentFixed };