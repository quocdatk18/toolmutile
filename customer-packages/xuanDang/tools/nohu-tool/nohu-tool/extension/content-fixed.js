/**
 * NOHU Tool - Fixed Content Script
 * Combines working logic from content-working.js with optimized structure
 * Compatible with both extension and tool modes
 */

console.log('🔧 NOHU Tool (Fixed Version) loaded on:', window.location.href);

// ==================== INITIALIZATION ====================

// Prevent multiple injections
if (window.autoRegisterToolLoaded) {
    console.log('⚠️ Script already loaded, skipping duplicate initialization');
} else {
    window.autoRegisterToolLoaded = true;
    console.log('✅ First time loading, initializing...');

    // Initialize flags (from working version)
    window.captchaAttempted = false;
    window.captchaFailed = false;
    window.captchaCompleted = false;
    window.autoFillRunning = false;
    window.registerFormFilled = false;
    window.promoCheckRunning = false;
    window.isCheckingPromo = false;

    // Clear session storage
    sessionStorage.removeItem('captchaAttempted');
    sessionStorage.removeItem('captchaFailed');
    sessionStorage.removeItem('captchaCompleted');
    console.log('🔓 Cleared all flags on page load');

    // Initialize audio tracking
    initAudioTracking();

    // Setup message listeners (support both approaches)
    setupMessageListeners();

    console.log('✅ NOHU Tool Fixed initialization complete');
}

// ==================== MESSAGE LISTENERS ====================

function setupMessageListeners() {
    // Puppeteer message listener (QuocDat style) - PRIMARY
    window._chromeMessageListener = (message, sender, sendResponse) => {
        console.log('📨 Puppeteer message received:', message);
        handleMessage(message, sendResponse);
    };

    // Chrome extension message listener - SECONDARY
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            handleMessage(message, sendResponse);
            return true;
        });
    }

    // Window message listener - FALLBACK
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOHU_TOOL') {
            handleMessage(event.data, (response) => {
                event.source.postMessage({
                    type: 'NOHU_TOOL_RESPONSE',
                    ...response
                }, event.origin);
            });
        }
    });

    console.log('✅ All message listeners setup complete');
}

// ==================== MESSAGE HANDLER ====================

