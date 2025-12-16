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
    console.log('❌ Usage: node restore-machine-id.js <customerName>');
    console.log('   Example: node restore-machine-id.js anhVu');
    process.exit(1);
}

const customerPath = path.join(__dirname, 'customer-packages', customerName);
const machineIdFile = path.join(customerPath, '.machine-id');

console.log(`📦 Restoring Machine ID for customer: ${customerName}`);
console.log(`   Customer Path: ${customerPath}`);

try {
    // 1. Đọc MachineID cũ
    if (!fs.existsSync(machineIdFile)) {
        console.log('❌ No preserved Machine ID found');
        console.log(`   Expected file: ${machineIdFile}`);
        console.log('\n📝 Steps to preserve Machine ID:');
        console.log(`   1. Run: node preserve-machine-id.js ${customerName}`);
        console.log(`   2. Then upgrade the package`);
        console.log(`   3. Then run: node restore-machine-id.js ${customerName}`);
        process.exit(1);
    }

    const oldMachineId = fs.readFileSync(machineIdFile, 'utf8').trim();
    console.log(`✅ Found preserved Machine ID: ${oldMachineId}`);

    // 2. Kiểm tra license-manager
    const licenseManagerPath = path.join(customerPath, 'core', 'license-manager.js');
    if (!fs.existsSync(licenseManagerPath)) {
        console.log(`❌ License manager not found: ${licenseManagerPath}`);
        process.exit(1);
    }

    // 3. Load license manager
    delete require.cache[require.resolve(licenseManagerPath)];
    const LicenseManager = require(licenseManagerPath);
    const licenseManager = new LicenseManager();

    // 4. Tạo license mới với MachineID cũ
    console.log('\n🔑 Generating new license with old Machine ID...');
    const licenseKey = licenseManager.generateKey({
        expiryDays: 30,
        machineId: oldMachineId, // Sử dụng MachineID cũ
        username: customerName
    });

    // 5. Lưu license
    licenseManager.saveLicense(licenseKey);
    console.log('✅ License saved');

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
    console.log('✅ Cleaned up temporary files');

    console.log(`\n✅ Machine ID restored successfully!`);
    console.log(`   Old Machine ID: ${oldMachineId}`);
    console.log(`   New License: ${licenseKey.substring(0, 50)}...`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Send the upgraded package to customer`);
    console.log(`   2. Customer can use the old license key immediately`);
    console.log(`   3. No need to re-activate!`);

} catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error.stack);
    process.exit(1);
}
