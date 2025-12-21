/**
 * Tab Rotator - Rotate between tabs to prevent throttling
 * 
 * When running multiple sites in parallel, only the active tab runs at full speed.
 * This module rotates between tabs to ensure all tabs get processing time.
 */

class TabRotator {
    constructor() {
        this.tabs = new Map(); // Map<page, { status, lastActive }>
        this.rotationInterval = null;
        this.rotationDelay = 5000; // Rotate every 5 seconds (increased from 3s)
        this.isRunning = false;
    }

    /**
     * Register a tab for rotation
     */
    register(page, taskName = 'unknown') {
        this.tabs.set(page, {
            taskName: taskName,
            status: 'pending', // pending, running, completed
            lastActive: 0,
            page: page
        });
        console.log(`📋 Registered tab: ${taskName} (Total: ${this.tabs.size})`);
    }

    /**
     * Mark tab as completed (will be skipped in rotation)
     */
    complete(page) {
        const tab = this.tabs.get(page);
        if (tab) {
            tab.status = 'completed';
            console.log(`✅ Tab completed: ${tab.taskName}`);
        }
    }

    /**
     * Start rotation
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Tab rotation already running');
            return;
        }

        console.log('🔄 Starting tab rotation...');
        this.isRunning = true;

        // Rotate immediately
        this.rotate();

        // Then rotate every X seconds
        this.rotationInterval = setInterval(() => {
            this.rotate();
        }, this.rotationDelay);
    }

    /**
     * Stop rotation
     */
    stop() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️  Tab rotation stopped');
    }

    /**
     * Rotate to next pending/running tab
     */
    async rotate() {
        // Get all pending/running tabs (NOT completed)
        const activeTabs = Array.from(this.tabs.values())
            .filter(tab => tab.status !== 'completed')
            .sort((a, b) => a.lastActive - b.lastActive); // Least recently active first

        if (activeTabs.length === 0) {
            console.log('✅ All tabs completed, stopping rotation');
            this.stop();
            return;
        }

        // Get next tab to activate
        const nextTab = activeTabs[0];

        try {
            // Check if page is still valid before rotating
            const isClosed = nextTab.page.isClosed();
            if (isClosed) {
                console.log(`⚠️  Tab ${nextTab.taskName} is closed, marking as completed`);
                nextTab.status = 'completed';
                return this.rotate(); // Try next tab
            }

            await nextTab.page.bringToFront();
            nextTab.lastActive = Date.now();
            nextTab.status = 'running';
            console.log(`👁️  Rotated to: ${nextTab.taskName} (${activeTabs.length} tabs remaining)`);
        } catch (error) {
            console.warn(`⚠️  Failed to activate tab ${nextTab.taskName}:`, error.message);
            // Mark as completed if page is closed or error
            nextTab.status = 'completed';
            // Try next tab
            if (activeTabs.length > 1) {
                return this.rotate();
            }
        }
    }

    /**
     * Get rotation status
     */
    getStatus() {
        const pending = Array.from(this.tabs.values()).filter(t => t.status === 'pending').length;
        const running = Array.from(this.tabs.values()).filter(t => t.status === 'running').length;
        const completed = Array.from(this.tabs.values()).filter(t => t.status === 'completed').length;

        return {
            total: this.tabs.size,
            pending,
            running,
            completed,
            isRunning: this.isRunning
        };
    }

    /**
     * Clear all tabs
     */
    clear() {
        this.stop();
        this.tabs.clear();
        console.log('🗑️  Cleared all tabs');
    }
}

// Export singleton instance
const tabRotator = new TabRotator();
module.exports = tabRotator;
