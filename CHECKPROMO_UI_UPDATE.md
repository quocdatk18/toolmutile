# Check Promo UI Update

## Thay Đổi

### Trước
Tab "Check KM" chỉ có:
- Mô tả
- Button "Bắt Đầu Check"

### Sau
Tab "Check KM" có:
- Profile Carousel (chọn profile)
- Username Input (nhập tên đăng nhập)
- Button "Bắt Đầu Check"

## UI Structure

```
Tab "Check KM"
├── Profile Selection
│   ├── Profile Carousel (left/right buttons)
│   └── Profile Cards
├── Username Input
│   └── Input field: "Nhập tên đăng nhập"
└── Check Button
    └── "▶️ Bắt Đầu Check"
```

## HTML Changes

### File: `dashboard/tools-ui/vip/vip.html`

#### 1. Tab Content (dòng 311-340)
```html
<div class="tab-content" id="tab-promo" style="display: none;">
    <!-- Profile Selection Section -->
    <div class="form-section">
        <h3 style="margin: 0;">📋 Chọn Profile</h3>
        <!-- Profile Carousel -->
        <div class="profile-carousel-wrapper">
            <div class="profile-carousel-container">
                <button class="carousel-btn carousel-prev"
                    onclick="scrollProfileCarousel('promo', -1)">‹</button>
                <div class="profile-carousel" id="promoProfileCarousel">
                    <div class="profile-carousel-empty">
                        <p>⏳ Đang tải profiles...</p>
                    </div>
                </div>
                <button class="carousel-btn carousel-next"
                    onclick="scrollProfileCarousel('promo', 1)">›</button>
            </div>
        </div>
    </div>

    <!-- Username Input Section -->
    <div class="form-section">
        <h3 style="margin: 0 0 15px 0;">👤 Tên Đăng Nhập</h3>
        <input type="text" id="promoUsername" placeholder="Nhập tên đăng nhập" class="form-input"
            style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 14px;">
    </div>

    <!-- Check Promo Button -->
    <div class="form-section">
        <button class="btn btn-primary" onclick="startCheckPromo()"
            style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); padding: 12px; font-size: 14px; font-weight: 600;">
            ▶️ Bắt Đầu Check
        </button>
    </div>
</div>
```

#### 2. runCheckPromo() Function (dòng 546-590)
```javascript
async function runCheckPromo() {
    const category = document.querySelector('input[name="vipCategory"]:checked').value;
    const selectedSites = Array.from(document.querySelectorAll('#vipSitesGrid .site-check:checked'))
        .map(cb => cb.getAttribute('data-name'));
    const username = document.getElementById('promoUsername').value;

    if (selectedSites.length === 0) {
        alert('❌ Vui lòng chọn ít nhất 1 site');
        return;
    }

    if (!username || username.trim() === '') {
        alert('❌ Vui lòng nhập tên đăng nhập');
        return;
    }

    if (!selectedProfile) {
        alert('❌ Vui lòng chọn profile');
        return;
    }

    console.log('🎁 Starting Check Promo:', { category, sites: selectedSites, username });

    try {
        const response = await fetch('/api/vip-automation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                sites: selectedSites,
                profile: selectedProfile,
                profileData: { username },
                mode: 'promo'
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Check promo completed for ${selectedSites.length} sites`);
            closeFormModal();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('❌ Check Promo Error:', error);
        alert(`❌ Error: ${error.message}`);
    }
}
```

## Flow

```
User clicks "Check KM" tab
    ↓
Chọn Profile từ carousel
    ↓
Chọn Category (OKVIP, ABCVIP, etc.)
    ↓
Chọn Sites
    ↓
Nhập Username
    ↓
Click "Bắt Đầu Check"
    ↓
Validate:
  - Sites selected? ✓
  - Username entered? ✓
  - Profile selected? ✓
    ↓
Send to server:
  {
    category: "okvip",
    sites: ["Hi88", "OKVip2"],
    profile: { ... },
    profileData: { username: "..." },
    mode: "promo"
  }
    ↓
Server runs checkPromoStep() for each site
    ↓
Return results
```

## Validation

- ✅ Sites must be selected
- ✅ Username must be entered
- ✅ Profile must be selected

## Notes

- Profile carousel reuses same component as "Auto" tab
- Username input is simple text field
- Category and sites selection same as "Auto" tab
- Only difference: no form fields, just username input
