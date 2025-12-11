# 🔧 Sửa Lỗi Chụp Ảnh Sau Khi Check KM

## ❌ Vấn Đề

### Vấn Đề 1: Chụp Sai Modal

**Triệu chứng:** Tool chụp ảnh modal **chọn khuyến mãi** (danh sách TAIAPP, TROLAI, v.v.) thay vì modal **kết quả nhận KM**

**Nguyên nhân:** Logic kiểm tra `text.includes('thành công')` match với notification "Đã chọn khuyến mãi!" (màu xanh ở góc)

**Flow đúng:**
1. Click "Chọn Khuyến Mãi" → Modal danh sách KM xuất hiện
2. Chọn TAIAPP → Notification "Đã chọn khuyến mãi!" (KHÔNG chụp)
3. Click "Xác Thực Tại Đây" → Modal captcha
4. Giải captcha → Click "Nhận CODE tại đây"
5. **Modal kết quả** xuất hiện (Lỗi hoặc Thành công) → **CHỤP ĐÂY**

**Flow sai (trước khi sửa):**
1. Click "Chọn Khuyến Mãi" → Modal danh sách KM
2. Chọn TAIAPP → Notification "Đã chọn khuyến mãi!"
3. ❌ **CHỤP NGAY** (SAI!) → Đóng tab
4. Captcha chưa giải, chưa nhận KM

### Vấn Đề 2: Không Đợi Đủ

**Các trang khác (không phải Go99/TT88):**
- ❌ Captcha chưa giải xong đã chụp
- ❌ Button "Nhận CODE" chưa click đã chụp
- ❌ Modal lỗi cũng bị chụp

## ✅ Giải Pháp

### Ý Tưởng Chính

**Logic chụp ảnh nên đi cùng luồng check KM**, ngay sau khi check KM kết thúc thì chụp ảnh là chính xác nhất.

Do đó, logic kiểm tra modal kết quả được **chuyển vào content.js** (chạy trong browser context), sau đó set flag `window.screenshotReady` để complete-automation.js (Puppeteer) biết khi nào chụp ảnh.

### 1. Content.js - Phân Biệt Modal và Đợi Kết Quả Cuối Cùng

File: `tools/nohu-tool/extension/content.js`

**Bỏ qua modal chọn KM, chỉ đợi modal kết quả CUỐI CÙNG (tối đa 60s)**

