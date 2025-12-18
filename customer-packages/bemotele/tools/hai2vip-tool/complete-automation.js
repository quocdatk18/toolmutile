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
            return;
        }

        await page.evaluate(() => {
            if (!window.chrome) window.chrome = {};
            if (!window.chrome.runtime) {
                window.chrome.runtime = {
                    sendMessage: async (message, callback) => {
                        if (callback) callback({ success: true });
                    },
                    onMessage: {
                        addListener: (callback) => {
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
                            callback({});
                        },
                        set: (items, callback) => {
                            if (callback) callback();
                        }
                    }
                };
            }
        });

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

        const scriptsLoaded = await page.evaluate(() => {
            return {
                autoRegisterToolLoaded: window.__autoRegisterToolLoaded === true,
                listenerExists: typeof window._chromeMessageListener === 'function'
            };
        });

        if (!scriptsLoaded.listenerExists) {
            
            await page.waitForTimeout(5000);

            const recheckListener = await page.evaluate(() => {
                return typeof window._chromeMessageListener === 'function';
            });

            if (!recheckListener) {
                throw new Error('Content script failed to initialize');
            }

        }

        return scriptsLoaded;
    }

    /**
     * Setup page with scripts
     */
    async setupPage(browser, url) {
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.bringToFront();

        try {
            await page.waitForFunction(() => document.readyState === 'complete', { timeout: 20000 });
        } catch (e) {
        }

        await page.waitForTimeout(5000);

        await this.injectScripts(page);

        await page.waitForTimeout(3000);

        await this.verifyScripts(page);

        return page;
    }

    /**
     * Run complete sequence for one site
     */
    async runSequenceForSite(browser, site, profileData) {

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
