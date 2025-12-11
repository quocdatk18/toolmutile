# 🎛️ Hidemium Multi-Tool Dashboard

> Nền tảng quản lý tập trung cho nhiều automation tools

## 📋 Tổng Quan

Hidemium Multi-Tool Dashboard là một nền tảng mở rộng được thiết kế để quản lý nhiều automation tools khác nhau từ một giao diện duy nhất. Tất cả tools đều chia sẻ:

- 🔑 **API Key Manager** - Quản lý API key chung
- 📋 **Profile Manager** - Quản lý Hidemium profiles
- 🎯 **Centralized Dashboard** - Giao diện điều khiển tập trung

## 🏗️ Kiến Trúc

```
hidemium-multi-tool/
├── core/                    # Core modules (shared)
│   ├── api-key-manager.js  # Quản lý API key
│   ├── profile-manager.js  # Quản lý profiles
│   └── hidemium-api.js     # Hidemium API wrapper
│
├── tools/                   # Các tools riêng biệt
│   └── nohu-tool/          # NOHU Auto Tool
│       ├── extension/      # Extension code
│       └── automation.js   # Logic automation
│
├── dashboard/               # Main Dashboard
│   ├── index.html          # UI chính
│   ├── dashboard.js        # Logic chung
│   ├── styles.css          # Styles
│   ├── server.js           # Backend server
│   └── tools-ui/           # UI cho từng tool
│
└── config/                  # Configuration
    ├── settings.json       # Settings tổng
    └── tools.json          # Danh sách tools
```

## 🚀 Cài Đặt

### Yêu Cầu

- ✅ Node.js 18+
- ✅ Hidemium Browser
- ✅ Windows 10/11

### Bước 1: Clone/Download

```bash
git clone <repository-url>
cd hidemium-multi-tool
```

### Bước 2: Install Dependencies

```bash
npm install
```

### Bước 3: Start Dashboard

```bash
npm run dashboard
```

Hoặc double-click file `START_DASHBOARD.bat`

### Bước 4: Mở Dashboard

Truy cập: http://localhost:3000

## 🎯 Tools Hiện Có

### 1. NOHU Auto Tool 🎰

**Status:** ✅ Active

**Features:**
- Đăng ký tài khoản tự động
- Đăng nhập tự động
- Thêm ngân hàng tự động
- Check khuyến mãi tự động
- Giải captcha tự động

**Sites hỗ trợ:**
- Go99
- NOHU
- TT88
- MMOO
- 789P
- 33WIN
- 88VV

## 📖 Hướng Dẫn Sử Dụng

### 1. Setup API Key

1. Mở Dashboard
2. Sidebar → API Key Manager
3. Nhập API Key từ autocaptcha.pro
4. Click "Lưu"
5. Click "Kiểm Tra" để xem số dư

### 2. Quản Lý Profiles

1. Sidebar → Profile Manager
2. Click "Tải Profiles" để load từ Hidemium
3. Click "Tạo Profile Mới" để tạo profile
4. Chọn profile để sử dụng

### 3. Sử Dụng Tool

1. Click vào tool card (ví dụ: NOHU Auto Tool)
2. Điền thông tin cần thiết
3. Chọn sites muốn chạy
4. Click "Chạy"

## 🔧 Thêm Tool Mới

### Bước 1: Tạo Tool Folder

```bash
mkdir tools/new-tool
cd tools/new-tool
```

### Bước 2: Tạo Files

```
tools/new-tool/
├── extension/           # Extension code (nếu cần)
├── automation.js        # Logic automation
├── config.json          # Config riêng
└── README.md
```

### Bước 3: Đăng Ký Tool

Thêm vào `config/tools.json`:

```json
{
  "id": "new-tool",
  "name": "New Tool",
  "icon": "🎯",
  "description": "Tool description",
  "version": "1.0.0",
  "status": "active",
  "requiresApiKey": true,
  "requiresExtension": false,
  "automationScript": "tools/new-tool/automation.js",
  "uiPath": "dashboard/tools-ui/new-tool.html"
}
```

### Bước 4: Tạo UI

Tạo file `dashboard/tools-ui/new-tool.html`

### Bước 5: Restart Dashboard

```bash
npm run dashboard
```

## 🎨 Shared Resources

### API Key Manager

```javascript
// Save API key
apiKeyManager.save('your-api-key');

// Get API key
const key = apiKeyManager.get();

// Check balance
const result = await apiKeyManager.checkBalance();
```

### Profile Manager

```javascript
// Load all profiles
await profileManager.loadAll();

// Create profile
await profileManager.create(config);

// Start profile
await profileManager.start(uuid);

// Stop profile
await profileManager.stop(uuid);

// Delete profile
await profileManager.delete(uuid);
```

### Hidemium API

```javascript
// Check connection
await hidemiumAPI.checkConnection();

// Get all profiles
await hidemiumAPI.getAllProfiles();

// Run automation
await hidemiumAPI.runAutomation(profileId, config);
```

## 📊 Features

### ✅ Hiện Có

- [x] Multi-tool architecture
- [x] Shared API key management
- [x] Shared profile management
- [x] NOHU Auto Tool
- [x] Modern UI/UX
- [x] Toast notifications
- [x] Profile creation modal
- [x] Tool cards

### 🔜 Sắp Có

- [ ] Tool marketplace
- [ ] Tool auto-update
- [ ] Statistics dashboard
- [ ] Scheduling automation
- [ ] Multi-language support
- [ ] Dark mode

## 🐛 Troubleshooting

### Dashboard không kết nối được Hidemium

**Giải pháp:**
1. Mở Hidemium Browser
2. Vào Settings → Local API
3. Bật "Enable Local API"
4. Restart Dashboard

### API Key không hoạt động

**Giải pháp:**
1. Kiểm tra API key đúng format
2. Kiểm tra số dư tài khoản
3. Thử lại sau vài phút

### Profile không load được

**Giải pháp:**
1. Kiểm tra Hidemium đang chạy
2. Kiểm tra Local API đã bật
3. Restart Hidemium
4. Click "Tải Profiles" lại

## 📝 License

MIT License

## 👥 Contributors

- Your Name

## 📧 Support

- Email: your@email.com

---

**Made with ❤️ for automation enthusiasts**
