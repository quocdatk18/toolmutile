/**
 * Test script để kiểm tra license validation cho customer package
 */

const LicenseManager = require('./core/license-manager');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing License Validation for Customer Package');
console.log('='.repeat(50));

const licenseManager = new LicenseManager();

// Test 1: Check if this is admin version
console.log('\n1️⃣ Testing Admin Version Detection:');
const isAdmin = licenseManager.isAdminVersion();
console.log(`   Is Admin Version: ${isAdmin}`);

// Check for customer marker
const customerFile = path.join(__dirname, '.customer');
const hasCustomerMarker = fs.existsSync(customerFile);
console.log(`   Has Customer Marker (.customer): ${hasCustomerMarker}`);

// Check for admin.html
const adminFile = path.join(__dirname, 'dashboard', 'admin.html');
const hasAdminFile = fs.existsSync(adminFile);
console.log(`   Has Admin File (admin.html): ${hasAdminFile}`);

// Test 2: Get Machine ID
console.log('\n2️⃣ Testing Machine ID:');
const machineId = licenseManager.getMachineId();
console.log(`   Machine ID: ${machineId}`);

// Test 3: Check current license
console.log('\n3️⃣ Testing Current License:');
const licenseCheck = licenseManager.checkLicense();
console.log(`   Valid: ${licenseCheck.valid}`);
console.log(`   Message: ${licenseCheck.message}`);
if (licenseCheck.isMaster) {
    console.log(`   🔑 Master Version Detected`);
}
if (licenseCheck.needActivation) {
    console.log(`   ⚠️  Need Activation`);
}

// Test 4: Check license file
console.log('\n4️⃣ Testing License File:');
const licenseFile = path.join(__dirname, '.license');
const hasLicenseFile = fs.existsSync(licenseFile);
console.log(`   Has License File (.license): ${hasLicenseFile}`);

if (hasLicenseFile) {
    try {
        const licenseContent = fs.readFileSync(licenseFile, 'utf8');
        console.log(`   License Content Length: ${licenseContent.length} chars`);
        console.log(`   License Preview: ${licenseContent.substring(0, 50)}...`);
    } catch (error) {
        console.log(`   ❌ Error reading license file: ${error.message}`);
    }
}

// Test 5: Generate test license key
console.log('\n5️⃣ Testing License Key Generation:');
try {
    const testKey = licenseManager.generateKey({
        expiryDays: 30,
        machineId: null, // Unbound key
        username: 'TestCustomer'
    });
    console.log(`   Generated Test Key: ${testKey.substring(0, 50)}...`);

    // Test validation
    const validation = licenseManager.validateKey(testKey);
    console.log(`   Test Key Valid: ${validation.valid}`);
    console.log(`   Test Key Message: ${validation.message}`);
} catch (error) {
    console.log(`   ❌ Error generating test key: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 Test Complete');

// Recommendations
console.log('\n💡 Recommendations:');
if (isAdmin) {
    console.log('   ⚠️  This appears to be ADMIN version - license not required');
} else {
    console.log('   ✅ This is CUSTOMER version - license required');
    if (!hasLicenseFile) {
        console.log('   📝 Customer needs to activate license first');
        console.log('   📋 Steps:');
        console.log('      1. Get Machine ID: ' + machineId);
        console.log('      2. Send Machine ID to admin');
        console.log('      3. Receive license key from admin');
        console.log('      4. Activate license in dashboard');
    }
}