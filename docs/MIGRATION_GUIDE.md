# 🔄 Migration Guide - Từ hidemium-tool sang hidemium-multi-tool

## 📋 Tổng Quan

Hướng dẫn này giúp bạn chuyển từ cấu trúc cũ (`hidemium-tool`) sang cấu trúc mới (`hidemium-multi-tool`).

## 🗂️ So Sánh Cấu Trúc

### Cũ (hidemium-tool)
```
hidemium-tool/
├── src/
├── dashboard/
├── config/
└── package.json
```

### Mới (hidemium-multi-tool)
```
hidemium-multi-tool/
├── core/              # NEW - Shared modules
├── tools/             # NEW - Tools folder
│   └── nohu-tool/    # Tool cũ được move vào đây
├── dashboard/         # Improved
├── config/            # Enhanced
└── package.json
```

## 🚀 Các Bước Migration

### Bước 1: Copy Extension

```bash
# Copy extension folder vào tools/nohu-tool/
xcopy /E /I ..\hidemium-tool\extension tools\nohu-tool\extension\
```

### Bước 2: Copy Automation Scripts

```bash
# Copy các file automation
copy ..\hidemium-tool\src\*.js tools\nohu-tool\
```

### Bước 3: Copy Config

```bash
# Copy settings (sẽ cần chỉnh sửa)
copy ..\hidemium-tool\config\settings.json config\
```

### Bước 4: Install Dependencies

```bash
npm install
```

### Bước 5: Update Extension ID

Mở `config/settings.json` và cập nhật Extension ID:

```json
{
  "extensions": {
    "nohu-tool": "YOUR_EXTENSION_ID_HERE"
  }
}
```

### Bước 6: Test

```bash
npm run dashboard
```

## 📝 Files Cần Xóa

Sau khi migration xong, có thể xóa các files không cần thiết từ folder cũ:

### ❌ Xóa (Không cần nữa)
- `hidemium-tool/src/direct-automation.js` (đã deprecated)
- `hidemium-tool/src/test-*.js` (test files)
- `hidemium-tool/*.md` (docs cũ, đã có mới)

### ✅ Giữ Lại
- `hidemium-tool/config/profiles-data/` (data profiles)
- `hidemium-tool/node_modules/` (nếu muốn backup)

## 🔧 Cập Nhật Code

### API Key Management

**Cũ:**
```javascript
localStorage.setItem('api_key', key);
```

**Mới:**
```javascript
apiKeyManager.save(key);
```

### Profile Management

**Cũ:**
```javascript
fetch('/api/profiles/all');
```

**Mới:**
```javascript
await profileManager.loadAll();
```

## ✅ Checklist

- [ ] Copy extension folder
- [ ] Copy automation scripts
- [ ] Copy config files
- [ ] Install dependencies
- [ ] Update Extension ID
- [ ] Test dashboard
- [ ] Test NOHU tool
- [ ] Xóa files không cần thiết

## 🎯 Lợi Ích Sau Migration

1. **Modular** - Dễ thêm tools mới
2. **Shared Resources** - API Key & Profiles dùng chung
3. **Better UI** - Giao diện đẹp hơn
4. **Scalable** - Dễ mở rộng
5. **Maintainable** - Dễ maintain

---

**Thời gian migration:** ~15-30 phút
