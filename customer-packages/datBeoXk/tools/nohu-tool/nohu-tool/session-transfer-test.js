/**
 * Session Transfer Test - FreeLXB Style
 * Tests the ability to transfer session/cookies between domains
 */

async function testSessionTransfer(page, fromUrl, toUrl) {
    console.log('🧪 Testing Session Transfer (FreeLXB Style)');
    console.log('From:', fromUrl);
    console.log('To:', toUrl);

    // Step 1: Navigate to source URL and simulate login/registration
    console.log('\n1️⃣ Navigating to source URL...');
    await page.goto(fromUrl, { waitUntil: 'domcontentloaded' });

    // Step 2: Extract all possible session data
    console.log('2️⃣ Extracting session data...');
    const sessionData = await page.evaluate(() => {
        const data = {
            localStorage: {},
            sessionStorage: {},
            cookies: document.cookie,
            tokens: [],
            allCookies: []
        };

        // Extract localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data.localStorage[key] = localStorage.getItem(key);
        }

        // Extract sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            data.sessionStorage[key] = sessionStorage.getItem(key);
        }

        // Parse cookies
        if (document.cookie) {
            data.allCookies = document.cookie.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=');
                return { name, value };
            });
        }

        // Look for auth tokens
        const tokenNames = [
            'token', 'authToken', 'auth_token', 'access_token', 'jwt',
            'sessionToken', 'userToken', 'loginToken', 'authKey',
            'user_token', 'session_id', 'sid', 'PHPSESSID'
        ];

        tokenNames.forEach(name => {
            const localValue = localStorage.getItem(name);
            const sessionValue = sessionStorage.getItem(name);
            if (localValue) data.tokens.push({ name, value: localValue, type: 'localStorage' });
            if (sessionValue) data.tokens.push({ name, value: sessionValue, type: 'sessionStorage' });
        });

        return data;
    });

    console.log('📊 Extracted data:', {
        localStorage: Object.keys(sessionData.localStorage).length + ' items',
        sessionStorage: Object.keys(sessionData.sessionStorage).length + ' items',
        cookies: sessionData.allCookies.length + ' cookies',
        tokens: sessionData.tokens.length + ' auth tokens'
    });

    // Step 3: Navigate to target URL
    console.log('\n3️⃣ Navigating to target URL...');
    await page.goto(toUrl, { waitUntil: 'domcontentloaded' });

    // Step 4: Attempt session transfer
    console.log('4️⃣ Attempting session transfer...');
    const transferResult = await page.evaluate((sessionData) => {
        const results = {
            success: false,
            transferred: {
                localStorage: 0,
                sessionStorage: 0,
                tokens: 0
            },
            errors: [],
            finalState: {}
        };

        try {
            // Transfer localStorage
            Object.entries(sessionData.localStorage).forEach(([key, value]) => {
                try {
                    localStorage.setItem(key, value);
                    results.transferred.localStorage++;
                } catch (e) {
                    results.errors.push(`localStorage ${key}: ${e.message}`);
                }
            });

            // Transfer sessionStorage
            Object.entries(sessionData.sessionStorage).forEach(([key, value]) => {
                try {
                    sessionStorage.setItem(key, value);
                    results.transferred.sessionStorage++;
                } catch (e) {
                    results.errors.push(`sessionStorage ${key}: ${e.message}`);
                }
            });

            // Transfer auth tokens specifically
            sessionData.tokens.forEach(token => {
                try {
                    if (token.type === 'localStorage') {
                        localStorage.setItem(token.name, token.value);
                    } else {
                        sessionStorage.setItem(token.name, token.value);
                    }
                    results.transferred.tokens++;
                } catch (e) {
                    results.errors.push(`token ${token.name}: ${e.message}`);
                }
            });

            // Check final state
            const tokenNames = ['token', 'authToken', 'auth_token', 'access_token', 'jwt', 'sessionToken'];
            results.finalState = {
                hasTokens: tokenNames.some(name =>
                    localStorage.getItem(name) || sessionStorage.getItem(name)
                ),
                foundTokens: tokenNames.filter(name =>
                    localStorage.getItem(name) || sessionStorage.getItem(name)
                ),
                currentUrl: window.location.href
            };

            results.success = results.transferred.localStorage > 0 ||
                results.transferred.sessionStorage > 0 ||
                results.transferred.tokens > 0;

        } catch (e) {
            results.errors.push(`General error: ${e.message}`);
        }

        return results;
    }, sessionData);

    // Step 5: Verify login status
    console.log('5️⃣ Checking login status after transfer...');
    const loginStatus = await page.evaluate(() => {
        // Check for login indicators
        const hasLoginForm = document.querySelector('input[type="password"], input[name*="password"]') !== null;
        const hasLogoutBtn = document.querySelector('a[href*="logout"], .logout') !== null;
        const hasUserInfo = document.querySelector('.user-info, .balance, .username') !== null;

        const url = window.location.href.toLowerCase();
        const isLoggedInUrl = url.includes('/dashboard') || url.includes('/home') || url.includes('/main');

        return {
            hasLoginForm,
            hasLogoutBtn,
            hasUserInfo,
            isLoggedInUrl,
            likelyLoggedIn: !hasLoginForm && (hasLogoutBtn || hasUserInfo || isLoggedInUrl)
        };
    });

    // Results
    console.log('\n📋 Transfer Results:');
    console.log('✅ Success:', transferResult.success);
    console.log('📊 Transferred:', transferResult.transferred);
    console.log('🎯 Final tokens:', transferResult.finalState.foundTokens);
    console.log('🔐 Likely logged in:', loginStatus.likelyLoggedIn);

    if (transferResult.errors.length > 0) {
        console.log('❌ Errors:', transferResult.errors);
    }

    return {
        success: transferResult.success && loginStatus.likelyLoggedIn,
        transferResult,
        loginStatus,
        sessionData
    };
}

module.exports = testSessionTransfer;