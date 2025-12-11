# Auto Redirect Đến Trang Rút Tiền Sau Khi Login

## Vấn đề trước đây
- Sau khi login thành công → phải thao tác với UI để tìm và click nút rút tiền
- Logic phức tạp, dễ lỗi nếu UI thay đổi
- Mất thời gian chờ đợi

## Giải pháp mới
Sau khi login thành công → **tự động redirect** đến trang rút tiền `/Financial?type=withdraw` và fill form luôn

## Thay đổi chính

### 1. Thêm `data-withdraw` vào HTML
**File:** `dashboard/tools-ui/nohu-tool.html`

Thêm attribute `data-withdraw` cho mỗi site:

```html
<input type="checkbox" class="site-check" data-name="NOHU"
    data-register="https://m.8nohu.vip/?f=6344995"
    data-login="https://m.88111188.com/?app=1"
    data-withdraw="https://m.88111188.com/Financial?type=withdraw"
    data-promo="https://nohucode.shop">
```

### 2. Lấy `withdrawUrl` từ checkbox
**File:** `dashboard/tools-ui/nohu-tool.html`

```javascript
function getSelectedSitesByType() {
    document.querySelectorAll('#appPromoSites .site-check:checked').forEach(checkbox => {
        const name = checkbox.getAttribute('data-name');
        const registerUrl = checkbox.getAttribute('data-register');
        const loginUrl = checkbox.getAttribute('data-login');
        const withdrawUrl = checkbox.getAttribute('data-withdraw'); // ← MỚI
        const promoUrl = checkbox.getAttribute('data-promo');

        if (registerUrl) {
            appSites.push({ name, registerUrl, loginUrl, withdrawUrl, promoUrl });
        }
    });
}
```

### 3. Auto-redirect sau khi login
**File:** `tools/nohu-tool/complete-automation.js`

Thêm tham số `withdrawUrl` vào `runRegistration()`:

```javascript
async runRegistration(browser, url, profileData, loginUrl = null, withdrawUrl = null)
```

**Logic mới:**
1. Đăng ký thành công ✅
2. Navigate sang loginUrl ✅
3. Login thành công ✅
4. **Nếu có `withdrawUrl` và bank info** → Navigate sang withdrawUrl
5. Re-inject scripts
6. Auto-fill withdraw form
7. Submit form

```javascript
if (loginResult.success) {
    // Auto-redirect to withdraw page if withdrawUrl provided
    if (withdrawUrl && profileData.bankName && profileData.accountNumber) {
        console.log('💰 Auto-redirecting to withdraw page:', withdrawUrl);
        
        await page.goto(withdrawUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Re-inject scripts
        await this.injectScripts(page);
        
        // Auto-fill withdraw form
        const withdrawResult = await page.evaluate((bankInfo) => {
            return new Promise((resolve) => {
                window._chromeMessageListener(
                    { action: 'fillWithdrawForm', data: { withdrawInfo: bankInfo } },
                    {},
                    (response) => resolve(response)
                );
            });
        }, {
            bankName: profileData.bankName,
            bankBranch: profileData.bankBranch,
            accountNumber: profileData.accountNumber,
            withdrawPassword: profileData.withdrawPassword
        });
        
        result.autoWithdraw = withdrawResult;
    }
}
```

### 4. Gộp Add Bank vào Register
**File:** `tools/nohu-tool/auto-sequence.js`

**Trước:**
```javascript
// STEP 1: Register + Login
// STEP 2: Add Bank (riêng biệt)
// STEP 3: Check Promo
```

**Sau:**
```javascript
// STEP 1: Register + Login + Withdraw (gộp chung)
// STEP 2: Check Promo
```

Truyền `withdrawUrl` vào `runRegistration()`:

```javascript
const registerResult = await this.automation.runRegistration(
    browser,
    siteUrls.register,
    {
        username: profileData.username,
        password: profileData.password,
        withdrawPassword: profileData.withdrawPassword,
        fullname: profileData.fullname,
        apiKey: profileData.apiKey,
        bankName: profileData.bankName,        // ← Thêm bank info
        bankBranch: profileData.bankBranch,
        accountNumber: profileData.accountNumber
    },
    siteUrls.login,     // Login URL
    siteUrls.withdraw   // ← Withdraw URL (MỚI)
);

// Check kết quả
if (registerResult.autoWithdraw) {
    results.addBank = registerResult.autoWithdraw; // Lấy từ register result
}
```

## Flow hoàn chỉnh

### Trước đây (4 bước):
1. 📝 Register ở link ref
2. 🔐 Login ở link app (page mới)
3. 💳 Add Bank (thao tác UI)
4. 🎁 Check Promo

### Bây giờ (2 bước):
1. 📝 **Register + Login + Withdraw** (cùng 1 page)
   - Đăng ký ở link ref
   - Navigate sang link app
   - Login
   - Navigate sang `/Financial?type=withdraw`
   - Fill form rút tiền
   - Submit
2. 🎁 **Check Promo**

## Lợi ích

### 1. Đơn giản hơn
- ❌ Bỏ logic thao tác UI phức tạp
- ✅ Chỉ cần redirect URL trực tiếp
- ✅ Ít lỗi hơn khi UI thay đổi

### 2. Nhanh hơn
- ⚡ Không cần tìm và click button
- ⚡ Navigate trực tiếp đến trang rút tiền
- ⚡ Fill form ngay lập tức

### 3. Dễ maintain
- 📦 URL cố định `/Financial?type=withdraw`
- 📦 Không phụ thuộc vào class/id của button
- 📦 Dễ debug khi có vấn đề

## Cách sử dụng

Không cần thay đổi gì! Tool tự động:

1. Đăng ký ở link ref ✅
2. Chuyển sang link app ✅
3. Đăng nhập ✅
4. **Chuyển sang trang rút tiền** ✅ (MỚI)
5. **Fill form rút tiền** ✅ (MỚI)
6. Check promo ✅

Tất cả trên **cùng 1 page** 🎉

## Files đã sửa

1. ✅ `dashboard/tools-ui/nohu-tool.html` - Thêm data-withdraw
2. ✅ `tools/nohu-tool/complete-automation.js` - Auto-redirect withdraw
3. ✅ `tools/nohu-tool/auto-sequence.js` - Gộp Add Bank vào Register

## Test

Chạy tool như bình thường:
```bash
START_DASHBOARD.bat
```

Nhập đầy đủ thông tin bank → Start

Tool sẽ tự động:
- Đăng ký ✅
- Login ✅
- **Redirect đến trang rút tiền** ✅
- **Fill form rút tiền** ✅
- Check promo ✅

Không cần thao tác gì thêm! 🚀
