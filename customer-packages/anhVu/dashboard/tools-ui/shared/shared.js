/**
 * SHARED TOOL UI - Common JavaScript for all tools
 * Handles: Results table, pagination, modals, profile carousel
 */

// ============================================
// GLOBAL STATE
// ============================================
window.resultsData = window.resultsData || {};
window.processedResults = window.processedResults || new Set();
window.currentPage = 1;
window.pageSize = 4;
window.selectedProfileId = null;
window.selectedProfileData = null;

// ============================================
// RESULTS TABLE
// ============================================

function refreshResults() {
    if (window.refreshAllData) {
        window.refreshAllData();
    }
    showToast('info', 'Đang tải', 'Đang tải lại dữ liệu...');
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#resultsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

function deleteSelectedResults() {
    const checkboxes = document.querySelectorAll('#resultsTableBody input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        showToast('warning', 'Chưa chọn', 'Vui lòng chọn ít nhất 1 kết quả để xóa');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa ${checkboxes.length} kết quả đã chọn?`)) {
        // Implementation depends on backend
        showToast('success', 'Đã xóa', `Đã xóa ${checkboxes.length} kết quả`);
        refreshResults();
    }
}

// ============================================
// PAGINATION
// ============================================

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / window.pageSize) || 1;
    const start = totalItems > 0 ? (window.currentPage - 1) * window.pageSize + 1 : 0;
    const end = Math.min(window.currentPage * window.pageSize, totalItems);

    document.getElementById('pageStart').textContent = start;
    document.getElementById('pageEnd').textContent = end;
    document.getElementById('totalResults').textContent = totalItems;
    document.getElementById('currentPage').textContent = window.currentPage;
    document.getElementById('totalPages').textContent = totalPages;

    // Enable/disable buttons
    document.getElementById('btnFirst').disabled = window.currentPage <= 1;
    document.getElementById('btnPrev').disabled = window.currentPage <= 1;
    document.getElementById('btnNext').disabled = window.currentPage >= totalPages;
    document.getElementById('btnLast').disabled = window.currentPage >= totalPages;
}

function goToFirstPage() {
    window.currentPage = 1;
    renderResultsTable();
}

function goToPrevPage() {
    if (window.currentPage > 1) {
        window.currentPage--;
        renderResultsTable();
    }
}

function goToNextPage() {
    const totalItems = Object.keys(window.resultsData).length;
    const totalPages = Math.ceil(totalItems / window.pageSize);
    if (window.currentPage < totalPages) {
        window.currentPage++;
        renderResultsTable();
    }
}

function goToLastPage() {
    const totalItems = Object.keys(window.resultsData).length;
    window.currentPage = Math.ceil(totalItems / window.pageSize) || 1;
    renderResultsTable();
}

// ============================================
// MODALS
// ============================================

function openFormModal() {
    document.getElementById('formModal').classList.add('active');
    // Load profiles if function exists
    if (window.loadProfilesCarousel) {
        window.loadProfilesCarousel();
    }
}

function closeFormModal() {
    document.getElementById('formModal').classList.remove('active');
}

function openScreenshotsModal(title, content) {
    document.getElementById('modalTitle').textContent = title || '📷 Kết Quả';
    document.getElementById('modalScreenshotsGrid').innerHTML = content;
    document.getElementById('screenshotsModal').style.display = 'flex';
}

function closeScreenshotsModal() {
    document.getElementById('screenshotsModal').style.display = 'none';
}

function openAccountInfoModal(title, content) {
    document.getElementById('accountInfoTitle').textContent = title || '📋 Thông Tin Tài Khoản';
    document.getElementById('accountInfoContent').innerHTML = content;
    document.getElementById('accountInfoModal').style.display = 'flex';
}

function closeAccountInfoModal() {
    document.getElementById('accountInfoModal').style.display = 'none';
}

function openSelectSitesModal() {
    document.getElementById('selectSitesModal').style.display = 'flex';
}

function closeSelectSitesModal() {
    document.getElementById('selectSitesModal').style.display = 'none';
}

// ============================================
// PROFILE CAROUSEL
// ============================================

