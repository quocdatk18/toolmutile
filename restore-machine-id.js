/**
 * Restore Machine ID sau khi nâng cấp package
 * Đọc MachineID cũ từ file cấu hình và sử dụng để tạo license mới
 * 
 * Usage: node restore-machine-id.js <customerName>
 */

const fs = require('fs');
const path = require('path');

const customerName = process.argv[2];

if (!customerName) {
    process.exit(1);
}

const customerPath = path.join(__dirname, 'customer-packages', customerName);
const machineIdFile = path.join(customerPath, '.machine-id');

try {
    // 1. Đọc MachineID cũ
    if (!fs.existsSync(machineIdFile)) {
        process.exit(1);
    }

    const oldMachineId = fs.readFileSync(machineIdFile, 'utf8').trim();

    // 2. Kiểm tra license-manager
    const licenseManagerPath = path.join(customerPath, 'core', 'license-manager.js');
    if (!fs.existsSync(licenseManagerPath)) {
        process.exit(1);
    }

    // 3. Load license manager
    delete require.cache[require.resolve(licenseManagerPath)];
    const LicenseManager = require(licenseManagerPath);
    const licenseManager = new LicenseManager();

    // 4. Tạo license mới với MachineID cũ
    const licenseKey = licenseManager.generateKey({
        expiryDays: 30,
        machineId: oldMachineId, // Sử dụng MachineID cũ
        username: customerName
    });

    // 5. Lưu license
    licenseManager.saveLicense(licenseKey);

    // 6. Cập nhật LICENSE_KEY.txt
    const licenseKeyFile = path.join(customerPath, 'LICENSE_KEY.txt');
    if (fs.existsSync(licenseKeyFile)) {
        let content = fs.readFileSync(licenseKeyFile, 'utf8');
        content += '\n\n' + '='.repeat(50);
        content += '\nRESTORED LICENSE KEY (After Upgrade):';
        content += '\n' + '='.repeat(50);
        content += '\n' + licenseKey;
        content += '\n\nThis license uses the old Machine ID and should work immediately.';
        fs.writeFileSync(licenseKeyFile, content, 'utf8');
    }

    // 7. Xóa file .machine-id (đã sử dụng xong)
    fs.unlinkSync(machineIdFile);

    console.log(`\n✅ Machine ID restored successfully!`);

} catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error.stack);
    process.exit(1);
}
