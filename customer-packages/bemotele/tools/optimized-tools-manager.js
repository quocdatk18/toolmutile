/**
 * Optimized Tools Manager - Main entry point for dashboard
 * Manages both NOHU and SMS tools with intelligent routing
 */

const NohuAutoSequence = require('./nohu-tool/auto-sequence');
const SMSAutoSequence = require('./sms-tool/auto-sequence');

class OptimizedToolsManager {
    constructor(settings = {}) {
        this.settings = settings;
        this.nohuTool = null;
        this.smsTool = null;
        this.activeOperations = new Map();

        // Site categorization
        this.nohuSites = ['Go99', 'NOHU', 'TT88', 'MMOO', '789P', '33WIN', '88VV'];
        this.smsSites = {
            okvip: ['SHBET', 'F8BET', 'NEW88', 'HI88', '789BET', 'MB66'],
            abcvip: ['J88', 'U888', 'ABC8', '88CLB'],
            '78win': ['JUN88', '78WIN']
        };
    }

    /**
     * Initialize tools
     */
    async initialize() {

        this.nohuTool = new NohuAutoSequence(this.settings, {});
        this.smsTool = new SMSAutoSequence(this.settings, {});

    }

    /**
     * Determine which tool to use for a site
     */
    getToolForSite(siteName) {
        if (this.nohuSites.includes(siteName)) {
            return { tool: this.nohuTool, type: 'nohu' };
        }

        // Check SMS categories
        for (const [category, sites] of Object.entries(this.smsSites)) {
            if (sites.includes(siteName)) {
                return { tool: this.smsTool, type: 'sms', category };
            }
        }

        // Default to SMS tool for unknown sites
        return { tool: this.smsTool, type: 'sms', category: 'unknown' };
    }

