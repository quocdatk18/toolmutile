/**
 * Debug JUN88 Button & Checkbox Issues
 * Kiểm tra xem button và checkbox có clickable không
 */

const puppeteer = require('puppeteer');

async function debugJUN88Button() {
    console.log('🔍 Debugging JUN88 Button & Checkbox\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        // Jun88 test URL
        const testUrl = 'https://sasa2.xn--8866-um1g.com/signup';

        console.log(`🌐 Navigating to: ${testUrl}`);
        await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        // Test data
        const profileData = {
            username: 'testuser' + Date.now(),
            password: 'Test@12345',
            fullname: 'Test User',
            email: 'test@example.com',
            phone: '0912345678'
        };

        console.log('\n📝 Filling form...\n');

        // Fill form
        await page.focus('input[id="playerid"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="playerid"]', profileData.username, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));

        await page.focus('input[id="password"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="password"]', profileData.password, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));

        await page.focus('input[id="firstname"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="firstname"]', profileData.fullname, { delay: 100 });
        await new Promise(r => setTimeout(r, 800));

        await page.focus('input[id="email"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="email"]', profileData.email, { delay: 100 });
        await new Promise(r => setTimeout(r, 800));

        let phone = profileData.phone;
        if (phone.startsWith('0')) {
            phone = phone.substring(1);
        }
        await page.focus('input[id="mobile"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="mobile"]', phone, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));

        console.log('✅ Form filled\n');

        // Debug checkbox
        console.log('🔍 Debugging checkbox...\n');
        const checkboxInfo = await page.evaluate(() => {
            const checkbox = document.querySelector('input[id="agree"]');
            if (!checkbox) {
                return { found: false };
            }

            return {
                found: true,
                id: checkbox.id,
                type: checkbox.type,
                checked: checkbox.checked,
                disabled: checkbox.disabled,
                visible: checkbox.offsetParent !== null,
                display: window.getComputedStyle(checkbox).display,
                visibility: window.getComputedStyle(checkbox).visibility,
                opacity: window.getComputedStyle(checkbox).opacity,
                className: checkbox.className,
                parentVisible: checkbox.parentElement ? checkbox.parentElement.offsetParent !== null : false
            };
        });

        console.log('Checkbox Info:', JSON.stringify(checkboxInfo, null, 2));

        if (checkboxInfo.found) {
            if (checkboxInfo.checked) {
                console.log('✅ Checkbox already checked - no need to click\n');
            } else {
                console.log('⚠️ Checkbox not checked - attempting to click...\n');
                try {
                    await page.click('input[id="agree"]');
                    console.log('✅ Checkbox clicked successfully\n');
                } catch (error) {
                    console.error('❌ Failed to click checkbox:', error.message, '\n');
                }
            }
        } else {
            console.log('⚠️ Checkbox not found\n');
        }

        // Debug button
        console.log('🔍 Debugging button...\n');
        const buttonInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const buttonsList = [];

            for (let i = 0; i < buttons.length; i++) {
                const btn = buttons[i];
                buttonsList.push({
                    index: i,
                    text: btn.textContent.trim().substring(0, 50),
                    type: btn.type,
                    disabled: btn.disabled,
                    visible: btn.offsetParent !== null,
                    display: window.getComputedStyle(btn).display,
                    className: btn.className,
                    id: btn.id
                });
            }

            return buttonsList;
        });

        console.log(`Found ${buttonInfo.length} buttons:\n`);
        buttonInfo.forEach((btn, idx) => {
            console.log(`[${idx}] ${btn.text}`);
            console.log(`    Type: ${btn.type}, Disabled: ${btn.disabled}, Visible: ${btn.visible}`);
            console.log(`    Class: ${btn.className}\n`);
        });

        // Find submit button
        console.log('🔍 Finding submit button...\n');
        const submitBtnInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            let submitBtn = null;

            // Try text matching
            for (const btn of buttons) {
                const text = btn.textContent.trim().toUpperCase();
                if (text.includes('ĐĂNG KÝ') || text.includes('OK') || text.includes('REGISTER') || text.includes('SUBMIT')) {
                    submitBtn = btn;
                    break;
                }
            }

            // Try class/id matching
            if (!submitBtn) {
                submitBtn = document.querySelector('button.submit') ||
                    document.querySelector('button[type="submit"]') ||
                    document.querySelector('button.btn-primary') ||
                    document.querySelector('button.btn-success');
            }

            if (submitBtn) {
                return {
                    found: true,
                    text: submitBtn.textContent.trim(),
                    type: submitBtn.type,
                    disabled: submitBtn.disabled,
                    visible: submitBtn.offsetParent !== null,
                    display: window.getComputedStyle(submitBtn).display,
                    className: submitBtn.className,
                    id: submitBtn.id
                };
            }

            return { found: false };
        });

        console.log('Submit Button Info:', JSON.stringify(submitBtnInfo, null, 2), '\n');

        if (submitBtnInfo.found) {
            console.log('✅ Submit button found\n');

            if (submitBtnInfo.visible) {
                console.log('✅ Submit button is visible\n');

                if (!submitBtnInfo.disabled) {
                    console.log('✅ Submit button is enabled\n');
                    console.log('🔍 Attempting to click button...\n');

                    try {
                        // Try evaluate click
                        const clickSuccess = await page.evaluate(() => {
                            const buttons = document.querySelectorAll('button');
                            let submitBtn = null;

                            for (const btn of buttons) {
                                const text = btn.textContent.trim().toUpperCase();
                                if (text.includes('ĐĂNG KÝ') || text.includes('OK') || text.includes('REGISTER')) {
                                    submitBtn = btn;
                                    break;
                                }
                            }

                            if (!submitBtn) {
                                submitBtn = document.querySelector('button.submit') ||
                                    document.querySelector('button[type="submit"]') ||
                                    document.querySelector('button.btn-primary');
                            }

                            if (submitBtn && submitBtn.offsetParent !== null) {
                                submitBtn.click();
                                return true;
                            }
                            return false;
                        });

                        if (clickSuccess) {
                            console.log('✅ Button clicked via evaluate\n');
                        } else {
                            console.log('⚠️ Evaluate click returned false, trying Puppeteer click...\n');
                            await page.click('button');
                            console.log('✅ Button clicked via Puppeteer\n');
                        }
                    } catch (error) {
                        console.error('❌ Failed to click button:', error.message, '\n');
                    }
                } else {
                    console.log('❌ Submit button is disabled\n');
                }
            } else {
                console.log('❌ Submit button is not visible\n');
                console.log('⚠️ Attempting to scroll button into view...\n');

                await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button');
                    let submitBtn = null;

                    for (const btn of buttons) {
                        const text = btn.textContent.trim().toUpperCase();
                        if (text.includes('ĐĂNG KÝ') || text.includes('OK') || text.includes('REGISTER')) {
                            submitBtn = btn;
                            break;
                        }
                    }

                    if (submitBtn) {
                        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });

                await new Promise(r => setTimeout(r, 1500));
                console.log('✅ Scrolled button into view\n');
            }
        } else {
            console.log('❌ Submit button not found\n');
        }

        console.log('⏳ Keeping browser open for 2 minutes...\n');
        await new Promise(r => setTimeout(r, 120000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

debugJUN88Button().catch(console.error);
