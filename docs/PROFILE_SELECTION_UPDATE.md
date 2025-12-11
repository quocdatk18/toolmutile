# Profile Selection Logic Update 🔄

## Thay đổi:

### Trước:
- ❌ Click vào profile card → Select profile (single selection)
- ❌ Click vào checkbox → Toggle checkbox (multi-selection)
- ❌ Có 2 loại selection: "selected" và "checked"
- ❌ Confusing UX

### Sau:
- ✅ Click vào profile card → Toggle checkbox (multi-selection)
- ✅ Click vào checkbox → Toggle checkbox (multi-selection)
- ✅ Chỉ có 1 loại selection: "checked"
- ✅ Consistent UX

## Chi tiết thay đổi:

### 1. **Removed "selected" state**
- Xóa logic `selectProfileInManagement()`
- Xóa CSS class `.profile-card-management.selected`
- Chỉ giữ lại `.profile-card-management.checked`

### 2. **Updated click behavior**
```javascript
// Trước:
card.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-actions-mgmt') && 
        !e.target.closest('.profile-checkbox-wrapper')) {
        selectProfileInManagement(profile.uuid); // Single select
    }
});

// Sau:
card.addEventListener('click', (e) => {
    if (e.target.closest('.profile-actions-mgmt')) {
        return; // Ignore button clicks
    }
    toggleProfileSelection(profile.uuid); // Multi-select
});
```

### 3. **Enhanced toggleProfileSelection()**
- Update tất cả checkboxes với cùng uuid (sidebar + management)
- Update tất cả cards với cùng uuid
- Update cả 2 counters: `updateSelectedCount()` và `updateMainSelectedCount()`

### 4. **Enhanced selectAll/deselectAll()**
- Update cả `.profile-item` (sidebar) và `.profile-card-management` (management)
- Update cả 2 counters

### 5. **Smart reload after bulk operations**
```javascript
// Detect which view is active and reload accordingly
const mgmtSection = document.getElementById('profileManagementSection');
if (mgmtSection && mgmtSection.style.display !== 'none') {
    await loadProfilesForManagement(); // Reload management view
} else {
    await loadProfiles(); // Reload sidebar
}
```

## Benefits:

✅ **Simpler logic** - Chỉ 1 loại selection thay vì 2

✅ **Better UX** - Click anywhere trên card để chọn/bỏ chọn

✅ **Consistent** - Behavior giống nhau ở mọi nơi

✅ **Intuitive** - Người dùng không cần phân biệt "select" vs "check"

✅ **Bulk operations friendly** - Dễ dàng chọn nhiều profiles

## Files modified:

1. **dashboard/dashboard.js**:
   - Removed `selectProfileInManagement()`
   - Updated card click handler
   - Enhanced `toggleProfileSelection()`
   - Enhanced `selectAllProfiles()` and `deselectAllProfiles()`
   - Smart reload in bulk operations

2. **dashboard/styles.css**:
   - Removed `.profile-card-management.selected` styles
   - Kept only `.profile-card-management.checked` styles

## Test scenarios:

1. ✅ Click vào profile card → Checkbox toggle
2. ✅ Click vào checkbox → Checkbox toggle
3. ✅ Click vào buttons (▶️⏹️🗑️) → Không toggle checkbox
4. ✅ Click "Chọn tất cả" → Tất cả cards được check
5. ✅ Click "Bỏ chọn" → Tất cả cards bỏ check
6. ✅ Start/Stop/Delete selected → Reload đúng view
7. ✅ Counter "Đã chọn: X" update đúng

## Usage:

1. Mở Profile Management
2. Click vào bất kỳ profile card nào để chọn/bỏ chọn
3. Hoặc click vào checkbox
4. Sử dụng bulk actions: Start, Stop, Xóa
5. Counter sẽ hiển thị số profiles đã chọn