function scrollProfileCarousel(tabId, direction) {
    const carousel = document.getElementById(`${tabId}ProfileCarousel`);
    if (carousel) {
        const scrollAmount = 250 * direction;
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

function selectProfile(profileId, profileData, tabId) {
    // Deselect all cards
    document.querySelectorAll('.profile-carousel-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Select clicked card
    const card = document.querySelector(`[data-profile-id="${profileId}"]`);
    if (card) {
        card.classList.add('selected');
    }

    // Store selected profile
    window.selectedProfileId = profileId;
    window.selectedProfileData = profileData;

    // Call tool-specific handler if exists
    if (window.onProfileSelected) {
        window.onProfileSelected(profileId, profileData, tabId);
    }
}

function renderProfileCard(profile, tabId) {
    const isRunning = profile.status === 'running';
    const isSelected = profile.uuid === window.selectedProfileId;

    return `
        <div class="profile-carousel-card ${isRunning ? 'running' : ''} ${isSelected ? 'selected' : ''}"
             data-profile-id="${profile.uuid}"
             onclick="${isRunning ? '' : `selectProfile('${profile.uuid}', ${JSON.stringify(profile).replace(/"/g, '&quot;')}, '${tabId}')`}">
            <div class="profile-card-header">
                <div class="profile-avatar">${(profile.name || 'P')[0].toUpperCase()}</div>
                <div class="profile-card-name">${profile.name || 'Unknown'}</div>
                ${isRunning ? '<span class="running-badge">🔄 Running</span>' : ''}
                ${isSelected ? '<span class="selected-badge">✓ Selected</span>' : ''}
            </div>
            <div class="profile-card-info">
                <div class="info-item">
                    <span class="info-icon">🆔</span>
                    <span class="info-text">${profile.uuid?.substring(0, 8) || 'N/A'}...</span>
                </div>
            </div>
            <div class="profile-card-footer">
                <div class="profile-status-text ${isRunning ? 'running' : isSelected ? 'selected' : 'available'}">
                    ${isRunning ? '🔄 Đang chạy' : isSelected ? '✓ Đã chọn' : '📋 Sẵn sàng'}
                </div>
            </div>
        </div>
    `;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(type, title, message) {
    // Use existing toast system if available
    if (window.Toastify) {
        Toastify({
            text: `${title}: ${message}`,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'
        }).showToast();
    } else {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function generateRandomUsername(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        closeFormModal();
        closeScreenshotsModal();
        closeAccountInfoModal();
        closeSelectSitesModal();
    }
});

// ============================================
// INIT
// ============================================

console.log('✅ Shared Tool UI loaded');


// ============================================
// DRAG TO SCROLL - Profile Carousel
// Click and drag to scroll horizontally
// ============================================

function initDragToScroll() {
    const carousels = document.querySelectorAll('.profile-carousel');

    carousels.forEach(carousel => {
        let isDown = false;
        let startX;
        let scrollLeft;
        let hasMoved = false;

        carousel.addEventListener('mousedown', (e) => {
            // Ignore if clicking on a button or input
            if (e.target.closest('button, input, .btn')) return;

            isDown = true;
            hasMoved = false;
            carousel.classList.add('dragging');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mouseup', (e) => {
            isDown = false;
            carousel.classList.remove('dragging');

            // If we moved significantly, prevent the click event
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();

            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier

            if (Math.abs(walk) > 5) {
                hasMoved = true;
            }

            carousel.scrollLeft = scrollLeft - walk;
        });

        // Prevent click on cards when dragging
        carousel.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                hasMoved = false;
            }
        }, true);

        // Touch support for mobile
        let touchStartX;
        let touchScrollLeft;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX - carousel.offsetLeft;
            touchScrollLeft = carousel.scrollLeft;
        }, { passive: true });

        carousel.addEventListener('touchmove', (e) => {
            if (!touchStartX) return;
            const x = e.touches[0].pageX - carousel.offsetLeft;
            const walk = (x - touchStartX) * 2;
            carousel.scrollLeft = touchScrollLeft - walk;
        }, { passive: true });

        carousel.addEventListener('touchend', () => {
            touchStartX = null;
        });
    });
}

// Initialize drag-to-scroll when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDragToScroll);
} else {
    initDragToScroll();
}

// Re-initialize when new carousels are added (e.g., after modal opens)
const originalOpenFormModal = window.openFormModal;
window.openFormModal = function () {
    if (originalOpenFormModal) originalOpenFormModal();
    setTimeout(initDragToScroll, 100);
};

console.log('✅ Drag-to-scroll initialized for profile carousels');
