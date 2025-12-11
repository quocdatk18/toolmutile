/**
 * Fix Test Package - Generate correct license with package's secret key
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const packageDir = 'customer-packages/test_customer_v2';
const secretKeyFile = 'customer-packages/test_customer_v2_SECRET_KEY.txt';

// Read secret key
const secretKeyContent = fs.readFileSync(secretKeyFile, 'utf8');
const secretKeyMatch = secretKeyContent.match(/Secret Key: (.+)/);

if (!secretKeyMatch) {
    console.log('❌ Could not find secret key!');
    process.exit(1);
}

const SECRET_KEY = secretKeyMatch[1].trim();
console.log(`🔐 Using secret key: ${SECRET_KEY}\n`);

// License info
const username = 'test_customer_v2';
const machineId = '48b62c73fe0a524f'; // From screenshot
const days = 7;

const now = Date.now();
const expiry = now + (days * 24 * 60 * 60 * 1000);

// Create license data
const licenseData = {
    username,
    machineId,
    expiry,
    created: now
};

// Encode
const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');

// Sign with correct secret key
const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('hex');

const licenseKey = `${encoded}.${signature}`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔑 NEW LICENSE KEY (WITH CORRECT SECRET)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📋 License Information:`);
console.log(`   Username: ${username}`);
console.log(`   Type: ${days} days`);
console.log(`   Machine Binding: YES`);
console.log(`   Machine ID: ${machineId}`);
console.log(`   Created: ${new Date(now).toLocaleString()}`);
console.log(`   Expires: ${new Date(expiry).toLocaleString()}\n`);
console.log('🔐 LICENSE KEY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(licenseKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Update LICENSE_KEY.txt in package
const licenseKeyContent = `
License Key Record
==================
Generated: ${new Date().toLocaleString()}
Username: ${username}
Type: ${days} days
Machine Binding: YES
Machine ID: ${machineId}

License Key:
${licenseKey}
`;

fs.writeFileSync(
    path.join(packageDir, 'LICENSE_KEY.txt'),
    licenseKeyContent,
    'utf8'
);

console.log(`✅ Updated: ${packageDir}/LICENSE_KEY.txt\n`);
console.log('📝 Instructions:');
console.log('   1. Copy the license key above');
console.log('   2. Paste into dashboard');
console.log('   3. Click "Activate License"\n');