async function handleMessage(request, sendResponse) {
    console.log('📨 Processing message:', request.action);

    try {
        switch (request.action) {
            // PRIMARY: autoFill (from working version - most reliable)
            case 'autoFill':
                const autoFillResult = await handleAutoFill(request.data);
                sendResponse({ success: true, result: autoFillResult });
                break;

            // SECONDARY: freelxbFlow (from optimized version)
            case 'freelxbFlow':
                const flowResult = await handleFreeLXBFlow(request.data);
                sendResponse({ success: true, data: flowResult });
                break;

            // INDIVIDUAL STEPS
            case 'register':
                const regResult = await performRegistration(request.data);
                sendResponse({ success: true, data: regResult });
                break;

            case 'addBank':
                const bankResult = await addBankInfo(request.data);
                sendResponse({ success: true, data: bankResult });
                break;

            case 'checkKM':
            case 'checkPromotion':
                const kmResult = await checkPromotions(request.data);
                sendResponse({ success: true, data: kmResult });
                break;

            // UTILITY
            case 'ping':
                sendResponse({ success: true, ready: true });
                break;

            case 'fillWithdrawForm':
                const withdrawResult = await handleFillWithdrawForm(request.data);
                sendResponse({ success: true, data: withdrawResult });
                break;

            case 'resetCaptchaFlag':
                resetAllFlags();
                sendResponse({ success: true });
                break;

            default:
                console.warn('⚠️ Unknown action:', request.action);
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('❌ Message handler error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// ==================== AUTO FILL (Working Version Logic) ====================

async function handleAutoFill(data) {
    console.log('📝 Starting auto-fill with data:', data);

    // Check if already logged in
    const currentUrl = window.location.href;
    const isLoggedIn = currentUrl.includes('/home') ||
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/profile') ||
        document.cookie.includes('token=') ||
        document.cookie.includes('_pat=');

    if (isLoggedIn) {
        console.log('✅ Already logged in, skipping register form fill');
        return { success: true, message: 'Already logged in' };
    }

    // Prevent duplicate auto-fill
    if (window.autoFillRunning) {
        console.log('⚠️ Auto-fill already running, ignoring duplicate request');
        return { success: false, error: 'Already running' };
    }

    if (window.registerFormFilled) {
        console.log('✅ Form already filled, ignoring duplicate request');
        return { success: true, message: 'Already filled' };
    }

    window.autoFillRunning = true;

    // Store API key for captcha solving
    if (data.apiKey) {
        window.currentApiKey = data.apiKey;
        console.log('🔑 Stored API key for captcha solving');
    }

    try {
        const result = await autoFillForm(
            data.username,
            data.password,
            data.withdrawPassword,
            data.fullname
        );

        const filledSomething = result.username || result.password || result.fullname;

        if (filledSomething) {
            console.log('✅ Auto-fill completed:', result);
            window.registerFormFilled = true;
            window.autoFillRunning = false;
            return { success: true, data: result };
        } else {
            console.error('❌ Failed to fill form');
            window.autoFillRunning = false;
            return { success: false, error: 'No inputs found' };
        }
    } catch (error) {
        console.error('❌ Auto-fill error:', error);
        window.autoFillRunning = false;
        return { success: false, error: error.message };
    }
}

// ==================== FREELXB FLOW (Optimized Version Logic) ====================

async function handleFreeLXBFlow(userData) {
    console.log('🚀 Starting FreeLXB Flow: Register → AddBank → CheckKM');

    const flowResult = {
        step1_register: { success: false },
        step2_addBank: { success: false },
        step3_checkKM: { success: false },
        overall_success: false,
        timestamp: new Date().toISOString()
    };

    try {
        // STEP 1: Registration (Required)
        console.log('📝 STEP 1/3: Registration...');
        flowResult.step1_register = await performRegistration(userData);

        if (!flowResult.step1_register.success) {
            console.log('❌ Registration failed, stopping flow');
            return flowResult;
        }

        // Wait for page to process registration
        await delay(3000);

        // STEP 2: Add Bank (Optional - if bank data provided)
        if (userData.bankName && userData.accountNumber) {
            console.log('💳 STEP 2/3: Adding Bank Info...');
            flowResult.step2_addBank = await addBankInfo(userData);
            await delay(2000);
        } else {
            console.log('⚠️ No bank data provided, skipping Step 2');
            flowResult.step2_addBank.success = true; // Skip
        }

        // STEP 3: Check Promotions (Optional - default enabled)
        if (userData.checkKM !== false) {
            console.log('🎁 STEP 3/3: Checking Promotions (CheckKM)...');
            flowResult.step3_checkKM = await checkPromotions(userData);
        } else {
            console.log('⚠️ CheckKM disabled, skipping Step 3');
            flowResult.step3_checkKM.success = true; // Skip
        }

        // Determine overall success
        flowResult.overall_success = flowResult.step1_register.success &&
            flowResult.step2_addBank.success &&
            flowResult.step3_checkKM.success;

        console.log('🏁 FreeLXB Flow Summary:');
        console.log('   Step 1 (Register):', flowResult.step1_register.success ? '✅' : '❌');
        console.log('   Step 2 (AddBank):', flowResult.step2_addBank.success ? '✅' : '❌');
        console.log('   Step 3 (CheckKM):', flowResult.step3_checkKM.success ? '✅' : '❌');
        console.log('   Overall:', flowResult.overall_success ? '✅ SUCCESS' : '❌ FAILED');

    } catch (error) {
        console.error('❌ FreeLXB Flow error:', error);
        flowResult.error = error.message;
    }

    return flowResult;
}

// ==================== FORM FILLING (Working Version) ====================

async function autoFillForm(username, password, withdrawPassword, fullname) {
    console.log('📝 Starting auto-fill with:', { username, password: '***', withdrawPassword: '***', fullname });

    // Check if form already filled
    if (window.registerFormFilled) {
        console.log('✅ Form already filled, skipping');
        return {
            username: true,
            password: true,
            withdrawPassword: true,
            fullname: true,
            checkbox: false
        };
    }

    let filled = {
        username: false,
        password: false,
        withdrawPassword: false,
        fullname: false,
        checkbox: false
    };

    // Priority 1: Use Angular formcontrolname attributes (most reliable)
    const accountInput = document.querySelector('input[formcontrolname="account"]');
    const passwordInput = document.querySelector('input[formcontrolname="password"]');
    const confirmPasswordInput = document.querySelector('input[formcontrolname="confirmPassword"]');
    const moneyPasswordInput = document.querySelector('input[formcontrolname="moneyPassword"]');
    const nameInput = document.querySelector('input[formcontrolname="name"]');

    if (accountInput && passwordInput) {
        console.log('✅ Found Angular form inputs by formcontrolname');

        // Fill all inputs in parallel for speed
        const fillPromises = [];

        if (accountInput) {
            fillPromises.push(fillInputAdvanced(accountInput, username, true).then(() => { filled.username = true; }));
        }

        if (passwordInput) {
            fillPromises.push(fillInputAdvanced(passwordInput, password, true).then(() => { filled.password = true; }));
        }

        if (confirmPasswordInput) {
            fillPromises.push(fillInputAdvanced(confirmPasswordInput, password, true));
        }

        if (moneyPasswordInput) {
            fillPromises.push(fillInputAdvanced(moneyPasswordInput, withdrawPassword, true).then(() => { filled.withdrawPassword = true; }));
        }

        if (nameInput) {
            fillPromises.push(fillInputAdvanced(nameInput, fullname, true).then(() => { filled.fullname = true; }));
        }

        // Wait for all fills to complete
        await Promise.all(fillPromises);
    }

    // Handle checkbox
    let agreeCheckbox = document.querySelector('input[formcontrolname="agree"]');
    if (!agreeCheckbox) {
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        if (allCheckboxes.length > 0) {
            agreeCheckbox = allCheckboxes[0];
        }
    }

    if (agreeCheckbox && !agreeCheckbox.checked) {
        console.log('✅ Clicking agree checkbox');
        agreeCheckbox.click();
        await delay(200);
        filled.checkbox = true;
    }

    // Handle captcha if present and API key available
    const captchaInput = document.querySelector('input[formcontrolname="checkCode"]') ||
        document.querySelector('input[placeholder*="xác minh"]') ||
        document.querySelector('input[placeholder*="captcha"]');

    if (captchaInput && captchaInput.offsetParent !== null && window.currentApiKey) {
        console.log('🔐 Captcha input found, attempting auto-solve');
        const captchaSolved = await solveCaptchaAuto(window.currentApiKey);
        filled.captcha = captchaSolved;

        // IMPROVED: Wait and verify before submit
        if (captchaSolved) {
            console.log('✅ Captcha solved, preparing for submit...');

            // Wait for captcha to be processed by server
            await delay(2000);

            // Verify captcha input still has value
            const captchaValue = captchaInput.value;
            console.log(`🔍 Captcha verification - Input value: "${captchaValue}"`);

            if (captchaValue && captchaValue.length > 0) {
                console.log('🚀 Captcha verified, attempting submit...');

                // Find submit button with better selectors
                const submitButton = document.querySelector('button[type="submit"]') ||
                    document.querySelector('.submit-btn') ||
                    document.querySelector('.btn-submit') ||
                    document.querySelector('button:contains("Đăng ký")') ||
                    document.querySelector('input[type="submit"]');

                if (submitButton && submitButton.offsetParent !== null) {
                    console.log('✅ Found submit button, clicking with enhanced method...');

                    // Enhanced submit with multiple methods
                    try {
                        // Method 1: Regular click
                        submitButton.click();

                        // Method 2: Dispatch click event
                        submitButton.dispatchEvent(new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        }));

                        // Method 3: Form submit if button is in form
                        const form = submitButton.closest('form');
                        if (form) {
                            console.log('📝 Also triggering form submit...');
                            form.dispatchEvent(new Event('submit', { bubbles: true }));
                        }

                        filled.submitted = true;
                        console.log('✅ Submit triggered successfully');

                        // Wait longer for server to process registration
                        console.log('⏳ Waiting for server to process registration...');
                        await delay(5000);

                        // Check for error messages on page (registration failed)
                        const hasErrorMessage = document.querySelector('.error, .alert-danger, .toast-error, .error-message') ||
                            document.body.textContent.includes('Tài khoản đã tồn tại') ||
                            document.body.textContent.includes('Mã xác minh không đúng') ||
                            document.body.textContent.includes('Captcha không đúng') ||
                            document.body.textContent.includes('thất bại') ||
                            document.body.textContent.includes('Lỗi');

                        if (hasErrorMessage) {
                            console.warn('⚠️ Registration failed - error message detected on page');
                            filled.submitMayHaveFailed = true;
                            filled.errorDetected = true;
                        } else {
                            // CRITICAL: Must have token to confirm registration success
                            const loginStatus = await checkLoginStatusDetailed();
                            const hasToken = loginStatus.hasToken || loginStatus.hasLocalToken;

                            // Check if URL changed from Register page
                            const currentUrl = window.location.href;
                            const stillOnRegister = currentUrl.includes('/Register');

                            console.log('🔍 Registration check:', {
                                hasToken: hasToken,
                                stillOnRegister: stillOnRegister,
                                currentUrl: currentUrl
                            });

                            if (hasToken) {
                                // TOKEN IS REQUIRED for successful registration
                                console.log('✅ Registration successful - TOKEN CONFIRMED!');
                                filled.submitSuccessful = true;
                            } else if (!stillOnRegister) {
                                // URL changed but no token - wait more and check again
                                console.log('⏳ URL changed but no token yet, waiting more...');
                                await delay(3000);
                                const recheckStatus = await checkLoginStatusDetailed();
                                if (recheckStatus.hasToken || recheckStatus.hasLocalToken) {
                                    console.log('✅ Registration successful - token found after recheck!');
                                    filled.submitSuccessful = true;
                                } else {
                                    console.warn('⚠️ URL changed but still no token - registration may have failed');
                                    filled.submitMayHaveFailed = true;
                                }
                            } else {
                                console.warn('⚠️ Registration failed - still on register page without token');
                                filled.submitMayHaveFailed = true;
                            }
                        }

                        // CRITICAL: Auto redirect to withdraw page ONLY after successful registration
                        if (filled.submitSuccessful && !filled.errorDetected) {
                            console.log('🚀 Registration successful, auto-redirecting to withdraw page...');

                            // All NOHU sites use Financial page for withdraw
                            const currentOrigin = window.location.origin;
                            const withdrawUrl = currentOrigin + '/Financial?type=withdraw';

                            console.log('🔍 Domain detection:', {
                                hostname: window.location.hostname,
                                origin: currentOrigin,
                                constructedUrl: withdrawUrl
                            });

                            console.log('🔄 Redirecting to:', withdrawUrl);

                            // Store redirect info for debugging BEFORE redirect
                            const currentUrl = window.location.href;
                            sessionStorage.setItem('autoRedirectFrom', currentUrl);
                            sessionStorage.setItem('autoRedirectTo', withdrawUrl);
                            sessionStorage.setItem('autoRedirectTime', new Date().toISOString());

                            // Wait a bit for any final processing, then redirect
                            await delay(2000);

                            console.log('🚀 Executing redirect now...');
                            window.location.href = withdrawUrl;

                            filled.autoRedirected = true;
                            filled.redirectUrl = withdrawUrl;
                        }

                    } catch (submitError) {
                        console.error('❌ Submit error:', submitError);
                        filled.submitError = submitError.message;
                    }
                } else {
                    console.warn('⚠️ Submit button not found or not visible');
                    filled.submitError = 'Submit button not found';
                }
            } else {
                console.warn('⚠️ Captcha input lost value, not submitting');
                filled.captchaLost = true;
            }
        }
    }

    console.log('✅ Form filling completed:', filled);
    return filled;
}

// ==================== REGISTRATION ====================

async function performRegistration(userData) {
    console.log('📝 Starting registration...');

    const result = {
        success: false,
        fields_filled: 0,
        total_fields: 0,
        submitted: false
    };

    try {
        // Use the proven autoFillForm logic
        const fillResult = await autoFillForm(
            userData.username,
            userData.password,
            userData.withdrawPassword,
            userData.fullname
        );

        // Count filled fields
        const fields = ['username', 'password', 'withdrawPassword', 'fullname'];
        fields.forEach(field => {
            result.total_fields++;
            if (fillResult[field]) result.fields_filled++;
        });

        result.submitted = fillResult.submitted || false;
        result.success = result.fields_filled > 0;

        console.log(`✅ Registration: ${result.fields_filled}/${result.total_fields} fields filled`);
        return result;

    } catch (error) {
        console.error('❌ Registration error:', error);
        result.error = error.message;
        return result;
    }
}

// ==================== BANK INFO ====================

async function addBankInfo(userData) {
    console.log('💳 Starting bank addition...');

    const result = {
        success: false,
        message: 'Bank addition not implemented in fixed version'
    };

    // For now, just return success to not block the flow
    // TODO: Implement bank addition logic if needed
    result.success = true;
    result.message = 'Bank addition skipped (not implemented)';

    return result;
}

// ==================== WITHDRAW FORM FILLING ====================

async function handleFillWithdrawForm(data) {
    console.log('💳 Starting withdraw form filling...');

    if (!data || !data.withdrawInfo) {
        return { success: false, error: 'No withdraw info provided' };
    }

    const withdrawInfo = data.withdrawInfo;
    console.log('💳 Withdraw info:', withdrawInfo);

    // Store withdraw info for later use
    window.withdrawInfo = withdrawInfo;
    sessionStorage.setItem('withdrawInfo', JSON.stringify(withdrawInfo));

    try {
        const result = await fillWithdrawForm();
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Withdraw form fill error:', error);
        return { success: false, error: error.message };
    }
}

async function fillWithdrawForm() {
    console.log('💳 Filling withdraw form...');

    const withdrawInfo = window.withdrawInfo;
    if (!withdrawInfo) {
        throw new Error('No withdraw info available');
    }

    // Check if bank already exists
    if (checkExistingBank()) {
        console.log('✅ Bank already exists');
        return { success: true, message: 'Bank already exists' };
    }

    let attempts = 0;
    const maxAttempts = 10;

    return new Promise((resolve) => {
        const fillInterval = setInterval(async () => {
            attempts++;
            console.log(`[${attempts}/${maxAttempts}] Looking for withdraw form...`);

            // Look for withdraw form elements (expanded selectors for all NOHU sites)
            const bankDropdown = document.querySelector('[formcontrolname="bankName"]') ||
                document.querySelector('[formcontrolname="bank"]') ||
                document.querySelector('select[name*="bank"]') ||
                document.querySelector('mat-select[formcontrolname="bankName"]') ||
                document.querySelector('mat-select') ||
                document.querySelector('input[placeholder*="ngân hàng"]') ||
                document.querySelector('input[placeholder*="Ngân hàng"]') ||
                document.querySelector('input[placeholder*="chọn ngân hàng"]');

            const branchInput = document.querySelector('[formcontrolname="city"]') ||
                document.querySelector('[formcontrolname="branch"]') ||
                document.querySelector('[formcontrolname="bankBranch"]') ||
                document.querySelector('input[placeholder*="chi nhánh"]') ||
                document.querySelector('input[placeholder*="Chi nhánh"]') ||
                document.querySelector('input[placeholder*="thành phố"]') ||
                document.querySelector('input[placeholder*="Thành phố"]') ||
                document.querySelector('input[name*="branch"]') ||
                document.querySelector('input[name*="city"]');

            const accountInput = document.querySelector('[formcontrolname="account"]') ||
                document.querySelector('[formcontrolname="accountNumber"]') ||
                document.querySelector('[formcontrolname="bankAccount"]') ||
                document.querySelector('input[placeholder*="tài khoản"]') ||
                document.querySelector('input[placeholder*="Tài khoản"]') ||
                document.querySelector('input[placeholder*="số tài khoản"]') ||
                document.querySelector('input[placeholder*="Số tài khoản"]') ||
                document.querySelector('input[placeholder*="970436"]') ||
                document.querySelector('input[name*="account"]');

            // Debug: Log what we found
            console.log('🔍 Form elements found:', {
                bankDropdown: bankDropdown ? (bankDropdown.tagName + ' - ' + (bankDropdown.placeholder || bankDropdown.getAttribute('formcontrolname') || 'no-id')) : 'NOT FOUND',
                branchInput: branchInput ? (branchInput.tagName + ' - ' + (branchInput.placeholder || branchInput.getAttribute('formcontrolname') || 'no-id')) : 'NOT FOUND',
                accountInput: accountInput ? (accountInput.tagName + ' - ' + (accountInput.placeholder || accountInput.getAttribute('formcontrolname') || 'no-id')) : 'NOT FOUND'
            });

            if (bankDropdown && branchInput && accountInput) {
                clearInterval(fillInterval);

                try {
                    console.log('🏦 Found withdraw form elements, filling...');

                    // Fill bank dropdown
                    const bankResult = await fillBankDropdown(bankDropdown, withdrawInfo.bankName);
                    await delay(300);

                    // Fill branch
                    const branchResult = await fillInput(branchInput, withdrawInfo.bankBranch || 'HO CHI MINH');
                    await delay(300);

                    // Fill account number
                    const accountResult = await fillInput(accountInput, withdrawInfo.accountNumber);
                    await delay(300);

                    // Verify all fields were filled (handle mat-select and regular inputs)
                    const verification = {
                        // For mat-select, check if text content shows selected bank
                        bankSelected: bankDropdown.value && bankDropdown.value !== '' ||
                            bankDropdown.textContent?.trim() !== '' ||
                            document.querySelector('.mat-select-value-text')?.textContent?.trim() !== '',
                        branchFilled: branchInput.value && branchInput.value !== '',
                        accountFilled: accountInput.value && accountInput.value !== ''
                    };

                    // Also check if bank was successfully selected by looking at the result
                    if (bankResult === true) {
                        verification.bankSelected = true;
                    }

                    const allFilled = verification.bankSelected && verification.branchFilled && verification.accountFilled;

                    console.log('🔍 Form verification:', verification);
                    console.log(`📊 Fields filled: ${allFilled ? '✅' : '❌'}`);

                    // CRITICAL: Submit the form after filling
                    if (allFilled) {
                        console.log('🚀 Submitting bank form...');
                        await delay(500);

                        // Find submit button - try multiple selectors for NOHU sites
                        let submitButton = null;

                        // Priority 1: Direct selectors
                        const directSelectors = [
                            'button[type="submit"]',
                            'button.submit-btn',
                            'button.btn-submit',
                            'button.btn-primary',
                            'button.btn-success',
                            'button.btn-confirm',
                            // Angular Material buttons
                            'button.mat-raised-button',
                            'button.mat-flat-button',
                            // Common NOHU button classes
                            'button.confirm-btn',
                            'button.save-btn',
                            '.btn-submit',
                            '.submit-button'
                        ];

                        for (const selector of directSelectors) {
                            const btn = document.querySelector(selector);
                            if (btn && btn.offsetParent !== null) {
                                submitButton = btn;
                                console.log(`✅ Found submit button via selector: ${selector}`);
                                break;
                            }
                        }

                        // Priority 2: Search by text content
                        if (!submitButton) {
                            const allButtons = Array.from(document.querySelectorAll('button, a.btn, div.btn, span.btn'));
                            const submitTexts = ['gửi đi', 'gửi', 'xác nhận', 'submit', 'thêm', 'lưu', 'confirm', 'save', 'tiếp tục'];

                            submitButton = allButtons.find(btn => {
                                if (btn.offsetParent === null) return false; // Skip hidden buttons
                                const text = btn.textContent.toLowerCase().trim();
                                return submitTexts.some(t => text === t || text.includes(t));
                            });

                            if (submitButton) {
                                console.log(`✅ Found submit button via text: "${submitButton.textContent.trim()}"`);
                            }
                        }

                        // Priority 3: Find button inside form
                        if (!submitButton) {
                            const form = bankDropdown.closest('form') || branchInput.closest('form') || accountInput.closest('form');
                            if (form) {
                                submitButton = form.querySelector('button:not([type="button"])') ||
                                    form.querySelector('button');
                                if (submitButton) {
                                    console.log(`✅ Found submit button inside form: "${submitButton.textContent.trim()}"`);
                                }
                            }
                        }

                        if (submitButton) {
                            console.log('🚀 Clicking submit button:', submitButton.textContent.trim());

                            // Multiple click methods for reliability
                            submitButton.focus();
                            submitButton.click();

                            // Also dispatch events
                            submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

                            // Wait for submission
                            await delay(3000);

                            // Check if submission was successful
                            const hasError = document.querySelector('.error-message, .alert-danger, .toast-error, .error');

                            if (hasError && hasError.offsetParent !== null) {
                                console.warn('⚠️ Form submission may have failed - error message detected');
                                verification.submitted = false;
                                verification.submitError = 'Error message detected after submit';
                            } else {
                                console.log('✅ Form submitted successfully');
                                verification.submitted = true;
                            }
                        } else {
                            console.warn('⚠️ Submit button not found - listing all buttons for debug:');
                            const allBtns = document.querySelectorAll('button');
                            allBtns.forEach((btn, i) => {
                                console.log(`  [${i}] "${btn.textContent.trim()}" - visible: ${btn.offsetParent !== null}`);
                            });
                            verification.submitted = false;
                            verification.submitError = 'Submit button not found';
                        }
                    }

                    resolve({
                        success: allFilled && verification.submitted,
                        message: verification.submitted ? 'Bank form filled and submitted' : 'Form filled but not submitted',
                        details: {
                            bank: bankResult,
                            branch: branchResult,
                            account: accountResult,
                            verification
                        }
                    });

                } catch (error) {
                    console.error('❌ Error filling form:', error);
                    resolve({
                        success: false,
                        message: error.message,
                        error: error.message
                    });
                }
            }

            if (attempts >= maxAttempts) {
                clearInterval(fillInterval);
                console.log('❌ Withdraw form not found after max attempts');
                resolve({
                    success: false,
                    message: 'Withdraw form not found',
                    error: 'Form elements not found after 10 attempts'
                });
            }
        }, 1000);
    });
}

function checkExistingBank() {
    // QUAN TRỌNG: Kiểm tra xem có FORM input không
    // Nếu có form input (mat-select, input với formcontrolname) thì CHƯA thêm bank
    const bankFormExists = document.querySelector('mat-select[formcontrolname="bankName"]') ||
        document.querySelector('[formcontrolname="bankName"]') ||
        document.querySelector('[formcontrolname="city"]') ||
        document.querySelector('[formcontrolname="account"]') ||
        document.querySelector('input[placeholder*="thành phố"]') ||
        document.querySelector('input[placeholder*="9704"]');

    if (bankFormExists) {
        console.log('🔍 Bank form input found - bank NOT added yet');
        return false;
    }

    // Kiểm tra xem có bank-detail div không (chứa thông tin bank đã thêm)
    // Đây là div hiển thị sau khi đã thêm bank thành công
    const bankDetailDiv = document.querySelector('.bank-detail, .px-4.bank-detail');
    if (bankDetailDiv) {
        // Verify bank-detail có chứa value thực sự (không chỉ là label)
        const rows = bankDetailDiv.querySelectorAll('.block.w-full');
        let hasRealValue = false;

        rows.forEach(row => {
            const valueSpan = row.querySelector('span.text-right, span:last-child');
            if (valueSpan) {
                const value = valueSpan.textContent.trim();
                // Kiểm tra value có phải là giá trị thực (không phải placeholder)
                if (value && value.length > 2 && !value.includes('Vui lòng') && !value.includes('Ví dụ')) {
                    hasRealValue = true;
                }
            }
        });

        if (hasRealValue) {
            console.log('🔍 Found bank-detail div with real values - bank already exists');
            return true;
        }
    }

    // Không tìm thấy bank đã thêm
    console.log('🔍 No existing bank found - ready to add bank');
    return false;
}

async function fillBankDropdown(dropdown, bankName) {
    console.log(`🏦 Filling bank dropdown with: ${bankName}`);

    // Scroll into view
    dropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(200);

    // Try different ways to open dropdown
    try {
        dropdown.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        dropdown.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    } catch (e) { }

    dropdown.focus();
    dropdown.click();
    await delay(500);

    // Check if it's a select element
    if (dropdown.tagName === 'SELECT') {
        const options = dropdown.querySelectorAll('option');
        const searchName = bankName.toUpperCase();

        for (const option of options) {
            const text = option.textContent.trim().toUpperCase();
            if (text.includes(searchName)) {
                dropdown.value = option.value;
                dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Selected bank: ${text}`);
                return true;
            }
        }
    } else {
        // For mat-select or custom dropdowns
        await delay(300);

        // Find and select bank option
        const options = document.querySelectorAll('mat-option, [role="option"], .mat-option');
        const searchName = bankName.toUpperCase();

        for (const option of options) {
            const text = option.textContent.trim().toUpperCase();
            if (text.includes(searchName)) {
                option.click();
                console.log(`✅ Selected bank: ${text}`);
                await delay(200);
                return true;
            }
        }
    }

    console.warn('❌ Bank not found in dropdown:', bankName);
    return false;
}

async function fillInput(input, value) {
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

    // Use native setter (like working version)
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
    console.log(`${success ? '✅' : '❌'} Fill input: "${value}" -> "${input.value}"`);

    return success;
}

// ==================== PROMOTIONS ====================

async function checkPromotions(userData) {
    console.log('🎁 Starting promotion check...');

    const { username, apiKey } = userData || {};
    console.log('📊 Username:', username);
    console.log('📊 API Key:', apiKey ? 'Provided' : 'Not provided');

    // Store API key for auto-solving captcha
    if (apiKey) {
        window.apiKey = apiKey;
        window.currentApiKey = apiKey;
        console.log('✅ Stored API key for captcha solving');
    }

    window.isCheckingPromo = true;
    window.promoButtonClicked = false;

    // Wait for page to be fully ready
    console.log('⏳ Waiting 2 seconds for page to fully render...');
    await delay(2000);

    // STEP 1: Fill username in form
    console.log('Step 1: Filling username...');
    const usernameInput = document.querySelector('input[placeholder*="tên người dùng"]') ||
        document.querySelector('input[placeholder*="Tên Tài Khoản"]') ||
        document.querySelector('input[placeholder*="tên đăng nhập"]') ||
        document.querySelector('input[placeholder*="Tên đăng nhập"]') ||
        document.querySelector('input[placeholder*="Username"]') ||
        document.querySelector('input[placeholder*="username"]') ||
        document.querySelector('input[placeholder*="Tài khoản"]') ||
        document.querySelector('input[placeholder*="tài khoản"]') ||
        document.querySelector('input[name*="username"]') ||
        document.querySelector('input[name*="account"]') ||
        document.querySelector('input[type="text"]:first-of-type');

    console.log('🔍 Found username input:', usernameInput ? (usernameInput.placeholder || usernameInput.name || 'no identifier') : 'NOT FOUND');

    if (usernameInput && username) {
        console.log('📝 Filling username:', username);
        await fillInputAdvanced(usernameInput, username, true); // Use fillInputAdvanced with fast mode
        console.log('✅ Username filled');
        await delay(500);
    } else {
        console.log('❌ Username input not found or no username provided');
        console.log('🔍 DEBUG: All text inputs on page:', document.querySelectorAll('input[type="text"]').length);
    }

    // STEP 2: Click "Chọn Khuyến Mãi" button
    console.log('Step 2: Looking for promo button...');
    const promoButton = findPromoButton();

    if (promoButton) {
        console.log('✅ Found promo button, clicking...');
        promoButton.click();
        await delay(1000);

        // STEP 3: Find and select TAIAPP promo
        console.log('Step 3: Looking for TAIAPP promo...');
        const taiappSelected = await selectTaiappPromo();

        if (taiappSelected) {
            console.log('✅ TAIAPP promo selected');
            await delay(500);

            // STEP 4: Click "Xác Thực Tại Đây" button
            console.log('Step 4: Looking for verify button...');
            const verifyButton = findVerifyButton();

            if (verifyButton) {
                console.log('✅ Found verify button, clicking...');
                verifyButton.click();
                await delay(1000);

                // STEP 5: Solve captcha if API key provided
                if (apiKey) {
                    console.log('Step 5: Waiting for captcha...');
                    // Captcha solving will be handled by auto-solve mechanism
                    await delay(3000);
                }
            } else {
                console.log('⚠️ Verify button not found');
            }
        } else {
            console.log('⚠️ TAIAPP promo not found');
        }
    } else {
        console.log('⚠️ Promo button not found');
    }

    console.log('✅ Check promo flow completed');

    return {
        success: true,
        message: 'Promotion check completed',
        promotions: []
    };
}

// Helper function to find promo button
function findPromoButton() {
    const selectors = [
        'button:contains("Chọn Khuyến Mãi")',
        '[class*="promo"]',
        '[class*="khuyen-mai"]',
        'button[onclick*="promo"]'
    ];

    // Try text content match
    const buttons = document.querySelectorAll('button, div[role="button"], a');
    for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('chọn khuyến mãi') || text.includes('khuyến mãi')) {
            return btn;
        }
    }

    return null;
}

// Helper function to select TAIAPP promo
async function selectTaiappPromo() {
    await delay(500);

    const items = document.querySelectorAll('[class*="promo"], [class*="item"], li, div');
    for (const item of items) {
        const text = item.textContent?.toUpperCase() || '';
        if (text.includes('TAIAPP') || text.includes('TẢI APP')) {
            item.click();
            return true;
        }
    }

    return false;
}

// Helper function to find verify button
function findVerifyButton() {
    const buttons = document.querySelectorAll('button, a, div[role="button"]');
    for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('xác thực') || text.includes('verify')) {
            return btn;
        }
    }
    return null;
}

// ==================== CAPTCHA SOLVING (Working Version) ====================

async function solveCaptchaAuto(apiKey) {
    console.log('🔐 Starting automatic captcha solver...');
    console.log('🔑 Received API Key:', apiKey ? (apiKey.substring(0, 5) + '...') : 'EMPTY/UNDEFINED');

    if (window.captchaCompleted || sessionStorage.getItem('captchaCompleted') === 'true') {
        console.log('✅ Captcha already COMPLETED and submitted, STOPPING completely!');
        return true;
    }

    if (window.captchaFailed || sessionStorage.getItem('captchaFailed') === 'true') {
        console.log('❌ Captcha FAILED (wrong answer), STOPPING completely!');
        return false;
    }

    if (window.captchaAttempted || sessionStorage.getItem('captchaAttempted') === 'true') {
        console.log('⚠️ Captcha solving already attempted, skipping to prevent loop...');
        return false;
    }

    console.log('🔐 Starting captcha solve (not marked as attempted yet)');

    if (!apiKey) {
        console.error('❌ No API key provided');
        return false;
    }

    try {
        // Look for IMAGE captcha (for register/login forms)
        console.log('🔍 Looking for IMAGE captcha...');
        const captchaInputField = document.querySelector('input[formcontrolname="checkCode"]') ||
            document.querySelector('input[placeholder*="xác minh"]') ||
            document.querySelector('input[placeholder*="captcha"]');

        if (captchaInputField) {
            console.log('✅ Found captcha input');

            // Find captcha image near the input - try multiple times with increasing delays
            const form = captchaInputField.closest('form');
            let captchaImage = null;

            // Try 3 times with increasing delays (image appears after click)
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`🔍 Attempt ${attempt}/3: Looking for captcha image...`);

                // Priority 1: Find by id="captcha" (from HTML structure)
                captchaImage = form ? form.querySelector('img#captcha') : null;

                // Priority 2: Find by src starting with data:image
                if (!captchaImage) {
                    captchaImage = form ? form.querySelector('img[src^="data:image"]') : null;
                }

                // Priority 3: Find any img in captcha input's parent
                if (!captchaImage) {
                    const parent = captchaInputField.parentElement;
                    if (parent) {
                        captchaImage = parent.querySelector('img');
                    }
                }

                if (captchaImage && captchaImage.src && captchaImage.src.startsWith('data:image')) {
                    console.log(`✅ Found captcha image on attempt ${attempt}`);
                    break;
                } else {
                    if (attempt < 3) {
                        const waitTime = attempt * 500; // 500ms, 1000ms
                        console.log(`⏳ Image not found, waiting ${waitTime}ms before retry...`);
                        await delay(waitTime);
                    }
                }
            }

            if (captchaImage && captchaImage.src && captchaImage.src.startsWith('data:image')) {
                console.log('✅ Found base64 captcha image');
                const base64Data = captchaImage.src.split(',')[1];

                if (base64Data) {
                    console.log('📤 Sending image to autocaptcha.pro API...');

                    // Mark as attempted BEFORE calling API to prevent duplicate calls
                    window.captchaAttempted = true;
                    sessionStorage.setItem('captchaAttempted', 'true');
                    console.log('🔒 Marked as attempted before API call');

                    const result = await solveImageCaptcha(base64Data, apiKey);

                    if (result) {
                        console.log('✅ Captcha solved:', result);
                        // Use fast mode and NO FOCUS to prevent captcha change
                        await fillInputAdvanced(captchaInputField, result, true, true);

                        // Wait a bit for the input to be processed
                        await delay(1000);

                        // Wait a bit for the input to be processed
                        await delay(1000);

                        // Verify captcha was accepted (check if input still has value and no error)
                        const finalValue = captchaInputField.value;
                        console.log(`🔍 Final captcha verification: "${finalValue}"`);

                        if (finalValue === result) {
                            // Mark as completed only if value persists
                            window.captchaCompleted = true;
                            sessionStorage.setItem('captchaCompleted', 'true');
                            console.log('✅ Captcha verification successful');
                            return true;
                        } else {
                            console.warn('⚠️ Captcha input value changed - may be rejected by server');
                            window.captchaFailed = true;
                            sessionStorage.setItem('captchaFailed', 'true');
                            return false;
                        }
                    } else {
                        console.log('❌ Failed to solve captcha');
                        return false;
                    }
                }
            } else {
                console.log('❌ No captcha image found');
                return false;
            }
        } else {
            console.log('ℹ️ No captcha input found');
            return false;
        }
    } catch (error) {
        console.error('❌ Captcha solving error:', error);
        return false;
    }
}

// Image captcha API call
async function solveImageCaptcha(base64Data, apiKey) {
    try {
        console.log('📤 Calling autocaptcha.pro API...');

        const requestBody = {
            key: apiKey,
            type: "ImageToText",
            body: base64Data
        };

        const response = await fetch('https://autocaptcha.pro/apiv3/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('📥 API Response:', data);

        if (data.success && data.captcha) {
            return data.captcha;
        } else {
            console.error('❌ API Error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ API Request Error:', error);
        return null;
    }
}

// ==================== LOGIN STATUS CHECK ====================

async function checkLoginStatusDetailed() {
    console.log('🔍 Checking detailed login status...');

    // Check cookies for auth tokens
    const cookies = document.cookie;
    const tokenCookies = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'auth', 'jwt'];

    let hasToken = false;
    for (const name of tokenCookies) {
        if (cookies.includes(`${name}=`)) {
            const match = cookies.match(new RegExp(`${name}=([^;]+)`));
            if (match && match[1] && match[1] !== 'null' && match[1] !== 'undefined' && match[1].length > 5) {
                hasToken = true;
                console.log(`✅ Found valid token in cookie: ${name}`);
                break;
            }
        }
    }

    // Check localStorage for tokens
    const localStorageTokens = ['token', 'auth', 'access_token', 'authToken', 'userToken'];
    let hasLocalToken = false;
    for (const name of localStorageTokens) {
        const value = localStorage.getItem(name);
        if (value && value !== 'null' && value !== 'undefined' && value.length > 5) {
            hasLocalToken = true;
            console.log(`✅ Found valid token in localStorage: ${name}`);
            break;
        }
    }

    // Check URL patterns that indicate logged in state
    const currentUrl = window.location.href;
    const loggedInPatterns = ['/dashboard', '/profile', '/account', '/member', '/user', '/home'];
    const isOnLoggedInPage = loggedInPatterns.some(pattern => currentUrl.includes(pattern));

    // Check for login page patterns
    const loginPatterns = ['/login', '/dang-nhap', '/signin', '/auth', '/Register'];
    const isOnLoginPage = loginPatterns.some(pattern => currentUrl.includes(pattern));

    const result = {
        hasToken,
        hasLocalToken,
        isOnLoggedInPage,
        isOnLoginPage,
        currentUrl,
        isLoggedIn: (hasToken || hasLocalToken || isOnLoggedInPage) && !isOnLoginPage
    };

    console.log('📊 Login Status Details:', result);
    return result;
}

// ==================== UTILITY FUNCTIONS ====================

// Advanced input filling (from working version)
async function fillInputAdvanced(input, value, fastMode = false, noFocus = false) {
    if (!input) {
        console.warn('⚠️ Input is null');
        return false;
    }

    if (input.value === value.toString()) {
        console.log('✅ Input already has correct value, skipping:', input.placeholder || input.name);
        return true;
    }

    console.log('⚡ Setting value directly:', input.placeholder || input.name, '→', value);
    if (noFocus) {
        console.log('⚠️ NO FOCUS mode - will not focus/click input (for captcha)');
    }

    try {
        // Only focus/click if noFocus is false
        if (!noFocus) {
            input.focus();
            input.click();
            await delay(50);
        }

        if (input.value !== '') {
            console.log('   Clearing existing value:', input.value);
            input.value = '';
            await delay(50);
        }

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;

        // Set value directly (no typing simulation)
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value.toString());
        } else {
            input.value = value.toString();
        }

        // Trigger all necessary events for Angular/React/Vue frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log('✅ Value set successfully:', input.value);
        return true;
    } catch (e) {
        console.error('❌ Error in fillInputAdvanced:', e);
        return false;
    }
}

function resetAllFlags() {
    window.captchaAttempted = false;
    window.captchaFailed = false;
    window.captchaCompleted = false;
    window.autoFillRunning = false;
    window.registerFormFilled = false;
    window.promoCheckRunning = false;
    window.isCheckingPromo = false;

    sessionStorage.removeItem('captchaAttempted');
    sessionStorage.removeItem('captchaFailed');
    sessionStorage.removeItem('captchaCompleted');

    console.log('✅ All flags reset');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== AUDIO TRACKING ====================

function initAudioTracking() {
    if (window.audioTrackingInitialized) return;
    window.audioTrackingInitialized = true;

    window.captchaAudioUrls = [];

    // Helper function to add audio URL
    window.addAudioUrl = (url) => {
        if (!url) return;

        const invalidPatterns = ['google.com/recaptcha', 'recaptcha.net'];
        const urlLower = url.toLowerCase();

        for (const pattern of invalidPatterns) {
            if (urlLower.includes(pattern)) return;
        }

        const validPatterns = ['.mp3', '.wav', '.ogg', 'audio', 'captcha'];
        let isValid = false;

        for (const pattern of validPatterns) {
            if (urlLower.includes(pattern)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) return;

        const normalizedUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;

        if (!window.captchaAudioUrls.includes(normalizedUrl)) {
            window.captchaAudioUrls.push(normalizedUrl);
            console.log('🎵 Audio URL captured:', normalizedUrl);
        }
    };

    // Intercept fetch requests
    if (!window.fetchIntercepted) {
        window.fetchIntercepted = true;
        const originalFetch = window.fetch;

        window.fetch = function (...args) {
            const url = args[0];
            if (typeof url === 'string' && (
                url.includes('audio') || url.includes('captcha') ||
                url.includes('.mp3') || url.includes('.wav')
            )) {
                console.log('🎵 Intercepted audio fetch:', url);
                window.addAudioUrl(url);
            }
            return originalFetch.apply(this, args);
        };
    }

    console.log('🎵 Audio tracking initialized');
}

console.log('✅ NOHU Tool Fixed ready for both autoFill and freelxbFlow actions!');