// Optimized Tools Integration (FreeLXB Style)
const NohuToolOptimized = require('./nohu-tool/optimized-automation');
const SmsToolOptimized = require('./sms-tool/optimized-automation');

class OptimizedToolsManager {
    constructor() {
        this.nohuTool = new NohuToolOptimized();
        this.smsTool = new SmsToolOptimized();
        this.activeOperations = new Map();
    }

    // Determine which tool to use based on site
    getToolForSite(siteName) {
        const nohuSites = ['Go99', 'NOHU', 'TT88', 'MMOO', '789P', '33WIN', '88VV'];

        if (nohuSites.includes(siteName)) {
            return { tool: this.nohuTool, type: 'nohu' };
        } else {
            return { tool: this.smsTool, type: 'sms' };
        }
    }

    // Process mixed sites (automatically route to correct tools)
    async processMixedSites(sites, userData, options = {}) {

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

        const results = [];
        const promises = [];

        // Process NOHU sites
        if (nohuSites.length > 0) {
            promises.push(
                this.nohuTool.batchProcess(nohuSites, userData, options)
                    .then(nohuResults => {
                        results.push(...nohuResults.map(r => ({ ...r, toolType: 'nohu' })));
                    })
                    .catch(error => {
                        console.error('❌ NOHU tool error:', error);
                        nohuSites.forEach(site => {
                            results.push({
                                site: site.name,
                                success: false,
                                error: error.message,
                                toolType: 'nohu'
                            });
                        });
                    })
            );
        }

        // Process SMS sites
        if (smsSites.length > 0) {
            promises.push(
                this.smsTool.batchProcess(smsSites, userData, options)
                    .then(smsResults => {
                        results.push(...smsResults.map(r => ({ ...r, toolType: 'sms' })));
                    })
                    .catch(error => {
                        console.error('❌ SMS tool error:', error);
                        smsSites.forEach(site => {
                            results.push({
                                site: site.name,
                                success: false,
                                error: error.message,
                                toolType: 'sms'
                            });
                        });
                    })
            );
        }

        // Wait for all tools to complete
        await Promise.all(promises);

        console.log('✅ Mixed sites processing completed');
        return this.formatResults(results);
    }

    // Process single site
    async processSingleSite(site, userData, options = {}) {
        const { tool, type } = this.getToolForSite(site.name);

        try {
            const results = await tool.batchProcess([site], userData, options);
            return { ...results[0], toolType: type };
        } catch (error) {
            console.error(`❌ Error processing ${site.name}:`, error);
            return {
                site: site.name,
                success: false,
                error: error.message,
                toolType: type
            };
        }
    }

    // Batch process with intelligent routing
    async intelligentBatchProcess(sites, userData, options = {}) {
        const operationId = Date.now().toString();

        this.activeOperations.set(operationId, {
            id: operationId,
            sites: sites.map(s => s.name),
            status: 'running',
            startTime: Date.now(),
            results: []
        });

        try {
            // Analyze sites and optimize processing strategy
            const strategy = this.analyzeProcessingStrategy(sites);

            let results;

            switch (strategy.type) {
                case 'single_tool':
                    // All sites use same tool - direct processing
                    const { tool } = this.getToolForSite(sites[0].name);
                    results = await tool.batchProcess(sites, userData, options);
                    break;

                case 'mixed_tools':
                    // Sites use different tools - intelligent routing
                    results = await this.processMixedSites(sites, userData, options);
                    break;

                case 'sequential':
                    // Process one by one for complex scenarios
                    results = await this.processSequentially(sites, userData, options);
                    break;
            }

            this.activeOperations.get(operationId).status = 'completed';
            this.activeOperations.get(operationId).results = results;

            return {
                operationId,
                success: true,
                strategy: strategy.type,
                results: results,
                summary: this.generateSummary(results)
            };

        } catch (error) {
            this.activeOperations.get(operationId).status = 'failed';
            console.error('❌ Batch process error:', error);

            return {
                operationId,
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    analyzeProcessingStrategy(sites) {
        const toolTypes = new Set();

        sites.forEach(site => {
            const { type } = this.getToolForSite(site.name);
            toolTypes.add(type);
        });

        if (toolTypes.size === 1) {
            return {
                type: 'single_tool',
                toolType: Array.from(toolTypes)[0],
                reason: 'All sites use same tool type'
            };
        } else if (sites.length <= 10) {
            return {
                type: 'mixed_tools',
                reason: 'Multiple tool types, manageable size'
            };
        } else {
            return {
                type: 'sequential',
                reason: 'Large batch with mixed tools, sequential processing safer'
            };
        }
    }

    async processSequentially(sites, userData, options) {

        const results = [];

        for (const site of sites) {
            try {
                const result = await this.processSingleSite(site, userData, options);
                results.push(result);

                // Small delay between sites
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                results.push({
                    site: site.name,
                    success: false,
                    error: error.message,
                    toolType: 'unknown'
                });
            }
        }

        return results;
    }

    formatResults(results) {
        return results.map(result => ({
            ...result,
            timestamp: new Date().toISOString(),
            processed: true
        }));
    }

    generateSummary(results) {
        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            byTool: {},
            errors: []
        };

        // Group by tool type
        results.forEach(result => {
            const toolType = result.toolType || 'unknown';
            if (!summary.byTool[toolType]) {
                summary.byTool[toolType] = { total: 0, successful: 0, failed: 0 };
            }

            summary.byTool[toolType].total++;
            if (result.success) {
                summary.byTool[toolType].successful++;
            } else {
                summary.byTool[toolType].failed++;
                summary.errors.push({
                    site: result.site,
                    error: result.error,
                    toolType: toolType
                });
            }
        });

        summary.successRate = ((summary.successful / summary.total) * 100).toFixed(1) + '%';

        return summary;
    }

    // Get operation status
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }

    // Stop operation
    async stopOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (operation) {
            operation.status = 'stopped';
            // Add cleanup logic here if needed
            return true;
        }
        return false;
    }

    // Cleanup resources
    async cleanup() {

        const promises = [];

        if (this.nohuTool) {
            promises.push(this.nohuTool.cleanup());
        }

        if (this.smsTool) {
            promises.push(this.smsTool.cleanup());
        }

        await Promise.all(promises);
        console.log('✅ Cleanup completed');
    }

    // Health check
    async healthCheck() {
        return {
            nohuTool: this.nohuTool ? 'ready' : 'not_initialized',
            smsTool: this.smsTool ? 'ready' : 'not_initialized',
            activeOperations: this.activeOperations.size,
            timestamp: new Date().toISOString()
        };
    }
}

// Usage example
async function example() {
    const manager = new OptimizedToolsManager();

    const sites = [
        { name: 'Go99' },      // NOHU tool
        { name: 'SHBET' },     // SMS tool
        { name: 'TT88' },      // NOHU tool
        { name: 'QQ88' }       // SMS tool
    ];

    const userData = {
        username: 'testuser123',
        password: 'password123',
        withdrawPassword: 'withdraw123',
        fullname: 'Test User',
        phone: '0123456789',
        email: 'test@gmail.com'
    };

    const options = {
        autoSubmit: false,
        keepOpen: true,
        apiKey: 'your-captcha-api-key'
    };

    try {
        const result = await manager.intelligentBatchProcess(sites, userData, options);
        console.log('🎉 Processing completed:', result);
    } catch (error) {
        console.error('❌ Processing failed:', error);
    } finally {
        await manager.cleanup();
    }
}

module.exports = OptimizedToolsManager;

// Export for direct usage
if (require.main === module) {
    example();
}