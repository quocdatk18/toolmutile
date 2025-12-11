# Anti-Detect Profile Configuration

## Tổng quan
Khi tạo profile, hệ thống tự động thêm các thông số anti-detect để tránh bị phát hiện trùng lặp bởi các trang web.

## Các thông số Anti-Detect

### 1. Canvas Fingerprint
- **Mục đích**: Tránh fingerprinting qua Canvas API
- **Giá trị**: `noise` (thêm nhiễu ngẫu nhiên), `off`, `block`
- **Mặc định**: `noise`

### 2. WebGL Fingerprint
- **Mục đích**: Tránh fingerprinting qua WebGL
- **Giá trị**: `noise`, `off`, `block`
- **Mặc định**: `noise`
- **WebGL Info**: Vendor và Renderer được randomize

### 3. Fonts
- **Mục đích**: Tránh fingerprinting qua danh sách fonts
- **Giá trị**: `mask` (che giấu một số fonts), `all`, `custom`
- **Mặc định**: `mask`

### 4. Timezone
- **Mục đích**: Khớp với vị trí proxy
- **Mặc định**: `Asia/Ho_Chi_Minh`
- **Lưu ý**: Nên match với IP proxy để tránh mâu thuẫn

### 5. Language & Locale
- **Mục đích**: Giả lập người dùng Việt Nam
- **Language**: `vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7`
- **Locale**: `vi-VN`

### 6. Screen Resolution
- **Mục đích**: Giả lập thiết bị mobile khác nhau
- **Giá trị**: Rotate qua các resolution phổ biến
  - `360x640` (Samsung Galaxy)
  - `375x667` (iPhone 8)
  - `414x896` (iPhone 11)
  - `390x844` (iPhone 12/13)
  - `393x851` (Pixel 5)

### 7. Hardware Concurrency (CPU Cores)
- **Mục đích**: Randomize số lõi CPU
- **Giá trị**: 4-7 cores (rotate cho mỗi profile)
- **Mặc định**: `4 + (index % 4)`

### 8. Device Memory (RAM)
- **Mục đích**: Randomize dung lượng RAM
- **Giá trị**: 4-10 GB (rotate cho mỗi profile)
- **Mặc định**: `4 + (index % 4) * 2`

### 9. Media Devices
- **Mục đích**: Tránh fingerprinting qua camera/microphone
- **Giá trị**: `noise`, `off`, `real`
- **Mặc định**: `noise`

### 10. WebRTC
- **Mục đích**: Ngăn leak IP thật
- **Giá trị**: `altered` (thay đổi IP), `disabled`, `real`
- **Mặc định**: `altered`

### 11. Do Not Track
- **Mục đích**: Header DNT
- **Mặc định**: `false`

## Cách sử dụng

### Tạo profile với cấu hình mặc định
```javascript
{
  "count": 5,
  "prefix": "Profile",
  "config": {
    "os": "win",
    "browser": "chrome",
    "proxy": {
      "type": "HTTP",
      "host": "proxy.example.com",
      "port": 8080,
      "username": "user",
      "password": "pass"
    }
  }
}
```

### Tạo profile với cấu hình tùy chỉnh
```javascript
{
  "count": 1,
  "prefix": "CustomProfile",
  "config": {
    "os": "win",
    "browser": "chrome",
    "canvas": "noise",
    "webgl": "noise",
    "timezone": "Asia/Bangkok",
    "language": "th-TH,th;q=0.9",
    "resolution": "414x896",
    "hardwareConcurrency": 6,
    "deviceMemory": 8,
    "proxy": { ... }
  }
}
```

## Best Practices

1. **Proxy Location Matching**: Timezone và geolocation nên khớp với vị trí proxy
2. **Randomization**: Mỗi profile nên có fingerprint khác nhau
3. **Mobile First**: Dùng mobile resolution vì các trang game thường optimize cho mobile
4. **WebRTC Protection**: Luôn bật `altered` hoặc `disabled` để tránh leak IP
5. **Canvas/WebGL Noise**: Luôn bật để tránh fingerprinting

## Kiểm tra Fingerprint

Sau khi tạo profile, có thể test fingerprint tại:
- https://browserleaks.com/canvas
- https://browserleaks.com/webgl
- https://whoer.net
- https://iphey.com

## Lưu ý

- Hidemium API có thể không hỗ trợ tất cả các thông số
- Một số thông số có thể được Hidemium tự động generate
- Nên test profile trước khi dùng cho automation
