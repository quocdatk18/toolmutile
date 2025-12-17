/**
 * QUICK FIX - Chạy trực tiếp trong console của trang NOHU
 * Copy và paste code này vào console để:
 * 1. Xóa thông báo "SAFE MODE COMPLETE" 
 * 2. Bật chế độ redirect ngay khi có token
 */

// ===== 1. XÓA THÔNG BÁO SAFE MODE =====
function removeSafeModeNotifications() {

    let removed = 0;
    const allDivs = document.querySelectorAll('div');

    allDivs.forEach(div => {
        if (div.innerHTML && div.innerHTML.includes('SAFE MODE COMPLETE')) {
            div.remove();
            removed++;
        }
    });

    // Ngăn chặn thông báo mới
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.innerHTML && node.innerHTML.includes('SAFE MODE COMPLETE')) {
                    node.remove();
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return removed;
}

// ===== 2. REDIRECT NGAY KHI CÓ TOKEN =====
function setupImmediateRedirect() {
    console.log('🔍 Setting up immediate token redirect...');

    let tokenFound = false;
    let checkCount = 0;

    const checkForToken = () => {
        if (tokenFound) return true;

        checkCount++;
        const cookies = document.cookie;

        // Các tên token phổ biến
        const tokenNames = [
            '_pat', 'token', 'auth_token', 'access_token',
            'session', 'jwt', 'bearer', 'authToken', 'sessionToken'
        ];

        for (const name of tokenNames) {
            if (cookies.includes(`${name}=`)) {
                const match = cookies.match(new RegExp(`${name}=([^;]+)`));
                if (match && match[1] && match[1].length > 10) {
                    tokenFound = true;

                    console.log(`🎉 TOKEN FOUND! ${name} = ${match[1].substring(0, 20)}...`);

                    // Redirect ngay lập tức
                    const withdrawUrl = window.location.origin + '/Financial?type=withdraw';
                    console.log('🚀 IMMEDIATE REDIRECT to:', withdrawUrl);

                    // Lưu thông tin debug
                    sessionStorage.setItem('quickFixRedirect', JSON.stringify({
                        tokenName: name,
                        tokenPreview: match[1].substring(0, 20),
                        redirectTime: new Date().toISOString(),
                        fromUrl: window.location.href,
                        toUrl: withdrawUrl,
                        checksNeeded: checkCount
                    }));

                    // Redirect ngay - không đợi!
                    window.location.href = withdrawUrl;
                    return true;
                }
            }
        }

        // Log progress mỗi 10 lần check
        if (checkCount % 10 === 0) {
            console.log(`🔍 Token check #${checkCount} - no token yet`);
        }

        return false;
    };

    // Check ngay lập tức
    if (checkForToken()) return;

    // Check mỗi 100ms để phát hiện nhanh nhất
    const fastInterval = setInterval(() => {
        if (checkForToken()) {
            clearInterval(fastInterval);
        }
    }, 100);

    // Backup check mỗi 500ms
    const backupInterval = setInterval(() => {
        if (checkForToken()) {
            clearInterval(backupInterval);
        }
    }, 500);

    // Dừng sau 60 giây
    setTimeout(() => {
        clearInterval(fastInterval);
        clearInterval(backupInterval);
        if (!tokenFound) {
            console.log('⏰ Token monitoring timeout after 60 seconds');
        }
    }, 60000);

    console.log('✅ Ultra-fast token monitoring active (100ms intervals)');
}

// ===== 3. MONITOR URL CHANGES =====
function setupUrlMonitor() {
    let currentUrl = window.location.href;

    const urlCheck = setInterval(() => {
        if (window.location.href !== currentUrl) {
            const oldUrl = currentUrl;
            currentUrl = window.location.href;

                from: oldUrl.split('/').pop(),
                to: currentUrl.split('/').pop()
            });

            // Nếu rời khỏi trang Register, check token ngay
            if (oldUrl.includes('/Register') && !currentUrl.includes('/Register')) {
                console.log('🎯 Left Register page - checking for token immediately');
                setupImmediateRedirect();
            }
        }
    }, 100);

    // Dừng sau 5 phút
    setTimeout(() => clearInterval(urlCheck), 300000);
}

// ===== THỰC THI =====

// 1. Xóa thông báo ngay lập tức
const removedCount = removeSafeModeNotifications();

// 2. Bật redirect ngay nếu đang ở trang Register
if (window.location.href.includes('/Register')) {
    setupImmediateRedirect();
} else {
    
}

// 3. Monitor URL changes
setupUrlMonitor();

// 4. Thông báo hoàn thành
console.log('   ⚡ Immediate redirect on token detection (100ms intervals)');
console.log('🎯 Ready! Next registration will redirect immediately when token appears.');

// Export functions for manual use
window.quickFix = {
    removeSafeModeNotifications,
    setupImmediateRedirect,
    setupUrlMonitor,

    // Manual token check
    checkTokenNow: () => {
        const cookies = document.cookie;
        const tokens = [];
        const tokenNames = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'jwt'];

        tokenNames.forEach(name => {
            if (cookies.includes(`${name}=`)) {
                const match = cookies.match(new RegExp(`${name}=([^;]+)`));
                if (match && match[1] && match[1].length > 10) {
                    tokens.push({ name, value: match[1].substring(0, 20) + '...' });
                }
            }
        });

        console.log('🔍 Current tokens:', tokens);
        return tokens;
    },

    // Manual redirect
    redirectNow: () => {
        const withdrawUrl = window.location.origin + '/Financial?type=withdraw';
        console.log('🚀 Manual redirect to:', withdrawUrl);
        window.location.href = withdrawUrl;
    }
};

console.log('🛠️ Manual functions available: window.quickFix.checkTokenNow(), window.quickFix.redirectNow()');