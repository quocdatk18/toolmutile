# Fix CheckPromo Mở Riêng Browser Window

## 🚨 Vấn đề trước đây
- CheckPromo chạy trong cùng browser/tab với đăng ký và add bank
- Có thể gây conflict hoặc ảnh hưởng đến nhau
- Không tách biệt được các thao tác

## ✅ Giải pháp mới

### 1. Tạo Browser Context riêng cho CheckPromo
```javascript
// Method mới: createPromoContext()
async createPromoContext(browser, siteName) {
    const context = await browser.createBrowserContext({
        ignoreHTTPSErrors: true,
        bypassCSP: true
    });
    
    // Set user agent giống main browser
    // Tối ưu cho checkPromo
    return context;
}
```

### 2. CheckPromo chạy trong Context riêng
```javascript
// Trước: Dùng chung browser
const checkResult = await this.automation.runCheckPromotionFull(
    browser, // Chung với đăng ký/add bank
    null,
    promoUrl,
    loginUrl,
    username,
    apiKey
);

// Sau: Tạo context riêng
let promoContext = null;
try {
    promoContext = await this.createPromoContext(browser, siteName);
    
    const checkResult = await this.automation.runCheckPromotionFull(
        promoContext, // Context riêng biệt
        null,
        promoUrl,
        loginUrl,
        username,
        apiKey
    );
} finally {
    // Tự động đóng context sau khi xong
    if (promoContext) {
        await promoContext.close();
    }
}
```

### 3. Tự động cleanup Context
- Context được tạo mới cho mỗi checkPromo
- Tự động đóng sau khi hoàn thành
- Không ảnh hưởng đến browser chính

## 🚀 Lợi ích

### 1. Tách biệt hoàn toàn
- ✅ Đăng ký/Add bank: Browser chính
- ✅ CheckPromo: Browser context riêng
- ❌ Không còn conflict giữa các thao tác

### 2. An toàn hơn
- CheckPromo không ảnh hưởng đến session đăng ký
- Nếu checkPromo lỗi, không làm crash browser chính
- Có thể debug riêng biệt

### 3. Hiệu suất tốt hơn
- Context riêng được tối ưu cho checkPromo
- Không cần lưu cache, cookie không cần thiết
- Tự động cleanup memory

### 4. Linh hoạt hơn
- Có thể chạy nhiều checkPromo đồng thời
- Mỗi site có context riêng
- Không bị giới hạn bởi browser chính

## 📊 Flow mới

```
Site 1: Register/AddBank (Browser chính) + CheckPromo (Context riêng) ✅
Site 2: Register/AddBank (Browser chính) + CheckPromo (Context riêng) ✅  
Site 3: Register/AddBank (Browser chính) + CheckPromo (Context riêng) ✅
...

Mỗi site hoàn toàn độc lập, không ảnh hưởng nhau
```

## 🧪 Test
Chạy lại automation để kiểm tra:
- CheckPromo có mở trong cửa sổ riêng không
- Browser chính có bị ảnh hưởng không
- Context có được đóng đúng cách không