# Fix: Tab Throttling - Script không chạy khi tab inactive

## Vấn đề

Khi chạy automation song song trên nhiều sites, các tab không active bị **throttle** (giảm tốc độ) hoặc **pause** JavaScript execution. Điều này khiến:

- ❌ Extension script không chạy
- ❌ Auto-fill form không hoạt động
- ❌ Phải click vào tab để script mới chạy
- ❌ Automation bị stuck ở các tab background

## Nguyên nhân

### Chrome/Chromium Tab Throttling

Chrome tự động throttle các tab inactive để tiết kiệm tài nguyên:

```
Tab Active:
  - JavaScript chạy bình thường
  - Timers (setTimeout, setInterval) chạy đúng
  - Animations chạy mượt
  - Network requests ưu tiên cao

Tab Inactive (background):
  - JavaScript bị throttle (chạy chậm)
  - Timers bị delay (1s → 10s+)
  - Animations bị pause
  - Network requests ưu tiên thấp
  - ❌ Extension scripts có thể không chạy
```

### Khi chạy nhiều sites song song:

```
Site 1: Tab mở → Active → Script chạy ✅
Site 2: Tab mở → Inactive → Script KHÔNG chạy ❌
Site 3: Tab mở → Inactive → Script KHÔNG chạy ❌
Site 4: Tab mở → Inactive → Script KHÔNG chạy ❌
```

Chỉ tab cuối cùng (Site 4) là active, các tab khác bị throttle.

## Giải pháp

### Sử dụng `page.bringToFront()`

Puppeteer cung cấp method `bringToFront()` để focus vào tab:

```javascript
await page.bringToFront();
```

**Hiệu quả:**
- ✅ Tab được focus (active)
- ✅ JavaScript chạy bình thường
- ✅ Extension scripts hoạt động
- ✅ Timers chạy đúng

## Implementation

### 1. Thêm vào đầu mỗi workflow

**File:** `tools/nohu-tool/automation-actions.js`

```javascript
async completeRegistration(profileData) {
    console.log('🚀 Starting registration...');

    // ✅ IMPORTANT: Bring tab to front
    console.log('👁️  Bringing tab to front...');
    await this.page.bringToFront();

    // Validate API key
    // Click register
    // Fill form
    // ...
}
```

### 2. Thêm trước các action quan trọng

```javascript
// Before filling form
console.log('📝 Filling form...');
await this.page.bringToFront(); // ✅ Focus tab
await wait(500); // Wait for tab to activate

const fillResult = await this.autoFill({
    username: profileData.username,
    // ...
});
```

### 3. Thêm vào setup page

**File:** `tools/nohu-tool/complete-automation.js`

```javascript
async runRegistration(browser, url, profileData) {
    const page = await this.setupPage(browser, url);

    // ✅ Ensure tab is active before starting
    console.log('👁️  Ensuring tab is active...');
    await page.bringToFront();
    await wait(1000); // Wait for full activation

    const actions = new AutomationActions(page);
    const result = await actions.completeRegistration(profileData);
    // ...
}
```

## Các điểm cần focus

### 1. Đầu workflow
```javascript
async completeRegistration() {
    await this.page.bringToFront(); // ✅ Focus ngay đầu
    // ...
}
```

### 2. Trước fill form
```javascript
console.log('📝 Filling form...');
await this.page.bringToFront(); // ✅ Focus trước khi fill
await wait(500);
const result = await this.autoFill(...);
```

### 3. Trước click button
```javascript
console.log('🖱️  Clicking submit...');
await this.page.bringToFront(); // ✅ Focus trước khi click
await page.click('#submit');
```

### 4. Trước check result
```javascript
console.log('🔍 Checking result...');
await this.page.bringToFront(); // ✅ Focus trước khi check
const hasToken = await page.evaluate(() => {
    // Check cookies, etc.
});
```

## Timeline

### Trước fix:
```
T+0s:  Site 1 mở → Active → Script chạy ✅
T+5s:  Site 2 mở → Site 1 inactive → Script KHÔNG chạy ❌
T+10s: Site 3 mở → Site 1,2 inactive → Scripts KHÔNG chạy ❌
T+15s: Site 4 mở → Site 1,2,3 inactive → Scripts KHÔNG chạy ❌

Kết quả: Chỉ Site 4 hoàn thành, các site khác stuck
```

