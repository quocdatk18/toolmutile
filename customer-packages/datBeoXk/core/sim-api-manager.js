/**
 * SIM API Key Manager - Quản lý SIM API Key (codesim.net) cho tất cả tools
 */

class SimApiManager {
    constructor() {
        this.storageKey = 'hidemium_sim_api_key';
        this.storageTime = 'hidemium_sim_api_key_time';
    }

    /**
     * Lưu SIM API Key
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
     * Lấy SIM API Key
     */
    get() {
        return localStorage.getItem(this.storageKey) || '';
    }

    /**
     * Xóa SIM API Key
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.storageTime);
    }

    /**
     * Kiểm tra số dư tài khoản codesim.net
     */
    async checkBalance() {
        const apiKey = this.get();

        if (!apiKey) {
            return { success: false, error: 'No SIM API key found' };
        }

        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch(`/api/sim/balance?key=${apiKey}`);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy thông tin SIM API Key
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
     * Lấy số điện thoại từ codesim.net
     * @param {number} serviceId - Service ID (default: 49 for 22vip platform)
     * @param {string} phonePrefix - Phone prefix (default: '08')
     */
    async getPhoneNumber(serviceId = 49, phonePrefix = '08') {
        const apiKey = this.get();

        if (!apiKey) {
            return { success: false, error: 'No SIM API key found' };
        }

        try {
            // Use relative URL to automatically use current port (browser-safe)
            const url = `/api/sim/get-phone?key=${apiKey}&serviceId=${serviceId}&phonePrefix=${phonePrefix}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy OTP từ codesim.net
     * @param {string} otpId - OTP ID từ getPhoneNumber
     * @param {number} maxRetries - Số lần retry tối đa (default: 30)
     */
    async getOTP(otpId, maxRetries = 30) {
        const apiKey = this.get();

        if (!apiKey) {
            return { success: false, error: 'No SIM API key found' };
        }

        for (let i = 0; i < maxRetries; i++) {
            try {
                // Use relative URL to automatically use current port (browser-safe)
                const url = `/api/sim/get-otp?key=${apiKey}&otpId=${otpId}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.success && data.code) {
                    return {
                        success: true,
                        code: data.code
                    };
                }

                // Wait 3 seconds before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error('Error getting OTP:', error);
            }
        }

        return { success: false, error: 'Timeout waiting for OTP' };
    }

    /**
     * Hủy SIM
     * @param {string} simId - SIM ID từ getPhoneNumber
     */
    async cancelSim(simId) {
        const apiKey = this.get();

        if (!apiKey) {
            return { success: false, error: 'No SIM API key found' };
        }

        try {
            // Use relative URL to automatically use current port (browser-safe)
            const url = `/api/sim/cancel?key=${apiKey}&simId=${simId}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = new SimApiManager();
} else {
    window.simApiManager = new SimApiManager();
}
