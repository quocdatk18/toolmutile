# Fix Duplicate Captcha Solve Calls

## Vấn Đề

Khi solve audio captcha, có nhiều lần gọi API song song và bị lỗi:

```
❌ Error solving captcha: Request failed with status code 521
❌ [Node.js] API Error: timeout of 30000ms exceeded
❌ [Node.js] API Error: timeout of 30000ms exceeded
✅ [Node.js] API Response: {captcha: '485934'}
✅ [Node.js] API Response: {captcha: '485934'}
```

Kết quả: **"Mã capcha đã hết hạn vui lòng F5 lại trang để tạo mã mới"**

## Nguyên Nhân

Có **2 hệ thống solve captcha chạy song song**:

### 1. Node.js Side (Puppeteer)
**File:** `complete-automation.js` line 1007
- Intercept network request khi audio URL được load
- Gọi API `captchaai.io` để solve
- Timeout: 30s

### 2. Browser Side (Content Script)
**File:** `content.js` line 3731
- Intercept audio URL từ DOM/network
- Gọi API `autocaptcha.pro` để solve
- Có retry logic

### Vấn Đề
Cả 2 hệ thống đều được trigger khi audio URL xuất hiện:
1. Node.js bắt đầu solve (30s timeout)
2. Browser bắt đầu solve (có retry)
3. Nhiều request song song → Server overload → Error 521
4. Timeout và retry nhiều lần
5. Captcha hết hạn trước khi solve xong

## Giải Pháp

**Disable Node.js side solving** vì browser side đã hoạt động tốt và có retry logic tốt hơn.

### Code Trước (SAI)
```javascript
// complete-automation.js line 1000
if (url.includes('audio-captcha-cache') && url.endsWith('.mp3')) {
  const audioUrl = url.replace('http://', 'https://');
  console.log('🎵 CAPTURED AUDIO URL FROM NETWORK REQUEST:', audioUrl);

  // ❌ Solve from Node.js - DUPLICATE!
  setTimeout(async () => {
    console.log('🔐 Solving audio captcha from Node.js...');
    const solveResponse = await axios.post('https://api.captchaai.io/audio_to_text', {
      audio_url: audioUrl,
      apikey: apiKey
    }, {
      timeout: 30000  // ❌ Long timeout
    });
    // Fill captcha and submit...
  }, 1000);
}
```

### Code Sau (ĐÚNG)
```javascript
// complete-automation.js line 1000
if (url.includes('audio-captcha-cache') && url.endsWith('.mp3')) {
  const audioUrl = url.replace('http://', 'https://');
  console.log('🎵 CAPTURED AUDIO URL FROM NETWORK REQUEST:', audioUrl);

  // ✅ Let browser-side content.js handle solving
  console.log('ℹ️  Captcha will be solved by browser-side content.js');
}
```

## Lợi Ích

### Trước
- ❌ 2 hệ thống solve song song
- ❌ Nhiều API calls duplicate
- ❌ Timeout 30s x nhiều lần
- ❌ Captcha hết hạn
- ❌ Error 521 (server overload)

### Sau
- ✅ Chỉ 1 hệ thống solve (browser side)
- ✅ Không có duplicate calls
- ✅ Retry logic tốt hơn (5 lần với delay tăng dần)
- ✅ Captcha không hết hạn
- ✅ Ít lỗi server

## Browser Side Solve (Giữ Lại)

**File:** `content.js` line 3709
```javascript
async function solveAudioCaptchaAuto(audioUrl) {
  // Prevent duplicate solving
  if (window.audioSolving) {
    console.log('⚠️ Already solving audio captcha, skipping...');
    return;
  }

  window.audioSolving = true;

  try {
    const solver = new CaptchaSolver(apiKey);
    const captchaText = await solver.solveAudioCaptcha(audioUrl);
    
    // Find and fill captcha input (with smart detection)
    // Submit captcha
    // Watch for button enable and click immediately
  } finally {
    window.audioSolving = false;
  }
}
```

**Ưu điểm:**
- ✅ Có flag `window.audioSolving` để prevent duplicate
- ✅ Retry logic tốt (5 lần với delay tăng dần)
- ✅ Smart captcha input detection (6 methods)
- ✅ Auto-click "Nhận KM" khi button enabled

## File Đã Sửa
- `tools/nohu-tool/complete-automation.js`

## Fix Thêm: Tăng Delay Trước Khi Click Submit Captcha

### Vấn Đề
Click nút "Xác thực" quá nhanh sau khi điền captcha (500ms), server chưa kịp validate input.

### Giải Pháp
Tăng delay từ 500ms → 1500ms để server có thời gian validate captcha input.

**Code:**
```javascript
// Wait before submitting (for validation)
await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s for server to process
```

## Test
1. Chạy check promo workflow
2. Kiểm tra log - chỉ thấy 1 lần solve captcha
3. Không có duplicate API calls
4. Không có error 521 hoặc timeout
5. Captcha được solve và submit thành công
6. **Không có lỗi "Mã capcha đã hết hạn" do click quá nhanh**
