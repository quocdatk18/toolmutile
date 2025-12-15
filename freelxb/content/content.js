// Content script - tự động điền form trên các trang web
console.log('[reg-acc] Content script loaded');

let isProcessing = false;
let hasRedirected = false;
async function clickElementNaturally(element) {
    if (!element) {
        console.warn('[reg-acc] Element is null');
        return false;
    }

    console.log('[reg-acc] Simulating natural click on:', element.tagName, element.textContent.trim().substring(0, 30));

    try {
        const rect = element.getBoundingClientRect();

        // Kiểm tra nếu element nằm ngoài viewport
        if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
            console.log('[reg-acc] Element not fully visible, scrolling into view...');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(400);
        }

        const x = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
        const y = rect.top + rect.height / 2 + (Math.random() * 10 - 5);
        console.log('[reg-acc] Click position:', { x, y });

        // Focus element first
        if (element.focus) {
            console.log('[reg-acc] Focusing element...');
            element.focus();
            await delay(100);
        }

        // Dispatch mouse events
        console.log('[reg-acc] Dispatching mousedown...');
        element.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            buttons: 1
        }));
        await delay(50 + Math.random() * 50);

        console.log('[reg-acc] Dispatching mouseup...');
        element.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y
        }));
        await delay(50);

        console.log('[reg-acc] Dispatching click...');
        element.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y
        }));

        // Native click as fallback
        element.click();
        await delay(100);

        console.log('[reg-acc] Natural click sequence completed');
        return true;
    } catch (error) {
        console.error('[reg-acc] Click error:', error);
        // Fallback to simple click
        try {
            element.click();
        } catch (e) {
            console.error('[reg-acc] Fallback click also failed:', e);
        }
        return false;
    }
}

// Kiểm tra nếu đang ở trang ChangeMoneyPassword thì xử lý riêng
if (window.location.pathname.includes('/Account/ChangeMoneyPassword')) {
    console.log('[reg-acc] On ChangeMoneyPassword page, handling withdrawal password...');

    window.addEventListener('load', () => {
        chrome.storage.local.get(['lastRunPayload'], (result) => {
            if (result.lastRunPayload && !isProcessing) {
                isProcessing = true;
                setTimeout(() => {
                    fillWithdrawalPassword(result.lastRunPayload);
                }, 1000);
            }
        });
    });
}

// Kiểm tra nếu đang ở trang Financial (thêm ngân hàng) thì xử lý riêng
if (window.location.pathname.includes('/Financial') && window.location.search.includes('type=withdraw')) {
    console.log('[reg-acc] On Financial withdraw page, handling bank info...');

    const handleBankForm = async () => {
        console.log('[reg-acc] handleBankForm called, waiting for form to render...');

        // Chờ form render xong bằng cách tìm 3 element chính
        let attempts = 0;
        const maxAttempts = 40; // 40 * 500ms = 20 seconds

        while (attempts < maxAttempts) {
            attempts++;

            // Tìm 3 element chính của form
            const bankDropdown = document.querySelector('mat-select, [role="combobox"], .mat-select-trigger, .select-wrapper, .dropdown-toggle');
            const cityInput = document.querySelector('input[formcontrolname="city"]');
            const accountInput = document.querySelector('input[formcontrolname="account"]');

            // Kiểm tra tất cả 3 element đều visible
            if (bankDropdown && bankDropdown.offsetParent !== null &&
                cityInput && cityInput.offsetParent !== null &&
                accountInput && accountInput.offsetParent !== null) {
                console.log(`[reg-acc] ✅ Form fully rendered! (attempt ${attempts})`);

                // Form đã render, lấy data và điền
                chrome.storage.local.get(['lastRunPayload', 'bankFormSubmitted'], (result) => {
                    // Kiểm tra nếu form đã được submit rồi thì không submit lại
                    if (result.bankFormSubmitted) {
                        console.log('[reg-acc] ⚠️ Bank form already submitted, skipping...');
                        return;
                    }

                    if (result.lastRunPayload && !isProcessing) {
                        isProcessing = true;
                        console.log('[reg-acc] ✅ Calling fillBankInfoForm with data:', result.lastRunPayload);
                        console.log('[reg-acc] Data bankName:', result.lastRunPayload.bankName);
                        fillBankInfoForm(result.lastRunPayload).catch(err => {
                            console.error('[reg-acc] ❌ fillBankInfoForm error:', err);
                        });
                    } else {
                        console.log('[reg-acc] ⚠️ Conditions not met:', {
                            hasPayload: !!result.lastRunPayload,
                            isProcessing: isProcessing
                        });
                    }
                });

                return;
            }

            if (attempts % 5 === 0) {
                console.log(`[reg-acc] Waiting for form to render... (attempt ${attempts}/${maxAttempts})`);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.error('[reg-acc] ❌ Form did not render after 20 seconds');
    };

    // Gọi ngay nếu trang đã load
    if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
            console.log('[reg-acc] Page load event fired, calling handleBankForm');
            handleBankForm();
        });
    } else {
        console.log('[reg-acc] Page already loaded, calling handleBankForm immediately');
        handleBankForm();
    }
}

