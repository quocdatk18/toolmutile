/**
 * License Key Generator
 * Tool để tạo license key cho khách hàng
 * 
 * Usage:
 *   node tools/generate-license.js --days 30 --username "customer1"
 *   node tools/generate-license.js --lifetime --username "customer2"
 *   node tools/generate-license.js --days 90 --bind --username "customer3"
 */

const LicenseManager = require('../core/license-manager');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
        options.expiryDays = parseInt(args[i + 1]);
        i++;
    } else if (args[i] === '--lifetime') {
        options.expiryDays = -1;
    } else if (args[i] === '--bind') {
        options.bindMachine = true;
    } else if (args[i] === '--username' && args[i + 1]) {
        options.username = args[i + 1];
        i++;
    } else if (args[i] === '--machine-id' && args[i + 1]) {
        options.machineId = args[i + 1];
        i++;
    }
}

// Default values
if (!options.expiryDays) {
    options.expiryDays = 30; // Default 30 days
}

if (!options.username) {
    options.username = 'customer';
}

const licenseManager = new LicenseManager();

// Get machine ID if binding
if (options.bindMachine && !options.machineId) {
    options.machineId = licenseManager.getMachineId();
}

// Generate key
const key = licenseManager.generateKey({
    expiryDays: options.expiryDays,
    machineId: options.machineId || null,
    username: options.username
});

// Validate to show info
const validation = licenseManager.validateKey(key);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔑 LICENSE KEY GENERATED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 License Information:');
console.log('   Username:', validation.data.username);
console.log('   Type:', validation.data.isLifetime ? 'LIFETIME' : `${validation.data.remainingDays} days`);
console.log('   Machine Binding:', options.machineId ? 'YES' : 'NO');
if (options.machineId) {
    console.log('   Machine ID:', options.machineId);
}
console.log('   Created:', new Date(validation.data.created).toLocaleString('vi-VN'));
if (!validation.data.isLifetime) {
    console.log('   Expires:', new Date(validation.data.expiry).toLocaleString('vi-VN'));
}

console.log('\n🔐 LICENSE KEY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(key);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Instructions:');
console.log('   1. Copy the license key above');
console.log('   2. Send to customer');
console.log('   3. Customer activates via dashboard or command line\n');

// Save to file for record
const fs = require('fs');
const path = require('path');

const recordsDir = path.join(__dirname, '..', 'license-records');
if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `license-${options.username}-${timestamp}.txt`;
const filepath = path.join(recordsDir, filename);

const record = `
License Key Record
==================
Generated: ${new Date().toLocaleString('vi-VN')}
Username: ${validation.data.username}
Type: ${validation.data.isLifetime ? 'LIFETIME' : `${validation.data.remainingDays} days`}
Machine Binding: ${options.machineId ? 'YES' : 'NO'}
${options.machineId ? `Machine ID: ${options.machineId}` : ''}

License Key:
${key}
`;

fs.writeFileSync(filepath, record, 'utf8');
console.log('💾 Record saved to:', filepath);
console.log('');
