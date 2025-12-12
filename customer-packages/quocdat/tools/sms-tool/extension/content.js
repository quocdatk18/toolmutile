// SMS Tool Content Script - Simplified version for image captcha only
console.log('📱 SMS Tool (Simple) loaded on:', window.location.href);

// Prevent multiple injections
if (window.smsToolLoaded) {
    console.log('📱 SMS Tool already loaded, skipping duplicate initialization');
} else {
    window.smsToolLoaded = true;
    window.autoRegisterToolLoaded = true; // For compatibility
    console.log('📱 First time loading SMS Tool, initializing...');

    // Initialize flags (simplified)
    window.captchaCompleted = false;
    window.autoFillRunning = false;
    window.registerFormFilled = false;

    // Clear session storage
    sessionStorage.removeItem('captchaCompleted');
    console.log('🔓 Cleared flags on page load');
}

// Simple autoFill function for SMS tool
async function autoFillSMS(data) {
    console.log('📝 Starting SMS autoFill...', data);

    if (window.autoFillRunning) {
        console.log('⚠️ AutoFill already running, skipping...');
        return { success: false, error: 'AutoFill already running' };
    }

    window.autoFillRunning = true;

    try {
        // OKVIP selectors (Angular formcontrolname)
        const selectors = {
            username: 'input[formcontrolname="account"]',
            password: 'input[formcontrolname="password"]',
            fullname: 'input[formcontrolname="name"]',
            phone: 'input[formcontrolname="mobile"]',
            email: 'input[formcontrolname="email"]',
            captcha: 'input[formcontrolname="checkCode"]',
            registerBtn: 'button[type="submit"], .submit-btn'
        };

        // Fill all form fields in parallel (like nohu tool)
        console.log('📝 Filling all form fields in parallel (like nohu tool)...');

        // Get all form elements
        const usernameEl = document.querySelector(selectors.username);
        const passwordEl = document.querySelector(selectors.password);
        const fullnameEl = document.querySelector(selectors.fullname);
        const phoneEl = document.querySelector(selectors.phone);
        const emailEl = document.querySelector(selectors.email);

        // Debug: Log all data and elements
        console.log('📊 Form data received:', {
            username: data.username,
            password: data.password ? '***' : 'MISSING',
            fullname: data.fullname,
            phone: data.phone,
            email: data.email
        });

        console.log('📊 Form elements found:', {
            username: usernameEl ? 'FOUND' : 'NOT FOUND',
            password: passwordEl ? 'FOUND' : 'NOT FOUND',
            fullname: fullnameEl ? 'FOUND' : 'NOT FOUND',
            phone: phoneEl ? 'FOUND' : 'NOT FOUND',
            email: emailEl ? 'FOUND' : 'NOT FOUND'
        });

        // Fill all inputs in parallel for speed (like nohu tool)
        const fillPromises = [];

        if (usernameEl && data.username) {
            fillPromises.push(fillInputAdvanced(usernameEl, data.username, 'username'));
        }

        if (passwordEl && data.password) {
            fillPromises.push(fillInputAdvanced(passwordEl, data.password, 'password'));
        }

        if (fullnameEl && data.fullname) {
            fillPromises.push(fillInputAdvanced(fullnameEl, data.fullname, 'fullname'));
        }

        if (phoneEl && data.phone) {
            console.log('📱 Filling phone:', data.phone);
            fillPromises.push(fillInputAdvanced(phoneEl, data.phone, 'phone'));
        } else {
            console.log('⚠️ Phone not filled - Element:', phoneEl ? 'FOUND' : 'NOT FOUND', 'Data:', data.phone);
        }

        if (emailEl && data.email) {
            console.log('📧 Filling email:', data.email);
            fillPromises.push(fillInputAdvanced(emailEl, data.email, 'email'));
        } else {
            console.log('⚠️ Email not filled - Element:', emailEl ? 'FOUND' : 'NOT FOUND', 'Data:', data.email);
        }

        // Wait for all fills to complete
        await Promise.all(fillPromises);
        console.log('✅ All form fields filled in parallel, now handling captcha...');

        // Handle image captcha AFTER filling form
        console.log('🖼️ Looking for image captcha...');
        await handleImageCaptcha(data.apiKey);

        console.log('✅ Captcha handled, waiting before submit...');

        // Wait a bit more before submitting to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Submit form if autoSubmit is true
        if (data.autoSubmit) {
            console.log('🚀 Auto-submitting form...');

            // Check all form elements status
            console.log('📊 Final form status:');
            console.log('  Username:', usernameEl?.value || 'EMPTY');
            console.log('  Password:', passwordEl?.value ? '***' : 'EMPTY');
            console.log('  Fullname:', fullnameEl?.value || 'EMPTY');
            console.log('  Phone:', phoneEl?.value || 'EMPTY');
            console.log('  Email:', emailEl?.value || 'EMPTY');
            console.log('  Captcha:', document.querySelector(selectors.captcha)?.value || 'EMPTY');

            // Check checkbox
            const checkbox = document.querySelector(selectors.agreeCheckbox);
            console.log('  Checkbox found:', checkbox ? 'YES' : 'NO');
            console.log('  Checkbox checked:', checkbox?.checked || false);

            // Ensure checkbox is checked
            if (checkbox && !checkbox.checked) {
                console.log('📋 Checking agreement checkbox...');
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Find submit button
            const submitBtn = document.querySelector(selectors.registerBtn);
            console.log('  Submit button found:', submitBtn ? 'YES' : 'NO');
            console.log('  Submit button text:', submitBtn?.textContent?.trim() || 'N/A');
            console.log('  Submit button disabled:', submitBtn?.disabled || false);

            if (submitBtn) {
                console.log('👆 Clicking submit button...');
                submitBtn.click();
                console.log('✅ Submit button clicked');

                // Also try form submit as backup
                setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                        console.log('📝 Also triggering form submit...');
                        form.submit();
                    }
                }, 500);

            } else {
                console.log('⚠️ Submit button not found, trying alternative methods...');

                // Try Enter key
                const form = document.querySelector('form');
                if (form) {
                    console.log('⌨️ Pressing Enter on form...');
                    form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

                    // Also try direct submit
                    setTimeout(() => {
                        console.log('📝 Direct form submit...');
                        form.submit();
                    }, 500);
                }
            }
        }

        window.registerFormFilled = true;
        return { success: true, message: 'Form filled and submitted successfully' };

    } catch (error) {
        console.error('❌ AutoFill error:', error);
        return { success: false, error: error.message };
    } finally {
        window.autoFillRunning = false;
    }
}