// Định nghĩa selectors cho 4 loại form
const FORM_SELECTORS = {
    // Type 1: OKVIP - dùng formcontrolname
    type1: {
        username: ['input[formcontrolname="account"]', 'input[name="account"]'],
        password: ['input[formcontrolname="password"]', 'input[name="password"]'],
        confirmPassword: ['input[formcontrolname="repass"]', 'input[name="repass"]'],
        fullname: ['input[formcontrolname="name"]', 'input[name="name"]'],
        phone: ['input[formcontrolname="mobile"]', 'input[name="mobile"]'],
        email: ['input[formcontrolname="email"]', 'input[name="email"]'],
        checkCode: ['input[formcontrolname="checkCode"]', 'input[name="checkCode"]'],
        agree: ['input[formcontrolname="agree"]', 'input[name="agree"]'],
        withdrawalPassword: ['input[formcontrolname="newPassword"]', 'input[name="newPassword"]'],
        withdrawalPasswordConfirm: ['input[formcontrolname="confirm"]', 'input[name="confirm"]']
    },
    // Type 2: KJC - chờ bạn gửi form
    type2: {
        username: ['input[name="username"]', 'input[id*="username"]'],
        password: ['input[name="password"]', 'input[type="password"]'],
        confirmPassword: ['input[name="confirmPassword"]', 'input[name="repass"]'],
        fullname: ['input[name="fullname"]', 'input[name="name"]'],
        phone: ['input[name="phone"]', 'input[name="mobile"]'],
        email: ['input[name="email"]', 'input[type="email"]'],
        withdrawalPassword: ['input[name="newPassword"]', 'input[name="withdrawalPassword"]'],
        withdrawalPasswordConfirm: ['input[name="confirm"]', 'input[name="confirmPassword"]']
    },
    // Type 3: ABCVIP - dùng formcontrolname
    type3: {
        username: ['input[formcontrolname="account"]', 'input[name="account"]'],
        password: ['input[formcontrolname="password"]', 'input[name="password"]'],
        confirmPassword: ['input[formcontrolname="repass"]', 'input[name="repass"]'],
        fullname: ['input[formcontrolname="name"]', 'input[name="name"]'],
        phone: ['input[formcontrolname="mobile"]', 'input[name="mobile"]'],
        email: ['input[formcontrolname="email"]', 'input[name="email"]'],
        birthday: ['input[formcontrolname="birthday"]', 'input[name="birthday"]'],
        checkCode: ['input[formcontrolname="checkCode"]', 'input[name="checkCode"]'],
        agree: ['input[formcontrolname="agree"]', 'input[name="agree"]'],
        withdrawalPassword: ['input[formcontrolname="newPassword"]', 'input[name="newPassword"]'],
        withdrawalPasswordConfirm: ['input[formcontrolname="confirm"]', 'input[name="confirm"]']
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FILL_FORM') {
        fillFormAndSubmit(request.data);
        sendResponse({ success: true });
    }
});

// Lắng nghe khi trang load xong
window.addEventListener('load', () => {
    // CRITICAL: Không reset hasRedirected flag - nó được dùng để ngăn redirect lặp
    // hasRedirected = false;

    // CRITICAL: Reset isProcessing khi load trang Financial
    if (window.location.pathname.includes('/Financial')) {
        console.log('[reg-acc] 🔄 Resetting isProcessing flag for Financial page');
        isProcessing = false;
    }

    // Clear flags khi load trang đăng ký (không phải Financial page)
    if (!window.location.pathname.includes('/Financial')) {
        chrome.storage.local.set({
            bankFormSubmitted: false,
            hasRedirectedSession: false  // Clear redirect flag khi load trang mới
        }, () => {
            console.log('[reg-acc] Cleared bankFormSubmitted and hasRedirectedSession flags');
        });
    }

    // Check if on promo page (not on registration domain)
    const isPromoPage = !isOnRegistrationSite(window.location.hostname);

    if (isPromoPage) {
        console.log('[reg-acc] On Promo page, handling promo logic...');

        // Retry logic để chờ payload được lưu
        let retries = 0;
        const maxRetries = 10;

        const checkPayload = () => {
            chrome.storage.local.get(['lastPromoPayload'], (result) => {
                if (result.lastPromoPayload && !isProcessing) {
                    console.log('[reg-acc] ✅ Found promo payload, starting handler');
                    isProcessing = true;
                    handlePromoPage(result.lastPromoPayload);
                } else if (retries < maxRetries) {
                    retries++;
                    console.log(`[reg-acc] Waiting for payload... (${retries}/${maxRetries})`);
                    setTimeout(checkPayload, 500);
                } else {
                    console.warn('[reg-acc] ⚠️ Promo payload not found after retries');
                }
            });
        };

        checkPayload();
        return;
    }

    chrome.storage.local.get(['lastRunPayload'], (result) => {
        // CRITICAL: Check if on registration page BEFORE setting isProcessing
        const isRegistrationPage = !window.location.pathname.includes('/Account/ChangeMoneyPassword') &&
            !window.location.pathname.includes('/Financial');

        if (result.lastRunPayload && !isProcessing && isRegistrationPage) {
            isProcessing = true;
            setTimeout(() => {
                fillFormAndSubmit(result.lastRunPayload);
            }, 1000);
        }
    });
});

