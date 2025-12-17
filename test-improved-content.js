/**
 * Test script để inject improved content script vào trang hiện tại
 * Chạy script này trong console của trang NOHU để test
 */

// Inject improved content script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('tools/nohu-tool/extension/content-improved.js');
script.onload = function () {

    // Test removing SAFE MODE notifications

    // Create a fake SAFE MODE notification to test removal
    const testNotification = document.createElement('div');
    testNotification.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
            🛡️ SAFE MODE COMPLETE
        </div>
        <div style="font-size: 16px; margin-bottom: 5px;">
            Site: Test Site
        </div>
        <div style="font-size: 14px; margin-bottom: 5px;">
            Status: ✅ SUCCESS
        </div>
    `;
    testNotification.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 99999;
        background: linear-gradient(135deg, #00ff00, #00cc00);
        color: white; padding: 20px;
        border-radius: 15px; font-family: Arial, sans-serif;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        min-width: 250px;
    `;

    document.body.appendChild(testNotification);

    // It should be removed automatically by the improved script
    setTimeout(() => {
        const remaining = document.querySelectorAll('div').length;

        const safeModeElements = Array.from(document.querySelectorAll('div')).filter(div =>
            div.innerHTML && div.innerHTML.includes('SAFE MODE COMPLETE')
        );

        if (safeModeElements.length === 0) {
        } else {
            console.log('❌ Test failed: SAFE MODE notification still exists');
        }
    }, 1000);

    // Test token monitoring
    console.log('🔍 Testing token monitoring...');

    if (window.TokenMonitor) {
        const monitor = new window.TokenMonitor();

        monitor.onTokenFound((tokenInfo) => {
            console.log('✅ Token monitor test: Token detected!', tokenInfo);
        });

        monitor.startMonitoring();

        // Test with fake token
        setTimeout(() => {
            console.log('🧪 Setting fake token for test...');
            document.cookie = 'test_token=fake_token_value_for_testing_12345; path=/';

            setTimeout(() => {
                monitor.stopMonitoring();
                // Clean up test token
                document.cookie = 'test_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                console.log('🧹 Test token cleaned up');
            }, 2000);
        }, 1000);
    }
};

document.head.appendChild(script);

// Alternative: Direct injection for immediate testing
const directScript = document.createElement('script');
directScript.textContent = `
// Direct injection for immediate testing

// Remove SAFE MODE notifications immediately
function removeSafeModeNotification() {
    const indicators = document.querySelectorAll('div');
    let removed = 0;
    
    indicators.forEach(div => {
        if (div.innerHTML && div.innerHTML.includes('SAFE MODE COMPLETE')) {
            div.remove();
            removed++;
        }
    });

    // Prevent future notifications
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
    
    return removed;
}

// Execute immediately
const removedCount = removeSafeModeNotification();

// Enhanced token detection for immediate redirect
function setupImmediateTokenRedirect() {
    console.log('🔍 Setting up immediate token redirect...');
    
    let tokenFound = false;
    
    const checkForToken = () => {
        if (tokenFound) return false;
        
        const cookies = document.cookie;
        const tokenNames = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'jwt'];
        
        for (const name of tokenNames) {
            if (cookies.includes(\`\${name}=\`)) {
                const match = cookies.match(new RegExp(\`\${name}=([^;]+)\`));
                if (match && match[1] && match[1].length > 10) {
                    tokenFound = true;
                    console.log(\`🎉 TOKEN DETECTED: \${name} - Redirecting immediately!\`);
                    
                    // Immediate redirect
                    const withdrawUrl = window.location.origin + '/Financial?type=withdraw';
                    console.log('🚀 Immediate redirect to:', withdrawUrl);
                    
                    sessionStorage.setItem('tokenDetectedAt', new Date().toISOString());
                    sessionStorage.setItem('redirectedFrom', window.location.href);
                    
                    window.location.href = withdrawUrl;
                    return true;
                }
            }
        }
        return false;
    };
    
    // Check immediately
    checkForToken();
    
    // Check every 200ms for ultra-fast detection
    const interval = setInterval(() => {
        if (checkForToken()) {
            clearInterval(interval);
        }
    }, 200);
    
    // Stop after 30 seconds
    setTimeout(() => {
        clearInterval(interval);
        console.log('⏰ Token monitoring timeout');
    }, 30000);
    
    console.log('✅ Immediate token redirect monitoring active');
}

// Setup immediate redirect if on register page
if (window.location.href.includes('/Register')) {
    setupImmediateTokenRedirect();
}

`;

document.head.appendChild(directScript);
