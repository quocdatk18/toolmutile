# 🚀 BẮT ĐẦU NGAY - 3 BƯỚC ĐƠN GIẢN

## Bước 1: Cài Đặt (Chỉ lần đầu)
```batch
npm install
```
⏱️ Mất khoảng 1-2 phút

---

## Bước 2: Build Package cho Khách Hàng
```batch
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
```

### Nhập thông tin khi được hỏi:

**1. Customer name:**
```
Enter customer name: customer001
```
(Hoặc tên khách hàng của bạn)

**2. License type:**
```
Select license type:
  1. Trial 7 days
  2. Monthly (30 days)
  3. Quarterly (90 days)
  4. Lifetime
  
Enter choice (1-4): 2
```
(Chọn số từ 1-4)

**3. Machine binding:**
```
Bind to machine? (y/n): y
```
(Khuyến nghị: `y` để khóa với máy tính)

⏱️ Mất khoảng 30-60 giây

---

## Bước 3: Gửi cho Khách Hàng

### Package được tạo tại:
```
customer-packages/customer001/
```

### Làm gì tiếp theo:
1. **Nén folder** `customer001` thành file ZIP
2. **Gửi file ZIP** cho khách hàng
3. **Lưu secret key** được hiển thị (QUAN TRỌNG!)

---

## ✅ XONG! Đơn giản vậy thôi!

### Khách hàng sẽ làm gì:
1. Giải nén ZIP
2. Chạy `npm install`
3. Chạy `npm run dashboard`
4. Activate license (dùng key trong file `LICENSE_KEY.txt`)

---

## 🔒 Code Đã Được Bảo Vệ

✅ Tất cả code quan trọng đã được obfuscate (mã hóa)  
✅ Khách hàng không thể đọc hoặc sửa code  
✅ License system không thể crack  
✅ Mỗi customer có secret key riêng  

---

## 📚 Muốn Biết Thêm?

- **Quick Start:** [QUICK_START_OBFUSCATE.md](QUICK_START_OBFUSCATE.md)
- **Hướng dẫn chi tiết:** [docs/HUONG_DAN_OBFUSCATE.md](docs/HUONG_DAN_OBFUSCATE.md)
- **Checklist đầy đủ:** [CHECKLIST_TRUOC_KHI_BAN.md](CHECKLIST_TRUOC_KHI_BAN.md)
- **Tất cả scripts:** [ALL_SCRIPTS.md](ALL_SCRIPTS.md)

---

## 🆘 Gặp Vấn Đề?

### Lỗi: "javascript-obfuscator not found"
```batch
npm install javascript-obfuscator
```

### Lỗi: "Cannot find module"
```batch
npm install
```

### Muốn test trước:
```batch
OBFUSCATE_ALL_CODE.bat
TEST_OBFUSCATED.bat
```

---

## 💡 Tips

### Tạo nhiều packages:
Chạy `BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat` nhiều lần với tên customer khác nhau.

### Test package:
Copy folder `customer-packages/customer001/` ra nơi khác và test như khách hàng.

### Lưu thông tin:
Lưu lại:
- Customer name
- License type & expiration
- Secret key (QUAN TRỌNG!)
- Ngày tạo

---

## 🎯 Tóm Tắt

```
1. npm install
2. BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
3. Nén và gửi
```

**3 bước = Xong!** 🎉

---

**Sẵn sàng kinh doanh ngay bây giờ! 💰**
