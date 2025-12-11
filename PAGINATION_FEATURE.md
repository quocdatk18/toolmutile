# Pagination Feature - Results Table

## Vấn đề

Bảng kết quả bị ẩn khi có nhiều dữ liệu:
- ❌ Hiển thị tất cả results → table quá dài
- ❌ Scroll trong table → khó xem
- ❌ UI cha có height cố định → bị tràn
- ❌ Không biết có bao nhiêu kết quả

## Giải pháp: Pagination

### 1. HTML - Pagination Controls

```html
<div class="pagination-controls" id="paginationControls">
    <!-- Info: Hiển thị 1-20 / 100 kết quả -->
    <div class="pagination-info">
        Hiển thị <span id="pageStart">0</span>-<span id="pageEnd">0</span> / 
        <span id="totalResults">0</span> kết quả
    </div>
    
    <!-- Buttons: First, Prev, Next, Last -->
    <div class="pagination-buttons">
        <button onclick="goToFirstPage()">⏮️ Đầu</button>
        <button onclick="goToPrevPage()">◀️ Trước</button>
        <span>Trang <span id="currentPage">1</span> / <span id="totalPages">1</span></span>
        <button onclick="goToNextPage()">Sau ▶️</button>
        <button onclick="goToLastPage()">Cuối ⏭️</button>
    </div>
    
    <!-- Page size selector -->
    <div class="pagination-size">
        <label>Hiển thị:</label>
        <select id="pageSize" onchange="changePageSize()">
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
            <option value="100">100</option>
        </select>
    </div>
</div>
```

### 2. CSS - Styling

```css
.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: #f7fafc;
    border-top: 2px solid #e2e8f0;
    gap: 15px;
    flex-wrap: wrap;
}

.pagination-info {
    font-size: 14px;
    color: #4a5568;
    font-weight: 500;
}

.pagination-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pagination-buttons .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### 3. JavaScript - Logic

**State:**
```javascript
let currentPage = 1;
let pageSize = 20;
let totalResults = 0;
let allResultsKeys = []; // Store all sorted keys
```

**Refresh Table with Pagination:**
```javascript
function refreshResultsTable() {
    // Sort all results
    const sortedKeys = Object.keys(resultsData).sort(...);
    allResultsKeys = sortedKeys;
    totalResults = sortedKeys.length;
    
    // Calculate pagination
    const totalPages = Math.ceil(totalResults / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalResults);
    
    // Get current page items only
    const pageKeys = sortedKeys.slice(startIndex, endIndex);
    
    // Update UI
    updatePaginationUI(startIndex, endIndex, totalPages);
    
    // Display only current page
    pageKeys.forEach(key => {
        // Render row...
    });
}
```

**Navigation Functions:**
```javascript
function goToFirstPage() {
    currentPage = 1;
    refreshResultsTable();
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        refreshResultsTable();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(totalResults / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        refreshResultsTable();
    }
}

