/**
 * VIP Tool Automation - 3 Categories (OKVIP, ABCVIP, JUN88, JUN88V2, AccOKVIP)
 * Luồng chung: register → addbank → checkpromo
 * Form filling riêng cho từng category
 */

// Import fetch for Node.js (v18+)
const fetch = global.fetch || require('node-fetch');

// Get dashboard port
const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;

// Import tab rotator
const tabRotator = require('./tab-rotator');

// Import common form filler
const CommonFormFiller = require('../common/form-filler');

// JUN88V2 specific bank mapping (matches exact dropdown text)
const JUN88V2_BANK_NAME_MAPPING = {
    'Vietcombank': 'Vietcombank / Ngân hàng Ngoại Thương',
    'Techcombank': 'Techcom Bank',
    'BIDV': 'BIDV / Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    'VietinBank': 'VietinBank / Ngân hàng Công Thương',
    'Agribank': 'Agribank / Ngân hàng Nông nghiệp',
    'ACB': 'ACB / Ngân hàng Á Châu',
    'MB': 'MBBank / Ngân hàng Quân Đội',
    'MBBank': 'MBBank / Ngân hàng Quân Đội',
    'TPBank': 'TPBank / Ngân hàng Tiên Phong',
    'VPBank': 'VPBank / Ngân hàng Việt Nam Thịnh Vượng',
    'Sacombank': 'Sacombank / Ngân hàng Sài Gòn Thương Tín',
    'HDBank': 'HDBank',
    'VIB': 'VIB / Ngân hàng Quốc Tế',
    'SHB': 'SHB / Ngân hàng Sài Gòn-Hà Nội',
    'Eximbank': 'Eximbank / Ngân hàng Xuất Nhập Khẩu',
    'MSB': 'MSB / Ngân Hàng Hàng Hải',
    'OCB': 'OCB / Ngân hàng Phương Đông',
    'SeABank': 'SeABank / Ngân hàng Đông Nam Á',
    'NamABank': 'NamABank / Ngân hàng Nam Á',
    'Nam A Bank': 'NamABank / Ngân hàng Nam Á',
    'PVcomBank': 'PVcomBank / Ngân hàng Đại Chúng',
    'BacABank': 'BacABank / Ngân hàng Bắc Á',
    'BacA Bank': 'BacABank / Ngân hàng Bắc Á',
    'Viet Capital Bank': 'Viet Capital Bank / Ngân hàng Bản Việt',
    'VietCapital': 'Viet Capital Bank / Ngân hàng Bản Việt',
    'LPBank': 'LPBank / Ngân hàng Bưu điện Liên Việt',
    'LienVietPostBank': 'LPBank / Ngân hàng Bưu điện Liên Việt',
    'Kien Long Bank': 'Kien Long Bank /  Kiên Long Bank',
    'KienLongBank': 'Kien Long Bank /  Kiên Long Bank',
    'GPBank': 'GPBank',
    'PG Bank': 'PG Bank / Petrolimex',
    'PGBank': 'PG Bank / Petrolimex',
    'NCB': 'NCB / Ngân hàng Quốc Dân',
    'SCB': 'SCB / Ngân hàng Sài Gòn',
    'VietABank': 'VietABank / Ngân hàng Việt Á',
    'VietBank': 'VietBank / Việt Nam Thương Tín',
    'ABBank': 'ABBank / Ngân hàng An Bình',
    'ABBANK': 'ABBank / Ngân hàng An Bình',
    'CBBank': 'CBBank / Ngân hàng Xây Dựng',
    'CBBANK': 'CBBank / Ngân hàng Xây Dựng',
    'COOPBANK': 'COOPBANK - Ngân hàng Hợp tác xã Việt Nam',
    'OceanBank': 'OceanBank',
    'Shinhan Bank': 'Shinhan Bank',
    'Shinhan': 'Shinhan Bank',
    'HSBC Bank': 'HSBC Bank',
    'HSBC': 'HSBC Bank',
    'Standard Chartered': 'Standard Chartered Bank Limited',
    'StandardChartered': 'Standard Chartered Bank Limited',
    'Citibank': 'Citibank',
    'ANZ': 'ANZ BANK',
    'UOB': 'UOB',
    'Hong Leong Bank': 'Hong Leong Bank',
    'HongLeong': 'Hong Leong Bank',
    'CIMB Bank': 'CIMB Bank',
    'CIMB': 'CIMB Bank',
    'KASIKORNBANK': 'KASIKORNBANK',
    'KBank': 'KASIKORNBANK',
    'Woori Bank': 'Woori Bank',
    'Woori': 'Woori Bank',
    'DBS': 'DBS',
    'BAOVIET Bank': 'BAOVIET Bank',
    'BAO VIET BANK': 'BAOVIET Bank',
    'IBK': 'IBK / Ngân Hàng Công Nghiệp Hàn Quốc',
    'NongHyup Bank': 'NongHyup Bank',
    'NongHyup': 'NongHyup Bank',
    'VRB': 'VRB / Ngân hàng Việt - Nga',
    'IVB': 'IVB / Indovina Bank',
    'Indovina': 'IVB / Indovina Bank',
    'SaigonBank': 'SaigonBank / Sài Gòn Công Thương',
    'Cake by VPBank': 'Cake by VPBank',
    'Cake': 'Cake by VPBank',
    'Liobank by OCB': 'Liobank by OCB',
    'Liobank': 'Liobank by OCB',
    'Timo by BVBank': 'Timo by BVBank',
    'Timo': 'Timo by BVBank',
    'VBSP': 'VBSP / Ngân hàng Chính sách xã hội',
    'Vikki by HDBank': 'Vikki by HDBank',
    'Vikki': 'Vikki by HDBank',
    'MBV': 'MBV / Ngân hàng Việt Nam Hiện Đại'
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
            'okvipOtp': {
                withdrawPassword: '/home/security?active=5',
                bank: '/home/withdraw?active=0'
            },
            'accOkvip': {
                // accOkvip chỉ cần register, không cần addBank/checkPromo
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'abcvip': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'jun88': {
                withdrawPassword: '/Account/ChangeMoneyPassword', //  k cần
                bank: '/account/withdrawaccounts/bankcards'
            },
            '78win': {
                withdrawPassword: '/Account/ChangeMoneyPassword',//  k cần
                bank: '/account/withdrawaccounts/bankcards'
            },
            'jun88v2': {
                withdrawPassword: '/Account/ChangeMoneyPassword',//  k cần
                bank: '/myaccount/bankdetails'
            },
            '22vip': {
                withdrawPassword: '/home/security?active=5',
                bank: '/home/withdraw?active=0'
            }
        };
    }

    /**
     * Helper: Map bank name từ VietQR API sang dropdown option
     */
    mapBankName(bankName, category = null) {
        if (!bankName) return '';

        // Only use mapping for JUN88V2
        if (category === 'jun88v2') {
            // Thử mapping trực tiếp
            if (JUN88V2_BANK_NAME_MAPPING[bankName]) {
                return JUN88V2_BANK_NAME_MAPPING[bankName];
            }

            // Thử tìm kiếm không phân biệt hoa thường
            const lowerInput = bankName.toLowerCase();
            for (const [key, value] of Object.entries(JUN88V2_BANK_NAME_MAPPING)) {
                if (key.toLowerCase() === lowerInput) {
                    return value;
                }
            }

            // Thử tìm kiếm partial match
            for (const [key, value] of Object.entries(JUN88V2_BANK_NAME_MAPPING)) {
                if (key.toLowerCase().includes(lowerInput) || lowerInput.includes(key.toLowerCase())) {
                    return value;
                }
            }

            console.warn(`⚠️ No mapping found for bank: ${bankName}`);
        }

        // For other categories, return bankName as-is (no mapping)
        return bankName;
    }

    /**
     * Helper: Find bank item in dropdown and click it
     * Logs all available banks for debugging
     */
    async selectBankFromDropdown(page, bankName, selector = '.mc-bank-item') {
        console.log(`🏦 Selecting bank: ${bankName}`);

        const result = await page.evaluate((bankNameToFind, itemSelector) => {
            const bankItems = document.querySelectorAll(itemSelector);
            console.log(`📋 Found ${bankItems.length} bank items in dropdown`);

            // Log all available banks for debugging
            const availableBanks = [];
            bankItems.forEach((item, index) => {
                const itemText = item.querySelector('[class*="bank-name"]')?.textContent?.trim() ||
                    item.textContent?.trim();
                availableBanks.push(itemText);
                console.log(`  [${index}] ${itemText}`);
            });

            let found = false;
            let selectedBank = null;

            // Try exact match first
            for (const item of bankItems) {
                const itemText = item.querySelector('[class*="bank-name"]')?.textContent?.trim().toUpperCase() ||
                    item.textContent?.trim().toUpperCase();
                console.log(`  Comparing: "${itemText}" === "${bankNameToFind.toUpperCase()}"`);
                if (itemText === bankNameToFind.toUpperCase()) {
                    console.log(`✅ Exact match found: ${itemText}`);
                    item.click();
                    found = true;
                    selectedBank = itemText;
                    break;
                }
            }

            // Try partial match if exact not found
            if (!found) {
                for (const item of bankItems) {
                    const itemText = item.querySelector('[class*="bank-name"]')?.textContent?.trim().toUpperCase() ||
                        item.textContent?.trim().toUpperCase();
                    console.log(`  Partial check: "${itemText}".includes("${bankNameToFind.toUpperCase()}")`);
                    if (itemText && itemText.includes(bankNameToFind.toUpperCase())) {
                        console.log(`✅ Partial match found: ${itemText}`);
                        item.click();
                        found = true;
                        selectedBank = itemText;
                        break;
                    }
                }
            }

            // Fallback: select first option
            if (!found && bankItems.length > 0) {
                const firstBank = bankItems[0].querySelector('[class*="bank-name"]')?.textContent?.trim() ||
                    bankItems[0].textContent?.trim();
                console.warn(`⚠️ Bank not found, selecting first option: ${firstBank}`);
                bankItems[0].click();
                selectedBank = firstBank;
            }

            return {
                found: found,
                selectedBank: selectedBank,
                availableBanks: availableBanks
            };
        }, bankName, selector);

        return result;
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
     * Helper: Send status update to dashboard
     */
    async sendStatusUpdate(profileData, status, message) {
        try {
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: profileData.profileId,
                    username: profileData.username,
                    status: status,
                    message: message,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (err) {
            console.warn('⚠️ Failed to send status update:', err.message);
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

            // Use AutoCaptcha.pro only
            return await this.solveCaptchaViaAutoCaptcha(base64Image, apiKey);
        } catch (error) {
            console.error('❌ Captcha API error:', error.message);
            return null;
        }
    }

    async solveCaptchaViaAutoCaptcha(base64Image, apiKey) {
        try {
            console.log('🔐 Solving captcha via autocaptcha.pro API...');
            console.log('� SBase64 length:', base64Image?.length || 0);

            // Clean base64
            const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

            // Step 1: Submit captcha
            console.log('📤 Sending to autocaptcha.pro API...');
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
            console.error('❌ AutoCaptcha API error:', error.message);
            return null;
        }
    }

    /**
     * Get phone number from Viotp API (không chờ OTP)
     * Thử lần lượt các serviceId cho đến khi thành công
     */
    async getPhoneFromViotp(viotpToken, serviceIds = [3, 21, 1, 2, 4, 5]) {
        try {
            if (!viotpToken) {
                console.warn('⚠️ No Viotp token provided');
                return null;
            }

            // Nếu serviceIds là số, convert thành array
            if (typeof serviceIds === 'number') {
                serviceIds = [serviceIds];
            }

            console.log(`📱 Requesting phone number from Viotp API (serviceIds: ${serviceIds.join(', ')})...`);

            // Thử lần lượt các serviceId
            for (const serviceId of serviceIds) {
                try {
                    console.log(`  → Trying serviceId: ${serviceId}`);

                    // Request phone number
                    const requestUrl = `https://api.viotp.com/request/getv2?token=${viotpToken}&serviceId=${serviceId}&network=VIETTEL|MOBIFONE|VINAPHONE`;
                    const requestResponse = await fetch(requestUrl);
                    const requestData = await requestResponse.json();

                    console.log(`  📤 Viotp response (serviceId ${serviceId}):`, JSON.stringify(requestData));

                    // Kiểm tra response
                    if (!requestData.success) {
                        console.warn(`  ⚠️ ServiceId ${serviceId} failed: ${requestData.message || 'Unknown error'}`);
                        continue; // Try next serviceId
                    }

                    // Kiểm tra data
                    if (!requestData.data) {
                        console.warn(`  ⚠️ ServiceId ${serviceId}: No data in response`);
                        continue; // Try next serviceId
                    }

                    const phoneData = requestData.data;
                    const requestId = phoneData.request_id;
                    let phoneNumber = phoneData.phone_number;

                    // Kiểm tra số điện thoại hợp lệ
                    if (!phoneNumber) {
                        console.warn(`  ⚠️ ServiceId ${serviceId}: No phone number in response`);
                        continue; // Try next serviceId
                    }

                    // Loại bỏ số "0" hoặc số quá ngắn
                    if (phoneNumber === '0') {
                        console.warn(`  ⚠️ ServiceId ${serviceId}: Invalid phone number: ${phoneNumber}`);
                        continue; // Try next serviceId
                    }

                    // Nếu số không có số 0 ở đầu, thêm vào (Viotp trả về số không có 0)
                    // Ví dụ: 921420951 → 0921420951
                    if (!phoneNumber.startsWith('0')) {
                        phoneNumber = '0' + phoneNumber;
                    }

                    // Kiểm tra độ dài (phải >= 10 ký tự sau khi thêm 0)
                    if (phoneNumber.length < 10) {
                        console.warn(`  ⚠️ ServiceId ${serviceId}: Phone number too short: ${phoneNumber}`);
                        continue; // Try next serviceId
                    }

                    console.log(`✅ Got phone number (serviceId ${serviceId}): ${phoneNumber}`);
                    console.log(`📝 Request ID: ${requestId}`);

                    return {
                        success: true,
                        phoneNumber,
                        requestId,
                        serviceId
                    };
                } catch (err) {
                    console.warn(`  ⚠️ ServiceId ${serviceId} error:`, err.message);
                    continue; // Try next serviceId
                }
            }

            // Tất cả serviceIds đều thất bại
            console.error('❌ All serviceIds failed - No available phone numbers');
            return null;
        } catch (error) {
            console.error('❌ Viotp API error:', error.message);
            return null;
        }
    }

    /**
     * Get OTP from Viotp API (chờ OTP sau khi form filled)
     */
    async getOtpFromViotp(viotpToken, requestId) {
        try {
            if (!viotpToken || !requestId) {
                console.warn('⚠️ Viotp token or request ID missing');
                return null;
            }

            console.log('⏳ Waiting for OTP from Viotp...');
            let otp = null;
            let attempts = 0;
            const maxAttempts = 120; // 120 seconds

            while (!otp && attempts < maxAttempts) {
                attempts++;
                await new Promise(r => setTimeout(r, 1000));

                const sessionUrl = `https://api.viotp.com/session/getv2?requestId=${requestId}&token=${viotpToken}`;
                const sessionResponse = await fetch(sessionUrl);
                const sessionData = await sessionResponse.json();

                if (sessionData.status_code === 200 && sessionData.data && sessionData.data.Code) {
                    otp = sessionData.data.Code;
                    console.log(`✅ OTP received: ${otp}`);
                    break;
                }

                if (attempts % 10 === 0) {
                    console.log(`⏳ Waiting for OTP... (${attempts}s)`);
                }
            }

            if (!otp) {
                console.error('❌ OTP timeout after 120 seconds');
                return null;
            }

            return {
                success: true,
                code: otp,
                requestId
            };
        } catch (error) {
            console.error('❌ Viotp OTP error:', error.message);
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
                    await page.waitForSelector('img#captcha, img[src^="data:image"], .codeImage', { timeout: 2000 }).catch(() => null);

                    // Get captcha image with detailed logging
                    captchaImage = await page.evaluate(() => {
                        // Log all images on page
                        const allImages = document.querySelectorAll('img');
                        console.log(`📊 Total images on page: ${allImages.length}`);

                        allImages.forEach((img, idx) => {
                            const src = img.src.substring(0, 100); // First 100 chars
                            console.log(`  [${idx}] class="${img.className}" id="${img.id}" src="${src}..."`);
                        });

                        // Try selectors in order
                        let img = document.querySelector('img#captcha');
                        if (img) {
                            console.log('✅ Found by id="captcha"');
                            return img.src;
                        }

                        // For AccOKVIP: find captcha field (field 7) and get its .codeImage
                        const captchaField = document.querySelector('#van-field-7-input');
                        if (captchaField) {
                            // Find the closest .codeImage to the captcha field
                            const parent = captchaField.closest('.van-field');
                            if (parent) {
                                img = parent.querySelector('.codeImage');
                                if (img) {
                                    console.log('✅ Found by #van-field-7-input parent .codeImage');
                                    return img.src;
                                }
                            }
                        }

                        img = document.querySelector('img[src^="data:image"]');
                        if (img) {
                            console.log('✅ Found by src^="data:image"');
                            return img.src;
                        }

                        // For AccOKVIP: get the LAST .codeImage (captcha), not the first (phone icon)
                        const codeImages = document.querySelectorAll('.codeImage');
                        if (codeImages.length > 0) {
                            img = codeImages[codeImages.length - 1]; // Get last one
                            console.log(`✅ Found by class="codeImage" (${codeImages.length} total, using last)`);
                            return img.src;
                        }

                        // Try to find captcha by looking for images with specific dimensions or patterns
                        for (const image of allImages) {
                            const src = image.src;
                            // Look for images that are likely captcha (not too small, not too large)
                            if (src && (src.includes('captcha') || src.includes('code') || src.includes('verify'))) {
                                console.log('✅ Found by src pattern');
                                return src;
                            }
                        }

                        return null;
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
                    '#van-field-7-input',  // AccOKVIP captcha field
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

        // Send running status to dashboard
        try {
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;

            // Track running profile in server memory (like nohu tool)
            if (global.runningProfiles) {
                global.runningProfiles.set(profileData.profileId, {
                    profileId: profileData.profileId,
                    username: profileData.username,
                    profileName: profileData.profileName,
                    startTime: Date.now()
                });
                console.log(`✅ Tracking VIP running profile: ${profileData.profileId} (${profileData.username})`);
            }

            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: profileData.profileId,
                    username: profileData.username,
                    status: 'running',
                    category: category, // 🔥 Add category to status
                    message: `🚀 Bắt đầu chạy ${sites.length} site(s) (${category.toUpperCase()})...`,
                    sites: sites.map(s => ({ name: s })),
                    timestamp: new Date().toISOString()
                })
            });
            console.log('📤 Sent running status to dashboard');
        } catch (err) {
            console.warn('⚠️ Failed to send running status:', err.message);
        }

        // Tạo shared browser context cho checkPromo (nếu cần)
        // NOTE: Disabled shared context to avoid conflicts with other tools (Nohu, etc.)
        // Each site will use its own browser instance for checkPromo
        let sharedPromoContext = null;
        // if (mode === 'auto' || mode === 'promo') {
        //     try {
        //         console.log(`🪟 Creating shared browser context for checkPromo...`);
        //         sharedPromoContext = await browser.createBrowserContext();
        //         console.log(`✅ Shared browser context created`);
        //     } catch (error) {
        //         console.warn(`⚠️ Failed to create shared context:`, error.message);
        //     }
        // }

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

        // Send completed status to dashboard
        try {
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            const successCount = results.filter(r => r.register?.success || r.addBank?.success || r.checkPromo?.success).length;
            const totalCount = results.length;

            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: profileData.profileId,
                    username: profileData.username,
                    status: 'completed',
                    category: category,
                    message: `✅ Hoàn thành: ${successCount}/${totalCount} site(s) thành công`,
                    results: results,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('📤 Sent completed status to dashboard');
        } catch (err) {
            console.warn('⚠️ Failed to send completed status:', err.message);
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

                        // Update account info with bank data if addBank succeeded
                        if (addBankResult?.success) {
                            console.log(`💾 Updating account info with bank data for ${siteName}...`);
                            try {
                                const siteNames = Array.isArray(sites)
                                    ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                                    : [];
                                await this.saveAccountInfo(profileData, category, siteName, siteNames);
                                console.log(`✅ Account info updated with bank data`);
                            } catch (err) {
                                console.warn(`⚠️ Error updating account info:`, err.message);
                            }
                        }
                    }

                    // Skip checkPromo (all VIP use separate tab for checkPromo)
                    const checkPromoResult = { success: true, skipped: true, message: 'Skipped - use separate tab' };
                    console.log(`⏭️ Skipping checkPromo for ${siteName} (use separate tab)`);

                    // Build result object
                    const resultObj = {
                        site: siteName,
                        register: registerResult
                    };
                    if (addBankResult !== null) resultObj.addBank = addBankResult;
                    if (checkPromoResult !== null) resultObj.checkPromo = checkPromoResult;

                    results.push(resultObj);
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

            // Add delay between sites to reduce resource contention with other tools
            if (siteName !== sites[sites.length - 1]) {
                console.log(`⏳ Waiting 1 second before next site (to avoid Hidemium resource exhaustion)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
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

                // Only show batch number if parallel (parallelCount > 1)
                if (parallelCount > 1) {
                    console.log(`\n📦 Processing batch ${Math.floor(i / parallelCount) + 1}: ${batch.join(', ')}`);
                } else {
                    console.log(`\n🚀 Processing: ${batch.join(', ')}`);
                }

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

                // Add delay between batches to avoid overwhelming Hidemium (prevent connection issues with other tools)
                if (i + parallelCount < sites.length) {
                    console.log(`⏳ Waiting 2 seconds before next batch (to avoid Hidemium resource exhaustion)...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
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

                    // Update account info with bank data if addBank succeeded
                    if (addBankResult?.success) {
                        console.log(`💾 Updating account info with bank data for ${siteName}...`);
                        try {
                            const siteNames = Array.isArray(sites) && sites.length > 0
                                ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                                : [];
                            await this.saveAccountInfo(profileData, category, siteName, siteNames);
                            console.log(`✅ Account info updated with bank data`);
                        } catch (err) {
                            console.warn(`⚠️ Error updating account info:`, err.message);
                        }
                    }
                }

                // Skip checkPromo (all VIP use separate tab for checkPromo)
                const checkPromoResult = { success: true, skipped: true, message: 'Skipped - use separate tab' };
                console.log(`⏭️ Skipping checkPromo for ${siteName} (use separate tab)`);

                // Build result object
                const resultObj = {
                    site: siteName,
                    register: registerResult
                };
                if (addBankResult !== null) resultObj.addBank = addBankResult;
                if (checkPromoResult !== null) resultObj.checkPromo = checkPromoResult;

                return resultObj;
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

                // JUN88V2: Form is now ready, no need to click button anymore
                console.log('✅ Registration form ready, proceeding to fill form...');
            }

            // Gọi form filler riêng cho category
            await this.fillRegisterForm(page, category, profileData, siteConfig);

            // For AccOKVIP: Check if phone was successfully fetched from Viotp (only if API mode)
            if (category === 'accOkvip' && profileData.simMode === 'api') {
                // Check if we have a valid phone number
                if (!profileData.viotpRequestId) {
                    console.error('❌ AccOKVIP: Failed to get phone number from Viotp API');
                    console.error('❌ Viotp API returned: No available phone numbers');

                    // Throw error to trigger catch block and proper error handling
                    throw new Error('Viotp API: Hiện không có sẵn số điện thoại phù hợp. Vui lòng thử lại sau!');
                }
            }

            // For OKVIP OTP: Check if phone was successfully fetched from Viotp (only if API mode)
            if (category === 'okvipOtp' && profileData.simMode === 'api') {
                // Check if we have a valid phone number
                if (!profileData.viotpRequestId) {
                    console.error('❌ OKVIP OTP: Failed to get phone number from Viotp API');
                    console.error('❌ Viotp API returned: No available phone numbers');

                    // Throw error to trigger catch block and proper error handling
                    throw new Error('Viotp API: Hiện không có sẵn số điện thoại phù hợp. Vui lòng thử lại sau!');
                }
            }

            // Delay sau khi fill form (give React time to process changes)
            await new Promise(r => setTimeout(r, 3000));

            // Inject scripts (captcha-solver, etc.)
            try {
                await this.injectScripts(page);
            } catch (injectError) {
                console.warn('⚠️ Failed to inject scripts:', injectError.message);
            }

            // Solve captcha nếu có API key
            // Skip captcha for JUN88V2, 22VIP, AccOKVIP, and OKVIP OTP (no captcha after form fill)
            const shouldSolveCaptcha = !['jun88v2', '22vip', 'accOkvip', 'okvipOtp'].includes(category);
            const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
            if (apiKey && shouldSolveCaptcha) {
                console.log('🎵 Attempting to solve captcha...');
                const captchaSolved = await this.solveCaptchaOnPage(page, apiKey);
                if (!captchaSolved) {
                    console.warn('⚠️ Captcha solve failed, continuing anyway...');
                }
                // Tăng delay cho ABCVIP (10s), bình thường 3s
                const captchaDelay = category === 'abcvip' ? 10000 : 3000;
                console.log(`⏳ Waiting ${captchaDelay}ms after captcha solve...`);
                await new Promise(r => setTimeout(r, captchaDelay));
            } else if (!shouldSolveCaptcha) {
                console.log('⏭️ Skipping captcha for JUN88V2, 22VIP, AccOKVIP, and OKVIP OTP (no captcha after form fill)');
            } else {
                console.warn('⚠️ No captcha API key provided');
            }

            // Add random delay 2-5s before submit (all VIP categories, but NOT AccOKVIP and OKVIP OTP)
            if (!['accOkvip', 'okvipOtp'].includes(category)) {
                const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
                console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit registration...`);
                await new Promise(r => setTimeout(r, delayBeforeSubmit));
            } else {
                // AccOKVIP & OKVIP OTP: no delay, submit immediately
                console.log('⏭️ AccOKVIP/OKVIP OTP: No delay, submitting immediately...');
            }

            // Submit form
            console.log(`📤 Submitting registration form for ${siteConfig.name}...`);

            // Click submit button (like tool22vip does)
            await page.evaluate(() => {
                let submitBtn = null;

                // For 22VIP/888P: use specific id
                submitBtn = document.querySelector('#insideRegisterSubmitClick');

                // Fallback for other categories
                if (!submitBtn) {
                    submitBtn = document.querySelector('button.ui-button--primary.ui-button--block');
                }

                if (!submitBtn) {
                    submitBtn = document.querySelector('button[type="submit"]');
                }

                if (!submitBtn) {
                    const buttons = document.querySelectorAll('button[type="button"]');
                    for (const btn of buttons) {
                        if (btn.textContent.includes('ĐĂNG KÝ') || btn.textContent.includes('OK')) {
                            submitBtn = btn;
                            break;
                        }
                    }
                }

                // If not found in main document, search iframes
                if (!submitBtn) {
                    const iframes = document.querySelectorAll('iframe');
                    for (let iframe of iframes) {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            submitBtn = iframeDoc.querySelector('#insideRegisterSubmitClick') ||
                                iframeDoc.querySelector('button.ui-button--primary.ui-button--block') ||
                                iframeDoc.querySelector('button[type="submit"]');
                            if (submitBtn) break;
                        } catch (e) {
                            // Skip iframes with access denied
                        }
                    }
                }

                if (submitBtn) {
                    // Scroll into view
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Wait a bit then click with multiple methods (like tool22vip)
                    setTimeout(() => {
                        // Method 1: TouchEvent
                        try {
                            const touchStart = new TouchEvent('touchstart', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                touches: [new Touch({
                                    identifier: 0,
                                    target: submitBtn,
                                    clientX: submitBtn.getBoundingClientRect().left + 10,
                                    clientY: submitBtn.getBoundingClientRect().top + 10
                                })]
                            });
                            submitBtn.dispatchEvent(touchStart);

                            const touchEnd = new TouchEvent('touchend', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            submitBtn.dispatchEvent(touchEnd);
                        } catch (e) {
                            // Touch not supported
                        }

                        // Method 2: PointerEvent
                        submitBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
                        submitBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));

                        // Method 3: MouseEvent
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

                        // Method 4: Native click
                        submitBtn.click();
                    }, 3000);
                }
            });

            // Delay sau khi submit
            await new Promise(r => setTimeout(r, 5000));

            // For accOkvip: click "Gửi đi" button with retry logic for duplicate phone
            if (category === 'accOkvip') {
                console.log(`🖱️ AccOKVIP: Clicking "Gửi đi" button to complete registration...`);

                let registrationSuccess = false;
                let retryCount = 0;
                const maxRetries = 10;
                const viotpToken = this.settings?.viotpToken || process.env.VIOTP_TOKEN;
                let currentPage = page; // Use currentPage instead of reassigning page

                while (!registrationSuccess && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`📝 AccOKVIP registration attempt ${retryCount}/${maxRetries}`);

                    try {
                        const sendClicked = await currentPage.evaluate(() => {
                            // Find "Gửi đi" button by class
                            const sendBtn = document.querySelector('.send.sendStyle1');
                            if (sendBtn) {
                                sendBtn.click();
                                console.log('✅ "Gửi đi" button clicked');
                                return true;
                            }

                            // Fallback: find by text content in div
                            const divButtons = document.querySelectorAll('div[class*="send"]');
                            for (const btn of divButtons) {
                                if (btn.textContent.includes('Gửi đi')) {
                                    btn.click();
                                    console.log('✅ "Gửi đi" button clicked (by div text)');
                                    return true;
                                }
                            }

                            // Fallback 2: find any element with "Gửi đi" text
                            const allElements = document.querySelectorAll('*');
                            for (const el of allElements) {
                                if (el.textContent.trim() === 'Gửi đi' || (el.textContent.includes('Gửi đi') && el.offsetHeight > 0)) {
                                    el.click();
                                    console.log('✅ "Gửi đi" button clicked (by text search)');
                                    return true;
                                }
                            }

                            console.warn('⚠️ "Gửi đi" button not found');
                            return false;
                        });

                        if (!sendClicked) {
                            console.warn('⚠️ Could not click "Gửi đi" button, but continuing with OTP retrieval...');
                        }

                        // Wait for button to load and response
                        await new Promise(r => setTimeout(r, 5000));

                        // Check for error message (phone already registered) - chỉ detect error cụ thể
                        const errorDetected = await currentPage.evaluate(() => {
                            // Look for specific error messages about phone registration
                            const errorContainers = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="message"], [class*="toast"], [class*="notify"]');

                            const phoneErrorKeywords = [
                                'đã được đăng kí',
                                'already registered',
                                'số điện thoại',
                                'phone',
                                'đã tồn tại',
                                'exist'
                            ];

                            for (const container of errorContainers) {
                                const text = container.textContent.toLowerCase();
                                // Check if it's a phone-related error
                                const hasPhoneKeyword = phoneErrorKeywords.some(keyword => text.includes(keyword));
                                if (hasPhoneKeyword) {
                                    console.log(`🔴 Phone error detected: ${container.textContent}`);
                                    return true;
                                }
                            }

                            return false;
                        });

                        if (errorDetected) {
                            console.warn(`⚠️ Error detected: Phone might be already registered`);

                            if (retryCount < maxRetries && viotpToken) {
                                console.log(`🔄 Retrying with new phone number on current tab...`);

                                // Get new phone number (thử serviceId 3 và 21)
                                const newPhoneResult = await this.getPhoneFromViotp(viotpToken);
                                if (newPhoneResult && newPhoneResult.phoneNumber) {
                                    const newPhone = newPhoneResult.phoneNumber;
                                    console.log(`✅ Got new phone: ${newPhone}`);

                                    // Reload current page instead of opening new tab
                                    console.log('� Relnoading current tab with new phone number...');
                                    const registerUrl = 'https://m.okvipau.com/register';
                                    await currentPage.goto(registerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                                    // Update profileData with new phone
                                    profileData.phone = newPhone;
                                    profileData.viotpRequestId = newPhoneResult.requestId;

                                    // Fill form on current page
                                    await this.fillAccOkvipRegisterForm(currentPage, profileData);

                                    // Solve captcha
                                    const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
                                    if (apiKey) {
                                        await this.solveCaptchaOnPage(currentPage, apiKey);
                                    }

                                    // Click "Bước tiếp theo"
                                    await currentPage.evaluate(() => {
                                        const submitBtn = document.querySelector('button[type="submit"]');
                                        if (submitBtn) {
                                            submitBtn.click();
                                            console.log('✅ "Bước tiếp theo" button clicked');
                                        }
                                    });

                                    await new Promise(r => setTimeout(r, 3000));

                                    // Continue with "Gửi đi" on current page
                                    continue;
                                } else {
                                    console.error('❌ Failed to get new phone number');
                                    return { success: false, message: 'Failed to get new phone number after retry' };
                                }
                            } else {
                                console.error('❌ Max retries reached or no Viotp token');
                                return { success: false, message: `Registration failed after ${retryCount} attempts` };
                            }
                        } else {
                            // No error detected, registration successful
                            console.log(`✅ AccOKVIP registration form submitted successfully`);

                            // Check if manual mode - if so, wait for user to submit OTP manually
                            if (profileData.simMode === 'manual') {
                                console.log('✏️ Manual mode: Waiting for user to submit OTP manually...');
                                console.log('📌 Keeping page open for manual OTP entry');

                                // Wait for user to submit OTP (check for URL change or success message)
                                let otpSubmitted = false;
                                let waitAttempts = 0;
                                const maxWaitAttempts = 600; // Wait up to 10 minutes (600 * 1 second)

                                while (!otpSubmitted && waitAttempts < maxWaitAttempts) {
                                    waitAttempts++;
                                    await new Promise(r => setTimeout(r, 1000));

                                    // Check if page URL changed (success redirect)
                                    const currentUrl = currentPage.url();
                                    if (!currentUrl.includes('register') && !currentUrl.includes('okvip')) {
                                        console.log(`✅ URL changed to: ${currentUrl} - OTP likely submitted successfully`);
                                        otpSubmitted = true;
                                        break;
                                    }

                                    // Check for success message
                                    const successDetected = await currentPage.evaluate(() => {
                                        const successKeywords = ['thành công', 'success', 'đăng ký thành công', 'registration successful'];
                                        const allText = document.body.innerText.toLowerCase();
                                        return successKeywords.some(keyword => allText.includes(keyword));
                                    });

                                    if (successDetected) {
                                        console.log('✅ Success message detected - OTP submitted successfully');
                                        otpSubmitted = true;
                                        break;
                                    }

                                    if (waitAttempts % 60 === 0) {
                                        console.log(`⏳ Waiting for OTP submission... (${Math.floor(waitAttempts / 60)} minutes)`);
                                    }
                                }

                                if (!otpSubmitted) {
                                    console.warn('⚠️ Timeout waiting for OTP submission');
                                    return { success: false, message: 'Timeout waiting for manual OTP submission' };
                                }

                                registrationSuccess = true;
                                break; // Exit the retry loop
                            }

                            // Now get OTP from Viotp API and fill it (only for API mode)
                            if (profileData.viotpRequestId && viotpToken) {
                                console.log('📱 Getting OTP from Viotp API...');

                                let otpReceived = false;
                                let otpRetryCount = 0;
                                const maxOtpRetries = 3;

                                while (!otpReceived && otpRetryCount < maxOtpRetries) {
                                    otpRetryCount++;
                                    console.log(`⏳ Waiting for OTP (attempt ${otpRetryCount}/${maxOtpRetries})...`);

                                    // Wait up to 120 seconds for OTP
                                    const otpResult = await this.getOtpFromViotp(viotpToken, profileData.viotpRequestId);

                                    if (otpResult && otpResult.code) {
                                        const otp = otpResult.code;
                                        console.log(`✅ Got OTP: ${otp}`);
                                        otpReceived = true;

                                        // Fill OTP into input field
                                        await currentPage.evaluate((otpCode) => {
                                            const otpField = document.querySelector('#van-field-9-input');
                                            if (otpField) {
                                                otpField.value = otpCode;
                                                otpField.dispatchEvent(new Event('input', { bubbles: true }));
                                                otpField.dispatchEvent(new Event('change', { bubbles: true }));
                                                console.log(`✅ OTP filled: ${otpCode}`);
                                            } else {
                                                console.warn('⚠️ OTP input field not found');
                                            }
                                        }, otp);

                                        // Wait a bit then click "Đăng ký" button
                                        await new Promise(r => setTimeout(r, 1000));

                                        // Click "Đăng ký" button
                                        const registerClicked = await currentPage.evaluate(() => {
                                            // Find button with "Đăng ký" text
                                            const buttons = document.querySelectorAll('button');
                                            for (const btn of buttons) {
                                                if (btn.textContent.includes('Đăng ký')) {
                                                    btn.click();
                                                    console.log('✅ "Đăng ký" button clicked');
                                                    return true;
                                                }
                                            }
                                            console.warn('⚠️ "Đăng ký" button not found');
                                            return false;
                                        });

                                        if (registerClicked) {
                                            await new Promise(r => setTimeout(r, 3000));
                                        }
                                    } else {
                                        console.warn(`⚠️ No OTP received (attempt ${otpRetryCount}/${maxOtpRetries})`);

                                        if (otpRetryCount < maxOtpRetries) {
                                            console.log(`🔄 Retrying "Gửi đi" button...`);

                                            // Click "Gửi đi" button again
                                            await currentPage.evaluate(() => {
                                                const sendBtn = document.querySelector('.send.sendStyle1');
                                                if (sendBtn) {
                                                    sendBtn.click();
                                                    console.log('✅ "Gửi đi" button clicked again');
                                                }
                                            });

                                            await new Promise(r => setTimeout(r, 3000));
                                        } else {
                                            console.error('❌ Max OTP retries reached, need to restart with new phone');

                                            // Get new phone number (thử serviceId 3 và 21)
                                            const newPhoneResult = await this.getPhoneFromViotp(viotpToken);
                                            if (newPhoneResult && newPhoneResult.phoneNumber) {
                                                const newPhone = newPhoneResult.phoneNumber;
                                                console.log(`✅ Got new phone: ${newPhone}`);

                                                // Open new tab with same user/pass/email but new phone
                                                console.log('📂 Opening new tab with new phone number...');
                                                const newPage = await currentPage.browser().newPage();

                                                // Copy user agent and other settings
                                                await newPage.setUserAgent(await currentPage.browser().userAgent());

                                                // Navigate to register URL
                                                const registerUrl = 'https://m.okvipau.com/register';
                                                await newPage.goto(registerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                                                // Update profileData with new phone
                                                profileData.phone = newPhone;
                                                profileData.viotpRequestId = newPhoneResult.requestId;

                                                // Fill form on new page
                                                await this.fillAccOkvipRegisterForm(newPage, profileData);

                                                // Solve captcha
                                                const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
                                                if (apiKey) {
                                                    await this.solveCaptchaOnPage(newPage, apiKey);
                                                }

                                                // Click "Bước tiếp theo"
                                                await newPage.evaluate(() => {
                                                    const submitBtn = document.querySelector('button[type="submit"]');
                                                    if (submitBtn) {
                                                        submitBtn.click();
                                                        console.log('✅ "Bước tiếp theo" button clicked on new tab');
                                                    }
                                                });

                                                await new Promise(r => setTimeout(r, 3000));

                                                // Click "Gửi đi" on new page
                                                await newPage.evaluate(() => {
                                                    const sendBtn = document.querySelector('.send.sendStyle1');
                                                    if (sendBtn) {
                                                        sendBtn.click();
                                                        console.log('✅ "Gửi đi" button clicked on new tab');
                                                    }
                                                });

                                                // Continue with OTP on new page
                                                currentPage = newPage;
                                                otpRetryCount = 0; // Reset counter for new attempt
                                                continue;
                                            } else {
                                                console.error('❌ Failed to get new phone number');
                                                return { success: false, message: 'Failed to get OTP and new phone number' };
                                            }
                                        }
                                    }
                                }

                                if (!otpReceived) {
                                    return { success: false, message: 'Failed to receive OTP after all retries' };
                                }
                            } else {
                                console.warn('⚠️ No Viotp request ID or token for OTP retrieval');
                            }

                            console.log(`✅ AccOKVIP registration completed successfully`);
                            registrationSuccess = true;

                            // Save account info after successful registration (including OTP submission)
                            try {
                                console.log(`📝 Saving AccOKVIP account info...`);
                                const siteNames = siteConfig && siteConfig.name ? [siteConfig.name] : [];
                                await this.saveAccountInfo(profileData, 'accOkvip', siteConfig?.name || 'AccOKVIP', siteNames);
                                console.log(`✅ Account info saved successfully`);
                            } catch (err) {
                                console.warn(`⚠️ Failed to save account info: ${err.message}`);
                            }

                            return { success: true, message: 'AccOKVIP registration completed' };
                        }
                    } catch (error) {
                        console.warn('⚠️ Error during registration:', error.message);
                        if (retryCount >= maxRetries) {
                            return { success: false, message: `Registration failed after ${retryCount} attempts: ${error.message}` };
                        }
                    }
                }

                if (!registrationSuccess) {
                    return { success: false, message: `Registration failed after ${maxRetries} attempts` };
                }
            }

            // Wait for token/redirect (smart wait like nohu-tool)
            // Skip for AccOKVIP and OKVIP OTP (đã xử lý riêng ở trên)
            if (category === 'accOkvip' || category === 'okvipOtp') {
                console.log(`⏭️ ${category.toUpperCase()}: Skipping token/redirect wait (already handled)`);
                return { success: true, message: `${category.toUpperCase()} registration completed`, page };
            }

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
                // Add random delay 2-5s before redirect to bank (like OKVIP)
                const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-5s
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

            // Send status update to dashboard
            try {
                const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId: profileData.profileId,
                        username: profileData.username,
                        status: 'running',
                        message: `✅ Đăng ký thành công - Chuyển sang thêm bank...`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('⚠️ Failed to send register status:', err.message);
            }

            return { success: true, message: 'Register completed successfully', page };
        } catch (error) {
            console.error(`❌ Register Error:`, error.message);

            // Send error status to dashboard
            try {
                const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId: profileData.profileId,
                        username: profileData.username,
                        status: 'error',
                        message: `❌ Đăng ký thất bại: ${error.message}`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('⚠️ Failed to send error status:', err.message);
            }

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
        } else if (category === 'okvipOtp') {
            return await this.addBankOKVIPOtp(browser, siteConfig, profileData, existingPage);
        } else if (category === 'abcvip') {
            return await this.addBankABCVIP(browser, siteConfig, profileData, existingPage);
        } else if (category === 'jun88') {
            return await this.addBankJUN88(browser, siteConfig, profileData, existingPage);
        } else if (category === '78win') {
            return await this.addBank78WIN(browser, siteConfig, profileData, existingPage);
        } else if (category === 'jun88v2') {
            return await this.addBankJUN88V2(browser, siteConfig, profileData, existingPage);
        } else if (category === '22vip') {
            return await this.addBank22VIP(browser, siteConfig, profileData, existingPage);
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
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000); // 2-10s
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

            // Wait for page to load (instead of waitForNavigation which can be interrupted in parallel)
            try {
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("Thêm")', { timeout: 10000 }).catch(() => {
                    console.log('⚠️ Bank page selector not found, continuing anyway...');
                });
            } catch (e) {
                console.log('⚠️ Timeout waiting for bank page');
            }
            await new Promise(r => setTimeout(r, 1000));

            // Bước 2: Vào trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-10s
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

            // Send status update to dashboard
            try {
                const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                const statusMsg = result.success ? '✅ Thêm bank thành công' : `❌ Thêm bank thất bại: ${result.message}`;
                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId: profileData.profileId,
                        username: profileData.username,
                        status: result.success ? 'running' : 'error',
                        message: statusMsg,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('⚠️ Failed to send addbank status:', err.message);
            }

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`❌ OKVIP Add Bank Error:`, error.message);

            // Send error status to dashboard
            try {
                const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId: profileData.profileId,
                        username: profileData.username,
                        status: 'error',
                        message: `❌ Thêm bank thất bại: ${error.message}`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('⚠️ Failed to send error status:', err.message);
            }

            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * OKVIP OTP Add Bank: redirect → submit mật khẩu rút → redirect → submit bank
     * Giống 22VIP
     */
    async addBankOKVIPOtp(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (OKVIP OTP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            // Bring page to front once at the start
            await page.bringToFront();

            const paths = this.categoryPaths['22vip']; // Use 22VIP paths (same as OKVIP OTP)

            // Helper: Safe page.evaluate wrapper
            const safeEvaluate = async (fn, ...args) => {
                try {
                    if (!page || page.isClosed?.()) {
                        throw new Error('Page is closed');
                    }
                    return await page.evaluate(fn, ...args);
                } catch (err) {
                    if (err.message.includes('closed') || err.message.includes('Target page') || err.message.includes('Session')) {
                        console.warn('⚠️ Page connection lost, stopping execution');
                        throw new Error('Page connection lost');
                    }
                    throw err;
                }
            };

            // Helper: Safe page.waitForSelector wrapper
            const safeWaitForSelector = async (selector, options) => {
                try {
                    if (!page || page.isClosed?.()) {
                        throw new Error('Page is closed');
                    }
                    return await page.waitForSelector(selector, options);
                } catch (err) {
                    if (err.message.includes('closed') || err.message.includes('Target page') || err.message.includes('Session')) {
                        console.warn('⚠️ Page connection lost, stopping execution');
                        throw new Error('Page connection lost');
                    }
                    throw err;
                }
            };

            // Bước 1: Vào trang chính rồi click nút "Rút tiền" để vào trang submit mật khẩu rút
            const homeUrl = domain + '/home';
            console.log(`  → Home: ${homeUrl}`);

            // Add random delay 1-2s before redirect (reduced from 2-5s)
            const delayBeforeHome = this.getRandomDelay(1000, 2000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeHome / 1000)}s before redirect to home...`);
            await new Promise(r => setTimeout(r, delayBeforeHome));

            await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            await new Promise(r => setTimeout(r, 1000));

            // Step 1: Click tab "Tài Khoản"
            console.log('🔐 Clicking  "Tài Khoản" tab...');
            await page.evaluate(() => {
                const accountTab = Array.from(document.querySelectorAll('div[role="tab"]')).find(el =>
                    el.textContent.includes('Tài Khoản')
                );

                if (accountTab) {
                    accountTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        accountTab.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        accountTab.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    accountTab.click();
                    console.log('✅ Clicked "Tài Khoản" tab');
                } else {
                    console.warn('⚠️ "Tài Khoản" tab not found');
                }
            });

            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Click nút "Rút tiền" để vào trang withdraw password
            console.log('💰 Clicking "Rút tiền" button...');
            await page.evaluate(() => {
                // Try multiple selectors for withdraw button
                let withdrawBtn = Array.from(document.querySelectorAll('div._navItem_sh3m6_51, button, div[role="button"], a')).find(el =>
                    el.textContent.includes('Rút tiền') || el.textContent.includes('Rút Tiền') || el.textContent.includes('Withdraw')
                );

                if (withdrawBtn) {
                    withdrawBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        withdrawBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        withdrawBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    withdrawBtn.click();
                    console.log('✅ Clicked "Rút tiền" button');
                } else {
                    console.warn('⚠️ "Rút tiền" button not found');
                }
            });

            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('ul.ui-password-input__security, input[data-input-name="password"]', { timeout: 5000 });
                console.log('✅ Withdraw password form loaded');
            } catch (e) {
                console.warn('⚠️ Withdraw password form not found, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill withdraw password form using virtual keyboard
            const password = profileData.withdrawPassword;

            // Click on password input area to show keyboard
            await page.evaluate(() => {
                const firstBox = document.querySelector('ul.ui-password-input__security li.ui-password-input__item');
                if (firstBox) {
                    firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstBox.focus();
                    firstBox.click();
                }
            });

            await new Promise(r => setTimeout(r, 1000));

            // Helper: Click digits on keyboard
            const clickDigitsOnKeyboard = async (pwd) => {
                // Bring page to front once at the start
                await page.bringToFront();

                for (let i = 0; i < pwd.length; i++) {
                    const digit = pwd[i];
                    await new Promise(r => setTimeout(r, 100));

                    try {
                        // Check if page is still valid
                        if (!page || page.isClosed?.()) {
                            console.warn('⚠️ Page is closed, stopping keyboard input');
                            throw new Error('Page is closed');
                        }

                        // Add timeout to prevent hanging
                        await Promise.race([
                            page.evaluate((num) => {
                                const buttons = document.querySelectorAll('button, div[role="button"]');
                                let candidates = [];

                                for (let btn of buttons) {
                                    const text = btn.textContent.trim();
                                    if (text === num && text.length === 1 && btn.offsetParent !== null) {
                                        const rect = btn.getBoundingClientRect();
                                        if (rect.width > 20 && rect.height > 20) {
                                            candidates.push({ btn, rect });
                                        }
                                    }
                                }

                                if (candidates.length > 0) {
                                    candidates.sort((a, b) => {
                                        const areaA = a.rect.width * a.rect.height;
                                        const areaB = b.rect.width * b.rect.height;
                                        return Math.abs(areaB - 2500) - Math.abs(areaA - 2500);
                                    });

                                    const btn = candidates[0].btn;
                                    try {
                                        const rect = btn.getBoundingClientRect();
                                        const touchObj = new Touch({
                                            identifier: Date.now(),
                                            target: btn,
                                            clientX: rect.left + rect.width / 2,
                                            clientY: rect.top + rect.height / 2,
                                            radiusX: 2.5,
                                            radiusY: 2.5,
                                            rotationAngle: 0,
                                            force: 1
                                        });

                                        btn.dispatchEvent(new TouchEvent('touchstart', {
                                            bubbles: true,
                                            cancelable: true,
                                            touches: [touchObj],
                                            targetTouches: [touchObj],
                                            changedTouches: [touchObj]
                                        }));

                                        btn.dispatchEvent(new TouchEvent('touchend', {
                                            bubbles: true,
                                            cancelable: true,
                                            changedTouches: [touchObj]
                                        }));
                                    } catch (e) { }

                                    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    btn.click();
                                }
                            }, digit),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Digit click timeout')), 5000))
                        ]);
                    } catch (e) {
                        console.warn(`⚠️ Failed to click digit ${digit}:`, e.message);
                        throw e;
                    }

                    await new Promise(r => setTimeout(r, 100 + Math.random() * 100));
                }
            };

            // Click first password
            console.log('🔐 Entering first password...');
            await clickDigitsOnKeyboard(password);

            console.log('⏳ Waiting for keyboard to reset...');
            await new Promise(r => setTimeout(r, 500));

            // Click confirm password
            console.log('🔐 Entering confirm password...');
            await clickDigitsOnKeyboard(password);

            await new Promise(r => setTimeout(r, 1000));

            // Submit form - trigger form validation first
            await page.evaluate(() => {
                // Trigger blur event on password input to validate
                const passwordInputs = document.querySelectorAll('ul.ui-password-input__security li.ui-password-input__item');
                if (passwordInputs.length > 0) {
                    const lastInput = passwordInputs[passwordInputs.length - 1];
                    lastInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    lastInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Triggered blur/change events on password input');
                }
            });

            await new Promise(r => setTimeout(r, 1000));

            // Now click submit button
            const submitResult = await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                if (submitBtn) {
                    console.log(`📍 Submit button text: "${submitBtn.textContent.trim()}"`);
                    console.log(`📍 Submit button visible: ${submitBtn.offsetParent !== null}`);

                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Try touch events first
                    try {
                        const rect = submitBtn.getBoundingClientRect();
                        const touchObj = new Touch({
                            identifier: Date.now(),
                            target: submitBtn,
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2,
                            radiusX: 2.5,
                            radiusY: 2.5,
                            rotationAngle: 0,
                            force: 1
                        });

                        submitBtn.dispatchEvent(new TouchEvent('touchstart', {
                            bubbles: true,
                            cancelable: true,
                            touches: [touchObj],
                            targetTouches: [touchObj],
                            changedTouches: [touchObj]
                        }));

                        submitBtn.dispatchEvent(new TouchEvent('touchend', {
                            bubbles: true,
                            cancelable: true,
                            changedTouches: [touchObj]
                        }));
                    } catch (e) {
                        console.log('Touch events failed');
                    }

                    // Regular click
                    submitBtn.click();
                    console.log('✅ Submit button clicked');
                    return true;
                }
                return false;
            });

            if (!submitResult) {
                console.warn('⚠️ Submit button not found');
            }

            console.log('⏳ Waiting for withdraw password to be processed...');
            await new Promise(r => setTimeout(r, 5000));

            console.log('✅ Withdraw password submitted');

            await new Promise(r => setTimeout(r, 1000));

            // Bước 2: Trang sẽ tự chuyển tới trang bank, chỉ cần chờ và click "Thêm tài khoản để rút tiền"
            console.log('⏳ Waiting for page to redirect to bank page...');
            await new Promise(r => setTimeout(r, 3000));

            // Step 2: Click input "Thêm tài khoản để rút tiền"
            console.log('🏦 Clicking input "Thêm tài khoản để rút tiền"...');
            await page.evaluate(() => {
                const input = document.querySelector('input[placeholder="Thêm tài khoản để rút tiền"]');
                if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    input.focus();
                    input.click();
                    console.log('✅ Clicked input');
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click "Tài khoản ngân hàng" option (id="addAccountClick")
            console.log('🏦 Clicking "Tài khoản ngân hàng" option...');
            await page.evaluate(() => {
                const bankOption = document.getElementById('addAccountClick');
                if (bankOption) {
                    bankOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        bankOption.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        bankOption.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    bankOption.click();
                    console.log('✅ Clicked "Tài khoản ngân hàng"');
                }
            });

            await new Promise(r => setTimeout(r, 3000));

            // Step 4: Re-enter withdraw password
            console.log('🔐 Re-entering withdraw password for bank confirmation...');

            let passwordEntered = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    console.log(`  Attempt ${attempt + 1}/3 to find password input...`);
                    await page.waitForSelector('ul.ui-password-input__security', { timeout: 10000 });
                    console.log('✅ Password input appeared');

                    await page.evaluate(() => {
                        const firstBox = document.querySelector('ul.ui-password-input__security li.ui-password-input__item');
                        if (firstBox) {
                            firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            firstBox.focus();
                            firstBox.click();
                        }
                    });

                    await new Promise(r => setTimeout(r, 500));

                    try {
                        await clickDigitsOnKeyboard(password);
                        console.log('✅ Password digits entered');
                    } catch (digitError) {
                        console.warn('⚠️ Error entering password digits:', digitError.message);
                        throw digitError;
                    }

                    await new Promise(r => setTimeout(r, 1000));

                    // Trigger blur/change events before submitting
                    await page.evaluate(() => {
                        const passwordInputs = document.querySelectorAll('ul.ui-password-input__security li.ui-password-input__item');
                        if (passwordInputs.length > 0) {
                            const lastInput = passwordInputs[passwordInputs.length - 1];
                            lastInput.dispatchEvent(new Event('blur', { bubbles: true }));
                            lastInput.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log('✅ Triggered blur/change events on password input');
                        }
                    });

                    await new Promise(r => setTimeout(r, 1000));

                    const submitResult = await page.evaluate(() => {
                        const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            console.log(`📍 Submit button text: "${submitBtn.textContent.trim()}"`);

                            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // Try touch events first
                            try {
                                const rect = submitBtn.getBoundingClientRect();
                                const touchObj = new Touch({
                                    identifier: Date.now(),
                                    target: submitBtn,
                                    clientX: rect.left + rect.width / 2,
                                    clientY: rect.top + rect.height / 2,
                                    radiusX: 2.5,
                                    radiusY: 2.5,
                                    rotationAngle: 0,
                                    force: 1
                                });

                                submitBtn.dispatchEvent(new TouchEvent('touchstart', {
                                    bubbles: true,
                                    cancelable: true,
                                    touches: [touchObj],
                                    targetTouches: [touchObj],
                                    changedTouches: [touchObj]
                                }));

                                submitBtn.dispatchEvent(new TouchEvent('touchend', {
                                    bubbles: true,
                                    cancelable: true,
                                    changedTouches: [touchObj]
                                }));
                            } catch (e) {
                                console.log('Touch events failed');
                            }

                            submitBtn.click();
                            console.log('✅ Submit button clicked');
                            return true;
                        }
                        return false;
                    });

                    if (!submitResult) {
                        console.warn('⚠️ Submit button not found');
                        throw new Error('Submit button not found');
                    }

                    passwordEntered = true;
                    console.log('✅ Password re-entry completed');
                    break;
                } catch (e) {
                    console.warn(`  ⚠️ Attempt ${attempt + 1} failed:`, e.message);
                    if (attempt < 2) {
                        console.log(`  Retrying in 2s...`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            if (!passwordEntered) {
                console.warn('⚠️ Password re-entry failed after 3 attempts, continuing anyway...');
            }

            // Click "Tiếp Theo" button to proceed to bank form
            if (passwordEntered) {
                console.log('🔘 Clicking "Tiếp Theo" button in password modal...');
                try {
                    const clickResult = await page.evaluate(() => {
                        const nextBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent.includes('Tiếp Theo')
                        );
                        if (nextBtn) {
                            const rect = nextBtn.getBoundingClientRect();
                            console.log(`📍 Found "Tiếp Theo" button at: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(rect.width)}, height=${Math.round(rect.height)}`);
                            console.log(`📍 Button text: "${nextBtn.textContent.trim()}"`);
                            console.log(`📍 Button class: "${nextBtn.className}"`);
                            console.log(`📍 Button parent: "${nextBtn.parentElement?.className}"`);

                            nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // Try touch events first
                            try {
                                const rect = nextBtn.getBoundingClientRect();
                                const touchObj = new Touch({
                                    identifier: Date.now(),
                                    target: nextBtn,
                                    clientX: rect.left + rect.width / 2,
                                    clientY: rect.top + rect.height / 2,
                                    radiusX: 2.5,
                                    radiusY: 2.5,
                                    rotationAngle: 0,
                                    force: 1
                                });

                                nextBtn.dispatchEvent(new TouchEvent('touchstart', {
                                    bubbles: true,
                                    cancelable: true,
                                    touches: [touchObj],
                                    targetTouches: [touchObj],
                                    changedTouches: [touchObj]
                                }));

                                nextBtn.dispatchEvent(new TouchEvent('touchend', {
                                    bubbles: true,
                                    cancelable: true,
                                    changedTouches: [touchObj]
                                }));
                            } catch (e) {
                                console.log('Touch events failed');
                            }

                            nextBtn.click();
                            return { success: true, message: 'Tiếp Theo button clicked' };
                        }
                        return { success: false, message: 'Tiếp Theo button not found' };
                    });
                    console.log(`🔘 Click result: ${JSON.stringify(clickResult)}`);

                    // Wait for modal to close and form to be submitted
                    console.log('⏳ Waiting for password modal to close and form to be submitted...');
                    await new Promise(r => setTimeout(r, 5000));
                } catch (e) {
                    console.warn('⚠️ Failed to click Tiếp Theo button:', e.message);
                }
            }

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('input[placeholder="Vui lòng nhập số tài khoản ngân hàng"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
                // Log current URL to see if we're on the right page
                const currentUrl = page.url();
                console.log(`📍 Current URL: ${currentUrl}`);

                // Log page content for debugging
                const pageContent = await page.evaluate(() => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        bodyText: document.body.innerText.substring(0, 500)
                    };
                });
                console.log(`📄 Page info:`, pageContent);
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form - account number
            await page.evaluate((data) => {
                const accountInput = document.querySelector('input[placeholder="Vui lòng nhập số tài khoản ngân hàng"]');

                if (accountInput) {
                    accountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    accountInput.focus();
                    accountInput.click();

                    accountInput.value = '';
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(accountInput, data.accountNumber);

                    accountInput.dispatchEvent(new Event('input', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    accountInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                    accountInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

                    console.log(`✅ Filled account number: ${data.accountNumber}`);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Find and click bank dropdown
            console.log('🏦 Selecting bank...');
            await page.evaluate((data) => {
                const bankDropdown = document.querySelector('input[type="search"][placeholder="Chọn ngân hàng phát hành"]');

                if (bankDropdown) {
                    bankDropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    try {
                        bankDropdown.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        bankDropdown.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }

                    bankDropdown.click();

                    setTimeout(() => {
                        bankDropdown.value = '';
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(bankDropdown, data.bankName);

                        bankDropdown.dispatchEvent(new Event('input', { bubbles: true }));
                        bankDropdown.dispatchEvent(new Event('change', { bubbles: true }));
                        bankDropdown.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

                        setTimeout(() => {
                            const bankContainers = document.querySelectorAll('.ui-options__option');
                            const searchStrategies = [
                                data.bankName.toUpperCase(),
                                data.bankName.replace(/([A-Z])([A-Z]+)/g, '$1$2 ').trim().toUpperCase(),
                                data.bankName.replace('Bank', ' Bank').toUpperCase(),
                                data.bankName.split(' ')[0].toUpperCase(),
                                data.bankName.replace(' PAY', '').toUpperCase(),
                                data.bankName.replace(' BANK', '').toUpperCase(),
                                data.bankName.replace('BANK', '').toUpperCase(),
                                data.bankName.substring(0, 3).toUpperCase()
                            ];

                            let bankOption = null;

                            for (const container of bankContainers) {
                                const text = container.textContent.trim().toUpperCase();

                                for (const strategy of searchStrategies) {
                                    const isMatch =
                                        text === strategy ||
                                        text === strategy + ' BANK' ||
                                        text === strategy + 'BANK' ||
                                        text.startsWith(strategy + ' ') ||
                                        text.includes(strategy) ||
                                        (text.startsWith(strategy) && text.length < 50);

                                    if (isMatch) {
                                        bankOption = container;
                                        break;
                                    }
                                }

                                if (bankOption) break;
                            }

                            if (bankOption) {
                                bankOption.scrollIntoView({ behavior: 'smooth', block: 'center' });

                                setTimeout(() => {
                                    try {
                                        bankOption.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                                        bankOption.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                                    } catch (e) { }

                                    bankOption.click();
                                    console.log(`✅ Selected bank: ${bankOption.textContent.trim()}`);
                                }, 300);
                            }
                        }, 500);
                    }, 300);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 2000));

            // Fill account holder name if needed
            await page.evaluate((data) => {
                const nameField = document.querySelector('input[data-input-name="accountName"]') ||
                    document.querySelector('input[placeholder*="chủ tài khoản"]');

                if (nameField) {
                    nameField.value = data.fullname.toUpperCase();
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                    nameField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form - click "Xác Nhận" button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                let submitBtn = document.getElementById('bindWithdrawAccountNextClick');

                if (!submitBtn) {
                    submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.textContent.includes('Xác Nhận')
                    );
                }

                if (submitBtn) {
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        submitBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        submitBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    submitBtn.click();
                }
            });

            console.log(`⏳ Waiting for page to load after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("Thêm"), ._navItem_1odty_45', { timeout: 10000 }).catch(() => {
                    console.log('⚠️ Page selector not found after bank submission');
                });
                pageReloaded = true;
                console.log('✅ Page loaded after bank submission');
            } catch (e) {
                console.log('⚠️ Timeout waiting for page after bank submission');
            }
            await new Promise(r => setTimeout(r, 1500));

            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                const successKeywords = ['thành công', 'success', 'added', 'completed'];
                const pageText = document.body.innerText.toLowerCase();

                if (reloaded || successKeywords.some(keyword => pageText.includes(keyword))) {
                    return {
                        success: true,
                        message: 'Bank added successfully'
                    };
                }

                return {
                    success: false,
                    message: 'Could not verify bank addition'
                };
            }, profileData, pageReloaded);

            console.log(`✅ OKVIP OTP Add Bank Result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ OKVIP OTP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
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
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000); // 2-10s
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
            const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-10s
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
     * 78WIN Register Form (Form 2 - playerid, password, firstname, email, mobile)
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
                { selector: 'input[id="email"]', value: profileData.email || '', label: 'email' },
                { selector: 'input[type="tel"]', value: phone, label: 'mobile' }
            ];

            console.log(`🔍 DEBUG: profileData.email = "${profileData.email}"`);
            console.log(`🔍 DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

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

            // Skip clicking, go directly to filling form
            console.log('📝 Preparing to fill form fields...');

            // Prepare phone (remove leading 0)
            let phone = profileData.phone || '';
            if (phone.startsWith('0')) {
                phone = phone.substring(1);
            }

            // Fill fields using common filler
            // JUN88V2 uses id selectors
            const fields = [
                { selector: 'input[id="fullname"]', value: profileData.fullname || '', label: 'fullname' },
                { selector: 'input[id="username"]', value: profileData.username, label: 'username' },
                { selector: 'input[id="password"]', value: profileData.password, label: 'password' },
                { selector: 'input[pattern="[0-9]*"]', value: phone, label: 'mobile' }
            ];

            console.log(`🔍 DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

            try {
                console.log('📝 Starting to fill form fields...');
                await filler.fillMultipleFields(page, fields, {
                    charDelay: 150,
                    beforeFocus: 500,
                    afterField: 1200
                });
                console.log('✅ Form fields filled');
            } catch (e) {
                console.error('❌ Error filling form fields:', e.message);
                throw e;
            }

            // Trigger change events for all fields (React compatibility)
            await page.evaluate(() => {
                const fields = [
                    'input[id="fullname"]',
                    'input[id="username"]',
                    'input[id="password"]',
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
     * 22VIP/888P Register Form
     * Selectors: data-input-name attributes (supports both TV88 and 888P)
     */
    async fill22VIPRegisterForm(page, profileData) {
        try {
            console.log('🤖 22VIP/888P Form - Filling...');

            // Check if form is already visible (don't wait if it is)
            const formExists = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[data-input-name="account"]');
                return inputs.length > 0;
            });

            if (!formExists) {
                // Wait for form to load (reduced timeout to 10s)
                try {
                    await page.waitForSelector('input[data-input-name="account"]', { timeout: 10000 });
                    console.log('✅ 22VIP/888P form loaded');
                } catch (e) {
                    console.warn('⚠️ Form selector timeout, trying to fill anyway...');
                }
            } else {
                console.log('✅ 22VIP/888P form already visible');
            }

            // Fill account (username/phone)
            await page.evaluate((data) => {
                // Find all inputs (main document + iframes)
                const inputs = [];

                // Method 1: Find in main document
                const dataInputs = document.querySelectorAll('[data-input-name]');
                inputs.push(...dataInputs);

                const uiInputs = document.querySelectorAll('.ui-input__input');
                uiInputs.forEach(inp => {
                    if (!inputs.includes(inp)) inputs.push(inp);
                });

                // Method 2: Find in iframes
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach((iframe) => {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        const iframeDataInputs = iframeDoc.querySelectorAll('[data-input-name]');
                        const iframeUiInputs = iframeDoc.querySelectorAll('.ui-input__input');

                        iframeDataInputs.forEach(inp => {
                            if (!inputs.includes(inp)) inputs.push(inp);
                        });
                        iframeUiInputs.forEach(inp => {
                            if (!inputs.includes(inp)) inputs.push(inp);
                        });
                    } catch (e) {
                        // Skip iframes with access denied
                    }
                });

                // Find specific inputs by data-input-name
                const accountInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'account');
                const passInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'userpass');
                const confirmInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'confirmPassword');
                const nameInput = Array.from(inputs).find(inp => inp.getAttribute('data-input-name') === 'realName');

                // Fill account
                if (accountInput) {
                    accountInput.focus();
                    accountInput.click();
                    accountInput.value = data.username;
                    accountInput.dispatchEvent(new Event('input', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('blur', { bubbles: true }));
                }

                // Fill password
                if (passInput) {
                    passInput.focus();
                    passInput.click();
                    passInput.value = data.password;
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passInput.dispatchEvent(new Event('blur', { bubbles: true }));
                }

                // Fill confirm password
                if (confirmInput) {
                    confirmInput.focus();
                    confirmInput.click();
                    confirmInput.value = data.password;
                    confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
                    confirmInput.dispatchEvent(new Event('change', { bubbles: true }));
                    confirmInput.dispatchEvent(new Event('blur', { bubbles: true }));
                }

                // Fill full name (uppercase)
                if (nameInput) {
                    nameInput.focus();
                    nameInput.click();
                    nameInput.value = '';
                    // Type character by character
                    const fullname = data.fullname.toUpperCase();
                    for (let i = 0; i < fullname.length; i++) {
                        nameInput.value += fullname[i];
                        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, profileData);

            // Add delay between fill and next step
            await new Promise(r => setTimeout(r, 500));

            console.log(`✅ Filled account: ${profileData.username}`);
            console.log(`✅ Filled password`);
            console.log(`✅ Filled confirm password`);
            const fullname = (profileData.fullname || profileData.username).toUpperCase();
            console.log(`✅ Filled full name: ${fullname}`);

            // Trigger change events
            await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[data-input-name]');
                inputs.forEach(input => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                });
            });

            console.log('✅ 22VIP/888P form filled successfully');
        } catch (error) {
            console.error('❌ Error filling 22VIP/888P form:', error.message);
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

            // Select bank from dropdown using helper function
            const mappedBankName = this.mapBankName(profileData.bankName);
            await this.selectBankFromDropdown(page, mappedBankName, '.mc-bank-item');

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

            // Step 4: Select bank from dropdown using helper function
            const mappedBankName = this.mapBankName(profileData.bankName);
            await this.selectBankFromDropdown(page, mappedBankName, '.mc-bank-item');

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

            // Step 1: Click "Thêm tài khoản ngân hàng" button to show form
            console.log(`🔍 Looking for "Thêm tài khoản ngân hàng" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                // Try specific selector first
                let addBankBtn = document.querySelector('button.standard-add-form-button');

                // Fallback: search by text
                if (!addBankBtn) {
                    const buttons = document.querySelectorAll('button');
                    for (const btn of buttons) {
                        if (btn.textContent.includes('Thêm') && btn.textContent.includes('ngân hàng')) {
                            addBankBtn = btn;
                            break;
                        }
                    }
                }

                if (addBankBtn) {
                    addBankBtn.click();
                    return true;
                }
                return false;
            });

            if (!addBankButtonClicked) {
                console.warn('⚠️ "Thêm tài khoản ngân hàng" button not found');
            } else {
                console.log('✅ Clicked "Thêm tài khoản ngân hàng" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 1500));

            // Step 2: Wait for dropdown to be ready
            try {
                await page.waitForSelector('div.standard-select', { timeout: 5000 });
                console.log('✅ Bank dropdown field ready');
            } catch (e) {
                console.warn('⚠️ Bank dropdown field not found');
            }

            // Step 3: Click bank field to open dropdown
            console.log(`🏦 Opening bank dropdown...`);
            const dropdownOpened = await page.evaluate(() => {
                // JUN88V2: Find the modal first, then click the div.standard-select inside it
                const modal = document.querySelector('div.standard-popup-modal-body');
                console.log(`🔍 Modal found:`, modal ? 'YES' : 'NO');

                if (!modal) {
                    console.warn('⚠️ Modal not found');
                    return false;
                }

                const bankSelect = modal.querySelector('div.standard-select');

                console.log(`🔍 Bank select found:`, bankSelect ? 'YES' : 'NO');

                if (bankSelect) {
                    console.log(`�  Bank select text:`, bankSelect.textContent.substring(0, 50));
                    console.log(`📍 Bank select position:`, {
                        top: bankSelect.offsetTop,
                        left: bankSelect.offsetLeft,
                        width: bankSelect.offsetWidth,
                        height: bankSelect.offsetHeight
                    });
                    console.log(`📍 Bank select visible:`, bankSelect.offsetParent !== null);
                    console.log(`📍 Bank select display:`, window.getComputedStyle(bankSelect).display);

                    bankSelect.click();
                    console.log(`✅ Clicked bank select`);

                    // Check if dropdown appeared
                    setTimeout(() => {
                        const dropdown = document.querySelector('ul.dropdown-list-ul');
                        console.log(`🔍 Dropdown appeared after click:`, dropdown ? 'YES' : 'NO');
                    }, 500);

                    return true;
                }
                return false;
            });

            if (!dropdownOpened) {
                console.warn('⚠️ Could not click bank dropdown');
            }

            await new Promise(r => setTimeout(r, 2000));

            // Step 4: Select bank from dropdown
            const mappedBankName = this.mapBankName(profileData.bankName, 'jun88v2');
            console.log(`🏦 Looking for bank: ${profileData.bankName} → ${mappedBankName}`);

            const bankSelected = await page.evaluate((bankName) => {
                // JUN88V2 uses li items in dropdown-list-ul
                const bankItems = document.querySelectorAll('ul.dropdown-list-ul li');
                console.log(`📋 Found ${bankItems.length} bank items in dropdown`);

                // Debug: log all available banks
                if (bankItems.length === 0) {
                    console.warn(`⚠️ No bank items found with selector 'ul.dropdown-list-ul li'`);
                    return false;
                }

                // Log all available banks for debugging
                console.log(`📋 Available banks:`);
                bankItems.forEach((item, idx) => {
                    console.log(`  [${idx}] ${item.textContent.trim()}`);
                });

                let found = false;

                // Try exact match first (full text match)
                for (const item of bankItems) {
                    const itemText = item.textContent.trim();
                    if (itemText === bankName) {
                        console.log(`✅ Exact match found: ${itemText}`);
                        item.click();
                        found = true;
                        break;
                    }
                }

                // Try matching the bank code/short name (before the /)
                if (!found) {
                    for (const item of bankItems) {
                        const itemText = item.textContent.trim();
                        const bankCode = itemText.split('/')[0].trim().toUpperCase();
                        const searchName = bankName.toUpperCase();

                        console.log(`  Checking code: "${bankCode}" vs "${searchName}"`);
                        if (bankCode === searchName) {
                            console.log(`✅ Code match found: ${itemText}`);
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                // Try partial match as last resort
                if (!found) {
                    for (const item of bankItems) {
                        const itemText = item.textContent.trim();
                        if (itemText.toUpperCase().includes(bankName.toUpperCase())) {
                            console.log(`✅ Partial match found: ${itemText}`);
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && bankItems.length > 0) {
                    console.warn(`⚠️ Bank not found, selecting first option`);
                    bankItems[0].click();
                    return true;
                }

                return found;
            }, mappedBankName);

            if (!bankSelected) {
                console.warn('⚠️ Bank selection may have failed');
            }

            await new Promise(r => setTimeout(r, 2000));

            // Step 5: Fill account number - use slow typing
            console.log(`📝 Filling account number...`);

            // Field 1: Account number
            try {
                console.log(`💳 Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="accountNumber"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="accountNumber"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`✅ Account number filled`);
            } catch (error) {
                console.warn(`⚠️ Error filling account number:`, error.message);
                // Fallback: use evaluate
                await page.evaluate((accountNumber) => {
                    const accountField = document.querySelector('input[id="accountNumber"]');
                    if (accountField) {
                        accountField.value = accountNumber;
                        accountField.dispatchEvent(new Event('input', { bubbles: true }));
                        accountField.dispatchEvent(new Event('change', { bubbles: true }));
                        accountField.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, profileData.accountNumber);
            }

            await new Promise(r => setTimeout(r, 1500));

            // Step 6: Submit form - find submit button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
            await new Promise(r => setTimeout(r, delayBeforeSubmit));

            const submitSuccess = await page.evaluate(() => {
                // JUN88V2: Click button#add-bank-btn (id="add-bank-btn", class="standard-submit-form-button")
                let submitBtn = document.querySelector('button#add-bank-btn');

                if (!submitBtn) {
                    console.warn('⚠️ button#add-bank-btn not found, trying alternative selectors...');
                    // Fallback: find by class
                    submitBtn = document.querySelector('button.standard-submit-form-button');
                }

                if (!submitBtn) {
                    console.warn('⚠️ button.standard-submit-form-button not found');
                    return false;
                }

                console.log(`✅ Found submit button: ${submitBtn.id || submitBtn.className}`);

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
     * 22VIP Add Bank: redirect → submit mật khẩu rút → redirect → submit bank
     * Giống OKVIP
     */
    async addBank22VIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`🏦 Add Bank step for ${siteConfig.name} (22VIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths['22vip'];

            // Bước 1: Vào trang submit mật khẩu rút
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  → Withdraw Password: ${withdrawPasswordUrl}`);

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('ul.ui-password-input__security, input[data-input-name="password"]', { timeout: 5000 });
                console.log('✅ Withdraw password form loaded');
            } catch (e) {
                console.warn('⚠️ Withdraw password form not found, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill withdraw password form using virtual keyboard (22VIP style)
            const password = profileData.withdrawPassword;

            // Click on password input area to show keyboard
            await page.evaluate(() => {
                const firstBox = document.querySelector('ul.ui-password-input__security li.ui-password-input__item');
                if (firstBox) {
                    firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstBox.focus();
                    firstBox.click();
                }
            });

            await new Promise(r => setTimeout(r, 1000));

            // Helper: Set password value directly (no character-by-character input)
            const setPasswordValue = async (pwd) => {
                console.log(`🔐 Setting password directly (${pwd.length} characters)...`);
                await page.evaluate((password) => {
                    // Find password input field
                    const passwordInput = document.querySelector('input[type="password"]') ||
                        document.querySelector('input[data-input-name="password"]') ||
                        document.querySelector('input[placeholder*="mật khẩu"]') ||
                        document.querySelector('input[placeholder*="password"]');

                    if (passwordInput) {
                        // Set value directly
                        passwordInput.value = password;

                        // Trigger events to notify React/Vue
                        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));

                        console.log('✅ Password set directly');
                        return true;
                    }

                    console.warn('⚠️ Password input not found');
                    return false;
                }, pwd);
            };

            // Click first password
            console.log('🔐 Entering first password...');
            await clickDigitsOnKeyboard(password);

            // Wait for keyboard to reset (minimal delay - just let UI update)
            console.log('⏳ Waiting for keyboard to reset...');
            await new Promise(r => setTimeout(r, 500));

            // Page automatically focuses on confirm password field
            // Click confirm password
            console.log('🔐 Entering confirm password...');
            await clickDigitsOnKeyboard(password);

            await new Promise(r => setTimeout(r, 1000));

            // Submit form
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            // Wait for form to process (simple approach - just wait for page to settle)
            console.log('⏳ Waiting for withdraw password to be processed...');
            await new Promise(r => setTimeout(r, 3000)); // Wait for form processing

            console.log('✅ Withdraw password submitted');

            await new Promise(r => setTimeout(r, 1000));

            // Bước 2: Vào trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  → Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 5000);
            console.log(`⏳ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for page to load
            await new Promise(r => setTimeout(r, 2000));

            // Step 1: Click "Thêm Tài Khoản" button
            console.log('🏦 Clicking "Thêm Tài Khoản" button...');
            await page.evaluate(() => {
                // Find by class or text
                let addBtn = document.querySelector('div._addAccountInputBtn_1bihm_45');
                if (!addBtn) {
                    addBtn = Array.from(document.querySelectorAll('div, button')).find(el =>
                        el.textContent.includes('Thêm Tài Khoản')
                    );
                }
                if (addBtn) {
                    addBtn.click();
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 2: Click "Tài khoản ngân hàng" option
            console.log('🏦 Clicking "Tài khoản ngân hàng" option...');
            await page.evaluate(() => {
                // Find by id or text
                let bankOption = document.getElementById('addAccountClick');
                if (!bankOption) {
                    bankOption = Array.from(document.querySelectorAll('div, button')).find(el =>
                        el.textContent.includes('Tài khoản ngân hàng')
                    );
                }
                if (bankOption) {
                    bankOption.click();
                }
            });

            await new Promise(r => setTimeout(r, 3000)); // Increased delay to wait for popup


            // Step 3: Re-enter withdraw password (password popup appears after clicking bank option)
            console.log('🔐 Re-entering withdraw password for bank confirmation...');

            // Check if password input appears (with retry)
            let passwordEntered = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    console.log(`  Attempt ${attempt + 1}/3 to find password input...`);
                    await page.waitForSelector('ul.ui-password-input__security', { timeout: 10000 });
                    console.log('✅ Password input appeared');

                    // Click on password input to show keyboard
                    await page.evaluate(() => {
                        const firstBox = document.querySelector('ul.ui-password-input__security li.ui-password-input__item');
                        if (firstBox) {
                            firstBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            firstBox.focus();
                            firstBox.click();
                        }
                    });

                    await new Promise(r => setTimeout(r, 500)); // Reduced from 1000ms

                    // Re-enter password using same keyboard click method
                    try {
                        await clickDigitsOnKeyboard(password);
                        console.log('✅ Password digits entered');
                    } catch (digitError) {
                        console.warn('⚠️ Error entering password digits:', digitError.message);
                        throw digitError;
                    }

                    await new Promise(r => setTimeout(r, 1000)); // Reduced from 1500ms

                    // Submit password confirmation
                    const submitResult = await page.evaluate(() => {
                        const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.click();
                            return true;
                        }
                        return false;
                    });

                    if (!submitResult) {
                        console.warn('⚠️ Submit button not found');
                        throw new Error('Submit button not found');
                    }

                    passwordEntered = true;
                    console.log('✅ Password re-entry completed');
                    break;
                } catch (e) {
                    console.warn(`  ⚠️ Attempt ${attempt + 1} failed:`, e.message);
                    if (attempt < 2) {
                        console.log(`  Retrying in 2s...`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            if (!passwordEntered) {
                console.warn('⚠️ Password re-entry failed after 3 attempts, continuing anyway...');
            }

            // Click "Tiếp Theo" button to proceed to bank form (if password was entered)
            if (passwordEntered) {
                console.log('🔘 Clicking "Tiếp Theo" button...');
                try {
                    await page.evaluate(() => {
                        const nextBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent.includes('Tiếp Theo')
                        );
                        if (nextBtn) {
                            nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            try {
                                nextBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                                nextBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                            } catch (e) { }
                            nextBtn.click();
                        }
                    });
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.warn('⚠️ Failed to click Tiếp Theo button:', e.message);
                }
            }

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('input[placeholder="Vui lòng nhập số tài khoản ngân hàng"]', { timeout: 5000 });
                console.log('✅ Bank form loaded');
            } catch (e) {
                console.warn('⚠️ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form - account number and bank selection (like hai2vip)
            await page.evaluate((data) => {
                // Find account number input
                const accountInput = document.querySelector('input[placeholder="Vui lòng nhập số tài khoản ngân hàng"]');

                if (accountInput) {
                    accountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    accountInput.focus();
                    accountInput.click();

                    // Clear and set value using native setter
                    accountInput.value = '';
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(accountInput, data.accountNumber);

                    // Trigger events
                    accountInput.dispatchEvent(new Event('input', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    accountInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                    accountInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

                    console.log(`✅ Filled account number: ${data.accountNumber}`);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Find and click bank dropdown
            console.log('🏦 Selecting bank...');
            await page.evaluate((data) => {
                // Find bank dropdown input
                const bankDropdown = document.querySelector('input[type="search"][placeholder="Chọn ngân hàng phát hành"]');

                if (bankDropdown) {
                    bankDropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Click to open dropdown
                    try {
                        bankDropdown.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        bankDropdown.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }

                    bankDropdown.click();

                    // Type bank name to filter
                    setTimeout(() => {
                        bankDropdown.value = '';
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(bankDropdown, data.bankName);

                        bankDropdown.dispatchEvent(new Event('input', { bubbles: true }));
                        bankDropdown.dispatchEvent(new Event('change', { bubbles: true }));
                        bankDropdown.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

                        // Wait for dropdown options to appear
                        setTimeout(() => {
                            const bankContainers = document.querySelectorAll('.ui-options__option');
                            const searchStrategies = [
                                data.bankName.toUpperCase(),
                                data.bankName.replace(/([A-Z])([A-Z]+)/g, '$1$2 ').trim().toUpperCase(),
                                data.bankName.replace('Bank', ' Bank').toUpperCase(),
                                data.bankName.split(' ')[0].toUpperCase(),
                                data.bankName.replace(' PAY', '').toUpperCase(),
                                data.bankName.replace(' BANK', '').toUpperCase(),
                                data.bankName.replace('BANK', '').toUpperCase(),
                                data.bankName.substring(0, 3).toUpperCase()
                            ];

                            let bankOption = null;

                            for (const container of bankContainers) {
                                const text = container.textContent.trim().toUpperCase();

                                for (const strategy of searchStrategies) {
                                    const isMatch =
                                        text === strategy ||
                                        text === strategy + ' BANK' ||
                                        text === strategy + 'BANK' ||
                                        text.startsWith(strategy + ' ') ||
                                        text.includes(strategy) ||
                                        (text.startsWith(strategy) && text.length < 50);

                                    if (isMatch) {
                                        bankOption = container;
                                        break;
                                    }
                                }

                                if (bankOption) break;
                            }

                            if (bankOption) {
                                bankOption.scrollIntoView({ behavior: 'smooth', block: 'center' });

                                setTimeout(() => {
                                    try {
                                        bankOption.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                                        bankOption.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                                    } catch (e) { }

                                    bankOption.click();
                                    console.log(`✅ Selected bank: ${bankOption.textContent.trim()}`);
                                }, 300);
                            }
                        }, 500);
                    }, 300);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 2000));

            // Fill account holder name if needed
            await page.evaluate((data) => {
                const nameField = document.querySelector('input[data-input-name="accountName"]') ||
                    document.querySelector('input[placeholder*="chủ tài khoản"]');

                if (nameField) {
                    nameField.value = data.fullname.toUpperCase();
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                    nameField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form - click "Xác Nhận" button
            console.log(`📤 Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                // Find by id first (most reliable)
                let submitBtn = document.getElementById('bindWithdrawAccountNextClick');

                // Fallback to button with "Xác Nhận" text
                if (!submitBtn) {
                    submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.textContent.includes('Xác Nhận')
                    );
                }

                if (submitBtn) {
                    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        submitBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        submitBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    submitBtn.click();
                }
            });

            // Wait for page to load after bank submission (instead of waitForNavigation which can be interrupted)
            console.log(`⏳ Waiting for page to load after bank submission...`);
            let pageReloaded = false;
            try {
                // Wait for page to show success or reload
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("Thêm"), ._navItem_1odty_45', { timeout: 10000 }).catch(() => {
                    console.log('⚠️ Page selector not found after bank submission');
                });
                pageReloaded = true;
                console.log('✅ Page loaded after bank submission');
            } catch (e) {
                console.log('⚠️ Timeout waiting for page after bank submission');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Check if bank was added successfully
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                // For 22VIP, just check if page reloaded or if we can see success message
                const successKeywords = ['thành công', 'success', 'added', 'completed'];
                const pageText = document.body.innerText.toLowerCase();

                if (reloaded || successKeywords.some(keyword => pageText.includes(keyword))) {
                    return {
                        success: true,
                        message: 'Bank added successfully'
                    };
                }

                return {
                    success: false,
                    message: 'Could not verify bank addition'
                };
            }, profileData, pageReloaded);

            console.log(`✅ 22VIP Add Bank Result:`, result);
            return result;
        } catch (error) {
            console.error(`❌ 22VIP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bước 3: Check Promo (riêng cho từng category)
     */
    async checkPromoStep(browser, category, siteConfig, profileData = {}) {
        if (category === 'okvip') {
            return await this.checkPromoOKVIP(browser, siteConfig, profileData);
        } else if (category === 'okvipOtp') {
            return await this.checkPromoOKVIPOtp(browser, siteConfig, profileData);
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
     * OKVIP OTP Check Promo
     * Logic: Fill username → Click submit
     */
    async checkPromoOKVIPOtp(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`🎁 Check Promo step for ${siteConfig.name} (OKVIP OTP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[data-input-name="account"]', { timeout: 15000 });
                console.log('✅ Check Promo form loaded');
            } catch (e) {
                console.warn('⚠️ Check Promo form not fully loaded, continuing anyway...');
            }

            // 2. Fill username
            const username = profileData?.username || '';
            console.log(`📝 Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('input[data-input-name="account"]');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            console.log(`✅ Username filled successfully`);

            // 3. Click submit button
            await new Promise(r => setTimeout(r, 1500));
            const submitClicked = await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]') ||
                    document.querySelector('button.ui-button--primary') ||
                    document.querySelector('button:contains("Nhận")');

                if (submitBtn) {
                    submitBtn.click();
                    console.log('✅ Submit button clicked');
                    return true;
                }
                return false;
            });

            if (!submitClicked) {
                console.warn('⚠️ Submit button not found, but continuing...');
            }

            console.log('📌 Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Promo form submitted' };

        } catch (error) {
            console.error(`❌ OKVIP OTP Check Promo Error:`, error.message);
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
        } else if (category === 'okvipOtp') {
            await this.fillOKVIPOtpRegisterForm(page, profileData);
        } else if (category === 'accOkvip') {
            await this.fillAccOkvipRegisterForm(page, profileData);
        } else if (category === 'abcvip') {
            await this.fillABCVIPRegisterForm(page, profileData);
        } else if (category === 'jun88') {
            await this.fillJUN88RegisterForm(page, profileData);
        } else if (category === '78win') {
            await this.fill78WINRegisterForm(page, profileData);
        } else if (category === 'jun88v2') {
            await this.fillJUN88V2RegisterForm(page, profileData);
        } else if (category === '22vip') {
            await this.fill22VIPRegisterForm(page, profileData);
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
            const confirmPasswordField = document.querySelector('input[formcontrolname="confirmPassword"]');
            const nameField = document.querySelector('input[formcontrolname="name"]');
            const mobileField = document.querySelector('input[formcontrolname="mobile"]');
            const emailField = document.querySelector('input[formcontrolname="email"]');
            const checkCodeField = document.querySelector('input[formcontrolname="checkCode"]');
            const agreeCheckbox = document.querySelector('input[formcontrolname="agree"]');

            if (accountField) accountField.value = data.username;
            if (passwordField) passwordField.value = data.password;
            if (confirmPasswordField) confirmPasswordField.value = data.password; // Same as password
            if (nameField) nameField.value = data.fullname || '';
            if (mobileField) mobileField.value = data.phone || '';
            if (emailField) emailField.value = data.email || '';
            if (checkCodeField) checkCodeField.value = '0000'; // Placeholder
            if (agreeCheckbox) agreeCheckbox.checked = true;

            // Trigger change events
            [accountField, passwordField, confirmPasswordField, nameField, mobileField, emailField, checkCodeField, agreeCheckbox].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            });
        }, profileData);
    }

    /**
     * OKVIP OTP Register Form
     * Selectors: data-input-name (Vue form)
     * Form: account, userpass, phone, realName
     * Phone: Lấy từ Viotp API nếu simMode = 'api'
     */
    async fillOKVIPOtpRegisterForm(page, profileData) {
        try {
            console.log('🤖 OKVIP OTP Form - Filling...');

            // Wait for form to load
            try {
                await page.waitForSelector('input[data-input-name="account"]', { timeout: 15000 });
                console.log('✅ OKVIP OTP register form loaded');
            } catch (e) {
                console.warn('⚠️ Form selector timeout, trying to fill anyway...');
            }

            await new Promise(r => setTimeout(r, 1500));

            // Nếu simMode = 'api', lấy số từ Viotp (bắt buộc)
            if (profileData.simMode === 'api') {
                console.log('📱 OKVIP OTP: Fetching phone number from Viotp API...');
                const viotpToken = this.settings?.viotpToken || process.env.VIOTP_TOKEN;

                if (!viotpToken) {
                    throw new Error('Viotp token not provided');
                }

                const phoneResult = await this.getPhoneFromViotp(viotpToken);
                if (phoneResult && phoneResult.phoneNumber) {
                    let phone = phoneResult.phoneNumber;

                    // Bỏ số 0 đầu nếu có (form chỉ nhận 9 số)
                    if (phone.startsWith('0')) {
                        phone = phone.substring(1);
                        console.log(`✅ Removed leading 0: ${phoneResult.phoneNumber} → ${phone}`);
                    }

                    profileData.phone = phone;
                    profileData.viotpRequestId = phoneResult.requestId;
                    console.log(`✅ Got phone from Viotp: ${phone} (9 digits)`);
                } else {
                    // Viotp API failed - throw error
                    const errorMsg = 'Viotp API: Hiện không có sẵn số điện thoại phù hợp. Vui lòng thử lại sau!';
                    console.error('❌ ' + errorMsg);
                    throw new Error(errorMsg);
                }
            } else {
                // Manual mode - kiểm tra số có được cung cấp không
                if (!profileData.phone) {
                    throw new Error('Vui lòng nhập số điện thoại!');
                }

                // Bỏ số 0 đầu nếu có (form chỉ nhận 9 số)
                let phone = profileData.phone;
                if (phone.startsWith('0')) {
                    phone = phone.substring(1);
                    console.log(`✅ Removed leading 0 from manual phone: ${profileData.phone} → ${phone}`);
                }
                profileData.phone = phone;
                console.log(`✏️ Using manual phone: ${phone} (9 digits)`);
            }

            // Fill form fields
            await page.evaluate((data) => {
                // Find inputs by data-input-name
                const accountInput = document.querySelector('input[data-input-name="account"]');
                const passInput = document.querySelector('input[data-input-name="userpass"]');
                const phoneInput = document.querySelector('input[data-input-name="phone"]');
                const nameInput = document.querySelector('input[data-input-name="realName"]');

                // Fill account (username/phone)
                if (accountInput) {
                    accountInput.focus();
                    accountInput.click();
                    accountInput.value = data.username;
                    accountInput.dispatchEvent(new Event('input', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    accountInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('✅ Account filled:', data.username);
                }

                // Fill password
                if (passInput) {
                    passInput.focus();
                    passInput.click();
                    passInput.value = data.password;
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('✅ Password filled');
                }

                // Fill phone
                if (phoneInput) {
                    phoneInput.focus();
                    phoneInput.click();
                    phoneInput.value = data.phone || '';
                    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                    phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
                    phoneInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('✅ Phone filled:', data.phone);
                }

                // Fill full name
                if (nameInput) {
                    nameInput.focus();
                    nameInput.click();
                    nameInput.value = (data.fullname || '').toUpperCase();
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('✅ Full name filled:', data.fullname);
                }
            }, profileData);

            console.log('✅ OKVIP OTP form filled successfully');
        } catch (error) {
            console.error('❌ Error filling OKVIP OTP form:', error.message);
            throw error;
        }
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
                        registerUrl: 'https://www.mb665.zone/Account/Register',
                        checkPromoUrl: 'https://ttkm-mb66okvip02.pages.dev/?promo_id=FREE66'
                    },
                    {
                        name: '789BET',
                        registerUrl: 'https://m.hsdh99hjsbcnjiufkxuuwvg.com/Account/Register?app=1',
                        checkPromoUrl: 'https://ttkm789bet04.pages.dev/khuyenmai/?promo_id=FR58K'
                    },
                    {
                        name: '8KBET',
                        registerUrl: 'https://m.8k0119a.top/Account/Register',
                        checkPromoUrl: 'https://google3zc888k.buzz/'
                    }
                ]
            },
            'okvipOtp': {
                name: 'OKVIP OTP',
                icon: 'OTP',
                color: '#ff6b35',
                sites: [
                    {
                        name: 'SC881',
                        registerUrl: 'https://m.sc881.com./home/register',
                        checkPromoUrl: 'https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1'
                    },
                    {
                        name: 'Fly88',
                        registerUrl: 'https://fly88h.com/home/register',
                        checkPromoUrl: 'https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1'
                    },
                    {
                        name: 'F168',
                        registerUrl: 'https://f1686s.com/home/register',
                        checkPromoUrl: 'https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1'
                    }, {
                        name: 'CM88',
                        registerUrl: 'https://cm88.com/home/register',
                        checkPromoUrl: 'https://m.sc881.com./home/event/detail?current=1&template=1&eventId=1'
                    }
                ]
            },
            'accOkvip': {
                name: 'AccOKVIP',
                icon: 'ACC',
                color: '#ff8c42',
                sites: [
                    {
                        name: 'AccOKVIP',
                        registerUrl: 'https://m.oklavip16.live/register',
                        checkPromoUrl: 'https://tangqua88.com/?promo_id=KM58'
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
                        registerUrl: 'https://www.ufhtoiklhkfkjguhd7eoij8icxhkjk9.com/vi-vn/register',
                        checkPromoUrl: 'https://jun88ok99.com/?promo_id=FR58'
                    }
                ]
            },
            '22vip': {
                name: '22VIP',
                icon: '22V',
                color: '#ff6b35',
                sites: [
                    {
                        name: 'TV88',
                        registerUrl: 'https://tv88vip.com/home/register?id=324858250',
                        checkPromoUrl: ''
                    },
                    {
                        name: '28Bet',
                        registerUrl: 'https://2899bb.com/?id=296686034',
                        checkPromoUrl: ''
                    },
                    {
                        name: '888Now',
                        registerUrl: 'https://888now333.com/?id=122472500',
                        checkPromoUrl: ''
                    },
                    {
                        name: '888New',
                        registerUrl: 'https://888new10.com/?id=314514939',
                        checkPromoUrl: ''
                    },
                    {
                        name: 'Win678',
                        registerUrl: 'https://m.win678oo.com/?id=743351402',
                        checkPromoUrl: ''
                    },
                    {
                        name: '888Vi',
                        registerUrl: 'https://888vi8.com/?id=486645938',
                        checkPromoUrl: ''
                    },
                    {
                        name: '888P',
                        registerUrl: 'https://m.888p28.com/?fixed.iswebclip=2',
                        checkPromoUrl: ''
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
     * AccOKVIP Register Form (Van form with id selectors)
     * Selectors: #van-field-X-input
     * Phone number will be fetched from Viotp API
     */
    async fillAccOkvipRegisterForm(page, profileData) {
        // Wait for form fields to appear
        try {
            await page.waitForSelector('#van-field-1-input', { timeout: 15000 });
            console.log('✅ AccOKVIP register form loaded');
        } catch (e) {
            console.warn('⚠️ AccOKVIP register form not fully loaded, continuing anyway...');
        }
        await new Promise(r => setTimeout(r, 1500));

        // Step 1: Get phone number from Viotp API (Service ID 3) - only if simMode is 'api'
        const simMode = profileData.simMode || 'api'; // Default to 'api'
        console.log(`📱 SIM Mode: ${simMode === 'api' ? 'API SIM' : 'Manual Phone'}`);

        let phoneNumber = profileData.phone; // Fallback to provided phone
        let viotpSuccess = false;
        let viotpErrorMessage = null;

        if (simMode === 'api') {
            console.log('📱 Getting phone number from Viotp API...');
            const viotpToken = this.settings?.viotpToken || process.env.VIOTP_TOKEN;

            if (viotpToken) {
                const viotpResult = await this.getPhoneFromViotp(viotpToken); // Thử serviceId 3 và 21
                if (viotpResult && viotpResult.phoneNumber) {
                    phoneNumber = viotpResult.phoneNumber;
                    console.log(`✅ Got phone from Viotp: ${phoneNumber}`);
                    // Store for later use (OTP retrieval)
                    profileData.viotpRequestId = viotpResult.requestId;
                    viotpSuccess = true;
                } else {
                    // Viotp API failed - this means no available phone numbers
                    viotpErrorMessage = 'Viotp API: Hiện không có sẵn số điện thoại phù hợp. Vui lòng thử lại sau!';
                    console.error('❌ ' + viotpErrorMessage);
                    // Store error message in profileData for later use in result
                    profileData.viotpError = viotpErrorMessage;
                    throw new Error(viotpErrorMessage);
                }
            } else {
                console.warn('⚠️ No Viotp token, using provided phone');
            }
        } else {
            console.log('✏️ Using manual phone from form');
            if (!phoneNumber) {
                throw new Error('Vui lòng nhập số điện thoại!');
            }
        }

        // Step 2: Fill form with username, password, email, and fetched phone
        await page.evaluate((data) => {
            // Fill username
            const usernameField = document.querySelector('#van-field-1-input');
            if (usernameField) {
                usernameField.value = data.username;
                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Username filled: ${data.username}`);
            }

            // Fill password
            const passwordField = document.querySelector('#van-field-2-input');
            if (passwordField) {
                passwordField.value = data.password;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Password filled`);
            }

            // Fill confirm password
            const confirmPasswordField = document.querySelector('#van-field-3-input');
            if (confirmPasswordField) {
                confirmPasswordField.value = data.password;
                confirmPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
                confirmPasswordField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Confirm password filled`);
            }

            // Fill phone (from Viotp API)
            const phoneField = document.querySelector('#van-field-4-input');
            if (phoneField) {
                phoneField.value = data.phoneNumber;
                phoneField.dispatchEvent(new Event('input', { bubbles: true }));
                phoneField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Phone filled: ${data.phoneNumber}`);
            }

            // Fill email
            const emailField = document.querySelector('#van-field-5-input');
            if (emailField) {
                emailField.value = data.email;
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
                emailField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Email filled: ${data.email}`);
            }

            // Check agree checkbox
            const checkbox = document.querySelector('.van-checkbox');
            if (checkbox) {
                checkbox.click();
                console.log(`✅ Agree checkbox checked`);
            }
        }, { ...profileData, phoneNumber });

        console.log('✅ AccOKVIP form filled successfully');
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
                { selector: 'input[type="tel"]', value: phone, label: 'mobile' }
            ];

            console.log(`🔍 DEBUG: profileData.email = "${profileData.email}"`);
            console.log(`🔍 DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

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
                domain.includes('789bet') || domain.includes('8k0119a') ||
                domain.includes('8kbet')) {
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

            // 22VIP sites
            if (domain.includes('tv88') || domain.includes('22vip')) {
                return '22vip';
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
            console.log(`    📋 profileData:`, { username: profileData.username, password: profileData.password ? '***' : 'N/A', email: profileData.email });

            // Prepare account info
            const accountInfo = {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword || '',
                fullname: profileData.fullname || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                registeredAt: new Date().toISOString(),
                firstSite: siteName,
                sites: Array.isArray(allSites)
                    ? allSites.map(s => typeof s === 'string' ? s : s.name || s)
                    : [],
                status: 'active',
                category: category,
                tool: 'vip-tool'
            };

            // Chỉ thêm bank info nếu không phải AccOKVIP (AccOKVIP không cần ngân hàng)
            if (category !== 'accOkvip') {
                accountInfo.bank = {
                    name: profileData.bankName || '',
                    branch: profileData.bankBranch || 'Thành phố Hồ Chí Minh',
                    accountNumber: profileData.accountNumber || '',
                    accountHolder: profileData.fullname || ''
                };
            }

            console.log(`    📦 accountInfo to send:`, { username: accountInfo.username, password: accountInfo.password ? '***' : 'N/A' });

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
                const errorText = await response.text();
                console.error(`    ❌ API Error Response:`, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`    ✅ Account info saved via API:`, result.message);

        } catch (error) {
            console.error(`    ❌ Error saving account info:`, error.message);
            throw error;
        }
    }

    /**
     * Solve Geetest V4 or Botion captcha via autocaptcha.pro API
     * Hỗ trợ cả Geetest V4 và Botion slide puzzle
     */
    async solveGeetestV4ViaAutoCaptcha(page, apiKey) {
        try {
            console.log('🔐 Detecting captcha type...');

            // Step 1: Detect captcha type
            const captchaType = await page.evaluate(() => {
                // Check for Botion captcha
                if (document.querySelector('[class*="botion_box"]')) {
                    return 'botion';
                }

                // Check for Geetest V4
                if (document.querySelector('[class*="geetest"], [id*="geetest"], [data-gt4]')) {
                    return 'geetest';
                }

                return null;
            });

            console.log(`📋 Detected captcha type: ${captchaType}`);

            if (!captchaType) {
                console.warn('⚠️ Could not detect captcha type on page');
                return null;
            }

            // Handle Botion captcha
            if (captchaType === 'botion') {
                return await this.solveBottionCaptcha(page, apiKey);
            }

            // Handle Geetest V4
            if (captchaType === 'geetest') {
                return await this.solveGeetestV4Captcha(page, apiKey);
            }

            return null;
        } catch (error) {
            console.error('❌ Captcha solve error:', error.message);
            return null;
        }
    }

    /**
     * Solve Botion slide puzzle captcha
     */
    async solveBottionCaptcha(page, apiKey) {
        try {
            console.log('🔐 Solving Botion captcha via DOM analysis + drag simulation...');

            const maxAttempts = 3;
            let attempt = 0;

            while (attempt < maxAttempts) {
                attempt++;
                console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);

                // Step 1: Wait for Botion captcha to render and get puzzle piece position
                let puzzleInfo = null;
                let waitAttempts = 0;
                const maxWaitAttempts = 10; // Wait up to 10 seconds (faster)

                while (!puzzleInfo && waitAttempts < maxWaitAttempts) {
                    waitAttempts++;

                    puzzleInfo = await page.evaluate(() => {
                        // Find the puzzle piece element - try multiple selectors
                        let puzzleSlice = document.querySelector('[class*="botion_slice"]');
                        if (!puzzleSlice) {
                            puzzleSlice = document.querySelector('[class*="slice"]');
                        }
                        if (!puzzleSlice) {
                            puzzleSlice = document.querySelector('[class*="puzzle"]');
                        }
                        if (!puzzleSlice) {
                            puzzleSlice = document.querySelector('[role="img"][class*="piece"]');
                        }
                        if (!puzzleSlice) {
                            return null;
                        }

                        // Find the background image (gap reference) - try multiple selectors
                        let bgElement = document.querySelector('[class*="botion_bg"]');
                        if (!bgElement) {
                            bgElement = document.querySelector('[class*="bg"]');
                        }
                        if (!bgElement) {
                            bgElement = document.querySelector('img[class*="background"]');
                        }
                        if (!bgElement) {
                            bgElement = document.querySelector('[class*="captcha"]');
                        }
                        if (!bgElement) {
                            return null;
                        }

                        // Find the slider track (to know max distance) - try multiple selectors
                        let sliderTrack = document.querySelector('[class*="botion_track"]');
                        if (!sliderTrack) {
                            sliderTrack = document.querySelector('[class*="track"]');
                        }
                        if (!sliderTrack) {
                            sliderTrack = document.querySelector('[class*="slider"]');
                        }
                        if (!sliderTrack) {
                            sliderTrack = document.querySelector('[role="slider"]');
                        }
                        if (!sliderTrack) {
                            return null;
                        }

                        // Find the slider button - try multiple selectors
                        let sliderBtn = document.querySelector('[class*="botion_btn"]');
                        if (!sliderBtn) {
                            sliderBtn = document.querySelector('[class*="btn"]');
                        }
                        if (!sliderBtn) {
                            sliderBtn = document.querySelector('[class*="button"]');
                        }
                        if (!sliderBtn) {
                            sliderBtn = document.querySelector('[class*="handle"]');
                        }
                        if (!sliderBtn) {
                            return null;
                        }

                        // Get puzzle piece position
                        const puzzleRect = puzzleSlice.getBoundingClientRect();
                        const puzzleStyle = window.getComputedStyle(puzzleSlice);
                        const puzzleLeft = parseFloat(puzzleStyle.left) || 0;

                        // Get background image position (this is where the gap is)
                        const bgRect = bgElement.getBoundingClientRect();

                        // Get slider track dimensions
                        const trackRect = sliderTrack.getBoundingClientRect();

                        // Get slider button position
                        const btnRect = sliderBtn.getBoundingClientRect();

                        // Get the botion window (main container)
                        const botionWindow = document.querySelector('[class*="botion_window"]');
                        const windowRect = botionWindow ? botionWindow.getBoundingClientRect() : bgRect;

                        // Check if elements are visible (width/height > 0)
                        if (windowRect.width === 0 || windowRect.height === 0) {
                            console.warn('⚠️ Captcha elements not visible yet');
                            return null;
                        }

                        return {
                            puzzleLeft: puzzleLeft,
                            puzzleWidth: puzzleRect.width,
                            puzzleHeight: puzzleRect.height,
                            bgWidth: bgRect.width,
                            bgHeight: bgRect.height,
                            trackWidth: trackRect.width,
                            trackLeft: trackRect.left,
                            trackTop: trackRect.top,
                            btnLeft: btnRect.left,
                            btnTop: btnRect.top,
                            btnWidth: btnRect.width,
                            btnHeight: btnRect.height,
                            windowWidth: windowRect.width,
                            windowHeight: windowRect.height,
                            x: Math.max(0, windowRect.left),
                            y: Math.max(0, windowRect.top)
                        };
                    });

                    if (!puzzleInfo) {
                        if (waitAttempts % 5 === 0) {
                            console.log(`⏳ Waiting for Botion captcha to render (${waitAttempts}s)...`);
                        }
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (!puzzleInfo) {
                    console.warn('⚠️ Botion captcha element not found, using full screenshot fallback');

                    // Fallback: Use full screenshot
                    const fullScreenshot = await page.screenshot();
                    const base64Image = fullScreenshot.toString('base64');

                    return await this.submitBottionCaptchaToAPI(base64Image, apiKey);
                }

                console.log(`📍 Puzzle piece info:`, puzzleInfo);

                // Check if captcha elements are visible
                if (puzzleInfo.windowWidth <= 0 || puzzleInfo.windowHeight <= 0) {
                    console.warn('⚠️ Captcha window has invalid dimensions, waiting more...');
                    await new Promise(r => setTimeout(r, 1000));
                    continue; // Retry
                }

                // Step 2: Take screenshot of just the captcha area
                const captchaScreenshot = await page.screenshot({
                    clip: {
                        x: puzzleInfo.x,
                        y: puzzleInfo.y,
                        width: puzzleInfo.windowWidth,
                        height: puzzleInfo.windowHeight
                    }
                });

                const base64Image = captchaScreenshot.toString('base64');
                console.log(`📸 Screenshot size: ${base64Image.length} bytes`);

                // Step 3: Analyze the screenshot to find gap position
                const captchaResult = await this.submitBottionCaptchaToAPI(base64Image, apiKey, puzzleInfo);

                if (!captchaResult || !captchaResult.success) {
                    console.error('❌ Failed to analyze captcha');
                    return null;
                }

                // Step 4: Simulate drag to move the puzzle piece
                console.log(`🎯 Simulating drag to ${captchaResult.solution}%...`);
                const dragResult = await this.simulateBottionDrag(page, captchaResult.solution, puzzleInfo);

                if (!dragResult) {
                    console.error('❌ Failed to simulate drag');
                    return null;
                }

                // Step 5: Wait for captcha verification
                console.log('⏳ Waiting for captcha verification...');
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s for verification

                // Step 6: Check if captcha was solved correctly
                const verifyResult = await this.checkBottionResult(page);

                if (verifyResult.success) {
                    console.log('✅ Captcha solved successfully!');
                    return captchaResult;
                }

                // Captcha failed - check if we should retry
                if (verifyResult.failed) {
                    console.warn(`⚠️ Captcha failed: ${verifyResult.message}`);

                    if (attempt < maxAttempts) {
                        console.log(`🔄 Refreshing captcha and retrying...`);
                        await this.refreshBottionCaptcha(page);
                        await new Promise(r => setTimeout(r, 1500)); // Wait before retry
                        continue; // Try again
                    } else {
                        console.error('❌ Max attempts reached');
                        return null;
                    }
                }

                // Unknown state - return result anyway
                console.log('⚠️ Captcha state unknown, returning result');
                return captchaResult;
            }

            console.error('❌ Failed to solve captcha after all attempts');
            return null;
        } catch (error) {
            console.error('❌ Botion captcha solve error:', error.message);
            return null;
        }
    }

    /**
     * Check if Botion captcha was solved correctly or failed
     */
    async checkBottionResult(page) {
        try {
            const result = await page.evaluate(() => {
                // Check for error/retry message - try multiple selectors
                let resultTips = document.querySelector('[class*="botion_result_tips"]');
                if (!resultTips) {
                    resultTips = document.querySelector('[class*="result_tips"]');
                }
                if (!resultTips) {
                    resultTips = document.querySelector('[class*="tips"]');
                }

                if (resultTips && resultTips.textContent) {
                    const text = resultTips.textContent.toLowerCase();
                    console.log(`📊 Result tips: ${text}`);

                    // Check for failure messages
                    if (text.includes('vui lòng thử lại') || text.includes('thử lại') || text.includes('failed') || text.includes('error')) {
                        return { failed: true, message: text };
                    }

                    // Check for success messages
                    if (text.includes('thành công') || text.includes('success') || text.includes('verified')) {
                        return { success: true, message: text };
                    }
                }

                // Check if captcha box is still visible - try multiple selectors
                let botionBox = document.querySelector('[class*="botion_box"]');
                if (!botionBox) {
                    botionBox = document.querySelector('[class*="captcha"]');
                }
                if (!botionBox) {
                    botionBox = document.querySelector('[class*="box"]');
                }

                if (!botionBox || botionBox.style.display === 'none') {
                    console.log('📊 Captcha box disappeared - likely success');
                    return { success: true, message: 'Captcha disappeared' };
                }

                // Check if there's a retry button visible (indicates failure) - try multiple selectors
                let retryBtn = document.querySelector('[class*="botion_refresh"]');
                if (!retryBtn) {
                    retryBtn = document.querySelector('[class*="refresh"]');
                }
                if (!retryBtn) {
                    retryBtn = document.querySelector('[class*="retry"]');
                }

                if (retryBtn && retryBtn.style.display !== 'none') {
                    console.log('📊 Retry button visible - captcha failed');
                    return { failed: true, message: 'Retry button visible' };
                }

                // Unknown state
                return { unknown: true, message: 'Unknown state' };
            });

            console.log('📊 Botion result check:', result);
            return result;
        } catch (error) {
            console.error('❌ Result check error:', error.message);
            return { unknown: true, message: error.message };
        }
    }

    /**
     * Refresh Botion captcha (click refresh button)
     */
    async refreshBottionCaptcha(page) {
        try {
            console.log('🔄 Clicking refresh button...');

            const refreshed = await page.evaluate(() => {
                // Find refresh button - try multiple selectors
                let refreshBtn = document.querySelector('[class*="botion_refresh"]');
                if (!refreshBtn) {
                    refreshBtn = document.querySelector('[class*="refresh"]');
                }
                if (!refreshBtn) {
                    refreshBtn = document.querySelector('[class*="retry"]');
                }

                if (!refreshBtn) {
                    console.warn('⚠️ Refresh button not found');
                    return false;
                }

                // Click refresh button
                refreshBtn.click();
                console.log('✅ Refresh button clicked');
                return true;
            });

            if (refreshed) {
                // Wait for new captcha to load
                await new Promise(r => setTimeout(r, 1000));
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Refresh error:', error.message);
            return false;
        }
    }

    /**
     * Simulate drag movement for Botion slider using transform + events
     * Kéo nút (botion_btn) từ trái sang phải để di chuyển mảnh ghép vào gap
     */
    async simulateBottionDrag(page, percentage, puzzleInfo) {
        try {
            console.log(`🎯 Kéo nút đến ${percentage}%...`);

            // Bước 1: Lấy thông tin nút kéo và thanh track
            const elementInfo = await page.evaluate(() => {
                // Find slider button - try multiple selectors
                let slider = document.querySelector('[class*="botion_btn"]');
                if (!slider) {
                    slider = document.querySelector('[class*="btn"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="button"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="handle"]');
                }

                // Find track - try multiple selectors
                let track = document.querySelector('[class*="botion_track"]');
                if (!track) {
                    track = document.querySelector('[class*="track"]');
                }
                if (!track) {
                    track = document.querySelector('[class*="slider"]');
                }
                if (!track) {
                    track = document.querySelector('[role="slider"]');
                }
                const puzzleSlice = document.querySelector('[class*="botion_slice"]');

                if (!slider || !track) {
                    console.warn('⚠️ Không tìm thấy nút kéo Botion');
                    return null;
                }

                const sliderRect = slider.getBoundingClientRect();
                const trackRect = track.getBoundingClientRect();

                return {
                    sliderX: sliderRect.left + sliderRect.width / 2,
                    sliderY: sliderRect.top + sliderRect.height / 2,
                    trackX: trackRect.left,
                    trackY: trackRect.top,
                    trackWidth: trackRect.width,
                    trackHeight: trackRect.height,
                    sliderWidth: sliderRect.width,
                    sliderLeft: sliderRect.left
                };
            });

            if (!elementInfo) {
                console.error('❌ Không thể lấy thông tin nút kéo');
                return null;
            }

            console.log(`� Vị tr í nút: (${elementInfo.sliderX}, ${elementInfo.sliderY})`);
            console.log(`📏 Thanh track: (${elementInfo.trackX}, ${elementInfo.trackY}), Chiều rộng: ${elementInfo.trackWidth}`);
            console.log(`📍 Nút bắt đầu tại: ${elementInfo.sliderLeft}px`);

            // Bước 2: Tính vị trí đích
            // Kéo nút đến vị trí tương ứng với percentage
            // QUAN TRỌNG: Tính từ vị trí hiện tại của nút, không phải từ trackX
            const dragDistance = (elementInfo.trackWidth * percentage) / 100;
            const targetX = elementInfo.sliderX + dragDistance;

            console.log(`🎯 Khoảng cách kéo: ${dragDistance}px (${percentage}%)`);
            console.log(`🎯 Vị trí đích: ${targetX}px`);

            // Bước 3: Dispatch pointerdown và mousedown
            await page.evaluate((startX, startY) => {
                // Find slider - try multiple selectors
                let slider = document.querySelector('[class*="botion_btn"]');
                if (!slider) {
                    slider = document.querySelector('[class*="btn"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="button"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="handle"]');
                }

                // Find track - try multiple selectors
                let track = document.querySelector('[class*="botion_track"]');
                if (!track) {
                    track = document.querySelector('[class*="track"]');
                }
                if (!track) {
                    track = document.querySelector('[class*="slider"]');
                }
                if (!track) {
                    track = document.querySelector('[role="slider"]');
                }

                if (!slider || !track) return;

                const pointerDownEvent = new PointerEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: startX,
                    clientY: startY,
                    pointerId: 1,
                    pointerType: 'mouse',
                    isPrimary: true
                });
                slider.dispatchEvent(pointerDownEvent);
                track.dispatchEvent(pointerDownEvent);

                const mouseDownEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: startX,
                    clientY: startY,
                    buttons: 1
                });
                slider.dispatchEvent(mouseDownEvent);
                track.dispatchEvent(mouseDownEvent);

                console.log('🖱️ Nhấn chuột xuống');
            }, elementInfo.sliderX, elementInfo.sliderY);

            // Bước 4: Kéo mượt mà với độ trễ giữa các bước (như người thật kéo)
            // Tổng thời gian kéo: ~1.5-2 giây
            const steps = 50;
            const delayPerStep = 30; // 30ms giữa mỗi bước = 1.5 giây tổng

            for (let step = 1; step <= steps; step++) {
                const currentX = elementInfo.sliderX + ((targetX - elementInfo.sliderX) * step) / steps;
                const currentY = elementInfo.sliderY;
                const currentPct = (percentage * step) / steps;

                await page.evaluate((x, y, pct, trackWidth) => {
                    // Find slider - try multiple selectors
                    let slider = document.querySelector('[class*="botion_btn"]');
                    if (!slider) {
                        slider = document.querySelector('[class*="btn"]');
                    }
                    if (!slider) {
                        slider = document.querySelector('[class*="button"]');
                    }
                    if (!slider) {
                        slider = document.querySelector('[class*="handle"]');
                    }

                    // Find track - try multiple selectors
                    let track = document.querySelector('[class*="botion_track"]');
                    if (!track) {
                        track = document.querySelector('[class*="track"]');
                    }
                    if (!track) {
                        track = document.querySelector('[class*="slider"]');
                    }
                    if (!track) {
                        track = document.querySelector('[role="slider"]');
                    }

                    if (!slider || !track) return;

                    // Pointer move
                    const pointerMoveEvent = new PointerEvent('pointermove', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y,
                        pointerId: 1,
                        pointerType: 'mouse',
                        isPrimary: true,
                        buttons: 1
                    });
                    document.dispatchEvent(pointerMoveEvent);
                    slider.dispatchEvent(pointerMoveEvent);
                    track.dispatchEvent(pointerMoveEvent);

                    // Mouse move
                    const mouseMoveEvent = new MouseEvent('mousemove', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y,
                        buttons: 1
                    });
                    document.dispatchEvent(mouseMoveEvent);
                    slider.dispatchEvent(mouseMoveEvent);
                    track.dispatchEvent(mouseMoveEvent);

                    // Dispatch input event
                    const inputEvent = new Event('input', {
                        bubbles: true,
                        cancelable: true
                    });
                    track.dispatchEvent(inputEvent);
                }, currentX, currentY, currentPct, elementInfo.trackWidth);

                // Chờ trước bước tiếp theo (tạo kéo mượt như người thật)
                await new Promise(r => setTimeout(r, delayPerStep));
            }

            // Bước 5: Dispatch pointerup và mouseup
            await page.evaluate((endX, endY) => {
                // Find slider - try multiple selectors
                let slider = document.querySelector('[class*="botion_btn"]');
                if (!slider) {
                    slider = document.querySelector('[class*="btn"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="button"]');
                }
                if (!slider) {
                    slider = document.querySelector('[class*="handle"]');
                }

                // Find track - try multiple selectors
                let track = document.querySelector('[class*="botion_track"]');
                if (!track) {
                    track = document.querySelector('[class*="track"]');
                }
                if (!track) {
                    track = document.querySelector('[class*="slider"]');
                }
                if (!track) {
                    track = document.querySelector('[role="slider"]');
                }

                if (!slider || !track) return;

                const pointerUpEvent = new PointerEvent('pointerup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: endX,
                    clientY: endY,
                    pointerId: 1,
                    pointerType: 'mouse',
                    isPrimary: true
                });
                document.dispatchEvent(pointerUpEvent);
                slider.dispatchEvent(pointerUpEvent);
                track.dispatchEvent(pointerUpEvent);

                const mouseUpEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: endX,
                    clientY: endY
                });
                document.dispatchEvent(mouseUpEvent);
                slider.dispatchEvent(mouseUpEvent);
                track.dispatchEvent(mouseUpEvent);

                console.log('🖱️ Thả chuột');
            }, targetX, elementInfo.sliderY);

            console.log('✅ Hoàn thành kéo');
            return { success: true, percentage: percentage };
        } catch (error) {
            console.error('❌ Lỗi kéo:', error.message);
            return null;
        }
    }

    /**
     * Wait for Botion captcha to be verified
     */
    /**
     * Submit Botion captcha image to API and handle response
     */
    async submitBottionCaptchaToAPI(base64Image, apiKey, puzzleInfo = null) {
        try {
            // Use local image matching directly (skip AutoCaptcha)
            console.log('📤 Using local image matching to solve Botion captcha...');
            const localResult = await this.solveBottionViaImageMatching(base64Image, puzzleInfo);

            if (localResult && localResult.success) {
                return localResult;
            }

            console.error('❌ Local image matching failed');
            return null;
        } catch (error) {
            console.error('❌ Botion captcha error:', error.message);
            return null;
        }
    }

    /**
     * Solve Botion captcha via local image matching (no external API)
     */
    async solveBottionViaImageMatching(base64Image, puzzleInfo = null) {
        try {
            console.log('🔐 Solving Botion captcha via local image matching...');

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

            // Try to use sharp if available for template matching
            let matchResult = null;

            try {
                // Try using sharp for advanced image processing
                const sharp = require('sharp');
                matchResult = await this.analyzeBottionWithTemplateMatching(imageBuffer, sharp, puzzleInfo);
            } catch (e) {
                console.warn('⚠️ Sharp not available, trying basic analysis...');
                // Fallback to basic pixel analysis
                matchResult = await this.analyzeBottionBasic(imageBuffer, puzzleInfo);
            }

            if (!matchResult || matchResult.percentage === null) {
                console.warn('⚠️ Could not determine slider position');
                return null;
            }

            console.log(`✅ Botion captcha analyzed: ${matchResult.percentage}%`);
            return {
                success: true,
                solution: matchResult.percentage.toString(),
                type: 'botion',
                service: 'local-matching'
            };
        } catch (error) {
            console.error('❌ Image matching error:', error.message);
            return null;
        }
    }

    /**
     * Analyze Botion using brightness detection
     * FIXED: Find the gap (dark hole) in the background image and calculate distance from puzzle start
     */
    async analyzeBottionWithTemplateMatching(imageBuffer, sharp, puzzleInfo = null) {
        try {
            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();
            console.log(`📊 Kích thước ảnh: ${metadata.width}x${metadata.height}`);

            // Extract image data
            const { data, info } = await sharp(imageBuffer)
                .raw()
                .toBuffer({ resolveWithObject: true });

            const width = metadata.width;
            const height = metadata.height;
            const channels = info.channels;

            // Bước 1: Phân tích độ sáng theo cột để tìm gap
            console.log('🔍 Phân tích ảnh để tìm vị trí gap...');
            let brightnessByColumn = [];

            for (let x = 0; x < width; x++) {
                let totalBrightness = 0;
                let pixelCount = 0;

                // Lấy mẫu từ giữa ảnh (nơi có mảnh ghép)
                const startY = Math.floor(height * 0.15);
                const endY = Math.floor(height * 0.85);

                for (let y = startY; y < endY; y++) {
                    const pixelIndex = (y * width + x) * channels;

                    if (pixelIndex + 2 < data.length) {
                        const r = data[pixelIndex];
                        const g = data[pixelIndex + 1];
                        const b = data[pixelIndex + 2];
                        const brightness = (r + g + b) / 3;

                        totalBrightness += brightness;
                        pixelCount++;
                    }
                }

                const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
                brightnessByColumn.push({
                    x: x,
                    brightness: avgBrightness
                });
            }

            // Bước 2: Tính trung bình độ sáng trước
            let totalBrightnessSum = 0;
            for (let i = 0; i < width; i++) {
                totalBrightnessSum += brightnessByColumn[i].brightness;
            }
            const avgBrightnessValue = totalBrightnessSum / width;

            console.log(`📊 Độ sáng trung bình: ${avgBrightnessValue.toFixed(0)}`);

            // Bước 3: Tìm gap (khoảng trống - vùng tối hơn trung bình ít nhất 30 điểm)
            console.log('🔍 Tìm gap (khoảng trống đen)...');
            let gapX = 0;
            let minBrightness = 255;
            const darknessThreshold = avgBrightnessValue - 30;

            console.log(`📊 Threshold tối: ${darknessThreshold.toFixed(0)}`);

            // Quét toàn bộ chiều rộng để tìm vùng tối nhất nhưng vẫn tối hơn threshold
            for (let i = 0; i < width; i++) {
                const brightness = brightnessByColumn[i].brightness;

                // Chỉ xét các cột tối hơn threshold
                if (brightness < darknessThreshold && brightness < minBrightness) {
                    minBrightness = brightness;
                    gapX = i;
                }
            }

            // Nếu không tìm thấy vùng tối hơn threshold, tìm vùng tối nhất
            if (minBrightness === 255) {
                console.log('⚠️ Không tìm thấy vùng tối hơn threshold, tìm vùng tối nhất...');
                minBrightness = 255;
                for (let i = 0; i < width; i++) {
                    if (brightnessByColumn[i].brightness < minBrightness) {
                        minBrightness = brightnessByColumn[i].brightness;
                        gapX = i;
                    }
                }
            }

            console.log(`📍 Gap tìm thấy tại: ${gapX}px (độ sáng: ${minBrightness.toFixed(0)})`);
            console.log(`📊 Độ sáng gap: ${minBrightness.toFixed(0)}`);
            console.log(`📊 Chênh lệch: ${(avgBrightnessValue - minBrightness).toFixed(0)}`);

            // Bước 4: Tính % cần kéo nút dựa trên vị trí gap
            // QUAN TRỌNG: Phần cần kéo (mảnh ghép) cách bên trái ảnh 1 khoảng
            // Cần trừ đi khoảng cách này để tính khoảng cách kéo thực tế

            // Ước lượng offset từ bên trái ảnh đến phần cần kéo
            // Dựa vào hình ảnh, phần cần kéo cách bên trái khoảng 10% chiều rộng
            const puzzleLeftOffset = Math.round(width * 0.10);

            // Khoảng cách kéo thực tế = vị trí gap - offset từ bên trái
            const actualDragDistance = Math.max(0, gapX - puzzleLeftOffset);

            // Tính % dựa trên khoảng cách kéo thực tế
            const percentage = Math.round((actualDragDistance / width) * 100);

            console.log(`📊 Offset từ bên trái: ${puzzleLeftOffset}px (10% của ${width}px)`);
            console.log(`📊 Vị trí gap: ${gapX}px`);
            console.log(`📊 Khoảng cách kéo thực tế: ${actualDragDistance}px`);
            console.log(`📊 Percentage: ${actualDragDistance}px / ${width}px = ${percentage}%`);

            // Clamp vào khoảng hợp lý (5-95%)
            const clampedPercentage = Math.max(5, Math.min(95, percentage));
            if (clampedPercentage !== percentage) {
                console.log(`📊 Điều chỉnh: ${percentage}% → ${clampedPercentage}%`);
            }

            return {
                percentage: clampedPercentage,
                method: 'brightness-gap-position',
                gapX: gapX,
                puzzleLeftOffset: puzzleLeftOffset,
                actualDragDistance: actualDragDistance,
                imageWidth: width,
                minBrightness: minBrightness,
                avgBrightness: avgBrightnessValue,
                confidence: avgBrightnessValue - minBrightness
            };
        } catch (error) {
            console.error('❌ Lỗi phân tích template:', error.message);
            return null;
        }
    }

    /**
     * Compute edge map using Sobel-like edge detection
     * Returns array of edge strength values (0-255) for each pixel
     */
    computeEdgeMap(data, width, height, channels) {
        const edgeMap = new Array(width * height).fill(0);

        // Sobel kernels
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];

        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        // Apply Sobel operator to each pixel
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;

                // Apply kernels
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * channels;

                        if (pixelIndex + 2 < data.length) {
                            // Get grayscale value
                            const r = data[pixelIndex];
                            const g = data[pixelIndex + 1];
                            const b = data[pixelIndex + 2];
                            const gray = (r + g + b) / 3;

                            gx += gray * sobelX[ky + 1][kx + 1];
                            gy += gray * sobelY[ky + 1][kx + 1];
                        }
                    }
                }

                // Calculate edge strength (magnitude)
                const edgeStrength = Math.sqrt(gx * gx + gy * gy);
                const edgeIndex = y * width + x;
                edgeMap[edgeIndex] = Math.min(255, edgeStrength / 8); // Normalize
            }
        }

        return edgeMap;
    }

    /**
     * Analyze Botion using brightness detection (fallback)
     */
    async analyzeBottionWithSharp(imageBuffer, sharp) {
        try {
            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();
            console.log(`📊 Image size: ${metadata.width}x${metadata.height}`);

            // Extract image data
            const { data, info } = await sharp(imageBuffer)
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Botion structure:
            // - Top part: puzzle image with gap
            // - Bottom part: slider track with button

            // Analyze the entire image to find the slider button
            // The slider button is usually a distinct element in the track area

            const width = metadata.width;
            const height = metadata.height;
            const channels = info.channels;

            // Look for the slider button by finding edges/transitions
            // Slider button usually has high contrast with background

            let maxContrast = 0;
            let sliderX = 0;

            // Scan horizontally to find the slider button position
            for (let x = 0; x < width; x++) {
                let contrast = 0;
                let sampleCount = 0;

                // Sample from multiple rows to get better detection
                for (let y = Math.floor(height * 0.7); y < height; y++) {
                    const pixelIndex = (y * width + x) * channels;

                    if (pixelIndex + 2 < data.length) {
                        const r = data[pixelIndex];
                        const g = data[pixelIndex + 1];
                        const b = data[pixelIndex + 2];

                        // Calculate brightness
                        const brightness = (r + g + b) / 3;

                        // Compare with neighbors for edge detection
                        if (x > 0) {
                            const leftPixelIndex = (y * width + (x - 1)) * channels;
                            const leftR = data[leftPixelIndex];
                            const leftG = data[leftPixelIndex + 1];
                            const leftB = data[leftPixelIndex + 2];
                            const leftBrightness = (leftR + leftG + leftB) / 3;

                            contrast += Math.abs(brightness - leftBrightness);
                        }

                        sampleCount++;
                    }
                }

                if (sampleCount > 0) {
                    contrast = contrast / sampleCount;

                    // Find the position with highest contrast (edge of slider button)
                    if (contrast > maxContrast) {
                        maxContrast = contrast;
                        sliderX = x;
                    }
                }
            }

            // Calculate percentage (slider position / total width)
            // Add some margin for accuracy
            const percentage = Math.round((sliderX / width) * 100);

            console.log(`📍 Slider detected at: ${sliderX}px (${percentage}%)`);
            console.log(`📊 Contrast level: ${maxContrast.toFixed(2)}`);

            return {
                percentage: Math.max(0, Math.min(100, percentage)),
                sliderX: sliderX,
                width: width,
                contrast: maxContrast
            };
        } catch (error) {
            console.error('❌ Sharp analysis error:', error.message);
            return null;
        }
    }

    /**
     * Basic Botion analysis without external libraries
     * Uses brightness detection to find puzzle piece and gap
     */
    async analyzeBottionBasic(imageBuffer, puzzleInfo = null) {
        try {
            console.log('📊 Using basic brightness analysis');

            // Parse PNG header to get dimensions
            if (imageBuffer.length < 24) {
                console.warn('⚠️ Image too small');
                return null;
            }

            // Check PNG signature
            if (imageBuffer[0] !== 0x89 || imageBuffer[1] !== 0x50) {
                console.warn('⚠️ Not a valid PNG image');
                return null;
            }

            // Extract width from IHDR chunk (big-endian)
            const width = imageBuffer.readUInt32BE(16);
            const height = imageBuffer.readUInt32BE(20);

            console.log(`📊 Image dimensions: ${width}x${height}`);

            // Bước 1: Phân tích độ sáng theo cột
            let brightnessByColumn = [];
            const sampleHeight = Math.floor(height * 0.6); // Lấy mẫu 60% giữa

            for (let x = 0; x < width; x++) {
                let totalBrightness = 0;
                let pixelCount = 0;

                // Lấy mẫu mỗi 4 hàng để tăng tốc độ
                for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y += 4) {
                    const pixelIndex = (y * width + x) * 4;

                    if (pixelIndex + 3 < imageBuffer.length) {
                        const r = imageBuffer[pixelIndex];
                        const g = imageBuffer[pixelIndex + 1];
                        const b = imageBuffer[pixelIndex + 2];
                        const brightness = (r + g + b) / 3;

                        totalBrightness += brightness;
                        pixelCount++;
                    }
                }

                const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
                brightnessByColumn.push({
                    x: x,
                    brightness: avgBrightness
                });
            }

            // Bước 2: Tính trung bình độ sáng
            let totalBrightnessSum = 0;
            for (let i = 0; i < width; i++) {
                totalBrightnessSum += brightnessByColumn[i].brightness;
            }
            const avgBrightnessValue = totalBrightnessSum / width;

            console.log(`📊 Độ sáng trung bình: ${avgBrightnessValue.toFixed(0)}`);

            // Bước 3: Tìm mảnh ghép (vùng sáng ở bên trái)
            console.log('🔍 Tìm mảnh ghép (vùng sáng)...');
            let puzzleX = 0;
            let maxBrightness = 0;

            // Quét bên trái 30% để tìm mảnh ghép
            const puzzleScanEnd = Math.floor(width * 0.3);
            for (let i = 0; i < puzzleScanEnd; i++) {
                if (brightnessByColumn[i].brightness > maxBrightness) {
                    maxBrightness = brightnessByColumn[i].brightness;
                    puzzleX = i;
                }
            }

            console.log(`📍 Mảnh ghép tìm thấy tại: ${puzzleX}px (độ sáng: ${maxBrightness.toFixed(0)})`);

            // Bước 4: Tìm gap (khoảng trống - vùng tối hơn trung bình ít nhất 30 điểm)
            console.log('🔍 Tìm gap (khoảng trống đen)...');
            let gapX = 0;
            let minBrightness = 255;
            const darknessThreshold = avgBrightnessValue - 30;

            console.log(`📊 Threshold tối: ${darknessThreshold.toFixed(0)}`);

            // Quét toàn bộ chiều rộng để tìm vùng tối nhất nhưng vẫn tối hơn threshold
            for (let i = 0; i < width; i++) {
                const brightness = brightnessByColumn[i].brightness;

                // Chỉ xét các cột tối hơn threshold
                if (brightness < darknessThreshold && brightness < minBrightness) {
                    minBrightness = brightness;
                    gapX = i;
                }
            }

            // Nếu không tìm thấy vùng tối hơn threshold, tìm vùng tối nhất
            if (minBrightness === 255) {
                console.log('⚠️ Không tìm thấy vùng tối hơn threshold, tìm vùng tối nhất...');
                minBrightness = 255;
                for (let i = 0; i < width; i++) {
                    if (brightnessByColumn[i].brightness < minBrightness) {
                        minBrightness = brightnessByColumn[i].brightness;
                        gapX = i;
                    }
                }
            }

            console.log(`📍 Gap tìm thấy tại: ${gapX}px (độ sáng: ${minBrightness.toFixed(0)})`);
            console.log(`📊 Độ sáng gap: ${minBrightness.toFixed(0)}`);
            console.log(`📊 Chênh lệch: ${(avgBrightnessValue - minBrightness).toFixed(0)}`);

            // Bước 5: Tính % cần kéo nút dựa trên vị trí gap
            // QUAN TRỌNG: Phần cần kéo (mảnh ghép) cách bên trái ảnh 1 khoảng
            // Cần trừ đi khoảng cách này để tính khoảng cách kéo thực tế

            // Ước lượng offset từ bên trái ảnh đến phần cần kéo
            // Dựa vào hình ảnh, phần cần kéo cách bên trái khoảng 10% chiều rộng
            const puzzleLeftOffset = Math.round(width * 0.10);

            // Khoảng cách kéo thực tế = vị trí gap - offset từ bên trái
            const actualDragDistance = Math.max(0, gapX - puzzleLeftOffset);

            // Tính % dựa trên khoảng cách kéo thực tế
            const percentage = Math.round((actualDragDistance / width) * 100);

            console.log(`📊 Offset từ bên trái: ${puzzleLeftOffset}px (10% của ${width}px)`);
            console.log(`📊 Vị trí gap: ${gapX}px`);
            console.log(`📊 Khoảng cách kéo thực tế: ${actualDragDistance}px`);
            console.log(`📊 Percentage: ${actualDragDistance}px / ${width}px = ${percentage}%`);

            // Clamp vào khoảng hợp lý (5-95%)
            const clampedPercentage = Math.max(5, Math.min(95, percentage));
            if (clampedPercentage !== percentage) {
                console.log(`📊 Điều chỉnh: ${percentage}% → ${clampedPercentage}%`);
            }

            return {
                percentage: clampedPercentage,
                method: 'basic-brightness-position',
                width: width,
                gapX: gapX,
                puzzleLeftOffset: puzzleLeftOffset,
                actualDragDistance: actualDragDistance,
                minBrightness: minBrightness,
                avgBrightness: avgBrightnessValue
            };
        } catch (error) {
            console.error('❌ Basic analysis error:', error.message);
            return null;
        }
    }

    /**
     * Solve Geetest V4 captcha
     */
    async solveGeetestV4Captcha(page, apiKey) {
        try {
            console.log('🔐 Solving Geetest V4 via autocaptcha.pro API...');

            // Step 1: Get Geetest V4 parameters từ page
            const geetestParams = await page.evaluate(() => {
                // Tìm script chứa Geetest config
                const scripts = document.querySelectorAll('script');
                let geetestData = null;

                for (const script of scripts) {
                    if (script.textContent && (script.textContent.includes('geetest') || script.textContent.includes('gt4'))) {
                        // Thử extract từ script content
                        const match = script.textContent.match(/gt4\.initGeetest4\s*\(\s*({[\s\S]*?})\s*,/);
                        if (match) {
                            try {
                                geetestData = JSON.parse(match[1]);
                                break;
                            } catch (e) {
                                // Continue searching
                            }
                        }
                    }
                }

                // Fallback: Tìm từ window object
                if (!geetestData && window.geetest_data) {
                    geetestData = window.geetest_data;
                }

                // Fallback: Tìm từ data attributes
                if (!geetestData) {
                    const geetestContainer = document.querySelector('[data-gt4], [class*="geetest"], [id*="geetest"]');
                    if (geetestContainer) {
                        geetestData = {
                            captcha_id: geetestContainer.getAttribute('data-captcha-id') || geetestContainer.getAttribute('data-gt4'),
                            product: 'bind'
                        };
                    }
                }

                return geetestData;
            });

            if (!geetestParams) {
                console.warn('⚠️ Could not find Geetest V4 parameters on page');
                return null;
            }

            console.log('📋 Geetest V4 params:', geetestParams);

            // Step 2: Submit Geetest V4 task to AutoCaptcha
            console.log('📤 Sending Geetest V4 to autocaptcha.pro API...');
            const submitResponse = await fetch('https://autocaptcha.pro/apiv3/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'GeeTestTaskProxyless',
                    websiteURL: page.url(),
                    websiteKey: geetestParams.captcha_id || geetestParams.gt4,
                    version: 4,
                    product: geetestParams.product || 'bind',
                    key: apiKey
                })
            });

            const submitData = await submitResponse.json();
            console.log('📤 Submit response:', submitData);

            // Handle error
            if (submitData.errorId !== undefined && submitData.errorId !== 0) {
                console.error('❌ Failed to submit Geetest V4:', submitData.message || 'Unknown error');
                return null;
            }

            // Get task ID
            const taskId = submitData.taskId;
            if (!taskId) {
                console.error('❌ No task ID returned');
                return null;
            }

            console.log(`📝 Geetest V4 submitted, task ID: ${taskId}`);

            // Step 3: Poll for result (max 60 seconds for Geetest)
            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 2000));

                const resultResponse = await fetch(`https://autocaptcha.pro/apiv3/result?key=${apiKey}&taskId=${taskId}`);
                const resultData = await resultResponse.json();

                if (resultData.errorId === 0 && resultData.solution) {
                    const geetestChallenge = resultData.solution.geetest_challenge || resultData.solution.challenge;
                    const geetestValidate = resultData.solution.geetest_validate || resultData.solution.validate;
                    const geetestSeccode = resultData.solution.geetest_seccode || resultData.solution.seccode;

                    console.log(`✅ Geetest V4 solved`);
                    console.log(`📝 Challenge: ${geetestChallenge?.substring(0, 20)}...`);

                    return {
                        success: true,
                        challenge: geetestChallenge,
                        validate: geetestValidate,
                        seccode: geetestSeccode,
                        type: 'geetest'
                    };
                }

                if (i % 10 === 0) {
                    console.log(`⏳ Waiting for Geetest V4 result (${i}s)...`);
                }
            }

            console.error('❌ Geetest V4 solve timeout');
            return null;
        } catch (error) {
            console.error('❌ Geetest V4 solve error:', error.message);
            return null;
        }
    }
}

module.exports = VIPAutomation;
