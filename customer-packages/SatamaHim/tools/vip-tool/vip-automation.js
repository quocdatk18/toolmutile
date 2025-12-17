/**
 * VIP Tool Automation - 4 Categories (OKVIP, ABCVIP, JUN88, KJC)
 * Luồng chung: register → addbank → checkpromo
 * Form filling riêng cho từng category
 */

// Import fetch for Node.js (v18+)
const fetch = global.fetch || require('node-fetch');

// Import tab rotator
const tabRotator = require('./tab-rotator');

// Bank name mapping (VietQR API name → Dropdown option text)
const BANK_NAME_MAPPING = {
    'Vietcombank': 'VIETCOMBANK',
    'Techcombank': 'TECHCOMBANK',
    'BIDV': 'BIDV BANK',
    'VietinBank': 'VIETINBANK',
    'Agribank': 'AGRIBANK',
    'ACB': 'ACB BANK',
    'MB': 'MBBANK',
    'TPBank': 'TPBANK',
    'VPBank': 'VPBANK',
    'Sacombank': 'SACOMBANK',
    'HDBank': 'HD BANK',
    'VIB': 'VIB BANK',
    'SHB': 'SHB BANK',
    'Eximbank': 'EXIMBANK',
    'MSB': 'MSB BANK',
    'OCB': 'OCB BANK',
    'SeABank': 'SEABANK',
    'Nam A Bank': 'NAMA BANK',
    'PVcomBank': 'PVCOMBANK',
    'BacA Bank': 'BAC A BANK',
    'VietCapital Bank': 'VIET CAPITAL BANK (BVBANK)',
    'LienVietPostBank': 'LIENVIET BANK',
    'KienLongBank': 'KIENLONGBANK',
    'GPBank': 'GP BANK',
    'PGBank': 'PGBANK',
    'NCB': 'NCB',
    'SCB': 'SCB',
    'VietABank': 'VIETA BANK',
    'VietBank': 'VIETBANK',
    'ABBANK': 'ABBANK',
    'CBBANK': 'CB BANK',
    'COOPBANK': 'CO OPBANK',
    'OceanBank': 'OCB BANK',
    'Shinhan': 'SHINHAN BANK VN',
    'HSBC': 'HSBC',
    'StandardChartered': 'SCB',
    'Citibank': 'CITI',
    'ANZ': 'ANZ BANK',
    'UOB': 'UOB',
    'HongLeong': 'HONGLEONG BANK',
    'PublicBank': 'PUBLICBANK',
    'CIMB': 'CIMB BANK',
    'KBank': 'KBANK',
    'Woori': 'WOORI BANK',
    'DBS': 'DBS',
    'BAO VIET BANK': 'BAO VIET BANK'
};

