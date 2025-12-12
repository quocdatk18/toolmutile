/**
 * Automation Actions - Complete implementation of all extension actions
 * This class provides all automation actions that extension supports
 */

const ApiKeyValidator = require('./validate-api-key');

// Helper function to replace deprecated page.waitForTimeout()
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class AutomationActions {
    constructor(page) {
        this.page = page;
    }

    /**
     * Execute an action by triggering the message listener
     */
    async executeAction(action, data = {}) {
        return await this.page.evaluate((actionName, actionData) => {
            return new Promise((resolve) => {
                // Increased timeout for slow network or slow captcha API
                // But will resolve immediately when action completes
                const timeout = setTimeout(() => {
                    resolve({ success: false, error: 'Timeout after 180 seconds' });
                }, 180000); // 180 seconds (3 minutes)

                if (window._chromeMessageListener) {
                    window._chromeMessageListener(
                        { action: actionName, data: actionData },
                        {},
                        (response) => {
                            clearTimeout(timeout);
                            resolve(response); // Resolve immediately when done
                        }
                    );
                } else {
                    clearTimeout(timeout);
                    resolve({ success: false, error: 'Message listener not found' });
                }
            });
        }, action, data);
    }

    /**
     * 1. Find and click register button
     */
    async findAndClickRegister() {
        console.log('    🔍 Finding and clicking register button...');
        const result = await this.executeAction('findAndClickRegister');

        if (result && result.success) {
            console.log('    ✅ Register button clicked');
            await wait(500); // Reduced from 5000ms to 500ms
            return true;
        } else {
            console.log('    ℹ️  No register button found or already on register page');
            return false;
        }
    }

    /**
     * 2. Auto-fill registration form
     */
    async autoFill(data) {
        console.log('    📝 Auto-filling registration form...');
        const result = await this.executeAction('autoFill', data);

        if (result && result.success) {
            console.log('    ✅ Form filled successfully');
            return result;
        } else {
            console.log('    ❌ Form fill failed:', result?.error);
            return result;
        }
    }

    /**
     * Validate API key before action
     */
    async validateApiKey(apiKey) {
        const validator = new ApiKeyValidator();

        // Quick format validation (no network call)
        const formatCheck = validator.quickValidate(apiKey);

        if (!formatCheck.valid) {
            throw new Error(`Invalid API key: ${formatCheck.error}`);
        }

        return formatCheck.key;
    }

    /**
     * Complete registration workflow
     */
    async completeRegistration(profileData) {
        console.log('    🚀 Starting complete registration workflow...');

        // IMPORTANT: Bring tab to front to prevent throttling
        console.log('    👁️  Bringing tab to front...');
        await this.page.bringToFront();

        // Step 0: Validate API key
        try {
            const validApiKey = await this.validateApiKey(profileData.apiKey);
            console.log('    ✅ API key validated');
            profileData.apiKey = validApiKey; // Use trimmed/validated key
        } catch (error) {
            console.log('    ❌ API key validation failed:', error.message);
            return { success: false, message: error.message };
        }

        // Step 1: Click register button
        await this.findAndClickRegister();

        // Step 2: Fill form and wait for result
        console.log('    📝 Filling form, solving captcha, and checking result...');

        // Bring to front again before filling (critical step)
        await this.page.bringToFront();
        await wait(500); // Small wait for tab to fully activate

        const fillResult = await this.autoFill({
            username: profileData.username,
            password: profileData.password,
            withdrawPassword: profileData.withdrawPassword,
            fullname: profileData.fullname,
            autoSubmit: true,
            apiKey: profileData.apiKey
        });

        if (!fillResult || !fillResult.success) {
            return { success: false, message: fillResult?.error || 'Form fill failed' };
        }

        console.log('    ✅ Form filled and submitted');

        // Step 3: Check result (wait longer for captcha solving)
        console.log('    🔍 Checking registration result (30 seconds)...');

        let success = false;
        let attempts = 0;
        const maxAttempts = 30; // Increased from 15 to 30

        while (attempts < maxAttempts && !success) {
            attempts++;

            try {
                const hasToken = await this.page.evaluate(() => {
                    const cookies = document.cookie;
                    const tokenCookies = ['_pat', 'token', 'auth_token', 'access_token', 'session'];

                    for (const name of tokenCookies) {
                        if (cookies.includes(`${name}=`)) {
                            const match = cookies.match(new RegExp(`${name}=([^;]+)`));
                            if (match && match[1] && match[1].length > 10) {
                                return true;
                            }
                        }
                    }

                    const url = window.location.href;
                    if (url.includes('/home') || url.includes('/dashboard') || url.includes('/profile')) {
                        return true;
                    }

                    return false;
                });

                if (hasToken) {
                    success = true;
                    console.log(`    ✅ Registration successful (detected after ${attempts}s)`);
                    break;
                }

                await wait(1000);

            } catch (error) {
                console.log(`    ⚠️  Check attempt ${attempts} failed:`, error.message);
                await wait(1000);
            }
        }

        if (!success) {
            console.log('    ❌ Registration failed - no token found after 15 seconds');
        }

        return { success, message: success ? 'Registration successful' : 'Registration failed' };
    }

    /**
     * Check promotion
     */
    async checkPromotion(username, apiKey) {
        console.log('    🎁 Checking promotion...');
        const result = await this.executeAction('checkPromotion', { username, apiKey });

        if (result && result.success) {
            console.log('    ✅ Promotion check completed');
            return result.promotions || [];
        } else {
            console.log('    ❌ Promotion check failed:', result?.error);
            return [];
        }
    }

    /**
     * Complete check promotion workflow
     */
    async completeCheckPromotion(username, apiKey) {
        console.log('    🎁 Starting complete check promotion workflow...');
        console.log('    📊 Username received:', username);
        console.log('    📊 API Key received:', apiKey ? 'YES' : 'NO');

        // IMPORTANT: Bring tab to front to prevent throttling (như phiên bản cũ)
        console.log('    👁️  Bringing tab to front...');
        await this.page.bringToFront();
        await wait(1000); // Wait for tab to fully activate (critical for setValue)

        // Validate API key first
        try {
            const validApiKey = await this.validateApiKey(apiKey);
            console.log('    ✅ API key validated');
            apiKey = validApiKey; // Use trimmed/validated key
        } catch (error) {
            console.log('    ❌ API key validation failed:', error.message);
            return { success: false, message: error.message, promotions: [] };
        }

        // 🔥 Focus again right before checkPromotion
        console.log('    🎯 Re-focusing tab before checkPromotion...');
        await this.page.bringToFront();
        await wait(500);

        const promotions = await this.checkPromotion(username, apiKey);

        return {
            success: true,
            promotions,
            message: `Found ${promotions.length} promotions`
        };
    }
}

module.exports = AutomationActions;
