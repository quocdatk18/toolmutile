/**
 * License Manager - Quản lý license key cho tool
 * Hỗ trợ: Key validation, expiry check, machine binding
 */

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

class LicenseManager {
    constructor() {
        this.licenseFile = path.join(__dirname, '..', '.license');
        this.machineIdFile = path.join(__dirname, '..', '.machine-id');
        // ⚠️ QUAN TRỌNG: Thay đổi secret key này trước khi gửi cho khách hàng!
        // Mỗi bản gửi khách nên có secret key khác nhau
        // Ví dụ: 'SECRET_CUSTOMER_001', 'SECRET_CUSTOMER_002', v.v.
        this.secretKey = 'SECRET_legiabao_51452_7948'; // Thay đổi secret này

        // Auto-cleanup expired license on startup
        this.autoCleanupExpired();
    }

    /**
     * Tạo Machine ID từ MAC address + hostname
     * (Hàm nội bộ, không lưu)
     */
    _generateMachineId() {
        const networkInterfaces = os.networkInterfaces();
        const macs = [];

        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]) {
                if (net.mac && net.mac !== '00:00:00:00:00:00') {
                    macs.push(net.mac);
                }
            }
        }

        // Combine MAC addresses + hostname
        const machineString = macs.join('-') + os.hostname();
        return crypto.createHash('sha256').update(machineString).digest('hex').substring(0, 16);
    }

    /**
     * Lấy Machine ID (lưu vào file lần đầu, tái sử dụng lần sau)
     * Đảm bảo mã máy không thay đổi giữa các lần chạy
     */
    getMachineId() {
        // Kiểm tra xem mã máy đã được lưu chưa
        if (fs.existsSync(this.machineIdFile)) {
            try {
                const savedMachineId = fs.readFileSync(this.machineIdFile, 'utf8').trim();
                if (savedMachineId && savedMachineId.length === 16) {
                    return savedMachineId;
                }
            } catch (err) {
                console.warn('⚠️ Error reading saved machine ID:', err.message);
            }
        }

        // Tạo mã máy mới nếu chưa có
        const newMachineId = this._generateMachineId();

        // Lưu vào file để tái sử dụng lần sau
        try {
            fs.writeFileSync(this.machineIdFile, newMachineId, 'utf8');
            console.log(`✅ Machine ID saved: ${newMachineId}`);
        } catch (err) {
            console.warn('⚠️ Error saving machine ID:', err.message);
        }

        return newMachineId;
    }

    /**
     * Tạo license key mới (compact format)
     * Format: Compact base64 + short signature
     * Ví dụ: eyJ1IjoiY3VzdG9tZXIiLCJtIjoibWFjaGluZWlkIiwiZSI6MTczNDg4NzY0MH0.a1b2c3d4
     * @param {Object} options - { expiryDays, machineId, username, allowedTools }
     * @returns {string} License key (compact)
     */
    generateKey(options = {}) {
        const {
            expiryDays = 30, // Mặc định 30 ngày
            machineId = null, // Nếu null thì không bind machine
            username = 'user',
            allowedTools = ['nohu-tool'] // Mặc định chỉ cho phép NOHU tool
        } = options;

        const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        const expiry = expiryDays === -1 ? -1 : now + (expiryDays * 24 * 60 * 60);

        // Compact license data - minimal field names
        const licenseData = {
            u: username,
            m: machineId,
            e: expiry,
            t: allowedTools && allowedTools.length > 0 ? allowedTools : ['nohu-tool'] // Store all allowed tools as array
        };

        const dataString = JSON.stringify(licenseData);

        // Create signature and use only first 16 chars (128-bit) for compactness
        const fullSignature = crypto.createHmac('sha256', this.secretKey).update(dataString).digest('hex');
        const shortSignature = fullSignature.substring(0, 16);

        // Use URL-safe base64 encoding (replace +/ with -_)
        const base64Data = Buffer.from(dataString).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        const licenseKey = base64Data + '.' + shortSignature;

        return licenseKey;
    }

    /**
     * Validate license key (compact format)
     * @param {string} key - License key
     * @returns {Object} { valid, message, data }
     */
    validateKey(key) {
        try {
            if (!key || typeof key !== 'string') {
                return { valid: false, message: 'Định dạng key không hợp lệ' };
            }

            // Try new compact format first (BASE64.SIGNATURE)
            if (key.includes('.')) {
                const parts = key.split('.');
                if (parts.length === 2) {
                    return this._validateKeyCompact(key);
                }
            }

            // Fallback: try old V1 format
            if (key.startsWith('V1:')) {
                return this._validateKeyLegacyV1(key);
            }

            return { valid: false, message: 'Định dạng key không hợp lệ' };

        } catch (error) {
            return {
                valid: false,
                message: 'Định dạng key không hợp lệ: ' + error.message
            };
        }
    }

    /**
     * Validate compact format key (BASE64.SIGNATURE)
     */
    _validateKeyCompact(key) {
        try {
            const parts = key.split('.');
            if (parts.length !== 2) {
                return { valid: false, message: 'Định dạng key không hợp lệ' };
            }

            const [dataBase64, signature] = parts;

            // Decode base64 (handle URL-safe encoding)
            const urlSafeData = dataBase64
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            // Add padding if needed
            const padding = (4 - (urlSafeData.length % 4)) % 4;
            const paddedData = urlSafeData + '='.repeat(padding);

            const dataString = Buffer.from(paddedData, 'base64').toString('utf8');
            const data = JSON.parse(dataString);

            // Verify signature
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(dataString)
                .digest('hex')
                .substring(0, 16);

            if (signature !== expectedSignature) {
                return { valid: false, message: 'Key không hợp lệ - Đã bị chỉnh sửa' };
            }

            // Check expiry (data.e is in seconds)
            const expiryMs = data.e === -1 ? -1 : data.e * 1000;
            const now = Date.now();

            if (expiryMs !== -1 && now > expiryMs) {
                const expiryDate = new Date(expiryMs).toLocaleDateString('vi-VN');
                return {
                    valid: false,
                    message: `Bản quyền đã hết hạn vào ngày ${expiryDate}`,
                    data: { expiry: expiryMs }
                };
            }

            // Calculate remaining time
            let remainingDays = -1;
            let remainingTime = null;
            if (expiryMs !== -1) {
                const msRemaining = expiryMs - now;
                remainingDays = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

                const days = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
                const hours = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000);

                remainingTime = { days, hours, minutes, seconds, total: msRemaining };
            }

            return {
                valid: true,
                message: 'Bản quyền hợp lệ',
                data: {
                    username: data.u,
                    machineId: data.m,
                    expiry: expiryMs,
                    created: now,
                    remainingDays,
                    remainingTime,
                    isLifetime: expiryMs === -1,
                    allowedTools: Array.isArray(data.t) ? data.t : (data.t ? [data.t] : ['nohu-tool'])
                }
            };

        } catch (error) {
            return {
                valid: false,
                message: 'Định dạng key không hợp lệ: ' + error.message
            };
        }
    }

    /**
     * Validate legacy V1 format (V1:EXPIRY:MACHINE:TOOLS:SIGNATURE)
     */
    _validateKeyLegacyV1(key) {
        try {
            const parts = key.split(':');
            if (parts.length !== 5 || parts[0] !== 'V1') {
                return { valid: false, message: 'Định dạng key không hợp lệ' };
            }

            const [version, expiryStr, machineHash, toolByteStr, signature] = parts;

            // Verify signature
            const dataString = `${version}:${expiryStr}:${machineHash}:${toolByteStr}`;
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(dataString)
                .digest('hex')
                .substring(0, 8);

            if (signature !== expectedSignature) {
                return { valid: false, message: 'Key không hợp lệ - Đã bị chỉnh sửa' };
            }

            const expiry = parseInt(expiryStr) * 1000; // Convert back to milliseconds
            const now = Date.now();

            // Check expiry
            if (expiry !== -1000 && now > expiry) {
                const expiryDate = new Date(expiry).toLocaleDateString('vi-VN');
                return {
                    valid: false,
                    message: `Bản quyền đã hết hạn vào ngày ${expiryDate}`,
                    data: { expiry }
                };
            }

            // Decode tools from bitmask
            const toolMap = { 1: 'nohu-tool', 2: 'vip-tool', 4: 'sms-tool' };
            const toolBits = parseInt(toolByteStr, 16);
            const allowedTools = [];
            for (const [bit, tool] of Object.entries(toolMap)) {
                if (toolBits & parseInt(bit)) allowedTools.push(tool);
            }

            // Calculate remaining time
            let remainingDays = -1;
            let remainingTime = null;
            if (expiry !== -1000) {
                const msRemaining = expiry - now;
                remainingDays = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

                const days = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
                const hours = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000);

                remainingTime = { days, hours, minutes, seconds, total: msRemaining };
            }

            return {
                valid: true,
                message: 'Bản quyền hợp lệ',
                data: {
                    machineId: machineHash !== '00000000' ? machineHash : null,
                    expiry,
                    created: now,
                    remainingDays,
                    remainingTime,
                    isLifetime: expiry === -1000,
                    allowedTools: allowedTools.length > 0 ? allowedTools : ['nohu-tool']
                }
            };

        } catch (error) {
            return {
                valid: false,
                message: 'Định dạng key không hợp lệ: ' + error.message
            };
        }
    }

    /**
     * Lưu license key vào file
     */
    saveLicense(key) {
        try {
            fs.writeFileSync(this.licenseFile, key, 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving license:', error);
            return false;
        }
    }

    /**
     * Đọc license key từ file
     */
    loadLicense() {
        try {
            if (fs.existsSync(this.licenseFile)) {
                return fs.readFileSync(this.licenseFile, 'utf8').trim();
            }
            return null;
        } catch (error) {
            console.error('Error loading license:', error);
            return null;
        }
    }

    /**
     * Xóa license
     */
    removeLicense() {
        try {
            if (fs.existsSync(this.licenseFile)) {
                fs.unlinkSync(this.licenseFile);
            }
            return true;
        } catch (error) {
            console.error('Error removing license:', error);
            return false;
        }
    }

    /**
     * Check if this is admin/master version
     */
    isAdminVersion() {
        // Check if this is customer version first
        const customerFile = path.join(__dirname, '..', '.customer');
        if (fs.existsSync(customerFile)) {
            return false; // This is customer version
        }

        // Check if admin.html exists (master version has admin panel)
        const adminFile = path.join(__dirname, '..', 'dashboard', 'admin.html');
        return fs.existsSync(adminFile);
    }

    /**
     * Auto-cleanup expired license on startup
     * Runs once when license manager is initialized
     */
    autoCleanupExpired() {
        try {
            const key = this.loadLicense();
            if (!key) return;

            const validation = this.validateKey(key);

            // If license is expired, remove it
            if (!validation.valid && validation.message && validation.message.includes('hết hạn')) {
                console.log('🧹 Auto-cleanup: Removing expired license...');
                this.removeLicense();
                console.log('✅ Expired license removed');
            }
        } catch (error) {
            console.warn('⚠️ Auto-cleanup error:', error.message);
        }
    }

    /**
     * Kiểm tra license hiện tại
     * Tự động xóa key nếu hết hạn
     */
    checkLicense() {
        // Bypass license check for admin/master version
        if (this.isAdminVersion()) {
            return {
                valid: true,
                message: 'Master version - No license required',
                isMaster: true,
                data: {
                    username: 'Master',
                    isLifetime: true,
                    created: Date.now(),
                    expiry: -1,
                    remainingDays: -1,
                    machineId: this.getMachineId()
                }
            };
        }

        const key = this.loadLicense();

        if (!key) {
            return {
                valid: false,
                message: 'Chưa có bản quyền. Vui lòng kích hoạt bản quyền.',
                needActivation: true
            };
        }

        const validation = this.validateKey(key);

        // Auto-delete expired license
        if (!validation.valid && validation.message && validation.message.includes('hết hạn')) {
            console.log('⏰ License expired - Auto-removing...');
            this.removeLicense();
            return {
                valid: false,
                message: 'Bản quyền đã hết hạn. Vui lòng kích hoạt bản quyền mới.',
                needActivation: true,
                expired: true
            };
        }

        return validation;
    }

    /**
     * Activate license
     */
    activate(key) {
        const validation = this.validateKey(key);

        if (!validation.valid) {
            return validation;
        }

        // Check if this is first activation (machineId is null)
        // If so, bind to current machine
        const data = validation.data;
        let finalKey = key;

        if (data.machineId === null) {

            // Bind to current machine
            const currentMachineId = this.getMachineId();
            const boundData = {
                username: data.username,
                machineId: currentMachineId, // Bind to current machine
                expiry: data.expiry,
                created: data.created
            };

            // Re-sign with new data
            const dataString = JSON.stringify(boundData);
            const signature = crypto
                .createHmac('sha256', this.secretKey)
                .update(dataString)
                .digest('hex');
            finalKey = Buffer.from(dataString).toString('base64') + '.' + signature;

        }

        // Save license (with machine binding if applicable)
        const saved = this.saveLicense(finalKey);

        if (!saved) {
            return {
                valid: false,
                message: 'Không thể lưu bản quyền'
            };
        }

        // After successful activation, delete original ZIP file
        // This prevents customer from reusing the license on other machines
        try {
            const deleteZip = require('./delete-zip');
            if (deleteZip && deleteZip.deleteOriginalZip) {
                // Run in background, don't wait
                setTimeout(() => {
                    deleteZip.deleteOriginalZip();
                }, 2000); // Wait 2 seconds after activation
            }
        } catch (err) {
            // Ignore if delete-zip.js doesn't exist (master version)
            console.log('ℹ️  Cleanup script not available');
        }

        return {
            valid: true,
            message: data.machineId === null
                ? 'Kích hoạt thành công và đã bind vào máy này'
                : 'Kích hoạt bản quyền thành công',
            data: validation.data
        };
    }

    /**
     * Get license info
     */
    getLicenseInfo() {
        const result = this.checkLicense();

        if (!result.valid) {
            return null;
        }

        const data = result.data;
        const createdDate = new Date(data.created).toLocaleDateString('vi-VN');
        const expiryDate = data.expiry === -1 ? 'Lifetime' : new Date(data.expiry).toLocaleDateString('vi-VN');

        // Format remaining time
        let remainingText = '';
        if (data.isLifetime) {
            remainingText = 'Vĩnh viễn';
        } else if (data.remainingTime) {
            const { days, hours, minutes, seconds } = data.remainingTime;
            if (days > 0) {
                remainingText = `Còn ${days} ngày`;
            } else if (hours > 0) {
                remainingText = `Còn ${hours} giờ ${minutes} phút`;
            } else if (minutes > 0) {
                remainingText = `Còn ${minutes} phút ${seconds} giây`;
            } else {
                remainingText = `Còn ${seconds} giây`;
            }
        }

        return {
            username: data.username,
            machineId: data.machineId || 'Not bound',
            created: createdDate,
            expiry: expiryDate,
            remainingDays: data.remainingDays,
            remainingTime: data.remainingTime,
            remainingText: remainingText,
            isLifetime: data.isLifetime,
            allowedTools: data.allowedTools || ['nohu-tool'] // Backward compatibility
        };
    }

    /**
     * Check if license allows access to specific tool
     * @param {string} toolId - Tool ID to check
     * @returns {Object} { allowed, message }
     */
    checkToolPermission(toolId) {
        const key = this.loadLicense();
        if (!key) {
            return { allowed: false, message: 'Không có license key' };
        }

        const validation = this.validateKey(key);
        if (!validation.valid) {
            return { allowed: false, message: validation.message };
        }

        const allowedTools = validation.data.allowedTools || ['nohu-tool'];

        // Check if tool is allowed
        if (allowedTools.includes(toolId) || allowedTools.includes('*')) {
            return { allowed: true, message: 'Tool được phép sử dụng' };
        } else {
            return {
                allowed: false,
                message: `Tool "${toolId}" không có trong license. Được phép: ${allowedTools.join(', ')}`
            };
        }
    }

    /**
     * Get list of allowed tools from current license
     * @returns {Array} Array of allowed tool IDs
     */
    getAllowedTools() {
        // Admin/Master version has access to all tools
        if (this.isAdminVersion()) {
            return ['*']; // Wildcard = all tools
        }

        const key = this.loadLicense();
        if (!key) return [];

        const validation = this.validateKey(key);
        if (!validation.valid) return [];

        return validation.data.allowedTools || ['nohu-tool'];
    }
}

module.exports = LicenseManager;