async function fillFormAndSubmit(data) {
    try {
        console.log('[reg-acc] Starting form fill and submit...', data);

        // Kiểm tra nếu không phải trang đăng ký thì skip
        if (window.location.pathname.includes('/Account/ChangeMoneyPassword') ||
            window.location.pathname.includes('/Financial')) {
            console.log('[reg-acc] ⚠️ Not on registration page, skipping fillFormAndSubmit');
            return;
        }

        // Check if current domain matches any registration domain
        const currentHost = window.location.hostname;
        const isRegistrationDomain = isOnRegistrationSite(currentHost);

        if (!isRegistrationDomain) {
            console.log('[reg-acc] ⚠️ Not on registration domain, skipping fillFormAndSubmit');
            return;
        }

        let formType = detectFormType();
        console.log('[reg-acc] Form type:', formType);

        // Bước 1: Điền thông tin cơ bản
        await fillBasicInfo(data);
        await delay(800);

        // Bước 2: Xử lý captcha nếu cần
        await handleCaptcha(formType, data);
        await delay(500);

        // Bước 3: Điền thông tin ngân hàng (nếu có form riêng)
        if (data.bankName) {
            await fillBankInfo(data);
            await delay(500);
        }

        // Bước 4: Tìm và click nút submit
        await autoSubmit();

        // Bước 5: Check token ngay sau submit (skip nếu ở trang promo)
        const isPromoPage = !isOnRegistrationSite(window.location.hostname);
        if (!isPromoPage) {
            await checkTokenAndRedirect();
        } else {
            console.log('[reg-acc] On promo page, skipping redirect');
        }

        console.log('[reg-acc] Form submitted successfully');
    } catch (error) {
        console.error('[reg-acc] Error:', error);
    }
}

// Xử lý trang xin khuyến mãi
async function handlePromoPage(data) {
    try {
        console.log('[reg-acc] ========== HANDLING PROMO PAGE ==========');
        console.log('[reg-acc] Promo data:', data);

        const { username, promoType, selectedSites } = data;
        const currentHost = window.location.hostname;

        // Xác định site hiện tại từ selectedSites
        let currentSite = null;
        if (selectedSites && selectedSites.length > 0) {
            currentSite = selectedSites.find(site => currentHost.includes(site));
            console.log('[reg-acc] Current site:', currentSite);
        }

        // Xác định type dựa trên site
        let promoType_detected = 'unknown';
        if (currentSite) {
            // OKVIP sites
            if (['shbet', 'f8bet', 'new88', 'hi88', '789bet', 'mb66'].includes(currentSite)) {
                promoType_detected = 'okvip';
            }
            // KJC sites
            else if (['qq88', 'rr88', 'xx88', 'mm88', 'x88'].includes(currentSite)) {
                promoType_detected = 'kjc';
            }
            // ABCVIP sites
            else if (['j88', 'u888', 'abc8', '88clb'].includes(currentSite)) {
                promoType_detected = 'abcvip';
            }
        }
        console.log('[reg-acc] Detected promo type:', promoType_detected);

        // Gọi hàm xử lý tương ứng
        if (promoType_detected === 'okvip') {
            await handlePromoOKVIP(username, promoType);
        } else if (promoType_detected === 'kjc') {
            await handlePromoKJC(username, promoType);
        } else if (promoType_detected === 'abcvip') {
            await handlePromoABCVIP(username, promoType);
        } else {
            console.warn('[reg-acc] ⚠️ Unknown promo type:', promoType_detected);
        }

        console.log('[reg-acc] ✅ Promo page handled successfully');
    } catch (error) {
        console.error('[reg-acc] ❌ Error handling promo page:', error);
    }
}

// Xử lý xin khuyến mãi OKVIP
async function handlePromoOKVIP(username, promoType) {
    console.log('[reg-acc] === HANDLING PROMO OKVIP ===');
    console.log('[reg-acc] Username:', username);
    console.log('[reg-acc] Promo type:', promoType);

    try {
        // Tìm input username
        const usernameInput = document.querySelector('input[formcontrolname="account"]') ||
            document.querySelector('input[name="account"]') ||
            document.querySelector('input[placeholder*="tài khoản"]');

        if (usernameInput) {
            usernameInput.focus();
            usernameInput.value = username;
            usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[reg-acc] ✅ Filled username:', username);
            await delay(500);
        } else {
            console.warn('[reg-acc] ⚠️ Username input not found');
        }

        // Tìm select promo type
        const promoSelect = document.querySelector('select[formcontrolname="promoType"]') ||
            document.querySelector('select[name="promoType"]') ||
            document.querySelector('mat-select');

        if (promoSelect) {
            // Nếu là mat-select
            if (promoSelect.tagName === 'MAT-SELECT') {
                promoSelect.click();
                await delay(500);

                const options = document.querySelectorAll('mat-option');
                for (const option of options) {
                    if (option.textContent.trim().toUpperCase().includes(promoType.toUpperCase())) {
                        option.click();
                        console.log('[reg-acc] ✅ Selected promo type:', promoType);
                        await delay(500);
                        break;
                    }
                }
            } else {
                // Nếu là select thường
                const options = promoSelect.querySelectorAll('option');
                for (const option of options) {
                    if (option.textContent.toUpperCase().includes(promoType.toUpperCase())) {
                        promoSelect.value = option.value;
                        promoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('[reg-acc] ✅ Selected promo type:', promoType);
                        await delay(500);
                        break;
                    }
                }
            }
        } else {
            console.warn('[reg-acc] ⚠️ Promo type select not found');
        }

        // Tìm nút submit "Bắt đầu xin khuyến mãi"
        const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.includes('Bắt đầu xin khuyến mãi') ||
            btn.textContent.includes('xin khuyến mãi')
        ) || document.querySelector('button[type="submit"]') ||
            document.querySelector('button.btn-submit');

        if (submitBtn) {
            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(300);
            submitBtn.click();
            console.log('[reg-acc] ✅ Clicked submit button:', submitBtn.textContent.trim());
        } else {
            console.warn('[reg-acc] ⚠️ Submit button not found');
        }

    } catch (error) {
        console.error('[reg-acc] ❌ Error handling OKVIP promo:', error);
    }
}

