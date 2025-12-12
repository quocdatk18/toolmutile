/**
 * Quick License Test - Activate and test in dashboard
 * Usage: node quick-test-license.js [type]
 * Types: nohu, sms, both
 */

const LicenseManager = require('./core/license-manager');

const licenseManager = new LicenseManager();

const testKeys = {
    'nohu': 'eyJ1c2VybmFtZSI6ImN1c3RvbWVyIiwibWFjaGluZUlkIjpudWxsLCJleHBpcnkiOjE3NjgwMjgxNzE4NDUsImNyZWF0ZWQiOjE3NjU0MzYxNzE4NDUsImFsbG93ZWRUb29scyI6WyJub2h1LXRvb2wiXX0=.8f23642a333294015ec6f40a84552c7c2b552c6b9315d157f94a257036d86278',
    'sms': 'eyJ1c2VybmFtZSI6ImN1c3RvbWVyIiwibWFjaGluZUlkIjpudWxsLCJleHBpcnkiOjE3NjgwMjgxNzE4NDYsImNyZWF0ZWQiOjE3NjU0MzYxNzE4NDYsImFsbG93ZWRUb29scyI6WyJ0b29sLXNtcyJdfQ==.eec880c327e65cd6fccdeb040cc666772dc3e861e7f93441860a5b52b17e72e7',
    'both': 'eyJ1c2VybmFtZSI6ImN1c3RvbWVyIiwibWFjaGluZUlkIjpudWxsLCJleHBpcnkiOjE3NjgwMjgxNzE4NDYsImNyZWF0ZWQiOjE3NjU0MzYxNzE4NDYsImFsbG93ZWRUb29scyI6WyJub2h1LXRvb2wiLCJ0b29sLXNtcyJdfQ==.6554adb37522b9c24bc83eea7f680ef4f68542829042573c6591696bab3217f1'
};

const type = process.argv[2] || 'nohu';

if (!testKeys[type]) {
    console.log('❌ Invalid type. Use: nohu, sms, or both');
    process.exit(1);
}

const key = testKeys[type];
const descriptions = {
    'nohu': 'NOHU Tool Only',
    'sms': 'SMS Tool Only',
    'both': 'NOHU + SMS Tools'
};

console.log(`🔑 Activating license: ${descriptions[type]}`);
console.log(`Key: ${key.substring(0, 50)}...`);

// Save license
const saved = licenseManager.saveLicense(key);

if (saved) {
    console.log('✅ License activated successfully!');
    console.log('🌐 Now open dashboard at: http://localhost:3000');
    console.log(`📋 Expected tools: ${type === 'nohu' ? 'NOHU only' : type === 'sms' ? 'SMS only' : 'NOHU + SMS'}`);

    // Validate
    const validation = licenseManager.validateKey(key);
    if (validation.valid) {
        console.log(`🛠️  Allowed tools: ${validation.data.allowedTools.join(', ')}`);
    }
} else {
    console.log('❌ Failed to save license');
}