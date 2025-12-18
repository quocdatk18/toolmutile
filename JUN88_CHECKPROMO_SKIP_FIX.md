# JUN88 CheckPromo Skip Fix

## 🎯 Requirement
Jun88 cần như OKVIP và ABCVIP:
- Mode auto: **skip checkPromo** (không chạy)
- Mode promo: chạy checkPromo ở **tab riêng**

## ✅ Solution Applied

### Change: Skip CheckPromo for JUN88
**File**: `tools/vip-tool/vip-automation.js`

**Location 1**: Line ~444 (runSitesSequential)
**Location 2**: Line ~555 (processSite)

**Before**:
```javascript
if (addBankResult?.success && category !== 'abcvip' && category !== 'okvip') {
    checkPromoResult = await this.checkPromoStep(...);
} else if (category === 'abcvip') {
    console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - use separate tab)`);
} else if (category === 'okvip') {
    console.log(`⏭️ Skipping checkPromo for ${siteName} (OKVIP - use separate tab)`);
}
```

**After**:
```javascript
if (addBankResult?.success && category !== 'abcvip' && category !== 'okvip' && category !== 'jun88') {
    checkPromoResult = await this.checkPromoStep(...);
} else if (category === 'abcvip') {
    console.log(`⏭️ Skipping checkPromo for ${siteName} (ABCVIP - use separate tab)`);
} else if (category === 'okvip') {
    console.log(`⏭️ Skipping checkPromo for ${siteName} (OKVIP - use separate tab)`);
} else if (category === 'jun88') {
    console.log(`⏭️ Skipping checkPromo for ${siteName} (JUN88 - use separate tab)`);
}
```

## 📊 Flow

### Mode: Auto
```
Register → Add Bank → Skip CheckPromo
```

### Mode: Promo
```
CheckPromo (separate tab)
```

## 🚀 How to Test

### Test 1: Auto Mode (Skip CheckPromo)
```bash
node dashboard/server.js
```

Select:
- Category: JUN88
- Mode: Auto
- Sites: Jun881, Jun882

**Expected**:
```
✅ Register successful
✅ Add Bank successful
⏭️ Skipping checkPromo for Jun881 (JUN88 - use separate tab)
```

### Test 2: Promo Mode (Run CheckPromo)
```bash
node dashboard/server.js
```

Select:
- Category: JUN88
- Mode: Promo
- Sites: Jun881, Jun882

**Expected**:
```
🔍 Checking promo for Jun881...
✅ Promo check completed
```

## 📊 Expected Logs

### ✅ Auto Mode:
```
🚀 Processing JUN88 - Jun881
📝 Register step for Jun881...
✅ Token found
🏦 Add Bank step for Jun881 (JUN88)...
✅ Bank result: {success: true}
⏭️ Skipping checkPromo for Jun881 (JUN88 - use separate tab)
```

### ✅ Promo Mode:
```
🚀 Processing JUN88 - Jun881
🔍 Checking promo for Jun881...
✅ Promo check completed
```

## 📝 Code Changes

### File: `tools/vip-tool/vip-automation.js`

**Change 1**: Line ~444 (runSitesSequential)
- Add `category !== 'jun88'` to condition
- Add `else if (category === 'jun88')` block

**Change 2**: Line ~555 (processSite)
- Add `category !== 'jun88'` to condition
- Add `else if (category === 'jun88')` block

## 🎯 Expected Results

✅ Auto mode: Register + Add Bank, skip CheckPromo
✅ Promo mode: CheckPromo only
✅ Same behavior as OKVIP & ABCVIP

## 📋 Checklist

- [x] Skip checkPromo for JUN88 in auto mode
- [x] Allow checkPromo for JUN88 in promo mode
- [x] Same behavior as OKVIP & ABCVIP
- [x] Logging updated
- [x] Ready to test

## 🚀 Next Steps

1. Run auto mode test
2. Verify checkPromo skipped
3. Run promo mode test
4. Verify checkPromo runs
5. Compare with OKVIP/ABCVIP

---

**Last Updated**: 2025-12-18
**Status**: ✅ Fixed
**Version**: 6.0 (with checkPromo skip)
