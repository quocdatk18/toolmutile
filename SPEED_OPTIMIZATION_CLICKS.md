# Tối Ưu Tốc Độ Click Các Nút Xác Thực và Audio

## Vấn Đề
- Các nút xác thực và audio đang bị delay vì code chờ timeout cố định thay vì click ngay khi tìm thấy
- Delay không cần thiết: 800ms, 1000ms, 2000ms giữa các bước
- Chờ hết timeout khi chưa tìm thấy thay vì check liên tục

## Giải Pháp Đã Áp Dụng

### 1. Click Ngay Khi Tìm Thấy
**Trước:**
```javascript
setTimeout(async () => {
  // Click after 800ms delay
  await clickElementNaturally(element);
}, 800);
```

**Sau:**
```javascript
// Click immediately with minimal delay (just for scroll)
await new Promise(resolve => setTimeout(resolve, 200));
await clickElementNaturally(element);
```

### 2. Check Liên Tục Thay Vì Chờ Timeout
**Trước:**
```javascript
setTimeout(() => {
  performTaiappSearch();
}, 1000); // Fixed 1 second delay
```

**Sau:**
```javascript
// Check continuously for popup
let attempts = 0;
while (attempts < maxAttempts) {
  const hasPopup = document.querySelectorAll('.modal').length > 0;
  if (hasPopup) break;
  await new Promise(resolve => setTimeout(resolve, 500));
  attempts++;
}
performTaiappSearch();
```

### 3. Tăng Số Lần Check Audio
**Trước:**
```javascript
const maxAttempts = 10; // Check 10 times over 5 seconds
setTimeout(checkForAudio, 1000); // Start after 1 second
```

**Sau:**
```javascript
const maxAttempts = 20; // Check 20 times over 10 seconds
checkForAudio(); // Start immediately
```

## Các Hàm Đã Tối Ưu

### 1. `clickVerifyButton()`
- Giảm delay từ 800ms → 200ms
- Giảm delay giữa verify và audio từ 2000ms → 300ms
- **Tổng tiết kiệm: ~2.3 giây**

### 2. `clickCreateAudioButton()`
- Giảm delay từ 800ms → 200ms
- Bắt đầu check audio ngay lập tức thay vì sau 1 giây
- Tăng số lần check từ 10 → 20 lần
- **Tổng tiết kiệm: ~1.6 giây**

### 3. `clickPromoButton()`
- Giảm delay từ 800ms → 200ms
- Giảm delay trước tìm TAIAPP từ 2000ms → 500ms
- **Tổng tiết kiệm: ~2.1 giây**

### 4. `clickTaiappPromo()`
- Giảm delay từ 800ms → 200ms
- Giảm delay trước verify từ 2000ms → 300ms
- **Tổng tiết kiệm: ~2.3 giây**

### 5. `findAndSelectTaiappPromo()`
- Check liên tục thay vì chờ 1 giây cố định
- Check tab content load liên tục thay vì chờ 1 giây
- **Tổng tiết kiệm: ~1-2 giây**

## Tổng Kết

### Thời Gian Tiết Kiệm
- **Tổng delay giảm: ~8-10 giây** cho mỗi workflow đầy đủ
- Click ngay khi tìm thấy thay vì chờ timeout
- Check liên tục thay vì delay cố định

### Cải Thiện
- ✅ Click nút xác thực ngay khi tìm thấy (200ms thay vì 800ms)
- ✅ Click audio button ngay sau verify (300ms thay vì 2000ms)
- ✅ Bắt đầu check audio ngay lập tức (0ms thay vì 1000ms)
- ✅ Check liên tục cho popup/tab content thay vì delay cố định
- ✅ Tăng số lần check audio để đảm bảo không bỏ lỡ

### Lưu Ý
- Vẫn giữ delay tối thiểu 200ms cho scroll animation hoàn thành
- Vẫn check liên tục để đảm bảo không bỏ lỡ element
- Tăng timeout cho audio check để đảm bảo bắt được audio chậm load

## Fix Thêm: Điền Captcha Vào Đúng Input

### Vấn Đề
Sau khi solve audio captcha, tool điền vào ô tên tài khoản thay vì ô captcha input.

**Log lỗi:**
```
⚡ Setting value directly: Nhập tên người dùng → 321205  ❌ SAI - Điền vào username
⚡ Setting value directly: Nhập 6 số → 321205           ✅ ĐÚNG - Điền vào captcha
```

