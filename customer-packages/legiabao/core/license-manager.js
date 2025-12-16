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
        // ⚠️ QUAN TRỌNG: Thay đổi secret key này trước khi gửi cho khách hàng!
        // Mỗi bản gửi khách nên có secret key khác nhau
        // Ví dụ: 'SECRET_CUSTOMER_001', 'SECRET_CUSTOMER_002', v.v.
        this.secretKey = 'SECRET_legiabao_14235_5375'; // Thay đổi secret này
    }

    /**
     * Lấy Machine ID (unique cho mỗi máy)
     */
    getMachineId() {
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
     * Tạo license key mới
     * @param {Object} options - { expiryDays, machineId, username, allowedTools }
     * @returns {string} License key
     */
    generateKey(options = {}) {
        const {
            expiryDays = 30, // Mặc định 30 ngày
            machineId = null, // Nếu null thì không bind machine
            username = 'user',
            allowedTools = ['nohu-tool'] // Mặc định chỉ cho phép NOHU tool
        } = options;

        const now = Date.now();
        const expiry = expiryDays === -1 ? -1 : now + (expiryDays * 24 * 60 * 60 * 1000);

        const data = {
            username,
            machineId,
            expiry,
            created: now,
            allowedTools // Danh sách tools được phép sử dụng
        };

        const dataString = JSON.stringify(data);
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(dataString)
            .digest('hex');

        // Format: BASE64(data).SIGNATURE
        const key = Buffer.from(dataString).toString('base64') + '.' + signature;

        return key;
    }

    /**
     * Validate license key
     * @param {string} key - License key
     * @returns {Object} { valid, message, data }
     */
    validateKey(key) {
        try {
            if (!key || typeof key !== 'string') {
                return { valid: false, message: 'Định dạng key không hợp lệ' };
            }

            const parts = key.split('.');
            if (parts.length !== 2) {
                return { valid: false, message: 'Định dạng key không hợp lệ' };
            }

            const [dataBase64, signature] = parts;

            // Verify signature
            const dataString = Buffer.from(dataBase64, 'base64').toString('utf8');
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(dataString)
                .digest('hex');

            if (signature !== expectedSignature) {
                return { valid: false, message: 'Key không hợp lệ - Đã bị chỉnh sửa' };
            }

            const data = JSON.parse(dataString);

            // Check expiry
            if (data.expiry !== -1 && Date.now() > data.expiry) {
                const expiryDate = new Date(data.expiry).toLocaleDateString('vi-VN');
                return {
                    valid: false,
                    message: `Bản quyền đã hết hạn vào ngày ${expiryDate}`,
                    data
                };
            }

            // Check machine binding
            if (data.machineId) {
                const currentMachineId = this.getMachineId();
                if (data.machineId !== currentMachineId) {
                    return {
                        valid: false,
                        message: 'Bản quyền này chỉ hoạt động trên máy tính khác',
                        data
                    };
                }
            }

            // Calculate remaining time
            let remainingDays = -1;
            let remainingTime = null;
            if (data.expiry !== -1) {
                const msRemaining = data.expiry - Date.now();
                remainingDays = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

                // Calculate detailed time for display
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
                    ...data,
                    remainingDays,
                    remainingTime,
                    isLifetime: data.expiry === -1
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
     * Kiểm tra license hiện tại
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

        return this.validateKey(key);
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
            console.log('🔒 First activation - binding to this machine...');

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

            console.log('✅ License bound to machine:', currentMachineId);
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
            console.log('ℹ️  Auto-delete ZIP not available (master version)');
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
