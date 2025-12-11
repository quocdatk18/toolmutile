/**
 * Build Test Package - FINAL VERSION
 * Fix: Generate license AFTER updating secret key
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

console.log('========================================');
console.log('🔧 BUILD TEST PACKAGE - FINAL');
console.log('========================================\n');

const customerName = 'test_final';
const outputDir = path.join('customer-packages', customerName);

// Remove old package
if (fs.existsSync(outputDir)) {
    console.log('🗑️  Removing old package...');
    fs.rmSync(outputDir, { recursive: true, force: true });
    console.log('✅ Removed\n');
}

console.log('📋 Building package:');
console.log(`   Customer: ${customerName}`);
console.log('   License: Trial 7 days');
console.log('   Machine Binding: Yes\n');

// Create output folder
fs.mkdirSync(outputDir, { recursive: true });
console.log(`✅ Created: ${outputDir}`);

// Copy files
console.log('📋 Copying files...');
const copyRecursive = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

const itemsToCopy = ['core', 'dashboard', 'config', 'tools', 'package.json', 'package-lock.json', '.env'];
itemsToCopy.forEach(item => {
    const srcPath = path.join(process.cwd(), item);
    const destPath = path.join(outputDir, item);
    if (fs.existsSync(srcPath)) {
        try {
            copyRecursive(srcPath, destPath);
        } catch (err) { }
    }
});
console.log('✅ Files copied');

// Generate unique secret key
const secretKey = `SECRET_${customerName}_${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`;
console.log(`\n🔐 Secret key: ${secretKey}`);

// Update secret key in package's license-manager.js
const licenseManagerPath = path.join(outputDir, 'core', 'license-manager.js');
if (fs.existsSync(licenseManagerPath)) {
    let content = fs.readFileSync(licenseManagerPath, 'utf8');
    content = content.replace(/HIDEMIUM_TOOL_SECRET_2024/g, secretKey);
    fs.writeFileSync(licenseManagerPath, content, 'utf8');
    console.log('✅ Secret key updated in package');
}

// NOW generate license with the SAME secret key
console.log('\n🔑 Generating license with correct secret...');

// For test package, use current machine's ID
// For production: Customer installs → sends you their Machine ID → you generate license
const getMachineId = () => {
    const networkInterfaces = os.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                macs.push(iface.mac);
            }
        }
    }
    const combined = macs.join('-') + os.hostname();
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
};

const machineId = getMachineId();
console.log(`🆔 Machine ID: ${machineId}`);
const days = 7;
const now = Date.now();
const expiry = now + (days * 24 * 60 * 60 * 1000);

const licenseData = {
    username: customerName,
    machineId: machineId,
    expiry: expiry,
    created: now
};

// Encode
const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');

// Sign with CORRECT secret key
const signature = crypto
    .createHmac('sha256', secretKey)
    .update(encoded)
    .digest('hex');

const licenseKey = `${encoded}.${signature}`;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔑 LICENSE KEY GENERATED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📋 License Information:`);
console.log(`   Username: ${customerName}`);
console.log(`   Type: ${days} days`);
console.log(`   Machine Binding: YES`);
console.log(`   Machine ID: ${machineId}`);
console.log(`   Created: ${new Date(now).toLocaleString()}`);
console.log(`   Expires: ${new Date(expiry).toLocaleString()}\n`);
console.log('🔐 LICENSE KEY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(licenseKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Save license key to package
const licenseKeyContent = `
License Key Record
==================
Generated: ${new Date().toLocaleString()}
Username: ${customerName}
Type: ${days} days
Machine Binding: YES
Machine ID: ${machineId}

License Key:
${licenseKey}
`;

fs.writeFileSync(path.join(outputDir, 'LICENSE_KEY.txt'), licenseKeyContent, 'utf8');
console.log(`✅ License saved: ${path.join(outputDir, 'LICENSE_KEY.txt')}`);

// Remove sensitive files
console.log('\n🗑️  Removing sensitive files...');
const filesToRemove = [
    'tools/generate-license.js',
    'tools/obfuscate-license.js',
    'tools/obfuscate-all.js',
    'tools/activate-license.js',
    'license-records',
    'customer-packages',
    'backups',
    '.license',
    '.git',
    '.gitignore',
    'exclude-list.txt'
];

filesToRemove.forEach(item => {
    const itemPath = path.join(outputDir, item);
    if (fs.existsSync(itemPath)) {
        try {
            fs.rmSync(itemPath, { recursive: true, force: true });
        } catch (err) { }
    }
});

// Remove all .bat and .md files
const allFiles = fs.readdirSync(outputDir);
allFiles.forEach(file => {
    if (file.endsWith('.bat') || file.endsWith('.md') || file.endsWith('.txt')) {
        try {
            fs.unlinkSync(path.join(outputDir, file));
        } catch (err) { }
    }
});

console.log('✅ Sensitive files removed');

// Create README
const readme = `========================================
HIDEMIUM MULTI-TOOL - TEST VERSION
========================================

Customer: ${customerName}
License: Trial 7 days

INSTALLATION:
  1. Install Node.js (if not installed)
  2. Run: npm install
  3. Run: npm run dashboard

ACTIVATION:
  1. Open dashboard: http://localhost:3000
  2. Click "License" button in header
  3. Paste your license key from LICENSE_KEY.txt
  4. Click "Activate License"

Your license key is in: LICENSE_KEY.txt

This is a TEST package for 7 days trial.

========================================
`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readme, 'utf8');
console.log('✅ README created');

// Save secret key info
const secretKeyInfo = `TEST PACKAGE INFO
=================
Customer: ${customerName}
Secret Key: ${secretKey}
License Type: Trial 7 days
Created: ${new Date().toLocaleString()}
Machine Binding: Yes
Machine ID: ${machineId}
Status: Test Package - NO OBFUSCATION
`;

fs.writeFileSync(
    path.join('customer-packages', `${customerName}_SECRET_KEY.txt`),
    secretKeyInfo,
    'utf8'
);

// Create START script
const startScript = `@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 STARTING TEST DASHBOARD
echo ========================================
echo.

if not exist "node_modules" (
    echo 📥 Installing dependencies...
    call npm install
    echo.
)

echo 🌐 Starting dashboard...
echo 📝 Dashboard: http://localhost:3000
echo 🔑 License key: See LICENSE_KEY.txt
echo.
echo Press Ctrl+C to stop
echo.

call npm run dashboard
`;

fs.writeFileSync(path.join(outputDir, 'START.bat'), startScript, 'utf8');

console.log('\n========================================');
console.log('✅ TEST PACKAGE COMPLETED!');
console.log('========================================\n');
console.log(`📦 Package: ${outputDir}`);
console.log(`🔐 Secret: ${secretKey}`);
console.log(`🔑 License: See LICENSE_KEY.txt`);
console.log(`⚠️  Code: NOT obfuscated (for testing)\n`);
console.log('┌────────────────────────────────────────────┐');
console.log('│  SECRET KEY (SAVE THIS!)                   │');
console.log(`│  ${secretKey.padEnd(42)} │`);
console.log('└────────────────────────────────────────────┘\n');
console.log(`📝 Secret saved: customer-packages/${customerName}_SECRET_KEY.txt\n`);
console.log('🧪 TO TEST:');
console.log(`   cd ${outputDir}`);
console.log('   npm install');
console.log('   npm run dashboard');
console.log('   OR run: START.bat\n');
console.log('✅ License key matches secret key - will work!\n');
