/**
 * Clean Sensitive Data from Package
 * Xóa tất cả thông tin nhạy cảm trước khi gửi cho khách hàng
 */

const fs = require('fs');
const path = require('path');

function cleanPackage(packagePath) {
    console.log(`\n🧹 Cleaning sensitive data in: ${packagePath}\n`);

    // 1. Clean settings.json
    const settingsPath = path.join(packagePath, 'config', 'settings.json');
    if (fs.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

            // Clear API key
            if (settings.apiKey) {
                settings.apiKey.key = '';
                settings.apiKey.balance = 0;
            }

            // Clear extensions
            if (settings.extensions) {
                Object.keys(settings.extensions).forEach(key => {
                    settings.extensions[key] = '';
                });
            }

            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            console.log('✅ Cleaned: config/settings.json');
        } catch (err) {
            console.log('⚠️  Could not clean settings.json:', err.message);
        }
    }

    // 2. Clean .env file
    const envPath = path.join(packagePath, '.env');
    if (fs.existsSync(envPath)) {
        const cleanEnv = `# Environment Configuration
# Khách hàng cần cấu hình các biến môi trường tại đây

# API Keys (nếu cần)
# CAPTCHA_API_KEY=
# SIM_API_KEY=
# HIDEMIUM_API_KEY=
`;
        fs.writeFileSync(envPath, cleanEnv, 'utf8');
        console.log('✅ Cleaned: .env');
    }

    // 3. Remove screenshots folder (nếu có)
    const screenshotsPath = path.join(packagePath, 'screenshots');
    if (fs.existsSync(screenshotsPath)) {
        fs.rmSync(screenshotsPath, { recursive: true, force: true });
        console.log('✅ Removed: screenshots/');
    }

    // 4. Remove license records
    const licenseRecordsPath = path.join(packagePath, 'license-records');
    if (fs.existsSync(licenseRecordsPath)) {
        fs.rmSync(licenseRecordsPath, { recursive: true, force: true });
        console.log('✅ Removed: license-records/');
    }

    // 5. Remove .license file (nếu có)
    const licenseFilePath = path.join(packagePath, '.license');
    if (fs.existsSync(licenseFilePath)) {
        fs.unlinkSync(licenseFilePath);
        console.log('✅ Removed: .license');
    }

    // 6. Check for any remaining sensitive files
    const sensitivePatterns = [
        /api[_-]?key/i,
        /token/i,
        /secret/i,
        /password/i,
        /captcha.*key/i
    ];

    function scanDirectory(dir, level = 0) {
        if (level > 3) return; // Limit depth

        try {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!['node_modules', '.git'].includes(item)) {
                        scanDirectory(fullPath, level + 1);
                    }
                } else if (stat.isFile()) {
                    // Check filename
                    if (sensitivePatterns.some(pattern => pattern.test(item))) {
                        console.log(`⚠️  Found sensitive file: ${path.relative(packagePath, fullPath)}`);
                    }
                }
            });
        } catch (err) {
            // Ignore errors
        }
    }

    console.log('\n🔍 Scanning for sensitive files...');
    scanDirectory(packagePath);

    console.log('\n✅ Cleaning completed!\n');
}

// If run directly
if (require.main === module) {
    const packagePath = process.argv[2] || 'customer-packages/test_final';

    if (!fs.existsSync(packagePath)) {
        console.log(`❌ Package not found: ${packagePath}`);
        process.exit(1);
    }

    cleanPackage(packagePath);
}

module.exports = { cleanPackage };
