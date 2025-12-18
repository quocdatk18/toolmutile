# JUN88 Quick Test - Checkbox & Button Fix

## 🚀 Quick Start (2 minutes)

### Step 1: Run Debug Script
```bash
node test-jun88-button-debug.js
```

### Step 2: Check Output
Look for:
```
✅ Checkbox already checked
✅ Submit button found
✅ Submit button is visible
✅ Submit button is enabled
✅ Button clicked via evaluate
```

### Step 3: If OK, Run Full Automation
```bash
node dashboard/server.js
```

Select: JUN88 category

---

## 📊 Expected Results

### ✅ Success:
- Checkbox không bị click (đã checked)
- Button được tìm thấy
- Button được click
- Form submit
- Đăng kí tiếp tục

### ❌ Fail:
- Error: "Node is either not clickable"
- Button not found
- Checkbox click fail

---

## 🔧 If Fail

### Check 1: Checkbox
```javascript
// In DevTools console
document.querySelector('input[id="agree"]')
```

### Check 2: Button
```javascript
// In DevTools console
document.querySelector('button')
document.querySelectorAll('button')
```

### Check 3: Button Text
```javascript
// In DevTools console
document.querySelector('button').textContent
```

---

## 📝 Files

- `test-jun88-button-debug.js` - Debug script
- `JUN88_DEBUG_GUIDE.md` - Detailed debug guide
- `JUN88_LATEST_FIX.md` - Fix explanation

---

**Ready? Run:**
```bash
node test-jun88-button-debug.js
```
