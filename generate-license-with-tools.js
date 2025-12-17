/**
 * Generate License Key with Tool Permissions
 * Usage: node generate-license-with-tools.js
 */

const LicenseManager = require('./core/license-manager');

const licenseManager = new LicenseManager();

// Các loại license có thể tạo
const licenseTypes = {
    'nohu-only': {
        name: 'NOHU Tool Only',
        allowedTools: ['nohu-tool'],
        description: 'Chỉ được sử dụng NOHU Auto Tool'
    },
    'sms-only': {
        name: 'SMS Tool Only',
        allowedTools: ['tool-sms'],
        description: 'Chỉ được sử dụng SMS Auto Tool'
    },
    'nohu-sms': {
        name: 'NOHU + SMS Tools',
        allowedTools: ['nohu-tool', 'tool-sms'],
        description: 'Được sử dụng NOHU và SMS tools'
    },
    'all-tools': {
        name: 'All Tools',
        allowedTools: ['*'],
        description: 'Được sử dụng tất cả tools'
    },
    'premium': {
        name: 'Premium Package',
        allowedTools: ['nohu-tool', 'tool-sms', 'hai2vip-tool'],
        description: 'Được sử dụng tất cả tools hiện có'
    }
};

// Hiển thị các loại license
Object.keys(licenseTypes).forEach((key, index) => {
    const type = licenseTypes[key];
});

// Generate example licenses

Object.keys(licenseTypes).forEach(typeKey => {
    const type = licenseTypes[typeKey];

    const key = licenseManager.generateKey({
        expiryDays: 30, // 30 days
        machineId: null, // No machine binding
        username: 'customer',
        allowedTools: type.allowedTools
    });

});