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
    // Reload sites from server (for NOHU tool)
    if (window.renderNohuSites) {
        window.renderNohuSites();
    }
}

function closeFormModal() {
    document.getElementById('formModal').classList.remove('active');
}

function openScreenshotsModal(title, content) {
    document.getElementById('modalTitle').textContent = title || '📷 Kết Quả';
    document.getElementById('modalScreenshotsGrid').innerHTML = content;
    document.getElementById('screenshotsModal').style.display = 'flex';

    // Initialize swipe carousel for screenshots
    setTimeout(() => {
        initSwipeCarousel();
    }, 100);
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
    const isRunning = profile.isRunning;
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
            position: "center",
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'
        }).showToast();
    } else {
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

// ============================================
// DRAG TO SCROLL - Screenshots Modal
// Click and drag to scroll vertically in screenshots grid
// ============================================

function initScreenshotsDragToScroll() {
    const grids = document.querySelectorAll('.screenshots-grid');

    grids.forEach(grid => {
        let isDown = false;
        let startY;
        let scrollTop;
        let hasMoved = false;

        grid.addEventListener('mousedown', (e) => {
            // Ignore if clicking on an image or button
            if (e.target.closest('img, button, a')) return;

            isDown = true;
            hasMoved = false;
            grid.classList.add('dragging');
            grid.style.cursor = 'grabbing';
            startY = e.pageY - grid.offsetTop;
            scrollTop = grid.scrollTop;
        });

        grid.addEventListener('mouseleave', () => {
            isDown = false;
            grid.classList.remove('dragging');
            grid.style.cursor = 'grab';
        });

        grid.addEventListener('mouseup', (e) => {
            isDown = false;
            grid.classList.remove('dragging');
            grid.style.cursor = 'grab';

            // If we moved significantly, prevent the click event
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        grid.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();

            const y = e.pageY - grid.offsetTop;
            const walk = (y - startY) * 1.5; // Scroll speed multiplier

            if (Math.abs(walk) > 5) {
                hasMoved = true;
            }

            grid.scrollTop = scrollTop + walk;
        });

        // Prevent click on images when dragging
        grid.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                hasMoved = false;
            }
        }, true);

        // Touch support for mobile
        let touchStartY;
        let touchScrollTop;

        grid.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].pageY - grid.offsetTop;
            touchScrollTop = grid.scrollTop;
        }, { passive: true });

        grid.addEventListener('touchmove', (e) => {
            if (!touchStartY) return;
            const y = e.touches[0].pageY - grid.offsetTop;
            const walk = (y - touchStartY) * 1.5;
            grid.scrollTop = touchScrollTop + walk;
        }, { passive: true });

        grid.addEventListener('touchend', () => {
            touchStartY = null;
        });
    });
}

// Initialize screenshots drag-to-scroll when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreenshotsDragToScroll);
} else {
    initScreenshotsDragToScroll();
}

// Re-initialize when screenshots modal opens
const originalOpenScreenshotsModal = window.openScreenshotsModal;
if (originalOpenScreenshotsModal) {
    window.openScreenshotsModal = function (key) {
        originalOpenScreenshotsModal(key);
        setTimeout(initScreenshotsDragToScroll, 100);
    };
}

// ============================================
// SWIPE CAROUSEL - For Screenshots
// Vuốt từ trên xuống để xem ảnh tiếp theo
// ============================================

