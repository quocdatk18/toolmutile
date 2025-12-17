# Tạo Shortcut Đẹp Cho Dashboard

## Cách 1: Tự động (Khuyến nghị)

1. **Double-click file `CREATE_SHORTCUT.vbs`**
   - File này sẽ tự động tạo shortcut `START_DASHBOARD.lnk` với icon đẹp
   - Shortcut sẽ nằm cùng thư mục với `START_DASHBOARD.bat`

2. **Sử dụng shortcut**
   - Double-click `START_DASHBOARD.lnk` để khởi động dashboard
   - Icon sẽ hiển thị là biểu tượng "Play" (khởi động)

## Cách 2: Thủ công

1. **Tạo shortcut thủ công**
   - Right-click vào `START_DASHBOARD.bat`
   - Chọn "Send to" → "Desktop (create shortcut)"

2. **Thay đổi icon**
   - Right-click shortcut → Properties
   - Click "Change Icon..."
   - Chọn icon từ `C:\Windows\System32\shell32.dll`
   - Tìm icon "Play" hoặc "Startup"

## Icon Suggestions

Các icon đẹp từ Windows:
- `shell32.dll,110` - Play button (khuyến nghị)
- `shell32.dll,108` - Folder with arrow
- `shell32.dll,16` - Floppy disk
- `shell32.dll,23` - Gear (settings)

## Lợi ích

✅ Icon rõ ràng, dễ nhận biết  
✅ Người dùng biết ngay đây là để khởi động  
✅ Shortcut có thể pin vào Taskbar  
✅ Có thể đặt trên Desktop
