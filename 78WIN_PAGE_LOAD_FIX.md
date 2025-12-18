# 78WIN Page Load Fix

## 🐛 Problem

78win load link rút gọn trước, cần chờ load hoàn tất rồi redirect tới /signup mới fill form.

## ✅ Solution Applied

### Change: registerStep() - Wait for 78WIN Page Load
**File**: `tools/vip-tool/vip-automation.js` (Line ~612)

**Before**:
```javascript
await page.goto(siteConfig.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
```

**After**:
```javascript
await page.goto(siteConfig.registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

// For 78WIN: wait for page to fully load (redirect from short link to main page)
if (category === '78win') {
    console.log('⏳ 78WIN: Waiting for page to fully load (redirect from short link)...');
    
    // Wait for navigation to complete
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null);
    } catch (e) {
        // Ignore timeout
    }
    
    // Wait for signup form to be ready
    try {
        await page.waitForSelector('input[id="playerid"]', { timeout: 10000 });
        console.log('✅ 78WIN page fully loaded');
    } catch (e) {
        console.warn('⚠️ Form not found, continuing anyway...');
    }
    
    // Extra wait for 78win
    await new Promise(r => setTimeout(r, 3000));
} else {
    await new Promise(r => setTimeout(r, 3000));
}
```

## 📊 Flow

```
1. Goto short link (e.g., 239050.com/signup)
   ↓
2. Wait for navigation (redirect to main page)
   ↓
3. Wait for form to appear (input[id="playerid"])
   ↓
4. Extra wait 3s
   ↓
5. Fill form
```

## 🚀 How to Test

```bash
node dashboard/server.js
```

Select: **Category = 78WIN, Mode = Auto**

## 📊 Expected Logs

```
📝 Register step for 78win1...
⏳ 78WIN: Waiting for page to fully load (redirect from short link)...
✅ 78WIN page fully loaded
🤖 78WIN Form - Anti-bot mode enabled
📝 Filling username...
🔐 Filling password...
👤 Filling name...
📱 Filling mobile...
✅ Agree checkbox already checked
✅ Token found
```

## 🎯 Key Points

1. **waitForNavigation** - Wait for redirect to complete
2. **waitForSelector** - Wait for form to appear
3. **Extra wait 3s** - Ensure page is fully ready
4. **Error handling** - Continue if timeout

## ✨ Status

✅ Page load wait added
✅ Ready to test

---

**Last Updated**: 2025-12-18
**Status**: ✅ Fixed
