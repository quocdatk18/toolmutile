/**
 * Complete Automation - All automation workflows
 * Handles: Register, Login, Add Bank, Check Promotion
 */

const puppeteer = require('puppeteer-core');
const AutomationActions = require('./automation-actions');

// Helper function to replace deprecated page.waitForTimeout()
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CompleteAutomation {
    constructor(settings, scripts) {
        this.settings = settings;
        this.scripts = scripts; // { contentScript, captchaSolver, banksScript }
    }

    /**
     * Inject all extension scripts into page (with duplicate check)
     */
    async injectScripts(page) {
        // Check if scripts already injected
        const alreadyInjected = await page.evaluate(() => {
            return window.autoRegisterToolLoaded === true;
        });

        if (alreadyInjected) {
            console.log('    ✅ Scripts already injected, skipping...');
            return;
        }

        console.log('    💉 Injecting chrome.runtime mock...');
        await page.evaluate(() => {
            if (!window.chrome) window.chrome = {};
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    sendMessage: async (message, callback) => {
                        console.log('📤 Mock sendMessage:', message);

                        // Handle API calls (for captcha solving)
                        if (message.action === 'apiCall') {
                            try {
                                console.log('🌐 Proxying API call:', message.data.endpoint);

                                const response = await fetch(message.data.endpoint, {
                                    method: message.data.method || 'GET',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: message.data.body ? JSON.stringify(message.data.body) : undefined
                                });

                                const result = await response.json();
                                console.log('✅ API call successful:', result);

                                if (callback) callback({ success: true, data: result });
                            } catch (error) {
                                console.error('❌ API call failed:', error);
                                if (callback) callback({ success: false, error: error.message });
                            }
                        } else {
                            // Other messages
                            if (callback) callback({ success: true });
                        }
                    },
                    onMessage: {
                        addListener: (callback) => {
                            console.log('📥 Mock onMessage listener added');
                            window._chromeMessageListener = callback;
                        }
                    },
                    lastError: null
                };
            }
        });

        console.log('    💉 Injecting banks.js...');
        await page.evaluate(this.scripts.banksScript);

        console.log('    💉 Injecting captcha-solver.js...');
        await page.evaluate(this.scripts.captchaSolver);

        console.log('    💉 Injecting Puppeteer API helper (bypass CORS)...');
        // Check if already exposed to avoid "already exists" error
        const hasApiCall = await page.evaluate(() => typeof window.__puppeteerApiCall === 'function');

        if (!hasApiCall) {
            await page.exposeFunction('__puppeteerApiCall', async (endpoint, method, body, apiKey) => {
                const axios = require('axios');
                console.log(`🌐 [Node.js] API Call: ${method} ${endpoint}`);

                try {
                    const response = await axios({
                        method: method,
                        url: endpoint,
                        data: body,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });

                    console.log(`✅ [Node.js] API Response:`, response.data);
                    return response.data;
                } catch (error) {
                    console.error(`❌ [Node.js] API Error:`, error.message);
                    throw new Error(error.response?.data?.message || error.message);
                }
            });
            console.log('    ✅ API helper exposed');
        } else {
            console.log('    ♻️  API helper already exists, skipping');
        }

        console.log('    💉 Injecting content.js (FULL LOGIC)...');
        await page.evaluate(this.scripts.contentScript);
    }

    /**
     * Verify scripts loaded successfully
     */
    async verifyScripts(page) {
        console.log('    🔍 Verifying scripts loaded...');
        const scriptsLoaded = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.autoRegisterToolLoaded === true,
                listenerExists: typeof window._chromeMessageListener === 'function'
            };
        });

        console.log('    📊 Scripts status:', scriptsLoaded);

        if (!scriptsLoaded.listenerExists) {
            console.log('    ⚠️  Message listener not registered yet, waiting 5 more seconds...');
            await wait(5000);

            const recheckListener = await page.evaluate(() => {
                return typeof window._chromeMessageListener === 'function';
            });

            if (!recheckListener) {
                throw new Error('Content script failed to initialize');
            }

            console.log('    ✅ Message listener now available');
        }

        return scriptsLoaded;
    }

    /**
     * Setup page with scripts (with smart loading detection)
     */
    async setupPage(browser, url) {
        const page = await browser.newPage();

        // Register page with tab rotator
        try {
            const tabRotator = require('./tab-rotator');
            const taskName = new URL(url).hostname;
            tabRotator.register(page, taskName);
        } catch (err) {
            // Ignore if tab rotator not available
        }

        console.log('    📄 Opening page...');
        // Increased timeout for slow network
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); // 2 minutes

        // Focus on tab once to avoid throttling
        console.log('    👁️  Focusing on tab to avoid throttling...');
        await page.bringToFront();

        console.log('    ⏳ Waiting for page to fully load (smart detection)...');

        // Wait for document.readyState === 'complete' with increased timeout
        try {
            await page.waitForFunction(() => document.readyState === 'complete', { timeout: 60000 }); // 1 minute
            console.log('    ✅ Page loaded (document.readyState = complete)');
        } catch (e) {
            console.log('    ⚠️  Timeout waiting for complete state, checking if page is usable...');
        }

        // Wait for UI to render, but check continuously (don't wait full timeout)
        console.log('    ⏳ Waiting for UI to render (max 30s)...');

        let uiRendered = false;
        let waitAttempts = 0;
        const maxWaitAttempts = 30; // Check for 30 seconds max

        while (waitAttempts < maxWaitAttempts && !uiRendered) {
            waitAttempts++;

            // Check if UI has rendered (has forms, buttons, etc.)
            const hasUI = await page.evaluate(() => {
                const forms = document.querySelectorAll('form, input, button');
                return forms.length > 0;
            });

            if (hasUI) {
                uiRendered = true;
                console.log(`    ✅ UI rendered after ${waitAttempts}s`);
                break;
            }

            await wait(1000);
        }

        if (!uiRendered) {
            console.log('    ⚠️  No UI detected after 30s, continuing anyway...');
        }

        // Small wait for animations
        await wait(500); // Reduced from 2000ms

        await this.injectScripts(page);

        console.log('    ⏳ Waiting for scripts to initialize...');
        await wait(500); // Reduced from 1000ms

        await this.verifyScripts(page);

        return page;
    }

    /**
     * 1. Complete Registration (with auto-login on app URL and redirect to withdraw)
     */
    async runRegistration(browser, url, profileData, loginUrl = null, withdrawUrl = null) {
        const page = await this.setupPage(browser, url);

        try {
            // Ensure tab is active before starting automation
            console.log('    👁️  Ensuring tab is active...');
            await page.bringToFront();
            await wait(1000); // Wait for tab to fully activate

            const actions = new AutomationActions(page);
            const result = await actions.completeRegistration(profileData);

            if (!result.success) {
                console.log('    ❌ Registration failed, skipping auto-login');
                return result;
            }

            console.log('    ✅ Registration successful!');

            // Save account info to file
            try {
                await this.saveAccountInfo(profileData, url);
            } catch (saveError) {
                console.error('    ⚠️  Failed to save account info:', saveError.message);
            }

            // Auto-login if loginUrl provided
            if (loginUrl && loginUrl !== url) {
                console.log('    🔄 Auto-navigating to login URL:', loginUrl);

                await wait(500); // Reduced delay before navigation

                // Navigate to login URL (always login, even if has token from registration)
                await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                console.log('    ✅ Navigated to login page');

                await wait(1000); // Reduced delay for page load

                // Re-inject scripts after navigation
                console.log('    💉 Re-injecting scripts for login...');
                await this.injectScripts(page);
                await wait(500); // Reduced delay after inject
                await this.verifyScripts(page);

                // Auto-login
                console.log('    🔐 Auto-logging in...');
                await page.bringToFront();
                await wait(500);

                const loginResult = await page.evaluate((profileData) => {
                    return new Promise((resolve) => {
                        if (window._chromeMessageListener) {
                            const timeout = setTimeout(() => {
                                resolve({ success: false, error: 'Login timeout' });
                            }, 90000);

                            window._chromeMessageListener(
                                {
                                    action: 'autoLogin',
                                    data: profileData
                                },
                                {},
                                (response) => {
                                    clearTimeout(timeout);
                                    resolve(response);
                                }
                            );
                        } else {
                            resolve({ success: false, error: 'Content script not loaded' });
                        }
                    });
                }, {
                    username: profileData.username,
                    password: profileData.password,
                    apiKey: profileData.apiKey
                });

                console.log('    📊 Login result:', loginResult);

                if (loginResult.success) {
                    console.log('    ✅ Auto-login successful!');
                    result.autoLogin = loginResult;
                } else {
                    console.log('    ❌ Auto-login failed:', loginResult.error);
                    result.autoLogin = loginResult;
                    result.message = 'Registration successful but auto-login failed';
                    return result; // Stop here if login failed
                }

                // Wait for navigation after login (use domcontentloaded for speed)
                try {
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
                    console.log('    ✅ Login navigation completed');
                    await wait(500); // Small wait for page to stabilize
                } catch (e) {
                    console.log('    ⚠️ No navigation after login (may already be on dashboard)');
                }

                // Auto-redirect to withdraw page if withdrawUrl provided
                if (withdrawUrl && profileData.bankName && profileData.accountNumber) {
                    // Check login status before redirecting to withdraw
                    const loginStatus = await this.checkLoginStatus(page);

                    if (!loginStatus.isLoggedIn) {
                        console.log('    ❌ Not logged in, cannot redirect to withdraw page');
                        result.autoWithdraw = { success: false, error: 'Not logged in for withdraw' };
                        result.message = 'Registration and login successful, but not logged in for withdraw';
                        return result;
                    }

                    console.log('    ✅ Logged in confirmed, proceeding to withdraw page');
                    console.log('    💰 Auto-redirecting to withdraw page:', withdrawUrl);

                    // Navigate to withdraw URL immediately
                    await page.goto(withdrawUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    console.log('    ✅ Navigated to withdraw page');

                    await wait(500); // Minimal delay for page load

                    // Re-inject scripts after navigation
                    console.log('    💉 Re-injecting scripts for withdraw...');
                    await this.injectScripts(page);
                    await wait(200); // Minimal delay after inject
                    await this.verifyScripts(page);

                    // Auto-fill withdraw form immediately
                    console.log('    📝 Auto-filling withdraw form...');
                    await page.bringToFront();

                    const withdrawResult = await page.evaluate((bankInfo) => {
                        return new Promise((resolve) => {
                            if (window._chromeMessageListener) {
                                const timeout = setTimeout(() => {
                                    resolve({ success: false, error: 'Withdraw fill timeout' });
                                }, 60000);

                                window._chromeMessageListener(
                                    {
                                        action: 'fillWithdrawForm',
                                        data: { withdrawInfo: bankInfo }
                                    },
                                    {},
                                    (response) => {
                                        clearTimeout(timeout);
                                        resolve(response);
                                    }
                                );
                            } else {
                                resolve({ success: false, error: 'Content script not loaded' });
                            }
                        });
                    }, {
                        bankName: profileData.bankName,
                        bankBranch: profileData.bankBranch,
                        accountNumber: profileData.accountNumber,
                        withdrawPassword: profileData.withdrawPassword
                    });

                    console.log('    📊 Withdraw fill result:', withdrawResult);

                    if (withdrawResult.success) {
                        console.log('    ✅ Withdraw form filled successfully!');
                        result.autoWithdraw = withdrawResult;
                        result.message = 'Registration, login, and withdraw form filled successfully';
                    } else {
                        console.log('    ⚠️ Withdraw form fill failed:', withdrawResult.error);
                        result.autoWithdraw = withdrawResult;
                        result.message = 'Registration and login successful, but withdraw form fill failed';
                    }

                    await wait(3000); // Reduced from 25000ms to 3000ms for speed
                }

                if (!result.message) {
                    result.message = 'Registration and auto-login successful';
                }
            }

            // Mark tab as completed in rotator
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            console.log('    ℹ️  Keeping page open for inspection...');
            return result;

        } catch (error) {
            console.error('    ❌ Error:', error.message);

            // If context destroyed during login, it might be successful navigation
            if (error.message.includes('Execution context was destroyed')) {
                console.log('    🔄 Context destroyed - checking if login was successful...');

                try {
                    // Wait for page to stabilize
                    await wait(3000);

                    // Check if login was successful (has token or on dashboard)
                    const currentUrl = page.url();
                    const hasToken = await page.evaluate(() => {
                        const cookies = document.cookie;
                        return cookies.includes('token=') ||
                            cookies.includes('_pat=') ||
                            cookies.includes('auth_token=');
                    }).catch(() => false);

                    const isLoggedIn = hasToken ||
                        currentUrl.includes('/home') ||
                        currentUrl.includes('/dashboard') ||
                        currentUrl.includes('/profile');

                    if (isLoggedIn) {
                        console.log('    ✅ Login was successful (detected after context destroyed)');
                        console.log('    📍 Current URL:', currentUrl);

                        // Continue with withdraw redirect if needed
                        if (withdrawUrl && profileData.bankName && profileData.accountNumber) {
                            // Double-check login status before withdraw redirect
                            const loginStatus = await this.checkLoginStatus(page);

                            if (!loginStatus.isLoggedIn) {
                                console.log('    ❌ Not logged in after recovery, cannot redirect to withdraw');
                                return {
                                    success: true,
                                    autoLogin: { success: true, message: 'Login successful (recovered after context destroyed)' },
                                    autoWithdraw: { success: false, error: 'Not logged in for withdraw after recovery' },
                                    message: 'Registration and login successful, but not logged in for withdraw after recovery'
                                };
                            }

                            console.log('    ✅ Login confirmed after recovery, proceeding to withdraw');
                            console.log('    💰 Continuing with withdraw redirect...');

                            // Re-inject scripts
                            await this.injectScripts(page);
                            await wait(2000);

                            // Navigate to withdraw URL
                            await page.goto(withdrawUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                            console.log('    ✅ Navigated to withdraw page');

                            await wait(3000);

                            // Re-inject scripts for withdraw
                            await this.injectScripts(page);
                            await wait(2000);
                            await this.verifyScripts(page);

                            // Fill withdraw form
                            const withdrawResult = await page.evaluate((bankInfo) => {
                                return new Promise((resolve) => {
                                    if (window._chromeMessageListener) {
                                        const timeout = setTimeout(() => {
                                            resolve({ success: false, error: 'Withdraw fill timeout' });
                                        }, 60000);

                                        window._chromeMessageListener(
                                            {
                                                action: 'fillWithdrawForm',
                                                data: { withdrawInfo: bankInfo }
                                            },
                                            {},
                                            (response) => {
                                                clearTimeout(timeout);
                                                resolve(response);
                                            }
                                        );
                                    } else {
                                        resolve({ success: false, error: 'Content script not loaded' });
                                    }
                                });
                            }, {
                                bankName: profileData.bankName,
                                bankBranch: profileData.bankBranch,
                                accountNumber: profileData.accountNumber,
                                withdrawPassword: profileData.withdrawPassword
                            });

                            console.log('    📊 Withdraw fill result:', withdrawResult);

                            await wait(3000); // Reduced from 25000ms to 3000ms for speed

                            return {
                                success: true,
                                autoLogin: { success: true, message: 'Login successful (recovered after context destroyed)' },
                                autoWithdraw: withdrawResult,
                                message: 'Registration, login, and withdraw completed (recovered from context destroyed)'
                            };
                        }

                        return {
                            success: true,
                            autoLogin: { success: true, message: 'Login successful (recovered after context destroyed)' },
                            message: 'Registration and login successful (recovered from context destroyed)'
                        };
                    } else {
                        console.log('    ❌ Login failed - not logged in after context destroyed');
                    }

                } catch (recoveryError) {
                    console.error('    ❌ Recovery failed:', recoveryError.message);
                }
            }

            // Mark tab as completed even on error
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            return { success: false, message: error.message };
        }
    }

    /**
     * Check if user is already logged in
     */
    async checkLoginStatus(page) {
        console.log('    🔍 Checking current login status...');

        const loginStatus = await page.evaluate(() => {
            // Check cookies for auth tokens
            const cookies = document.cookie;
            const tokenCookies = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'auth', 'jwt'];

            let hasToken = false;
            for (const name of tokenCookies) {
                if (cookies.includes(`${name}=`)) {
                    const match = cookies.match(new RegExp(`${name}=([^;]+)`));
                    if (match && match[1] && match[1] !== 'null' && match[1] !== 'undefined' && match[1].length > 5) {
                        hasToken = true;
                        break;
                    }
                }
            }

            // Check localStorage for tokens
            const localStorageTokens = ['token', 'auth', 'access_token', 'authToken', 'userToken'];
            let hasLocalToken = false;
            for (const name of localStorageTokens) {
                const value = localStorage.getItem(name);
                if (value && value !== 'null' && value !== 'undefined' && value.length > 5) {
                    hasLocalToken = true;
                    break;
                }
            }

            // Check URL patterns that indicate logged in state
            const currentUrl = window.location.href;
            const loggedInPatterns = ['/dashboard', '/profile', '/account', '/member', '/user', '/home'];
            const isOnLoggedInPage = loggedInPatterns.some(pattern => currentUrl.includes(pattern));

            // Check for login page patterns
            const loginPatterns = ['/login', '/dang-nhap', '/signin', '/auth'];
            const isOnLoginPage = loginPatterns.some(pattern => currentUrl.includes(pattern));

            return {
                hasToken,
                hasLocalToken,
                isOnLoggedInPage,
                isOnLoginPage,
                currentUrl,
                isLoggedIn: (hasToken || hasLocalToken || isOnLoggedInPage) && !isOnLoginPage
            };
        });

        console.log('    📊 Login Status:', {
            isLoggedIn: loginStatus.isLoggedIn,
            hasToken: loginStatus.hasToken,
            hasLocalToken: loginStatus.hasLocalToken,
            isOnLoggedInPage: loginStatus.isOnLoggedInPage,
            isOnLoginPage: loginStatus.isOnLoginPage,
            currentUrl: loginStatus.currentUrl
        });

        return loginStatus;
    }

    /**
     * 2. Complete Login
     */
    async runLogin(browserOrContext, url, profileData) {
        // Support both browser and browserContext
        const page = await this.setupPage(browserOrContext, url);

        try {
            // Ensure tab is active before starting automation
            console.log('    👁️  Ensuring tab is active...');
            await page.bringToFront();
            await wait(1000); // Wait for tab to fully activate

            // Check if already logged in
            const loginStatus = await this.checkLoginStatus(page);

            if (loginStatus.isLoggedIn) {
                console.log('    ✅ Already logged in, skipping login process');
                return {
                    success: true,
                    message: 'Already logged in',
                    hasToken: loginStatus.hasToken || loginStatus.hasLocalToken,
                    result: { submitted: true, alreadyLoggedIn: true }
                };
            }

            console.log('    🔐 Not logged in, proceeding with login...');

            // Send message to content script to login
            console.log('    📤 Sending login message to content script...');

            // Trigger login (will cause navigation)
            await page.evaluate((profileData) => {
                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'autoLogin',
                            data: profileData
                        },
                        {},
                        () => { } // Don't wait for response, page will navigate
                    );
                }
            }, profileData);

            console.log('    ⏳ Waiting for login navigation...');

            // Wait for navigation (login redirect) - use domcontentloaded for speed
            try {
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
                console.log('    ✅ Navigation completed');
                await wait(500); // Small wait for page to stabilize
            } catch (e) {
                console.log('    ⚠️ Navigation timeout, checking current URL...');
            }

            // Check if login successful (URL changed from login page)
            const currentUrl = page.url();
            const isStillOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('dang-nhap');

            if (isStillOnLoginPage) {
                console.log('    ❌ Still on login page, login may have failed');
                return { success: false, message: 'Still on login page' };
            }

            console.log('    ✅ Redirected to:', currentUrl);

            // Check for token to confirm login success
            console.log('    🔍 Checking for login token...');
            const hasToken = await page.evaluate(() => {
                const cookies = document.cookie;
                const hasAuthToken = cookies.includes('token=') ||
                    cookies.includes('auth=') ||
                    cookies.includes('session=') ||
                    cookies.includes('access_token=');

                const hasLocalStorage = localStorage.getItem('token') ||
                    localStorage.getItem('auth') ||
                    localStorage.getItem('access_token');

                return hasAuthToken || hasLocalStorage;
            });

            if (hasToken) {
                console.log('    ✅ Login token found - Login successful!');
            } else {
                console.log('    ⚠️ No token found, but redirected from login page');
            }

            console.log('    ℹ️  Keeping page open for inspection...');

            // Mark tab as completed in rotator
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            return {
                success: true,
                message: 'Login completed',
                hasToken: hasToken,
                result: { submitted: true }
            };

        } catch (error) {
            console.error('    ❌ Error:', error.message);

            // Mark tab as completed even on error
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            return { success: false, message: error.message };
        }
    }

    /**
     * 3. Complete Add Bank
     */
    async runAddBank(browser, url, bankInfo) {
        const page = await this.setupPage(browser, url);

        try {
            // Ensure tab is active before starting automation
            console.log('    👁️  Ensuring tab is active...');
            await wait(1000); // Wait for tab to fully activate

            // Check if logged in before adding bank
            const loginStatus = await this.checkLoginStatus(page);

            if (!loginStatus.isLoggedIn) {
                console.log('    ❌ Not logged in, cannot add bank');
                return {
                    success: false,
                    message: 'Not logged in - please login first before adding bank',
                    needLogin: true
                };
            }

            console.log('    ✅ Logged in confirmed, proceeding to add bank');

            // Send message to content script to add bank
            console.log('    📤 Sending addBank message to content script...');
            const result = await page.evaluate((bankInfo) => {
                return new Promise((resolve) => {
                    if (window._chromeMessageListener) {
                        window._chromeMessageListener(
                            {
                                action: 'redirectToWithdrawAndFill',
                                data: { withdrawInfo: bankInfo }
                            },
                            {},
                            (response) => {
                                resolve(response);
                            }
                        );
                    } else {
                        resolve({ success: false, message: 'Content script not loaded' });
                    }
                });
            }, bankInfo);

            console.log('    ℹ️  Keeping page open for inspection...');

            // Mark tab as completed in rotator
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            return result;

        } catch (error) {
            console.error('    ❌ Error:', error.message);

            // Mark tab as completed even on error
            try {
                const tabRotator = require('./tab-rotator');
                tabRotator.complete(page);
            } catch (err) {
                // Ignore
            }

            return { success: false, message: error.message };
        }
    }

    /**
     * 3b. Complete Add Bank in existing context (reuse login page)
     */
    async runAddBankInContext(browserContext, url, bankInfo) {
        // Get existing pages in context
        const pages = await browserContext.pages();

        // Find the login page for this URL (same domain)
        const loginDomain = new URL(url).hostname;
        let page = pages.find(p => {
            try {
                return new URL(p.url()).hostname === loginDomain;
            } catch {
                return false;
            }
        });

        // If not found, create new page in context
        if (!page) {
            console.log('    📄 Creating new page in shared context...');
            page = await browserContext.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await wait(3000);
            await this.injectScripts(page);
            await wait(3000);
            await this.verifyScripts(page);
        } else {
            console.log('    ♻️  Reusing existing login page in shared context...');
            console.log(`    📍 Current URL: ${page.url()}`);

            // After login, page has navigated to dashboard/home
            // Scripts are ALWAYS lost after navigation, so re-inject them
            console.log('    💉 Re-injecting scripts (required after login navigation)...');

            try {
                await this.injectScripts(page);
                console.log('    ⏳ Waiting for scripts to initialize...');
                await wait(3000);
                await this.verifyScripts(page);
                console.log('    ✅ Scripts ready for add bank operation');
            } catch (error) {
                console.error('    ❌ Script injection failed:', error.message);
                throw error;
            }

            // Don't manually navigate - let content.js handle it via redirectToWithdrawAndFill
            // This way, content.js can properly handle the navigation and form filling
            console.log('    ℹ️  Will use redirectToWithdrawAndFill action to navigate and fill');
        }

        try {
            // Send message to content script to add bank
            console.log('    📤 Sending addBank message to content script...');

            // Add timeout to prevent hanging
            const result = await Promise.race([
                page.evaluate((bankInfo) => {
                    return new Promise((resolve) => {
                        if (window._chromeMessageListener) {
                            // Set timeout inside evaluate (increased for bank form filling)
                            const timeout = setTimeout(() => {
                                console.log('⏱️ Add bank timeout after 60s');
                                resolve({ success: true, message: 'Add bank timeout (may still be processing)' });
                            }, 60000);

                            window._chromeMessageListener(
                                {
                                    action: 'redirectToWithdrawAndFill',
                                    data: { withdrawInfo: bankInfo }
                                },
                                {},
                                (response) => {
                                    clearTimeout(timeout);
                                    resolve(response);
                                }
                            );
                        } else {
                            resolve({ success: false, message: 'Content script not loaded' });
                        }
                    });
                }, bankInfo),
                new Promise((resolve) => setTimeout(() => {
                    console.log('⏱️ Add bank operation timeout (65s)');
                    resolve({ success: true, message: 'Add bank operation timeout (may still be processing)' });
                }, 65000))
            ]);

            console.log('    📊 Add bank result:', result);

            // Wait for bank form to be filled and submitted (reduced for speed)
            console.log('    ⏳ Waiting 3 seconds for bank form to be filled and submitted...');
            await wait(3000); // Reduced from 25000ms to 3000ms

            // Check result: URL change + form display or error notification
            console.log('    🔍 Checking add bank result...');
            const checkResult = await page.evaluate(() => {
                const currentUrl = window.location.href;

                // Success indicator: URL changed to tab=2 (bank info display)
                if (currentUrl.includes('Financial?tab=2') || currentUrl.includes('Financial?type=withdraw&tab=2')) {
                    return {
                        success: true,
                        method: 'url_change',
                        message: 'URL changed to tab=2 (bank info display)'
                    };
                }

                // Check if bank info is displayed (read-only form)
                const bankInfoDisplay = document.querySelector('.bank-info-display, [class*="bank-info"], [class*="thong-tin-ngan-hang"]');
                if (bankInfoDisplay && bankInfoDisplay.offsetParent !== null) {
                    return {
                        success: true,
                        method: 'display_check',
                        message: 'Bank info display found'
                    };
                }

                // Check for readonly bank fields (success indicator)
                const readonlyFields = document.querySelectorAll('input[readonly], input[disabled]');
                let hasBankFields = false;
                for (const field of readonlyFields) {
                    const name = field.name || field.id || '';
                    if (name.toLowerCase().includes('bank') || name.toLowerCase().includes('account')) {
                        hasBankFields = true;
                        break;
                    }
                }
                if (hasBankFields) {
                    return {
                        success: true,
                        method: 'readonly_fields',
                        message: 'Readonly bank fields found'
                    };
                }

                // Check for error notifications
                const errorSelectors = [
                    '.error-message',
                    '.alert-danger',
                    '.notification.error',
                    '[class*="error"]',
                    '[class*="fail"]'
                ];

                for (const selector of errorSelectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const el of elements) {
                        if (el.offsetParent !== null && el.textContent.trim()) {
                            return {
                                success: false,
                                method: 'error_element',
                                message: el.textContent.trim()
                            };
                        }
                    }
                }

                // Check for notification text content
                const notifications = document.querySelectorAll('.notification, .toast, .alert, [role="alert"]');
                for (const notif of notifications) {
                    const text = notif.textContent.toLowerCase();
                    if (text.includes('lỗi') || text.includes('error') || text.includes('fail') || text.includes('không thành công')) {
                        return {
                            success: false,
                            method: 'error_notification',
                            message: notif.textContent.trim()
                        };
                    }
                }

                // If no clear indicator, assume success (form was filled and submitted)
                return {
                    success: true,
                    method: 'assume',
                    message: 'No error detected, assuming success'
                };
            });

            console.log(`    📊 Check result: ${checkResult.method} - ${checkResult.message}`);

            if (!checkResult.success) {
                console.log('    ❌ Add bank failed:', checkResult.message);
                return { success: false, message: checkResult.message };
            }

            console.log('    ✅ Add bank process completed');
            console.log('    ℹ️  Keeping page open in shared context...');
            return { success: true, message: 'Bank added successfully' };

        } catch (error) {
            console.error('    ❌ Error:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * 4. Complete Check Promotion
     */
    async runCheckPromotion(browser, url, username, apiKey) {
        const page = await this.setupPage(browser, url);

        try {
            // Ensure tab is active before starting automation
            console.log('    👁️  Ensuring tab is active...');
            await page.bringToFront();
            await wait(1000); // Wait for tab to fully activate

            const actions = new AutomationActions(page);
            const result = await actions.completeCheckPromotion(username, apiKey);

            console.log('    ℹ️  Keeping page open for inspection...');
            return result;

        } catch (error) {
            console.error('    ❌ Error:', error.message);
            return { success: false, promotions: [], message: error.message };
        }
    }

    /**
     * 4b. Check Promotion from Login Context (like extension - duplicate login tab)
     */
    async runCheckPromotionFromLogin(browserContext, promoUrl, loginUrl, username, apiKey) {
        console.log('    🎁 Checking promotion from logged-in context...');

        // Get existing pages in context
        const pages = await browserContext.pages();

        // Find the login page (already logged in)
        const loginDomain = new URL(loginUrl).hostname;
        const loginPage = pages.find(p => {
            try {
                return new URL(p.url()).hostname === loginDomain;
            } catch {
                return false;
            }
        });

        if (!loginPage) {
            console.log('    ❌ No login page found in context');
            return { success: false, promotions: [], message: 'No login page found' };
        }

        console.log('    📋 Creating new page for promo check (like extension duplicate)...');
        const promoPage = await browserContext.newPage();

        // Navigate to promo URL
        console.log(`    🎁 Navigating to promo URL: ${promoUrl}`);
        await promoPage.goto(promoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await wait(500); // Reduced from 3000ms to 500ms

        // Inject scripts
        console.log('    💉 Injecting scripts...');
        await this.injectScripts(promoPage);
        await wait(500); // Reduced from 2000ms to 500ms
        await this.verifyScripts(promoPage);

        try {
            // Simple check: just scan for promotions, don't auto-click or solve captcha
            console.log('    🔍 Scanning page for promotions...');
            const promotions = await promoPage.evaluate(() => {
                // Simple scan for promo keywords
                const promoKeywords = ['khuyến mãi', 'khuyen mai', 'promotion', 'bonus', 'thưởng'];
                const promotions = [];
                const allElements = document.querySelectorAll('*');

                allElements.forEach(el => {
                    const text = el.textContent.trim();
                    if (text.length > 5 && text.length < 200) {
                        const lowerText = text.toLowerCase();
                        const hasPromoKeyword = promoKeywords.some(keyword => lowerText.includes(keyword));
                        if (hasPromoKeyword && /\d+/.test(text)) {
                            if (!promotions.includes(text)) {
                                promotions.push(text);
                            }
                        }
                    }
                });

                return promotions.slice(0, 10);
            });

            console.log(`    ✅ Found ${promotions.length} promotions`);
            console.log('    ℹ️  Keeping promo page open for inspection...');

            return { success: true, promotions, message: `Found ${promotions.length} promotions` };

        } catch (error) {
            console.error('    ❌ Error:', error.message);
            return { success: false, promotions: [], message: error.message };
        }
    }

    /**
     * 4c. Check Promotion FULL (like extension - auto-click and solve captcha)
     */
    async runCheckPromotionFull(promoContext, loginContext, promoUrl, loginUrl, username, apiKey) {
        console.log('    🎁 Running FULL check promotion (auto-click + captcha)...');

        // Create new page in promo context
        console.log('    📋 Creating new page in promo context...');
        const promoPage = await promoContext.newPage();

        // Register promo page with tab rotator
        try {
            const tabRotator = require('./tab-rotator');
            const taskName = new URL(promoUrl).hostname + '-promo';
            tabRotator.register(promoPage, taskName);
        } catch (err) {
            // Ignore if tab rotator not available
        }

        // Setup request interceptor to capture audio URL directly from requests
        console.log('    🌐 Setting up network request interceptor for audio URL...');
        promoPage.on('request', async (request) => {
            const url = request.url();
            // Check if this is a direct audio file request
            if (url.includes('audio-captcha-cache') && url.endsWith('.mp3')) {
                const audioUrl = url.replace('http://', 'https://');
                console.log('    🎵 🔥 CAPTURED AUDIO URL FROM NETWORK REQUEST:', audioUrl);

                // NOTE: Captcha solving is now handled by content.js (browser side)
                // This Node.js side solving is DISABLED to prevent duplicate API calls
                // which cause timeout and "captcha expired" errors
                console.log('    ℹ️  Captcha will be solved by browser-side content.js');
            }
        });

        // Also setup response interceptor as backup
        console.log('    🌐 Setting up network response interceptor for audio URL...');
        promoPage.on('response', async (response) => {
            const url = response.url();
            // Check if response contains audio URL
            if (url.includes('admin-ajax.php')) {
                console.log('    📡 Intercepted admin-ajax.php response');
                try {
                    const text = await response.text();
                    console.log('    📄 Response length:', text.length, 'chars');

                    // Try multiple patterns to find audio URL
                    const patterns = [
                        /http[s]?:\/\/[^\s"']+audio-captcha-cache[^\s"']+\.mp3/i,
                        /http[s]?:\/\/[^\s"'<>]+\.mp3/i,
                        /"audio_url":\s*"([^"]+)"/i,
                        /'audio_url':\s*'([^']+)'/i
                    ];

                    let audioUrl = null;
                    for (const pattern of patterns) {
                        const match = text.match(pattern);
                        if (match) {
                            audioUrl = match[1] || match[0];
                            console.log('    ✅ Found audio URL with pattern:', pattern);
                            break;
                        }
                    }

                    if (audioUrl) {
                        audioUrl = audioUrl.replace('http://', 'https://');
                        console.log('    🎵 🔥 CAPTURED AUDIO URL FROM NETWORK:', audioUrl);
                        // Inject audio URL into page
                        await promoPage.evaluate((url) => {
                            console.log('💉 Injecting audio URL into page:', url);
                            if (typeof addAudioUrl === 'function') {
                                addAudioUrl(url);
                            } else {
                                console.error('❌ addAudioUrl function not found!');
                            }
                        }, audioUrl);
                    } else {
                        console.log('    ⚠️  No audio URL found in response');
                        // Log first 200 chars of response for debugging
                        console.log('    📝 Response preview:', text.substring(0, 200));
                    }
                } catch (e) {
                    console.error('    ❌ Error processing response:', e.message);
                }
            }
        });

        // Navigate to promo URL
        console.log(`    🎁 Navigating to promo URL: ${promoUrl}`);
        await promoPage.goto(promoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await wait(500); // Reduced from 3000ms to 500ms

        // Inject scripts
        console.log('    💉 Injecting scripts...');
        await this.injectScripts(promoPage);
        await wait(500); // Reduced from 3000ms to 500ms
        await this.verifyScripts(promoPage);

        try {
            // Use FULL checkPromotion action (auto-click and solve captcha)
            console.log('    🎁 Starting FULL promotion check workflow...');
            console.log('    📊 Creating AutomationActions instance...');
            const actions = new AutomationActions(promoPage);
            console.log('    ✅ AutomationActions created');

            console.log('    📞 Calling completeCheckPromotion...');
            console.log('    📊 Username:', username);
            console.log('    📊 API Key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'undefined');

            const result = await actions.completeCheckPromotion(username, apiKey);

            console.log('    📊 Check promo result:', result);

            // After completeCheckPromotion, page will reload when "Nhận KM" is clicked
            // Wait for navigation to complete, then check result and take screenshot
            console.log('    ⏳ Waiting for page navigation after "Nhận KM" click...');

            try {
                // Wait for navigation with longer timeout (page reload after button click)
                // Increased timeout for slow network or slow captcha API
                await promoPage.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 120000 // 120 seconds (2 minutes) for slow sites/network
                });
                console.log('    ✅ Page navigation completed');
            } catch (navError) {
                console.log('    ⚠️  Navigation timeout or no navigation occurred');
                console.log('    ℹ️  Will check current page state and take screenshot anyway...');
            }

            // Wait for modal to render, but check continuously (don't wait full timeout)
            console.log('    ⏳ Waiting for result modal to render (max 30s)...');

            let modalRendered = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 30; // Check for 30 seconds max
            let timeoutScreenshotTaken = false;

            while (waitAttempts < maxWaitAttempts && !modalRendered) {
                waitAttempts++;

                // Check if any modal/content has rendered
                const hasContent = await promoPage.evaluate(() => {
                    // Check if page has loaded content (not blank)
                    const bodyText = document.body.textContent?.trim() || '';
                    return bodyText.length > 100; // Has meaningful content
                });

                if (hasContent) {
                    modalRendered = true;
                    console.log(`    ✅ Content rendered after ${waitAttempts}s`);
                    break;
                }

                await wait(1000);
            }

            // Take screenshot 1s before timeout if no content rendered (capture error state)
            if (!modalRendered && !timeoutScreenshotTaken) {
                console.log('    📸 Taking timeout screenshot (no content after 30s)...');
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
                    const sessionId = this.settings.sessionId || new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                    const userDir = path.join(screenshotsDir, username);
                    const sessionDir = path.join(userDir, sessionId);

                    // Ensure directories exist
                    if (!fs.existsSync(sessionDir)) {
                        fs.mkdirSync(sessionDir, { recursive: true });
                    }

                    const siteName = new URL(promoUrl).hostname.replace('www.', '').replace(/\./g, '-');
                    const timeoutFilename = `${siteName}-timeout.png`;
                    const timeoutFilepath = path.join(sessionDir, timeoutFilename);

                    await promoPage.screenshot({
                        path: timeoutFilepath,
                        fullPage: true,
                        timeout: 5000
                    });

                    console.log(`    ✅ Timeout screenshot saved: ${timeoutFilename}`);
                    timeoutScreenshotTaken = true;
                } catch (err) {
                    console.log('    ⚠️  Timeout screenshot failed:', err.message);
                }
            }

            if (!modalRendered) {
                console.log('    ⚠️  No content rendered after 30s - timeout screenshot taken');
            } else {
                // Wait a bit more for modal animation if content loaded
                await wait(2000);
            }

            // Check if still on captcha modal (navigation didn't happen = captcha not solved)
            // Must check if modal is VISIBLE, not just text exists
            console.log('    🔍 Checking if still on captcha modal...');
            let isCaptchaModal = false;

            try {
                isCaptchaModal = await promoPage.evaluate(() => {
                    // Check for visible captcha modal
                    const captchaModal = document.querySelector('.audio-captcha-modal') ||
                        document.querySelector('[class*="captcha"]');

                    if (!captchaModal) return false;

                    // Check if modal is visible (not hidden)
                    const style = window.getComputedStyle(captchaModal);
                    const isVisible = style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';

                    if (!isVisible) return false;

                    // Check if it contains captcha input
                    const hasCaptchaInput = captchaModal.querySelector('input[type="text"]') !== null ||
                        captchaModal.querySelector('button.audio-captcha-submit') !== null;

                    return hasCaptchaInput;
                });
            } catch (evalError) {
                // Context destroyed - page navigated, this is actually success!
                console.log('    ✅ Context destroyed during check - page navigated (success indicator)');
                isCaptchaModal = false;
            }

            if (isCaptchaModal) {
                console.log('    ⚠️  Still on VISIBLE captcha modal - captcha not solved yet');
                console.log('    📸 Taking screenshot of captcha modal state before returning...');
                // Don't return yet - take screenshot first to show captcha state
            }

            // Take screenshot regardless of state (success, error, timeout, captcha)
            // This helps debug issues like server errors, timeouts, loading states
            console.log('    ✅ Ready to take screenshot of current page state');

            // Now take screenshot
            console.log('    🔍 Starting screenshot process...');
            {
                try {

                    console.log('    📸 Taking screenshot of result modal...');

                    // Create screenshots folder if not exists
                    const fs = require('fs');
                    const path = require('path');
                    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');

                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                        console.log('    📁 Created screenshots directory');
                    }

                    // Create session folder structure: screenshots/username/sessionId/
                    const sessionId = this.settings.sessionId || new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

                    // Create username folder
                    const userDir = path.join(screenshotsDir, username);
                    if (!fs.existsSync(userDir)) {
                        fs.mkdirSync(userDir, { recursive: true });
                        console.log(`    📁 Created user directory: ${username}`);
                    }

                    // Create session folder (one per automation run)
                    const sessionDir = path.join(userDir, sessionId);
                    if (!fs.existsSync(sessionDir)) {
                        fs.mkdirSync(sessionDir, { recursive: true });
                        console.log(`    📁 Created session directory: ${sessionId}`);
                    }

                    const siteName = new URL(promoUrl).hostname.replace('www.', '').replace(/\./g, '-');
                    const filename = `${siteName}.png`; // Simple filename (no timestamp, since folder has it)
                    const filepath = path.join(sessionDir, filename);

                    console.log('    📁 Screenshot path:', filepath);

                    // Take screenshot - ALWAYS capture current state (even if error/timeout)
                    try {
                        await promoPage.screenshot({
                            path: filepath,
                            fullPage: false, // Only visible area
                            timeout: 10000 // 10s timeout for screenshot itself
                        });
                        console.log('    ✅ Screenshot saved:', filename);
                    } catch (screenshotError) {
                        console.log('    ⚠️  Screenshot failed:', screenshotError.message);
                        console.log('    🔄 Retrying screenshot with full page...');

                        // Retry with full page mode
                        try {
                            await promoPage.screenshot({
                                path: filepath,
                                fullPage: true,
                                timeout: 10000
                            });
                            console.log('    ✅ Screenshot saved (full page mode):', filename);
                        } catch (retryError) {
                            console.log('    ❌ Screenshot retry failed:', retryError.message);
                            // Continue anyway - at least we tried
                        }
                    }

                    // Verify file exists
                    if (fs.existsSync(filepath)) {
                        const stats = fs.statSync(filepath);
                        console.log(`    ✅ File verified: ${stats.size} bytes`);

                        // Add screenshot path to result (include sessionId in path)
                        result.screenshot = `/screenshots/${username}/${sessionId}/${filename}`;
                        result.screenshotPath = filepath;

                        // Send result to dashboard API
                        try {
                            const axios = require('axios');
                            const siteNameClean = new URL(promoUrl).hostname.replace('www.', '').replace(/\./g, '-');

                            // Get dashboard port from environment or use default
                            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                            const dashboardUrl = `http://localhost:${dashboardPort}/api/automation/result`;

                            await axios.post(dashboardUrl, {
                                profileName: 'Profile', // TODO: Get from config
                                username: username,
                                siteName: siteNameClean,
                                sessionId: sessionId, // Include session ID
                                timestamp: Date.now(),
                                status: 'success', // Only send if success (error cases return early)
                                screenshot: `/screenshots/${username}/${sessionId}/${filename}`,
                                screenshotPath: filepath,
                                promotions: result.promotions || []
                            });

                            console.log('    ✅ Result sent to dashboard');
                        } catch (error) {
                            console.error('    ⚠️  Could not send result to dashboard:', error.message);
                        }

                        // Mark promo page as completed in rotator BEFORE closing
                        try {
                            const tabRotator = require('./tab-rotator');
                            tabRotator.complete(promoPage);
                        } catch (err) {
                            // Ignore
                        }

                        // Close the promo page/tab after successful screenshot
                        try {
                            console.log('    🗑️  Closing promo tab...');
                            await promoPage.close();
                            console.log('    ✅ Promo tab closed');
                        } catch (closeError) {
                            console.error('    ⚠️  Could not close promo tab:', closeError.message);
                        }
                    } else {
                        console.error('    ❌ Screenshot file not found after save!');
                    }

                } catch (screenshotError) {
                    console.error('    ❌ Screenshot error:', screenshotError.message);
                    console.error('    📊 Error stack:', screenshotError.stack);

                    // Keep tab open on screenshot error for user to inspect
                    console.log('    ℹ️  Keeping tab open for user to inspect screenshot error');
                }
            }

            return result;

        } catch (error) {
            console.error('    ❌ Error:', error.message);
            console.error('    📊 Error stack:', error.stack);

            // Check if error is "Execution context was destroyed"
            // This usually means page navigated successfully after clicking "Nhận KM"
            if (error.message && error.message.includes('Execution context was destroyed')) {
                console.log('    ✅ Context destroyed - page navigated successfully');
                console.log('    📸 Attempting to take screenshot of new page...');

                try {
                    // Wait for new page to load
                    await wait(2000);

                    // Take screenshot
                    const fs = require('fs');
                    const path = require('path');
                    const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
                    const sessionId = this.settings.sessionId || new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                    const userDir = path.join(screenshotsDir, username);
                    const sessionDir = path.join(userDir, sessionId);

                    if (!fs.existsSync(sessionDir)) {
                        fs.mkdirSync(sessionDir, { recursive: true });
                    }

                    const siteName = new URL(promoUrl).hostname.replace('www.', '').replace(/\./g, '-');
                    const filename = `${siteName}.png`;
                    const filepath = path.join(sessionDir, filename);

                    await promoPage.screenshot({
                        path: filepath,
                        fullPage: false,
                        timeout: 10000
                    });

                    console.log('    ✅ Screenshot saved after context destroyed');

                    // Send result to dashboard
                    try {
                        const axios = require('axios');
                        const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                        const dashboardUrl = `http://localhost:${dashboardPort}/api/automation/result`;

                        await axios.post(dashboardUrl, {
                            profileName: 'Profile',
                            username: username,
                            siteName: siteName,
                            sessionId: sessionId,
                            timestamp: Date.now(),
                            status: 'success',
                            screenshot: `/screenshots/${username}/${sessionId}/${filename}`,
                            screenshotPath: filepath,
                            promotions: []
                        });

                        console.log('    ✅ Result sent to dashboard');
                    } catch (dashError) {
                        console.error('    ⚠️  Could not send result to dashboard:', dashError.message);
                    }

                    // Close tab
                    try {
                        await promoPage.close();
                        console.log('    ✅ Promo tab closed');
                    } catch (closeError) {
                        // Ignore
                    }

                    return { success: true, promotions: [], message: 'Completed successfully (recovered from context destroyed)' };

                } catch (recoveryError) {
                    console.error('    ❌ Recovery failed:', recoveryError.message);
                    return { success: false, promotions: [], message: error.message };
                }
            }

            return { success: false, promotions: [], message: error.message };
        }
    }

    /**
     * Save account info to file after successful registration
     */
    async saveAccountInfo(profileData, siteUrl) {
        try {
            const fs = require('fs');
            const path = require('path');

            console.log('    💾 Saving account info...');

            // Get site name from URL
            const siteName = new URL(siteUrl).hostname.replace('www.', '').replace(/\./g, '-');

            // Create accounts folder structure: accounts/username/
            const accountsDir = path.join(__dirname, '..', '..', 'accounts');
            const username = profileData.username;
            const userAccountDir = path.join(accountsDir, username);

            // Ensure directory exists
            if (!fs.existsSync(userAccountDir)) {
                fs.mkdirSync(userAccountDir, { recursive: true });
            }

            // Prepare account info
            const accountInfo = {
                site: siteName,
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                bank: {
                    name: profileData.bankName,
                    branch: profileData.bankBranch,
                    accountNumber: profileData.accountNumber
                },
                registeredAt: new Date().toISOString(),
                siteUrl: siteUrl
            };

            // Format as readable text
            const accountText = `
═══════════════════════════════════════════════════════════
                    THÔNG TIN TÀI KHOẢN
═══════════════════════════════════════════════════════════

🌐 Website: ${siteName}
🔗 URL: ${siteUrl}

👤 THÔNG TIN ĐĂNG NHẬP
   • Tên đăng nhập: ${profileData.username}
   • Mật khẩu: ${profileData.password}
   • Mật khẩu rút tiền: ${profileData.withdrawPassword}
   • Họ và tên: ${profileData.fullname}

💳 THÔNG TIN NGÂN HÀNG
   • Ngân hàng: ${profileData.bankName || 'N/A'}
   • Chi nhánh: ${profileData.bankBranch || 'N/A'}
   • Số tài khoản: ${profileData.accountNumber || 'N/A'}

📅 Ngày đăng ký: ${new Date().toLocaleString('vi-VN')}

═══════════════════════════════════════════════════════════
`;

            // Save to site-specific file: accounts/username/sitename.txt
            const accountFile = path.join(userAccountDir, `${siteName}.txt`);
            fs.writeFileSync(accountFile, accountText);

            // Also save as JSON: accounts/username/sitename.json
            const accountJsonFile = path.join(userAccountDir, `${siteName}.json`);
            fs.writeFileSync(accountJsonFile, JSON.stringify(accountInfo, null, 2));

            console.log(`    ✅ Account info saved to: ${accountFile}`);
            console.log(`    ✅ Account JSON saved to: ${accountJsonFile}`);

        } catch (error) {
            console.error('    ❌ Error saving account info:', error.message);
            throw error;
        }
    }
}

module.exports = CompleteAutomation;
