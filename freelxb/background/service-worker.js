// Service Worker - xử lý background tasks

const SITE_URL = {
    'shbet': 'https://shbet800.com/Account/Register',
    'f8bet': 'https://f8beta2.com/Account/Register',
    'new88': 'https://new88okvip.com/Account/Register',
    'hi88': 'https://17hello88.com/Account/Register',
    '789bet': 'https://789b77.com/Account/Register',
    'mb66': 'https://ttkm-mb66okvip.com/Account/Register',
    'j88': 'https://u888qj.link/Account/Register',
    'u888': 'https://u888qj.link/Account/Register',
    'abc8': 'https://abc29.ink/Account/Register',
    '88clb': 'https://88clb2jt.bio/Account/Register',
    'qq88': 'https://w.qq8886.com/Account/Register',
    'rr88': 'https://w.rr3311.com/Account/Register',
    'xx88': 'https://w.xx88.fun/Account/Register',
    'mm88': 'https://w.2mm88.com/Account/Register',
    'x88': 'https://x88004.com/Account/Register',
    '89bet': 'https://89bet6.com/Account/Register',
    'hubet': 'https://hubet36.com/Account/Register',
    'king88': 'https://78king88.com/Account/Register',
    'cwin': 'https://cwin59.com/Account/Register',
    'hello88': 'https://17hello88.com/Account/Register',
    'win55': 'https://win55www.com/Account/Register',
    'go99': 'https://go99.com/Account/Register',
    'nohu': 'https://nohu.com/Account/Register',
    'tt88': 'https://tt88.com/Account/Register',
    'mmoo': 'https://0mmoo.com/Account/Register',
    '789p': 'https://789p.com/Account/Register',
    'jun88': 'https://jun88.com/Account/Register',
    '78win': 'https://78win8.pro/Account/Register',
    'pg66': 'https://pg66.com/Account/Register',
    '8kbet': 'https://8kbet.com/Account/Register',
    '789win': 'https://789win.com/Account/Register',
    '88vv': 'https://88vv.com/Account/Register',
    '98win': 'https://98win.com/Account/Register',
    '33win': 'https://33win.com/Account/Register',
    'vswin': 'https://vswin.org/Account/Register',
    'ffok': 'https://ffok.com/Account/Register',
    'xin88': 'https://xin88.com.vn/Account/Register',
    'gk88': 'https://gk88vip2.xyz/Account/Register',
    'kuwin': 'https://kuwin2.co/Account/Register',
    'okvnd': 'https://okvnd.com/Account/Register',
    'kl99': 'https://kl99.cookie.vn/Account/Register',
    'okking': 'https://okking72.com/Account/Register',
    '39bet': 'https://39bet16.com/Account/Register'
};

// Promo URLs - chia thành 2 loại: deposit (nạp đầu) và experience (trải nghiệm)
const PROMO_URL = {
    // Khuyến mãi nạp đầu (deposit)
    deposit: {
        'shbet': 'https://khuyenmai-shbet02.pages.dev/?promo_id=SH57K2',
        'f8bet': 'https://f8beta2.com/Promo/Deposit',
        'new88': 'https://new88okvip.com/Promo/Deposit',
        'hi88': 'https://17hello88.com/Promo/Deposit',
        '789bet': 'https://789b77.com/Promo/Deposit',
        'mb66': 'https://ttkm-mb66okvip.com/Promo/Deposit',
        'j88': 'https://u888qj.link/Promo/Deposit',
        'u888': 'https://u888qj.link/Promo/Deposit',
        'abc8': 'https://abc29.ink/Promo/Deposit',
        '88clb': 'https://88clb2jt.bio/Promo/Deposit',
        'qq88': 'https://w.qq8886.com/Promo/Deposit',
        'rr88': 'https://w.rr3311.com/Promo/Deposit',
        'xx88': 'https://w.xx88.fun/Promo/Deposit',
        'mm88': 'https://w.2mm88.com/Promo/Deposit',
        'x88': 'https://x88004.com/Promo/Deposit'
    },
    // Khuyến mãi trải nghiệm (experience)
    experience: {
        'shbet': 'https://khuyenmai-shbet02.pages.dev/?promo_id=SH57K',
        'f8bet': 'https://f8beta2.com/Promo/Experience',
        'new88': 'https://new88okvip.com/Promo/Experience',
        'hi88': 'https://17hello88.com/Promo/Experience',
        '789bet': 'https://789b77.com/Promo/Experience',
        'mb66': 'https://ttkm-mb66okvip.com/Promo/Experience',
        'j88': 'https://u888qj.link/Promo/Experience',
        'u888': 'https://u888qj.link/Promo/Experience',
        'abc8': 'https://abc29.ink/Promo/Experience',
        '88clb': 'https://88clb2jt.bio/Promo/Experience',
        'qq88': 'https://w.qq8886.com/Promo/Experience',
        'rr88': 'https://w.rr3311.com/Promo/Experience',
        'xx88': 'https://w.xx88.fun/Promo/Experience',
        'mm88': 'https://w.2mm88.com/Promo/Experience',
        'x88': 'https://x88004.com/Promo/Experience'
    }
};

