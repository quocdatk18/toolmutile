/**
 * HAI2VIP Automation Actions
 * Direct actions on page (like NOHU tool)
 */

class Hai2vipAutomationActions {
    constructor(page) {
        this.page = page;
    }

    /**
     * Execute an action by triggering the message listener (like NOHU tool)
     */
    async executeAction(action, data = {}) {
        return await this.page.evaluate((actionName, actionData) => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('⏱️ Action timeout after 60 seconds');
                    resolve({ success: false, error: 'Timeout after 60 seconds' });
                }, 60000);

                if (window._chromeMessageListener) {
                    console.log(`📤 Calling action: ${actionName}`);
                    window._chromeMessageListener(
                        { action: actionName, data: actionData },
                        {},
                        (response) => {
                            clearTimeout(timeout);
                            console.log(`📥 Action response:`, response);
                            resolve(response);
                        }
                    );
                } else {
                    clearTimeout(timeout);
                    console.error('❌ Message listener not found');
                    resolve({ success: false, error: 'Message listener not found' });
                }
            });
        }, action, data);
    }

    /**
     * Complete Registration (with result checking like NOHU tool)
     */
    async completeRegistration(profileData) {
        console.log('    📝 Starting registration...');

        try {
            // Step 1: Fill form and submit
            const fillResult = await this.executeAction('autoFill', {
                username: profileData.username,
                password: profileData.password,
                fullname: profileData.fullname,
                autoSubmit: true
            });

            console.log('    📊 Fill result:', fillResult);

            if (!fillResult || !fillResult.success) {
                console.error('    ❌ Form fill failed:', fillResult?.error);
                return { success: false, message: fillResult?.error || 'Form fill failed' };
            }

            console.log('    ✅ Form filled and submitted');

            // Step 2: Check registration result (wait for redirect/token)
            console.log('    🔍 Checking registration result (30 seconds)...');

            let success = false;
            let attempts = 0;
            const maxAttempts = 30;

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

                    await this.page.waitForTimeout(1000);

                } catch (error) {
                    console.log(`    ⚠️  Check attempt ${attempts} failed:`, error.message);
                    await this.page.waitForTimeout(1000);
                }
            }

            if (!success) {
                console.log('    ❌ Registration failed - no token found after 30 seconds');
                return { success: false, message: 'Registration failed - no token found' };
            }

            return { success: true, message: 'Registration successful' };

        } catch (error) {
            console.error('    ❌ Registration error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Setup Withdraw Password and Add Bank
     */
    async setupWithdrawAndBank(profileData) {
        console.log('    💰 Starting withdraw setup...');

        try {
            const result = await this.executeAction('goToWithdraw', {
                withdrawPassword: profileData.withdrawPassword,
                bankAccount: profileData.bankAccount,
                bankName: profileData.bankName
            });

            console.log('    📊 Withdraw result:', result);

            if (!result || !result.success) {
                console.error('    ❌ Withdraw setup failed:', result?.error);
                return { success: false, message: result?.error || 'Withdraw setup failed' };
            }

            console.log('    ✅ Withdraw setup completed');
            return { success: true, message: 'Withdraw setup completed' };

        } catch (error) {
            console.error('    ❌ Withdraw setup error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Phone Verification
     */
    async verifyPhone(apiKey) {
        console.log('    📱 Starting phone verification...');

        try {
            const result = await this.executeAction('verifyPhone', {
                apiKey: apiKey
            });

            console.log('    📊 Phone verification result:', result);

            if (!result || !result.success) {
                console.error('    ❌ Phone verification failed:', result?.error);
                return { success: false, message: result?.error || 'Phone verification failed' };
            }

            console.log('    ✅ Phone verification completed');
            return { success: true, message: 'Phone verification completed' };

        } catch (error) {
            console.error('    ❌ Phone verification error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Claim Promotion
     */
    async claimPromotion() {
        console.log('    🎁 Starting promotion claim...');

        try {
            const result = await this.executeAction('claimPromotion', {});

            console.log('    📊 Promotion result:', result);

            if (!result || !result.success) {
                console.error('    ❌ Promotion claim failed:', result?.error);
                return { success: false, message: result?.error || 'Promotion claim failed' };
            }

            console.log('    ✅ Promotion claim completed');
            return { success: true, message: 'Promotion claim completed' };

        } catch (error) {
            console.error('    ❌ Promotion claim error:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = Hai2vipAutomationActions;