```javascript
// STEP 6: Wait for FINAL result modal (after clicking "Nhận CODE tại đây")
console.log('Step 6: Waiting for FINAL result modal (not promo selection modal)...');

let modalFound = false;
let isSuccess = false;
let waitAttempts = 0;
const maxModalWait = 60; // Wait up to 60 seconds

while (waitAttempts < maxModalWait && !modalFound) {
  waitAttempts++;

  // IMPORTANT: Ignore promo selection modal (has list of promo codes)
  // Check if we're still on promo selection modal
  const promoSelectionModal = document.querySelector('*');
  let isPromoSelectionModal = false;
  
  if (promoSelectionModal) {
    const modalText = promoSelectionModal.textContent || '';
    // If modal contains promo code list indicators, it's selection modal
    if (modalText.includes('MÃ KHUYẾN MÃI') || 
        modalText.includes('NỘI DUNG KHUYẾN MÃI') ||
        modalText.includes('TAIAPP') ||
        modalText.includes('TROLAI') ||
        modalText.includes('Nhập CODE tại đây')) {
      isPromoSelectionModal = true;
    }
  }
  
  // Skip if still on selection modal
  if (isPromoSelectionModal) {
    console.log(`⏳ [${waitAttempts}s] Still on promo selection modal, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    continue;
  }

  // Now check for FINAL result modal
  let hasError = false;
  for (const el of document.querySelectorAll('*')) {
    const text = el.textContent?.trim();
    if (text === 'Lỗi' && el.tagName !== 'BODY') {
      hasError = true;
      break;
    }
  }

  // Check for success (specific messages, NOT "Đã chọn khuyến mãi")
  let hasSuccess = false;
  for (const el of document.querySelectorAll('*')) {
    const text = el.textContent?.trim();
    if (!text || el.tagName === 'BODY') continue;
    
    if (text.includes('Nhận khuyến mãi thành công') ||
        text.includes('Nhận thưởng thành công') ||
        text.includes('Chúc mừng') ||
        (text.includes('thành công') && text.length < 100 && !text.includes('Đã chọn'))) {
      hasSuccess = true;
      break;
    }
  }

  if (hasError || hasSuccess) {
    modalFound = true;
    isSuccess = hasSuccess && !hasError;
    console.log(`✅ FINAL modal found: ${isSuccess ? 'SUCCESS' : 'ERROR'}`);
    
    window.screenshotReady = true;
    window.screenshotSuccess = isSuccess;
    break;
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### 2. Complete-Automation.js - Đợi Flag và Chụp Ảnh

File: `tools/nohu-tool/complete-automation.js`

**Đợi flag `screenshotReady` từ content.js (tối đa 90s)**

```javascript
// Content.js will handle the entire flow and set screenshotReady flag
console.log('⏳ Waiting for content.js to complete check promo flow...');

let screenshotReady = false;
let attempts = 0;
const maxWaitAttempts = 90; // Wait up to 90 seconds for entire flow

while (attempts < maxWaitAttempts && !screenshotReady) {
    attempts++;
    
    const status = await promoPage.evaluate(() => {
        return {
            screenshotReady: window.screenshotReady === true,
            screenshotSuccess: window.screenshotSuccess === true,
            captchaFailed: window.captchaFailed === true
        };
    });
    
    if (status.captchaFailed) {
        console.log('❌ Captcha failed - stopping');
        await promoPage.close();
        return { success: false, message: 'Captcha solving failed' };
    }
    
    if (status.screenshotReady) {
        screenshotReady = true;
        console.log(`✅ Screenshot ready after ${attempts}s`);
        
        // If error modal, don't take screenshot
        if (!status.screenshotSuccess) {
            console.log('❌ Error modal detected - skipping screenshot');
            await promoPage.close();
            return { success: false, message: 'Promotion claim failed' };
        }
        
        break;
    }
    
    await wait(1000);
}

if (!screenshotReady) {
    console.log('⚠️ Screenshot not ready after 90s - timeout');
    await promoPage.close();
    return { success: false, message: 'Check promo timeout' };
}

// Now take screenshot...
```

### 3. Xử Lý Kết Quả

**Flow hoàn chỉnh:**

1. **Content.js** giải captcha → click button → đợi modal → set flag
2. **Complete-automation.js** đợi flag → kiểm tra kết quả → chụp ảnh (nếu success)

**Các trường hợp:**

**Nếu captcha failed:**
- ❌ Content.js set `captchaFailed = true`
- ❌ Complete-automation.js phát hiện và dừng
- 👁️ **GIỮ TAB MỞ** để user sửa lỗi thủ công

**Nếu modal lỗi:**
- ❌ Content.js set `screenshotReady = true, screenshotSuccess = false`
- ❌ Complete-automation.js phát hiện error modal
- 👁️ **GIỮ TAB MỞ** để user kiểm tra lỗi
- ❌ Không chụp ảnh

**Nếu modal thành công:**
- ✅ Content.js set `screenshotReady = true, screenshotSuccess = true`
- ✅ Complete-automation.js chụp ảnh
- 📤 Gửi kết quả về dashboard
- 🗑️ **ĐÓNG TAB** sau khi chụp xong

**Nếu timeout (90s):**
- ⏱️ Complete-automation.js timeout
- 👁️ **GIỮ TAB MỞ** để user kiểm tra
- ❌ Không chụp ảnh

**Nếu lỗi khi chụp ảnh:**
- ❌ Screenshot error
- 👁️ **GIỮ TAB MỞ** để user kiểm tra

## 🎯 Kết Quả

Sau khi sửa:

1. ✅ **Logic chụp ảnh đi cùng flow check KM**: Content.js kiểm tra modal ngay trong flow
2. ✅ **Đợi đủ thời gian**: 
   - Content.js đợi modal 30s
   - Complete-automation.js đợi flag 90s (tổng cộng đủ thời gian cho mọi trang)
3. ✅ **Chỉ chụp ảnh khi thành công**: Modal lỗi được phát hiện và bỏ qua
4. ✅ **Quản lý tab thông minh**: 
   - ❌ Lỗi (captcha failed, modal lỗi, timeout) → **GIỮ TAB MỞ** để user sửa
   - ✅ Thành công → chụp ảnh rồi **ĐÓNG TAB**
5. ✅ **Hoạt động với mọi trang**: Go99, TT88 (nhanh) và các trang khác (chậm hơn)
6. ✅ **Dễ debug**: Tab được giữ lại khi có lỗi, user có thể kiểm tra và sửa thủ công

## 🧪 Cách Test

### Test 1: Tài khoản có lỗi (đã nhận KM)
1. Chạy check KM với tài khoản đã nhận KM
2. Kiểm tra:
   - ❌ Không có ảnh được lưu
   - 👁️ **Tab vẫn mở** để xem lỗi
   - 📝 Log hiển thị "ERROR modal detected - tab kept open"

### Test 2: Tài khoản hợp lệ
1. Chạy check KM với tài khoản chưa nhận KM
2. Kiểm tra:
   - ✅ Có ảnh được lưu
   - 📸 Ảnh chụp modal thành công
   - 🗑️ **Tab tự động đóng** sau khi chụp xong

### Test 3: Captcha failed
1. Chạy với API key sai hoặc hết tiền
2. Kiểm tra:
   - ❌ Không có ảnh được lưu
   - 👁️ **Tab vẫn mở** để user giải captcha thủ công
   - 📝 Log hiển thị "Captcha failed - tab kept open"

### Test 4: Timeout
1. Chạy với trang web chậm hoặc không phản hồi
2. Kiểm tra:
   - ❌ Không có ảnh được lưu
   - 👁️ **Tab vẫn mở** để user kiểm tra
   - 📝 Log hiển thị "timeout - tab kept open"

## 📝 Lưu Ý

- Logic này chỉ áp dụng cho **nohu-tool** (Go99, TT88, v.v.)
- **hai2vip-tool** không có chức năng chụp ảnh nên không cần sửa
- Nếu trang web thay đổi cấu trúc modal, có thể cần cập nhật selector trong `errorIndicators` và `successIndicators`
