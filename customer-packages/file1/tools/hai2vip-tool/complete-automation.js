/**
 * HAI2VIP Complete Automation
 * Handles full workflow like NOHU tool
 */

const Hai2vipAutomationActions = require('./automation-actions');

class Hai2vipCompleteAutomation {
    constructor(settings, scripts) {
        this.settings = settings;
        this.scripts = scripts;
    }

    /**
     * Inject scripts into page
     */
    async injectScripts(page) {
        // Check if already injected
        const alreadyInjected = await page.evaluate(() => {
            return window.__autoRegisterToolLoaded === true;
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
    }

    /**
     * Verify scripts loaded
     */
    async verifyScripts(page) {
        console.log('    🔍 Verifying scripts loaded...');

        const scriptsLoaded = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.__autoRegisterToolLoaded === true,
                listenerExists: typeof window._chromeMessageListener === 'function'
            };
        });

        console.log('    📊 Scripts status:', scriptsLoaded);

        if (!scriptsLoaded.listenerExists) {
            console.log('    ⚠️  Message listener not registered yet, waiting 5 more seconds...');
            await page.waitForTimeout(5000);

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
     * Setup page with scripts
     */
    async setupPage(browser, url) {
        const page = await browser.newPage();

        console.log('    📄 Opening page:', url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log('    👁️  Focusing on tab...');
        await page.bringToFront();

        console.log('    ⏳ Waiting for page to load...');
        try {
            await page.waitForFunction(() => document.readyState === 'complete', { timeout: 20000 });
            console.log('    ✅ Page loaded');
        } catch (e) {
            console.log('    ⚠️  Timeout, but continuing...');
        }

        await page.waitForTimeout(5000);

        await this.injectScripts(page);

        console.log('    ⏳ Waiting for scripts to initialize...');
        await page.waitForTimeout(3000);

        await this.verifyScripts(page);

        return page;
    }

    /**
     * Run complete sequence for one site
     */
    async runSequenceForSite(browser, site, profileData) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🤖 Starting sequence for: ${site.name}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        const results = {
            site: site.name,
            register: { success: false },
            withdraw: { success: false },
            phone: { success: false },
            promo: { success: false }
        };

        // Setup page
        const page = await this.setupPage(browser, site.url);
        const actions = new Hai2vipAutomationActions(page);

        try {
            // STEP 1: Register
            console.log(`📝 STEP 1: Registering on ${site.name}...`);
            results.register = await actions.completeRegistration(profileData);

            if (!results.register.success) {
                console.log(`❌ Register failed, skipping remaining steps`);
                return results;
            }

            // STEP 2: Withdraw setup (if provided)
            if (profileData.withdrawPassword && profileData.bankAccount && profileData.bankName) {
                console.log(`💰 STEP 2: Setting up withdraw...`);
                results.withdraw = await actions.setupWithdrawAndBank(profileData);
            } else {
                console.log(`⏭️  Skipping withdraw (no bank info)`);
                results.withdraw = { success: true, skipped: true };
            }

            // STEP 3: Phone verification (if API key provided)
            if (profileData.apiKey) {
                console.log(`📱 STEP 3: Verifying phone...`);
                results.phone = await actions.verifyPhone(profileData.apiKey);
            } else {
                console.log(`⏭️  Skipping phone verify (no API key)`);
                results.phone = { success: true, skipped: true };
            }

            // STEP 4: Claim promotion
            console.log(`🎁 STEP 4: Claiming promotion...`);
            results.promo = await actions.claimPromotion();

            console.log(`✅ ${site.name} sequence completed`);
            return results;

        } catch (error) {
            console.error(`❌ ${site.name} sequence failed:`, error);
            return results;
        }
    }
}

module.exports = Hai2vipCompleteAutomation;
