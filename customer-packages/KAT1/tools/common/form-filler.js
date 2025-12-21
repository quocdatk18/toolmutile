/**
 * Common Form Filler - Dùng chung cho tất cả tools (VIP, NOHU, etc.)
 * Hỗ trợ: fill form, click button, anti-bot measures
 */

class CommonFormFiller {
    constructor() {
        this.defaultDelay = {
            beforeFocus: 300,
            betweenChars: 120,
            afterField: 1000,
            afterForm: 5000,
            beforeSubmit: 15000
        };
    }

    /**
     * Fill text input field với slow typing (JUN88 logic)
     * @param {Page} page - Puppeteer page
     * @param {string} selector - CSS selector của input
     * @param {string} value - Giá trị cần fill
     * @param {object} options - { charDelay, beforeFocus, afterField, label }
     */
    async fillTextField(page, selector, value, options = {}) {
        const opts = {
            charDelay: 150,
            beforeFocus: 300,
            afterField: 800,
            label: selector,
            ...options
        };

        try {
            if (!value) {
                console.log(`⏭️ Skipping ${opts.label} (empty value)`);
                return { success: true, skipped: true };
            }

            console.log(`📝 Filling ${opts.label}...`);

            // Wait for element
            await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);

            // Focus
            await page.focus(selector);
            await new Promise(r => setTimeout(r, opts.beforeFocus));

            // Type slowly (character by character)
            await page.type(selector, value, { delay: opts.charDelay });

            // Trigger events (React compatibility)
            await page.evaluate((sel) => {
                const field = document.querySelector(sel);
                if (field) {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, selector);

            // Wait after field
            await new Promise(r => setTimeout(r, opts.afterField));

            console.log(`✅ ${opts.label} filled`);
            return { success: true };
        } catch (error) {
            console.warn(`⚠️ Failed to fill ${opts.label}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fill multiple fields
     * @param {Page} page - Puppeteer page
     * @param {array} fields - [{ selector, value, label }, ...]
     * @param {object} options - Global options
     */
    async fillMultipleFields(page, fields, options = {}) {
        const opts = { ...this.defaultDelay, ...options };

        for (const field of fields) {
            console.log(`📝 Filling ${field.label || field.selector}...`);
            const result = await this.fillTextField(page, field.selector, field.value, opts);
            if (!result.success) {
                console.warn(`⚠️ Failed to fill ${field.label}`);
            }
        }
    }

    /**
     * Simulate human-like interactions
     * @param {Page} page - Puppeteer page
     */
    async simulateHumanInteraction(page) {
        console.log('🖱️ Simulating human-like interactions...');

        // Scroll down
        await page.evaluate(() => {
            window.scrollBy(0, 300);
        });
        await new Promise(r => setTimeout(r, 800));

        // Scroll up
        await page.evaluate(() => {
            window.scrollBy(0, -300);
        });
        await new Promise(r => setTimeout(r, 800));
    }

    /**
     * Click button với multiple selector patterns
     * @param {Page} page - Puppeteer page
     * @param {array} selectors - Array of selectors to try
     * @param {object} options - { delay, beforeClick, afterClick }
     */
    async clickButton(page, selectors, options = {}) {
        const opts = {
            delay: 500,
            beforeClick: 500,
            afterClick: 2000,
            ...options
        };

        try {
            // Try each selector
            for (const selector of selectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        // Scroll into view
                        await page.evaluate((sel) => {
                            const el = document.querySelector(sel);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, selector);

                        await new Promise(r => setTimeout(r, opts.beforeClick));

                        // Click
                        await page.click(selector);
                        console.log(`✅ Clicked: ${selector}`);

                        await new Promise(r => setTimeout(r, opts.afterClick));
                        return { success: true, selector };
                    }
                } catch (e) {
                    // Try next selector
                }
            }

            // Try text-based search
            const clicked = await page.evaluate((sels) => {
                for (const selector of sels) {
                    const elements = document.querySelectorAll(selector);
                    for (const el of elements) {
                        if (el.textContent && (el.textContent.includes('Đăng') || el.textContent.includes('Submit') || el.textContent.includes('OK'))) {
                            el.click();
                            return true;
                        }
                    }
                }
                return false;
            }, selectors);

            if (clicked) {
                console.log('✅ Clicked button via text search');
                await new Promise(r => setTimeout(r, opts.afterClick));
                return { success: true };
            }

            console.warn('⚠️ Could not find button to click');
            return { success: false, error: 'Button not found' };
        } catch (error) {
            console.warn('⚠️ Error clicking button:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for form to be ready
     * @param {Page} page - Puppeteer page
     * @param {string} selector - Selector of first form field
     * @param {number} timeout - Timeout in ms
     */
    async waitForForm(page, selector, timeout = 10000) {
        try {
            await page.waitForSelector(selector, { timeout });
            console.log('✅ Form loaded');
            return { success: true };
        } catch (error) {
            console.warn('⚠️ Form not loaded:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for page navigation/redirect
     * @param {Page} page - Puppeteer page
     * @param {number} timeout - Timeout in ms
     */
    async waitForNavigation(page, timeout = 15000) {
        try {
            await page.waitForNavigation({ timeout }).catch(() => null);
            console.log('✅ Page navigated');
            return { success: true };
        } catch (error) {
            console.warn('⚠️ No navigation detected');
            return { success: false };
        }
    }

    /**
     * Get random delay (anti-bot)
     * @param {number} min - Min delay in ms
     * @param {number} max - Max delay in ms
     */
    getRandomDelay(min = 5000, max = 15000) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Wait with random delay
     * @param {number} min - Min delay in ms
     * @param {number} max - Max delay in ms
     */
    async waitRandomDelay(min = 5000, max = 15000) {
        const delay = this.getRandomDelay(min, max);
        console.log(`⏳ Waiting ${Math.round(delay / 1000)}s...`);
        await new Promise(r => setTimeout(r, delay));
    }

    /**
     * Check if element exists and has value
     * @param {Page} page - Puppeteer page
     * @param {string} selector - CSS selector
     */
    async checkElementValue(page, selector) {
        try {
            const value = await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                return el ? el.value : null;
            }, selector);
            return { exists: value !== null, value };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommonFormFiller;
}
