# JUN88V2 Cloudflare Turnstile Issue

## 🐛 Problem

JUN88V2 URL có Cloudflare Turnstile captcha. Khi tự chạy link thì xác thực được, nhưng tool chạy lại không tích được.

**URL**: `ufhtoiklhkfkjguhd7eoij8icxhkjk9.com`

## 🔍 Root Cause

Cloudflare Turnstile là captcha bảo vệ, không thể bypass dễ dàng như reCAPTCHA.

## ✅ Solutions

### Option 1: Use Puppeteer Extra Plugin (Recommended)
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

```javascript
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
    headless: false,
    args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
    ]
});
```

### Option 2: Manual Captcha (Current)
- Tool điền form
- User tự giải Turnstile captcha
- Tool submit form

### Option 3: Use Different URL
- Tìm URL jun88v2 không có Cloudflare
- Update registerUrl trong config

### Option 4: Wait for Cloudflare
```javascript
// Wait for Turnstile to load
await page.waitForSelector('.turnstile-container', { timeout: 10000 });

// Wait for user to solve (manual)
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 });
```

## 📝 Current Implementation

Đã thêm Turnstile bypass attempt, nhưng không đảm bảo hoạt động:

```javascript
if (category === 'jun88v2') {
    console.log('🔐 JUN88V2: Attempting to bypass Cloudflare Turnstile...');
    try {
        await page.evaluate(() => {
            // Try to set token
            window.turnstileToken = 'bypass_token';
            
            // Try to find and set response field
            const responseField = document.querySelector('input[name="cf-turnstile-response"]');
            if (responseField) {
                responseField.value = 'bypass_token';
                responseField.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        console.log('✅ Turnstile bypass attempted');
    } catch (error) {
        console.warn('⚠️ Turnstile bypass failed');
    }
}
```

## 🚀 Recommended Approach

### For Now: Manual Captcha
1. Tool điền form
2. User tự giải Turnstile
3. Tool submit form

### For Future: Use Stealth Plugin
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

## 📊 Expected Flow

```
1. Goto JUN88V2 URL
   ↓
2. Wait for Turnstile to load
   ↓
3. Fill form (username, password, name, phone)
   ↓
4. User solves Turnstile captcha manually
   ↓
5. Tool detects captcha solved
   ↓
6. Tool submits form
```

## 🔧 How to Test

```bash
node dashboard/server.js
```

Select: **Category = JUN88V2, Mode = Auto**

**Expected**:
1. Browser opens
2. Form appears with Turnstile
3. User solves Turnstile
4. Tool submits form

## 📞 Notes

- Cloudflare Turnstile không thể bypass hoàn toàn
- Cần user tương tác hoặc dùng plugin stealth
- Stealth plugin có thể giúp bypass trong một số trường hợp

---

**Last Updated**: 2025-12-18
**Status**: ⚠️ Needs Manual Captcha
