/**
 * SMS Auto Sequence - Optimized workflow (FreeLXB Style)
 * Register → Login → Add Bank (no check promo)
 * 
 * Now using optimized automation engine for better speed and accuracy
 */

const SmsToolOptimized = require('./optimized-automation');

class SMSAutoSequence {
    constructor(settings, scripts) {
        this.settings = settings;
        this.automation = new SmsToolOptimized();
        this.isInitialized = false;
    }

    async initialize(profileId = null) {
        if (!this.isInitialized) {
            await this.automation.initialize(profileId);
            this.isInitialized = true;
            console.log('✅ SMS Tool Optimized initialized');
        }
    }

    /**
     * Run SMS sequence for one site using optimized automation
     * Register → Auto-redirect to bank page (optimized flow)
     */
    async runSequenceForSite(browser, site, profileData, profileId = null) {
        await this.initialize(profileId);

        const siteName = site.name;
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🚀 Starting OPTIMIZED SMS sequence for: ${siteName}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        console.log(`📍 Register URL: ${site.registerUrl}`);
        console.log(`📍 Withdraw URL: ${site.withdrawUrl}`);
        console.log(`📍 Check URL: ${site.checkUrl}\n`);

        const results = {
            site: siteName,
            category: site.category,
            register: { success: false },
            login: { success: true, skipped: true, message: 'SMS mode - auto login after register' },
            addBank: { success: false },
            checkPromo: { success: true, skipped: true, message: 'SMS mode - no promo check' }
        };

        try {
            // Convert site data to optimized format
            const siteData = {
                name: siteName,
                category: site.category,
                registerUrl: site.registerUrl,
                withdrawUrl: site.withdrawUrl,
                checkUrl: site.checkUrl
            };

            // Prepare user data for optimized automation
            const userData = {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                phone: profileData.phone,
                email: profileData.email
            };

            // Options for optimized processing
            const options = {
                autoSubmit: this.settings.autoSubmit || false,
                keepOpen: this.settings.keepOpen || false,
                apiKey: this.settings.apiKey || profileData.apiKey,
                profileId: profileId
            };

            console.log(`🚀 STEP 1/1: Running optimized SMS automation for ${siteName}...`);

            // Use optimized automation
            const automationResult = await this.automation.processSingleSite(siteData, userData, options);

            if (automationResult.success) {
                console.log(`✅ ${siteName} processed successfully!`);

                // Map results to expected format
                results.register.success = true;
                results.register.data = automationResult.data;

                // SMS sites typically auto-redirect after registration
                results.addBank.success = true;
                results.addBank.message = 'Auto-redirected to bank page after registration';

            } else {
                console.log(`❌ ${siteName} processing failed:`, automationResult.error);
                results.register.error = automationResult.error;
            }

        } catch (error) {
            console.error(`❌ Error in optimized SMS sequence for ${siteName}:`, error);
            results.register.error = error.message;
        }

        console.log(`\n📊 Final Results for ${siteName}:`);
        console.log(`   Register: ${results.register.success ? '✅' : '❌'}`);
        console.log(`   Login: ${results.login.success ? '✅' : '❌'} (${results.login.message || 'Auto'})`);
        console.log(`   Add Bank: ${results.addBank.success ? '✅' : '❌'}`);
        console.log(`   Check Promo: ${results.checkPromo.success ? '✅' : '❌'} (${results.checkPromo.message || 'Skipped'})`);

        return results;
    }

