/**
 * Hidemium API Wrapper - Giao tiếp với Hidemium Local API
 */

class HidemiumAPI {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:2222'; // Hidemium Local API port

        // Get dashboard port from current page URL (browser-safe)
        const dashboardPort = window.location.port || 3000;
        this.dashboardUrl = `http://localhost:${dashboardPort}`; // Dashboard server port
    }

    /**
     * Kiểm tra kết nối Hidemium
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/hidemium/status`);
            const data = await response.json();
            return {
                success: true,
                connected: data.connected
            };
        } catch (error) {
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Lấy tất cả profiles
     */
    async getAllProfiles() {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/profiles/all`);
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Tạo profiles
     */
    async createProfiles(count, prefix, config) {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/profiles/create-multiple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, prefix, config })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Start profile
     */
    async startProfile(uuid, options = {}) {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/profiles/${uuid}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop profile
     */
    async stopProfile(uuid) {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/profiles/${uuid}/stop`, {
                method: 'POST'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Xóa profile
     */
    async deleteProfile(uuid) {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/profiles/${uuid}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Chạy automation
     */
    async runAutomation(profileId, config) {
        try {
            const response = await fetch(`${this.dashboardUrl}/api/automation/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, config })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = new HidemiumAPI();
} else {
    window.hidemiumAPI = new HidemiumAPI();
}