// Xử lý xin khuyến mãi KJC (placeholder)
async function handlePromoKJC(username, promoType) {
    console.log('[reg-acc] === HANDLING PROMO KJC ===');
    console.log('[reg-acc] KJC promo logic not implemented yet');
}

// Xử lý xin khuyến mãi ABCVIP (placeholder)
async function handlePromoABCVIP(username, promoType) {
    console.log('[reg-acc] === HANDLING PROMO ABCVIP ===');
    console.log('[reg-acc] ABCVIP promo logic not implemented yet');
}

// Kiểm tra xem có phải domain đăng ký không
function isOnRegistrationSite(hostname) {
    const registrationDomains = [
        'shbet800.com',
        'f8beta2.com',
        'new88okvip.com',
        '17hello88.com',
        '789b77.com',
        'ttkm-mb66okvip.com',
        'u888qj.link',
        'abc29.ink',
        '88clb2jt.bio',
        'w.qq8886.com',
        'w.rr3311.com',
        'w.xx88.fun',
        'w.2mm88.com',
        'x88004.com',
        '89bet6.com',
        'hubet36.com',
        '78king88.com',
        'cwin59.com',
        'win55www.com'
    ];

    return registrationDomains.some(domain => hostname.includes(domain));
}

function detectFormType() {
    const url = window.location.hostname;

    // Type 1: OKVIP
    if (url.includes('shbet') || url.includes('f8bet') || url.includes('new88') ||
        url.includes('hi88') || url.includes('789bet') || url.includes('mb66')) {
        return 'type1';
    }

    // Type 2: KJC
    if (url.includes('qq88') || url.includes('rr88') || url.includes('xx88') ||
        url.includes('mm88') || url.includes('x88')) {
        return 'type2';
    }

    // Type 3: ABCVIP
    if (url.includes('j88') || url.includes('u888') || url.includes('abc8') ||
        url.includes('88clb') || url.includes('abcvip')) {
        return 'type3';
    }

    // Type 4: Tự động
    return 'type4';
}

async function handleCaptcha(formType, data) {
    console.log('[reg-acc] Handling captcha...');

    // Tìm input captcha
    const captchaSelectors = [
        'input[formcontrolname="checkCode"]',
        'input[name="checkCode"]',
        'input[placeholder*="mã xác minh"]',
        'input[placeholder*="captcha"]',
        'input[id*="captcha"]'
    ];

    for (const selector of captchaSelectors) {
        const captchaInput = document.querySelector(selector);
        if (captchaInput && captchaInput.offsetParent !== null) {
            console.log('[reg-acc] Found captcha input');

            // Tìm ảnh captcha gần input
            let captchaImg = null;

            // Cách 1: Tìm ảnh trong parent của input
            const parent = captchaInput.closest('div, form, fieldset');
            if (parent) {
                const images = parent.querySelectorAll('img');
                console.log('[reg-acc] Images in parent:', images.length);
                for (const img of images) {
                    const src = img.src;
                    console.log('[reg-acc] Image src:', src.substring(0, 100));
                    // Lọc ảnh base64 có kích thước lớn (captcha thường > 1000 bytes)
                    if (src.includes('data:image') && src.length > 1000) {
                        captchaImg = img;
                        console.log('[reg-acc] Found captcha image in parent, size:', src.length);
                        break;
                    }
                }
            }

            // Cách 2: Nếu không tìm thấy, tìm tất cả ảnh base64 lớn
            if (!captchaImg) {
                const allImages = document.querySelectorAll('img');
                console.log('[reg-acc] Total images on page:', allImages.length);
                for (const img of allImages) {
                    const src = img.src;
                    if (src.includes('data:image') && src.length > 1000) {
                        captchaImg = img;
                        console.log('[reg-acc] Found large base64 image, size:', src.length);
                        break;
                    }
                }
            }

            if (captchaImg && data && data.anticaptchaKey) {
                console.log('[reg-acc] Found captcha image, solving...');

                try {
                    // Lấy base64 của ảnh
                    const base64 = await getImageBase64(captchaImg);

                    if (!base64) {
                        console.error('[reg-acc] Failed to get base64 from image');
                        return true;
                    }

                    // Gửi tới API autocaptcha.pro
                    const captchaCode = await solveCaptcha(base64, data.anticaptchaKey);

                    if (captchaCode) {
                        // Điền captcha code
                        captchaInput.value = captchaCode;
                        captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                        captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('[reg-acc] Captcha filled:', captchaCode);
                        return true;
                    } else {
                        console.error('[reg-acc] Failed to solve captcha');
                    }
                } catch (e) {
                    console.error('[reg-acc] Error solving captcha:', e);
                }
            } else {
                console.log('[reg-acc] Captcha image not found or no API key');
            }

            return true;
        }
    }

    console.log('[reg-acc] Captcha input not found');
    return false;
}