    /**
     * Run batch sequence for multiple SMS sites
     */
    async runBatchSequence(browser, sites, profileData, profileId = null) {
        await this.initialize(profileId);

        console.log(`\n🚀 Starting OPTIMIZED SMS batch sequence for ${sites.length} sites`);

        try {
            // Prepare sites data
            const sitesData = sites.map(site => ({
                name: site.name,
                category: site.category,
                registerUrl: site.registerUrl,
                withdrawUrl: site.withdrawUrl,
                checkUrl: site.checkUrl
            }));

            // Prepare user data
            const userData = {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                phone: profileData.phone,
                email: profileData.email
            };

            // Options for batch processing
            const options = {
                autoSubmit: this.settings.autoSubmit || false,
                keepOpen: this.settings.keepOpen || false,
                apiKey: this.settings.apiKey || profileData.apiKey,
                profileId: profileId
            };

            // Use optimized batch processing
            const batchResults = await this.automation.batchProcess(sitesData, userData, options);

            // Convert results to expected format
            const results = batchResults.map(result => ({
                site: result.site,
                category: sitesData.find(s => s.name === result.site)?.category || 'unknown',
                register: {
                    success: result.success,
                    data: result.data,
                    error: result.error
                },
                login: {
                    success: true,
                    skipped: true,
                    message: 'SMS mode - auto login after register'
                },
                addBank: {
                    success: result.success,
                    message: 'Auto-redirected to bank page after registration'
                },
                checkPromo: {
                    success: true,
                    skipped: true,
                    message: 'SMS mode - no promo check'
                }
            }));

            console.log(`\n📊 SMS Batch Results Summary:`);
            const successful = results.filter(r => r.register.success).length;
            console.log(`   Total: ${results.length}`);
            console.log(`   Successful: ${successful}`);
            console.log(`   Failed: ${results.length - successful}`);
            console.log(`   Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

            // Group by category
            const byCategory = {};
            results.forEach(result => {
                const cat = result.category;
                if (!byCategory[cat]) byCategory[cat] = { total: 0, successful: 0 };
                byCategory[cat].total++;
                if (result.register.success) byCategory[cat].successful++;
            });

            console.log(`\n📊 Results by Category:`);
            Object.entries(byCategory).forEach(([category, stats]) => {
                const rate = ((stats.successful / stats.total) * 100).toFixed(1);
                console.log(`   ${category.toUpperCase()}: ${stats.successful}/${stats.total} (${rate}%)`);
            });

            return results;

        } catch (error) {
            console.error(`❌ Error in SMS batch sequence:`, error);
            return sites.map(site => ({
                site: site.name,
                category: site.category,
                register: { success: false, error: error.message },
                login: { success: true, skipped: true, message: 'SMS mode - auto login after register' },
                addBank: { success: false, error: error.message },
                checkPromo: { success: true, skipped: true, message: 'SMS mode - no promo check' }
            }));
        }
    }

    /**
     * Run check sequence for existing accounts (SMS specific)
     */
    async runCheckSequence(browser, sites, profileData) {
        await this.initialize();

        console.log(`\n🔍 Starting SMS check sequence for ${sites.length} sites`);

        const results = [];

        for (const site of sites) {
            console.log(`\n🔍 Checking ${site.name}...`);

            try {
                // For SMS check, we typically just visit the check URL
                const page = await browser.newPage();

                if (site.checkUrl) {
                    await page.goto(site.checkUrl, { waitUntil: 'networkidle2' });

                    // Simple check - look for success indicators
                    const isLoggedIn = await page.evaluate(() => {
                        const indicators = [
                            'balance', 'wallet', 'profile', 'logout',
                            'dashboard', 'account', 'withdraw'
                        ];

                        const bodyText = document.body.textContent.toLowerCase();
                        return indicators.some(indicator => bodyText.includes(indicator));
                    });

                    results.push({
                        site: site.name,
                        category: site.category,
                        success: isLoggedIn,
                        message: isLoggedIn ? 'Account accessible' : 'Account not accessible',
                        url: page.url()
                    });

                } else {
                    results.push({
                        site: site.name,
                        category: site.category,
                        success: false,
                        message: 'No check URL provided'
                    });
                }

                await page.close();

            } catch (error) {
                console.error(`❌ Error checking ${site.name}:`, error);
                results.push({
                    site: site.name,
                    category: site.category,
                    success: false,
                    error: error.message
                });
            }

            // Small delay between checks
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n📊 Check Results Summary:`);
        const accessible = results.filter(r => r.success).length;
        console.log(`   Total: ${results.length}`);
        console.log(`   Accessible: ${accessible}`);
        console.log(`   Not Accessible: ${results.length - accessible}`);

        return results;
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.automation) {
            await this.automation.cleanup();
            console.log('🧹 SMS Tool Optimized cleaned up');
        }
    }

    /**
     * Main entry point for dashboard compatibility
     */
    async runSmsSequence(browser, config, sites) {
        console.log('🚀 Running optimized SMS sequence...');

        const profileId = config.profileId;
        const profileData = {
            username: config.username,
            password: config.password,
            withdrawPassword: config.withdrawPassword,
            fullname: config.fullname,
            phone: config.phone,
            email: config.email,
            apiKey: config.apiKey
        };

        // Use batch processing for multiple sites
        if (sites.length > 1) {
            return await this.runBatchSequence(browser, sites, profileData, profileId);
        } else {
            const result = await this.runSequenceForSite(browser, sites[0], profileData, profileId);
            return [result];
        }
    }

    /**
     * Get health status
     */
    async getHealthStatus() {
        return {
            initialized: this.isInitialized,
            automation: this.automation ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SMSAutoSequence;