/**
 * VIP Tool Automation - 3 Categories (OKVIP, ABCVIP, JUN88, JUN88V2, AccOKVIP)
 * Luá»“ng chung: register â†’ addbank â†’ checkpromo
 * Form filling riÃªng cho tá»«ng category
 */

// Import fetch for Node.js (v18+)
const fetch = global.fetch || require('node-fetch');

// Get dashboard port
const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;

// Import tab rotator
const tabRotator = require('./tab-rotator');

// Import common form filler
const CommonFormFiller = require('../common/form-filler');

// Import CaptchaSolver for API fallback
const CaptchaSolver = require('../nohu-tool/extension/captcha-solver.js');

// 63 tá»‰nh thÃ nh Viá»‡t Nam
const VIETNAM_PROVINCES = [
    'An Giang', 'BÃ  Rá»‹a - VÅ©ng TÃ u', 'Báº¯c Giang', 'Báº¯c Káº¡n', 'Báº¡c LiÃªu', 'Báº¯c Ninh',
    'Báº¿n Tre', 'BÃ¬nh Äá»‹nh', 'BÃ¬nh DÆ°Æ¡ng', 'BÃ¬nh PhÆ°á»›c', 'BÃ¬nh Thuáº­n', 'CÃ  Mau',
    'Cao Báº±ng', 'Äáº¯k Láº¯k', 'Äáº¯k NÃ´ng', 'Äiá»‡n BiÃªn', 'Äá»“ng Nai', 'Äá»“ng ThÃ¡p',
    'Gia Lai', 'HÃ  Giang', 'HÃ  Nam', 'HÃ  Ná»™i', 'HÃ  TÄ©nh', 'Háº£i DÆ°Æ¡ng',
    'Háº£i PhÃ²ng', 'Háº­u Giang', 'HÃ²a BÃ¬nh', 'HÆ°ng YÃªn', 'KhÃ¡nh HÃ²a', 'KiÃªn Giang',
    'Kon Tum', 'Lai ChÃ¢u', 'LÃ¢m Äá»“ng', 'Láº¡ng SÆ¡n', 'LÃ o Cai', 'Long An',
    'Nam Äá»‹nh', 'Nghá»‡ An', 'Ninh BÃ¬nh', 'Ninh Thuáº­n', 'PhÃº Thá»', 'PhÃº YÃªn',
    'Quáº£ng BÃ¬nh', 'Quáº£ng Nam', 'Quáº£ng NgÃ£i', 'Quáº£ng Ninh', 'Quáº£ng Trá»‹', 'SÃ³c TrÄƒng',
    'SÆ¡n La', 'TÃ¢y Ninh', 'ThÃ¡i BÃ¬nh', 'ThÃ¡i NguyÃªn', 'Thanh HÃ³a', 'Thá»«a ThiÃªn Huáº¿',
    'Tiá»n Giang', 'TP. Há»“ ChÃ­ Minh', 'TrÃ  Vinh', 'TuyÃªn Quang', 'VÄ©nh Long', 'VÄ©nh PhÃºc',
    'YÃªn BÃ¡i'
];

// JUN88V2 specific bank mapping (matches exact dropdown text)
const JUN88V2_BANK_NAME_MAPPING = {
    'Vietcombank': 'Vietcombank / NgÃ¢n hÃ ng Ngoáº¡i ThÆ°Æ¡ng',
    'Techcombank': 'Techcom Bank',
    'BIDV': 'BIDV / NgÃ¢n hÃ ng TMCP Äáº§u tÆ° vÃ  PhÃ¡t triá»ƒn Viá»‡t Nam',
    'VietinBank': 'VietinBank / NgÃ¢n hÃ ng CÃ´ng ThÆ°Æ¡ng',
    'Agribank': 'Agribank / NgÃ¢n hÃ ng NÃ´ng nghiá»‡p',
    'ACB': 'ACB / NgÃ¢n hÃ ng Ã ChÃ¢u',
    'MB': 'MBBank / NgÃ¢n hÃ ng QuÃ¢n Äá»™i',
    'MBBank': 'MBBank / NgÃ¢n hÃ ng QuÃ¢n Äá»™i',
    'TPBank': 'TPBank / NgÃ¢n hÃ ng TiÃªn Phong',
    'VPBank': 'VPBank / NgÃ¢n hÃ ng Viá»‡t Nam Thá»‹nh VÆ°á»£ng',
    'Sacombank': 'Sacombank / NgÃ¢n hÃ ng SÃ i GÃ²n ThÆ°Æ¡ng TÃ­n',
    'HDBank': 'HDBank',
    'VIB': 'VIB / NgÃ¢n hÃ ng Quá»‘c Táº¿',
    'SHB': 'SHB / NgÃ¢n hÃ ng SÃ i GÃ²n-HÃ  Ná»™i',
    'Eximbank': 'Eximbank / NgÃ¢n hÃ ng Xuáº¥t Nháº­p Kháº©u',
    'MSB': 'MSB / NgÃ¢n HÃ ng HÃ ng Háº£i',
    'OCB': 'OCB / NgÃ¢n hÃ ng PhÆ°Æ¡ng ÄÃ´ng',
    'SeABank': 'SeABank / NgÃ¢n hÃ ng ÄÃ´ng Nam Ã',
    'NamABank': 'NamABank / NgÃ¢n hÃ ng Nam Ã',
    'Nam A Bank': 'NamABank / NgÃ¢n hÃ ng Nam Ã',
    'PVcomBank': 'PVcomBank / NgÃ¢n hÃ ng Äáº¡i ChÃºng',
    'BacABank': 'BacABank / NgÃ¢n hÃ ng Báº¯c Ã',
    'BacA Bank': 'BacABank / NgÃ¢n hÃ ng Báº¯c Ã',
    'Viet Capital Bank': 'Viet Capital Bank / NgÃ¢n hÃ ng Báº£n Viá»‡t',
    'VietCapital': 'Viet Capital Bank / NgÃ¢n hÃ ng Báº£n Viá»‡t',
    'LPBank': 'LPBank / NgÃ¢n hÃ ng BÆ°u Ä‘iá»‡n LiÃªn Viá»‡t',
    'LienVietPostBank': 'LPBank / NgÃ¢n hÃ ng BÆ°u Ä‘iá»‡n LiÃªn Viá»‡t',
    'Kien Long Bank': 'Kien Long Bank /  KiÃªn Long Bank',
    'KienLongBank': 'Kien Long Bank /  KiÃªn Long Bank',
    'GPBank': 'GPBank',
    'PG Bank': 'PG Bank / Petrolimex',
    'PGBank': 'PG Bank / Petrolimex',
    'NCB': 'NCB / NgÃ¢n hÃ ng Quá»‘c DÃ¢n',
    'SCB': 'SCB / NgÃ¢n hÃ ng SÃ i GÃ²n',
    'VietABank': 'VietABank / NgÃ¢n hÃ ng Viá»‡t Ã',
    'VietBank': 'VietBank / Viá»‡t Nam ThÆ°Æ¡ng TÃ­n',
    'ABBank': 'ABBank / NgÃ¢n hÃ ng An BÃ¬nh',
    'ABBANK': 'ABBank / NgÃ¢n hÃ ng An BÃ¬nh',
    'CBBank': 'CBBank / NgÃ¢n hÃ ng XÃ¢y Dá»±ng',
    'CBBANK': 'CBBank / NgÃ¢n hÃ ng XÃ¢y Dá»±ng',
    'COOPBANK': 'COOPBANK - NgÃ¢n hÃ ng Há»£p tÃ¡c xÃ£ Viá»‡t Nam',
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
    'IBK': 'IBK / NgÃ¢n HÃ ng CÃ´ng Nghiá»‡p HÃ n Quá»‘c',
    'NongHyup Bank': 'NongHyup Bank',
    'NongHyup': 'NongHyup Bank',
    'VRB': 'VRB / NgÃ¢n hÃ ng Viá»‡t - Nga',
    'IVB': 'IVB / Indovina Bank',
    'Indovina': 'IVB / Indovina Bank',
    'SaigonBank': 'SaigonBank / SÃ i GÃ²n CÃ´ng ThÆ°Æ¡ng',
    'Cake by VPBank': 'Cake by VPBank',
    'Cake': 'Cake by VPBank',
    'Liobank by OCB': 'Liobank by OCB',
    'Liobank': 'Liobank by OCB',
    'Timo by BVBank': 'Timo by BVBank',
    'Timo': 'Timo by BVBank',
    'VBSP': 'VBSP / NgÃ¢n hÃ ng ChÃ­nh sÃ¡ch xÃ£ há»™i',
    'Vikki by HDBank': 'Vikki by HDBank',
    'Vikki': 'Vikki by HDBank',
    'MBV': 'MBV / NgÃ¢n hÃ ng Viá»‡t Nam Hiá»‡n Äáº¡i'
};

