/**
 * VIP Tool Automation - 3 Categories (OKVIP, ABCVIP, JUN88)
 * Luồng chung: register → addbank → checkpromo
 * Form filling riêng cho từng category
 */

// Import fetch for Node.js (v18+)
const fetch = global.fetch || require('node-fetch');

// Import tab rotator
const tabRotator = require('./tab-rotator');

// Import common form filler
const CommonFormFiller = require('../common/form-filler');

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
                withdrawPassword: '/Account/ChangeMoneyPassword', // jun88 k cần
                bank: '/account/withdrawaccounts/bankcards'
            },
            '78win': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/account/withdrawaccounts/bankcards'
            },
            'jun88v2': {
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
     * Helper: Calculate random delay (2-10s) - dùng chung cho tất cả category
     */
    getRandomDelay(minMs = 2000, maxMs = 10000) {
        return Math.random() * (maxMs - minMs) + minMs;
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
     * Solve Cloudflare Turnstile via autocaptcha.pro API
     */
    async solveTurnstileViaAPI(page, apiKey) {
        try {
            if (!apiKey) {
                console.warn('⚠️ No API key for Turnstile solving');
                return null;
            }

            console.log('🔐 Solving Cloudflare Turnstile via autocaptcha.pro API...');

            // Wait for Turnstile widget to load (max 15 seconds - it loads dynamically)
            try {
                await page.waitForSelector('.turnstile-container, [data-sitekey], [id*="turnstile"]', { timeout: 15000 }).catch(() => null);
                console.log('✅ Turnstile widget detected');
                // Wait extra time for Turnstile to fully initialize
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.warn('⚠️ Turnstile widget not found after waiting');
            }

            // Step 1: Get sitekey from page
            const sitekey = await page.evaluate(() => {
                // Try multiple ways to find sitekey

                // Method 1: Try to find in data attributes (most common)
                let turnstileContainer = document.querySelector('[data-sitekey]');
                if (turnstileContainer) {
                    return turnstileContainer.getAttribute('data-sitekey');
                }

                // Method 2: Try to find in script tag from Cloudflare
                const scriptTag = document.querySelector('script[src*="challenges.cloudflare.com"]');
                if (scriptTag) {
                    const src = scriptTag.src;
                    const match = src.match(/\/turnstile\/v0\/([a-z0-9]+)/i);
                    if (match) {
                        return match[1];
                    }
                }

                // Method 3: Try to find in window object (Cloudflare sets this)
                if (window.turnstileSitekey) {
                    return window.turnstileSitekey;
                }

                // Method 4: Try to find in any div with class containing 'turnstile'
                turnstileContainer = document.querySelector('div[class*="turnstile"]');
                if (turnstileContainer && turnstileContainer.getAttribute('data-sitekey')) {
                    return turnstileContainer.getAttribute('data-sitekey');
                }

                // Method 5: Try to find in any element with id containing 'turnstile'
                const turnstileById = document.querySelector('[id*="turnstile"]');
                if (turnstileById && turnstileById.getAttribute('data-sitekey')) {
                    return turnstileById.getAttribute('data-sitekey');
                }

                // Method 6: Try to extract from Cloudflare's inline script
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    if (script.textContent && script.textContent.includes('turnstile')) {
                        // Look for sitekey in format: "sitekey":"xxxxx" or sitekey: "xxxxx"
                        const match = script.textContent.match(/["\']?sitekey["\']?\s*:\s*["\']([a-z0-9\-]+)["\']/i);
                        if (match && match[1] && match[1].length > 10) {
                            // Sitekey should be longer than 10 chars
                            return match[1];
                        }
                    }
                }

                // Method 7: Check for Cloudflare's global object
                if (window.cf && window.cf.turnstile) {
                    // Try to get from Cloudflare's turnstile object
                    const containers = document.querySelectorAll('.turnstile-container');
                    if (containers.length > 0) {
                        // Sitekey might be in data attributes of parent or siblings
                        const parent = containers[0].parentElement;
                        if (parent && parent.getAttribute('data-sitekey')) {
                            return parent.getAttribute('data-sitekey');
                        }
                    }
                }

                return null;
            });

            if (!sitekey) {
                console.warn('⚠️ Could not find Turnstile sitekey');
                // Log debug info
                const debugInfo = await page.evaluate(() => {
                    const info = {
                        dataAttr: [],
                        turnstileElements: [],
                        allScripts: []
                    };

                    // Find all elements with data-sitekey
                    const elements = document.querySelectorAll('[data-sitekey]');
                    info.dataAttr = Array.from(elements).map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        id: el.id,
                        sitekey: el.getAttribute('data-sitekey')
                    }));

                    // Find all turnstile-related elements
                    const turnstileEls = document.querySelectorAll('[class*="turnstile"], [id*="turnstile"]');
                    info.turnstileElements = Array.from(turnstileEls).slice(0, 5).map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        id: el.id
                    }));

                    // Find all script tags
                    const scripts = document.querySelectorAll('script[src*="challenges.cloudflare.com"], script[src*="turnstile"]');
                    info.allScripts = Array.from(scripts).map(s => s.src);

                    return info;
                });

                console.log('📊 Debug Info:', debugInfo);
                return null;
            }

            console.log(`📝 Found sitekey: ${sitekey}`);

            // Get page URL
            const pageUrl = page.url();
            console.log(`📄 Page URL: ${pageUrl}`);

            // Step 2: Submit Turnstile task to autocaptcha.pro
            const submitResponse = await fetch('https://autocaptcha.pro/apiv3/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'TurnstileTask',
                    websiteURL: pageUrl,
                    websiteKey: sitekey,
                    key: apiKey
                })
            });

            const submitData = await submitResponse.json();
            console.log('📤 Turnstile submit response:', submitData);

            // Handle error
            if (submitData.errorId !== undefined && submitData.errorId !== 0) {
                console.error('❌ Failed to submit Turnstile:', submitData.message || 'Unknown error');
                return null;
            }

            // Handle polling format {errorId: 0, taskId: "xxx"}
            if (submitData.taskId) {
                const taskId = submitData.taskId;
                console.log(`📝 Turnstile submitted, task ID: ${taskId}`);

                // Poll for result (max 60 seconds for Turnstile)
                for (let i = 0; i < 60; i++) {
                    await new Promise(r => setTimeout(r, 2000));

                    const resultResponse = await fetch(`https://autocaptcha.pro/apiv3/result?key=${apiKey}&taskId=${taskId}`);
                    const resultData = await resultResponse.json();

                    if (resultData.errorId === 0 && resultData.solution && resultData.solution.cf_clearance) {
                        console.log(`✅ Turnstile solved`);
                        return resultData.solution.cf_clearance;
                    }

                    if (i % 10 === 0) {
                        console.log(`⏳ Waiting for Turnstile result (${i}s)...`);
                    }
                }

                console.error('❌ Turnstile solve timeout');
                return null;
            }

            console.error('❌ Unknown API response format:', submitData);
            return null;
        } catch (error) {
            console.error('❌ Turnstile API error:', error.message);
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

                    // Skip checkPromo nếu addBank failed hoặc category là ABCVIP/OKVIP/JUN88/78WIN (use separate tab)
                    let checkPromoResult = { success: false, skipped: true, message: 'Skipped - add bank failed' };
                    if (addBankResult?.success && category !== 'abcvip' && category !== 'okvip' && category !== 'jun88' && category !== '78win') {
                        checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                    } else if (category === 'abcvip') {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - use separate tab)`);
                        checkPromoResult = { success: true, skipped: true, message: 'Skipped - ABCVIP use separate tab' };
                    } else if (category === 'okvip') {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (OKVIP - use separate tab)`);
                        checkPromoResult = { success: true, skipped: true, message: 'Skipped - OKVIP use separate tab' };
                    } else if (category === 'jun88') {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (JUN88 - use separate tab)`);
                        checkPromoResult = { success: true, skipped: true, message: 'Skipped - JUN88 use separate tab' };
                    } else if (category === '78win') {
                        console.log(`⏭️ Skipping checkPromo for ${siteName} (78WIN - use separate tab)`);
                        checkPromoResult = { success: true, skipped: true, message: 'Skipped - 78WIN use separate tab' };
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

                // Skip checkPromo nếu addBank failed hoặc category là ABCVIP/OKVIP/JUN88/78WIN (use separate tab)
                let checkPromoResult = { success: false, skipped: true, message: 'Skipped - add bank failed' };
                if (addBankResult?.success && category !== 'abcvip' && category !== 'okvip' && category !== 'jun88' && category !== '78win') {
                    checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                } else if (category === 'abcvip') {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - use separate tab)`);
                    checkPromoResult = { success: true, skipped: true, message: 'Skipped - ABCVIP use separate tab' };
                } else if (category === 'okvip') {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (OKVIP - use separate tab)`);
                    checkPromoResult = { success: true, skipped: true, message: 'Skipped - OKVIP use separate tab' };
                } else if (category === 'jun88') {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (JUN88 - use separate tab)`);
                    checkPromoResult = { success: true, skipped: true, message: 'Skipped - JUN88 use separate tab' };
                } else if (category === '78win') {
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (78WIN - use separate tab)`);
                    checkPromoResult = { success: true, skipped: true, message: 'Skipped - 78WIN use separate tab' };
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

            // Inject scripts (captcha-solver, etc.) - skip for manual captcha categories
            const manualCaptchaCategories = ['jun88', '78win', 'jun88v2'];
            if (!manualCaptchaCategories.includes(category)) {
                try {
                    await this.injectScripts(page);
                } catch (injectError) {
                    console.warn('⚠️ Script injection failed:', injectError.message);
                }
            } else {
                console.log(`⏭️ Skipping auto-captcha for ${category} (manual captcha required)`);
            }

            // For JUN88V2: Wait for user to solve Turnstile, then click "Đăng Ký" button
            if (category === 'jun88v2') {
                console.log('🔐 JUN88V2: Waiting for Turnstile to be solved...');
                console.log('⏳ Please solve the Cloudflare Turnstile captcha manually...');

                // Wait for Turnstile to be solved (check if cf-turnstile-response has value)
                let turnstileSolved = false;
                for (let i = 0; i < 120; i++) {
                    const hasToken = await page.evaluate(() => {
                        const field = document.querySelector('input[name="cf-turnstile-response"]');
                        return field && field.value && field.value.length > 0;
                    });

                    if (hasToken) {
                        console.log('✅ Turnstile solved by user');
                        turnstileSolved = true;
                        break;
                    }

                    await new Promise(r => setTimeout(r, 1000));
                    if (i % 10 === 0) {
                        console.log(`⏳ Waiting for Turnstile... (${i}s)`);
                    }
                }

                if (!turnstileSolved) {
                    console.warn('⚠️ Turnstile not solved after 120 seconds');
                }

                // Wait extra time for Cloudflare to process token
                console.log('⏳ Waiting for Cloudflare to process token...');
                await new Promise(r => setTimeout(r, 3000));

                // Now click the "Đăng Ký" button
                console.log('🔐 Clicking "Đăng Ký" button to enter registration form...');
                try {
                    const clicked = await page.evaluate(() => {
                        // Search for button with text "Đăng Ký"
                        const buttons = document.querySelectorAll('div, button');
                        for (const btn of buttons) {
                            if (btn.textContent.trim() === 'Đăng Ký' || btn.textContent.includes('Đăng Ký')) {
                                btn.click();
                                console.log('✅ Clicked "Đăng Ký" button');
                                return true;
                            }
                        }
                        return false;
                    });

                    if (clicked) {
                        // Wait for form to load
                        await new Promise(r => setTimeout(r, 3000));
                        console.log('✅ Registration form loaded');
                    } else {
                        console.warn('⚠️ Could not find "Đăng Ký" button');
                    }
                } catch (error) {
                    console.warn('⚠️ Error clicking "Đăng Ký" button:', error.message);
                }
            }

            // Gọi form filler riêng cho category
            await this.fillRegisterForm(page, category, profileData, siteConfig);

            // Delay sau khi fill form (give React time to process changes)
            await new Promise(r => setTimeout(r, 3000));

            // Inject scripts (captcha-solver, etc.)
            try {
                await this.injectScripts(page);
            } catch (injectError) {
                console.warn('⚠️ Failed to inject scripts:', injectError.message);
            }

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

            // For JUN88 categories: add extra anti-bot measures
            const isJUN88Category = ['jun88', '78win', 'jun88v2'].includes(category);
            if (isJUN88Category) {
                console.log('🤖 JUN88 anti-bot: Adding extra delays and human-like interactions...');

                // Scroll page to simulate user reading form
                await page.evaluate(() => {
                    window.scrollBy(0, 200);
                });
                await new Promise(r => setTimeout(r, 1500));

                // Scroll back up
                await page.evaluate(() => {
                    window.scrollBy(0, -200);
                });
                await new Promise(r => setTimeout(r, 1500));

                // Random delay 15-35s before submit (JUN88V2 needs more time for Cloudflare)
                const delayBeforeSubmit = this.getRandomDelay(15000, 35000);
                console.log(`⏳ JUN88 anti-bot: Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
                await new Promise(r => setTimeout(r, delayBeforeSubmit));
            } else {
                // Add random delay 5-20s before submit (other categories)
                const delayBeforeSubmit = this.getRandomDelay(5000, 20000);
                console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit registration...`);
                await new Promise(r => setTimeout(r, delayBeforeSubmit));
            }

            // Submit form
            console.log(`📤 Submitting registration form for ${siteConfig.name}...`);

            // For JUN88: use slower, more human-like click
            if (isJUN88Category) {
                try {
                    // Find and scroll button into view
                    const buttonFound = await page.evaluate(() => {
                        const buttons = document.querySelectorAll('button');
                        let submitBtn = null;

                        // Find submit button - try multiple text patterns
                        for (const btn of buttons) {
                            const text = btn.textContent.trim().toUpperCase();
                            if (text.includes('ĐĂNG KÝ') || text.includes('OK') || text.includes('REGISTER') || text.includes('SUBMIT')) {
                                submitBtn = btn;
                                break;
                            }
                        }

                        if (!submitBtn) {
                            // Try by class or id
                            submitBtn = document.querySelector('button.submit') ||
                                document.querySelector('button[type="submit"]') ||
                                document.querySelector('button.btn-primary') ||
                                document.querySelector('button.btn-success');
                        }

                        if (submitBtn) {
                            // Scroll button into view
                            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return true;
                        }
                        return false;
                    });

                    if (!buttonFound) {
                        console.warn('⚠️ Submit button not found, trying alternative methods...');
                    }

                    // Wait for scroll to complete
                    await new Promise(r => setTimeout(r, 1500));

                    // Now click with human-like interaction
                    const clickSuccess = await page.evaluate(() => {
                        const buttons = document.querySelectorAll('button');
                        let submitBtn = null;

                        // Find submit button
                        for (const btn of buttons) {
                            const text = btn.textContent.trim().toUpperCase();
                            if (text.includes('ĐĂNG KÝ') || text.includes('OK') || text.includes('REGISTER') || text.includes('SUBMIT')) {
                                submitBtn = btn;
                                break;
                            }
                        }

                        if (!submitBtn) {
                            submitBtn = document.querySelector('button.submit') ||
                                document.querySelector('button[type="submit"]') ||
                                document.querySelector('button.btn-primary') ||
                                document.querySelector('button.btn-success');
                        }

                        if (submitBtn && submitBtn.offsetParent !== null) { // Check if visible
                            // Simulate human-like interaction
                            submitBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                            submitBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                            setTimeout(() => {
                                submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                setTimeout(() => {
                                    submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    submitBtn.click();
                                    submitBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                                }, 100);
                            }, 200);
                            return true;
                        }
                        return false;
                    });

                    if (!clickSuccess) {
                        console.warn('⚠️ Could not click submit button via evaluate, trying Puppeteer click...');
                        // Try using Puppeteer's click method
                        try {
                            await page.click('button');
                        } catch (e) {
                            console.warn('⚠️ Puppeteer click also failed:', e.message);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error clicking submit button:', error.message);
                }
            } else {
                // Original click for other categories
                await page.evaluate(() => {
                    let submitBtn = document.querySelector('button[type="submit"]');

                    if (!submitBtn) {
                        const buttons = document.querySelectorAll('button[type="button"]');
                        for (const btn of buttons) {
                            if (btn.textContent.includes('ĐĂNG KÝ') || btn.textContent.includes('OK')) {
                                submitBtn = btn;
                                break;
                            }
                        }
                    }

                    if (submitBtn) {
                        submitBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                        submitBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        submitBtn.click();
                        submitBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                    }
                });
            }

            // Delay sau khi submit
            await new Promise(r => setTimeout(r, 3000));

            // Wait for token/redirect (smart wait like nohu-tool)
            console.log(`⏳ Waiting for token/redirect...`);
            let hasToken = false;
            let waitAttempts = 0;

            // Determine max wait time based on category
            const isManualCaptcha = manualCaptchaCategories.includes(category);
            const maxWaitTime = isManualCaptcha ? 120000 : 10000; // 120s for manual, 10s for auto
            const checkInterval = 500; // 500ms per check
            const maxWaitAttempts = Math.ceil(maxWaitTime / checkInterval);

            if (isManualCaptcha) {
                console.log(`📝 Manual captcha mode: Waiting up to 120s for user to solve captcha...`);
            }

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

                    if (isManualCaptcha) {
                        console.log(`⏳ [${waitAttempts}/${maxWaitAttempts}] Waiting for manual captcha (${Math.round(waitAttempts * checkInterval / 1000)}s)...`);
                    } else {
                        console.log(`⏳ [${waitAttempts}/${maxWaitAttempts}] No token/redirect yet, waiting...`);
                    }
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

            // For jun88, 78win, jun88v2: wait delay then redirect to addbank page
            if (isManualCaptcha) {
                // Add random delay 2-10s before redirect to bank (like OKVIP)
                const delayBeforeBank = this.getRandomDelay(2000, 10000); // 2-10s
                console.log(`⏳ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to addbank...`);
                await new Promise(r => setTimeout(r, delayBeforeBank));

                console.log(`🔄 Redirecting to addbank page for ${category}...`);
                const domain = this.getDomain(siteConfig.registerUrl);
                const bankPath = this.categoryPaths[category]?.bank || '/Financial?type=withdraw';
                const bankUrl = domain + bankPath;
                console.log(`📍 Navigating to: ${bankUrl}`);
                await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await new Promise(r => setTimeout(r, 3000));
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
        } else if (category === '78win') {
            return await this.addBank78WIN(browser, siteConfig, profileData, existingPage);
        } else if (category === 'jun88v2') {
            return await this.addBankJUN88V2(browser, siteConfig, profileData, existingPage);
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

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 10000); // 2-10s
            console.log(`⏳ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

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

            // Bước 2: Vào trang submit bank (OKVIP)
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 10000); // 2-10s
            console.log(`⏳ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

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

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ OKVIP Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

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

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 10000); // 2-10s
            console.log(`⏳ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

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

            // Bước 2: Vào trang submit bank (ABCVIP)
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 10000); // 2-10s
            console.log(`⏳ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

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

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ ABCVIP Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

            return { success: false, error: error.message };
        }
    }

    /**
     * 78WIN Register Form (Form 2 - playerid, password, firstname, mobile - NO EMAIL)
     * Anti-bot measures: slow typing, delays between fields, human-like interactions
     */
    async fill78WINRegisterForm(page, profileData) {
        try {
            console.log('🤖 78WIN Form - Anti-bot mode enabled');
            const filler = new CommonFormFiller();

            // Wait for form to be interactive
            await filler.waitForForm(page, 'input[id="playerid"]', 10000);
            await new Promise(r => setTimeout(r, 1000));

            // Prepare phone (remove leading 0)
            let phone = profileData.phone || '';
            if (phone.startsWith('0')) {
                phone = phone.substring(1);
            }

            // Fill fields using common filler
            const fields = [
                { selector: 'input[id="playerid"]', value: profileData.username, label: 'username' },
                { selector: 'input[id="password"]', value: profileData.password, label: 'password' },
                { selector: 'input[id="firstname"]', value: profileData.fullname || '', label: 'fullname' },
                { selector: 'input[type="tel"]', value: phone, label: 'mobile' }
            ];

            await filler.fillMultipleFields(page, fields, {
                charDelay: 150,
                beforeFocus: 300,
                afterField: 800
            });

            // Handle agree checkbox - skip if already checked
            console.log('✅ Checking agree checkbox...');
            try {
                const isChecked = await page.evaluate(() => {
                    const checkbox = document.querySelector('input[id="agree"]');
                    return checkbox ? checkbox.checked : false;
                });

                if (!isChecked) {
                    const agreeCheckbox = await page.$('input[id="agree"]');
                    if (agreeCheckbox) {
                        await page.hover('input[id="agree"]');
                        await new Promise(r => setTimeout(r, 200));
                        await page.click('input[id="agree"]');
                        await new Promise(r => setTimeout(r, 500));
                    }
                } else {
                    console.log('✅ Agree checkbox already checked');
                }
            } catch (error) {
                console.warn('⚠️ Could not interact with agree checkbox:', error.message);
            }

            // Trigger change events for all fields (React compatibility)
            await page.evaluate(() => {
                const fields = [
                    'input[id="playerid"]',
                    'input[id="password"]',
                    'input[id="firstname"]',
                    'input[type="tel"]',
                    'input[id="agree"]'
                ];

                fields.forEach(selector => {
                    const field = document.querySelector(selector);
                    if (field) {
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                        field.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                });
            });

            console.log('✅ 78WIN form filled successfully');
        } catch (error) {
            console.error('❌ Error filling 78WIN form:', error.message);
            throw error;
        }
    }

    /**
     * JUN88V2 Register Form (Form 3 - fullname, username, password, phone - JOJODIOS)
     * Anti-bot measures: slow typing, delays between fields, human-like interactions
     */
    async fillJUN88V2RegisterForm(page, profileData) {
        try {
            console.log('🤖 JUN88V2 Form - Anti-bot mode enabled');
            const filler = new CommonFormFiller();

            // Wait for form to be interactive
            await filler.waitForForm(page, 'input[id="fullname"]', 10000);

            // For JUN88V2: Wait for Turnstile to auto-verify (it usually verifies within 1-3 seconds)
            console.log('⏳ Waiting for Turnstile to auto-verify...');
            let turnstileVerified = false;
            for (let i = 0; i < 10; i++) {
                const verified = await page.evaluate(() => {
                    const field = document.querySelector('input[name="cf-turnstile-response"]');
                    return field && field.value && field.value.length > 0;
                });

                if (verified) {
                    console.log('✅ Turnstile auto-verified');
                    turnstileVerified = true;
                    break;
                }

                await new Promise(r => setTimeout(r, 500));
            }

            if (!turnstileVerified) {
                console.warn('⚠️ Turnstile not auto-verified, proceeding anyway...');
            }

            // Wait a bit more for page to settle
            await new Promise(r => setTimeout(r, 1000));

            // Simulate human-like interactions
            await filler.simulateHumanInteraction(page);

            // Click on first field to show interest
            await page.click('input[id="fullname"]').catch(() => null);
            await new Promise(r => setTimeout(r, 600));

            // Prepare phone (remove leading 0)
            let phone = profileData.phone || '';
            if (phone.startsWith('0')) {
                phone = phone.substring(1);
            }

            // Fill fields using common filler
            const fields = [
                { selector: 'input[id="fullname"]', value: profileData.fullname || '', label: 'fullname' },
                { selector: 'input[id="username"]', value: profileData.username, label: 'username' },
                { selector: 'input[id="password"]', value: profileData.password, label: 'password' },
                { selector: 'input[placeholder*="Số điện thoại"]', value: phone, label: 'mobile' }
            ];

            await filler.fillMultipleFields(page, fields, {
                charDelay: 150,
                beforeFocus: 500,
                afterField: 1200
            });

            // Trigger change events for all fields (React compatibility)
            await page.evaluate(() => {
                const fields = [
                    'input[id="fullname"]',
                    'input[id="username"]',
                    'input[id="password"]',
                    'input[type="text"][inputmode="numeric"]',
                    'input[pattern="[0-9]*"]'
                ];

                fields.forEach(selector => {
                    const field = document.querySelector(selector);
                    if (field) {
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                        field.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                });
            });

            console.log('✅ JUN88V2 form filled successfully');
        } catch (error) {
            console.error('❌ Error filling JUN88V2 form:', error.message);
            throw error;
        }
    }

    /**
     * JUN88 Add Bank: Click bank field → select bank → fill account & password → submit
     */
    async addBankJUN88(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (JUN88)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "Thêm ngân hàng +" button to show form
            console.log(`🔍 Looking for "Thêm ngân hàng +" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                // Try multiple selectors for the add bank button
                const selectors = [
                    'button.nrc-button',
                    'button[title=""]',
                    'button:contains("Thêm ngân hàng")',
                    'button'
                ];

                let addBankBtn = null;

                // Try exact text match first
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    if (btn.textContent.includes('Thêm ngân hàng')) {
                        addBankBtn = btn;
                        break;
                    }
                }

                if (addBankBtn) {
                    console.log('Found add bank button, clicking...');
                    addBankBtn.click();
                    return true;
                }

                return false;
            });

            if (!addBankButtonClicked) {
                console.warn('⚠️ "Thêm ngân hàng +" button not found, trying alternative...');
            } else {
                console.log('✅ Clicked "Thêm ngân hàng +" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Wait for bank form to load
            try {
                await page.waitForSelector('input[id="bankid"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click bank field to open dropdown
            console.log(`🏦 Opening bank dropdown...`);
            await page.evaluate(() => {
                const bankField = document.querySelector('input[id="bankid"]');
                if (bankField) {
                    bankField.click();
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Select bank from dropdown
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const bankItems = document.querySelectorAll('.mc-bank-item');
                let found = false;

                // Try exact match first
                for (const item of bankItems) {
                    const itemText = item.querySelector('.mc-bank-name')?.textContent?.trim().toUpperCase();
                    if (itemText === bankName.toUpperCase()) {
                        item.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const item of bankItems) {
                        const itemText = item.querySelector('.mc-bank-name')?.textContent?.trim().toUpperCase();
                        if (itemText.includes(bankName.toUpperCase())) {
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && bankItems.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    bankItems[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Fill account number and password - use slow typing like register form
            console.log(`📝 Filling account and password...`);

            // Field 1: Account number
            try {
                console.log(`💳 Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="bankaccount"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="bankaccount"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Account number filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling account number:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((accountNumber) => {
                    const accountField = document.querySelector('input[id="bankaccount"]');
                    if (accountField) {
                        accountField.value = accountNumber;
                        accountField.dispatchEvent(new Event('input', { bubbles: true }));
                        accountField.dispatchEvent(new Event('change', { bubbles: true }));
                        accountField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.accountNumber);
            }

            // Field 2: Password
            try {
                console.log(`🔐 Filling password...`);
                await page.focus('input[id="password"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="password"]', profileData.password, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Password filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling password:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((password) => {
                    const passwordField = document.querySelector('input[id="password"]');
                    if (passwordField) {
                        passwordField.value = password;
                        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.password);
            }

            await new Promise(r => setTimeout(r, 1500));

            // Submit form - find OK button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
            await new Promise(r => setTimeout(r, delayBeforeSubmit));

            const submitSuccess = await page.evaluate(() => {
                // Find OK button
                const buttons = document.querySelectorAll('button');
                let submitBtn = null;

                // Try to find button with text "OK"
                for (const btn of buttons) {
                    if (btn.textContent.trim().toUpperCase() === 'OK') {
                        submitBtn = btn;
                        break;
                    }
                }

                // Fallback: find button[type="button"]
                if (!submitBtn) {
                    submitBtn = document.querySelector('button[type="button"]');
                }

                if (submitBtn) {
                    // Scroll button into view
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Click with delay
                    submitBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    setTimeout(() => {
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        setTimeout(() => {
                            submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            submitBtn.click();
                            submitBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                        }, 100);
                    }, 200);
                    return true;
                }
                return false;
            });

            if (!submitSuccess) {
                console.warn('⚠️ Submit button not found');
            } else {
                console.log('✅ Submit button clicked');
            }

            // Wait for response
            console.log(`⏳ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Bắt buộc')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`✅ Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ JUN88 Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

            return { success: false, error: error.message };
        }
    }

    /**
     * 78WIN Add Bank (same as JUN88 - click button, select bank, fill account & password)
     */
    async addBank78WIN(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (78WIN)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "Thêm ngân hàng +" button to show form
            console.log(`🔍 Looking for "Thêm ngân hàng +" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                let addBankBtn = null;

                // Find button with text "Thêm ngân hàng"
                for (const btn of buttons) {
                    if (btn.textContent.includes('Thêm ngân hàng')) {
                        addBankBtn = btn;
                        break;
                    }
                }

                if (addBankBtn) {
                    addBankBtn.click();
                    return true;
                }
                return false;
            });

            if (!addBankButtonClicked) {
                console.warn('⚠️ "Thêm ngân hàng +" button not found');
            } else {
                console.log('✅ Clicked "Thêm ngân hàng +" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Wait for bank form to load
            try {
                await page.waitForSelector('input[id="bankid"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click bank field to open dropdown
            console.log(`🏦 Opening bank dropdown...`);
            await page.evaluate(() => {
                const bankField = document.querySelector('input[id="bankid"]');
                if (bankField) {
                    bankField.click();
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 4: Select bank from dropdown
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const bankItems = document.querySelectorAll('.mc-bank-item, [class*="bank-item"]');
                let found = false;

                // Try exact match first
                for (const item of bankItems) {
                    const itemText = item.querySelector('.mc-bank-name, [class*="bank-name"]')?.textContent?.trim().toUpperCase();
                    if (itemText === bankName.toUpperCase()) {
                        item.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const item of bankItems) {
                        const itemText = item.querySelector('.mc-bank-name, [class*="bank-name"]')?.textContent?.trim().toUpperCase();
                        if (itemText && itemText.includes(bankName.toUpperCase())) {
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && bankItems.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    bankItems[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Step 5: Fill account number and password - use slow typing
            console.log(`📝 Filling account and password...`);

            // Field 1: Account number
            try {
                console.log(`💳 Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="bankaccount"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="bankaccount"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Account number filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling account number:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((accountNumber) => {
                    const accountField = document.querySelector('input[id="bankaccount"]');
                    if (accountField) {
                        accountField.value = accountNumber;
                        accountField.dispatchEvent(new Event('input', { bubbles: true }));
                        accountField.dispatchEvent(new Event('change', { bubbles: true }));
                        accountField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.accountNumber);
            }

            // Field 2: Password
            try {
                console.log(`🔐 Filling password...`);
                await page.focus('input[id="password"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="password"]', profileData.password, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Password filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling password:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((password) => {
                    const passwordField = document.querySelector('input[id="password"]');
                    if (passwordField) {
                        passwordField.value = password;
                        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.password);
            }

            await new Promise(r => setTimeout(r, 1500));

            // Step 6: Submit form - find OK button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
            await new Promise(r => setTimeout(r, delayBeforeSubmit));

            const submitSuccess = await page.evaluate(() => {
                // Find OK button
                const buttons = document.querySelectorAll('button');
                let submitBtn = null;

                // Try to find button with text "OK"
                for (const btn of buttons) {
                    if (btn.textContent.trim().toUpperCase() === 'OK') {
                        submitBtn = btn;
                        break;
                    }
                }

                // Fallback: find button[type="button"]
                if (!submitBtn) {
                    submitBtn = document.querySelector('button[type="button"]');
                }

                if (submitBtn) {
                    // Scroll button into view
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Click with delay
                    submitBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    setTimeout(() => {
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        setTimeout(() => {
                            submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            submitBtn.click();
                            submitBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                        }, 100);
                    }, 200);
                    return true;
                }
                return false;
            });

            if (!submitSuccess) {
                console.warn('⚠️ Submit button not found');
            } else {
                console.log('✅ Submit button clicked');
            }

            // Wait for response
            console.log(`⏳ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Bắt buộc')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`✅ Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ 78WIN Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

            return { success: false, error: error.message };
        }
    }

    /**
     * JUN88V2 Add Bank (same as JUN88 - click button, select bank, fill account & password)
     */
    async addBankJUN88V2(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (JUN88V2)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "Thêm ngân hàng +" button to show form
            console.log(`🔍 Looking for "Thêm ngân hàng +" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                let addBankBtn = null;

                // Find button with text "Thêm ngân hàng"
                for (const btn of buttons) {
                    if (btn.textContent.includes('Thêm ngân hàng')) {
                        addBankBtn = btn;
                        break;
                    }
                }

                if (addBankBtn) {
                    addBankBtn.click();
                    return true;
                }
                return false;
            });

            if (!addBankButtonClicked) {
                console.warn('⚠️ "Thêm ngân hàng +" button not found');
            } else {
                console.log('✅ Clicked "Thêm ngân hàng +" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Wait for bank form to load
            try {
                await page.waitForSelector('input[id="bankid"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click bank field to open dropdown
            console.log(`🏦 Opening bank dropdown...`);
            await page.evaluate(() => {
                const bankField = document.querySelector('input[id="bankid"]');
                if (bankField) {
                    bankField.click();
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 4: Select bank from dropdown
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const bankItems = document.querySelectorAll('.mc-bank-item, [class*="bank-item"]');
                let found = false;

                // Try exact match first
                for (const item of bankItems) {
                    const itemText = item.querySelector('.mc-bank-name, [class*="bank-name"]')?.textContent?.trim().toUpperCase();
                    if (itemText === bankName.toUpperCase()) {
                        item.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const item of bankItems) {
                        const itemText = item.querySelector('.mc-bank-name, [class*="bank-name"]')?.textContent?.trim().toUpperCase();
                        if (itemText && itemText.includes(bankName.toUpperCase())) {
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && bankItems.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    bankItems[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Step 5: Fill account number and password - use slow typing
            console.log(`📝 Filling account and password...`);

            // Field 1: Account number
            try {
                console.log(`💳 Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="bankaccount"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="bankaccount"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Account number filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling account number:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((accountNumber) => {
                    const accountField = document.querySelector('input[id="bankaccount"]');
                    if (accountField) {
                        accountField.value = accountNumber;
                        accountField.dispatchEvent(new Event('input', { bubbles: true }));
                        accountField.dispatchEvent(new Event('change', { bubbles: true }));
                        accountField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.accountNumber);
            }

            // Field 2: Password
            try {
                console.log(`🔐 Filling password...`);
                await page.focus('input[id="password"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="password"]', profileData.password, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Password filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling password:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((password) => {
                    const passwordField = document.querySelector('input[id="password"]');
                    if (passwordField) {
                        passwordField.value = password;
                        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.password);
            }

            await new Promise(r => setTimeout(r, 1500));

            // Step 6: Submit form - find OK button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
            await new Promise(r => setTimeout(r, delayBeforeSubmit));

            const submitSuccess = await page.evaluate(() => {
                // Find OK button
                const buttons = document.querySelectorAll('button');
                let submitBtn = null;

                // Try to find button with text "OK"
                for (const btn of buttons) {
                    if (btn.textContent.trim().toUpperCase() === 'OK') {
                        submitBtn = btn;
                        break;
                    }
                }

                // Fallback: find button[type="button"]
                if (!submitBtn) {
                    submitBtn = document.querySelector('button[type="button"]');
                }

                if (submitBtn) {
                    // Scroll button into view
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Click with delay
                    submitBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    setTimeout(() => {
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        setTimeout(() => {
                            submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            submitBtn.click();
                            submitBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                        }, 100);
                    }, 200);
                    return true;
                }
                return false;
            });

            if (!submitSuccess) {
                console.warn('⚠️ Submit button not found');
            } else {
                console.log('✅ Submit button clicked');
            }

            // Wait for response
            console.log(`⏳ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Bắt buộc')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`✅ Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ JUN88V2 Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

            return { success: false, error: error.message };
        }
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

            // 2. Fill username only
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

            console.log(`✅ Username filled successfully`);
            console.log('📌 Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };

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

            // 2. Fill username only
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

            console.log(`✅ Username filled successfully`);
            console.log('📌 Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };

        } catch (error) {
            console.error(`❌ ABCVIP Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * JUN88 Check Promo
     * Logic: Fill username only
     */
    async checkPromoJUN88(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (JUN88)...`);

            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Fill username only
            const username = profileData?.username || '';
            console.log(`📝 Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                // Try common username field selectors
                let input = document.querySelector('input[name="username"]');
                if (!input) input = document.querySelector('input[placeholder*="username" i]');
                if (!input) input = document.querySelector('input[id*="username" i]');
                if (!input) input = document.querySelector('input[type="text"]:first-of-type');

                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            console.log(`✅ Username filled successfully`);
            console.log('📌 Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };
        } catch (error) {
            console.error(`❌ JUN88 Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
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
        } else if (category === '78win') {
            await this.fill78WINRegisterForm(page, profileData);
        } else if (category === 'jun88v2') {
            await this.fillJUN88V2RegisterForm(page, profileData);
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
                        registerUrl: 'https://sasa2.xn--8866-um1g.com/signup',
                        checkPromoUrl: 'https://trungtam.khuyenmaijun881.win/?promo_id=FR58'
                    }
                ]
            },
            '78win': {
                name: '78WIN',
                icon: '78W',
                color: '#ff9900',
                sites: [
                    {
                        name: '78WIN1',
                        registerUrl: 'https://www.78win6.zone/signup',
                        checkPromoUrl: 'https://daily78win.net/'
                    }
                ]
            },
            'jun88v2': {
                name: 'JUN88V2',
                icon: 'J8V2',
                color: '#0099cc',
                sites: [
                    {
                        name: 'JUN88V2',
                        registerUrl: 'https://www.ufhtoiklhkfkjguhd7eoij8icxhkjk9.com/signup',
                        checkPromoUrl: 'https://jun88ok99.com/?promo_id=FR58'
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
     * JUN88 Register Form (Form 1 - playerid, password, firstname, email, mobile)
     * Anti-bot measures: slow typing, delays between fields, human-like interactions
     */
    async fillJUN88RegisterForm(page, profileData) {
        try {
            console.log('🤖 JUN88 Form - Anti-bot mode enabled');
            const filler = new CommonFormFiller();

            // Wait for form to be interactive
            await filler.waitForForm(page, 'input[id="playerid"]', 10000);
            await new Promise(r => setTimeout(r, 1000));

            // Prepare phone (remove leading 0)
            let phone = profileData.phone || '';
            if (phone.startsWith('0')) {
                phone = phone.substring(1);
            }

            // Fill fields using common filler
            const fields = [
                { selector: 'input[id="playerid"]', value: profileData.username, label: 'username' },
                { selector: 'input[id="password"]', value: profileData.password, label: 'password' },
                { selector: 'input[id="firstname"]', value: profileData.fullname || '', label: 'fullname' },
                { selector: 'input[id="email"]', value: profileData.email || '', label: 'email' },
                { selector: 'input[id="mobile"]', value: phone, label: 'mobile' }
            ];

            await filler.fillMultipleFields(page, fields, {
                charDelay: 150,
                beforeFocus: 300,
                afterField: 800
            });

            // Handle agree checkbox - skip if already checked
            console.log('✅ Checking agree checkbox...');
            try {
                const isChecked = await page.evaluate(() => {
                    const checkbox = document.querySelector('input[id="agree"]');
                    return checkbox ? checkbox.checked : false;
                });

                if (!isChecked) {
                    const agreeCheckbox = await page.$('input[id="agree"]');
                    if (agreeCheckbox) {
                        await page.hover('input[id="agree"]');
                        await new Promise(r => setTimeout(r, 200));
                        await page.click('input[id="agree"]');
                        await new Promise(r => setTimeout(r, 500));
                    }
                } else {
                    console.log('✅ Agree checkbox already checked');
                }
            } catch (error) {
                console.warn('⚠️ Could not interact with agree checkbox:', error.message);
            }

            // Trigger change events for all fields (React compatibility)
            await page.evaluate(() => {
                const fields = [
                    'input[id="playerid"]',
                    'input[id="password"]',
                    'input[id="firstname"]',
                    'input[id="email"]',
                    'input[id="mobile"]',
                    'input[id="agree"]'
                ];

                fields.forEach(selector => {
                    const field = document.querySelector(selector);
                    if (field) {
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                        field.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                });
            });

            console.log('✅ JUN88 form filled successfully');
        } catch (error) {
            console.error('❌ Error filling JUN88 form:', error.message);
            throw error;
        }
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

            // JUN88 sites (Form 1 - có email)
            if (domain.includes('jun88') || domain.includes('jun-88')) {
                return 'jun88';
            }

            // 78WIN sites (Form 2 - không email)
            if (domain.includes('78win') || domain.includes('78-win')) {
                return '78win';
            }

            // JUN88V2 sites (Form 3 - JOJODIOS)
            if (domain.includes('jun88v2') || domain.includes('jun-88v2') ||
                domain.includes('jojodios')) {
                return 'jun88v2';
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
     * Lưu thông tin tài khoản vào dashboard API
     */
    async saveAccountInfo(profileData, category, siteName, allSites = []) {
        try {
            console.log(`    💾 Saving ${category.toUpperCase()} account info via API...`);

            // Prepare account info
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
                firstSite: siteName,
                sites: Array.isArray(allSites)
                    ? allSites.map(s => typeof s === 'string' ? s : s.name || s)
                    : [],
                status: 'active',
                category: category,
                tool: 'vip-tool'
            };

            // Get dashboard port (dynamic)
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            const apiUrl = `http://localhost:${dashboardPort}/api/accounts/${category}/${profileData.username}`;
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
            console.error(`    ❌ Error saving account info:`, error.message);
            throw error;
        }
    }
}

module.exports = VIPAutomation;




