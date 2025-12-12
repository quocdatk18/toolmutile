# Fix CheckPromo Chạy Song Song Theo Site

## 🚨 Vấn đề trước đây
- CheckPromo chỉ chạy sau khi TẤT CẢ sites hoàn thành addBank
- Phải đợi PHASE 2 mới check khuyến mãi
- Không tận dụng được tính song song của automation

## ✅ Giải pháp mới

### 1. CheckPromo chạy ngay trong từng site
```javascript
// Trong runSequenceForSite():
// STEP 6: Check Promotion - chạy ngay sau addBank
const shouldRunCheckPromo = profileData.checkPromo; // Đơn giản hóa điều kiện

if (shouldRunCheckPromo) {
    // Cảnh báo nếu bank chưa verify nhưng vẫn chạy
    if (!results.addBank?.success || !results.addBank?.verified) {
        console.log(`⚠️ WARNING: Running checkPromo without verified bank info`);
    }
    
    // Chạy checkPromo ngay lập tức
    const promoResult = await this.automation.runCheckPromotionFull(...);
}
```

### 2. Loại bỏ PHASE 2 (batch processing)
```javascript
// Trước: Đợi tất cả sites xong rồi mới check promo
// PHASE 2: Chạy checkPromo cho tất cả sites cùng lúc

// Sau: CheckPromo đã chạy song song trong từng site
console.log(`✅ All sites completed with individual checkPromo processing`);
```

### 3. Cải thiện điều kiện checkPromo
**Trước:**
```javascript
const shouldRunCheckPromo = profileData.checkPromo &&
    results.addBank?.success &&      // Phải thành công
    results.addBank?.verified;       // Phải được verify
```

**Sau:**
```javascript
const shouldRunCheckPromo = profileData.checkPromo; // Chỉ cần enable
// Vẫn chạy dù bank chưa add được - user có thể muốn check KM
```

## 🚀 Kết quả mong đợi

### Flow mới (Song song thực sự):
```
Site 1: Register → Login → AddBank → CheckPromo ✅
Site 2: Register → Login → AddBank → CheckPromo ✅  
Site 3: Register → Login → AddBank → CheckPromo ✅
...
Tất cả chạy đồng thời, không đợi nhau
```

### Thay vì flow cũ:
```
PHASE 1: Tất cả sites (Register → Login → AddBank)
         ↓ (đợi tất cả xong)
PHASE 2: Tất cả sites (CheckPromo)
```

## 📊 Lợi ích
1. **Tốc độ nhanh hơn**: CheckPromo không phải đợi tất cả sites
2. **Tận dụng song song**: Mỗi site độc lập hoàn toàn
3. **Linh hoạt hơn**: CheckPromo chạy dù bank fail
4. **User experience tốt hơn**: Thấy kết quả sớm hơn

## 🧪 Test
Chạy lại automation để kiểm tra:
- CheckPromo có chạy ngay sau addBank không
- Có còn đợi PHASE 2 không
- Tốc độ có cải thiện không