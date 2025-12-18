/**
 * Auto Sequence Safe - Version an toàn với error handling để tránh tab đóng
 * 
 * FreeLXB-style anti-throttle techniques:
 * 1. Periodic tab activation to prevent browser throttling
 * 2. State persistence for resume capability
 * 3. Visibility API handling
 */

const CompleteAutomation = require('./complete-automation');

class AutoSequenceSafe {
    constructor(settings, scripts) {
        this.settings = settings;
        this.automation = new CompleteAutomation(settings, scripts);
        this.activeTabs = new Map(); // Track active tabs for rotation
        this.completedTabs = new Set(); // Track tabs that completed register+bank (don't need activation)
        this.tabActivationInterval = null;

        // Separate rotation for shared promo context
        this.promoTabs = new Map(); // Track promo tabs for rotation
        this.promoActivationInterval = null;
    }

    /**
     * Mark a tab as completed (register + bank done)
     * Completed tabs don't need activation rotation anymore
     */
    markTabCompleted(siteName) {
        this.completedTabs.add(siteName);
        console.log(`✅ Tab marked as completed: ${siteName} (${this.completedTabs.size} completed)`);
    }

    /**
     * Check if a tab is completed
     */
    isTabCompleted(siteName) {
        return this.completedTabs.has(siteName);
    }

    /**
     * FreeLXB-style: Start periodic tab activation to prevent throttling
     * Only rotates through INCOMPLETE tabs (not completed register+bank)
     */
    startTabActivation(pages, siteNames = []) {
        if (this.tabActivationInterval) {
            clearInterval(this.tabActivationInterval);
        }

        let currentIndex = 0;

        console.log(`🔄 Starting smart tab rotation (FreeLXB-style)`);

        this.tabActivationInterval = setInterval(async () => {
            try {
                // Filter: only pages that are open AND not completed
                const activePages = pages.filter((p, i) => {
                    if (!p || p.isClosed()) return false;
                    const siteName = siteNames[i];
                    // Skip completed tabs (register + bank done)
                    if (siteName && this.isTabCompleted(siteName)) return false;
                    return true;
                });

                if (activePages.length === 0) {
                    console.log('🛑 All tabs completed or closed, stopping rotation');
                    this.stopTabActivation();
                    return;
                }

                // Rotate to next incomplete tab
                currentIndex = (currentIndex + 1) % activePages.length;
                const page = activePages[currentIndex];

                if (page && !page.isClosed()) {
                    await page.bringToFront();
                    await new Promise(r => setTimeout(r, 100));
                }
            } catch (e) {
                // Ignore errors during rotation
            }
        }, 2000); // Rotate every 2 seconds
    }

    /**
     * Stop tab activation rotation
     */
    stopTabActivation() {
        if (this.tabActivationInterval) {
            clearInterval(this.tabActivationInterval);
            this.tabActivationInterval = null;
            console.log('🛑 Stopped tab rotation');
        }
    }

    /**
     * Start promo tab activation rotation (separate from main tabs)
     */
    startPromoTabActivation(sharedPromoContext) {
        if (!sharedPromoContext) return;

        if (this.promoActivationInterval) {
            clearInterval(this.promoActivationInterval);
        }

        console.log(`🎁 Starting promo tab rotation for shared context`);

        this.promoActivationInterval = setInterval(async () => {
            try {
                // Get all pages in promo context
                const promoPages = await sharedPromoContext.pages();
                const activePromoPages = promoPages.filter(page => !page.isClosed());

                if (activePromoPages.length === 0) {
                    console.log('🛑 No active promo tabs, stopping promo rotation');
                    this.stopPromoTabActivation();
                    return;
                }

                // Rotate through promo tabs
                for (const page of activePromoPages) {
                    try {
                        await page.bringToFront();
                        await new Promise(r => setTimeout(r, 200));
                    } catch (e) {
                        // Page might be closed, skip
                    }
                }
            } catch (error) {
                console.warn('⚠️ Promo tab rotation error:', error.message);
                // If context is destroyed, stop rotation
                if (error.message.includes('Target closed') || error.message.includes('Protocol error')) {
                    this.stopPromoTabActivation();
                }
            }
        }, 3000); // Every 3 seconds
    }

    /**
     * Stop promo tab activation rotation
     */
    stopPromoTabActivation() {
        if (this.promoActivationInterval) {
            clearInterval(this.promoActivationInterval);
            this.promoActivationInterval = null;
            console.log('🛑 Stopped promo tab rotation');
        }
    }

    /**
     * FreeLXB-style: Activate a specific tab before operation
     */
    async activateTab(page) {
        if (!page || page.isClosed()) return false;

        try {
            await page.bringToFront();
            // Small delay to ensure tab is active
            await new Promise(r => setTimeout(r, 200));
            return true;
        } catch (e) {
            console.warn('⚠️ Could not activate tab:', e.message);
            return false;
        }
    }

    /**
     * Safe wrapper để tránh tab đóng
     */
    async safeExecute(fn, context = 'unknown') {
        try {
            console.log(`🛡️ Safe Execute: Starting ${context}...`);
            const result = await fn();
            console.log(`✅ Safe Execute: ${context} completed successfully`);
            return result;
        } catch (error) {
            console.error(`❌ Safe Execute: ${context} failed:`, error);
            console.error(`📍 Stack trace:`, error.stack);

            // Return safe error result instead of throwing
            return {
                success: false,
                error: error.message,
                context: context,
                safeMode: true
            };
        }
    }

