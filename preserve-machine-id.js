/**
 * Preserve Machine ID khi nâng cấp package
 * Đọc MachineID cũ từ license hiện tại và lưu vào file cấu hình
 * 
 * Usage: node preserve-machine-id.js <customerName>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const customerName = process.argv[2];

if (!customerName) {
    process.exit(1);
}

const customerPath = path.join(__dirname, 'customer-packages', customerName);
const licenseFile = path.join(customerPath, '.license');
const machineIdFile = path.join(customerPath, '.machine-id');
const licenseKeyFile = path.join(customerPath, 'LICENSE_KEY.txt');

try {
    // 1. Đọc license cũ
    if (!fs.existsSync(licenseFile)) {
        process.exit(0);
    }

    const oldLicense = fs.readFileSync(licenseFile, 'utf8').trim();

    // 2. Parse license để lấy MachineID
    const parts = oldLicense.split('.');
    if (parts.length !== 2) {
        process.exit(1);
    }

    const [dataBase64] = parts;
    const dataString = Buffer.from(dataBase64, 'base64').toString('utf8');
    const licenseData = JSON.parse(dataString);

    if (!licenseData.machineId) {
        process.exit(0);
    }

    // 3. Lưu MachineID vào file
    fs.writeFileSync(machineIdFile, licenseData.machineId, 'utf8');

    // 4. Lưu thông tin vào LICENSE_KEY.txt
    if (fs.existsSync(licenseKeyFile)) {
        let content = fs.readFileSync(licenseKeyFile, 'utf8');
        content += '\n\n' + '='.repeat(50);
        content += '\nPRESERVED MACHINE ID (for upgrade):';
        content += '\n' + '='.repeat(50);
        content += '\n' + licenseData.machineId;
        content += '\n\nThis Machine ID will be used for the next upgrade.';
        fs.writeFileSync(licenseKeyFile, content, 'utf8');
    }

    console.log(`\n✅ Machine ID preserved successfully!`);

} catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(error.stack);
    process.exit(1);
}
