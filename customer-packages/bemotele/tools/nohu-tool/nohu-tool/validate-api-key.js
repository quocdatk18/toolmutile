/**
 * API Key Validation Module
 * Validates API key before running automation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class ApiKeyValidator {
    constructor() {
        this.configPath = path.join(__dirname, '../../config/settings.json');
    }

    /**
     * Load API key from config
     */
    loadApiKey() {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return {
                service: config.apiKey?.service || 'autocaptcha.pro',
                key: config.apiKey?.key || '',
                balance: config.apiKey?.balance || 0
            };
        } catch (error) {
            throw new Error(`Cannot load config: ${error.message}`);
        }
    }

    /**
     * Check if API key exists
     */
    hasApiKey() {
        const apiKey = this.loadApiKey();
        return apiKey.key && apiKey.key.trim().length > 0;
    }

    /**
     * Validate API key format
     */
    validateFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key must be a string' };
        }

        const trimmed = apiKey.trim();

        if (trimmed.length === 0) {
            return { valid: false, error: 'API key is empty' };
        }

        if (trimmed.length < 10) {
            return { valid: false, error: 'API key is too short (minimum 10 characters)' };
        }

        // Check for valid characters (alphanumeric and common special chars)
        if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
            return { valid: false, error: 'API key contains invalid characters' };
        }

        return { valid: true, key: trimmed };
    }

    /**
     * Check API key balance (for autocaptcha.pro)
     */
    async checkBalance(apiKey) {
        return new Promise((resolve) => {
            const url = `https://api.autocaptcha.pro/balance?apiKey=${apiKey}`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);

                        if (result.success && typeof result.balance === 'number') {
                            resolve({
                                valid: true,
                                balance: result.balance,
                                message: `Balance: $${result.balance.toFixed(2)}`
                            });
                        } else {
                            resolve({
                                valid: false,
                                error: result.error || 'Invalid API key'
                            });
                        }
                    } catch (error) {
                        resolve({
                            valid: false,
                            error: 'Cannot parse API response'
                        });
                    }
                });
            }).on('error', (error) => {
                resolve({
                    valid: false,
                    error: `Network error: ${error.message}`
                });
            });
        });
    }

    /**
     * Full validation: format + balance check
     */
    async validate(apiKey = null) {
        // If no API key provided, load from config
        if (!apiKey) {
            const config = this.loadApiKey();
            apiKey = config.key;
        }

        // Step 1: Check format
        const formatCheck = this.validateFormat(apiKey);
        if (!formatCheck.valid) {
            return {
                valid: false,
                error: formatCheck.error,
                step: 'format'
            };
        }

        // Step 2: Check balance
        console.log('    🔍 Checking API key balance...');
        const balanceCheck = await this.checkBalance(formatCheck.key);

        if (!balanceCheck.valid) {
            return {
                valid: false,
                error: balanceCheck.error,
                step: 'balance'
            };
        }

        // Update balance in config
        this.updateBalance(balanceCheck.balance);

        return {
            valid: true,
            balance: balanceCheck.balance,
            message: balanceCheck.message
        };
    }

    /**
     * Update balance in config file
     */
    updateBalance(balance) {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            config.apiKey.balance = balance;
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.warn('    ⚠️  Cannot update balance:', error.message);
        }
    }

    /**
     * Quick validation (format only, no network call)
     */
    quickValidate(apiKey = null) {
        if (!apiKey) {
            const config = this.loadApiKey();
            apiKey = config.key;
        }

        return this.validateFormat(apiKey);
    }
}

module.exports = ApiKeyValidator;
