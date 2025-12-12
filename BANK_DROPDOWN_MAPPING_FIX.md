# Fix Bank Dropdown Mapping - Chọn Ngân Hàng Chính Xác

## 🚨 Vấn đề
Từ log automation, có 2 vấn đề chính:

### 1. Lỗi "Target closed" và "detached Frame"
- Tabs bị đóng hoặc mất kết nối trong quá trình automation
- `TargetCloseError: Protocol error (Runtime.callFunctionOn): Target closed`
- `Error: Attempted to use detached Frame`

### 2. Logic chọn ngân hàng không chính xác ⚠️
**VietQR API trả về:** `Vietcombank`, `Techcombank`, `BIDV`
**Dropdown trang web có:** `VIETCOMBANK`, `TECHCOMBANK`, `BIDV BANK`

→ Logic mapping không khớp → Không chọn được bank → Form không submit được

## ✅ Giải pháp

### 1. Tạo Bank Name Mapping chính xác
```javascript
// File: tools/nohu-tool/extension/banks.js
const BANK_NAME_MAPPING = {
    // VietQR API name -> Dropdown option text
    'Vietcombank': 'VIETCOMBANK',
    'Techcombank': 'TECHCOMBANK', 
    'BIDV': 'BIDV BANK',
    'VietinBank': 'VIETINBANK',
    'Agribank': 'AGRIBANK',
    'ACB': 'ACB BANK',
    'MB': 'MBBANK',
    'TPBank': 'TPBANK',
    'VPBank': 'VPBANK',
    // ... 40+ banks mapping
};
```

### 2. Thêm mapping functions
```javascript
function mapBankName(vietQRBankName) {
    // Exact match trước
    if (BANK_NAME_MAPPING[vietQRBankName]) {
        return BANK_NAME_MAPPING[vietQRBankName];
    }
    
    // Case-insensitive search
    // Partial match fallback
    // Return original nếu không tìm thấy
}

function findBankOption(mappedBankName) {
    // Tìm trong mat-option elements
    // Exact match trước, partial match sau
    // Return element hoặc null
}
```

### 3. Sửa logic trong content.js
```javascript
// Trước: Tìm kiếm không chính xác
const searchName = bankName.toUpperCase();
// text.includes(searchName) → Có thể match sai

// Sau: Sử dụng mapping chính xác
const mappedBankName = window.mapBankName(bankName);
const searchName = mappedBankName.toUpperCase();

// Exact match trước, partial match sau
const isExactMatch = text === searchName;
const isPartialMatch = text.includes(searchName);
```

### 4. Fix lỗi "Cannot read properties of undefined"
```javascript
// Trước: Không kiểm tra bankResult
if (bankResult.success) { // ❌ Lỗi nếu bankResult = undefined

// Sau: Kiểm tra an toàn
if (bankResult && typeof bankResult === 'object' && bankResult.success) {
```

## 📊 Bank Mapping Examples

| VietQR API | Dropdown Text | Status |
|------------|---------------|---------|
| `Vietcombank` | `VIETCOMBANK` | ✅ Mapped |
| `Techcombank` | `TECHCOMBANK` | ✅ Mapped |
| `BIDV` | `BIDV BANK` | ✅ Mapped |
| `ACB` | `ACB BANK` | ✅ Mapped |
| `MB` | `MBBANK` | ✅ Mapped |
| `VietinBank` | `VIETINBANK` | ✅ Mapped |

## 🔧 Files Modified

1. **`tools/nohu-tool/extension/banks.js`**
   - Thêm `BANK_NAME_MAPPING` với 40+ banks
   - Thêm `mapBankName()` và `findBankOption()` functions

2. **`tools/nohu-tool/extension/content.js`**
   - Sửa logic tìm bank trong dropdown
   - Sử dụng mapping chính xác thay vì includes()

3. **`tools/nohu-tool/auto-sequence-safe.js`**
   - Fix lỗi "Cannot read properties of undefined"
   - Thêm null checking cho bankResult

## 🧪 Test Results Expected

**Trước:**
- ❌ Bank không được chọn đúng
- ❌ Form không submit được  
- ❌ Add bank fail

**Sau:**
- ✅ Bank được map chính xác
- ✅ Dropdown chọn đúng option
- ✅ Form submit thành công
- ✅ Add bank success

## 🚀 Next Steps

1. Test lại automation để xem bank có được chọn đúng không
2. Kiểm tra log xem có còn "Bank not found in dropdown" không
3. Verify form có submit thành công không
4. Nếu vẫn có lỗi, có thể cần thêm mapping cho banks khác