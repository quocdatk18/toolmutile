/**
 * Auto Sequence - Safe Mode to prevent tab crashes
 * Register → Login → Add Bank → Check Promo (optional)
 * 
 * Fixed: Tab closing issues with comprehensive error handling
 */

const AutoSequenceSafe = require('./auto-sequence-safe');

class AutoSequence {
    constructor(settings, scripts) {
        this.settings = settings;
        this.scripts = scripts;
        this.safeSequence = new AutoSequenceSafe(settings, scripts);
        this.isInitialized = false;
    }

    async initialize(profileId = null) {
        if (!this.isInitialized) {
            // Safe Mode doesn't need separate initialization
            this.isInitialized = true;
        }
    }

    /**
     * Run complete sequence for one site using Safe Mode
     * Register → Auto-Login → Add Bank → Check Promo (safe execution)
     */
    async runSequenceForSite(browser, site, profileData, profileId = null) {
        await this.initialize(profileId);

        return await this.safeSequence.runSequenceForSite(browser, site, profileData);
    }

    /**
     * Run batch sequence for multiple sites using Safe Mode
     */
    async runBatchSequence(browser, sites, profileData, profileId = null) {
        await this.initialize(profileId);

        return await this.safeSequence.runSequence(browser, profileData, sites);
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
    }

    /**
     * Main entry point for dashboard compatibility
     */
    async runSequence(browser, profileData, sites) {

        // Use Safe Mode for all processing
        return await this.safeSequence.runSequence(browser, profileData, sites);
    }

    /**
     * SMS sequence using Safe Mode
     */
    async runSmsSequence(browser, profileData, sites) {

        return await this.safeSequence.runSmsSequence(browser, profileData, sites);
    }

    /**
     * Run check promo only (standalone)
     */
    async runCheckPromoOnly(browser, profileData, sites) {

        return await this.safeSequence.runCheckPromoOnly(browser, profileData, sites);
    }

    /**
     * Get health status
     */
    async getHealthStatus() {
        return {
            initialized: this.isInitialized,
            mode: 'safe_mode',
            automation: 'ready',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = AutoSequence;