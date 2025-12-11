# Tab Rotation Improvements

## Vấn đề
Tab rotator đang rotate **TẤT CẢ** pages (kể cả login pages đã xong), gây lãng phí tài nguyên và làm chậm quá trình xử lý.

## Nguyên nhân
1. Pages được register vào rotator khi tạo mới trong `setupPage()`
2. Một số actions không gọi `tabRotator.complete()` sau khi xong:
   - ❌ `runLogin()` - không complete
   - ❌ `runAddBank()` - không complete
   - ✅ `runRegistration()` - có complete
   - ✅ `runCheckPromotionFull()` - có complete

3. Register pages được close sau login nhưng không được mark completed trước khi close

## Giải pháp đã áp dụng

### 1. Cải thiện logic rotation trong `tab-rotator.js`
```javascript
async rotate() {
    // Check if page is closed before rotating
    const isClosed = nextTab.page.isClosed();
    if (isClosed) {
        console.log(`⚠️  Tab ${nextTab.taskName} is closed, marking as completed`);
        nextTab.status = 'completed';
        return this.rotate(); // Try next tab
    }
    
    // Rotate to next tab
    await nextTab.page.bringToFront();
    nextTab.status = 'running';
}
```

**Lợi ích:**
- Tự động skip pages đã close
- Không crash khi cố bringToFront page đã close
- Tự động thử tab tiếp theo

### 2. Thêm `tabRotator.complete()` vào `runLogin()`
```javascript
async runLogin(browserOrContext, url, profileData) {
    // ... login logic ...
    
    // Mark tab as completed in rotator
    try {
        const tabRotator = require('./tab-rotator');
        tabRotator.complete(page);
    } catch (err) {
        // Ignore
    }
    
    return { success: true, ... };
}
```

**Lợi ích:**
- Login pages không còn bị rotate sau khi xong
- Giảm overhead của rotation

### 3. Thêm `tabRotator.complete()` vào `runAddBank()`
```javascript
async runAddBank(browser, url, bankInfo) {
    // ... add bank logic ...
    
    // Mark tab as completed in rotator
    try {
        const tabRotator = require('./tab-rotator');
        tabRotator.complete(page);
    } catch (err) {
        // Ignore
    }
    
    return result;
}
```

**Lợi ích:**
- Add bank pages không còn bị rotate sau khi xong

### 4. Mark completed trước khi close register page
```javascript
// In auto-sequence.js
if (registerPage) {
    console.log(`🗑️  Closing register page after successful login...`);
    try {
        // Mark as completed in rotator before closing
        const tabRotator = require('./tab-rotator');
        tabRotator.complete(registerPage);
        
        await registerPage.close();
        console.log(`✅ Register page closed`);
    } catch (e) {
        console.log(`⚠️  Could not close register page:`, e.message);
    }
}
```

**Lợi ích:**
- Rotator không cố rotate page đang được close
- Tránh race condition

## Kết quả

### Trước khi cải thiện
```
🔄 Starting tab rotation...
👁️  Rotated to: site1.com (5 tabs remaining)
👁️  Rotated to: site2.com (5 tabs remaining)  ← Login page đã xong
👁️  Rotated to: site3.com (5 tabs remaining)  ← Login page đã xong
👁️  Rotated to: site1.com (5 tabs remaining)  ← Lặp lại
👁️  Rotated to: site2.com (5 tabs remaining)  ← Lặp lại
...
```

### Sau khi cải thiện
```
🔄 Starting tab rotation...
👁️  Rotated to: site1.com (3 tabs remaining)
👁️  Rotated to: site2.com (2 tabs remaining)
👁️  Rotated to: site3.com (1 tabs remaining)
✅ All tabs completed, stopping rotation
```

## Các pages được rotate

### Pages CẦN rotate (đang xử lý)
- ✅ Register pages (đang fill form, solve captcha)
- ✅ Promo pages (đang check promotion)

### Pages KHÔNG CẦN rotate (đã xong)
- ❌ Login pages (đã login xong, chỉ giữ để reuse)
- ❌ Add bank pages (đã add bank xong)
- ❌ Register pages (đã close sau login)

## Lưu ý

### `runAddBankInContext()` không cần complete
Method này **reuse** existing login page, không tạo page mới, nên:
- Không register vào rotator
- Không cần complete
- Page đã được complete khi login xong

### Error handling
Tất cả các `tabRotator.complete()` đều được wrap trong try-catch để tránh crash nếu rotator không available.

## Testing

Để test cải thiện:
1. Chạy auto sequence với nhiều sites (3-5 sites)
2. Quan sát log rotation:
   - Số tabs remaining phải giảm dần
   - Không rotate lại pages đã xong
   - Stop rotation khi tất cả xong

3. Kiểm tra performance:
   - Thời gian xử lý nhanh hơn
   - CPU usage thấp hơn
   - Ít context switching hơn