class VIPAutomation {
    constructor(settings, scripts) {
        this.settings = settings;
        this.scripts = scripts; // { contentScript, captchaSolver, banksScript }

        // Định nghĩa đuôi path cho từng category
        this.categoryPaths = {
            'okvip': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'abcvip': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'jun88': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'kjc': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            }
        };
    }

    /**
     * Helper: Map bank name từ VietQR API sang dropdown option
     */
    mapBankName(bankName) {
        if (!bankName) return '';

        // Thử mapping trực tiếp
        if (BANK_NAME_MAPPING[bankName]) {
            return BANK_NAME_MAPPING[bankName];
        }

        // Thử tìm kiếm không phân biệt hoa thường
        const lowerInput = bankName.toLowerCase();
        for (const [key, value] of Object.entries(BANK_NAME_MAPPING)) {
            if (key.toLowerCase() === lowerInput) {
                return value;
            }
        }

        // Thử tìm kiếm partial match
        for (const [key, value] of Object.entries(BANK_NAME_MAPPING)) {
            if (key.toLowerCase().includes(lowerInput) || lowerInput.includes(key.toLowerCase())) {
                return value;
            }
        }

        console.warn(`⚠️ No mapping found for bank: ${bankName}`);
        return bankName;
    }

    /**
     * Helper: Extract domain từ URL
     */
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            console.error('❌ Invalid URL:', url);
            return null;
        }
    }

    /**
     * Inject required scripts vào page (captcha-solver, content script)
     */
    async injectScripts(page) {
        try {
            console.log('💉 Injecting scripts...');

            // Inject captcha-solver.js
            if (this.scripts && this.scripts.captchaSolver) {
                console.log('💉 Injecting captcha-solver.js...');
                await page.evaluate(this.scripts.captchaSolver);
            }

            // Inject Puppeteer API helper (bypass CORS)
            console.log('💉 Injecting Puppeteer API helper...');
            await page.evaluate(() => {
                window.__puppeteerApiCall = async (endpoint, method = 'GET', body = null, apiKey) => {
                    const options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };

                    if (body) {
                        options.body = JSON.stringify(body);
                    }

                    const response = await fetch(endpoint, options);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return await response.json();
                };
            });

            console.log('✅ Scripts injected successfully');
        } catch (error) {
            console.error('❌ Script injection error:', error.message);
            throw error;
        }
    }

    /**
     * Solve captcha via API (server-side, no extension needed)
     */
    async solveCaptchaViaAPI(base64Image, apiKey) {
        try {
            if (!apiKey) {
                console.warn('⚠️ No API key for captcha solving');
                return null;
            }

            console.log('🔐 Solving captcha via autocaptcha.pro API...');

            // Clean base64
            const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

            // Step 1: Submit captcha
            const submitResponse = await fetch('https://autocaptcha.pro/apiv3/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ImageToTextTask',
                    body: cleanBase64,
                    key: apiKey
                })
            });

            const submitData = await submitResponse.json();
            console.log('📤 Submit response:', submitData);

            // Handle direct response format {success: true, captcha: "text"}
            if (submitData.success && submitData.captcha) {
                console.log(`✅ Captcha solved: ${submitData.captcha}`);
                return submitData.captcha;
            }

            // Handle error
            if (submitData.errorId !== undefined && submitData.errorId !== 0) {
                console.error('❌ Failed to submit captcha:', submitData.message || 'Unknown error');
                return null;
            }

            // Handle polling format {errorId: 0, taskId: "xxx"}
            if (submitData.taskId) {
                const taskId = submitData.taskId;
                console.log(`📝 Captcha submitted, task ID: ${taskId}`);

                // Poll for result (max 30 seconds)
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 3000));

                    const resultResponse = await fetch(`https://autocaptcha.pro/apiv3/result?key=${apiKey}&taskId=${taskId}`);
                    const resultData = await resultResponse.json();

                    if (resultData.errorId === 0 && resultData.captchaText) {
                        console.log(`✅ Captcha solved: ${resultData.captchaText}`);
                        return resultData.captchaText;
                    }

                    if (i % 5 === 0) {
                        console.log(`⏳ Waiting for captcha result (${i}s)...`);
                    }
                }

                console.error('❌ Captcha solve timeout');
                return null;
            }

            console.error('❌ Unknown API response format:', submitData);
            return null;
        } catch (error) {
            console.error('❌ Captcha API error:', error.message);
            return null;
        }
    }

    /**
     * Auto-solve captcha on page using CaptchaSolver
     */
    async solveCaptchaOnPage(page, apiKey) {
        try {
            console.log('🎵 Starting auto-solve captcha...');

            if (!apiKey) {
                console.warn('⚠️ No API key provided for captcha solving');
                return false;
            }

            // Wait for captcha image to appear (with timeout)
            let captchaImage = null;
            let attempts = 0;
            const maxAttempts = 5;

            while (!captchaImage && attempts < maxAttempts) {
                attempts++;
                console.log(`🔍 Looking for captcha image (attempt ${attempts}/${maxAttempts})...`);

                try {
                    await page.waitForSelector('img#captcha, img[src^="data:image"]', { timeout: 2000 }).catch(() => null);

                    // Get captcha image
                    captchaImage = await page.evaluate(() => {
                        const img = document.querySelector('img#captcha') ||
                            document.querySelector('img[src^="data:image"]');
                        return img ? img.src : null;
                    });

                    if (captchaImage) {
                        console.log('📸 Found captcha image');
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Attempt ${attempts} failed:`, e.message);
                }

                if (!captchaImage && attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }

            if (!captchaImage) {
                console.log('⚠️ No captcha image found after all attempts');
                return false;
            }

            console.log('🔐 Solving captcha with API...');

            // Solve captcha via API (server-side)
            const captchaAnswer = await this.solveCaptchaViaAPI(captchaImage, apiKey);

            if (!captchaAnswer) {
                console.error('❌ Failed to solve captcha');
                return false;
            }

            // Fill captcha input - try multiple selectors
            const filled = await page.evaluate((answer) => {
                const selectors = [
                    'input[formcontrolname="checkCode"]',
                    'input[placeholder*="captcha"]',
                    'input[placeholder*="xác minh"]',
                    'input[placeholder*="verification"]',
                    'input[name="captcha"]',
                    'input[name="checkCode"]'
                ];

                for (const selector of selectors) {
                    const input = document.querySelector(selector);
                    if (input) {
                        input.value = answer;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        input.dispatchEvent(new Event('blur', { bubbles: true }));
                        return { success: true, selector };
                    }
                }

                return { success: false };
            }, captchaAnswer);

            if (filled.success) {
                console.log('✅ Captcha filled:', captchaAnswer, 'at', filled.selector);
                return true;
            } else {
                console.warn('⚠️ Could not find captcha input field');
                return false;
            }
        } catch (error) {
            console.error('❌ Captcha solve error:', error.message);
            return false;
        }
    }

    /**
     * Main automation flow - Luồng chung cho tất cả categories
     */
    async runVIPAutomation(browser, category, sites, profileData, mode = 'auto', executionMode = 'sequential', parallelCount = 3) {
        const results = [];

        // Ensure parallelCount is a valid number
        if (!parallelCount || isNaN(parallelCount) || parallelCount < 1) {
            parallelCount = 3; // Default to 3
        }

        // Tạo shared browser context cho checkPromo (nếu cần)
        let sharedPromoContext = null;
        if (mode === 'auto' || mode === 'promo') {
            try {
                console.log(`🪟 Creating shared browser context for checkPromo...`);
                sharedPromoContext = await browser.createBrowserContext();
                console.log(`✅ Shared browser context created`);
            } catch (error) {
                console.warn(`⚠️ Failed to create shared context:`, error.message);
            }
        }

        // Process sites based on execution mode
        if (executionMode === 'parallel') {
            console.log(`🚀 Running ${sites.length} sites in PARALLEL (${parallelCount} at a time)...`);
            await this.runSitesParallel(browser, category, sites, profileData, mode, sharedPromoContext, parallelCount, results);
        } else {
            console.log(`📋 Running ${sites.length} sites SEQUENTIALLY...`);
            await this.runSitesSequential(browser, category, sites, profileData, mode, sharedPromoContext, results);
        }

        // Keep shared context open for user to see results
        if (sharedPromoContext) {
            console.log(`📌 Keeping shared browser context open for inspection`);
        }

        return results;
    }

    /**
     * Run sites sequentially
     */
    async runSitesSequential(browser, category, sites, profileData, mode, sharedPromoContext, results) {
        for (const siteName of sites) {
            const categoryConfig = this.getSitesByCategory(category);
            const siteConfig = categoryConfig.sites.find(s => s.name === siteName);

            if (!siteConfig) {
                console.error(`❌ Site not found: ${siteName}`);
                continue;
            }

            console.log(`\n🚀 Processing ${category.toUpperCase()} - ${siteName}`);

            try {
                if (mode === 'auto') {
                    // Luồng tự động: register → addbank → checkpromo (reuse same page)
                    const registerResult = await this.registerStep(browser, category, siteConfig, profileData);

                    // Skip addBank nếu register failed
                    let addBankResult = { success: false, skipped: true, message: 'Skipped - register failed' };
                    console.log(`🔍 Register result for ${siteName}:`, registerResult);
                    if (!registerResult?.success) {
                        console.log(`⏭️ Skipping addBank for ${siteName} (register failed)`);
                    } else {
                        // Save account info after successful registration
                        console.log(`📝 Attempting to save account info for ${siteName}...`);
                        try {
                            await this.saveAccountInfo(profileData, category, siteName, sites);
                            console.log(`✅ Account info saved successfully for ${siteName}`);
                        } catch (err) {
                            console.error(`❌ Account save failed for ${siteName}:`, err.message);
                            console.error(`📍 Stack:`, err.stack);
                        }

                        // Reuse page from registerResult
                        addBankResult = await this.addBankStep(browser, category, siteConfig, profileData, registerResult.page);
                    }

                    // Skip checkPromo nếu addBank failed hoặc category là ABCVIP
                    let checkPromoResult = { success: false, skipped: true, message: 'Skipped - add bank failed' };
                    if (addBankResult?.success && category !== 'abcvip') {
                        checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                    } else if (category === 'abcvip') {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - no promo)`);
                        checkPromoResult = { success: true, skipped: true, message: 'Skipped - ABCVIP no promo' };
                    } else {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (add bank failed)`);
                    }

                    results.push({
                        site: siteName,
                        register: registerResult,
                        addBank: addBankResult,
                        checkPromo: checkPromoResult
                    });
                } else if (mode === 'promo') {
                    // Chỉ check promo
                    const checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                    results.push({
                        site: siteName,
                        checkPromo: checkPromoResult
                    });
                }
            } catch (error) {
                console.error(`❌ Error processing ${siteName}:`, error.message);
                results.push({
                    site: siteName,
                    error: error.message
                });
            }
        }
    }

    /**
     * Run sites in parallel (batch processing)
     */
    async runSitesParallel(browser, category, sites, profileData, mode, sharedPromoContext, parallelCount, results) {
        // Start tab rotation for parallel processing
        tabRotator.clear();
        tabRotator.start();

        try {
            // Process sites in batches
            for (let i = 0; i < sites.length; i += parallelCount) {
                const batch = sites.slice(i, i + parallelCount);
                console.log(`\n📦 Processing batch ${Math.floor(i / parallelCount) + 1}: ${batch.join(', ')}`);

                // Run batch in parallel
                const batchPromises = batch.map(async (siteName) => {
                    const result = await this.processSite(browser, category, siteName, profileData, mode, sharedPromoContext, sites);
                    // Mark tab as completed in rotator
                    tabRotator.complete(result.page);
                    return result;
                });
                const batchResults = await Promise.all(batchPromises);

                // Add results
                results.push(...batchResults);
            }
        } finally {
            // Stop tab rotation when done
            tabRotator.stop();
        }
    }

    /**
     * Process a single site (used by both sequential and parallel)
     */
    async processSite(browser, category, siteName, profileData, mode, sharedPromoContext, sites = []) {
        const categoryConfig = this.getSitesByCategory(category);
        const siteConfig = categoryConfig.sites.find(s => s.name === siteName);

        if (!siteConfig) {
            console.error(`❌ Site not found: ${siteName}`);
            return { site: siteName, error: 'Site not found' };
        }

        console.log(`\n🚀 Processing ${category.toUpperCase()} - ${siteName}`);

        try {
            if (mode === 'auto') {
                // Luồng tự động: register → addbank → checkpromo (reuse same page)
                const registerResult = await this.registerStep(browser, category, siteConfig, profileData);

                // Skip addBank nếu register failed
                let addBankResult = { success: false, skipped: true, message: 'Skipped - register failed' };
                if (!registerResult?.success) {
                    console.log(`⏭️ Skipping addBank for ${siteName} (register failed)`);
                } else {
                    // Save account info after successful registration
                    console.log(`📝 Attempting to save account info for ${siteName}...`);
                    try {
                        // Convert sites array to site names if needed
                        const siteNames = Array.isArray(sites) && sites.length > 0
                            ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                            : [];
                        await this.saveAccountInfo(profileData, category, siteName, siteNames);
                        console.log(`✅ Account info saved successfully for ${siteName}`);
                    } catch (err) {
                        console.error(`❌ Account save failed for ${siteName}:`, err.message);
                    }

                    // Reuse page from registerResult
                    addBankResult = await this.addBankStep(browser, category, siteConfig, profileData, registerResult.page);
                }

                // Skip checkPromo nếu addBank failed hoặc category là ABCVIP
                let checkPromoResult = { success: false, skipped: true, message: 'Skipped - add bank failed' };
                if (addBankResult?.success && category !== 'abcvip') {
                    checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                } else if (category === 'abcvip') {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - no promo)`);
                    checkPromoResult = { success: true, skipped: true, message: 'Skipped - ABCVIP no promo' };
                } else {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (add bank failed)`);
                }

                return {
                    site: siteName,
                    register: registerResult,
                    addBank: addBankResult,
                    checkPromo: checkPromoResult
                };
            } else if (mode === 'promo') {
                // Chỉ check promo
                const checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                return {
                    site: siteName,
                    checkPromo: checkPromoResult
                };
            }
        } catch (error) {
            console.error(`❌ Error processing ${siteName}:`, error.message);
            return {
                site: siteName,
                error: error.message
            };
        }
    }

    /**
     * Bước 1: Register
     */
    async registerStep(browser, category, siteConfig, profileData) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `Register-${siteConfig.name}`);
        try {
            console.log(`📝 Register step for ${siteConfig.name}...`);

            await page.goto(siteConfig.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Inject scripts (captcha-solver, etc.)
            try {
                await this.injectScripts(page);
            } catch (injectError) {
                console.warn('⚠️ Script injection failed:', injectError.message);
            }

            // Gọi form filler riêng cho category
            await this.fillRegisterForm(page, category, profileData, siteConfig);

            // Delay sau khi fill form
            await new Promise(r => setTimeout(r, 3000));

            // Solve captcha nếu có API key
            const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
            if (apiKey) {
                console.log('🎵 Attempting to solve captcha...');
                const captchaSolved = await this.solveCaptchaOnPage(page, apiKey);
                if (!captchaSolved) {
                    console.warn('⚠️ Captcha solve failed, continuing anyway...');
                }
                // Tăng delay cho ABCVIP (10s), bình thường 3s
                const captchaDelay = category === 'abcvip' ? 10000 : 3000;
                console.log(`⏳ Waiting ${captchaDelay}ms after captcha solve...`);
                await new Promise(r => setTimeout(r, captchaDelay));
            } else {
                console.warn('⚠️ No captcha API key provided');
            }

            // Submit form
            console.log(`📤 Submitting registration form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            // Delay sau khi submit
            await new Promise(r => setTimeout(r, 3000));

            // Wait for token/redirect (smart wait like nohu-tool)
            console.log(`⏳ Waiting for token/redirect...`);
            let hasToken = false;
            let waitAttempts = 0;
            // Tăng timeout cho ABCVIP (có random delay 20-60s), bình thường 10s
            const maxWaitAttempts = category === 'abcvip' ? 200 : 20; // ABCVIP: max 100s, others: max 10s
            const checkInterval = 500; // 500ms per check

            let initialUrl = await page.evaluate(() => window.location.href);
            console.log(`📍 Initial URL: ${initialUrl}`);

            while (waitAttempts < maxWaitAttempts) {
                waitAttempts++;

                try {
                    // Check token and URL
                    const status = await page.evaluate(() => {
                        const cookies = document.cookie;
                        // Check for OKVIP tokens: _pat, _prt
                        const hasToken = cookies.includes('_pat=') ||
                            cookies.includes('_prt=') ||
                            cookies.includes('token=') ||
                            localStorage.getItem('token') ||
                            localStorage.getItem('auth');

                        const currentUrl = window.location.href;
                        return { hasToken: !!hasToken, currentUrl };
                    });

                    hasToken = status.hasToken;
                    const urlChanged = status.currentUrl !== initialUrl;

                    if (hasToken) {
                        console.log(`✅ Token found after ${waitAttempts * checkInterval}ms`);
                        break;
                    }

                    if (urlChanged) {
                        console.log(`✅ URL changed (redirect successful): ${status.currentUrl}`);
                        hasToken = true; // Assume success if URL changed
                        break;
                    }

                    console.log(`⏳ [${waitAttempts}/${maxWaitAttempts}] No token/redirect yet, waiting...`);
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                } catch (e) {
                    console.log(`⚠️ Token check failed (attempt ${waitAttempts}):`, e.message);
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
            }

            if (!hasToken) {
                console.error(`❌ Token not found and no redirect after ${maxWaitAttempts * checkInterval}ms - Register FAILED`);
                return { success: false, error: 'Token not found and no redirect after registration' };
            }

            // Token found - no need to wait for navigation, can proceed immediately
            console.log(`✅ Token acquired, register successful`);

            // Thêm random delay 20-60s trước redirect sang Add Bank cho ABCVIP
            if (category === 'abcvip') {
                const randomDelay = Math.random() * (60000 - 20000) + 20000; // 20-60s
                console.log(`⏳ ABCVIP: Waiting ${Math.round(randomDelay / 1000)}s before redirect to Add Bank...`);
                await new Promise(r => setTimeout(r, randomDelay));
            }

            return { success: true, message: 'Register completed successfully', page };
        } catch (error) {
            console.error(`❌ Register Error:`, error.message);
            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * Bước 2: Add Bank (riêng cho từng category)
     */
    async addBankStep(browser, category, siteConfig, profileData, existingPage = null) {
        if (category === 'okvip') {
            return await this.addBankOKVIP(browser, siteConfig, profileData, existingPage);
        } else if (category === 'abcvip') {
            return await this.addBankABCVIP(browser, siteConfig, profileData, existingPage);
        } else if (category === 'jun88') {
            return await this.addBankJUN88(browser, siteConfig, profileData, existingPage);
        } else if (category === 'kjc') {
            return await this.addBankKJC(browser, siteConfig, profileData, existingPage);
        }
        return { success: false, error: 'Unknown category' };
    }

    /**
     * OKVIP Add Bank: redirect → submit mật khẩu rút → redirect → submit bank
     */
    async addBankOKVIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (OKVIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths.okvip;

            // Bước 1: Vào trang submit mật khẩu rút
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  → Withdraw Password: ${withdrawPasswordUrl}`);
            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[formcontrolname="newPassword"]', { timeout: 5000 });
                console.log('✅ Withdraw password form loaded');
            } catch (e) {
                console.warn('⚠️ Withdraw password form not found, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill withdraw password form (formcontrolname)
            await page.evaluate((data) => {
                const newPasswordField = document.querySelector('input[formcontrolname="newPassword"]');
                const confirmField = document.querySelector('input[formcontrolname="confirm"]');

                if (newPasswordField) {
                    newPasswordField.value = data.withdrawPassword;
                    newPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
                    newPasswordField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (confirmField) {
                    confirmField.value = data.withdrawPassword;
                    confirmField.dispatchEvent(new Event('input', { bubbles: true }));
                    confirmField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            await page.waitForNavigation({ timeout: 15000 }).catch(() => {
                console.log('⚠️ No navigation after withdraw password');
            });

            // Bước 2: Vào trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);
            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('mat-select[formcontrolname="bankName"], input[formcontrolname="account"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form (formcontrolname + mat-select)
            await page.evaluate((data) => {
                // Click mat-select để mở dropdown
                const bankSelect = document.querySelector('mat-select[formcontrolname="bankName"]');
                if (bankSelect) {
                    bankSelect.click();
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Select bank option (with mapping)
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const options = document.querySelectorAll('mat-option');
                let found = false;

                // Try exact match first
                for (const option of options) {
                    const optionText = option.textContent?.trim().toUpperCase();
                    if (optionText === bankName.toUpperCase()) {
                        option.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const option of options) {
                        const optionText = option.textContent?.trim().toUpperCase();
                        if (optionText.includes(bankName.toUpperCase())) {
                            option.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && options.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    options[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Fill city and account
            await page.evaluate((data) => {
                const cityField = document.querySelector('input[formcontrolname="city"]');
                const accountField = document.querySelector('input[formcontrolname="account"]');

                if (cityField) {
                    cityField.value = 'TP. Hồ Chí Minh';
                    cityField.dispatchEvent(new Event('input', { bubbles: true }));
                    cityField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (accountField) {
                    accountField.value = data.accountNumber;
                    accountField.dispatchEvent(new Event('input', { bubbles: true }));
                    accountField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            });

            // Wait for navigation after bank submission
            console.log(`⏳ Waiting for navigation after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForNavigation({ timeout: 15000 });
                pageReloaded = true;
                console.log('✅ Page reloaded after bank submission');
            } catch (e) {
                console.log('⚠️ No navigation after add bank');
            }

            // Check if bank was added successfully by verifying displayed values
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                // Find bank detail section
                const bankDetailSection = document.querySelector('.bank-detail');

                if (!bankDetailSection) {
                    // If page reloaded but no bank detail section, assume success
                    // (some sites don't show bank detail after submission)
                    if (reloaded) {
                        return { success: true, message: 'Page reloaded - assume bank added successfully' };
                    }
                    return { success: false, message: 'Bank detail section not found' };
                }

                // Extract all rows with text-right values
                const rows = bankDetailSection.querySelectorAll('.block.w-full');
                const bankInfo = {};

                rows.forEach(row => {
                    const labels = row.querySelectorAll('.inline-block.w-1\\/2');
                    const label = labels[0]?.textContent?.trim();
                    const value = row.querySelector('.text-right')?.textContent?.trim();

                    if (label && value) {
                        bankInfo[label] = value;
                    }
                });

                console.log('📊 Extracted bank info:', bankInfo);

                // Check: Họ tên thật, Chi nhánh, 4 số cuối tài khoản (bỏ qua ngân hàng vì format có thể khác)
                const fullnameMatch = bankInfo['Họ tên thật']?.includes(expectedData.fullname.trim().toUpperCase()) ||
                    bankInfo['Họ và tên']?.includes(expectedData.fullname.trim().toUpperCase());
                const cityMatch = bankInfo['Chi nhánh ngân hàng']?.includes(expectedData.city);
                const accountMatch = bankInfo['Số tài khoản']?.includes(expectedData.accountNumber.slice(-4));

                if (fullnameMatch && cityMatch && accountMatch) {
                    return {
                        success: true,
                        verified: true,
                        message: 'Bank info verified successfully',
                        data: bankInfo
                    };
                }

                // Log what was found for debugging
                return {
                    success: false,
                    message: 'Bank info verification failed',
                    expected: {
                        fullname: expectedData.fullname.trim().toUpperCase(),
                        city: expectedData.city,
                        accountNumber: expectedData.accountNumber.slice(-4)
                    },
                    actual: bankInfo
                };
            }, {
                fullname: profileData.fullname.trim(),
                bankName: profileData.bankName,
                city: 'TP. Hồ Chí Minh',
                accountNumber: profileData.accountNumber
            }, pageReloaded);

            console.log(`✅ Bank result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ OKVIP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * ABCVIP Add Bank (placeholder)
     */
    async addBankABCVIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (ABCVIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths.abcvip;

            // Bước 1: Vào trang submit mật khẩu rút
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  → Withdraw Password: ${withdrawPasswordUrl}`);
            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[formcontrolname="newPassword"]', { timeout: 5000 });
                console.log('✅ Withdraw password form loaded');
            } catch (e) {
                console.warn('⚠️ Withdraw password form not found, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill withdraw password form (formcontrolname)
            await page.evaluate((data) => {
                const newPasswordField = document.querySelector('input[formcontrolname="newPassword"]');
                const confirmField = document.querySelector('input[formcontrolname="confirm"]');

                if (newPasswordField) {
                    newPasswordField.value = data.withdrawPassword;
                    newPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
                    newPasswordField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (confirmField) {
                    confirmField.value = data.withdrawPassword;
                    confirmField.dispatchEvent(new Event('input', { bubbles: true }));
                    confirmField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            await page.waitForNavigation({ timeout: 15000 }).catch(() => {
                console.log('⚠️ No navigation after withdraw password');
            });

            // Bước 2: Vào trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);
            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('mat-select[formcontrolname="bankName"], input[formcontrolname="account"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form (formcontrolname + mat-select)
            await page.evaluate((data) => {
                // Click mat-select để mở dropdown
                const bankSelect = document.querySelector('mat-select[formcontrolname="bankName"]');
                if (bankSelect) {
                    bankSelect.click();
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Select bank option (with mapping)
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const options = document.querySelectorAll('mat-option');
                let found = false;

                // Try exact match first
                for (const option of options) {
                    const optionText = option.textContent?.trim().toUpperCase();
                    if (optionText === bankName.toUpperCase()) {
                        option.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const option of options) {
                        const optionText = option.textContent?.trim().toUpperCase();
                        if (optionText.includes(bankName.toUpperCase())) {
                            option.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && options.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    options[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Fill city and account
            await page.evaluate((data) => {
                const cityField = document.querySelector('input[formcontrolname="city"]');
                const accountField = document.querySelector('input[formcontrolname="account"]');

                if (cityField) {
                    cityField.value = 'TP. Hồ Chí Minh';
                    cityField.dispatchEvent(new Event('input', { bubbles: true }));
                    cityField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (accountField) {
                    accountField.value = data.accountNumber;
                    accountField.dispatchEvent(new Event('input', { bubbles: true }));
                    accountField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            });

            // Wait for navigation after bank submission
            console.log(`⏳ Waiting for navigation after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForNavigation({ timeout: 15000 });
                pageReloaded = true;
                console.log('✅ Page reloaded after bank submission');
            } catch (e) {
                console.log('⚠️ No navigation after add bank');
            }

            // Check if bank was added successfully by verifying displayed values
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                // Find bank detail section
                const bankDetailSection = document.querySelector('.bank-detail');

                if (!bankDetailSection) {
                    // If page reloaded but no bank detail section, assume success
                    // (some sites don't show bank detail after submission)
                    if (reloaded) {
                        return { success: true, message: 'Page reloaded - assume bank added successfully' };
                    }
                    return { success: false, message: 'Bank detail section not found' };
                }

                // Extract all rows with text-right values
                const rows = bankDetailSection.querySelectorAll('.block.w-full');
                const bankInfo = {};

                rows.forEach(row => {
                    const labels = row.querySelectorAll('.inline-block.w-1\\/2');
                    const label = labels[0]?.textContent?.trim();
                    const value = row.querySelector('.text-right')?.textContent?.trim();

                    if (label && value) {
                        bankInfo[label] = value;
                    }
                });

                console.log('📊 Extracted bank info:', bankInfo);

                // Check: Họ tên thật, Chi nhánh, 4 số cuối tài khoản (bỏ qua ngân hàng vì format có thể khác)
                const fullnameMatch = bankInfo['Họ tên thật']?.includes(expectedData.fullname.trim().toUpperCase()) ||
                    bankInfo['Họ và tên']?.includes(expectedData.fullname.trim().toUpperCase());
                const cityMatch = bankInfo['Chi nhánh ngân hàng']?.includes(expectedData.city);
                const accountMatch = bankInfo['Số tài khoản']?.includes(expectedData.accountNumber.slice(-4));

                if (fullnameMatch && cityMatch && accountMatch) {
                    return {
                        success: true,
                        verified: true,
                        message: 'Bank info verified successfully',
                        data: bankInfo
                    };
                }

                // Log what was found for debugging
                return {
                    success: false,
                    message: 'Bank info verification failed',
                    expected: {
                        fullname: expectedData.fullname.trim().toUpperCase(),
                        city: expectedData.city,
                        accountNumber: expectedData.accountNumber.slice(-4)
                    },
                    actual: bankInfo
                };
            }, {
                fullname: profileData.fullname.trim(),
                bankName: profileData.bankName,
                city: 'TP. Hồ Chí Minh',
                accountNumber: profileData.accountNumber
            }, pageReloaded);

            console.log(`✅ Bank result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ ABCVIP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * JUN88 Add Bank (placeholder)
     */
    async addBankJUN88(browser, siteConfig, profileData) {
        // TODO: Implement JUN88 add bank logic
        return { success: true, message: 'JUN88 add bank - TODO' };
    }

    /**
     * KJC Add Bank: vào luôn trang submit bank (gộp mật khẩu rút)
     */
    async addBankKJC(browser, siteConfig, profileData) {
        const page = await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (KJC)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths.kjc;
            const bankUrl = domain + paths.bank;

            console.log(`  → Bank: ${bankUrl}`);
            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1500));

            // Điền cả mật khẩu rút + bank info
            await page.evaluate((data) => {
                const withdrawField = document.querySelector('input[name="withdrawPassword"]');
                const bankNameField = document.querySelector('input[name="bankName"]');
                const accountField = document.querySelector('input[name="accountNumber"]');

                if (withdrawField) withdrawField.value = data.withdrawPassword;
                if (bankNameField) bankNameField.value = data.bankName;
                if (accountField) accountField.value = data.accountNumber;
            }, profileData);

            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            // Wait for navigation after bank submission
            console.log(`⏳ Waiting for navigation after bank submission...`);
            await page.waitForNavigation({ timeout: 15000 }).catch(() => {
                console.log('⚠️ No navigation after add bank');
            });

            return { success: true, message: 'Add bank completed' };
        } catch (error) {
            console.error(`❌ KJC Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * Bước 3: Check Promo (riêng cho từng category)
     */
    async checkPromoStep(browser, category, siteConfig, profileData = {}) {
        if (category === 'okvip') {
            return await this.checkPromoOKVIP(browser, siteConfig, profileData);
        } else if (category === 'abcvip') {
            return await this.checkPromoABCVIP(browser, siteConfig, profileData);
        } else if (category === 'jun88') {
            return await this.checkPromoJUN88(browser, siteConfig, profileData);
        } else if (category === 'kjc') {
            return await this.checkPromoKJC(browser, siteConfig, profileData);
        }
        return { success: false, error: 'Unknown category' };
    }

    /**
     * OKVIP Check Promo
     * Logic: Fill username → Select promo → Solve captcha → Click xác nhận
     */
    async checkPromoOKVIP(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (OKVIP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('#account', { timeout: 15000 });
                console.log('✅ Check Promo form loaded');
            } catch (e) {
                console.warn('⚠️ Check Promo form not fully loaded, continuing anyway...');
            }

            // Inject captcha-solver script
            try {
                if (this.scripts?.captchaSolver) {
                    await page.evaluate(this.scripts.captchaSolver);
                    console.log('💉 Captcha solver injected');
                }
            } catch (injectError) {
                console.warn('⚠️ Failed to inject captcha solver:', injectError.message);
            }

            // 2. Fill username
            const username = profileData?.username || '';
            console.log(`📝 Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('#account');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            await new Promise(r => setTimeout(r, 1500));

            // 3. Solve captcha
            console.log(`🔐 Solving captcha...`);
            const apiKey = profileData?.apiKey || this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;

            if (apiKey) {
                // Get captcha image
                const captchaImage = await page.evaluate(() => {
                    const img = document.querySelector('#captcha-image');
                    return img ? img.src : null;
                });

                if (captchaImage && captchaImage.startsWith('data:image')) {
                    // Solve captcha via API (server-side)
                    const captchaAnswer = await this.solveCaptchaViaAPI(captchaImage, apiKey);

                    if (captchaAnswer) {
                        console.log(`✅ Captcha solved: ${captchaAnswer}`);

                        // Fill captcha input
                        await page.evaluate((answer) => {
                            const input = document.querySelector('#captcha-input');
                            if (input) {
                                input.value = answer;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, captchaAnswer);

                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
            } else {
                console.warn(`⚠️ No API key, skipping captcha solve`);
            }

            // 6. Click submit button (xác nhận)
            console.log(`📤 Clicking submit button...`);
            await page.evaluate(() => {
                // Try multiple selectors
                let btn = document.querySelector('.btn-submit');
                if (!btn) btn = document.querySelector('.box-btn-sub');
                if (!btn) btn = document.querySelector('button[type="submit"]');
                if (btn) {
                    btn.click();
                    console.log('✅ Button clicked');
                } else {
                    console.warn('⚠️ Submit button not found');
                }
            });

            // 7. Wait a bit for submission to process
            await new Promise(r => setTimeout(r, 3000));

            console.log(`✅ Check Promo completed successfully`);

            // Keep page open for user to see result
            console.log('📌 Keeping checkpromo page open for inspection');

            return { success: true, message: 'Check promo submitted successfully' };

        } catch (error) {
            console.error(`❌ OKVIP Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * ABCVIP Check Promo
     * Logic: Fill username → Click submit (no captcha)
     */
    async checkPromoABCVIP(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (ABCVIP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('#userName', { timeout: 15000 });
                console.log('✅ Check Promo form loaded');
            } catch (e) {
                console.warn('⚠️ Check Promo form not fully loaded, continuing anyway...');
            }

            // 2. Fill username
            const username = profileData?.username || '';
            console.log(`📝 Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('#userName');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            await new Promise(r => setTimeout(r, 1500));

            // 3. Click check button (kiểm tra)
            console.log(`� Cllicking check button...`);
            await page.evaluate(() => {
                const btn = document.querySelector('#btnCheck .btn-submit');
                if (btn) {
                    btn.click();
                }
            });

            // 4. Wait a bit for submission to process
            await new Promise(r => setTimeout(r, 3000));

            console.log(`✅ Check Promo completed successfully`);

            // Keep page open for user to see result
            console.log('📌 Keeping checkpromo page open for inspection');

            return { success: true, message: 'Check promo submitted successfully' };

        } catch (error) {
            console.error(`❌ ABCVIP Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * JUN88 Check Promo
     */
    async checkPromoJUN88(browser, siteConfig) {
        const page = await browser.newPage();
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (JUN88)...`);

            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            const promoInfo = await page.evaluate(() => {
                const promoElements = document.querySelectorAll('[class*="promo"], [class*="promotion"]');
                const promos = [];

                promoElements.forEach(el => {
                    if (el.textContent) {
                        promos.push(el.textContent.trim());
                    }
                });

                return {
                    success: true,
                    promoCount: promos.length,
                    promos: promos.slice(0, 5)
                };
            });

            return promoInfo;
        } catch (error) {
            console.error(`❌ JUN88 Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * KJC Check Promo
     */
    async checkPromoKJC(browser, siteConfig) {
        const page = await browser.newPage();
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (KJC)...`);

            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            const promoInfo = await page.evaluate(() => {
                const promoElements = document.querySelectorAll('[class*="promo"], [class*="promotion"]');
                const promos = [];

                promoElements.forEach(el => {
                    if (el.textContent) {
                        promos.push(el.textContent.trim());
                    }
                });

                return {
                    success: true,
                    promoCount: promos.length,
                    promos: promos.slice(0, 5)
                };
            });

            return promoInfo;
        } catch (error) {
            console.error(`❌ KJC Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * Fill Register Form - riêng cho từng category
     */
    async fillRegisterForm(page, category, profileData, siteConfig) {
        if (category === 'okvip') {
            await this.fillOKVIPRegisterForm(page, profileData);
        } else if (category === 'abcvip') {
            await this.fillABCVIPRegisterForm(page, profileData);
        } else if (category === 'jun88') {
            await this.fillJUN88RegisterForm(page, profileData);
        } else if (category === 'kjc') {
            await this.fillKJCRegisterForm(page, profileData);
        }
    }

    /**
     * OKVIP Register Form
     * Selectors: formcontrolname (Angular form)
     */
    async fillOKVIPRegisterForm(page, profileData) {
        // Wait for form fields to appear
        try {
            await page.waitForSelector('input[formcontrolname="account"]', { timeout: 15000 });
            console.log('✅ Register form loaded');
        } catch (e) {
            console.warn('⚠️ Register form not fully loaded, continuing anyway...');
        }
        await new Promise(r => setTimeout(r, 1500));

        await page.evaluate((data) => {
            // Register form fields (formcontrolname)
            const accountField = document.querySelector('input[formcontrolname="account"]');
            const passwordField = document.querySelector('input[formcontrolname="password"]');
            const nameField = document.querySelector('input[formcontrolname="name"]');
            const mobileField = document.querySelector('input[formcontrolname="mobile"]');
            const emailField = document.querySelector('input[formcontrolname="email"]');
            const checkCodeField = document.querySelector('input[formcontrolname="checkCode"]');
            const agreeCheckbox = document.querySelector('input[formcontrolname="agree"]');

            if (accountField) accountField.value = data.username;
            if (passwordField) passwordField.value = data.password;
            if (nameField) nameField.value = data.fullname || '';
            if (mobileField) mobileField.value = data.phone || '';
            if (emailField) emailField.value = data.email || '';
            if (checkCodeField) checkCodeField.value = '0000'; // Placeholder
            if (agreeCheckbox) agreeCheckbox.checked = true;

            // Trigger change events
            [accountField, passwordField, nameField, mobileField, emailField, checkCodeField, agreeCheckbox].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            });
        }, profileData);
    }

    /**
     * Get site URLs by category and site name
     */
    getSitesByCategory(category) {
        const fs = require('fs');
        const path = require('path');

        const categoryConfigs = {
            'okvip': {
                name: 'OKVIP',
                icon: 'OK',
                color: '#ff6b35',
                sites: [
                    {
                        name: 'Hi88',
                        registerUrl: 'https://m.www-24h-com-vn-com.com/Account/Register',
                        checkPromoUrl: 'https://tangqua88.com/?promo_id=KM58'
                    },
                    {
                        name: 'F8BET',
                        registerUrl: 'https://m.jsdujkg8djjkuqw8czbm.com/Account/Register',
                        checkPromoUrl: 'https://ttkm-f8bet01.pages.dev/?promo_id=KM68'
                    },
                    {
                        name: 'SHBET',
                        registerUrl: 'https://m.djifshuie89shjdhsdxbvckrgio.com/Account/Register',
                        checkPromoUrl: 'https://khuyenmai-shbet02.pages.dev/?promo_id=SH57K'
                    },
                    {
                        name: 'NEW88',
                        registerUrl: 'https://m.dxiidnc84gkoopfcmbpwhsgf.com/Account/Register',
                        checkPromoUrl: 'https://khuyenmai-new88okvip1.pages.dev/?promo_id=N58'
                    },
                    {
                        name: 'MB66',
                        registerUrl: 'https://m.wtyurfuijkxcvklrhyli3imxjuuflegmgkiow3i.com/Account/Register',
                        checkPromoUrl: 'https://ttkm-mb66okvip02.pages.dev/?promo_id=FREE66'
                    },
                    {
                        name: '789BET',
                        registerUrl: 'https://m.hsdh99hjsbcnjiufkxuuwvg.com/Account/Register',
                        checkPromoUrl: 'https://ttkm789bet04.pages.dev/khuyenmai/?promo_id=FR58K'
                    }
                ]
            },
            'abcvip': {
                name: 'ABCVIP',
                icon: 'ABC',
                color: '#0066cc',
                sites: [
                    {
                        name: 'U888',
                        registerUrl: 'https://m.u888at.link/Account/Register?f=2551606&app=1',
                        checkPromoUrl: 'https://88u888.club/'
                    },
                    {
                        name: 'J88',
                        registerUrl: 'https://m.j859.xyz/Account/Register?f=4556781&app=1',
                        checkPromoUrl: 'https://j8j88.com/'
                    },
                    {
                        name: 'ABC8',
                        registerUrl: 'https://m.abc11.link/Account/Register?f=109114&app=1',
                        checkPromoUrl: 'https://www.88abc8.cc/'
                    }, {
                        name: '888clb',
                        registerUrl: 'https://88clb2jt.buzz/Account/Register?f=889534&app=1',
                        checkPromoUrl: 'https://88clb88.xyz/'
                    }
                ]
            },
            'jun88': {
                name: 'JUN88',
                icon: 'J88',
                color: '#00aa00',
                sites: [
                    {
                        name: 'Jun881',
                        registerUrl: 'https://jun881.com/register',
                        checkPromoUrl: 'https://jun881.com/promo'
                    },
                    {
                        name: 'Jun882',
                        registerUrl: 'https://jun882.com/register',
                        checkPromoUrl: 'https://jun882.com/promo'
                    },
                    {
                        name: 'Jun883',
                        registerUrl: 'https://jun883.com/register',
                        checkPromoUrl: 'https://jun883.com/promo'
                    }
                ]
            },
            'kjc': {
                name: 'KJC',
                icon: 'KJC',
                color: '#cc0000',
                sites: [
                    {
                        name: 'KJC1',
                        registerUrl: 'https://kjc1.com/register',
                        checkPromoUrl: 'https://kjc1.com/promo'
                    },
                    {
                        name: 'KJC2',
                        registerUrl: 'https://kjc2.com/register',
                        checkPromoUrl: 'https://kjc2.com/promo'
                    },
                    {
                        name: 'KJC3',
                        registerUrl: 'https://kjc3.com/register',
                        checkPromoUrl: 'https://kjc3.com/promo'
                    }
                ]
            }
        };

        const config = categoryConfigs[category];
        if (!config) return null;

        // Load custom sites từ file
        try {
            const customSitesFile = path.join(__dirname, '..', '..', 'config', 'vip-custom-sites.json');
            if (fs.existsSync(customSitesFile)) {
                const customSitesData = JSON.parse(fs.readFileSync(customSitesFile, 'utf8'));
                const customSites = customSitesData[category] || [];
                // Merge custom sites với built-in sites
                config.sites = [...config.sites, ...customSites];
                console.log(`✅ Loaded ${customSites.length} custom sites for ${category}`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not load custom sites for ${category}:`, error.message);
        }

        return config;
    }

    /**
     * ABCVIP Register Form
     */
    async fillABCVIPRegisterForm(page, profileData) {
        // Wait for form fields to appear
        try {
            await page.waitForSelector('input[formcontrolname="account"]', { timeout: 15000 });
            console.log('✅ ABCVIP Register form loaded');
        } catch (e) {
            console.warn('⚠️ ABCVIP Register form not fully loaded, continuing anyway...');
        }
        await new Promise(r => setTimeout(r, 1500));

        await page.evaluate((data) => {
            // ABCVIP Register form fields (formcontrolname)
            const accountField = document.querySelector('input[formcontrolname="account"]');
            const passwordField = document.querySelector('input[formcontrolname="password"]');
            const nameField = document.querySelector('input[formcontrolname="name"]');
            const mobileField = document.querySelector('input[formcontrolname="mobile"]');
            const emailField = document.querySelector('input[formcontrolname="email"]');
            const birthdayField = document.querySelector('input[formcontrolname="birthday"]');
            const checkCodeField = document.querySelector('input[formcontrolname="checkCode"]');
            const agreeCheckbox = document.querySelector('input[formcontrolname="agree"]');

            if (accountField) accountField.value = data.username;
            if (passwordField) passwordField.value = data.password;
            if (nameField) nameField.value = data.fullname || '';
            if (mobileField) mobileField.value = data.phone || '';
            if (emailField) emailField.value = data.email || '';
            if (birthdayField) birthdayField.value = data.birthday || '01/01/1990';
            if (checkCodeField) checkCodeField.value = '0000'; // Placeholder
            if (agreeCheckbox) agreeCheckbox.checked = true;

            // Trigger change events
            [accountField, passwordField, nameField, mobileField, emailField, birthdayField, checkCodeField, agreeCheckbox].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            });
        }, profileData);
    }

    /**
     * JUN88 Register Form
     */
    async fillJUN88RegisterForm(page, profileData) {
        await page.evaluate((data) => {
            const userField = document.querySelector('input[id="username"]');
            const pwdField = document.querySelector('input[id="password"]');
            const nameField = document.querySelector('input[id="fullname"]');

            if (userField) userField.value = data.username;
            if (pwdField) pwdField.value = data.password;
            if (nameField) nameField.value = data.fullname || '';

            [userField, pwdField, nameField].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }, profileData);
    }

    /**
     * KJC Register Form
     */
    async fillKJCRegisterForm(page, profileData) {
        await page.evaluate((data) => {
            const usernameInput = document.querySelector('input[data-field="username"]');
            const passwordInput = document.querySelector('input[data-field="password"]');
            const emailInput = document.querySelector('input[data-field="email"]');
            const phoneInput = document.querySelector('input[data-field="phone"]');

            if (usernameInput) usernameInput.value = data.username;
            if (passwordInput) passwordInput.value = data.password;
            if (emailInput) emailInput.value = data.email || '';
            if (phoneInput) phoneInput.value = data.phone || '';

            [usernameInput, passwordInput, emailInput, phoneInput].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }, profileData);
    }

    /**
     * Auto-detect category from site URL
     * Phát hiện category dựa trên domain của site
     */
    autoDetectCategory(siteUrl) {
        try {
            const url = new URL(siteUrl);
            const domain = url.hostname.toLowerCase();

            // OKVIP sites
            if (domain.includes('okvip') || domain.includes('ok-vip') ||
                domain.includes('hi88') || domain.includes('f8bet') ||
                domain.includes('shbet') || domain.includes('tigerstorm') ||
                domain.includes('new88') || domain.includes('mb66') ||
                domain.includes('789bet')) {
                return 'okvip';
            }

            // ABCVIP sites
            if (domain.includes('abcvip') || domain.includes('abc-vip') ||
                domain.includes('u888') || domain.includes('j88') ||
                domain.includes('abc8') || domain.includes('888clb')) {
                return 'abcvip';
            }

            // JUN88 sites
            if (domain.includes('jun88') || domain.includes('jun-88')) {
                return 'jun88';
            }

            // KJC sites
            if (domain.includes('kjc') || domain.includes('k-jc')) {
                return 'kjc';
            }

            console.warn(`⚠️ Could not auto-detect category for: ${domain}`);
            return 'okvip'; // Default to OKVIP
        } catch (error) {
            console.error('❌ Error auto-detecting category:', error.message);
            return 'okvip'; // Default to OKVIP
        }
    }

    /**
     * Save account info after successful registration
     */
    async saveAccountInfo(profileData, category, siteName, allSites = []) {
        try {
            console.log(`💾 Saving account info for ${category.toUpperCase()}/${siteName}...`);
            console.log(`📍 Category: ${category}, Username: ${profileData.username}`);

            const fs = require('fs');
            const path = require('path');

            // Create accounts folder structure: accounts/vip/{category}/{YYYY-MM-DD}/{username}/
            const accountsDir = path.join(__dirname, '..', '..', 'accounts');
            const vipCategoryDir = path.join(accountsDir, 'vip', category);

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateFolder = today.toISOString().split('T')[0]; // YYYY-MM-DD

            const username = profileData.username;
            const userAccountDir = path.join(vipCategoryDir, dateFolder, username);

            console.log(`📁 Account directory: ${userAccountDir}`);

            if (!fs.existsSync(userAccountDir)) {
                fs.mkdirSync(userAccountDir, { recursive: true });
                console.log(`📁 Created account directory: ${userAccountDir}`);
            }

            // Prepare account info
            const accountInfo = {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                bankName: profileData.bankName,
                bankBranch: profileData.bankBranch || 'Thành phố Hồ Chí Minh',
                accountNumber: profileData.accountNumber,
                registeredAt: new Date().toISOString(),
                category: category,
                site: siteName,
                sites: allSites // Lưu danh sách tất cả sites
            };

            // Format as readable text
            const sitesText = allSites && allSites.length > 0
                ? allSites.map(s => `   • ${s}`).join('\n')
                : '   • N/A';
            const accountText = `
═══════════════════════════════════════════════════════════
                    THÔNG TIN TÀI KHOẢN ${category.toUpperCase()}
═══════════════════════════════════════════════════════════

👤 THÔNG TIN ĐĂNG NHẬP
   • Tên đăng nhập: ${profileData.username}
   • Mật khẩu: ${profileData.password}
   • Mật khẩu rút tiền: ${profileData.withdrawPassword}
   • Họ và tên: ${profileData.fullname}

💳 THÔNG TIN NGÂN HÀNG
   • Ngân hàng: ${profileData.bankName || 'N/A'}
   • Chi nhánh: ${profileData.bankBranch || 'Thành phố Hồ Chí Minh'}
   • Số tài khoản: ${profileData.accountNumber || 'N/A'}

📱 CÁC TRANG ĐƯỢC ĐĂNG KÝ
${sitesText}

📅 Ngày đăng ký: ${new Date().toLocaleString('vi-VN')}

═══════════════════════════════════════════════════════════
`;

            // Save as category-specific JSON file
            const accountJsonFile = path.join(userAccountDir, `${category}.json`);
            fs.writeFileSync(accountJsonFile, JSON.stringify(accountInfo, null, 2));
            console.log(`✅ Account JSON saved to: ${accountJsonFile}`);

            // Also save as readable text file
            const accountTextFile = path.join(userAccountDir, `${category}.txt`);
            fs.writeFileSync(accountTextFile, accountText);
            console.log(`✅ Account text saved to: ${accountTextFile}`);

            console.log(`✅ Account info saved successfully for ${category.toUpperCase()}/${username}`);

        } catch (error) {
            console.error(`❌ Error saving account info for ${category}/${siteName}:`, error.message);
            throw error;
        }
    }
}

module.exports = VIPAutomation;


