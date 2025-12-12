/**
 * SMS Tool Main Automation Script
 * Entry point for SMS automation from dashboard
 */

const puppeteer = require('puppeteer');
const SMSAutoSequence = require('./auto-sequence');
const path = require('path');
const fs = require('fs').promises;

class SMSAutomation {
    constructor() {
        this.browser = null;
        this.isRunning = false;
        this.currentSession = null;
    }

    /**
     * Main entry point for SMS automation
     */
    async runAutomation(formData, sites, profileId) {
        console.log(`\n🚀 Starting SMS Automation...`);
        console.log(`📋 Profile ID: ${profileId}`);
        console.log(`📱 Category: ${formData.category}`);
        console.log(`🎯 Sites: ${sites.map(s => s.name).join(', ')}`);

        if (this.isRunning) {
            throw new Error('SMS automation is already running');
        }

        this.isRunning = true;
        const sessionId = Date.now().toString();
        this.currentSession = sessionId;

        const results = {
            sessionId,
            profileId,
            category: formData.category,
            sites: [],
            startTime: new Date().toISOString(),
            endTime: null,
            success: false
        };

        try {
            // Launch browser with Hidemium profile
            this.browser = await this.launchBrowserWithProfile(profileId);

            // Initialize SMS automation
            const smsSequence = new SMSAutoSequence({
                headless: false,
                timeout: 30000
            });

            // Prepare profile data
            const profileData = {
                username: formData.username,
                password: formData.password,
                withdrawPassword: formData.withdrawPassword,
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                bankName: formData.bankName,
                bankBranch: formData.bankBranch,
                accountNumber: formData.accountNumber,
                category: formData.category
            };

            // Run automation based on mode
            let automationResults;
            if (sites.length === 1) {
                // Single site mode
                automationResults = [await smsSequence.runSequenceForSite(
                    this.browser,
                    sites[0],
                    profileData
                )];
            } else {
                // Batch mode - FreeLXB style
                automationResults = await smsSequence.runFreeLXBStyleSequence(
                    this.browser,
                    sites,
                    profileData
                );
            }

            // Process results
            results.sites = automationResults;
            results.success = automationResults.some(r => r.register.success);
            results.endTime = new Date().toISOString();

            // Save results to file system
            await this.saveResults(results);

            console.log(`\n✅ SMS Automation completed successfully!`);
            console.log(`📊 Results: ${automationResults.filter(r => r.register.success).length}/${automationResults.length} successful`);

            return results;

        } catch (error) {
            console.error(`💥 SMS Automation error:`, error);
            results.success = false;
            results.error = error.message;
            results.endTime = new Date().toISOString();

            // Save error results
            await this.saveResults(results);

            throw error;
        } finally {
            await this.cleanup();
            this.isRunning = false;
            this.currentSession = null;
        }
    }

    /**
     * Launch browser with Hidemium profile
     */
    async launchBrowserWithProfile(profileId) {
        console.log(`🌐 Launching browser with profile: ${profileId}`);

        try {
            // Connect to Hidemium Local API
            const hidemiumEndpoint = `http://127.0.0.1:2222/v1/browser/start?automation=1&profileId=${profileId}`;

            const response = await fetch(hidemiumEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Hidemium API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.automation || !data.automation.wsEndpoint) {
                throw new Error('Invalid Hidemium response - missing wsEndpoint');
            }

            console.log(`🔗 Connecting to Hidemium WebSocket: ${data.automation.wsEndpoint}`);

            // Connect to browser via WebSocket
            const browser = await puppeteer.connect({
                browserWSEndpoint: data.automation.wsEndpoint,
                defaultViewport: null
            });

            console.log(`✅ Browser connected successfully`);
            return browser;

        } catch (error) {
            console.error(`💥 Browser launch error:`, error);
            throw new Error(`Failed to launch browser with profile ${profileId}: ${error.message}`);
        }
    }

    /**
     * Save automation results
     */
    async saveResults(results) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `sms_results_${results.sessionId}_${timestamp}.json`;
            const resultsDir = path.join(process.cwd(), 'screenshots', 'sms-tool-results');

            // Ensure directory exists
            await fs.mkdir(resultsDir, { recursive: true });

            const filePath = path.join(resultsDir, filename);
            await fs.writeFile(filePath, JSON.stringify(results, null, 2));

            console.log(`💾 Results saved: ${filename}`);
        } catch (error) {
            console.error(`💥 Failed to save results:`, error);
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log(`🧹 Cleaning up resources...`);

        if (this.browser) {
            try {
                await this.browser.close();
                console.log(`✅ Browser closed`);
            } catch (error) {
                console.warn(`⚠️ Browser cleanup error:`, error);
            }
            this.browser = null;
        }
    }

    /**
     * Stop running automation
     */
    async stop() {
        if (!this.isRunning) {
            return { success: false, message: 'No automation is running' };
        }

        console.log(`🛑 Stopping SMS automation...`);

        try {
            await this.cleanup();
            this.isRunning = false;
            this.currentSession = null;

            console.log(`✅ SMS automation stopped`);
            return { success: true, message: 'SMS automation stopped successfully' };
        } catch (error) {
            console.error(`💥 Stop automation error:`, error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentSession: this.currentSession,
            hasActiveBrowser: !!this.browser
        };
    }
}

// Export singleton instance
module.exports = new SMSAutomation();