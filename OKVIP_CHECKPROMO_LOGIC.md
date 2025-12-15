# OKVIP Check Promo Logic

## Vị Trí
**File**: `tools/vip-tool/vip-automation.js`
**Hàm**: `checkPromoOKVIP()`
**Dòng**: 582-680

## Flow

```
1. Navigate to checkPromoUrl
   ↓
2. Fill username (#account)
   ↓
3. Click promo dropdown (#select-promo-id)
   ↓
4. Select first promo option (.options-list-li)
   ↓
5. Solve captcha (#captcha-image → #captcha-input)
   ↓
6. Click submit button (.btn-submit)
   ↓
7. Wait for navigation
   ↓
8. Get result
```

## HTML Selectors

| Element | Selector | Type |
|---------|----------|------|
| Username input | `#account` | input[type=text] |
| Promo dropdown | `#select-promo-id` | div (custom select) |
| Promo options | `.options-list-li` | li |
| Captcha image | `#captcha-image` | img |
| Captcha input | `#captcha-input` | input[type=text] |
| Submit button | `.btn-submit` | div |

## Code

```javascript
async checkPromoOKVIP(browser, siteConfig) {
    const page = await browser.newPage();
    try {
        console.log(`🎁 Check Promo step for ${siteConfig.name} (OKVIP)...`);

        // 1. Navigate to promo URL
        await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // 2. Fill username
        console.log(`📝 Filling username...`);
        await page.evaluate((username) => {
            const input = document.querySelector('#account');
            if (input) {
                input.value = username;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, siteConfig.name);

        await new Promise(r => setTimeout(r, 500));

        // 3. Select promo (click on dropdown to open)
        console.log(`🎁 Selecting promo...`);
        await page.evaluate(() => {
            const selectDiv = document.querySelector('#select-promo-id');
            if (selectDiv) {
                selectDiv.click();
            }
        });

        await new Promise(r => setTimeout(r, 500));

        // 4. Select first promo option
        await page.evaluate(() => {
            const firstOption = document.querySelector('.options-list-li');
            if (firstOption) {
                firstOption.click();
            }
        });

        await new Promise(r => setTimeout(r, 500));

        // 5. Solve captcha
        console.log(`🔐 Solving captcha...`);
        const apiKey = this.settings?.captchaApiKey;
        
        if (apiKey) {
            // Get captcha image
            const captchaImage = await page.evaluate(() => {
                const img = document.querySelector('#captcha-image');
                return img ? img.src : null;
            });

            if (captchaImage && captchaImage.startsWith('data:image')) {
                // Solve captcha using CaptchaSolver
                const captchaAnswer = await page.evaluate((apiKeyParam, captchaImageData) => {
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Captcha solve timeout'));
                        }, 30000);

                        try {
                            if (typeof CaptchaSolver === 'undefined') {
                                reject(new Error('CaptchaSolver not loaded'));
                                return;
                            }

                            const solver = new CaptchaSolver(apiKeyParam);
                            solver.solveImageCaptcha(captchaImageData).then(result => {
                                clearTimeout(timeout);
                                resolve(result);
                            }).catch(error => {
                                clearTimeout(timeout);
                                reject(error);
                            });
                        } catch (error) {
                            clearTimeout(timeout);
                            reject(error);
                        }
                    });
                }, apiKey, captchaImage);

                if (captchaAnswer) {
                    console.log(`✅ Captcha solved: ${captchaAnswer}`);

                    // Fill captcha input
                    await page.evaluate((answer) => {
                        const input = document.querySelector('#captcha-input');
                        if (input) {
                            input.value = answer;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, captchaAnswer);

                    await new Promise(r => setTimeout(r, 500));
                }
            }
        } else {
            console.warn(`⚠️ No API key, skipping captcha solve`);
        }

        // 6. Click submit button
        console.log(`📤 Clicking submit button...`);
        await page.evaluate(() => {
            const btn = document.querySelector('.btn-submit');
            if (btn) {
                btn.click();
            }
        });

        // 7. Wait for navigation or result
        await page.waitForNavigation({ timeout: 10000 }).catch(() => {
            console.log('⚠️ No navigation after submit');
        });

        // 8. Get result
        const result = await page.evaluate(() => {
            // Check if success message appears
            const successMsg = document.querySelector('[class*="success"]');
            const errorMsg = document.querySelector('[class*="error"]');

            return {
                success: !!successMsg,
                message: successMsg?.textContent || errorMsg?.textContent || 'Unknown result'
            };
        });

        console.log(`✅ Check Promo completed:`, result);
        return { success: true, ...result };

    } catch (error) {
        console.error(`❌ OKVIP Check Promo Error:`, error.message);
        return { success: false, error: error.message };
    }
}
```

## Logs

```
🎁 Check Promo step for Hi88 (OKVIP)...
📝 Filling username...
🎁 Selecting promo...
🔐 Solving captcha...
✅ Captcha solved: 7872
📤 Clicking submit button...
✅ Check Promo completed: { success: true, message: '...' }
```

## Notes

- Username được fill từ `siteConfig.name` (Hi88, OKVip2, etc.)
- Promo được select là option đầu tiên trong dropdown
- Captcha được solve tự động nếu có API key
- Nếu không có API key, skip captcha solve
- Tab vẫn mở để debug

## Next Steps

- Implement tương tự cho ABCVIP, JUN88, KJC
- Update checkPromoUrl hợp lệ trong config
- Test từng category