function initSwipeCarousel() {
    const grid = document.getElementById('modalScreenshotsGrid');
    if (!grid) return;

    const items = grid.querySelectorAll('.screenshot-item');
    if (items.length <= 1) return; // No need for swipe if only 1 item

    let currentIndex = 0;
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let dragThreshold = 50; // Minimum distance to trigger swipe

    // Create carousel wrapper if not exists
    if (!grid.classList.contains('swipe-carousel')) {
        grid.classList.add('swipe-carousel');
        grid.style.display = 'flex';
        grid.style.overflow = 'hidden';
        grid.style.position = 'relative';
        grid.style.width = '100%';
        grid.style.height = '100%';
        grid.style.flexDirection = 'column'; // Vertical layout

        // Wrap items in container
        const container = document.createElement('div');
        container.className = 'swipe-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column'; // Vertical
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.transition = 'transform 0.3s ease-out';

        items.forEach(item => {
            item.style.minWidth = '100%';
            item.style.minHeight = '100%';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
            item.style.flexShrink = 0;
            container.appendChild(item);
        });

        grid.innerHTML = '';
        grid.appendChild(container);

        // Add navigation buttons (up/down)
        const upBtn = document.createElement('button');
        upBtn.className = 'swipe-nav-btn swipe-up';
        upBtn.innerHTML = '▲';
        upBtn.onclick = () => swipeToSlide(currentIndex - 1);

        const downBtn = document.createElement('button');
        downBtn.className = 'swipe-nav-btn swipe-down';
        downBtn.innerHTML = '▼';
        downBtn.onclick = () => swipeToSlide(currentIndex + 1);

        // Add slide counter
        const counter = document.createElement('div');
        counter.className = 'swipe-counter';
        counter.textContent = `1 / ${items.length}`;

        grid.appendChild(upBtn);
        grid.appendChild(downBtn);
        grid.appendChild(counter);

        // Add CSS styles
        addSwipeCarouselStyles();
    }

    const container = grid.querySelector('.swipe-container');
    const counter = grid.querySelector('.swipe-counter');

    function updateSlide() {
        const offset = -currentIndex * 100;
        container.style.transform = `translateY(${offset}%)`; // Vertical transform
        counter.textContent = `${currentIndex + 1} / ${items.length}`;

        // Update button states
        const upBtn = grid.querySelector('.swipe-up');
        const downBtn = grid.querySelector('.swipe-down');
        upBtn.disabled = currentIndex === 0;
        downBtn.disabled = currentIndex === items.length - 1;
    }

    function swipeToSlide(index) {
        if (index < 0 || index >= items.length) return;
        currentIndex = index;
        updateSlide();
    }

    // Mouse events
    grid.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY; // Use Y instead of X
        currentY = startY;
        container.style.transition = 'none';
    });

    grid.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentY = e.clientY;
        const diff = currentY - startY;
        const offset = (-currentIndex * 100) + (diff / grid.offsetHeight * 100); // Use height
        container.style.transform = `translateY(${offset}%)`; // Vertical
    });

    grid.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        container.style.transition = 'transform 0.3s ease-out';

        const diff = currentY - startY;
        if (Math.abs(diff) > dragThreshold) {
            if (diff > 0) {
                // Swipe down - go to previous
                swipeToSlide(currentIndex - 1);
            } else {
                // Swipe up - go to next
                swipeToSlide(currentIndex + 1);
            }
        } else {
            // Not enough movement, snap back
            updateSlide();
        }
    });

    grid.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            container.style.transition = 'transform 0.3s ease-out';
            updateSlide();
        }
    });

    // Touch events for mobile
    grid.addEventListener('touchstart', (e) => {
        isDragging = true;
        startY = e.touches[0].clientY;
        currentY = startY;
        container.style.transition = 'none';
    }, { passive: true });

    grid.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        const offset = (-currentIndex * 100) + (diff / grid.offsetHeight * 100);
        container.style.transform = `translateY(${offset}%)`;
    }, { passive: true });

    grid.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        container.style.transition = 'transform 0.3s ease-out';

        const diff = currentY - startY;
        if (Math.abs(diff) > dragThreshold) {
            if (diff > 0) {
                swipeToSlide(currentIndex - 1);
            } else {
                swipeToSlide(currentIndex + 1);
            }
        } else {
            updateSlide();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (grid.style.display !== 'flex') return;
        if (e.key === 'ArrowUp') swipeToSlide(currentIndex - 1);
        if (e.key === 'ArrowDown') swipeToSlide(currentIndex + 1);
    });

    updateSlide();
}

function addSwipeCarouselStyles() {
    if (document.getElementById('swipe-carousel-styles')) return;

    const style = document.createElement('style');
    style.id = 'swipe-carousel-styles';
    style.textContent = `
        .swipe-carousel {
            position: relative !important;
            background: #1a202c;
            border-radius: 12px;
            overflow: hidden;
            flex-direction: column;
        }

        .swipe-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            transition: transform 0.3s ease-out;
        }

        .screenshot-item {
            min-width: 100%;
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #0f172a;
            position: relative;
        }

        .screenshot-item img {
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .swipe-nav-btn {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 32px;
            padding: 12px 16px;
            cursor: pointer;
            border-radius: 8px;
            z-index: 10;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
        }

        .swipe-nav-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.4);
            transform: translateX(-50%) scale(1.1);
        }

        .swipe-nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .swipe-up {
            top: 16px;
        }

        .swipe-down {
            bottom: 60px;
        }

        .swipe-counter {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10;
            backdrop-filter: blur(4px);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .swipe-nav-btn {
                font-size: 24px;
                padding: 8px 12px;
            }

            .swipe-up {
                top: 8px;
            }

            .swipe-down {
                bottom: 50px;
            }

            .swipe-counter {
                font-size: 12px;
                padding: 6px 12px;
            }
        }

        /* Cursor feedback */
        .swipe-carousel {
            cursor: grab;
        }

        .swipe-carousel.dragging {
            cursor: grabbing;
        }
    `;
    document.head.appendChild(style);
}

