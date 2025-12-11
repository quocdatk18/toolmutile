/**
 * License Activation Tool
 * Tool để activate license key
 * 
 * Usage:
 *   node tools/activate-license.js YOUR_LICENSE_KEY_HERE
 */

const LicenseManager = require('../core/license-manager');

const key = process.argv[2];

if (!key) {
    console.log('\n❌ Error: No license key provided\n');
    console.log('Usage:');
    console.log('   node tools/activate-license.js YOUR_LICENSE_KEY_HERE\n');
    process.exit(1);
}

const licenseManager = new LicenseManager();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 LICENSE ACTIVATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔍 Validating license key...\n');

const result = licenseManager.activate(key);

if (result.valid) {
    console.log('✅ LICENSE ACTIVATED SUCCESSFULLY!\n');
    console.log('📋 License Information:');
    console.log('   Username:', result.data.username);
    console.log('   Type:', result.data.isLifetime ? 'LIFETIME' : `${result.data.remainingDays} days remaining`);
    console.log('   Machine ID:', licenseManager.getMachineId());
    if (!result.data.isLifetime) {
        console.log('   Expires:', new Date(result.data.expiry).toLocaleString('vi-VN'));
    }
    console.log('\n🎉 You can now use the tool!\n');
} else {
    console.log('❌ LICENSE ACTIVATION FAILED!\n');
    console.log('Error:', result.message);
    console.log('\n📞 Please contact support if you believe this is an error.\n');
    process.exit(1);
}