// Advanced input filling function (from nohu tool)
async function fillInputAdvanced(input, value, fieldName) {
    if (!input) {
        console.warn('⚠️ Input is null for field:', fieldName);
        return false;
    }

    if (input.value === value.toString()) {
        console.log('✅ Input already has correct value, skipping:', fieldName);
        return true;
    }

    console.log('⚡ Setting value directly:', fieldName, '→', value);

    try {
        // Focus and click input
        input.focus();
        input.click();
        await new Promise(resolve => setTimeout(resolve, 50));

        // Clear existing value
        if (input.value !== '') {
            console.log('   Clearing existing value:', input.value);
            input.value = '';
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Use native setter for better compatibility
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

        // Trigger all necessary events for Angular frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log('✅ Value set successfully for', fieldName, ':', input.value);
        return true;
    } catch (e) {
        console.error('❌ Error in fillInputAdvanced for', fieldName, ':', e);
        return false;
    }
}

// Simple image captcha handler
async function handleImageCaptcha(apiKey) {
    console.log('🖼️ Handling image captcha...');

    // Look for base64 image captcha
    const imageSelectors = [
        'img[src^="data:image/png;base64"]',
        'img[src^="data:image/jpeg;base64"]',
        'img[src^="data:image/jpg;base64"]',
        'img.absolute.right-7', // Specific for OKVIP sites
        'img[class*="captcha"]',
        'img[src*="captcha"]'
    ];

    for (const selector of imageSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src && img.src.startsWith('data:image/')) {
            console.log('🖼️ Found image captcha:', selector);

            try {
                if (!apiKey) {
                    console.log('⚠️ No API key provided for captcha solving');
                    return;
                }

                // Solve image captcha
                const solver = new CaptchaSolver(apiKey);
                const result = await solver.solveImageCaptcha(img.src);

                console.log('✅ Image captcha solved:', result);

                // Fill captcha input
                const captchaInput = document.querySelector('input[formcontrolname="checkCode"]');
                if (captchaInput) {
                    captchaInput.value = result;
                    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));

                    window.captchaCompleted = true;
                    sessionStorage.setItem('captchaCompleted', 'true');
                    console.log('✅ Captcha filled successfully');
                }

                return;
            } catch (error) {
                console.error('❌ Image captcha solve error:', error);
            }
        }
    }

    console.log('ℹ️ No image captcha found');
}

// Setup message listener for communication with automation
if (window.chrome && window.chrome.runtime && window.chrome.runtime.onMessage) {
    window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('📨 SMS Tool received message:', message);

        if (message.action === 'autoFill') {
            autoFillSMS(message.data).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        }

        // Add redirectToWithdrawAndFill action (like nohu-tool)
        if (message.action === 'redirectToWithdrawAndFill') {
            console.log('💳 SMS Tool: Navigate to withdraw page and fill form...');

            (async () => {
                try {
                    if (message.data && message.data.withdrawInfo) {
                        window.withdrawInfo = message.data.withdrawInfo;
                        sessionStorage.setItem('withdrawInfo', JSON.stringify(message.data.withdrawInfo));
                        console.log('💳 Stored withdraw info:', message.data.withdrawInfo);
                    }

                    // Try to fill bank form directly (simplified for SMS tool)
                    const fillResult = await fillBankFormSMS(message.data.withdrawInfo);
                    sendResponse(fillResult);
                } catch (error) {
                    console.error('💥 SMS redirectToWithdrawAndFill error:', error);
                    sendResponse({ success: false, error: error.message });
                }
            })();

            return true; // Keep message channel open for async response
        }

        sendResponse({ success: true });
    });
}

