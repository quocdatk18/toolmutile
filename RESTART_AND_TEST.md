# 🔄 Restart Server & Test

## Vấn Đề
API đã sửa nhưng server chưa restart → Vẫn chạy code cũ

## ✅ Giải Pháp

### Bước 1: Stop Server
```
Ctrl + C trong terminal đang chạy server
```

### Bước 2: Start Lại
```bash
npm run dashboard
```

### Bước 3: Clear Browser Cache
```
1. Mở DevTools (F12)
2. Right-click nút Refresh
3. Chọn "Empty Cache and Hard Reload"
```

### Bước 4: Test API
```bash
# Test trực tiếp API
curl http://localhost:3000/api/automation/results
```

**Kết quả mong đợi**: Thấy tất cả sessions với `sessionId` field

### Bước 5: Xem UI
```
1. Refresh trang
2. Vào NOHU Tool
3. Scroll xuống "Kết Quả Automation"
4. Thấy 6 dòng (3 users x nhiều sessions)
```

---

## 🐛 Debug

### Nếu vẫn không thấy:

#### Check 1: Server có restart không?
```
Terminal should show:
✅ Server running at: http://localhost:XXXX
```

#### Check 2: API có trả đúng không?
```bash
curl http://localhost:3000/api/automation/results | jq
```

Phải thấy:
- `sessionId` field trong mỗi result
- Nhiều results từ nhiều sessions

#### Check 3: Browser console có lỗi không?
```
F12 → Console tab
Xem có lỗi JavaScript không
```

#### Check 4: Frontend có gọi API không?
```
F12 → Network tab
Refresh page
Xem có request đến /api/automation/results không
```

---

## ✅ Kết Quả Mong Đợi

### API Response:
```json
{
  "success": true,
  "results": [
    {
      "username": "dat11111",
      "sessionId": "2025-01-10T10-30-45",
      "siteName": "go99",
      ...
    },
    {
      "username": "dat11111",
      "sessionId": "2025-01-10T14-20-30",
      "siteName": "go99",
      ...
    },
    ...
  ]
}
```

### UI Display:
```
| dat11111 | 3 trang | 1 lần | ✅ 3 | 📷 | 10:30:45 |
| dat11111 | 4 trang | 1 lần | ✅ 4 | 📷 | 14:20:30 |
| dat11111 | 2 trang | 1 lần | ✅ 2 | 📷 | 09:15:20 |
| test123  | 5 trang | 1 lần | ✅ 5 | 📷 | 11:45:00 |
| vip999   | 2 trang | 1 lần | ✅ 2 | 📷 | 16:30:15 |
| vip999   | 3 trang | 1 lần | ✅ 3 | 📷 | 08:00:00 |
```

---

## 💡 Lưu Ý

- **Luôn restart server** sau khi sửa code backend
- **Clear browser cache** để đảm bảo load code mới
- **Check API trước** rồi mới check UI
- **Xem console log** để debug
