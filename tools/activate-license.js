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
    process.exit(1);
}

const licenseManager = new LicenseManager();

const result = licenseManager.activate(key);

if (result.valid) {
    console.log('✅ LICENSE ACTIVATED SUCCESSFULLY!\n');
    if (!result.data.isLifetime) {
    }
} else {
    console.log('❌ LICENSE ACTIVATION FAILED!\n');
    console.log('Error:', result.message);
    console.log('\n📞 Please contact support if you believe this is an error.\n');
    process.exit(1);
}
