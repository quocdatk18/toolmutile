/**
 * NOHU Tool - Automation Logic
 * This file handles the automation workflow for NOHU tool
 */

const puppeteer = require('puppeteer-core');
const ApiKeyValidator = require('./validate-api-key');

// Helper function to replace deprecated page.waitForTimeout()
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class NohuAutomation {
    constructor(profileId, config) {
        this.profileId = profileId;
        this.config = config;
        this.browser = null;
        this.page = null;
    }

    /**
     * Run full automation sequence
     */
    async runFullSequence() {
        console.log('🚀 Starting NOHU automation...');
        console.log('Profile:', this.profileId);
        console.log('Sites:', this.config.sites.length);

        try {
            // Validate API key first
            await this.validateApiKey();

            // Connect to Hidemium profile
            await this.connectToProfile();

            // Run automation for each site
            for (const site of this.config.sites) {
                console.log(`\n📍 Processing site: ${site.name}`);

                try {
                    // 1. Register
                    await this.register(site);

                    // 2. Login
                    await this.login(site);

                    // 3. Add Bank
                    if (this.config.bankName) {
                        await this.addBank(site);
                    }

                    // 4. Check Promo
                    await this.checkPromo(site);

                    console.log(`✅ ${site.name} completed`);
                } catch (error) {
                    console.error(`❌ ${site.name} failed:`, error.message);
                }
            }

            return {
                success: true,
                message: 'Automation completed'
            };
        } catch (error) {
            console.error('❌ Automation failed:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Validate API key before running automation
     */
    async validateApiKey() {
        console.log('🔑 Validating API key...');

        const validator = new ApiKeyValidator();

        // Check if API key exists
        if (!validator.hasApiKey()) {
            throw new Error('API key not found. Please add API key in Settings.');
        }

        // Validate API key (format + balance)
        const result = await validator.validate();

        if (!result.valid) {
            throw new Error(`API key validation failed: ${result.error}`);
        }

        console.log(`✅ API key valid - ${result.message}`);

        // Warn if balance is low
        if (result.balance < 1) {
            console.warn('⚠️  Warning: API balance is low ($' + result.balance.toFixed(2) + ')');
        }
    }

    /**
     * Connect to Hidemium profile
     */
    async connectToProfile() {
        console.log('🔌 Connecting to profile...');

        // Get debug port from Hidemium
        const axios = require('axios');
        const response = await axios.get('http://127.0.0.1:2222/openProfile', {
            params: {
                uuid: this.profileId,
                command: '--remote-debugging-port=0'
            }
        });

        if (!response.data || !response.data.debugPort) {
            throw new Error('Failed to get debug port from Hidemium');
        }

        const debugPort = response.data.debugPort;
        console.log('Debug port:', debugPort);

        // Connect puppeteer
        this.browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${debugPort}`,
            defaultViewport: null
        });

        const pages = await this.browser.pages();
        this.page = pages[0] || await this.browser.newPage();

        console.log('✅ Connected to profile');
    }

    /**
     * Register account
     */
    async register(site) {
        console.log(`📝 Registering on ${site.name}...`);

        // Navigate to register URL
        await this.page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for page to load
        await wait(2000);

        // TODO: Implement actual registration logic
        // This depends on the site structure
        // For now, just log
        console.log(`⏭️ Registration logic not implemented for ${site.name}`);
    }

    /**
     * Login to account
     */
    async login(site) {
        console.log(`🔐 Logging in to ${site.name}...`);

        // TODO: Implement login logic
        console.log(`⏭️ Login logic not implemented for ${site.name}`);
    }

    /**
     * Add bank account
     */
    async addBank(site) {
        console.log(`💳 Adding bank to ${site.name}...`);

        // TODO: Implement add bank logic
        console.log(`⏭️ Add bank logic not implemented for ${site.name}`);
    }

    /**
     * Check promotions
     */
    async checkPromo(site) {
        console.log(`🎁 Checking promos on ${site.name}...`);

        // TODO: Implement check promo logic
        console.log(`⏭️ Check promo logic not implemented for ${site.name}`);
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

module.exports = NohuAutomation;
