/**
 * Profile Manager - Quản lý Hidemium Profiles chung cho tất cả tools
 */

class ProfileManager {
    constructor() {
        this.profiles = [];
        this.selectedProfileId = null;
        this.selectedProfileIds = []; // For bulk operations
        this.runningProfiles = new Set();
        this.loadRunningProfiles();
    }

    /**
     * Load running profiles từ localStorage
     */
    loadRunningProfiles() {
        try {
            const saved = localStorage.getItem('running_profiles');
            if (saved) {
                this.runningProfiles = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading running profiles:', e);
        }
    }

    /**
     * Save running profiles
     */
    saveRunningProfiles() {
        try {
            localStorage.setItem('running_profiles', JSON.stringify([...this.runningProfiles]));
        } catch (e) {
            console.error('Error saving running profiles:', e);
        }
    }

    /**
     * Load tất cả profiles từ Hidemium
     */
    async loadAll() {
        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch('/api/profiles/all');
            const data = await response.json();

            if (data.success && data.data) {
                this.profiles = data.data;
                return { success: true, profiles: this.profiles };
            } else {
                throw new Error(data.error || 'Failed to load profiles');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Tạo profile mới
     */
    async create(config) {
        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch('/api/profiles/create-multiple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    count: 1,
                    prefix: config.name || 'Profile',
                    config: config
                })
            });

            const data = await response.json();

            if (data.success) {
                await this.loadAll(); // Reload profiles
                return { success: true };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Start profile
     */
    async start(uuid) {
        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch(`/api/profiles/${uuid}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: {} })
            });

            const data = await response.json();

            if (data.success) {
                this.runningProfiles.add(uuid);
                this.saveRunningProfiles();
                return { success: true };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop profile
     */
    async stop(uuid) {
        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch(`/api/profiles/${uuid}/stop`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.runningProfiles.delete(uuid);
                this.saveRunningProfiles();
                return { success: true };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Xóa profile
     */
    async delete(uuid) {
        try {
            // Use relative URL to automatically use current port (browser-safe)
            const response = await fetch(`/api/profiles/${uuid}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.runningProfiles.delete(uuid);
                this.saveRunningProfiles();
                await this.loadAll(); // Reload profiles
                return { success: true };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Select profile (single)
     */
    select(uuid) {
        this.selectedProfileId = uuid;
    }

    /**
     * Toggle profile selection (for bulk operations)
     */
    toggleSelection(uuid) {
        const index = this.selectedProfileIds.indexOf(uuid);
        if (index > -1) {
            this.selectedProfileIds.splice(index, 1);
        } else {
            this.selectedProfileIds.push(uuid);
        }
    }

    /**
     * Select all profiles
     */
    selectAll() {
        this.selectedProfileIds = this.profiles.map(p => p.uuid);
    }

    /**
     * Deselect all profiles
     */
    deselectAll() {
        this.selectedProfileIds = [];
    }

    /**
     * Get selected profile
     */
    getSelected() {
        return this.profiles.find(p => p.uuid === this.selectedProfileId);
    }

    /**
     * Get selected profiles (bulk)
     */
    getSelectedProfiles() {
        return this.profiles.filter(p => this.selectedProfileIds.includes(p.uuid));
    }

    /**
     * Check if profile is running
     */
    isRunning(uuid) {
        return this.runningProfiles.has(uuid);
    }

    /**
     * Clear running status for a profile (manual unmark)
     */
    clearRunningStatus(uuid) {
        this.runningProfiles.delete(uuid);
        this.saveRunningProfiles();
    }

    /**
     * Clear all running statuses
     */
    clearAllRunningStatuses() {
        this.runningProfiles.clear();
        this.saveRunningProfiles();
    }

    /**
     * Bulk start profiles
     */
    async startMultiple(uuids) {
        const results = [];
        for (const uuid of uuids) {
            const result = await this.start(uuid);
            results.push({ uuid, ...result });
        }
        return { success: true, results };
    }

    /**
     * Bulk stop profiles
     */
    async stopMultiple(uuids) {
        const results = [];
        for (const uuid of uuids) {
            const result = await this.stop(uuid);
            results.push({ uuid, ...result });
        }
        return { success: true, results };
    }

    /**
     * Bulk delete profiles
     */
    async deleteMultiple(uuids) {
        const results = [];
        for (const uuid of uuids) {
            const result = await this.delete(uuid);
            results.push({ uuid, ...result });
        }
        return { success: true, results };
    }
}

// Export singleton instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = new ProfileManager();
} else {
    window.profileManager = new ProfileManager();
}
