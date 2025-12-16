/**
 * API Key Manager - Quản lý API Key chung cho tất cả tools
 */

class ApiKeyManager {
    constructor() {
        this.storageKey = 'hidemium_global_api_key';
        this.storageTime = 'hidemium_global_api_key_time';
    }

    /**
     * Lưu API Key
     */
    save(apiKey) {
        try {
            localStorage.setItem(this.storageKey, apiKey);
            localStorage.setItem(this.storageTime, Date.now().toString());
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy API Key
     */
    get() {
        return localStorage.getItem(this.storageKey) || '';
    }

    /**
     * Xóa API Key
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.storageTime);
    }

    /**
     * Kiểm tra số dư
     */
    async checkBalance() {
        const apiKey = this.get();

        if (!apiKey) {
            return { success: false, error: 'No API key found' };
        }

        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch(`/api/captcha/balance?key=${apiKey}`);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy thông tin API Key
     */
    getInfo() {
        const apiKey = this.get();
        const savedTime = localStorage.getItem(this.storageTime);

        if (!apiKey) {
            return {
                hasKey: false,
                key: '',
                savedAt: null
            };
        }

        return {
            hasKey: true,
            key: apiKey,
            keyPreview: apiKey.substring(0, 20) + '...',
            savedAt: savedTime ? new Date(parseInt(savedTime)) : null
        };
    }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = new ApiKeyManager();
} else {
    window.apiKeyManager = new ApiKeyManager();
}
