# Fix CheckPromo Automation - Dùng Chung 1 Cửa Sổ

## 🚨 Vấn đề
**Automation hiện tại:** Mỗi site checkm mở riêng 1 context → Nhiều cửa sổ checkm
**CheckM lẻ:** Tất cả sites checkm cùng chung 1 cửa sổ riêng ✅

→ **Không nhất quán** giữa automation và CheckM lẻ

## ✅ Giải pháp

### 1. Thêm Shared Promo Context vào Automation
```javascript
// Trong runSequence() - tạo shared context cho tất cả sites
let sharedPromoContext = null;
if (profileData.checkPromo) {
    sharedPromoContext = await this.createPromoContext(browser, 'AllSites-Auto');
    console.log(`✅ Shared checkPromo window created for automation`);
}
```

### 2. Truyền Shared Context xuống từng Site
```javascript
// Trước: Mỗi site tự tạo context riêng
return this.runSequenceForSite(browser, site, profileData)

// Sau: Truyền shared context xuống
return this.runSequenceForSite(browser, site, profileData, sharedPromoContext)
```

### 3. Sửa runSequenceForSite để nhận Shared Context
```javascript
// Signature mới
async runSequenceForSite(browser, site, profileData, sharedPromoContext = null)

// Logic checkPromo
let promoContext = sharedPromoContext; // Dùng shared nếu có
if (!promoContext) {
    promoContext = await this.createPromoContext(browser, siteName); // Fallback
}
```

### 4. Áp dụng cho tất cả Execution Modes
- ✅ **Parallel (all sites)**: `Promise.all()` với shared context
- ✅ **Parallel (sliding window)**: Sliding window với shared context  
- ✅ **Sequential**: Tuần tự với shared context

## 📊 So sánh Before/After

### Before (Automation):
```
Site 1: Register/AddBank + CheckPromo (Context riêng 1) 🪟
Site 2: Register/AddBank + CheckPromo (Context riêng 2) 🪟  
Site 3: Register/AddBank + CheckPromo (Context riêng 3) 🪟
→ 3 cửa sổ checkPromo riêng biệt
```

### After (Automation):
```
Shared CheckPromo Context: 🪟 (1 cửa sổ duy nhất)
├── Site 1: Register/AddBank → CheckPromo (Tab trong shared window)
├── Site 2: Register/AddBank → CheckPromo (Tab trong shared window)  
└── Site 3: Register/AddBank → CheckPromo (Tab trong shared window)
→ 1 cửa sổ checkPromo chung (giống CheckM lẻ)
```

### CheckM Lẻ (không đổi):
```
Shared CheckPromo Context: 🪟 (1 cửa sổ duy nhất)
├── Site 1: CheckPromo (Tab trong shared window)
├── Site 2: CheckPromo (Tab trong shared window)
└── Site 3: CheckPromo (Tab trong shared window)
→ 1 cửa sổ checkPromo chung ✅
```

## 🚀 Kết quả mong đợi

**Automation bây giờ sẽ:**
1. ✅ Tạo 1 cửa sổ checkPromo chung cho tất cả sites
2. ✅ Mỗi site checkPromo mở tab trong cửa sổ chung này
3. ✅ Nhất quán với CheckM lẻ
4. ✅ Tiết kiệm tài nguyên (1 context thay vì N contexts)
5. ✅ Dễ quản lý và monitor

## 🔧 Files Modified
- `tools/nohu-tool/auto-sequence-safe.js` - Thêm shared promo context logic

## 🧪 Test
Chạy automation và kiểm tra:
- CheckPromo có mở trong cùng 1 cửa sổ không?
- Có bao nhiêu cửa sổ checkPromo được tạo? (Mong đợi: 1)
- Logic có hoạt động giống CheckM lẻ không?