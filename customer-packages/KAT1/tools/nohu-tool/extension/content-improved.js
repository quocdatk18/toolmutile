/**
 * NOHU Tool - Improved Content Script
 * Fixes: 
 * 1. Remove "SAFE MODE COMPLETE" notification
 * 2. Immediate redirect on token detection (no waiting for page reload)
 * 3. Real-time token monitoring with MutationObserver
 */

// ==================== REMOVE SAFE MODE NOTIFICATION ====================

function removeSafeModeNotification() {
    // Remove existing SAFE MODE notifications
    const indicators = document.querySelectorAll('div');
    indicators.forEach(div => {
        if (div.innerHTML && div.innerHTML.includes('SAFE MODE COMPLETE')) {
            div.remove();
        }
    });

    // Prevent future SAFE MODE notifications
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.innerHTML && node.innerHTML.includes('SAFE MODE COMPLETE')) {
                    node.remove();
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

}

// ==================== REAL-TIME TOKEN MONITORING ====================

class TokenMonitor {
    constructor() {
        this.isMonitoring = false;
        this.tokenFound = false;
        this.callbacks = [];
        this.checkInterval = null;
    }

    // Add callback for when token is found
    onTokenFound(callback) {
        this.callbacks.push(callback);
    }

    // Start monitoring for tokens
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        console.log('🔍 Starting real-time token monitoring...');

        // Check immediately
        this.checkForToken();

        // Check every 500ms for faster detection
        this.checkInterval = setInterval(() => {
            this.checkForToken();
        }, 500);

        // Also monitor cookie changes
        this.setupCookieMonitor();
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('⏹️ Token monitoring stopped');
    }

    checkForToken() {
        if (this.tokenFound) return;

        const cookies = document.cookie;
        const localStorage = window.localStorage;
        const sessionStorage = window.sessionStorage;

        const tokenNames = [
            '_pat', 'token', 'auth_token', 'access_token',
            'session', 'jwt', 'bearer', 'authToken', 'sessionToken'
        ];

        // Check cookies
        for (const name of tokenNames) {
            if (cookies.includes(`${name}=`)) {
                const cookieMatch = cookies.match(new RegExp(`${name}=([^;]+)`));
                if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 10) {
                    this.onTokenDetected(name, cookieMatch[1], 'cookie');
                    return;
                }
            }
        }

        // Check localStorage
        for (const name of tokenNames) {
            const value = localStorage.getItem(name);
            if (value && value.length > 10) {
                this.onTokenDetected(name, value, 'localStorage');
                return;
            }
        }

        // Check sessionStorage
        for (const name of tokenNames) {
            const value = sessionStorage.getItem(name);
            if (value && value.length > 10) {
                this.onTokenDetected(name, value, 'sessionStorage');
                return;
            }
        }
    }

    onTokenDetected(tokenName, tokenValue, source) {
        if (this.tokenFound) return;

        this.tokenFound = true;
        this.stopMonitoring();

        console.log(`🎉 TOKEN DETECTED! ${tokenName} from ${source}`);
        }...`);

        // Trigger all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback({
                    name: tokenName,
                    value: tokenValue,
                    source: source
                });
            } catch (error) {
                console.error('❌ Token callback error:', error);
            }
        });
    }

    setupCookieMonitor() {
        // Monitor cookie changes using document.cookie getter override
        let lastCookies = document.cookie;

        const checkCookieChanges = () => {
            const currentCookies = document.cookie;
            if (currentCookies !== lastCookies) {
                lastCookies = currentCookies;
                this.checkForToken();
            }
        };

        // Check every 100ms for cookie changes
        setInterval(checkCookieChanges, 100);
    }
}

// ==================== IMPROVED REGISTRATION HANDLER ====================

async function handleImprovedRegistration(data) {
    console.log('📝 Starting improved registration with immediate redirect...');

    // Create token monitor
    const tokenMonitor = new TokenMonitor();

    // Setup immediate redirect on token detection
    tokenMonitor.onTokenFound((tokenInfo) => {
        console.log('🚀 Token found! Redirecting immediately...');

        // Immediate redirect to withdraw page
        const currentOrigin = window.location.origin;
        const withdrawUrl = currentOrigin + '/Financial?type=withdraw';

        console.log('🔄 Immediate redirect to:', withdrawUrl);

        // Store redirect info
        sessionStorage.setItem('autoRedirectFrom', window.location.href);
        sessionStorage.setItem('autoRedirectTo', withdrawUrl);
        sessionStorage.setItem('autoRedirectTime', new Date().toISOString());
        sessionStorage.setItem('tokenDetected', JSON.stringify(tokenInfo));

        // Redirect immediately - no waiting!
        window.location.href = withdrawUrl;
    });

    // Start monitoring before form submission
    tokenMonitor.startMonitoring();

    // Fill form using existing logic
    const result = await autoFillForm(
        data.username,
        data.password,
        data.withdrawPassword,
        data.fullname
    );

    console.log('✅ Form filled, token monitor active for immediate redirect');
    return result;
}

// ==================== URL CHANGE MONITORING ====================

function setupUrlChangeMonitor() {
    let currentUrl = window.location.href;

    // Monitor URL changes
    const urlObserver = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            const oldUrl = currentUrl;
            currentUrl = window.location.href;

                from: oldUrl,
                to: currentUrl
            });

            // If URL changed away from register page, check for token immediately
            if (oldUrl.includes('/Register') && !currentUrl.includes('/Register')) {
                console.log('🎯 Left register page - checking for token...');

                const tokenMonitor = new TokenMonitor();
                tokenMonitor.onTokenFound((tokenInfo) => {
                    console.log('✅ Registration confirmed by token after URL change');
                });
                tokenMonitor.startMonitoring();

                // Stop monitoring after 5 seconds
                setTimeout(() => tokenMonitor.stopMonitoring(), 5000);
            }
        }
    });

    urlObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

}

// ==================== ENHANCED MESSAGE HANDLER ====================

// Prevent multiple injections
if (window.improvedToolLoaded) {
} else {
    window.improvedToolLoaded = true;

    // Remove SAFE MODE notifications immediately
    removeSafeModeNotification();

    // Setup URL monitoring
    setupUrlChangeMonitor();

    // Enhanced message listener
    if (window._chromeMessageListener) {
        const originalListener = window._chromeMessageListener;
        window._chromeMessageListener = async (message, sender, sendResponse) => {

            // Handle improved registration
            if (message.action === 'autoFill' || message.action === 'register') {
                console.log('🚀 Using improved registration with immediate redirect');
                try {
                    const result = await handleImprovedRegistration(message.data);
                    sendResponse({ success: true, result: result });
                } catch (error) {
                    console.error('❌ Improved registration error:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return;
            }

            // Handle other messages with original listener
            return originalListener(message, sender, sendResponse);
        };

    }

}

// ==================== UTILITY FUNCTIONS ====================

// Enhanced form filling (reuse existing logic but with improvements)
async function autoFillForm(username, password, withdrawPassword, fullname) {

    // Use existing autoFillForm logic but with token monitoring
    // This would call the existing function from content.js
    if (typeof window.autoFillForm === 'function') {
        return await window.autoFillForm(username, password, withdrawPassword, fullname);
    }

    // Fallback basic implementation
    return { success: false, error: 'Original autoFillForm not available' };
}

// Export for debugging
window.TokenMonitor = TokenMonitor;
window.removeSafeModeNotification = removeSafeModeNotification;
