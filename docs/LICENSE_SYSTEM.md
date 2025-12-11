# 🔐 Hệ Thống License Key

Hướng dẫn sử dụng hệ thống license key để kinh doanh tool.

## 📋 Tổng Quan

Hệ thống license key cho phép bạn:
- ✅ Kiểm soát ai được sử dụng tool
- ✅ Tạo key theo thời gian (30 ngày, 90 ngày, lifetime)
- ✅ Bind key với machine cụ thể (không thể copy)
- ✅ Thu hồi key khi cần
- ✅ Track thông tin khách hàng

## 🔑 Tạo License Key

### 1. Key thường (30 ngày)
```bash
node tools/generate-license.js --days 30 --username "customer1"
```

### 2. Key lifetime
```bash
node tools/generate-license.js --lifetime --username "customer2"
```

### 3. Key bind với machine (không thể copy)
```bash
node tools/generate-license.js --days 90 --bind --username "customer3"
```

### 4. Key cho machine cụ thể
```bash
node tools/generate-license.js --days 30 --machine-id "abc123..." --username "customer4"
```

## 📤 Gửi Key Cho Khách Hàng

Sau khi tạo key, bạn sẽ nhận được:
```
🔐 LICENSE KEY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
eyJ1c2VybmFtZSI6ImN1c3RvbWVyMSIsIm1hY2hpbmVJZCI6bnVsbCwiZXhwaXJ5IjoxNzM...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Gửi key này cho khách hàng** qua:
- Email
- Telegram
- Zalo
- v.v.

## 🎯 Khách Hàng Kích Hoạt

### Cách 1: Qua Dashboard (Dễ nhất)
1. Mở tool: `npm run dashboard`
2. Click nút **🔐 License** ở góc phải
3. Paste license key
4. Click **Activate License**

### Cách 2: Qua Command Line
```bash
node tools/activate-license.js YOUR_LICENSE_KEY_HERE
```

## 📊 Kiểm Tra License

### Xem thông tin license hiện tại
```javascript
const LicenseManager = require('./core/license-manager');
const licenseManager = new LicenseManager();

const info = licenseManager.getLicenseInfo();
console.log(info);
// {
//   username: 'customer1',
//   machineId: 'abc123...',
//   created: '09/12/2024',
//   expiry: '08/01/2025',
//   remainingDays: 30,
//   isLifetime: false
// }
```

## 🔒 Bảo Mật

### Secret Key
File `core/license-manager.js` có secret key:
```javascript
this.secretKey = 'HIDEMIUM_TOOL_SECRET_2024';
```

**⚠️ QUAN TRỌNG:**
- Thay đổi secret key này thành chuỗi ngẫu nhiên của bạn
- KHÔNG share secret key cho ai
- Nếu secret key bị lộ, tất cả key đều có thể bị fake

### Machine Binding
Key có thể bind với machine ID:
- Machine ID = Hash của (MAC addresses + hostname)
- Mỗi máy có machine ID khác nhau
- Key bind không thể dùng trên máy khác

## 💰 Các Gói License Đề Xuất

### Gói 1: Trial (7 ngày)
```bash
node tools/generate-license.js --days 7 --username "trial_user"
```
**Giá:** Miễn phí (để khách test)

### Gói 2: Monthly (30 ngày)
```bash
node tools/generate-license.js --days 30 --username "monthly_user"
```
**Giá:** 500k VNĐ/tháng

### Gói 3: Quarterly (90 ngày)
```bash
node tools/generate-license.js --days 90 --username "quarterly_user"
```
**Giá:** 1.2M VNĐ/3 tháng (giảm 20%)

### Gói 4: Lifetime
```bash
node tools/generate-license.js --lifetime --username "lifetime_user"
```
**Giá:** 3M VNĐ (một lần)

### Gói 5: Enterprise (bind machine)
```bash
node tools/generate-license.js --lifetime --bind --username "enterprise_user"
```
**Giá:** 5M VNĐ (bind 1 máy, không thể copy)

## 📝 Quản Lý Khách Hàng

Mỗi khi tạo key, file record được lưu tại:
```
license-records/license-customer1-2024-12-09T10-30-00-000Z.txt
```

File này chứa:
- Thông tin khách hàng
- License key
- Ngày tạo, ngày hết hạn
- Machine ID (nếu có)

**Lưu ý:** Backup folder `license-records/` thường xuyên!

## 🔄 Thu Hồi License

Nếu khách hàng vi phạm, bạn có thể:

### Cách 1: Không tạo key mới
- Key hết hạn tự động không dùng được

### Cách 2: Thay đổi Secret Key
- Thay secret key trong `core/license-manager.js`
- Tất cả key cũ sẽ invalid
- Tạo key mới cho khách hàng hợp lệ

### Cách 3: Nâng cấp lên Server-based (tương lai)
- Kiểm tra key qua API server
- Có thể blacklist key cụ thể
- Kiểm soát tốt hơn

## 🚀 Nâng Cấp Lên Server-Based

Hiện tại: **Offline license** (không cần server)

Nếu muốn kiểm soát tốt hơn, có thể nâng cấp lên **Online license**:
- Kiểm tra key qua API server của bạn
- Có thể thu hồi key bất cứ lúc nào
- Track usage (số lần chạy, thời gian sử dụng)
- Chống crack tốt hơn

## ❓ FAQ

### Q: Khách hàng có thể share key không?
**A:** 
- Key thường: Có thể share (nhưng chỉ 1 người dùng được)
- Key bind machine: KHÔNG thể share (chỉ chạy trên 1 máy)

### Q: Key hết hạn thì sao?
**A:** Tool sẽ không chạy được, yêu cầu activate key mới.

### Q: Làm sao biết khách hàng đang dùng?
**A:** Hiện tại không track được. Nếu cần, phải nâng cấp lên server-based.

### Q: Khách hàng mất key thì sao?
**A:** Bạn có thể tạo key mới cho họ (cùng username, cùng thời hạn).

### Q: Có thể tạo key không giới hạn số máy?
**A:** Có, không dùng `--bind` hoặc `--machine-id`.

## 📞 Support

Nếu có vấn đề với license system, check:
1. File `.license` có tồn tại không?
2. Secret key có đúng không?
3. Machine ID có match không? (nếu bind)
4. Key đã hết hạn chưa?

## 🎓 Best Practices

1. **Backup license-records/** thường xuyên
2. **Thay đổi secret key** trước khi bán
3. **Dùng key bind** cho khách hàng quan trọng
4. **Tạo trial key** để khách test trước
5. **Ghi chú thông tin khách hàng** trong username
6. **Không share secret key** cho ai
7. **Kiểm tra key** trước khi gửi khách

## 📈 Tương Lai

Có thể mở rộng:
- [ ] Web portal để khách tự activate
- [ ] API server để kiểm tra key online
- [ ] Dashboard quản lý khách hàng
- [ ] Auto-renewal (gia hạn tự động)
- [ ] Payment integration (VNPay, Momo)
- [ ] Usage analytics
- [ ] Multi-tier pricing