async function getImageBase64(img) {
    return new Promise((resolve) => {
        try {
            if (img.src.startsWith('data:')) {
                // Đã là base64 - lấy phần sau dấu phẩy
                const parts = img.src.split(',');
                if (parts.length === 2) {
                    const base64 = parts[1];
                    console.log('[reg-acc] Image is already base64, length:', base64.length);
                    console.log('[reg-acc] Base64 preview:', base64.substring(0, 50));
                    resolve(base64);
                } else {
                    console.error('[reg-acc] Invalid data URL format');
                    resolve(null);
                }
            } else {
                // Fetch ảnh và convert
                console.log('[reg-acc] Fetching image from:', img.src);
                fetch(img.src, { mode: 'cors' })
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.blob();
                    })
                    .then(blob => {
                        console.log('[reg-acc] Got blob, size:', blob.size);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const parts = reader.result.split(',');
                            if (parts.length === 2) {
                                const base64 = parts[1];
                                console.log('[reg-acc] Converted to base64, length:', base64.length);
                                resolve(base64);
                            } else {
                                console.error('[reg-acc] Invalid data URL from FileReader');
                                resolve(null);
                            }
                        };
                        reader.onerror = () => {
                            console.error('[reg-acc] FileReader error');
                            resolve(null);
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(e => {
                        console.error('[reg-acc] Error fetching image:', e);
                        resolve(null);
                    });
            }
        } catch (e) {
            console.error('[reg-acc] Error in getImageBase64:', e);
            resolve(null);
        }
    });
}

async function solveCaptcha(base64, apiKey) {
    try {
        if (!base64) {
            console.error('[reg-acc] No base64 image provided');
            return null;
        }

        console.log('[reg-acc] Sending captcha to background script, base64 length:', base64.length);

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'solveCaptcha',
                data: {
                    base64Image: 'data:image/png;base64,' + base64,
                    apiKey: apiKey
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[reg-acc] Chrome runtime error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    console.log('[reg-acc] Captcha solved:', response.result);
                    resolve(response.result);
                } else {
                    reject(new Error(response?.error || 'Failed to solve captcha'));
                }
            });
        });

    } catch (e) {
        console.error('[reg-acc] Error calling captcha API:', e);
        return null;
    }
}

async function handleSuccessPopup() {
    console.log('[reg-acc] Handling success popup...');

    // Tìm popup thành công
    const popupSelectors = [
        '.swal2-popup',
        '.modal',
        '.popup',
        '[role="dialog"]',
        '.success-popup'
    ];

    for (const selector of popupSelectors) {
        const popup = document.querySelector(selector);
        if (popup && popup.offsetParent !== null) {
            console.log('[reg-acc] Found success popup');

            // Tìm nút đóng hoặc OK
            const closeBtn = popup.querySelector('button.swal2-confirm, button.ok-btn, button.close, .close-btn');
            if (closeBtn) {
                closeBtn.click();
                console.log('[reg-acc] Clicked close button');
                return true;
            }
        }
    }

    return false;
}

async function fillBasicInfo(data) {
    // Xác định loại form dựa trên URL
    let formType = detectFormType();
    console.log('[reg-acc] Detected form type:', formType);

    const selectors = FORM_SELECTORS[formType] || FORM_SELECTORS.type1;

    // Điền username
    if (data.username) {
        fillInput(selectors.username, data.username);
        console.log('[reg-acc] Filled username');
    }

    // Điền password
    if (data.password) {
        fillInput(selectors.password, data.password);
        console.log('[reg-acc] Filled password');
    }

    // Điền confirm password
    if (data.password) {
        fillInput(selectors.confirmPassword, data.password);
        console.log('[reg-acc] Filled confirm password');
    }

    // Điền fullname
    if (data.fullname) {
        fillInput(selectors.fullname, data.fullname);
        console.log('[reg-acc] Filled fullname');
    }

    // Điền phone
    if (data.phone) {
        fillInput(selectors.phone, data.phone);
        console.log('[reg-acc] Filled phone');
    }

    // Điền email
    if (data.gmail) {
        fillInput(selectors.email, data.gmail);
        console.log('[reg-acc] Filled email');
    }

    // Check agree checkbox nếu có
    if (selectors.agree) {
        const agreeCheckbox = document.querySelector(selectors.agree[0]);
        if (agreeCheckbox && !agreeCheckbox.checked) {
            agreeCheckbox.click();
            console.log('[reg-acc] Checked agree checkbox');
        }
    }
}

