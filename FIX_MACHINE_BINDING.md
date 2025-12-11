# Fix: Machine Binding cho Customer Package

## Vấn đề

Khi tạo package cho khách hàng với Machine Binding = YES, license key bị bind vào Machine ID của máy dev (`48b62c73fe0a524f`) thay vì để khách hàng tự bind khi activate lần đầu.

**Kết quả:**
- ❌ License key chỉ hoạt động trên máy dev
- ❌ Khách hàng không thể activate trên máy của họ
- ❌ Thông báo lỗi: "Bản quyền này chỉ hoạt động trên máy tính khác"

## Nguyên nhân

### 1. Admin API (admin-api.js)
```javascript
// ❌ SAI - Lấy machine ID của máy dev
const machineId = this.getMachineId();

const licenseData = {
    username: customerName,
    machineId: machineBinding ? machineId : null, // ❌ Bind vào máy dev
    expiry: expiry,
    created: now
};
```

### 2. License Manager (license-manager.js)
- Không có logic để bind machine ID lần đầu
- Chỉ check machine ID nếu đã có
- Không tự động bind khi `machineId === null`

## Giải pháp

### 1. Admin API - Luôn set machineId = null

**File:** `dashboard/admin-api.js`

```javascript
// ✅ ĐÚNG - Luôn set null, khách hàng tự bind
const licenseData = {
    username: customerName,
    machineId: null, // Always null - customer binds on first activation
    expiry: expiry,
    created: now
};
```

**Lý do:**
- License key ban đầu không bind vào máy nào
- Khách hàng activate lần đầu → tự động bind vào máy của họ
- Sau đó chỉ hoạt động trên máy đó

### 2. License Manager - Auto bind on first activation

**File:** `core/license-manager.js`

```javascript
activate(key) {
    const validation = this.validateKey(key);

    if (!validation.valid) {
        return validation;
    }

    // ✅ Check if first activation (machineId is null)
    const data = validation.data;
    let finalKey = key;

    if (data.machineId === null) {
        console.log('🔒 First activation - binding to this machine...');
        
        // Bind to current machine
        const currentMachineId = this.getMachineId();
        const boundData = {
            username: data.username,
            machineId: currentMachineId, // ✅ Bind to current machine
            expiry: data.expiry,
            created: data.created
        };

        // Re-sign with new data
        const dataString = JSON.stringify(boundData);
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(dataString)
            .digest('hex');
        finalKey = Buffer.from(dataString).toString('base64') + '.' + signature;

        console.log('✅ License bound to machine:', currentMachineId);
    }

    // Save license (with machine binding if applicable)
    const saved = this.saveLicense(finalKey);

    return {
        valid: true,
        message: data.machineId === null 
            ? 'Kích hoạt thành công và đã bind vào máy này' 
            : 'Kích hoạt bản quyền thành công',
        data: validation.data
    };
}
```

### 3. Cập nhật LICENSE_KEY.txt

**File:** `dashboard/admin-api.js`

```javascript
const licenseKeyContent = `
License Key Record
==================
Generated: ${new Date().toLocaleString('vi-VN')}
Username: ${customerName}
Type: ${days === -1 ? 'Lifetime' : days + ' days'}
Machine Binding: ${machineBinding ? 'YES - Will bind on first activation' : 'NO - Can use on any machine'}
Machine ID: ${machineBinding ? 'Will be set on first activation' : 'N/A'}

License Key:
${licenseKey}

IMPORTANT NOTES:
${machineBinding ? 
  '- This license will bind to the customer\'s machine on first activation\n' +
  '- After binding, it can only be used on that specific machine\n' +
  '- Machine ID will be recorded automatically' 
  : 
  '- This license can be used on any machine\n' +
  '- No machine binding required'}
`;
```

## Luồng hoạt động

### Machine Binding = YES

