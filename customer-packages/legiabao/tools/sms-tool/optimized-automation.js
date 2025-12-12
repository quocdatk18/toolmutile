// SMS Tool - Optimized Automation (FreeLXB Style)
const puppeteer = require('puppeteer-core');
const axios = require('axios');

class SmsToolOptimized {
    constructor() {
        this.browser = null;
        this.pages = new Map();
        this.siteConfigs = this.initializeSiteConfigs();
        this.results = [];
    }

    initializeSiteConfigs() {
        return {
            // OKVIP Family (Type 1)
            'SHBET': {
                type: 'okvip',
                registerUrl: 'https://shbet800.com/m/register?f=123456&app=1',
                loginUrl: 'https://shbet800.com/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },
            'F8BET': {
                type: 'okvip',
                registerUrl: 'https://f88clbf-io.front.net/Account/Register?f=123456&app=1',
                loginUrl: 'https://f88clbf-io.front.net/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },
            'NEW88': {
                type: 'okvip',
                registerUrl: 'https://555win33.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://555win33.com/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },
            'HI88': {
                type: 'okvip',
                registerUrl: 'https://sa2.xn--8866-um1g.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://sa2.xn--8866-um1g.com/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },
            '789BET': {
                type: 'okvip',
                registerUrl: 'https://789513.com/Account/Register?f=456781&app=1',
                loginUrl: 'https://789513.com/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },
            'MB66': {
                type: 'okvip',
                registerUrl: 'https://ttkm-mb66okvip02.pages.dev/Account/Register?f=123456&app=1',
                loginUrl: 'https://ttkm-mb66okvip02.pages.dev/?app=1',
                selectors: this.getOKVIPSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1000
            },

            // ABCVIP Family (Type 3)
            'J88': {
                type: 'abcvip',
                registerUrl: 'https://j859.xyz/Account/Register?f=123456&app=1',
                loginUrl: 'https://j859.xyz/?app=1',
                selectors: this.getABCVIPSelectors(),
                events: ['focus', 'input', 'change'],
                submitDelay: 800
            },
            'U888': {
                type: 'abcvip',
                registerUrl: 'https://u888qj.link/Account/Register?f=889534&app=1',
                loginUrl: 'https://u888qj.link/?app=1',
                selectors: this.getABCVIPSelectors(),
                events: ['focus', 'input', 'change'],
                submitDelay: 800
            },
            'ABC8': {
                type: 'abcvip',
                registerUrl: 'https://abc29.ink/Account/Register?f=123456&app=1',
                loginUrl: 'https://abc29.ink/?app=1',
                selectors: this.getABCVIPSelectors(),
                events: ['focus', 'input', 'change'],
                submitDelay: 800
            },
            '88CLB': {
                type: 'abcvip',
                registerUrl: 'https://88clb2jt.buzz/Account/Register?f=456781&app=1',
                loginUrl: 'https://88clb2jt.buzz/?app=1',
                selectors: this.getABCVIPSelectors(),
                events: ['focus', 'input', 'change'],
                submitDelay: 800
            },

            // KJC Family (Type 2) - Angular based
            'QQ88': {
                type: 'kjc',
                registerUrl: 'https://www.qq8886.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://www.qq8886.com/?app=1',
                selectors: this.getKJCSelectors(),
                events: ['input', 'blur', 'change'],
                submitDelay: 1500
            },
            'RR88': {
                type: 'kjc',
                registerUrl: 'https://www.rr3311.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://www.rr3311.com/?app=1',
                selectors: this.getKJCSelectors(),
                events: ['input', 'blur', 'change'],
                submitDelay: 1500
            },
            'XX88': {
                type: 'kjc',
                registerUrl: 'https://www.xx88.fun/Account/Register?f=123456&app=1',
                loginUrl: 'https://www.xx88.fun/?app=1',
                selectors: this.getKJCSelectors(),
                events: ['input', 'blur', 'change'],
                submitDelay: 1500
            },
            'MM88': {
                type: 'kjc',
                registerUrl: 'https://www.2mm88.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://www.2mm88.com/?app=1',
                selectors: this.getKJCSelectors(),
                events: ['input', 'blur', 'change'],
                submitDelay: 1500
            },
            'X88': {
                type: 'kjc',
                registerUrl: 'https://www.x88004.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://www.x88004.com/?app=1',
                selectors: this.getKJCSelectors(),
                events: ['input', 'blur', 'change'],
                submitDelay: 1500
            },

            // 78WIN Family
            'JUN88': {
                type: '78win',
                registerUrl: 'https://tangqua88.co/Account/Register?f=123456&app=1',
                loginUrl: 'https://tangqua88.co/?app=1',
                selectors: this.get78WINSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1200
            },
            '78WIN': {
                type: '78win',
                registerUrl: 'https://78king88.com/Account/Register?f=123456&app=1',
                loginUrl: 'https://78king88.com/?app=1',
                selectors: this.get78WINSelectors(),
                events: ['input', 'change', 'blur'],
                submitDelay: 1200
            }
        };
    }

    getOKVIPSelectors() {
        return {
            username: [
                'input[name="username"]',
                'input[placeholder*="tên đăng nhập"]',
                'input[placeholder*="Username"]',
                '.am-input input[type="text"]',
                'input#username',
                '.van-field__control input[type="text"]',
                '.form-control[name="username"]'
            ],
            password: [
                'input[name="password"]',
                'input[placeholder*="mật khẩu"]',
                'input[placeholder*="Password"]',
                '.am-input input[type="password"]',
                'input#password',
                '.van-field__control input[type="password"]',
                '.form-control[type="password"]'
            ],
            confirmPassword: [
                'input[name="confirmPassword"]',
                'input[name="repassword"]',
                'input[placeholder*="nhập lại"]',
                'input[placeholder*="xác nhận"]',
                'input[placeholder*="confirm"]'
            ],
            withdrawPassword: [
                'input[name="withdrawPassword"]',
                'input[name="moneyPassword"]',
                'input[placeholder*="rút tiền"]',
                'input[placeholder*="withdraw"]'
            ],
            fullname: [
                'input[name="fullname"]',
                'input[name="realName"]',
                'input[placeholder*="họ tên"]',
                'input[placeholder*="Real Name"]'
            ],
            phone: [
                'input[name="phone"]',
                'input[name="mobile"]',
                'input[placeholder*="số điện thoại"]',
                'input[type="tel"]'
            ],
            email: [
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="email"]'
            ],
            checkbox: [
                'input[type="checkbox"]',
                '.am-checkbox input',
                '.van-checkbox__icon',
                '.form-check-input'
            ],
            submitButton: [
                'button[type="submit"]',
                '.am-button.primary',
                '.van-button--primary',
                'button:contains("ĐĂNG KÝ")',
                'button:contains("Register")',
                '.btn-primary'
            ],
            captchaImage: [
                'img[src*="captcha"]',
                'img[alt*="captcha"]',
                'img[id*="captcha"]',
                '.captcha img'
            ],
            captchaInput: [
                'input[name*="captcha"]',
                'input[placeholder*="captcha"]',
                'input[id*="captcha"]'
            ]
        };
    }

    getKJCSelectors() {
        return {
            username: [
                'input[formcontrolname="account"]',
                'input[formcontrolname="username"]',
                '.mat-input-element[placeholder*="tên"]',
                'input[name="account"]'
            ],
            password: [
                'input[formcontrolname="password"]',
                '.mat-input-element[type="password"]',
                'input[name="password"]'
            ],
            confirmPassword: [
                'input[formcontrolname="confirmPassword"]',
                'input[formcontrolname="repassword"]'
            ],
            withdrawPassword: [
                'input[formcontrolname="moneyPassword"]',
                'input[formcontrolname="withdrawPassword"]'
            ],
            fullname: [
                'input[formcontrolname="name"]',
                'input[formcontrolname="fullname"]',
                'input[formcontrolname="realName"]'
            ],
            phone: [
                'input[formcontrolname="phone"]',
                'input[formcontrolname="mobile"]'
            ],
            email: [
                'input[formcontrolname="email"]'
            ],
            checkbox: [
                'input[formcontrolname="agree"]',
                '.mat-checkbox input[type="checkbox"]'
            ],
            submitButton: [
                'button.mat-raised-button',
                'button[color="primary"]',
                'button:contains("Đăng ký")',
                '.mat-button-base'
            ],
            captchaImage: [
                'img[src*="captcha"]',
                '.captcha img'
            ],
            captchaInput: [
                'input[formcontrolname="captcha"]',
                'input[name*="captcha"]'
            ]
        };
    }

    getABCVIPSelectors() {
        return {
            username: [
                'input[name="RealName"]',
                'input[placeholder*="Real Name"]',
                '.form-control[name="username"]',
                'input[name="username"]'
            ],
            password: [
                'input[name="Password"]',
                'input[placeholder*="Password"]',
                '.form-control[type="password"]'
            ],
            confirmPassword: [
                'input[name="confirmPassword"]',
                'input[placeholder*="confirm"]'
            ],
            withdrawPassword: [
                'input[name="withdrawPassword"]',
                'input[placeholder*="withdraw"]'
            ],
            fullname: [
                'input[name="fullname"]',
                'input[placeholder*="Full Name"]'
            ],
            phone: [
                'input[name="phone"]',
                'input[type="tel"]'
            ],
            email: [
                'input[name="email"]',
                'input[type="email"]'
            ],
            checkbox: [
                'input[type="checkbox"]',
                '.form-check-input'
            ],
            submitButton: [
                '.btn-primary',
                'button.submit-btn',
                'input[type="submit"]',
                'button:contains("Register")'
            ],
            captchaImage: [
                'img[src*="captcha"]',
                '.captcha img'
            ],
            captchaInput: [
                'input[name*="captcha"]'
            ]
        };
    }

    get78WINSelectors() {
        return {
            username: [
                'input[name="username"]',
                'input[placeholder*="tên đăng nhập"]',
                '.form-control[name="username"]'
            ],
            password: [
                'input[name="password"]',
                'input[type="password"]'
            ],
            confirmPassword: [
                'input[name="confirmPassword"]',
                'input[name="repassword"]'
            ],
            withdrawPassword: [
                'input[name="withdrawPassword"]',
                'input[name="moneyPassword"]'
            ],
            fullname: [
                'input[name="fullname"]',
                'input[name="realName"]'
            ],
            phone: [
                'input[name="phone"]',
                'input[type="tel"]'
            ],
            email: [
                'input[name="email"]',
                'input[type="email"]'
            ],
            checkbox: [
                'input[type="checkbox"]'
            ],
            submitButton: [
                'button[type="submit"]',
                '.btn-primary',
                'button:contains("Đăng ký")'
            ],
            captchaImage: [
                'img[src*="captcha"]'
            ],
            captchaInput: [
                'input[name*="captcha"]'
            ]
        };
    }

    async initialize(profileId = null) {
        console.log('🚀 Initializing SMS Tool Optimized...');

        if (profileId) {
            // Connect to Hidemium profile
            this.browser = await this.connectToHidemium(profileId);
        } else {
            // Fallback to standalone mode (for testing)
            this.browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ],
                defaultViewport: {
                    width: 1366,
                    height: 768
                }
            });
        }

        console.log('✅ Browser initialized');
    }

    async connectToHidemium(profileId) {
        console.log(`🔗 Connecting to Hidemium profile: ${profileId}`);

        try {
            // Use axios like the dashboard does

            // Open profile using the same endpoint as dashboard
            const response = await axios.get('http://127.0.0.1:2222/openProfile', {
                params: {
                    uuid: profileId,
                    command: '--remote-debugging-port=0'
                }
            });

            console.log('📊 Hidemium response:', JSON.stringify(response.data, null, 2));

            if (!response.data) {
                throw new Error('No response data from Hidemium');
            }

            let debugPort = null;

            // Hidemium returns web_socket with actual debug port
            if (response.data.data && response.data.data.web_socket) {
                const wsUrl = response.data.data.web_socket;
                console.log('🔗 WebSocket URL:', wsUrl);

                // Extract port from WebSocket URL like ws://127.0.0.1:9222/devtools/browser/...
                const portMatch = wsUrl.match(/:(\d+)\//);
                if (portMatch) {
                    debugPort = parseInt(portMatch[1]);
                    console.log('🔌 Extracted debug port:', debugPort);
                }
            }

            if (!debugPort) {
                throw new Error('Could not extract debug port from Hidemium response');
            }

            // Connect puppeteer using browserURL (like the old tools)
            console.log('🔗 Connecting puppeteer to:', `http://127.0.0.1:${debugPort}`);
            const browser = await puppeteer.connect({
                browserURL: `http://127.0.0.1:${debugPort}`,
                defaultViewport: null
            });

            console.log('✅ Connected to Hidemium browser');
            return browser;

        } catch (error) {
            console.error('❌ Failed to connect to Hidemium:', error);
            throw error;
        }
    }

    async batchProcess(sites, userData, options = {}) {
        if (!this.browser) {
            await this.initialize(options.profileId);
        }

        console.log(`🚀 Starting batch process for ${sites.length} sites`);
        console.log('🔍 DEBUG - Raw sites data:', JSON.stringify(sites, null, 2));
        console.log('🔍 DEBUG - Available site configs:', Object.keys(this.siteConfigs));
        console.log('📋 Sites:', sites.map(s => s.name).join(', '));

        const results = [];

        // Process sites with controlled concurrency (max 4 concurrent for desktop)
        const chunks = this.chunkArray(sites, 4);

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(site =>
                this.processSingleSite(site, userData, options)
            );

            const chunkResults = await Promise.allSettled(chunkPromises);

            chunkResults.forEach((result, index) => {
                const site = chunk[index];
                if (result.status === 'fulfilled') {
                    results.push({ site: site.name, success: true, data: result.value });
                } else {
                    results.push({ site: site.name, success: false, error: result.reason.message });
                }
            });

            // Small delay between chunks
            if (chunks.indexOf(chunk) < chunks.length - 1) {
                await this.delay(800);
            }
        }

        console.log('✅ Batch process completed');
        return results;
    }

    async processSingleSite(site, userData, options) {
        console.log(`🔍 DEBUG - Processing site:`, JSON.stringify(site, null, 2));
        console.log(`🔍 DEBUG - Looking for config key: "${site.name}"`);

        const config = this.siteConfigs[site.name];
        if (!config) {
            console.error(`❌ Available configs:`, Object.keys(this.siteConfigs));
            console.error(`❌ Requested site name: "${site.name}"`);
            throw new Error(`No config found for site: ${site.name}`);
        }

        console.log(`🎯 Processing ${site.name} (${config.type})...`);

        const page = await this.browser.newPage();
        this.pages.set(site.name, page);

        try {
            // Navigate to register page
            console.log(`📍 Navigating to: ${config.registerUrl}`);
            await page.goto(config.registerUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for page to load
            await this.delay(2000);

            // Auto-detect interface refinements
            const interfaceType = await this.detectInterface(page, config);
            console.log(`🔍 Detected interface: ${interfaceType}`);

            // Smart form filling with interface-specific logic
            const fillResult = await this.smartFillForm(page, config, userData);
            console.log(`📝 Form fill result:`, fillResult);

            // Solve captcha if present
            let captchaResult = null;
            if (options.apiKey) {
                captchaResult = await this.solveCaptcha(page, config, options.apiKey);
                console.log(`🔐 Captcha result:`, captchaResult);
            }

            // Auto-submit if enabled
            let submitResult = null;
            if (options.autoSubmit) {
                submitResult = await this.autoSubmit(page, config);
                console.log(`🚀 Submit result:`, submitResult);
            }

            return {
                interface: interfaceType,
                fillResult,
                captchaResult,
                submitResult,
                url: page.url()
            };

        } catch (error) {
            console.error(`❌ Error processing ${site.name}:`, error);
            throw error;
        } finally {
            // Keep page open for manual verification if needed
            if (!options.keepOpen) {
                await page.close();
                this.pages.delete(site.name);
            }
        }
    }

    async detectInterface(page, config) {
        const url = page.url().toLowerCase();

        // Enhanced DOM structure detection
        const domChecks = await page.evaluate(() => {
            return {
                hasOKVIP: !!(document.querySelector('.am-modal, .van-popup, .am-button') ||
                    document.body.innerHTML.includes('am-') ||
                    document.body.innerHTML.includes('van-')),
                hasKJC: !!(document.querySelector('.mat-select, .mat-option, [formcontrolname]') ||
                    document.body.innerHTML.includes('mat-') ||
                    document.body.innerHTML.includes('formcontrolname')),
                hasABCVIP: !!(document.querySelector('.swal2-popup, .dialog-actions') ||
                    document.body.innerHTML.includes('swal2') ||
                    document.body.innerHTML.includes('RealName')),
                has78WIN: !!(document.querySelector('.78win-specific') ||
                    url.includes('78win') || url.includes('jun88')),
                formStructure: {
                    formCount: document.querySelectorAll('form').length,
                    inputCount: document.querySelectorAll('input').length,
                    hasAngularAttributes: !!document.querySelector('[formcontrolname]'),
                    hasVueAttributes: !!document.querySelector('[v-model]'),
                    hasReactAttributes: !!document.querySelector('[data-reactroot]')
                }
            };
        });

        console.log(`🔍 Enhanced DOM analysis:`, domChecks);

        // Smart interface detection with fallbacks
        if (domChecks.hasKJC || domChecks.formStructure.hasAngularAttributes) {
            return 'kjc_angular';
        } else if (domChecks.hasOKVIP) {
            return 'okvip_vue';
        } else if (domChecks.hasABCVIP) {
            return 'abcvip_jquery';
        } else if (domChecks.has78WIN) {
            return '78win_custom';
        }

        return config.type + '_detected';
    }

    async smartFillForm(page, config, userData) {
        console.log(`📝 Starting smart form fill for ${config.type}...`);

        const results = {};
        const selectors = config.selectors;

        // Interface-specific pre-fill actions
        await this.performPreFillActions(page, config);

        // Fill all fields in parallel with interface-specific optimizations
        const fillPromises = [];

        // Username
        if (userData.username) {
            fillPromises.push(
                this.smartFillField(page, selectors.username, userData.username, 'username', config)
                    .then(success => { results.username = success; })
            );
        }

        // Password
        if (userData.password) {
            fillPromises.push(
                this.smartFillField(page, selectors.password, userData.password, 'password', config)
                    .then(success => { results.password = success; })
            );
        }

        // Confirm Password
        if (userData.password) {
            fillPromises.push(
                this.smartFillField(page, selectors.confirmPassword, userData.password, 'confirmPassword', config)
                    .then(success => { results.confirmPassword = success; })
            );
        }

        // Withdraw Password
        if (userData.withdrawPassword) {
            fillPromises.push(
                this.smartFillField(page, selectors.withdrawPassword, userData.withdrawPassword, 'withdrawPassword', config)
                    .then(success => { results.withdrawPassword = success; })
            );
        }

        // Full Name
        if (userData.fullname) {
            fillPromises.push(
                this.smartFillField(page, selectors.fullname, userData.fullname, 'fullname', config)
                    .then(success => { results.fullname = success; })
            );
        }

        // Phone
        if (userData.phone) {
            fillPromises.push(
                this.smartFillField(page, selectors.phone, userData.phone, 'phone', config)
                    .then(success => { results.phone = success; })
            );
        }

        // Email
        if (userData.email) {
            fillPromises.push(
                this.smartFillField(page, selectors.email, userData.email, 'email', config)
                    .then(success => { results.email = success; })
            );
        }

        // Wait for all fills to complete
        await Promise.all(fillPromises);

        // Handle checkbox with interface-specific logic
        await this.handleCheckbox(page, config, results);

        console.log('✅ Form fill completed:', results);
        return results;
    }

    async performPreFillActions(page, config) {
        // Interface-specific pre-fill actions
        switch (config.type) {
            case 'kjc':
                // Wait for Angular to initialize
                await page.waitForTimeout(1000);
                break;
            case 'okvip':
                // Wait for Vue components to load
                await page.waitForTimeout(800);
                break;
            case 'abcvip':
                // Wait for jQuery to load
                await page.waitForTimeout(600);
                break;
        }
    }

    async smartFillField(page, selectors, value, fieldName, config) {
        try {
            const element = await this.findElement(page, selectors);
            if (!element) {
                console.log(`⚠️ ${fieldName} field not found`);
                return false;
            }

            // Interface-specific filling strategy
            switch (config.type) {
                case 'kjc':
                    return await this.fillKJCField(page, element, value, fieldName);
                case 'okvip':
                    return await this.fillOKVIPField(page, element, value, fieldName);
                case 'abcvip':
                    return await this.fillABCVIPField(page, element, value, fieldName);
                default:
                    return await this.fillGenericField(page, element, value, fieldName);
            }
        } catch (error) {
            console.error(`❌ Error filling ${fieldName}:`, error);
            return false;
        }
    }

    async fillKJCField(page, element, value, fieldName) {
        // KJC/Angular specific filling
        await element.click();
        await this.delay(100);
        await element.evaluate(el => el.value = '');
        await element.type(value, { delay: 30 });

        // Angular specific events
        await page.evaluate((el) => {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element);

        await this.delay(200);
        return await this.verifyFieldValue(page, element, value, fieldName);
    }

    async fillOKVIPField(page, element, value, fieldName) {
        // OKVIP/Vue specific filling
        await element.focus();
        await this.delay(50);
        await element.evaluate(el => el.value = '');
        await element.type(value, { delay: 50 });

        // Vue specific events
        await page.evaluate((el) => {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element);

        await this.delay(150);
        return await this.verifyFieldValue(page, element, value, fieldName);
    }

    async fillABCVIPField(page, element, value, fieldName) {
        // ABCVIP/jQuery specific filling
        await element.focus();
        await this.delay(100);
        await element.click({ clickCount: 3 }); // Select all
        await element.type(value, { delay: 40 });

        // jQuery specific events
        await page.evaluate((el) => {
            el.dispatchEvent(new Event('focus', { bubbles: true }));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, element);

        await this.delay(100);
        return await this.verifyFieldValue(page, element, value, fieldName);
    }

    async fillGenericField(page, element, value, fieldName) {
        // Generic filling method
        await element.click({ clickCount: 3 });
        await element.type(value, { delay: 50 });

        await page.evaluate((el) => {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
        }, element);

        await this.delay(100);
        return await this.verifyFieldValue(page, element, value, fieldName);
    }

    async verifyFieldValue(page, element, expectedValue, fieldName) {
        const actualValue = await page.evaluate(el => el.value, element);
        const success = actualValue === expectedValue;

        if (success) {
            console.log(`✅ ${fieldName} filled successfully`);
            // Highlight success
            await page.evaluate((el) => {
                el.style.border = '3px solid #00ff00';
                el.style.boxShadow = '0 0 15px #00ff00';
                setTimeout(() => {
                    el.style.border = '';
                    el.style.boxShadow = '';
                }, 2000);
            }, element);
        } else {
            console.log(`❌ ${fieldName} fill failed. Expected: ${expectedValue}, Got: ${actualValue}`);
        }

        return success;
    }

    async handleCheckbox(page, config, results) {
        try {
            const checkbox = await this.findElement(page, config.selectors.checkbox);
            if (checkbox) {
                const isChecked = await page.evaluate(el => el.checked, checkbox);
                if (!isChecked) {
                    await checkbox.click();
                    await this.delay(200);
                    results.checkbox = true;
                } else {
                    results.checkbox = true;
                }
            }
        } catch (error) {
            console.log('⚠️ No checkbox found or error clicking');
            results.checkbox = false;
        }
    }

    async findElement(page, selectors) {
        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, { timeout: 1000 });
                const element = await page.$(selector);

                if (element) {
                    const isVisible = await page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        return rect.width > 0 && rect.height > 0 &&
                            style.display !== 'none' && style.visibility !== 'hidden';
                    }, element);

                    if (isVisible) {
                        console.log(`✅ Found element with selector: ${selector}`);
                        return element;
                    }
                }
            } catch (error) {
                // Continue to next selector
            }
        }

        return null;
    }

