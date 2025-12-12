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

console.log('🔑 License Generator with Tool Permissions\n');

// Hiển thị các loại license
console.log('📋 Available License Types:');
Object.keys(licenseTypes).forEach((key, index) => {
    const type = licenseTypes[key];
    console.log(`${index + 1}. ${type.name}`);
    console.log(`   Tools: ${type.allowedTools.join(', ')}`);
    console.log(`   ${type.description}\n`);
});

// Generate example licenses
console.log('🎯 Generating Example Licenses:\n');

Object.keys(licenseTypes).forEach(typeKey => {
    const type = licenseTypes[typeKey];

    const key = licenseManager.generateKey({
        expiryDays: 30, // 30 days
        machineId: null, // No machine binding
        username: 'customer',
        allowedTools: type.allowedTools
    });

    console.log(`📦 ${type.name}:`);
    console.log(`Key: ${key}`);
    console.log(`Tools: ${type.allowedTools.join(', ')}`);
    console.log('---\n');
});