### Nguyên Nhân
Có 2 nơi điền captcha trong code:
1. **Workflow check promo (line 891):** Dùng selector đơn giản `document.querySelector('input[type="text"]')` → Chọn input text đầu tiên (username)
2. **solveAudioCaptchaAuto (line 3697):** Dùng logic tìm đúng với 6 methods → Chọn đúng captcha input

→ Lần đầu điền sai vào username, lần sau mới điền đúng vào captcha

### Giải Pháp
**Thống nhất logic tìm captcha input** ở cả 2 nơi với 6 phương pháp ưu tiên:

1. **Method 1:** Tìm theo ID/class cụ thể (`#audioCaptchaInput`, `.captcha-input`) - **HIGHEST PRIORITY**
2. **Method 2:** Tìm theo pattern chỉ nhập số (`pattern="[0-9]*"`, `inputmode="numeric"`) - **VERY SPECIFIC**
3. **Method 3:** Tìm theo placeholder text ("nhập 6 số", "xác thực", "captcha")
4. **Method 4:** Tìm theo name attribute (`name*="captcha"`, `name*="verify"`)
5. **Method 5:** Tìm input trong modal captcha
6. **Method 6:** Loại trừ các input phổ biến (username, password, email) và input có pattern cho phép chữ - **LAST RESORT**

### Code Cải Thiện

**Trước (SAI):**
```javascript
// Line 891 - Workflow check promo
const captchaInput = document.querySelector('input[type="text"]') ||  // ❌ Chọn input đầu tiên
  document.querySelector('input[placeholder*="xác thực"]') ||
  document.querySelector('input[placeholder*="captcha"]');
```

**Sau (ĐÚNG):**
```javascript
// Thống nhất logic tìm captcha input ở cả 2 nơi
let captchaInput = null;

// Method 1: By ID or class (most specific)
captchaInput = document.querySelector('input#audioCaptchaInput') ||
  document.querySelector('input.audio-captcha-input');

// Method 2: By pattern (numeric only)
if (!captchaInput) {
  const numericInputs = document.querySelectorAll('input[pattern*="0-9"], input[inputmode="numeric"]');
  for (const input of numericInputs) {
    const pattern = input.pattern || '';
    if (pattern.includes('[0-9]') && !pattern.includes('a-z') && !pattern.includes('A-Z')) {
      captchaInput = input;
      break;
    }
  }
}

// Method 3: By placeholder
if (!captchaInput) {
  const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
  for (const input of inputs) {
    const placeholder = (input.placeholder || '').toLowerCase();
    if (placeholder.includes('nhập 6 số') || placeholder.includes('captcha')) {
      captchaInput = input;
      break;
    }
  }
}
```

**Method 2: Tìm theo pattern chỉ nhập số**
```javascript
// Find input with numeric-only pattern (captcha is usually 6 digits)
const numericInputs = document.querySelectorAll('input[pattern*="0-9"], input[inputmode="numeric"]');
for (const input of numericInputs) {
  const pattern = input.pattern || '';
  // Check if it's numeric-only pattern (no letters allowed)
  if (pattern.includes('[0-9]') && !pattern.includes('a-z') && !pattern.includes('A-Z')) {
    captchaInput = input; // This is the captcha input!
    break;
  }
}
```

**Method 6: Loại trừ input có pattern cho phép chữ**
```javascript
// IMPORTANT: Skip if pattern allows letters (username field)
const allowsLetters = pattern.includes('a-z') || pattern.includes('A-Z');

// Skip username field by checking name/id/placeholder
const isUserField = name.includes('tai_khoan') || placeholder.includes('người dùng');

// Skip if it's a username field OR allows letters
if (allowsLetters || isUserField || isPasswordField || isEmailField) {
  continue; // Skip this input
}
```

### Log Debug
Thêm log chi tiết để debug:
```javascript
console.log('✅ Found captcha input by ID/class:', captchaInput.id);
console.log('   Pattern:', captchaInput.pattern);  // [0-9]* for captcha
console.log('   InputMode:', captchaInput.inputMode);  // numeric for captcha

console.log('📝 Filling captcha input with:', captchaText);
console.log('   Input details:', {
  id: captchaInput.id,
  name: captchaInput.name,
  placeholder: captchaInput.placeholder,
  className: captchaInput.className
});

console.log('⏭️  Skipping input (allows letters):', input.placeholder);
```

### Ví Dụ Thực Tế
**Input tên tài khoản (BỊ BỎ QUA):**
```html
<input type="text" name="ten_tai_khoan" id="ten_tai_khoan" 
       placeholder="Nhập tên người dùng" 
       pattern="^[a-zA-Z][a-zA-Z0-9_]{1,14}$">
```
- Pattern có `a-zA-Z` → Cho phép chữ → **BỊ BỎ QUA**

