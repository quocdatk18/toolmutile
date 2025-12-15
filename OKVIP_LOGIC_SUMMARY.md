# OKVIP Logic Summary - Để Copy cho ABCVIP

## 1. OKVIP Register Form Filling
**File:** `tools/vip-tool/vip-automation.js`
**Function:** `fillOKVIPRegisterForm(page, profileData)`
**Line:** ~1195

### Selectors sử dụng:
```javascript
// Username
[formcontrolname="username"]

// Password
[formcontrolname="password"]

// Confirm Password
[formcontrolname="confirmPassword"]

// Full Name
[formcontrolname="fullName"]

// Phone
[formcontrolname="phone"]

// Email
[formcontrolname="email"]

// Checkbox Agree
input[type="checkbox"][formcontrolname="agree"]

// Submit Button
button[type="submit"]
```

### Logic:
1. Wait for form fields
2. Fill username, password, confirmPassword, fullName, phone, email
3. Check agree checkbox
4. Click submit button
5. Wait for success/error message

---

## 2. OKVIP Add Bank
**Function:** `addBankOKVIP(browser, siteConfig, profileData, existingPage)`
**Line:** ~662

### Steps:
1. Navigate to withdraw password page: `/Account/ChangeMoneyPassword`
2. Fill withdraw password form
3. Navigate to bank page: `/Financial?type=withdraw`
4. Fill bank form with:
   - Bank name (dropdown)
   - Account number
   - Account holder name
5. Submit

### Selectors cần tìm:
- Withdraw password input
- Bank dropdown
- Account number input
- Account holder name input
- Submit button

---

## 3. OKVIP Check Promo
**Function:** `checkPromoOKVIP(browser, siteConfig, profileData)`
**Line:** ~975

### Steps:
1. Navigate to promo URL
2. Fill username
3. Select promo option
4. Solve captcha
5. Click confirm button

### Selectors cần tìm:
- Username input
- Promo select dropdown
- Captcha iframe
- Confirm button

---

## Cấu trúc để Copy:

```javascript
// 1. Thêm vào fillRegisterForm (line ~1180)
} else if (category === 'abcvip') {
    await this.fillABCVIPRegisterForm(page, profileData);

// 2. Thêm vào addBankStep (line ~647)
} else if (category === 'abcvip') {
    return await this.addBankABCVIP(browser, siteConfig, profileData, existingPage);

// 3. Thêm vào checkPromoStep (line ~959)
} else if (category === 'abcvip') {
    return await this.checkPromoABCVIP(browser, siteConfig, profileData);

// 4. Tạo 3 hàm mới:
async fillABCVIPRegisterForm(page, profileData) { ... }
async addBankABCVIP(browser, siteConfig, profileData, existingPage) { ... }
async checkPromoABCVIP(browser, siteConfig, profileData) { ... }
```

---

## Bước tiếp theo:
1. Gửi cho mình selectors của ABCVIP form
2. Tôi sẽ copy logic OKVIP và thay selectors
3. Test trên ABCVIP sites
