/**
 * API Key Manager - Quản lý API Key chung cho tất cả tools
 */

class ApiKeyManager {
    constructor() {
        this.storageKey = 'hidemium_global_api_key';
        this.storageTime = 'hidemium_global_api_key_time';
        this.simStorageKey = 'hidemium_sim_api_key';
        this.simStorageTime = 'hidemium_sim_api_key_time';
    }

    /**
     * Lưu API Key (Captcha)
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
     * Lấy API Key (Captcha)
     */
    get() {
        return localStorage.getItem(this.storageKey) || '';
    }

    /**
     * Xóa API Key (Captcha)
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.storageTime);
    }

    /**
     * Lưu SIM API Key (Viotp)
     */
    saveSimApiKey(apiKey) {
        try {
            localStorage.setItem(this.simStorageKey, apiKey);
            localStorage.setItem(this.simStorageTime, Date.now().toString());
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy SIM API Key (Viotp)
     */
    getSimApiKey() {
        return localStorage.getItem(this.simStorageKey) || '';
    }

    /**
     * Xóa SIM API Key (Viotp)
     */
    clearSimApiKey() {
        localStorage.removeItem(this.simStorageKey);
        localStorage.removeItem(this.simStorageTime);
    }

    /**
     * Kiểm tra số dư Captcha API
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
     * Kiểm tra số dư Viotp SIM API
     */
    async checkSimBalance() {
        const apiKey = this.getSimApiKey();

        if (!apiKey) {
            return { success: false, error: 'No SIM API key found' };
        }

        try {
            const response = await fetch(`https://api.viotp.com/users/balance?token=${apiKey}`);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy thông tin API Key (Captcha)
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

    /**
     * Lấy thông tin SIM API Key (Viotp)
     */
    getSimInfo() {
        const apiKey = this.getSimApiKey();
        const savedTime = localStorage.getItem(this.simStorageTime);

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
