# JUN88V2 Implementation - Complete ✅

## 📋 Overview

JUN88V2 form giống JUN88 & 78WIN, chỉ khác selector. Đã implement:
1. ✅ Anti-bot form filling (slow typing + delays)
2. ✅ Add bank button click
3. ✅ Account & password fill
4. ✅ CheckPromo skip (auto mode)

## 🔧 Changes Applied

### 1. Register Form Filling
**File**: `tools/vip-tool/vip-automation.js` (Line ~1521)

**Selectors**:
```javascript
// Full name
input[id="fullname"]

// Username
input[id="username"]

// Password
input[id="password"]

// Mobile
input[placeholder*="Số điện thoại"]
input[type="text"][inputmode="numeric"]
input[pattern="[0-9]*"]

// No checkbox (unlike jun88 & 78win)
```

**Features**:
- ✅ Slow typing (100-150ms per char)
- ✅ Delays between fields (300ms + 800ms)
- ✅ Error handling

### 2. Add Bank
**File**: `tools/vip-tool/vip-automation.js` (Line ~2112)

**Features**:
- ✅ Click "Thêm ngân hàng +" button
- ✅ Select bank from dropdown
- ✅ Type account number (100ms per char)
- ✅ Type password (100ms per char)
- ✅ Click OK button
- ✅ Delay 2-5s before submit

## 📊 Complete Flow

### Mode: Auto
```
Register (15-20s)
  ├─ Slow form filling
  ├─ No checkbox
  ├─ Scroll page
  ├─ Delay 8-25s
  └─ Click submit button

Add Bank (2-5s)
  ├─ Click "Thêm ngân hàng +"
  ├─ Select bank
  ├─ Type account number
  ├─ Type password
  ├─ Delay 2-5s
  └─ Click OK button

Skip CheckPromo
  └─ (Use separate tab for promo)
```

### Mode: Promo
```
CheckPromo (separate tab)
  └─ Run promo check
```

## 🚀 How to Test

```bash
node dashboard/server.js
```

Select:
- Category: **JUN88V2**
- Mode: **Auto** (or Promo)
- Sites: jun88v2_1, jun88v2_2, ...

## 📊 Expected Logs

### Auto Mode:
```
🚀 Processing JUN88V2 - jun88v2_1
📝 Register step for jun88v2_1...
🤖 JUN88V2 Form - Anti-bot mode enabled
👤 Filling full name...
📝 Filling username...
🔐 Filling password...
📱 Filling mobile...
✅ Token found
🏦 Add Bank step for jun88v2_1 (JUN88V2)...
✅ Clicked "Thêm ngân hàng +" button
✅ Bank selected
💳 Filling account number...
✅ Account number filled
🔐 Filling password...
✅ Password filled
✅ Submit button clicked
✅ Bank result: {success: true}
⏭️ Skipping checkPromo for jun88v2_1 (JUN88V2 - use separate tab)
```

## 📝 Form Selectors

### Register Form
```html
<!-- Full name -->
<input id="fullname" placeholder="Họ Và Tên">

<!-- Username -->
<input id="username" placeholder="Tên Đăng Nhập">

<!-- Password -->
<input id="password" placeholder="Mật khẩu">

<!-- Mobile -->
<input type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Số điện thoại di động">
```

### Add Bank Form
```html
<!-- Bank dropdown -->
<input id="bankid">

<!-- Account number -->
<input id="bankaccount">

<!-- Password -->
<input id="password">

<!-- OK button -->
<button>OK</button>
```

## 🎯 Key Features

✅ **Register**
- Slow form filling (15-20s)
- Anti-bot measures
- No checkbox (unlike jun88 & 78win)
- Button click

✅ **Add Bank**
- Click "Thêm ngân hàng +" button
- Select bank from dropdown
- Type account number (100ms per char)
- Type password (100ms per char)
- Click OK button

✅ **CheckPromo**
- Skip in auto mode
- Run in promo mode (separate tab)
- Same as OKVIP, ABCVIP, JUN88, 78WIN

## 📋 Checklist

- [x] Register form filling implemented
- [x] Anti-bot measures applied
- [x] Add bank implemented
- [x] Account & password fill
- [x] CheckPromo skip
- [x] Logging added
- [x] Error handling
- [x] Ready to test

## 🚀 Next Steps

1. Run full automation
2. Monitor logs
3. Verify register success
4. Verify add bank success
5. Verify checkPromo skipped

---

**Last Updated**: 2025-12-18
**Status**: ✅ Complete
**Version**: 1.0