class VIPAutomation {
    constructor(settings, scripts) {
        this.settings = settings;
        this.scripts = scripts; // { contentScript, captchaSolver, banksScript }

        // Äá»‹nh nghÄ©a Ä‘uÃ´i path cho tá»«ng category
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
                // accOkvip chá»‰ cáº§n register, khÃ´ng cáº§n addBank/checkPromo
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'abcvip': {
                withdrawPassword: '/Account/ChangeMoneyPassword',
                bank: '/Financial?type=withdraw'
            },
            'jun88': {
                withdrawPassword: '/Account/ChangeMoneyPassword', //  k cáº§n
                bank: '/account/withdrawaccounts/bankcards'
            },
            '78win': {
                withdrawPassword: '/Account/ChangeMoneyPassword',//  k cáº§n
                bank: '/account/withdrawaccounts/bankcards'
            },
            'jun88v2': {
                withdrawPassword: '/Account/ChangeMoneyPassword',//  k cáº§n
                bank: '/myaccount/bankdetails'
            },
            '22vip': {
                withdrawPassword: '/home/security?active=5',
                bank: '/home/withdraw?active=0'
            }
        };
    }

    /**
     * Helper: Map bank name tá»« VietQR API sang dropdown option
     */
    mapBankName(bankName, category = null) {
        if (!bankName) return '';

        // Only use mapping for JUN88V2
        if (category === 'jun88v2') {
            // Thá»­ mapping trá»±c tiáº¿p
            if (JUN88V2_BANK_NAME_MAPPING[bankName]) {
                return JUN88V2_BANK_NAME_MAPPING[bankName];
            }

            // Thá»­ tÃ¬m kiáº¿m khÃ´ng phÃ¢n biá»‡t hoa thÆ°á»ng
            const lowerInput = bankName.toLowerCase();
            for (const [key, value] of Object.entries(JUN88V2_BANK_NAME_MAPPING)) {
                if (key.toLowerCase() === lowerInput) {
                    return value;
                }
            }

            // Thá»­ tÃ¬m kiáº¿m partial match
            for (const [key, value] of Object.entries(JUN88V2_BANK_NAME_MAPPING)) {
                if (key.toLowerCase().includes(lowerInput) || lowerInput.includes(key.toLowerCase())) {
                    return value;
                }
            }

            console.warn(`âš ï¸ No mapping found for bank: ${bankName}`);
        }

        // For other categories, return bankName as-is (no mapping)
        return bankName;
    }

    /**
     * Helper: Find bank item in dropdown and click it
     * Logs all available banks for debugging
     */
    async selectBankFromDropdown(page, bankName, selector = '.mc-bank-item') {
        console.log(`ðŸ¦ Selecting bank: ${bankName}`);

        const result = await page.evaluate((bankNameToFind, itemSelector) => {
            const bankItems = document.querySelectorAll(itemSelector);
            console.log(`ðŸ“‹ Found ${bankItems.length} bank items in dropdown`);

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
                    console.log(`âœ… Exact match found: ${itemText}`);
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
                        console.log(`âœ… Partial match found: ${itemText}`);
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
                console.warn(`âš ï¸ Bank not found, selecting first option: ${firstBank}`);
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
     * Helper: Extract domain tá»« URL
     */
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            console.error('âŒ Invalid URL:', url);
            return null;
        }
    }

    /**
     * Helper: Calculate random delay (2-10s) - dÃ¹ng chung cho táº¥t cáº£ category
     */
    getRandomDelay(minMs = 2000, maxMs = 10000) {
        return Math.random() * (maxMs - minMs) + minMs;
    }

    /**
     * Helper: Random chi nhÃ¡nh tá»« 63 tá»‰nh thÃ nh Viá»‡t Nam
     */
    getRandomProvince() {
        return VIETNAM_PROVINCES[Math.floor(Math.random() * VIETNAM_PROVINCES.length)];
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
            console.warn('âš ï¸ Failed to send status update:', err.message);
        }
    }

    /**
     * Inject required scripts vÃ o page (captcha-solver, content script)
     */
    async injectScripts(page) {
        try {
            console.log('ðŸ’‰ Injecting scripts...');

            // Inject captcha-solver.js
            if (this.scripts && this.scripts.captchaSolver) {
                console.log('ðŸ’‰ Injecting captcha-solver.js...');
                await page.evaluate(this.scripts.captchaSolver);
            }

            // Inject Puppeteer API helper (bypass CORS)
            console.log('ðŸ’‰ Injecting Puppeteer API helper...');
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

            console.log('âœ… Scripts injected successfully');
        } catch (error) {
            console.error('âŒ Script injection error:', error.message);
            throw error;
        }
    }

    /**
     * Solve captcha via API (server-side, no extension needed)
     */
    async solveCaptchaViaAPI(base64Image, apiKey) {
        try {
            if (!apiKey) {
                console.warn('âš ï¸ No API key for captcha solving');
                return null;
            }

            // Use 2Captcha API
            return await this.solveCaptchaVia2Captcha(base64Image, apiKey);
        } catch (error) {
            console.error('âŒ Captcha API error:', error.message);
            return null;
        }
    }

    async solveCaptchaVia2Captcha(base64Image, apiKey) {
        try {
            console.log('ðŸ” Äang giáº£i captcha qua API 2Captcha...');
            console.log('ðŸ“Š Äá»™ dÃ i Base64:', base64Image?.length || 0);

            // Loáº¡i bá» tiá»n tá»‘ data:image
            const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

            // BÆ°á»›c 1: Gá»­i captcha lÃªn 2Captcha
            console.log('ðŸ“¤ Gá»­i tá»›i API 2Captcha...');
            const submitResponse = await fetch('https://api.2captcha.com/createTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: 'ImageToTextTask',
                        body: cleanBase64
                    }
                })
            });

            const submitData = await submitResponse.json();
            console.log('ðŸ“¤ Pháº£n há»“i gá»­i:', submitData);

            // Kiá»ƒm tra lá»—i
            if (submitData.errorId !== 0) {
                console.error('âŒ Lá»—i gá»­i captcha:', submitData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                return null;
            }

            // Xá»­ lÃ½ pháº£n há»“i thÃ nh cÃ´ng {errorId: 0, taskId: "xxx"}
            if (submitData.taskId) {
                const taskId = submitData.taskId;
                console.log(`ðŸ“ Captcha Ä‘Ã£ gá»­i, Task ID: ${taskId}`);

                // Kiá»ƒm tra káº¿t quáº£ (tá»‘i Ä‘a 60 giÃ¢y)
                for (let i = 0; i < 60; i++) {
                    await new Promise(r => setTimeout(r, 2000));

                    const resultResponse = await fetch('https://api.2captcha.com/getTaskResult', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientKey: apiKey,
                            taskId: taskId
                        })
                    });
                    const resultData = await resultResponse.json();

                    if (resultData.errorId === 0 && resultData.status === 'ready' && resultData.solution) {
                        console.log(`âœ… Captcha Ä‘Ã£ giáº£i: ${resultData.solution.text}`);
                        return resultData.solution.text;
                    }

                    // Status processing = chÆ°a sáºµn sÃ ng
                    if (resultData.status === 'processing') {
                        if (i % 10 === 0) {
                            console.log(`â³ Chá» káº¿t quáº£ captcha (${i}s)...`);
                        }
                        continue;
                    }

                    // CÃ¡c status khÃ¡c lÃ  lá»—i
                    if (resultData.errorId !== 0) {
                        console.error('âŒ Lá»—i giáº£i captcha:', resultData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                        return null;
                    }
                }

                console.error('âŒ Timeout giáº£i captcha');
                return null;
            }

            console.error('âŒ Äá»‹nh dáº¡ng pháº£n há»“i khÃ´ng xÃ¡c Ä‘á»‹nh:', submitData);
            return null;
        } catch (error) {
            console.error('âŒ Lá»—i API 2Captcha:', error.message);
            return null;
        }
    }

    /**
     * Get phone number from CodeSim API
     */
    async getPhoneFromCodeSim(codeSimToken) {
        try {
            if (!codeSimToken) {
                console.warn('âš ï¸ No CodeSim token provided');
                return null;
            }

            console.log('ðŸ“± Requesting phone number from CodeSim API...');

            // Request phone number from CodeSim via backend API
            // Use full URL with localhost since this runs in Node.js backend
            const url = `http://localhost:3000/api/sim/get-phone?key=${codeSimToken}&serviceId=1`;
            const response = await fetch(url);
            const data = await response.json();

            console.log('ðŸ“¤ CodeSim response:', JSON.stringify(data));

            // Kiá»ƒm tra response
            if (!data.success || !data.phone) {
                console.warn('âš ï¸ CodeSim: No phone number available');
                return null;
            }

            let phoneNumber = data.phone;
            const otpId = data.otpId; // OTP ID Ä‘á»ƒ láº¥y OTP sau
            const simId = data.simId; // SIM ID Ä‘á»ƒ há»§y sau

            // Kiá»ƒm tra sá»‘ Ä‘iá»‡n thoáº¡i há»£p lá»‡
            if (!phoneNumber) {
                console.warn('âš ï¸ CodeSim: No phone number in response');
                return null;
            }

            // Loáº¡i bá» sá»‘ "0" hoáº·c sá»‘ quÃ¡ ngáº¯n
            if (phoneNumber === '0') {
                console.warn('âš ï¸ CodeSim: Invalid phone number: 0');
                return null;
            }

            // Náº¿u sá»‘ khÃ´ng cÃ³ sá»‘ 0 á»Ÿ Ä‘áº§u, thÃªm vÃ o
            if (!phoneNumber.startsWith('0')) {
                phoneNumber = '0' + phoneNumber;
            }

            // Kiá»ƒm tra Ä‘á»™ dÃ i
            if (phoneNumber.length < 10) {
                console.warn(`âš ï¸ CodeSim: Phone number too short: ${phoneNumber}`);
                return null;
            }

            console.log(`âœ… Got phone number from CodeSim: ${phoneNumber}`);
            console.log(`ðŸ“ OTP ID: ${otpId}, SIM ID: ${simId}`);

            return {
                success: true,
                phoneNumber,
                otpId,
                simId,
                requestId: otpId, // Use otpId as requestId for OTP retrieval
                service: 'codesim'
            };
        } catch (error) {
            console.error('âŒ CodeSim API error:', error.message);
            return null;
        }
    }

    /**
     * Get OTP from CodeSim API
     */
    async getOtpFromCodeSim(codeSimToken, otpId) {
        try {
            if (!codeSimToken || !otpId) {
                console.warn('âš ï¸ CodeSim token or OTP ID missing');
                return null;
            }

            console.log('â³ Waiting for OTP from CodeSim...');

            let otp = null;
            let attempts = 0;
            const maxAttempts = 30; // 30 * 3 seconds = 90 seconds

            while (!otp && attempts < maxAttempts) {
                attempts++;
                await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds

                const url = `http://localhost:3000/api/sim/get-otp?key=${codeSimToken}&otpId=${otpId}`;
                const response = await fetch(url);
                const data = await response.json();

                console.log(`  ðŸ“¤ CodeSim OTP check (attempt ${attempts}):`, JSON.stringify(data));

                if (data.success && data.code) {
                    otp = data.code;
                    console.log(`âœ… OTP received: ${otp}`);
                    break;
                }

                if (attempts % 5 === 0) {
                    console.log(`â³ Still waiting for OTP... (${attempts * 3}s)`);
                }
            }

            if (!otp) {
                console.warn('âš ï¸ OTP timeout after 90 seconds');
                return null;
            }

            return {
                success: true,
                code: otp
            };
        } catch (error) {
            console.error('âŒ CodeSim OTP error:', error.message);
            return null;
        }
    }

    /**
     * Get phone number from CodeSim API (khÃ´ng chá» OTP)
     * Thá»­ láº§n lÆ°á»£t cÃ¡c serviceId cho Ä‘áº¿n khi thÃ nh cÃ´ng
     */


    /**
     * Solve Cloudflare Turnstile via 2Captcha API
     */
    async solveTurnstileViaAPI(page, apiKey) {
        try {
            if (!apiKey) {
                console.warn('âš ï¸ No API key for Turnstile solving');
                return null;
            }

            console.log('ðŸ” Äang giáº£i Cloudflare Turnstile qua API 2Captcha...');

            // Wait for Turnstile widget to load (max 15 seconds - it loads dynamically)
            try {
                await page.waitForSelector('.turnstile-container, [data-sitekey], [id*="turnstile"]', { timeout: 15000 }).catch(() => null);
                console.log('âœ… Turnstile widget detected');
                // Wait extra time for Turnstile to fully initialize
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.warn('âš ï¸ Turnstile widget not found after waiting');
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
                console.warn('âš ï¸ Could not find Turnstile sitekey');
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

                console.log('ðŸ“Š Debug Info:', debugInfo);
                return null;
            }

            console.log(`ðŸ“ Found sitekey: ${sitekey}`);

            // Get page URL
            const pageUrl = page.url();
            console.log(`ðŸ“„ Page URL: ${pageUrl}`);

            // Step 2: Submit Turnstile task to 2Captcha
            const submitResponse = await fetch('https://api.2captcha.com/createTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: 'TurnstileTaskProxyless',
                        websiteURL: pageUrl,
                        websiteKey: sitekey
                    }
                })
            });

            const submitData = await submitResponse.json();
            console.log('ðŸ“¤ Pháº£n há»“i gá»­i Turnstile:', submitData);

            // Kiá»ƒm tra lá»—i
            if (submitData.errorId !== 0) {
                console.error('âŒ Lá»—i gá»­i Turnstile:', submitData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                return null;
            }

            // Xá»­ lÃ½ Ä‘á»‹nh dáº¡ng polling {errorId: 0, taskId: "xxx"}
            if (submitData.taskId) {
                const taskId = submitData.taskId;
                console.log(`ðŸ“ Turnstile Ä‘Ã£ gá»­i, Task ID: ${taskId}`);

                // Kiá»ƒm tra káº¿t quáº£ (tá»‘i Ä‘a 60 giÃ¢y cho Turnstile)
                for (let i = 0; i < 60; i++) {
                    await new Promise(r => setTimeout(r, 2000));

                    const resultResponse = await fetch('https://api.2captcha.com/getTaskResult', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientKey: apiKey,
                            taskId: taskId
                        })
                    });
                    const resultData = await resultResponse.json();

                    if (resultData.errorId === 0 && resultData.status === 'ready' && resultData.solution) {
                        console.log(`âœ… Turnstile Ä‘Ã£ giáº£i`);
                        return resultData.solution.token;
                    }

                    if (i % 10 === 0) {
                        console.log(`â³ Chá» káº¿t quáº£ Turnstile (${i}s)...`);
                    }
                }

                console.error('âŒ Timeout giáº£i Turnstile');
                return null;
            }

            console.error('âŒ Äá»‹nh dáº¡ng pháº£n há»“i khÃ´ng xÃ¡c Ä‘á»‹nh:', submitData);
            return null;
        } catch (error) {
            console.error('âŒ Lá»—i API Turnstile 2Captcha:', error.message);
            return null;
        }
    }

    /**
     * Auto-solve captcha on page using CaptchaSolver
     */
    async solveCaptchaOnPage(page, apiKey) {
        try {
            console.log('ðŸŽµ Starting auto-solve captcha...');

            if (!apiKey) {
                console.warn('âš ï¸ No API key provided for captcha solving');
                return false;
            }

            // Wait for captcha image to appear (with timeout)
            let captchaImage = null;
            let attempts = 0;
            const maxAttempts = 5;

            while (!captchaImage && attempts < maxAttempts) {
                attempts++;
                console.log(`ðŸ” Looking for captcha image (attempt ${attempts}/${maxAttempts})...`);

                try {
                    await page.waitForSelector('img#captcha, img[src^="data:image"], .codeImage', { timeout: 2000 }).catch(() => null);

                    // Get captcha image with detailed logging
                    captchaImage = await page.evaluate(() => {
                        // Log all images on page
                        const allImages = document.querySelectorAll('img');
                        console.log(`ðŸ“Š Total images on page: ${allImages.length}`);

                        allImages.forEach((img, idx) => {
                            const src = img.src.substring(0, 100); // First 100 chars
                            console.log(`  [${idx}] class="${img.className}" id="${img.id}" src="${src}..."`);
                        });

                        // Try selectors in order
                        let img = document.querySelector('img#captcha');
                        if (img) {
                            console.log('âœ… Found by id="captcha"');
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
                                    console.log('âœ… Found by #van-field-7-input parent .codeImage');
                                    return img.src;
                                }
                            }
                        }

                        img = document.querySelector('img[src^="data:image"]');
                        if (img) {
                            console.log('âœ… Found by src^="data:image"');
                            return img.src;
                        }

                        // For AccOKVIP: get the LAST .codeImage (captcha), not the first (phone icon)
                        const codeImages = document.querySelectorAll('.codeImage');
                        if (codeImages.length > 0) {
                            img = codeImages[codeImages.length - 1]; // Get last one
                            console.log(`âœ… Found by class="codeImage" (${codeImages.length} total, using last)`);
                            return img.src;
                        }

                        // Try to find captcha by looking for images with specific dimensions or patterns
                        for (const image of allImages) {
                            const src = image.src;
                            // Look for images that are likely captcha (not too small, not too large)
                            if (src && (src.includes('captcha') || src.includes('code') || src.includes('verify'))) {
                                console.log('âœ… Found by src pattern');
                                return src;
                            }
                        }

                        return null;
                    });

                    if (captchaImage) {
                        console.log('ðŸ“¸ Found captcha image');
                        break;
                    }
                } catch (e) {
                    console.log(`âš ï¸ Attempt ${attempts} failed:`, e.message);
                }

                if (!captchaImage && attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }

            if (!captchaImage) {
                console.log('âš ï¸ No captcha image found after all attempts');
                return false;
            }

            console.log('ðŸ” Solving captcha with API...');

            // Solve captcha via API (server-side)
            const captchaAnswer = await this.solveCaptchaViaAPI(captchaImage, apiKey);

            if (!captchaAnswer) {
                console.error('âŒ Failed to solve captcha');
                return false;
            }

            // Fill captcha input - try multiple selectors
            const filled = await page.evaluate((answer) => {
                const selectors = [
                    'input[formcontrolname="checkCode"]',
                    '#van-field-7-input',  // AccOKVIP captcha field
                    'input[placeholder*="captcha"]',
                    'input[placeholder*="xÃ¡c minh"]',
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
                console.log('âœ… Captcha filled:', captchaAnswer, 'at', filled.selector);
                return true;
            } else {
                console.warn('âš ï¸ Could not find captcha input field');
                return false;
            }
        } catch (error) {
            console.error('âŒ Captcha solve error:', error.message);
            return false;
        }
    }

    /**
     * Main automation flow - Luá»“ng chung cho táº¥t cáº£ categories
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
                console.log(`âœ… Tracking VIP running profile: ${profileData.profileId} (${profileData.username})`);
            }

            await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: profileData.profileId,
                    username: profileData.username,
                    status: 'running',
                    category: category, // ðŸ”¥ Add category to status
                    message: `ðŸš€ Báº¯t Ä‘áº§u cháº¡y ${sites.length} site(s) (${category.toUpperCase()})...`,
                    sites: sites.map(s => ({ name: s })),
                    timestamp: new Date().toISOString()
                })
            });
            console.log('ðŸ“¤ Sent running status to dashboard');
        } catch (err) {
            console.warn('âš ï¸ Failed to send running status:', err.message);
        }

        // Táº¡o shared browser context cho checkPromo (náº¿u cáº§n)
        // NOTE: Disabled shared context to avoid conflicts with other tools (Nohu, etc.)
        // Each site will use its own browser instance for checkPromo
        let sharedPromoContext = null;
        // if (mode === 'auto' || mode === 'promo') {
        //     try {
        //         console.log(`ðŸªŸ Creating shared browser context for checkPromo...`);
        //         sharedPromoContext = await browser.createBrowserContext();
        //         console.log(`âœ… Shared browser context created`);
        //     } catch (error) {
        //         console.warn(`âš ï¸ Failed to create shared context:`, error.message);
        //     }
        // }

        // Process sites based on execution mode
        if (executionMode === 'parallel') {
            console.log(`ðŸš€ Running ${sites.length} sites in PARALLEL (${parallelCount} at a time)...`);
            await this.runSitesParallel(browser, category, sites, profileData, mode, sharedPromoContext, parallelCount, results);
        } else {
            console.log(`ðŸ“‹ Running ${sites.length} sites SEQUENTIALLY...`);
            await this.runSitesSequential(browser, category, sites, profileData, mode, sharedPromoContext, results);
        }

        // Keep shared context open for user to see results
        if (sharedPromoContext) {
            console.log(`ðŸ“Œ Keeping shared browser context open for inspection`);
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
                    message: `âœ… HoÃ n thÃ nh: ${successCount}/${totalCount} site(s) thÃ nh cÃ´ng`,
                    results: results,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('ðŸ“¤ Sent completed status to dashboard');
        } catch (err) {
            console.warn('âš ï¸ Failed to send completed status:', err.message);
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
                console.error(`âŒ Site not found: ${siteName}`);
                continue;
            }

            console.log(`\nðŸš€ Processing ${category.toUpperCase()} - ${siteName}`);

            try {
                if (mode === 'auto') {
                    // Luá»“ng tá»± Ä‘á»™ng: register â†’ addbank â†’ checkpromo (reuse same page)
                    const registerResult = await this.registerStep(browser, category, siteConfig, profileData);

                    // Skip addBank náº¿u register failed
                    let addBankResult = { success: false, skipped: true, message: 'Skipped - register failed' };
                    console.log(`ðŸ” Register result for ${siteName}:`, registerResult);
                    if (!registerResult?.success) {
                        console.log(`â­ï¸ Skipping addBank for ${siteName} (register failed)`);
                    } else {
                        // Save account info after successful registration
                        console.log(`ðŸ“ Attempting to save account info for ${siteName}...`);
                        try {
                            await this.saveAccountInfo(profileData, category, siteName, sites);
                            console.log(`âœ… Account info saved successfully for ${siteName}`);
                        } catch (err) {
                            console.error(`âŒ Account save failed for ${siteName}:`, err.message);
                            console.error(`ðŸ“ Stack:`, err.stack);
                        }

                        // Reuse page from registerResult
                        addBankResult = await this.addBankStep(browser, category, siteConfig, profileData, registerResult.page);

                        // Update account info with bank data if addBank succeeded
                        if (addBankResult?.success) {
                            console.log(`ðŸ’¾ Updating account info with bank data for ${siteName}...`);
                            try {
                                const siteNames = Array.isArray(sites)
                                    ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                                    : [];
                                await this.saveAccountInfo(profileData, category, siteName, siteNames);
                                console.log(`âœ… Account info updated with bank data`);
                            } catch (err) {
                                console.warn(`âš ï¸ Error updating account info:`, err.message);
                            }
                        }
                    }

                    // Skip checkPromo (all VIP use separate tab for checkPromo)
                    const checkPromoResult = { success: true, skipped: true, message: 'Skipped - use separate tab' };
                    console.log(`â­ï¸ Skipping checkPromo for ${siteName} (use separate tab)`);

                    // Build result object
                    const resultObj = {
                        site: siteName,
                        register: registerResult
                    };
                    if (addBankResult !== null) resultObj.addBank = addBankResult;
                    if (checkPromoResult !== null) resultObj.checkPromo = checkPromoResult;

                    results.push(resultObj);
                } else if (mode === 'promo') {
                    // Chá»‰ check promo
                    const checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                    results.push({
                        site: siteName,
                        checkPromo: checkPromoResult
                    });
                }
            } catch (error) {
                console.error(`âŒ Error processing ${siteName}:`, error.message);
                results.push({
                    site: siteName,
                    error: error.message
                });
            }

            // Add delay between sites to reduce resource contention with other tools
            if (siteName !== sites[sites.length - 1]) {
                console.log(`â³ Waiting 1 second before next site (to avoid Hidemium resource exhaustion)...`);
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
                    console.log(`\nðŸ“¦ Processing batch ${Math.floor(i / parallelCount) + 1}: ${batch.join(', ')}`);
                } else {
                    console.log(`\nðŸš€ Processing: ${batch.join(', ')}`);
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
                    console.log(`â³ Waiting 2 seconds before next batch (to avoid Hidemium resource exhaustion)...`);
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
            console.error(`âŒ Site not found: ${siteName}`);
            return { site: siteName, error: 'Site not found' };
        }

        console.log(`\nðŸš€ Processing ${category.toUpperCase()} - ${siteName}`);

        try {
            if (mode === 'auto') {
                // Luá»“ng tá»± Ä‘á»™ng: register â†’ addbank â†’ checkpromo (reuse same page)
                const registerResult = await this.registerStep(browser, category, siteConfig, profileData);

                // Skip addBank náº¿u register failed
                let addBankResult = { success: false, skipped: true, message: 'Skipped - register failed' };
                if (!registerResult?.success) {
                    console.log(`â­ï¸ Skipping addBank for ${siteName} (register failed)`);
                } else {
                    // Save account info after successful registration
                    console.log(`ðŸ“ Attempting to save account info for ${siteName}...`);
                    try {
                        // Convert sites array to site names if needed
                        const siteNames = Array.isArray(sites) && sites.length > 0
                            ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                            : [];
                        await this.saveAccountInfo(profileData, category, siteName, siteNames);
                        console.log(`âœ… Account info saved successfully for ${siteName}`);
                    } catch (err) {
                        console.error(`âŒ Account save failed for ${siteName}:`, err.message);
                    }

                    // Reuse page from registerResult
                    addBankResult = await this.addBankStep(browser, category, siteConfig, profileData, registerResult.page);

                    // Update account info with bank data if addBank succeeded
                    if (addBankResult?.success) {
                        console.log(`ðŸ’¾ Updating account info with bank data for ${siteName}...`);
                        try {
                            const siteNames = Array.isArray(sites) && sites.length > 0
                                ? (typeof sites[0] === 'string' ? sites : sites.map(s => s.name || s))
                                : [];
                            await this.saveAccountInfo(profileData, category, siteName, siteNames);
                            console.log(`âœ… Account info updated with bank data`);
                        } catch (err) {
                            console.warn(`âš ï¸ Error updating account info:`, err.message);
                        }
                    }
                }

                // Skip checkPromo (all VIP use separate tab for checkPromo)
                const checkPromoResult = { success: true, skipped: true, message: 'Skipped - use separate tab' };
                console.log(`â­ï¸ Skipping checkPromo for ${siteName} (use separate tab)`);

                // Build result object
                const resultObj = {
                    site: siteName,
                    register: registerResult
                };
                if (addBankResult !== null) resultObj.addBank = addBankResult;
                if (checkPromoResult !== null) resultObj.checkPromo = checkPromoResult;

                return resultObj;
            } else if (mode === 'promo') {
                // Chá»‰ check promo
                const checkPromoResult = await this.checkPromoStep(sharedPromoContext || browser, category, siteConfig, profileData);
                return {
                    site: siteName,
                    checkPromo: checkPromoResult
                };
            }
        } catch (error) {
            console.error(`âŒ Error processing ${siteName}:`, error.message);
            return {
                site: siteName,
                error: error.message
            };
        }
    }

    /**
     * BÆ°á»›c 1: Register
     */
    async registerStep(browser, category, siteConfig, profileData) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `Register-${siteConfig.name}`);
        try {
            console.log(`ðŸ“ Register step for ${siteConfig.name}...`);

            await page.goto(siteConfig.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Inject scripts (captcha-solver, etc.) - skip for manual captcha categories
            const manualCaptchaCategories = ['jun88', '78win', 'jun88v2'];
            if (!manualCaptchaCategories.includes(category)) {
                try {
                    await this.injectScripts(page);
                } catch (injectError) {
                    console.warn('âš ï¸ Script injection failed:', injectError.message);
                }
            } else {
                console.log(`â­ï¸ Skipping auto-captcha for ${category} (manual captcha required)`);
            }

            // For JUN88V2: Wait for user to solve Turnstile, then click "ÄÄƒng KÃ½" button
            if (category === 'jun88v2') {
                console.log('ðŸ” JUN88V2: Waiting for Turnstile to be solved...');
                console.log('â³ Please solve the Cloudflare Turnstile captcha manually...');

                // Wait for Turnstile to be solved (check if cf-turnstile-response has value)
                let turnstileSolved = false;
                for (let i = 0; i < 120; i++) {
                    const hasToken = await page.evaluate(() => {
                        const field = document.querySelector('input[name="cf-turnstile-response"]');
                        return field && field.value && field.value.length > 0;
                    });

                    if (hasToken) {
                        console.log('âœ… Turnstile solved by user');
                        turnstileSolved = true;
                        break;
                    }

                    await new Promise(r => setTimeout(r, 1000));
                    if (i % 10 === 0) {
                        console.log(`â³ Waiting for Turnstile... (${i}s)`);
                    }
                }

                if (!turnstileSolved) {
                    console.warn('âš ï¸ Turnstile not solved after 120 seconds');
                }

                // Wait extra time for Cloudflare to process token
                console.log('â³ Waiting for Cloudflare to process token...');
                await new Promise(r => setTimeout(r, 3000));

                // JUN88V2: Form is now ready, no need to click button anymore
                console.log('âœ… Registration form ready, proceeding to fill form...');
            }

            // Gá»i form filler riÃªng cho category
            await this.fillRegisterForm(page, category, profileData, siteConfig);

            // For AccOKVIP: Check if phone was successfully fetched from CodeSim (only if API mode)
            if (category === 'accOkvip' && profileData.simMode === 'api') {
                // Check if we have a valid phone number
                if (!profileData.codeSimRequestId) {
                    console.error('âŒ AccOKVIP: Failed to get phone number from CodeSim API');
                    console.error('âŒ CodeSim API returned: No available phone numbers');

                    // Throw error to trigger catch block and proper error handling
                    throw new Error('CodeSim API: Hiá»‡n khÃ´ng cÃ³ sáºµn sá»‘ Ä‘iá»‡n thoáº¡i phÃ¹ há»£p. Vui lÃ²ng thá»­ láº¡i sau!');
                }
            }

            // For OKVIP OTP: Check if phone was successfully fetched from CodeSim (only if API mode)
            if (category === 'okvipOtp' && profileData.simMode === 'api') {
                // Check if we have a valid phone number
                if (!profileData.codeSimRequestId) {
                    console.error('âŒ OKVIP OTP: Failed to get phone number from CodeSim API');
                    console.error('âŒ CodeSim API returned: No available phone numbers');

                    // Throw error to trigger catch block and proper error handling
                    throw new Error('CodeSim API: Hiá»‡n khÃ´ng cÃ³ sáºµn sá»‘ Ä‘iá»‡n thoáº¡i phÃ¹ há»£p. Vui lÃ²ng thá»­ láº¡i sau!');
                }
            }

            // Delay sau khi fill form (give React time to process changes)
            await new Promise(r => setTimeout(r, 3000));

            // Inject scripts (captcha-solver, etc.)
            try {
                await this.injectScripts(page);
            } catch (injectError) {
                console.warn('âš ï¸ Failed to inject scripts:', injectError.message);
            }

            // Solve captcha náº¿u cÃ³ API key (TRÆ¯á»šC submit cho cÃ¡c category khÃ¡c)
            // Skip captcha for JUN88, 78WIN, JUN88V2, 22VIP, AccOKVIP, OKVIP OTP (no captcha before submit)
            const shouldSolveCaptcha = !['jun88', '78win', 'jun88v2', '22vip', 'accOkvip', 'okvipOtp'].includes(category);
            const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;

            if (apiKey && shouldSolveCaptcha) {
                console.log('ðŸŽµ Attempting to solve captcha...');
                const captchaSolved = await this.solveCaptchaOnPage(page, apiKey);
                if (!captchaSolved) {
                    console.warn('âš ï¸ Captcha solve failed, continuing anyway...');
                }
                // Use captchaDelay from profileData (from UI)
                // Náº¿u user chá»n 0s thÃ¬ khÃ´ng delay, khÃ´ng fallback
                if (profileData?.captchaDelay !== undefined && profileData.captchaDelay > 0) {
                    console.log(`â³ Waiting ${profileData.captchaDelay}ms after captcha solve...`);
                    await new Promise(r => setTimeout(r, profileData.captchaDelay));
                } else if (profileData?.captchaDelay === 0) {
                    console.log('â­ï¸ No delay (0s selected)');
                } else {
                    // Fallback to config náº¿u khÃ´ng cÃ³ captchaDelay tá»« UI
                    const delayConfig = this.settings?.delays?.afterCaptcha || { default: 3000, abcvip: 10000 };
                    const captchaDelay = category === 'abcvip' ? delayConfig.abcvip : delayConfig.default;
                    console.log(`â³ Waiting ${captchaDelay}ms after captcha solve (from config)...`);
                    await new Promise(r => setTimeout(r, captchaDelay));
                }
            } else if (!shouldSolveCaptcha && category !== 'okvipOtp') {
                console.log('â­ï¸ Skipping captcha for JUN88V2, 22VIP, AccOKVIP (no captcha before submit)');
            } else if (category === 'okvipOtp') {
                console.log('â­ï¸ OKVIP OTP: Botion captcha will be solved AFTER submit button click');
            } else {
                console.warn('âš ï¸ No captcha API key provided');
            }

            // Add delay before submit (all VIP categories, but NOT AccOKVIP and OKVIP OTP)
            if (!['accOkvip', 'okvipOtp'].includes(category)) {
                // Use captchaDelay from profileData (from UI)
                // Náº¿u user chá»n 0s thÃ¬ khÃ´ng delay, khÃ´ng fallback
                if (profileData?.captchaDelay !== undefined && profileData.captchaDelay > 0) {
                    console.log(`â³ Using UI delay: ${Math.round(profileData.captchaDelay / 1000)}s before submit registration...`);
                    await new Promise(r => setTimeout(r, profileData.captchaDelay));
                } else if (profileData?.captchaDelay === 0) {
                    console.log('â­ï¸ No delay (0s selected), submitting immediately...');
                } else {
                    // Fallback to random delay from config náº¿u khÃ´ng cÃ³ captchaDelay tá»« UI
                    const delayConfig = this.settings?.delays?.beforeSubmit || { min: 2000, max: 5000 };
                    const delayBeforeSubmit = this.getRandomDelay(delayConfig.min, delayConfig.max);
                    console.log(`â³ Using random delay: ${Math.round(delayBeforeSubmit / 1000)}s before submit registration (from config)...`);
                    await new Promise(r => setTimeout(r, delayBeforeSubmit));
                }
            } else {
                // AccOKVIP & OKVIP OTP: no delay, submit immediately
                console.log('â­ï¸ AccOKVIP/OKVIP OTP: No delay, submitting immediately...');
            }

            // Submit form
            console.log(`ðŸ“¤ Submitting registration form for ${siteConfig.name}...`);

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
                        if (btn.textContent.includes('ÄÄ‚NG KÃ') || btn.textContent.includes('OK')) {
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
                        // Helper function to click button with multiple methods
                        const clickButton = () => {
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
                        };

                        // Click 1st time
                        clickButton();
                        console.log('ðŸ–±ï¸ Submit button clicked (1st time)');

                        // Click 2nd time after 500ms delay
                        setTimeout(() => {
                            clickButton();
                            console.log('ðŸ–±ï¸ Submit button clicked (2nd time)');
                        }, 500);
                    }, 3000);
                }
            });

            // Delay sau khi submit
            await new Promise(r => setTimeout(r, 5000));

            // OKVIP OTP: Solve Botion slider captcha AFTER submit button click
            if (category === 'okvipOtp') {
                console.log('ðŸŽµ OKVIP OTP: Attempting to solve Botion slider captcha (AFTER submit)...');

                let botionSolved = false;
                let botionAttempts = 0;
                const maxBotionAttempts = 5;

                while (!botionSolved && botionAttempts < maxBotionAttempts) {
                    botionAttempts++;
                    console.log(`\nðŸ”„ Botion solve attempt ${botionAttempts}/${maxBotionAttempts}`);

                    const solveResult = await this.solveBottionCaptcha(page, apiKey);

                    if (!solveResult) {
                        console.error(`âŒ Botion solve attempt ${botionAttempts} failed`);

                        if (botionAttempts < maxBotionAttempts) {
                            console.log('ðŸ”„ Retrying Botion captcha...');
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        } else {
                            console.error('âŒ OKVIP OTP: Botion captcha solve FAILED after all attempts');
                            throw new Error('OKVIP OTP: Botion captcha solve failed - automation stopped');
                        }
                    }

                    // Check if Botion captcha is still visible on page
                    console.log('ðŸ” Checking if Botion captcha is still visible...');
                    const captchaStillVisible = await page.evaluate(() => {
                        // Check if botion elements still exist
                        const botionWindow = document.querySelector('[class*="botion_window"]');
                        const botionBox = document.querySelector('[class*="botion_box"]');
                        const sliderTrack = document.querySelector('[class*="botion_track"]');

                        return !!(botionWindow || botionBox || sliderTrack);
                    });

                    if (captchaStillVisible) {
                        console.warn('âš ï¸ Botion captcha still visible on page - solve may have failed');

                        if (botionAttempts < maxBotionAttempts) {
                            console.log('ðŸ”„ Retrying Botion captcha...');
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        } else {
                            console.error('âŒ Botion captcha still visible after all attempts');
                            throw new Error('OKVIP OTP: Botion captcha still visible - automation stopped');
                        }
                    }

                    console.log('âœ… Botion captcha disappeared - solve successful!');
                    botionSolved = true;
                }

                console.log('âœ… OKVIP OTP: Botion captcha solved successfully');
                // Wait after Botion solve
                console.log(`â³ Waiting 3s after Botion captcha solve...`);
                await new Promise(r => setTimeout(r, 3000));
            }

            // JUN88 & 78WIN: Solve captcha AFTER submit button click
            if (['jun88', '78win'].includes(category)) {
                console.log(`ðŸŽµ ${category.toUpperCase()}: Attempting to solve captcha (AFTER submit)...`);

                let captchaSolved = false;
                let captchaAttempts = 0;
                const maxCaptchaAttempts = 5;

                while (!captchaSolved && captchaAttempts < maxCaptchaAttempts) {
                    captchaAttempts++;
                    console.log(`\nðŸ”„ Captcha solve attempt ${captchaAttempts}/${maxCaptchaAttempts}`);

                    const solveResult = await this.solveCaptchaOnPage(page, apiKey);

                    if (!solveResult) {
                        console.error(`âŒ Captcha solve attempt ${captchaAttempts} failed`);

                        if (captchaAttempts < maxCaptchaAttempts) {
                            console.log('ðŸ”„ Retrying captcha...');
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        } else {
                            console.error(`âŒ ${category.toUpperCase()}: Captcha solve FAILED after all attempts`);
                            throw new Error(`${category.toUpperCase()}: Captcha solve failed - automation stopped`);
                        }
                    }

                    console.log(`âœ… ${category.toUpperCase()}: Captcha solved successfully`);
                    captchaSolved = true;
                }

                // Wait after captcha solve
                console.log(`â³ Waiting 3s after captcha solve...`);
                await new Promise(r => setTimeout(r, 3000));
            }

            // For accOkvip: click "Gá»­i Ä‘i" button with retry logic for duplicate phone
            if (category === 'accOkvip') {
                console.log(`ðŸ–±ï¸ AccOKVIP: Clicking "Gá»­i Ä‘i" button to complete registration...`);

                let registrationSuccess = false;
                let retryCount = 0;
                const maxRetries = 10;
                const codeSimToken = this.settings?.codeSimToken || process.env.CodeSim_TOKEN;
                let currentPage = page; // Use currentPage instead of reassigning page

                while (!registrationSuccess && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`ðŸ“ AccOKVIP registration attempt ${retryCount}/${maxRetries}`);

                    try {
                        const sendClicked = await currentPage.evaluate(() => {
                            // Find "Gá»­i Ä‘i" button by class
                            const sendBtn = document.querySelector('.send.sendStyle1');
                            if (sendBtn) {
                                sendBtn.click();
                                console.log('âœ… "Gá»­i Ä‘i" button clicked');
                                return true;
                            }

                            // Fallback: find by text content in div
                            const divButtons = document.querySelectorAll('div[class*="send"]');
                            for (const btn of divButtons) {
                                if (btn.textContent.includes('Gá»­i Ä‘i')) {
                                    btn.click();
                                    console.log('âœ… "Gá»­i Ä‘i" button clicked (by div text)');
                                    return true;
                                }
                            }

                            // Fallback 2: find any element with "Gá»­i Ä‘i" text
                            const allElements = document.querySelectorAll('*');
                            for (const el of allElements) {
                                if (el.textContent.trim() === 'Gá»­i Ä‘i' || (el.textContent.includes('Gá»­i Ä‘i') && el.offsetHeight > 0)) {
                                    el.click();
                                    console.log('âœ… "Gá»­i Ä‘i" button clicked (by text search)');
                                    return true;
                                }
                            }

                            console.warn('âš ï¸ "Gá»­i Ä‘i" button not found');
                            return false;
                        });

                        if (!sendClicked) {
                            console.warn('âš ï¸ Could not click "Gá»­i Ä‘i" button, but continuing with OTP retrieval...');
                        }

                        // Wait for button to load and response
                        await new Promise(r => setTimeout(r, 5000));

                        // Check for error message (phone already registered) - chá»‰ detect error cá»¥ thá»ƒ
                        const errorDetected = await currentPage.evaluate(() => {
                            // Look for specific error messages about phone registration
                            const errorContainers = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="message"], [class*="toast"], [class*="notify"]');

                            const phoneErrorKeywords = [
                                'Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ­',
                                'already registered',
                                'sá»‘ Ä‘iá»‡n thoáº¡i',
                                'phone',
                                'Ä‘Ã£ tá»“n táº¡i',
                                'exist'
                            ];

                            for (const container of errorContainers) {
                                const text = container.textContent.toLowerCase();
                                // Check if it's a phone-related error
                                const hasPhoneKeyword = phoneErrorKeywords.some(keyword => text.includes(keyword));
                                if (hasPhoneKeyword) {
                                    console.log(`ðŸ”´ Phone error detected: ${container.textContent}`);
                                    return true;
                                }
                            }

                            return false;
                        });

                        if (errorDetected) {
                            console.warn(`âš ï¸ Error detected: Phone might be already registered`);

                            if (retryCount < maxRetries && codeSimToken) {
                                console.log(`ðŸ”„ Retrying with new phone number on current tab...`);

                                // Get new phone number (thá»­ serviceId 3 vÃ  21)
                                const newPhoneResult = await this.getPhoneFromCodeSim(codeSimToken);
                                if (newPhoneResult && newPhoneResult.phoneNumber) {
                                    const newPhone = newPhoneResult.phoneNumber;
                                    console.log(`âœ… Got new phone: ${newPhone}`);

                                    // Reload current page instead of opening new tab
                                    console.log('ï¿½ Relnoading current tab with new phone number...');
                                    const registerUrl = 'https://m.okvipau.com/register';
                                    await currentPage.goto(registerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                                    // Update profileData with new phone
                                    profileData.phone = newPhone;
                                    profileData.codeSimRequestId = newPhoneResult.requestId;

                                    // Fill form on current page
                                    await this.fillAccOkvipRegisterForm(currentPage, profileData);

                                    // Solve captcha
                                    const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
                                    if (apiKey) {
                                        await this.solveCaptchaOnPage(currentPage, apiKey);
                                    }

                                    // Click "BÆ°á»›c tiáº¿p theo"
                                    await currentPage.evaluate(() => {
                                        const submitBtn = document.querySelector('button[type="submit"]');
                                        if (submitBtn) {
                                            submitBtn.click();
                                            console.log('âœ… "BÆ°á»›c tiáº¿p theo" button clicked');
                                        }
                                    });

                                    await new Promise(r => setTimeout(r, 3000));

                                    // Continue with "Gá»­i Ä‘i" on current page
                                    continue;
                                } else {
                                    console.error('âŒ Failed to get new phone number');
                                    return { success: false, message: 'Failed to get new phone number after retry' };
                                }
                            } else {
                                console.error('âŒ Max retries reached or no CodeSim token');
                                return { success: false, message: `Registration failed after ${retryCount} attempts` };
                            }
                        } else {
                            // No error detected, registration successful
                            console.log(`âœ… AccOKVIP registration form submitted successfully`);

                            // Check if manual mode - if so, wait for user to submit OTP manually
                            if (profileData.simMode === 'manual') {
                                console.log('âœï¸ Manual mode: Waiting for user to submit OTP manually...');
                                console.log('ðŸ“Œ Keeping page open for manual OTP entry');

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
                                        console.log(`âœ… URL changed to: ${currentUrl} - OTP likely submitted successfully`);
                                        otpSubmitted = true;
                                        break;
                                    }

                                    // Check for success message
                                    const successDetected = await currentPage.evaluate(() => {
                                        const successKeywords = ['thÃ nh cÃ´ng', 'success', 'Ä‘Äƒng kÃ½ thÃ nh cÃ´ng', 'registration successful'];
                                        const allText = document.body.innerText.toLowerCase();
                                        return successKeywords.some(keyword => allText.includes(keyword));
                                    });

                                    if (successDetected) {
                                        console.log('âœ… Success message detected - OTP submitted successfully');
                                        otpSubmitted = true;
                                        break;
                                    }

                                    if (waitAttempts % 60 === 0) {
                                        console.log(`â³ Waiting for OTP submission... (${Math.floor(waitAttempts / 60)} minutes)`);
                                    }
                                }

                                if (!otpSubmitted) {
                                    console.warn('âš ï¸ Timeout waiting for OTP submission');
                                    return { success: false, message: 'Timeout waiting for manual OTP submission' };
                                }

                                registrationSuccess = true;
                                break; // Exit the retry loop
                            }

                            // Now get OTP from CodeSim API and fill it (only for API mode)
                            if (profileData.codeSimRequestId && codeSimToken) {
                                console.log('ðŸ“± Getting OTP from CodeSim API...');

                                let otpReceived = false;
                                let otpRetryCount = 0;
                                const maxOtpRetries = 3;

                                while (!otpReceived && otpRetryCount < maxOtpRetries) {
                                    otpRetryCount++;
                                    console.log(`â³ Waiting for OTP (attempt ${otpRetryCount}/${maxOtpRetries})...`);

                                    // Wait up to 120 seconds for OTP
                                    const otpResult = await this.getOtpFromCodeSim(codeSimToken, profileData.codeSimRequestId);

                                    if (otpResult && otpResult.code) {
                                        const otp = otpResult.code;
                                        console.log(`âœ… Got OTP: ${otp}`);
                                        otpReceived = true;

                                        // Fill OTP into input field
                                        await currentPage.evaluate((otpCode) => {
                                            const otpField = document.querySelector('#van-field-9-input');
                                            if (otpField) {
                                                otpField.value = otpCode;
                                                otpField.dispatchEvent(new Event('input', { bubbles: true }));
                                                otpField.dispatchEvent(new Event('change', { bubbles: true }));
                                                console.log(`âœ… OTP filled: ${otpCode}`);
                                            } else {
                                                console.warn('âš ï¸ OTP input field not found');
                                            }
                                        }, otp);

                                        // Wait a bit then click "ÄÄƒng kÃ½" button
                                        await new Promise(r => setTimeout(r, 1000));

                                        // Click "ÄÄƒng kÃ½" button
                                        const registerClicked = await currentPage.evaluate(() => {
                                            // Find button with "ÄÄƒng kÃ½" text
                                            const buttons = document.querySelectorAll('button');
                                            for (const btn of buttons) {
                                                if (btn.textContent.includes('ÄÄƒng kÃ½')) {
                                                    btn.click();
                                                    console.log('âœ… "ÄÄƒng kÃ½" button clicked');
                                                    return true;
                                                }
                                            }
                                            console.warn('âš ï¸ "ÄÄƒng kÃ½" button not found');
                                            return false;
                                        });

                                        if (registerClicked) {
                                            await new Promise(r => setTimeout(r, 3000));
                                        }
                                    } else {
                                        console.warn(`âš ï¸ No OTP received (attempt ${otpRetryCount}/${maxOtpRetries})`);

                                        if (otpRetryCount < maxOtpRetries) {
                                            console.log(`ðŸ”„ Retrying "Gá»­i Ä‘i" button...`);

                                            // Click "Gá»­i Ä‘i" button again
                                            await currentPage.evaluate(() => {
                                                const sendBtn = document.querySelector('.send.sendStyle1');
                                                if (sendBtn) {
                                                    sendBtn.click();
                                                    console.log('âœ… "Gá»­i Ä‘i" button clicked again');
                                                }
                                            });

                                            await new Promise(r => setTimeout(r, 3000));
                                        } else {
                                            console.error('âŒ Max OTP retries reached, need to restart with new phone');

                                            // Get new phone number (thá»­ serviceId 3 vÃ  21)
                                            const newPhoneResult = await this.getPhoneFromCodeSim(codeSimToken);
                                            if (newPhoneResult && newPhoneResult.phoneNumber) {
                                                const newPhone = newPhoneResult.phoneNumber;
                                                console.log(`âœ… Got new phone: ${newPhone}`);

                                                // Open new tab with same user/pass/email but new phone
                                                console.log('ðŸ“‚ Opening new tab with new phone number...');
                                                const newPage = await currentPage.browser().newPage();

                                                // Copy user agent and other settings
                                                await newPage.setUserAgent(await currentPage.browser().userAgent());

                                                // Navigate to register URL
                                                const registerUrl = 'https://m.okvipau.com/register';
                                                await newPage.goto(registerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                                                // Update profileData with new phone
                                                profileData.phone = newPhone;
                                                profileData.codeSimRequestId = newPhoneResult.requestId;

                                                // Fill form on new page
                                                await this.fillAccOkvipRegisterForm(newPage, profileData);

                                                // Solve captcha
                                                const apiKey = this.settings?.captchaApiKey || process.env.CAPTCHA_API_KEY;
                                                if (apiKey) {
                                                    await this.solveCaptchaOnPage(newPage, apiKey);
                                                }

                                                // Click "BÆ°á»›c tiáº¿p theo"
                                                await newPage.evaluate(() => {
                                                    const submitBtn = document.querySelector('button[type="submit"]');
                                                    if (submitBtn) {
                                                        submitBtn.click();
                                                        console.log('âœ… "BÆ°á»›c tiáº¿p theo" button clicked on new tab');
                                                    }
                                                });

                                                await new Promise(r => setTimeout(r, 3000));

                                                // Click "Gá»­i Ä‘i" on new page
                                                await newPage.evaluate(() => {
                                                    const sendBtn = document.querySelector('.send.sendStyle1');
                                                    if (sendBtn) {
                                                        sendBtn.click();
                                                        console.log('âœ… "Gá»­i Ä‘i" button clicked on new tab');
                                                    }
                                                });

                                                // Continue with OTP on new page
                                                currentPage = newPage;
                                                otpRetryCount = 0; // Reset counter for new attempt
                                                continue;
                                            } else {
                                                console.error('âŒ Failed to get new phone number');
                                                return { success: false, message: 'Failed to get OTP and new phone number' };
                                            }
                                        }
                                    }
                                }

                                if (!otpReceived) {
                                    return { success: false, message: 'Failed to receive OTP after all retries' };
                                }
                            } else {
                                console.warn('âš ï¸ No CodeSim request ID or token for OTP retrieval');
                            }

                            console.log(`âœ… AccOKVIP registration completed successfully`);
                            registrationSuccess = true;

                            // Save account info after successful registration (including OTP submission)
                            try {
                                console.log(`ðŸ“ Saving AccOKVIP account info...`);
                                const siteNames = siteConfig && siteConfig.name ? [siteConfig.name] : [];
                                await this.saveAccountInfo(profileData, 'accOkvip', siteConfig?.name || 'AccOKVIP', siteNames);
                                console.log(`âœ… Account info saved successfully`);
                            } catch (err) {
                                console.warn(`âš ï¸ Failed to save account info: ${err.message}`);
                            }

                            return { success: true, message: 'AccOKVIP registration completed' };
                        }
                    } catch (error) {
                        console.warn('âš ï¸ Error during registration:', error.message);
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
            // Skip for AccOKVIP and OKVIP OTP (Ä‘Ã£ xá»­ lÃ½ riÃªng á»Ÿ trÃªn)
            if (category === 'accOkvip' || category === 'okvipOtp') {
                console.log(`â­ï¸ ${category.toUpperCase()}: Waiting for token from form submission...`);

                // Chá» token tá»« form submit (token lÃ  dáº¥u hiá»‡u Ä‘Äƒng kÃ½ thÃ nh cÃ´ng)
                let hasToken = false;
                let waitAttempts = 0;
                const maxWaitAttempts = 30; // 30 * 1s = 30 giÃ¢y

                while (!hasToken && waitAttempts < maxWaitAttempts) {
                    waitAttempts++;
                    await new Promise(r => setTimeout(r, 1000));

                    const tokenInfo = await page.evaluate(() => {
                        // Kiá»ƒm tra token trong localStorage
                        const localStorageToken = localStorage.getItem('token') ||
                            localStorage.getItem('auth_token') ||
                            localStorage.getItem('access_token');

                        // Kiá»ƒm tra token trong sessionStorage
                        const sessionStorageToken = sessionStorage.getItem('token') ||
                            sessionStorage.getItem('auth_token') ||
                            sessionStorage.getItem('access_token');

                        // Kiá»ƒm tra token trong cookies
                        const cookies = document.cookie;
                        const cookieToken = cookies.includes('token') ||
                            cookies.includes('auth') ||
                            cookies.includes('session');

                        // Kiá»ƒm tra URL cÃ³ chá»©a token khÃ´ng
                        const urlToken = window.location.href.includes('token=') ||
                            window.location.href.includes('auth=');

                        return {
                            localStorageToken: !!localStorageToken,
                            sessionStorageToken: !!sessionStorageToken,
                            cookieToken: cookieToken,
                            urlToken: urlToken,
                            hasAnyToken: !!(localStorageToken || sessionStorageToken || cookieToken || urlToken)
                        };
                    });

                    if (tokenInfo.hasAnyToken) {
                        console.log(`âœ… Token found:`, tokenInfo);
                        hasToken = true;
                        break;
                    }

                    if (waitAttempts % 5 === 0) {
                        console.log(`â³ Waiting for token... (${waitAttempts}s)`);
                    }
                }

                if (!hasToken) {
                    console.error(`âŒ No token received after ${maxWaitAttempts}s - registration may have failed`);
                    return { success: false, message: `${category.toUpperCase()}: No token received - registration failed` };
                }

                console.log(`âœ… Token received - registration successful`);
                return { success: true, message: `${category.toUpperCase()} registration completed with token`, page };
            }

            console.log(`â³ Waiting for token/redirect...`);
            let hasToken = false;
            let waitAttempts = 0;

            // Determine max wait time based on category
            const isManualCaptcha = manualCaptchaCategories.includes(category);
            const maxWaitTime = isManualCaptcha ? 120000 : 10000; // 120s for manual, 10s for auto
            const checkInterval = 500; // 500ms per check
            const maxWaitAttempts = Math.ceil(maxWaitTime / checkInterval);

            if (isManualCaptcha) {
                console.log(`ðŸ“ Manual captcha mode: Waiting up to 120s for user to solve captcha...`);
            }

            let initialUrl = await page.evaluate(() => window.location.href);
            console.log(`ðŸ“ Initial URL: ${initialUrl}`);

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
                        console.log(`âœ… Token found after ${waitAttempts * checkInterval}ms`);
                        break;
                    }

                    if (urlChanged) {
                        console.log(`âœ… URL changed (redirect successful): ${status.currentUrl}`);
                        hasToken = true; // Assume success if URL changed
                        break;
                    }

                    if (isManualCaptcha) {
                        console.log(`â³ [${waitAttempts}/${maxWaitAttempts}] Waiting for manual captcha (${Math.round(waitAttempts * checkInterval / 1000)}s)...`);
                    } else {
                        console.log(`â³ [${waitAttempts}/${maxWaitAttempts}] No token/redirect yet, waiting...`);
                    }
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                } catch (e) {
                    console.log(`âš ï¸ Token check failed (attempt ${waitAttempts}):`, e.message);
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
            }

            if (!hasToken) {
                console.error(`âŒ Token not found and no redirect after ${maxWaitAttempts * checkInterval}ms - Register FAILED`);
                return { success: false, error: 'Token not found and no redirect after registration' };
            }

            // Token found - no need to wait for navigation, can proceed immediately
            console.log(`âœ… Token acquired, register successful`);

            // For jun88, 78win, jun88v2: wait delay then redirect to addbank page
            if (isManualCaptcha) {
                // Add random delay 2-5s before redirect to bank (like OKVIP)
                const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-5s
                console.log(`â³ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to addbank...`);
                await new Promise(r => setTimeout(r, delayBeforeBank));

                console.log(`ðŸ”„ Redirecting to addbank page for ${category}...`);
                const domain = this.getDomain(siteConfig.registerUrl);
                const bankPath = this.categoryPaths[category]?.bank || '/Financial?type=withdraw';
                const bankUrl = domain + bankPath;
                console.log(`ðŸ“ Navigating to: ${bankUrl}`);
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
                        message: `âœ… ÄÄƒng kÃ½ thÃ nh cÃ´ng - Chuyá»ƒn sang thÃªm bank...`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('âš ï¸ Failed to send register status:', err.message);
            }

            return { success: true, message: 'Register completed successfully', page };
        } catch (error) {
            console.error(`âŒ Register Error:`, error.message);

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
                        message: `âŒ ÄÄƒng kÃ½ tháº¥t báº¡i: ${error.message}`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('âš ï¸ Failed to send error status:', err.message);
            }

            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * BÆ°á»›c 2: Add Bank (riÃªng cho tá»«ng category)
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
     * OKVIP Add Bank: redirect â†’ submit máº­t kháº©u rÃºt â†’ redirect â†’ submit bank
     */
    async addBankOKVIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (OKVIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths.okvip;

            // BÆ°á»›c 1: VÃ o trang submit máº­t kháº©u rÃºt
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  â†’ Withdraw Password: ${withdrawPasswordUrl}`);

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000); // 2-10s
            console.log(`â³ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[formcontrolname="newPassword"]', { timeout: 5000 });
                console.log('âœ… Withdraw password form loaded');
            } catch (e) {
                console.warn('âš ï¸ Withdraw password form not found, continuing anyway...');
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
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("ThÃªm")', { timeout: 10000 }).catch(() => {
                    console.log('âš ï¸ Bank page selector not found, continuing anyway...');
                });
            } catch (e) {
                console.log('âš ï¸ Timeout waiting for bank page');
            }
            await new Promise(r => setTimeout(r, 1000));

            // BÆ°á»›c 2: VÃ o trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  â†’ Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-10s
            console.log(`â³ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('mat-select[formcontrolname="bankName"], input[formcontrolname="account"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form (formcontrolname + mat-select)
            await page.evaluate((data) => {
                // Click mat-select Ä‘á»ƒ má»Ÿ dropdown
                const bankSelect = document.querySelector('mat-select[formcontrolname="bankName"]');
                if (bankSelect) {
                    bankSelect.click();
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Select bank option (with mapping)
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`ðŸ¦ Looking for bank: ${profileData.bankName} â†’ ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const options = document.querySelectorAll('mat-option');
                let found = false;

                // Helper: normalize bank name for matching
                const normalizeBankName = (name) => {
                    return name.toUpperCase().replace(/\s+/g, "").replace(/\(.*?\)/g, "").replace(/VIETCAP/g, "VIETCAPITAL")
                        .trim();
                };

                const normalizedSearchName = normalizeBankName(bankName);
                console.log(`🔍 Normalized search name: ${normalizedSearchName}`);

                // Try exact match first
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    const normalizedOptionText = normalizeBankName(optionText);

                    console.log(`  Checking option: "${optionText}" → "${normalizedOptionText}"`);

                    if (normalizedOptionText === normalizedSearchName) {
                        console.log(`✅ Found exact match: ${optionText}`);
                        option.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const option of options) {
                        const optionText = option.textContent?.trim();
                        const normalizedOptionText = normalizeBankName(optionText);

                        if (normalizedOptionText.includes(normalizedSearchName)) {
                            console.log(`✅ Found partial match: ${optionText}`);
                            option.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && options.length > 0) {
                    console.warn(`âš ï¸ Bank not found, selecting first option`);
                    options[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Add random province before filling city field
            const city = profileData.bankBranch || this.getRandomProvince();

            // Fill city and account
            await page.evaluate((data, cityValue) => {
                const cityField = document.querySelector('input[formcontrolname="city"]');
                const accountField = document.querySelector('input[formcontrolname="account"]');

                if (cityField) {
                    cityField.value = cityValue;
                    cityField.dispatchEvent(new Event('input', { bubbles: true }));
                    cityField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (accountField) {
                    accountField.value = data.accountNumber;
                    accountField.dispatchEvent(new Event('input', { bubbles: true }));
                    accountField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData, city);

            // Submit form
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            });

            // Wait for navigation after bank submission
            console.log(`â³ Waiting for navigation after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForNavigation({ timeout: 15000 });
                pageReloaded = true;
                console.log('âœ… Page reloaded after bank submission');
            } catch (e) {
                console.log('âš ï¸ No navigation after add bank');
            }

            // Check if bank was added successfully by verifying displayed values
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((reloaded) => {
                const successKeywords = ['thÃ nh cÃ´ng', 'success', 'added', 'completed'];
                const pageText = document.body.innerText.toLowerCase();

                if (reloaded) {
                    return { success: true, message: 'Page reloaded - bank added successfully' };
                }

                if (successKeywords.some(keyword => pageText.includes(keyword))) {
                    return { success: true, message: 'Success keywords found on page' };
                }

                return { success: false, message: 'Could not verify bank addition' };
            }, pageReloaded);

            console.log(`âœ… Bank result:`, result);

            // Send status update to dashboard
            try {
                const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
                const statusMsg = result.success ? 'âœ… ThÃªm bank thÃ nh cÃ´ng' : `âŒ ThÃªm bank tháº¥t báº¡i: ${result.message}`;
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
                console.warn('âš ï¸ Failed to send addbank status:', err.message);
            }

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`âŒ OKVIP Add Bank Error:`, error.message);

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
                        message: `âŒ ThÃªm bank tháº¥t báº¡i: ${error.message}`,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('âš ï¸ Failed to send error status:', err.message);
            }

            return { success: false, error: error.message };
        }
        // Note: Keep page open for inspection/debugging
    }

    /**
     * OKVIP OTP Add Bank: redirect â†’ submit máº­t kháº©u rÃºt â†’ redirect â†’ submit bank
     * Giá»‘ng 22VIP
     */
    async addBankOKVIPOtp(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (OKVIP OTP)...`);

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
                        console.warn('âš ï¸ Page connection lost, stopping execution');
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
                        console.warn('âš ï¸ Page connection lost, stopping execution');
                        throw new Error('Page connection lost');
                    }
                    throw err;
                }
            };

            // BÆ°á»›c 1: VÃ o trang chÃ­nh rá»“i click nÃºt "RÃºt tiá»n" Ä‘á»ƒ vÃ o trang submit máº­t kháº©u rÃºt
            const homeUrl = domain + '/home';
            console.log(`  â†’ Home: ${homeUrl}`);

            // Add random delay 1-2s before redirect (reduced from 2-5s)
            const delayBeforeHome = this.getRandomDelay(1000, 2000);
            console.log(`â³ Waiting ${Math.round(delayBeforeHome / 1000)}s before redirect to home...`);
            await new Promise(r => setTimeout(r, delayBeforeHome));

            await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            await new Promise(r => setTimeout(r, 1000));

            // Step 1: Click tab "TÃ i Khoáº£n"
            console.log('ðŸ” Clicking  "TÃ i Khoáº£n" tab...');
            await page.evaluate(() => {
                const accountTab = Array.from(document.querySelectorAll('div[role="tab"]')).find(el =>
                    el.textContent.includes('TÃ i Khoáº£n')
                );

                if (accountTab) {
                    accountTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        accountTab.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        accountTab.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    accountTab.click();
                    console.log('âœ… Clicked "TÃ i Khoáº£n" tab');
                } else {
                    console.warn('âš ï¸ "TÃ i Khoáº£n" tab not found');
                }
            });

            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Click nÃºt "RÃºt tiá»n" Ä‘á»ƒ vÃ o trang withdraw password
            console.log('ðŸ’° Clicking "RÃºt tiá»n" button...');
            await page.evaluate(() => {
                // Try multiple selectors for withdraw button
                let withdrawBtn = Array.from(document.querySelectorAll('div._navItem_sh3m6_51, button, div[role="button"], a')).find(el =>
                    el.textContent.includes('RÃºt tiá»n') || el.textContent.includes('RÃºt Tiá»n') || el.textContent.includes('Withdraw')
                );

                if (withdrawBtn) {
                    withdrawBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        withdrawBtn.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        withdrawBtn.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    withdrawBtn.click();
                    console.log('âœ… Clicked "RÃºt tiá»n" button');
                } else {
                    console.warn('âš ï¸ "RÃºt tiá»n" button not found');
                }
            });

            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('ul.ui-password-input__security, input[data-input-name="password"]', { timeout: 5000 });
                console.log('âœ… Withdraw password form loaded');
            } catch (e) {
                console.warn('âš ï¸ Withdraw password form not found, continuing anyway...');
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
                            console.warn('âš ï¸ Page is closed, stopping keyboard input');
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
                        console.warn(`âš ï¸ Failed to click digit ${digit}:`, e.message);
                        throw e;
                    }

                    await new Promise(r => setTimeout(r, 100 + Math.random() * 100));
                }
            };

            // Click first password
            console.log('ðŸ” Entering first password...');
            await clickDigitsOnKeyboard(password);

            console.log('â³ Waiting for keyboard to reset...');
            await new Promise(r => setTimeout(r, 500));

            // Click confirm password
            console.log('ðŸ” Entering confirm password...');
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
                    console.log('âœ… Triggered blur/change events on password input');
                }
            });

            await new Promise(r => setTimeout(r, 1000));

            // Now click submit button
            const submitResult = await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                if (submitBtn) {
                    console.log(`ðŸ“ Submit button text: "${submitBtn.textContent.trim()}"`);
                    console.log(`ðŸ“ Submit button visible: ${submitBtn.offsetParent !== null}`);

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
                    console.log('âœ… Submit button clicked');
                    return true;
                }
                return false;
            });

            if (!submitResult) {
                console.warn('âš ï¸ Submit button not found');
            }

            console.log('â³ Waiting for withdraw password to be processed...');
            await new Promise(r => setTimeout(r, 5000));

            console.log('âœ… Withdraw password submitted');

            await new Promise(r => setTimeout(r, 1000));

            // BÆ°á»›c 2: Trang sáº½ tá»± chuyá»ƒn tá»›i trang bank, chá»‰ cáº§n chá» vÃ  click "ThÃªm tÃ i khoáº£n Ä‘á»ƒ rÃºt tiá»n"
            console.log('â³ Waiting for page to redirect to bank page...');
            await new Promise(r => setTimeout(r, 3000));

            // Step 2: Click input "ThÃªm tÃ i khoáº£n Ä‘á»ƒ rÃºt tiá»n"
            console.log('ðŸ¦ Clicking input "ThÃªm tÃ i khoáº£n Ä‘á»ƒ rÃºt tiá»n"...');
            await page.evaluate(() => {
                const input = document.querySelector('input[placeholder="ThÃªm tÃ i khoáº£n Ä‘á»ƒ rÃºt tiá»n"]');
                if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    input.focus();
                    input.click();
                    console.log('âœ… Clicked input');
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click "TÃ i khoáº£n ngÃ¢n hÃ ng" option (id="addAccountClick")
            console.log('ðŸ¦ Clicking "TÃ i khoáº£n ngÃ¢n hÃ ng" option...');
            await page.evaluate(() => {
                const bankOption = document.getElementById('addAccountClick');
                if (bankOption) {
                    bankOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    try {
                        bankOption.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
                        bankOption.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
                    } catch (e) { }
                    bankOption.click();
                    console.log('âœ… Clicked "TÃ i khoáº£n ngÃ¢n hÃ ng"');
                }
            });

            await new Promise(r => setTimeout(r, 3000));

            // Step 4: Re-enter withdraw password
            console.log('ðŸ” Re-entering withdraw password for bank confirmation...');

            let passwordEntered = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    console.log(`  Attempt ${attempt + 1}/3 to find password input...`);
                    await page.waitForSelector('ul.ui-password-input__security', { timeout: 10000 });
                    console.log('âœ… Password input appeared');

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
                        console.log('âœ… Password digits entered');
                    } catch (digitError) {
                        console.warn('âš ï¸ Error entering password digits:', digitError.message);
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
                            console.log('âœ… Triggered blur/change events on password input');
                        }
                    });

                    await new Promise(r => setTimeout(r, 1000));

                    const submitResult = await page.evaluate(() => {
                        const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            console.log(`ðŸ“ Submit button text: "${submitBtn.textContent.trim()}"`);

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
                            console.log('âœ… Submit button clicked');
                            return true;
                        }
                        return false;
                    });

                    if (!submitResult) {
                        console.warn('âš ï¸ Submit button not found');
                        throw new Error('Submit button not found');
                    }

                    passwordEntered = true;
                    console.log('âœ… Password re-entry completed');
                    break;
                } catch (e) {
                    console.warn(`  âš ï¸ Attempt ${attempt + 1} failed:`, e.message);
                    if (attempt < 2) {
                        console.log(`  Retrying in 2s...`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            if (!passwordEntered) {
                console.warn('âš ï¸ Password re-entry failed after 3 attempts, continuing anyway...');
            }

            // Click "Tiáº¿p Theo" button to proceed to bank form
            if (passwordEntered) {
                console.log('ðŸ”˜ Clicking "Tiáº¿p Theo" button in password modal...');
                try {
                    const clickResult = await page.evaluate(() => {
                        const nextBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent.includes('Tiáº¿p Theo')
                        );
                        if (nextBtn) {
                            const rect = nextBtn.getBoundingClientRect();
                            console.log(`ðŸ“ Found "Tiáº¿p Theo" button at: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(rect.width)}, height=${Math.round(rect.height)}`);
                            console.log(`ðŸ“ Button text: "${nextBtn.textContent.trim()}"`);
                            console.log(`ðŸ“ Button class: "${nextBtn.className}"`);
                            console.log(`ðŸ“ Button parent: "${nextBtn.parentElement?.className}"`);

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
                            return { success: true, message: 'Tiáº¿p Theo button clicked' };
                        }
                        return { success: false, message: 'Tiáº¿p Theo button not found' };
                    });
                    console.log(`ðŸ”˜ Click result: ${JSON.stringify(clickResult)}`);

                    // Wait for modal to close and form to be submitted
                    console.log('â³ Waiting for password modal to close and form to be submitted...');
                    await new Promise(r => setTimeout(r, 5000));
                } catch (e) {
                    console.warn('âš ï¸ Failed to click Tiáº¿p Theo button:', e.message);
                }
            }

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('input[placeholder="Vui lÃ²ng nháº­p sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
                // Log current URL to see if we're on the right page
                const currentUrl = page.url();
                console.log(`ðŸ“ Current URL: ${currentUrl}`);

                // Log page content for debugging
                const pageContent = await page.evaluate(() => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        bodyText: document.body.innerText.substring(0, 500)
                    };
                });
                console.log(`ðŸ“„ Page info:`, pageContent);
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form - account number
            await page.evaluate((data) => {
                const accountInput = document.querySelector('input[placeholder="Vui lÃ²ng nháº­p sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng"]');

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

                    console.log(`âœ… Filled account number: ${data.accountNumber}`);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Find and click bank dropdown
            console.log('ðŸ¦ Selecting bank...');
            await page.evaluate((data) => {
                const bankDropdown = document.querySelector('input[type="search"][placeholder="Chá»n ngÃ¢n hÃ ng phÃ¡t hÃ nh"]');

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
                                    console.log(`âœ… Selected bank: ${bankOption.textContent.trim()}`);
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
                    document.querySelector('input[placeholder*="chá»§ tÃ i khoáº£n"]');

                if (nameField) {
                    nameField.value = data.fullname.toUpperCase();
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                    nameField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form - click "XÃ¡c Nháº­n" button
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                let submitBtn = document.getElementById('bindWithdrawAccountNextClick');

                if (!submitBtn) {
                    submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.textContent.includes('XÃ¡c Nháº­n')
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

            console.log(`â³ Waiting for page to load after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("ThÃªm"), ._navItem_1odty_45', { timeout: 10000 }).catch(() => {
                    console.log('âš ï¸ Page selector not found after bank submission');
                });
                pageReloaded = true;
                console.log('âœ… Page loaded after bank submission');
            } catch (e) {
                console.log('âš ï¸ Timeout waiting for page after bank submission');
            }
            await new Promise(r => setTimeout(r, 1500));

            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                const successKeywords = ['thÃ nh cÃ´ng', 'success', 'added', 'completed'];
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

            console.log(`âœ… OKVIP OTP Add Bank Result:`, result);
            return result;
        } catch (error) {
            console.error(`âŒ OKVIP OTP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * ABCVIP Add Bank (placeholder)
     */
    async addBankABCVIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (ABCVIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths.abcvip;

            // BÆ°á»›c 1: VÃ o trang submit máº­t kháº©u rÃºt
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  â†’ Withdraw Password: ${withdrawPasswordUrl}`);

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000); // 2-10s
            console.log(`â³ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[formcontrolname="newPassword"]', { timeout: 5000 });
                console.log('âœ… Withdraw password form loaded');
            } catch (e) {
                console.warn('âš ï¸ Withdraw password form not found, continuing anyway...');
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
                console.log('âš ï¸ No navigation after withdraw password');
            });

            // BÆ°á»›c 2: VÃ o trang submit bank (ABCVIP)
            const bankUrl = domain + paths.bank;
            console.log(`  â†’ Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 5000); // 2-10s
            console.log(`â³ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('mat-select[formcontrolname="bankName"], input[formcontrolname="account"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form (formcontrolname + mat-select)
            await page.evaluate((data) => {
                // Click mat-select Ä‘á»ƒ má»Ÿ dropdown
                const bankSelect = document.querySelector('mat-select[formcontrolname="bankName"]');
                if (bankSelect) {
                    bankSelect.click();
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Select bank option (with mapping)
            const mappedBankName = this.mapBankName(profileData.bankName);
            console.log(`ðŸ¦ Looking for bank: ${profileData.bankName} â†’ ${mappedBankName}`);

            await page.evaluate((bankName) => {
                const options = document.querySelectorAll('mat-option');
                let found = false;

                // Helper: normalize bank name for matching
                const normalizeBankName = (name) => {
                    return name.toUpperCase().replace(/\s+/g, "").replace(/\(.*?\)/g, "").replace(/VIETCAP/g, "VIETCAPITAL")
                        .trim();
                };

                const normalizedSearchName = normalizeBankName(bankName);
                console.log(`🔍 Normalized search name: ${normalizedSearchName}`);

                // Try exact match first
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    const normalizedOptionText = normalizeBankName(optionText);

                    console.log(`  Checking option: "${optionText}" → "${normalizedOptionText}"`);

                    if (normalizedOptionText === normalizedSearchName) {
                        console.log(`✅ Found exact match: ${optionText}`);
                        option.click();
                        found = true;
                        break;
                    }
                }

                // Try partial match if exact not found
                if (!found) {
                    for (const option of options) {
                        const optionText = option.textContent?.trim();
                        const normalizedOptionText = normalizeBankName(optionText);

                        if (normalizedOptionText.includes(normalizedSearchName)) {
                            console.log(`✅ Found partial match: ${optionText}`);
                            option.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && options.length > 0) {
                    console.warn(`âš ï¸ Bank not found, selecting first option`);
                    options[0].click();
                }
            }, mappedBankName);

            await new Promise(r => setTimeout(r, 1500));

            // Add random province before filling city field
            const city = profileData.bankBranch || this.getRandomProvince();

            // Fill city and account
            await page.evaluate((data, cityValue) => {
                const cityField = document.querySelector('input[formcontrolname="city"]');
                const accountField = document.querySelector('input[formcontrolname="account"]');

                if (cityField) {
                    cityField.value = cityValue;
                    cityField.dispatchEvent(new Event('input', { bubbles: true }));
                    cityField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (accountField) {
                    accountField.value = data.accountNumber;
                    accountField.dispatchEvent(new Event('input', { bubbles: true }));
                    accountField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData, city);

            // Submit form
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            });

            // Wait for navigation after bank submission
            console.log(`â³ Waiting for navigation after bank submission...`);
            let pageReloaded = false;
            try {
                await page.waitForNavigation({ timeout: 15000 });
                pageReloaded = true;
                console.log('âœ… Page reloaded after bank submission');
            } catch (e) {
                console.log('âš ï¸ No navigation after add bank');
            }

            // Check if bank was added successfully by verifying displayed values
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((reloaded) => {
                const successKeywords = ['thÃ nh cÃ´ng', 'success', 'added', 'completed'];
                const pageText = document.body.innerText.toLowerCase();

                if (reloaded) {
                    return { success: true, message: 'Page reloaded - bank added successfully' };
                }

                if (successKeywords.some(keyword => pageText.includes(keyword))) {
                    return { success: true, message: 'Success keywords found on page' };
                }

                return { success: false, message: 'Could not verify bank addition' };
            }, pageReloaded);

            console.log(`âœ… Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`âŒ ABCVIP Add Bank Error:`, error.message);

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
            console.log('ðŸ¤– 78WIN Form - Anti-bot mode enabled');
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

            console.log(`ðŸ” DEBUG: profileData.email = "${profileData.email}"`);
            console.log(`ðŸ” DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

            await filler.fillMultipleFields(page, fields, {
                charDelay: 150,
                beforeFocus: 300,
                afterField: 800
            });

            // Handle agree checkbox - skip if already checked
            console.log('âœ… Checking agree checkbox...');
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
                    console.log('âœ… Agree checkbox already checked');
                }
            } catch (error) {
                console.warn('âš ï¸ Could not interact with agree checkbox:', error.message);
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

            console.log('âœ… 78WIN form filled successfully');
        } catch (error) {
            console.error('âŒ Error filling 78WIN form:', error.message);
            throw error;
        }
    }

    /**
     * JUN88V2 Register Form (Form 3 - fullname, username, password, phone - JOJODIOS)
     * Anti-bot measures: slow typing, delays between fields, human-like interactions
     */
    async fillJUN88V2RegisterForm(page, profileData) {
        try {
            console.log('ðŸ¤– JUN88V2 Form - Anti-bot mode enabled');
            const filler = new CommonFormFiller();

            // Wait for form to be interactive
            await filler.waitForForm(page, 'input[id="fullname"]', 10000);

            // For JUN88V2: Wait for Turnstile to auto-verify (it usually verifies within 1-3 seconds)
            console.log('â³ Waiting for Turnstile to auto-verify...');
            let turnstileVerified = false;
            for (let i = 0; i < 10; i++) {
                const verified = await page.evaluate(() => {
                    const field = document.querySelector('input[name="cf-turnstile-response"]');
                    return field && field.value && field.value.length > 0;
                });

                if (verified) {
                    console.log('âœ… Turnstile auto-verified');
                    turnstileVerified = true;
                    break;
                }

                await new Promise(r => setTimeout(r, 500));
            }

            if (!turnstileVerified) {
                console.warn('âš ï¸ Turnstile not auto-verified, proceeding anyway...');
            }

            // Wait a bit more for page to settle
            await new Promise(r => setTimeout(r, 1000));

            // Simulate human-like interactions
            await filler.simulateHumanInteraction(page);

            // Skip clicking, go directly to filling form
            console.log('ðŸ“ Preparing to fill form fields...');

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
                { selector: 'input[id="email"]', value: profileData.email || '', label: 'email' },
                { selector: 'input[pattern="[0-9]*"]', value: phone, label: 'mobile' }
            ];

            console.log(`ðŸ” DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

            try {
                console.log('ðŸ“ Starting to fill form fields...');
                await filler.fillMultipleFields(page, fields, {
                    charDelay: 150,
                    beforeFocus: 500,
                    afterField: 1200
                });
                console.log('âœ… Form fields filled');
            } catch (e) {
                console.error('âŒ Error filling form fields:', e.message);
                throw e;
            }

            // Trigger change events for all fields (React compatibility)
            await page.evaluate(() => {
                const fields = [
                    'input[id="fullname"]',
                    'input[id="username"]',
                    'input[id="password"]',
                    'input[id="email"]',
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

            console.log('âœ… JUN88V2 form filled successfully');
        } catch (error) {
            console.error('âŒ Error filling JUN88V2 form:', error.message);
            throw error;
        }
    }

    /**
     * 22VIP/888P Register Form
     * Selectors: data-input-name attributes (supports both TV88 and 888P)
     */
    async fill22VIPRegisterForm(page, profileData) {
        try {
            console.log('ðŸ¤– 22VIP/888P Form - Filling...');

            // Check if form is already visible (don't wait if it is)
            const formExists = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[data-input-name="account"]');
                return inputs.length > 0;
            });

            if (!formExists) {
                // Wait for form to load (reduced timeout to 10s)
                try {
                    await page.waitForSelector('input[data-input-name="account"]', { timeout: 10000 });
                    console.log('âœ… 22VIP/888P form loaded');
                } catch (e) {
                    console.warn('âš ï¸ Form selector timeout, trying to fill anyway...');
                }
            } else {
                console.log('âœ… 22VIP/888P form already visible');
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

            console.log(`âœ… Filled account: ${profileData.username}`);
            console.log(`âœ… Filled password`);
            console.log(`âœ… Filled confirm password`);
            const fullname = (profileData.fullname || profileData.username).toUpperCase();
            console.log(`âœ… Filled full name: ${fullname}`);

            // Trigger change events
            await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[data-input-name]');
                inputs.forEach(input => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                });
            });

            console.log('âœ… 22VIP/888P form filled successfully');
        } catch (error) {
            console.error('âŒ Error filling 22VIP/888P form:', error.message);
            throw error;
        }
    }

    /**
     * JUN88 Add Bank: Click bank field â†’ select bank â†’ fill account & password â†’ submit
     */
    async addBankJUN88(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (JUN88)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "ThÃªm ngÃ¢n hÃ ng +" button to show form
            console.log(`ðŸ” Looking for "ThÃªm ngÃ¢n hÃ ng +" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                // Try multiple selectors for the add bank button
                const selectors = [
                    'button.nrc-button',
                    'button[title=""]',
                    'button:contains("ThÃªm ngÃ¢n hÃ ng")',
                    'button'
                ];

                let addBankBtn = null;

                // Try exact text match first
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    if (btn.textContent.includes('ThÃªm ngÃ¢n hÃ ng')) {
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
                console.warn('âš ï¸ "ThÃªm ngÃ¢n hÃ ng +" button not found, trying alternative...');
            } else {
                console.log('âœ… Clicked "ThÃªm ngÃ¢n hÃ ng +" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Wait for bank form to load
            try {
                await page.waitForSelector('input[id="bankid"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click bank field to open dropdown
            console.log(`ðŸ¦ Opening bank dropdown...`);
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
            console.log(`ðŸ“ Filling account and password...`);

            // Field 1: Account number
            try {
                console.log(`ðŸ’³ Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="bankaccount"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="bankaccount"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`âœ… Account number filled`);
            } catch (error) {
                console.warn(`âš ï¸ Error filling account number:`, error.message);
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
                console.log(`ðŸ” Filling password...`);
                await page.focus('input[id="password"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="password"]', profileData.password, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`âœ… Password filled`);
            } catch (error) {
                console.warn(`âš ï¸ Error filling password:`, error.message);
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
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
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
                console.warn('âš ï¸ Submit button not found');
            } else {
                console.log('âœ… Submit button clicked');
            }

            // Wait for response
            console.log(`â³ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Báº¯t buá»™c')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`âœ… Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`âŒ JUN88 Add Bank Error:`, error.message);

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
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (78WIN)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "ThÃªm ngÃ¢n hÃ ng +" button to show form
            console.log(`ðŸ” Looking for "ThÃªm ngÃ¢n hÃ ng +" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                let addBankBtn = null;

                // Find button with text "ThÃªm ngÃ¢n hÃ ng"
                for (const btn of buttons) {
                    if (btn.textContent.includes('ThÃªm ngÃ¢n hÃ ng')) {
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
                console.warn('âš ï¸ "ThÃªm ngÃ¢n hÃ ng +" button not found');
            } else {
                console.log('âœ… Clicked "ThÃªm ngÃ¢n hÃ ng +" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Wait for bank form to load
            try {
                await page.waitForSelector('input[id="bankid"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Step 3: Click bank field to open dropdown
            console.log(`ðŸ¦ Opening bank dropdown...`);
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
            console.log(`ðŸ“ Filling account and password...`);

            // Field 1: Account number
            try {
                console.log(`ðŸ’³ Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="bankaccount"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="bankaccount"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`âœ… Account number filled`);
            } catch (error) {
                console.warn(`âš ï¸ Error filling account number:`, error.message);
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
                console.log(`ðŸ” Filling password...`);
                await page.focus('input[id="password"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="password"]', profileData.password, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`âœ… Password filled`);
            } catch (error) {
                console.warn(`âš ï¸ Error filling password:`, error.message);
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
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
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
                console.warn('âš ï¸ Submit button not found');
            } else {
                console.log('âœ… Submit button clicked');
            }

            // Wait for response
            console.log(`â³ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Báº¯t buá»™c')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`âœ… Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`âŒ 78WIN Add Bank Error:`, error.message);

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
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (JUN88V2)...`);

            // Add random delay before starting
            const delayBeforeAddBank = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeAddBank / 1000)}s before add bank...`);
            await new Promise(r => setTimeout(r, delayBeforeAddBank));

            // Step 1: Click "ThÃªm tÃ i khoáº£n ngÃ¢n hÃ ng" button to show form
            console.log(`ðŸ” Looking for "ThÃªm tÃ i khoáº£n ngÃ¢n hÃ ng" button...`);
            const addBankButtonClicked = await page.evaluate(() => {
                // Try specific selector first
                let addBankBtn = document.querySelector('button.standard-add-form-button');

                // Fallback: search by text
                if (!addBankBtn) {
                    const buttons = document.querySelectorAll('button');
                    for (const btn of buttons) {
                        if (btn.textContent.includes('ThÃªm') && btn.textContent.includes('ngÃ¢n hÃ ng')) {
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
                console.warn('âš ï¸ "ThÃªm tÃ i khoáº£n ngÃ¢n hÃ ng" button not found');
            } else {
                console.log('âœ… Clicked "ThÃªm tÃ i khoáº£n ngÃ¢n hÃ ng" button');
            }

            // Wait for form to appear
            await new Promise(r => setTimeout(r, 1500));

            // Step 2: Wait for dropdown to be ready
            try {
                await page.waitForSelector('div.standard-select', { timeout: 5000 });
                console.log('âœ… Bank dropdown field ready');
            } catch (e) {
                console.warn('âš ï¸ Bank dropdown field not found');
            }

            // Step 3: Click bank field to open dropdown
            console.log(`ðŸ¦ Opening bank dropdown...`);
            const dropdownOpened = await page.evaluate(() => {
                // JUN88V2: Find the modal first, then click the div.standard-select inside it
                const modal = document.querySelector('div.standard-popup-modal-body');
                console.log(`ðŸ” Modal found:`, modal ? 'YES' : 'NO');

                if (!modal) {
                    console.warn('âš ï¸ Modal not found');
                    return false;
                }

                const bankSelect = modal.querySelector('div.standard-select');

                console.log(`ðŸ” Bank select found:`, bankSelect ? 'YES' : 'NO');

                if (bankSelect) {
                    console.log(`ï¿½  Bank select text:`, bankSelect.textContent.substring(0, 50));
                    console.log(`ðŸ“ Bank select position:`, {
                        top: bankSelect.offsetTop,
                        left: bankSelect.offsetLeft,
                        width: bankSelect.offsetWidth,
                        height: bankSelect.offsetHeight
                    });
                    console.log(`ðŸ“ Bank select visible:`, bankSelect.offsetParent !== null);
                    console.log(`ðŸ“ Bank select display:`, window.getComputedStyle(bankSelect).display);

                    bankSelect.click();
                    console.log(`âœ… Clicked bank select`);

                    // Check if dropdown appeared
                    setTimeout(() => {
                        const dropdown = document.querySelector('ul.dropdown-list-ul');
                        console.log(`ðŸ” Dropdown appeared after click:`, dropdown ? 'YES' : 'NO');
                    }, 500);

                    return true;
                }
                return false;
            });

            if (!dropdownOpened) {
                console.warn('âš ï¸ Could not click bank dropdown');
            }

            await new Promise(r => setTimeout(r, 2000));

            // Step 4: Select bank from dropdown
            const mappedBankName = this.mapBankName(profileData.bankName, 'jun88v2');
            console.log(`ðŸ¦ Looking for bank: ${profileData.bankName} â†’ ${mappedBankName}`);

            const bankSelected = await page.evaluate((bankName) => {
                // JUN88V2 uses li items in dropdown-list-ul
                const bankItems = document.querySelectorAll('ul.dropdown-list-ul li');
                console.log(`ðŸ“‹ Found ${bankItems.length} bank items in dropdown`);

                // Debug: log all available banks
                if (bankItems.length === 0) {
                    console.warn(`âš ï¸ No bank items found with selector 'ul.dropdown-list-ul li'`);
                    return false;
                }

                // Log all available banks for debugging
                console.log(`ðŸ“‹ Available banks:`);
                bankItems.forEach((item, idx) => {
                    console.log(`  [${idx}] ${item.textContent.trim()}`);
                });

                let found = false;

                // Try exact match first (full text match)
                for (const item of bankItems) {
                    const itemText = item.textContent.trim();
                    if (itemText === bankName) {
                        console.log(`âœ… Exact match found: ${itemText}`);
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
                            console.log(`âœ… Code match found: ${itemText}`);
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
                            console.log(`âœ… Partial match found: ${itemText}`);
                            item.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && bankItems.length > 0) {
                    console.warn(`âš ï¸ Bank not found, selecting first option`);
                    bankItems[0].click();
                    return true;
                }

                return found;
            }, mappedBankName);

            if (!bankSelected) {
                console.warn('âš ï¸ Bank selection may have failed');
            }

            await new Promise(r => setTimeout(r, 2000));

            // Step 5: Fill account number - use slow typing
            console.log(`ðŸ“ Filling account number...`);

            // Field 1: Account number
            try {
                console.log(`ðŸ’³ Filling account number: ${profileData.accountNumber}`);
                await page.focus('input[id="accountNumber"]');
                await new Promise(r => setTimeout(r, 300));
                await page.type('input[id="accountNumber"]', profileData.accountNumber, { delay: 100 });
                await new Promise(r => setTimeout(r, 800));
                console.log(`âœ… Account number filled`);
            } catch (error) {
                console.warn(`âš ï¸ Error filling account number:`, error.message);
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
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);

            // Add delay before submit
            const delayBeforeSubmit = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit...`);
            await new Promise(r => setTimeout(r, delayBeforeSubmit));

            const submitSuccess = await page.evaluate(() => {
                // JUN88V2: Click button#add-bank-btn (id="add-bank-btn", class="standard-submit-form-button")
                let submitBtn = document.querySelector('button#add-bank-btn');

                if (!submitBtn) {
                    console.warn('âš ï¸ button#add-bank-btn not found, trying alternative selectors...');
                    // Fallback: find by class
                    submitBtn = document.querySelector('button.standard-submit-form-button');
                }

                if (!submitBtn) {
                    console.warn('âš ï¸ button.standard-submit-form-button not found');
                    return false;
                }

                console.log(`âœ… Found submit button: ${submitBtn.id || submitBtn.className}`);

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
                console.warn('âš ï¸ Submit button not found');
            } else {
                console.log('âœ… Submit button clicked');
            }

            // Wait for response
            console.log(`â³ Waiting for bank submission response...`);
            await new Promise(r => setTimeout(r, 3000));

            // Check if successful
            const result = await page.evaluate(() => {
                // Check for success message or error
                const errorMsg = document.querySelector('.error-msg');
                const successMsg = document.querySelector('.success-msg');

                if (errorMsg && errorMsg.textContent.includes('Báº¯t buá»™c')) {
                    return { success: false, message: 'Form validation error' };
                }

                if (successMsg) {
                    return { success: true, message: 'Bank added successfully' };
                }

                // If no error visible, assume success
                return { success: true, message: 'Bank submission completed' };
            });

            console.log(`âœ… Bank result:`, result);

            // Mark tab as completed in rotator
            if (result.success) {
                tabRotator.complete(page);
            }

            return result;
        } catch (error) {
            console.error(`âŒ JUN88V2 Add Bank Error:`, error.message);

            // Mark tab as completed even on error
            tabRotator.complete(page);

            return { success: false, error: error.message };
        }
    }

    /**
     * 22VIP Add Bank: redirect â†’ submit máº­t kháº©u rÃºt â†’ redirect â†’ submit bank
     * Giá»‘ng OKVIP
     */
    async addBank22VIP(browser, siteConfig, profileData, existingPage = null) {
        const page = existingPage || await browser.newPage();
        try {
            console.log(`ðŸ¦ Add Bank step for ${siteConfig.name} (22VIP)...`);

            const domain = this.getDomain(siteConfig.registerUrl);
            if (!domain) throw new Error('Invalid domain');

            const paths = this.categoryPaths['22vip'];

            // BÆ°á»›c 1: VÃ o trang submit máº­t kháº©u rÃºt
            const withdrawPasswordUrl = domain + paths.withdrawPassword;
            console.log(`  â†’ Withdraw Password: ${withdrawPasswordUrl}`);

            // Add random delay 2-10s before redirect
            const delayBeforeWithdraw = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeWithdraw / 1000)}s before redirect to withdraw password...`);
            await new Promise(r => setTimeout(r, delayBeforeWithdraw));

            await page.goto(withdrawPasswordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for form fields to appear
            try {
                await page.waitForSelector('ul.ui-password-input__security, input[data-input-name="password"]', { timeout: 5000 });
                console.log('âœ… Withdraw password form loaded');
            } catch (e) {
                console.warn('âš ï¸ Withdraw password form not found, continuing anyway...');
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
                console.log(`ðŸ” Setting password directly (${pwd.length} characters)...`);
                await page.evaluate((password) => {
                    // Find password input field
                    const passwordInput = document.querySelector('input[type="password"]') ||
                        document.querySelector('input[data-input-name="password"]') ||
                        document.querySelector('input[placeholder*="máº­t kháº©u"]') ||
                        document.querySelector('input[placeholder*="password"]');

                    if (passwordInput) {
                        // Set value directly
                        passwordInput.value = password;

                        // Trigger events to notify React/Vue
                        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                        passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));

                        console.log('âœ… Password set directly');
                        return true;
                    }

                    console.warn('âš ï¸ Password input not found');
                    return false;
                }, pwd);
            };

            // Click first password
            console.log('ðŸ” Entering first password...');
            await clickDigitsOnKeyboard(password);

            // Wait for keyboard to reset (minimal delay - just let UI update)
            console.log('â³ Waiting for keyboard to reset...');
            await new Promise(r => setTimeout(r, 500));

            // Page automatically focuses on confirm password field
            // Click confirm password
            console.log('ðŸ” Entering confirm password...');
            await clickDigitsOnKeyboard(password);

            await new Promise(r => setTimeout(r, 1000));

            // Submit form
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="button"]') || document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            // Wait for form to process (simple approach - just wait for page to settle)
            console.log('â³ Waiting for withdraw password to be processed...');
            await new Promise(r => setTimeout(r, 3000)); // Wait for form processing

            console.log('âœ… Withdraw password submitted');

            await new Promise(r => setTimeout(r, 1000));

            // BÆ°á»›c 2: VÃ o trang submit bank
            const bankUrl = domain + paths.bank;
            console.log(`  â†’ Bank: ${bankUrl}`);

            // Add random delay 2-10s before redirect to bank
            const delayBeforeBank = this.getRandomDelay(2000, 5000);
            console.log(`â³ Waiting ${Math.round(delayBeforeBank / 1000)}s before redirect to bank...`);
            await new Promise(r => setTimeout(r, delayBeforeBank));

            await page.goto(bankUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for page to load
            await new Promise(r => setTimeout(r, 2000));

            // Step 1: Click "ThÃªm TÃ i Khoáº£n" button
            console.log('ðŸ¦ Clicking "ThÃªm TÃ i Khoáº£n" button...');
            await page.evaluate(() => {
                // Find by class or text
                let addBtn = document.querySelector('div._addAccountInputBtn_1bihm_45');
                if (!addBtn) {
                    addBtn = Array.from(document.querySelectorAll('div, button')).find(el =>
                        el.textContent.includes('ThÃªm TÃ i Khoáº£n')
                    );
                }
                if (addBtn) {
                    addBtn.click();
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Step 2: Click "TÃ i khoáº£n ngÃ¢n hÃ ng" option
            console.log('ðŸ¦ Clicking "TÃ i khoáº£n ngÃ¢n hÃ ng" option...');
            await page.evaluate(() => {
                // Find by id or text
                let bankOption = document.getElementById('addAccountClick');
                if (!bankOption) {
                    bankOption = Array.from(document.querySelectorAll('div, button')).find(el =>
                        el.textContent.includes('TÃ i khoáº£n ngÃ¢n hÃ ng')
                    );
                }
                if (bankOption) {
                    bankOption.click();
                }
            });

            await new Promise(r => setTimeout(r, 3000)); // Increased delay to wait for popup


            // Step 3: Re-enter withdraw password (password popup appears after clicking bank option)
            console.log('ðŸ” Re-entering withdraw password for bank confirmation...');

            // Check if password input appears (with retry)
            let passwordEntered = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    console.log(`  Attempt ${attempt + 1}/3 to find password input...`);
                    await page.waitForSelector('ul.ui-password-input__security', { timeout: 10000 });
                    console.log('âœ… Password input appeared');

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
                        console.log('âœ… Password digits entered');
                    } catch (digitError) {
                        console.warn('âš ï¸ Error entering password digits:', digitError.message);
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
                        console.warn('âš ï¸ Submit button not found');
                        throw new Error('Submit button not found');
                    }

                    passwordEntered = true;
                    console.log('âœ… Password re-entry completed');
                    break;
                } catch (e) {
                    console.warn(`  âš ï¸ Attempt ${attempt + 1} failed:`, e.message);
                    if (attempt < 2) {
                        console.log(`  Retrying in 2s...`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            if (!passwordEntered) {
                console.warn('âš ï¸ Password re-entry failed after 3 attempts, continuing anyway...');
            }

            // Click "Tiáº¿p Theo" button to proceed to bank form (if password was entered)
            if (passwordEntered) {
                console.log('ðŸ”˜ Clicking "Tiáº¿p Theo" button...');
                try {
                    await page.evaluate(() => {
                        const nextBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent.includes('Tiáº¿p Theo')
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
                    console.warn('âš ï¸ Failed to click Tiáº¿p Theo button:', e.message);
                }
            }

            // Wait for bank form fields to appear
            try {
                await page.waitForSelector('input[placeholder="Vui lÃ²ng nháº­p sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng"]', { timeout: 5000 });
                console.log('âœ… Bank form loaded');
            } catch (e) {
                console.warn('âš ï¸ Bank form not fully loaded, continuing anyway...');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Fill bank form - account number and bank selection (like hai2vip)
            await page.evaluate((data) => {
                // Find account number input
                const accountInput = document.querySelector('input[placeholder="Vui lÃ²ng nháº­p sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng"]');

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

                    console.log(`âœ… Filled account number: ${data.accountNumber}`);
                }
            }, profileData);

            await new Promise(r => setTimeout(r, 1500));

            // Find and click bank dropdown
            console.log('ðŸ¦ Selecting bank...');
            await page.evaluate((data) => {
                // Find bank dropdown input
                const bankDropdown = document.querySelector('input[type="search"][placeholder="Chá»n ngÃ¢n hÃ ng phÃ¡t hÃ nh"]');

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
                                    console.log(`âœ… Selected bank: ${bankOption.textContent.trim()}`);
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
                    document.querySelector('input[placeholder*="chá»§ tÃ i khoáº£n"]');

                if (nameField) {
                    nameField.value = data.fullname.toUpperCase();
                    nameField.dispatchEvent(new Event('input', { bubbles: true }));
                    nameField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, profileData);

            // Submit form - click "XÃ¡c Nháº­n" button
            console.log(`ðŸ“¤ Submitting bank form for ${siteConfig.name}...`);
            await page.evaluate(() => {
                // Find by id first (most reliable)
                let submitBtn = document.getElementById('bindWithdrawAccountNextClick');

                // Fallback to button with "XÃ¡c Nháº­n" text
                if (!submitBtn) {
                    submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                        btn.textContent.includes('XÃ¡c Nháº­n')
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
            console.log(`â³ Waiting for page to load after bank submission...`);
            let pageReloaded = false;
            try {
                // Wait for page to show success or reload
                await page.waitForSelector('._addAccountInputBtn_1bihm_45, [class*="addAccount"], button:contains("ThÃªm"), ._navItem_1odty_45', { timeout: 10000 }).catch(() => {
                    console.log('âš ï¸ Page selector not found after bank submission');
                });
                pageReloaded = true;
                console.log('âœ… Page loaded after bank submission');
            } catch (e) {
                console.log('âš ï¸ Timeout waiting for page after bank submission');
            }
            await new Promise(r => setTimeout(r, 1500));

            // Check if bank was added successfully
            await new Promise(r => setTimeout(r, 3000));
            const result = await page.evaluate((expectedData, reloaded) => {
                // For 22VIP, just check if page reloaded or if we can see success message
                const successKeywords = ['thÃ nh cÃ´ng', 'success', 'added', 'completed'];
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

            console.log(`âœ… 22VIP Add Bank Result:`, result);
            return result;
        } catch (error) {
            console.error(`âŒ 22VIP Add Bank Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * BÆ°á»›c 3: Check Promo (riÃªng cho tá»«ng category)
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
     * Logic: Fill username â†’ Select promo â†’ Solve captcha â†’ Click xÃ¡c nháº­n
     */
    async checkPromoOKVIP(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`ðŸŽ Check Promo step for ${siteConfig.name} (OKVIP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('#account', { timeout: 15000 });
                console.log('âœ… Check Promo form loaded');
            } catch (e) {
                console.warn('âš ï¸ Check Promo form not fully loaded, continuing anyway...');
            }

            // Inject captcha-solver script
            try {
                if (this.scripts?.captchaSolver) {
                    await page.evaluate(this.scripts.captchaSolver);
                    console.log('ðŸ’‰ Captcha solver injected');
                }
            } catch (injectError) {
                console.warn('âš ï¸ Failed to inject captcha solver:', injectError.message);
            }

            // 2. Fill username only
            const username = profileData?.username || '';
            console.log(`ðŸ“ Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('#account');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            console.log(`âœ… Username filled successfully`);
            console.log('ðŸ“Œ Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };

        } catch (error) {
            console.error(`âŒ OKVIP Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * OKVIP OTP Check Promo
     * Logic: Fill username â†’ Click submit
     */
    async checkPromoOKVIPOtp(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`ðŸŽ Check Promo step for ${siteConfig.name} (OKVIP OTP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('input[data-input-name="account"]', { timeout: 15000 });
                console.log('âœ… Check Promo form loaded');
            } catch (e) {
                console.warn('âš ï¸ Check Promo form not fully loaded, continuing anyway...');
            }

            // 2. Fill username
            const username = profileData?.username || '';
            console.log(`ðŸ“ Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('input[data-input-name="account"]');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            console.log(`âœ… Username filled successfully`);

            // 3. Click submit button
            await new Promise(r => setTimeout(r, 1500));
            const submitClicked = await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]') ||
                    document.querySelector('button.ui-button--primary') ||
                    document.querySelector('button:contains("Nháº­n")');

                if (submitBtn) {
                    submitBtn.click();
                    console.log('âœ… Submit button clicked');
                    return true;
                }
                return false;
            });

            if (!submitClicked) {
                console.warn('âš ï¸ Submit button not found, but continuing...');
            }

            console.log('ðŸ“Œ Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Promo form submitted' };

        } catch (error) {
            console.error(`âŒ OKVIP OTP Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * ABCVIP Check Promo
     * Logic: Fill username â†’ Click submit (no captcha)
     */
    async checkPromoABCVIP(browser, siteConfig, profileData = {}) {
        const page = await browser.newPage();
        // Register tab for rotation
        tabRotator.register(page, `CheckPromo-${siteConfig.name}`);
        try {
            console.log(`ðŸŽ Check Promo step for ${siteConfig.name} (ABCVIP)...`);

            // 1. Navigate to promo URL
            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Wait for form fields to appear
            try {
                await page.waitForSelector('#userName', { timeout: 15000 });
                console.log('âœ… Check Promo form loaded');
            } catch (e) {
                console.warn('âš ï¸ Check Promo form not fully loaded, continuing anyway...');
            }

            // 2. Fill username only
            const username = profileData?.username || '';
            console.log(`ðŸ“ Filling username: ${username}...`);
            await page.evaluate((usernameValue) => {
                const input = document.querySelector('#userName');
                if (input) {
                    input.value = usernameValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, username);

            console.log(`âœ… Username filled successfully`);
            console.log('ðŸ“Œ Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };

        } catch (error) {
            console.error(`âŒ ABCVIP Check Promo Error:`, error.message);
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
            console.log(`ðŸŽ Check Promo step for ${siteConfig.name} (JUN88)...`);

            await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            // Fill username only
            const username = profileData?.username || '';
            console.log(`ðŸ“ Filling username: ${username}...`);
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

            console.log(`âœ… Username filled successfully`);
            console.log('ðŸ“Œ Keeping checkpromo page open for manual completion');

            return { success: true, message: 'Username filled - manual completion required' };
        } catch (error) {
            console.error(`âŒ JUN88 Check Promo Error:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fill Register Form - riÃªng cho tá»«ng category
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
            console.log('âœ… Register form loaded');
        } catch (e) {
            console.warn('âš ï¸ Register form not fully loaded, continuing anyway...');
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
     * Phone: Láº¥y tá»« CodeSim API náº¿u simMode = 'api'
     */
    async fillOKVIPOtpRegisterForm(page, profileData) {
        try {
            console.log('ðŸ¤– OKVIP OTP Form - Filling...');

            // Wait for form to load
            try {
                await page.waitForSelector('input[data-input-name="account"]', { timeout: 15000 });
                console.log('âœ… OKVIP OTP register form loaded');
            } catch (e) {
                console.warn('âš ï¸ Form selector timeout, trying to fill anyway...');
            }

            await new Promise(r => setTimeout(r, 1500));

            // Náº¿u simMode = 'api', láº¥y sá»‘ tá»« CodeSim (báº¯t buá»™c)
            if (profileData.simMode === 'api') {
                console.log('ðŸ“± OKVIP OTP: Fetching phone number from CodeSim API...');
                const codeSimToken = this.settings?.codeSimToken || process.env.CODESIM_TOKEN;

                if (!codeSimToken) {
                    throw new Error('CodeSim token not provided');
                }

                const phoneResult = await this.getPhoneFromCodeSim(codeSimToken);
                if (phoneResult && phoneResult.phoneNumber) {
                    let phone = phoneResult.phoneNumber;

                    // Bá» sá»‘ 0 Ä‘áº§u náº¿u cÃ³ (form chá»‰ nháº­n 9 sá»‘)
                    if (phone.startsWith('0')) {
                        phone = phone.substring(1);
                        console.log(`âœ… Removed leading 0: ${phoneResult.phoneNumber} â†’ ${phone}`);
                    }

                    profileData.phone = phone;
                    profileData.codeSimOtpId = phoneResult.otpId;
                    profileData.codeSimSimId = phoneResult.simId;
                    profileData.codeSimRequestId = phoneResult.otpId; // Use otpId as requestId for OTP retrieval
                    console.log(`âœ… Got phone from CodeSim: ${phone} (9 digits)`);
                } else {
                    // CodeSim API failed - throw error
                    const errorMsg = 'CodeSim API: Hiá»‡n khÃ´ng cÃ³ sáºµn sá»‘ Ä‘iá»‡n thoáº¡i phÃ¹ há»£p. Vui lÃ²ng thá»­ láº¡i sau!';
                    console.error('âŒ ' + errorMsg);
                    throw new Error(errorMsg);
                }
            } else {
                // Manual mode - kiá»ƒm tra sá»‘ cÃ³ Ä‘Æ°á»£c cung cáº¥p khÃ´ng
                if (!profileData.phone) {
                    throw new Error('Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i!');
                }

                // Bá» sá»‘ 0 Ä‘áº§u náº¿u cÃ³ (form chá»‰ nháº­n 9 sá»‘)
                let phone = profileData.phone;
                if (phone.startsWith('0')) {
                    phone = phone.substring(1);
                    console.log(`âœ… Removed leading 0 from manual phone: ${profileData.phone} â†’ ${phone}`);
                }
                profileData.phone = phone;
                console.log(`âœï¸ Using manual phone: ${phone} (9 digits)`);
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
                    console.log('âœ… Account filled:', data.username);
                }

                // Fill password
                if (passInput) {
                    passInput.focus();
                    passInput.click();
                    passInput.value = data.password;
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('âœ… Password filled');
                }

                // Fill phone
                if (phoneInput) {
                    phoneInput.focus();
                    phoneInput.click();
                    phoneInput.value = data.phone || '';
                    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                    phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
                    phoneInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('âœ… Phone filled:', data.phone);
                }

                // Fill full name
                if (nameInput) {
                    nameInput.focus();
                    nameInput.click();
                    nameInput.value = (data.fullname || '').toUpperCase();
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    console.log('âœ… Full name filled:', data.fullname);
                }
            }, profileData);

            console.log('âœ… OKVIP OTP form filled successfully');
        } catch (error) {
            console.error('âŒ Error filling OKVIP OTP form:', error.message);
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
                        registerUrl: 'https://m.789bettg.net/Account/Register',
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
                    }, {
                        name: 'C168',
                        registerUrl: 'https://c168b.vip/home/register',
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
                        registerUrl: 'https://druycyspe3ka2oehgkap.jun88013.com/signup',
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

        // Load custom sites tá»« file
        try {
            const customSitesFile = path.join(__dirname, '..', '..', 'config', 'vip-custom-sites.json');
            if (fs.existsSync(customSitesFile)) {
                const customSitesData = JSON.parse(fs.readFileSync(customSitesFile, 'utf8'));
                const customSites = customSitesData[category] || [];
                // Merge custom sites vá»›i built-in sites
                config.sites = [...config.sites, ...customSites];
                console.log(`âœ… Loaded ${customSites.length} custom sites for ${category}`);
            }
        } catch (error) {
            console.warn(`âš ï¸ Could not load custom sites for ${category}:`, error.message);
        }

        return config;
    }

    /**
     * AccOKVIP Register Form (Van form with id selectors)
     * Selectors: #van-field-X-input
     * Phone number will be fetched from CodeSim API
     */
    async fillAccOkvipRegisterForm(page, profileData) {
        // Wait for form fields to appear
        try {
            await page.waitForSelector('#van-field-1-input', { timeout: 15000 });
            console.log('âœ… AccOKVIP register form loaded');
        } catch (e) {
            console.warn('âš ï¸ AccOKVIP register form not fully loaded, continuing anyway...');
        }
        await new Promise(r => setTimeout(r, 1500));

        // Step 1: Get phone number from CodeSim API (Service ID 3) - only if simMode is 'api'
        const simMode = profileData.simMode || 'api'; // Default to 'api'
        console.log(`ðŸ“± SIM Mode: ${simMode === 'api' ? 'API SIM' : 'Manual Phone'}`);

        let phoneNumber = profileData.phone; // Fallback to provided phone
        let CodeSimSuccess = false;
        let CodeSimErrorMessage = null;

        if (simMode === 'api') {
            console.log('ðŸ“± Getting phone number from CodeSim API...');
            const codeSimToken = this.settings?.codeSimToken || process.env.CodeSim_TOKEN;

            if (codeSimToken) {
                const CodeSimResult = await this.getPhoneFromCodeSim(codeSimToken); // Thá»­ serviceId 3 vÃ  21
                if (CodeSimResult && CodeSimResult.phoneNumber) {
                    phoneNumber = CodeSimResult.phoneNumber;
                    console.log(`âœ… Got phone from CodeSim: ${phoneNumber}`);
                    // Store for later use (OTP retrieval)
                    profileData.codeSimRequestId = CodeSimResult.requestId;
                    CodeSimSuccess = true;
                } else {
                    // CodeSim API failed - this means no available phone numbers
                    CodeSimErrorMessage = 'CodeSim API: Hiá»‡n khÃ´ng cÃ³ sáºµn sá»‘ Ä‘iá»‡n thoáº¡i phÃ¹ há»£p. Vui lÃ²ng thá»­ láº¡i sau!';
                    console.error('âŒ ' + CodeSimErrorMessage);
                    // Store error message in profileData for later use in result
                    profileData.CodeSimError = CodeSimErrorMessage;
                    throw new Error(CodeSimErrorMessage);
                }
            } else {
                console.warn('âš ï¸ No CodeSim token, using provided phone');
            }
        } else {
            console.log('âœï¸ Using manual phone from form');
            if (!phoneNumber) {
                throw new Error('Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i!');
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
                console.log(`âœ… Username filled: ${data.username}`);
            }

            // Fill password
            const passwordField = document.querySelector('#van-field-2-input');
            if (passwordField) {
                passwordField.value = data.password;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`âœ… Password filled`);
            }

            // Fill confirm password
            const confirmPasswordField = document.querySelector('#van-field-3-input');
            if (confirmPasswordField) {
                confirmPasswordField.value = data.password;
                confirmPasswordField.dispatchEvent(new Event('input', { bubbles: true }));
                confirmPasswordField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`âœ… Confirm password filled`);
            }

            // Fill phone (from CodeSim API)
            const phoneField = document.querySelector('#van-field-4-input');
            if (phoneField) {
                phoneField.value = data.phoneNumber;
                phoneField.dispatchEvent(new Event('input', { bubbles: true }));
                phoneField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`âœ… Phone filled: ${data.phoneNumber}`);
            }

            // Fill email
            const emailField = document.querySelector('#van-field-5-input');
            if (emailField) {
                emailField.value = data.email;
                emailField.dispatchEvent(new Event('input', { bubbles: true }));
                emailField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`âœ… Email filled: ${data.email}`);
            }

            // Check agree checkbox
            const checkbox = document.querySelector('.van-checkbox');
            if (checkbox) {
                checkbox.click();
                console.log(`âœ… Agree checkbox checked`);
            }
        }, { ...profileData, phoneNumber });

        console.log('âœ… AccOKVIP form filled successfully');
    }

    /**
     * ABCVIP Register Form
     */
    async fillABCVIPRegisterForm(page, profileData) {
        // Wait for form fields to appear
        try {
            await page.waitForSelector('input[formcontrolname="account"]', { timeout: 15000 });
            console.log('âœ… ABCVIP Register form loaded');
        } catch (e) {
            console.warn('âš ï¸ ABCVIP Register form not fully loaded, continuing anyway...');
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
            console.log('ðŸ¤– JUN88 Form - Anti-bot mode enabled');
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

            console.log(`ðŸ” DEBUG: profileData.email = "${profileData.email}"`);
            console.log(`ðŸ” DEBUG: fields to fill:`, fields.map(f => ({ label: f.label, value: f.value })));

            await filler.fillMultipleFields(page, fields, {
                charDelay: 150,
                beforeFocus: 300,
                afterField: 800
            });

            // Handle agree checkbox - skip if already checked
            console.log('âœ… Checking agree checkbox...');
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
                    console.log('âœ… Agree checkbox already checked');
                }
            } catch (error) {
                console.warn('âš ï¸ Could not interact with agree checkbox:', error.message);
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

            console.log('âœ… JUN88 form filled successfully');
        } catch (error) {
            console.error('âŒ Error filling JUN88 form:', error.message);
            throw error;
        }
    }

    /**
     * Auto-detect category from site URL
     * PhÃ¡t hiá»‡n category dá»±a trÃªn domain cá»§a site
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

            // JUN88 sites (Form 1 - cÃ³ email)
            if (domain.includes('jun88') || domain.includes('jun-88')) {
                return 'jun88';
            }

            // 78WIN sites (Form 2 - khÃ´ng email)
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

            console.warn(`âš ï¸ Could not auto-detect category for: ${domain}`);
            return 'okvip'; // Default to OKVIP
        } catch (error) {
            console.error('âŒ Error auto-detecting category:', error.message);
            return 'okvip'; // Default to OKVIP
        }
    }

    /**
     * Save account info after successful registration
     * LÆ°u thÃ´ng tin tÃ i khoáº£n vÃ o dashboard API
     */
    async saveAccountInfo(profileData, category, siteName, allSites = []) {
        try {
            console.log(`    ðŸ’¾ Saving ${category.toUpperCase()} account info via API...`);
            console.log(`    ðŸ“‹ profileData:`, { username: profileData.username, password: profileData.password ? '***' : 'N/A', email: profileData.email });

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

            // Chá»‰ thÃªm bank info náº¿u khÃ´ng pháº£i AccOKVIP (AccOKVIP khÃ´ng cáº§n ngÃ¢n hÃ ng)
            if (category !== 'accOkvip') {
                accountInfo.bank = {
                    name: profileData.bankName || '',
                    branch: profileData.bankBranch || 'ThÃ nh phá»‘ Há»“ ChÃ­ Minh',
                    accountNumber: profileData.accountNumber || '',
                    accountHolder: profileData.fullname || ''
                };
            }

            console.log(`    ðŸ“¦ accountInfo to send:`, { username: accountInfo.username, password: accountInfo.password ? '***' : 'N/A' });

            // Get dashboard port (dynamic)
            const dashboardPort = process.env.DASHBOARD_PORT || global.DASHBOARD_PORT || 3000;
            const apiUrl = `http://localhost:${dashboardPort}/api/accounts/${category}/${profileData.username}`;
            console.log(`    ðŸ“ API URL: ${apiUrl}`);

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
                console.error(`    âŒ API Error Response:`, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`    âœ… Account info saved via API:`, result.message);

        } catch (error) {
            console.error(`    âŒ Error saving account info:`, error.message);
            throw error;
        }
    }

    /**
     * Solve Geetest V4 or Botion captcha via 2Captcha API
     * Há»— trá»£ cáº£ Geetest V4 vÃ  Botion slide puzzle
     */
    async solveGeetestV4ViaAutoCaptcha(page, apiKey) {
        try {
            console.log('ðŸ” Detecting captcha type...');

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

            console.log(`ðŸ“‹ Detected captcha type: ${captchaType}`);

            if (!captchaType) {
                console.warn('âš ï¸ Could not detect captcha type on page');
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
            console.error('âŒ Captcha solve error:', error.message);
            return null;
        }
    }

    /**
     * Solve Botion slide puzzle captcha
     */
    async solveBottionCaptcha(page, apiKey) {
        try {
            console.log('ðŸ” Solving Botion captcha via DOM analysis + drag simulation...');

            const maxAttempts = 3;
            let attempt = 0;

            while (attempt < maxAttempts) {
                attempt++;
                console.log(`\nðŸ”„ Attempt ${attempt}/${maxAttempts}`);

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
                            console.warn('âš ï¸ Captcha elements not visible yet');
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
                            console.log(`â³ Waiting for Botion captcha to render (${waitAttempts}s)...`);
                        }
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (!puzzleInfo) {
                    console.warn('âš ï¸ Botion captcha element not found, using full screenshot fallback');

                    // Fallback: Use full screenshot
                    const fullScreenshot = await page.screenshot();
                    const base64Image = fullScreenshot.toString('base64');

                    return await this.submitBottionCaptchaToAPI(base64Image, apiKey);
                }

                console.log(`ðŸ“ Puzzle piece info:`, puzzleInfo);

                // Check if captcha elements are visible
                if (puzzleInfo.windowWidth <= 0 || puzzleInfo.windowHeight <= 0) {
                    console.warn('âš ï¸ Captcha window has invalid dimensions, waiting more...');
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
                console.log(`ðŸ“¸ Screenshot size: ${base64Image.length} bytes`);

                // Step 3: Analyze the screenshot to find gap position
                const captchaResult = await this.submitBottionCaptchaToAPI(base64Image, apiKey, puzzleInfo);

                if (!captchaResult || !captchaResult.success) {
                    console.error('âŒ Failed to analyze captcha');
                    return null;
                }

                // Step 4: Simulate drag to move the puzzle piece
                console.log(`ðŸŽ¯ Simulating drag to ${captchaResult.solution}%...`);
                const dragResult = await this.simulateBottionDrag(page, captchaResult.solution, puzzleInfo);

                if (!dragResult) {
                    console.error('âŒ Failed to simulate drag');
                    return null;
                }

                // Step 5: Wait for captcha verification
                console.log('â³ Waiting for captcha verification...');
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s for verification

                // Step 6: Check if captcha was solved correctly
                const verifyResult = await this.checkBottionResult(page);

                if (verifyResult.success) {
                    console.log('âœ… Captcha solved successfully!');
                    return captchaResult;
                }

                // Captcha failed - check if we should retry
                if (verifyResult.failed) {
                    console.warn(`âš ï¸ Captcha failed: ${verifyResult.message}`);

                    if (attempt < maxAttempts) {
                        console.log(`ðŸ”„ Refreshing captcha and retrying...`);
                        await this.refreshBottionCaptcha(page);
                        await new Promise(r => setTimeout(r, 1500)); // Wait before retry
                        continue; // Try again
                    } else {
                        console.error('âŒ Max attempts reached');
                        return null;
                    }
                }

                // Unknown state - return result anyway
                console.log('âš ï¸ Captcha state unknown, returning result');
                return captchaResult;
            }

            console.error('âŒ Failed to solve captcha after all attempts');
            return null;
        } catch (error) {
            console.error('âŒ Botion captcha solve error:', error.message);
            return null;
        }
    }

    /**
     * Check if Botion captcha was solved correctly or failed
     */
    async checkBottionResult(page) {
        try {
            const result = await page.evaluate(() => {
                // BÆ°á»›c 1: Kiá»ƒm tra message tá»« server
                let resultTips = document.querySelector('[class*="botion_result_tips"]');
                if (!resultTips) {
                    resultTips = document.querySelector('[class*="result_tips"]');
                }
                if (!resultTips) {
                    resultTips = document.querySelector('[class*="tips"]');
                }

                if (resultTips && resultTips.textContent) {
                    const text = resultTips.textContent.toLowerCase().trim();
                    console.log(`ðŸ“Š Result tips: ${text}`);

                    // Kiá»ƒm tra success message
                    if (text.includes('thÃ nh cÃ´ng') || text.includes('success') || text.includes('verified')) {
                        return { success: true, message: text };
                    }

                    // Kiá»ƒm tra failure message
                    if (text.includes('vui lÃ²ng thá»­ láº¡i') || text.includes('thá»­ láº¡i') || text.includes('failed') || text.includes('error')) {
                        return { failed: true, message: text };
                    }
                }

                // BÆ°á»›c 2: Kiá»ƒm tra xem captcha box cÃ³ biáº¿n máº¥t khÃ´ng (dáº¥u hiá»‡u success)
                let botionBox = document.querySelector('[class*="botion_box"]');
                if (!botionBox) {
                    botionBox = document.querySelector('[class*="captcha"]');
                }
                if (!botionBox) {
                    botionBox = document.querySelector('[class*="box"]');
                }

                // Náº¿u captcha box biáº¿n máº¥t hoáº·c áº©n, cÃ³ thá»ƒ lÃ  success
                if (!botionBox || botionBox.style.display === 'none' || botionBox.offsetHeight === 0) {
                    console.log('ðŸ“Š Captcha box disappeared - likely success');
                    return { success: true, message: 'Captcha disappeared' };
                }

                // BÆ°á»›c 3: Kiá»ƒm tra xem form cÃ³ Ä‘Æ°á»£c submit khÃ´ng (kiá»ƒm tra URL hoáº·c form state)
                // Náº¿u URL thay Ä‘á»•i hoáº·c form biáº¿n máº¥t, captcha Ä‘Ã£ Ä‘Æ°á»£c giáº£i
                const formElement = document.querySelector('form');
                if (!formElement || formElement.style.display === 'none') {
                    console.log('ðŸ“Š Form disappeared - likely success');
                    return { success: true, message: 'Form disappeared' };
                }

                // BÆ°á»›c 4: Kiá»ƒm tra retry button (nhÆ°ng khÃ´ng dÃ¹ng lÃ m dáº¥u hiá»‡u fail duy nháº¥t)
                let retryBtn = document.querySelector('[class*="botion_refresh"]');
                if (!retryBtn) {
                    retryBtn = document.querySelector('[class*="refresh"]');
                }
                if (!retryBtn) {
                    retryBtn = document.querySelector('[class*="retry"]');
                }

                // Náº¿u retry button áº©n, cÃ³ thá»ƒ lÃ  success
                if (!retryBtn || retryBtn.style.display === 'none' || retryBtn.offsetHeight === 0) {
                    console.log('ðŸ“Š Retry button hidden - likely success');
                    return { success: true, message: 'Retry button hidden' };
                }

                // Náº¿u retry button hiá»ƒn thá»‹ nhÆ°ng khÃ´ng cÃ³ error message, cÃ³ thá»ƒ váº«n lÃ  success
                // (retry button cÃ³ thá»ƒ hiá»ƒn thá»‹ nhÆ°ng khÃ´ng active)
                console.log('ðŸ“Š Retry button visible but no error message - assuming success');
                return { success: true, message: 'Assuming success (no error message)' };
            });

            console.log('ðŸ“Š Botion result check:', result);
            return result;
        } catch (error) {
            console.error('âŒ Result check error:', error.message);
            return { unknown: true, message: error.message };
        }
    }

    /**
     * Refresh Botion captcha (click refresh button)
     */
    async refreshBottionCaptcha(page) {
        try {
            console.log('ðŸ”„ Clicking refresh button...');

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
                    console.warn('âš ï¸ Refresh button not found');
                    return false;
                }

                // Click refresh button
                refreshBtn.click();
                console.log('âœ… Refresh button clicked');
                return true;
            });

            if (refreshed) {
                // Wait for new captcha to load
                await new Promise(r => setTimeout(r, 1000));
                return true;
            }

            return false;
        } catch (error) {
            console.error('âŒ Refresh error:', error.message);
            return false;
        }
    }

    /**
     * Simulate drag movement for Botion slider using transform + events
     * KÃ©o nÃºt (botion_btn) tá»« trÃ¡i sang pháº£i Ä‘á»ƒ di chuyá»ƒn máº£nh ghÃ©p vÃ o gap
     */
    async simulateBottionDrag(page, percentage, puzzleInfo) {
        try {
            console.log(`ðŸŽ¯ KÃ©o nÃºt Ä‘áº¿n ${percentage}%...`);

            // BÆ°á»›c 1: Láº¥y thÃ´ng tin nÃºt kÃ©o vÃ  thanh track
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
                    console.warn('âš ï¸ KhÃ´ng tÃ¬m tháº¥y nÃºt kÃ©o Botion');
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
                console.error('âŒ KhÃ´ng thá»ƒ láº¥y thÃ´ng tin nÃºt kÃ©o');
                return null;
            }

            console.log(`ï¿½ Vá»‹ tr Ã­ nÃºt: (${elementInfo.sliderX}, ${elementInfo.sliderY})`);
            console.log(`ðŸ“ Thanh track: (${elementInfo.trackX}, ${elementInfo.trackY}), Chiá»u rá»™ng: ${elementInfo.trackWidth}`);
            console.log(`ðŸ“ NÃºt báº¯t Ä‘áº§u táº¡i: ${elementInfo.sliderLeft}px`);

            // BÆ°á»›c 2: TÃ­nh vá»‹ trÃ­ Ä‘Ã­ch
            // KÃ©o nÃºt Ä‘áº¿n vá»‹ trÃ­ tÆ°Æ¡ng á»©ng vá»›i percentage
            // QUAN TRá»ŒNG: TÃ­nh tá»« Ä‘áº§u track (trackX), khÃ´ng pháº£i tá»« vá»‹ trÃ­ hiá»‡n táº¡i cá»§a nÃºt
            const dragDistance = (elementInfo.trackWidth * percentage) / 100;
            const targetX = elementInfo.trackX + dragDistance;

            console.log(`ðŸŽ¯ Khoáº£ng cÃ¡ch kÃ©o: ${dragDistance}px (${percentage}%)`);
            console.log(`ðŸŽ¯ Vá»‹ trÃ­ Ä‘Ã­ch: ${targetX}px`);
            console.log(`ðŸ“ Tá»« trackX (${elementInfo.trackX}px) + dragDistance (${dragDistance}px) = ${targetX}px`);

            // BÆ°á»›c 3: Dispatch pointerdown vÃ  mousedown
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

                console.log('ðŸ–±ï¸ Nháº¥n chuá»™t xuá»‘ng');
            }, elementInfo.sliderX, elementInfo.sliderY);

            // BÆ°á»›c 4: KÃ©o mÆ°á»£t mÃ  vá»›i Ä‘á»™ trá»… giá»¯a cÃ¡c bÆ°á»›c (nhÆ° ngÆ°á»i tháº­t kÃ©o)
            // Tá»•ng thá»i gian kÃ©o: ~1.5-2 giÃ¢y
            const steps = 50;
            const delayPerStep = 30; // 30ms giá»¯a má»—i bÆ°á»›c = 1.5 giÃ¢y tá»•ng

            for (let step = 1; step <= steps; step++) {
                // TÃ­nh vá»‹ trÃ­ hiá»‡n táº¡i dá»±a trÃªn percentage
                const currentPercentage = (percentage * step) / steps;
                const currentDragDistance = (elementInfo.trackWidth * currentPercentage) / 100;
                const currentX = elementInfo.trackX + currentDragDistance;
                const currentY = elementInfo.sliderY;

                await page.evaluate((x, y, trackWidth) => {
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
                }, currentX, currentY, elementInfo.trackWidth);

                // Chá» trÆ°á»›c bÆ°á»›c tiáº¿p theo (táº¡o kÃ©o mÆ°á»£t nhÆ° ngÆ°á»i tháº­t)
                await new Promise(r => setTimeout(r, delayPerStep));
            }

            // BÆ°á»›c 5: Dispatch pointerup vÃ  mouseup
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

                console.log('ðŸ–±ï¸ Tháº£ chuá»™t');
            }, targetX, elementInfo.sliderY);

            console.log('âœ… HoÃ n thÃ nh kÃ©o');
            return { success: true, percentage: percentage };
        } catch (error) {
            console.error('âŒ Lá»—i kÃ©o:', error.message);
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
            // Thá»­ dÃ¹ng local image matching trÆ°á»›c (chÃ­nh xÃ¡c hÆ¡n)
            console.log('ðŸ” Solving Botion captcha via local image matching (primary)...');
            const localResult = await this.solveBottionViaImageMatching(base64Image, puzzleInfo);

            if (localResult && localResult.success) {
                console.log('âœ… Local image matching thÃ nh cÃ´ng:', localResult.solution);
                return localResult;
            }

            // Náº¿u local matching tháº¥t báº¡i, thá»­ 2Captcha
            console.log('âš ï¸ Local image matching tháº¥t báº¡i, thá»­ 2Captcha...');
            console.log('ðŸ“¤ Gá»­i Botion captcha tá»›i 2Captcha API...');

            // Loáº¡i bá» tiá»n tá»‘ data:image náº¿u cÃ³
            const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

            // Gá»­i tá»›i 2Captcha
            const submitResponse = await fetch('https://api.2captcha.com/createTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: 'ImageToTextTask',
                        body: cleanBase64,
                        comment: 'Botion slider puzzle captcha. The image shows a puzzle piece on the LEFT side and a background image on the RIGHT side with a GAP/HOLE. Find the EXACT horizontal position of the gap in the background image as a percentage (0-100%) from left to right. 0% = gap at far left edge, 100% = gap at far right edge. Be very precise. Return ONLY the percentage number (e.g., 45 for 45%).',
                        numeric: 1  // Only numbers
                    }
                })
            });

            const submitData = await submitResponse.json();
            console.log('ðŸ“¤ Pháº£n há»“i gá»­i:', submitData);

            // Kiá»ƒm tra lá»—i
            if (submitData.errorId !== 0) {
                console.error('âŒ Lá»—i gá»­i Botion captcha:', submitData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                return localResult; // Return local result if available
            }

            // Xá»­ lÃ½ pháº£n há»“i thÃ nh cÃ´ng {errorId: 0, taskId: "xxx"}
            if (submitData.taskId) {
                const taskId = submitData.taskId;
                console.log(`ðŸ“ Botion captcha Ä‘Ã£ gá»­i, Task ID: ${taskId}`);

                // Kiá»ƒm tra káº¿t quáº£ (tá»‘i Ä‘a 60 giÃ¢y)
                for (let i = 0; i < 60; i++) {
                    await new Promise(r => setTimeout(r, 2000));

                    const resultResponse = await fetch('https://api.2captcha.com/getTaskResult', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientKey: apiKey,
                            taskId: taskId
                        })
                    });
                    const resultData = await resultResponse.json();

                    if (resultData.errorId === 0 && resultData.status === 'ready' && resultData.solution) {
                        const solutionText = resultData.solution.text;
                        console.log(`âœ… 2Captcha tráº£ vá»: ${solutionText}`);

                        // Parse the solution - should be a percentage (0-100)
                        let percentage = null;

                        // Try to extract number from text
                        const numberMatch = solutionText.match(/(\d+(?:\.\d+)?)/);
                        if (numberMatch) {
                            let value = parseFloat(numberMatch[1]);

                            // Validate the value
                            if (value >= 0 && value <= 100) {
                                // Valid percentage
                                percentage = value;
                                console.log(`âœ… Giáº£i phÃ¡p há»£p lá»‡: ${percentage}%`);
                            } else if (value > 100 && value <= 500 && puzzleInfo && puzzleInfo.trackWidth) {
                                // Heuristic: if value is between 100-500, might be pixel position
                                // Only convert if it's reasonable (not too large)
                                percentage = (value / puzzleInfo.trackWidth) * 100;
                                console.log(`ðŸ“ Chuyá»ƒn Ä‘á»•i pixel ${value}px â†’ ${percentage.toFixed(1)}%`);

                                // Validate converted percentage - if still > 100, it's invalid
                                if (percentage > 100) {
                                    console.warn(`âš ï¸ Chuyá»ƒn Ä‘á»•i vÆ°á»£t quÃ¡ 100% (${percentage.toFixed(1)}%), giÃ¡ trá»‹ khÃ´ng há»£p lá»‡`);
                                    percentage = null;
                                }
                            } else {
                                // Invalid value - use fallback
                                console.warn(`âš ï¸ GiÃ¡ trá»‹ khÃ´ng há»£p lá»‡: ${value} (trackWidth: ${puzzleInfo?.trackWidth}), dÃ¹ng fallback`);
                                percentage = null;
                            }
                        }

                        // If we got a valid percentage, return it
                        if (percentage !== null) {
                            console.log(`ðŸ“ KÃ©o tá»›i: ${percentage.toFixed(1)}%`);
                            return {
                                success: true,
                                solution: Math.round(percentage),
                                source: '2captcha'
                            };
                        } else {
                            // Invalid solution - use local result if available
                            console.warn('âš ï¸ KhÃ´ng thá»ƒ phÃ¢n tÃ­ch giáº£i phÃ¡p 2Captcha, dÃ¹ng local result');
                            return localResult;
                        }
                    }

                    // Status processing = chÆ°a sáºµn sÃ ng
                    if (resultData.status === 'processing') {
                        if (i % 10 === 0) {
                            console.log(`â³ Chá» káº¿t quáº£ Botion (${i}s)...`);
                        }
                        continue;
                    }

                    // CÃ¡c status khÃ¡c lÃ  lá»—i
                    if (resultData.errorId !== 0) {
                        console.error('âŒ Lá»—i giáº£i Botion:', resultData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                        break;
                    }
                }

                console.error('âŒ Timeout giáº£i Botion qua 2Captcha');
                return localResult; // Return local result if available
            }

            console.error('âŒ Äá»‹nh dáº¡ng pháº£n há»“i khÃ´ng xÃ¡c Ä‘á»‹nh:', submitData);
            return localResult; // Return local result if available
        } catch (error) {
            console.error('âŒ Botion captcha error:', error.message);
            // Try local matching as fallback
            console.log('ðŸ”„ Fallback: DÃ¹ng local image matching...');
            const localResult = await this.solveBottionViaImageMatching(base64Image, puzzleInfo);
            return localResult;
        }
    }

    /**
     * Solve Botion captcha via local image matching (no external API)
     */
    async solveBottionViaImageMatching(base64Image, puzzleInfo = null) {
        try {
            console.log('ðŸ” Solving Botion captcha via local image matching...');

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

            // Try to use sharp if available for template matching
            let matchResult = null;

            try {
                // Try using sharp for advanced image processing
                const sharp = require('sharp');
                matchResult = await this.analyzeBottionWithTemplateMatching(imageBuffer, sharp, puzzleInfo);
            } catch (e) {
                console.warn('âš ï¸ Sharp not available, trying basic analysis...');
                // Fallback to basic pixel analysis
                matchResult = await this.analyzeBottionBasic(imageBuffer, puzzleInfo);
            }

            if (!matchResult || matchResult.percentage === null) {
                console.warn('âš ï¸ Could not determine slider position');
                return null;
            }

            console.log(`âœ… Botion captcha analyzed: ${matchResult.percentage}%`);
            return {
                success: true,
                solution: matchResult.percentage.toString(),
                type: 'botion',
                service: 'local-matching'
            };
        } catch (error) {
            console.error('âŒ Image matching error:', error.message);
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
            console.log(`ðŸ“Š KÃ­ch thÆ°á»›c áº£nh: ${metadata.width}x${metadata.height}`);

            // Extract image data
            const { data, info } = await sharp(imageBuffer)
                .raw()
                .toBuffer({ resolveWithObject: true });

            const width = metadata.width;
            const height = metadata.height;
            const channels = info.channels;

            // BÆ°á»›c 1: PhÃ¢n tÃ­ch Ä‘á»™ sÃ¡ng theo cá»™t Ä‘á»ƒ tÃ¬m gap
            console.log('ðŸ” PhÃ¢n tÃ­ch áº£nh Ä‘á»ƒ tÃ¬m vá»‹ trÃ­ gap...');
            let brightnessByColumn = [];

            for (let x = 0; x < width; x++) {
                let totalBrightness = 0;
                let pixelCount = 0;

                // Láº¥y máº«u tá»« giá»¯a áº£nh (nÆ¡i cÃ³ máº£nh ghÃ©p)
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

            // BÆ°á»›c 2: TÃ­nh trung bÃ¬nh Ä‘á»™ sÃ¡ng trÆ°á»›c
            let totalBrightnessSum = 0;
            for (let i = 0; i < width; i++) {
                totalBrightnessSum += brightnessByColumn[i].brightness;
            }
            const avgBrightnessValue = totalBrightnessSum / width;

            console.log(`ðŸ“Š Äá»™ sÃ¡ng trung bÃ¬nh: ${avgBrightnessValue.toFixed(0)}`);

            // BÆ°á»›c 3: TÃ¬m gap (khoáº£ng trá»‘ng - vÃ¹ng tá»‘i hÆ¡n trung bÃ¬nh Ã­t nháº¥t 30 Ä‘iá»ƒm)
            console.log('ðŸ” TÃ¬m gap (khoáº£ng trá»‘ng Ä‘en)...');
            let gapX = 0;
            let minBrightness = 255;
            const darknessThreshold = avgBrightnessValue - 30;

            console.log(`ðŸ“Š Threshold tá»‘i: ${darknessThreshold.toFixed(0)}`);

            // QuÃ©t toÃ n bá»™ chiá»u rá»™ng Ä‘á»ƒ tÃ¬m vÃ¹ng tá»‘i nháº¥t nhÆ°ng váº«n tá»‘i hÆ¡n threshold
            for (let i = 0; i < width; i++) {
                const brightness = brightnessByColumn[i].brightness;

                // Chá»‰ xÃ©t cÃ¡c cá»™t tá»‘i hÆ¡n threshold
                if (brightness < darknessThreshold && brightness < minBrightness) {
                    minBrightness = brightness;
                    gapX = i;
                }
            }

            // Náº¿u khÃ´ng tÃ¬m tháº¥y vÃ¹ng tá»‘i hÆ¡n threshold, tÃ¬m vÃ¹ng tá»‘i nháº¥t
            if (minBrightness === 255) {
                console.log('âš ï¸ KhÃ´ng tÃ¬m tháº¥y vÃ¹ng tá»‘i hÆ¡n threshold, tÃ¬m vÃ¹ng tá»‘i nháº¥t...');
                minBrightness = 255;
                for (let i = 0; i < width; i++) {
                    if (brightnessByColumn[i].brightness < minBrightness) {
                        minBrightness = brightnessByColumn[i].brightness;
                        gapX = i;
                    }
                }
            }

            console.log(`ðŸ“ Gap tÃ¬m tháº¥y táº¡i: ${gapX}px (Ä‘á»™ sÃ¡ng: ${minBrightness.toFixed(0)})`);
            console.log(`ðŸ“Š Äá»™ sÃ¡ng gap: ${minBrightness.toFixed(0)}`);
            console.log(`ðŸ“Š ChÃªnh lá»‡ch: ${(avgBrightnessValue - minBrightness).toFixed(0)}`);

            // BÆ°á»›c 4: TÃ­nh % cáº§n kÃ©o nÃºt dá»±a trÃªn vá»‹ trÃ­ gap
            // QUAN TRá»ŒNG: Pháº§n cáº§n kÃ©o (máº£nh ghÃ©p) cÃ¡ch bÃªn trÃ¡i áº£nh 1 khoáº£ng
            // Cáº§n trá»« Ä‘i khoáº£ng cÃ¡ch nÃ y Ä‘á»ƒ tÃ­nh khoáº£ng cÃ¡ch kÃ©o thá»±c táº¿

            // Æ¯á»›c lÆ°á»£ng offset tá»« bÃªn trÃ¡i áº£nh Ä‘áº¿n pháº§n cáº§n kÃ©o
            // Dá»±a vÃ o hÃ¬nh áº£nh, pháº§n cáº§n kÃ©o cÃ¡ch bÃªn trÃ¡i khoáº£ng 10% chiá»u rá»™ng
            const puzzleLeftOffset = Math.round(width * 0.10);

            // Khoáº£ng cÃ¡ch kÃ©o thá»±c táº¿ = vá»‹ trÃ­ gap - offset tá»« bÃªn trÃ¡i
            const actualDragDistance = Math.max(0, gapX - puzzleLeftOffset);

            // TÃ­nh % dá»±a trÃªn khoáº£ng cÃ¡ch kÃ©o thá»±c táº¿
            const percentage = Math.round((actualDragDistance / width) * 100);

            console.log(`ðŸ“Š Offset tá»« bÃªn trÃ¡i: ${puzzleLeftOffset}px (10% cá»§a ${width}px)`);
            console.log(`ðŸ“Š Vá»‹ trÃ­ gap: ${gapX}px`);
            console.log(`ðŸ“Š Khoáº£ng cÃ¡ch kÃ©o thá»±c táº¿: ${actualDragDistance}px`);
            console.log(`ðŸ“Š Percentage: ${actualDragDistance}px / ${width}px = ${percentage}%`);

            // Clamp vÃ o khoáº£ng há»£p lÃ½ (5-95%)
            const clampedPercentage = Math.max(5, Math.min(95, percentage));
            if (clampedPercentage !== percentage) {
                console.log(`ðŸ“Š Äiá»u chá»‰nh: ${percentage}% â†’ ${clampedPercentage}%`);
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
            console.error('âŒ Lá»—i phÃ¢n tÃ­ch template:', error.message);
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
            console.log(`ðŸ“Š Image size: ${metadata.width}x${metadata.height}`);

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

            console.log(`ðŸ“ Slider detected at: ${sliderX}px (${percentage}%)`);
            console.log(`ðŸ“Š Contrast level: ${maxContrast.toFixed(2)}`);

            return {
                percentage: Math.max(0, Math.min(100, percentage)),
                sliderX: sliderX,
                width: width,
                contrast: maxContrast
            };
        } catch (error) {
            console.error('âŒ Sharp analysis error:', error.message);
            return null;
        }
    }

    /**
     * Basic Botion analysis without external libraries
     * Uses brightness detection to find puzzle piece and gap
     */
    async analyzeBottionBasic(imageBuffer, puzzleInfo = null) {
        try {
            console.log('ðŸ“Š Using basic brightness analysis');

            // Parse PNG header to get dimensions
            if (imageBuffer.length < 24) {
                console.warn('âš ï¸ Image too small');
                return null;
            }

            // Check PNG signature
            if (imageBuffer[0] !== 0x89 || imageBuffer[1] !== 0x50) {
                console.warn('âš ï¸ Not a valid PNG image');
                return null;
            }

            // Extract width from IHDR chunk (big-endian)
            const width = imageBuffer.readUInt32BE(16);
            const height = imageBuffer.readUInt32BE(20);

            console.log(`ðŸ“Š Image dimensions: ${width}x${height}`);

            // BÆ°á»›c 1: PhÃ¢n tÃ­ch Ä‘á»™ sÃ¡ng theo cá»™t
            let brightnessByColumn = [];
            const sampleHeight = Math.floor(height * 0.6); // Láº¥y máº«u 60% giá»¯a

            for (let x = 0; x < width; x++) {
                let totalBrightness = 0;
                let pixelCount = 0;

                // Láº¥y máº«u má»—i 4 hÃ ng Ä‘á»ƒ tÄƒng tá»‘c Ä‘á»™
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

            // BÆ°á»›c 2: TÃ­nh trung bÃ¬nh Ä‘á»™ sÃ¡ng
            let totalBrightnessSum = 0;
            for (let i = 0; i < width; i++) {
                totalBrightnessSum += brightnessByColumn[i].brightness;
            }
            const avgBrightnessValue = totalBrightnessSum / width;

            console.log(`ðŸ“Š Äá»™ sÃ¡ng trung bÃ¬nh: ${avgBrightnessValue.toFixed(0)}`);

            // BÆ°á»›c 3: TÃ¬m gap báº±ng cÃ¡ch phÃ¢n tÃ­ch Ä‘á»™ sÃ¡ng
            // Gap lÃ  vÃ¹ng tá»‘i nháº¥t trong áº£nh (vÃ¹ng thiáº¿u máº£nh ghÃ©p)
            console.log('ðŸ” TÃ¬m gap (khoáº£ng trá»‘ng Ä‘en)...');

            // TÃ¬m vÃ¹ng tá»‘i nháº¥t (gap)
            let gapX = 0;
            let minBrightness = 255;
            let gapWidth = 0;

            // QuÃ©t toÃ n bá»™ chiá»u rá»™ng Ä‘á»ƒ tÃ¬m vÃ¹ng tá»‘i nháº¥t
            for (let i = 0; i < width; i++) {
                if (brightnessByColumn[i].brightness < minBrightness) {
                    minBrightness = brightnessByColumn[i].brightness;
                    gapX = i;
                }
            }

            // TÃ¬m chiá»u rá»™ng cá»§a gap (vÃ¹ng tá»‘i liÃªn tá»¥c)
            const gapThreshold = minBrightness + 30; // Gap thÆ°á»ng cÃ³ Ä‘á»™ sÃ¡ng tÆ°Æ¡ng Ä‘á»‘i Ä‘á»“ng nháº¥t
            let gapStart = gapX;
            let gapEnd = gapX;

            // TÃ¬m báº¯t Ä‘áº§u gap
            for (let i = gapX; i >= 0; i--) {
                if (brightnessByColumn[i].brightness < gapThreshold) {
                    gapStart = i;
                } else {
                    break;
                }
            }

            // TÃ¬m káº¿t thÃºc gap
            for (let i = gapX; i < width; i++) {
                if (brightnessByColumn[i].brightness < gapThreshold) {
                    gapEnd = i;
                } else {
                    break;
                }
            }

            gapWidth = gapEnd - gapStart + 1;
            const gapCenter = Math.floor((gapStart + gapEnd) / 2);

            console.log(`ðŸ“ Gap tÃ¬m tháº¥y tá»«: ${gapStart}px Ä‘áº¿n ${gapEnd}px (chiá»u rá»™ng: ${gapWidth}px)`);
            console.log(`ðŸ“Š TÃ¢m gap: ${gapCenter}px (Ä‘á»™ sÃ¡ng: ${minBrightness.toFixed(0)})`);
            console.log(`ðŸ“Š ChÃªnh lá»‡ch: ${(avgBrightnessValue - minBrightness).toFixed(0)}`);

            // BÆ°á»›c 4: TÃ¬m máº£nh cáº§n kÃ©o (vÃ¹ng sÃ¡ng á»Ÿ bÃªn trÃ¡i)
            console.log('ðŸ” TÃ¬m máº£nh cáº§n kÃ©o (vÃ¹ng sÃ¡ng bÃªn trÃ¡i)...');
            let puzzleX = 0;
            let maxBrightness = 0;
            let puzzleWidth = 0;

            // QuÃ©t bÃªn trÃ¡i 40% Ä‘á»ƒ tÃ¬m máº£nh cáº§n kÃ©o
            const puzzleScanEnd = Math.floor(width * 0.4);
            for (let i = 0; i < puzzleScanEnd; i++) {
                if (brightnessByColumn[i].brightness > maxBrightness) {
                    maxBrightness = brightnessByColumn[i].brightness;
                    puzzleX = i;
                }
            }

            // TÃ¬m chiá»u rá»™ng cá»§a máº£nh cáº§n kÃ©o
            const puzzleThreshold = maxBrightness - 30;
            let puzzleStart = puzzleX;
            let puzzleEnd = puzzleX;

            // TÃ¬m báº¯t Ä‘áº§u máº£nh
            for (let i = puzzleX; i >= 0; i--) {
                if (brightnessByColumn[i].brightness > puzzleThreshold) {
                    puzzleStart = i;
                } else {
                    break;
                }
            }

            // TÃ¬m káº¿t thÃºc máº£nh
            for (let i = puzzleX; i < puzzleScanEnd; i++) {
                if (brightnessByColumn[i].brightness > puzzleThreshold) {
                    puzzleEnd = i;
                } else {
                    break;
                }
            }

            puzzleWidth = puzzleEnd - puzzleStart + 1;
            const puzzleCenter = Math.floor((puzzleStart + puzzleEnd) / 2);

            console.log(`ðŸ“ Máº£nh cáº§n kÃ©o tá»«: ${puzzleStart}px Ä‘áº¿n ${puzzleEnd}px (chiá»u rá»™ng: ${puzzleWidth}px)`);
            console.log(`ðŸ“Š TÃ¢m máº£nh: ${puzzleCenter}px (Ä‘á»™ sÃ¡ng: ${maxBrightness.toFixed(0)})`);

            // BÆ°á»›c 5: TÃ­nh khoáº£ng cÃ¡ch cáº§n kÃ©o
            // Khoáº£ng cÃ¡ch = tÃ¢m gap - tÃ¢m máº£nh cáº§n kÃ©o
            const dragDistance = Math.max(0, gapCenter - puzzleCenter);

            // TÃ­nh % dá»±a trÃªn khoáº£ng cÃ¡ch kÃ©o thá»±c táº¿
            const percentage = Math.round((dragDistance / width) * 100);

            console.log(`ðŸ“Š TÃ¢m máº£nh cáº§n kÃ©o: ${puzzleCenter}px`);
            console.log(`ðŸ“Š TÃ¢m gap: ${gapCenter}px`);
            console.log(`ðŸ“Š Khoáº£ng cÃ¡ch cáº§n kÃ©o: ${dragDistance}px`);
            console.log(`ðŸ“Š Percentage: ${dragDistance}px / ${width}px = ${percentage}%`);

            // Clamp vÃ o khoáº£ng há»£p lÃ½ (5-95%)
            const clampedPercentage = Math.max(5, Math.min(95, percentage));
            if (clampedPercentage !== percentage) {
                console.log(`ðŸ“Š Äiá»u chá»‰nh: ${percentage}% â†’ ${clampedPercentage}%`);
            }

            return {
                percentage: clampedPercentage,
                method: 'basic-brightness-center-distance',
                width: width,
                puzzleCenter: puzzleCenter,
                puzzleStart: puzzleStart,
                puzzleEnd: puzzleEnd,
                puzzleWidth: puzzleWidth,
                gapCenter: gapCenter,
                gapStart: gapStart,
                gapEnd: gapEnd,
                gapWidth: gapWidth,
                dragDistance: dragDistance,
                minBrightness: minBrightness,
                maxBrightness: maxBrightness,
                avgBrightness: avgBrightnessValue
            };
        } catch (error) {
            console.error('âŒ Basic analysis error:', error.message);
            return null;
        }
    }

    /**
     * Solve Geetest V4 captcha
     */
    async solveGeetestV4Captcha(page, apiKey) {
        try {
            console.log('ðŸ” Äang giáº£i Geetest V4 qua API 2Captcha...');

            // Step 1: Get Geetest V4 parameters tá»« page
            const geetestParams = await page.evaluate(() => {
                // TÃ¬m script chá»©a Geetest config
                const scripts = document.querySelectorAll('script');
                let geetestData = null;

                for (const script of scripts) {
                    if (script.textContent && (script.textContent.includes('geetest') || script.textContent.includes('gt4'))) {
                        // Thá»­ extract tá»« script content
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

                // Fallback: TÃ¬m tá»« window object
                if (!geetestData && window.geetest_data) {
                    geetestData = window.geetest_data;
                }

                // Fallback: TÃ¬m tá»« data attributes
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
                console.warn('âš ï¸ KhÃ´ng tÃ¬m tháº¥y tham sá»‘ Geetest V4 trÃªn trang');
                return null;
            }

            console.log('ðŸ“‹ Tham sá»‘ Geetest V4:', geetestParams);

            // Step 2: Submit Geetest V4 task to 2Captcha
            console.log('ðŸ“¤ Gá»­i Geetest V4 tá»›i API 2Captcha...');
            const submitResponse = await fetch('https://api.2captcha.com/createTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: apiKey,
                    task: {
                        type: 'GeeTestTaskProxyless',
                        websiteURL: page.url(),
                        version: 4,
                        initParameters: {
                            captcha_id: geetestParams.captcha_id || geetestParams.gt4
                        }
                    }
                })
            });

            const submitData = await submitResponse.json();
            console.log('ðŸ“¤ Pháº£n há»“i gá»­i:', submitData);

            // Kiá»ƒm tra lá»—i
            if (submitData.errorId !== 0) {
                console.error('âŒ Lá»—i gá»­i Geetest V4:', submitData.errorDescription || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                return null;
            }

            // Get task ID
            const taskId = submitData.taskId;
            if (!taskId) {
                console.error('âŒ KhÃ´ng cÃ³ Task ID Ä‘Æ°á»£c tráº£ vá»');
                return null;
            }

            console.log(`ðŸ“ Geetest V4 Ä‘Ã£ gá»­i, Task ID: ${taskId}`);

            // Step 3: Poll for result (tá»‘i Ä‘a 60 giÃ¢y cho Geetest)
            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 2000));

                const resultResponse = await fetch('https://api.2captcha.com/getTaskResult', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientKey: apiKey,
                        taskId: taskId
                    })
                });
                const resultData = await resultResponse.json();

                if (resultData.errorId === 0 && resultData.status === 'ready' && resultData.solution) {
                    console.log(`âœ… Geetest V4 Ä‘Ã£ giáº£i`);

                    return {
                        success: true,
                        lot_number: resultData.solution.lot_number,
                        pass_token: resultData.solution.pass_token,
                        gen_time: resultData.solution.gen_time,
                        captcha_output: resultData.solution.captcha_output,
                        type: 'geetest_v4'
                    };
                }

                if (i % 10 === 0) {
                    console.log(`â³ Chá» káº¿t quáº£ Geetest V4 (${i}s)...`);
                }
            }

            console.error('âŒ Timeout giáº£i Geetest V4');
            return null;
        } catch (error) {
            console.error('âŒ Geetest V4 solve error:', error.message);
            return null;
        }
    }
}

module.exports = VIPAutomation;