async function fillBankInfo(data) {
    const selectors = {
        bankName: [
            'input[name="bankName"]',
            'input[name="BankName"]',
            'select[name="bank"]',
            'select[name="Bank"]',
            'input[placeholder*="Ngân hàng"]'
        ],
        accountNumber: [
            'input[name="accountNumber"]',
            'input[name="AccountNumber"]',
            'input[name="account_number"]',
            'input[placeholder*="Số tài khoản"]'
        ],
        branch: [
            'input[name="branch"]',
            'input[name="Branch"]',
            'input[name="chi_nhanh"]',
            'input[placeholder*="Chi nhánh"]'
        ],
        withdrawPass: [
            'input[name="withdrawPass"]',
            'input[name="WithdrawPass"]',
            'input[name="withdraw_password"]',
            'input[placeholder*="Mật khẩu rút"]'
        ]
    };

    if (data.bankName) {
        fillInput(selectors.bankName, data.bankName);
        console.log('[reg-acc] Filled bank name');
    }

    if (data.accountNumber) {
        fillInput(selectors.accountNumber, data.accountNumber);
        console.log('[reg-acc] Filled account number');
    }

    if (data.branch) {
        fillInput(selectors.branch, data.branch);
        console.log('[reg-acc] Filled branch');
    }

    if (data.withdrawPass) {
        fillInput(selectors.withdrawPass, data.withdrawPass);
        console.log('[reg-acc] Filled withdraw password');
    }
}

// Advanced fill input - using native setter (from quocdat)
async function fillInputAdvanced(input, value) {
    if (!input) return false;

    // Scroll into view
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(200);

    input.focus();
    input.click();
    await delay(100);

    // Clear first
    input.value = '';
    await delay(50);

    // Use native setter (like quocdat working version)
    try {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, value);
    } catch (e) {
        // Fallback to direct assignment
        input.value = value;
    }

    // Trigger all necessary events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    await delay(100);

    // Verify value was set
    const success = input.value === value;
    console.log(`[reg-acc] ${success ? '✅' : '❌'} Fill input: "${value}" -> "${input.value}"`);

    return success;
}

function fillInput(selectors, value) {
    for (const selector of selectors) {
        try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (element && element.offsetParent !== null) { // Kiểm tra element visible
                    // Scroll vào view
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Xử lý select element
                    if (element.tagName === 'SELECT') {
                        const options = element.querySelectorAll('option');
                        for (const option of options) {
                            if (option.textContent.toUpperCase().includes(value.toUpperCase())) {
                                element.value = option.value;
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                console.log('[reg-acc] Selected option:', option.textContent);
                                return true;
                            }
                        }
                    }

                    // Focus vào element
                    element.focus();

                    // Clear value cũ
                    element.value = '';

                    // Dispatch input event để trigger Angular/React
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));

                    // Điền giá trị mới
                    element.value = value;

                    // Dispatch events lần nữa
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('blur', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

                    return true;
                }
            }
        } catch (e) {
            console.error('[reg-acc] Error filling input:', e);
        }
    }
    return false;
}

