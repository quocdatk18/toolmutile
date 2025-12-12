/**
 * Results Manager
 * Quản lý kết quả check promo để hiển thị trên dashboard
 */

const resultsManager = {
    STORAGE_KEY: 'hidemium_promo_results',

    // Get all results
    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading results:', error);
            return [];
        }
    },

    // Save all results
    saveAll(results) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
        } catch (error) {
            console.error('Error saving results:', error);
        }
    },

    // Add new result
    addResult(result) {
        const results = this.getAll();
        results.unshift(result); // Add to beginning

        // Keep only last 50 results
        if (results.length > 50) {
            results.splice(50);
        }

        this.saveAll(results);
        this.updateUI();
    },

    // Clear all results
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateUI();
    },

    // Update UI
    updateUI() {
        const container = document.getElementById('resultsTable');
        if (!container) return;

        const results = this.getAll();

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    Chưa có kết quả nào. Chạy tool để xem kết quả.
                </div>
            `;
            return;
        }

        let html = `
            <div class="results-header">
                <h3>📊 Kết Quả Check Promo (${results.length})</h3>
                <button class="btn btn-sm btn-secondary" onclick="resultsManager.clearAll()">🗑️ Xóa Tất Cả</button>
            </div>
            <div class="results-grid">
        `;

        results.forEach((result, index) => {
            const date = new Date(result.timestamp);
            const timeStr = date.toLocaleString('vi-VN');
            const statusIcon = result.success ? '✅' : '❌';
            const promoCount = result.promotions?.length || 0;

            html += `
                <div class="result-card">
                    <div class="result-header">
                        <div class="result-info">
                            <div class="result-username">${statusIcon} ${result.username}</div>
                            <div class="result-site">${result.siteName}</div>
                        </div>
                        <div class="result-time">${timeStr}</div>
                    </div>
                    
                    ${result.screenshot ? `
                        <div class="result-screenshot" onclick="resultsManager.viewScreenshot('${result.screenshot}', '${result.username}', '${result.siteName}')">
                            <img src="${result.screenshot}" alt="Screenshot" loading="lazy">
                            <div class="screenshot-overlay">
                                <span>🔍 Click để xem</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="result-promos">
                        ${promoCount > 0 ? `
                            <div class="promo-count">🎁 ${promoCount} khuyến mãi</div>
                            <div class="promo-list">
                                ${result.promotions.map(promo => `
                                    <div class="promo-item">
                                        <span class="promo-name">${promo.name || 'Unknown'}</span>
                                        ${promo.amount ? `<span class="promo-amount">${promo.amount}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="promo-empty">ℹ️ Không có khuyến mãi</div>
                        `}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    // View screenshot in modal
    viewScreenshot(screenshotUrl, username, siteName) {
        const modal = document.createElement('div');
        modal.className = 'screenshot-modal';
        modal.innerHTML = `
            <div class="screenshot-modal-content">
                <div class="screenshot-modal-header">
                    <h3>📸 ${username} - ${siteName}</h3>
                    <button class="modal-close" onclick="this.closest('.screenshot-modal').remove()">×</button>
                </div>
                <div class="screenshot-modal-body">
                    <img src="${screenshotUrl}" alt="Screenshot">
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };

        document.body.appendChild(modal);
    }
};

// Auto-update UI every 3 seconds
setInterval(() => {
    resultsManager.updateUI();
}, 3000);

console.log('✅ Results Manager initialized');
