/**
 * Screenshot Path Helper
 * Generates correct screenshot paths for new tool-based structure
 */

const path = require('path');
const fs = require('fs');

class ScreenshotPathHelper {
    /**
     * Generate screenshot path for new tool-based structure
     * @param {string} toolId - Tool ID (e.g., 'nohu-tool', 'tool-sms')
     * @param {string} username - Username
     * @param {string} sessionId - Session ID (timestamp format)
     * @param {string} siteName - Site name for screenshot
     * @returns {object} - { fullPath, relativePath, directory }
     */
    static generatePath(toolId, username, sessionId, siteName) {
        const baseDir = path.join(__dirname, '../screenshots');

        // New structure: screenshots/toolId/username/sessionId/
        const directory = path.join(baseDir, toolId, username, sessionId);
        const filename = `${siteName}.png`;
        const fullPath = path.join(directory, filename);
        const relativePath = `/screenshots/${toolId}/${username}/${sessionId}/${filename}`;

        return {
            fullPath,
            relativePath,
            directory,
            filename
        };
    }

    /**
     * Ensure directory exists for screenshot
     * @param {string} directory - Directory path to create
     */
    static ensureDirectory(directory) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            console.log(`📁 Created screenshot directory: ${directory}`);
        }
    }

    /**
     * Save session metadata
     * @param {string} toolId - Tool ID
     * @param {string} username - Username  
     * @param {string} sessionId - Session ID
     * @param {object} metadata - Metadata object
     */
    static saveSessionMetadata(toolId, username, sessionId, metadata) {
        const { directory } = this.generatePath(toolId, username, sessionId, 'temp');
        this.ensureDirectory(directory);

        const metadataPath = path.join(directory, 'metadata.json');
        const fullMetadata = {
            toolId,
            username,
            sessionId,
            timestamp: Date.now(),
            ...metadata
        };

        fs.writeFileSync(metadataPath, JSON.stringify(fullMetadata, null, 2));
        console.log(`💾 Saved session metadata: ${metadataPath}`);
    }

    /**
     * Get legacy path for backward compatibility
     * @param {string} username - Username
     * @param {string} sessionId - Session ID
     * @param {string} siteName - Site name
     * @returns {object} - { fullPath, relativePath, directory }
     */
    static getLegacyPath(username, sessionId, siteName) {
        const baseDir = path.join(__dirname, '../screenshots');

        // Old structure: screenshots/username/sessionId/
        const directory = path.join(baseDir, username, sessionId);
        const filename = `${siteName}.png`;
        const fullPath = path.join(directory, filename);
        const relativePath = `/screenshots/${username}/${sessionId}/${filename}`;

        return {
            fullPath,
            relativePath,
            directory,
            filename
        };
    }
}

module.exports = ScreenshotPathHelper;