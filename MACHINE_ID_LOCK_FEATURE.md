# Machine ID Lock Feature

## 🔒 Mục Đích
Bảo mật Machine ID của khách hàng bằng cách **khóa tự động** sau lần đầu nhập, tránh thay đổi nhầm lẫn hoặc bị hack.

## ✨ Tính Năng

### 1. Auto-Lock Machine ID
- 🔒 **Tự động khóa** sau lần đầu nhập Machine ID thật (không phải placeholder)
- ⚠️ **Không thể thay đổi** sau khi đã khóa
- 🛡️ **Bảo vệ khỏi** thay đổi nhầm lẫn hoặc tấn công

### 2. Visual Indicators
- 🔒 **Icon khóa** hiển thị bên cạnh Machine ID đã khóa
- ⚠️ **Warning message** khi cố gắng sửa Machine ID đã khóa
- 🎨 **Disabled field** với màu xám khi Machine ID bị khóa

### 3. Admin Override (Trường hợp đặc biệt)
- 🔓 **Unlock API** cho admin trong trường hợp cần thiết
- 📝 **Bắt buộc lý do** khi unlock (ít nhất 10 ký tự)
- 📊 **Log đầy đủ** thời gian và lý do unlock

## 🔄 Workflow

### Lần Đầu Tiên (Import từ Packages)
```
1. Import customers từ packages
   → Machine ID = "PLACEHOLDER_MACHINE_ID"
   → machineIdLocked = false

2. Khách hàng gửi Machine ID thật
   → Admin sửa customer
   → Nhập Machine ID thật
   → Tự động khóa: machineIdLocked = true
```

### Các Lần Sau
```
1. Admin cố gắng sửa Machine ID
   → Kiểm tra: machineIdLocked = true?
   → Nếu true: Hiển thị lỗi + disable field
   → Nếu false: Cho phép sửa
```

### Trường Hợp Đặc Biệt (Admin Override)
```
1. Admin cần thay đổi Machine ID
   → Gọi API unlock với lý do
   → machineIdLocked = false
   → Có thể sửa Machine ID
   → Tự động khóa lại sau khi sửa
```

## 🏗️ Technical Implementation

### 1. Data Structure
```javascript
// customer-machines.json
{
  "CUSTOMER_NAME": {
    "customerName": "CUSTOMER_NAME",
    "machineId": "48b62c73fe0a524f",
    "machineIdLocked": true,           // ← New field
    "machineIdSetAt": "2025-01-10...", // ← New field
    "machineIdUnlockedAt": null,       // ← New field (if unlocked)
    "unlockReason": null,              // ← New field (unlock reason)
    "notes": "Customer notes",
    "createdAt": "2025-01-10...",
    "updatedAt": "2025-01-10...",
    "licenseHistory": [...]
  }
}
```

### 2. Backend Logic
```javascript
// CustomerMachineManager.addOrUpdateCustomer()
if (existingCustomer) {
    const isPlaceholder = existingCustomer.machineId === 'PLACEHOLDER_MACHINE_ID';
    const isMachineIdLocked = !isPlaceholder && existingCustomer.machineIdLocked;
    
    if (isMachineIdLocked && machineId !== existingCustomer.machineId) {
        throw new Error('Machine ID đã được khóa và không thể thay đổi');
    }
    
    // Auto-lock when setting real Machine ID for first time
    if (isPlaceholder && machineId !== 'PLACEHOLDER_MACHINE_ID') {
        customer.machineIdLocked = true;
        customer.machineIdSetAt = now;
    }
}
```

### 3. Frontend UI
```javascript
// Edit Customer Modal
const isLocked = !isPlaceholder && currentCustomer.machineIdLocked;

if (isLocked) {
    machineIdField.disabled = true;
    machineIdField.style.background = '#f3f4f6';
    lockWarning.style.display = 'block';
}
```