**Input captcha (ĐƯỢC CHỌN):**
```html
<input type="text" id="audioCaptchaInput" 
       class="audio-captcha-input" 
       placeholder="Nhập 6 số" 
       pattern="[0-9]*" 
       inputmode="numeric">
```
- ID = `audioCaptchaInput` → **ĐƯỢC CHỌN Ở METHOD 1**
- Pattern = `[0-9]*` (chỉ số) → **ĐƯỢC CHỌN Ở METHOD 2**
- InputMode = `numeric` → **ĐƯỢC CHỌN Ở METHOD 2**

## File Đã Sửa
- `tools/nohu-tool/extension/content.js`

## Fix Thêm: Click Nút "Nhận KM" Ngay Khi Enabled

### Vấn Đề
Sau khi click "Xác thực" captcha, tool đợi rất lâu (10 giây timeout) mới click "Nhận khuyến mãi", mặc dù nút đã enabled ngay lập tức.

### Nguyên Nhân
Code cũ:
1. Setup observer để watch verification response (chờ 10s timeout)
2. Click submit captcha
3. Chờ 500ms
4. Tìm và click button lần nữa

→ Nếu verification response không được detect, phải chờ hết 10s timeout

### Giải Pháp
**Click ngay khi button enabled** với 3 cơ chế song song:

1. **Check ngay lập tức:** Kiểm tra button đã enabled chưa, nếu có thì click ngay
2. **MutationObserver:** Watch attribute `disabled` thay đổi → click ngay khi enabled
3. **Polling 100ms:** Check mỗi 100ms để phát hiện nhanh hơn (không phụ thuộc vào mutation event)
4. **Timeout 5s:** Giảm từ 10s xuống 5s

### Code Cải Thiện

**Trước (CHẬM):**
```javascript
// Setup observer để watch verification response
const verificationPromise = new Promise((resolve) => {
  const checkInterval = setInterval(() => {
    // Check for success response
    if (successMsg) {
      // Setup observer để watch button enable
      const observer = new MutationObserver(() => {
        if (!btn.disabled) btn.click();
      });
      // Timeout after 10 seconds
      setTimeout(() => observer.disconnect(), 10000);
    }
  }, 100);
  setTimeout(() => resolve(), 10000); // ❌ Chờ 10s
});

await clickElementNaturally(submitBtn);

// Chờ 500ms rồi click lại
await new Promise(resolve => setTimeout(resolve, 500));
promoBtn.click();
```

**Sau (NHANH):**
```javascript
await clickElementNaturally(submitBtn);

// Find button
const promoBtn = document.getElementById('casinoSubmit');

const clickWhenEnabled = () => {
  if (!buttonClicked && !promoBtn.disabled) {
    buttonClicked = true;
    promoBtn.click(); // ✅ Click ngay
    return true;
  }
  return false;
};

// 1. Check immediately
if (clickWhenEnabled()) {
  console.log('✅ Clicked immediately');
} else {
  // 2. MutationObserver
  const observer = new MutationObserver(() => {
    if (clickWhenEnabled()) observer.disconnect();
  });
  observer.observe(promoBtn, { attributes: true, attributeFilter: ['disabled'] });
  
  // 3. Polling every 100ms
  const pollInterval = setInterval(() => {
    if (clickWhenEnabled()) {
      clearInterval(pollInterval);
      observer.disconnect();
    }
  }, 100);
  
  // 4. Timeout after 5s (reduced from 10s)
  setTimeout(() => {
    clearInterval(pollInterval);
    observer.disconnect();
    if (!buttonClicked && !promoBtn.disabled) {
      promoBtn.click();
    }
  }, 5000);
}
```

### Kết Quả
- ✅ Click ngay khi button enabled (thường < 100ms)
- ✅ Không phụ thuộc vào verification response detection
- ✅ Giảm timeout từ 10s → 5s
- ✅ 3 cơ chế song song đảm bảo không bỏ lỡ

## Test
Sau khi áp dụng, test lại workflow:
1. Click promo button → Chọn TAIAPP → Verify → Audio
2. Đảm bảo mỗi bước click ngay khi element xuất hiện
3. Không có delay không cần thiết
4. **Kiểm tra captcha text được điền vào đúng ô captcha input, không phải ô username**
5. **Kiểm tra nút "Nhận KM" được click ngay khi enabled (< 100ms), không chờ 10s**
