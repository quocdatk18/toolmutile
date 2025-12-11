/**
 * Script to migrate NOHU Tool HTML to V2 Design
 * This script will:
 * 1. Update CSS reference
 * 2. Move form content to modal
 * 3. Update JavaScript functions
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dashboard', 'tools-ui', 'nohu-tool.html');

console.log('📝 Reading HTML file...');
let html = fs.readFileSync(htmlPath, 'utf8');

// Backup original
const backupPath = htmlPath + '.backup-' + Date.now();
fs.writeFileSync(backupPath, html, 'utf8');
console.log(`✅ Backup created: ${backupPath}`);

// Step 1: Update CSS reference
console.log('\n🎨 Step 1: Updating CSS reference...');
html = html.replace(
    /<link rel="stylesheet" href="tools-ui\/nohu-tool\.css">\s*<link rel="stylesheet" href="tools-ui\/nohu-tool-fix\.css">/,
    '<link rel="stylesheet" href="tools-ui/nohu-tool-v2.css">'
);
console.log('✅ CSS reference updated');

// Step 2: Extract tool-left-column content
console.log('\n📦 Step 2: Extracting form content...');
const leftColumnMatch = html.match(/<!-- Left Column: Form Content -->([\s\S]*?)<!-- End Left Column -->/);
if (!leftColumnMatch) {
    console.error('❌ Could not find Left Column content');
    process.exit(1);
}
const leftColumnContent = leftColumnMatch[1];
console.log('✅ Form content extracted');

// Step 3: Remove old tabs-container and left column
console.log('\n🗑️ Step 3: Removing old structure...');
html = html.replace(/<!-- Tabs with START button -->[\s\S]*?<!-- End Left Column -->\s*/m, '');
console.log('✅ Old structure removed');

// Step 4: Update results section structure
console.log('\n🔄 Step 4: Updating results structure...');
html = html.replace(
    /<!-- Right Column: Results Table \(Sticky\) -->[\s\S]*?<div class="form-section" id="resultsSection">/m,
    `<!-- Results Full Width -->
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
        
        <div class="results-section" id="resultsSection">`
);
console.log('✅ Results structure updated');

// Step 5: Add modal before closing nohu-tool-container
console.log('\n➕ Step 5: Adding form modal...');
const modalHTML = `
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
            
            <!-- Modal Body -->
            <div class="modal-body-form">
${leftColumnContent}
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
`;

html = html.replace(
    /<!-- End Right Column -->\s*<\/div>\s*<!-- End nohu-tool-container -->/,
    `<!-- End Results Section -->
${modalHTML}
</div>
<!-- End nohu-tool-container -->`
);
console.log('✅ Modal added');

// Step 6: Add modal JavaScript functions
console.log('\n⚙️ Step 6: Adding modal JavaScript...');
const modalJS = `
    // ============================================
    // MODAL FUNCTIONS FOR V2 DESIGN
    // ============================================

    // Modal state
    let currentModalTab = 'auto';

    // Open Form Modal
    window.openFormModal = function() {
        const modal = document.getElementById('formModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Close Form Modal
    window.closeFormModal = function() {
        const modal = document.getElementById('formModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Switch Modal Tab
    window.switchModalTab = function(tabName) {
        currentModalTab = tabName;
        
        // Update tab active state
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(\`.modal-tab[data-tab="\${tabName}"]\`);
        if (activeTab) activeTab.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const content = document.getElementById(\`tab-\${tabName}\`);
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
        closeFormModal();
    };

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeFormModal();
        }
    });

    // Close modal on background click
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('formModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeFormModal();
                }
            });
        }
    });
`;

// Insert modal JS before the closing script tag
html = html.replace(
    /console\.log\('✅ NOHU Tool JavaScript loaded'\);/,
    modalJS + "\n    console.log('✅ NOHU Tool JavaScript loaded (V2 Design)');"
);
console.log('✅ Modal JavaScript added');

// Step 7: Update initTabSwitching function
console.log('\n🔧 Step 7: Updating initTabSwitching...');
html = html.replace(
    /\/\/ Tab switching\s*function initTabSwitching\(\) \{[\s\S]*?console\.log\('✅ Tab switching initialized'\);\s*\}/,
    `// Tab switching (now handled by modal)
    function initTabSwitching() {
        console.log('✅ Tab switching initialized for modal');
    }`
);
console.log('✅ initTabSwitching updated');

// Save modified HTML
console.log('\n💾 Saving modified HTML...');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ HTML file saved');

console.log('\n🎉 Migration complete!');
console.log(`\n📋 Summary:`);
console.log(`   ✅ CSS updated to V2`);
console.log(`   ✅ Form moved to modal`);
console.log(`   ✅ Results now full width`);
console.log(`   ✅ Modal functions added`);
console.log(`   ✅ Backup saved: ${path.basename(backupPath)}`);
console.log(`\n🚀 Refresh your browser to see the new design!`);
