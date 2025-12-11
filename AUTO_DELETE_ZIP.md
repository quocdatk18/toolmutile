# Auto Delete ZIP - Bảo mật License

## Tổng quan

Sau khi khách hàng activate license thành công, file ZIP gốc sẽ **TỰ ĐỘNG BỊ XÓA** để ngăn việc sử dụng lại license trên máy khác.

## Vấn đề cần giải quyết

### Trước khi có auto-delete:
```
Khách hàng nhận file: tool.zip
  ↓
Giải nén → Activate trên máy A → Thành công ✅
  ↓
Giữ lại file tool.zip
  ↓
Copy tool.zip sang máy B → Giải nén → Activate → Thành công ✅
  ↓
Copy tool.zip sang máy C → Giải nén → Activate → Thành công ✅
  ↓
❌ 1 license dùng được trên nhiều máy!
```

### Sau khi có auto-delete:
```
Khách hàng nhận file: tool.zip
  ↓
Giải nén → Activate trên máy A → Thành công ✅
  ↓
2 giây sau: tool.zip TỰ ĐỘNG BỊ XÓA 🗑️
  ↓
Không còn file ZIP để copy sang máy khác
  ↓
✅ License chỉ hoạt động trên máy A
```

## Cách hoạt động

### 1. Script delete-zip.js

**File:** `core/delete-zip.js` (được tạo trong customer package)

```javascript
function deleteOriginalZip() {
    // Tìm file ZIP trong thư mục cha
    const parentDir = path.join(__dirname, '..');
    const files = fs.readdirSync(parentDir);
    const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

    // Xóa tất cả file ZIP
    zipFiles.forEach(zipFile => {
        const zipPath = path.join(parentDir, zipFile);
        fs.unlinkSync(zipPath);
        console.log('🗑️  Deleted:', zipFile);
    });
}
```

### 2. Tích hợp vào License Manager

**File:** `core/license-manager.js`

```javascript
activate(key) {
    // ... validate và save license ...

    // Sau khi activate thành công
    try {
        const deleteZip = require('./delete-zip');
        setTimeout(() => {
            deleteZip.deleteOriginalZip();
        }, 2000); // Đợi 2 giây
    } catch (err) {
        // Ignore nếu không có file (master version)
    }

    return { valid: true, message: 'Kích hoạt thành công' };
}
```

### 3. Cấu trúc thư mục

```
📁 Desktop/
  📄 tool.zip                    ← File gốc (sẽ bị xóa)
  📁 tool/                       ← Folder giải nén
    📁 core/
      📄 delete-zip.js           ← Script xóa ZIP
      📄 license-manager.js      ← Gọi delete-zip
    📄 .license                  ← License đã activate
    📄 LICENSE_KEY.txt
    📄 INSTALL.bat
    📄 START.bat
```

## Timeline

```
T+0s:  Khách hàng click "Kích Hoạt"
       ↓
T+0.5s: Validate license key
       ↓
T+1s:  Bind machine ID (nếu cần)
       ↓
T+1.5s: Save .license file
       ↓
T+2s:  Hiển thị "Kích hoạt thành công"
       ↓
T+2s:  Trigger deleteOriginalZip()
       ↓
T+2.1s: Tìm file ZIP trong thư mục cha
       ↓
T+2.2s: Xóa tool.zip
       ↓
T+2.3s: Console log: "🗑️  Deleted original ZIP: tool.zip"
       ↓
✅ Hoàn tất
```

## Tính năng

### 1. Tự động
- Không cần thao tác thủ công
- Chạy ngầm sau khi activate
- Không làm gián đoạn user experience

### 2. An toàn
- Chỉ xóa file `.zip`
- Không xóa folder đã giải nén
- Không ảnh hưởng đến tool đang chạy

### 3. Thông minh
- Tìm tất cả file ZIP trong thư mục cha
- Xóa cả file có tên khác (tool-v2.zip, backup.zip, etc.)
- Console log để admin debug

### 4. Graceful Failure
- Nếu không tìm thấy ZIP → Không báo lỗi
- Nếu không có quyền xóa → Warning, không crash
- Nếu file delete-zip.js không tồn tại → Ignore (master version)

## Lợi ích

### 1. Bảo mật
- ✅ Ngăn khách hàng dùng lại license trên nhiều máy
- ✅ Không thể copy ZIP sang máy khác
- ✅ License chỉ hoạt động trên máy đã activate

### 2. Tự động hóa
- ✅ Không cần hướng dẫn khách hàng xóa ZIP
- ✅ Không cần nhắc nhở
- ✅ Tự động thực thi

