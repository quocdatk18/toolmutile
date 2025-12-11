# 🗑️ Hướng Dẫn Tự Động Dọn Dẹp Tab & Context

## Tổng Quan

Sau khi chụp ảnh thành công, automation sẽ tự động đóng các tab và context để tối ưu bộ nhớ.

## Cơ Chế Hoạt Động

### 1. Đóng Tab Sau Khi Chụp Ảnh

**File**: `tools/nohu-tool/complete-automation.js`

```javascript
// Sau khi chụp ảnh thành công
await promoPage.screenshot({ path: filepath });
console.log('✅ Screenshot saved');

// Đóng tab ngay lập tức
await promoPage.close();
console.log('✅ Promo tab closed');
```

**Lợi ích**:
- Giải phóng bộ nhớ ngay sau khi hoàn thành
- Không để tab rác tích tụ
- Tối ưu hiệu suất cho các site tiếp theo

### 2. Đóng Context Sau Khi Hoàn Thành Tất Cả

**File**: `tools/nohu-tool/auto-sequence.js`

```javascript
// Sau khi tất cả sites hoàn thành
console.log('🎉 CHECK PROMO COMPLETED!');

// Đóng tất cả browser contexts (trừ default)
const contexts = browser.browserContexts();
for (const context of contexts) {
    if (context !== browser.defaultBrowserContext()) {
        await context.close();
    }
}
```

**Lợi ích**:
- Giải phóng toàn bộ bộ nhớ của contexts
- Đóng tất cả tabs trong contexts
- Giữ lại default context (profile chính)

## Flow Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────┐
│  1. Tạo Context Mới                                     │
│     - Mỗi site có 1 context riêng                       │
│     - Tránh conflict cookies/session                    │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  2. Mở Tab Promo                                        │
│     - Trong context của site                            │
│     - Load trang check khuyến mãi                       │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  3. Chụp Ảnh                                            │
│     - Lưu vào screenshots/{username}/                   │
│     - Gửi kết quả về dashboard                          │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  4. Đóng Tab ✅                                         │
│     - await promoPage.close()                           │
│     - Giải phóng bộ nhớ ngay                            │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  5. Lặp Lại Cho Site Tiếp Theo                          │
│     - Parallel processing                               │
│     - Mỗi site độc lập                                  │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  6. Đóng Tất Cả Contexts ✅                             │
│     - Sau khi hoàn thành tất cả                         │
│     - Giải phóng toàn bộ bộ nhớ                         │
└─────────────────────────────────────────────────────────┘
```

## Code Chi Tiết

### Đóng Tab (complete-automation.js)

```javascript
try {
    // Chụp ảnh
    await promoPage.screenshot({ path: filepath });
    console.log('✅ Screenshot saved:', filename);

    // Gửi kết quả về dashboard
    await axios.post('http://localhost:3000/api/automation/result', {...});
    console.log('✅ Result sent to dashboard');

    // ✨ ĐÓNG TAB NGAY SAU KHI THÀNH CÔNG
    console.log('🗑️  Closing promo tab...');
    await promoPage.close();
    console.log('✅ Promo tab closed');

} catch (error) {
    console.error('❌ Error:', error);
    
    // Đóng tab ngay cả khi có lỗi
    try {
        await promoPage.close();
        console.log('🗑️  Promo tab closed (after error)');
    } catch (e) {
        // Ignore
    }
}
```

### Đóng Contexts (auto-sequence.js)

```javascript
// Sau khi tất cả sites hoàn thành
console.log('🎉 CHECK PROMO COMPLETED!');

// Summary
results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.site}: ${result.success ? '✅' : '❌'}`);
});

// ✨ DỌN DẸP TẤT CẢ CONTEXTS
console.log('🗑️  Cleaning up browser contexts...');
const contexts = browser.browserContexts();
let closedCount = 0;

for (const context of contexts) {
    // Không đóng default context (profile chính)
    if (context !== browser.defaultBrowserContext()) {
        await context.close();
        closedCount++;
    }
}

console.log(`✅ Closed ${closedCount} browser contexts`);
```

## Lợi Ích

### 1. Tiết Kiệm Bộ Nhớ
- **Trước**: 10 sites = 10 contexts + 10 tabs = ~2GB RAM
- **Sau**: Đóng ngay sau khi xong = ~200MB RAM

### 2. Tăng Hiệu Suất
- Ít tab hơn = browser nhanh hơn
- Ít context hơn = ít overhead hơn
- Automation chạy mượt mà hơn

### 3. Tránh Crash
- Không bị tràn bộ nhớ
- Không bị browser lag
- Ổn định hơn khi chạy nhiều site

### 4. Dễ Debug
- Ít tab hơn = dễ theo dõi
- Log rõ ràng khi đóng tab
- Biết chính xác tab nào đang mở

## Console Output

### Khi Chạy Thành Công

```
📸 Taking screenshot of result modal...
📁 Screenshot path: E:\tool\screenshots\user123\go99code-store-2024-12-08.png
✅ Screenshot saved: go99code-store-2024-12-08.png
✅ File verified: 245678 bytes
✅ Result sent to dashboard
🗑️  Closing promo tab...
✅ Promo tab closed

[Lặp lại cho các site khác...]

🎉 CHECK PROMO COMPLETED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go99: ✅ - 3 promotions
2. NOHU: ✅ - 2 promotions
3. TT88: ✅ - 1 promotions

🗑️  Cleaning up browser contexts...
✅ Closed 3 browser contexts
```

### Khi Có Lỗi

```
❌ Screenshot error: Timeout waiting for modal
🗑️  Promo tab closed (after error)

[Tiếp tục với site khác...]
```

## Best Practices

### 1. Luôn Đóng Tab Trong Try-Catch
```javascript
try {
    // Main logic
    await doSomething();
} catch (error) {
    console.error(error);
} finally {
    // Luôn đóng tab
    try {
        await page.close();
    } catch (e) {
        // Ignore
    }
}
```

### 2. Đóng Context Sau Khi Hoàn Thành
```javascript
// Sau khi xong tất cả
for (const context of contexts) {
    if (context !== browser.defaultBrowserContext()) {
        await context.close();
    }
}
```

### 3. Không Đóng Default Context
```javascript
// ❌ KHÔNG LÀM NHƯ NÀY
await browser.defaultBrowserContext().close(); // Sẽ crash!

// ✅ LÀM NHƯ NÀY
if (context !== browser.defaultBrowserContext()) {
    await context.close();
}
```

## Troubleshooting

### Tab Không Đóng?
1. **Kiểm tra log**: Xem có lỗi khi đóng không
2. **Kiểm tra page**: Page có còn tồn tại không
3. **Force close**: Dùng `page.close({ runBeforeUnload: false })`

### Context Không Đóng?
1. **Kiểm tra pages**: Đóng tất cả pages trước
2. **Kiểm tra default**: Không đóng default context
3. **Timeout**: Thêm timeout cho close operation

### Memory Leak?
1. **Check contexts**: `browser.browserContexts().length`
2. **Check pages**: `context.pages().length`
3. **Monitor RAM**: Task Manager

## Kết Luận

Tự động dọn dẹp tab và context giúp:
- ✅ Tiết kiệm bộ nhớ
- ✅ Tăng hiệu suất
- ✅ Tránh crash
- ✅ Dễ debug

Automation giờ chạy mượt mà và ổn định hơn nhiều! 🚀