    /**
     * Process sites with intelligent routing
     */
    async processSites(sites, profileData, options = {}) {
        if (!this.nohuTool || !this.smsTool) {
            await this.initialize();
        }

        const operationId = Date.now().toString();

        this.activeOperations.set(operationId, {
            id: operationId,
            sites: sites.map(s => s.name),
            status: 'running',
            startTime: Date.now(),
            results: []
        });

        try {
            // Separate sites by tool type
            const nohuSites = [];
            const smsSites = [];

            sites.forEach(site => {
                const { type } = this.getToolForSite(site.name);
                if (type === 'nohu') {
                    nohuSites.push(site);
                } else {
                    smsSites.push(site);
                }
            });

            const allResults = [];
            const promises = [];

            // Process NOHU sites
            if (nohuSites.length > 0) {
                promises.push(
                    this.processNohuSites(nohuSites, profileData, options)
                        .then(results => {
                            allResults.push(...results.map(r => ({ ...r, toolType: 'nohu' })));
                        })
                        .catch(error => {
                            console.error('❌ NOHU processing error:', error);
                            nohuSites.forEach(site => {
                                allResults.push({
                                    site: site.name,
                                    register: { success: false, error: error.message },
                                    login: { success: false, error: error.message },
                                    addBank: { success: false, error: error.message },
                                    checkPromo: { success: false, error: error.message },
                                    toolType: 'nohu'
                                });
                            });
                        })
                );
            }

            // Process SMS sites
            if (smsSites.length > 0) {
                promises.push(
                    this.processSMSSites(smsSites, profileData, options)
                        .then(results => {
                            allResults.push(...results.map(r => ({ ...r, toolType: 'sms' })));
                        })
                        .catch(error => {
                            console.error('❌ SMS processing error:', error);
                            smsSites.forEach(site => {
                                allResults.push({
                                    site: site.name,
                                    category: site.category,
                                    register: { success: false, error: error.message },
                                    login: { success: false, error: error.message },
                                    addBank: { success: false, error: error.message },
                                    checkPromo: { success: false, error: error.message },
                                    toolType: 'sms'
                                });
                            });
                        })
                );
            }

            // Wait for all processing to complete
            await Promise.all(promises);

            // Update operation status
            this.activeOperations.get(operationId).status = 'completed';
            this.activeOperations.get(operationId).results = allResults;

            const summary = this.generateSummary(allResults);
            console.log(`\n📊 Operation ${operationId} completed:`);
            console.log(`   Successful: ${summary.successful}`);
            console.log(`   Failed: ${summary.failed}`);
            console.log(`   Success Rate: ${summary.successRate}`);

            return {
                operationId,
                success: true,
                results: allResults,
                summary
            };

        } catch (error) {
            console.error(`❌ Operation ${operationId} failed:`, error);
            this.activeOperations.get(operationId).status = 'failed';

            return {
                operationId,
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Process NOHU sites using batch processing
     */
    async processNohuSites(sites, profileData, options) {

        // Use batch processing for better performance
        if (sites.length > 1) {
            return await this.nohuTool.runBatchSequence(null, sites, profileData);
        } else {
            const result = await this.nohuTool.runSequenceForSite(null, sites[0], profileData);
            return [result];
        }
    }

    /**
     * Process SMS sites using batch processing
     */
    async processSMSSites(sites, profileData, options) {

        // Use batch processing for better performance
        if (sites.length > 1) {
            return await this.smsTool.runBatchSequence(null, sites, profileData);
        } else {
            const result = await this.smsTool.runSequenceForSite(null, sites[0], profileData);
            return [result];
        }
    }

    /**
     * Check existing accounts (SMS specific)
     */
    async checkAccounts(sites, profileData) {
        if (!this.smsTool) {
            await this.initialize();
        }

        // Only SMS sites support account checking
        const smsCheckSites = sites.filter(site => {
            const { type } = this.getToolForSite(site.name);
            return type === 'sms';
        });

        if (smsCheckSites.length === 0) {
            return [];
        }

        return await this.smsTool.runCheckSequence(null, smsCheckSites, profileData);
    }

    /**
     * Generate operation summary
     */
    generateSummary(results) {
        const summary = {
            total: results.length,
            successful: 0,
            failed: 0,
            byTool: {},
            byCategory: {},
            errors: []
        };

        results.forEach(result => {
            const isSuccess = result.register?.success || false;

            if (isSuccess) {
                summary.successful++;
            } else {
                summary.failed++;
                if (result.register?.error) {
                    summary.errors.push({
                        site: result.site,
                        error: result.register.error,
                        toolType: result.toolType
                    });
                }
            }

            // Group by tool type
            const toolType = result.toolType || 'unknown';
            if (!summary.byTool[toolType]) {
                summary.byTool[toolType] = { total: 0, successful: 0, failed: 0 };
            }
            summary.byTool[toolType].total++;
            if (isSuccess) {
                summary.byTool[toolType].successful++;
            } else {
                summary.byTool[toolType].failed++;
            }

            // Group by category (for SMS sites)
            if (result.category) {
                const category = result.category;
                if (!summary.byCategory[category]) {
                    summary.byCategory[category] = { total: 0, successful: 0, failed: 0 };
                }
                summary.byCategory[category].total++;
                if (isSuccess) {
                    summary.byCategory[category].successful++;
                } else {
                    summary.byCategory[category].failed++;
                }
            }
        });

        summary.successRate = summary.total > 0 ?
            ((summary.successful / summary.total) * 100).toFixed(1) + '%' : '0%';

        return summary;
    }

    /**
     * Get operation status
     */
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }

    /**
     * Stop operation
     */
    async stopOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (operation && operation.status === 'running') {
            operation.status = 'stopped';
            return true;
        }
        return false;
    }

    /**
     * Get health status
     */
    async getHealthStatus() {
        const nohuHealth = this.nohuTool ? await this.nohuTool.getHealthStatus() : null;
        const smsHealth = this.smsTool ? await this.smsTool.getHealthStatus() : null;

        return {
            manager: 'ready',
            nohuTool: nohuHealth,
            smsTool: smsHealth,
            activeOperations: this.activeOperations.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cleanup all resources
     */
    async cleanup() {

        const promises = [];

        if (this.nohuTool) {
            promises.push(this.nohuTool.cleanup());
        }

        if (this.smsTool) {
            promises.push(this.smsTool.cleanup());
        }

        await Promise.all(promises);

        this.activeOperations.clear();
        console.log('✅ Cleanup completed');
    }

    /**
     * Get supported sites list
     */
    getSupportedSites() {
        return {
            nohu: this.nohuSites,
            sms: this.smsSites,
            all: [
                ...this.nohuSites,
                ...Object.values(this.smsSites).flat()
            ]
        };
    }
}

module.exports = OptimizedToolsManager;