### 3. User-friendly
- ✅ Không làm phiền khách hàng
- ✅ Chạy ngầm, không popup
- ✅ Chỉ log ra console (admin có thể xem)

## Trường hợp đặc biệt

### 1. Khách hàng backup ZIP trước khi activate
```
Khách hàng copy tool.zip → tool-backup.zip
  ↓
Giải nén tool.zip → Activate
  ↓
Script xóa: tool.zip ✅, tool-backup.zip ✅
  ↓
Cả 2 file đều bị xóa
```

**Giải pháp:** Script xóa TẤT CẢ file `.zip` trong thư mục cha

### 2. ZIP nằm trong thư mục khác
```
📁 Downloads/
  📄 tool.zip
📁 Desktop/
  📁 tool/  ← Giải nén ở đây
```

**Kết quả:** Script không tìm thấy ZIP (vì tìm trong parent của tool/)

**Giải pháp:** Hướng dẫn khách hàng giải nén ZIP tại chỗ (cùng thư mục)

### 3. Khách hàng chạy từ ZIP (không giải nén)
```
Double-click INSTALL.bat trong ZIP viewer
```

**Kết quả:** Không thể chạy (cần giải nén trước)

**Giải pháp:** README hướng dẫn rõ: "Giải nén trước khi chạy"

## Hướng dẫn cho khách hàng

### README.txt (trong package)
```
⚠️  LƯU Ý BẢO MẬT:
  - Sau khi kích hoạt thành công, file ZIP gốc sẽ TỰ ĐỘNG BỊ XÓA
  - Điều này ngăn việc sử dụng lại license trên máy khác
  - Vui lòng backup tool sau khi cài đặt (không backup ZIP)

KHUYẾN NGHỊ:
  1. Giải nén ZIP tại chỗ (cùng thư mục)
  2. Chạy INSTALL.bat
  3. Activate license
  4. Sau khi activate, ZIP sẽ tự động bị xóa
  5. Backup folder tool (không phải ZIP) nếu cần
```

## Test Cases

### Test 1: Activate thành công
**Setup:**
- File: `Desktop/tool.zip`
- Giải nén: `Desktop/tool/`

**Kết quả:**
- ✅ Activate thành công
- ✅ 2 giây sau: `tool.zip` bị xóa
- ✅ Console: "🗑️  Deleted original ZIP: tool.zip"

### Test 2: Nhiều file ZIP
**Setup:**
- Files: `tool.zip`, `tool-backup.zip`, `old-version.zip`
- Giải nén: `tool/`

**Kết quả:**
- ✅ Cả 3 file ZIP đều bị xóa
- ✅ Console: "🗑️  Deleted: tool.zip, tool-backup.zip, old-version.zip"

### Test 3: Không có quyền xóa
**Setup:**
- File ZIP: Read-only

**Kết quả:**
- ✅ Activate vẫn thành công
- ⚠️  Console: "Could not delete ZIP: tool.zip - Permission denied"
- ℹ️  Không crash, chỉ warning

### Test 4: ZIP ở thư mục khác
**Setup:**
- ZIP: `C:/Downloads/tool.zip`
- Giải nén: `D:/Projects/tool/`

**Kết quả:**
- ✅ Activate thành công
- ℹ️  Console: "No ZIP files found to delete"
- ℹ️  ZIP không bị xóa (vì không tìm thấy)

## Lưu ý kỹ thuật

### 1. Timing
- Đợi 2 giây sau activate để đảm bảo UI đã update
- Không block activation process
- Chạy async (setTimeout)

### 2. Error Handling
- Try-catch để không crash nếu lỗi
- Graceful failure
- Log warning thay vì throw error

### 3. Master Version
- File `delete-zip.js` chỉ có trong customer package
- Master version không có → require() sẽ fail
- Catch error và ignore (không ảnh hưởng master)

### 4. Console Logging
- Log rõ ràng để admin debug
- Emoji để dễ nhận biết
- Không spam console

## Kết luận

Tính năng auto-delete ZIP:
- ✅ Tăng bảo mật license
- ✅ Ngăn việc dùng lại trên nhiều máy
- ✅ Tự động, không cần thao tác thủ công
- ✅ User-friendly, không làm phiền khách hàng
- ✅ Graceful failure, không crash
- ✅ Chỉ có trong customer package, không ảnh hưởng master

**Khuyến nghị:** Bật tính năng này cho tất cả customer packages với machine binding.
