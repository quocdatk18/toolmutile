/**
 * HAI2VIP Tool - Automation Logic
 * This file handles the automation workflow for HAI2VIP tool (22vip platform)
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const Hai2vipCompleteAutomation = require('./complete-automation');

class Hai2vipAutomation {
    constructor(profileId, config) {
        this.profileId = profileId;
        this.config = config;
        this.browser = null;
        this.page = null;

        // Load extension scripts
        this.scripts = this.loadScripts();

        // Create automation instance
        this.automation = new Hai2vipCompleteAutomation(config, this.scripts);
    }

    /**
     * Load extension scripts
     */
    loadScripts() {
        const extensionPath = path.join(__dirname, 'extension');

        return {
            background: fs.readFileSync(path.join(extensionPath, 'background.js'), 'utf8'),
            content: fs.readFileSync(path.join(extensionPath, 'content.js'), 'utf8')
        };
    }

    /**
     * Run full automation sequence - PARALLEL (like NOHU tool)
     */
    async runFullSequence() {
        console.log('🚀 Starting HAI2VIP automation...');
        console.log('Profile:', this.profileId);
        console.log('Sites:', this.config.sites.length);

        try {
            // Connect to Hidemium profile
            await this.connectToProfile();

            // Prepare profile data
            const profileData = {
                username: this.config.username,
                password: this.config.password,
                fullname: this.config.fullname,
                withdrawPassword: this.config.withdrawPassword,
                bankAccount: this.config.accountNumber,
                bankName: this.config.bankName,
                apiKey: this.config.apiKey
            };

            // Run automation for all sites in PARALLEL
            console.log(`\n🚀 Starting ${this.config.sites.length} sites in PARALLEL...`);

            const sitePromises = this.config.sites.map(async (site) => {
                try {
                    const result = await this.automation.runSequenceForSite(
                        this.browser,
                        site,
                        profileData
                    );

                    return {
                        site: site.name,
                        success: true,
                        result
                    };

                } catch (error) {
                    console.error(`❌ ${site.name} failed:`, error.message);
                    return {
                        site: site.name,
                        success: false,
                        error: error.message
                    };
                }
            });

            // Wait for all sites to complete
            const results = await Promise.all(sitePromises);

            console.log('\n📊 Summary:');
            results.forEach(r => {
                console.log(`   ${r.success ? '✅' : '❌'} ${r.site}`);
            });

            return {
                success: true,
                message: 'Automation completed',
                results
            };
        } catch (error) {
            console.error('❌ Automation failed:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            console.log('⏸️  Keeping browser open for inspection...');
            // Don't cleanup immediately - let user see results
            // await this.cleanup();
        }
    }

    /**
     * Connect to Hidemium profile
     */
    async connectToProfile() {
        console.log('🔌 Connecting to profile...');
        console.log('Profile ID:', this.profileId);

        // Get debug port from Hidemium
        const axios = require('axios');

        try {
            const response = await axios.get('http://127.0.0.1:2222/openProfile', {
                params: {
                    uuid: this.profileId,
                    command: '--remote-debugging-port=0'
                }
            });

            console.log('📊 Hidemium response:', JSON.stringify(response.data, null, 2));

            if (!response.data) {
                throw new Error('No response data from Hidemium');
            }

            // Extract debug port from web_socket URL (most reliable method)
            let debugPort = null;

            // Hidemium returns web_socket with actual debug port
            if (response.data.data && response.data.data.web_socket) {
                const wsUrl = response.data.data.web_socket;
                console.log('🔍 Extracting port from web_socket:', wsUrl);

                // Extract port from ws://127.0.0.1:PORT/...
                const match = wsUrl.match(/:(\d+)\//);
                if (match) {
                    debugPort = parseInt(match[1]);
                    console.log('✅ Extracted debug port from web_socket:', debugPort);
                }
            }

            // Fallback to other fields if web_socket extraction failed
            if (!debugPort) {
                console.log('⚠️ web_socket extraction failed, trying other fields...');
                debugPort = response.data.debugPort ||
                    response.data.debug_port ||
                    response.data.port ||
                    response.data.remote_port ||
                    (response.data.data && response.data.data.remote_port);
            }

            console.log('🎯 Final debugPort:', debugPort);

            if (!debugPort) {
                console.error('❌ Response data:', response.data);
                throw new Error('Debug port not found in response. Response: ' + JSON.stringify(response.data));
            }

            console.log('✅ Debug port:', debugPort);

            // Wait a bit for profile to fully start
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Connect puppeteer
            console.log('🔗 Connecting puppeteer to:', `http://127.0.0.1:${debugPort}`);
            this.browser = await puppeteer.connect({
                browserURL: `http://127.0.0.1:${debugPort}`,
                defaultViewport: null
            });

            const pages = await this.browser.pages();
            this.page = pages[0] || await this.browser.newPage();

            console.log('✅ Connected to profile successfully');

        } catch (error) {
            console.error('❌ Failed to connect to profile:', error.message);
            console.error('Error details:', error);
            throw error;
        }
    }

    /**
     * Run Register Only
     */
    async runRegisterOnly() {
        console.log('📝 Starting REGISTER ONLY automation...');

        try {
            await this.connectToProfile();

            for (const site of this.config.sites) {
                console.log(`\n📍 Registering on: ${site.name}`);

                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                await this.injectScripts(page);
                await page.waitForTimeout(2000);

                // Trigger register only
                await page.evaluate((config) => {
                    console.log('🚀 Triggering REGISTER with:', config);
                    // Extension will handle registration
                }, {
                    username: this.config.username,
                    password: this.config.password,
                    fullname: this.config.fullname
                });

                await page.waitForTimeout(15000);
                console.log(`✅ ${site.name} registration completed`);
            }

            return { success: true, message: 'Register completed' };
        } catch (error) {
            console.error('❌ Register failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run Login Only
     */
    async runLoginOnly() {
        console.log('🔐 Starting LOGIN ONLY automation...');

        try {
            await this.connectToProfile();

            for (const site of this.config.sites) {
                console.log(`\n📍 Logging in to: ${site.name}`);

                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                await this.injectScripts(page);
                await page.waitForTimeout(2000);

                // Trigger login only
                await page.evaluate((config) => {
                    console.log('🚀 Triggering LOGIN with:', config);
                    // Extension will handle login
                }, {
                    username: this.config.username,
                    password: this.config.password
                });

                await page.waitForTimeout(10000);
                console.log(`✅ ${site.name} login completed`);
            }

            return { success: true, message: 'Login completed' };
        } catch (error) {
            console.error('❌ Login failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run Withdraw Setup Only
     */
    async runWithdrawOnly() {
        console.log('💰 Starting WITHDRAW SETUP ONLY automation...');

        try {
            await this.connectToProfile();

            for (const site of this.config.sites) {
                console.log(`\n📍 Setting up withdraw on: ${site.name}`);

                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                await this.injectScripts(page);
                await page.waitForTimeout(2000);

                // Trigger withdraw setup
                await page.evaluate((config) => {
                    console.log('🚀 Triggering WITHDRAW SETUP with:', config);
                    // Extension will handle withdraw setup
                }, {
                    withdrawPassword: this.config.withdrawPassword,
                    bankAccount: this.config.accountNumber,
                    bankName: this.config.bankName
                });

                await page.waitForTimeout(15000);
                console.log(`✅ ${site.name} withdraw setup completed`);
            }

            return { success: true, message: 'Withdraw setup completed' };
        } catch (error) {
            console.error('❌ Withdraw setup failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run Phone Verification Only
     */
    async runPhoneVerifyOnly() {
        console.log('📱 Starting PHONE VERIFICATION ONLY automation...');

        try {
            await this.connectToProfile();

            for (const site of this.config.sites) {
                console.log(`\n📍 Verifying phone on: ${site.name}`);

                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                await this.injectScripts(page);
                await page.waitForTimeout(2000);

                // Trigger phone verification
                await page.evaluate((apiKey) => {
                    console.log('🚀 Triggering PHONE VERIFICATION');
                    // Extension will handle phone verification
                }, this.config.apiKey);

                await page.waitForTimeout(30000);
                console.log(`✅ ${site.name} phone verification completed`);
            }

            return { success: true, message: 'Phone verification completed' };
        } catch (error) {
            console.error('❌ Phone verification failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run Promotion Claim Only
     */
    async runPromoOnly() {
        console.log('🎁 Starting PROMOTION CLAIM ONLY automation...');

        try {
            await this.connectToProfile();

            for (const site of this.config.sites) {
                console.log(`\n📍 Claiming promotion on: ${site.name}`);

                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                await this.injectScripts(page);
                await page.waitForTimeout(2000);

                // Trigger promotion claim
                await page.evaluate(() => {
                    console.log('🚀 Triggering PROMOTION CLAIM');
                    // Extension will handle promotion claim
                });

                await page.waitForTimeout(10000);
                console.log(`✅ ${site.name} promotion claimed`);
            }

            return { success: true, message: 'Promotion claim completed' };
        } catch (error) {
            console.error('❌ Promotion claim failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Inject extension scripts into page
     */
    async injectScripts(page) {
        console.log('    💉 Injecting chrome.runtime mock...');

        // Mock chrome.runtime for extension compatibility
        await page.evaluate(() => {
            if (!window.chrome) window.chrome = {};
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    sendMessage: async (message, callback) => {
                        console.log('📤 Mock sendMessage:', message);
                        if (callback) callback({ success: true });
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

            if (!window.chrome.storage) {
                window.chrome.storage = {
                    local: {
                        get: (keys, callback) => {
                            console.log('📦 Mock storage.get:', keys);
                            callback({});
                        },
                        set: (items, callback) => {
                            console.log('💾 Mock storage.set:', items);
                            if (callback) callback();
                        }
                    }
                };
            }
        });

        console.log('    💉 Injecting content.js...');
        console.log('    📏 Content.js size:', this.scripts.content.length, 'characters');

        try {
            await page.evaluate(this.scripts.content);
            console.log('    ✅ Content.js injected successfully');
        } catch (error) {
            console.error('    ❌ Failed to inject content.js:', error.message);
            throw error;
        }

        // Verify injection
        const injected = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.__autoRegisterToolLoaded === true,
                hasListener: typeof window._chromeMessageListener === 'function',
                hasChromeRuntime: typeof window.chrome?.runtime?.onMessage?.addListener === 'function'
            };
        });

        console.log('    📊 Injection status:', injected);

        if (!injected.autoRegisterToolLoaded) {
            console.warn('    ⚠️ autoRegisterToolLoaded flag not set');
        }

        console.log('    ✅ Scripts injected');
    }

    /**
     * Run auto sequence via extension
     */
    async runAutoSequence(page, site) {
        console.log('    🎬 Starting auto sequence (like NOHU tool)...');

        try {
            // Verify listener exists
            console.log('    🔍 Verifying message listener...');
            const hasListener = await page.evaluate(() => {
                return typeof window._chromeMessageListener === 'function';
            });

            if (!hasListener) {
                console.error('    ❌ Message listener not found! Scripts may not be loaded correctly.');
                return { success: false, message: 'Message listener not found' };
            }
            console.log('    ✅ Message listener verified');

            // STEP 1: Trigger registration (don't await inside evaluate)
            console.log('    📝 Step 1: Triggering registration...');
            await page.evaluate((config) => {
                console.log('🚀 Triggering autoFill with config:', config);
                console.log('🔍 Listener type:', typeof window._chromeMessageListener);

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'autoFill',
                            data: {
                                username: config.username,
                                password: config.password,
                                fullname: config.fullname,
                                autoSubmit: true
                            }
                        },
                        {},
                        (response) => console.log('📝 Register response:', response)
                    );
                } else {
                    console.error('⚠️ Chrome message listener not found!');
                }
            }, {
                username: this.config.username,
                password: this.config.password,
                fullname: this.config.fullname
            });

            // Wait for registration to complete
            console.log('    ⏳ Waiting for registration (10s)...');
            await page.waitForTimeout(10000);

            // STEP 2: Setup withdraw (if provided)
            if (this.config.withdrawPassword && this.config.accountNumber && this.config.bankName) {
                console.log('    💰 Step 2: Triggering withdraw setup...');
                await page.evaluate((config) => {
                    console.log('💰 Triggering goToWithdraw with config:', config);
                    if (window._chromeMessageListener) {
                        window._chromeMessageListener(
                            {
                                action: 'goToWithdraw',
                                data: {
                                    withdrawPassword: config.withdrawPassword,
                                    bankAccount: config.bankAccount,
                                    bankName: config.bankName
                                }
                            },
                            {},
                            (response) => console.log('💰 Withdraw response:', response)
                        );
                    }
                }, {
                    withdrawPassword: this.config.withdrawPassword,
                    bankAccount: this.config.accountNumber,
                    bankName: this.config.bankName
                });

                // Wait for withdraw setup
                console.log('    ⏳ Waiting for withdraw setup (15s)...');
                await page.waitForTimeout(15000);
            }

            // STEP 3: Phone verification (if API key provided)
            if (this.config.apiKey) {
                console.log('    📱 Step 3: Triggering phone verification...');
                await page.evaluate((config) => {
                    console.log('📱 Triggering verifyPhone with API key');
                    if (window._chromeMessageListener) {
                        window._chromeMessageListener(
                            {
                                action: 'verifyPhone',
                                data: {
                                    apiKey: config.apiKey
                                }
                            },
                            {},
                            (response) => console.log('📱 Phone response:', response)
                        );
                    }
                }, {
                    apiKey: this.config.apiKey
                });

                // Wait for phone verification
                console.log('    ⏳ Waiting for phone verification (20s)...');
                await page.waitForTimeout(20000);
            }

            // STEP 4: Claim promotion
            console.log('    🎁 Step 4: Triggering promotion claim...');
            await page.evaluate(() => {
                console.log('🎁 Triggering claimPromotion');
                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        {
                            action: 'claimPromotion',
                            data: {}
                        },
                        {},
                        (response) => console.log('🎁 Promo response:', response)
                    );
                }
            });

            // Wait for promo claim
            console.log('    ⏳ Waiting for promo claim (10s)...');
            await page.waitForTimeout(10000);

            console.log('    ✅ Auto sequence completed');
            return { success: true, message: 'Auto sequence completed' };

        } catch (error) {
            console.error('    ❌ Auto sequence error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up...');

        if (this.browser) {
            await this.browser.disconnect();
        }

        console.log('✅ Cleanup complete');
    }
}

module.exports = Hai2vipAutomation;
