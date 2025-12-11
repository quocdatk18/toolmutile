# Gộp Đăng Ký + Đăng Nhập Trên Cùng 1 Page

## Vấn đề trước đây
- Tool đăng ký ở link ref → tạo page mới
- Sau đó đăng nhập ở link app → tạo page mới khác
- Phải quản lý 2 pages riêng biệt

## Giải pháp mới
Sau khi đăng ký thành công → tự động chuyển sang link app và đăng nhập luôn trên **cùng 1 page**

## Thay đổi chính

### 1. Fill Form - Set Value Trực Tiếp
**File:** `tools/nohu-tool/extension/content.js`

- ✅ Loại bỏ hoàn toàn việc gõ từng ký tự (character by character)
- ✅ Set value trực tiếp cho tất cả input (fast mode + normal mode)
- ✅ Giảm delay từ 30-60ms/ký tự → chỉ 50ms tổng
- ✅ Tốc độ nhanh hơn **rất nhiều** (đặc biệt với password dài)

```javascript
// Trước: Gõ từng ký tự
for (let i = 0; i < characters.length; i++) {
  const typingDelay = 30 + Math.random() * 30;
  await new Promise(resolve => setTimeout(resolve, typingDelay));
  // ... gõ từng ký tự
}

// Sau: Set value trực tiếp
if (nativeInputValueSetter) {
  nativeInputValueSetter.call(input, value.toString());
} else {
  input.value = value.toString();
}
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
input.dispatchEvent(new Event('blur', { bubbles: true }));
```

### 2. Gộp Register + Login
**File:** `tools/nohu-tool/complete-automation.js`

Thêm tham số `loginUrl` vào `runRegistration()`:

```javascript
async runRegistration(browser, url, profileData, loginUrl = null)
```

**Flow mới:**
1. Đăng ký ở link ref
2. ✅ Nếu thành công → tự động navigate sang `loginUrl`
3. Re-inject scripts
4. Tự động đăng nhập
5. Trả về kết quả gộp: `{ register, autoLogin }`

### 3. Sử dụng Cùng 1 Page
**File:** `tools/nohu-tool/auto-sequence.js`

**Trước:**
```javascript
// STEP 1: Register
const registerResult = await runRegistration(browser, registerUrl, profileData);

// STEP 2: Login (tạo page mới)
const loginResult = await runLogin(sharedLoginContext, loginUrl, profileData);

// STEP 3: Add Bank (dùng login page)
const bankResult = await runAddBankInContext(sharedLoginContext, loginUrl, bankInfo);
```

**Sau:**
```javascript
// STEP 1: Register + Auto-Login (cùng 1 page)
const registerResult = await runRegistration(
  browser, 
  registerUrl, 
  profileData,
  loginUrl // Truyền loginUrl để auto-login
);

// Kết quả gộp
results.register = registerResult;
results.login = registerResult.autoLogin; // Login result nằm trong register result

// STEP 2: Add Bank (dùng registerPage - đã login)
const bankResult = await registerPage.evaluate(...); // Dùng page đã login
```

### 4. Loại bỏ Shared Login Context
- ❌ Xóa `sharedLoginContext` (không cần nữa)
- ✅ Dùng `registerPage` cho tất cả: register → login → add bank
- ✅ Chỉ tạo 1 page duy nhất cho mỗi site

## Lợi ích

### 1. Tốc độ
- ⚡ Fill form nhanh hơn **10-20 lần** (set value thay vì gõ từng ký tự)
- ⚡ Không cần tạo page mới cho login
- ⚡ Giảm thời gian chờ đợi giữa các bước

### 2. Đơn giản
- 📦 Chỉ 1 page thay vì 2 pages
- 📦 Không cần quản lý shared context
- 📦 Code gọn gàng hơn

### 3. Giống Extension
- ✅ Trang web vẫn nhận đúng là đăng ký bằng link ref
- ✅ Sau đó tự động chuyển sang link app để đăng nhập
- ✅ Giống hệt cách extension hoạt động

## Cách sử dụng

Không cần thay đổi gì! Tool tự động:

1. Đăng ký ở link ref
2. Chuyển sang link app
3. Đăng nhập
4. Thêm ngân hàng (nếu có)
5. Check promo (nếu bật)

Tất cả trên **cùng 1 page** ✨

## Files đã sửa

1. ✅ `tools/nohu-tool/extension/content.js` - Fill form nhanh hơn
2. ✅ `tools/nohu-tool/complete-automation.js` - Gộp register + login
3. ✅ `tools/nohu-tool/auto-sequence.js` - Dùng 1 page duy nhất

## Test

Chạy tool như bình thường:
```bash
START_DASHBOARD.bat
```

Chọn profile → Chọn sites → Start

Tool sẽ tự động:
- Đăng ký ở link ref ✅
- Chuyển sang link app ✅
- Đăng nhập ✅
- Thêm bank ✅
- Check promo ✅

Tất cả trên cùng 1 tab! 🎉
