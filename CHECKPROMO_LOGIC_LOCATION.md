# Check Promo Logic Location

## ✅ Đã Có Logic Chạy CheckPromo Sau AddBank

### File: `tools/vip-tool/vip-automation.js`

### Dòng: 214-250

### Code:
```javascript
async runVIPAutomation(browser, category, sites, profileData, mode = 'auto') {
    const results = [];

    for (const siteName of sites) {
        const categoryConfig = this.getSitesByCategory(category);
        const siteConfig = categoryConfig.sites.find(s => s.name === siteName);

        if (!siteConfig) {
            console.error(`❌ Site not found: ${siteName}`);
            continue;
        }

        console.log(`\n🚀 Processing ${category.toUpperCase()} - ${siteName}`);

        try {
            if (mode === 'auto') {
                // Luồng tự động: register → addbank → checkpromo
                const registerResult = await this.registerStep(browser, category, siteConfig, profileData);
                const addBankResult = await this.addBankStep(browser, category, siteConfig, profileData);
                const checkPromoResult = await this.checkPromoStep(browser, category, siteConfig);

                results.push({
                    site: siteName,
                    register: registerResult,
                    addBank: addBankResult,
                    checkPromo: checkPromoResult
                });
            } else if (mode === 'promo') {
                // Chỉ check promo
                const checkPromoResult = await this.checkPromoStep(browser, category, siteConfig);
                results.push({
                    site: siteName,
                    checkPromo: checkPromoResult
                });
            }
        } catch (error) {
            console.error(`❌ Error processing ${siteName}:`, error.message);
            // ...
        }
    }

    return results;
}
```

## Flow

```
runVIPAutomation()
    ↓
for each site:
    ↓
if mode === 'auto':
    ↓
    1. registerStep() → registerResult
    ↓
    2. addBankStep() → addBankResult
    ↓
    3. checkPromoStep() → checkPromoResult
    ↓
    results.push({
        site,
        register,
        addBank,
        checkPromo
    })
```

## Các Step

### 1. registerStep() - Dòng 232
- Tạo page mới
- Navigate đến register URL
- Inject scripts
- Fill form
- Solve captcha
- Submit form
- Check token (20 lần, 10 giây)
- Wait navigation

### 2. addBankStep() - Dòng 232
- Gọi addBankOKVIP/ABCVIP/JUN88/KJC tùy category
- Fill bank form
- Submit form
- Wait navigation

### 3. checkPromoStep() - Dòng 233
- Tạo page mới
- Navigate đến checkPromo URL
- Scan page cho promotions
- Return promo info

## Mode

- **'auto'**: Chạy register → addbank → checkpromo (dòng 230)
- **'promo'**: Chỉ chạy checkpromo (dòng 242)

## Result Format

```javascript
{
    site: 'Hi88',
    register: { success: true, message: '...' },
    addBank: { success: true, message: '...' },
    checkPromo: { success: true, promoCount: 5, promos: [...] }
}
```

## Logs

```
🚀 Processing OKVIP - Hi88
📝 Register step for Hi88...
✅ Scripts injected successfully
🎵 Attempting to solve captcha...
✅ Captcha filled: 4050
📤 Submitting registration form for Hi88...
⏳ Waiting for token/redirect...
✅ Token found after 500ms
⏳ Waiting for navigation...
🏦 Add Bank step for Hi88 (OKVIP)...
📤 Submitting bank form for Hi88...
⏳ Waiting for navigation after bank submission...
🎁 Check Promo step for Hi88...
✅ VIP Automation completed
```