function goToLastPage() {
    const totalPages = Math.ceil(totalResults / pageSize);
    currentPage = totalPages;
    refreshResultsTable();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1; // Reset to first page
    refreshResultsTable();
}
```

**Update UI:**
```javascript
function updatePaginationUI(startIndex, endIndex, totalPages) {
    // Show/hide controls
    if (totalResults === 0) {
        paginationControls.style.display = 'none';
        return;
    }
    paginationControls.style.display = 'flex';
    
    // Update info
    document.getElementById('pageStart').textContent = startIndex + 1;
    document.getElementById('pageEnd').textContent = endIndex;
    document.getElementById('totalResults').textContent = totalResults;
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    // Disable buttons at boundaries
    document.getElementById('btnFirst').disabled = currentPage === 1;
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage === totalPages;
    document.getElementById('btnLast').disabled = currentPage === totalPages;
}
```

## Features

### 1. Page Navigation
- **First (⏮️)**: Về trang đầu
- **Prev (◀️)**: Trang trước
- **Next (▶️)**: Trang sau
- **Last (⏭️)**: Trang cuối

### 2. Page Info
```
Hiển thị 1-20 / 150 kết quả
Trang 1 / 8
```

### 3. Page Size
- 10 items/page
- 20 items/page (default)
- 50 items/page
- 100 items/page

### 4. Auto-hide
- Ẩn pagination khi không có kết quả
- Hiện pagination khi có kết quả

### 5. Button States
- Disable "First" và "Prev" ở trang đầu
- Disable "Next" và "Last" ở trang cuối

## Responsive Design

```css
@media (max-width: 768px) {
    .pagination-controls {
        flex-direction: column;
        gap: 10px;
    }
    
    .pagination-buttons {
        width: 100%;
        justify-content: center;
    }
}
```

## Examples

### Example 1: 150 results, page size 20

**Page 1:**
```
Hiển thị 1-20 / 150 kết quả
Trang 1 / 8
[⏮️ Đầu] [◀️ Trước] [Sau ▶️] [Cuối ⏭️]
```
- First, Prev: disabled
- Next, Last: enabled

**Page 4:**
```
Hiển thị 61-80 / 150 kết quả
Trang 4 / 8
[⏮️ Đầu] [◀️ Trước] [Sau ▶️] [Cuối ⏭️]
```
- All buttons: enabled

**Page 8 (last):**
```
Hiển thị 141-150 / 150 kết quả
Trang 8 / 8
[⏮️ Đầu] [◀️ Trước] [Sau ▶️] [Cuối ⏭️]
```
- First, Prev: enabled
- Next, Last: disabled

### Example 2: Change page size

**Before (20/page):**
```
150 results → 8 pages
Page 1: 1-20
```

**After (50/page):**
```
150 results → 3 pages
Page 1: 1-50
```

## Benefits

### 1. Performance
- ✅ Chỉ render items trên trang hiện tại
- ✅ Không render tất cả 100+ items
- ✅ DOM nhỏ hơn → render nhanh hơn

### 2. UX
- ✅ Dễ xem, không bị overwhelm
- ✅ Biết có bao nhiêu kết quả
- ✅ Navigate dễ dàng
- ✅ Tùy chỉnh số items/page

### 3. UI
- ✅ Không bị tràn
- ✅ Fit trong height cố định
- ✅ Scroll ít hơn
- ✅ Đẹp, professional

### 4. Maintainability
- ✅ Code rõ ràng, dễ hiểu
- ✅ Dễ customize (page size, styling)
- ✅ Dễ extend (search, filter)

## Integration với Features khác

### 1. Select All
```javascript
// Select all on current page only
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        if (!cb.disabled) {
            cb.checked = checkbox.checked;
        }
    });
}
```

### 2. Delete Selected
```javascript
// Delete selected items (across all pages)
async function deleteSelectedResults() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    // ... delete logic ...
    
    // After delete, stay on current page if possible
    const totalPages = Math.ceil(totalResults / pageSize);
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    refreshResultsTable();
}
```

### 3. Auto-refresh
```javascript
// Refresh every 5s, maintain current page
setInterval(() => {
    loadResultsFromServer(); // Load data
    // refreshResultsTable() will be called
    // Current page is maintained
}, 5000);
```

## Testing

### Test case 1: Empty results
**Expected:**
- Pagination hidden
- Show "Chưa có kết quả"

### Test case 2: 15 results, page size 20
**Expected:**
- Show all 15 results
- Pagination: "Hiển thị 1-15 / 15 kết quả"
- Page: "Trang 1 / 1"
- All navigation buttons disabled

### Test case 3: 100 results, page size 20
**Expected:**
- Show 20 results
- Pagination: "Hiển thị 1-20 / 100 kết quả"
- Page: "Trang 1 / 5"
- First, Prev: disabled
- Next, Last: enabled

### Test case 4: Navigate to page 3
**Expected:**
- Show results 41-60
- Pagination: "Hiển thị 41-60 / 100 kết quả"
- Page: "Trang 3 / 5"
- All buttons enabled

### Test case 5: Change page size to 50
**Expected:**
- Reset to page 1
- Show results 1-50
- Pagination: "Hiển thị 1-50 / 100 kết quả"
- Page: "Trang 1 / 2"

## Files đã sửa

1. **dashboard/tools-ui/nohu-tool.html**
   - Thêm pagination controls HTML
   - Thêm pagination state variables
   - Update refreshResultsTable() với pagination logic
   - Thêm navigation functions

2. **dashboard/tools-ui/nohu-tool.css**
   - Thêm pagination controls styling
   - Responsive design

## Kết luận

Pagination feature:
- ✅ Hiển thị chính xác, không bị ẩn
- ✅ Performance tốt hơn (chỉ render current page)
- ✅ UX tốt hơn (dễ navigate, biết tổng số)
- ✅ Fit trong UI cố định height
- ✅ Professional, đẹp
- ✅ Dễ customize và extend

**Default:** 20 items/page, có thể thay đổi 10/20/50/100