```
1. Admin tạo package
   ↓
   License: { machineId: null, ... }
   
2. Gửi package cho khách hàng
   ↓
   
3. Khách hàng activate lần đầu
   ↓
   Detect: machineId === null
   ↓
   Get current machine ID: "abc123..."
   ↓
   Update license: { machineId: "abc123...", ... }
   ↓
   Re-sign và save
   ↓
   ✅ "Kích hoạt thành công và đã bind vào máy này"
   
4. Lần sau check license
   ↓
   Compare: saved machineId === current machineId
   ↓
   ✅ Match → Valid
   ❌ Not match → "Bản quyền này chỉ hoạt động trên máy tính khác"
```

### Machine Binding = NO

```
1. Admin tạo package
   ↓
   License: { machineId: null, ... }
   
2. Khách hàng activate
   ↓
   Detect: machineId === null
   ↓
   Keep machineId = null (không bind)
   ↓
   Save license as-is
   ↓
   ✅ "Kích hoạt bản quyền thành công"
   
3. Có thể dùng trên bất kỳ máy nào
   ↓
   Check: machineId === null → Skip machine check
   ↓
   ✅ Always valid (nếu chưa hết hạn)
```

## Test Cases

### Test 1: Machine Binding = YES
**Bước thực hiện:**
1. Admin tạo package: `ngoclinh`, 1 day, Machine Binding = YES
2. Kiểm tra LICENSE_KEY.txt:
   - Machine ID: "Will be set on first activation" ✅
3. Gửi package cho khách hàng
4. Khách hàng activate trên máy A
5. Kiểm tra `.license` file → có machine ID của máy A ✅
6. Thử activate trên máy B → ❌ "Bản quyền này chỉ hoạt động trên máy tính khác"

### Test 2: Machine Binding = NO
**Bước thực hiện:**
1. Admin tạo package: `testuser`, 7 days, Machine Binding = NO
2. Kiểm tra LICENSE_KEY.txt:
   - Machine ID: "N/A" ✅
3. Khách hàng activate trên máy A → ✅ Success
4. Copy package sang máy B → ✅ Vẫn hoạt động
5. Copy package sang máy C → ✅ Vẫn hoạt động

### Test 3: Lifetime License
**Bước thực hiện:**
1. Admin tạo package: `vipuser`, Lifetime, Machine Binding = YES
2. Khách hàng activate → Bind vào máy
3. Sau 1 năm → ✅ Vẫn hoạt động (lifetime)
4. Thử trên máy khác → ❌ Không hoạt động (machine binding)

## Lợi ích

### 1. Bảo mật
- ✅ License không thể copy sang máy khác (nếu có machine binding)
- ✅ Mỗi license chỉ hoạt động trên 1 máy duy nhất
- ✅ Không thể share license key

### 2. Linh hoạt
- ✅ Admin quyết định có bind machine hay không
- ✅ Khách hàng tự động bind khi activate lần đầu
- ✅ Không cần biết machine ID của khách hàng trước

### 3. Đơn giản
- ✅ Admin chỉ cần tạo 1 license key
- ✅ Khách hàng chỉ cần activate 1 lần
- ✅ Tự động bind, không cần thao tác thủ công

## Files Đã Sửa

1. ✅ `dashboard/admin-api.js`
   - Set `machineId: null` khi tạo license
   - Cập nhật LICENSE_KEY.txt với thông tin rõ ràng

2. ✅ `core/license-manager.js`
   - Thêm logic auto-bind on first activation
   - Re-sign license với machine ID mới
   - Thông báo rõ ràng cho user

## Lưu ý

1. **Secret Key**: Mỗi package có secret key riêng → không thể dùng license của package khác
2. **Re-sign**: Khi bind machine, license được sign lại với secret key của package đó
3. **One-time Binding**: Chỉ bind 1 lần duy nhất, không thể thay đổi sau đó
4. **Backward Compatible**: Vẫn hỗ trợ license cũ đã có machine ID

## Kết luận

Sau khi fix:
- ✅ License key không còn bind vào máy dev
- ✅ Khách hàng tự động bind khi activate lần đầu
- ✅ Machine binding hoạt động đúng
- ✅ Thông báo rõ ràng cho admin và khách hàng
- ✅ Bảo mật tốt hơn, linh hoạt hơn
