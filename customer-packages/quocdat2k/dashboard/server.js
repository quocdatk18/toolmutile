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

    // Get customer display name if available
    let customerDisplayName = null;
    try {
        const customerConfigPath = path.join(__dirname, '../.customer-config.json');
        if (fs.existsSync(customerConfigPath)) {
            const config = JSON.parse(fs.readFileSync(customerConfigPath, 'utf8'));
            customerDisplayName = config.displayName;
        }
    } catch (err) {
        console.log('ℹ️ No customer config found');
    }

    res.json({
        success: true,
        licensed: info !== null || checkResult.isMaster,
        isMaster: checkResult.isMaster || false,
        info,
        machineId,
        customerDisplayName
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

// Get allowed tools from license
app.get('/api/license/allowed-tools', (req, res) => {
    try {
        const allowedTools = licenseManager.getAllowedTools();

        res.json({
            success: true,
            allowedTools: allowedTools
        });
    } catch (error) {
        console.error('Error getting allowed tools:', error);
        res.json({
            success: false,
            allowedTools: [],
            error: error.message
        });
    }
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

        // Get limit and offset from query params (for pagination)
        // Default: load ALL profiles (use very high limit)
        const limit = parseInt(req.query.limit) || 10000; // Default 10000 profiles (load all)
        const offset = parseInt(req.query.offset) || 0;

        console.log(`📂 Loading profiles: limit=${limit}, offset=${offset}`);

        const response = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
            params: {
                is_local: false,
                limit: limit,
                offset: offset
            }
        });

        const profiles = response.data?.data?.content || [];
        const total = response.data?.data?.total || profiles.length;

        console.log(`✅ Loaded ${profiles.length} profiles (total: ${total})`);
        console.log(`📊 Hidemium response:`, {
            contentLength: profiles.length,
            total: total,
            requestedLimit: limit,
            offset: offset,
            hasMore: profiles.length < total
        });

        // If Hidemium has pagination limit, load all profiles in batches
        let allProfiles = [...profiles];
        if (profiles.length < total && profiles.length > 0) {
            console.log(`⚠️ Hidemium returned ${profiles.length} but total is ${total}. Loading remaining profiles...`);

            // Load remaining profiles in batches
            let currentOffset = offset + profiles.length;
            while (currentOffset < total) {
                try {
                    const batchResponse = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
                        params: {
                            is_local: false,
                            limit: limit,
                            offset: currentOffset
                        }
                    });

                    const batchProfiles = batchResponse.data?.data?.content || [];
                    console.log(`📦 Batch ${currentOffset}: loaded ${batchProfiles.length} profiles`);

                    if (batchProfiles.length === 0) break;

                    allProfiles = [...allProfiles, ...batchProfiles];
                    currentOffset += batchProfiles.length;
                } catch (batchError) {
                    console.error(`❌ Error loading batch at offset ${currentOffset}:`, batchError.message);
                    break;
                }
            }

            console.log(`✅ Total profiles loaded: ${allProfiles.length}`);
        }

        // Add running status from server's global.runningProfiles
        const profilesWithStatus = allProfiles.map(profile => ({
            ...profile,
            isRunning: global.runningProfiles && global.runningProfiles.has(profile.uuid)
        }));

        res.json({
            success: true,
            data: profilesWithStatus,
            total: total,
            limit: limit,
            offset: offset,
            count: allProfiles.length,
            loadedAll: allProfiles.length === total
        });
    } catch (error) {
        console.error('❌ Error loading profiles:', error.message);
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
            console.log(`🔄 Clearing running flag for profile: ${status.profileId} (${status.profileName})`);

            // Clear running profile by profileId (most accurate)
            let clearedCount = 0;
            if (status.profileId && global.runningProfiles.has(status.profileId)) {
                global.runningProfiles.delete(status.profileId);
                clearedCount++;
                console.log(`✅ Cleared running flag for profile: ${status.profileId} (${status.profileName})`);
            } else {
                // Fallback: clear by profileName if profileId not found
                for (const [profileUuid, profileInfo] of global.runningProfiles.entries()) {
                    if (profileInfo.profileName === status.profileName) {
                        global.runningProfiles.delete(profileUuid);
                        clearedCount++;
                        console.log(`✅ Cleared running flag for profile: ${profileUuid} (${status.profileName})`);
                        break; // Only clear first match
                    }
                }
            }

            if (clearedCount === 0) {
                console.log(`⚠️  No running profile found for: ${status.profileId} (${status.profileName})`);
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

// Get current VIP automation statuses (same as automation statuses for now)
app.get('/api/vip-automation/statuses', (req, res) => {
    try {
        if (!global.automationStatuses) {
            global.automationStatuses = new Map();
        }

        const statuses = Array.from(global.automationStatuses.values());
        res.json({ success: true, statuses });
    } catch (error) {
        console.error('❌ Error getting VIP statuses:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current running profiles (for frontend sync)
app.get('/api/profiles/running', (req, res) => {
    try {
        if (!global.runningProfiles) {
            global.runningProfiles = new Map();
        }

        const runningProfiles = Array.from(global.runningProfiles.entries()).map(([profileId, info]) => ({
            profileId,
            username: info.username,
            profileName: info.profileName,
            startTime: info.startTime
        }));

        res.json({ success: true, runningProfiles });
    } catch (error) {
        console.error('❌ Error getting running profiles:', error);
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
        const toolFilter = req.query.tool; // Filter by tool if provided
        const results = [];

        // Check if screenshots directory exists
        if (!fs.existsSync(screenshotsDir)) {
            return res.json({ success: true, results: [] });
        }

        // Check for new structure: screenshots/toolId/username/session/
        // And old structure: screenshots/username/session/
        const items = fs.readdirSync(screenshotsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        let userFolders = [];
        let toolFolders = [];

        // Detect structure type
        items.forEach(item => {
            const itemPath = path.join(screenshotsDir, item);
            const subItems = fs.readdirSync(itemPath, { withFileTypes: true });

            // If contains session folders (timestamp format), it's a username folder (old structure)
            const hasSessionFolders = subItems.some(sub =>
                sub.isDirectory() && /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(sub.name)
            );

            if (hasSessionFolders) {
                userFolders.push(item); // Old structure: screenshots/username/
            } else {
                toolFolders.push(item); // New structure: screenshots/toolId/
            }
        });

        // Process new structure: screenshots/toolId/username/session/
        toolFolders.forEach(toolId => {
            // Skip if tool filter is specified and doesn't match
            if (toolFilter && toolId !== toolFilter) {
                return;
            }

            const toolDir = path.join(screenshotsDir, toolId);
            const toolUserFolders = fs.readdirSync(toolDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            toolUserFolders.forEach(username => {
                processUserFolder(username, path.join(toolDir, username), toolId, results);
            });
        });

        // Process old structure: screenshots/username/session/ (for backward compatibility)
        userFolders.forEach(username => {
            processUserFolder(username, path.join(screenshotsDir, username), null, results, toolFilter);
        });

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, results });
    } catch (error) {
        console.error('❌ Error getting automation results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to process user folder
function processUserFolder(username, userDir, toolId, results, toolFilter = null) {
    // Check if user has account info (for full automation vs promo check)
    // New path: ../accounts/nohu/username
    const accountsDir = path.join(__dirname, '../accounts/nohu');
    const userAccountDir = path.join(accountsDir, username);
    const hasAccountInfo = fs.existsSync(userAccountDir) &&
        fs.readdirSync(userAccountDir).some(f => f.endsWith('.txt') || f.endsWith('.json'));

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

            // Try to load metadata for profile name, run number, and tool info
            let profileName = 'Profile'; // Default
            let runNumber = null;
            let sessionToolId = toolId || 'nohu-tool'; // Use provided toolId or default
            const metadataPath = path.join(sessionDir, 'metadata.json');
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    profileName = metadata.profileName || 'Profile';
                    runNumber = metadata.runNumber || null;
                    sessionToolId = metadata.toolId || sessionToolId; // Use metadata toolId if available
                } catch (err) {
                    console.warn('⚠️  Could not read metadata:', err.message);
                }
            }

            // Skip if tool filter is specified and doesn't match
            if (toolFilter && sessionToolId !== toolFilter) {
                return; // Skip this session
            }

            // Add each screenshot from this session
            if (files.length > 0) {
                files.forEach(file => {
                    const stats = fs.statSync(path.join(sessionDir, file));
                    const siteName = file.replace('.png', ''); // Filename is just sitename.png

                    // Determine screenshot path based on structure
                    const screenshotPath = toolId
                        ? `/screenshots/${toolId}/${username}/${sessionId}/${file}` // New structure
                        : `/screenshots/${username}/${sessionId}/${file}`; // Old structure

                    results.push({
                        profileName: profileName, // Use profile name from metadata
                        username: username,
                        sessionId: sessionId, // Include session ID
                        runNumber: runNumber, // Include run number from metadata
                        toolId: sessionToolId, // Include tool ID
                        siteName: siteName,
                        timestamp: stats.mtimeMs,
                        status: 'success',
                        screenshot: screenshotPath,
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

            // For old structure, try to guess tool from site name or default to nohu-tool
            const guessedToolId = toolId || 'nohu-tool'; // Use provided toolId or default

            // Skip if tool filter is specified and doesn't match
            if (toolFilter && guessedToolId !== toolFilter) {
                return; // Skip this result
            }

            // Determine screenshot path based on structure
            const screenshotPath = toolId
                ? `/screenshots/${toolId}/${username}/${file}` // New structure
                : `/screenshots/${username}/${file}`; // Old structure

            results.push({
                profileName: 'Profile',
                username: username,
                sessionId: null, // No session for old structure
                toolId: guessedToolId, // Guessed tool ID for old structure
                siteName: siteName,
                timestamp: stats.mtimeMs,
                status: 'success',
                screenshot: screenshotPath,
                hasAccountInfo: hasAccountInfo // Flag to show account info button
            });
        });
    }
}

// Get NOHU account info (MUST be before generic :username/:siteName route)
app.get('/api/accounts/nohu/:username', (req, res) => {
    try {
        const { username } = req.params;
        // Try multiple paths to find accounts folder
        let nohuAccountDir = null;
        const possiblePaths = [
            path.join(__dirname, '../accounts/nohu', username),
            path.join(__dirname, 'accounts/nohu', username),
            path.join(process.cwd(), 'accounts/nohu', username)
        ];

        for (const tryPath of possiblePaths) {
            if (fs.existsSync(tryPath)) {
                nohuAccountDir = tryPath;
                console.log(`✅ Found account folder: ${tryPath}`);
                break;
            }
        }

        if (!nohuAccountDir) {
            console.error(`❌ Account folder not found for ${username}. Tried paths:`, possiblePaths);
            return res.json({ success: false, error: 'User account folder not found' });
        }

        // Read shared account file (account.json)
        const sharedAccountFile = path.join(nohuAccountDir, 'account.json');
        console.log(`🔍 Looking for: ${sharedAccountFile}`);

        if (fs.existsSync(sharedAccountFile)) {
            console.log(`✅ Found shared account file for NOHU: account.json`);
            const accountData = JSON.parse(fs.readFileSync(sharedAccountFile, 'utf8'));
            // Ensure sites field exists (for backward compatibility with old data)
            if (!accountData.sites) {
                accountData.sites = [];
            }
            return res.json({ success: true, account: accountData });
        }

        // Fallback: Try to find any account file (for legacy data)
        const files = fs.readdirSync(nohuAccountDir).filter(f => f.endsWith('.json'));
        console.log(`📁 Files in folder:`, files);

        if (files.length > 0) {
            console.log(`📁 No shared account file, using first available: ${files[0]}`);
            const accountPath = path.join(nohuAccountDir, files[0]);
            const accountData = JSON.parse(fs.readFileSync(accountPath, 'utf8'));
            // Ensure sites field exists (for backward compatibility with old data)
            if (!accountData.sites) {
                accountData.sites = [];
            }
            return res.json({ success: true, account: accountData });
        }

        console.error(`❌ No account file found in: ${nohuAccountDir}`);
        return res.json({ success: false, error: 'No account file found' });
    } catch (error) {
        console.error('❌ Error getting NOHU account info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save NOHU account info (POST /api/accounts/nohu/:username)
app.post('/api/accounts/nohu/:username', (req, res) => {
    try {
        const { username } = req.params;
        const accountData = req.body;

        if (!accountData || !accountData.username) {
            return res.status(400).json({ success: false, error: 'Account data required' });
        }

        // Try multiple paths
        let nohuAccountDir = null;
        const possiblePaths = [
            path.join(__dirname, '../accounts/nohu', username),
            path.join(__dirname, 'accounts/nohu', username),
            path.join(process.cwd(), 'accounts/nohu', username)
        ];

        // Use first existing path or create in first path
        nohuAccountDir = possiblePaths[0];

        // Create directory if not exists
        if (!fs.existsSync(nohuAccountDir)) {
            fs.mkdirSync(nohuAccountDir, { recursive: true });
            console.log(`📁 Created NOHU account directory: ${nohuAccountDir}`);
        }

        // Save as account.json (shared for all sites)
        const accountJsonFile = path.join(nohuAccountDir, 'account.json');
        fs.writeFileSync(accountJsonFile, JSON.stringify(accountData, null, 2));
        console.log(`✅ Saved NOHU account info: ${accountJsonFile}`);

        // Also save as readable text file
        const accountTextFile = path.join(nohuAccountDir, 'account.txt');
        const sitesText = accountData.sites && accountData.sites.length > 0
            ? accountData.sites.map(s => `   • ${s}`).join('\n')
            : '   • N/A';
        const accountText = `
═══════════════════════════════════════════════════════════
                    THÔNG TIN TÀI KHOẢN NOHU
═══════════════════════════════════════════════════════════

👤 THÔNG TIN ĐĂNG NHẬP
   • Tên đăng nhập: ${accountData.username}
   • Mật khẩu: ${accountData.password}
   • Mật khẩu rút tiền: ${accountData.withdrawPassword}
   • Họ và tên: ${accountData.fullname}

💳 THÔNG TIN NGÂN HÀNG
   • Ngân hàng: ${accountData.bank?.name || 'N/A'}
   • Chi nhánh: ${accountData.bank?.branch || 'N/A'}
   • Số tài khoản: ${accountData.bank?.accountNumber || 'N/A'}

📱 CÁC TRANG ĐƯỢC ĐĂNG KÝ
${sitesText}

📅 Ngày đăng ký: ${accountData.registeredAt}

═══════════════════════════════════════════════════════════
`;
        fs.writeFileSync(accountTextFile, accountText);
        console.log(`✅ Saved account info (TXT): ${accountTextFile}`);

        res.json({ success: true, message: 'Account info saved successfully' });
    } catch (error) {
        console.error('❌ Error saving NOHU account info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get account info for VIP (any category)
app.get('/api/accounts/vip/:username', (req, res) => {
    try {
        const { username } = req.params;
        const accountsDir = path.join(__dirname, '../accounts');
        const vipDir = path.join(accountsDir, 'vip');

        if (!fs.existsSync(vipDir)) {
            return res.json({ success: false, error: 'VIP accounts folder not found' });
        }

        // Try to find any VIP category file (okvip, abcvip, jun88, kjc)
        const validCategories = ['okvip', 'abcvip', 'jun88', 'kjc'];
        let accountData = null;

        for (const category of validCategories) {
            const userCategoryDir = path.join(vipDir, category, username);
            const accountFile = path.join(userCategoryDir, `${category}.json`);
            if (fs.existsSync(accountFile)) {
                console.log(`📁 Found ${category} account file for VIP`);
                accountData = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
                break;
            }
        }

        // If not found in standard categories, search recursively
        if (!accountData) {
            console.log(`🔍 Searching recursively for ${username} in VIP folder...`);

            function searchRecursive(dir) {
                try {
                    const items = fs.readdirSync(dir, { withFileTypes: true });

                    for (const item of items) {
                        const fullPath = path.join(dir, item.name);

                        if (item.isDirectory()) {
                            // Check if this is the username folder
                            if (item.name === username) {
                                // Look for any .json file in this folder
                                const files = fs.readdirSync(fullPath);
                                const jsonFile = files.find(f => f.endsWith('.json'));

                                if (jsonFile) {
                                    const filePath = path.join(fullPath, jsonFile);
                                    console.log(`📁 Found account file: ${filePath}`);
                                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                                }
                            }

                            // Recurse into subdirectories
                            const result = searchRecursive(fullPath);
                            if (result) return result;
                        }
                    }
                } catch (err) {
                    // Ignore errors in recursive search
                }
                return null;
            }

            accountData = searchRecursive(vipDir);
        }

        if (!accountData) {
            return res.json({ success: false, error: 'No VIP account file found' });
        }

        // Ensure sites field exists (for backward compatibility with old data)
        if (!accountData.sites) {
            accountData.sites = [];
        }

        res.json({ success: true, account: accountData });
    } catch (error) {
        console.error('❌ Error getting VIP account info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save account info for VIP categories (okvip, abcvip, jun88, kjc)
app.post('/api/accounts/:category/:username', (req, res) => {
    try {
        const { category, username } = req.params;
        const accountData = req.body;

        if (!accountData || !accountData.username) {
            return res.status(400).json({ success: false, error: 'Account data required' });
        }

        // Validate category
        const validCategories = ['okvip', 'abcvip', 'jun88', 'kjc'];
        if (!validCategories.includes(category.toLowerCase())) {
            return res.status(400).json({ success: false, error: 'Invalid category' });
        }

        const accountsDir = path.join(__dirname, '../accounts');
        const vipCategoryDir = path.join(accountsDir, 'vip', category);
        const userAccountDir = path.join(vipCategoryDir, username);

        // Create directory if not exists
        if (!fs.existsSync(userAccountDir)) {
            fs.mkdirSync(userAccountDir, { recursive: true });
            console.log(`📁 Created VIP account directory: ${userAccountDir}`);
        }

        // Save as category-specific JSON file
        const categoryUpper = category.toUpperCase();
        const accountJsonFile = path.join(userAccountDir, `${category}.json`);
        fs.writeFileSync(accountJsonFile, JSON.stringify(accountData, null, 2));
        console.log(`✅ Saved ${categoryUpper} account info: ${accountJsonFile}`);

        // Also save as readable text file
        const accountTextFile = path.join(userAccountDir, `${category}.txt`);
        const sitesText = accountData.sites && accountData.sites.length > 0
            ? accountData.sites.map(s => `   • ${s}`).join('\n')
            : '   • N/A';
        const accountText = `
═══════════════════════════════════════════════════════════
                    THÔNG TIN TÀI KHOẢN ${categoryUpper}
═══════════════════════════════════════════════════════════

👤 THÔNG TIN ĐĂNG NHẬP
   • Tên đăng nhập: ${accountData.username || 'N/A'}
   • Mật khẩu: ${accountData.password || 'N/A'}
   • Mật khẩu rút tiền: ${accountData.withdrawPassword || 'N/A'}
   • Họ và tên: ${accountData.fullname || 'N/A'}

💳 THÔNG TIN NGÂN HÀNG
   • Ngân hàng: ${accountData.bank?.name || 'N/A'}
   • Chi nhánh: ${accountData.bank?.branch || 'N/A'}
   • Số tài khoản: ${accountData.bank?.accountNumber || 'N/A'}

📱 CÁC TRANG ĐƯỢC ĐĂNG KÝ
${sitesText}

📅 Ngày đăng ký: ${accountData.registeredAt || new Date().toLocaleString('vi-VN')}
📍 Danh mục: ${accountData.category || category}

═══════════════════════════════════════════════════════════
`;
        fs.writeFileSync(accountTextFile, accountText);
        console.log(`✅ Saved ${categoryUpper} account text: ${accountTextFile}`);

        res.json({ success: true, message: `Account info saved successfully for ${categoryUpper}` });
    } catch (error) {
        console.error('❌ Error saving account info:', error);
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
            const { username, sessionId, toolId } = session;

            if (!username) return;

            if (sessionId) {
                // Try new structure first: screenshots/{toolId}/{username}/{sessionId}/
                let sessionDir = null;

                if (toolId) {
                    const toolUserDir = path.join(screenshotsDir, toolId, username);
                    const newSessionDir = path.join(toolUserDir, sessionId);
                    if (fs.existsSync(newSessionDir)) {
                        sessionDir = newSessionDir;
                    }
                }

                // Fallback to old structure: screenshots/{username}/{sessionId}/
                if (!sessionDir) {
                    const userDir = path.join(screenshotsDir, username);
                    const oldSessionDir = path.join(userDir, sessionId);
                    if (fs.existsSync(oldSessionDir)) {
                        sessionDir = oldSessionDir;
                    }
                }

                if (sessionDir) {
                    try {
                        // Count files before deletion
                        const files = fs.readdirSync(sessionDir);
                        const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|webp|json)$/i.test(f));
                        deletedCount += imageFiles.length;

                        // Delete session folder
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                        console.log(`🗑️  Deleted session: ${sessionDir} (${imageFiles.length} files)`);

                        // If user folder is now empty, delete it too
                        const userDir = path.dirname(sessionDir);
                        if (fs.existsSync(userDir)) {
                            const remainingItems = fs.readdirSync(userDir);
                            if (remainingItems.length === 0) {
                                fs.rmdirSync(userDir);
                                console.log(`🗑️  Deleted empty user folder: ${userDir}`);

                                // If toolId folder is now empty, delete it too
                                if (toolId) {
                                    const toolDir = path.dirname(userDir);
                                    if (fs.existsSync(toolDir)) {
                                        const toolItems = fs.readdirSync(toolDir);
                                        if (toolItems.length === 0) {
                                            fs.rmdirSync(toolDir);
                                            console.log(`🗑️  Deleted empty tool folder: ${toolDir}`);
                                        }
                                    }
                                }
                            }
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

        console.log('🚀 Automation request:', { toolId, profileId, sites: config?.sites?.length || 0 });
        console.log('🔧 Execution Mode:', config?.executionMode);
        console.log('🔧 Parallel Count:', config?.parallelCount);

        // Check if user has permission to use this tool
        const allowedTools = licenseManager.getAllowedTools();
        if (!allowedTools.includes('*') && !allowedTools.includes(toolId)) {
            console.warn(`❌ Unauthorized: User does not have permission to use ${toolId}`);
            return res.status(403).json({
                success: false,
                error: `Bạn không có quyền sử dụng tool này. Vui lòng nâng cấp license.`
            });
        }

        // Load tool's automation script
        const tool = toolsConfig.tools.find(t => t.id === toolId);

        if (!tool) {
            throw new Error('Tool not found');
        }

        // Load and run tool-specific automation
        if (toolId === 'nohu-tool') {
            // Use AutoSequence (WORKING VERSION from hidemium-tool-cu)
            const AutoSequence = require('../tools/nohu-tool/auto-sequence');

            // Read extension scripts (using original content.js - has full checkPromotion logic like quocdat)
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
            runNohuAutomationInBackground(autoSequence, profileId, config, toolId);

            // Return immediately
            res.json({
                success: true,
                message: 'NOHU automation started in background (using proven working version)'
            });
        } else if (toolId === 'tool-sms') {
            // SMS Tool automation (like nohu-tool)
            console.log('📱 Starting SMS Tool automation...');

            // Check if promo mode
            if (config.mode === 'promo') {
                console.log('🎁 SMS Tool - Promo check mode');

                const SmsToolOptimized = require('../tools/sms-tool/optimized-automation');
                const smsToolOptimized = new SmsToolOptimized();

                // Run promo check in background (don't await, let it run async)
                runSMSPromoCheckInBackground(smsToolOptimized, profileId, config, toolId)
                    .catch(err => {
                        console.error('❌ Background promo check error:', err);
                        // Send error status
                        const axios = require('axios');
                        axios.post(`http://localhost:${global.DASHBOARD_PORT || 3000}/api/automation/status`, {
                            status: 'error',
                            profileId: profileId,
                            error: err.message,
                            tool: toolId,
                            mode: 'promo'
                        }).catch(e => console.warn('Could not send error status:', e.message));
                    });

                res.json({
                    success: true,
                    message: 'SMS promo check started in background'
                });
            } else {
                // Auto mode - full automation
                const SMSAutoSequence = require('../tools/sms-tool/auto-sequence');

                // Validate config object for SMS tool
                if (!config) {
                    throw new Error('Config object is required for SMS tool');
                }

                // Read extension scripts from SMS tool directory (using simplified content script)
                const contentScript = fs.readFileSync(path.join(__dirname, '../tools/sms-tool/extension/content.js'), 'utf8');
                const captchaSolver = fs.readFileSync(path.join(__dirname, '../tools/sms-tool/extension/captcha-solver.js'), 'utf8');
                const banksScript = fs.readFileSync(path.join(__dirname, '../tools/sms-tool/extension/banks.js'), 'utf8');

                const scripts = {
                    contentScript,
                    captchaSolver,
                    banksScript
                };

                // Add session ID to config (for organizing screenshots by run)
                const sessionId = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19); // YYYY-MM-DDTHH-MM-SS
                config.sessionId = sessionId;

                // Create SMS automation instance
                const smsAutoSequence = new SMSAutoSequence(config, scripts);

                // Run SMS automation in background (like nohu-tool)
                runSMSAutomationInBackground(smsAutoSequence, profileId, config, toolId);

                res.json({
                    success: true,
                    message: 'SMS automation started in background'
                });
            }
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

// SMS Tool promo check function - open checkUrl for selected sites
async function runSMSPromoCheckInBackground(smsToolOptimized, profileId, config, toolId) {
    const axios = require('axios');
    const dashboardPort = global.DASHBOARD_PORT || 3000;

    try {
        console.log('🎁 [BACKGROUND] Starting SMS promo check...');
        console.log('🎁 [BACKGROUND] ProfileId:', profileId);
        console.log('🎁 [BACKGROUND] Sites:', config.sites);
        console.log('🎁 [BACKGROUND] Username:', config.username);

        // Connect to Hidemium profile
        const puppeteer = require('puppeteer-core');

        // Open profile
        console.log('🎁 [BACKGROUND] 📂 Opening profile:', profileId);
        const openResponse = await axios.get('http://127.0.0.1:2222/openProfile', {
            params: {
                uuid: profileId,
                command: '--remote-debugging-port=0'
            }
        });

        console.log('🎁 [BACKGROUND] ✅ Got response from Hidemium');
        const data = openResponse.data.data || openResponse.data;
        const webSocket = data.web_socket || data.webSocket;

        if (!webSocket) {
            throw new Error('Failed to get web_socket from Hidemium');
        }

        console.log('🎁 [BACKGROUND] 🔌 WebSocket URL:', webSocket);

        // Connect puppeteer
        console.log('🎁 [BACKGROUND] 🔗 Connecting to browser...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: webSocket,
            defaultViewport: null
        });

        console.log('🎁 [BACKGROUND] ✅ Connected to browser');

        // Get profile name
        let profileName = 'Profile';
        try {
            const profileResponse = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
                params: { is_local: false }
            });
            const profiles = profileResponse.data?.data?.content || [];
            const profile = profiles.find(p => p.uuid === profileId);
            if (profile && profile.name) {
                profileName = profile.name;
            }
        } catch (err) {
            console.warn('⚠️ Could not get profile name:', err.message);
        }

        // Track running profile
        global.runningProfiles.set(profileId, {
            username: config.username,
            profileName: profileName,
            tool: toolId,
            mode: 'promo',
            startTime: new Date()
        });

        // Run promo check for each selected site
        const results = [];
        for (const siteName of config.sites) {
            try {
                console.log(`🎁 [BACKGROUND] Checking promo for: ${siteName}`);

                const siteUrls = smsToolOptimized.getSiteUrls(siteName);
                const siteConfig = smsToolOptimized.siteConfigs[siteName];

                if (!siteUrls || !siteConfig) {
                    console.warn(`🎁 [BACKGROUND] ⚠️ No config found for site: ${siteName}`);
                    continue;
                }

                console.log(`🎁 [BACKGROUND] 📍 Site URLs:`, siteUrls);
                const site = { name: siteName };
                // Pass userData with mode: 'promo' so checkPromo knows it's promo mode
                const userData = {
                    mode: 'promo',
                    username: config.username || ''
                };
                console.log(`🎁 [BACKGROUND] 🚀 Calling checkPromo for ${siteName}...`);
                const result = await smsToolOptimized.checkPromo(browser, site, siteUrls, siteConfig, userData, {});
                results.push(result);

                console.log(`🎁 [BACKGROUND] ✅ Promo check completed for ${siteName}:`, result);
            } catch (error) {
                console.error(`🎁 [BACKGROUND] ❌ Error checking promo for ${siteName}:`, error);
                results.push({
                    success: false,
                    site: siteName,
                    error: error.message
                });
            }
        }

        console.log('🎁 [BACKGROUND] ✅ SMS promo check completed');

        // Send completion status
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                status: 'complete',
                profileId: profileId,
                username: config.username,
                profileName: profileName,
                tool: toolId,
                mode: 'promo',
                results: results
            });
        } catch (err) {
            console.warn('⚠️ Could not send completion status:', err.message);
        }

    } catch (error) {
        console.error('❌ SMS promo check error:', error);

        // Send error status
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                status: 'error',
                profileId: profileId,
                error: error.message,
                tool: toolId,
                mode: 'promo'
            });
        } catch (err) {
            console.warn('⚠️ Could not send error status:', err.message);
        }
    } finally {
        // Remove from running profiles
        global.runningProfiles.delete(profileId);
    }
}

// SMS Tool automation function (like nohu-tool)
async function runSMSAutomationInBackground(smsAutoSequence, profileId, config, toolId) {
    const axios = require('axios');
    const dashboardPort = global.DASHBOARD_PORT || 3000;
    const username = config.username || 'Unknown';

    try {
        console.log('📱 Starting SMS automation...');

        // Connect to Hidemium profile (same as nohu-tool)
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

        // Track running profile in server memory (like nohu tool)
        global.runningProfiles.set(profileId, {
            username: config.username,
            profileName: profileName,
            startTime: Date.now()
        });
        console.log(`✅ Tracking SMS running profile: ${profileId} (${config.username})`);

        // Send running status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                profileId: profileId,
                profileName: profileName,
                username: config.username, // Add username for clearing running flag
                toolId: toolId,
                sessionId: config.sessionId,
                status: 'running',
                sites: config.sites || [],
                timestamp: Date.now()
            });
        } catch (statusError) {
            console.warn('⚠️ Failed to send running status:', statusError.message);
        }

        // Prepare profile data for SMS (include bank info for auto-redirect)
        const profileData = {
            profileId: profileId,
            username: username,
            password: config.password,
            withdrawPassword: config.withdrawPassword,
            fullname: config.fullname,
            email: config.email,
            phone: config.phone,
            bankName: config.bankName || 'Vietcombank', // Default for testing
            bankBranch: config.bankBranch || 'Thành phố Hồ Chí Minh', // Default for testing
            accountNumber: config.accountNumber || '9704361234567890', // Default for testing
            apiKey: config.apiKey || 'default_api_key'
        };

        console.log('📊 Profile data prepared:', {
            username: profileData.username,
            bankName: profileData.bankName,
            bankBranch: profileData.bankBranch,
            accountNumber: profileData.accountNumber
        });

        // Run SMS sequence (register with auto-redirect like nohu tool)
        console.log('🤖 Running SMS sequence (Register → Auto-redirect → Keep open)...');
        const smsResult = await smsAutoSequence.runSmsSequence(browser, profileData, config.sites || []);
        console.log('✅ SMS sequence completed:', smsResult);

        // Send success status to dashboard
        if (smsResult.success) {
            try {
                await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                    profileId: profileId,
                    profileName: profileName,
                    username: config.username, // Add username for clearing running flag
                    toolId: toolId,
                    sessionId: config.sessionId,
                    status: 'completed',
                    sites: config.sites || [],
                    result: smsResult,
                    timestamp: Date.now()
                });
            } catch (statusError) {
                console.warn('⚠️ Failed to send success status:', statusError.message);
            }
        } else {
            // Partial success or failure
            try {
                await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                    profileId: profileId,
                    profileName: profileName,
                    username: config.username, // Add username for clearing running flag
                    toolId: toolId,
                    sessionId: config.sessionId,
                    status: 'error',
                    error: 'SMS automation incomplete - some steps failed',
                    sites: config.sites || [],
                    result: smsResult,
                    timestamp: Date.now()
                });
            } catch (statusError) {
                console.warn('⚠️ Failed to send partial status:', statusError.message);
            }
        }

    } catch (error) {
        console.error('❌ SMS automation failed:', error);

        // Send error status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                profileId: profileId,
                profileName: profileName || 'Profile',
                username: config.username, // Add username for clearing running flag
                toolId: toolId,
                sessionId: config.sessionId || 'unknown',
                status: 'error',
                error: error.message,
                sites: config.sites || [],
                timestamp: Date.now()
            });
        } catch (statusError) {
            console.warn('⚠️ Failed to send error status:', statusError.message);
        }
    }
}

// NOHU Tool - Using proven working version from hidemium-tool-cu
async function runNohuAutomationInBackground(autoSequence, profileId, config, toolId) {
    // Get dashboard port and username for status updates (declare at function scope)
    const axios = require('axios');
    const dashboardPort = global.DASHBOARD_PORT || 3000;
    const username = config.username || 'Unknown';

    try {
        console.log('🚀 Starting NOHU automation (proven working version)...');
        console.log('🎯 Received profileId:', profileId);
        console.log('🎯 Received profileId type:', typeof profileId);

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
                profileId: profileId,
                username: username,
                profileName: profileName,
                sessionId: config.sessionId,
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
            toolId: toolId, // Add tool ID to metadata
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
                const smsResult = await autoSequence.runSmsSequence(browser, config, config.sites || []);
                console.log('✅ SMS sequence completed:', smsResult);
                break;

            case 'checkPromoOnly':
                console.log('🎁 Running standalone check promo...');
                const promoResult = await autoSequence.runCheckPromoOnly(browser, config, config.sites || []);
                console.log('✅ Check promo completed:', promoResult);
                break;

            case 'registerOnly':
                console.log('📝 Running standalone register...');
                const registerResult = await autoSequence.runRegisterOnly(browser, config, config.sites || []);
                console.log('✅ Register completed:', registerResult);
                break;

            case 'loginOnly':
                console.log('🔐 Running standalone login...');
                const loginResult = await autoSequence.runLoginOnly(browser, config, config.sites || []);
                console.log('✅ Login completed:', loginResult);
                break;

            case 'addBankOnly':
                console.log('💳 Running standalone add bank...');
                const bankResult = await autoSequence.runAddBankOnly(browser, config, config.sites || []);
                console.log('✅ Add bank completed:', bankResult);
                break;

            default:
                // Run full AutoSequence (proven working version)
                const result = await autoSequence.runSequence(browser, config, config.sites || []);
                console.log('✅ NOHU automation completed:', result);

                // Check if automation truly completed all steps successfully
                const isFullyCompleted = result && result.results && result.results.length > 0 &&
                    result.results.every(siteResult =>
                        siteResult.register?.success &&
                        siteResult.login?.success &&
                        siteResult.addBank?.success &&
                        (siteResult.checkPromo?.success || siteResult.checkPromo?.skipped)
                    );

                if (isFullyCompleted) {
                    // Send "complete" status to dashboard only if truly completed
                    try {
                        await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                            profileId: profileId,
                            profileName: profileName,
                            username: username,
                            status: 'completed',
                            sites: config.sites || [],
                            timestamp: Date.now()
                        });
                        console.log('📤 Sent "complete" status to dashboard');
                    } catch (err) {
                        console.error('⚠️  Failed to send complete status:', err.message);
                    }
                } else {
                    console.log('⚠️  Automation incomplete - not sending "complete" status');
                    console.log('   Result summary:', result?.results?.map(r => ({
                        site: r.site,
                        register: r.register?.success,
                        login: r.login?.success,
                        addBank: r.addBank?.success,
                        checkPromo: r.checkPromo?.success || r.checkPromo?.skipped
                    })));

                    // Send "error" status instead since automation didn't complete fully
                    try {
                        await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                            profileId: profileId,
                            profileName: profileName,
                            username: username,
                            status: 'error',
                            error: 'Automation incomplete - some steps failed',
                            sites: config.sites || [],
                            timestamp: Date.now()
                        });
                        console.log('📤 Sent "error" status for incomplete automation');
                    } catch (err) {
                        console.error('⚠️  Failed to send error status:', err.message);
                    }
                }
                break;
        }

    } catch (error) {
        console.error('❌ NOHU automation failed:', error);

        // Send "error" status to dashboard
        try {
            await axios.post(`http://localhost:${dashboardPort}/api/automation/status`, {
                profileId: profileId,
                profileName: profileName,
                username: username,
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
        const sites = config.sites || [];
        console.log(`\n🚀 Starting ${sites.length} sites in parallel...`);

        // STEP 1: ĐĂNG KÝ (parallel tất cả sites, trong main browser)
        console.log('\n📝 STEP 1: Registration for all sites (main browser)...');
        const registrationPromises = sites.map(async (site) => {
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

        console.log(`\n✅ Registration completed: ${successfulSites.length}/${sites.length} successful`);

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
// ============================================
// VIP AUTOMATION API
// ============================================

// Get category config (sites list)
app.get('/api/vip-automation/category/:category', (req, res) => {
    try {
        const VIPAutomation = require('../tools/vip-tool/vip-automation');
        const vipAutomation = new VIPAutomation();
        const categoryConfig = vipAutomation.getSitesByCategory(req.params.category);

        if (categoryConfig) {
            res.json({ success: true, data: categoryConfig });
        } else {
            res.status(404).json({ success: false, error: 'Category not found' });
        }
    } catch (error) {
        console.error('❌ Error getting category config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Run VIP automation
app.post('/api/vip-automation/run', checkLicense, async (req, res) => {
    try {
        const { category, sites, profile, profileData, mode, executionMode, parallelCount, profileId } = req.body;

        // Check if user has permission to use VIP tool
        const allowedTools = licenseManager.getAllowedTools();
        if (!allowedTools.includes('*') && !allowedTools.includes('vip-tool')) {
            console.warn('❌ Unauthorized: User does not have permission to use VIP tool');
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền sử dụng VIP Tool. Vui lòng nâng cấp license.'
            });
        }

        console.log('🚀 VIP Automation started:', {
            category,
            sites: sites.length,
            profile: profile.name,
            profileId: profileId,
            mode,
            executionMode
        });

        // Import VIPAutomation
        const VIPAutomation = require('../tools/vip-tool/vip-automation');
        const fs = require('fs');
        const path = require('path');

        // Read extension scripts (like nohu-tool)
        const captchaSolver = fs.readFileSync(path.join(__dirname, '../tools/nohu-tool/extension/captcha-solver.js'), 'utf8');

        const scripts = {
            captchaSolver
        };

        // Get API key from profileData (like nohu-tool) or environment
        const apiKey = profileData?.apiKey || process.env.CAPTCHA_API_KEY;

        const settings = {
            captchaApiKey: apiKey
        };

        console.log('🔑 API Key available:', apiKey ? 'YES' : 'NO');
        console.log('📊 profileData received:', {
            username: profileData?.username,
            apiKey: profileData?.apiKey ? `${profileData.apiKey.substring(0, 5)}...` : 'MISSING'
        });

        const vipAutomation = new VIPAutomation(settings, scripts);

        // Get Puppeteer browser instance
        const puppeteer = require('puppeteer-core');
        const axios = require('axios');

        // Get Hidemium browser connection
        let browser = null;
        try {
            // Connect to Hidemium Local API
            const response = await axios.get('http://127.0.0.1:2222/v1/browser/list', {
                params: { is_local: false }
            });

            if (!response.data?.data?.content || response.data.data.content.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No Hidemium profiles available'
                });
            }

            // Get specified profile or use first available
            let hidemiumProfile = null;

            if (profileId) {
                // Use specified profile
                hidemiumProfile = response.data.data.content.find(p => p.uuid === profileId);
                if (!hidemiumProfile) {
                    console.warn(`⚠️ Profile ${profileId} not found in Hidemium, using first available`);
                    hidemiumProfile = response.data.data.content[0];
                }
            } else {
                // Fallback to first available
                hidemiumProfile = response.data.data.content[0];
            }

            console.log(`📱 Using Hidemium profile: ${hidemiumProfile.name} (UUID: ${hidemiumProfile.uuid})`);

            // Open profile in Hidemium
            const openResponse = await axios.get('http://127.0.0.1:2222/openProfile', {
                params: {
                    uuid: hidemiumProfile.uuid,
                    command: '--remote-debugging-port=0'
                }
            });

            console.log('📋 Hidemium openProfile response:', JSON.stringify(openResponse.data, null, 2));

            // Get WebSocket endpoint from Hidemium response
            const wsEndpoint = openResponse.data?.data?.web_socket;
            const remotePort = openResponse.data?.data?.remote_port;

            if (!wsEndpoint && !remotePort) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to get connection info from Hidemium',
                    response: openResponse.data
                });
            }

            console.log(`🔗 Connecting to Hidemium WebSocket: ${wsEndpoint}`);

            // Connect Puppeteer to Hidemium via WebSocket
            browser = await puppeteer.connect({
                browserWSEndpoint: wsEndpoint,
                defaultViewport: null
            });

            console.log('✅ Connected to Hidemium browser');

            // Run automation
            const results = await vipAutomation.runVIPAutomation(
                browser,
                category,
                sites,
                profileData,
                mode,
                executionMode,
                parallelCount
            );

            console.log('✅ VIP Automation completed:', results);

            // Save results to file (like NOHU tool)
            const screenshotsDir = path.join(__dirname, '../screenshots');
            const toolDir = path.join(screenshotsDir, 'vip-tool');
            const username = profileData?.username || 'unknown';
            const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
            const sessionDir = path.join(toolDir, username, sessionId);

            // Create directories
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            // Save metadata
            const metadata = {
                profileName: profile?.name || 'Profile',
                runNumber: 1,
                toolId: 'vip-tool',
                category: category,
                sites: sites,
                mode: mode,
                executionMode: executionMode,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(path.join(sessionDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

            // Save results as JSON
            fs.writeFileSync(path.join(sessionDir, 'results.json'), JSON.stringify(results, null, 2));

            // Create dummy screenshot files for each site (for UI display)
            results.forEach(result => {
                const screenshotFile = path.join(sessionDir, `${result.site}.png`);
                // Create empty file (UI will use this to detect results)
                fs.writeFileSync(screenshotFile, '');
            });

            console.log(`✅ Results saved to: ${sessionDir}`);

            res.json({ success: true, results });

        } catch (error) {
            console.error('❌ VIP Automation Error:', error.message);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            // Close browser connection
            if (browser) {
                try {
                    await browser.disconnect();
                    console.log('🔌 Disconnected from Hidemium');
                } catch (err) {
                    console.error('Error disconnecting:', err.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ VIP Automation Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ADMIN API
// ============================================

// Only available if admin-api.js exists (master version)
// ============================================

if (adminAPI) {
    console.log('✅ Admin features enabled');

    // Admin page
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'admin.html'));
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

    // Upgrade package - Tạo package mới với Machine ID cũ, GIỮ NGUYÊN SECRET KEY
    app.post('/api/admin/upgrade-package/:name', async (req, res) => {
        try {
            const { machineId, licenseHistory } = req.body;
            const customerName = req.params.name;

            console.log(`🔄 Upgrading package: ${customerName} with Machine ID: ${machineId}`);

            const oldPackagePath = path.join(__dirname, '..', 'customer-packages', customerName);
            const oldLicenseFile = path.join(oldPackagePath, '.license');
            let oldLicenseContent = null;

            // Step 1: Read old license file BEFORE deleting
            console.log('📦 Step 1: Reading old license file...');
            if (fs.existsSync(oldLicenseFile)) {
                try {
                    oldLicenseContent = fs.readFileSync(oldLicenseFile, 'utf8').trim();
                    console.log(`✅ Found old license file`);
                } catch (err) {
                    console.warn(`⚠️ Could not read old license file: ${err.message}`);
                }
            } else {
                console.log('ℹ️  No old license file found');
            }

            // Step 2: Read old secret key BEFORE deleting
            console.log('📦 Step 2: Reading old secret key...');
            const secretKeyFile = path.join(__dirname, '..', 'customer-packages', `${customerName}_SECRET_KEY.txt`);
            let oldSecretKey = null;

            if (fs.existsSync(secretKeyFile)) {
                const secretKeyContent = fs.readFileSync(secretKeyFile, 'utf8');
                const secretKeyMatch = secretKeyContent.match(/Secret Key: (.+)/);
                if (secretKeyMatch) {
                    oldSecretKey = secretKeyMatch[1].trim();
                    console.log(`🔐 Found old secret key: ${oldSecretKey.substring(0, 20)}...`);
                }
            }

            if (!oldSecretKey) {
                console.warn('⚠️ Could not find old secret key, will generate new one');
            }

            // Step 3: Delete old package
            console.log('📦 Step 3: Deleting old package...');
            await adminAPI.deletePackage(customerName);

            // Step 4: Build new package with latest code, REUSING OLD SECRET KEY
            console.log('📦 Step 4: Building new package with latest code...');
            const buildResult = await adminAPI.buildPackage({
                customerName: customerName,
                licenseType: 30,
                machineBinding: true,
                obfuscate: true,
                secretKey: oldSecretKey // Pass old secret key to reuse
            });

            if (!buildResult.success) {
                return res.json({ success: false, message: 'Lỗi tạo package mới: ' + buildResult.message });
            }

            // Step 5: Restore old license file if it existed
            console.log('📦 Step 5: Restoring old license file...');
            if (oldLicenseContent) {
                const newLicenseFile = path.join(buildResult.packagePath, '.license');
                try {
                    fs.writeFileSync(newLicenseFile, oldLicenseContent, 'utf8');
                    console.log(`✅ Old license file restored to new package`);
                } catch (err) {
                    console.warn(`⚠️ Could not restore license file: ${err.message}`);
                }
            }

            // Step 6: Restore customer machine data with old Machine ID
            console.log('📦 Step 6: Restoring Machine ID...');
            const CustomerMachineManager = require('./customer-machine-manager');
            const tempCustomerManager = new CustomerMachineManager();
            tempCustomerManager.addOrUpdateCustomer(customerName, machineId, 'Upgraded package. Machine ID, Secret Key, and License preserved.');

            const keyStatus = oldLicenseContent && oldSecretKey
                ? '✅ License key cũ VẪN HOẠT ĐỘNG!'
                : '⚠️ Cần tạo license key mới.';
            console.log(`✅ Package upgraded successfully: ${customerName}. ${keyStatus}`);

            res.json({
                success: true,
                packagePath: buildResult.packagePath,
                secretKey: buildResult.secretKey,
                secretKeyPreserved: !!oldSecretKey,
                licensePreserved: !!oldLicenseContent,
                message: oldLicenseContent && oldSecretKey
                    ? 'Package nâng cấp thành công! License key cũ vẫn hoạt động.'
                    : 'Package nâng cấp thành công! Cần tạo license key mới.'
            });

        } catch (error) {
            console.error('❌ Upgrade package error:', error);
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
            const { customerName, machineId, displayName, notes } = req.body;

            // Allow displayName update without machineId
            if (!customerName) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer name is required'
                });
            }

            // If only updating displayName (no machineId)
            if (displayName && !machineId) {
                const customer = customerManager.updateCustomerDisplayName(customerName, displayName);
                return res.json({ success: true, customer });
            }

            // If updating machineId
            if (!machineId) {
                return res.status(400).json({
                    success: false,
                    error: 'Machine ID is required'
                });
            }

            const customer = customerManager.addOrUpdateCustomer(customerName, machineId, notes, displayName);
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
            const { expiryDays, allowedTools, notes } = req.body;

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
                username: customerName,
                allowedTools: allowedTools || ['nohu-tool'] // Default to NOHU only
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

    // Unlock Machine ID (admin only, for special cases)
    app.post('/api/admin/customers/:customerName/unlock-machine-id', (req, res) => {
        try {
            const { customerName } = req.params;
            const { reason } = req.body;

            if (!reason || reason.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Lý do unlock phải có ít nhất 10 ký tự'
                });
            }

            const success = customerManager.unlockMachineId(customerName, reason.trim());

            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            res.json({
                success: true,
                message: 'Machine ID đã được unlock',
                customer: customerManager.getCustomer(customerName)
            });
        } catch (error) {
            console.error('❌ Error unlocking Machine ID:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get license history for customer
    app.get('/api/admin/customers/:customerName/license-history', (req, res) => {
        try {
            const { customerName } = req.params;
            console.log(`📋 Getting license history for customer: ${customerName}`);

            const customer = customerManager.getCustomer(customerName);

            if (!customer) {
                console.log(`❌ Customer not found: ${customerName}`);
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found'
                });
            }

            const history = customerManager.getLicenseHistory(customerName);
            const stats = customerManager.getLicenseStats(customerName);

            console.log(`✅ License history loaded for ${customerName}: ${history.length} records`);

            res.json({
                success: true,
                customer: customerName,
                history,
                stats
            });
        } catch (error) {
            console.error('❌ Error getting license history:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Import customers from existing packages
    app.post('/api/admin/customers/import-from-packages', async (req, res) => {
        try {
            const packagesResult = await adminAPI.listPackages();

            if (!packagesResult.success) {
                return res.json({ success: false, error: 'Cannot load packages' });
            }

            let importedCount = 0;
            const errors = [];

            for (const pkg of packagesResult.packages) {
                try {
                    // Check if customer already exists
                    const existingCustomer = customerManager.getCustomer(pkg.name);

                    if (!existingCustomer) {
                        // Add customer with placeholder Machine ID
                        customerManager.addOrUpdateCustomer(
                            pkg.name,
                            'PLACEHOLDER_MACHINE_ID', // Will be updated when customer provides real Machine ID
                            `Imported from package. Created: ${pkg.createdAt}. Size: ${pkg.size}`
                        );
                        importedCount++;
                    }
                } catch (error) {
                    errors.push(`${pkg.name}: ${error.message}`);
                }
            }

            res.json({
                success: true,
                message: `Imported ${importedCount} customers from packages`,
                importedCount,
                errors: errors.length > 0 ? errors : null
            });
        } catch (error) {
            console.error('❌ Error importing customers from packages:', error);
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

    // ============================================
    // ADVANCED OBFUSCATION API ROUTES
    // ============================================

    // Obfuscate critical files only
    app.post('/api/admin/obfuscate-critical', async (req, res) => {
        try {
            console.log('🎯 Starting critical files obfuscation...');

            const AdvancedObfuscator = require('../tools/advanced-obfuscate');
            const obfuscator = new AdvancedObfuscator();

            // Critical file patterns
            const criticalPatterns = [
                'core/license-manager.js',
                'core/api-key-manager.js',
                'core/hidemium-api.js',
                'core/profile-manager.js',
                'core/sim-api-manager.js',
                'dashboard/server.js',
                'tools/*/auto-sequence.js',
                'tools/*/complete-automation.js',
                'tools/*/automation*.js',
                'tools/*/freelxb*.js'
            ];

            const startTime = Date.now();
            await obfuscator.obfuscateSpecificFiles(criticalPatterns);
            const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

            const result = {
                success: true,
                type: 'critical',
                stats: {
                    success: obfuscator.successCount,
                    skipped: obfuscator.skippedCount,
                    failed: obfuscator.failCount
                },
                outputPath: 'Current directory (*.obfuscated.js files)',
                duration: duration,
                securityLevel: 'HIGH'
            };

            console.log('✅ Critical files obfuscation completed:', result);
            res.json(result);

        } catch (error) {
            console.error('❌ Critical obfuscation error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Obfuscate full project with streaming progress
    app.post('/api/admin/obfuscate-full', async (req, res) => {
        try {
            console.log('🔒 Starting full project obfuscation...');

            // Set headers for streaming response
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const AdvancedObfuscator = require('../tools/advanced-obfuscate');
            const obfuscator = new AdvancedObfuscator();

            // Override progress reporting to stream to client
            const originalLog = console.log;
            let fileCount = 0;
            let totalFiles = 0;

            // Estimate total files first
            const glob = require('glob');
            const jsFiles = glob.sync('**/*.js', {
                cwd: obfuscator.projectRoot,
                ignore: ['node_modules/**', '**/*.obfuscated.js', '**/*.min.js']
            });
            totalFiles = jsFiles.length;

            // Send initial progress
            res.write(JSON.stringify({
                type: 'progress',
                progress: 0,
                message: `Tìm thấy ${totalFiles} JavaScript files`,
                stats: { success: 0, skipped: 0, failed: 0 }
            }) + '\n');

            // Override obfuscator methods to report progress
            const originalObfuscateFile = obfuscator.obfuscateFile.bind(obfuscator);
            obfuscator.obfuscateFile = function (inputFile, outputFile, options, securityLevel) {
                fileCount++;
                const progress = Math.round((fileCount / totalFiles) * 100);
                const fileName = require('path').relative(this.projectRoot, inputFile);

                // Send progress update
                res.write(JSON.stringify({
                    type: 'progress',
                    progress: progress,
                    message: `[${securityLevel}] ${fileName}`,
                    stats: {
                        success: this.successCount,
                        skipped: this.skippedCount,
                        failed: this.failCount
                    }
                }) + '\n');

                // Call original method
                return originalObfuscateFile(inputFile, outputFile, options, securityLevel);
            };

            const startTime = Date.now();
            await obfuscator.obfuscateProject();
            const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

            // Send completion
            const result = {
                type: 'complete',
                result: {
                    success: true,
                    type: 'full',
                    stats: {
                        success: obfuscator.successCount,
                        skipped: obfuscator.skippedCount,
                        failed: obfuscator.failCount
                    },
                    outputPath: 'obfuscated-project/',
                    duration: duration,
                    securityLevel: 'Mixed (HIGH + MEDIUM)'
                }
            };

            res.write(JSON.stringify(result) + '\n');
            res.end();

            console.log('✅ Full project obfuscation completed');

        } catch (error) {
            console.error('❌ Full obfuscation error:', error);

            // Send error
            res.write(JSON.stringify({
                type: 'error',
                error: error.message
            }) + '\n');
            res.end();
        }
    });

    // Cancel obfuscation (placeholder)
    app.post('/api/admin/obfuscate-cancel', (req, res) => {
        console.log('🛑 Obfuscation cancel requested');
        // TODO: Implement actual cancellation logic
        res.json({ success: true, message: 'Cancel request received' });
    });

    // Download obfuscated project as ZIP
    app.get('/api/admin/download-obfuscated', async (req, res) => {
        try {
            const path = require('path');
            const archiver = require('archiver');
            const fs = require('fs');

            const obfuscatedDir = path.join(__dirname, '..', 'obfuscated-project');

            if (!fs.existsSync(obfuscatedDir)) {
                return res.status(404).json({
                    success: false,
                    error: 'Obfuscated project not found. Please run obfuscation first.'
                });
            }

            console.log('📦 Creating obfuscated project ZIP...');

            // Set response headers
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="obfuscated-project.zip"');

            // Create ZIP archive
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => {
                console.error('❌ Archive error:', err);
                res.status(500).json({ success: false, error: err.message });
            });

            // Pipe archive to response
            archive.pipe(res);

            // Add obfuscated project to archive
            archive.directory(obfuscatedDir, false);

            // Finalize archive
            await archive.finalize();

            console.log('✅ Obfuscated project ZIP created');

        } catch (error) {
            console.error('❌ Download error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Create customer package from obfuscated project
    app.post('/api/admin/create-package-from-obfuscated', async (req, res) => {
        try {
            const { customerName } = req.body;

            if (!customerName) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer name is required'
                });
            }

            console.log(`👤 Creating customer package from obfuscated project: ${customerName}`);

            const path = require('path');
            const fs = require('fs');

            const obfuscatedDir = path.join(__dirname, '..', 'obfuscated-project');
            const customerDir = path.join(__dirname, '..', 'customer-packages', customerName);

            if (!fs.existsSync(obfuscatedDir)) {
                return res.status(404).json({
                    success: false,
                    error: 'Obfuscated project not found. Please run obfuscation first.'
                });
            }

            // Copy obfuscated project to customer directory
            if (fs.existsSync(customerDir)) {
                fs.rmSync(customerDir, { recursive: true, force: true });
            }

            // Use xcopy on Windows or cp on Unix
            const { execSync } = require('child_process');
            const isWindows = process.platform === 'win32';

            if (isWindows) {
                execSync(`xcopy /E /I /Y /Q "${obfuscatedDir}" "${customerDir}"`, { stdio: 'inherit' });
            } else {
                execSync(`cp -r "${obfuscatedDir}" "${customerDir}"`, { stdio: 'inherit' });
            }

            // Create README for customer
            const readmeContent = `========================================
HIDEMIUM MULTI-TOOL (OBFUSCATED)
========================================

Customer: ${customerName}
Created: ${new Date().toLocaleString()}

INSTALLATION:
  1. Install Node.js (if not installed)
  2. Run: npm install
  3. Run: npm run dashboard

ACTIVATION:
  1. Open dashboard
  2. Click "🔐 License" button
  3. Paste your license key
  4. Click "Activate License"

SUPPORT:
  Contact seller if you have any issues

========================================
CODE PROTECTION:
This package contains obfuscated code for security.
All critical files have been protected against reverse engineering.
========================================`;

            fs.writeFileSync(path.join(customerDir, 'README.txt'), readmeContent);

            console.log(`✅ Customer package created: ${customerName}`);

            res.json({
                success: true,
                message: `Customer package created successfully: ${customerName}`,
                packagePath: `customer-packages/${customerName}`
            });

        } catch (error) {
            console.error('❌ Create package error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
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