// Bank form filling function for SMS tool
async function fillBankFormSMS(withdrawInfo) {
    console.log('💳 Starting SMS bank form fill...', withdrawInfo);

    try {
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Bank form selectors (OKVIP/Angular style)
        const bankSelect = document.querySelector('select') ||
            document.querySelector('[formcontrolname="bankName"]') ||
            document.querySelector('mat-select');

        const branchInput = document.querySelector('input[placeholder*="chi nhánh"], input[placeholder*="thành phố"]') ||
            document.querySelector('[formcontrolname="city"]') ||
            document.querySelector('[formcontrolname="branch"]');

        const accountInput = document.querySelector('input[placeholder*="tài khoản"], input[placeholder*="970436"]') ||
            document.querySelector('[formcontrolname="account"]') ||
            document.querySelector('[formcontrolname="accountNumber"]');

        let results = {
            bankFilled: false,
            branchFilled: false,
            accountFilled: false,
            errors: []
        };

        // Fill bank select
        if (bankSelect && withdrawInfo.bankName) {
            console.log('🏦 Filling bank select...');

            if (bankSelect.tagName.toLowerCase() === 'mat-select') {
                // Handle Angular Material select
                bankSelect.click();
                await new Promise(resolve => setTimeout(resolve, 500));

                const options = document.querySelectorAll('mat-option');
                for (const option of options) {
                    const optionText = option.textContent.trim().toUpperCase();
                    const bankNameUpper = withdrawInfo.bankName.toUpperCase();

                    if (optionText.includes(bankNameUpper) ||
                        (optionText.includes('VIETCOMBANK') && bankNameUpper.includes('VCB')) ||
                        (optionText.includes('TECHCOMBANK') && bankNameUpper.includes('TCB')) ||
                        (optionText.includes('BIDV') && bankNameUpper.includes('BIDV'))) {

                        console.log(`✅ Clicking bank option: ${optionText}`);
                        option.click();
                        results.bankFilled = true;
                        break;
                    }
                }
            } else {
                // Handle regular select
                const options = Array.from(bankSelect.options || []);
                const targetOption = options.find(option =>
                    option.text.toUpperCase().includes(withdrawInfo.bankName.toUpperCase())
                );

                if (targetOption) {
                    bankSelect.value = targetOption.value;
                    bankSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Bank selected: ${targetOption.text}`);
                    results.bankFilled = true;
                }
            }
        }

        // Fill branch input
        if (branchInput) {
            const branchValue = withdrawInfo.bankBranch || 'HO CHI MINH';
            branchInput.focus();
            branchInput.value = branchValue;
            branchInput.dispatchEvent(new Event('input', { bubbles: true }));
            branchInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Branch filled: ${branchValue}`);
            results.branchFilled = true;
        }

        // Fill account number
        if (accountInput && withdrawInfo.accountNumber) {
            accountInput.focus();
            accountInput.value = withdrawInfo.accountNumber;
            accountInput.dispatchEvent(new Event('input', { bubbles: true }));
            accountInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Account filled: ${withdrawInfo.accountNumber}`);
            results.accountFilled = true;
        }

        // Auto-submit form
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            console.log('🚀 Auto-submitting bank form...');
            submitBtn.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const success = results.bankFilled && results.accountFilled;
        console.log(`📊 SMS Bank form fill result: ${success}`);

        return {
            success: success,
            message: success ? 'SMS bank form filled successfully' : 'SMS bank form fill failed',
            results: results
        };

    } catch (error) {
        console.error('💥 SMS bank form fill error:', error);
        return {
            success: false,
            error: error.message,
            message: `SMS bank form fill failed: ${error.message}`
        };
    }
}

// CRITICAL: Setup _chromeMessageListener for direct calls from automation (like nohu-tool)
// This is the key missing piece that causes "Extension not loaded" error
window._chromeMessageListener = (message, sender, sendResponse) => {
    console.log('📨 SMS Tool _chromeMessageListener:', message);

    if (message.action === 'autoFill') {
        autoFillSMS(message.data).then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    if (message.action === 'redirectToWithdrawAndFill') {
        console.log('💳 SMS Tool: Navigate to withdraw page and fill form...');

        (async () => {
            try {
                if (message.data && message.data.withdrawInfo) {
                    window.withdrawInfo = message.data.withdrawInfo;
                    sessionStorage.setItem('withdrawInfo', JSON.stringify(message.data.withdrawInfo));
                    console.log('💳 Stored withdraw info:', message.data.withdrawInfo);
                }

                // Try to fill bank form directly (simplified for SMS tool)
                const fillResult = await fillBankFormSMS(message.data.withdrawInfo);
                sendResponse(fillResult);
            } catch (error) {
                console.error('💥 SMS redirectToWithdrawAndFill error:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true;
    }

    sendResponse({ success: true });
};

console.log('✅ SMS Tool: _chromeMessageListener setup completed');

console.log('✅ SMS Tool (Simple) initialization completed');