// Mở nhiều trang web cùng lúc
async function runBatchOpen({ sites = [] }) {
    if (!sites.length) return;

    for (const site of sites) {
        const url = SITE_URL[site];
        if (url) {
            chrome.tabs.create({ url, active: false });
        }
    }
}

// Mở trang xin khuyến mãi
async function runPromoOpen({ sites = [], payload = {} }) {
    if (!sites.length) return;

    const promoType = payload.promoType || 'deposit'; // Default: deposit
    console.log('[bg] Opening promo pages for type:', promoType);

    // Lưu payload vào storage
    chrome.storage.local.set({ lastPromoPayload: payload }, () => {
        for (const site of sites) {
            const url = PROMO_URL[promoType]?.[site];
            if (url) {
                console.log('[bg] Opening promo URL:', url);
                chrome.tabs.create({ url, active: false });
            } else {
                console.warn('[bg] Promo URL not found for site:', site, 'type:', promoType);
            }
        }
    });
}

const CAPTCHA_API_BASE = 'https://autocaptcha.pro/apiv3';

// Xử lý API call từ content script (bypass CORS)
async function handleApiCall(endpoint, method, body, apiKey) {
    try {
        const options = {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        console.log('[bg] API Call:', endpoint, method);

        const response = await fetch(endpoint, options);
        const data = await response.json();

        console.log('[bg] API Response:', data);

        return data;
    } catch (error) {
        console.error('[bg] API Error:', error);
        throw error;
    }
}

// Giải image captcha
async function solveImageCaptcha(base64Image, apiKey) {
    try {
        console.log('[bg] Solving image captcha...');

        const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

        const requestBody = {
            type: "ImageToTextTask",
            body: cleanBase64,
            key: apiKey
        };

        const response = await fetch(`${CAPTCHA_API_BASE}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const submitData = await response.json();
        console.log('[bg] Submit response:', submitData);

        // Handle direct response format {success: true, captcha: "text"}
        if (submitData.success && submitData.captcha) {
            console.log('[bg] Direct captcha result:', submitData.captcha);
            return submitData.captcha;
        }

        // Handle error
        if (submitData.errorId !== undefined && submitData.errorId !== 0) {
            throw new Error(submitData.message || 'Failed to submit');
        }

        // Handle polling format {errorId: 0, taskId: "xxx"}
        if (submitData.taskId) {
            const taskId = submitData.taskId;
            const result = await pollCaptchaResult(taskId, apiKey);
            return result;
        }

        throw new Error('Unknown API response format');

    } catch (error) {
        console.error('[bg] Image captcha solve error:', error);
        throw error;
    }
}

// Poll for captcha result
async function pollCaptchaResult(taskId, apiKey, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
        await sleep(3000); // Wait 3 seconds

        try {
            console.log(`[bg] Polling attempt ${i + 1}/${maxAttempts}...`);

            const endpoint = `${CAPTCHA_API_BASE}/result?key=${apiKey}&taskId=${taskId}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            console.log('[bg] Poll response:', data);

            // Check if resolved
            if (data.resolved !== null && data.resolved !== undefined) {
                console.log('[bg] Captcha resolved:', data.resolved);
                return data.resolved;
            } else if (data.errorId === 0 && data.resolved === null) {
                console.log('[bg] Still processing...');
                continue;
            } else if (data.errorId !== 0) {
                throw new Error(data.message || 'Failed to get result');
            } else {
                continue;
            }
        } catch (error) {
            console.error('[bg] Poll error:', error);
            if (i === maxAttempts - 1) {
                throw error;
            }
        }
    }

    throw new Error('Timeout waiting for captcha result');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Lắng nghe message từ popup và content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'RUN_BATCH_OPEN') {
        runBatchOpen({ sites: request.sites }).then(() => {
            sendResponse({ ok: true });
        });
        return true;
    }

    if (request.type === 'RUN_PROMO_OPEN') {
        runPromoOpen({ sites: request.sites, payload: request.payload }).then(() => {
            sendResponse({ ok: true });
        });
        return true;
    }

    if (request.action === 'navigate') {
        const { url } = request.data;
        const fullUrl = new URL(url, sender.url).href;

        chrome.tabs.update(sender.tab.id, { url: fullUrl }, () => {
            sendResponse({ success: true, url: fullUrl });
        });

        return true;
    }

    if (request.action === 'solveCaptcha') {
        const { base64Image, apiKey } = request.data;

        solveImageCaptcha(base64Image, apiKey)
            .then(result => {
                sendResponse({ success: true, result });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });

        return true; // Giữ channel mở cho async response
    }

    if (request.action === 'getCookies') {
        const { url } = request.data;

        chrome.cookies.getAll({ url }, (cookies) => {
            const cookieMap = {};
            cookies.forEach(cookie => {
                cookieMap[cookie.name] = cookie.value;
            });

            console.log('[bg] Cookies retrieved:', Object.keys(cookieMap));
            sendResponse({ success: true, cookies: cookieMap });
        });

        return true; // Giữ channel mở cho async response
    }

    if (request.action === 'apiCall') {
        const { endpoint, method, body, apiKey } = request.data;

        handleApiCall(endpoint, method, body, apiKey)
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });

        return true; // Giữ channel mở cho async response
    }
});