### 4. API Endpoints
```javascript
// Normal update (with lock check)
POST /api/admin/customers
→ Throws error if trying to change locked Machine ID

// Admin override (unlock)
POST /api/admin/customers/:customerName/unlock-machine-id
→ Requires reason (min 10 chars)
→ Unlocks Machine ID temporarily
```

## 🛡️ Security Benefits

### 1. Prevent Accidental Changes
- ✅ Admin không thể nhầm lẫn sửa Machine ID
- ✅ Tránh copy/paste sai Machine ID
- ✅ UI rõ ràng khi Machine ID đã khóa

### 2. Prevent Malicious Changes
- 🛡️ Hacker không thể thay đổi Machine ID dễ dàng
- 🔒 Cần quyền admin + lý do để unlock
- 📊 Log đầy đủ mọi thay đổi

### 3. Data Integrity
- 💾 Machine ID luôn chính xác sau khi set
- 🔄 License key luôn tương ứng đúng máy
- 📋 Lịch sử thay đổi đầy đủ

## 🎯 User Experience

### Admin Experience
```
1. Import customers → Thấy "⚠️ Chưa có Machine ID"
2. Khách gửi Machine ID → Sửa customer → Nhập Machine ID
3. Lưu → Tự động khóa → Thấy "🔒" bên cạnh Machine ID
4. Lần sau sửa → Field bị disable + warning message
5. Tạo license → Hoạt động bình thường với Machine ID đã khóa
```

### Customer Experience
```
1. Nhận package → Gửi Machine ID cho admin
2. Admin nhập Machine ID → Tạo license key
3. Activate license → Hoạt động bình thường
4. Machine ID được bảo vệ → Không bị thay đổi nhầm
```

## 📊 States & Transitions

### Machine ID States
1. **PLACEHOLDER** (`PLACEHOLDER_MACHINE_ID`)
   - machineIdLocked = false
   - Có thể sửa thành Machine ID thật
   - Không thể tạo license

2. **LOCKED** (Real Machine ID + machineIdLocked = true)
   - Không thể sửa Machine ID
   - Có thể tạo license
   - Hiển thị 🔒 icon

3. **UNLOCKED** (Real Machine ID + machineIdLocked = false)
   - Có thể sửa Machine ID (tạm thời)
   - Tự động khóa lại sau khi sửa
   - Có log unlock reason

### State Transitions
```
PLACEHOLDER → (nhập Machine ID thật) → LOCKED
LOCKED → (admin unlock) → UNLOCKED
UNLOCKED → (sửa Machine ID) → LOCKED
```

## 🔧 Configuration

### Auto-Lock Settings
- ✅ **Enabled by default** - Tự động khóa khi nhập Machine ID thật
- ✅ **Immediate lock** - Khóa ngay sau khi lưu
- ✅ **Visual feedback** - Hiển thị trạng thái khóa rõ ràng

### Admin Override Settings
- 🔓 **Unlock API available** - Admin có thể unlock khi cần
- 📝 **Reason required** - Bắt buộc nhập lý do (min 10 chars)
- 📊 **Full logging** - Log đầy đủ thời gian và lý do

## 🧪 Test Cases

### 1. Normal Flow
- ✅ Import customer với placeholder Machine ID
- ✅ Sửa thành Machine ID thật → Tự động khóa
- ✅ Cố gắng sửa lại → Bị chặn với error message

### 2. Admin Override
- ✅ Unlock Machine ID với lý do hợp lệ
- ✅ Sửa Machine ID → Tự động khóa lại
- ❌ Unlock với lý do quá ngắn → Error

### 3. UI/UX
- ✅ Hiển thị 🔒 icon cho Machine ID đã khóa
- ✅ Disable field + warning khi cố sửa Machine ID khóa
- ✅ Reset form state khi mở modal mới

### 4. Security
- ❌ Không thể bypass lock qua API trực tiếp
- ✅ Log đầy đủ mọi unlock action
- ✅ Machine ID luôn chính xác sau khi lock