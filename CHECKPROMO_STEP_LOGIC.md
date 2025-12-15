# CheckPromoStep Logic

## Vị Trí
**File**: `tools/vip-tool/vip-automation.js`
**Dòng**: 566-600
**Hàm**: `checkPromoStep(browser, category, siteConfig)`

## Logic Hiện Tại (Cơ Bản)

```javascript
async checkPromoStep(browser, category, siteConfig) {
    const page = await browser.newPage();
    try {
        console.log(`🎁 Check Promo step for ${siteConfig.name}...`);

        // 1. Navigate to promo URL
        await page.goto(siteConfig.checkPromoUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        await new Promise(r => setTimeout(r, 2000));

        // 2. Scan page for promotions
        const promoInfo = await page.evaluate(() => {
            const promoElements = document.querySelectorAll('[class*="promo"], [class*="promotion"]');
            const promos = [];

            promoElements.forEach(el => {
                if (el.textContent) {
                    promos.push(el.textContent.trim());
                }
            });

            return {
                success: true,
                promoCount: promos.length,
                promos: promos.slice(0, 5)
            };
        });

        return promoInfo;
    } catch (error) {
        console.error(`❌ Check Promo Error:`, error.message);
        return { success: false, error: error.message };
    }
    // Note: Keep page open for inspection/debugging
}
```

## Các Bước

1. **Tạo page mới**: `browser.newPage()`
2. **Navigate**: Đến `siteConfig.checkPromoUrl`
3. **Wait**: 2 giây để page load
4. **Scan**: Tìm elements có class chứa "promo" hoặc "promotion"
5. **Extract**: Lấy text content từ các elements
6. **Return**: Trả về promo info

## Input

- `browser`: Puppeteer browser instance
- `category`: Category name (okvip, abcvip, jun88, kjc)
- `siteConfig`: Site config object
  - `siteConfig.name`: Site name (Hi88, OKVip2, etc.)
  - `siteConfig.checkPromoUrl`: URL để check promo

## Output

```javascript
{
    success: true,
    promoCount: 5,
    promos: [
        "Khuyến mãi 1",
        "Khuyến mãi 2",
        "Khuyến mãi 3",
        "Khuyến mãi 4",
        "Khuyến mãi 5"
    ]
}
```

Hoặc nếu error:
```javascript
{
    success: false,
    error: "net::ERR_NAME_NOT_RESOLVED at https://okvip1.com/promo"
}
```

## Vấn Đề Hiện Tại

1. **checkPromoUrl không hợp lệ**: Các URL trong config (okvip1.com, okvip2.com, etc.) không tồn tại
   - Kết quả: `net::ERR_NAME_NOT_RESOLVED`

2. **Logic quá đơn giản**: Chỉ scan elements có class chứa "promo"
   - Có thể miss các promotions không có class này

3. **Không có logic tương tác**: Không click button, không fill form
   - NOHU Tool có logic phức tạp hơn (click "Nhận KM", solve captcha, etc.)

## So Sánh Với NOHU Tool

### NOHU Tool (Phức Tạp)
- Validate API key
- Bring tab to front (prevent throttling)
- Click "Nhận KM" button
- Solve captcha nếu có
- Wait for navigation
- Extract promotions

### VIP Tool (Hiện Tại - Đơn Giản)
- Navigate to promo URL
- Scan page for elements
- Extract text content
- Return promo info

## Cải Thiện Có Thể

1. **Fix checkPromoUrl**: Cập nhật URL hợp lệ trong config
2. **Thêm logic tương tác**: Click button, fill form, solve captcha
3. **Thêm retry logic**: Nếu fail, retry lại
4. **Thêm logging**: Chi tiết hơn về quá trình check

## Logs

```
🎁 Check Promo step for Hi88...
✅ Check Promo completed
```

Hoặc nếu error:
```
🎁 Check Promo step for Hi88...
❌ Check Promo Error: net::ERR_NAME_NOT_RESOLVED at https://okvip1.com/promo
```