async function autoSubmit() {
    console.log('[reg-acc] Looking for submit button...');

    // Tìm nút submit - ưu tiên button[type="submit"]
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    console.log(`[reg-acc] Found ${submitButtons.length} submit buttons`);

    for (const button of submitButtons) {
        if (button.offsetParent === null) continue; // Skip hidden buttons

        const text = button.textContent.toLowerCase().trim();
        console.log(`[reg-acc] Submit button text: "${text}"`);

        // Scroll vào view
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await delay(500);

        // Click button
        try {
            button.click();
            console.log('[reg-acc] Submit button clicked:', text);
            return true;
        } catch (e) {
            console.error('[reg-acc] Error clicking button:', e);
        }
    }

    // Fallback: tìm button khác
    const allButtons = document.querySelectorAll('button');
    console.log(`[reg-acc] Fallback: Found ${allButtons.length} total buttons`);

    for (const button of allButtons) {
        if (button.offsetParent === null) continue;

        const text = button.textContent.toLowerCase().trim();

        // Tìm nút đăng ký hoặc gửi đi
        if (text.includes('đăng ký') || text.includes('register') ||
            text.includes('submit') || text.includes('ngay') ||
            text.includes('gửi đi') || text.includes('gửi')) {

            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(500);

            try {
                button.click();
                console.log('[reg-acc] Fallback button clicked:', text);
                return true;
            } catch (e) {
                console.error('[reg-acc] Error clicking fallback button:', e);
            }
        }
    }

    console.log('[reg-acc] Submit button not found');
    return false;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



async function checkTokenAndRedirect() {
    console.log('[reg-acc] Checking for token...');

    // Kiểm tra nếu đã redirect rồi thì không redirect lại
    if (hasRedirected) {
        console.log('[reg-acc] ⚠️ Already redirected, skipping...');
        return false;
    }

    // Check if already redirected in this session (persisted in storage)
    return new Promise((resolve) => {
        chrome.storage.local.get(['hasRedirectedSession'], (result) => {
            if (result.hasRedirectedSession) {
                console.log('[reg-acc] ⚠️ Already redirected in this session, skipping...');
                hasRedirected = true;
                resolve(false);
                return;
            }

            performTokenCheck().then(resolve);
        });
    });
}

async function performTokenCheck() {
    console.log('[reg-acc] Performing token check...');

    const maxAttempts = 20; // 10 seconds / 500ms = 20 attempts
    const checkInterval = 500; // 500ms

    for (let i = 0; i < maxAttempts; i++) {
        await delay(checkInterval);

        console.log(`[reg-acc] Token check attempt ${i + 1}/${maxAttempts}`);

        // Gọi background script để lấy cookies
        const result = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'getCookies',
                data: {
                    url: window.location.href
                }
            }, (response) => {
                resolve(response);
            });
        });

        if (!result || !result.success) {
            console.error('[reg-acc] Failed to get cookies:', result?.error);
            continue;
        }

        const cookies = result.cookies || {};
        console.log('[reg-acc] Available cookies:', Object.keys(cookies));
        console.log('[reg-acc] Cookie values:', cookies);

        // Kiểm tra token (_pat và _prt) - case sensitive
        const hasPatToken = cookies['_pat'];
        const hasPrtToken = cookies['_prt'];

        console.log('[reg-acc] _pat value:', hasPatToken);
        console.log('[reg-acc] _prt value:', hasPrtToken);

        if (hasPatToken && hasPrtToken) {
            console.log('[reg-acc] ✅ Token found!');
            console.log('[reg-acc] _pat:', hasPatToken?.substring(0, 20) + '...');
            console.log('[reg-acc] _prt:', hasPrtToken?.substring(0, 20) + '...');

            // Set flag để ngăn chặn redirect lặp
            hasRedirected = true;

            // Persist flag to storage
            chrome.storage.local.set({ hasRedirectedSession: true }, () => {
                console.log('[reg-acc] Set hasRedirectedSession flag');
            });

            // Gọi background script để navigate
            const redirectUrl = '/Account/ChangeMoneyPassword';
            console.log('[reg-acc] Redirecting to:', redirectUrl);

            chrome.runtime.sendMessage({
                action: 'navigate',
                data: {
                    url: redirectUrl
                }
            }, (response) => {
                console.log('[reg-acc] Navigate response:', response);
            });

            return true;
        }

        if (i === maxAttempts - 1) {
            console.warn('[reg-acc] ⚠️ Token not found after 10 seconds');
        }
    }

    console.error('[reg-acc] ❌ Failed to find token within timeout');
    return false;
}

async function fillWithdrawalPassword(data) {
    try {
        console.log('[reg-acc] Filling withdrawal password form...');

        let formType = detectFormType();
        console.log('[reg-acc] Form type:', formType);

        const selectors = FORM_SELECTORS[formType] || FORM_SELECTORS.type1;

        // Điền mật khẩu rút tiền
        if (data.withdrawPass) {
            fillInput(selectors.withdrawalPassword, data.withdrawPass);
            console.log('[reg-acc] Filled withdrawal password');
            await delay(500);
        }

        // Điền xác nhận mật khẩu rút tiền
        if (data.withdrawPass) {
            fillInput(selectors.withdrawalPasswordConfirm, data.withdrawPass);
            console.log('[reg-acc] Filled withdrawal password confirm');
            await delay(500);
        }

        // Tìm và click nút submit
        await autoSubmit();

        // Chờ submit thành công rồi redirect
        await delay(2000);

        // Redirect to Financial withdraw page
        const redirectUrl = '/Financial?type=withdraw';
        console.log('[reg-acc] Redirecting to:', redirectUrl);

        chrome.runtime.sendMessage({
            action: 'navigate',
            data: {
                url: redirectUrl
            }
        }, (response) => {
            console.log('[reg-acc] Navigate response:', response);
        });

        console.log('[reg-acc] Withdrawal password form submitted successfully');
    } catch (error) {
        console.error('[reg-acc] Error filling withdrawal password:', error);
    }
}

async function fillBankInfoForm(data) {
    try {
        console.log('[reg-acc] ========== FILLING BANK INFO FORM ==========');
        console.log('[reg-acc] Data received:', data);
        console.log('[reg-acc] Current URL:', window.location.href);
        console.log('[reg-acc] Filling bank info form...');

        // Chọn ngân hàng - tìm custom dropdown
        if (data.bankName) {
            console.log('[reg-acc] Selecting bank:', data.bankName);
            const bankSelected = await selectBankSimple(data.bankName);
            console.log('[reg-acc] Bank selection result:', bankSelected);
            await delay(800);
        }

        // Điền chi nhánh (city)
        if (data.branch) {
            console.log('[reg-acc] Filling city:', data.branch);
            const cityInput = document.querySelector('input[formcontrolname="city"]');
            if (cityInput) {
                await fillInputAdvanced(cityInput, data.branch);
                console.log('[reg-acc] ✅ Filled city/branch:', data.branch);
            } else {
                console.warn('[reg-acc] ⚠️ City input not found');
            }
        }

        // Điền số tài khoản (account)
        if (data.accountNumber) {
            console.log('[reg-acc] Filling account:', data.accountNumber);
            const accountInput = document.querySelector('input[formcontrolname="account"]');
            if (accountInput) {
                await fillInputAdvanced(accountInput, data.accountNumber);
                console.log('[reg-acc] ✅ Filled account number:', data.accountNumber);
            } else {
                console.warn('[reg-acc] ⚠️ Account input not found');
            }
        }

        // Tìm nút submit - có thể là button.btn-submit hoặc button[type="submit"]
        console.log('[reg-acc] Looking for submit button...');
        const submitBtn = document.querySelector('button.btn-submit') ||
            document.querySelector('button[type="submit"]');

        if (submitBtn) {
            console.log('[reg-acc] ✅ Found submit button, clicking...');
            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(500);
            submitBtn.click();
            console.log('[reg-acc] ✅ Submit button clicked');

            // Set flag để ngăn chặn submit lại
            chrome.storage.local.set({ bankFormSubmitted: true }, () => {
                console.log('[reg-acc] ✅ Set bankFormSubmitted flag');
            });

            await delay(2000);
        } else {
            console.error('[reg-acc] ❌ Submit button not found');
        }

        console.log('[reg-acc] ✅ Bank info form submitted successfully');
    } catch (error) {
        console.error('[reg-acc] ❌ Error filling bank info:', error);
    }
}

