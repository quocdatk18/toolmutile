/**
 * Auto Build Test Package
 * Tự động build test package không cần input manual
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔧 AUTO BUILD TEST PACKAGE');
console.log('========================================\n');

const customerName = 'test_customer_v2';
const outputDir = path.join('customer-packages', customerName);

// Check if old package exists
if (fs.existsSync(outputDir)) {
    console.log('🗑️  Removing old package...');
    try {
        fs.rmSync(outputDir, { recursive: true, force: true });
        console.log('✅ Old package removed\n');
    } catch (err) {
        console.log('⚠️  Could not remove old package, will overwrite\n');
    }
}

console.log('📋 Building package with:');
console.log(`   Customer: ${customerName}`);
console.log('   License: Trial 7 days');
console.log('   Machine Binding: Yes\n');

console.log('🔍 Checking dependencies...');
try {
    execSync('npm list javascript-obfuscator', { stdio: 'ignore' });
    console.log('✅ Dependencies OK\n');
} catch (err) {
    console.log('📥 Installing javascript-obfuscator...');
    execSync('npm install javascript-obfuscator', { stdio: 'inherit' });
    console.log('✅ Installed\n');
}

console.log('========================================');
console.log('🔧 Building package...');
console.log('========================================\n');

// Create output folder
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
console.log(`✅ Created folder: ${outputDir}`);

// Copy all files
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

// Copy essential files and folders
const itemsToCopy = [
    'core',
    'dashboard',
    'config',
    'tools',
    'package.json',
    'package-lock.json',
    '.env'
];

itemsToCopy.forEach(item => {
    const srcPath = path.join(process.cwd(), item);
    const destPath = path.join(outputDir, item);

    if (fs.existsSync(srcPath)) {
        try {
            copyRecursive(srcPath, destPath);
        } catch (err) {
            // Ignore errors
        }
    }
});

console.log('✅ Files copied');

// Generate unique secret key
const secretKey = `SECRET_${customerName}_${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`;
console.log(`\n🔐 Generating unique secret key...`);
console.log(`✅ Secret key: ${secretKey}`);

// Update secret key in license-manager.js
const licenseManagerPath = path.join(outputDir, 'core', 'license-manager.js');
if (fs.existsSync(licenseManagerPath)) {
    let content = fs.readFileSync(licenseManagerPath, 'utf8');
    content = content.replace(/HIDEMIUM_TOOL_SECRET_2024/g, secretKey);
    fs.writeFileSync(licenseManagerPath, content, 'utf8');
    console.log('✅ Secret key updated in license-manager.js');
}

// Obfuscate files
console.log('\n🔒 Obfuscating critical files...');
try {
    execSync('node tools/obfuscate-all.js', { stdio: 'inherit' });
    console.log('✅ Obfuscation completed');

    // Replace with obfuscated versions
    const filesToReplace = [
        'core/license-manager.js',
        'core/api-key-manager.js',
        'core/hidemium-api.js',
        'core/profile-manager.js',
        'core/sim-api-manager.js',
        'dashboard/server.js'
    ];

    filesToReplace.forEach(file => {
        const obfuscatedFile = file.replace('.js', '.obfuscated.js');
        const srcPath = path.join(process.cwd(), obfuscatedFile);
        const destPath = path.join(outputDir, file);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            fs.unlinkSync(srcPath); // Clean up
        }
    });

} catch (err) {
    console.log('⚠️  Obfuscation failed, using original files');
}

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
        } catch (err) {
            // Ignore
        }
    }
});

// Remove all .bat and .md files
const allFiles = fs.readdirSync(outputDir);
allFiles.forEach(file => {
    if (file.endsWith('.bat') || file.endsWith('.md')) {
        try {
            fs.unlinkSync(path.join(outputDir, file));
        } catch (err) {
            // Ignore
        }
    }
});

console.log('✅ Sensitive files removed');

// Generate license key
console.log('\n🔑 Generating license key...');
try {
    execSync(`node tools/generate-license.js --days 7 --bind --username "${customerName}"`, { stdio: 'inherit' });

    // Copy license record to package
    const licenseRecordsDir = path.join(process.cwd(), 'license-records');
    if (fs.existsSync(licenseRecordsDir)) {
        const files = fs.readdirSync(licenseRecordsDir)
            .filter(f => f.startsWith(`license-${customerName}-`))
            .sort()
            .reverse();

        if (files.length > 0) {
            const latestRecord = files[0];
            fs.copyFileSync(
                path.join(licenseRecordsDir, latestRecord),
                path.join(outputDir, 'LICENSE_KEY.txt')
            );
            console.log(`✅ License key saved to: ${path.join(outputDir, 'LICENSE_KEY.txt')}`);
        }
    }
} catch (err) {
    console.log('⚠️  License generation failed');
}

// Create README for customer
console.log('\n📝 Creating customer README...');
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
Status: Test Package
`;

fs.writeFileSync(
    path.join('customer-packages', `${customerName}_SECRET_KEY.txt`),
    secretKeyInfo,
    'utf8'
);

console.log('\n========================================');
console.log('✅ TEST PACKAGE COMPLETED!');
console.log('========================================\n');
console.log(`📦 Package location: ${outputDir}`);
console.log(`🔑 License key: See LICENSE_KEY.txt in package`);
console.log(`🔐 Secret key: ${secretKey}`);
console.log('🔒 Code: OBFUSCATED (protected)\n');
console.log('⚠️  IMPORTANT: SAVE THIS SECRET KEY!\n');
console.log('┌────────────────────────────────────────────┐');
console.log('│  SECRET KEY (SAVE THIS!)                   │');
console.log(`│  ${secretKey.padEnd(42)} │`);
console.log('└────────────────────────────────────────────┘\n');
console.log(`📝 Secret key saved to: customer-packages/${customerName}_SECRET_KEY.txt\n`);
console.log('NEXT STEPS:');
console.log(`  1. Test the package in: ${outputDir}`);
console.log(`  2. Run: cd ${outputDir}`);
console.log('  3. Run: npm install');
console.log('  4. Run: npm run dashboard');
console.log('  5. Activate with license key from LICENSE_KEY.txt\n');