    /**
     * Kiểm tra và khôi phục page context nếu bị destroy
     */
    async ensurePageContext(page, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Test page context
                await page.evaluate(() => document.title);
                return true;
            } catch (e) {
                console.log(`⚠️ Page context test failed (attempt ${i + 1}):`, e.message);

                if (e.message.includes('Execution context was destroyed')) {
                    console.log(`🔄 Attempting to reload page...`);
                    try {
                        await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (reloadError) {
                        console.log(`❌ Reload failed:`, reloadError.message);
                        if (i === maxRetries - 1) {
                            throw new Error(`Cannot restore page context after ${maxRetries} attempts`);
                        }
                    }
                } else {
                    throw e;
                }
            }
        }
        return false;
    }

    /**
     * Tạo browser context riêng cho checkPromo với settings tối ưu
     */
    async createPromoContext(browser, siteName) {
        try {
            console.log(`🔧 Creating optimized browser context for ${siteName} checkPromo...`);

            const context = await browser.createBrowserContext({
                // Tối ưu cho checkPromo: không cần lưu cache, cookie, etc.
                ignoreHTTPSErrors: true,
                bypassCSP: true
            });

            // Set user agent giống main browser
            const pages = await context.pages();
            if (pages.length > 0) {
                await pages[0].setUserAgent(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                );
            }

            console.log(`✅ Browser context created for ${siteName} checkPromo`);
            return context;
        } catch (error) {
            console.log(`❌ Failed to create browser context for ${siteName}:`, error.message);
            throw error;
        }
    }

    /**
     * Save account info once (shared for all sites)
     * Lưu 1 file duy nhất vì tất cả sites dùng chung account
     */
    async saveAccountInfoOnce(profileData, firstSiteName, allSites = []) {
        try {
            console.log('    💾 Saving shared account info via API...');

            // Prepare account info (giống taiapp)
            const accountInfo = {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                email: profileData.email || '',
                phone: profileData.phone || '',
                bank: {
                    name: profileData.bankName,
                    branch: profileData.bankBranch || 'Thành phố Hồ Chí Minh',
                    accountNumber: profileData.accountNumber,
                    accountHolder: profileData.fullname
                },
                registeredAt: new Date().toISOString(),
                firstSite: firstSiteName,
                sites: allSites.map(s => s.name || s), // Lưu danh sách tất cả sites
                status: 'active',
                tool: 'nohu-sms'
            };

            // Get dashboard port (dynamic)
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            const apiUrl = `http://localhost:${dashboardPort}/api/accounts/nohu/${profileData.username}`;
            console.log(`    📍 API URL: ${apiUrl}`);

            // Call API to save account info
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountInfo)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`    ✅ Account info saved via API:`, result.message);

        } catch (error) {
            console.error('    ❌ Error saving account info:', error.message);
            throw error;
        }
    }

    /**
     * Get site URLs by name - fetch from server (centralized config)
     * URLs are managed in server.js for both app and SMS
     */
    getSiteUrls(siteName) {

        // Check if this is SMS promo site (has -SMS suffix)
        let cleanSiteName = siteName;
        let isSmsPromo = false;
        if (siteName.endsWith('-SMS')) {
            cleanSiteName = siteName.replace('-SMS', '');
            isSmsPromo = true;
        }

        // Get URLs from global config (set by server.js on startup)
        let registerUrl = null;
        let promoUrl = null;

        // Try to get from global cache first
        if (global.nohuSitesConfig && global.nohuSitesConfig[cleanSiteName]) {
            const siteConfig = global.nohuSitesConfig[cleanSiteName];
            registerUrl = siteConfig.registerUrl;
            promoUrl = siteConfig.checkPromoUrl;
        }

        // For SMS promo, use SMS URL if available
        if (isSmsPromo && global.nohuSmsSiteConfigs && global.nohuSmsSiteConfigs[cleanSiteName]) {
            const smsUrl = global.nohuSmsSiteConfigs[cleanSiteName].registerSmsUrl;
            if (smsUrl) {
                registerUrl = smsUrl;
            }
        }

        if (!registerUrl) {
            console.warn(`⚠️ No URL found for site: ${siteName}`);
            return null;
        }

        // Extract origin from registerUrl for withdrawUrl
        const url = new URL(registerUrl);
        const origin = url.origin;

        return {
            registerUrl: registerUrl,
            withdrawUrl: origin + '/Financial?type=withdraw',
            promoUrl: promoUrl
        };
    }

    /**
     * Run sequence for one site với comprehensive error handling
     */
    async runSequenceForSite(browser, site, profileData, sharedPromoContext = null) {
        const siteName = site.name;
        console.log(`\n🛡️ SAFE MODE: Starting sequence for ${siteName}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        console.log(`🔑 API Key available: ${profileData.apiKey ? 'YES' : 'NO'}`);

        // Get site URLs
        const siteUrls = this.getSiteUrls(siteName);
        if (!siteUrls) {
            console.error(`❌ No URLs found for site: ${siteName}`);
            return {
                site: siteName,
                register: { success: false, error: `Unknown site: ${siteName}` },
                login: { success: false },
                addBank: { success: false },
                checkPromo: { success: false }
            };
        }

        console.log(`� Site URLs fLor ${siteName}:`);
        console.log(`   Register: ${siteUrls.registerUrl}`);
        console.log(`   Withdraw: ${siteUrls.withdrawUrl}\n`);

        const results = {
            site: siteName,
            register: { success: false },
            login: { success: false },
            addBank: { success: false },
            checkPromo: { success: false }
        };

        let page = null;

        try {
            // STEP 1: Create page safely
            console.log(`🛡️ STEP 1: Creating page safely for ${siteName}...`);

            page = await this.safeExecute(async () => {
                const newPage = await browser.newPage();

                // Set error handlers to prevent crashes
                newPage.on('error', (error) => {
                    console.error(`� Page errorr for ${siteName}:`, error.message);
                });

                newPage.on('pageerror', (error) => {
                    console.error(`🚨 Page script error for ${siteName}:`, error.message);
                });

                return newPage;
            }, `Create page for ${siteName}`);

            if (!page || page.error) {
                console.error(`❌ Failed to create page for ${siteName}`);
                return results;
            }

            // STEP 2: Navigate safely
            console.log(`🛡️ STEP 2: Navigating safely to ${siteUrls.registerUrl}...`);

            const navigationResult = await this.safeExecute(async () => {
                await page.goto(siteUrls.registerUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
                return { success: true, url: page.url() };
            }, `Navigate to ${siteName}`);

            if (!navigationResult.success) {
                console.error(`❌ Navigation failed for ${siteName}:`, navigationResult.error);
                results.register.error = navigationResult.error;
                return results;
            }

            console.log(`✅ Successfully navigated to: ${navigationResult.url}`);

            // STEP 3: Inject scripts safely with retry
            console.log(`🛡️ STEP 3: Injecting scripts safely for ${siteName}...`);

            let scriptResult = { success: false };
            let scriptRetries = 0;
            const maxScriptRetries = 3;

            while (!scriptResult.success && scriptRetries < maxScriptRetries) {
                scriptRetries++;
                console.log(`💉 Script injection attempt ${scriptRetries}/${maxScriptRetries}...`);

                scriptResult = await this.safeExecute(async () => {
                    // Activate tab before injection to prevent throttling
                    await this.activateTab(page);

                    console.log('💉 Injecting all required scripts...');
                    await this.automation.injectScripts(page);
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Verify scripts loaded
                    const scriptsLoaded = await page.evaluate(() => {
                        return {
                            autoRegisterToolLoaded: window.autoRegisterToolLoaded === true,
                            listenerExists: typeof window._chromeMessageListener === 'function'
                        };
                    });

                    console.log(`📊 Scripts status for ${siteName}:`, scriptsLoaded);

                    if (!scriptsLoaded.listenerExists) {
                        throw new Error('Message listener not registered');
                    }

                    return { success: true, scriptsLoaded };
                }, `Inject scripts for ${siteName} (attempt ${scriptRetries})`);

                if (!scriptResult.success && scriptRetries < maxScriptRetries) {
                    console.log(`⚠️ Script injection failed, waiting 2s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            if (!scriptResult.success) {
                console.error(`❌ Script injection failed for ${siteName} after ${maxScriptRetries} attempts:`, scriptResult.error);
                // Continue anyway, fallback methods may still work
            } else {
                console.log(`✅ Scripts injected successfully for ${siteName}`);
            }

            // STEP 4: Try registration safely
            console.log(`🛡️ STEP 4: Attempting registration for ${siteName}...`);

            // FreeLXB-style: Activate tab before registration
            await this.activateTab(page);

            // CRITICAL: Đợi form render trước khi fill (tab nền có thể chưa render form)
            console.log(`⏳ Waiting for registration form to render for ${siteName}...`);
            const formReady = await this.safeExecute(async () => {
                let attempts = 0;
                const maxAttempts = 10; // 10 seconds max

                // Activate tab ONCE before checking form (not every iteration)
                await this.activateTab(page);

                while (attempts < maxAttempts) {
                    attempts++;

                    const hasForm = await page.evaluate(() => {
                        // Kiểm tra các form input có tồn tại và visible không
                        const accountInput = document.querySelector('input[formcontrolname="account"]');
                        const passwordInput = document.querySelector('input[formcontrolname="password"]');

                        // Kiểm tra input có visible không (offsetParent !== null)
                        const accountVisible = accountInput && accountInput.offsetParent !== null;
                        const passwordVisible = passwordInput && passwordInput.offsetParent !== null;

                        console.log(`🔍 Form check: account=${!!accountInput}(visible:${accountVisible}), password=${!!passwordInput}(visible:${passwordVisible})`);

                        return accountVisible && passwordVisible;
                    });

                    if (hasForm) {
                        console.log(`✅ Form ready after ${attempts}s for ${siteName}`);
                        return { success: true, attempts };
                    }

                    console.log(`⏳ [${attempts}/${maxAttempts}] Form not ready yet for ${siteName}, waiting...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                return { success: false, error: 'Form not rendered after 10 seconds' };
            }, `Wait for form render for ${siteName}`);

            if (!formReady.success) {
                console.error(`❌ Form not ready for ${siteName}:`, formReady.error);
                results.register = { success: false, error: 'Form not rendered - tab may be throttled' };
                // Không return, tiếp tục thử fill anyway
            }

            const registerResult = await this.safeExecute(async () => {
                // Activate tab một lần nữa trước khi fill
                await this.activateTab(page);

                const extensionResult = await page.evaluate((userData) => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({ success: false, error: 'Extension timeout' });
                        }, 60000);

                        if (window._chromeMessageListener) {
                            console.log('🔍 Extension found, trying autoFill...');
                            window._chromeMessageListener(
                                {
                                    action: 'autoFill',
                                    data: userData
                                },
                                {},
                                (response) => {
                                    clearTimeout(timeout);
                                    resolve(response || { success: false, error: 'No response' });
                                }
                            );
                        } else {
                            clearTimeout(timeout);
                            resolve({ success: false, error: 'Extension not found' });
                        }
                    });
                }, {
                    username: profileData.username,
                    password: profileData.password,
                    withdrawPassword: profileData.withdrawPassword,
                    fullname: profileData.fullname,
                    apiKey: profileData.apiKey,
                    captchaDelay: profileData.captchaDelay !== undefined ? profileData.captchaDelay : 10000
                });

                if (extensionResult.success) {
                    console.log(`✅ Extension method successful for ${siteName}`);
                    return extensionResult;
                } else {
                    console.log(`⚠️ Extension method failed for ${siteName}, trying fallback...`);
                    const fallbackResult = await this.basicFormFill(page, profileData);
                    return fallbackResult;
                }
            }, `Registration for ${siteName}`);

            if (registerResult.success) {
                console.log(`✅ Registration form submitted for ${siteName}`);

                // CRITICAL: Check token sau submit để xác nhận đăng ký thành công
                console.log(`🔍 Checking token after registration submit...`);
                let tokenCheckResult = await this.safeExecute(async () => {
                    let attempts = 0;
                    const maxAttempts = 10; // 10 seconds max (10 * 1000ms)

                    while (attempts < maxAttempts) {
                        attempts++;

                        try {
                            const status = await page.evaluate(() => {
                                const cookies = document.cookie;
                                const hasToken = cookies.includes('_pat=') ||
                                    cookies.includes('token=') ||
                                    localStorage.getItem('token') ||
                                    localStorage.getItem('auth');
                                return { hasToken: !!hasToken };
                            });

                            if (status.hasToken) {
                                console.log(`✅ Token found after ${attempts}s - Registration confirmed!`);
                                return { success: true, attempts };
                            }
                        } catch (e) {
                            console.log(`⚠️ Token check failed (attempt ${attempts}):`, e.message);
                        }

                        console.log(`⏳ [${attempts}/${maxAttempts}] No token yet, waiting...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    return { success: false, error: 'No token found after 10 seconds' };
                }, `Token check after registration for ${siteName}`);

                if (!tokenCheckResult.success) {
                    console.error(`❌ Registration failed for ${siteName}: No token received`);
                    results.register = { success: false, error: 'No token after 10 seconds - registration failed' };
                    return results; // Dừng luôn, không tiếp tục
                }

                console.log(`✅ Registration successful for ${siteName}`);
                results.register = { success: true, method: registerResult.method || 'unknown' };
                results.login = { success: true, message: 'Confirmed by token' };

                // Lưu thông tin tài khoản sau khi đăng ký thành công (chỉ lưu 1 lần)
                // Tất cả sites dùng chung 1 account nên chỉ cần lưu 1 file
                if (!this.accountSaved) {
                    console.log(`💾 Saving account info (shared for all sites)...`);
                    this.accountSaved = true;
                    // Lấy danh sách sites từ profileData nếu có
                    const allSites = profileData.sites || [];
                    await this.saveAccountInfoOnce(profileData, siteName, allSites).catch(err => {
                        console.warn(`⚠️ Account save failed:`, err.message);
                        this.accountSaved = false; // Cho phép thử lại nếu lỗi
                    });
                } else {
                    console.log(`💾 Account info already saved, skipping for ${siteName}`);
                }

                // STEP 5: Add Bank Info (like FreeLXB extension)
                if (profileData.bankName && profileData.accountNumber) {
                    console.log(`💳 STEP 5: Adding bank info for ${siteName} (FreeLXB style)...`);

                    // FreeLXB-style: Activate tab before bank operation
                    await this.activateTab(page);

                    // Đăng ký xong → chờ delay 30-120s NGAY LẬP TỨC → rồi mới redirect sang Add Bank
                    console.log(`⏳ Registration completed. Starting delay before Add Bank redirect...`);
                    const randomDelay = Math.random() * (120000 - 30000) + 30000; // 30-120s
                    const delaySeconds = Math.round(randomDelay / 1000);
                    console.log(`⏳ Waiting ${delaySeconds}s before redirecting to Add Bank...`);

                    // Gửi countdown qua API (không bị mất khi page redirect)
                    const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                    const startTime = Date.now();
                    const countdownInterval = setInterval(async () => {
                        try {
                            const elapsedMs = Date.now() - startTime;
                            const remainingMs = Math.max(0, randomDelay - elapsedMs);
                            const remainingSeconds = Math.ceil(remainingMs / 1000);

                            // 🔥 Activate tab every 10s during delay to prevent throttling
                            if (elapsedMs % 10000 < 3000) {
                                try {
                                    await this.activateTab(page);
                                } catch (e) {
                                    // Ignore if page is closed
                                }
                            }

                            // Gửi countdown status qua API
                            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    profileId: profileData.profileId,
                                    username: profileData.username,
                                    status: 'running',
                                    message: `⏳ Chờ ${remainingSeconds}s trước khi chuyển sang Thêm Bank...`,
                                    timestamp: new Date().toISOString()
                                })
                            }).catch(e => console.warn('⚠️ Could not send countdown status:', e.message));
                        } catch (e) {
                            // Ignore errors
                        }
                    }, 3000);

                    await new Promise(resolve => setTimeout(resolve, randomDelay));
                    clearInterval(countdownInterval);
                    console.log(`✅ Delay completed. Now redirecting to Add Bank...`);

                    // Send final status message
                    try {
                        await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                profileId: profileData.profileId,
                                username: profileData.username,
                                status: 'running',
                                message: `🔄 Đang chuyển sang Thêm Bank...`,
                                timestamp: new Date().toISOString()
                            })
                        }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                    } catch (e) {
                        // Ignore errors
                    }

                    const bankResult = await this.safeExecute(async () => {
                        // Đảm bảo page context còn hoạt động
                        console.log(`🔍 Ensuring page context is valid...`);
                        await this.ensurePageContext(page);

                        // Sau delay, navigate sang Add Bank
                        console.log(`🔄 Navigating to withdraw page: ${siteUrls.withdrawUrl}`);
                        try {
                            await page.goto(siteUrls.withdrawUrl, {
                                waitUntil: 'domcontentloaded',
                                timeout: 150000  // Increased from 30s to 150s (delay is 30-120s)
                            });
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            // Đảm bảo page context sau navigation
                            await this.ensurePageContext(page);
                        } catch (e) {
                            console.log(`⚠️ Navigation failed:`, e.message);
                            throw new Error(`Cannot navigate to withdraw page: ${e.message}`);
                        }

                        console.log('💉 Re-injecting scripts after withdraw navigation...');
                        try {
                            // Đảm bảo page context trước khi inject
                            await this.ensurePageContext(page);
                            await this.automation.injectScripts(page);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (e) {
                            console.log(`⚠️ Script injection failed:`, e.message);
                            throw new Error(`Cannot inject scripts: ${e.message}`);
                        }

                        // Gọi fillWithdrawForm với error handling
                        let fillBankResult;
                        try {
                            fillBankResult = await page.evaluate((bankData) => {
                                return new Promise((resolve) => {
                                    const timeout = setTimeout(() => {
                                        resolve({ success: false, error: 'Bank fill timeout' });
                                    }, 60000);

                                    if (window._chromeMessageListener) {
                                        console.log('💳 Filling bank form via extension...');
                                        window._chromeMessageListener(
                                            {
                                                action: 'fillWithdrawForm',
                                                data: {
                                                    withdrawInfo: {
                                                        bankName: bankData.bankName,
                                                        bankBranch: bankData.bankBranch || 'Thành phố Hồ Chí Minh',
                                                        accountNumber: bankData.accountNumber,
                                                        withdrawPassword: bankData.withdrawPassword
                                                    }
                                                }
                                            },
                                            {},
                                            (response) => {
                                                clearTimeout(timeout);
                                                resolve(response || { success: false, error: 'No response' });
                                            }
                                        );
                                    } else {
                                        clearTimeout(timeout);
                                        resolve({ success: false, error: 'Extension not found' });
                                    }
                                });
                            }, {
                                bankName: profileData.bankName,
                                bankBranch: profileData.bankBranch || 'Thành phố Hồ Chí Minh',
                                accountNumber: profileData.accountNumber,
                                withdrawPassword: profileData.withdrawPassword
                            });
                        } catch (e) {
                            console.log(`⚠️ Bank form evaluation failed:`, e.message);
                            if (e.message.includes('Execution context was destroyed')) {
                                throw new Error(`Page context destroyed during bank form fill: ${e.message}`);
                            }
                            throw e;
                        }

                        if (!fillBankResult.success) {
                            return fillBankResult;
                        }

                        // Lưu URL trước khi submit để so sánh sau
                        const urlBeforeSubmit = await page.url();
                        console.log(`📍 URL before submit: ${urlBeforeSubmit}`);

                        // ĐỢI form được điền và submit (fillWithdrawForm cần ~5-8 giây để hoàn thành)
                        console.log(`⏳ Waiting for bank form to be filled and submitted...`);

                        // VERIFY: Kiểm tra kết quả thêm bank với nhiều lần retry
                        console.log(`🔍 Verifying bank submission result...`);

                        // Send status message
                        try {
                            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    profileId: profileData.profileId,
                                    username: profileData.username,
                                    status: 'running',
                                    message: `🔍 Đang xác minh thêm Bank...`,
                                    timestamp: new Date().toISOString()
                                })
                            }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                        } catch (e) {
                            // Ignore errors
                        }

                        // Đợi thêm để đảm bảo page đã xử lý xong
                        await new Promise(resolve => setTimeout(resolve, 3000));

                        const urlAfterSubmit = await page.url();
                        console.log(`📍 URL after submit: ${urlAfterSubmit}`);

                        // Retry verify nhiều lần vì page có thể đang reload
                        let verifyResult = null;
                        let verifyAttempts = 0;
                        const maxVerifyAttempts = 3;

                        while (verifyAttempts < maxVerifyAttempts) {
                            verifyAttempts++;
                            console.log(`🔍 Verify attempt ${verifyAttempts}/${maxVerifyAttempts}...`);

                            // Send status message for each attempt
                            try {
                                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        profileId: profileData.profileId,
                                        username: profileData.username,
                                        status: 'running',
                                        message: `🔍 Xác minh Bank (lần ${verifyAttempts}/${maxVerifyAttempts})...`,
                                        timestamp: new Date().toISOString()
                                    })
                                }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                            } catch (e) {
                                // Ignore errors
                            }

                            try {
                                verifyResult = await page.evaluate((verifyData) => {
                                    const { urlBefore, expectedFullname, expectedBranch, expectedAccountNumber } = verifyData;
                                    const currentUrl = window.location.href;

                                    // 1. Kiểm tra có modal lỗi không (thất bại = hiện modal)
                                    const errorModal = document.querySelector('.modal, .dialog, [role="dialog"], .popup, .alert-modal, .error-modal, .mat-dialog-container');
                                    const hasErrorModal = errorModal && errorModal.offsetParent !== null;

                                    // 2. Kiểm tra nội dung modal có phải lỗi không
                                    let modalErrorText = '';
                                    if (hasErrorModal) {
                                        modalErrorText = errorModal.textContent || '';
                                    }
                                    const isErrorContent = modalErrorText.includes('thất bại') ||
                                        modalErrorText.includes('Lỗi') ||
                                        modalErrorText.includes('Error') ||
                                        modalErrorText.includes('không hợp lệ') ||
                                        modalErrorText.includes('không thành công') ||
                                        modalErrorText.includes('failed');

                                    // 3. Kiểm tra form còn hiển thị không (nhiều selector hơn)
                                    const bankFormSelectors = [
                                        '[formcontrolname="bankName"]',
                                        '[formcontrolname="bank"]',
                                        '[formcontrolname="account"]',
                                        '[formcontrolname="city"]',
                                        'select[name*="bank"]',
                                        'mat-select[formcontrolname="bankName"]',
                                        'input[placeholder*="ngân hàng"]',
                                        'input[placeholder*="chi nhánh"]'
                                    ];
                                    const formStillVisible = bankFormSelectors.some(sel => {
                                        const el = document.querySelector(sel);
                                        return el && el.offsetParent !== null;
                                    });

                                    // 4. QUAN TRỌNG: Kiểm tra bank-detail div với so sánh giá trị chính xác
                                    const bankDetailDiv = document.querySelector('.bank-detail, .px-4.bank-detail');
                                    let hasBankDisplay = false;
                                    let fullnameMatch = false;
                                    let branchMatch = false;
                                    let displayedFullname = '';
                                    let displayedBranch = '';

                                    if (bankDetailDiv) {
                                        // Tìm tất cả các row trong bank-detail
                                        const rows = bankDetailDiv.querySelectorAll('.block.w-full');
                                        let displayedAccountNumber = '';

                                        rows.forEach(row => {
                                            const labelSpan = row.querySelector('span:first-child');
                                            const valueSpan = row.querySelector('span.text-right, span:last-child');

                                            if (labelSpan && valueSpan) {
                                                const label = labelSpan.textContent.trim().toUpperCase();
                                                const value = valueSpan.textContent.trim().toUpperCase();

                                                // Kiểm tra Họ và Tên (hỗ trợ cả "Họ tên thật" và "Họ và tên")
                                                if (label.includes('HỌ') && (label.includes('TÊN') || label.includes('REAL_NAME'))) {
                                                    displayedFullname = value;
                                                    // So sánh với expected fullname (trim để loại bỏ space thừa)
                                                    const normalizedExpected = (expectedFullname || '').toUpperCase().trim();
                                                    fullnameMatch = value === normalizedExpected ||
                                                        value.includes(normalizedExpected) ||
                                                        normalizedExpected.includes(value);
                                                }

                                                // Kiểm tra Chi nhánh
                                                if (label.includes('CHI NHÁNH')) {
                                                    displayedBranch = value;
                                                    // So sánh với expected branch (normalize để so sánh)
                                                    const normalizedExpectedBranch = (expectedBranch || '').toUpperCase().trim()
                                                        .replace(/THÀNH PHỐ/g, '')
                                                        .replace(/TP\./g, '')
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    const normalizedDisplayedBranch = value
                                                        .replace(/THÀNH PHỐ/g, '')
                                                        .replace(/TP\./g, '')
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    branchMatch = normalizedDisplayedBranch.includes(normalizedExpectedBranch) ||
                                                        normalizedExpectedBranch.includes(normalizedDisplayedBranch) ||
                                                        value === normalizedExpectedBranch;
                                                }

                                                // Kiểm tra Số tài khoản (chỉ check 4 số cuối vì trang che)
                                                if (label.includes('SỐ TÀI KHOẢN')) {
                                                    displayedAccountNumber = value;
                                                    // Chỉ check 4 số cuối vì trang che số
                                                    const last4Digits = (expectedAccountNumber || '').slice(-4);
                                                    // Nếu không có last4Digits thì skip check này
                                                    if (last4Digits && !value.includes(last4Digits)) {
                                                        // Account number không match - nhưng vẫn tiếp tục check fullname + branch
                                                    }
                                                }
                                            }
                                        });

                                        // Bank display thành công nếu có bank-detail div
                                        hasBankDisplay = true;
                                    }

                                    // Fallback: Kiểm tra các pattern khác nếu không tìm thấy bank-detail
                                    if (!hasBankDisplay) {
                                        const bodyText = document.body.textContent || '';
                                        hasBankDisplay =
                                            (bodyText.includes('NGÂN HÀNG') && bodyText.includes('SỐ TÀI KHOẢN')) ||
                                            document.querySelector('.bank-info, .account-info, [class*="bank-display"], [class*="withdraw-info"]') ||
                                            bodyText.includes('Sửa thông tin') ||
                                            bodyText.includes('Chỉnh sửa');
                                    }

                                    // 5. Kiểm tra toast/notification thành công
                                    const successToast = document.querySelector('.toast-success, .success-message, .alert-success');
                                    const hasSuccessToast = successToast && successToast.offsetParent !== null;

                                    // Kết quả verify chính xác: cả fullname và branch phải match
                                    const exactMatch = fullnameMatch && branchMatch;

                                    console.log('🔍 Verify results:', {
                                        hasErrorModal,
                                        isErrorContent,
                                        formStillVisible,
                                        hasBankDisplay,
                                        hasSuccessToast,
                                        fullnameMatch,
                                        branchMatch,
                                        exactMatch,
                                        displayedFullname,
                                        displayedBranch,
                                        expectedFullname,
                                        expectedBranch
                                    });

                                    return {
                                        hasErrorModal,
                                        isErrorContent,
                                        modalErrorText: modalErrorText.substring(0, 200),
                                        formStillVisible,
                                        hasBankDisplay,
                                        hasSuccessToast,
                                        fullnameMatch,
                                        branchMatch,
                                        exactMatch,
                                        displayedFullname,
                                        displayedBranch,
                                        currentUrl,
                                        urlChanged: currentUrl !== urlBefore
                                    };
                                }, {
                                    urlBefore: urlBeforeSubmit,
                                    expectedFullname: profileData.fullname,
                                    expectedBranch: profileData.bankBranch || 'Thành phố Hồ Chí Minh',
                                    expectedAccountNumber: profileData.accountNumber || ''
                                });

                                console.log(`📊 Bank verification result (attempt ${verifyAttempts}):`, verifyResult);

                                // Nếu có kết quả rõ ràng thì dừng
                                // Ưu tiên exactMatch (so sánh họ tên + chi nhánh)
                                if (verifyResult.exactMatch) {
                                    console.log(`✅ Bank verified with EXACT MATCH on attempt ${verifyAttempts}`);
                                    console.log(`   Fullname: "${verifyResult.displayedFullname}" matches "${profileData.fullname}"`);
                                    console.log(`   Branch: "${verifyResult.displayedBranch}" matches "${profileData.bankBranch}"`);
                                    break;
                                }

                                if (verifyResult.hasBankDisplay || verifyResult.hasSuccessToast) {
                                    console.log(`✅ Bank display found on attempt ${verifyAttempts}`);
                                    break;
                                }

                                if (verifyResult.hasErrorModal && verifyResult.isErrorContent) {
                                    console.log(`❌ Bank error detected on attempt ${verifyAttempts}`);
                                    break;
                                }

                                // Nếu form vẫn còn, đợi thêm và thử lại
                                if (verifyResult.formStillVisible && verifyAttempts < maxVerifyAttempts) {
                                    console.log(`⏳ Form still visible, waiting 3s before retry...`);
                                    await new Promise(resolve => setTimeout(resolve, 3000));
                                }
                            } catch (e) {
                                console.warn(`⚠️ Error during verify attempt ${verifyAttempts}:`, e.message);
                                // If execution context destroyed (page redirect), treat as success
                                if (e.message.includes('Execution context was destroyed')) {
                                    console.log(`✅ Page redirected during verification - treating as success`);
                                    verifyResult = {
                                        success: true,
                                        verified: false,
                                        message: 'Page redirected - likely successful but cannot verify data match'
                                    };
                                    break;
                                }
                            }
                        }

                        // Logic verify cải tiến:
                        // - Ưu tiên exactMatch (so sánh họ tên + chi nhánh chính xác)
                        // - Sau đó kiểm tra hasBankDisplay hoặc hasSuccessToast
                        // - Cuối cùng mới kiểm tra form biến mất

                        // Trường hợp 1: EXACT MATCH - họ tên và chi nhánh khớp → thành công chắc chắn 100%
                        if (verifyResult.exactMatch) {
                            return {
                                success: true,
                                verified: true,
                                message: `Bank added - EXACT MATCH verified (Fullname: ${verifyResult.displayedFullname}, Branch: ${verifyResult.displayedBranch})`,
                                verifyResult
                            };
                        }

                        // Trường hợp 2: Có toast thành công → thành công chắc chắn
                        if (verifyResult.hasSuccessToast) {
                            return {
                                success: true,
                                verified: true,
                                message: 'Bank added - success toast displayed',
                                verifyResult
                            };
                        }

                        // Trường hợp 3: Có modal lỗi → thất bại
                        if (verifyResult.hasErrorModal && verifyResult.isErrorContent) {
                            return {
                                success: false,
                                error: `Bank submission failed - error modal: ${verifyResult.modalErrorText}`,
                                verifyResult
                            };
                        }

                        // Trường hợp 4: Có bank display → check fullname + branch (giống VIP logic)
                        if (verifyResult.hasBankDisplay) {
                            // Cần cả fullname match VÀ branch match để coi là verified
                            if (verifyResult.fullnameMatch && verifyResult.branchMatch) {
                                return {
                                    success: true,
                                    verified: true,
                                    message: `Bank added - verified (Fullname: ${verifyResult.fullnameMatch}, Branch: ${verifyResult.branchMatch})`,
                                    verifyResult
                                };
                            }
                            // Có bank display nhưng không match → có thể là bank cũ hoặc sai
                            return {
                                success: true,
                                verified: false,
                                message: `Bank display found but data mismatch - displayed: ${verifyResult.displayedFullname}/${verifyResult.displayedBranch}`,
                                verifyResult
                            };
                        }

                        // Trường hợp 5: Form biến mất (reload) → có thể thành công nhưng không verify được
                        if (!verifyResult.formStillVisible) {
                            return {
                                success: true,
                                verified: false,
                                message: 'Bank form disappeared - likely successful but cannot verify data match',
                                verifyResult
                            };
                        }

                    }, `Add bank for ${siteName}`);

                    // Kiểm tra bankResult có tồn tại và có success property
                    if (bankResult && typeof bankResult === 'object' && bankResult.success) {
                        if (bankResult.verified) {
                            console.log(`✅ Bank info added and VERIFIED for ${siteName}`);
                            results.addBank = { success: true, verified: true, method: 'freelxb_style', message: bankResult.message };

                            // Send success status message
                            try {
                                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        profileId: profileData.profileId,
                                        username: profileData.username,
                                        status: 'running',
                                        message: `✅ Thêm Bank thành công`,
                                        timestamp: new Date().toISOString()
                                    })
                                }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                            } catch (e) {
                                // Ignore errors
                            }

                            // Mark tab as completed - no longer needs activation rotation
                            this.markTabCompleted(siteName);
                        } else {
                            console.log(`⚠️ Bank info added but NOT VERIFIED for ${siteName} - will skip checkPromo`);
                            // success: true vì form biến mất = bank đã submit thành công, chỉ là không verify được data
                            results.addBank = { success: true, verified: false, method: 'freelxb_style', message: bankResult.message };

                            // Send warning status message
                            try {
                                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        profileId: profileData.profileId,
                                        username: profileData.username,
                                        status: 'running',
                                        message: `⚠️ Thêm Bank nhưng không xác minh được`,
                                        timestamp: new Date().toISOString()
                                    })
                                }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                            } catch (e) {
                                // Ignore errors
                            }
                        }
                    } else {
                        console.log(`❌ Bank info addition failed for ${siteName}:`, bankResult?.error || 'Unknown error');
                        results.addBank = { success: false, error: bankResult?.error || 'Bank result is undefined or invalid' };

                        // Send error status message
                        try {
                            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    profileId: profileData.profileId,
                                    username: profileData.username,
                                    status: 'running',
                                    message: `❌ Thêm Bank thất bại`,
                                    timestamp: new Date().toISOString()
                                })
                            }).catch(e => console.warn('⚠️ Could not send status:', e.message));
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                } else {
                    console.log(`⏭️ Skipping bank info for ${siteName} (not provided)`);
                    results.addBank = { success: true, skipped: true, message: 'No bank info provided' };

                    // If no bank needed, mark as completed after successful registration
                    this.markTabCompleted(siteName);
                }

                // STEP 6: Check Promotion (checkm) - chạy ngay sau khi addBank thành công
                // Mở tab promo trong CÙNG browser window (không tạo context riêng)
                console.log(`🔍 DEBUG: profileData.checkPromo = ${profileData.checkPromo}`);
                console.log(`🔍 DEBUG: addBank.success = ${results.addBank?.success}`);
                console.log(`🔍 DEBUG: addBank.verified = ${results.addBank?.verified}`);

                // Quyết định chạy checkPromo dựa trên:
                // 1. profileData.checkPromo phải enabled
                // 2. addBank phải thành công (success = true)
                // Không cần verified = true, vì nếu bank display được tìm thấy, bank đã được thêm vào hệ thống
                const shouldRunCheckPromo = profileData.checkPromo &&
                    results.addBank?.success;

                if (shouldRunCheckPromo) {
                    // Cảnh báo nếu bank chưa được verify
                    if (!results.addBank?.success || !results.addBank?.verified) {
                        console.log(`⚠️ WARNING: Running checkPromo for ${siteName} without verified bank info`);
                    }
                    console.log(`🎁 STEP 6: Checking promotion for ${siteName}...`);

                    const promoUrl = siteUrls.promoUrl;
                    if (!promoUrl) {
                        console.log(`⚠️ No promo URL for ${siteName}, skipping check promo`);
                        results.checkPromo = { success: false, skipped: true, message: 'No promo URL configured' };
                    } else {
                        console.log(`📍 Promo URL: ${promoUrl}`);

                        // Note: No need to activate main tab - checkPromo runs in separate context
                        // Main tab is already completed (register + addBank done)

                        const promoResult = await this.safeExecute(async () => {
                            // Sử dụng shared context nếu có, nếu không thì tạo riêng
                            let promoContext = sharedPromoContext;
                            let shouldCloseContext = false;

                            if (!promoContext) {
                                console.log(`🎁 Creating separate browser window for checkPromo ${siteName}...`);
                                promoContext = await this.createPromoContext(browser, siteName);
                                shouldCloseContext = false; // Vẫn không đóng để tự quản lý
                            } else {
                                console.log(`🎁 Using shared browser window for checkPromo ${siteName}...`);
                            }

                            try {
                                // CheckPromo runs in separate context - no need to activate main tab
                                // Promo context has its own tab rotation via startPromoTabActivation()

                                try {
                                    const checkResult = await this.automation.runCheckPromotionFull(
                                        promoContext, // Dùng shared context hoặc context riêng
                                        null,
                                        promoUrl,
                                        siteUrls.registerUrl.replace('/Register', '/Login'),
                                        profileData.username,
                                        profileData.apiKey
                                    );

                                    return checkResult;
                                } finally {
                                    // Stop promo tab activation when checkPromo completes
                                    if (this.promoActivationInterval) {
                                        clearInterval(this.promoActivationInterval);
                                        this.promoActivationInterval = null;
                                    }
                                }
                            } finally {
                                // Không đóng context - để checkPromo tự quản lý tab
                                if (shouldCloseContext) {
                                    console.log(`📋 Keeping browser context open for ${siteName} checkPromo (tab self-manages)`);
                                } else {
                                    console.log(`📋 Using shared checkPromo window for ${siteName} (tab self-manages)`);
                                }
                            }
                        }, `Check promo for ${siteName}`);

                        if (promoResult.success) {
                            console.log(`✅ Check promo successful for ${siteName}`);
                            results.checkPromo = { success: true, ...promoResult };
                        } else {
                            console.log(`⚠️ Check promo failed for ${siteName}:`, promoResult.error);
                            results.checkPromo = { success: false, error: promoResult.error };
                        }
                    }
                } else if (!profileData.checkPromo) {
                    console.log(`⏭️ STEP 6: Skipping check promo for ${siteName} (not enabled)`);
                    results.checkPromo = { success: true, skipped: true, message: 'Skipped - not enabled' };
                } else if (!results.addBank?.success) {
                    console.log(`⏭️ STEP 6: Skipping check promo for ${siteName} (add bank failed)`);
                    results.checkPromo = { success: false, skipped: true, message: 'Skipped - add bank failed' };
                } else if (!results.addBank?.verified) {
                    console.log(`⏭️ STEP 6: Skipping check promo for ${siteName} (add bank not verified)`);
                    results.checkPromo = { success: false, skipped: true, message: 'Skipped - add bank not verified, please check manually' };
                }
            } else {
                console.log(`❌ Registration failed for ${siteName}:`, registerResult.error);
                results.register = { success: false, error: registerResult.error };
            }

            // STEP 7: Keep page open for inspection
            console.log(`🛡️ STEP 7: Keeping page open for inspection...`);

            // Thông báo đã bị xóa theo yêu cầu

        } catch (error) {
            console.error(`❌ Unexpected error in sequence for ${siteName}:`, error);
            results.register = { success: false, error: error.message };
        }

        console.log(`📂 Keeping page open for ${siteName} - DO NOT CLOSE MANUALLY`);

        console.log(`\n📊 Safe Mode Summary for ${siteName}:`);
        console.log(`  Register: ${results.register.success ? '✅' : '❌'}`);
        console.log(`  Login: ${results.login.success ? '✅' : '❌'}`);
        console.log(`  Add Bank: ${results.addBank.success ? '✅' : '❌'}`);
        console.log(`  Check Promo: ${results.checkPromo.success ? '✅' : '❌'}`);

        return results;
    }

    /**
     * Basic form filling fallback
     */
    async basicFormFill(page, profileData) {
        console.log('🔧 Attempting basic form fill...');

        try {
            const fillResult = await page.evaluate((data) => {
                const results = { filled: [], errors: [] };

                const selectors = {
                    username: ['input[formcontrolname="account"]', 'input[name*="username"]'],
                    password: ['input[formcontrolname="password"]', 'input[type="password"]:first-of-type'],
                    confirmPassword: ['input[formcontrolname="confirmPassword"]'],
                    withdrawPassword: ['input[formcontrolname="moneyPassword"]'],
                    fullname: ['input[formcontrolname="name"]', 'input[name*="fullname"]']
                };

                Object.entries(selectors).forEach(([fieldName, selectorList]) => {
                    let value = data[fieldName];
                    if (fieldName === 'confirmPassword') value = data.password;

                    if (!value) return;

                    for (const selector of selectorList) {
                        const element = document.querySelector(selector);
                        if (element) {
                            try {
                                element.focus();
                                element.value = value;
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                results.filled.push(`${fieldName}: ${selector}`);
                                break;
                            } catch (e) {
                                results.errors.push(`${fieldName}: ${e.message}`);
                            }
                        }
                    }
                });

                const checkbox = document.querySelector('input[formcontrolname="agree"]') ||
                    document.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) {
                    try {
                        checkbox.click();
                        results.filled.push('checkbox: agree terms');
                    } catch (e) {
                        results.errors.push(`checkbox: ${e.message}`);
                    }
                }

                return results;
            }, profileData);

            console.log('📝 Basic fill results:', fillResult);

            if (fillResult.filled.length > 0) {
                return { success: true, method: 'basic_form_fill', filled: fillResult.filled };
            } else {
                return { success: false, error: 'No form fields found or filled' };
            }

        } catch (error) {
            console.error('❌ Basic form fill error:', error);
            return { success: false, error: error.message };
        }
    }


    /**
     * Run sequence for multiple sites
     */
    async runSequence(browser, profileData, sites) {
        const executionMode = profileData.executionMode || 'parallel';
        const parallelCount = profileData.parallelCount || 0;

        console.log(`\n🛡️🛡️🛡️ SAFE MODE: AUTO SEQUENCE`);
        console.log(`Sites: ${sites.length}`);
        console.log(`Mode: ${executionMode === 'parallel' ? '🚀 Song Song' : '📋 Tuần Tự'}`);
        console.log(`ExecutionMode value: "${executionMode}" (from config: ${profileData.executionMode})`);
        console.log(`ParallelCount: ${parallelCount}`);
        console.log('');

        const results = [];

        // Tạo shared promo context cho tất cả sites (giống CheckM lẻ)
        let sharedPromoContext = null;
        if (profileData.checkPromo) {
            try {
                console.log(`🪟 Creating shared checkPromo window for all ${sites.length} sites...`);
                sharedPromoContext = await this.createPromoContext(browser, 'AllSites-Auto');
                console.log(`✅ Shared checkPromo window created for automation`);

                // Start promo tab rotation để tránh throttle
                this.startPromoTabActivation(sharedPromoContext);
            } catch (error) {
                console.log(`⚠️ Failed to create shared checkPromo window:`, error.message);
                // Tiếp tục mà không có shared context - mỗi site sẽ tự tạo
            }
        }

        if (executionMode === 'parallel') {
            if (parallelCount === 0 || parallelCount >= sites.length) {
                console.log(`🚀 Running all ${sites.length} sites in parallel...`);
                const promises = sites.map((site, i) => {
                    console.log(`[${i + 1}/${sites.length}] Starting: ${site.name}`);
                    return this.runSequenceForSite(browser, site, profileData, sharedPromoContext)
                        .then(result => ({ ...result, site: site.name }))
                        .catch(error => ({ site: site.name, error: error.message }));
                });
                const parallelResults = await Promise.all(promises);
                results.push(...parallelResults);
            } else {
                // Sliding window: Luôn giữ parallelCount tabs đang chạy
                // Khi 1 tab xong thì mở tab tiếp theo ngay
                console.log(`🚀 Running with sliding window (max ${parallelCount} concurrent)...`);

                let nextIndex = 0;
                const running = new Set();

                const startNext = () => {
                    while (running.size < parallelCount && nextIndex < sites.length) {
                        const index = nextIndex++;
                        const site = sites[index];
                        console.log(`  [${index + 1}/${sites.length}] Starting: ${site.name}`);

                        const promise = this.runSequenceForSite(browser, site, profileData, sharedPromoContext)
                            .then(result => {
                                results.push({ ...result, site: site.name });
                                running.delete(promise);
                                console.log(`  ✅ ${site.name} completed (${running.size} running, ${sites.length - nextIndex} remaining)`);
                                startNext(); // Mở site tiếp theo ngay khi có slot trống
                            })
                            .catch(error => {
                                results.push({ site: site.name, error: error.message });
                                running.delete(promise);
                                console.log(`  ❌ ${site.name} failed (${running.size} running, ${sites.length - nextIndex} remaining)`);
                                startNext();
                            });

                        running.add(promise);
                    }
                };

                // Bắt đầu với parallelCount sites đầu tiên
                startNext();

                // Đợi tất cả hoàn thành
                while (running.size > 0 || nextIndex < sites.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            for (let i = 0; i < sites.length; i++) {
                const site = sites[i];
                console.log(`\n[${i + 1}/${sites.length}] Processing: ${site.name}`);

                const result = await this.runSequenceForSite(browser, site, profileData, sharedPromoContext);
                results.push(result);

                if (i < sites.length - 1) {
                    console.log(`⏳ Waiting 3 seconds before next site...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        // PHASE 2: Không cần nữa - checkPromo đã chạy song song trong từng site
        console.log(`\n✅ All sites completed with individual checkPromo processing`);

        // Tóm tắt kết quả checkPromo
        const promoSummary = results.map(r => ({
            site: r.site,
            checkPromo: r.checkPromo?.skipped ? '⏭️' : (r.checkPromo?.success ? '✅' : '❌')
        }));
        console.log(`📊 CheckPromo Summary:`, promoSummary);

        console.log(`\n🛡️ SAFE MODE COMPLETED - All tabs kept open for inspection`);

        // Stop promo tab rotation khi automation hoàn thành
        this.stopPromoTabActivation();

        // Gửi status hoàn thành để dừng profile
        try {
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            const completionStatus = {
                profileId: profileData.profileId,
                username: profileData.username,
                status: 'completed',
                timestamp: new Date().toISOString(),
                totalSites: sites.length,
                successCount: results.filter(r => r.register?.success).length
            };

            console.log(`📤 Sending completion status to dashboard...`);
            const response = await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(completionStatus)
            });

            if (response.ok) {
                console.log(`✅ Completion status sent successfully`);
            } else {
                console.warn(`⚠️ Failed to send completion status: ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error sending completion status:`, error.message);
        }

        return { success: true, results };
    }

    /**
     * Chạy checkPromo cho tất cả sites cùng lúc trong cùng browser window
     * Mở tất cả promo tabs và rotate qua lại để xử lý
     */
    async runCheckPromoAllSites(browser, sitesNeedPromo, profileData) {
        console.log(`\n🎁 Starting checkPromo for ${sitesNeedPromo.length} sites...`);

        const promoTabs = new Map(); // siteName -> { page, status, promoUrl }
        const promoResults = [];

        try {
            // STEP 1: Mở tất cả promo tabs cùng lúc
            console.log(`📂 Opening ${sitesNeedPromo.length} promo tabs...`);

            for (const siteResult of sitesNeedPromo) {
                const siteName = siteResult.site;
                const promoUrl = siteResult.promoUrl;

                console.log(`  📄 Opening tab for ${siteName}: ${promoUrl}`);

                try {
                    const page = await browser.newPage();

                    // Set error handlers
                    page.on('error', (error) => {
                        console.error(`🚨 Page error for ${siteName} promo:`, error.message);
                    });
                    page.on('pageerror', (error) => {
                        console.error(`🚨 Page script error for ${siteName} promo:`, error.message);
                    });

                    // Navigate to promo URL
                    await page.goto(promoUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 30000
                    });

                    // Inject scripts
                    await this.automation.injectScripts(page);

                    promoTabs.set(siteName, {
                        page,
                        status: 'pending',
                        promoUrl,
                        loginUrl: siteResult.loginUrl
                    });

                    console.log(`  ✅ Tab opened for ${siteName}`);
                } catch (error) {
                    console.error(`  ❌ Failed to open tab for ${siteName}:`, error.message);
                    promoResults.push({
                        site: siteName,
                        checkPromo: { success: false, error: `Failed to open promo tab: ${error.message}` }
                    });
                }

                // Small delay between opening tabs
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`\n📊 Opened ${promoTabs.size} promo tabs successfully`);

            // STEP 2: Rotate qua các tabs và xử lý checkPromo
            console.log(`\n🔄 Starting tab rotation for checkPromo...`);

            const maxRounds = 10; // Tối đa 10 vòng rotate
            const roundDelay = 3000; // 3 giây mỗi tab

            for (let round = 1; round <= maxRounds; round++) {
                const pendingTabs = Array.from(promoTabs.entries()).filter(([_, data]) => data.status === 'pending');

                if (pendingTabs.length === 0) {
                    console.log(`✅ All promo tabs completed!`);
                    break;
                }

                console.log(`\n🔄 Round ${round}/${maxRounds} - ${pendingTabs.length} tabs pending`);

                for (const [siteName, tabData] of pendingTabs) {
                    const { page, promoUrl } = tabData;

                    if (page.isClosed()) {
                        console.log(`  ⚠️ Tab ${siteName} was closed, marking as failed`);
                        tabData.status = 'failed';
                        promoResults.push({
                            site: siteName,
                            checkPromo: { success: false, error: 'Tab was closed' }
                        });
                        continue;
                    }

                    console.log(`  🎯 Activating tab: ${siteName}`);

                    try {
                        // Activate tab
                        await page.bringToFront();
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Check promo status
                        const promoStatus = await this.checkPromoTabStatus(page, siteName, profileData);

                        if (promoStatus.completed) {
                            console.log(`  ✅ ${siteName}: ${promoStatus.message}`);
                            tabData.status = promoStatus.success ? 'success' : 'failed';
                            promoResults.push({
                                site: siteName,
                                checkPromo: {
                                    success: promoStatus.success,
                                    message: promoStatus.message,
                                    promoCode: promoStatus.promoCode
                                }
                            });
                        } else {
                            console.log(`  ⏳ ${siteName}: ${promoStatus.message} - will retry`);

                            // Trigger checkPromo action if not started
                            if (promoStatus.needsAction) {
                                await this.triggerCheckPromoAction(page, siteName, profileData);
                            }
                        }
                    } catch (error) {
                        console.error(`  ❌ Error processing ${siteName}:`, error.message);
                    }

                    // Delay before next tab
                    await new Promise(resolve => setTimeout(resolve, roundDelay));
                }
            }

            // Mark remaining pending tabs as timeout
            for (const [siteName, tabData] of promoTabs.entries()) {
                if (tabData.status === 'pending') {
                    console.log(`  ⏰ ${siteName}: Timeout - marking as incomplete`);
                    promoResults.push({
                        site: siteName,
                        checkPromo: { success: false, error: 'Timeout - promo check incomplete' }
                    });
                }
            }

        } catch (error) {
            console.error(`❌ Error in runCheckPromoAllSites:`, error);
        }

        console.log(`\n📊 CheckPromo Results:`);
        for (const result of promoResults) {
            console.log(`  ${result.site}: ${result.checkPromo.success ? '✅' : '❌'} ${result.checkPromo.message || result.checkPromo.error || ''}`);
        }

        return promoResults;
    }

    /**
     * Kiểm tra trạng thái của promo tab
     */
    async checkPromoTabStatus(page, siteName, profileData) {
        try {
            const status = await page.evaluate((username) => {
                const bodyText = document.body.textContent || '';

                // Kiểm tra đã có kết quả chưa
                const hasPromoCode = bodyText.match(/mã khuyến mãi[:\s]*([A-Z0-9]+)/i) ||
                    bodyText.match(/promo code[:\s]*([A-Z0-9]+)/i) ||
                    document.querySelector('.promo-code, .promotion-code, [class*="code-result"]');

                // Kiểm tra thông báo thành công
                const hasSuccess = bodyText.includes('thành công') ||
                    bodyText.includes('Thành công') ||
                    bodyText.includes('Success');

                // Kiểm tra thông báo lỗi
                const hasError = bodyText.includes('thất bại') ||
                    bodyText.includes('không hợp lệ') ||
                    bodyText.includes('Error') ||
                    bodyText.includes('đã nhận');

                // Kiểm tra form username còn không
                const hasUsernameForm = document.querySelector('input[placeholder*="tên người dùng"]') ||
                    document.querySelector('input[placeholder*="username"]') ||
                    document.querySelector('input[name*="username"]');

                // Kiểm tra đã điền username chưa
                const usernameInput = document.querySelector('input[placeholder*="tên người dùng"]') ||
                    document.querySelector('input[placeholder*="username"]');
                const usernameFilled = usernameInput && usernameInput.value === username;

                // Kiểm tra có captcha không
                const hasCaptcha = document.querySelector('img[src*="captcha"]') ||
                    document.querySelector('[class*="captcha"]') ||
                    document.querySelector('audio[src*="captcha"]');

                return {
                    hasPromoCode: !!hasPromoCode,
                    promoCodeText: hasPromoCode ? (hasPromoCode[1] || hasPromoCode.textContent) : null,
                    hasSuccess,
                    hasError,
                    hasUsernameForm: !!hasUsernameForm,
                    usernameFilled,
                    hasCaptcha: !!hasCaptcha
                };
            }, profileData.username);

            // Xác định trạng thái
            if (status.hasPromoCode || status.hasSuccess) {
                return {
                    completed: true,
                    success: true,
                    message: 'Promo code received',
                    promoCode: status.promoCodeText
                };
            }

            if (status.hasError) {
                return {
                    completed: true,
                    success: false,
                    message: 'Promo check failed or already claimed'
                };
            }

            if (status.hasUsernameForm && !status.usernameFilled) {
                return {
                    completed: false,
                    needsAction: true,
                    message: 'Username form found - needs to fill'
                };
            }

            if (status.hasCaptcha) {
                return {
                    completed: false,
                    needsAction: true,
                    message: 'Captcha detected - solving...'
                };
            }

            return {
                completed: false,
                needsAction: false,
                message: 'Waiting for result...'
            };

        } catch (error) {
            return {
                completed: true,
                success: false,
                message: `Error checking status: ${error.message}`
            };
        }
    }

    /**
     * Trigger checkPromo action trên page
     */
    async triggerCheckPromoAction(page, siteName, profileData) {
        try {
            console.log(`    🎯 Triggering checkPromo action for ${siteName}...`);

            await page.evaluate((userData) => {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve({ success: false, error: 'Timeout' });
                    }, 10000);

                    if (window._chromeMessageListener) {
                        window._chromeMessageListener(
                            {
                                action: 'checkPromotion',
                                data: {
                                    username: userData.username,
                                    apiKey: userData.apiKey,
                                    captchaDelay: userData.captchaDelay || 0
                                }
                            },
                            {},
                            (response) => {
                                clearTimeout(timeout);
                                resolve(response || { success: false });
                            }
                        );
                    } else {
                        clearTimeout(timeout);
                        resolve({ success: false, error: 'Extension not found' });
                    }
                });
            }, {
                username: profileData.username,
                apiKey: profileData.apiKey,
                captchaDelay: profileData.captchaDelay || 0
            });

        } catch (error) {
            console.error(`    ❌ Error triggering checkPromo for ${siteName}:`, error.message);
        }
    }

    /**
     * SMS sequence (safe mode) - no checkPromo
     */
    async runSmsSequence(browser, profileData, sites) {
        console.log(`\n🛡️ SAFE MODE: SMS SEQUENCE`);
        const smsProfileData = { ...profileData, checkPromo: false };
        return await this.runSequence(browser, smsProfileData, sites);
    }

    /**
     * Check Promo Only (standalone) - safe mode
     * Hỗ trợ cả chế độ song song và tuần tự (như quocdat)
     */
    async runCheckPromoOnly(browser, profileData, sites) {
        const executionMode = profileData.executionMode || 'parallel'; // Mặc định song song như quocdat
        const parallelCount = profileData.parallelCount || 0; // 0 = tất cả cùng lúc

        console.log(`\n🛡️ SAFE MODE: CHECK PROMO ONLY`);
        console.log(`Sites: ${sites.length}`);
        console.log(`Mode: ${executionMode === 'parallel' ? '🚀 Song Song' : '📋 Tuần Tự'}`);
        console.log(`Username: ${profileData.username}`);

        const results = [];

        // Tạo 1 browser context duy nhất cho tất cả checkPromo
        console.log(`🪟 Creating shared browser window for all ${sites.length} checkPromo sites...`);
        let sharedPromoContext = null;

        try {
            sharedPromoContext = await this.createPromoContext(browser, 'AllSites');
            console.log(`✅ Shared checkPromo browser window created for ${sites.length} sites`);
        } catch (error) {
            console.error(`❌ Failed to create shared checkPromo browser window:`, error.message);
            return { success: false, error: 'Cannot create shared browser window', results: [] };
        }

        // Wrap tất cả logic trong try-finally để đảm bảo cleanup
        try {

            // Helper function để chạy checkm cho 1 site
            const runCheckPromoForSite = async (site, index) => {
                const siteName = site.name;
                console.log(`\n[${index + 1}/${sites.length}] Check Promo: ${siteName}`);

                // Lấy URLs - ưu tiên từ site object
                let siteUrls = this.getSiteUrls(siteName);
                if (!siteUrls && site.registerUrl) {
                    const url = new URL(site.registerUrl);
                    siteUrls = {
                        registerUrl: site.registerUrl,
                        promoUrl: site.promoUrl
                    };
                }

                const promoUrl = site.promoUrl || (siteUrls ? siteUrls.promoUrl : null);
                if (!promoUrl) {
                    console.error(`❌ No promo URL for site: ${siteName}`);
                    return { site: siteName, checkPromo: { success: false, error: 'No promo URL' } };
                }

                console.log(`📍 Promo URL: ${promoUrl}`);

                try {
                    // Dùng shared context cho tất cả sites
                    console.log(`🪟 Using shared browser window for ${siteName} checkPromo...`);

                    const loginUrl = siteUrls ? siteUrls.registerUrl?.replace('/Register', '/Login') : '';

                    const promoResult = await this.automation.runCheckPromotionFull(
                        sharedPromoContext, // Dùng shared context cho tất cả sites
                        null,
                        promoUrl,
                        loginUrl,
                        profileData.username,
                        profileData.apiKey
                    );

                    console.log(`✅ ${siteName}: Check promo completed`);
                    return { site: siteName, checkPromo: promoResult };
                } catch (error) {
                    console.error(`❌ ${siteName}: Check promo failed:`, error.message);
                    return { site: siteName, checkPromo: { success: false, error: error.message } };
                }
            };

            // Chạy theo chế độ đã chọn
            if (executionMode === 'parallel') {
                if (parallelCount === 0 || parallelCount >= sites.length) {
                    // Chạy tất cả cùng lúc (như quocdat)
                    console.log(`🚀 Running all ${sites.length} sites in parallel...`);
                    const promises = sites.map((site, i) => runCheckPromoForSite(site, i));
                    const parallelResults = await Promise.all(promises);
                    results.push(...parallelResults);
                } else {
                    // Sliding window: Luôn giữ parallelCount tabs đang chạy
                    // Khi 1 tab xong thì mở tab tiếp theo ngay
                    console.log(`🚀 Running with sliding window (max ${parallelCount} concurrent)...`);

                    let nextIndex = 0;
                    const running = new Set();

                    const startNext = () => {
                        while (running.size < parallelCount && nextIndex < sites.length) {
                            const index = nextIndex++;
                            const site = sites[index];
                            console.log(`  [${index + 1}/${sites.length}] Starting: ${site.name}`);

                            const promise = runCheckPromoForSite(site, index)
                                .then(result => {
                                    results.push(result);
                                    running.delete(promise);
                                    console.log(`  ✅ ${site.name} completed (${running.size} running, ${sites.length - nextIndex} remaining)`);
                                    startNext(); // Mở site tiếp theo ngay khi có slot trống
                                })
                                .catch(error => {
                                    results.push({ site: site.name, checkPromo: { success: false, error: error.message } });
                                    running.delete(promise);
                                    console.log(`  ❌ ${site.name} failed (${running.size} running, ${sites.length - nextIndex} remaining)`);
                                    startNext();
                                });

                            running.add(promise);
                        }
                    };

                    // Bắt đầu với parallelCount sites đầu tiên
                    startNext();

                    // Đợi tất cả hoàn thành
                    while (running.size > 0 || nextIndex < sites.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            } else {
                // Chạy tuần tự
                for (let i = 0; i < sites.length; i++) {
                    const result = await runCheckPromoForSite(sites[i], i);
                    results.push(result);

                    if (i < sites.length - 1) {
                        console.log(`⏳ Waiting 3 seconds before next site...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
            }

            console.log(`\n🛡️ CHECK PROMO ONLY COMPLETED`);

            // Summary
            console.log(`\n📊 Summary:`);
            results.forEach((r, i) => {
                const status = r.checkPromo?.success ? '✅' : '❌';
                console.log(`  ${i + 1}. ${r.site}: ${status}`);
            });

            // Không cần đóng shared context - checkPromo tự quản lý tabs
            console.log(`📋 Shared checkPromo browser window kept open (tabs self-manage)`);

            return { success: true, results };
        } catch (error) {
            console.error(`❌ Error in runCheckPromoOnly:`, error.message);
            return { success: false, error: error.message, results };
        }
    }
}

module.exports = AutoSequenceSafe;
