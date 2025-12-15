# Cải Thiện Xử Lý Dropdown Ngân Hàng - v2

## Vấn Đề Chính
Script chạy quá sớm trước khi form render xong, dẫn đến không tìm được dropdown ngân hàng.

## Giải Pháp

### 1. **Chờ Form Render Xong**

Thay vì chạy ngay, script sẽ:
- Kiểm tra xem form đã render chưa (tìm dropdown, city input, account input)
- Chờ tối đa 20 giây (40 lần × 500ms)
- Chỉ khi tất cả 3 element visible mới bắt đầu điền

```javascript
// Kiểm tra 3 element chính
const bankDropdown = document.querySelector('mat-select, [role="combobox"], ...');
const cityInput = document.querySelector('input[formcontrolname="city"]');
const accountInput = document.querySelector('input[formcontrolname="account"]');

if (bankDropdown && bankDropdown.offsetParent !== null && cityInput && accountInput) {
    // Form đã render, bắt đầu điền
}
```

### 2. **Delay Dài Hơn Giữa Các Action**

- Click dropdown → chờ 1.2 giây (thay vì 0.6s)
- Tìm option → chờ 0.3 giây
- Click option → chờ 0.6 giây

Điều này cho phép Angular/React render dropdown menu đầy đủ.

### 3. **Click Tự Nhiên Hơn**

Hàm `clickElementNaturally` sử dụng:
- Scroll element vào view
- Focus element
- Dispatch mousedown/mouseup/click events
- Native click as fallback

### 4. **Logging Chi Tiết**

Mỗi bước đều có log để dễ debug:
```
[reg-acc] ✅ On Financial withdraw page
[reg-acc] Waiting for form to render...
[reg-acc] Waiting... (5/40)
[reg-acc] ✅ Form rendered! (attempt 8)
[reg-acc] Starting fillBankInfoForm...
[reg-acc] Step 1: Selecting bank...
[reg-acc] ✅ Found dropdown
[reg-acc] Clicking dropdown...
[reg-acc] Options found: 5
[reg-acc] ✅ Found option: VIETCOMBANK
[reg-acc] ✅ DONE
```

## Quy Trình Hoạt Động

1. **Script Load** → Kiểm tra URL
2. **Chờ Form Render** → Tìm 3 element chính (20 giây)
3. **Lấy Data** → Từ chrome.storage.local
4. **Điền Form**:
   - Chọn ngân hàng (click dropdown → chọn option)
   - Điền chi nhánh
   - Điền số tài khoản
   - Click submit

## Debug

Mở DevTools (F12) → Console tab → Tìm log `[reg-acc]`

Nếu thấy:
- `Form did not render after 20 seconds` → Form chưa load xong
- `Could not select bank` → Dropdown không tìm được
- `✅ DONE` → Thành công

## Cải Thiện So Với Phiên Bản Cũ

| Vấn Đề | Cũ | Mới |
|--------|-----|-----|
| Delay trước khi điền | 500ms | Chờ form render (tối đa 20s) |
| Delay sau click dropdown | 600ms | 1200ms |
| Delay sau click option | 500ms | 600ms |
| Kiểm tra form render | Không | Có (3 element) |
| Logging | Ít | Chi tiết |
| Fallback methods | 4 cách | 1 cách (nhưng đủ) |
