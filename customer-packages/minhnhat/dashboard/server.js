/**
 * Hidemium Multi-Tool Dashboard Server
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const LicenseManager = require('../core/license-manager');

// Try to load admin API (only available in master version)
let adminAPI = null;
try {
    adminAPI = require('./admin-api');
} catch (err) {
    console.log('ℹ️  Admin features disabled (customer version)');
}

const app = express();
const DEFAULT_PORT = 3000; // Dashboard port
const licenseManager = new LicenseManager();

// Track running profiles in server memory
if (!global.runningProfiles) {
    global.runningProfiles = new Map(); // Map<profileUuid, { username, startTime }>
}

// Function to find available port
async function findAvailablePort(startPort) {
    const net = require('net');

    return new Promise((resolve) => {
        const server = net.createServer();

        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });

        server.on('error', () => {
            // Port is in use, try next one
            resolve(findAvailablePort(startPort + 1));
        });
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/core', express.static(path.join(__dirname, '../core')));
app.use('/config', express.static(path.join(__dirname, '../config')));
app.use('/tools-ui', express.static(path.join(__dirname, 'tools-ui')));
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));

// Load tools configuration
let toolsConfig = {};
try {
    const toolsPath = path.join(__dirname, '../config/tools.json');
    toolsConfig = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
} catch (error) {
    console.error('Error loading tools config:', error);
}

// ============================================
// API ROUTES
// ============================================

// License check middleware
function checkLicense(req, res, next) {
    const licenseCheck = licenseManager.checkLicense();

    if (!licenseCheck.valid) {
        return res.status(403).json({
            success: false,
            error: 'License required',
            message: licenseCheck.message,
            needActivation: licenseCheck.needActivation
        });
    }

    // Add license info to request
    req.licenseInfo = licenseCheck.data;
    next();
}

// License APIs (không cần check license)
app.get('/api/license/info', (req, res) => {
    const checkResult = licenseManager.checkLicense();
    const info = licenseManager.getLicenseInfo();
    const machineId = licenseManager.getMachineId();

    res.json({
        success: true,
        licensed: info !== null || checkResult.isMaster,
        isMaster: checkResult.isMaster || false,
        info,
        machineId
    });
});

app.post('/api/license/activate', (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({
            success: false,
            error: 'License key required'
        });
    }

    const result = licenseManager.activate(key);

    res.json({
        success: result.valid,
        message: result.message,
        info: result.data
    });
});

app.post('/api/license/remove', (req, res) => {
    const removed = licenseManager.removeLicense();

    res.json({
        success: removed,
        message: removed ? 'License removed' : 'Failed to remove license'
    });
});

// Get tools list
app.get('/api/tools', (req, res) => {
    res.json(toolsConfig);
});

// Hidemium status
app.get('/api/hidemium/status', async (req, res) => {
    try {
        // Check if Hidemium Local API is running
        const axios = require('axios');
        console.log('🔍 Checking Hidemium at http://127.0.0.1:2222/v1/browser/list...');

        const response = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
            params: { is_local: false },
            timeout: 2000
        });

        console.log('✅ Hidemium responded with status:', response.status);

        res.json({
            success: true,
            connected: true
        });
    } catch (error) {
        console.error('❌ Hidemium connection failed:', error.message);

        res.json({
            success: false,
            connected: false,
            error: error.message
        });
    }
});

// Get all profiles
app.get('/api/profiles/all', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
            params: { is_local: false }
        });

        const profiles = response.data?.data?.content || [];

        res.json({
            success: true,
            data: profiles
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Create profiles
app.post('/api/profiles/create-multiple', async (req, res) => {
    try {
        const { count, prefix, config } = req.body;
        const axios = require('axios');

        const profiles = [];

        for (let i = 0; i < count; i++) {
            const profileName = count > 1 ? `${prefix} ${i + 1}` : prefix;

            // Helper functions for randomization
            const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            // Base config (theo Hidemium API format)
            const profileConfig = {
                name: profileName,
                os: config.os || 'win',
                osVersion: config.osVersion || '10',
                browser: config.browser || 'chrome',
                version: config.version || '121'
            };

            // Canvas - true/false theo API
            profileConfig.canvas = config.canvas !== undefined ? (config.canvas === 'noise' || config.canvas === true) : true;

            // WebGL settings
            profileConfig.webGLImage = config.webGLImage || 'false';
            profileConfig.audioContext = config.audioContext || 'false';
            profileConfig.webGLMetadata = config.webGLMetadata || 'false';

            // WebGL Vendor/Renderer - Random realistic combinations
            const webglCombos = [
                { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)' },
                { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0)' },
                { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0)' },
                { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)' }
            ];
            const selectedWebGL = config.webglInfo || randomFrom(webglCombos);
            profileConfig.webGLVendor = selectedWebGL.vendor;
            profileConfig.webGLMetadataRenderer = selectedWebGL.renderer;

            // Client Rects & Font Noise
            profileConfig.clientRectsEnable = config.clientRectsEnable || 'false';
            profileConfig.noiseFont = config.noiseFont || 'false';

            // Language
            const languages = ['vi-VN', 'vi', 'en-US', 'en'];
            profileConfig.language = config.language || randomFrom(languages);

            // Screen Resolution - Based on OS
            let resolutions;
            const os = profileConfig.os.toLowerCase();

            if (os === 'win' || os === 'windows') {
                // Windows - Popular desktop resolutions
                resolutions = [
                    '1920x1080',  // Full HD (most popular)
                    '1366x768',   // HD (laptops)
                    '1536x864',   // HD+ (laptops)
                    '1440x900',   // MacBook Air size
                    '1600x900',   // HD+
                    '2560x1440'   // 2K (gaming/professional)
                ];
            } else if (os === 'mac' || os === 'macos') {
                // macOS - Retina and standard Mac resolutions
                resolutions = [
                    '1440x900',   // MacBook Air 13"
                    '1680x1050',  // MacBook Pro 15" (older)
                    '1920x1080',  // iMac 21.5"
                    '2560x1440',  // MacBook Pro 13" Retina
                    '2560x1600',  // MacBook Pro 16"
                    '2880x1800'   // MacBook Pro 15" Retina
                ];
            } else if (os === 'linux' || os === 'lin') {
                // Linux - Common desktop resolutions
                resolutions = [
                    '1920x1080',  // Full HD (most popular)
                    '1366x768',   // HD (laptops)
                    '1600x900',   // HD+
                    '1440x900',   // Standard
                    '2560x1440'   // 2K
                ];
            } else if (os === 'android') {
                // Android - Popular phone resolutions (including larger screens)
                resolutions = [
                    '360x640',    // Samsung Galaxy S5/S6
                    '360x780',    // Samsung Galaxy S8/S9
                    '375x667',    // Older Android phones
                    '384x640',    // Nexus 4
                    '390x844',    // Samsung Galaxy S21
                    '393x851',    // Pixel 6/7
                    '412x732',    // Pixel 3/4
                    '412x915',    // Samsung Galaxy S20/S21+
                    '414x896',    // Large Android phones
                    '480x800',    // Samsung Galaxy S3/S4
                    '540x960',    // Xiaomi Redmi Note
                    '600x1024'    // Samsung Galaxy Tab (small tablet)
                ];
            } else if (os === 'ios') {
                // iOS - iPhone resolutions
                resolutions = [
                    '375x667',    // iPhone 6/7/8/SE
                    '375x812',    // iPhone X/XS/11 Pro
                    '390x844',    // iPhone 12/13/14
                    '393x852',    // iPhone 14 Pro
                    '414x896',    // iPhone XR/11/XS Max
                    '428x926'     // iPhone 12/13/14 Pro Max
                ];
            } else {
                // Default fallback - Desktop
                resolutions = ['1920x1080', '1366x768', '1440x900'];
            }

            profileConfig.resolution = config.resolution || randomFrom(resolutions);

            // Hardware - Based on OS and realistic specs
            if (!config.hardwareConcurrency) {
                if (os === 'win' || os === 'windows') {
                    // Windows - Wide range (budget to high-end)
                    profileConfig.hardwareConcurrency = randomFrom([4, 6, 8, 12, 16]);
                } else if (os === 'mac' || os === 'macos') {
                    // macOS - Apple Silicon and Intel (typically higher-end)
                    profileConfig.hardwareConcurrency = randomFrom([8, 10, 12, 16]);
                } else if (os === 'linux' || os === 'lin') {
                    // Linux - Developer machines (typically mid to high-end)
                    profileConfig.hardwareConcurrency = randomFrom([4, 6, 8, 12, 16]);
                } else if (os === 'android' || os === 'ios') {
                    // Mobile - Lower core counts
                    profileConfig.hardwareConcurrency = randomFrom([4, 6, 8]);
                } else {
                    profileConfig.hardwareConcurrency = randomInt(4, 8);
                }
            } else {
                profileConfig.hardwareConcurrency = config.hardwareConcurrency;
            }

            if (!config.deviceMemory) {
                if (os === 'win' || os === 'windows') {
                    // Windows - 8GB most common, 16GB for gaming/work
                    profileConfig.deviceMemory = randomFrom([4, 8, 8, 16, 16, 32]);
                } else if (os === 'mac' || os === 'macos') {
                    // macOS - Typically 8GB minimum, 16GB+ common
                    profileConfig.deviceMemory = randomFrom([8, 8, 16, 16, 32]);
                } else if (os === 'linux' || os === 'lin') {
                    // Linux - Developer machines
                    profileConfig.deviceMemory = randomFrom([8, 8, 16, 16, 32]);
                } else if (os === 'android' || os === 'ios') {
                    // Mobile - Lower RAM
                    profileConfig.deviceMemory = randomFrom([4, 6, 8, 12]);
                } else {
                    profileConfig.deviceMemory = randomFrom([4, 8, 16]);
                }
            } else {
                profileConfig.deviceMemory = config.deviceMemory;
            }

            // User Agent - Auto-generated by Hidemium if not specified
            if (config.userAgent) {
                profileConfig.userAgent = config.userAgent;
            }

            // Command - Language setting
            profileConfig.command = config.command || '--lang=vi';

            // Start URL
            profileConfig.StartURL = config.StartURL || 'about:blank';

            // Format proxy correctly for Hidemium API
            // Format: "TYPE|host|port|user|password"
            // Valid types: HTTP, HTTPS, SOCKS4, SOCKS5, SSH (must be uppercase)
            if (config.proxy && config.proxy.host && config.proxy.port) {
                const proxy = config.proxy;

                // Validate and normalize proxy type
                const validTypes = ['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5', 'SSH'];
                let type = (proxy.type || 'HTTP').toUpperCase();

                // Handle common variations
                if (type === 'SOCKS') type = 'SOCKS5';

                if (!validTypes.includes(type)) {
                    console.warn(`⚠️ Invalid proxy type "${proxy.type}", defaulting to HTTP`);
                    type = 'HTTP';
                }

                const host = proxy.host;
                const port = proxy.port;
                const user = proxy.username || '';
                const pass = proxy.password || '';

                // Build proxy string: "HTTP|1.2.3.4|8080|user|pass"
                profileConfig.proxy = `${type}|${host}|${port}|${user}|${pass}`;
                console.log(`🌍 Proxy: ${type}|${host}|${port}|${user ? '***' : ''}|${pass ? '***' : ''}`);
            }

            // Create profile via Hidemium API
            console.log(`🔨 Creating profile: ${profileName}...`);
            console.log(`   📱 Resolution: ${profileConfig.resolution}`);
            console.log(`   🎨 Canvas: ${profileConfig.canvas}, WebGL: ${profileConfig.webgl}`);
            console.log(`   🌍 Timezone: ${profileConfig.timezone}, Language: ${profileConfig.language}`);
            console.log(`   💻 CPU: ${profileConfig.hardwareConcurrency} cores, RAM: ${profileConfig.deviceMemory}GB`);

            const createResponse = await axios.post(
                'http://127.0.0.1:2222/create-profile-custom',
                profileConfig
            );

            console.log('📦 Create response:', createResponse.data);

            // Check if creation was successful
            const responseData = createResponse.data;
            const isSuccess = responseData.type === 'success' || responseData.content?.uuid;
            const uuid = responseData.content?.uuid || responseData.uuid;

            if (isSuccess && uuid) {
                profiles.push({
                    uuid: uuid,
                    name: profileName,
                    ...profileConfig
                });
                console.log(`✅ Created profile: ${profileName} (${uuid})`);
            } else {
                console.error(`❌ Failed to create profile: ${profileName}`, responseData);
            }
        }

        res.json({
            success: true,
            profiles: profiles
        });
    } catch (error) {
        console.error('❌ Create profile error:', error.response?.data || error.message);
        res.json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Start profile
app.post('/api/profiles/:uuid/start', async (req, res) => {
    try {
        const { uuid } = req.params;
        const axios = require('axios');

        const response = await axios.get('http://127.0.0.1:2222/openProfile', {
            params: {
                uuid: uuid,
                command: '--window-position=100,100 --window-size=1280,800'
            }
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Stop profile
app.post('/api/profiles/:uuid/stop', async (req, res) => {
    try {
        const { uuid } = req.params;
        const axios = require('axios');

        const response = await axios.get('http://127.0.0.1:2222/closeProfile', {
            params: { uuid: uuid }
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Delete profile
app.delete('/api/profiles/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const axios = require('axios');

        // Delete profile via Hidemium API
        console.log(`🗑️ Deleting profile: ${uuid}`);

        // Use correct endpoint from API docs - uuid_browser must be an array
        const response = await axios.delete('http://127.0.0.1:2222/v1/browser/destroy', {
            params: {
                uuid_browser: [uuid], // Must be array!
                is_local: false
            }
        });

        console.log('✅ Delete response:', response.data);

        res.json({
            success: true,
            message: 'Profile deleted',
            data: response.data
        });

    } catch (error) {
        console.error('❌ Delete profile error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Check captcha balance
app.get('/api/captcha/balance', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ success: false, error: 'API key required' });
        }

        const axios = require('axios');
        const response = await axios.get(`https://autocaptcha.pro/apiv3/balance?key=${key}`);

        console.log('Balance response:', response.data);

        res.json(response.data);
    } catch (error) {
        console.error('Balance check error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SIM API PROXY (codesim.net) - Fix CORS
// ============================================

// Check SIM balance
app.get('/api/sim/balance', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ success: false, error: 'API key required' });
        }

        const axios = require('axios');
        const response = await axios.get(`https://apisim.codesim.net/yourself/information-by-api-key?api_key=${key}`);

        console.log('SIM Balance response:', response.data);

        if (response.data.status === 200 && response.data.data) {
            res.json({
                success: true,
                balance: response.data.data.balance,
                balanceFormatted: response.data.data.balance.toLocaleString('vi-VN') + ' VNĐ',
                username: response.data.data.username || 'Unknown'
            });
        } else {
            res.json({
                success: false,
                error: response.data.message || 'Invalid API key'
            });
        }
    } catch (error) {
        console.error('SIM Balance check error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get phone number from codesim
app.get('/api/sim/get-phone', async (req, res) => {
    try {
        const { key, serviceId = 49, phonePrefix = '08' } = req.query;

        if (!key) {
            return res.status(400).json({ success: false, error: 'API key required' });
        }

        const axios = require('axios');
        const url = `https://apisim.codesim.net/sim/get_sim?service_id=${serviceId}&phone=${phonePrefix}&api_key=${key}`;
        const response = await axios.get(url);

        console.log('Get phone response:', response.data);

        if (response.data.status === 200 && response.data.data) {
            res.json({
                success: true,
                phone: response.data.data.phone,
                simId: response.data.data.simId,
                otpId: response.data.data.otpId
            });
        } else {
            res.json({
                success: false,
                error: response.data.message || 'Failed to get phone number'
            });
        }
    } catch (error) {
        console.error('Get phone error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get OTP from codesim
app.get('/api/sim/get-otp', async (req, res) => {
    try {
        const { key, otpId } = req.query;

        if (!key || !otpId) {
            return res.status(400).json({ success: false, error: 'API key and OTP ID required' });
        }

        const axios = require('axios');
        const url = `https://apisim.codesim.net/otp/get_otp_by_phone_api_key?otp_id=${otpId}&api_key=${key}`;
        const response = await axios.get(url);

        console.log('Get OTP response:', response.data);

        if (response.data.status === 200 && response.data.data && response.data.data.code) {
            res.json({
                success: true,
                code: response.data.data.code
            });
        } else {
            res.json({
                success: false,
                waiting: true // Still waiting for OTP
            });
        }
    } catch (error) {
        console.error('Get OTP error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel SIM
app.get('/api/sim/cancel', async (req, res) => {
    try {
        const { key, simId } = req.query;

        if (!key || !simId) {
            return res.status(400).json({ success: false, error: 'API key and SIM ID required' });
        }

        const axios = require('axios');
        const url = `https://apisim.codesim.net/sim/cancel_api_key/${simId}?api_key=${key}`;
        const response = await axios.get(url);

        console.log('Cancel SIM response:', response.data);

        if (response.data.status === 200) {
            res.json({
                success: true,
                message: 'Sim cancelled'
            });
        } else {
            res.json({
                success: false,
                error: response.data.message || 'Failed to cancel SIM'
            });
        }
    } catch (error) {
        console.error('Cancel SIM error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add automation status update (start, progress, complete)
app.post('/api/automation/status', (req, res) => {
    try {
        const status = req.body;
        console.log('📊 Received automation status:', status);

        // Store in memory for real-time updates
        if (!global.automationStatuses) {
            global.automationStatuses = new Map();
        }

        const key = `${status.username}`;
        global.automationStatuses.set(key, status);

        // If status is "completed" or "error", clear running flag
        if (status.status === 'completed' || status.status === 'error') {
            console.log(`🔄 Clearing running flag for username: ${status.username}`);

            // Find and clear running profile by username
            let clearedCount = 0;
            for (const [profileUuid, profileInfo] of global.runningProfiles.entries()) {
                if (profileInfo.username === status.username) {
                    global.runningProfiles.delete(profileUuid);
                    clearedCount++;
                    console.log(`✅ Cleared running flag for profile: ${profileUuid}`);
                }
            }

            if (clearedCount === 0) {
                console.log(`⚠️  No running profile found for username: ${status.username}`);
            }
        }

        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('❌ Error updating status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current automation statuses
app.get('/api/automation/statuses', (req, res) => {
    try {
        if (!global.automationStatuses) {
            global.automationStatuses = new Map();
        }

        const statuses = Array.from(global.automationStatuses.values());
        res.json({ success: true, statuses });
    } catch (error) {
        console.error('❌ Error getting statuses:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add automation result (called by automation scripts)
app.post('/api/automation/result', (req, res) => {
    try {
        const result = req.body;
        console.log('📊 Received automation result:', result);

        // Store in memory (could be saved to file/database later)
        if (!global.automationResults) {
            global.automationResults = [];
        }

        global.automationResults.unshift(result);

        // Keep only last 100 results
        if (global.automationResults.length > 100) {
            global.automationResults.splice(100);
        }

        res.json({ success: true, message: 'Result saved' });
    } catch (error) {
        console.error('❌ Error saving result:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Trigger results refresh (called by automation scripts when completed)
app.post('/api/automation/refresh-results', (req, res) => {
    try {
        // This endpoint is called by automation scripts to notify UI to refresh
        // The UI will listen for this via WebSocket or polling
        console.log('🔄 Results refresh requested');

        // Broadcast to all connected clients if using WebSocket
        // For now, just return success - UI will handle refresh
        res.json({ success: true, message: 'Refresh signal sent' });
    } catch (error) {
        console.error('❌ Error in refresh results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get automation results by scanning screenshots folder
app.get('/api/automation/results', (req, res) => {
    try {
        const screenshotsDir = path.join(__dirname, '../screenshots');
        const results = [];

        // Check if screenshots directory exists
        if (!fs.existsSync(screenshotsDir)) {
            return res.json({ success: true, results: [] });
        }

        // Read all username folders
        const userFolders = fs.readdirSync(screenshotsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // For each username folder, scan session subfolders
        userFolders.forEach(username => {
            const userDir = path.join(screenshotsDir, username);

            // Check if user has account info (for full automation vs promo check)
            const accountsDir = path.join(__dirname, '../accounts');
            const userAccountDir = path.join(accountsDir, username);
            const hasAccountInfo = fs.existsSync(userAccountDir) &&
                fs.readdirSync(userAccountDir).some(f => f.endsWith('.json'));

            // Check if this is old structure (files directly) or new structure (session folders)
            const items = fs.readdirSync(userDir, { withFileTypes: true });

            // Get all session folders and PNG files
            const sessionFolders = items.filter(item => item.isDirectory()).map(item => item.name);
            const pngFiles = items.filter(item => item.isFile() && item.name.endsWith('.png'));

            // Process session folders (new structure)
            if (sessionFolders.length > 0) {
                sessionFolders.forEach(sessionId => {
                    const sessionDir = path.join(userDir, sessionId);
                    const files = fs.readdirSync(sessionDir)
                        .filter(file => file.endsWith('.png'));

                    // Try to load metadata for profile name and run number
                    let profileName = 'Profile'; // Default
                    let runNumber = null;
                    const metadataPath = path.join(sessionDir, 'metadata.json');
                    if (fs.existsSync(metadataPath)) {
                        try {
                            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                            profileName = metadata.profileName || 'Profile';
                            runNumber = metadata.runNumber || null;
                        } catch (err) {
                            console.warn('⚠️  Could not read metadata:', err.message);
                        }
                    }

                    // Add each screenshot from this session
                    if (files.length > 0) {
                        files.forEach(file => {
                            const stats = fs.statSync(path.join(sessionDir, file));
                            const siteName = file.replace('.png', ''); // Filename is just sitename.png

                            results.push({
                                profileName: profileName, // Use profile name from metadata
                                username: username,
                                sessionId: sessionId, // Include session ID
                                runNumber: runNumber, // Include run number from metadata
                                siteName: siteName,
                                timestamp: stats.mtimeMs,
                                status: 'success',
                                screenshot: `/screenshots/${username}/${sessionId}/${file}`,
                                hasAccountInfo: hasAccountInfo // Flag to show account info button
                            });
                        });
                    }
                });
            }

            // Process PNG files directly (old structure) - can coexist with new structure
            if (pngFiles.length > 0) {
                pngFiles.forEach(fileItem => {
                    const file = fileItem.name;
                    const stats = fs.statSync(path.join(userDir, file));
                    const siteName = file.split('-')[0];

                    results.push({
                        profileName: 'Profile',
                        username: username,
                        sessionId: null, // No session for old structure
                        siteName: siteName,
                        timestamp: stats.mtimeMs,
                        status: 'success',
                        screenshot: `/screenshots/${username}/${file}`,
                        hasAccountInfo: hasAccountInfo // Flag to show account info button
                    });
                });
            }
        });

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, results: results });
    } catch (error) {
        console.error('❌ Error getting results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get account info for a specific site
app.get('/api/accounts/:username/:siteName', (req, res) => {
    try {
        const { username, siteName } = req.params;
        const accountsDir = path.join(__dirname, '../accounts');
        const userAccountDir = path.join(accountsDir, username);

        // Try to find account file by siteName
        // siteName might be like "Go99" but file is "m-1go99-vip.json"
        // So we need to search for files containing the siteName

        if (!fs.existsSync(userAccountDir)) {
            return res.json({ success: false, error: 'User account folder not found' });
        }

        const files = fs.readdirSync(userAccountDir).filter(f => f.endsWith('.json'));
        console.log(`📁 Found ${files.length} account files:`, files);

        // Site name mapping (screenshot site name → register site keywords)
        // Screenshot uses promoUrl domain, but account file uses registerUrl domain
        const siteMapping = {
            'go99code-store': ['go99', '1go99'],
            'nohucode-shop': ['nohu', '8nohu'],
            'tt88code-win': ['tt88', '1tt88'],
            'mmoocode-shop': ['mmoo'],
            '789pcode-store': ['789p'],
            '33wincode-com': ['33win', '3333win'],
            '88vvcode-com': ['88vv', '888vvv']
        };

        // Get mapped site keywords - normalize siteName first
        const normalizedSiteName = siteName.toLowerCase().trim();
        const siteKeywords = siteMapping[normalizedSiteName] || [siteName];
        console.log(`🔄 Searching for site: ${siteName} (normalized: ${normalizedSiteName})`);
        console.log(`🔄 Site keywords:`, siteKeywords);

        // Try to find matching file
        let accountFile = null;
        for (const file of files) {
            const fileNameLower = file.toLowerCase();
            console.log(`   Checking file: ${file}`);

            // Check if filename contains any of the keywords
            for (const keyword of siteKeywords) {
                const keywordLower = keyword.toLowerCase();
                if (fileNameLower.includes(keywordLower)) {
                    accountFile = file;
                    console.log(`✅ Found matching file: ${file} (matched keyword: ${keyword})`);
                    break;
                }
            }
            if (accountFile) break;
        }

        if (!accountFile) {
            console.log(`❌ No matching file found for site: ${siteName}`);
            console.log(`   Tried keywords:`, siteKeywords);
            console.log(`   Available files:`, files);
            return res.json({ success: false, error: 'Account file not found' });
        }

        const accountPath = path.join(userAccountDir, accountFile);
        const accountData = JSON.parse(fs.readFileSync(accountPath, 'utf8'));

        res.json({ success: true, account: accountData });
    } catch (error) {
        console.error('❌ Error getting account info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear selected results (by session)
app.delete('/api/results/clear-selected', (req, res) => {
    try {
        const { sessions } = req.body;

        if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
            return res.status(400).json({ success: false, error: 'Sessions array required' });
        }

        const screenshotsDir = path.join(__dirname, '../screenshots');

        if (!fs.existsSync(screenshotsDir)) {
            return res.json({ success: true, deletedFiles: 0, message: 'Screenshots folder does not exist' });
        }

        let deletedCount = 0;

        // Delete specific sessions
        sessions.forEach(session => {
            const { username, sessionId } = session;

            if (!username) return;

            const userDir = path.join(screenshotsDir, username);

            if (!fs.existsSync(userDir)) return;

            if (sessionId) {
                // New structure: Delete specific session folder
                const sessionDir = path.join(userDir, sessionId);

                if (fs.existsSync(sessionDir)) {
                    try {
                        // Count files before deletion
                        const files = fs.readdirSync(sessionDir);
                        const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
                        deletedCount += imageFiles.length;

                        // Delete session folder
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                        console.log(`🗑️  Deleted session: ${username}/${sessionId} (${imageFiles.length} files)`);

                        // If user folder is now empty, delete it too
                        const remainingItems = fs.readdirSync(userDir);
                        if (remainingItems.length === 0) {
                            fs.rmdirSync(userDir);
                            console.log(`🗑️  Deleted empty user folder: ${username}`);
                        }
                    } catch (err) {
                        console.error(`❌ Failed to delete session ${username}/${sessionId}:`, err.message);
                    }
                }
            } else {
                // Old structure: Delete all files in user folder (no sessions)
                try {
                    const files = fs.readdirSync(userDir);
                    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));

                    imageFiles.forEach(file => {
                        fs.unlinkSync(path.join(userDir, file));
                        deletedCount++;
                    });

                    console.log(`🗑️  Deleted ${imageFiles.length} files from: ${username}`);

                    // If folder is now empty, delete it
                    const remainingItems = fs.readdirSync(userDir);
                    if (remainingItems.length === 0) {
                        fs.rmdirSync(userDir);
                        console.log(`🗑️  Deleted empty user folder: ${username}`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to delete files for ${username}:`, err.message);
                }
            }
        });

        console.log(`✅ Cleared ${deletedCount} screenshot(s) from ${sessions.length} session(s)`);
        res.json({ success: true, deletedFiles: deletedCount, message: `Deleted ${deletedCount} file(s)` });
    } catch (error) {
        console.error('❌ Error clearing selected results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear all results and delete screenshots
app.delete('/api/results/clear', (req, res) => {
    try {
        const screenshotsDir = path.join(__dirname, '../screenshots');

        if (!fs.existsSync(screenshotsDir)) {
            return res.json({ success: true, deletedFiles: 0, message: 'Screenshots folder does not exist' });
        }

        let deletedCount = 0;

        // Function to recursively delete files in a directory
        function deleteFilesRecursive(dir) {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    // Recursively delete files in subdirectory
                    deleteFilesRecursive(itemPath);

                    // Remove empty directory
                    try {
                        fs.rmdirSync(itemPath);
                        console.log(`📁 Deleted folder: ${item}`);
                    } catch (err) {
                        console.error(`❌ Failed to delete folder ${item}:`, err.message);
                    }
                } else if (stat.isFile() && /\.(png|jpg|jpeg|gif|webp)$/i.test(item)) {
                    // Delete image file
                    try {
                        fs.unlinkSync(itemPath);
                        deletedCount++;
                        console.log(`🗑️  Deleted: ${item}`);
                    } catch (err) {
                        console.error(`❌ Failed to delete ${item}:`, err.message);
                    }
                }
            });
        }

        // Delete all files and subfolders
        deleteFilesRecursive(screenshotsDir);

        console.log(`✅ Cleared ${deletedCount} screenshot(s)`);
        res.json({ success: true, deletedFiles: deletedCount, message: `Deleted ${deletedCount} file(s)` });
    } catch (error) {
        console.error('❌ Error clearing results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Run automation (tool-specific) - Requires license
app.post('/api/automation/run', checkLicense, async (req, res) => {
    try {
        const { toolId, profileId, config } = req.body;

        console.log('🚀 Automation request:', { toolId, profileId, sites: config.sites?.length });

        // Load tool's automation script
        const tool = toolsConfig.tools.find(t => t.id === toolId);

        if (!tool) {
            throw new Error('Tool not found');
        }

        // Load and run tool-specific automation
        if (toolId === 'nohu-tool') {
            // Use AutoSequence (WORKING VERSION from hidemium-tool-cu)
            const AutoSequence = require('../tools/nohu-tool/auto-sequence');

            // Read extension scripts
            const contentScript = fs.readFileSync(path.join(__dirname, '../tools/nohu-tool/extension/content.js'), 'utf8');
            const captchaSolver = fs.readFileSync(path.join(__dirname, '../tools/nohu-tool/extension/captcha-solver.js'), 'utf8');
            const banksScript = fs.readFileSync(path.join(__dirname, '../tools/nohu-tool/extension/banks.js'), 'utf8');

            const scripts = {
                contentScript,
                captchaSolver,
                banksScript
            };

            // Add session ID to config (for organizing screenshots by run)
            const sessionId = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19); // YYYY-MM-DDTHH-MM-SS
            config.sessionId = sessionId;

            // Calculate run number for this username
            const username = config.username || 'Unknown';
            const screenshotsDir = path.join(__dirname, '../screenshots');
            const userDir = path.join(screenshotsDir, username);
            let runNumber = 1;

            if (fs.existsSync(userDir)) {
                // Count existing sessions for this username
                const existingSessions = fs.readdirSync(userDir, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .length;
                runNumber = existingSessions + 1;
            }

            config.runNumber = runNumber;
            config.profileId = profileId; // Add profileId to config for automation script

            // Create automation instance
            const autoSequence = new AutoSequence(config, scripts);

            // Run automation in background (don't wait)
            runNohuAutomationInBackground(autoSequence, profileId, config);

            // Return immediately
            res.json({
                success: true,
                message: 'NOHU automation started in background (using proven working version)'
            });
        } else if (toolId === 'hai2vip-tool') {
            // Use Hai2vipAutomation from local tool folder
            const Hai2vipAutomation = require('../tools/hai2vip-tool/automation');

            // Create automation instance
            const automation = new Hai2vipAutomation(profileId, config);

            // Check if specific action requested
            const action = config.action || 'full';

            // Run automation in background (don't wait)
            let automationPromise;

            switch (action) {
                case 'register':
                    automationPromise = automation.runRegisterOnly();
                    break;
                case 'login':
                    automationPromise = automation.runLoginOnly();
                    break;
                case 'withdraw':
                    automationPromise = automation.runWithdrawOnly();
                    break;
                case 'phone':
                    automationPromise = automation.runPhoneVerifyOnly();
                    break;
                case 'promo':
                    automationPromise = automation.runPromoOnly();
                    break;
                default:
                    automationPromise = automation.runFullSequence();
            }

            automationPromise
                .then(result => {
                    console.log(`✅ HAI2VIP ${action} completed:`, result);
                })
                .catch(error => {
                    console.error(`❌ HAI2VIP ${action} failed:`, error);
                });

            // Return immediately
            res.json({
                success: true,
                message: `HAI2VIP ${action} automation started in background`
            });
        } else {
            throw new Error('Tool automation not implemented');
        }
    } catch (error) {
        console.error('❌ Automation API error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// AUTOMATION HELPERS
// ============================================

// NOHU Tool - Using proven working version from hidemium-tool-cu
async function runNohuAutomationInBackground(autoSequence, profileId, config) {
    // Get dashboard port and username for status updates (declare at function scope)
    const axios = require('axios');
    const dashboardPort = global.DASHBOARD_PORT || 3000;
    const username = config.username || 'Unknown';

    try {
        console.log('🚀 Starting NOHU automation (proven working version)...');

        // Connect to Hidemium profile
        const puppeteer = require('puppeteer-core');

        // Open profile
        console.log('📂 Opening profile:', profileId);
        const openResponse = await axios.get('http://127.0.0.1:2222/openProfile', {
            params: {
                uuid: profileId,
                command: '--remote-debugging-port=0'
            }
        });

        console.log('📦 Hidemium response:', JSON.stringify(openResponse.data, null, 2));

        // Extract connection info
        const data = openResponse.data.data || openResponse.data;
        const webSocket = data.web_socket || data.webSocket;

        if (!webSocket) {
            throw new Error('Failed to get web_socket from Hidemium');
        }

        console.log('🔌 WebSocket URL:', webSocket);

        // Connect puppeteer
        const browser = await puppeteer.connect({
            browserWSEndpoint: webSocket,
            defaultViewport: null
        });

        console.log('✅ Connected to browser');

        // Get profile name from Hidemium
        let profileName = 'Profile'; // Default fallback
        try {
            const profileResponse = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
                params: { is_local: false }
            });
            const profiles = profileResponse.data?.data?.content || [];
            const profile = profiles.find(p => p.uuid === profileId);
            if (profile && profile.name) {
                profileName = profile.name;
                console.log('📋 Profile name:', profileName);
            }
        } catch (err) {
            console.warn('⚠️  Could not get profile name:', err.message);
        }

        // Track running profile in server memory
        global.runningProfiles.set(profileId, {
            username: username,
            profileName: profileName,
            startTime: Date.now()
        });
        console.log(`✅ Tracking running profile: ${profileId} (${username})`);

        // Send "start" status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                username: username,
                profileName: profileName,
                sessionId: config.sessionId, // Include sessionId
                status: 'running',
                sites: config.sites || [],
                timestamp: Date.now()
            });
            console.log('📤 Sent "start" status to dashboard');
        } catch (err) {
            console.error('⚠️  Failed to send start status:', err.message);
        }

        // Save session metadata (profile name, username, etc.)
        const sessionMetadata = {
            profileId: profileId,
            profileName: profileName,
            username: username,
            sessionId: config.sessionId,
            runNumber: config.runNumber || 1,
            startTime: Date.now(),
            sites: config.sites || []
        };

        // Create session folder and save metadata
        const sessionDir = path.join(__dirname, '../screenshots', username, config.sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(sessionDir, 'metadata.json'),
            JSON.stringify(sessionMetadata, null, 2)
        );
        console.log('💾 Saved session metadata');

        // Wait for browser to initialize (reduced for speed)
        console.log('⏳ Waiting 1 second for browser to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if this is a standalone action (not full sequence)
        const action = config.action || 'full';

        switch (action) {
            case 'sms':
                console.log('💬 Running SMS sequence (Register → Add Bank only)...');
                const smsResult = await autoSequence.runSmsSequence(browser, config, config.sites);
                console.log('✅ SMS sequence completed:', smsResult);
                break;

            case 'checkPromoOnly':
                console.log('🎁 Running standalone check promo...');
                const promoResult = await autoSequence.runCheckPromoOnly(browser, config, config.sites);
                console.log('✅ Check promo completed:', promoResult);
                break;

            case 'registerOnly':
                console.log('📝 Running standalone register...');
                const registerResult = await autoSequence.runRegisterOnly(browser, config, config.sites);
                console.log('✅ Register completed:', registerResult);
                break;

            case 'loginOnly':
                console.log('🔐 Running standalone login...');
                const loginResult = await autoSequence.runLoginOnly(browser, config, config.sites);
                console.log('✅ Login completed:', loginResult);
                break;

            case 'addBankOnly':
                console.log('💳 Running standalone add bank...');
                const bankResult = await autoSequence.runAddBankOnly(browser, config, config.sites);
                console.log('✅ Add bank completed:', bankResult);
                break;

            default:
                // Run full AutoSequence (proven working version)
                const result = await autoSequence.runSequence(browser, config, config.sites);
                console.log('✅ NOHU automation completed:', result);
                break;
        }

        // Send "complete" status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                username: username,
                profileName: 'Profile',
                status: 'completed',
                sites: config.sites || [],
                timestamp: Date.now()
            });
            console.log('📤 Sent "complete" status to dashboard');
        } catch (err) {
            console.error('⚠️  Failed to send complete status:', err.message);
        }

    } catch (error) {
        console.error('❌ NOHU automation failed:', error);

        // Send "error" status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                username: username,
                profileName: 'Profile',
                status: 'error',
                error: error.message,
                sites: config.sites || [],
                timestamp: Date.now()
            });
            console.log('📤 Sent "error" status to dashboard');
        } catch (err) {
            console.error('⚠️  Failed to send error status:', err.message);
        }
    }
}

// OLD automation helper (for other tools)
async function runAutomationInBackground(automation, profileId, config) {
    try {
        console.log('🚀 Starting automation in background...');

        // Connect to Hidemium profile
        const axios = require('axios');
        const puppeteer = require('puppeteer-core');

        // Open profile
        console.log('📂 Opening profile:', profileId);
        const openResponse = await axios.get('http://127.0.0.1:2222/openProfile', {
            params: {
                uuid: profileId,
                command: '--remote-debugging-port=0'
            }
        });

        console.log('📦 Hidemium response:', JSON.stringify(openResponse.data, null, 2));

        // Extract connection info from Hidemium response
        const data = openResponse.data.data || openResponse.data;
        const webSocket = data.web_socket || data.webSocket;

        if (!webSocket) {
            console.error('❌ Response structure:', openResponse.data);
            throw new Error('Failed to get web_socket from Hidemium');
        }

        console.log('🔌 WebSocket URL:', webSocket);

        // Connect puppeteer using WebSocket
        const browser = await puppeteer.connect({
            browserWSEndpoint: webSocket,
            defaultViewport: null
        });

        console.log('✅ Connected to browser');

        // Wait for browser to fully load before starting any automation (reduced for speed)
        console.log('⏳ Waiting 1 second for browser to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create SHARED login context (like extension's shared login window)
        console.log('🪟 Creating shared login context...');
        const sharedLoginContext = await browser.createIncognitoBrowserContext();
        console.log('✅ Shared login context created');

        // Run automation for all sites in PARALLEL (faster)
        console.log(`\n🚀 Starting ${config.sites.length} sites in parallel...`);

        // STEP 1: ĐĂNG KÝ (parallel tất cả sites, trong main browser)
        console.log('\n📝 STEP 1: Registration for all sites (main browser)...');
        const registrationPromises = config.sites.map(async (site) => {
            console.log(`📍 Registering ${site.name}...`);

            try {
                const regResult = await automation.runRegistration(browser, site.registerUrl || site.url, {
                    username: config.username,
                    fullname: config.fullname,
                    password: config.password,
                    withdrawPassword: config.withdrawPassword,
                    apiKey: config.apiKey
                });

                if (regResult.success) {
                    console.log(`   ✅ ${site.name} registration successful`);
                    return {
                        site: site.name,
                        registerUrl: site.registerUrl || site.url,
                        loginUrl: site.loginUrl,
                        promoUrl: site.promoUrl,
                        success: true
                    };
                } else {
                    console.log(`   ❌ ${site.name} registration failed`);
                    return { site: site.name, success: false };
                }
            } catch (error) {
                console.error(`   ❌ ${site.name} registration error:`, error.message);
                return { site: site.name, success: false };
            }
        });

        const registrationResults = await Promise.all(registrationPromises);
        const successfulSites = registrationResults.filter(r => r.success);

        console.log(`\n✅ Registration completed: ${successfulSites.length}/${config.sites.length} successful`);

        if (successfulSites.length === 0) {
            console.log('❌ No sites registered successfully, stopping automation');
            return;
        }

        // STEP 2: ĐĂNG NHẬP (parallel cho sites thành công, trong SHARED context)
        console.log('\n🔐 STEP 2: Login for successful sites (shared context)...');
        const loginPromises = successfulSites.map(async (siteInfo) => {
            if (!siteInfo.loginUrl) {
                console.log(`   ⚠️ ${siteInfo.site}: No login URL, skipping`);
                return { ...siteInfo, loginSuccess: false };
            }

            console.log(`📍 Logging in ${siteInfo.site}...`);

            try {
                // Use SHARED login context instead of main browser
                const loginResult = await automation.runLogin(sharedLoginContext, siteInfo.loginUrl, {
                    username: config.username,
                    password: config.password,
                    apiKey: config.apiKey
                });

                if (loginResult.success) {
                    console.log(`   ✅ ${siteInfo.site} login successful`);
                    return { ...siteInfo, loginSuccess: true };
                } else {
                    console.log(`   ❌ ${siteInfo.site} login failed`);
                    return { ...siteInfo, loginSuccess: false };
                }
            } catch (error) {
                console.error(`   ❌ ${siteInfo.site} login error:`, error.message);
                return { ...siteInfo, loginSuccess: false };
            }
        });

        const loginResults = await Promise.all(loginPromises);
        const loggedInSites = loginResults.filter(r => r.loginSuccess);

        console.log(`\n✅ Login completed: ${loggedInSites.length}/${successfulSites.length} successful`);

        if (loggedInSites.length === 0) {
            console.log('❌ No sites logged in successfully, stopping automation');
            return;
        }

        // Close registration tabs for sites that logged in successfully
        console.log('\n🗑️ Closing registration tabs for logged in sites...');
        const mainPages = await browser.pages();
        console.log(`   Found ${mainPages.length} tabs in main browser`);

        for (const siteInfo of loggedInSites) {
            console.log(`   Looking for ${siteInfo.site} registration tab...`);
            const registerDomain = new URL(siteInfo.registerUrl).hostname;
            console.log(`   Register domain: ${registerDomain}`);

            let found = false;
            for (const page of mainPages) {
                try {
                    const url = page.url();
                    console.log(`     Checking tab: ${url}`);

                    // Close registration page of this site
                    if (url.includes(registerDomain) && (url.includes('/Register') || url.includes('?f='))) {
                        console.log(`   🗑️ Closing ${siteInfo.site} registration tab: ${url}`);
                        await page.close();
                        found = true;
                        break; // Only close one tab per site
                    }
                } catch (e) {
                    console.log(`     Error checking tab: ${e.message}`);
                }
            }

            if (!found) {
                console.log(`   ⚠️ ${siteInfo.site} registration tab not found`);
            }
        }
        console.log('✅ Registration tabs closed for logged in sites');

        // STEP 3: THÊM NGÂN HÀNG (nếu có thông tin bank)
        if (config.bankName && config.accountNumber) {
            console.log('\n💳 STEP 3: Adding bank for logged in sites...');
            const bankPromises = loggedInSites.map(async (siteInfo) => {
                console.log(`📍 Adding bank to ${siteInfo.site}...`);

                try {
                    // Use SHARED login context for add bank
                    const bankResult = await automation.runAddBankInContext(sharedLoginContext, siteInfo.loginUrl, {
                        bankName: config.bankName,
                        bankBranch: config.bankBranch || '',
                        accountNumber: config.accountNumber,
                        withdrawPassword: config.withdrawPassword
                    });

                    if (bankResult.success) {
                        console.log(`   ✅ ${siteInfo.site} bank added`);
                        return { ...siteInfo, bankSuccess: true };
                    } else {
                        console.log(`   ⚠️ ${siteInfo.site} bank failed: ${bankResult.message}`);
                        return { ...siteInfo, bankSuccess: false };
                    }
                } catch (error) {
                    console.error(`   ❌ ${siteInfo.site} bank error:`, error.message);
                    return { ...siteInfo, bankSuccess: false };
                }
            });

            const bankResults = await Promise.all(bankPromises);
            const sitesWithBank = bankResults.filter(r => r.bankSuccess);

            console.log(`\n✅ Add bank completed: ${sitesWithBank.length}/${loggedInSites.length} successful`);

            // STEP 4: CHECK KHUYẾN MÃI (cho sites có bank thành công)
            if (sitesWithBank.length > 0) {
                console.log('\n🎁 STEP 4: Checking promotions for sites with bank...');
                const promoPromises = sitesWithBank.map(async (siteInfo) => {
                    // Use promoUrl from siteInfo
                    if (siteInfo.promoUrl) {
                        console.log(`📍 Checking promotions for ${siteInfo.site}...`);

                        try {
                            const promoResult = await automation.runCheckPromotion(browser, siteInfo.promoUrl, config.username, config.apiKey);
                            console.log(`   ✅ ${siteInfo.site}: ${promoResult.promotions?.length || 0} promotions found`);
                            return { ...siteInfo, promoSuccess: true };
                        } catch (error) {
                            console.error(`   ❌ ${siteInfo.site} promo error:`, error.message);
                            return { ...siteInfo, promoSuccess: false };
                        }
                    } else {
                        console.log(`   ⚠️ ${siteInfo.site}: No promo URL configured`);
                        return { ...siteInfo, promoSuccess: false };
                    }
                });

                await Promise.all(promoPromises);
                console.log('\n✅ Promotion check completed');
            }
        }

        // Final summary
        console.log('\n📊 Summary:');
        registrationResults.forEach(r => {
            console.log(`   ${r.success ? '✅' : '❌'} ${r.site}`);
        });

        console.log('✅ All sites processed');

        // Keep browser and contexts open for inspection
        console.log('ℹ️  Browser and login context kept open for inspection');
        console.log(`   Main browser: ${(await browser.pages()).length} tabs`);
        console.log(`   Login context: ${(await sharedLoginContext.pages()).length} tabs`);

    } catch (error) {
        console.error('❌ Automation failed:', error);
    }
}

// ============================================
// ADMIN ROUTES - Package Management
// Only available if admin-api.js exists (master version)
// ============================================

if (adminAPI) {
    console.log('✅ Admin features enabled');

    // Admin page
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'admin.html'));
    });

    // Customer Manager page
    app.get('/admin/customers', (req, res) => {
        res.sendFile(path.join(__dirname, 'customer-manager.html'));
    });

    // Build package
    app.post('/api/admin/build-package', async (req, res) => {
        try {
            const result = await adminAPI.buildPackage(req.body);
            res.json(result);
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // List packages
    app.get('/api/admin/packages', async (req, res) => {
        try {
            const result = await adminAPI.listPackages();
            res.json(result);
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // Generate new license key
    app.post('/api/admin/generate-key', async (req, res) => {
        try {
            console.log('🔑 Generate key request:', req.body);
            const result = await adminAPI.generateNewKey(req.body);
            console.log('🔑 Generate key result:', result);
            res.json(result);
        } catch (error) {
            console.error('❌ Generate key error:', error);
            res.json({ success: false, message: error.message });
        }
    });

    // Delete package
    app.delete('/api/admin/delete-package/:name', async (req, res) => {
        try {
            const result = await adminAPI.deletePackage(req.params.name);
            res.json(result);
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    });

    // Customer Machine Management APIs
    const CustomerMachineManager = require('./customer-machine-manager');
    const customerManager = new CustomerMachineManager();

    // Get all customers
    app.get('/api/admin/customers', (req, res) => {
        try {
            const customers = customerManager.getAllCustomers();
            const stats = customerManager.getStats();
            res.json({ success: true, customers, stats });
        } catch (error) {
            console.error('❌ Error getting customers:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Add or update customer
    app.post('/api/admin/customers', (req, res) => {
        try {
            const { customerName, machineId, notes } = req.body;

            if (!customerName || !machineId) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer name and machine ID are required'
                });
            }

            const customer = customerManager.addOrUpdateCustomer(customerName, machineId, notes);
            res.json({ success: true, customer });
        } catch (error) {
            console.error('❌ Error adding customer:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get specific customer
    app.get('/api/admin/customers/:customerName', (req, res) => {
        try {
            const { customerName } = req.params;
            const customer = customerManager.getCustomer(customerName);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            res.json({ success: true, customer });
        } catch (error) {
            console.error('❌ Error getting customer:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete customer
    app.delete('/api/admin/customers/:customerName', (req, res) => {
        try {
            const { customerName } = req.params;
            const success = customerManager.removeCustomer(customerName);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            res.json({ success: true, message: 'Customer deleted successfully' });
        } catch (error) {
            console.error('❌ Error deleting customer:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Generate license for customer
    app.post('/api/admin/customers/:customerName/generate-license', async (req, res) => {
        try {
            const { customerName } = req.params;
            const { expiryDays, notes } = req.body;

            const customer = customerManager.getCustomer(customerName);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            // Generate license key using customer's package
            const customerPackagePath = path.join(__dirname, '..', 'customer-packages', customerName);
            const licenseManagerPath = path.join(customerPackagePath, 'core', 'license-manager.js');

            if (!fs.existsSync(licenseManagerPath)) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer package not found. Please build package first.'
                });
            }

            // Clear require cache and load customer's license manager
            delete require.cache[require.resolve(licenseManagerPath)];
            const LicenseManager = require(licenseManagerPath);
            const licenseManager = new LicenseManager();

            // Generate license key
            const licenseKey = licenseManager.generateKey({
                expiryDays: expiryDays || 30,
                machineId: customer.machineId,
                username: customerName
            });

            // Add to license history
            customerManager.addLicenseToHistory(customerName, licenseKey, expiryDays || 30, notes);

            res.json({
                success: true,
                licenseKey,
                customer: customerManager.getCustomer(customerName)
            });
        } catch (error) {
            console.error('❌ Error generating license for customer:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Search customers
    app.get('/api/admin/customers/search/:query', (req, res) => {
        try {
            const { query } = req.params;
            const customers = customerManager.searchCustomers(query);
            res.json({ success: true, customers });
        } catch (error) {
            console.error('❌ Error searching customers:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Download package (ZIP)
    app.get('/api/admin/download-package/:name', async (req, res) => {
        try {
            const packageName = req.params.name;
            const zipPath = path.join(__dirname, '..', 'temp', `${packageName}.zip`);

            // Create temp folder if not exists
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Create ZIP
            await adminAPI.createZip(packageName, zipPath);

            // Send file
            res.download(zipPath, `${packageName}.zip`, (err) => {
                // Clean up
                if (fs.existsSync(zipPath)) {
                    fs.unlinkSync(zipPath);
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
} else {
    // Customer version - Admin routes disabled
    app.get('/admin', (req, res) => {
        res.status(403).send('Admin features not available in customer version');
    });
}

// ============================================
// START SERVER
// ============================================

(async () => {
    try {
        // Find available port starting from DEFAULT_PORT
        const PORT = await findAvailablePort(DEFAULT_PORT);

        // Store port globally so automation scripts can access it
        global.DASHBOARD_PORT = PORT;
        process.env.DASHBOARD_PORT = PORT.toString();

        app.listen(PORT, () => {
            console.log('========================================');
            console.log('  🎛️  Hidemium Multi-Tool Dashboard');
            console.log('========================================');
            console.log('');

            if (PORT !== DEFAULT_PORT) {
                console.log(`⚠️  Port ${DEFAULT_PORT} was in use`);
                console.log(`✅ Server running at: http://localhost:${PORT}`);
            } else {
                console.log(`✅ Server running at: http://localhost:${PORT}`);
            }

            console.log('');
            console.log('📋 Available tools:', toolsConfig.tools?.length || 0);
            console.log('');
            console.log('⚠️  Note: Hidemium Local API should run on http://127.0.0.1:2222');
            console.log('    Make sure Hidemium is running with Local API enabled');
            console.log('');
            console.log('Press Ctrl+C to stop the server');
            console.log('========================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
