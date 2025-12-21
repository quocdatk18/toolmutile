# Fix: Nút "Tạo Audio Captcha" Không Được Click

## Vấn đề
Nút "Tạo Audio Captcha" tồn tại trong DOM nhưng **không được click**, dẫn đến:
- Audio không được capture
- Captcha không được solve
- Khuyến mãi không được nhận

**HTML của nút:**
```html
<div class="audio-captcha-controls">
  <button type="button" id="generateAudioCaptcha" class="audio-captcha-btn audio-captcha-btn-primary">
    <span class="dashicons dashicons-controls-volume"></span>
    Tạo Audio Captcha
  </button>
  <button type="button" id="playAudioCaptcha" class="audio-captcha-btn audio-captcha-btn-secondary" style="display: none;">
    <span class="dashicons dashicons-controls-play"></span>
    Phát lại
  </button>
</div>
```

## Nguyên nhân
Các phương pháp tìm kiếm nút cũ sử dụng ký tự đặc biệt (`?`) trong so sánh chuỗi:
```javascript
// ❌ SAI - Không match được
if (text === 't?o audio captcha') { }
if (text.includes('t?o audio')) { }
```

Kết quả: Nút không được tìm thấy → không được click

## Giải pháp

### Cập nhật hàm `findAndClickCreateAudioButton()`

Thay thế 5 phương pháp tìm kiếm cũ bằng 5 phương pháp mới:

#### Phương pháp 1: Tìm bằng ID (CHÍNH XÁC NHẤT) ✅
```javascript
const generateBtn = document.getElementById('generateAudioCaptcha');
if (generateBtn && generateBtn.offsetParent !== null) {
  await clickCreateAudioButton(generateBtn);
  return true;
}
```
- Tìm trực tiếp bằng ID `generateAudioCaptcha`
- Nhanh nhất, chính xác nhất
- Không phụ thuộc vào text hay class

#### Phương pháp 2: Tìm bằng class selector
```javascript
const btnByClass = document.querySelector('button.audio-captcha-btn-primary');
if (btnByClass && btnByClass.offsetParent !== null) {
  await clickCreateAudioButton(btnByClass);
  return true;
}
```
- Tìm button có class `audio-captcha-btn-primary`
- Fallback nếu ID không tìm được

#### Phương pháp 3: Tìm bằng text content
```javascript
const allButtons = document.querySelectorAll('button');
for (let btn of allButtons) {
  const text = btn.textContent.trim();
  if (text.includes('Tạo Audio Captcha') || text.includes('Tao Audio Captcha')) {
    if (btn.offsetParent !== null) {
      await clickCreateAudioButton(btn);
      return true;
    }
  }
}
```
- Tìm button có text chứa "Tạo Audio Captcha"
- Hỗ trợ cả "Tạo" và "Tao"

#### Phương pháp 4: Tìm trong container
```javascript
const controlsContainer = document.querySelector('.audio-captcha-controls');
if (controlsContainer) {
  const btn = controlsContainer.querySelector('button.audio-captcha-btn-primary');
  if (btn && btn.offsetParent !== null) {
    await clickCreateAudioButton(btn);
    return true;
  }
}
```
- Tìm trong container `.audio-captcha-controls`
- Đảm bảo tìm đúng button

#### Phương pháp 5: Tìm bằng attribute selector
```javascript
const audioButtons = document.querySelectorAll('button[class*="audio"]');
for (let btn of audioButtons) {
  const text = btn.textContent.trim().toLowerCase();
  if (text.includes('audio') && text.includes('captcha') && btn.offsetParent !== null) {
    await clickCreateAudioButton(btn);
    return true;
  }
}
```
- Tìm button có "audio" trong class
- Kiểm tra text có "audio" + "captcha"

## Luồng thực thi

1. ⏳ **Chờ button hiển thị** (tối đa 10 giây)
2. 🎯 **Phương pháp 1**: Tìm bằng ID `#generateAudioCaptcha`
3. 🎯 **Phương pháp 2**: Tìm bằng class `button.audio-captcha-btn-primary`
4. 🎯 **Phương pháp 3**: Tìm bằng text content
5. 🎯 **Phương pháp 4**: Tìm trong container
6. 🎯 **Phương pháp 5**: Tìm bằng attribute selector
7. ✅ **Click button** khi tìm được

## Kết quả kỳ vọng

Sau khi fix:
- ✅ Nút "Tạo Audio Captcha" sẽ được tìm thấy (chắc chắn)
- ✅ Nút sẽ được click
- ✅ Audio sẽ được capture
- ✅ Captcha sẽ được solve
- ✅ Khuyến mãi sẽ được nhận

## Logs kỳ vọng

```
🎵 Finding "Tạo Audio Captcha" button...
⏳ Waiting for "Tạo Audio Captcha" button to appear...
✅ Button found after 500ms
🎯 Method 1: Direct ID selector #generateAudioCaptcha...
✅ Found button by ID: generateAudioCaptcha
   Text: Tạo Audio Captcha
   Class: audio-captcha-btn audio-captcha-btn-primary
🔍 DEBUG: Clicking create audio button immediately...
```

## File đã sửa
- `tools/nohu-tool/extension/content.js`
  - Hàm `findAndClickCreateAudioButton()` (dòng ~4057)
  - Cập nhật 5 phương pháp tìm kiếm nút
