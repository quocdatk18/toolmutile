# CheckPromo Refactored - Tách Theo Category

## Thay Đổi

### Trước
```javascript
async checkPromoStep(browser, category, siteConfig) {
    // Logic chung cho tất cả categories
    // Không thể customize cho từng category
}
```

### Sau
```javascript
async checkPromoStep(browser, category, siteConfig) {
    if (category === 'okvip') {
        return await this.checkPromoOKVIP(browser, siteConfig);
    } else if (category === 'abcvip') {
        return await this.checkPromoABCVIP(browser, siteConfig);
    } else if (category === 'jun88') {
        return await this.checkPromoJUN88(browser, siteConfig);
    } else if (category === 'kjc') {
        return await this.checkPromoKJC(browser, siteConfig);
    }
    return { success: false, error: 'Unknown category' };
}

async checkPromoOKVIP(browser, siteConfig) { ... }
async checkPromoABCVIP(browser, siteConfig) { ... }
async checkPromoJUN88(browser, siteConfig) { ... }
async checkPromoKJC(browser, siteConfig) { ... }
```

## Cấu Trúc

### checkPromoStep() - Router
- Nhận category
- Gọi hàm tương ứng
- Return result

### checkPromoOKVIP() - OKVIP Logic
- Tạo page mới
- Navigate đến checkPromoUrl
- Scan page tìm promotions
- Return promo info

### checkPromoABCVIP() - ABCVIP Logic
- Tương tự OKVIP
- Có thể customize khác

### checkPromoJUN88() - JUN88 Logic
- Tương tự OKVIP
- Có thể customize khác

### checkPromoKJC() - KJC Logic
- Tương tự OKVIP
- Có thể customize khác

## Vị Trí

**File**: `tools/vip-tool/vip-automation.js`

**Dòng**:
- checkPromoStep(): 566-580
- checkPromoOKVIP(): 582-620
- checkPromoABCVIP(): 622-660
- checkPromoJUN88(): 662-700
- checkPromoKJC(): 702-740

## Lợi Ích

1. **Dễ customize**: Mỗi category có hàm riêng
2. **Dễ maintain**: Logic tách rõ ràng
3. **Dễ debug**: Biết logic nào fail
4. **Dễ mở rộng**: Thêm logic phức tạp cho từng category

## Ví Dụ Customize

### OKVIP - Có thể thêm logic click button
```javascript
async checkPromoOKVIP(browser, siteConfig) {
    const page = await browser.newPage();
    try {
        console.log(`🎁 Check Promo step for ${siteConfig.name} (OKVIP)...`);

        await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // OKVIP-specific: Click "Nhận KM" button
        await page.evaluate(() => {
            const btn = document.querySelector('button[class*="nhan-km"]');
            if (btn) btn.click();
        });

        await new Promise(r => setTimeout(r, 1000));

        // Scan promotions
        const promoInfo = await page.evaluate(() => {
            // ... logic
        });

        return promoInfo;
    } catch (error) {
        console.error(`❌ OKVIP Check Promo Error:`, error.message);
        return { success: false, error: error.message };
    }
}
```

### ABCVIP - Có thể thêm logic fill form
```javascript
async checkPromoABCVIP(browser, siteConfig) {
    const page = await browser.newPage();
    try {
        console.log(`🎁 Check Promo step for ${siteConfig.name} (ABCVIP)...`);

        await page.goto(siteConfig.checkPromoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // ABCVIP-specific: Fill form
        await page.evaluate(() => {
            const input = document.querySelector('input[name="promo-code"]');
            if (input) {
                input.value = 'PROMO123';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Scan promotions
        const promoInfo = await page.evaluate(() => {
            // ... logic
        });

        return promoInfo;
    } catch (error) {
        console.error(`❌ ABCVIP Check Promo Error:`, error.message);
        return { success: false, error: error.message };
    }
}
```

## Flow

```
runVIPAutomation()
    ↓
for each site:
    ↓
    registerStep()
    ↓
    addBankStep()
    ↓
    checkPromoStep(browser, category, siteConfig)
        ↓
        if category === 'okvip':
            ↓
            checkPromoOKVIP()
        else if category === 'abcvip':
            ↓
            checkPromoABCVIP()
        else if category === 'jun88':
            ↓
            checkPromoJUN88()
        else if category === 'kjc':
            ↓
            checkPromoKJC()
```

## Testing

Chạy VIP automation:
```
🚀 Processing OKVIP - Hi88
📝 Register step for Hi88...
✅ Register completed
🏦 Add Bank step for Hi88 (OKVIP)...
✅ Add bank completed
🎁 Check Promo step for Hi88 (OKVIP)...
✅ Check Promo completed
```

## Next Steps

1. Implement logic riêng cho từng category
2. Thêm click button, fill form, solve captcha nếu cần
3. Test từng category
4. Update checkPromoUrl hợp lệ trong config
