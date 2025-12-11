# Screenshot Feature - Implementation Guide

## ✅ Đã hoàn thành:

### Backend:
1. ✅ Logic chụp màn hình sau khi click "Nhận khuyến mãi"
2. ✅ Lưu ảnh vào folder `screenshots/`
3. ✅ Serve screenshots qua endpoint `/screenshots/`
4. ✅ Trả về đường dẫn ảnh trong response

### Content Script:
1. ✅ Set flag `window.promoButtonClickedSuccess` sau khi click thành công
2. ✅ Đợi 3 giây để response load

## 📋 Cần làm tiếp:

### 1. Hiển thị screenshot trong Dashboard UI

**File:** `dashboard/tools-ui/nohu-tool.html`

Thêm vào phần hiển thị kết quả:

```html
<!-- Thêm vào trong resultItem -->
<div class="result-item">
    <strong>${result.site}:</strong>
    <span class="${result.success ? 'success' : 'error'}">
        ${result.message}
    </span>
    
    <!-- THÊM PHẦN NÀY -->
    ${result.screenshot ? `
        <div class="screenshot-container">
            <img src="${result.screenshot}" 
                 alt="Screenshot" 
                 class="result-screenshot"
                 onclick="window.open('${result.screenshot}', '_blank')">
            <p class="screenshot-label">📸 Click để xem full size</p>
        </div>
    ` : ''}
</div>
```

**CSS cần thêm:**

```css
.screenshot-container {
    margin-top: 10px;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background: #f9f9f9;
}

.result-screenshot {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.result-screenshot:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.screenshot-label {
    text-align: center;
    margin-top: 5px;
    font-size: 12px;
    color: #666;
}
```

### 2. Thêm option bật/tắt screenshot

**Trong UI:**

```html
<div class="form-group">
    <label>
        <input type="checkbox" id="enableScreenshot" checked>
        Chụp màn hình kết quả
    </label>
</div>
```

**Trong code gửi request:**

```javascript
const enableScreenshot = document.getElementById('enableScreenshot').checked;

// Thêm vào request data
{
    ...otherData,
    enableScreenshot: enableScreenshot
}
```

### 3. Tối ưu hóa (Optional)

#### A. Nén ảnh để tiết kiệm dung lượng

```javascript
// Trong complete-automation.js
await promoPage.screenshot({
    path: filepath,
    fullPage: false,
    quality: 80, // Nén JPEG (0-100)
    type: 'jpeg' // Thay vì PNG
});
```

#### B. Tự động xóa ảnh cũ

```javascript
// Xóa ảnh cũ hơn 7 ngày
const fs = require('fs');
const path = require('path');

function cleanOldScreenshots() {
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    const files = fs.readdirSync(screenshotsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    files.forEach(file => {
        const filepath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filepath);
            console.log('Deleted old screenshot:', file);
        }
    });
}

// Chạy mỗi ngày
setInterval(cleanOldScreenshots, 24 * 60 * 60 * 1000);
```

#### C. Thêm watermark (timestamp, site name)

```javascript
// Sử dụng thư viện sharp
const sharp = require('sharp');

const buffer = await promoPage.screenshot();
const watermarked = await sharp(buffer)
    .composite([{
        input: Buffer.from(`
            <svg width="200" height="50">
                <text x="10" y="30" font-size="16" fill="white" stroke="black">
                    ${siteName} - ${new Date().toLocaleString()}
                </text>
            </svg>
        `),
        gravity: 'southeast'
    }])
    .toFile(filepath);
```

### 4. Hiển thị gallery (nhiều ảnh)

Nếu check nhiều sites, hiển thị dạng gallery:

```html
<div class="screenshots-gallery">
    ${results.map(result => result.screenshot ? `
        <div class="gallery-item">
            <img src="${result.screenshot}" alt="${result.site}">
            <p>${result.site}</p>
        </div>
    ` : '').join('')}
</div>
```

```css
.screenshots-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.gallery-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
}

.gallery-item img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    cursor: pointer;
}
```

## 🧪 Testing

1. Chạy automation với check promo
2. Đợi tool click "Nhận khuyến mãi"
3. Kiểm tra folder `screenshots/` có ảnh mới
4. Kiểm tra dashboard hiển thị ảnh
5. Click vào ảnh để xem full size

## 📝 Notes

- Screenshot chỉ được chụp khi click "Nhận khuyến mãi" thành công
- Ảnh được lưu với tên: `promo-YYYY-MM-DDTHH-MM-SS-sssZ.png`
- Ảnh có thể truy cập qua: `http://localhost:3000/screenshots/filename.png`
- Nên thêm `.gitignore` cho folder screenshots:

```
# .gitignore
screenshots/*.png
screenshots/*.jpg
!screenshots/.gitkeep
```

## 🚀 Future Enhancements

- [ ] Upload ảnh lên cloud (S3, Cloudinary)
- [ ] Gửi ảnh qua Telegram Bot
- [ ] So sánh ảnh trước/sau
- [ ] OCR để đọc text từ ảnh
- [ ] Tự động detect success/error từ ảnh