// Bank selection - match with existing dropdown options
async function selectBankSimple(bankName) {
    console.log('[reg-acc] === BANK SELECTION ===');
    console.log('[reg-acc] Bank name input:', bankName);

    // Extract bank name without code (e.g. "VPBank (VPB)" -> "VPBank")
    const cleanBankName = bankName.includes('(') ? bankName.split('(')[0].trim() : bankName.trim();
    const searchName = cleanBankName.toUpperCase().trim();
    console.log('[reg-acc] Clean bank name:', cleanBankName);
    console.log('[reg-acc] Search name:', searchName);

    // Find the dropdown - try multiple selectors
    let dropdown = document.querySelector('.mat-select-trigger') ||
        document.querySelector('mat-select') ||
        document.querySelector('[formcontrolname="bankName"]') ||
        document.querySelector('[formcontrolname="bank"]');

    if (!dropdown) {
        console.error('[reg-acc] ❌ Dropdown not found');
        console.log('[reg-acc] Trying to find parent mat-select...');

        // Try to find parent mat-select
        const matSelects = document.querySelectorAll('mat-select');
        console.log('[reg-acc] Found mat-select elements:', matSelects.length);

        for (let i = 0; i < matSelects.length; i++) {
            console.log(`[reg-acc] mat-select ${i}:`, matSelects[i].outerHTML.substring(0, 200));
        }

        return false;
    }

    console.log('[reg-acc] ✅ Found dropdown:', dropdown.tagName, dropdown.className);
    console.log('[reg-acc] Dropdown HTML:', dropdown.outerHTML.substring(0, 300));

    // Scroll into view
    dropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(200);

    // Try touch events first (mobile-friendly)
    try {
        dropdown.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        dropdown.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
        console.log('[reg-acc] Touch events dispatched');
    } catch (e) {
        console.log('[reg-acc] Touch events not supported');
    }

    // Focus and click
    console.log('[reg-acc] Focusing dropdown...');
    dropdown.focus();

    console.log('[reg-acc] Clicking dropdown...');
    dropdown.click();

    // Also try dispatchEvent
    dropdown.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await delay(800); // Wait for dropdown to open

    // Check if it's a SELECT element
    if (dropdown.tagName === 'SELECT') {
        console.log('[reg-acc] Handling SELECT element');
        const options = dropdown.querySelectorAll('option');

        for (const option of options) {
            const text = option.textContent.trim().toUpperCase();
            if (text.includes(searchName)) {
                dropdown.value = option.value;
                dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('[reg-acc] ✅ Selected bank:', text);
                return true;
            }
        }
    } else {
        // For mat-select or custom dropdowns
        console.log('[reg-acc] Handling mat-select/custom dropdown');
        await delay(500); // Wait for options to render

        // Find all options
        const options = document.querySelectorAll('mat-option, [role="option"], .mat-option');
        console.log('[reg-acc] Found options:', options.length);

        // Log all options for debugging (commented out to reduce console noise)
        // for (let i = 0; i < options.length; i++) {
        //     const text = options[i].textContent.trim().toUpperCase();
        //     console.log(`[reg-acc] Option ${i}:`, text);
        // }

        // Try to match with dropdown options
        console.log('[reg-acc] 🔍 Trying to match bank:', searchName);

        for (const option of options) {
            const text = option.textContent.trim();
            const textUpper = text.toUpperCase();

            // Remove spaces and special characters for better matching
            const normalizedText = textUpper.replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
            const normalizedSearch = searchName.replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');

            // console.log('[reg-acc] Comparing:', normalizedText, 'with', normalizedSearch);

            // Exact match or partial match (case-insensitive)
            if (normalizedText === normalizedSearch || textUpper.includes(searchName)) {
                console.log('[reg-acc] ✅ Found matching option:', text);
                // Scroll option into view FIRST
                option.scrollIntoView({ behavior: 'auto', block: 'center' });
                await delay(300);
                // Then click
                option.click();
                console.log('[reg-acc] ✅ Selected bank:', text);
                await delay(300);
                return true;
            }
        }
    }

    console.warn('[reg-acc] ❌ Bank not found in dropdown:', bankName);
    return false;
}

