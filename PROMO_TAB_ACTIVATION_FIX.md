# Fix Promo Tab Activation - Tránh Throttle cho Shared CheckM Context

## 🚨 Vấn đề
Shared promo context (cửa sổ CheckM chung) **không có logic active rotation** → Có thể bị throttle khi có nhiều tabs CheckM.

**Browser chính:** ✅ Có tab rotation (tránh throttle)
**Shared promo context:** ❌ Không có tab rotation → Risk throttle

## ✅ Giải pháp

### 1. Thêm Separate Promo Tab Rotation
```javascript
// Thêm tracking riêng cho promo tabs
this.promoTabs = new Map();
this.promoActivationInterval = null;
```

### 2. Start Promo Rotation khi tạo Shared Context
```javascript
// Khi tạo shared promo context
sharedPromoContext = await this.createPromoContext(browser, 'AllSites-Auto');

// Start rotation ngay lập tức
this.startPromoTabActivation(sharedPromoContext);
```

### 3. Promo Tab Rotation Logic
```javascript
startPromoTabActivation(sharedPromoContext) {
    this.promoActivationInterval = setInterval(async () => {
        // Get all pages in promo context
        const promoPages = await sharedPromoContext.pages();
        const activePromoPages = promoPages.filter(page => !page.isClosed());
        
        // Auto-stop nếu không còn tabs
        if (activePromoPages.length === 0) {
            this.stopPromoTabActivation();
            return;
        }
        
        // Rotate through all promo tabs
        for (const page of activePromoPages) {
            await page.bringToFront();
            await delay(200);
        }
    }, 3000); // Every 3 seconds
}
```

### 4. Auto Cleanup
- ✅ **Auto-stop** khi không còn promo tabs
- ✅ **Manual stop** khi automation hoàn thành
- ✅ **Error handling** khi context bị destroy

## 📊 Flow hoạt động

### 🪟 Browser chính (Đăng ký/Add Bank):
```
Tab Rotation: Site1 → Site2 → Site3 → Site1... (Every 3s)
✅ Tránh throttle cho register/addBank
```

### 🪟 Shared Promo Context (CheckM):
```
Promo Tab Rotation: CheckM1 → CheckM2 → CheckM3 → CheckM1... (Every 3s)  
✅ Tránh throttle cho checkPromo
```

### Timeline:
```
T0: Tạo shared promo context + Start promo rotation
T1: Site1 hoàn thành → Mở CheckM1 tab (được rotate)
T2: Site2 hoàn thành → Mở CheckM2 tab (được rotate)  
T3: Site3 hoàn thành → Mở CheckM3 tab (được rotate)
T4: Automation hoàn thành → Stop promo rotation
```

## 🚀 Lợi ích

### 1. Tránh Throttle hoàn toàn
- ✅ Browser chính: Tab rotation cho register/addBank
- ✅ Promo context: Tab rotation cho checkPromo
- ✅ Không có tab nào bị "idle" quá lâu

### 2. Performance tối ưu
- ✅ Mỗi context có rotation riêng biệt
- ✅ Không conflict giữa 2 rotations
- ✅ Auto-cleanup khi không cần thiết

### 3. Reliability cao
- ✅ Error handling cho context destroy
- ✅ Auto-stop khi tabs đóng
- ✅ Manual cleanup khi automation xong

## 🔧 Files Modified
- `tools/nohu-tool/auto-sequence-safe.js` - Thêm promo tab rotation logic

## 🧪 Test Expected
- Shared promo context có rotate tabs không?
- CheckM tabs có bị throttle không?
- Rotation có tự động stop khi xong không?