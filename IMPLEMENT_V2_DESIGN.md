# Implement V2 Design - Results First

## Step 1: Update CSS Reference

**File: `dashboard/tools-ui/nohu-tool.html`**

Thay đổi dòng load CSS:

```html
<!-- OLD -->
<link rel="stylesheet" href="tools-ui/nohu-tool.css">
<link rel="stylesheet" href="tools-ui/nohu-tool-fix.css">

<!-- NEW -->
<link rel="stylesheet" href="tools-ui/nohu-tool-v2.css">
```

## Step 2: Update HTML Structure

### 2.1. Wrap Results Section (line ~540)

**Before:**
```html
<!-- Right Column: Results Table (Sticky) -->
<div class="tool-right-column">
    <div class="form-section" id="resultsSection">
```

**After:**
```html
<!-- Results Full Width -->
<div class="results-full-width">
    <!-- Header with START button -->
    <div class="results-header">
        <h2>📊 Kết Quả Automation</h2>
        <div class="header-actions">
            <button class="btn btn-secondary btn-sm" onclick="refreshResults()">
                🔄 Tải Lại
            </button>
            <button class="btn btn-warning btn-sm" onclick="deleteSelectedResults()">
                🗑️ Xóa Đã Chọn
            </button>
            <button class="btn btn-start" onclick="openFormModal()">
                <span class="start-icon">▶️</span>
                <span class="start-text">START</span>
            </button>
        </div>
    </div>
    
    <div class="results-section" id="resultsSection">
```

### 2.2. Create Form Modal (add before closing `</div>` of nohu-tool-container)

```html
<!-- Form Modal -->
<div class="form-modal" id="formModal">
    <div class="modal-content-form">
        <!-- Modal Header -->
        <div class="modal-header-form">
            <h2>🎰 NOHU Auto Tool</h2>
            <button class="modal-close-form" onclick="closeFormModal()">×</button>
        </div>
        
        <!-- Tabs in Modal -->
        <div class="modal-tabs">
            <div class="modal-tab active" data-tab="auto" onclick="switchModalTab('auto')">
                🤖 Tự Động
            </div>
            <div class="modal-tab" data-tab="register" onclick="switchModalTab('register')">
                📝 Đăng Ký
            </div>
            <div class="modal-tab" data-tab="login" onclick="switchModalTab('login')">
                🔐 Đăng Nhập
            </div>
            <div class="modal-tab" data-tab="bank" onclick="switchModalTab('bank')">
                💳 Thêm Bank
            </div>
            <div class="modal-tab" data-tab="promo" onclick="switchModalTab('promo')">
                🎁 Check KM
            </div>
        </div>
        
        <!-- Modal Body - Move all tool-left-column content here -->
        <div class="modal-body-form">
            <!-- Copy all content from tool-left-column here -->
            <!-- Sites Selection, Profile Info, Bank Info, etc. -->
        </div>
        
        <!-- Modal Footer with Action Button -->
        <div class="modal-footer-form">
            <button class="btn btn-secondary" onclick="closeFormModal()">
                Đóng
            </button>
            <button class="btn btn-run-action" id="runActionButton" onclick="runModalAction()">
                <span id="runActionText">🚀 CHẠY TỰ ĐỘNG</span>
            </button>
        </div>
    </div>
</div>
```

## Step 3: Update JavaScript

### 3.1. Add Modal Functions (add after initToolUI)

```javascript
// Modal state
let currentModalTab = 'auto';

// Open Form Modal
window.openFormModal = function() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
};

// Close Form Modal
window.closeFormModal = function() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
};

// Switch Modal Tab
window.switchModalTab = function(tabName) {
    currentModalTab = tabName;
    
    // Update tab active state
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.modal-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const content = document.getElementById(`tab-${tabName}`);
    if (content) {
        content.classList.add('active');
    }
    
    // Update action button text
    updateActionButtonText(tabName);
};

// Update Action Button Text
function updateActionButtonText(tabName) {
    const buttonText = document.getElementById('runActionText');
    if (!buttonText) return;
    
    const texts = {
        'auto': '🚀 CHẠY TỰ ĐỘNG',
        'register': '📝 ĐĂNG KÝ NGAY',
        'login': '🔐 ĐĂNG NHẬP NGAY',
        'bank': '💳 THÊM BANK NGAY',
        'promo': '🎁 CHECK KM NGAY'
    };
    
    buttonText.textContent = texts[tabName] || 'START';
}

// Run Modal Action
window.runModalAction = function() {
    // Call appropriate function based on current tab
    switch(currentModalTab) {
        case 'auto':
            runAutoSequence();
            break;
        case 'register':
            runRegisterOnly();
            break;
        case 'login':
            runLoginOnly();
            break;
        case 'bank':
            runAddBankOnly();
            break;
        case 'promo':
            runCheckPromo();
            break;
    }
    
    // Close modal after starting
    closeFormModal();
};

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFormModal();
    }
});

// Close modal on background click
document.getElementById('formModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeFormModal();
    }
});
```

### 3.2. Update initTabSwitching (replace existing function)

```javascript
function initTabSwitching() {
    // Tab switching now handled by switchModalTab
    console.log('✅ Tab switching initialized for modal');
}
```

## Step 4: Move Content to Modal

### 4.1. Cut content from tool-left-column

Find this section (around line 100-500):
```html
<div class="tool-left-column">
    <!-- Sites Selection (Shared) -->
    <div class="form-section">
        ...
    </div>
    
    <!-- Tab Content: Auto -->
    <div class="tab-content active" id="tab-auto">
        ...
    </div>
    
    <!-- Other tabs... -->
</div>
```

### 4.2. Paste into modal-body-form

Move all that content into:
```html
<div class="modal-body-form">
    <!-- Paste here -->
</div>
```

## Step 5: Remove Old Elements

Delete these sections:
1. Old tabs-container (line ~92-102)
2. tool-left-column wrapper (keep content, move to modal)
3. tool-right-column wrapper (keep content, move to results-full-width)

## Step 6: Test

1. Refresh page
2. Should see: Results table full screen + START button
3. Click START → Modal opens with form
4. Select tab → Button text changes
5. Click "CHẠY" → Runs action and closes modal
6. ESC or click outside → Closes modal

## Expected Result

### Before:
```
┌─────────────────────────────────────┐
│ Form (left) │ Results (right)       │
│             │                       │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│ [START Button]                      │
│ Results Table (Full Width)          │
│                                     │
└─────────────────────────────────────┘

Click START →

┌─────────────────────────────────────┐
│ Modal: Form Input                   │
│ [Tabs] [Sites] [Profile] [Bank]    │
│                                     │
│ [Đóng] [CHẠY TỰ ĐỘNG]              │
└─────────────────────────────────────┘
```

## Benefits

1. ✅ Results chiếm full màn hình
2. ✅ Không bị scroll issue
3. ✅ Form gọn gàng trong modal
4. ✅ UX tốt, focus vào results
5. ✅ Dễ xem, dễ quản lý

## Troubleshooting

### Modal không mở
- Check: `openFormModal()` được gọi đúng
- Check: CSS `nohu-tool-v2.css` đã load

### Content bị lỗi layout
- Check: Đã move đúng content vào modal-body-form
- Check: Không còn CSS cũ conflict

### Button không chạy
- Check: `runModalAction()` đã được define
- Check: Functions (runAutoSequence, etc.) vẫn tồn tại

## Next Steps

Sau khi implement xong, có thể:
1. Thêm animation cho modal
2. Thêm loading state khi chạy action
3. Thêm validation trước khi chạy
4. Thêm preview data trước khi submit
