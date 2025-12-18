# JUN88 Bot Detection Fix

## Vấn đề
Khi auto form xong, tool click đăng kí để user tự giải captcha, trang báo đăng kí không thành công. Trang phát hiện bot.

## Nguyên nhân
1. **Timing quá nhanh** - form được điền và submit quá nhanh
2. **Headless browser detection** - Puppeteer chạy ở chế độ headless
3. **JavaScript execution patterns** - trang phát hiện automation
4. **Missing delays** - không có delay giữa các tương tác

## Giải pháp đã áp dụng

### 1. Anti-bot measures trong form filling
- Tăng delay giữa các field từ 100ms → 150ms per character
- Thêm delay 300ms trước khi focus vào field
- Thêm delay 800ms sau khi fill xong field
- Scroll page trước submit để giả lập user đọc form

### 2. Tăng delay trước submit
- JUN88: 8-25s (tăng từ 5-20s)
- Thêm scroll up/down trước submit
- Scroll button vào view trước click

### 3. Slow click simulation
- Thêm delay 200ms giữa mouseenter và mousedown
- Thêm delay 100ms giữa mousedown và mouseup
- Sử dụng setTimeout để tạo delay async

## Cách sử dụng

### Option 1: Chạy với headless: false (RECOMMENDED)
```javascript
const browser = await puppeteer.launch({
    headless: false,  // ← Quan trọng!
    args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-extensions'
    ]
});
```

### Option 2: Stealth mode (nếu cần headless)
```javascript
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
    headless: true,
    args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
    ]
});
```

## Các flag quan trọng
- `--disable-blink-features=AutomationControlled` - Ẩn automation detection
- `--disable-dev-shm-usage` - Tránh memory issues
- `--no-first-run` - Bỏ qua first-run setup
- `--disable-popup-blocking` - Cho phép popups
- `--disable-extensions` - Tắt extensions

## Testing

### Test 1: Kiểm tra form filling
```bash
node test-jun88-form-filling.js
```

### Test 2: Kiểm tra submit timing
```bash
node test-jun88-submit-timing.js
```

### Test 3: Full registration flow
```bash
node test-jun88-full-flow.js
```

## Nếu vẫn bị phát hiện

### Bước 1: Kiểm tra console errors
- Mở DevTools (F12) trong browser
- Xem có error gì liên quan đến automation

### Bước 2: Tăng delay thêm
Sửa trong `vip-automation.js`:
```javascript
// Tăng delay trước submit
const delayBeforeSubmit = this.getRandomDelay(10000, 30000); // 10-30s
```

### Bước 3: Thêm random user-agent
```javascript
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];
const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
await page.setUserAgent(randomUA);
```

### Bước 4: Thêm viewport randomization
```javascript
await page.setViewport({
    width: 1280 + Math.random() * 100,
    height: 720 + Math.random() * 100
});
```

## Monitoring

Theo dõi các log:
- `🤖 JUN88 anti-bot: Adding extra delays...` - Anti-bot measures đang chạy
- `⏳ JUN88 anti-bot: Waiting Xs before submit...` - Delay trước submit
- `📤 Submitting registration form...` - Form đang submit
- `✅ Token found` - Đăng kí thành công

## Kết quả kỳ vọng
- Form được điền chậm (giả lập user thực)
- Có delay 8-25s trước submit
- Trang không phát hiện bot
- User có thể giải captcha thủ công
- Đăng kí thành công

## Ghi chú
- Nếu dùng headless: false, browser sẽ hiển thị (chậm hơn nhưng an toàn hơn)
- Nếu dùng headless: true, cần cài puppeteer-extra-plugin-stealth
- Jun88 rất nhạy cảm với automation, cần patience
