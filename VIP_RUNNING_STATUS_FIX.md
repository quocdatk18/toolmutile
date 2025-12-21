# Fix: VIP Hiển Thị Running Card Ngay Khi Bấm CHẠY

## Vấn Đề
- Khi bấm nút "CHẠY" trên VIP, **không hiển thị running card** trên profile
- Chỉ hiển thị thông báo "Đã gửi tới server" **sau khi** automation hoàn thành
- Khác với Nohu - Nohu hiển thị running card **ngay lập tức**

## Nguyên Nhân
- VIP **đánh dấu profile là running** ở local (UI), nhưng **không gửi trạng thái tới server**
- Server không biết profile đang chạy, nên không hiển thị running card
- Chỉ khi automation hoàn thành, VIP mới gửi trạng thái "completed" tới server

## Giải Pháp

### 1. Thêm Hàm Gửi Trạng Thái Running
**File**: `dashboard/tools-ui/vip/vip.html`

```javascript
// Helper: Send running status to server immediately
async function sendRunningStatusToServer(profileId, profileName, username, sites, mode = 'auto') {
    try {
        const dashboardPort = window.location.port || 3000;
        const response = await fetch(`http://localhost:${dashboardPort}/api/automation/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profileId: profileId,
                profileName: profileName,
                username: username,
                status: 'running',
                sites: sites.map(s => ({ name: s })),
                mode: mode,
                timestamp: Date.now()
            })
        });

        if (response.ok) {
            console.log('📤 Sent running status to server');
        }
    } catch (error) {
        console.warn('⚠️ Error sending running status:', error.message);
    }
}
```

### 2. Gửi Trạng Thái Running Ngay Khi Bấm CHẠY

#### Trong `runAutoAutomation()`:
```javascript
// 🔥 Send running status to server IMMEDIATELY (before sending automation request)
await sendRunningStatusToServer(selectedProfile.uuid, selectedProfile.name, profileData.username, selectedSites, 'auto');

// Sau đó mới gửi automation request
const response = await fetch('/api/vip-automation/run', { ... });
```

#### Trong `runCheckPromo()`:
```javascript
// 🔥 Send running status to server IMMEDIATELY (before sending automation request)
await sendRunningStatusToServer(selectedProfile.uuid, selectedProfile.name, username, selectedSites, 'promo');

// Sau đó mới gửi automation request
const response = await fetch('/api/vip-automation/run', { ... });
```

## Luồng Hoạt Động

### Trước (Cũ):
1. Bấm "CHẠY"
2. Đánh dấu profile running ở local
3. Gửi automation request tới server
4. **Chờ automation hoàn thành**
5. Gửi trạng thái "completed" tới server
6. UI hiển thị running card (quá muộn!)

### Sau (Mới):
1. Bấm "CHẠY"
2. Đánh dấu profile running ở local
3. **Gửi trạng thái "running" tới server NGAY**
4. UI hiển thị running card **ngay lập tức** ✅
5. Gửi automation request tới server
6. Automation chạy...
7. Gửi trạng thái "completed" tới server
8. UI cập nhật kết quả

## Lợi Ích
1. **Running card hiển thị ngay** - Người dùng biết automation đang chạy
2. **Giống Nohu** - Trải nghiệm nhất quán giữa 2 tool
3. **Không chặn UI** - Gửi trạng thái không chặn automation
4. **Rõ ràng hơn** - Người dùng thấy tiến trình chạy

## Kiểm Tra
1. Chạy VIP automation
2. **Ngay lập tức** sẽ thấy running card trên profile
3. Card sẽ hiển thị "🚀 Đang chạy..." với thời gian
4. Khi hoàn thành, card sẽ biến mất và hiển thị kết quả
