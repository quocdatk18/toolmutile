/**
 * Test Content Fixed - Kiểm tra content-fixed.js hoạt động đúng
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testContentFixed() {

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

        await page.goto(testUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Inject content-fixed.js
        
        const contentFixedScript = fs.readFileSync(
            path.join(__dirname, 'tools/nohu-tool/extension/content-fixed.js'),
            'utf8'
        );

        await page.evaluate(contentFixedScript);

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 1: Check if script loaded
        const scriptLoaded = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.autoRegisterToolLoaded,
                messageListener: typeof window._chromeMessageListener === 'function',
                audioTracking: window.audioTrackingInitialized
            };
        });

        // Test 2: Test autoFill action (working version logic)
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
        }

        // Test 3: Test freelxbFlow action (optimized version logic)
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
        }

        // Test 4: Check form state
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

        // Test 5: Test ping action
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

        const tests = [
            { name: 'Script Loading', result: scriptLoaded.autoRegisterToolLoaded && scriptLoaded.messageListener },
            { name: 'AutoFill Action', result: autoFillResult.success },
            { name: 'FreeLXB Flow', result: flowResult.success },
            { name: 'Form Detection', result: formState.formFound },
            { name: 'Ping Action', result: pingResult.success }
        ];

        tests.forEach((test, i) => {
        });

        const passedTests = tests.filter(t => t.result).length;
        const totalTests = tests.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

        if (passedTests === totalTests) {
        } else if (passedTests >= totalTests * 0.8) {
        } else {
            console.log('⚠️ Some tests failed. Content-fixed.js needs more work.');
        }

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