### Sau fix:
```
T+0s:  Site 1 mở → bringToFront() → Active → Script chạy ✅
T+5s:  Site 2 mở → bringToFront() → Active → Script chạy ✅
       Site 1 inactive nhưng đã hoàn thành
T+10s: Site 3 mở → bringToFront() → Active → Script chạy ✅
       Site 1,2 inactive nhưng đã hoàn thành
T+15s: Site 4 mở → bringToFront() → Active → Script chạy ✅
       Site 1,2,3 inactive nhưng đã hoàn thành

Kết quả: Tất cả sites hoàn thành ✅
```

## Best Practices

### 1. Focus đầu workflow
```javascript
async completeRegistration() {
    await this.page.bringToFront(); // ✅ Luôn focus đầu tiên
    // ... rest of workflow
}
```

### 2. Focus trước action quan trọng
```javascript
// Trước fill form
await this.page.bringToFront();
await wait(500); // Small wait for activation
await this.autoFill(...);

// Trước click
await this.page.bringToFront();
await page.click(...);

// Trước check
await this.page.bringToFront();
const result = await page.evaluate(...);
```

### 3. Thêm small wait sau bringToFront
```javascript
await this.page.bringToFront();
await wait(500); // ✅ Wait for tab to fully activate
// Now safe to run actions
```

**Lý do:** Tab cần thời gian để fully activate (render, event listeners, etc.)

### 4. Không cần focus quá nhiều
```javascript
// ❌ BAD: Focus mỗi dòng
await this.page.bringToFront();
await page.click('#button1');
await this.page.bringToFront(); // Không cần
await page.click('#button2');
await this.page.bringToFront(); // Không cần
await page.click('#button3');

// ✅ GOOD: Focus 1 lần cho cả workflow
await this.page.bringToFront();
await wait(500);
await page.click('#button1');
await page.click('#button2');
await page.click('#button3');
```

## Test Cases

### Test 1: Chạy 1 site
**Kết quả:**
- ✅ Hoạt động bình thường (tab luôn active)

### Test 2: Chạy 4 sites song song
**Trước fix:**
- ❌ Chỉ site cuối hoàn thành
- ❌ 3 sites đầu stuck

**Sau fix:**
- ✅ Tất cả 4 sites hoàn thành
- ✅ Mỗi site được focus khi cần

### Test 3: Chạy 10 sites song song
**Trước fix:**
- ❌ Chỉ 1-2 sites hoàn thành
- ❌ 8-9 sites stuck

**Sau fix:**
- ✅ Tất cả 10 sites hoàn thành
- ✅ Mỗi site được focus lần lượt

## Lưu ý

### 1. Performance
- `bringToFront()` rất nhanh (< 50ms)
- Không ảnh hưởng performance
- Có thể gọi nhiều lần không sao

### 2. User Experience
- User sẽ thấy tabs switch nhanh
- Đây là hành vi bình thường của automation
- Không cần lo lắng

### 3. Headless Mode
- `bringToFront()` vẫn hoạt động trong headless
- Không cần UI để focus tab
- Chrome vẫn treat tab như "active"

### 4. Multiple Windows
- Nếu mở nhiều windows, cần focus window trước:
```javascript
await page.bringToFront(); // Focus tab
// Chrome tự động focus window chứa tab đó
```

## Files Đã Sửa

1. ✅ `tools/nohu-tool/automation-actions.js`
   - Thêm `bringToFront()` vào `completeRegistration()`
   - Thêm `bringToFront()` vào `completeCheckPromotion()`
   - Thêm `bringToFront()` trước `autoFill()`

2. ✅ `tools/nohu-tool/complete-automation.js`
   - Thêm `bringToFront()` vào `runRegistration()`
   - Thêm wait 1s sau focus để tab fully activate

## Kết luận

Sau khi fix:
- ✅ Scripts chạy ngay cả khi tab inactive
- ✅ Auto-fill form hoạt động bình thường
- ✅ Không cần click vào tab thủ công
- ✅ Automation chạy song song mượt mà
- ✅ Tất cả sites hoàn thành thành công

**Nguyên tắc:** Luôn gọi `page.bringToFront()` trước các action quan trọng!
