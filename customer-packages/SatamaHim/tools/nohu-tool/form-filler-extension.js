/**
 * Form Filler for NOHU Extension - Dùng chung cho register, addBank, checkPromo
 * Tương tự CommonFormFiller nhưng chạy trong extension context
 * Hỗ trợ: slow typing, anti-bot delays, event triggering
 */

class FormFillerExtension {
    constructor() {
        this.defaultDelay = {
            beforeFocus: 300,
            betweenChars: 150,
            afterField: 800,
            afterForm: 5000,
            beforeSubmit: 15000
        };
    }

    /**
     * Fill text input field với slow typing (JUN88 logic)
     * @param {HTMLElement} input - Input element
     * @param {string} value - Giá trị cần fill
     * @param {object} options - { charDelay, beforeFocus, afterField, label }
     */
    async fillTextField(input, value, options = {}) {
        const opts = {
            charDelay: 150,
            beforeFocus: 300,
            afterField: 800,
            label: input?.placeholder || input?.name || 'field',
            ...options
        };

        try {
            if (!value) {
                console.log(`⏭️ Skipping ${opts.label} (empty value)`);
                return { success: true, skipped: true };
            }

            if (!input) {
                console.warn(`⚠️ Input not found for ${opts.label}`);
                return { success: false, error: 'Input not found' };
            }

            console.log(`📝 Filling ${opts.label}...`);

            // Check if already has correct value
            if (input.value === value.toString()) {
                console.log(`✅ ${opts.label} already has correct value`);
                return { success: true, skipped: true };
            }

            // Focus
            if (!input.disabled) {
                input.focus();
                input.click();
                await new Promise(r => setTimeout(r, opts.beforeFocus));
            }

            // Clear input first (reset proxy state)
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            ).set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(input, '');
            } else {
                input.value = '';
            }

            input.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 50));

            // Type slowly (character by character)
            for (let i = 0; i < value.length; i++) {
                const char = value[i];

                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(input, input.value + char);
                } else {
                    input.value = input.value + char;
                }

                input.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(r => setTimeout(r, opts.charDelay));
            }

            // Trigger final events
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));

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
     * @param {array} fields - [{ input, value, label }, ...]
     * @param {object} options - Global options
     */
    async fillMultipleFields(fields, options = {}) {
        const opts = { ...this.defaultDelay, ...options };

        for (const field of fields) {
            if (!field.input) {
                console.warn(`⚠️ Input not found for ${field.label}`);
                continue;
            }

            const result = await this.fillTextField(field.input, field.value, opts);
            if (!result.success && !result.skipped) {
                console.warn(`⚠️ Failed to fill ${field.label}`);
            }
        }
    }

    /**
     * Simulate human-like interactions
     */
    async simulateHumanInteraction() {
        console.log('🖱️ Simulating human-like interactions...');

        // Scroll down
        window.scrollBy(0, 300);
        await new Promise(r => setTimeout(r, 800));

        // Scroll up
        window.scrollBy(0, -300);
        await new Promise(r => setTimeout(r, 800));
    }

    /**
     * Click button với multiple selector patterns
     * @param {array} selectors - Array of selectors to try
     * @param {object} options - { delay, beforeClick, afterClick }
     */
    async clickButton(selectors, options = {}) {
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
                    const element = document.querySelector(selector);
                    if (element && !element.disabled) {
                        // Scroll into view
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await new Promise(r => setTimeout(r, opts.beforeClick));

                        // Click
                        element.click();
                        console.log(`✅ Clicked: ${selector}`);

                        await new Promise(r => setTimeout(r, opts.afterClick));
                        return { success: true, selector };
                    }
                } catch (e) {
                    // Try next selector
                }
            }

            // Try text-based search
            const buttons = document.querySelectorAll('button, [role="button"]');
            for (const btn of buttons) {
                if (btn.textContent && (
                    btn.textContent.includes('Đăng') ||
                    btn.textContent.includes('Submit') ||
                    btn.textContent.includes('OK') ||
                    btn.textContent.includes('Xác nhận')
                )) {
                    btn.click();
                    console.log('✅ Clicked button via text search');
                    await new Promise(r => setTimeout(r, opts.afterClick));
                    return { success: true };
                }
            }

            console.warn('⚠️ Could not find button to click');
            return { success: false, error: 'Button not found' };
        } catch (error) {
            console.warn('⚠️ Error clicking button:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for element to be ready
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in ms
     */
    async waitForElement(selector, timeout = 10000) {
        try {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`✅ Element found: ${selector}`);
                    return { success: true, element };
                }
                await new Promise(r => setTimeout(r, 100));
            }
            console.warn(`⚠️ Element not found: ${selector}`);
            return { success: false, error: 'Timeout' };
        } catch (error) {
            console.warn(`⚠️ Error waiting for element:`, error.message);
            return { success: false, error: error.message };
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
     * Check if checkbox is checked
     * @param {HTMLElement} checkbox - Checkbox element
     */
    isCheckboxChecked(checkbox) {
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Check/uncheck checkbox
     * @param {HTMLElement} checkbox - Checkbox element
     * @param {boolean} shouldCheck - True to check, false to uncheck
     */
    async setCheckboxState(checkbox, shouldCheck = true) {
        if (!checkbox) {
            console.warn('⚠️ Checkbox not found');
            return { success: false };
        }

        const isCurrentlyChecked = this.isCheckboxChecked(checkbox);

        if (isCurrentlyChecked === shouldCheck) {
            console.log(`✅ Checkbox already ${shouldCheck ? 'checked' : 'unchecked'}`);
            return { success: true, skipped: true };
        }

        try {
            checkbox.focus();
            await new Promise(r => setTimeout(r, 200));
            checkbox.click();
            await new Promise(r => setTimeout(r, 300));

            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Checkbox ${shouldCheck ? 'checked' : 'unchecked'}`);
            return { success: true };
        } catch (error) {
            console.warn(`⚠️ Error setting checkbox:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in extension
if (typeof window !== 'undefined') {
    window.FormFillerExtension = FormFillerExtension;
}
