# Fix CheckPromo Dùng Chung 1 Cửa Sổ + Tự Quản Lý Tab

## 🚨 Vấn đề trước đây
- Mỗi site checkPromo tạo riêng 1 browser context → tốn tài nguyên
- Logic đóng context có thể conflict với tự đóng tab của checkPromo
- Không tối ưu khi có nhiều sites

## ✅ Giải pháp mới

### 1. Shared Browser Context cho tất cả CheckPromo
```javascript
// Tạo 1 context duy nhất cho tất cả sites
let sharedPromoContext = await this.createPromoContext(browser, 'AllSites');

// Tất cả sites dùng chung context này
const promoResult = await this.automation.runCheckPromotionFull(
    sharedPromoContext, // Shared cho tất cả
    null,
    promoUrl,
    loginUrl,
    username,
    apiKey
);
```

### 2. Không đóng Context - Để CheckPromo tự quản lý
```javascript
// Trước: Đóng context sau khi xong
finally {
    if (promoContext) {
        await promoContext.close(); // ❌ Có thể conflict
    }
}

// Sau: Không đóng - để tự quản lý
finally {
    // Không đóng context - checkPromo tự quản lý tab
    console.log(`📋 Context kept open (tabs self-manage)`);
}
```

### 3. Áp dụng cho cả 2 trường hợp

#### A. CheckPromo trong automation chính (runSequenceForSite)
- Mỗi site vẫn tạo context riêng (để tách biệt với register/addBank)
- Nhưng không đóng context - để checkPromo tự đóng tab

#### B. CheckPromo standalone (runCheckPromoOnly)  
- Tất cả sites dùng chung 1 context
- Không đóng context - để từng tab tự quản lý

## 🚀 Lợi ích

### 1. Tiết kiệm tài nguyên
- ✅ 1 browser window thay vì N windows (N = số sites)
- ✅ Ít memory và CPU hơn
- ✅ Dễ quản lý hơn

### 2. Tương thích với logic hiện có
- ✅ CheckPromo vẫn tự đóng tab sau chụp ảnh
- ✅ Không conflict với logic tự quản lý
- ✅ Context tự cleanup khi browser đóng

### 3. Linh hoạt hơn
- ✅ Có thể xem tất cả checkPromo trong 1 cửa sổ
- ✅ Dễ debug và monitor
- ✅ User experience tốt hơn

## 📊 Flow mới

### CheckPromo Standalone:
```
Tạo 1 shared context
├── Site 1: Mở tab → CheckPromo → Tự đóng tab ✅
├── Site 2: Mở tab → CheckPromo → Tự đóng tab ✅  
├── Site 3: Mở tab → CheckPromo → Tự đóng tab ✅
└── Context được giữ lại (không đóng)
```

### CheckPromo trong Automation:
```
Site 1: Register/AddBank (Browser chính) + CheckPromo (Context riêng - không đóng)
Site 2: Register/AddBank (Browser chính) + CheckPromo (Context riêng - không đóng)
...
```

## 🧪 Test
- CheckPromo có mở trong cùng 1 cửa sổ không (standalone mode)
- Tab có tự đóng sau chụp ảnh không
- Có conflict gì với logic hiện tại không