    async solveCaptcha(page, config, apiKey) {
        try {
            const captchaImg = await this.findElement(page, config.selectors.captchaImage);
            if (!captchaImg) {
                console.log('ℹ️ No captcha found');
                return { found: false };
            }

            console.log('🔍 Found captcha, solving...');

            // Get image as base64
            const imageBase64 = await page.evaluate((img) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL('image/png').split(',')[1];
            }, captchaImg);

            // Solve via API
            const solution = await this.callCaptchaAPI(imageBase64, apiKey);

            if (solution.success) {
                const captchaInput = await this.findElement(page, config.selectors.captchaInput);
                if (captchaInput) {
                    await this.smartFillField(page, [captchaInput], solution.text, 'captcha', config);
                    console.log('✅ Captcha solved and filled:', solution.text);
                    return { found: true, solved: true, text: solution.text };
                }
            }

            return { found: true, solved: false, error: solution.error };
        } catch (error) {
            console.error('❌ Captcha solving error:', error);
            return { found: true, solved: false, error: error.message };
        }
    }

    async callCaptchaAPI(imageBase64, apiKey) {
        // Implement your captcha API call here
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, text: 'ABCD' });
            }, 2000);
        });
    }

    async autoSubmit(page, config) {
        try {
            const submitButton = await this.findElement(page, config.selectors.submitButton);
            if (!submitButton) {
                console.log('⚠️ Submit button not found');
                return { success: false, error: 'Submit button not found' };
            }

            console.log('🎯 Found submit button, clicking...');

            // Wait for interface-specific delay
            await this.delay(config.submitDelay);

            await submitButton.click();

            // Wait for response
            await this.delay(3000);

            console.log('✅ Form submitted');
            return { success: true, url: page.url() };
        } catch (error) {
            console.error('❌ Submit error:', error);
            return { success: false, error: error.message };
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    // Utility methods
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = SmsToolOptimized;